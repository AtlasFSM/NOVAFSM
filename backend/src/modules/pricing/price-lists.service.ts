import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { QueryPriceListDto } from './dto/query-price-list.dto';
import { AssignPriceListToCustomersDto, UnassignPriceListFromCustomersDto } from './dto/assign-price-list.dto';

@Injectable()
export class PriceListsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all price lists for a tenant with optional filters
   */
  async findAll(tenantId: string, query: QueryPriceListDto) {
    const { status, currency, isDefault, page = 1, limit = 20 } = query;

    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (currency) {
      where.currency = currency;
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.priceList.findMany({
        where,
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.priceList.count({ where }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single price list by ID
   */
  async findOne(tenantId: string, id: string) {
    const priceList = await this.prisma.priceList.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!priceList) {
      throw new NotFoundException(`Price list with ID ${id} not found`);
    }

    return {
      success: true,
      data: priceList,
    };
  }

  /**
   * Create a new price list
   */
  async create(tenantId: string, dto: CreatePriceListDto) {
    // Check if name already exists for this tenant
    const existing = await this.prisma.priceList.findFirst({
      where: {
        tenantId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Price list with name "${dto.name}" already exists`,
      );
    }

    // If isDefault is true, unset other defaults in transaction
    if (dto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        // Unset all other defaults for this tenant
        await tx.priceList.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });

        // Create the new price list
        const priceList = await tx.priceList.create({
          data: {
            tenantId,
            name: dto.name,
            description: dto.description,
            currency: dto.currency || 'CAD',
            isDefault: true,
            status: dto.status || 'ACTIVE',
          },
        });

        return {
          success: true,
          data: priceList,
        };
      });
    }

    // Regular creation without default
    const priceList = await this.prisma.priceList.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        currency: dto.currency || 'CAD',
        isDefault: dto.isDefault || false,
        status: dto.status || 'ACTIVE',
      },
    });

    return {
      success: true,
      data: priceList,
    };
  }

  /**
   * Update an existing price list
   */
  async update(tenantId: string, id: string, dto: UpdatePriceListDto) {
    // Check if price list exists
    const existing = await this.prisma.priceList.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Price list with ID ${id} not found`);
    }

    // If updating name, check for duplicates
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.priceList.findFirst({
        where: {
          tenantId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Price list with name "${dto.name}" already exists`,
        );
      }
    }

    // If setting isDefault to true, unset other defaults in transaction
    if (dto.isDefault && !existing.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        // Unset all other defaults for this tenant
        await tx.priceList.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });

        // Update the price list
        const priceList = await tx.priceList.update({
          where: { id },
          data: {
            name: dto.name,
            description: dto.description,
            currency: dto.currency,
            isDefault: true,
            status: dto.status,
          },
        });

        return {
          success: true,
          data: priceList,
        };
      });
    }

    // Regular update
    const priceList = await this.prisma.priceList.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        currency: dto.currency,
        isDefault: dto.isDefault,
        status: dto.status,
      },
    });

    return {
      success: true,
      data: priceList,
    };
  }

  /**
   * Delete a price list
   */
  async delete(tenantId: string, id: string) {
    // Check if price list exists
    const existing = await this.prisma.priceList.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Price list with ID ${id} not found`);
    }

    // Check if it has items
    if (existing._count.items > 0) {
      throw new BadRequestException(
        `Cannot delete price list with ${existing._count.items} items. Archive it instead or delete all items first.`,
      );
    }

    await this.prisma.priceList.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Price list deleted successfully',
    };
  }

  /**
   * Set a price list as the default (unsets other defaults)
   */
  async setDefault(tenantId: string, id: string) {
    // Check if price list exists
    const existing = await this.prisma.priceList.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Price list with ID ${id} not found`);
    }

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Cannot set an archived price list as default',
      );
    }

    // Use transaction to unset other defaults and set this one
    const priceList = await this.prisma.$transaction(async (tx) => {
      // Unset all other defaults for this tenant
      await tx.priceList.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });

      // Set this one as default
      return tx.priceList.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return {
      success: true,
      data: priceList,
    };
  }

  /**
   * Assign a price list to specific customers
   */
  async assignToCustomers(
    tenantId: string,
    priceListId: string,
    userId: string,
    dto: AssignPriceListToCustomersDto,
  ) {
    // Check if price list exists and is active
    const priceList = await this.prisma.priceList.findFirst({
      where: { id: priceListId, tenantId },
    });

    if (!priceList) {
      throw new NotFoundException(`Price list with ID ${priceListId} not found`);
    }

    if (priceList.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Cannot assign an archived price list to customers',
      );
    }

    // Verify all customers exist and belong to this tenant
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        id: { in: dto.customerIds },
      },
    });

    if (customers.length !== dto.customerIds.length) {
      throw new BadRequestException('One or more customers not found');
    }

    // Get existing assignments
    const existingAssignments = await this.prisma.priceListCustomer.findMany({
      where: {
        tenantId,
        priceListId,
        customerId: { in: dto.customerIds },
      },
    });

    const existingCustomerIds = new Set(
      existingAssignments.map((a) => a.customerId),
    );

    // Filter out customers that are already assigned
    const newCustomerIds = dto.customerIds.filter(
      (id) => !existingCustomerIds.has(id),
    );

    if (newCustomerIds.length === 0) {
      return {
        success: true,
        message: 'All customers are already assigned to this price list',
        data: {
          alreadyAssigned: dto.customerIds.length,
          newlyAssigned: 0,
        },
      };
    }

    // Create new assignments
    const assignments = await this.prisma.priceListCustomer.createMany({
      data: newCustomerIds.map((customerId) => ({
        tenantId,
        priceListId,
        customerId,
        assignedBy: userId,
        notes: dto.notes,
      })),
    });

    return {
      success: true,
      message: `Price list assigned to ${newCustomerIds.length} customer(s)`,
      data: {
        alreadyAssigned: existingCustomerIds.size,
        newlyAssigned: assignments.count,
      },
    };
  }

  /**
   * Unassign a price list from specific customers
   */
  async unassignFromCustomers(
    tenantId: string,
    priceListId: string,
    dto: UnassignPriceListFromCustomersDto,
  ) {
    // Check if price list exists
    const priceList = await this.prisma.priceList.findFirst({
      where: { id: priceListId, tenantId },
    });

    if (!priceList) {
      throw new NotFoundException(`Price list with ID ${priceListId} not found`);
    }

    // Delete assignments
    const result = await this.prisma.priceListCustomer.deleteMany({
      where: {
        tenantId,
        priceListId,
        customerId: { in: dto.customerIds },
      },
    });

    return {
      success: true,
      message: `Price list unassigned from ${result.count} customer(s)`,
      data: {
        unassigned: result.count,
      },
    };
  }

  /**
   * Get all customers assigned to a price list
   */
  async getAssignedCustomers(tenantId: string, priceListId: string) {
    // Check if price list exists
    const priceList = await this.prisma.priceList.findFirst({
      where: { id: priceListId, tenantId },
    });

    if (!priceList) {
      throw new NotFoundException(`Price list with ID ${priceListId} not found`);
    }

    const assignments = await this.prisma.priceListCustomer.findMany({
      where: {
        tenantId,
        priceListId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return {
      success: true,
      data: assignments.map((assignment) => ({
        assignmentId: assignment.id,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy,
        notes: assignment.notes,
        customer: assignment.customer,
      })),
    };
  }

  /**
   * Get all price lists assigned to a specific customer
   */
  async getCustomerPriceLists(tenantId: string, customerId: string) {
    // Check if customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const assignments = await this.prisma.priceListCustomer.findMany({
      where: {
        tenantId,
        customerId,
      },
      include: {
        priceList: {
          select: {
            id: true,
            name: true,
            description: true,
            currency: true,
            status: true,
            isDefault: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return {
      success: true,
      data: assignments.map((assignment) => ({
        assignmentId: assignment.id,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy,
        notes: assignment.notes,
        priceList: assignment.priceList,
      })),
    };
  }
}
