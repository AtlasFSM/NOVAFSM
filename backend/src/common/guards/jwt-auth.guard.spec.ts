// @ts-nocheck
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access with valid JWT', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
          user: { id: 'user-1', tenantId: 'tenant-1' },
        }),
      }),
    } as ExecutionContext;

    const canActivate = guard.canActivate(mockContext);
    expect(canActivate).toBeTruthy();
  });
});
