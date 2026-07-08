import { getAll, get, put, remove, STORES, uid } from '../db/database.js';
import { getStock, addBatch, updateStock, listStock, needsReorder } from './stock.js';

export const PO_STATUSES = ['draft', 'sent', 'partial', 'received', 'cancelled'];
export const PO_STATUS_META = {
  draft: { label: 'Draft', cls: 'chip-soft' },
  sent: { label: 'Sent', cls: 'chip-blue' },
  partial: { label: 'Partial', cls: 'chip-amber' },
  received: { label: 'Received', cls: 'chip-green' },
  cancelled: { label: 'Cancelled', cls: 'chip-red' },
};

export async function listSupplierOrders() {
  return (await getAll(STORES.supplierOrders)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getSupplierOrder(id) {
  return get(STORES.supplierOrders, id);
}

export async function createSupplierOrder(data) {
  const id = data.id || uid('po');
  const now = Date.now();
  const total = (data.lines || []).reduce((s, l) => s + (l.quantity * l.unitPrice || 0), 0);
  const po = {
    id,
    poNumber: data.poNumber || ('PO-' + String(now).slice(-6)),
    supplierName: data.supplierName || '',
    date: data.date || new Date().toISOString().slice(0, 10),
    expectedDate: data.expectedDate || '',
    lines: data.lines || [],
    total,
    status: data.status || 'draft',
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  };
  await put(STORES.supplierOrders, po);
  return po;
}

export async function updateSupplierOrder(id, patch) {
  const cur = await getSupplierOrder(id);
  if (!cur) throw new Error('PO not found');
  const total = (patch.lines || cur.lines).reduce((s, l) => s + (l.quantity * l.unitPrice || 0), 0);
  const next = { ...cur, ...patch, id, total, updatedAt: Date.now() };
  await put(STORES.supplierOrders, next);
  return next;
}

export async function deleteSupplierOrder(id) {
  await remove(STORES.supplierOrders, id);
}

export async function receiveLine(poId, lineIndex, batchInfo) {
  const po = await getSupplierOrder(poId);
  if (!po) throw new Error('PO not found');
  const line = po.lines[lineIndex];
  if (!line) throw new Error('Line not found');
  if (line.stockId) {
    await addBatch(line.stockId, {
      lotNumber: batchInfo.lotNumber || '',
      quantity: batchInfo.quantity || line.quantity,
      receivedDate: new Date().toISOString().slice(0, 10),
      expiryDate: batchInfo.expiryDate || '',
      cost: (line.unitPrice || 0) * (batchInfo.quantity || line.quantity),
    });
  }
  line.received = true;
  line.receivedBatch = batchInfo;
  po.lines[lineIndex] = line;
  const allReceived = po.lines.every((l) => l.received);
  const anyReceived = po.lines.some((l) => l.received);
  let status = po.status;
  if (allReceived) status = 'received';
  else if (anyReceived) status = 'partial';
  return updateSupplierOrder(poId, { lines: po.lines, status });
}

export async function autoSuggestedPOs() {
  const items = await listStock();
  return items.filter(needsReorder).map((item) => ({ stockId: item.id, name: item.name, unit: item.unit, quantity: (item.reorderLevel || 0) * 2, unitPrice: 0, received: false }));
}
