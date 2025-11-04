import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { RejectQuoteDto } from './dto/reject-quote.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

/**
 * Quotes Controller
 * Manages quotation/estimate lifecycle and conversions
 */
@ApiTags('quotes')
@ApiBearerAuth('JWT')
@Controller('quotes')
@UseGuards(RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  /**
   * List all quotes with pagination and filtering
   */
  @Get()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({
    summary: 'List all quotes',
    description: 'Get paginated list of quotes with optional filters for status, customer, date range, and search',
  })
  @ApiResponse({
    status: 200,
    description: 'Quotes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryQuotesDto,
  ) {
    return this.quotesService.findAll(user.tenantId, query);
  }

  /**
   * Get single quote by ID with all lines
   */
  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({
    summary: 'Get quote by ID',
    description: 'Retrieve a single quote with all line items, customer, and site details',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Quote retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.findOne(user.tenantId, id);
  }

  /**
   * Create new quote with lines
   */
  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({
    summary: 'Create new quote',
    description: 'Create a new quote with line items. Auto-generates quote number (Q-YYYY-######) and calculates totals including taxes based on customer location.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quote created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Customer or site not found' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(user.tenantId, user.userId, dto);
  }

  /**
   * Update existing quote
   */
  @Patch(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({
    summary: 'Update quote',
    description: 'Update quote details and/or lines. Supports optimistic locking via If-Match header. Recalculates totals if lines are modified. Only DRAFT and SENT quotes can be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiHeader({
    name: 'If-Match',
    description: 'Current version number for optimistic locking (optional)',
    required: false,
    schema: {
      type: 'integer',
      example: 1,
    },
  })
  @ApiResponse({ status: 200, description: 'Quote updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot update quote in this status' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 409, description: 'Conflict - quote was modified by another user' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuoteDto,
    @Headers('if-match') ifMatch?: string,
  ) {
    // Parse If-Match header for optimistic locking
    if (ifMatch) {
      dto.version = parseInt(ifMatch, 10);
    }

    return this.quotesService.update(user.tenantId, id, dto);
  }

  /**
   * Delete quote
   */
  @Delete(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Delete quote',
    description: 'Delete a quote. Only DRAFT quotes can be deleted. For other statuses, consider marking as EXPIRED instead.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - only DRAFT quotes can be deleted' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.delete(user.tenantId, id);
  }

  /**
   * Send quote to customer (DRAFT → SENT)
   */
  @Post(':id/send')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send quote to customer',
    description: 'Change quote status from DRAFT to SENT. Records sent timestamp. Only DRAFT quotes can be sent.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Quote sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - only DRAFT quotes can be sent' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async send(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.send(user.tenantId, id);
  }

  /**
   * Approve quote (SENT → APPROVED)
   */
  @Post(':id/approve')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Approve quote',
    description: 'Change quote status from SENT to APPROVED. Records approval timestamp and approver. Only SENT quotes can be approved.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Quote approved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - only SENT quotes can be approved' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async approve(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveQuoteDto,
  ) {
    return this.quotesService.approve(user.tenantId, id, user.userId, dto.notes);
  }

  /**
   * Reject quote (SENT → REJECTED)
   */
  @Post(':id/reject')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reject quote',
    description: 'Change quote status from SENT to REJECTED. Records rejection timestamp and reason. Only SENT quotes can be rejected.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Quote rejected successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - only SENT quotes can be rejected' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async reject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectQuoteDto,
  ) {
    return this.quotesService.reject(user.tenantId, id, dto.reason);
  }

  /**
   * Expire quote manually
   */
  @Post(':id/expire')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Expire quote',
    description: 'Manually mark a quote as EXPIRED. DRAFT and SENT quotes can be expired. Quotes past their validUntil date are automatically expired by a background job.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Quote expired successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot expire quote in this status' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async expire(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.expire(user.tenantId, id);
  }

  /**
   * Convert quote to job
   */
  @Post(':id/convert-to-job')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Convert quote to job',
    description: 'Create a new Job record from an APPROVED quote. Links job to quote. Only APPROVED quotes can be converted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote converted to job successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        job: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            number: { type: 'string', example: 'J-2025-000001' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - only APPROVED quotes can be converted' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 409, description: 'Conflict - quote already converted to job' })
  async convertToJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.convertToJob(user.tenantId, id, user.userId);
  }

  /**
   * Convert quote to invoice
   */
  @Post(':id/convert-to-invoice')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Convert quote to invoice',
    description: 'Create a new Invoice from an APPROVED quote. Copies all line items and totals. Only APPROVED quotes can be converted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote converted to invoice successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            number: { type: 'string', example: 'INV-2025-000001' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - only APPROVED quotes can be converted' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 409, description: 'Conflict - quote already converted to invoice' })
  async convertToInvoice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.convertToInvoice(user.tenantId, id, user.userId);
  }
}
