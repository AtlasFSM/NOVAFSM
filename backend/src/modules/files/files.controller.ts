import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { PresignDownloadDto } from './dto/presign-download.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('files')
@Controller('files')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign-upload')
  @ApiOperation({ summary: 'Get presigned URL for file upload' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async presignUpload(@CurrentUser() user: CurrentUserPayload, @Body() dto: PresignUploadDto) {
    return this.filesService.presignUpload(
      user.tenantId,
      dto.entity,
      dto.entityId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Get('presign-download')
  @ApiOperation({ summary: 'Get presigned URL for file download' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or access denied' })
  @ApiQuery({ name: 'key', required: true, type: String })
  async presignDownload(@CurrentUser() user: CurrentUserPayload, @Query('key') key: string) {
    return this.filesService.presignDownload(user.tenantId, key);
  }

  @Get()
  @ApiOperation({ summary: 'List files for an entity' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  @ApiQuery({ name: 'entity', required: true, type: String })
  @ApiQuery({ name: 'entityId', required: true, type: String })
  async listFiles(
    @CurrentUser() user: CurrentUserPayload,
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
  ) {
    return this.filesService.listFiles(user.tenantId, entity, entityId);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or access denied' })
  @ApiQuery({ name: 'key', required: true, type: String })
  async deleteFile(@CurrentUser() user: CurrentUserPayload, @Query('key') key: string) {
    return this.filesService.deleteFile(user.tenantId, key);
  }
}
