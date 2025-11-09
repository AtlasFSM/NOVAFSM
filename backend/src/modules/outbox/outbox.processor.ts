import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import { OutboxService } from './outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JobsGateway } from '../jobs/jobs-gateway';
import { PushNotificationService } from '../notifications/push-notification.service';
import { SmsNotificationService } from '../notifications/sms-notification.service';

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
    private emailService: EmailService,
    private jobsGateway: JobsGateway,
    private pushNotificationService: PushNotificationService,
    private smsNotificationService: SmsNotificationService,
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
   * Emits WebSocket events, sends emails, and triggers automation
   */
  private async handleEvent(eventName: string, payload: any, tenantId: string) {
    switch (eventName) {
      case 'job.created':
        this.logger.log(`Job created: ${payload.jobId}`);
        // Fetch job details for notification
        try {
          const job = await this.prisma.job.findUnique({
            where: { id: payload.jobId },
            include: {
              customer: true,
              assignedTechnician: true,
            },
          });

          if (job) {
            // Emit WebSocket event to all connected clients in tenant
            this.jobsGateway.emitJobUpdated(job, tenantId);
            this.logger.log(`WebSocket notification sent for job ${job.number}`);
          }
        } catch (error) {
          this.logger.error(`Failed to process job.created event: ${error.message}`);
        }
        break;

      case 'job.assigned':
        this.logger.log(`Job assigned: ${payload.jobId} to ${payload.technicianId}`);
        // Fetch job and technician details
        try {
          const job = await this.prisma.job.findUnique({
            where: { id: payload.jobId },
            include: {
              customer: true,
              assignedTechnician: true,
              site: true,
            },
          });

          if (job && job.assignedTechnician) {
            // Send email notification to technician
            await this.emailService.sendJobAssignmentEmail(
              job.assignedTechnician.email,
              `${job.assignedTechnician.firstName} ${job.assignedTechnician.lastName}`,
              job,
            );
            this.logger.log(
              `Email notification sent to ${job.assignedTechnician.email} for job ${job.number}`
            );

            // Emit WebSocket event
            this.jobsGateway.emitJobAssigned(job, tenantId, job.assignedTechnician.id);

            // Send push notification
            await this.pushNotificationService.sendJobAssignmentNotification(
              job.assignedTechnician.id,
              job.number,
              job.title,
              job.scheduledStart ? new Date(job.scheduledStart) : undefined,
            );
            this.logger.log(`Push notification sent to technician ${job.assignedTechnician.firstName}`);

            // Send SMS notification if technician has phone number
            if (job.assignedTechnician.phone) {
              await this.smsNotificationService.sendJobAssignmentSms(
                job.assignedTechnician.phone,
                `${job.assignedTechnician.firstName} ${job.assignedTechnician.lastName}`,
                job.number,
                job.title,
                job.scheduledStart ? new Date(job.scheduledStart) : undefined,
              );
              this.logger.log(`SMS notification sent to technician ${job.assignedTechnician.phone}`);
            }
          }
        } catch (error) {
          this.logger.error(`Failed to process job.assigned event: ${error.message}`);
        }
        break;

      case 'job.completed':
        this.logger.log(`Job completed: ${payload.jobId}`);
        // Send completion notification to customer
        try {
          const job = await this.prisma.job.findUnique({
            where: { id: payload.jobId },
            include: {
              customer: true,
              assignedTechnician: true,
            },
          });

          if (job) {
            // Send customer satisfaction survey
            await this.emailService.sendJobCompletionEmail(
              job.customer.email,
              job.customer.name,
              job,
            );
            this.logger.log(
              `Completion notification sent to customer ${job.customer.name} for job ${job.number}`
            );

            // Emit WebSocket event
            this.jobsGateway.emitJobUpdated(job, tenantId, job.assignedToId || undefined);

            // Auto-generate invoice if configured
            const org = await this.prisma.organization.findUnique({
              where: { id: tenantId },
              select: { id: true }, // TODO: Add autoGenerateInvoice config field
            });

            if (org) {
              // TODO: Implement auto-invoice generation
              this.logger.log(`Auto-invoice check for completed job ${job.number}`);
            }
          }
        } catch (error) {
          this.logger.error(`Failed to process job.completed event: ${error.message}`);
        }
        break;

      case 'quote.approved':
        this.logger.log(`Quote approved: ${payload.quoteId}`);
        // Auto-create job if configured
        try {
          const quote = await this.prisma.quote.findUnique({
            where: { id: payload.quoteId },
            include: {
              customer: true,
              site: true,
            },
          });

          if (quote) {
            // Send approval notification to customer
            await this.emailService.sendQuoteApprovalEmail(
              quote.customer.email,
              quote.customer.name,
              quote,
            );
            this.logger.log(`Approval notification sent to customer ${quote.customer.name}`);

            // Check if auto-convert is enabled
            // TODO: Get from tenant settings
            const shouldAutoConvert = false;

            if (shouldAutoConvert) {
              // Create job from approved quote
              this.logger.log(`Auto-converting quote ${quote.number} to job`);
              // TODO: Call JobsService.createFromQuote when available
            }
          }
        } catch (error) {
          this.logger.error(`Failed to process quote.approved event: ${error.message}`);
        }
        break;

      case 'invoice.created':
        this.logger.log(`Invoice created: ${payload.invoiceId}`);
        // Send invoice email to customer
        try {
          const invoice = await this.prisma.invoice.findUnique({
            where: { id: payload.invoiceId },
            include: {
              customer: true,
              job: true,
              lineItems: true,
              organization: true,
            },
          });

          if (invoice) {
            // Generate PDF and send email
            await this.emailService.sendInvoiceEmail(
              invoice.customer.email,
              invoice.customer.name,
              invoice,
            );
            this.logger.log(
              `Invoice ${invoice.number} email sent to ${invoice.customer.email}`
            );

            // Update invoice status to SENT
            await this.prisma.invoice.update({
              where: { id: invoice.id },
              data: { status: 'SENT' },
            });

            this.logger.log(`Invoice ${invoice.number} marked as SENT`);
          }
        } catch (error) {
          this.logger.error(`Failed to process invoice.created event: ${error.message}`);
        }
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
