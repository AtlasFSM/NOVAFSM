import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'redis.url') return 'redis://localhost:6379';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('liveness', () => {
    it('should return OK status for liveness probe', () => {
      const result = controller.liveness();

      expect(result).toEqual({
        success: true,
        status: 'OK',
        timestamp: expect.any(String),
      });
    });
  });

  describe('readiness', () => {
    it('should return OK when all services are healthy', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await controller.readiness();

      expect(result).toEqual({
        success: true,
        status: 'OK',
        timestamp: expect.any(String),
        checks: {
          database: 'OK',
        },
      });
    });

    it('should return error when database is unhealthy', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await controller.readiness();

      expect(result.success).toBe(false);
      expect(result.status).toBe('ERROR');
      expect(result.checks.database).toBe('ERROR');
    });
  });

  describe('health', () => {
    it('should return detailed health information', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await controller.health();

      expect(result).toEqual({
        success: true,
        status: 'OK',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: expect.any(String),
        checks: {
          database: 'OK',
        },
      });
    });

    it('should include error details when checks fail', async () => {
      const dbError = new Error('Database connection timeout');
      mockPrismaService.$queryRaw.mockRejectedValue(dbError);

      const result = await controller.health();

      expect(result.success).toBe(false);
      expect(result.checks.database).toBe('ERROR');
    });
  });
});
