import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service with tenant isolation middleware
 * Automatically injects tenantId filter on all queries
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private tenantId: string | null = null;

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
   * Set tenant context for subsequent queries
   * Call this at the start of each request with user's tenantId
   */
  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  /**
   * Get current tenant ID from context
   */
  getTenantId(): string | null {
    return this.tenantId;
  }

  /**
   * Clear tenant context (used in testing)
   */
  clearTenantId() {
    this.tenantId = null;
  }

  private setupMiddleware() {
    // Middleware to inject tenantId filter on all queries
    this.$use(async (params, next) => {
      // Models that don't require tenant filtering
      const excludedModels = ['Organization', 'TokenBlacklist'];

      if (excludedModels.includes(params.model || '')) {
        return next(params);
      }

      // For models with tenantId, inject filter
      if (params.model && this.tenantId) {
        // Read operations: inject where clause
        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};

          // Only inject if not explicitly querying different tenant (for SUPER_ADMIN)
          if (!params.args.where.tenantId) {
            params.args.where.tenantId = this.tenantId;
          }
        }

        // Write operations: inject data
        if (['create', 'createMany'].includes(params.action)) {
          params.args = params.args || {};

          if (params.action === 'create') {
            params.args.data = params.args.data || {};
            if (!params.args.data.tenantId) {
              params.args.data.tenantId = this.tenantId;
            }
          }

          if (params.action === 'createMany' && Array.isArray(params.args.data)) {
            params.args.data = params.args.data.map((item: any) => ({
              ...item,
              tenantId: item.tenantId || this.tenantId,
            }));
          }
        }

        // Update/Delete: inject where clause
        if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};

          if (!params.args.where.tenantId) {
            params.args.where.tenantId = this.tenantId;
          }
        }
      }

      return next(params);
    });
  }

  private setupLogging() {
    // Log slow queries in development
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
