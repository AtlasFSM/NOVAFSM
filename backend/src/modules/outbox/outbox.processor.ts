import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import { OutboxService } from './outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Outbox Processor - Processes outbox events using BullMQ
 * Polls for pending events and processes them asynchronously
 */
@Injectable()
export class OutboxProcessor implements OnModuleInit {
  private readonly logger = new Logger(OutboxProcessor.name);
  private queue: Queue;
  private worker: Worker;

  constructor(
    private outboxService: OutboxService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('redis.host', 'localhost');
    const redisPort = this.configService.get<number>('redis.port', 6379);
    const redisPassword = this.configService.get<string>('redis.password');

    const connection = {
      host: redisHost,
      port: redisPort,
      password: redisPassword,
    };

    // Create BullMQ queue
    this.queue = new Queue('outbox', { connection });

    // Create worker to process jobs
    this.worker = new Worker(
      'outbox',
      async (job: Job) => {
        return this.processEvent(job);
      },
      {
        connection,
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    // Start polling for pending events
    this.startPolling();

    this.logger.log('Outbox processor initialized');
  }

  /**
   * Poll for pending events and add them to the queue
   */
  private async startPolling() {
    const pollInterval = this.configService.get<number>('outbox.pollInterval', 5000);

    setInterval(async () => {
      try {
        const events = await this.outboxService.getPendingEvents(50);

        for (const event of events) {
          await this.queue.add('process-event', {
            eventId: event.id,
            eventName: event.eventName,
            payload: event.payload,
            tenantId: event.tenantId,
          });
        }

        if (events.length > 0) {
          this.logger.log(`Queued ${events.length} pending events`);
        }
      } catch (error) {
        this.logger.error(`Error polling for events: ${error.message}`);
      }
    }, pollInterval);
  }

  /**
   * Process a single event
   */
  private async processEvent(job: Job) {
    const { eventId, eventName, payload, tenantId } = job.data;

    this.logger.log(`Processing event: ${eventName} (${eventId})`);

    try {
      // Mark as processing
      await this.outboxService.markProcessing(eventId);

      // Set tenant context for any DB operations
      this.prisma.setTenantId(tenantId);

      // Process event based on event name
      await this.handleEvent(eventName, payload, tenantId);

      // Mark as completed
      await this.outboxService.markCompleted(eventId);

      this.logger.log(`Event ${eventName} (${eventId}) processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing event ${eventId}: ${error.message}`);

      // Mark as failed
      await this.outboxService.markFailed(eventId, error.message);

      throw error; // Re-throw for BullMQ retry logic
    } finally {
      this.prisma.clearTenantId();
    }
  }

  /**
   * Handle specific event types
   * In production, this would emit WebSocket events, send emails, etc.
   */
  private async handleEvent(eventName: string, payload: any, tenantId: string) {
    switch (eventName) {
      case 'job.created':
        this.logger.log(`Job created: ${payload.jobId}`);
        // Emit WebSocket event to notify connected clients
        // await this.jobsGateway.emitJobCreated(tenantId, payload);
        break;

      case 'job.assigned':
        this.logger.log(`Job assigned: ${payload.jobId} to ${payload.technicianId}`);
        // Send push notification to technician
        // Send email notification
        break;

      case 'job.completed':
        this.logger.log(`Job completed: ${payload.jobId}`);
        // Send completion notification to customer
        break;

      case 'quote.approved':
        this.logger.log(`Quote approved: ${payload.quoteId}`);
        // Auto-create job if configured
        break;

      case 'invoice.created':
        this.logger.log(`Invoice created: ${payload.invoiceId}`);
        // Send invoice email to customer
        break;

      default:
        this.logger.warn(`Unhandled event type: ${eventName}`);
    }
  }

  /**
   * Clean up on module destroy
   */
  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
    this.logger.log('Outbox processor closed');
  }
}
