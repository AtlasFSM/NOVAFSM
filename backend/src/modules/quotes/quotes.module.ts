import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { SequenceService } from './sequence.service';
import { QuoteLinesService } from './quote-lines/quote-lines.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * Quotes Module
 *
 * Provides complete quotation/estimate management with:
 * - Full CRUD operations with pagination and filtering
 * - Workflow management: DRAFT → SENT → APPROVED/REJECTED
 * - Auto-generation of sequential quote numbers (Q-YYYY-######)
 * - Line item management with quantity, pricing, and discounts
 * - Automatic tax calculation based on customer/site location
 * - Optimistic locking for concurrent updates
 * - Conversion to Jobs and Invoices
 * - Soft/hard delete based on status
 *
 * Services:
 * - QuotesService: Main business logic for quote lifecycle
 * - SequenceService: Sequential number generation (shared with Jobs/Invoices)
 * - QuoteLinesService: Line item calculations and tax logic
 *
 * Routes:
 * - GET /quotes - List with filters
 * - GET /quotes/:id - Get single quote
 * - POST /quotes - Create quote
 * - PATCH /quotes/:id - Update quote
 * - DELETE /quotes/:id - Delete quote
 * - POST /quotes/:id/send - Send to customer
 * - POST /quotes/:id/approve - Approve quote
 * - POST /quotes/:id/reject - Reject quote
 * - POST /quotes/:id/expire - Expire quote
 * - POST /quotes/:id/convert-to-job - Create job from quote
 * - POST /quotes/:id/convert-to-invoice - Create invoice from quote
 */
@Module({
  imports: [PrismaModule],
  controllers: [QuotesController],
  providers: [QuotesService, SequenceService, QuoteLinesService],
  exports: [QuotesService, SequenceService, QuoteLinesService],
})
export class QuotesModule {}
