import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DayMenu {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  optionalDishes: string[];
}

export async function generateMenuPDF(
  weekNumber: number,
  menuData: DayMenu[],
  businessName: string,
  memberName?: string,
  planType?: string
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, pageWidth / 2, 20, { align: 'center' });
  
  // Week title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Week ${weekNumber} Menu`, pageWidth / 2, 32, { align: 'center' });
  
  // Member info if provided
  let startY = 45;
  if (memberName) {
    doc.setFontSize(12);
    doc.text(`Member: ${memberName}`, 14, startY);
    startY += 8;
    if (planType) {
      doc.text(`Plan: ${planType}`, 14, startY);
      startY += 8;
    }
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, startY);
    startY += 12;
  }
  
  // Menu table
  const tableData = menuData.map(item => [
    item.day,
    item.breakfast,
    item.lunch,
    item.dinner,
  ]);
  
  autoTable(doc, {
    startY: startY,
    head: [['Day', '🌅 Breakfast', '🌞 Lunch', '🌙 Dinner']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 50 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });
  
  // Optional dishes section
  const optionalItems = menuData.flatMap(item => 
    item.optionalDishes.map(dish => ({ day: item.day, dish }))
  ).filter(item => item.dish);
  
  if (optionalItems.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('✨ Optional Dishes', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Day', 'Optional Dish']],
      body: optionalItems.map(item => [item.day, item.dish]),
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  return doc.output('blob');
}

export async function generateMemberWelcomePDF(
  memberName: string,
  planType: string,
  monthlyFee: number,
  joiningDate: Date,
  businessName: string,
  weekMenus: { weekNumber: number; menu: DayMenu[] }[],
  currency: string = 'AED'
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, pageWidth / 2, 25, { align: 'center' });
  
  // Welcome message
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text('Welcome!', pageWidth / 2, 40, { align: 'center' });
  
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Member details box
  doc.setDrawColor(200);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 50, pageWidth - 28, 45, 3, 3, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Member Details', 20, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${memberName}`, 20, 72);
  doc.text(`Plan: ${planType}`, 20, 80);
  doc.text(`Monthly Fee: ${currency} ${monthlyFee.toFixed(2)}`, 20, 88);
  doc.text(`Joining Date: ${joiningDate.toLocaleDateString()}`, 110, 72);
  
  let currentY = 110;
  
  // Add menu for each week
  for (const weekData of weekMenus) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Week ${weekData.weekNumber} Menu`, 14, currentY);
    
    const tableData = weekData.menu.map(item => [
      item.day,
      item.breakfast,
      item.lunch,
      item.dinner,
    ]);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Day', 'Breakfast', 'Lunch', 'Dinner']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 },
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text('Thank you for joining us!', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  return doc.output('blob');
}
