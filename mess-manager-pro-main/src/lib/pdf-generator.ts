import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';
import type { Database } from '@/integrations/supabase/types';

type Expense = Database['public']['Tables']['expenses']['Row'];

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Groceries',
  utilities: 'Utilities',
  rent: 'Rent',
  salaries: 'Salaries',
  maintenance: 'Maintenance',
  other: 'Other',
};

export async function generateExpenseReport(
  expenses: Expense[],
  fromDate: Date,
  toDate: Date,
  businessName: string
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Title page and summary
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, margin, 30);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Expense Audit Report', margin, 42);

  doc.setFontSize(12);
  doc.text(`Period: ${formatDate(fromDate)} - ${formatDate(toDate)}`, margin, 55);
  doc.text(`Generated: ${formatDate(new Date())}`, margin, 65);

  // Summary table
  const tableData = expenses.map((e) => [
    formatDate(new Date(e.date)),
    e.description,
    EXPENSE_CATEGORY_LABELS[e.category] || e.category,
    formatCurrency(Number(e.amount)),
    e.receipt_url ? 'Yes' : 'No',
  ]);

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  autoTable(doc, {
    startY: 80,
    head: [['Date', 'Description', 'Category', 'Amount', 'Receipt']],
    body: tableData,
    foot: [['', '', 'Total', formatCurrency(totalAmount), '']],
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [230, 126, 34] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  // Receipt pages
  for (const expense of expenses) {
    doc.addPage();

    // Header for each receipt page
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Receipt', margin, 25);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(new Date(expense.date))}`, margin, 38);
    doc.text(`Description: ${expense.description}`, margin, 48);
    doc.text(`Category: ${EXPENSE_CATEGORY_LABELS[expense.category] || expense.category}`, margin, 58);
    doc.text(`Amount: ${formatCurrency(Number(expense.amount))}`, margin, 68);

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 75, pageWidth - margin, 75);

    if (expense.receipt_url) {
      try {
        // Attempt to load and add the image
        const img = await loadImage(expense.receipt_url);
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = Math.min((img.height / img.width) * imgWidth, pageHeight - 100);
        
        doc.addImage(img, 'JPEG', margin, 85, imgWidth, imgHeight);
      } catch (error) {
        console.error('Failed to load receipt image:', error);
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('Receipt image could not be loaded', margin, 95);
        doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text('No Receipt Uploaded', margin, 95);
      doc.setTextColor(0, 0, 0);
    }
  }

  // Save the PDF
  const fileName = `expense-report-${formatDateForFile(fromDate)}-to-${formatDateForFile(toDate)}.pdf`;
  doc.save(fileName);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function formatDateForFile(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Invoice generation for members with sequential numbering and branding
export async function generateMemberInvoice(
  memberName: string,
  amount: number,
  businessName: string,
  taxTrn?: string | null,
  taxRate: number = 5,
  taxName: string = 'VAT',
  invoiceNumber?: number,
  companyAddress?: string | null,
  companyLogoUrl?: string | null
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Format invoice number as INV-001, INV-002, etc.
  const formattedInvoiceNumber = invoiceNumber 
    ? `INV-${String(invoiceNumber).padStart(3, '0')}`
    : `INV-${Date.now().toString().slice(-6)}`;
  const today = new Date();

  let yPosition = 25;

  // Add company logo if available
  if (companyLogoUrl) {
    try {
      const img = await loadImage(companyLogoUrl);
      const logoHeight = 20;
      const logoWidth = (img.width / img.height) * logoHeight;
      doc.addImage(img, 'PNG', margin, 15, Math.min(logoWidth, 50), logoHeight);
      yPosition = 45;
    } catch (error) {
      console.error('Failed to load company logo:', error);
    }
  }

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, margin, yPosition);
  yPosition += 8;

  // Company address
  if (companyAddress) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(companyAddress, margin, yPosition);
    yPosition += 6;
    doc.setTextColor(0, 0, 0);
  }

  // Invoice title on the right
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin - 50, 30);

  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${formattedInvoiceNumber}`, pageWidth - margin - 60, 45);
  doc.text(`Date: ${formatDate(today)}`, pageWidth - margin - 60, 53);

  if (taxTrn) {
    doc.text(`TRN: ${taxTrn}`, margin, yPosition);
    yPosition += 8;
  }

  yPosition = Math.max(yPosition, 70);

  // Bill To
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(memberName, margin, yPosition + 10);

  yPosition += 25;

  // Calculate amounts
  const subtotal = amount / (1 + taxRate / 100);
  const taxAmount = amount - subtotal;

  // Invoice table
  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Amount']],
    body: [
      ['Monthly Mess Subscription', formatCurrency(subtotal)],
      [`${taxName} (${taxRate}%)`, formatCurrency(taxAmount)],
    ],
    foot: [['Total', formatCurrency(amount)]],
    theme: 'striped',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [230, 126, 34] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'right' },
    },
  });

  // Add "PAID" watermark
  doc.setFontSize(60);
  doc.setTextColor(0, 200, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageWidth / 2 - 30, doc.internal.pageSize.getHeight() / 2, {
    angle: 45,
  });
  doc.setTextColor(0, 0, 0);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', margin, doc.internal.pageSize.getHeight() - 30);

  // Save with invoice number
  const fileName = `${formattedInvoiceNumber}-${memberName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(fileName);
}
