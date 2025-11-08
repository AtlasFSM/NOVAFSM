import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PriceListsService } from './price-lists.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('PriceListsService', () => {
  let service: PriceListsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    priceList: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PriceListsService>(PriceListsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all price lists for a tenant', async () => {
      const tenantId = 'tenant-123';
      const mockPriceLists = [
        {
          id: 'pl-1',
          tenantId,
          name: 'Standard Pricing 2024',
          currency: 'CAD',
          isDefault: true,
          status: 'ACTIVE',
        },
        {
          id: 'pl-2',
          tenantId,
          name: 'Commercial Pricing',
          currency: 'CAD',
          isDefault: false,
          status: 'ACTIVE',
        },
      ];

      mockPrismaService.priceList.findMany.mockResolvedValue(mockPriceLists);

      const result = await service.findAll(tenantId, {});

      expect(result).toEqual(mockPriceLists);
      expect(mockPrismaService.priceList.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      const tenantId = 'tenant-123';

      mockPrismaService.priceList.findMany.mockResolvedValue([]);

      await service.findAll(tenantId, { status: 'ACTIVE' });

      expect(mockPrismaService.priceList.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Price List',
      description: 'Test description',
      currency: 'CAD',
      isDefault: false,
      status: 'ACTIVE',
    };

    it('should create a new price list', async () => {
      const tenantId = 'tenant-123';
      const mockPriceList = {
        id: 'pl-new',
        tenantId,
        ...createDto,
      };

      mockPrismaService.priceList.findFirst.mockResolvedValue(null);
      mockPrismaService.priceList.create.mockResolvedValue(mockPriceList);

      const result = await service.create(tenantId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockPrismaService.priceList.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if name already exists', async () => {
      const tenantId = 'tenant-123';

      mockPrismaService.priceList.findFirst.mockResolvedValue({
        id: 'existing-pl',
        name: createDto.name,
      });

      await expect(service.create(tenantId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('setDefault', () => {
    it('should set a price list as default', async () => {
      const tenantId = 'tenant-123';
      const priceListId = 'pl-123';

      const mockPriceList = {
        id: priceListId,
        tenantId,
        name: 'Test List',
        status: 'ACTIVE',
        isDefault: false,
      };

      mockPrismaService.priceList.findUnique.mockResolvedValue(mockPriceList);
      mockPrismaService.priceList.update.mockImplementation((args) =>
        Promise.resolve({ ...mockPriceList, isDefault: args.data.isDefault }),
      );

      await service.setDefault(tenantId, priceListId);

      // Should have updated all price lists to isDefault: false
      expect(mockPrismaService.priceList.update).toHaveBeenCalledWith({
        where: { id: priceListId },
        data: { isDefault: true },
      });
    });

    it('should throw BadRequestException if price list is archived', async () => {
      const tenantId = 'tenant-123';
      const priceListId = 'pl-123';

      mockPrismaService.priceList.findUnique.mockResolvedValue({
        id: priceListId,
        tenantId,
        name: 'Test List',
        status: 'ARCHIVED',
        isDefault: false,
      });

      await expect(service.setDefault(tenantId, priceListId)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a price list with no items', async () => {
      const tenantId = 'tenant-123';
      const priceListId = 'pl-123';

      const mockPriceList = {
        id: priceListId,
        tenantId,
        name: 'Test List',
        _count: { items: 0 },
      };

      mockPrismaService.priceList.findUnique.mockResolvedValue(mockPriceList);
      mockPrismaService.priceList.delete.mockResolvedValue(mockPriceList);

      const result = await service.delete(tenantId, priceListId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.priceList.delete).toHaveBeenCalledWith({
        where: { id: priceListId },
      });
    });

    it('should throw BadRequestException if price list has items', async () => {
      const tenantId = 'tenant-123';
      const priceListId = 'pl-123';

      mockPrismaService.priceList.findUnique.mockResolvedValue({
        id: priceListId,
        tenantId,
        name: 'Test List',
        _count: { items: 5 },
      });

      await expect(service.delete(tenantId, priceListId)).rejects.toThrow();
    });
  });
});
