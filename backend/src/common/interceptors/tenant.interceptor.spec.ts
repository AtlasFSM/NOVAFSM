import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;
  let prismaService: PrismaService;

  const mockPrismaService = {
    setTenantId: jest.fn(),
  };

  const mockCallHandler: CallHandler = {
    handle: jest.fn(() => of({ success: true, data: {} })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantInterceptor,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    interceptor = module.get<TenantInterceptor>(TenantInterceptor);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should set tenantId from authenticated user', (done) => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              tenantId,
              id: userId,
              role: 'ADMIN',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(mockPrismaService.setTenantId).toHaveBeenCalledWith(tenantId);
          expect(result).toEqual({ success: true, data: {} });
          done();
        },
        error: done,
      });
    });

    it('should handle requests without user', (done) => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: undefined,
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(mockPrismaService.setTenantId).toHaveBeenCalledWith(null);
          expect(result).toEqual({ success: true, data: {} });
          done();
        },
        error: done,
      });
    });

    it('should handle public routes without user', (done) => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(mockPrismaService.setTenantId).toHaveBeenCalledWith(null);
          done();
        },
        error: done,
      });
    });

    it('should clear tenantId for superadmin users', (done) => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              tenantId: 'tenant-123',
              role: 'SUPER_ADMIN',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockPrismaService.setTenantId).toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });
  });
});
