import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { OutboxProcessor } from './outbox.processor';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Outbox Module - Transactional outbox pattern for reliable event publishing
 * No controller as this is internal only
 */
@Module({
  providers: [OutboxService, OutboxProcessor, PrismaService],
  exports: [OutboxService],
})
export class OutboxModule {}
