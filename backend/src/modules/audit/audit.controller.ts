import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('audit')
@Controller('audit-logs')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all audit logs (admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async findAll(@Query() dto: QueryAuditDto) {
    return this.auditService.findAll(dto);
  }

  @Get('entity')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async findByEntity(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.auditService.findByEntity(entity, entityId, skip, take);
  }
}
