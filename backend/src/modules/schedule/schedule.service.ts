import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { GetScheduleDto } from './dto/get-schedule.dto';

interface TimeSlot {
  start: Date;
  end: Date;
  jobId?: string;
  jobNumber?: string;
  jobTitle?: string;
  type: 'SCHEDULED' | 'AVAILABLE';
}

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get schedule for a date range
   * Returns all scheduled jobs for specified technicians or all technicians
   */
  async getSchedule(tenantId: string, dto: GetScheduleDto) {
    const where: any = {
      tenantId,
      scheduledStart: {
        gte: new Date(dto.startDate),
        lte: new Date(dto.endDate),
      },
    };

    if (dto.technicianId) {
      where.assignedTechnicianId = dto.technicianId;
    }

    if (dto.status) {
      where.status = { in: dto.status };
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    // Group by technician
    const scheduleByTechnician = new Map<string, any[]>();

    jobs.forEach((job) => {
      if (job.assignedTechnicianId) {
        if (!scheduleByTechnician.has(job.assignedTechnicianId)) {
          scheduleByTechnician.set(job.assignedTechnicianId, []);
        }
        scheduleByTechnician.get(job.assignedTechnicianId)!.push(job);
      }
    });

    return {
      success: true,
      data: {
        jobs,
        byTechnician: Object.fromEntries(scheduleByTechnician),
      },
    };
  }

  /**
   * Check availability for a technician during a time period
   * Returns conflicts if any exist
   */
  async checkAvailability(tenantId: string, dto: CheckAvailabilityDto) {
    const { technicianId, startDate, endDate, excludeJobId } = dto;

    const where: any = {
      tenantId,
      assignedTechnicianId: technicianId,
      scheduledStart: {
        lt: new Date(endDate),
      },
      scheduledEnd: {
        gt: new Date(startDate),
      },
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS'],
      },
    };

    if (excludeJobId) {
      where.id = { not: excludeJobId };
    }

    const conflicts = await this.prisma.job.findMany({
      where,
      select: {
        id: true,
        number: true,
        title: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    const hasConflict = conflicts.length > 0;

    return {
      success: true,
      data: {
        available: !hasConflict,
        conflicts: hasConflict ? conflicts : [],
      },
    };
  }

  /**
   * Find available technicians for a time slot
   */
  async findAvailableTechnicians(
    tenantId: string,
    startDate: string,
    endDate: string,
    excludeJobId?: string
  ) {
    // Get all active technicians for the tenant
    const technicians = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'TECHNICIAN',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Check availability for each technician
    const availabilityChecks = await Promise.all(
      technicians.map(async (tech) => {
        const result = await this.checkAvailability(tenantId, {
          technicianId: tech.id,
          startDate,
          endDate,
          excludeJobId,
        });

        return {
          technician: tech,
          available: result.data.available,
          conflicts: result.data.conflicts,
        };
      })
    );

    const available = availabilityChecks.filter((check) => check.available);
    const unavailable = availabilityChecks.filter((check) => !check.available);

    return {
      success: true,
      data: {
        available,
        unavailable,
        total: technicians.length,
        availableCount: available.length,
      },
    };
  }

  /**
   * Get technician utilization for a date range
   */
  async getTechnicianUtilization(
    tenantId: string,
    technicianId: string,
    startDate: string,
    endDate: string
  ) {
    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        assignedTechnicianId: technicianId,
        scheduledStart: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        number: true,
        title: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
      },
    });

    // Calculate total hours scheduled
    let totalScheduledHours = 0;
    jobs.forEach((job) => {
      const start = new Date(job.scheduledStart).getTime();
      const end = new Date(job.scheduledEnd).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      totalScheduledHours += hours;
    });

    // Calculate working days in range (assuming 8-hour days, 5 days/week)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const workingDays = Math.floor((daysDiff / 7) * 5) + (daysDiff % 7);
    const availableHours = workingDays * 8;

    const utilizationPercent = availableHours > 0
      ? Math.round((totalScheduledHours / availableHours) * 100)
      : 0;

    return {
      success: true,
      data: {
        technicianId,
        startDate,
        endDate,
        totalJobs: jobs.length,
        scheduledHours: Math.round(totalScheduledHours * 10) / 10,
        availableHours,
        utilizationPercent,
        jobs,
      },
    };
  }

  /**
   * Get calendar view data with time slots
   */
  async getCalendarView(
    tenantId: string,
    technicianId: string,
    date: string
  ) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        assignedTechnicianId: technicianId,
        scheduledStart: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    // Generate time slots (8 AM to 6 PM in 30-minute intervals)
    const timeSlots: TimeSlot[] = [];
    const workDayStart = new Date(date);
    workDayStart.setHours(8, 0, 0, 0);

    const workDayEnd = new Date(date);
    workDayEnd.setHours(18, 0, 0, 0);

    let currentSlot = new Date(workDayStart);
    while (currentSlot < workDayEnd) {
      const slotEnd = new Date(currentSlot.getTime() + 30 * 60 * 1000);

      // Check if any job overlaps this slot
      const overlappingJob = jobs.find((job) => {
        const jobStart = new Date(job.scheduledStart);
        const jobEnd = new Date(job.scheduledEnd);
        return jobStart < slotEnd && jobEnd > currentSlot;
      });

      if (overlappingJob) {
        timeSlots.push({
          start: currentSlot,
          end: slotEnd,
          jobId: overlappingJob.id,
          jobNumber: overlappingJob.number,
          jobTitle: overlappingJob.title,
          type: 'SCHEDULED',
        });
      } else {
        timeSlots.push({
          start: currentSlot,
          end: slotEnd,
          type: 'AVAILABLE',
        });
      }

      currentSlot = slotEnd;
    }

    return {
      success: true,
      data: {
        date,
        jobs,
        timeSlots,
      },
    };
  }

  /**
   * Suggest optimal time slot based on technician availability
   */
  async suggestTimeSlot(
    tenantId: string,
    technicianId: string,
    duration: number, // in hours
    preferredDate: string
  ) {
    const date = new Date(preferredDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    // Get all jobs for the day
    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        assignedTechnicianId: technicianId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    // Find gaps in schedule
    const suggestions = [];
    let currentTime = new Date(startOfDay);
    const durationMs = duration * 60 * 60 * 1000;

    for (const job of jobs) {
      const jobStart = new Date(job.scheduledStart);
      const gap = jobStart.getTime() - currentTime.getTime();

      if (gap >= durationMs) {
        suggestions.push({
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + durationMs),
          available: true,
        });
      }

      currentTime = new Date(job.scheduledEnd);
    }

    // Check if there's time at the end of the day
    const remainingTime = endOfDay.getTime() - currentTime.getTime();
    if (remainingTime >= durationMs) {
      suggestions.push({
        startTime: new Date(currentTime),
        endTime: new Date(currentTime.getTime() + durationMs),
        available: true,
      });
    }

    return {
      success: true,
      data: {
        date: preferredDate,
        duration,
        suggestions,
        hasAvailability: suggestions.length > 0,
      },
    };
  }
}
