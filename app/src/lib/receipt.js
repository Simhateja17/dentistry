import { jsPDF } from 'jspdf';

const BLUE = [0, 88, 186];
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];

// jsPDF's built-in Helvetica has no ₹ glyph, so we use "Rs." with Indian digit grouping.
function rs(n) {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateReceiptPDF(invoice, settings) {
  const doc = new jsPDF({ unit: 'pt', format: 'a5' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 30;
  const clinic = settings.clinic || {};

  // Header band
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 74, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(clinic.name || 'Dental Clinic', M, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(219, 231, 245);
  const line1 = clinic.address || '';
  if (line1) doc.text(line1, M, 50);
  doc.text(`GSTIN ${clinic.gstin || '—'}   ·   Reg ${clinic.registrationNumber || '—'}`, M, 61);
  const contact = [clinic.phone, clinic.email].filter(Boolean).join('   ·   ');
  if (contact) doc.text(contact, M, 68);
  // Invoice tag on the right of the band
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255);
  doc.text('TAX INVOICE', W - M, 32, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(219, 231, 245);
  doc.text(invoice.number || '', W - M, 47, { align: 'right' });

  let y = 100;

  // Meta: patient + date
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('BILLED TO', M, y);
  doc.text('DATE', W - M, y, { align: 'right' });
  y += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(invoice.patientName || '—', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.date || '', W - M, y, { align: 'right' });
  y += 6;
  if (invoice.interState) {
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Inter-state supply · IGST applied', M, y);
  }
  y += 18;

  // Table header
  const cHSN = W - M - 176;
  const cGST = W - M - 128;
  const cTax = W - M - 78;
  doc.setFillColor(240, 244, 249);
  doc.rect(M, y - 11, W - 2 * M, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', M + 6, y);
  doc.text('HSN', cHSN, y);
  doc.text('GST', cGST, y);
  doc.text('TAXABLE', cTax, y);
  doc.text('AMOUNT', W - M - 6, y, { align: 'right' });
  y += 20;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const l of invoice.lines) {
    doc.setTextColor(...INK);
    doc.text(String(l.description || '').slice(0, 34), M + 6, y);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8.5);
    doc.text(String(l.hsn || '—'), cHSN, y);
    doc.text(l.kind === 'exempt' ? 'Exempt' : (l.gstRate || 0) + '%', cGST, y);
    doc.text(Number(l.taxableValue || 0).toFixed(2), cTax, y);
    doc.setTextColor(...INK);
    doc.setFontSize(9);
    doc.text(Number(l.total || 0).toFixed(2), W - M - 6, y, { align: 'right' });
    y += 15;
    doc.setDrawColor(238, 242, 247);
    doc.line(M, y - 6, W - M, y - 6);
    if (y > H - 150) { doc.addPage(); y = 40; }
  }
  y += 10;

  // Totals block (right aligned)
  const tLabelX = W - M - 150;
  const tValX = W - M - 6;
  const row = (label, val, opts = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size || 9);
    doc.setTextColor(...(opts.color || MUTED));
    doc.text(label, tLabelX, y);
    doc.setTextColor(...(opts.valColor || INK));
    doc.text(val, tValX, y, { align: 'right' });
    y += opts.gap || 14;
  };
  row('Subtotal', rs(invoice.subtotal));
  if (!invoice.interState) {
    row('CGST', rs(invoice.totalCgst));
    row('SGST', rs(invoice.totalSgst));
  } else {
    row('IGST', rs(invoice.totalIgst));
  }
  if (invoice.roundOff) row('Round off', (invoice.roundOff > 0 ? '+' : '') + rs(invoice.roundOff));
  // Total highlight bar
  y += 2;
  doc.setFillColor(234, 242, 255);
  doc.rect(tLabelX - 10, y - 12, (W - M) - (tLabelX - 10), 22, 'F');
  y += 3;
  row('TOTAL', rs(invoice.payable), { bold: true, size: 12, color: BLUE, valColor: BLUE, gap: 20 });

  // Payment + status
  y += 4;
  row('Payment', invoice.paymentMode || (invoice.status === 'paid' ? 'Paid' : 'Pending'), { gap: 13 });
  row('Status', String(invoice.status || '').toUpperCase(), { gap: 13 });

  // Footer
  const fy = H - 42;
  doc.setDrawColor(210, 216, 224);
  doc.line(M, fy - 14, W - M, fy - 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text('Thank you', M, fy);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('We appreciate your visit — please come again.', M + 62, fy);
  doc.setFontSize(7.5);
  doc.text('For a Telugu receipt, use "Print receipt (తెలుగు)".', M, fy + 12);
  doc.text(clinic.name || '', W - M, fy, { align: 'right' });

  doc.save((invoice.number || 'invoice') + '.pdf');
  return doc;
}
