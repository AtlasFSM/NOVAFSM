import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  UploadDocumentDto,
  GetPresignedUrlDto,
  CreateDocumentVersionDto,
} from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { createHash } from 'crypto';

@Injectable()
export class DocumentsService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get('S3_BUCKET') || 'novafsm-documents';

    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || 'minioadmin',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || 'minioadmin',
      },
      endpoint: this.configService.get('S3_ENDPOINT') || 'http://localhost:9000',
      forcePathStyle: true, // Required for MinIO
    });
  }

  async getPresignedUploadUrl(tenantId: string, dto: GetPresignedUrlDto) {
    const timestamp = Date.now();
    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `${tenantId}/uploads/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: dto.mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      success: true,
      data: {
        uploadUrl,
        s3Key,
        bucket: this.bucketName,
        expiresIn: 3600,
      },
    };
  }

  async create(tenantId: string, dto: UploadDocumentDto, s3Key: string) {
    // Generate checksum
    const checksum = this.generateChecksum(s3Key);

    // Build entity relationship data
    const entityData: any = {};
    if (dto.entityType && dto.entityId) {
      entityData.entityType = dto.entityType;
      entityData.entityId = dto.entityId;

      // Set specific relationship fields
      switch (dto.entityType) {
        case 'CUSTOMER':
          entityData.customerId = dto.entityId;
          break;
        case 'SITE':
          entityData.siteId = dto.entityId;
          break;
        case 'JOB':
          entityData.jobId = dto.entityId;
          break;
        case 'QUOTE':
          entityData.quoteId = dto.entityId;
          break;
        case 'INVOICE':
          entityData.invoiceId = dto.entityId;
          break;
        case 'ASSET':
          entityData.assetId = dto.entityId;
          break;
      }
    }

    const document = await this.prisma.document.create({
      data: {
        tenantId,
        fileName: s3Key.split('/').pop() || dto.originalName,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        size: dto.size,
        s3Key,
        s3Bucket: this.bucketName,
        virtualPath: dto.virtualPath,
        tags: dto.tags || [],
        description: dto.description,
        isPublic: dto.isPublic || false,
        checksum,
        ...entityData,
      },
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        job: { select: { id: true, number: true, title: true } },
        asset: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      data: document,
    };
  }

  async findAll(tenantId: string, filters?: any) {
    const where: any = { tenantId };

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.tags) {
      // Search in JSONB array
      where.tags = { array_contains: filters.tags };
    }

    if (filters?.search) {
      where.OR = [
        { fileName: { contains: filters.search, mode: 'insensitive' } },
        { originalName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        job: { select: { id: true, number: true, title: true } },
        asset: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: documents,
      meta: {
        total: documents.length,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        job: { select: { id: true, number: true } },
        asset: { select: { id: true, name: true } },
        parent: { select: { id: true, fileName: true, version: true } },
        versions: {
          select: {
            id: true,
            fileName: true,
            version: true,
            createdAt: true,
            size: true,
          },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      success: true,
      data: document,
    };
  }

  async getDownloadUrl(tenantId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const command = new GetObjectCommand({
      Bucket: document.s3Bucket,
      Key: document.s3Key,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      success: true,
      data: {
        downloadUrl,
        fileName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        expiresIn: 3600,
      },
    };
  }

  async update(tenantId: string, id: string, dto: UpdateDocumentDto) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.virtualPath !== undefined && { virtualPath: dto.virtualPath }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        job: { select: { id: true, number: true } },
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async remove(tenantId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from S3
    try {
      const command = new DeleteObjectCommand({
        Bucket: document.s3Bucket,
        Key: document.s3Key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting from S3:', error);
      // Continue with database deletion even if S3 delete fails
    }

    // Delete from database
    await this.prisma.document.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  async createVersion(tenantId: string, dto: CreateDocumentVersionDto, s3Key: string) {
    const parent = await this.prisma.document.findFirst({
      where: { id: dto.parentId, tenantId },
    });

    if (!parent) {
      throw new NotFoundException('Parent document not found');
    }

    const checksum = this.generateChecksum(s3Key);

    const newVersion = await this.prisma.document.create({
      data: {
        tenantId,
        fileName: s3Key.split('/').pop() || dto.fileName,
        originalName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
        s3Key,
        s3Bucket: this.bucketName,
        version: parent.version + 1,
        parentId: parent.id,
        virtualPath: parent.virtualPath,
        tags: parent.tags,
        entityType: parent.entityType,
        entityId: parent.entityId,
        customerId: parent.customerId,
        siteId: parent.siteId,
        jobId: parent.jobId,
        assetId: parent.assetId,
        description: dto.notes || parent.description,
        isPublic: parent.isPublic,
        checksum,
      },
    });

    return {
      success: true,
      data: newVersion,
      message: `Version ${newVersion.version} created successfully`,
    };
  }

  private generateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
