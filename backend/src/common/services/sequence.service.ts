import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sequence Service - Generates sequential numbers for entities
 * Format: PREFIX-YYYY-######
 * Thread-safe using database transactions
 */
@Injectable()
export class SequenceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate next number for a given type
   * @param type - Entity type (QUOTE, JOB, INVOICE, etc.)
   * @param prefix - Prefix for the number (Q, J, INV, etc.)
   * @returns Formatted number string (e.g., INV-2024-000001)
   */
  async getNext(type: string, prefix: string): Promise<string> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not set');
    }

    const year = new Date().getFullYear();

    // Use transaction to ensure thread-safety
    const sequence = await this.prisma.$transaction(async (tx: any) => {
      // Find or create sequence for this tenant, type, and year
      let seq = await tx.sequence.findUnique({
        where: {
          tenantId_type_year: {
            tenantId,
            type,
            year,
          },
        },
      });

      if (!seq) {
        seq = await tx.sequence.create({
          data: {
            tenantId,
            type,
            year,
            value: 1,
          },
        });
      } else {
        seq = await tx.sequence.update({
          where: {
            id: seq.id,
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
    return `${prefix}-${year}-${paddedNumber}`;
  }
}
