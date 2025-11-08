import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface ScheduleConflict {
  jobId: string;
  jobNumber: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}

export interface TechnicianSchedule {
  technicianId: string;
  technicianName: string;
  jobs: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    priority: string;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    customer: {
      id: string;
      name: string;
    };
    site: {
      id: string;
      name: string | null;
      address: string;
    } | null;
  }>;
  conflicts: ScheduleConflict[];
}

/**
 * Schedule Service
 * Manages technician schedules and conflict detection
 */
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get schedule for a technician within a date range
   * Includes conflict detection
   */
  async getSchedule(technicianId: string, from: Date, to: Date): Promise<TechnicianSchedule> {
    // Get technician details
    const technician = await this.prisma.user.findUnique({
      where: { id: technicianId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!technician) {
      throw new Error(`Technician with ID ${technicianId} not found`);
    }

    if (technician.role !== 'TECHNICIAN') {
      throw new Error(`User ${technicianId} is not a technician`);
    }

    // Get all jobs for technician in the date range
    const jobs = await this.prisma.job.findMany({
      where: {
        assignedTechnicianId: technicianId,
        scheduledStart: {
          gte: from,
          lte: to,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'],
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

    // Detect conflicts
    const conflicts = this.detectConflicts(jobs);

    const technicianName = [technician.firstName || '', technician.lastName || ''].join(' ').trim();

    return {
      technicianId: technician.id,
      technicianName,
      jobs: jobs.map((job: any) => ({
        id: job.id,
        number: job.number,
        title: job.title,
        status: job.status,
        priority: job.priority,
        scheduledStart: job.scheduledStart,
        scheduledEnd: job.scheduledEnd,
        customer: job.customer,
        site: job.site,
      })),
      conflicts,
    };
  }

  /**
   * Check for time overlaps between jobs
   */
  checkConflicts(
    technicianId: string,
    startTime: Date,
    endTime: Date,
    excludeJobId?: string,
  ): Promise<ScheduleConflict[]> {
    return this.getConflicts(technicianId, startTime, endTime, excludeJobId);
  }

  /**
   * Get conflicting jobs for a technician in a time slot
   */
  private async getConflicts(
    technicianId: string,
    startTime: Date,
    endTime: Date,
    excludeJobId?: string,
  ): Promise<ScheduleConflict[]> {
    const where: any = {
      assignedTechnicianId: technicianId,
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS'],
      },
      OR: [
        {
          // Overlapping: new job starts during existing job
          scheduledStart: {
            lte: startTime,
          },
          scheduledEnd: {
            gte: startTime,
          },
        },
        {
          // Overlapping: new job ends during existing job
          scheduledStart: {
            lte: endTime,
          },
          scheduledEnd: {
            gte: endTime,
          },
        },
        {
          // Overlapping: new job completely contains existing job
          scheduledStart: {
            gte: startTime,
          },
          scheduledEnd: {
            lte: endTime,
          },
        },
      ],
    };

    if (excludeJobId) {
      where.id = {
        not: excludeJobId,
      };
    }

    const conflictingJobs = await this.prisma.job.findMany({
      where,
      select: {
        id: true,
        number: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    return conflictingJobs
      .filter((job: any) => job.scheduledStart && job.scheduledEnd)
      .map((job: any) => ({
        jobId: job.id,
        jobNumber: job.number,
        scheduledStart: job.scheduledStart!,
        scheduledEnd: job.scheduledEnd!,
      }));
  }

  /**
   * Detect overlapping time slots in a list of jobs
   */
  private detectConflicts(
    jobs: Array<{
      id: string;
      number: string;
      scheduledStart: Date | null;
      scheduledEnd: Date | null;
    }>,
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Sort jobs by start time
    const sortedJobs = [...jobs]
      .filter((j) => j.scheduledStart && j.scheduledEnd)
      .sort((a, b) => (a.scheduledStart?.getTime() || 0) - (b.scheduledStart?.getTime() || 0));

    // Check each pair of adjacent jobs for overlap
    for (let i = 0; i < sortedJobs.length - 1; i++) {
      const currentJob = sortedJobs[i];
      const nextJob = sortedJobs[i + 1];

      if (
        currentJob.scheduledEnd &&
        nextJob.scheduledStart &&
        currentJob.scheduledEnd > nextJob.scheduledStart
      ) {
        conflicts.push({
          jobId: nextJob.id,
          jobNumber: nextJob.number,
          scheduledStart: nextJob.scheduledStart,
          scheduledEnd: nextJob.scheduledEnd!,
        });
      }
    }

    if (conflicts.length > 0) {
      this.logger.warn(
        `Found ${conflicts.length} scheduling conflicts: ${conflicts.map((c) => c.jobNumber).join(', ')}`,
      );
    }

    return conflicts;
  }

  /**
   * Get all technicians with their availability
   */
  async getTechniciansAvailability(from: Date, to: Date) {
    const technicians = await this.prisma.user.findMany({
      where: {
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

    const schedules = await Promise.all(
      technicians.map((tech: any) => this.getSchedule(tech.id, from, to)),
    );

    return schedules;
  }
}
