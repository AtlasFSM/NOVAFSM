import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all sites for a customer
   */
  async findAll(tenantId: string, customerId: string) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${customerId} not found`,
      );
    }

    const sites = await this.prisma.site.findMany({
      where: {
        tenantId,
        customerId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            jobs: true,
            quotes: true,
          },
        },
      },
    });

    return {
      success: true,
      data: sites,
    };
  }

  /**
   * Find one site by ID
   */
  async findOne(tenantId: string, id: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            jobs: true,
            quotes: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return {
      success: true,
      data: site,
    };
  }

  /**
   * Create a new site
   */
  async create(tenantId: string, dto: CreateSiteDto) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });

    if (!customer) {
      throw new BadRequestException(
        `Customer with ID ${dto.customerId} not found`,
      );
    }

    const site = await this.prisma.site.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        provinceState: dto.provinceState,
        postalZip: dto.postalZip,
        country: dto.country || 'CA',
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: site,
    };
  }

  /**
   * Update a site
   */
  async update(tenantId: string, id: string, dto: UpdateSiteDto) {
    // Check if site exists
    const existing = await this.prisma.site.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    const site = await this.prisma.site.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        provinceState: dto.provinceState,
        postalZip: dto.postalZip,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: site,
    };
  }

  /**
   * Delete a site
   */
  async delete(tenantId: string, id: string) {
    // Check if site exists
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            jobs: true,
            quotes: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    // Check if site has related records
    const hasRelatedRecords =
      site._count.jobs > 0 || site._count.quotes > 0;

    if (hasRelatedRecords) {
      throw new BadRequestException(
        'Cannot delete site with existing jobs or quotes',
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
}
