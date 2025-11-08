import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePriceItemDto } from './dto/create-price-item.dto';
import { UpdatePriceItemDto } from './dto/update-price-item.dto';
import { QueryPriceItemDto } from './dto/query-price-item.dto';
import { BulkCreatePriceItemDto } from './dto/bulk-create-price-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PriceItemsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all price items for a price list with optional filters
   */
  async findAll(tenantId: string, priceListId: string, query: QueryPriceItemDto) {
    // Verify price list exists and belongs to tenant
    const priceList = await this.prisma.priceList.findFirst({
      where: { id: priceListId, tenantId },
    });

    if (!priceList) {
      throw new NotFoundException(`Price list with ID ${priceListId} not found`);
    }

    const { category, isActive, sku, page = 1, limit = 20 } = query;

    const where: any = { tenantId, priceListId };

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (sku) {
      where.sku = {
        contains: sku,
        mode: 'insensitive',
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.priceItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sku: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.priceItem.count({ where }),
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
   * Find a single price item by ID
   */
  async findOne(tenantId: string, id: string) {
    const priceItem = await this.prisma.priceItem.findFirst({
      where: { id, tenantId },
      include: {
        priceList: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    });

    if (!priceItem) {
      throw new NotFoundException(`Price item with ID ${id} not found`);
    }

    return {
      success: true,
      data: priceItem,
    };
  }

  /**
   * Create a new price item
   */
  async create(tenantId: string, dto: CreatePriceItemDto) {
    // Verify price list exists and belongs to tenant
    const priceList = await this.prisma.priceList.findFirst({
      where: { id: dto.priceListId, tenantId },
    });

    if (!priceList) {
      throw new NotFoundException(`Price list with ID ${dto.priceListId} not found`);
    }

    // Check unique constraint: (tenantId, priceListId, sku)
    const existing = await this.prisma.priceItem.findFirst({
      where: {
        tenantId,
        priceListId: dto.priceListId,
        sku: dto.sku,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Price item with SKU "${dto.sku}" already exists in this price list`,
      );
    }

    const priceItem = await this.prisma.priceItem.create({
      data: {
        tenantId,
        priceListId: dto.priceListId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        unit: dto.unit || 'EA',
        defaultRate: dto.defaultRate,
        taxCode: dto.taxCode,
        isActive: dto.isActive ?? true,
        category: dto.category,
      },
    });

    return {
      success: true,
      data: priceItem,
    };
  }

  /**
   * Update an existing price item
   */
  async update(tenantId: string, id: string, dto: UpdatePriceItemDto) {
    // Check if price item exists
    const existing = await this.prisma.priceItem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Price item with ID ${id} not found`);
    }

    // If updating SKU, check for duplicates
    if (dto.sku && dto.sku !== existing.sku) {
      const duplicate = await this.prisma.priceItem.findFirst({
        where: {
          tenantId,
          priceListId: existing.priceListId,
          sku: dto.sku,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Price item with SKU "${dto.sku}" already exists in this price list`,
        );
      }
    }

    const updateData: any = {
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      unit: dto.unit,
      taxCode: dto.taxCode,
      isActive: dto.isActive,
      category: dto.category,
    };

    if (dto.defaultRate !== undefined) {
      updateData.defaultRate = dto.defaultRate;
    }

    const priceItem = await this.prisma.priceItem.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: priceItem,
    };
  }

  /**
   * Delete a price item
   */
  async delete(tenantId: string, id: string) {
    // Check if price item exists
    const existing = await this.prisma.priceItem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Price item with ID ${id} not found`);
    }

    await this.prisma.priceItem.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Price item deleted successfully',
    };
  }

  /**
   * Bulk create price items
   */
  async bulkCreate(tenantId: string, dto: BulkCreatePriceItemDto) {
    // Collect all unique price list IDs
    const priceListIds = [...new Set(dto.items.map((item) => item.priceListId))];

    // Verify all price lists exist and belong to tenant
    const priceLists = await this.prisma.priceList.findMany({
      where: {
        id: { in: priceListIds },
        tenantId,
      },
    });

    if (priceLists.length !== priceListIds.length) {
      const foundIds = priceLists.map((pl: any) => pl.id);
      const missingIds = priceListIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Price lists not found: ${missingIds.join(', ')}`);
    }

    // Check for duplicate SKUs within the request
    const skuMap = new Map<string, number>();
    dto.items.forEach((item) => {
      const key = `${item.priceListId}:${item.sku}`;
      skuMap.set(key, (skuMap.get(key) || 0) + 1);
    });

    const duplicates = Array.from(skuMap.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key);

    if (duplicates.length > 0) {
      throw new BadRequestException(`Duplicate SKUs in request: ${duplicates.join(', ')}`);
    }

    // Check for existing SKUs in database
    const existingItems = await this.prisma.priceItem.findMany({
      where: {
        tenantId,
        OR: dto.items.map((item) => ({
          priceListId: item.priceListId,
          sku: item.sku,
        })),
      },
      select: {
        priceListId: true,
        sku: true,
      },
    });

    if (existingItems.length > 0) {
      const conflicts = existingItems.map((item: any) => `${item.priceListId}:${item.sku}`);
      throw new ConflictException(`SKUs already exist in database: ${conflicts.join(', ')}`);
    }

    // Create all items in a transaction
    const createdItems = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.priceItem.create({
          data: {
            tenantId,
            priceListId: item.priceListId,
            sku: item.sku,
            name: item.name,
            description: item.description,
            unit: item.unit || 'EA',
            defaultRate: item.defaultRate,
            taxCode: item.taxCode,
            isActive: item.isActive ?? true,
            category: item.category,
          },
        }),
      ),
    );

    return {
      success: true,
      data: createdItems,
      count: createdItems.length,
    };
  }
}
