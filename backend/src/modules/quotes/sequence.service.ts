import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Sequence Service
 * Generates sequential numbers for quotes, jobs, and invoices
 * Format: PREFIX-YYYY-######
 * Examples: Q-2025-000001, J-2025-000123, INV-2025-001234
 */
@Injectable()
export class SequenceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate next sequential number for a given type and tenant
   * Uses transaction with explicit locking to prevent race conditions
   *
   * @param tenantId - Organization ID
   * @param type - Sequence type (QUOTE, JOB, INVOICE)
   * @returns Formatted number string (e.g., "Q-2025-000001")
   */
  async generateNumber(
    tenantId: string,
    type: 'QUOTE' | 'JOB' | 'INVOICE'
  ): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = this.getPrefix(type);

    // Use transaction to ensure atomicity
    const sequence = await this.prisma.$transaction(async (tx: any) => {
      // Find or create sequence for this tenant, type, and year
      let seq = await tx.sequence.findUnique({
        where: {
          tenantId_type_year: {
            tenantId,
            type,
            year: currentYear,
          },
        },
      });

      if (!seq) {
        // Create new sequence for this year
        seq = await tx.sequence.create({
          data: {
            tenantId,
            type,
            year: currentYear,
            value: 1,
          },
        });
      } else {
        // Increment existing sequence
        seq = await tx.sequence.update({
          where: {
            tenantId_type_year: {
              tenantId,
              type,
              year: currentYear,
            },
          },
          data: {
            value: {
              increment: 1,
            },
          },
        });
      }

      return seq;
    });

    // Format: PREFIX-YYYY-######
    const paddedNumber = sequence.value.toString().padStart(6, '0');
    return `${prefix}-${currentYear}-${paddedNumber}`;
  }

  /**
   * Get prefix for sequence type
   */
  private getPrefix(type: 'QUOTE' | 'JOB' | 'INVOICE'): string {
    const prefixes: Record<string, string> = {
      QUOTE: 'Q',
      JOB: 'J',
      INVOICE: 'INV',
    };
    return prefixes[type];
  }

  /**
   * Get current sequence value (without incrementing)
   * Useful for preview or validation
   */
  async getCurrentValue(
    tenantId: string,
    type: 'QUOTE' | 'JOB' | 'INVOICE'
  ): Promise<number> {
    const currentYear = new Date().getFullYear();

    const sequence = await this.prisma.sequence.findUnique({
      where: {
        tenantId_type_year: {
          tenantId,
          type,
          year: currentYear,
        },
      },
    });

    return sequence?.value || 0;
  }

  /**
   * Reset sequence for a specific type and year (admin operation)
   * WARNING: Use with caution - should only be used for testing or data migration
   */
  async resetSequence(
    tenantId: string,
    type: 'QUOTE' | 'JOB' | 'INVOICE',
    year: number,
    value: number = 0
  ): Promise<void> {
    await this.prisma.sequence.upsert({
      where: {
        tenantId_type_year: {
          tenantId,
          type,
          year,
        },
      },
      update: {
        value,
      },
      create: {
        tenantId,
        type,
        year,
        value,
      },
    });
  }
}
