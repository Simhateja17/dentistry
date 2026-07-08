import { TEL } from '../lib/telugu.js';
import { money } from '../lib/invoice.js';

export function printReceipt(invoice, settings) {
  const clinic = settings.clinic || {};
  const w = window.open('', '_blank', 'width=420,height=720');
  if (!w) { alert('Allow pop-ups to print the receipt'); return; }

  const rows = invoice.lines.map((l) => `
    <tr>
      <td>${esc(l.description)}<div class="sub">${l.hsn || '—'} · ${l.kind === 'exempt' ? TEL.exempt : l.gstRate + '%'}</div></td>
      <td class="r">${money(l.total)}</td>
    </tr>`).join('');

  const taxRows = invoice.interState
    ? `<tr><td>${TEL.igst}</td><td class="r">${money(invoice.totalIgst)}</td></tr>`
    : `<tr><td>${TEL.cgst}</td><td class="r">${money(invoice.totalCgst)}</td></tr><tr><td>${TEL.sgst}</td><td class="r">${money(invoice.totalSgst)}</td></tr>`;

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoice.number}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, 'Segoe UI', 'Noto Sans Telugu', sans-serif; margin: 0; padding: 18px; color: #0f172a; }
    .h { text-align: center; }
    .h .name { font-size: 17px; font-weight: 800; }
    .h .meta { font-size: 10px; color: #64748b; margin-top: 2px; line-height: 1.4; }
    .div { border-top: 1px dashed #cbd5e1; margin: 10px 0; }
    .pair { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
    .pair .k { color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    td { padding: 4px 0; vertical-align: top; }
    td.r { text-align: right; white-space: nowrap; font-weight: 600; }
    .sub { font-size: 9px; color: #94a3b8; }
    .tot { font-size: 13px; font-weight: 800; color: #0058BA; }
    .foot { text-align: center; margin-top: 12px; font-size: 11px; color: #475569; }
    .foot .ty { font-weight: 700; }
    .note { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 8px; }
    @media print { body { padding: 0; } }
  </style></head><body>
    <div class="h">
      <div class="name">${esc(clinic.name || 'Dental Clinic')}</div>
      <div class="meta">${esc(clinic.address || '')}<br>${TEL.gstin}: ${esc(clinic.gstin || '—')} · ${TEL.registration}: ${esc(clinic.registrationNumber || '—')}<br>${TEL.phone}: ${esc(clinic.phone || '—')}</div>
    </div>
    <div class="div"></div>
    <div class="pair"><span class="k">${TEL.invoice}</span><span style="font-weight:700;font-family:monospace">${invoice.number}</span></div>
    <div class="pair"><span class="k">${TEL.date}</span><span>${invoice.date}</span></div>
    <div class="pair"><span class="k">${TEL.patient}</span><span style="font-weight:600">${esc(invoice.patientName || '—')}</span></div>
    ${invoice.interState ? `<div class="note">Inter-state · IGST applied</div>` : ''}
    <div class="div"></div>
    <table>${rows}</table>
    <div class="div"></div>
    <div class="pair"><span class="k">${TEL.subtotal}</span><span class="r">${money(invoice.subtotal)}</span></div>
    ${taxRows}
    ${invoice.roundOff ? `<div class="pair"><span class="k">${TEL.roundOff}</span><span class="r">${invoice.roundOff > 0 ? '+' : ''}${money(invoice.roundOff)}</span></div>` : ''}
    <div class="pair tot"><span>${TEL.total}</span><span>${money(invoice.payable)}</span></div>
    <div class="pair"><span class="k">${TEL.payment}</span><span>${invoice.paymentMode || (invoice.status === 'paid' ? TEL.paid : TEL.pending)}</span></div>
    <div class="pair"><span class="k">${TEL.status}</span><span>${invoice.status === 'paid' ? TEL.paid : invoice.status === 'cancelled' ? TEL.cancelled : TEL.pending}</span></div>
    <div class="foot">
      <div class="ty">${TEL.thankYou}</div>
    </div>
    <div class="note">${TEL.thisIsA}</div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 350);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
