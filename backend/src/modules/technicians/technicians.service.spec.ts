import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

describe('TechniciansService', () => {
  let service: TechniciansService;
  let prisma: PrismaService;

  const mockPrismaService = {
    technician: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    job: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechniciansService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TechniciansService>(TechniciansService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all technicians for a tenant with job counts', async () => {
      const tenantId = 'tenant-123';
      const mockTechnicians = [
        {
          id: 'tech-1',
          tenantId,
          userId: 'user-1',
          skills: ['HVAC', 'Electrical'],
          certifications: ['Red Seal'],
          availability: {},
          currentLocation: null,
          status: 'AVAILABLE',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1-555-0123',
          },
        },
      ];

      mockPrismaService.technician.findMany.mockResolvedValue(mockTechnicians);
      mockPrismaService.job.count
        .mockResolvedValueOnce(2) // active jobs
        .mockResolvedValueOnce(145); // completed jobs

      const result = await service.findAll(tenantId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe('John');
      expect(result.data[0].activeJobsCount).toBe(2);
      expect(result.data[0].completedJobsCount).toBe(145);
      expect(mockPrismaService.technician.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('findOne', () => {
    it('should return a single technician with job counts', async () => {
      const tenantId = 'tenant-123';
      const techId = 'tech-1';
      const mockTechnician = {
        id: techId,
        tenantId,
        userId: 'user-1',
        skills: ['HVAC'],
        certifications: ['Red Seal'],
        availability: {},
        currentLocation: null,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
        },
      };

      mockPrismaService.technician.findFirst.mockResolvedValue(mockTechnician);
      mockPrismaService.job.count
        .mockResolvedValueOnce(1) // active jobs
        .mockResolvedValueOnce(50); // completed jobs

      const result = await service.findOne(techId, tenantId);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(techId);
      expect(result.data.firstName).toBe('John');
      expect(result.data.activeJobsCount).toBe(1);
      expect(result.data.completedJobsCount).toBe(50);
    });

    it('should throw NotFoundException if technician not found', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new technician', async () => {
      const tenantId = 'tenant-123';
      const dto: CreateTechnicianDto = {
        userId: 'user-1',
        skills: ['HVAC', 'Electrical'],
        certifications: ['Red Seal'],
        availability: {},
        status: 'AVAILABLE',
      };

      const mockUser = {
        id: 'user-1',
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockTechnician = {
        id: 'tech-1',
        tenantId,
        userId: dto.userId,
        skills: dto.skills,
        certifications: dto.certifications,
        availability: dto.availability,
        currentLocation: null,
        status: dto.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
        },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.technician.findFirst.mockResolvedValue(null);
      mockPrismaService.technician.create.mockResolvedValue(mockTechnician);

      const result = await service.create(dto, tenantId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Technician created successfully');
      expect(result.data.userId).toBe(dto.userId);
      expect(mockPrismaService.technician.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const dto: CreateTechnicianDto = {
        userId: 'non-existent-user',
        skills: [],
        certifications: [],
        availability: {},
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if technician already exists', async () => {
      const dto: CreateTechnicianDto = {
        userId: 'user-1',
        skills: [],
        certifications: [],
        availability: {},
      };

      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.technician.findFirst.mockResolvedValue({
        id: 'existing-tech',
        userId: dto.userId,
      });

      await expect(service.create(dto, 'tenant-123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update technician details', async () => {
      const techId = 'tech-1';
      const tenantId = 'tenant-123';
      const dto: UpdateTechnicianDto = {
        skills: ['HVAC', 'Plumbing'],
        certifications: ['Red Seal', 'EPA 608'],
      };

      const existingTech = {
        id: techId,
        tenantId,
        userId: 'user-1',
        skills: ['HVAC'],
        certifications: ['Red Seal'],
      };

      const updatedTech = {
        ...existingTech,
        ...dto,
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
        },
      };

      mockPrismaService.technician.findFirst.mockResolvedValue(existingTech);
      mockPrismaService.technician.update.mockResolvedValue(updatedTech);

      const result = await service.update(techId, dto, tenantId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Technician updated successfully');
      expect(mockPrismaService.technician.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if technician not found', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', {}, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update technician status', async () => {
      const techId = 'tech-1';
      const tenantId = 'tenant-123';
      const dto: UpdateStatusDto = { status: 'ON_JOB' };

      const existingTech = {
        id: techId,
        tenantId,
        userId: 'user-1',
        status: 'AVAILABLE',
      };

      const updatedTech = {
        ...existingTech,
        status: dto.status,
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
        },
      };

      mockPrismaService.technician.findFirst.mockResolvedValue(existingTech);
      mockPrismaService.technician.update.mockResolvedValue(updatedTech);

      const result = await service.updateStatus(techId, dto, tenantId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Technician status updated successfully');
      expect(mockPrismaService.technician.update).toHaveBeenCalledWith({
        where: { id: techId },
        data: { status: dto.status },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if technician not found', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent-id', { status: 'ON_JOB' }, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a technician with no active jobs', async () => {
      const techId = 'tech-1';
      const tenantId = 'tenant-123';

      const existingTech = {
        id: techId,
        tenantId,
        userId: 'user-1',
      };

      mockPrismaService.technician.findFirst.mockResolvedValue(existingTech);
      mockPrismaService.job.count.mockResolvedValue(0); // no active jobs
      mockPrismaService.technician.delete.mockResolvedValue(existingTech);

      const result = await service.delete(techId, tenantId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Technician deleted successfully');
      expect(mockPrismaService.technician.delete).toHaveBeenCalledWith({
        where: { id: techId },
      });
    });

    it('should throw NotFoundException if technician not found', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);

      await expect(service.delete('non-existent-id', 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if technician has active jobs', async () => {
      const techId = 'tech-1';
      const tenantId = 'tenant-123';

      const existingTech = {
        id: techId,
        tenantId,
        userId: 'user-1',
      };

      mockPrismaService.technician.findFirst.mockResolvedValue(existingTech);
      mockPrismaService.job.count.mockResolvedValue(3); // has active jobs

      await expect(service.delete(techId, tenantId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.delete(techId, tenantId)).rejects.toThrow(
        /Cannot delete technician with 3 active job/,
      );
    });
  });
});
