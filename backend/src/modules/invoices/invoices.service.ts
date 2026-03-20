import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SequenceService } from '../../common/services/sequence.service';
import { EmailService } from '../email/email.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

/**
 * Invoices Service - Manages invoice operations
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
    private emailService: EmailService,
  ) {}

  /**
   * Find all invoices with pagination and filtering.
   *
   * SECURITY: tenantId MUST always be passed from the controller (extracted
   * from the JWT) and injected explicitly here.  The Prisma middleware also
   * injects it, but relying solely on middleware creates a defence-in-depth
   * gap: if the middleware is ever skipped (raw queries, $transaction, etc.)
   * a user from Tenant A could query Tenant B's invoices (IDOR).
   */
  async findAll(params: {
    tenantId: string;
    skip?: number;
    take?: number;
    customerId?: string;
    jobId?: string;
    status?: string;
  }) {
    const { tenantId, skip = 0, take = 50, customerId, jobId, status } = params;

    const where: any = { tenantId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          job: {
            select: {
              id: true,
              number: true,
              title: true,
            },
          },
          quote: {
            select: {
              id: true,
              number: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      success: true,
      data: invoices,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  /**
   * Find invoice by ID.
   *
   * SECURITY: Uses findFirst with an explicit tenantId check rather than
   * findUnique by ID alone.  findUnique ignores Prisma middleware-injected
   * tenantId filters on compound-key models in some versions, so an explicit
   * where clause is the only safe approach.
   */
  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            provinceState: true,
            postalZip: true,
            country: true,
          },
        },
        job: {
          select: {
            id: true,
            number: true,
            title: true,
            description: true,
          },
        },
        quote: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return {
      success: true,
      data: invoice,
    };
  }

  /**
   * Create new invoice
   */
  async create(dto: CreateInvoiceDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Verify job exists if provided
    if (dto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: dto.jobId },
      });

      if (!job) {
        throw new BadRequestException('Job not found');
      }

      // Check if job already has an invoice
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: { jobId: dto.jobId },
      });

      if (existingInvoice) {
        throw new BadRequestException('Job already has an invoice');
      }
    }

    // Verify quote exists if provided
    if (dto.quoteId) {
      const quote = await this.prisma.quote.findUnique({
        where: { id: dto.quoteId },
      });

      if (!quote) {
        throw new BadRequestException('Quote not found');
      }
    }

    // Generate invoice number
    const number = await this.sequenceService.getNext('INVOICE', 'INV');

    const invoice = await this.prisma.invoice.create({
      data: {
        number,
        status: dto.status,
        currency: dto.currency,
        customerId: dto.customerId,
        jobId: dto.jobId,
        quoteId: dto.quoteId,
        subtotal: dto.subtotal,
        taxTotal: dto.taxTotal,
        total: dto.total,
        lines: dto.lines as any,
        notes: dto.notes,
        termsConditions: dto.termsConditions,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    };
  }

  /**
   * Update existing invoice
   */
  async update(id: string, dto: UpdateInvoiceDto) {
    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Verify customer exists if being updated
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }
    }

    const updateData: any = {};

    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.customerId !== undefined) updateData.customerId = dto.customerId;
    if (dto.jobId !== undefined) updateData.jobId = dto.jobId;
    if (dto.quoteId !== undefined) updateData.quoteId = dto.quoteId;
    if (dto.subtotal !== undefined) updateData.subtotal = dto.subtotal;
    if (dto.taxTotal !== undefined) updateData.taxTotal = dto.taxTotal;
    if (dto.total !== undefined) updateData.total = dto.total;
    if (dto.lines !== undefined) updateData.lines = dto.lines as any;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.termsConditions !== undefined) updateData.termsConditions = dto.termsConditions;
    if (dto.issuedAt !== undefined) updateData.issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : null;
    if (dto.dueAt !== undefined) updateData.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (dto.paidAt !== undefined) updateData.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
    };
  }

  /**
   * Delete invoice
   */
  async delete(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Don't allow deletion of paid invoices
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot delete paid invoices');
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Invoice deleted successfully',
    };
  }

  /**
   * Generate PDF for invoice (stub implementation)
   * In production, this would integrate with a PDF generation service
   */
  async generatePDF(id: string): Promise<{ url: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        job: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Stub: Return a mock URL
    // In production, this would generate a PDF and upload to S3
    const mockUrl = `https://storage.example.com/invoices/${invoice.number}.pdf`;

    return {
      url: mockUrl,
    };
  }

  /**
   * Send invoice to customer via email (DRAFT → SENT)
   */
  async send(id: string) {
    const invoice = await this.findOne(id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be sent');
    }

    // Update invoice status
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Send email notification with PDF attachment
    try {
      await this.emailService.sendInvoiceEmail(
        invoice.customer.email,
        invoice.customer.name,
        invoice,
      );
      this.logger.log(`Invoice ${invoice.number} sent via email to ${invoice.customer.email}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice email: ${error.message}`, error.stack);
      // Don't fail the request if email fails - invoice status is still updated
    }

    return this.findOne(id);
  }
}
