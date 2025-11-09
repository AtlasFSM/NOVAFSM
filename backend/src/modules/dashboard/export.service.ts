import { Injectable, Logger } from '@nestjs/common';
import { ExportDashboardDto, ExportFormat, DashboardStatsDto, DashboardChartsDto } from './dto';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Export dashboard data in requested format
   */
  async exportDashboard(
    data: { stats: DashboardStatsDto; charts: DashboardChartsDto },
    exportDto: ExportDashboardDto,
  ): Promise<Buffer | string> {
    this.logger.log(`Exporting dashboard data in format: ${exportDto.format}`);

    switch (exportDto.format) {
      case ExportFormat.CSV:
        return this.exportToCSV(data, exportDto);
      case ExportFormat.EXCEL:
        return this.exportToExcel(data, exportDto);
      case ExportFormat.PDF:
        return this.exportToPDF(data, exportDto);
      case ExportFormat.JSON:
        return this.exportToJSON(data, exportDto);
      default:
        throw new Error(`Unsupported export format: ${exportDto.format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(
    data: { stats: DashboardStatsDto; charts: DashboardChartsDto },
    exportDto: ExportDashboardDto,
  ): Promise<string> {
    const lines: string[] = [];

    // Stats section
    lines.push('Dashboard Statistics');
    lines.push('');
    lines.push('Metric,Current Value,Previous Value,Growth (%)');
    lines.push(`Total Customers,${data.stats.totalCustomers.count},${data.stats.totalCustomers.previousValue || 'N/A'},${data.stats.totalCustomers.growth?.toFixed(2) || 'N/A'}`);
    lines.push(`Active Jobs,${data.stats.activeJobs.count},${data.stats.activeJobs.previousValue || 'N/A'},${data.stats.activeJobs.growth?.toFixed(2) || 'N/A'}`);
    lines.push(`Revenue,${data.stats.revenueThisMonth.amount},${data.stats.revenueThisMonth.previousAmount || 'N/A'},${data.stats.revenueThisMonth.growth?.toFixed(2) || 'N/A'}`);
    lines.push(`Pending Quotes,${data.stats.pendingQuotes.count},${data.stats.pendingQuotes.previousValue || 'N/A'},${data.stats.pendingQuotes.growth?.toFixed(2) || 'N/A'}`);

    // Job status breakdown
    lines.push('');
    lines.push('Job Status Breakdown');
    lines.push('Status,Count');
    lines.push(`Scheduled,${data.stats.activeJobs.byStatus.scheduled}`);
    lines.push(`In Progress,${data.stats.activeJobs.byStatus.inProgress}`);
    lines.push(`Completed,${data.stats.activeJobs.byStatus.completed}`);
    lines.push(`Cancelled,${data.stats.activeJobs.byStatus.cancelled}`);
    lines.push(`On Hold,${data.stats.activeJobs.byStatus.onHold}`);

    // Technician performance
    if (data.charts.technicianPerformance && data.charts.technicianPerformance.length > 0) {
      lines.push('');
      lines.push('Technician Performance');
      lines.push('Name,Jobs Completed,Avg Completion Time (hrs),Utilization Rate (%),Revenue');
      data.charts.technicianPerformance.forEach(tech => {
        lines.push(`${tech.name},${tech.jobsCompleted},${tech.avgCompletionTime},${tech.utilizationRate},${tech.revenue || 0}`);
      });
    }

    // Top customers
    if (data.charts.topCustomers && data.charts.topCustomers.length > 0) {
      lines.push('');
      lines.push('Top Customers');
      lines.push('Customer Name,Total Revenue,Jobs Count,Avg Job Value,Last Job Date');
      data.charts.topCustomers.forEach(customer => {
        lines.push(`${customer.name},${customer.totalRevenue},${customer.jobsCount},${customer.avgJobValue},${customer.lastJobDate}`);
      });
    }

    // Revenue trend
    if (data.charts.revenueTrend && data.charts.revenueTrend.length > 0) {
      lines.push('');
      lines.push('Revenue Trend');
      lines.push('Month,Revenue,Invoiced,Paid,Outstanding');
      data.charts.revenueTrend.forEach(item => {
        lines.push(`${item.month},${item.revenue},${item.invoiced || 0},${item.paid || 0},${item.outstanding || 0}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Export to Excel format (simplified - returns CSV for now)
   * In production, use a library like 'exceljs' or 'xlsx'
   */
  private async exportToExcel(
    data: { stats: DashboardStatsDto; charts: DashboardChartsDto },
    exportDto: ExportDashboardDto,
  ): Promise<string> {
    // For a full implementation, install and use 'exceljs':
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet('Dashboard');
    // ... populate cells ...
    // return await workbook.xlsx.writeBuffer();

    // For now, return CSV format
    this.logger.warn('Excel export not fully implemented - returning CSV format');
    return this.exportToCSV(data, exportDto);
  }

  /**
   * Export to PDF format (simplified - returns text for now)
   * In production, use a library like 'pdfkit' or 'puppeteer'
   */
  private async exportToPDF(
    data: { stats: DashboardStatsDto; charts: DashboardChartsDto },
    exportDto: ExportDashboardDto,
  ): Promise<string> {
    // For a full implementation, install and use 'pdfkit':
    // const PDFDocument = require('pdfkit');
    // const doc = new PDFDocument();
    // doc.fontSize(20).text('Dashboard Report', { align: 'center' });
    // ... add content ...
    // return doc buffer

    // For now, return formatted text
    this.logger.warn('PDF export not fully implemented - returning text format');

    let content = 'DASHBOARD REPORT\n';
    content += '='.repeat(50) + '\n\n';

    content += 'KEY PERFORMANCE INDICATORS\n';
    content += '-'.repeat(50) + '\n';
    content += `Total Customers: ${data.stats.totalCustomers.count}\n`;
    content += `Active Jobs: ${data.stats.activeJobs.count}\n`;
    content += `Revenue: $${data.stats.revenueThisMonth.amount.toLocaleString()}\n`;
    content += `Pending Quotes: ${data.stats.pendingQuotes.count}\n\n`;

    if (data.stats.activeJobs.overdue) {
      content += `⚠️ Overdue Jobs: ${data.stats.activeJobs.overdue}\n`;
    }
    if (data.stats.activeJobs.dueToday) {
      content += `📅 Jobs Due Today: ${data.stats.activeJobs.dueToday}\n`;
    }

    content += '\n' + '='.repeat(50) + '\n';

    return content;
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(
    data: { stats: DashboardStatsDto; charts: DashboardChartsDto },
    exportDto: ExportDashboardDto,
  ): Promise<string> {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      data,
      filters: exportDto,
    }, null, 2);
  }
}
