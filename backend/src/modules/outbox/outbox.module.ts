import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { OutboxProcessor } from './outbox.processor';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailModule } from '../email/email.module';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Outbox Module - Transactional outbox pattern for reliable event publishing
 * No controller as this is internal only
 */
@Module({
  imports: [EmailModule, JobsModule, NotificationsModule],
  providers: [OutboxService, OutboxProcessor, PrismaService],
  exports: [OutboxService],
})
export class OutboxModule {}
