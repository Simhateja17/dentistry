import { getAll, get, put, remove, STORES, uid } from '../db/database.js';

export async function listStock() {
  return (await getAll(STORES.stock)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export async function getStock(id) {
  return get(STORES.stock, id);
}

export async function createStock(data) {
  const id = data.id || uid('stk');
  const item = {
    id,
    name: data.name || '',
    category: data.category || 'General',
    unit: data.unit || 'unit',
    reorderLevel: data.reorderLevel || 0,
    batches: data.batches || [],
    createdAt: Date.now(),
  };
  await put(STORES.stock, item);
  return item;
}

export async function updateStock(id, patch) {
  const cur = await getStock(id);
  if (!cur) throw new Error('Stock item not found');
  const next = { ...cur, ...patch, id };
  await put(STORES.stock, next);
  return next;
}

export async function deleteStock(id) {
  await remove(STORES.stock, id);
}

export async function addBatch(stockId, batch) {
  const item = await getStock(stockId);
  if (!item) throw new Error('Stock not found');
  const newBatch = {
    id: uid('btc'),
    lotNumber: batch.lotNumber || '',
    quantity: parseFloat(batch.quantity) || 0,
    initialQuantity: parseFloat(batch.quantity) || 0,
    receivedDate: batch.receivedDate || new Date().toISOString().slice(0, 10),
    expiryDate: batch.expiryDate || '',
    cost: parseFloat(batch.cost) || 0,
  };
  const batches = [...(item.batches || []), newBatch].sort((a, b) => (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999'));
  await updateStock(stockId, { batches });
  return newBatch;
}

export async function dispense(stockId, quantity, reason = '') {
  const item = await getStock(stockId);
  if (!item) throw new Error('Stock not found');
  let remaining = quantity;
  const batches = [...(item.batches || [])].sort((a, b) => (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999'));
  const dispensed = [];
  for (const b of batches) {
    if (remaining <= 0) break;
    if (b.quantity <= 0) continue;
    if (isExpired(b)) continue;
    const take = Math.min(remaining, b.quantity);
    b.quantity = Math.round((b.quantity - take) * 100) / 100;
    dispensed.push({ batchId: b.id, lotNumber: b.lotNumber, quantity: take });
    remaining -= take;
  }
  if (remaining > 0) throw new Error(`Insufficient stock — ${remaining} ${item.unit} short of ${quantity}`);
  await updateStock(stockId, { batches });
  return dispensed;
}

export function isExpired(batch) {
  if (!batch.expiryDate) return false;
  return batch.expiryDate < new Date().toISOString().slice(0, 10);
}

export function daysToExpiry(batch) {
  if (!batch.expiryDate) return null;
  const d = new Date(batch.expiryDate + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (24 * 3600 * 1000));
}

export function totalQuantity(item) {
  return (item.batches || []).filter((b) => !isExpired(b)).reduce((s, b) => s + b.quantity, 0);
}

export function expiryStatus(item) {
  let soonest = null;
  for (const b of item.batches || []) {
    if (b.quantity <= 0) continue;
    const d = daysToExpiry(b);
    if (d === null) continue;
    if (soonest === null || d < soonest) soonest = d;
  }
  if (soonest === null) return { level: 'ok', label: 'No expiry', cls: 'chip-soft' };
  if (soonest < 0) return { level: 'expired', label: 'Expired', cls: 'chip-red' };
  if (soonest <= 30) return { level: 'soon', label: `Expires in ${soonest}d`, cls: 'chip-amber' };
  if (soonest <= 60) return { level: 'near', label: `${soonest}d to expiry`, cls: 'chip-soft' };
  return { level: 'ok', label: 'OK', cls: 'chip-green' };
}

export function needsReorder(item) {
  return totalQuantity(item) <= (item.reorderLevel || 0);
}
