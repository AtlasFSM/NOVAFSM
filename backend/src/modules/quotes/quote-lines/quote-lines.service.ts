import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateQuoteLineDto, UpdateQuoteLineDto } from '../dto/quote-line.dto';
import { Decimal } from '@prisma/client/runtime/library';

export interface TaxDetail {
  code: string;
  rate: number;
  amount: number;
}

export interface CalculatedLine {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discounts: number;
  amount: number;
  taxes: TaxDetail[];
  sku?: string;
  itemId?: string;
  sort: number;
}

/**
 * Quote Lines Service
 * Handles quote line item calculations, tax application, and CRUD operations
 */
@Injectable()
export class QuoteLinesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate line amount and taxes for a quote line
   * Amount = (quantity * unitPrice) - discounts
   * Taxes are calculated on the amount based on customer's location
   *
   * @param tenantId - Organization ID
   * @param line - Quote line data
   * @param provinceState - Province/State for tax calculation
   * @returns Calculated line with amount and taxes
   */
  async calculateLine(
    tenantId: string,
    line: CreateQuoteLineDto,
    provinceState?: string
  ): Promise<CalculatedLine> {
    // Calculate line amount: (qty * price) - discounts
    const subtotal = line.quantity * line.unitPrice;
    const amount = subtotal - (line.discounts || 0);

    // Fetch applicable taxes for this location
    const taxes = await this.calculateTaxes(tenantId, amount, provinceState);

    return {
      description: line.description,
      quantity: line.quantity,
      unit: line.unit || 'EA',
      unitPrice: line.unitPrice,
      discounts: line.discounts || 0,
      amount,
      taxes,
      sku: line.sku,
      itemId: line.itemId,
      sort: line.sort || 0,
    };
  }

  /**
   * Calculate taxes for a given amount based on province/state
   * Queries TaxRate table for applicable taxes
   *
   * @param tenantId - Organization ID
   * @param amount - Amount to calculate tax on
   * @param provinceState - Province (CA) or State (US)
   * @returns Array of tax details
   */
  async calculateTaxes(
    tenantId: string,
    amount: number,
    provinceState?: string
  ): Promise<TaxDetail[]> {
    if (!provinceState || amount <= 0) {
      return [];
    }

    // Query tax rates for this location
    const taxRates = await this.prisma.taxRate.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { provinceState }, // Specific to this province/state
          { provinceState: null }, // Federal/national taxes (like GST)
        ],
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Calculate tax amount for each applicable rate
    const taxes: TaxDetail[] = taxRates.map((taxRate) => {
      const rate = taxRate.rate instanceof Decimal
        ? taxRate.rate.toNumber()
        : Number(taxRate.rate);
      const taxAmount = amount * rate;

      return {
        code: taxRate.code,
        rate,
        amount: Math.round(taxAmount * 100) / 100, // Round to 2 decimals
      };
    });

    return taxes;
  }

  /**
   * Calculate totals for an array of lines
   * Returns subtotal, tax total, and grand total
   */
  calculateTotals(lines: CalculatedLine[]): {
    subtotal: number;
    taxTotal: number;
    total: number;
  } {
    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);

    const taxTotal = lines.reduce((sum, line) => {
      const lineTaxTotal = line.taxes.reduce(
        (taxSum, tax) => taxSum + tax.amount,
        0
      );
      return sum + lineTaxTotal;
    }, 0);

    const total = subtotal + taxTotal;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Create quote lines in the database
   * Should be called within a transaction
   */
  async createLines(
    tx: any, // Prisma transaction client
    tenantId: string,
    quoteId: string,
    calculatedLines: CalculatedLine[]
  ): Promise<void> {
    // Create all lines in bulk
    await tx.quoteLine.createMany({
      data: calculatedLines.map((line) => ({
        tenantId,
        quoteId,
        itemId: line.itemId || null,
        sku: line.sku || null,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        discounts: line.discounts,
        taxes: line.taxes, // Store as JSON
        amount: line.amount,
        sort: line.sort,
      })),
    });
  }

  /**
   * Update quote lines - deletes existing and creates new ones
   * Should be called within a transaction
   */
  async updateLines(
    tx: any, // Prisma transaction client
    tenantId: string,
    quoteId: string,
    calculatedLines: CalculatedLine[]
  ): Promise<void> {
    // Delete existing lines
    await tx.quoteLine.deleteMany({
      where: {
        tenantId,
        quoteId,
      },
    });

    // Create new lines
    await this.createLines(tx, tenantId, quoteId, calculatedLines);
  }

  /**
   * Delete all lines for a quote
   * Should be called within a transaction
   */
  async deleteLines(
    tx: any, // Prisma transaction client
    tenantId: string,
    quoteId: string
  ): Promise<void> {
    await tx.quoteLine.deleteMany({
      where: {
        tenantId,
        quoteId,
      },
    });
  }

  /**
   * Get lines for a quote
   */
  async getLines(tenantId: string, quoteId: string) {
    return this.prisma.quoteLine.findMany({
      where: {
        tenantId,
        quoteId,
      },
      orderBy: {
        sort: 'asc',
      },
    });
  }

  /**
   * Validate line items have positive amounts
   */
  validateLines(lines: CreateQuoteLineDto[]): void {
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error(`Line "${line.description}" must have positive quantity`);
      }
      if (line.unitPrice < 0) {
        throw new Error(`Line "${line.description}" must have non-negative unit price`);
      }
      if (line.discounts && line.discounts < 0) {
        throw new Error(`Line "${line.description}" must have non-negative discounts`);
      }
      // Ensure discounts don't exceed subtotal
      const subtotal = line.quantity * line.unitPrice;
      if (line.discounts && line.discounts > subtotal) {
        throw new Error(
          `Line "${line.description}" discounts cannot exceed subtotal`
        );
      }
    }
  }
}
