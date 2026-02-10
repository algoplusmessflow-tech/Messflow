import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF invoice, uploads it temporarily to storage, and opens WhatsApp with the link
 */
export async function shareInvoiceViaWhatsApp(
  memberName: string,
  memberPhone: string,
  amount: number,
  businessName: string,
  invoiceNumber: string,
  taxTrn?: string | null,
  taxRate: number = 5,
  taxName: string = 'VAT',
  companyAddress?: string | null
): Promise<void> {
  try {
    // Generate the PDF
    const pdfDoc = createInvoicePDF(
      memberName,
      amount,
      businessName,
      taxTrn || null,
      taxRate,
      taxName,
      invoiceNumber,
      companyAddress
    );
    
    // Convert PDF to blob
    const pdfBlob = pdfDoc.output('blob');
    
    // Generate unique filename
    const fileName = `invoices/${Date.now()}-${invoiceNumber}.pdf`;
    
    // Upload to receipts bucket (temporary)
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error('Failed to upload invoice: ' + uploadError.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    // Format phone number for WhatsApp
    const cleanPhone = memberPhone.replace(/[\s-]/g, '');
    const phoneWithCode = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : 
                          cleanPhone.startsWith('00') ? cleanPhone.slice(2) :
                          cleanPhone.startsWith('971') ? cleanPhone :
                          `971${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

    // Create WhatsApp message with PDF attachment
    const message = `🧾 *Invoice ${invoiceNumber}*

*${businessName}*

Dear ${memberName},

Your invoice for AED ${amount.toFixed(2)} is ready.

📎 Download your invoice here:
${publicUrl}

Thank you for your business! 🙏`;

    // Open WhatsApp with the PDF URL
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success('Opening WhatsApp with invoice link...');
    
  } catch (error: any) {
    console.error('Failed to share invoice:', error);
    toast.error('Failed to share invoice: ' + error.message);
    throw error;
  }
}

/**
 * Creates PDF content for an invoice and returns the jsPDF document
 */
export function createInvoicePDF(
  memberName: string,
  amount: number,
  businessName: string,
  taxTrn: string | null,
  taxRate: number,
  taxName: string,
  invoiceNumber: string,
  companyAddress?: string | null
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const today = new Date();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, margin, 30);

  if (companyAddress) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(companyAddress, margin, 40);
    doc.setTextColor(0, 0, 0);
  }

  // Invoice title on the right
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin - 50, 30);

  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - margin - 60, 45);
  doc.text(`Date: ${today.toLocaleDateString()}`, pageWidth - margin - 60, 53);

  let yPos = companyAddress ? 50 : 40;
  
  if (taxTrn) {
    doc.text(`TRN: ${taxTrn}`, margin, yPos);
    yPos += 8;
  }

  yPos = Math.max(yPos, 70);

  // Bill To
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(memberName, margin, yPos + 10);

  yPos += 25;

  // Calculate amounts
  const subtotal = amount / (1 + taxRate / 100);
  const taxAmount = amount - subtotal;

  // Invoice table
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount']],
    body: [
      ['Monthly Mess Subscription', `AED ${subtotal.toFixed(2)}`],
      [`${taxName} (${taxRate}%)`, `AED ${taxAmount.toFixed(2)}`],
    ],
    foot: [['Total', `AED ${amount.toFixed(2)}`]],
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

  return doc;
}
