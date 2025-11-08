import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { SubmitFormResponseDto, AssignFormDto } from './dto/submit-form-response.dto';

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  // Templates
  async createTemplate(tenantId: string, dto: CreateFormTemplateDto) {
    const template = await this.prisma.formTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        fields: dto.fields,
        settings: dto.settings || {},
      },
    });

    return { success: true, data: template };
  }

  async getTemplates(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive === 'true';

    const templates = await this.prisma.formTemplate.findMany({
      where,
      include: {
        _count: { select: { assignments: true, responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: templates };
  }

  async getTemplate(tenantId: string, id: string) {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id, tenantId },
      include: {
        assignments: {
          include: { response: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!template) throw new NotFoundException('Template not found');
    return { success: true, data: template };
  }

  async updateTemplate(tenantId: string, id: string, dto: Partial<CreateFormTemplateDto>) {
    await this.getTemplate(tenantId, id);

    const updated = await this.prisma.formTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.fields && { fields: dto.fields }),
        ...(dto.settings && { settings: dto.settings }),
      },
    });

    return { success: true, data: updated };
  }

  async publishTemplate(tenantId: string, id: string) {
    await this.getTemplate(tenantId, id);

    const updated = await this.prisma.formTemplate.update({
      where: { id },
      data: { isPublished: true },
    });

    return { success: true, data: updated, message: 'Template published' };
  }

  // Assignments
  async assignForm(tenantId: string, dto: AssignFormDto) {
    const assignment = await this.prisma.formAssignment.create({
      data: {
        tenantId,
        templateId: dto.templateId,
        assignedType: dto.assignedType,
        assignedToId: dto.assignedToId,
        jobId: dto.jobId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: { template: true },
    });

    return { success: true, data: assignment };
  }

  async getAssignments(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.jobId) where.jobId = filters.jobId;

    const assignments = await this.prisma.formAssignment.findMany({
      where,
      include: {
        template: { select: { id: true, name: true, category: true } },
        response: { select: { id: true, status: true, submittedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: assignments };
  }

  // Responses
  async submitResponse(tenantId: string, userId: string, dto: SubmitFormResponseDto) {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: dto.templateId, tenantId },
    });

    if (!template) throw new NotFoundException('Template not found');

    const response = await this.prisma.formResponse.create({
      data: {
        tenantId,
        templateId: dto.templateId,
        assignmentId: dto.assignmentId,
        responses: dto.responses,
        submittedById: userId,
        submittedAt: new Date(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceInfo: dto.deviceInfo,
        status: 'SUBMITTED',
      },
    });

    // Update assignment if linked
    if (dto.assignmentId) {
      await this.prisma.formAssignment.update({
        where: { id: dto.assignmentId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    return { success: true, data: response, message: 'Form submitted successfully' };
  }

  async getResponses(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    if (filters?.templateId) where.templateId = filters.templateId;
    if (filters?.status) where.status = filters.status;

    const responses = await this.prisma.formResponse.findMany({
      where,
      include: {
        template: { select: { id: true, name: true, category: true } },
        assignment: { select: { id: true, jobId: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return { success: true, data: responses };
  }

  async getResponse(tenantId: string, id: string) {
    const response = await this.prisma.formResponse.findFirst({
      where: { id, tenantId },
      include: {
        template: true,
        assignment: { include: { job: true } },
      },
    });

    if (!response) throw new NotFoundException('Response not found');
    return { success: true, data: response };
  }
}
