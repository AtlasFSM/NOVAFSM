import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { PdfService } from './pdf.service';

describe('EmailService', () => {
  let service: EmailService;
  let pdfService: PdfService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'email.provider': 'smtp',
        'email.smtp.host': 'localhost',
        'email.smtp.port': 1025,
        'email.smtp.secure': false,
        'email.from': 'test@novafsm.com',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockPdfService = {
    generateQuotePdf: jest.fn(),
    generateInvoicePdf: jest.fn(),
  };

  const mockTransporter = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    pdfService = module.get<PdfService>(PdfService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock transporter
    (service as any).transporter = mockTransporter;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendQuoteEmail', () => {
    it('should send quote email with PDF attachment', async () => {
      const recipientEmail = 'customer@test.com';
      const recipientName = 'John Doe';
      const quoteData = {
        number: 'Q-2025-001',
        title: 'Service Quote',
        description: 'Test quote',
        createdAt: new Date(),
        expiresAt: new Date('2025-12-31'),
        status: 'SENT',
        customer: {
          name: 'Test Customer',
          email: 'customer@test.com',
          phone: '555-1234',
          billingAddress: '123 Main St',
        },
        organization: {
          name: 'Acme Services',
          address: '456 Business Rd',
          phone: '555-5678',
          email: 'info@acme.com',
        },
        lineItems: [
          {
            description: 'Service 1',
            quantity: 2,
            unitPrice: '100.00',
            total: '200.00',
          },
        ],
        subtotal: '200.00',
        taxTotal: '20.00',
        discount: '0.00',
        total: '220.00',
        currency: 'CAD',
        notes: 'Thank you',
      };

      const mockPdfBuffer = Buffer.from('PDF content');
      mockPdfService.generateQuotePdf.mockResolvedValue(mockPdfBuffer);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-123' });

      await service.sendQuoteEmail(recipientEmail, recipientName, quoteData);

      expect(mockPdfService.generateQuotePdf).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipientEmail,
          subject: expect.stringContaining(quoteData.number),
          html: expect.any(String),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: `Quote_${quoteData.number}.pdf`,
              content: mockPdfBuffer,
              contentType: 'application/pdf',
            }),
          ]),
        }),
      );
    });

    it('should handle quote email sending errors', async () => {
      const quoteData = {
        number: 'Q-2025-002',
        customer: { name: 'Test', email: 'test@test.com', phone: '', billingAddress: '' },
        organization: { name: 'Org' },
        lineItems: [],
        subtotal: '0',
        taxTotal: '0',
        total: '0',
        currency: 'USD',
      };

      mockPdfService.generateQuotePdf.mockResolvedValue(Buffer.from('PDF'));
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.sendQuoteEmail('test@test.com', 'Test', quoteData),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should send invoice email with PDF attachment', async () => {
      const recipientEmail = 'customer@test.com';
      const recipientName = 'Jane Smith';
      const invoiceData = {
        number: 'INV-2025-001',
        invoiceDate: new Date(),
        dueDate: new Date('2025-12-31'),
        paidDate: null,
        status: 'PENDING',
        job: {
          title: 'Repair Job',
          description: 'Fix HVAC',
        },
        customer: {
          name: 'Test Customer',
          email: 'customer@test.com',
          phone: '555-1234',
          billingAddress: '123 Main St',
        },
        organization: {
          name: 'Acme Services',
          address: '456 Business Rd',
          phone: '555-5678',
          email: 'info@acme.com',
        },
        lineItems: [
          {
            description: 'Labor',
            quantity: 3,
            unitPrice: '75.00',
            total: '225.00',
          },
        ],
        subtotal: '225.00',
        taxTotal: '22.50',
        discount: '0.00',
        total: '247.50',
        currency: 'USD',
        notes: 'Payment terms: Net 30',
        paymentInstructions: 'Bank transfer or check',
      };

      const mockPdfBuffer = Buffer.from('Invoice PDF content');
      mockPdfService.generateInvoicePdf.mockResolvedValue(mockPdfBuffer);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'invoice-123' });

      await service.sendInvoiceEmail(recipientEmail, recipientName, invoiceData);

      expect(mockPdfService.generateInvoicePdf).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipientEmail,
          subject: expect.stringContaining(invoiceData.number),
          html: expect.any(String),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: `Invoice_${invoiceData.number}.pdf`,
              content: mockPdfBuffer,
              contentType: 'application/pdf',
            }),
          ]),
        }),
      );
    });

    it('should handle invoice without payment instructions', async () => {
      const invoiceData = {
        number: 'INV-2025-002',
        invoiceDate: new Date(),
        customer: { name: 'Test', email: 'test@test.com', phone: '', billingAddress: '' },
        organization: { name: 'Org' },
        lineItems: [],
        subtotal: '0',
        taxTotal: '0',
        total: '0',
        currency: 'CAD',
        paymentInstructions: null,
      };

      mockPdfService.generateInvoicePdf.mockResolvedValue(Buffer.from('PDF'));
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await service.sendInvoiceEmail('test@test.com', 'Test', invoiceData);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    it('should initialize with SMTP provider', () => {
      expect(configService.get).toHaveBeenCalled();
      expect(service).toBeDefined();
    });

    it('should handle SendGrid provider', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'email.provider') return 'sendgrid';
        if (key === 'email.sendgrid.apiKey') return 'test-api-key';
        return undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: PdfService, useValue: mockPdfService },
        ],
      }).compile();

      const emailService = module.get<EmailService>(EmailService);
      expect(emailService).toBeDefined();
    });

    it('should handle AWS SES provider', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'email.provider') return 'ses';
        if (key === 'email.ses.region') return 'us-east-1';
        if (key === 'email.ses.accessKeyId') return 'test-key';
        if (key === 'email.ses.secretAccessKey') return 'test-secret';
        return undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: PdfService, useValue: mockPdfService },
        ],
      }).compile();

      const emailService = module.get<EmailService>(EmailService);
      expect(emailService).toBeDefined();
    });
  });
});
