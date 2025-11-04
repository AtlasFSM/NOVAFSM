import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { SitesController } from './sites.controller';
import { CustomersService } from './customers.service';
import { SitesService } from './sites.service';

@Module({
  controllers: [CustomersController, SitesController],
  providers: [CustomersService, SitesService],
  exports: [CustomersService, SitesService],
})
export class CustomersModule {}
