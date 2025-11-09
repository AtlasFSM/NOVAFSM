import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [AnalyticsService, ExportService],
  exports: [AnalyticsService, ExportService],
})
export class DashboardModule {}
