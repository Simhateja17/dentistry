import { getAll, get, put, remove, STORES, uid, count } from '../db/database.js';

export async function listPatients() {
  const all = await getAll(STORES.patients);
  return all.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export async function getPatient(id) {
  return get(STORES.patients, id);
}

export async function nextMrn() {
  const n = await count(STORES.patients);
  return 'PT-' + String(n + 1).padStart(4, '0');
}

export async function createPatient(data) {
  const id = data.id || uid('pat');
  const now = Date.now();
  const patient = {
    id,
    mrn: data.mrn || await nextMrn(),
    name: data.name || '',
    dob: data.dob || '',
    gender: data.gender || '',
    phone: (data.phone || '').replace(/\s+/g, ''),
    email: data.email || '',
    address: data.address || '',
    allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? String(data.allergies).split(',').map((s) => s.trim()).filter(Boolean) : []),
    medicalHistory: data.medicalHistory || '',
    conditions: Array.isArray(data.conditions) ? data.conditions : [],
    createdAt: now,
    updatedAt: now,
  };
  await put(STORES.patients, patient);
  return patient;
}

export async function updatePatient(id, patch) {
  const cur = await getPatient(id);
  if (!cur) throw new Error('Patient not found');
  const next = { ...cur, ...patch, id, updatedAt: Date.now() };
  if (patch.phone) next.phone = patch.phone.replace(/\s+/g, '');
  await put(STORES.patients, next);
  return next;
}

export async function deletePatient(id) {
  await remove(STORES.patients, id);
}

export async function findByPhone(phone) {
  const norm = (phone || '').replace(/\D/g, '').slice(-10);
  if (norm.length < 7) return [];
  const all = await listPatients();
  return all.filter((p) => (p.phone || '').replace(/\D/g, '').endsWith(norm));
}

export function age(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  const yrs = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return yrs >= 0 ? yrs + ' yrs' : '';
}

export function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export async function mergePatients(keepId, dropId) {
  const keep = await getPatient(keepId);
  const drop = await getPatient(dropId);
  if (!keep || !drop) throw new Error('Missing patient');
  // Move appointments/visits/invoices/plans/lab from drop to keep
  for (const store of [STORES.appointments, STORES.visits, STORES.invoices, STORES.plans, STORES.labCases]) {
    const all = await getAll(store);
    for (const r of all) {
      if (r.patientId === dropId) { r.patientId = keepId; await put(store, r); }
    }
  }
  await deletePatient(dropId);
  return keep;
}
