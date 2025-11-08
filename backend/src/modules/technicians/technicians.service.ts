import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const technicians = await this.prisma.technician.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get job counts for each technician
    const techniciansWithCounts = await Promise.all(
      technicians.map(async (tech) => {
        const activeJobsCount = await this.prisma.job.count({
          where: {
            tenantId,
            assignedTo: tech.userId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        });

        const completedJobsCount = await this.prisma.job.count({
          where: {
            tenantId,
            assignedTo: tech.userId,
            status: 'COMPLETED',
          },
        });

        return {
          ...tech,
          firstName: tech.user.firstName,
          lastName: tech.user.lastName,
          email: tech.user.email,
          phone: tech.user.phone,
          activeJobsCount,
          completedJobsCount,
        };
      }),
    );

    return {
      success: true,
      data: techniciansWithCounts,
    };
  }

  async findOne(id: string, tenantId: string) {
    const technician = await this.prisma.technician.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!technician) {
      throw new NotFoundException(`Technician with ID ${id} not found`);
    }

    const activeJobsCount = await this.prisma.job.count({
      where: {
        tenantId,
        assignedTo: technician.userId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    const completedJobsCount = await this.prisma.job.count({
      where: {
        tenantId,
        assignedTo: technician.userId,
        status: 'COMPLETED',
      },
    });

    return {
      success: true,
      data: {
        ...technician,
        firstName: technician.user.firstName,
        lastName: technician.user.lastName,
        email: technician.user.email,
        phone: technician.user.phone,
        activeJobsCount,
        completedJobsCount,
      },
    };
  }

  async create(dto: CreateTechnicianDto, tenantId: string) {
    // Check if user exists
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // Check if technician already exists for this user
    const existing = await this.prisma.technician.findFirst({
      where: { userId: dto.userId, tenantId },
    });

    if (existing) {
      throw new ConflictException(
        `Technician profile already exists for this user`,
      );
    }

    const technician = await this.prisma.technician.create({
      data: {
        tenantId,
        userId: dto.userId,
        skills: dto.skills || [],
        certifications: dto.certifications || [],
        availability: dto.availability || {},
        currentLocation: dto.currentLocation || null,
        status: dto.status || 'AVAILABLE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...technician,
        firstName: technician.user.firstName,
        lastName: technician.user.lastName,
        email: technician.user.email,
        phone: technician.user.phone,
      },
      message: 'Technician created successfully',
    };
  }

  async update(id: string, dto: UpdateTechnicianDto, tenantId: string) {
    const existing = await this.prisma.technician.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Technician with ID ${id} not found`);
    }

    const technician = await this.prisma.technician.update({
      where: { id },
      data: {
        skills: dto.skills,
        certifications: dto.certifications,
        availability: dto.availability,
        currentLocation: dto.currentLocation,
        status: dto.status,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...technician,
        firstName: technician.user.firstName,
        lastName: technician.user.lastName,
        email: technician.user.email,
        phone: technician.user.phone,
      },
      message: 'Technician updated successfully',
    };
  }

  async updateStatus(id: string, dto: UpdateStatusDto, tenantId: string) {
    const existing = await this.prisma.technician.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Technician with ID ${id} not found`);
    }

    const technician = await this.prisma.technician.update({
      where: { id },
      data: { status: dto.status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...technician,
        firstName: technician.user.firstName,
        lastName: technician.user.lastName,
        email: technician.user.email,
        phone: technician.user.phone,
      },
      message: 'Technician status updated successfully',
    };
  }

  async delete(id: string, tenantId: string) {
    const existing = await this.prisma.technician.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Technician with ID ${id} not found`);
    }

    // Check if technician has active jobs
    const activeJobs = await this.prisma.job.count({
      where: {
        tenantId,
        assignedTo: existing.userId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (activeJobs > 0) {
      throw new BadRequestException(
        `Cannot delete technician with ${activeJobs} active job(s)`,
      );
    }

    await this.prisma.technician.delete({ where: { id } });

    return {
      success: true,
      message: 'Technician deleted successfully',
    };
  }
}
