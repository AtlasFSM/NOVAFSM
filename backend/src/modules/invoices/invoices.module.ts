import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SequenceService } from '../../common/services/sequence.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService, SequenceService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
