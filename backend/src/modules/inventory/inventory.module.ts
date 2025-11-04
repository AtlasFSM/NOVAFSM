import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryUsageService } from './inventory-usage.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryUsageService, PrismaService],
  exports: [InventoryService, InventoryUsageService],
})
export class InventoryModule {}
