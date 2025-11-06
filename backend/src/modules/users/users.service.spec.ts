import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  const mockPrisma = {
    user: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => expect(service).toBeDefined());
  it('should create user', async () => {
    mockPrisma.user.create.mockResolvedValue({ id: '1', email: 'test@test.com', role: 'TECHNICIAN' });
    const result = await service.create({ email: 'test@test.com', password: 'hashed', firstName: 'Test', lastName: 'User', role: 'TECHNICIAN', tenantId: 't1' });
    expect(result.email).toBe('test@test.com');
  });
  it('should find by email', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: '1', email: 'test@test.com' });
    const result = await service.findByEmail('test@test.com');
    expect(result.email).toBe('test@test.com');
  });
});
