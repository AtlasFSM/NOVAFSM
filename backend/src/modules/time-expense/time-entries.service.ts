import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

/**
 * Time Entries Service - Manages time tracking
 */
@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all time entries with filtering
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
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    const [entries, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
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
          startTime: 'desc',
        },
      }),
      this.prisma.timeEntry.count({ where }),
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
   * Find time entry by ID
   */
  async findOne(id: string) {
    const entry = await this.prisma.timeEntry.findUnique({
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
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    return {
      success: true,
      data: entry,
    };
  }

  /**
   * Create new time entry
   */
  async create(userId: string, dto: CreateTimeEntryDto) {
    // Calculate duration if endTime is provided
    let duration: number | null = null;
    if (dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60); // Minutes
    }

    const entry = await this.prisma.timeEntry.create({
      data: {
        userId,
        jobId: dto.jobId,
        type: dto.type,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        duration,
        notes: dto.notes,
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
      message: 'Time entry created successfully',
    };
  }

  /**
   * Update time entry
   */
  async update(id: string, userId: string, userRole: string, dto: UpdateTimeEntryDto) {
    const existing = await this.prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    // Only allow users to update their own entries, unless they're admin/dispatcher
    if (existing.userId !== userId && !['ADMIN', 'DISPATCHER', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('You can only update your own time entries');
    }

    const updateData: any = {};

    if (dto.jobId !== undefined) updateData.jobId = dto.jobId;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.startTime !== undefined) updateData.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) updateData.endTime = dto.endTime ? new Date(dto.endTime) : null;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Recalculate duration if times changed
    if (dto.startTime || dto.endTime) {
      const start = dto.startTime ? new Date(dto.startTime) : existing.startTime;
      const end = dto.endTime ? new Date(dto.endTime) : existing.endTime;

      if (start && end) {
        updateData.duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
      }
    }

    const entry = await this.prisma.timeEntry.update({
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
      message: 'Time entry updated successfully',
    };
  }

  /**
   * Delete time entry
   */
  async delete(id: string, userId: string, userRole: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    // Only allow users to delete their own entries, unless they're admin/dispatcher
    if (entry.userId !== userId && !['ADMIN', 'DISPATCHER', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('You can only delete your own time entries');
    }

    await this.prisma.timeEntry.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Time entry deleted successfully',
    };
  }

  /**
   * Calculate total duration for given parameters
   */
  async calculateDuration(params: {
    userId?: string;
    jobId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { userId, jobId, startDate, endDate } = params;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      select: {
        duration: true,
        type: true,
      },
    });

    const totalByType = entries.reduce((acc: Record<string, number>, entry: any) => {
      if (entry.duration) {
        acc[entry.type] = (acc[entry.type] || 0) + entry.duration;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalMinutes = Object.values(totalByType).reduce<number>((sum, val) => sum + (val as number), 0);

    return {
      success: true,
      data: {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        byType: totalByType,
      },
    };
  }
}
