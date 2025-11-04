import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface QuotePdfData {
  number: string;
  title?: string;
  description?: string;
  createdAt: Date;
  expiresAt?: Date;
  status: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
}

interface InvoicePdfData extends Omit<QuotePdfData, 'expiresAt'> {
  invoiceDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  paymentInstructions?: string;
}

/**
 * PDF Service - Generate PDFs for quotes and invoices
 */
@Injectable()
export class PdfService {
  /**
   * Generate PDF for quote
   */
  async generateQuotePdf(data: QuotePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('QUOTATION', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.organization.name, 50, 85)
        .text(data.organization.address || '', 50, 100)
        .text(data.organization.phone || '', 50, 115)
        .text(data.organization.email || '', 50, 130);

      // Quote number and date
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Quote #: ${data.number}`, 400, 85, { align: 'right' })
        .font('Helvetica')
        .text(`Date: ${this.formatDate(data.createdAt)}`, 400, 100, { align: 'right' });

      if (data.expiresAt) {
        doc.text(`Expires: ${this.formatDate(data.expiresAt)}`, 400, 115, { align: 'right' });
      }

      // Customer info
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Bill To:', 50, 170);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.customer.name, 50, 190)
        .text(data.customer.email || '', 50, 205)
        .text(data.customer.phone || '', 50, 220)
        .text(data.customer.address || '', 50, 235);

      // Title and description
      if (data.title) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(data.title, 50, 280);
      }

      if (data.description) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(data.description, 50, 300, { width: 500 });
      }

      // Line items table
      const tableTop = data.description ? 340 : 310;

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Qty', 300, tableTop, { width: 50, align: 'right' })
        .text('Unit Price', 360, tableTop, { width: 80, align: 'right' })
        .text('Total', 450, tableTop, { width: 100, align: 'right' });

      // Table separator
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Line items
      let yPosition = tableTop + 25;
      data.lineItems.forEach((item) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(item.description, 50, yPosition, { width: 240 })
          .text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'right' })
          .text(this.formatCurrency(item.unitPrice, data.currency), 360, yPosition, { width: 80, align: 'right' })
          .text(this.formatCurrency(item.total, data.currency), 450, yPosition, { width: 100, align: 'right' });

        yPosition += 25;
      });

      // Totals section
      yPosition += 20;
      const totalsX = 400;

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', totalsX, yPosition)
        .text(this.formatCurrency(data.subtotal, data.currency), 450, yPosition, { width: 100, align: 'right' });

      yPosition += 20;
      doc
        .text('Tax:', totalsX, yPosition)
        .text(this.formatCurrency(data.taxTotal, data.currency), 450, yPosition, { width: 100, align: 'right' });

      if (data.discount > 0) {
        yPosition += 20;
        doc
          .fillColor('#10b981')
          .text('Discount:', totalsX, yPosition)
          .text(`-${this.formatCurrency(data.discount, data.currency)}`, 450, yPosition, { width: 100, align: 'right' })
          .fillColor('#000000');
      }

      // Total separator
      yPosition += 15;
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(totalsX, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 10;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total:', totalsX, yPosition)
        .text(this.formatCurrency(data.total, data.currency), 450, yPosition, { width: 100, align: 'right' });

      // Notes
      if (data.notes) {
        yPosition += 40;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Notes:', 50, yPosition);

        doc
          .font('Helvetica')
          .text(data.notes, 50, yPosition + 15, { width: 500 });
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

      doc.end();
    });
  }

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(data.status === 'PAID' ? '#10b981' : '#1f2937')
        .text('INVOICE', 50, 50)
        .fillColor('#000000');

      if (data.status === 'PAID') {
        doc
          .fontSize(14)
          .fillColor('#10b981')
          .text('PAID', 150, 58)
          .fillColor('#000000');
      } else if (data.status === 'OVERDUE') {
        doc
          .fontSize(14)
          .fillColor('#ef4444')
          .text('OVERDUE', 150, 58)
          .fillColor('#000000');
      }

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.organization.name, 50, 85)
        .text(data.organization.address || '', 50, 100)
        .text(data.organization.phone || '', 50, 115)
        .text(data.organization.email || '', 50, 130);

      // Invoice number and dates
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Invoice #: ${data.number}`, 400, 85, { align: 'right' })
        .font('Helvetica')
        .text(`Date: ${this.formatDate(data.invoiceDate)}`, 400, 100, { align: 'right' });

      if (data.dueDate) {
        doc.text(`Due: ${this.formatDate(data.dueDate)}`, 400, 115, { align: 'right' });
      }

      if (data.paidDate) {
        doc
          .fillColor('#10b981')
          .text(`Paid: ${this.formatDate(data.paidDate)}`, 400, 130, { align: 'right' })
          .fillColor('#000000');
      }

      // Customer info
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Bill To:', 50, 170);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.customer.name, 50, 190)
        .text(data.customer.email || '', 50, 205)
        .text(data.customer.phone || '', 50, 220)
        .text(data.customer.address || '', 50, 235);

      // Title and description
      if (data.title) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(data.title, 50, 280);
      }

      if (data.description) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(data.description, 50, 300, { width: 500 });
      }

      // Line items table
      const tableTop = data.description ? 340 : 310;

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Qty', 300, tableTop, { width: 50, align: 'right' })
        .text('Unit Price', 360, tableTop, { width: 80, align: 'right' })
        .text('Total', 450, tableTop, { width: 100, align: 'right' });

      // Table separator
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Line items
      let yPosition = tableTop + 25;
      data.lineItems.forEach((item) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(item.description, 50, yPosition, { width: 240 })
          .text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'right' })
          .text(this.formatCurrency(item.unitPrice, data.currency), 360, yPosition, { width: 80, align: 'right' })
          .text(this.formatCurrency(item.total, data.currency), 450, yPosition, { width: 100, align: 'right' });

        yPosition += 25;
      });

      // Totals section
      yPosition += 20;
      const totalsX = 400;

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', totalsX, yPosition)
        .text(this.formatCurrency(data.subtotal, data.currency), 450, yPosition, { width: 100, align: 'right' });

      yPosition += 20;
      doc
        .text('Tax:', totalsX, yPosition)
        .text(this.formatCurrency(data.taxTotal, data.currency), 450, yPosition, { width: 100, align: 'right' });

      if (data.discount > 0) {
        yPosition += 20;
        doc
          .fillColor('#10b981')
          .text('Discount:', totalsX, yPosition)
          .text(`-${this.formatCurrency(data.discount, data.currency)}`, 450, yPosition, { width: 100, align: 'right' })
          .fillColor('#000000');
      }

      // Total separator
      yPosition += 15;
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(totalsX, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 10;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Amount Due:', totalsX, yPosition)
        .text(this.formatCurrency(data.total, data.currency), 450, yPosition, { width: 100, align: 'right' });

      // Payment instructions
      if (data.paymentInstructions) {
        yPosition += 40;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Payment Instructions:', 50, yPosition);

        doc
          .font('Helvetica')
          .text(data.paymentInstructions, 50, yPosition + 15, { width: 500 });
      }

      // Notes
      if (data.notes) {
        yPosition += 60;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Notes:', 50, yPosition);

        doc
          .font('Helvetica')
          .text(data.notes, 50, yPosition + 15, { width: 500 });
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

      doc.end();
    });
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'USD' ? '$' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
