import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, GetPresignedUrlDto, CreateDocumentVersionDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('presigned-url')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get presigned URL for document upload' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  async getPresignedUrl(@Request() req: any, @Body() dto: GetPresignedUrlDto) {
    return this.documentsService.getPresignedUploadUrl(req.user.tenantId, dto);
  }

  @Post()
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Create document record after S3 upload' })
  @ApiResponse({ status: 201, description: 'Document record created' })
  async create(@Request() req: any, @Body() body: UploadDocumentDto & { s3Key: string }) {
    const { s3Key, ...dto } = body;
    return this.documentsService.create(req.user.tenantId, dto, s3Key);
  }

  @Get()
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER')
  @ApiOperation({ summary: 'Get all documents' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'tags', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async findAll(@Request() req: any, @Query() query: any) {
    return this.documentsService.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.documentsService.findOne(req.user.tenantId, id);
  }

  @Get(':id/download-url')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER')
  @ApiOperation({ summary: 'Get presigned download URL' })
  @ApiResponse({ status: 200, description: 'Download URL generated' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDownloadUrl(@Request() req: any, @Param('id') id: string) {
    return this.documentsService.getDownloadUrl(req.user.tenantId, id);
  }

  @Put(':id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.documentsService.remove(req.user.tenantId, id);
  }

  @Post('versions')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Create new document version' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  @ApiResponse({ status: 404, description: 'Parent document not found' })
  async createVersion(@Request() req: any, @Body() body: CreateDocumentVersionDto & { s3Key: string }) {
    const { s3Key, ...dto } = body;
    return this.documentsService.createVersion(req.user.tenantId, dto, s3Key);
  }
}
