import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('JobsService', () => {
  let service: JobsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    quote: {
      findUnique: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    site: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new job', async () => {
      const tenantId = 'tenant-1';
      const dto = {
        customerId: 'customer-1',
        title: 'Installation Job',
        status: 'SCHEDULED' as any,
        priority: 'MEDIUM' as any,
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
      };

      const mockJob = {
        id: 'job-1',
        tenantId,
        number: 'JOB-001',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.customer.findFirst.mockResolvedValue({ id: 'customer-1' });
      mockPrismaService.job.create.mockResolvedValue(mockJob);

      const result = await service.create(tenantId, dto);

      expect(result).toBeDefined();
      expect(result.id).toBe('job-1');
      expect(mockPrismaService.job.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid customer', async () => {
      const dto = {
        customerId: 'invalid',
        title: 'Job',
        status: 'SCHEDULED' as any,
        priority: 'MEDIUM' as any,
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
      };

      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.create('tenant-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated jobs', async () => {
      const mockJobs = [
        { id: 'job-1', number: 'JOB-001', status: 'SCHEDULED' },
        { id: 'job-2', number: 'JOB-002', status: 'IN_PROGRESS' },
      ];

      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.job.count.mockResolvedValue(2);

      const result = await service.findAll('tenant-1', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockJobs);
      expect(result.meta.total).toBe(2);
    });

    it('should filter jobs by status', async () => {
      const mockJobs = [{ id: 'job-1', status: 'IN_PROGRESS' }];

      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.job.count.mockResolvedValue(1);

      await service.findAll('tenant-1', { status: 'IN_PROGRESS' });

      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_PROGRESS' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a job by ID', async () => {
      const mockJob = {
        id: 'job-1',
        number: 'JOB-001',
        tenantId: 'tenant-1',
      };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      const result = await service.findOne('tenant-1', 'job-1');

      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException when job not found', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update job status', async () => {
      const mockJob = {
        id: 'job-1',
        tenantId: 'tenant-1',
        status: 'SCHEDULED',
        version: 1,
      };

      const updatedJob = { ...mockJob, status: 'IN_PROGRESS', version: 2 };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue(updatedJob);

      const result = await service.update('tenant-1', 'job-1', {
        status: 'IN_PROGRESS',
      });

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should handle optimistic locking with version mismatch', async () => {
      const mockJob = {
        id: 'job-1',
        tenantId: 'tenant-1',
        version: 2,
      };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      await expect(service.update('tenant-1', 'job-1', { status: 'COMPLETED' }, 1)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('assign', () => {
    it('should assign technician to job', async () => {
      const mockJob = { id: 'job-1', tenantId: 'tenant-1', status: 'SCHEDULED' };
      const mockUser = { id: 'tech-1', role: 'TECHNICIAN' };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.job.update.mockResolvedValue({
        ...mockJob,
        assignedTechnicianId: 'tech-1',
      });

      const result = await service.assign('tenant-1', 'job-1', 'tech-1');

      expect(result.assignedTechnicianId).toBe('tech-1');
    });
  });

  describe('delete', () => {
    it('should soft delete a job', async () => {
      const mockJob = { id: 'job-1', tenantId: 'tenant-1', status: 'SCHEDULED' };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue({ ...mockJob, deletedAt: new Date() });

      await service.remove('tenant-1', 'job-1');

      expect(mockPrismaService.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
