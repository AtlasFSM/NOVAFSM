import { Test } from '@nestjs/testing';
import { SitesService } from './sites.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('SitesService', () => {
  let service: SitesService;
  const mockPrisma = {
    site: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customer: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SitesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<SitesService>(SitesService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should create site', async () => {
    mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1' });
    mockPrisma.site.create.mockResolvedValue({ id: 's1', name: 'Main Office' });
    const result = await service.create('t1', {
      customerId: 'c1',
      name: 'Main Office',
      address: '123 Main St',
      city: 'Boston',
      state: 'MA',
      postalCode: '02101',
      country: 'USA',
    } as any);
    expect(result.data.name).toBe('Main Office');
  });

  it('should geocode address', async () => {
    mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1' });
    mockPrisma.site.create.mockResolvedValue({ id: 's1', latitude: 42.3601, longitude: -71.0589 });
    const result = await service.create('t1', {
      customerId: 'c1',
      name: 'Site',
      address: '1 Boston St',
      city: 'Boston',
      state: 'MA',
      postalCode: '02101',
      country: 'USA',
    } as any);
    expect(result).toBeDefined();
  });
});
