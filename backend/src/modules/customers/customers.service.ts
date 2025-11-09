import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { createObjectCsvStringifier } from 'csv-writer';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';

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
        throw new BadRequestException(
          `Customer with email ${dto.email} already exists`,
        );
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
        throw new BadRequestException(
          `Customer with email ${dto.email} already exists`,
        );
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
      customer._count.jobs > 0 ||
      customer._count.quotes > 0 ||
      customer._count.invoices > 0;

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
   * Export customers to CSV
   */
  async exportCustomers(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { sites: true, jobs: true, quotes: true, invoices: true },
        },
      },
    });

    // Define CSV columns
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'status', title: 'Status' },
        { id: 'type', title: 'Type' },
        { id: 'billingAddressStreet', title: 'Billing Street' },
        { id: 'billingAddressCity', title: 'Billing City' },
        { id: 'billingAddressProvince', title: 'Billing Province' },
        { id: 'billingAddressPostalCode', title: 'Billing Postal Code' },
        { id: 'billingAddressCountry', title: 'Billing Country' },
        { id: 'notes', title: 'Notes' },
        { id: 'sitesCount', title: 'Sites Count' },
        { id: 'jobsCount', title: 'Jobs Count' },
        { id: 'quotesCount', title: 'Quotes Count' },
        { id: 'invoicesCount', title: 'Invoices Count' },
        { id: 'createdAt', title: 'Created At' },
      ],
    });

    // Transform customers data for CSV
    const records = customers.map((customer) => ({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      status: customer.status,
      type: customer.type,
      billingAddressStreet: customer.billingAddress?.['street'] || '',
      billingAddressCity: customer.billingAddress?.['city'] || '',
      billingAddressProvince: customer.billingAddress?.['province'] || '',
      billingAddressPostalCode: customer.billingAddress?.['postalCode'] || '',
      billingAddressCountry: customer.billingAddress?.['country'] || 'Canada',
      notes: customer.notes || '',
      sitesCount: customer._count.sites,
      jobsCount: customer._count.jobs,
      quotesCount: customer._count.quotes,
      invoicesCount: customer._count.invoices,
      createdAt: customer.createdAt.toISOString(),
    }));

    // Generate CSV content
    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);
    const csvContent = header + body;

    return {
      success: true,
      message: `Exported ${customers.length} customer(s)`,
      data: {
        csvContent,
        filename: `customers-export-${new Date().toISOString().split('T')[0]}.csv`,
        count: customers.length,
      },
    };
  }

  /**
   * Import customers from CSV
   */
  async importCustomers(tenantId: string, csvContent: string) {
    const results: any[] = [];
    const errors: any[] = [];

    return new Promise((resolve) => {
      // Create a readable stream from CSV content
      const stream = Readable.from([csvContent]);

      stream
        .pipe(csvParser())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', async () => {
          let successful = 0;
          let failed = 0;

          for (const row of results) {
            try {
              // Validate required fields
              if (!row.Name || !row.Email) {
                errors.push({
                  row: row,
                  error: 'Missing required fields: Name or Email',
                });
                failed++;
                continue;
              }

              // Check for duplicate email
              const existingCustomer = await this.prisma.customer.findFirst({
                where: {
                  tenantId,
                  email: row.Email,
                },
              });

              if (existingCustomer) {
                errors.push({
                  row: row,
                  error: `Customer with email ${row.Email} already exists`,
                });
                failed++;
                continue;
              }

              // Build billing address if available
              const billingAddress: any = {};
              if (row['Billing Street']) billingAddress.street = row['Billing Street'];
              if (row['Billing City']) billingAddress.city = row['Billing City'];
              if (row['Billing Province']) billingAddress.province = row['Billing Province'];
              if (row['Billing Postal Code']) billingAddress.postalCode = row['Billing Postal Code'];
              if (row['Billing Country']) billingAddress.country = row['Billing Country'];

              // Create customer
              await this.prisma.customer.create({
                data: {
                  tenantId,
                  name: row.Name,
                  email: row.Email,
                  phone: row.Phone || null,
                  status: (row.Status as any) || 'ACTIVE',
                  type: (row.Type as any) || 'COMMERCIAL',
                  billingAddress: Object.keys(billingAddress).length > 0 ? billingAddress : null,
                  notes: row.Notes || null,
                },
              });

              successful++;
            } catch (error) {
              errors.push({
                row: row,
                error: error.message || 'Unknown error',
              });
              failed++;
            }
          }

          resolve({
            success: true,
            message: `Processed ${results.length} row(s)`,
            summary: {
              processed: results.length,
              successful,
              failed,
              errors: errors.slice(0, 50), // Limit errors in response
            },
          });
        })
        .on('error', (error) => {
          resolve({
            success: false,
            message: 'Failed to parse CSV file',
            error: error.message,
          });
        });
    });
  }
}
