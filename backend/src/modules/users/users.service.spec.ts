import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
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
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users for a tenant', async () => {
      const tenantId = 'tenant-123';
      const mockUsers = [
        {
          id: 'user-1',
          tenantId,
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'TECHNICIAN',
        },
        {
          id: 'user-2',
          tenantId,
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'DISPATCHER',
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.findAll(tenantId, 1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        skip: 0,
        take: 10,
        select: expect.any(Object),
      });
    });

    it('should filter users by role', async () => {
      const tenantId = 'tenant-123';
      const role = 'TECHNICIAN';

      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll(tenantId, 1, 10, role);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId, role },
        skip: 0,
        take: 10,
        select: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        tenantId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(tenantId, userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, tenantId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('tenant-123', 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
      role: 'TECHNICIAN',
    };

    it('should create a new user', async () => {
      const tenantId = 'tenant-123';
      const mockUser = {
        id: 'new-user-123',
        tenantId,
        ...createUserDto,
        password: undefined,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(tenantId, createUserDto);

      expect(result.email).toBe(createUserDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists in tenant', async () => {
      const tenantId = 'tenant-123';

      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        email: createUserDto.email,
      });

      await expect(service.create(createUserDto, tenantId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash the password before saving', async () => {
      const tenantId = 'tenant-123';
      const bcryptSpy = jest.spyOn(bcrypt, 'hash');

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-123',
        ...createUserDto,
      });

      await service.create(createUserDto, tenantId);

      expect(bcryptSpy).toHaveBeenCalledWith(createUserDto.password, 12);
    });
  });

  describe('update', () => {
    it('should update user details', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const existingUser = {
        id: userId,
        tenantId,
        email: 'user@example.com',
        firstName: 'Old',
        lastName: 'Name',
      };

      const updatedUser = {
        ...existingUser,
        ...updateDto,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateDto, tenantId);

      expect(result.data.firstName).toBe(updateDto.firstName);
      expect(result.data.lastName).toBe(updateDto.lastName);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { firstName: 'Test' }, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const mockUser = {
        id: userId,
        tenantId,
        email: 'user@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.delete(tenantId, userId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.delete('tenant-123', 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
