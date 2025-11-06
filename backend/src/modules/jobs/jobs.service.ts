import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SequenceService } from '../../common/services/sequence.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { AssignJobDto } from './dto/assign-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { StartJobDto } from './dto/start-job.dto';
import { CompleteJobDto } from './dto/complete-job.dto';

/**
 * Jobs/Work Orders Service
 * Manages job lifecycle: create, assign, start, complete, cancel
 */
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  /**
   * Find all jobs with pagination and filters
   */
  async findAll(query: QueryJobsDto) {
    const { status, assignedTechnicianId, customerId, from, to, page = 1, limit = 20 } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (assignedTechnicianId) {
      where.assignedTechnicianId = assignedTechnicianId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (from || to) {
      where.scheduledStart = {};
      if (from) {
        where.scheduledStart.gte = new Date(from);
      }
      if (to) {
        where.scheduledStart.lte = new Date(to);
      }
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          site: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
          assignedTechnician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          quote: {
            select: {
              id: true,
              number: true,
              total: true,
            },
          },
        },
        orderBy: [
          { scheduledStart: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one job by ID with related data
   */
  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        site: true,
        quote: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        timeEntries: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        expenseEntries: {
          orderBy: { expenseDate: 'desc' },
          take: 10,
        },
        inventoryUsages: {
          include: {
            item: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  /**
   * Create a new job
   * Auto-generates job number J-YYYY-######
   * Optionally creates from a quote
   */
  async create(dto: CreateJobDto, tenantId: string) {
    // Generate job number
    const number = await this.sequenceService.getNext('JOB', 'J');

    // If created from quote, validate quote exists
    if (dto.quoteId) {
      const quote = await this.prisma.quote.findUnique({
        where: { id: dto.quoteId },
      });

      if (!quote) {
        throw new NotFoundException(`Quote with ID ${dto.quoteId} not found`);
      }

      if (quote.status !== 'APPROVED') {
        throw new BadRequestException('Can only create jobs from approved quotes');
      }
    }

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // If technician assigned, check for schedule conflicts
    if (dto.assignedTechnicianId && dto.scheduledStart && dto.scheduledEnd) {
      const hasConflict = await this.checkScheduleConflict(
        dto.assignedTechnicianId,
        new Date(dto.scheduledStart),
        new Date(dto.scheduledEnd),
      );

      if (hasConflict) {
        throw new ConflictException(
          'Technician has a conflicting job in this time slot',
        );
      }
    }

    // Calculate SLA due date if slaMinutes provided
    let slaDueAt: Date | null = null;
    if (dto.slaMinutes && dto.scheduledStart) {
      slaDueAt = new Date(
        new Date(dto.scheduledStart).getTime() + dto.slaMinutes * 60000,
      );
    }

    const job = await this.prisma.job.create({
      data: {
        number,
        tenantId,
        customerId: dto.customerId,
        siteId: dto.siteId,
        quoteId: dto.quoteId,
        title: dto.title,
        description: dto.description,
        status: dto.status || 'DRAFT',
        priority: dto.priority || 'MEDIUM',
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        assignedTechnicianId: dto.assignedTechnicianId,
        slaMinutes: dto.slaMinutes,
        slaDueAt,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
      },
      include: {
        customer: true,
        site: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Created job ${job.number} (ID: ${job.id})`);

    return job;
  }

  /**
   * Update a job with optimistic locking
   */
  async update(id: string, dto: UpdateJobDto, currentVersion: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Optimistic locking check
    if (job.version !== currentVersion) {
      throw new ConflictException(
        `Job has been modified by another user. Current version: ${job.version}, provided: ${currentVersion}`,
      );
    }

    // If technician assigned, check for schedule conflicts
    if (dto.assignedTechnicianId && dto.scheduledStart && dto.scheduledEnd) {
      const hasConflict = await this.checkScheduleConflict(
        dto.assignedTechnicianId,
        new Date(dto.scheduledStart),
        new Date(dto.scheduledEnd),
        id, // Exclude current job from conflict check
      );

      if (hasConflict) {
        throw new ConflictException(
          'Technician has a conflicting job in this time slot',
        );
      }
    }

    // Calculate SLA due date if slaMinutes provided
    let slaDueAt: Date | undefined | null = undefined;
    if (dto.slaMinutes !== undefined) {
      const startDate = dto.scheduledStart
        ? new Date(dto.scheduledStart)
        : job.scheduledStart;
      if (startDate && dto.slaMinutes) {
        slaDueAt = new Date(startDate.getTime() + dto.slaMinutes * 60000);
      } else {
        slaDueAt = null;
      }
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        ...dto,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : undefined,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
        slaDueAt,
        version: {
          increment: 1,
        },
      },
      include: {
        customer: true,
        site: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Updated job ${updatedJob.number} (ID: ${id})`);

    return updatedJob;
  }

  /**
   * Delete a job
   */
  async delete(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Prevent deletion of completed jobs
    if (job.status === 'COMPLETED') {
      throw new BadRequestException('Cannot delete completed jobs');
    }

    await this.prisma.job.delete({
      where: { id },
    });

    this.logger.log(`Deleted job ${job.number} (ID: ${id})`);

    return { message: 'Job deleted successfully' };
  }

  /**
   * Assign a technician to a job
   * Emits WebSocket event
   */
  async assign(id: string, dto: AssignJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Validate technician exists and has role TECHNICIAN
    const technician = await this.prisma.user.findUnique({
      where: { id: dto.technicianId },
    });

    if (!technician) {
      throw new NotFoundException(`Technician with ID ${dto.technicianId} not found`);
    }

    if (technician.role !== 'TECHNICIAN') {
      throw new BadRequestException('User is not a technician');
    }

    // Check for schedule conflicts
    if (dto.scheduledStart && dto.scheduledEnd) {
      const hasConflict = await this.checkScheduleConflict(
        dto.technicianId,
        new Date(dto.scheduledStart),
        new Date(dto.scheduledEnd),
        id,
      );

      if (hasConflict) {
        throw new ConflictException(
          'Technician has a conflicting job in this time slot',
        );
      }
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        assignedTechnicianId: dto.technicianId,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : undefined,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
        status: 'SCHEDULED',
        version: {
          increment: 1,
        },
      },
      include: {
        customer: true,
        site: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Assigned technician ${dto.technicianId} to job ${job.number} (ID: ${id})`,
    );

    return updatedJob;
  }

  /**
   * Start a job (change status to IN_PROGRESS)
   * Records check-in location
   */
  async start(id: string, dto: StartJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status !== 'SCHEDULED') {
      throw new BadRequestException(
        `Cannot start job with status ${job.status}. Job must be in SCHEDULED status.`,
      );
    }

    if (!job.assignedTechnicianId) {
      throw new BadRequestException('Cannot start job without assigned technician');
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date(),
        checkInLocation: dto.checkInLocation || null,
        version: {
          increment: 1,
        },
      },
      include: {
        customer: true,
        site: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Started job ${job.number} (ID: ${id})`);

    return updatedJob;
  }

  /**
   * Complete a job (change status to COMPLETED)
   * Records check-out location
   */
  async complete(id: string, dto: CompleteJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Cannot complete job with status ${job.status}. Job must be in IN_PROGRESS status.`,
      );
    }

    const now = new Date();

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEnd: now,
        completedAt: now,
        checkOutLocation: dto.checkOutLocation || null,
        notes: dto.notes ? `${job.notes || ''}\n\n${dto.notes}`.trim() : undefined,
        version: {
          increment: 1,
        },
      },
      include: {
        customer: true,
        site: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Completed job ${job.number} (ID: ${id})`);

    return updatedJob;
  }

  /**
   * Cancel a job
   */
  async cancel(id: string, reason?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed jobs');
    }

    if (job.status === 'CANCELLED') {
      throw new BadRequestException('Job is already cancelled');
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        internalNotes: reason
          ? `${job.internalNotes || ''}\n\nCancellation reason: ${reason}`.trim()
          : undefined,
        version: {
          increment: 1,
        },
      },
      include: {
        customer: true,
        site: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Cancelled job ${job.number} (ID: ${id})`);

    return updatedJob;
  }

  /**
   * Check if technician has schedule conflict for a time slot
   */
  async checkScheduleConflict(
    technicianId: string,
    startTime: Date,
    endTime: Date,
    excludeJobId?: string,
  ): Promise<boolean> {
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

    if (conflictingJobs.length > 0) {
      this.logger.warn(
        `Schedule conflict found for technician ${technicianId}: ${conflictingJobs.map((j: any) => j.number).join(', ')}`,
      );
      return true;
    }

    return false;
  }
}
