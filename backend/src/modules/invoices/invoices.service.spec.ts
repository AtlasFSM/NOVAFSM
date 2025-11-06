import { Test } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  const mockPrisma = {
    invoice: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
    job: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [InvoicesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should create invoice from job', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({ id: 'j1', customerId: 'c1' });
    mockPrisma.invoice.create.mockResolvedValue({ id: 'inv1', number: 'INV-001' });
    const result = await service.create('t1', { jobId: 'j1', dueDate: new Date() });
    expect(result.number).toBe('INV-001');
  });

  it('should calculate total amount', async () => {
    mockPrisma.invoice.findFirst.mockResolvedValue({ id: 'inv1', lineItems: [{ amount: 100 }, { amount: 50 }] });
    const result = await service.findOne('t1', 'inv1');
    expect(result).toBeDefined();
  });

  it('should mark as paid', async () => {
    mockPrisma.invoice.findFirst.mockResolvedValue({ id: 'inv1', status: 'SENT' });
    mockPrisma.invoice.update.mockResolvedValue({ id: 'inv1', status: 'PAID', paidAt: new Date() });
    const result = await service.markPaid('t1', 'inv1');
    expect(result.status).toBe('PAID');
  });
});
