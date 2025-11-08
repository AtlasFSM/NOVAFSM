// @ts-nocheck
import { Test } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('QuotesService', () => {
  let service: QuotesService;
  const mockPrisma = {
    quote: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    customer: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [QuotesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<QuotesService>(QuotesService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should create quote', async () => {
    mockPrisma.customer.findFirst.mockResolvedValue({ id: '1' });
    mockPrisma.quote.create.mockResolvedValue({ id: 'q1', number: 'Q-001' });
    const result = await service.create('t1', { customerId: '1', validUntil: new Date() });
    expect(result.id).toBe('q1');
  });

  it('should find all quotes', async () => {
    mockPrisma.quote.findMany.mockResolvedValue([{ id: 'q1' }]);
    mockPrisma.quote.count.mockResolvedValue(1);
    const result = await service.findAll('t1', {});
    expect(result.data.length).toBe(1);
  });

  it('should approve quote', async () => {
    mockPrisma.quote.findFirst.mockResolvedValue({ id: 'q1', status: 'DRAFT' });
    mockPrisma.quote.update.mockResolvedValue({ id: 'q1', status: 'APPROVED' });
    const result = await service.approve('t1', 'q1');
    expect(result.status).toBe('APPROVED');
  });
});
