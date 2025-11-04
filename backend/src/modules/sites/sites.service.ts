import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateSiteDto) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found or access denied');
    }

    const site = await this.prisma.site.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        country: dto.country || 'Canada',
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        notes: dto.notes,
        isPrimary: dto.isPrimary || false,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If this is marked as primary, unset other primary sites for this customer
    if (dto.isPrimary) {
      await this.prisma.site.updateMany({
        where: {
          customerId: dto.customerId,
          tenantId,
          id: { not: site.id },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return {
      success: true,
      data: site,
    };
  }

  async findAll(tenantId: string, params: {
    skip?: number;
    take?: number;
    customerId?: string;
    search?: string;
  }) {
    const { skip = 0, take = 50, customerId, search } = params;

    const where: any = { tenantId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sites, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        skip,
        take,
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              jobs: true,
            },
          },
        },
      }),
      this.prisma.site.count({ where }),
    ]);

    return {
      success: true,
      data: sites,
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const site = await this.prisma.site.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        jobs: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
          },
          orderBy: {
            scheduledStart: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found or access denied');
    }

    return {
      success: true,
      data: site,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateSiteDto) {
    const existing = await this.prisma.site.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Site not found or access denied');
    }

    const site = await this.prisma.site.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        notes: dto.notes,
        isPrimary: dto.isPrimary,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If this is marked as primary, unset other primary sites for this customer
    if (dto.isPrimary) {
      await this.prisma.site.updateMany({
        where: {
          customerId: existing.customerId,
          tenantId,
          id: { not: site.id },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return {
      success: true,
      data: site,
    };
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.site.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Site not found or access denied');
    }

    if (existing._count.jobs > 0) {
      throw new BadRequestException(
        `Cannot delete site with ${existing._count.jobs} associated jobs`
      );
    }

    await this.prisma.site.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Site deleted successfully',
    };
  }

  async setPrimary(tenantId: string, id: string) {
    const site = await this.prisma.site.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found or access denied');
    }

    // Unset all primary sites for this customer
    await this.prisma.site.updateMany({
      where: {
        customerId: site.customerId,
        tenantId,
      },
      data: {
        isPrimary: false,
      },
    });

    // Set this site as primary
    const updated = await this.prisma.site.update({
      where: { id },
      data: {
        isPrimary: true,
      },
    });

    return {
      success: true,
      data: updated,
    };
  }
}
