import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SequenceService } from './sequence.service';
import { QuoteLinesService } from './quote-lines/quote-lines.service';
import { EmailService } from '../email/email.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';

/**
 * Quotes Service
 * Manages the complete quote lifecycle from creation to conversion
 */
@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
    private quoteLinesService: QuoteLinesService,
    private emailService: EmailService,
  ) {}

  /**
   * Find all quotes with pagination and filtering
   */
  async findAll(tenantId: string, query: QueryQuotesDto) {
    const { page = 1, limit = 20, status, customerId, from, to, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        where.createdAt.lte = new Date(to);
      }
    }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with count
    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          site: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              lines: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      data: quotes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one quote by ID with all lines
   */
  async findOne(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            provinceState: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            provinceState: true,
            postalZip: true,
          },
        },
        lines: {
          orderBy: {
            sort: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  /**
   * Create a new quote with lines
   * Auto-generates quote number and calculates totals
   */
  async create(tenantId: string, userId: string, dto: CreateQuoteDto) {
    // Validate customer exists
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        tenantId,
      },
      include: {
        organization: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate site if provided
    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: {
          id: dto.siteId,
          tenantId,
          customerId: dto.customerId,
        },
      });

      if (!site) {
        throw new NotFoundException('Site not found or does not belong to customer');
      }
    }

    // Validate line items
    this.quoteLinesService.validateLines(dto.lines);

    // Get location for tax calculation (site takes priority, then customer)
    let provinceState: string | undefined;
    if (dto.siteId) {
      const site = await this.prisma.site.findUnique({
        where: { id: dto.siteId },
        select: { provinceState: true },
      });
      provinceState = site?.provinceState || undefined;
    } else {
      provinceState = customer.provinceState || undefined;
    }

    // Calculate all lines with taxes
    const calculatedLines = await Promise.all(
      dto.lines.map((line) =>
        this.quoteLinesService.calculateLine(tenantId, line, provinceState),
      ),
    );

    // Calculate totals
    const { subtotal, taxTotal, total } =
      this.quoteLinesService.calculateTotals(calculatedLines);

    // Create quote in transaction
    const quote = await this.prisma.$transaction(async (tx) => {
      // Generate quote number
      const number = await this.sequenceService.generateNumber(tenantId, 'QUOTE');

      // Use currency from DTO or fall back to organization default
      const currency = dto.currency || customer.organization.currency;

      // Create quote
      const newQuote = await tx.quote.create({
        data: {
          tenantId,
          number,
          status: 'DRAFT',
          currency,
          customerId: dto.customerId,
          siteId: dto.siteId || null,
          title: dto.title || null,
          description: dto.description || null,
          subtotal,
          taxTotal,
          total,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          notes: dto.notes || null,
          termsConditions: dto.termsConditions || null,
          createdById: userId,
        },
        include: {
          customer: true,
          site: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create quote lines
      await this.quoteLinesService.createLines(
        tx,
        tenantId,
        newQuote.id,
        calculatedLines,
      );

      return newQuote;
    });

    // Fetch complete quote with lines
    return this.findOne(tenantId, quote.id);
  }

  /**
   * Update quote with optimistic locking
   * Recalculates totals if lines are updated
   */
  async update(tenantId: string, id: string, dto: UpdateQuoteDto) {
    const quote = await this.findOne(tenantId, id);

    // Check if quote can be edited
    if (!['DRAFT', 'SENT'].includes(quote.status)) {
      throw new BadRequestException(
        `Cannot update quote in ${quote.status} status`,
      );
    }

    // Optimistic locking check
    if (dto.version !== undefined && dto.version !== quote.version) {
      throw new ConflictException(
        'Quote has been modified by another user. Please refresh and try again.',
      );
    }

    // Validate customer if changed
    if (dto.customerId && dto.customerId !== quote.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: dto.customerId,
          tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    // Validate site if changed
    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: {
          id: dto.siteId,
          tenantId,
          customerId: dto.customerId || quote.customerId,
        },
      });

      if (!site) {
        throw new NotFoundException('Site not found or does not belong to customer');
      }
    }

    let subtotal = quote.subtotal;
    let taxTotal = quote.taxTotal;
    let total = quote.total;

    // If lines are being updated, recalculate totals
    if (dto.lines) {
      this.quoteLinesService.validateLines(dto.lines);

      // Get location for tax calculation
      let provinceState: string | undefined;
      if (dto.siteId || quote.siteId) {
        const site = await this.prisma.site.findUnique({
          where: { id: dto.siteId || quote.siteId! },
          select: { provinceState: true },
        });
        provinceState = site?.provinceState || undefined;
      } else {
        const customer = await this.prisma.customer.findUnique({
          where: { id: dto.customerId || quote.customerId },
          select: { provinceState: true },
        });
        provinceState = customer?.provinceState || undefined;
      }

      // Calculate all lines with taxes
      const calculatedLines = await Promise.all(
        dto.lines.map((line) =>
          this.quoteLinesService.calculateLine(tenantId, line, provinceState),
        ),
      );

      // Calculate new totals
      const totals = this.quoteLinesService.calculateTotals(calculatedLines);
      subtotal = totals.subtotal;
      taxTotal = totals.taxTotal;
      total = totals.total;
    }

    // Update quote in transaction
    const updatedQuote = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.quote.update({
        where: {
          id,
          tenantId,
        },
        data: {
          customerId: dto.customerId,
          siteId: dto.siteId !== undefined ? dto.siteId : undefined,
          title: dto.title,
          description: dto.description,
          currency: dto.currency,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          notes: dto.notes,
          termsConditions: dto.termsConditions,
          subtotal,
          taxTotal,
          total,
          version: {
            increment: 1,
          },
        },
      });

      // Update lines if provided
      if (dto.lines) {
        const calculatedLines = await Promise.all(
          dto.lines.map((line) =>
            this.quoteLinesService.calculateLine(
              tenantId,
              line,
              quote.customer.provinceState || undefined,
            ),
          ),
        );

        await this.quoteLinesService.updateLines(
          tx,
          tenantId,
          id,
          calculatedLines,
        );
      }

      return updated;
    });

    return this.findOne(tenantId, id);
  }

  /**
   * Delete quote
   * Hard delete if DRAFT, otherwise prevent deletion
   */
  async delete(tenantId: string, id: string) {
    const quote = await this.findOne(tenantId, id);

    // Only allow deletion of DRAFT quotes
    if (quote.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only DRAFT quotes can be deleted. Consider marking as EXPIRED instead.',
      );
    }

    // Delete in transaction (lines will cascade)
    await this.prisma.$transaction(async (tx) => {
      await this.quoteLinesService.deleteLines(tx, tenantId, id);
      await tx.quote.delete({
        where: {
          id,
          tenantId,
        },
      });
    });

    return { success: true, message: 'Quote deleted successfully' };
  }

  /**
   * Send quote to customer (DRAFT → SENT)
   */
  async send(tenantId: string, id: string) {
    const quote = await this.findOne(tenantId, id);

    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT quotes can be sent');
    }

    // Validate quote has at least one line
    if (!quote.lines || quote.lines.length === 0) {
      throw new BadRequestException('Quote must have at least one line item');
    }

    const updated = await this.prisma.quote.update({
      where: {
        id,
        tenantId,
      },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Send email notification with PDF attachment
    try {
      await this.emailService.sendQuoteEmail(
        quote.customer.email,
        quote.customer.name,
        quote,
      );
      this.logger.log(`Quote ${quote.number} sent via email to ${quote.customer.email}`);
    } catch (error) {
      this.logger.error(`Failed to send quote email: ${error.message}`, error.stack);
      // Don't fail the request if email fails - quote status is still updated
    }

    return this.findOne(tenantId, id);
  }

  /**
   * Approve quote (SENT → APPROVED)
   */
  async approve(tenantId: string, id: string, userId: string, notes?: string) {
    const quote = await this.findOne(tenantId, id);

    if (quote.status !== 'SENT') {
      throw new BadRequestException('Only SENT quotes can be approved');
    }

    const updated = await this.prisma.quote.update({
      where: {
        id,
        tenantId,
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
        notes: notes || quote.notes,
      },
    });

    // TODO: Trigger notification via outbox pattern
    // await this.createOutboxEvent(tenantId, 'quote.approved', { quoteId: id });

    return this.findOne(tenantId, id);
  }

  /**
   * Reject quote (SENT → REJECTED)
   */
  async reject(tenantId: string, id: string, reason: string) {
    const quote = await this.findOne(tenantId, id);

    if (quote.status !== 'SENT') {
      throw new BadRequestException('Only SENT quotes can be rejected');
    }

    const updated = await this.prisma.quote.update({
      where: {
        id,
        tenantId,
      },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // TODO: Trigger notification via outbox pattern
    // await this.createOutboxEvent(tenantId, 'quote.rejected', { quoteId: id });

    return this.findOne(tenantId, id);
  }

  /**
   * Expire quote (manual or automatic)
   * Can expire quotes in SENT status or past validUntil date
   */
  async expire(tenantId: string, id: string) {
    const quote = await this.findOne(tenantId, id);

    if (!['SENT', 'DRAFT'].includes(quote.status)) {
      throw new BadRequestException(
        `Cannot expire quote in ${quote.status} status`,
      );
    }

    const updated = await this.prisma.quote.update({
      where: {
        id,
        tenantId,
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return this.findOne(tenantId, id);
  }

  /**
   * Convert quote to job
   * Creates a new Job record linked to this quote
   */
  async convertToJob(tenantId: string, id: string, userId: string) {
    const quote = await this.findOne(tenantId, id);

    if (quote.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED quotes can be converted to jobs');
    }

    // Check if already converted
    const existingJob = await this.prisma.job.findFirst({
      where: {
        tenantId,
        quoteId: id,
      },
    });

    if (existingJob) {
      throw new ConflictException('Quote has already been converted to a job');
    }

    // Create job in transaction
    const job = await this.prisma.$transaction(async (tx) => {
      // Generate job number
      const jobNumber = await this.sequenceService.generateNumber(tenantId, 'JOB');

      // Create job from quote
      const newJob = await tx.job.create({
        data: {
          tenantId,
          number: jobNumber,
          status: 'DRAFT',
          priority: 'MEDIUM',
          customerId: quote.customerId,
          siteId: quote.siteId,
          quoteId: quote.id,
          title: quote.title || `Job from Quote ${quote.number}`,
          description: quote.description,
          notes: quote.notes,
        },
      });

      return newJob;
    });

    return {
      success: true,
      message: 'Quote converted to job successfully',
      job: {
        id: job.id,
        number: job.number,
      },
    };
  }

  /**
   * Convert quote to invoice
   * Creates a new Invoice from this quote
   */
  async convertToInvoice(tenantId: string, id: string, userId: string) {
    const quote = await this.findOne(tenantId, id);

    if (quote.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED quotes can be converted to invoices');
    }

    // Check if already converted
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        quoteId: id,
      },
    });

    if (existingInvoice) {
      throw new ConflictException('Quote has already been converted to an invoice');
    }

    // Create invoice in transaction
    const invoice = await this.prisma.$transaction(async (tx) => {
      // Generate invoice number
      const invoiceNumber = await this.sequenceService.generateNumber(
        tenantId,
        'INVOICE',
      );

      // Convert quote lines to invoice lines format
      const invoiceLines = quote.lines.map((line: any) => ({
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        discounts: line.discounts,
        taxes: line.taxes,
        amount: line.amount,
        sku: line.sku,
      }));

      // Create invoice from quote
      const newInvoice = await tx.invoice.create({
        data: {
          tenantId,
          number: invoiceNumber,
          status: 'DRAFT',
          currency: quote.currency,
          customerId: quote.customerId,
          quoteId: quote.id,
          subtotal: quote.subtotal,
          taxTotal: quote.taxTotal,
          total: quote.total,
          lines: invoiceLines, // Store as JSON
          notes: quote.notes,
          termsConditions: quote.termsConditions,
        },
      });

      return newInvoice;
    });

    return {
      success: true,
      message: 'Quote converted to invoice successfully',
      invoice: {
        id: invoice.id,
        number: invoice.number,
      },
    };
  }

  /**
   * Batch expire quotes past their validUntil date
   * Called by scheduled job/cron
   */
  async expireOutdatedQuotes(tenantId?: string): Promise<number> {
    const where: any = {
      status: 'SENT',
      validUntil: {
        lt: new Date(),
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const result = await this.prisma.quote.updateMany({
      where,
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }
}
