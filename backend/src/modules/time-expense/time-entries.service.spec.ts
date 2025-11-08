// @ts-nocheck
import { Test } from '@nestjs/testing';
import { TimeEntriesService } from './time-entries.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;
  const mockPrisma = {
    timeEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    job: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TimeEntriesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<TimeEntriesService>(TimeEntriesService);
  });

  it('should be defined', () => expect(service).toBeDefined());
  it('should create time entry', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({ id: 'j1' });
    mockPrisma.timeEntry.create.mockResolvedValue({
      id: 't1',
      jobId: 'j1',
      startTime: new Date(),
      endTime: null,
    });
    const result = await service.create('tenant1', {
      jobId: 'j1',
      type: 'REGULAR',
      startTime: new Date().toISOString(),
    });
    expect(result.data.jobId).toBe('j1');
  });
  it('should calculate duration', async () => {
    const start = new Date('2025-01-01T09:00:00');
    const end = new Date('2025-01-01T17:00:00');
    mockPrisma.timeEntry.findFirst.mockResolvedValue({ id: 't1', startTime: start, endTime: null });
    mockPrisma.timeEntry.update.mockResolvedValue({
      id: 't1',
      startTime: start,
      endTime: end,
      duration: 8 * 3600,
    });
    const result = await service.clockOut('tenant1', 't1', end);
    expect(result.duration).toBe(8 * 3600);
  });
});
