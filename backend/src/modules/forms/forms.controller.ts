import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { SubmitFormResponseDto, AssignFormDto } from './dto/submit-form-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // Templates
  @Post('templates')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Create form template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(@Request() req, @Body() dto: CreateFormTemplateDto) {
    return this.formsService.createTemplate(req.user.tenantId, dto);
  }

  @Get('templates')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get all templates' })
  async getTemplates(@Request() req, @Query() query: any) {
    return this.formsService.getTemplates(req.user.tenantId, query);
  }

  @Get('templates/:id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get template by ID' })
  async getTemplate(@Request() req, @Param('id') id: string) {
    return this.formsService.getTemplate(req.user.tenantId, id);
  }

  @Put('templates/:id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Update template' })
  async updateTemplate(@Request() req, @Param('id') id: string, @Body() dto: Partial<CreateFormTemplateDto>) {
    return this.formsService.updateTemplate(req.user.tenantId, id, dto);
  }

  @Post('templates/:id/publish')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Publish template' })
  async publishTemplate(@Request() req, @Param('id') id: string) {
    return this.formsService.publishTemplate(req.user.tenantId, id);
  }

  // Assignments
  @Post('assignments')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Assign form to job/site/asset' })
  async assignForm(@Request() req, @Body() dto: AssignFormDto) {
    return this.formsService.assignForm(req.user.tenantId, dto);
  }

  @Get('assignments')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get assignments' })
  async getAssignments(@Request() req, @Query() query: any) {
    return this.formsService.getAssignments(req.user.tenantId, query);
  }

  // Responses
  @Post('responses')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Submit form response' })
  async submitResponse(@Request() req, @Body() dto: SubmitFormResponseDto) {
    return this.formsService.submitResponse(req.user.tenantId, req.user.userId, dto);
  }

  @Get('responses')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get responses' })
  async getResponses(@Request() req, @Query() query: any) {
    return this.formsService.getResponses(req.user.tenantId, query);
  }

  @Get('responses/:id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get response by ID' })
  async getResponse(@Request() req, @Param('id') id: string) {
    return this.formsService.getResponse(req.user.tenantId, id);
  }
}
