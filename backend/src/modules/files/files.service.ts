import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Files Service - Manages file storage with S3/MinIO
 */
@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const endpoint = this.configService.get<string>('s3.endpoint');
    const region = this.configService.get<string>('s3.region', 'us-east-1');
    const accessKeyId = this.configService.get<string>('s3.accessKeyId');
    const secretAccessKey = this.configService.get<string>('s3.secretAccessKey');
    const forcePathStyle = this.configService.get<boolean>('s3.forcePathStyle', false);

    this.bucket = this.configService.get<string>('s3.bucket', 'novafsm-files');

    // Configure S3 client (supports both AWS S3 and MinIO)
    const clientConfig: any = {
      region,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey,
      } : undefined,
      forcePathStyle,
    };

    // If endpoint is specified, use it (for MinIO or LocalStack)
    if (endpoint) {
      clientConfig.endpoint = endpoint;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  /**
   * Generate presigned URL for upload
   * Path format: tenant/{tenantId}/{entity}/{entityId}/{uuid}-{fileName}
   */
  async presignUpload(
    tenantId: string,
    entity: string,
    entityId: string,
    fileName: string,
    contentType: string,
  ) {
    // Sanitize fileName
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileUuid = uuidv4();
    const key = `tenant/${tenantId}/${entity}/${entityId}/${fileUuid}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL valid for 15 minutes
    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

    return {
      success: true,
      data: {
        url,
        key,
        bucket: this.bucket,
        expiresIn: 900,
      },
    };
  }

  /**
   * Generate presigned URL for download
   */
  async presignDownload(tenantId: string, key: string) {
    // Verify the key belongs to the tenant
    if (!key.startsWith(`tenant/${tenantId}/`)) {
      throw new BadRequestException('Access denied to this file');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // Generate presigned URL valid for 1 hour
    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      success: true,
      data: {
        url,
        expiresIn: 3600,
      },
    };
  }

  /**
   * List files for an entity
   */
  async listFiles(tenantId: string, entity: string, entityId: string) {
    const prefix = `tenant/${tenantId}/${entity}/${entityId}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    try {
      const response = await this.s3Client.send(command);

      const files = (response.Contents || []).map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        fileName: item.Key?.split('/').pop() || '',
      }));

      return {
        success: true,
        data: files,
      };
    } catch (error) {
      // If bucket doesn't exist or no files, return empty array
      return {
        success: true,
        data: [],
      };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(tenantId: string, key: string) {
    // Verify the key belongs to the tenant
    if (!key.startsWith(`tenant/${tenantId}/`)) {
      throw new BadRequestException('Access denied to this file');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
}
