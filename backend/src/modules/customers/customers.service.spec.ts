import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      const dto = { name: 'Test Customer', email: 'test@test.com' };
      const mockCustomer = { id: '1', tenantId: 'tenant-1', ...dto };
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create('tenant-1', dto);

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [{ id: '1', name: 'Customer 1' }];
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', {});

      expect(result.data).toEqual(mockCustomers);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a customer by ID', async () => {
      const mockCustomer = { id: '1', name: 'Test' };
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.findOne('tenant-1', '1');

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const mockCustomer = { id: '1', name: 'Old' };
      const updated = { ...mockCustomer, name: 'New' };
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue(updated);

      const result = await service.update('tenant-1', '1', { name: 'New' });

      expect(result.data.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      const mockCustomer = { id: '1' };
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.delete.mockResolvedValue(mockCustomer);

      await service.delete('tenant-1', '1');

      expect(mockPrismaService.customer.delete).toHaveBeenCalled();
    });
  });
});
