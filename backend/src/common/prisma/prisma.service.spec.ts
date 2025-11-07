import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  describe('tenant context', () => {
    it('should set tenant ID', () => {
      const tenantId = 'tenant-123';

      service.setTenantId(tenantId);

      expect(service.getTenantId()).toBe(tenantId);
    });

    it('should get tenant ID', () => {
      const tenantId = 'tenant-456';

      service.setTenantId(tenantId);
      const result = service.getTenantId();

      expect(result).toBe(tenantId);
    });

    it('should return null if tenant ID not set', () => {
      const result = service.getTenantId();

      expect(result).toBeNull();
    });

    it('should clear tenant ID when set to null', () => {
      service.setTenantId('tenant-789');
      expect(service.getTenantId()).toBe('tenant-789');

      service.setTenantId(null);
      expect(service.getTenantId()).toBeNull();
    });

    it('should override existing tenant ID', () => {
      service.setTenantId('tenant-old');
      expect(service.getTenantId()).toBe('tenant-old');

      service.setTenantId('tenant-new');
      expect(service.getTenantId()).toBe('tenant-new');
    });
  });

  describe('connection lifecycle', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have $connect method', () => {
      expect(service.$connect).toBeDefined();
      expect(typeof service.$connect).toBe('function');
    });

    it('should have $disconnect method', () => {
      expect(service.$disconnect).toBeDefined();
      expect(typeof service.$disconnect).toBe('function');
    });
  });

  describe('query methods', () => {
    it('should have $queryRaw method', () => {
      expect(service.$queryRaw).toBeDefined();
      expect(typeof service.$queryRaw).toBe('function');
    });

    it('should have $executeRaw method', () => {
      expect(service.$executeRaw).toBeDefined();
      expect(typeof service.$executeRaw).toBe('function');
    });

    it('should have $transaction method', () => {
      expect(service.$transaction).toBeDefined();
      expect(typeof service.$transaction).toBe('function');
    });
  });

  describe('model accessors', () => {
    it('should have access to all models', () => {
      expect(service.organization).toBeDefined();
      expect(service.user).toBeDefined();
      expect(service.customer).toBeDefined();
      expect(service.job).toBeDefined();
      expect(service.quote).toBeDefined();
      expect(service.invoice).toBeDefined();
      expect(service.asset).toBeDefined();
      expect(service.document).toBeDefined();
      expect(service.formTemplate).toBeDefined();
      expect(service.auditLog).toBeDefined();
      expect(service.outboxEvent).toBeDefined();
    });
  });
});
