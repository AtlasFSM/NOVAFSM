import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';

/**
 * Audit Service - Manages audit logging
 * Used internally by other services to track changes
 */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create audit log entry
   * Called internally by other services
   */
  async create(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    payload?: any;
    ip?: string;
    userAgent?: string;
  }) {
    const tenantId = this.prisma.getTenantId();

    const log = await this.prisma.auditLog.create({
      data: {
        tenantId: tenantId || '',
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        payload: params.payload || {},
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });

    return log;
  }

  /**
   * Find all audit logs with pagination and filtering
   * Admin only
   */
  async findAll(dto: QueryAuditDto) {
    const { skip = 0, take = 50, userId, action, entity, entityId, startDate, endDate } = dto;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entity: string, entityId: string, skip = 0, take = 20) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.prisma.auditLog.count({
      where: {
        entity,
        entityId,
      },
    });

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }
}
