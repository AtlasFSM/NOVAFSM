import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SequenceService } from '../../common/services/sequence.service';
import { EmailService } from '../email/email.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import PDFDocument from 'pdfkit';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Invoices Service - Manages invoice operations
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Find all invoices with pagination and filtering
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    customerId?: string;
    jobId?: string;
    status?: string;
  }) {
    const { skip = 0, take = 50, customerId, jobId, status } = params;

    const where: any = {};

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
   * Find invoice by ID
   */
  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
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
   * Generate PDF for invoice
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

    return new Promise(async (resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', async () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);

            // Upload to S3
            const bucketName = this.configService.get('AWS_S3_BUCKET') || 'novafsm-documents';
            const key = `invoices/${invoice.tenantId}/${invoice.number}.pdf`;

            const command = new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              Body: pdfBuffer,
              ContentType: 'application/pdf',
              Metadata: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.number,
              },
            });

            await this.s3Client.send(command);

            const url = `https://${bucketName}.s3.amazonaws.com/${key}`;

            this.logger.log(`PDF generated for invoice ${invoice.number}: ${url}`);

            resolve({ url });
          } catch (error) {
            reject(error);
          }
        });

        // Generate PDF content
        // Header
        doc.fontSize(20).text('INVOICE', { align: 'right' });
        doc.fontSize(10).text(invoice.number, { align: 'right' });
        doc.moveDown();

        // Company info (left side)
        doc.fontSize(12).text('NoVaFSM', 50, 150);
        doc.fontSize(10).text('Field Service Management', 50, 165);
        doc.text('123 Business St', 50, 180);
        doc.text('Toronto, ON M1A 1A1', 50, 195);
        doc.text('Canada', 50, 210);

        // Customer info (right side)
        doc.fontSize(12).text('Bill To:', 300, 150);
        doc.fontSize(10).text(invoice.customer.name, 300, 165);
        if (invoice.customer.email) {
          doc.text(invoice.customer.email, 300, 180);
        }
        if (invoice.customer.phone) {
          doc.text(invoice.customer.phone, 300, 195);
        }

        // Invoice details
        doc.moveDown(8);
        const detailsY = 250;
        doc.fontSize(10);
        doc.text(`Invoice Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, detailsY);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, detailsY + 15);
        doc.text(`Status: ${invoice.status}`, 50, detailsY + 30);
        if (invoice.job) {
          doc.text(`Job: ${invoice.job.number}`, 50, detailsY + 45);
        }

        // Line items table
        const tableTop = 350;
        doc.fontSize(10).font('Helvetica-Bold');

        // Table headers
        doc.text('Description', 50, tableTop);
        doc.text('Quantity', 300, tableTop);
        doc.text('Unit Price', 380, tableTop);
        doc.text('Total', 480, tableTop, { align: 'right' });

        // Line under headers
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table rows
        doc.font('Helvetica');
        let yPosition = tableTop + 25;

        const lineItems = invoice.lineItems as any[] || [];
        lineItems.forEach((item) => {
          doc.text(item.description, 50, yPosition, { width: 230 });
          doc.text(item.quantity.toString(), 300, yPosition);
          doc.text(`$${item.unitPrice.toFixed(2)}`, 380, yPosition);
          doc.text(`$${item.total.toFixed(2)}`, 480, yPosition, { align: 'right' });
          yPosition += 20;
        });

        // Totals
        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;

        doc.font('Helvetica-Bold');
        doc.text('Subtotal:', 380, yPosition);
        doc.text(`$${invoice.subtotal.toFixed(2)}`, 480, yPosition, { align: 'right' });
        yPosition += 20;

        doc.text('Tax:', 380, yPosition);
        doc.text(`$${invoice.tax.toFixed(2)}`, 480, yPosition, { align: 'right' });
        yPosition += 20;

        doc.fontSize(12);
        doc.text('Total:', 380, yPosition);
        doc.text(`$${invoice.total.toFixed(2)}`, 480, yPosition, { align: 'right' });
        yPosition += 20;

        if (invoice.paidAmount > 0) {
          doc.fontSize(10);
          doc.text('Paid:', 380, yPosition);
          doc.text(`-$${invoice.paidAmount.toFixed(2)}`, 480, yPosition, { align: 'right' });
          yPosition += 20;

          doc.fontSize(12).fillColor('red');
          doc.text('Balance Due:', 380, yPosition);
          doc.text(`$${invoice.balanceDue.toFixed(2)}`, 480, yPosition, { align: 'right' });
          doc.fillColor('black');
        }

        // Notes
        if (invoice.notes) {
          yPosition += 40;
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Notes:', 50, yPosition);
          doc.font('Helvetica');
          doc.text(invoice.notes, 50, yPosition + 15, { width: 500 });
        }

        // Footer
        doc.fontSize(8).text(
          'Thank you for your business!',
          50,
          750,
          { align: 'center', width: 500 }
        );

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send invoice to customer via email (DRAFT → SENT)
   */
  async send(id: string) {
    const invoiceResponse = await this.findOne(id);
    const invoice = invoiceResponse.data;

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
