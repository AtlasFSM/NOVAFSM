import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetCategory, AssetStatus } from './dto/create-asset.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AssetsService', () => {
  let service: AssetsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    asset: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    job: {
      findFirst: jest.fn(),
    },
    site: {
      findFirst: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new asset', async () => {
      const tenantId = 'tenant-1';
      const dto = {
        category: AssetCategory.HEAVY_EQUIPMENT,
        name: 'Excavator CAT 320',
        serialNumber: 'SN-001',
        model: 'CAT 320 GC',
        vendor: 'Caterpillar',
      };

      const mockAsset = {
        id: 'asset-1',
        tenantId,
        ...dto,
        status: AssetStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.asset.create.mockResolvedValue(mockAsset);

      const result = await service.create(tenantId, dto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAsset);
      expect(mockPrismaService.asset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          category: dto.category,
          name: dto.name,
          status: AssetStatus.AVAILABLE,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return all assets for a tenant', async () => {
      const tenantId = 'tenant-1';
      const mockAssets = [
        {
          id: 'asset-1',
          tenantId,
          name: 'Excavator',
          category: AssetCategory.HEAVY_EQUIPMENT,
          status: AssetStatus.AVAILABLE,
        },
        {
          id: 'asset-2',
          tenantId,
          name: 'Truck',
          category: AssetCategory.VEHICLE,
          status: AssetStatus.IN_USE,
        },
      ];

      mockPrismaService.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.findAll(tenantId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAssets);
      expect(result.meta.total).toBe(2);
    });

    it('should filter assets by status', async () => {
      const tenantId = 'tenant-1';
      const filters = { status: AssetStatus.AVAILABLE };
      const mockAssets = [
        {
          id: 'asset-1',
          tenantId,
          name: 'Excavator',
          status: AssetStatus.AVAILABLE,
        },
      ];

      mockPrismaService.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.findAll(tenantId, filters);

      expect(result.success).toBe(true);
      expect(mockPrismaService.asset.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ status: AssetStatus.AVAILABLE }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return an asset by ID', async () => {
      const tenantId = 'tenant-1';
      const assetId = 'asset-1';
      const mockAsset = {
        id: assetId,
        tenantId,
        name: 'Excavator',
        category: AssetCategory.HEAVY_EQUIPMENT,
        status: AssetStatus.AVAILABLE,
      };

      mockPrismaService.asset.findFirst.mockResolvedValue(mockAsset);

      const result = await service.findOne(tenantId, assetId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAsset);
    });

    it('should throw NotFoundException when asset not found', async () => {
      mockPrismaService.asset.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an asset', async () => {
      const tenantId = 'tenant-1';
      const assetId = 'asset-1';
      const dto = { name: 'Updated Name', status: AssetStatus.MAINTENANCE };

      const existingAsset = {
        id: assetId,
        tenantId,
        name: 'Old Name',
        status: AssetStatus.AVAILABLE,
      };

      const updatedAsset = { ...existingAsset, ...dto };

      mockPrismaService.asset.findFirst.mockResolvedValue(existingAsset);
      mockPrismaService.asset.update.mockResolvedValue(updatedAsset);

      const result = await service.update(tenantId, assetId, dto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
      expect(result.data.status).toBe(AssetStatus.MAINTENANCE);
    });
  });

  describe('remove', () => {
    it('should delete an asset', async () => {
      const tenantId = 'tenant-1';
      const assetId = 'asset-1';
      const mockAsset = {
        id: assetId,
        tenantId,
        status: AssetStatus.AVAILABLE,
      };

      mockPrismaService.asset.findFirst.mockResolvedValue(mockAsset);
      mockPrismaService.asset.delete.mockResolvedValue(mockAsset);

      const result = await service.remove(tenantId, assetId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');
    });

    it('should throw BadRequestException when asset is in use', async () => {
      const mockAsset = {
        id: 'asset-1',
        tenantId: 'tenant-1',
        status: AssetStatus.IN_USE,
      };

      mockPrismaService.asset.findFirst.mockResolvedValue(mockAsset);

      await expect(service.remove('tenant-1', 'asset-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('assign', () => {
    it('should assign asset to a job', async () => {
      const tenantId = 'tenant-1';
      const assetId = 'asset-1';
      const dto = {
        assignedToType: 'JOB' as any,
        assignedToId: 'job-1',
      };

      const mockAsset = {
        id: assetId,
        tenantId,
        status: AssetStatus.AVAILABLE,
        usageHistory: [],
      };

      const updatedAsset = {
        ...mockAsset,
        status: AssetStatus.IN_USE,
        assignedToType: dto.assignedToType,
        assignedToId: dto.assignedToId,
        jobId: dto.assignedToId,
      };

      mockPrismaService.asset.findFirst.mockResolvedValue(mockAsset);
      mockPrismaService.job.findFirst.mockResolvedValue({ id: 'job-1' });
      mockPrismaService.asset.update.mockResolvedValue(updatedAsset);

      const result = await service.assign(tenantId, assetId, dto);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(AssetStatus.IN_USE);
      expect(result.message).toContain('assigned');
    });
  });
});
