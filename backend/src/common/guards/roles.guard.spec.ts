import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['ADMIN']);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'ADMIN' } }),
      }),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['ADMIN']);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'TECHNICIAN' } }),
      }),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(false);
  });

  it('should allow access when no roles specified', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(null);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'TECHNICIAN' } }),
      }),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
