import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { PdfService } from './pdf.service';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Email Service - Send emails with quotes and invoices
 * Supports SMTP, SendGrid, AWS SES, and other providers via nodemailer
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(
    private configService: ConfigService,
    private pdfService: PdfService,
  ) {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on configuration
   */
  private initializeTransporter(): void {
    const emailProvider = this.configService.get<string>('email.provider', 'smtp');

    if (emailProvider === 'sendgrid') {
      // SendGrid configuration
      const apiKey = this.configService.get<string>('email.sendgrid.apiKey');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: apiKey,
        },
      });
    } else if (emailProvider === 'ses') {
      // AWS SES configuration
      const region = this.configService.get<string>('email.ses.region', 'us-east-1');
      const accessKeyId = this.configService.get<string>('email.ses.accessKeyId');
      const secretAccessKey = this.configService.get<string>('email.ses.secretAccessKey');

      this.transporter = nodemailer.createTransport({
        host: `email-smtp.${region}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: accessKeyId,
          pass: secretAccessKey,
        },
      });
    } else {
      // Generic SMTP configuration
      const host = this.configService.get<string>('email.smtp.host', 'localhost');
      const port = this.configService.get<number>('email.smtp.port', 1025);
      const secure = this.configService.get<boolean>('email.smtp.secure', false);
      const user = this.configService.get<string>('email.smtp.user');
      const pass = this.configService.get<string>('email.smtp.pass');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
      });
    }

    this.logger.log(`Email transporter initialized with provider: ${emailProvider}`);
  }

  /**
   * Send email
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    const from = this.configService.get<string>('email.from', 'noreply@novafsm.com');

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Send quote email with PDF attachment
   */
  async sendQuoteEmail(
    recipientEmail: string,
    recipientName: string,
    quoteData: any,
  ): Promise<void> {
    // Generate PDF
    const pdfBuffer = await this.pdfService.generateQuotePdf({
      number: quoteData.number,
      title: quoteData.title,
      description: quoteData.description,
      createdAt: quoteData.createdAt,
      expiresAt: quoteData.expiresAt,
      status: quoteData.status,
      customer: {
        name: quoteData.customer.name,
        email: quoteData.customer.email,
        phone: quoteData.customer.phone,
        address: quoteData.customer.billingAddress,
      },
      organization: {
        name: quoteData.organization.name,
        address: quoteData.organization.address,
        phone: quoteData.organization.phone,
        email: quoteData.organization.email,
      },
      lineItems: quoteData.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.total),
      })),
      subtotal: parseFloat(quoteData.subtotal),
      taxTotal: parseFloat(quoteData.taxTotal),
      discount: parseFloat(quoteData.discount || 0),
      total: parseFloat(quoteData.total),
      currency: quoteData.currency,
      notes: quoteData.notes,
    });

    // Email content
    const subject = `Quote ${quoteData.number} - ${quoteData.organization.name}`;
    const html = this.getQuoteEmailTemplate(recipientName, quoteData);

    // Send email
    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      attachments: [
        {
          filename: `Quote_${quoteData.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceData: any,
  ): Promise<void> {
    // Generate PDF
    const pdfBuffer = await this.pdfService.generateInvoicePdf({
      number: invoiceData.number,
      title: invoiceData.job?.title || 'Service Invoice',
      description: invoiceData.job?.description,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      paidDate: invoiceData.paidDate,
      status: invoiceData.status,
      customer: {
        name: invoiceData.customer.name,
        email: invoiceData.customer.email,
        phone: invoiceData.customer.phone,
        address: invoiceData.customer.billingAddress,
      },
      organization: {
        name: invoiceData.organization.name,
        address: invoiceData.organization.address,
        phone: invoiceData.organization.phone,
        email: invoiceData.organization.email,
      },
      lineItems: invoiceData.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.total),
      })),
      subtotal: parseFloat(invoiceData.subtotal),
      taxTotal: parseFloat(invoiceData.taxTotal),
      discount: parseFloat(invoiceData.discount || 0),
      total: parseFloat(invoiceData.total),
      currency: invoiceData.currency,
      notes: invoiceData.notes,
      paymentInstructions: invoiceData.paymentInstructions,
    });

    // Email content
    const subject = `Invoice ${invoiceData.number} - ${invoiceData.organization.name}`;
    const html = this.getInvoiceEmailTemplate(recipientName, invoiceData);

    // Send email
    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      attachments: [
        {
          filename: `Invoice_${invoiceData.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Get quote email template
   */
  private getQuoteEmailTemplate(recipientName: string, quoteData: any): string {
    const expiryDate = quoteData.expiresAt
      ? new Date(quoteData.expiresAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .info-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .label { font-weight: bold; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Quote from ${quoteData.organization.name}</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>Thank you for your interest in our services. Please find your quote attached to this email.</p>

              <div class="info-box">
                <p><span class="label">Quote Number:</span> ${quoteData.number}</p>
                <p><span class="label">Title:</span> ${quoteData.title || 'Service Quote'}</p>
                <p><span class="label">Total Amount:</span> ${this.formatCurrency(quoteData.total, quoteData.currency)}</p>
                <p><span class="label">Valid Until:</span> ${expiryDate}</p>
              </div>

              <p>The quote is attached as a PDF document. Please review it and let us know if you have any questions.</p>

              <p>We look forward to working with you!</p>
            </div>
            <div class="footer">
              <p>${quoteData.organization.name}</p>
              <p>${quoteData.organization.email || ''} | ${quoteData.organization.phone || ''}</p>
              <p>${quoteData.organization.address || ''}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get invoice email template
   */
  private getInvoiceEmailTemplate(recipientName: string, invoiceData: any): string {
    const dueDate = invoiceData.dueDate
      ? new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Upon receipt';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .info-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .amount-due { background-color: #eff6ff; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
            .amount-due h2 { margin: 0; color: #1f2937; font-size: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice from ${invoiceData.organization.name}</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>Thank you for your business. Please find your invoice attached to this email.</p>

              <div class="info-box">
                <p><span class="label">Invoice Number:</span> ${invoiceData.number}</p>
                <p><span class="label">Invoice Date:</span> ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-US')}</p>
                <p><span class="label">Due Date:</span> ${dueDate}</p>
              </div>

              <div class="amount-due">
                <p style="margin: 0; color: #6b7280;">Amount Due</p>
                <h2>${this.formatCurrency(invoiceData.total, invoiceData.currency)}</h2>
              </div>

              ${invoiceData.paymentInstructions ? `
                <div class="info-box">
                  <p><span class="label">Payment Instructions:</span></p>
                  <p>${invoiceData.paymentInstructions}</p>
                </div>
              ` : ''}

              <p>The invoice is attached as a PDF document. Please remit payment by the due date.</p>

              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>${invoiceData.organization.name}</p>
              <p>${invoiceData.organization.email || ''} | ${invoiceData.organization.phone || ''}</p>
              <p>${invoiceData.organization.address || ''}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number | string, currency: string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const symbol = currency === 'USD' ? '$' : '$';
    return `${symbol}${numAmount.toFixed(2)}`;
  }
}
