import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Outbox Service - Transactional outbox pattern for reliable event publishing
 * Events are stored in DB first, then processed asynchronously
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create outbox event
   * Should be called within a transaction to ensure atomicity
   */
  async create(params: {
    eventName: string;
    payload: any;
    tenantId?: string;
  }) {
    const tenantId = params.tenantId || this.prisma.getTenantId();

    if (!tenantId) {
      throw new Error('Tenant context not set');
    }

    const event = await this.prisma.outboxEvent.create({
      data: {
        tenantId,
        eventName: params.eventName,
        payload: params.payload,
        status: 'PENDING',
        attempts: 0,
      },
    });

    this.logger.log(`Created outbox event: ${params.eventName} (${event.id})`);
    return event;
  }

  /**
   * Get pending events for processing
   */
  async getPendingEvents(limit = 100) {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Mark event as processing
   */
  async markProcessing(eventId: string) {
    return this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSING',
        lastAttempt: new Date(),
        attempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Mark event as completed
   */
  async markCompleted(eventId: string) {
    return this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark event as failed
   */
  async markFailed(eventId: string, error: string) {
    const event = await this.prisma.outboxEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return;
    }

    // If attempts > 3, mark as failed permanently, otherwise reset to pending for retry
    const status = event.attempts >= 3 ? 'FAILED' : 'PENDING';

    return this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status,
        error,
        lastAttempt: new Date(),
      },
    });
  }

  /**
   * Get event statistics
   */
  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      this.prisma.outboxEvent.count({ where: { status: 'PENDING' } }),
      this.prisma.outboxEvent.count({ where: { status: 'PROCESSING' } }),
      this.prisma.outboxEvent.count({ where: { status: 'COMPLETED' } }),
      this.prisma.outboxEvent.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
    };
  }
}
