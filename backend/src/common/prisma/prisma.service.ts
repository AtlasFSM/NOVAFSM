import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenantId } from './request-context';

/**
 * Prisma Service with tenant isolation middleware.
 *
 * SECURITY — race-condition fix:
 *   The previous implementation stored tenantId as `private tenantId: string`
 *   on the singleton PrismaService instance.  In a concurrent Node.js server
 *   this is NOT safe: Request A calling setTenantId('tenant-a') could
 *   overwrite Request B's context while B is mid-flight, causing Tenant A's
 *   queries to execute in Tenant B's scope.
 *
 *   The fix uses AsyncLocalStorage (request-context.ts) which binds the
 *   tenantId to each async execution chain independently.  The TenantInterceptor
 *   wraps each request in an ALS context; this middleware reads from it.
 *
 *   setTenantId / clearTenantId are kept for backward-compatibility with tests,
 *   but the middleware no longer reads from the instance property.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.setupMiddleware();
    this.setupLogging();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  /**
   * @deprecated Use AsyncLocalStorage via TenantInterceptor instead.
   * Kept only for test convenience where no HTTP context exists.
   */
  setTenantId(_tenantId: string | null) {
    // No-op: tenantId is now read from AsyncLocalStorage in the middleware.
    // Tests should use requestContext.run({ tenantId }, cb) from request-context.ts.
  }

  /** @deprecated See setTenantId. */
  getTenantId(): string | null {
    return getCurrentTenantId();
  }

  /** @deprecated See setTenantId. */
  clearTenantId() {
    // No-op: context is cleared automatically when the ALS run() callback exits.
  }

  private setupMiddleware() {
    // Models that don't carry a tenantId column
    const excludedModels = ['Organization', 'TokenBlacklist'];

    this.$use(async (params, next) => {
      if (excludedModels.includes(params.model || '')) {
        return next(params);
      }

      // Read tenant from AsyncLocalStorage — safe under concurrency
      const tenantId = getCurrentTenantId();

      if (params.model && tenantId) {
        // Read operations: inject where clause
        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(params.action)) {
          params.args = params.args ?? {};
          params.args.where = params.args.where ?? {};

          if (!params.args.where.tenantId) {
            params.args.where.tenantId = tenantId;
          }
        }

        // Write operations: inject tenantId into data
        if (['create', 'createMany'].includes(params.action)) {
          params.args = params.args ?? {};

          if (params.action === 'create') {
            params.args.data = params.args.data ?? {};
            if (!params.args.data.tenantId) {
              params.args.data.tenantId = tenantId;
            }
          }

          if (params.action === 'createMany' && Array.isArray(params.args.data)) {
            params.args.data = params.args.data.map((item: any) => ({
              ...item,
              tenantId: item.tenantId ?? tenantId,
            }));
          }
        }

        // Update / Delete: inject where clause
        if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(params.action)) {
          params.args = params.args ?? {};
          params.args.where = params.args.where ?? {};

          if (!params.args.where.tenantId) {
            params.args.where.tenantId = tenantId;
          }
        }
      }

      return next(params);
    });
  }

  private setupLogging() {
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        if (e.duration > 1000) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    this.$on('error' as never, (e: any) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn(`Prisma warning: ${e.message}`);
    });
  }
}
