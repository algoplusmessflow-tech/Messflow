import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditReport } from '@/hooks/useAuditReport';
import { formatCurrencyWithCode, CurrencyCode } from './currencies';

export async function generateAuditPDF(
  report: AuditReport,
  businessName: string,
  businessAddress: string,
  currency: CurrencyCode = 'AED'
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  const formatAmount = (amount: number) => formatCurrencyWithCode(amount, currency);

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTHLY AUDIT REPORT', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.month} ${report.year}`, pageWidth / 2, yPos, { align: 'center' });

  // Business Info
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, margin, yPos);
  
  if (businessAddress) {
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(businessAddress, margin, yPos);
  }

  // Executive Summary Box
  yPos += 15;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 45, 'S');

  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', margin + 5, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Total Revenue:', formatAmount(report.totalRevenue)],
    ['Fixed Costs (Rent + Salaries):', formatAmount(report.totalFixedCosts)],
    ['Variable Costs:', formatAmount(report.totalVariableCosts)],
  ];

  summaryData.forEach(([label, value]) => {
    doc.text(label, margin + 5, yPos);
    doc.text(value, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 6;
  });

  // Net Profit/Loss
  yPos += 2;
  doc.setFont('helvetica', 'bold');
  const profitLabel = report.netProfit >= 0 ? 'NET PROFIT:' : 'NET LOSS:';
  doc.setTextColor(report.netProfit >= 0 ? 34 : 220, report.netProfit >= 0 ? 139 : 38, report.netProfit >= 0 ? 34 : 38);
  doc.text(profitLabel, margin + 5, yPos);
  doc.text(formatAmount(Math.abs(report.netProfit)), pageWidth - margin - 5, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Category Breakdown
  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPENSE BREAKDOWN', margin, yPos);

  yPos += 5;
  if (report.categoryBreakdown.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount', '%']],
      body: report.categoryBreakdown.map(c => [
        c.category,
        formatAmount(c.amount),
        `${c.percentage}%`
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No expenses recorded this month.', margin, yPos);
    yPos += 10;
  }

  // Salary Manifest
  if (report.salaryManifest.length > 0) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALARY MANIFEST', margin, yPos);

    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Staff Name', 'Role', 'Base Salary', 'Paid', 'Status']],
      body: report.salaryManifest.map(s => [
        s.staffName,
        s.role.charAt(0).toUpperCase() + s.role.slice(1),
        formatAmount(s.baseSalary),
        formatAmount(s.paidAmount),
        s.status.toUpperCase()
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const value = data.cell.raw as string;
          if (value === 'PAID') {
            data.cell.styles.textColor = [34, 139, 34];
          } else {
            data.cell.styles.textColor = [220, 38, 38];
          }
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Petty Cash Summary
  if (report.pettyCashSummary.totalRefills > 0 || report.pettyCashSummary.totalSpent > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PETTY CASH SUMMARY', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Refills: ${formatAmount(report.pettyCashSummary.totalRefills)}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Spent: ${formatAmount(report.pettyCashSummary.totalSpent)}`, margin, yPos);
    yPos += 6;
    doc.text(`Closing Balance: ${formatAmount(report.pettyCashSummary.closingBalance)}`, margin, yPos);
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `Audit_Report_${report.month.substring(0, 3)}_${report.year}.pdf`;
  doc.save(fileName);
}
