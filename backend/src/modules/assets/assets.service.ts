import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, AssetStatus } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssignAssetDto, UnassignAssetDto, MaintenanceLogDto } from './dto/assign-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAssetDto) {
    const asset = await this.prisma.asset.create({
      data: {
        tenantId,
        category: dto.category,
        status: AssetStatus.AVAILABLE,
        name: dto.name,
        serialNumber: dto.serialNumber,
        model: dto.model,
        vendor: dto.vendor,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchaseCost: dto.purchaseCost,
        warrantyExpires: dto.warrantyExpires ? new Date(dto.warrantyExpires) : null,
        hourlyRate: dto.hourlyRate,
        dailyRate: dto.dailyRate,
        specifications: dto.specifications || {},
        qrCode: dto.qrCode,
        notes: dto.notes,
      },
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true, address: true } },
        job: { select: { id: true, number: true, title: true } },
      },
    });

    return {
      success: true,
      data: asset,
    };
  }

  async findAll(tenantId: string, filters?: any) {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.assignedToType) {
      where.assignedToType = filters.assignedToType;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const assets = await this.prisma.asset.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true, address: true } },
        job: { select: { id: true, number: true, title: true } },
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: assets,
      meta: {
        total: assets.length,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        site: { select: { id: true, name: true, address: true, city: true } },
        job: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return {
      success: true,
      data: asset,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateAssetDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        ...(dto.category && { category: dto.category }),
        ...(dto.status && { status: dto.status }),
        ...(dto.name && { name: dto.name }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.vendor !== undefined && { vendor: dto.vendor }),
        ...(dto.purchaseDate && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.purchaseCost !== undefined && { purchaseCost: dto.purchaseCost }),
        ...(dto.warrantyExpires && { warrantyExpires: new Date(dto.warrantyExpires) }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.dailyRate !== undefined && { dailyRate: dto.dailyRate }),
        ...(dto.specifications && { specifications: dto.specifications }),
        ...(dto.qrCode !== undefined && { qrCode: dto.qrCode }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        job: { select: { id: true, number: true, title: true } },
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async remove(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status === AssetStatus.IN_USE) {
      throw new BadRequestException('Cannot delete asset that is currently in use');
    }

    await this.prisma.asset.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Asset deleted successfully',
    };
  }

  async assign(tenantId: string, id: string, dto: AssignAssetDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status === AssetStatus.MAINTENANCE || asset.status === AssetStatus.RETIRED) {
      throw new BadRequestException(`Cannot assign asset with status ${asset.status}`);
    }

    // Verify that the target entity exists
    await this.verifyAssignmentTarget(tenantId, dto.assignedToType, dto.assignedToId);

    // Add to usage history
    const usageHistory = Array.isArray(asset.usageHistory) ? asset.usageHistory : [];
    usageHistory.push({
      action: 'ASSIGNED',
      assignedToType: dto.assignedToType,
      assignedToId: dto.assignedToId,
      timestamp: new Date().toISOString(),
      expectedReturnDate: dto.expectedReturnDate,
    });

    // Determine which field to update based on type
    const assignmentData: any = {
      status: AssetStatus.IN_USE,
      assignedToType: dto.assignedToType,
      assignedToId: dto.assignedToId,
      usageHistory,
    };

    switch (dto.assignedToType) {
      case 'JOB':
        assignmentData.jobId = dto.assignedToId;
        break;
      case 'SITE':
        assignmentData.siteId = dto.assignedToId;
        break;
      case 'CUSTOMER':
        assignmentData.customerId = dto.assignedToId;
        break;
      case 'TECHNICIAN':
        assignmentData.technicianId = dto.assignedToId;
        break;
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: assignmentData,
      include: {
        customer: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        job: { select: { id: true, number: true, title: true } },
      },
    });

    return {
      success: true,
      data: updated,
      message: 'Asset assigned successfully',
    };
  }

  async unassign(tenantId: string, id: string, dto?: UnassignAssetDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Add to usage history
    const usageHistory = Array.isArray(asset.usageHistory) ? asset.usageHistory : [];
    usageHistory.push({
      action: 'UNASSIGNED',
      previousAssignedToType: asset.assignedToType,
      previousAssignedToId: asset.assignedToId,
      timestamp: new Date().toISOString(),
      notes: dto?.notes,
    });

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.AVAILABLE,
        assignedToType: null,
        assignedToId: null,
        customerId: null,
        siteId: null,
        jobId: null,
        technicianId: null,
        usageHistory,
      },
    });

    return {
      success: true,
      data: updated,
      message: 'Asset unassigned successfully',
    };
  }

  async addMaintenanceLog(tenantId: string, id: string, dto: MaintenanceLogDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const maintenanceLogs = Array.isArray(asset.maintenanceLogs) ? asset.maintenanceLogs : [];

    maintenanceLogs.push({
      ...dto,
      timestamp: new Date().toISOString(),
      id: `maint-${Date.now()}`,
    });

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        maintenanceLogs,
        lastMaintenance: new Date(),
      },
    });

    return {
      success: true,
      data: updated,
      message: 'Maintenance log added successfully',
    };
  }

  async getAvailableAssets(tenantId: string, category?: string) {
    const where: any = {
      tenantId,
      status: AssetStatus.AVAILABLE,
    };

    if (category) {
      where.category = category;
    }

    const assets = await this.prisma.asset.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        model: true,
        serialNumber: true,
        hourlyRate: true,
        dailyRate: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: assets,
    };
  }

  private async verifyAssignmentTarget(tenantId: string, type: string, targetId: string) {
    let exists = false;

    switch (type) {
      case 'JOB':
        exists = !!(await this.prisma.job.findFirst({
          where: { id: targetId, tenantId },
        }));
        break;
      case 'SITE':
        exists = !!(await this.prisma.site.findFirst({
          where: { id: targetId, tenantId },
        }));
        break;
      case 'CUSTOMER':
        exists = !!(await this.prisma.customer.findFirst({
          where: { id: targetId, tenantId },
        }));
        break;
      case 'TECHNICIAN':
        exists = !!(await this.prisma.user.findFirst({
          where: { id: targetId, tenantId, role: 'TECHNICIAN' },
        }));
        break;
    }

    if (!exists) {
      throw new NotFoundException(`${type} not found`);
    }
  }
}
