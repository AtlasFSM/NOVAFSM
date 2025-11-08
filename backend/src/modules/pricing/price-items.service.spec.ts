import { Test } from '@nestjs/testing';
import { PriceItemsService } from './price-items.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PriceItemsService', () => {
  let service: PriceItemsService;
  const mockPrisma = {
    priceItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PriceItemsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<PriceItemsService>(PriceItemsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should create price item', async () => {
    mockPrisma.priceItem.create.mockResolvedValue({ id: 'p1', code: 'LABOR-001', unitPrice: 75.0 });
    const result = await service.create('t1', {
      code: 'LABOR-001',
      name: 'Labor Hour',
      unitPrice: 75.0,
      category: 'LABOR',
    });
    expect(result.code).toBe('LABOR-001');
  });

  it('should find all active price items', async () => {
    mockPrisma.priceItem.findMany.mockResolvedValue([{ id: 'p1', active: true }]);
    mockPrisma.priceItem.count.mockResolvedValue(1);
    const result = await service.findAll('t1', { active: true });
    expect(result.data.length).toBe(1);
  });
});
