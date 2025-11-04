import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExpenseEntryDto } from './dto/create-expense-entry.dto';
import { UpdateExpenseEntryDto } from './dto/update-expense-entry.dto';

/**
 * Expense Entries Service - Manages expense tracking
 */
@Injectable()
export class ExpenseEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all expense entries with filtering
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    userId?: string;
    jobId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { skip = 0, take = 50, userId, jobId, startDate, endDate } = params;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.expenseDate.lte = new Date(endDate);
      }
    }

    const [entries, total] = await Promise.all([
      this.prisma.expenseEntry.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          expenseDate: 'desc',
        },
      }),
      this.prisma.expenseEntry.count({ where }),
    ]);

    return {
      success: true,
      data: entries,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  /**
   * Find expense entry by ID
   */
  async findOne(id: string) {
    const entry = await this.prisma.expenseEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    });

    if (!entry) {
      throw new NotFoundException(`Expense entry with ID ${id} not found`);
    }

    return {
      success: true,
      data: entry,
    };
  }

  /**
   * Create new expense entry
   */
  async create(userId: string, dto: CreateExpenseEntryDto) {
    const entry = await this.prisma.expenseEntry.create({
      data: {
        userId,
        jobId: dto.jobId,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        receiptUrl: dto.receiptUrl,
        expenseDate: new Date(dto.expenseDate),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    });

    return {
      success: true,
      data: entry,
      message: 'Expense entry created successfully',
    };
  }

  /**
   * Update expense entry
   */
  async update(id: string, userId: string, userRole: string, dto: UpdateExpenseEntryDto) {
    const existing = await this.prisma.expenseEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Expense entry with ID ${id} not found`);
    }

    // Only allow users to update their own entries, unless they're admin/dispatcher
    if (existing.userId !== userId && !['ADMIN', 'DISPATCHER', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('You can only update your own expense entries');
    }

    const updateData: any = {};

    if (dto.jobId !== undefined) updateData.jobId = dto.jobId;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.receiptUrl !== undefined) updateData.receiptUrl = dto.receiptUrl;
    if (dto.expenseDate !== undefined) updateData.expenseDate = new Date(dto.expenseDate);

    const entry = await this.prisma.expenseEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    });

    return {
      success: true,
      data: entry,
      message: 'Expense entry updated successfully',
    };
  }

  /**
   * Delete expense entry
   */
  async delete(id: string, userId: string, userRole: string) {
    const entry = await this.prisma.expenseEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Expense entry with ID ${id} not found`);
    }

    // Only allow users to delete their own entries, unless they're admin/dispatcher
    if (entry.userId !== userId && !['ADMIN', 'DISPATCHER', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('You can only delete your own expense entries');
    }

    await this.prisma.expenseEntry.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Expense entry deleted successfully',
    };
  }
}
