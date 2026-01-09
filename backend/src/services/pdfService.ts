// src/services/pdfService.ts
import { jsPDF } from 'jspdf';
import type { Invoice } from '../types';

// Company info (same as in ShareableInvoice)
const COMPANY_INFO = {
  name: 'Invoicey',
  email: 'hello@invoicey.com',
  phone: '+1 (555) 000-1234',
  address: '100 Main Street, Suite 200, San Francisco, CA 94105',
};

// Format currency
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Format date
const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(date)
  );

// Colors
const COLORS = {
  primary: '#4f46e5', // indigo-600
  text: '#1e293b', // slate-800
  textLight: '#64748b', // slate-500
  border: '#e2e8f0', // slate-200
  background: '#f8fafc', // slate-50
};

/**
 * Generate a PDF for an invoice
 * @param invoice - The invoice to generate PDF for
 * @returns Blob containing the PDF data
 */
export function generateInvoicePDF(invoice: Invoice): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add text with color
  const setTextColor = (color: string) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setTextColor(r, g, b);
  };

  // ===== HEADER SECTION =====
  // Company logo placeholder (colored rectangle)
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(margin, y, 12, 12, 'F');
  
  // Company name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.text);
  doc.text(COMPANY_INFO.name, margin + 16, y + 9);

  // Invoice title and number (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.textLight);
  doc.text('INVOICE', pageWidth - margin, y + 4, { align: 'right' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.text);
  doc.text(invoice.invoiceNumber, pageWidth - margin, y + 12, { align: 'right' });

  y += 20;

  // Company contact info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColor(COLORS.textLight);
  doc.text(COMPANY_INFO.email, margin, y);
  y += 5;
  doc.text(COMPANY_INFO.phone, margin, y);
  y += 5;
  doc.text(COMPANY_INFO.address, margin, y);

  // Status badge (right side)
  const statusColors: Record<string, string> = {
    paid: '#10b981',
    sent: '#3b82f6',
    overdue: '#ef4444',
    draft: '#64748b',
  };
  const statusColor = statusColors[invoice.status] || COLORS.textLight;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const statusR = parseInt(statusColor.slice(1, 3), 16);
  const statusG = parseInt(statusColor.slice(3, 5), 16);
  const statusB = parseInt(statusColor.slice(5, 7), 16);
  doc.setTextColor(statusR, statusG, statusB);
  doc.text(invoice.status.toUpperCase(), pageWidth - margin, y - 5, { align: 'right' });

  y += 15;

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // ===== BILLING DETAILS SECTION =====
  // Bill To (left side)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.textLight);
  doc.text('BILL TO', margin, y);

  // Dates (right side)
  doc.text('ISSUE DATE', pageWidth - margin - 50, y);
  doc.text('DUE DATE', pageWidth - margin - 50, y + 20);

  y += 6;

  // Client details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.text);
  doc.text(invoice.client.name, margin, y);

  // Issue date value
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.issueDate), pageWidth - margin - 50, y);

  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColor(COLORS.textLight);
  
  if (invoice.client.company) {
    doc.text(invoice.client.company, margin, y);
    y += 4;
  }
  
  doc.text(invoice.client.email, margin, y);
  y += 4;

  if (invoice.client.address) {
    // Split long addresses
    const addressLines = doc.splitTextToSize(invoice.client.address, 80);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4;
  }

  // Due date value
  setTextColor(invoice.status === 'overdue' ? '#ef4444' : COLORS.text);
  doc.setFont('helvetica', invoice.status === 'overdue' ? 'bold' : 'normal');
  doc.text(formatDate(invoice.dueDate), pageWidth - margin - 50, y - 8);

  y += 10;

  // Divider line
  setTextColor(COLORS.text);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // ===== LINE ITEMS TABLE =====
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.textLight);
  doc.text('ITEMS', margin, y);

  y += 8;

  // Table header
  const colWidths = {
    description: contentWidth * 0.5,
    qty: contentWidth * 0.12,
    rate: contentWidth * 0.19,
    amount: contentWidth * 0.19,
  };

  // Header background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, y - 4, contentWidth, 10, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.textLight);
  
  let xPos = margin + 4;
  doc.text('DESCRIPTION', xPos, y + 2);
  xPos += colWidths.description;
  doc.text('QTY', xPos, y + 2, { align: 'center' });
  xPos += colWidths.qty;
  doc.text('RATE', xPos + colWidths.rate - 4, y + 2, { align: 'right' });
  xPos += colWidths.rate;
  doc.text('AMOUNT', xPos + colWidths.amount - 4, y + 2, { align: 'right' });

  y += 10;

  // Table rows
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  invoice.lineItems.forEach((item) => {
    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    setTextColor(COLORS.text);
    xPos = margin + 4;
    
    // Description (may need to wrap)
    const descLines = doc.splitTextToSize(item.description, colWidths.description - 8);
    doc.text(descLines, xPos, y);
    
    xPos += colWidths.description;
    setTextColor(COLORS.textLight);
    doc.text(item.quantity.toString(), xPos, y, { align: 'center' });
    
    xPos += colWidths.qty;
    doc.text(formatCurrency(item.rate), xPos + colWidths.rate - 4, y, { align: 'right' });
    
    xPos += colWidths.rate;
    setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.amount), xPos + colWidths.amount - 4, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += Math.max(descLines.length * 5, 8);

    // Row divider
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  y += 6;

  // ===== TOTALS SECTION =====
  const totalsX = pageWidth - margin - 80;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColor(COLORS.textLight);
  doc.text('Subtotal', totalsX, y);
  setTextColor(COLORS.text);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, y, { align: 'right' });

  y += 6;

  setTextColor(COLORS.textLight);
  doc.text('Tax', totalsX, y);
  setTextColor(COLORS.text);
  doc.text(formatCurrency(invoice.tax), pageWidth - margin, y, { align: 'right' });

  y += 4;

  // Total divider
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX, y, pageWidth - margin, y);

  y += 6;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setTextColor(COLORS.text);
  doc.text('Total', totalsX, y);
  doc.setFontSize(14);
  doc.text(formatCurrency(invoice.total), pageWidth - margin, y, { align: 'right' });

  y += 15;

  // ===== NOTES SECTION =====
  if (invoice.notes) {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    // Notes background
    doc.setFillColor(248, 250, 252); // slate-50
    const notesLines = doc.splitTextToSize(invoice.notes, contentWidth - 16);
    const notesHeight = notesLines.length * 5 + 16;
    doc.rect(margin, y, contentWidth, notesHeight, 'F');

    y += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTextColor(COLORS.textLight);
    doc.text('NOTES', margin + 8, y);

    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setTextColor(COLORS.textLight);
    doc.text(notesLines, margin + 8, y);

    y += notesHeight - 8;
  }

  // ===== FOOTER =====
  y += 10;
  
  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColor(COLORS.textLight);
  doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });

  // Return as Blob
  return doc.output('blob');
}

/**
 * Download an invoice as PDF
 * @param invoice - The invoice to download
 */
export async function downloadInvoicePDF(invoice: Invoice): Promise<void> {
  const blob = generateInvoicePDF(invoice);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoiceNumber}.pdf`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export the PDF service interface
export const pdfService = {
  generateInvoicePDF,
  downloadInvoicePDF,
};
