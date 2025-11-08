import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all customers with pagination and search
   */
  async findAll(tenantId: string, query: QueryCustomersDto) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              sites: true,
              jobs: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      success: true,
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one customer by ID
   */
  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        sites: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            jobs: true,
            quotes: true,
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return {
      success: true,
      data: customer,
    };
  }

  /**
   * Create a new customer
   */
  async create(tenantId: string, dto: CreateCustomerDto) {
    // Check if customer with same email exists
    if (dto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          email: dto.email,
        },
      });

      if (existing) {
        throw new BadRequestException(`Customer with email ${dto.email} already exists`);
      }
    }

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        provinceState: dto.provinceState,
        postalZip: dto.postalZip,
        country: dto.country || 'CA',
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: dto.status || 'ACTIVE',
        tags: dto.tags || [],
        billingAddress: dto.billingAddress || null,
        notes: dto.notes,
      },
    });

    return {
      success: true,
      data: customer,
    };
  }

  /**
   * Update a customer
   */
  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    // Check if customer exists
    const existing = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check if email is being changed and if it conflicts
    if (dto.email && dto.email !== existing.email) {
      const emailConflict = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          email: dto.email,
          id: { not: id },
        },
      });

      if (emailConflict) {
        throw new BadRequestException(`Customer with email ${dto.email} already exists`);
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        provinceState: dto.provinceState,
        postalZip: dto.postalZip,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: dto.status,
        tags: dto.tags,
        billingAddress: dto.billingAddress,
        notes: dto.notes,
      },
    });

    return {
      success: true,
      data: customer,
    };
  }

  /**
   * Delete a customer
   */
  async delete(tenantId: string, id: string) {
    // Check if customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            sites: true,
            jobs: true,
            quotes: true,
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check if customer has related records
    const hasRelatedRecords =
      customer._count.jobs > 0 || customer._count.quotes > 0 || customer._count.invoices > 0;

    if (hasRelatedRecords) {
      throw new BadRequestException(
        'Cannot delete customer with existing jobs, quotes, or invoices. Archive instead.',
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Customer deleted successfully',
    };
  }

  /**
   * Search customers by name, email, or phone
   */
  async search(tenantId: string, searchTerm: string) {
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        status: true,
      },
    });

    return {
      success: true,
      data: customers,
    };
  }

  /**
   * Export customers to CSV (stub for future implementation)
   */
  async exportCustomers(tenantId: string) {
    // TODO: Implement CSV export functionality
    // This would typically use a library like csv-writer or fast-csv
    // to generate a CSV file with customer data

    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Export functionality to be implemented',
      count: customers.length,
    };
  }

  /**
   * Import customers from CSV (stub for future implementation)
   */
  async importCustomers(tenantId: string, file: any) {
    // TODO: Implement CSV import functionality
    // This would typically:
    // 1. Parse CSV file using csv-parser or similar
    // 2. Validate each row
    // 3. Create customers in batch
    // 4. Handle errors and duplicates
    // 5. Return import summary

    return {
      success: true,
      message: 'Import functionality to be implemented',
      summary: {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
      },
    };
  }

  /**
   * Find all soft-deleted customers
   */
  async findDeleted(tenantId: string, query: QueryCustomersDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause for deleted records
    const where: any = {
      tenantId,
      deletedAt: { not: null }, // Only show deleted records
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          status: true,
          deletedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      success: true,
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Restore a soft-deleted customer
   */
  async restore(tenantId: string, id: string) {
    // Check if customer exists and is deleted
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: { not: null },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Deleted customer with ID ${id} not found`);
    }

    // Restore the customer by setting deletedAt to null
    const restored = await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });

    return {
      success: true,
      data: restored,
      message: 'Customer restored successfully',
    };
  }
}
