import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'admin@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      organizationName: 'Acme Corp',
      currency: 'CAD',
    };

    it('should successfully register a new organization and admin user', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Acme Corp',
        currency: 'CAD',
        status: 'ACTIVE',
      };

      const mockUser = {
        id: 'user-123',
        tenantId: 'org-123',
        email: 'admin@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
        status: 'ACTIVE',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(12);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          organization: { create: jest.fn().mockResolvedValue(mockOrg) },
          user: { create: jest.fn().mockResolvedValue(mockUser) },
        });
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('admin@example.com');
      expect(result.user.role).toBe('ADMIN');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('access-token');
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        email: 'admin@example.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already registered',
      );
    });

    it('should hash password with correct bcrypt rounds', async () => {
      const bcryptRounds = 12;
      mockConfigService.get.mockReturnValue(bcryptRounds);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const bcryptSpy = jest.spyOn(bcrypt, 'hash');

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          organization: { create: jest.fn().mockResolvedValue({ id: 'org-123' }) },
          user: { create: jest.fn().mockResolvedValue({ id: 'user-123', role: 'ADMIN' }) },
        });
      });

      mockJwtService.signAsync.mockResolvedValue('token');

      await service.register(registerDto);

      expect(bcryptSpy).toHaveBeenCalledWith(registerDto.password, bcryptRounds);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'admin@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const mockUser = {
        id: 'user-123',
        tenantId: 'org-123',
        email: loginDto.email,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        mfaEnabled: false,
        organization: {
          id: 'org-123',
          name: 'Acme Corp',
          status: 'ACTIVE',
        },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(loginDto.email);
      expect(result.tokens).toBeDefined();
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        include: { organization: true },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.email,
        password: await bcrypt.hash('WrongPassword123!', 10),
        role: 'ADMIN',
        status: 'ACTIVE',
        mfaEnabled: false,
        organization: { id: 'org-123', name: 'Acme Corp', status: 'ACTIVE' },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.email,
        password: await bcrypt.hash(loginDto.password, 10),
        role: 'ADMIN',
        status: 'INACTIVE',
        mfaEnabled: false,
        organization: { id: 'org-123', name: 'Acme Corp', status: 'ACTIVE' },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if organization is suspended', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginDto.email,
        password: await bcrypt.hash(loginDto.password, 10),
        role: 'ADMIN',
        status: 'ACTIVE',
        mfaEnabled: false,
        organization: {
          id: 'org-123',
          name: 'Acme Corp',
          status: 'SUSPENDED',
        },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        tenantId: 'org-123',
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.validateToken('valid-token');

      expect(result).toEqual(payload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const mockUser = {
        id: 'user-123',
        tenantId: 'org-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        type: 'refresh',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.refreshToken('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
