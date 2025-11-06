import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustQuantityDto } from './dto/adjust-quantity.dto';

/**
 * Inventory Service - Manages inventory items
 */
@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all inventory items with pagination and filtering
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    category?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const { skip = 0, take = 50, category, isActive, search } = params;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  /**
   * Find inventory item by ID
   */
  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        usages: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            job: {
              select: {
                id: true,
                number: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return {
      success: true,
      data: item,
    };
  }

  /**
   * Create new inventory item
   */
  async create(dto: CreateInventoryItemDto) {
    // Check if SKU already exists
    const existing = await this.prisma.inventoryItem.findFirst({
      where: {
        sku: dto.sku,
      },
    });

    if (existing) {
      throw new ConflictException(`Inventory item with SKU ${dto.sku} already exists`);
    }

    const item = await this.prisma.inventoryItem.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unit: dto.unit,
        qtyOnHand: dto.qtyOnHand,
        qtyReserved: dto.qtyReserved,
        reorderPoint: dto.reorderPoint,
        location: dto.location,
        cost: dto.cost,
        isActive: dto.isActive,
      },
    });

    return {
      success: true,
      data: item,
      message: 'Inventory item created successfully',
    };
  }

  /**
   * Update existing inventory item
   */
  async update(id: string, dto: UpdateInventoryItemDto) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    // Check SKU uniqueness if being updated
    if (dto.sku && dto.sku !== existing.sku) {
      const duplicate = await this.prisma.inventoryItem.findFirst({
        where: {
          sku: dto.sku,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(`Inventory item with SKU ${dto.sku} already exists`);
      }
    }

    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unit: dto.unit,
        qtyOnHand: dto.qtyOnHand,
        qtyReserved: dto.qtyReserved,
        reorderPoint: dto.reorderPoint,
        location: dto.location,
        cost: dto.cost,
        isActive: dto.isActive,
      },
    });

    return {
      success: true,
      data: item,
      message: 'Inventory item updated successfully',
    };
  }

  /**
   * Delete inventory item
   */
  async delete(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        usages: {
          take: 1,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    // Don't allow deletion if item has been used
    if (item.usages.length > 0) {
      throw new BadRequestException('Cannot delete inventory item with usage history');
    }

    await this.prisma.inventoryItem.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Inventory item deleted successfully',
    };
  }

  /**
   * Adjust inventory quantity
   */
  async adjustQuantity(id: string, dto: AdjustQuantityDto) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    const newQuantity = Number(item.qtyOnHand) + dto.adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Adjustment would result in negative quantity');
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        qtyOnHand: newQuantity,
      },
    });

    return {
      success: true,
      data: {
        item: updated,
        adjustment: dto.adjustment,
        previousQuantity: item.qtyOnHand,
        newQuantity: updated.qtyOnHand,
      },
      message: 'Inventory quantity adjusted successfully',
    };
  }

  /**
   * Record inventory usage for a job
   */
  async recordUsage(jobId: string, itemId: string, quantity: number, notes?: string) {
    // Verify job exists
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    // Verify item exists
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new BadRequestException('Inventory item not found');
    }

    // Check if sufficient quantity available
    const available = Number(item.qtyOnHand) - Number(item.qtyReserved);
    if (available < quantity) {
      throw new BadRequestException(
        `Insufficient quantity available. Available: ${available}, Requested: ${quantity}`,
      );
    }

    // Record usage and adjust quantity in transaction
    const result = await this.prisma.$transaction(async (tx: any) => {
      // Create usage record
      const usage = await tx.inventoryUsage.create({
        data: {
          jobId,
          itemId,
          quantity,
          notes,
          tenantId: item.tenantId,
        },
      });

      // Adjust quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          qtyOnHand: {
            decrement: quantity,
          },
        },
      });

      return { usage, item: updatedItem };
    });

    return {
      success: true,
      data: result,
      message: 'Inventory usage recorded successfully',
    };
  }
}
