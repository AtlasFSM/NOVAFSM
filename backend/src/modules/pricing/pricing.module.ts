import { Module } from '@nestjs/common';
import { PriceListsController } from './price-lists.controller';
import { PriceItemsController } from './price-items.controller';
import { PriceListsService } from './price-lists.service';
import { PriceItemsService } from './price-items.service';

/**
 * Pricing Module
 * Manages price lists and price items for the FSM system
 */
@Module({
  controllers: [PriceListsController, PriceItemsController],
  providers: [PriceListsService, PriceItemsService],
  exports: [PriceListsService, PriceItemsService],
})
export class PricingModule {}
