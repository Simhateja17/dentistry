import { getAll, get, put, remove, STORES, uid } from '../db/database.js';

export const LAB_STAGES = ['impression', 'design', 'fabrication', 'ready', 'fitted'];
export const LAB_STAGE_META = {
  impression: { label: 'Impression sent', cls: 'chip-soft', dot: '#94a3b8' },
  design: { label: 'Design review', cls: 'chip-amber', dot: '#9a6500' },
  fabrication: { label: 'In fabrication', cls: 'chip-blue', dot: '#0058BA' },
  ready: { label: 'Ready for fitting', cls: 'chip-green', dot: '#0c7a52' },
  fitted: { label: 'Fitted', cls: 'chip-green', dot: '#0c7a52' },
};

export const APPLIANCE_TYPES = ['Crown', 'Bridge', 'Clear Aligner', 'Retainer', 'Denture', 'Veneer', 'Implant abutment', 'Other'];

export async function listLabCases() {
  return (await getAll(STORES.labCases)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function listLabCasesForPatient(patientId) {
  return (await listLabCases()).filter((c) => c.patientId === patientId);
}

export async function getLabCase(id) {
  return get(STORES.labCases, id);
}

export async function createLabCase(data) {
  const id = data.id || uid('lab');
  const now = Date.now();
  const labCase = {
    id,
    patientId: data.patientId,
    patientName: data.patientName || '',
    labName: data.labName || '',
    applianceType: data.applianceType || 'Crown',
    teeth: data.teeth || '',
    dueDate: data.dueDate || '',
    stage: data.stage || 'impression',
    labCost: data.labCost || 0,
    patientCharge: data.patientCharge || 0,
    notes: data.notes || '',
    fittingAppointmentId: data.fittingAppointmentId || null,
    createdAt: now,
    updatedAt: now,
  };
  await put(STORES.labCases, labCase);
  return labCase;
}

export async function updateLabCase(id, patch) {
  const cur = await getLabCase(id);
  if (!cur) throw new Error('Lab case not found');
  const next = { ...cur, ...patch, id, updatedAt: Date.now() };
  await put(STORES.labCases, next);
  return next;
}

export async function deleteLabCase(id) {
  await remove(STORES.labCases, id);
}

export async function setStage(id, stage) {
  return updateLabCase(id, { stage });
}

export function isOverdue(labCase) {
  if (!labCase.dueDate || labCase.stage === 'fitted') return false;
  return labCase.dueDate < new Date().toISOString().slice(0, 10);
}

export function daysUntil(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (24 * 3600 * 1000));
}
