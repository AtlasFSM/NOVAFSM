import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from './outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('OutboxService', () => {
  let service: OutboxService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    getTenantId: jest.fn(),
    outboxEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an outbox event', async () => {
      const tenantId = 'tenant-123';
      const eventType = 'job.created';
      const payload = { jobId: 'job-456', status: 'SCHEDULED' };
      const aggregateId = 'job-456';

      mockPrismaService.getTenantId.mockReturnValue(tenantId);
      mockPrismaService.outboxEvent.create.mockResolvedValue({
        id: 'event-1',
        tenantId,
        eventType,
        aggregateId,
        payload,
        status: 'PENDING',
        createdAt: new Date(),
        processedAt: null,
      });

      const result = await service.create({
        eventType,
        aggregateId,
        payload,
      });

      expect(mockPrismaService.getTenantId).toHaveBeenCalled();
      expect(mockPrismaService.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          eventType,
          aggregateId,
          payload,
          status: 'PENDING',
        },
      });
      expect(result.eventType).toBe(eventType);
      expect(result.status).toBe('PENDING');
    });

    it('should handle missing tenantId', async () => {
      mockPrismaService.getTenantId.mockReturnValue(null);
      mockPrismaService.outboxEvent.create.mockResolvedValue({
        id: 'event-2',
        tenantId: '',
        eventType: 'test.event',
        status: 'PENDING',
        createdAt: new Date(),
      });

      const result = await service.create({
        eventType: 'test.event',
        aggregateId: 'test-123',
        payload: {},
      });

      expect(mockPrismaService.outboxEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: '',
          }),
        }),
      );
    });
  });

  describe('findPending', () => {
    it('should find pending outbox events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          tenantId: 'tenant-123',
          eventType: 'quote.approved',
          aggregateId: 'quote-1',
          payload: {},
          status: 'PENDING',
          createdAt: new Date(),
          processedAt: null,
        },
        {
          id: 'event-2',
          tenantId: 'tenant-123',
          eventType: 'job.completed',
          aggregateId: 'job-1',
          payload: {},
          status: 'PENDING',
          createdAt: new Date(),
          processedAt: null,
        },
      ];

      mockPrismaService.outboxEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.findPending(10);

      expect(mockPrismaService.outboxEvent.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
        },
        take: 10,
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('PENDING');
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.outboxEvent.findMany.mockResolvedValue([]);

      await service.findPending(5);

      expect(mockPrismaService.outboxEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe('markAsProcessed', () => {
    it('should mark event as processed', async () => {
      const eventId = 'event-123';
      const processedAt = new Date();

      mockPrismaService.outboxEvent.update.mockResolvedValue({
        id: eventId,
        status: 'PROCESSED',
        processedAt,
      });

      const result = await service.markAsProcessed(eventId);

      expect(mockPrismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: {
          status: 'PROCESSED',
          processedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('PROCESSED');
    });
  });

  describe('markAsFailed', () => {
    it('should mark event as failed with error', async () => {
      const eventId = 'event-456';
      const error = 'Failed to send webhook';

      mockPrismaService.outboxEvent.update.mockResolvedValue({
        id: eventId,
        status: 'FAILED',
        error,
      });

      const result = await service.markAsFailed(eventId, error);

      expect(mockPrismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: {
          status: 'FAILED',
          error,
        },
      });
      expect(result.status).toBe('FAILED');
      expect(result.error).toBe(error);
    });
  });

  describe('deleteProcessed', () => {
    it('should delete old processed events', async () => {
      const beforeDate = new Date('2025-01-01');

      mockPrismaService.outboxEvent.delete.mockResolvedValue({ count: 15 });

      await service.deleteProcessed(beforeDate);

      expect(mockPrismaService.outboxEvent.delete).toHaveBeenCalledWith({
        where: {
          status: 'PROCESSED',
          processedAt: {
            lt: beforeDate,
          },
        },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return event statistics', async () => {
      mockPrismaService.outboxEvent.count.mockImplementation((args: any) => {
        if (args?.where?.status === 'PENDING') return Promise.resolve(5);
        if (args?.where?.status === 'PROCESSED') return Promise.resolve(100);
        if (args?.where?.status === 'FAILED') return Promise.resolve(2);
        return Promise.resolve(107);
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        pending: 5,
        processed: 100,
        failed: 2,
        total: 107,
      });
    });
  });
});
