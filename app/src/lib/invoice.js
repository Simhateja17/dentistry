import { getAll, get, put, STORES, uid } from '../db/database.js';
import { getPatient } from '../lib/patient.js';
import { loadSettings, saveSettings } from './settings.js';

export async function listInvoices() {
  return (await getAll(STORES.invoices)).sort((a, b) => (b.number || '').localeCompare(a.number || ''));
}

export async function listInvoicesForPatient(patientId) {
  return (await listInvoices()).filter((i) => i.patientId === patientId);
}

export async function getInvoice(id) {
  return get(STORES.invoices, id);
}

export function computeLine(line, interState) {
  const qty = line.quantity || 1;
  const unitPrice = line.unitPrice || 0;
  const taxableValue = qty * unitPrice;
  const rate = line.gstRate || 0;
  const isExempt = line.kind === 'exempt' || rate === 0;
  const gstAmt = isExempt ? 0 : taxableValue * rate / 100;
  let cgst = 0, sgst = 0, igst = 0;
  if (isExempt) {
    // nil-rated
  } else if (interState) {
    igst = gstAmt;
  } else {
    cgst = gstAmt / 2;
    sgst = gstAmt / 2;
  }
  const total = taxableValue + gstAmt;
  return { ...line, quantity: qty, unitPrice, taxableValue: round2(taxableValue), cgst: round2(cgst), sgst: round2(sgst), igst: round2(igst), gstAmount: round2(gstAmt), total: round2(total) };
}

function round2(n) { return Math.round(n * 100) / 100; }

export function computeInvoice(lines, interState) {
  const computed = lines.map((l) => computeLine(l, interState));
  const subtotal = round2(computed.reduce((s, l) => s + l.taxableValue, 0));
  const totalCgst = round2(computed.reduce((s, l) => s + l.cgst, 0));
  const totalSgst = round2(computed.reduce((s, l) => s + l.sgst, 0));
  const totalIgst = round2(computed.reduce((s, l) => s + l.igst, 0));
  const totalTax = round2(totalCgst + totalSgst + totalIgst);
  const grandTotal = round2(subtotal + totalTax);
  const roundOff = round2(Math.round(grandTotal) - grandTotal);
  const payable = round2(grandTotal + roundOff);
  return { lines: computed, subtotal, totalCgst, totalSgst, totalIgst, totalTax, grandTotal, roundOff, payable };
}

export async function createInvoice(data) {
  const settings = await loadSettings();
  const patient = data.patientId ? await getPatient(data.patientId) : null;
  const interState = patient && patient.address && settings.clinic.state && !patient.address.includes(settings.clinic.state);
  const computed = computeInvoice(data.lines || [], interState);
  const num = settings.billing.nextInvoiceNumber;
  const id = data.id || uid('inv');
  const invoice = {
    id,
    number: settings.billing.invoicePrefix + '-' + String(num).padStart(4, '0'),
    date: data.date || new Date().toISOString().slice(0, 10),
    patientId: data.patientId || null,
    patientName: patient?.name || data.patientName || '',
    visitId: data.visitId || null,
    planId: data.planId || null,
    lines: computed.lines,
    subtotal: computed.subtotal,
    totalCgst: computed.totalCgst,
    totalSgst: computed.totalSgst,
    totalIgst: computed.totalIgst,
    totalTax: computed.totalTax,
    roundOff: computed.roundOff,
    payable: computed.payable,
    grandTotal: computed.grandTotal,
    paymentMode: data.paymentMode || '',
    status: data.status || 'issued',
    notes: data.notes || '',
    createdBy: data.createdBy || '',
    interState,
    createdAt: Date.now(),
    cancelledAt: null,
    cancelReason: '',
  };
  await put(STORES.invoices, invoice);
  await saveSettings({ ...settings, billing: { ...settings.billing, nextInvoiceNumber: num + 1 } });
  return invoice;
}

export async function updateInvoice(id, patch) {
  const cur = await getInvoice(id);
  if (!cur) throw new Error('Invoice not found');
  const next = { ...cur, ...patch, id };
  await put(STORES.invoices, next);
  return next;
}

export async function markPaid(id, paymentMode) {
  return updateInvoice(id, { status: 'paid', paymentMode: paymentMode || undefined });
}

export async function cancelInvoice(id, reason) {
  return updateInvoice(id, { status: 'cancelled', cancelledAt: Date.now(), cancelReason: reason || '' });
}

export function money(n) {
  return '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function todayInrTotal(invoices) {
  const today = new Date().toISOString().slice(0, 10);
  return invoices.filter((i) => i.date === today && i.status === 'paid').reduce((s, i) => s + i.payable, 0);
}
