import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Organization with this name already exists');
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        currency: dto.currency || 'CAD',
        status: 'ACTIVE',
        address: dto.address,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        country: dto.country || 'Canada',
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
      },
    });

    return {
      success: true,
      data: organization,
    };
  }

  async findAll(params: { skip?: number; take?: number; status?: string }) {
    const { skip = 0, take = 50, status } = params;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      success: true,
      data: organizations,
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        },
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
          take: 10,
        },
        _count: {
          select: {
            users: true,
            customers: true,
            quotes: true,
            jobs: true,
            invoices: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return {
      success: true,
      data: organization,
    };
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    const organization = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        currency: dto.currency,
        status: dto.status,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        country: dto.country,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
      },
    });

    return {
      success: true,
      data: organization,
    };
  }

  async delete(id: string) {
    const existing = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            jobs: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    if (existing._count.users > 0 || existing._count.customers > 0 || existing._count.jobs > 0) {
      throw new BadRequestException(
        'Cannot delete organization with existing users, customers, or jobs. Set status to INACTIVE instead.',
      );
    }

    await this.prisma.organization.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Organization deleted successfully',
    };
  }

  async getStats(id: string) {
    const stats = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
            customers: true,
            quotes: true,
            jobs: true,
            invoices: true,
          },
        },
      },
    });

    if (!stats) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    const revenueData = await this.prisma.invoice.aggregate({
      where: {
        tenantId: id,
        status: 'PAID',
      },
      _sum: {
        total: true,
      },
    });

    return {
      success: true,
      data: {
        totalUsers: stats._count.users,
        totalCustomers: stats._count.customers,
        totalQuotes: stats._count.quotes,
        totalJobs: stats._count.jobs,
        totalInvoices: stats._count.invoices,
        totalRevenue: revenueData._sum.total || 0,
      },
    };
  }
}
