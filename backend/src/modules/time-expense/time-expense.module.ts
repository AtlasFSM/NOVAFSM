import { Module } from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { ExpenseEntriesService } from './expense-entries.service';
import { TimeEntriesController } from './time-entries.controller';
import { ExpenseEntriesController } from './expense-entries.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [TimeEntriesController, ExpenseEntriesController],
  providers: [TimeEntriesService, ExpenseEntriesService, PrismaService],
  exports: [TimeEntriesService, ExpenseEntriesService],
})
export class TimeExpenseModule {}
