import { Test } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InventoryService', () => {
  let service: InventoryService;
  const mockPrisma = {
    inventoryItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [InventoryService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => expect(service).toBeDefined());
  it('should create inventory item', async () => {
    mockPrisma.inventoryItem.create.mockResolvedValue({ id: '1', sku: 'PART-001', quantity: 100 });
    const result = await service.create('t1', { sku: 'PART-001', name: 'Part', quantity: 100 });
    expect(result.sku).toBe('PART-001');
  });
  it('should adjust stock levels', async () => {
    mockPrisma.inventoryItem.findFirst.mockResolvedValue({ id: '1', quantity: 100 });
    mockPrisma.inventoryItem.update.mockResolvedValue({ id: '1', quantity: 90 });
    const result = await service.adjustStock('t1', '1', -10);
    expect(result.quantity).toBe(90);
  });
});
