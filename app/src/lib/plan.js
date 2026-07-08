import { getAll, get, put, remove, STORES, uid } from '../db/database.js';
import { createInvoice } from './invoice.js';

export const PLAN_STATUSES = ['draft', 'approved', 'deposit', 'inprogress', 'completed', 'cancelled'];
export const STAGE_STATUSES = ['pending', 'inprogress', 'done', 'skipped'];

export const STATUS_META = {
  draft: { label: 'Draft', cls: 'chip-soft' },
  approved: { label: 'Approved', cls: 'chip-green' },
  deposit: { label: 'Deposit paid', cls: 'chip-blue' },
  inprogress: { label: 'In progress', cls: 'chip-blue' },
  completed: { label: 'Completed', cls: 'chip-green' },
  cancelled: { label: 'Cancelled', cls: 'chip-red' },
};

export async function listPlans() {
  return (await getAll(STORES.plans)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function listPlansForPatient(patientId) {
  return (await listPlans()).filter((p) => p.patientId === patientId);
}

export async function getPlan(id) {
  return get(STORES.plans, id);
}

export async function createPlan(data) {
  const id = data.id || uid('pln');
  const now = Date.now();
  const stages = (data.stages || []).map((s, i) => ({ ...s, id: s.id || uid('stg'), seq: i + 1, status: s.status || 'pending', visitId: s.visitId || null, invoiceId: s.invoiceId || null }));
  const total = stages.reduce((s, st) => s + (st.cost || 0), 0);
  const plan = {
    id,
    patientId: data.patientId,
    patientName: data.patientName || '',
    title: data.title || '',
    total,
    stages,
    status: data.status || 'draft',
    deposit: data.deposit || 0,
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  };
  await put(STORES.plans, plan);
  return plan;
}

export async function updatePlan(id, patch) {
  const cur = await getPlan(id);
  if (!cur) throw new Error('Plan not found');
  const total = (patch.stages || cur.stages).reduce((s, st) => s + (st.cost || 0), 0);
  const next = { ...cur, ...patch, id, total, updatedAt: Date.now() };
  await put(STORES.plans, next);
  return next;
}

export async function deletePlan(id) {
  await remove(STORES.plans, id);
}

export async function setPlanStatus(id, status) {
  return updatePlan(id, { status });
}

export async function setStageStatus(planId, stageId, status, links = {}) {
  const plan = await getPlan(planId);
  if (!plan) throw new Error('Plan not found');
  const stages = plan.stages.map((s) => s.id === stageId ? { ...s, status, ...links } : s);
  const allDone = stages.every((s) => s.status === 'done' || s.status === 'skipped');
  const anyStarted = stages.some((s) => s.status === 'inprogress' || s.status === 'done');
  let planStatus = plan.status;
  if (allDone && (plan.status === 'inprogress' || plan.status === 'deposit' || plan.status === 'approved')) planStatus = 'completed';
  else if (anyStarted && plan.status === 'approved') planStatus = 'inprogress';
  return updatePlan(planId, { stages, status: planStatus });
}

export function planPaid(plan) {
  if (!plan) return 0;
  if (Array.isArray(plan.payments)) return plan.payments.reduce((s, p) => s + (p.amount || 0), 0);
  return plan.deposit || 0;
}

export function planBalance(plan) {
  return Math.max(0, (plan?.total || 0) - planPaid(plan));
}

// Record an installment payment against the plan: creates a paid invoice + ledger entry.
export async function recordPayment(planId, { amount, mode, note, createdBy }) {
  const plan = await getPlan(planId);
  if (!plan) throw new Error('Plan not found');
  const amt = Number(amount) || 0;
  if (amt <= 0) throw new Error('Enter a valid amount');
  const isFirst = !(plan.payments && plan.payments.length);
  const label = `${plan.title || 'Treatment plan'} — ${isFirst ? 'deposit' : 'installment'}${note ? ' (' + note + ')' : ''}`;
  const inv = await createInvoice({
    patientId: plan.patientId,
    lines: [{ description: label, hsn: '9973', gstRate: 0, kind: 'exempt', quantity: 1, unitPrice: amt }],
    status: 'paid',
    paymentMode: mode || '',
    createdBy: createdBy || '',
    planId,
  });
  const payments = [...(plan.payments || []), { id: uid('pay'), amount: amt, mode: mode || '', invoiceId: inv.id, number: inv.number, date: new Date().toISOString().slice(0, 10), note: note || '' }];
  const collected = payments.reduce((s, p) => s + p.amount, 0);
  let status = plan.status;
  if (status === 'draft' || status === 'approved') status = 'inprogress';
  const updated = await updatePlan(planId, { payments, collected, deposit: payments[0]?.amount || 0, status });
  return { invoice: inv, plan: updated };
}

export function stageMeta(status) {
  return {
    pending: { label: 'Pending', cls: 'chip-soft' },
    inprogress: { label: 'In progress', cls: 'chip-blue' },
    done: { label: 'Done', cls: 'chip-green' },
    skipped: { label: 'Skipped', cls: 'chip-soft' },
  }[status] || { label: status, cls: 'chip-soft' };
}
