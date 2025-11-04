import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInventoryUsageDto } from './dto/create-inventory-usage.dto';

/**
 * Inventory Usage Service - Manages inventory usage records
 */
@Injectable()
export class InventoryUsageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all inventory usage records for a job
   */
  async findByJob(jobId: string) {
    const usages = await this.prisma.inventoryUsage.findMany({
      where: {
        jobId,
      },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
            unit: true,
            cost: true,
          },
        },
        job: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: usages,
    };
  }

  /**
   * Create inventory usage record
   */
  async create(dto: CreateInventoryUsageDto) {
    // Verify job exists
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    // Verify item exists
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.itemId },
    });

    if (!item) {
      throw new BadRequestException('Inventory item not found');
    }

    // Check if sufficient quantity available
    const available = Number(item.qtyOnHand) - Number(item.qtyReserved);
    if (available < dto.quantity) {
      throw new BadRequestException(
        `Insufficient quantity available. Available: ${available}, Requested: ${dto.quantity}`,
      );
    }

    // Record usage and adjust quantity in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create usage record
      const usage = await tx.inventoryUsage.create({
        data: {
          jobId: dto.jobId,
          itemId: dto.itemId,
          quantity: dto.quantity,
          notes: dto.notes,
          tenantId: item.tenantId,
        },
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
              cost: true,
            },
          },
        },
      });

      // Adjust quantity
      await tx.inventoryItem.update({
        where: { id: dto.itemId },
        data: {
          qtyOnHand: {
            decrement: dto.quantity,
          },
        },
      });

      return usage;
    });

    return {
      success: true,
      data: result,
      message: 'Inventory usage recorded successfully',
    };
  }
}
