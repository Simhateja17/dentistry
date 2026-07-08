import { getAll, STORES } from '../db/database.js';
import { totalQuantity, isExpired, daysToExpiry } from './stock.js';
import { money } from './invoice.js';

function inRange(date, from, to) {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function dayClose(date) {
  const invoices = await getAll(STORES.invoices);
  const visits = await getAll(STORES.visits);
  const appts = await getAll(STORES.appointments);
  const dayInvoices = invoices.filter((i) => i.date === date && i.status !== 'cancelled');
  const paid = dayInvoices.filter((i) => i.status === 'paid');
  const outstanding = dayInvoices.filter((i) => i.status !== 'paid');
  const byMode = {};
  for (const i of paid) { byMode[i.paymentMode || 'Unspecified'] = (byMode[i.paymentMode || 'Unspecified'] || 0) + i.payable; }
  return {
    date,
    patientsSeen: visits.filter((v) => v.date === date).length,
    appointments: appts.filter((a) => a.date === date && a.status !== 'cancelled').length,
    completed: appts.filter((a) => a.date === date && a.status === 'completed').length,
    revenueCollected: paid.reduce((s, i) => s + i.payable, 0),
    outstandingCount: outstanding.length,
    outstandingAmount: outstanding.reduce((s, i) => s + i.payable, 0),
    byMode,
    invoiceCount: dayInvoices.length,
  };
}

export async function periodTotals(from, to) {
  const invoices = await getAll(STORES.invoices);
  const visits = await getAll(STORES.visits);
  const ranged = invoices.filter((i) => inRange(i.date, from, to) && i.status !== 'cancelled');
  const paid = ranged.filter((i) => i.status === 'paid');
  return {
    from, to,
    invoices: ranged.length,
    visits: visits.filter((v) => inRange(v.date, from, to)).length,
    revenue: paid.reduce((s, i) => s + i.payable, 0),
    billed: ranged.reduce((s, i) => s + i.payable, 0),
    outstanding: ranged.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.payable, 0),
  };
}

export async function gstPrep(from, to) {
  const invoices = await getAll(STORES.invoices);
  const ranged = invoices.filter((i) => inRange(i.date, from, to) && i.status !== 'cancelled');
  const slabs = {};
  const hsn = {};
  let exemptTotal = 0;
  for (const inv of ranged) {
    for (const l of inv.lines) {
      const rate = l.gstRate || 0;
      const key = l.kind === 'exempt' || rate === 0 ? 'Exempt' : rate + '%';
      if (!slabs[key]) slabs[key] = { rate, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, count: 0 };
      slabs[key].taxableValue += l.taxableValue;
      slabs[key].cgst += l.cgst;
      slabs[key].sgst += l.sgst;
      slabs[key].igst += l.igst;
      slabs[key].count++;
      if (l.kind === 'exempt' || rate === 0) exemptTotal += l.taxableValue;
      const h = l.hsn || '(none)';
      if (!hsn[h]) hsn[h] = { taxableValue: 0, gst: 0, count: 0 };
      hsn[h].taxableValue += l.taxableValue;
      hsn[h].gst += l.cgst + l.sgst + l.igst;
      hsn[h].count++;
    }
  }
  for (const k of Object.keys(slabs)) { slabs[k].taxableValue = round(slabs[k].taxableValue); slabs[k].cgst = round(slabs[k].cgst); slabs[k].sgst = round(slabs[k].sgst); slabs[k].igst = round(slabs[k].igst); }
  for (const k of Object.keys(hsn)) { hsn[k].taxableValue = round(hsn[k].taxableValue); hsn[k].gst = round(hsn[k].gst); }
  const totalTaxable = round(Object.values(slabs).reduce((s, v) => s + v.taxableValue, 0));
  const totalCgst = round(Object.values(slabs).reduce((s, v) => s + v.cgst, 0));
  const totalSgst = round(Object.values(slabs).reduce((s, v) => s + v.sgst, 0));
  const totalIgst = round(Object.values(slabs).reduce((s, v) => s + v.igst, 0));
  return { from, to, slabs, hsn, exemptTotal: round(exemptTotal), totalTaxable, totalCgst, totalSgst, totalIgst, totalTax: round(totalCgst + totalSgst + totalIgst), invoiceCount: ranged.length };
}

export async function topProcedures(from, to) {
  const invoices = await getAll(STORES.invoices);
  const ranged = invoices.filter((i) => inRange(i.date, from, to) && i.status !== 'cancelled');
  const tally = {};
  for (const inv of ranged) {
    for (const l of inv.lines) {
      const desc = (l.description || '').replace(/\s*\(Tooth.*\)/i, '').trim();
      if (!desc) continue;
      if (!tally[desc]) tally[desc] = { count: 0, revenue: 0 };
      tally[desc].count += l.quantity || 1;
      tally[desc].revenue += l.total;
    }
  }
  return Object.entries(tally).map(([name, v]) => ({ name, count: v.count, revenue: round(v.revenue) })).sort((a, b) => b.revenue - a.revenue);
}

export async function stockReport() {
  const items = await getAll(STORES.stock);
  let totalValue = 0;
  const lowStock = [];
  const expiring = [];
  const expired = [];
  for (const item of items) {
    for (const b of item.batches || []) {
      if (b.quantity > 0 && !isExpired(b)) totalValue += (b.cost || 0) * (b.quantity / (b.initialQuantity || 1));
      const d = daysToExpiry(b);
      if (b.quantity > 0) {
        if (isExpired(b)) expired.push({ item: item.name, lot: b.lotNumber, expiry: b.expiryDate, qty: b.quantity });
        else if (d !== null && d <= 60) expiring.push({ item: item.name, lot: b.lotNumber, expiry: b.expiryDate, qty: b.quantity, days: d });
      }
    }
    if (totalQuantity(item) <= (item.reorderLevel || 0)) lowStock.push({ name: item.name, qty: totalQuantity(item), reorder: item.reorderLevel });
  }
  return { totalValue: round(totalValue), lowStock, expiring, expired, itemCount: items.length };
}

export async function labCostSummary(from, to) {
  const cases = await getAll(STORES.labCases);
  const ranged = cases.filter((c) => inRange(c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '', from, to));
  const byLab = {};
  for (const c of ranged) {
    const lab = c.labName || 'Unspecified';
    if (!byLab[lab]) byLab[lab] = { cases: 0, cost: 0, charge: 0 };
    byLab[lab].cases++;
    byLab[lab].cost += c.labCost || 0;
    byLab[lab].charge += c.patientCharge || 0;
  }
  return Object.entries(byLab).map(([lab, v]) => ({ lab, ...v, margin: round(v.charge - v.cost) })).sort((a, b) => b.cost - a.cost);
}

function round(n) { return Math.round(n * 100) / 100; }

export function exportCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  download(filename, csv, 'text/csv');
}

export function exportJSON(filename, data) {
  download(filename, JSON.stringify(data, null, 2), 'application/json');
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function todayStr() { return new Date().toISOString().slice(0, 10); }
export function monthRange() {
  const d = new Date();
  const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}
