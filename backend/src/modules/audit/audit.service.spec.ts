import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    getTenantId: jest.fn(),
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an audit log entry', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';
      const action = 'CREATE';
      const entity = 'Customer';
      const entityId = 'customer-789';
      const payload = { name: 'Test Customer' };
      const ip = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      mockPrismaService.getTenantId.mockReturnValue(tenantId);
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-log-1',
        tenantId,
        userId,
        action,
        entity,
        entityId,
        payload,
        ip,
        userAgent,
        createdAt: new Date(),
      });

      const result = await service.create({
        userId,
        action,
        entity,
        entityId,
        payload,
        ip,
        userAgent,
      });

      expect(mockPrismaService.getTenantId).toHaveBeenCalled();
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          userId,
          action,
          entity,
          entityId,
          payload,
          ip,
          userAgent,
        },
      });
      expect(result).toHaveProperty('id');
      expect(result.action).toBe(action);
      expect(result.entity).toBe(entity);
    });

    it('should handle missing optional fields', async () => {
      const tenantId = 'tenant-123';
      const action = 'DELETE';
      const entity = 'Job';

      mockPrismaService.getTenantId.mockReturnValue(tenantId);
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-log-2',
        tenantId,
        userId: undefined,
        action,
        entity,
        entityId: undefined,
        payload: {},
        ip: undefined,
        userAgent: undefined,
        createdAt: new Date(),
      });

      const result = await service.create({
        action,
        entity,
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          userId: undefined,
          action,
          entity,
          entityId: undefined,
          payload: {},
          ip: undefined,
          userAgent: undefined,
        },
      });
      expect(result.action).toBe(action);
    });

    it('should use empty string if tenantId is null', async () => {
      mockPrismaService.getTenantId.mockReturnValue(null);
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-log-3',
        tenantId: '',
        action: 'UPDATE',
        entity: 'Quote',
        createdAt: new Date(),
      });

      await service.create({
        action: 'UPDATE',
        entity: 'Quote',
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: '',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should find all audit logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          tenantId: 'tenant-123',
          action: 'CREATE',
          entity: 'Customer',
          entityId: 'customer-1',
          payload: {},
          createdAt: new Date(),
          user: {
            id: 'user-1',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
          },
        },
        {
          id: 'log-2',
          tenantId: 'tenant-123',
          action: 'UPDATE',
          entity: 'Job',
          entityId: 'job-1',
          payload: {},
          createdAt: new Date(),
          user: {
            id: 'user-1',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
          },
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(2);

      const result = await service.findAll({ skip: 0, take: 50 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by userId', async () => {
      const userId = 'user-456';
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findAll({ userId, skip: 0, take: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
    });

    it('should filter by action', async () => {
      const action = 'DELETE';
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findAll({ action, skip: 0, take: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { action },
        }),
      );
    });

    it('should filter by entity and entityId', async () => {
      const entity = 'Customer';
      const entityId = 'customer-123';
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findAll({ entity, entityId, skip: 0, take: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entity, entityId },
        }),
      );
    });

    it('should filter by date range', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-12-31';
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findAll({ startDate, endDate, skip: 0, take: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        }),
      );
    });

    it('should calculate hasMore correctly', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(100);

      const result = await service.findAll({ skip: 0, take: 50 });

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  describe('findByEntity', () => {
    it('should find audit logs for a specific entity', async () => {
      const entity = 'Job';
      const entityId = 'job-123';
      const mockLogs = [
        {
          id: 'log-1',
          entity,
          entityId,
          action: 'CREATE',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            email: 'tech@test.com',
            firstName: 'Tech',
            lastName: 'User',
            role: 'TECHNICIAN',
          },
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const result = await service.findByEntity(entity, entityId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].entity).toBe(entity);
      expect(result.data[0].entityId).toBe(entityId);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { entity, entityId },
        skip: 0,
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should handle pagination for entity logs', async () => {
      const entity = 'Quote';
      const entityId = 'quote-456';
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(50);

      const result = await service.findByEntity(entity, entityId, 20, 10);

      expect(result.pagination.skip).toBe(20);
      expect(result.pagination.take).toBe(10);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.hasMore).toBe(true);
    });
  });
});
