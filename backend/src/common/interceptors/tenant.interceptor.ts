import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

/**
 * Tenant Context Interceptor
 * Sets tenant context in Prisma service based on authenticated user
 * Ensures all database queries are tenant-scoped
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload | undefined = request.user;

    // Set tenant context if user is authenticated
    if (user?.tenantId) {
      this.prisma.setTenantId(user.tenantId);
    }

    return next.handle().pipe(
      tap(() => {
        // Clear tenant context after request completes
        this.prisma.clearTenantId();
      }),
    );
  }
}
