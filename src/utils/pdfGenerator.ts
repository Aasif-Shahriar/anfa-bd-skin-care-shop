import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '../types';

/**
 * Generates and downloads an official ANFA BD Tax Invoice & Order Record as a PDF.
 * Uses html2canvas on the rendered receipt element when available for pixel-perfect design,
 * with a vector jsPDF drawing fallback.
 */
export async function downloadReceiptPdf(
  order: Order,
  element?: HTMLElement | null
): Promise<void> {
  const filename = `ANFA-Receipt-${order.orderNumber}.pdf`;

  // Strategy 1: High-res render from DOM element
  if (element) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2.5, // Crisp 2.5x retina resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20; // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pdfHeight - 20) {
        // Fits comfortably on a single A4 page
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        // Multi-page handling if receipt has dozens of items
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= (pdfHeight - 20);
        }
      }

      pdf.save(filename);
      return;
    } catch (err) {
      console.warn('[PDF GENERATOR] html2canvas capture failed, falling back to direct vector PDF:', err);
    }
  }

  // Strategy 2: Direct Vector jsPDF Generation (Clean, crisp, standalone)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // Header Bar
  doc.setFillColor(24, 2, 13); // Dark Plum/Charcoal
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');

  // Accent Line
  doc.setFillColor(255, 20, 147); // Neon Pink
  doc.rect(margin, y + 24, pageWidth - margin * 2, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ANFA BD', pageWidth / 2, y + 10, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(255, 105, 180);
  doc.text('GIRLS SKIN CARE BOUTIQUE • AUTHENTIC K-BEAUTY', pageWidth / 2, y + 16, { align: 'center' });

  y += 34;

  // Document meta block
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`OFFICIAL TAX INVOICE & ORDER RECORD`, margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Invoice No: #${order.orderNumber}  •  Issued: ${formattedDate}  •  Status: ${order.status}`, margin, y + 5);

  y += 12;

  // Customer & Shipping 2-column Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

  const colWidth = (pageWidth - margin * 2) / 2;

  // Left col: Customer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 20, 147);
  doc.text('BILL TO & DELIVER TO:', margin + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(order.customer.name || 'Valued Customer', margin + 4, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const addressLine = `${order.customer.address}, ${order.customer.city}${order.customer.postalCode ? ' - ' + order.customer.postalCode : ''}`;
  doc.text(doc.splitTextToSize(addressLine, colWidth - 8), margin + 4, y + 14);
  doc.text(`Phone: ${order.customer.phone}  |  Email: ${order.customer.email}`, margin + 4, y + 23);

  // Right col: Dispatch
  const rightColX = margin + colWidth + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 20, 147);
  doc.text('DISPATCH & PAYMENT:', rightColX, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Method: ${order.paymentMethod || 'Cash on Delivery'}`, rightColX, y + 10);
  doc.text(`Delivery Zone: ${order.deliveryZone ? order.deliveryZone.replace('_', ' ') : 'Express Courier'}`, rightColX, y + 15);
  doc.text(`Fulfillment: Insured Doorstep Delivery`, rightColX, y + 20);

  y += 34;

  // Items Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 7, pageWidth - margin, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('#', margin + 2, y + 5);
  doc.text('SKINCARE ITEM', margin + 10, y + 5);
  doc.text('VARIATION', margin + 95, y + 5);
  doc.text('QTY', margin + 130, y + 5, { align: 'center' });
  doc.text('RATE (BDT)', margin + 155, y + 5, { align: 'right' });
  doc.text('TOTAL (BDT)', pageWidth - margin - 3, y + 5, { align: 'right' });

  y += 9;

  // Items rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  (order.items || []).forEach((item, idx) => {
    doc.setTextColor(15, 23, 42);
    doc.text(String(idx + 1), margin + 2, y + 4);

    const nameText = doc.splitTextToSize(item.productName, 80);
    doc.text(nameText, margin + 10, y + 4);

    const varText = `${item.variation?.name || 'Standard'} (${item.variation?.color || ''})`;
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(varText, 32), margin + 95, y + 4);

    doc.setTextColor(15, 23, 42);
    doc.text(String(item.quantity), margin + 130, y + 4, { align: 'center' });
    doc.text(`TK ${Number(item.price || 0).toLocaleString()}`, margin + 155, y + 4, { align: 'right' });
    doc.text(`TK ${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}`, pageWidth - margin - 3, y + 4, { align: 'right' });

    y += 9;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  });

  y += 4;

  // Financial Summary Box
  const summaryWidth = 72;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Items Subtotal:', summaryX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`TK ${Number(order.subtotal || 0).toLocaleString()}`, pageWidth - margin - 3, y, { align: 'right' });

  y += 5;
  doc.setTextColor(100, 116, 139);
  doc.text('Delivery Charge:', summaryX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`TK ${Number(order.shippingFee || 0).toLocaleString()}`, pageWidth - margin - 3, y, { align: 'right' });

  y += 5;
  doc.setTextColor(100, 116, 139);
  doc.text('VAT & Taxes:', summaryX, y);
  doc.setTextColor(16, 185, 129);
  doc.text('Included (100%)', pageWidth - margin - 3, y, { align: 'right' });

  y += 2;
  doc.setDrawColor(255, 20, 147);
  doc.setLineWidth(0.8);
  doc.line(summaryX, y, pageWidth - margin, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', summaryX, y);
  doc.setTextColor(255, 20, 147);
  doc.text(`TK ${Number(order.total || 0).toLocaleString()} BDT`, pageWidth - margin - 3, y, { align: 'right' });

  y += 16;

  // Security & Authenticity Banner
  doc.setFillColor(255, 240, 246);
  doc.setDrawColor(255, 193, 227);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 20, 147);
  doc.text('100% AUTHENTIC KOREAN SKINCARE GUARANTEE', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Directly imported from Seoul, South Korea. Sealed tamper-evident packaging. Verify batch code at delivery.', margin + 4, y + 10);

  doc.save(filename);
}
