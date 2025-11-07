import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadModelsService {
  constructor(private prisma: PrismaService) {}

  async getJobsWithCustomerNames(tenantId: string) {
    return this.prisma.job.findMany({
      where: { tenantId },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        scheduledStart: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getDashboardStats(tenantId: string) {
    const [activeJobs, pendingQuotes, overdueInvoices, totalCustomers] = await Promise.all([
      this.prisma.job.count({ where: { tenantId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
      this.prisma.quote.count({ where: { tenantId, status: 'SENT' } }),
      this.prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      this.prisma.customer.count({ where: { tenantId } }),
    ]);

    return { activeJobs, pendingQuotes, overdueInvoices, totalCustomers };
  }
}
