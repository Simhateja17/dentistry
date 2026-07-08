import { getAll, get, put, remove, STORES, uid } from '../db/database.js';

export const APPT_STATUS = ['booked', 'arrived', 'ready', 'inchair', 'completed', 'cancelled', 'noshow'];

export const STATUS_META = {
  booked: { label: 'Booked', cls: 'chip-soft', dot: '#94a3b8' },
  arrived: { label: 'Arrived', cls: 'chip-amber', dot: '#9a6500' },
  ready: { label: 'Ready for Doctor', cls: 'chip-blue', dot: '#0058BA' },
  inchair: { label: 'In Chair', cls: 'chip-blue', dot: '#1a6be8' },
  completed: { label: 'Completed', cls: 'chip-green', dot: '#0c7a52' },
  cancelled: { label: 'Cancelled', cls: 'chip-red', dot: '#c02f1d' },
  noshow: { label: 'No-show', cls: 'chip-red', dot: '#c02f1d' },
};

export const STATUS_FLOW = { booked: ['arrived', 'cancelled', 'noshow'], arrived: ['ready', 'cancelled'], ready: ['inchair', 'completed', 'cancelled'], inchair: ['completed'] };

export async function listAppointments() {
  return (await getAll(STORES.appointments)).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

export async function listAppointmentsForDate(date) {
  const all = await listAppointments();
  return all.filter((a) => a.date === date && a.status !== 'cancelled');
}

export async function getAppointment(id) {
  return get(STORES.appointments, id);
}

export async function createAppointment(data) {
  const id = data.id || uid('apt');
  const appt = {
    id,
    patientId: data.patientId,
    patientName: data.patientName || '',
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    chair: data.chair || 1,
    doctor: data.doctor || '',
    reason: data.reason || '',
    status: data.status || 'booked',
    recurring: data.recurring || null,
    fromPlanStageId: data.fromPlanStageId || null,
    createdAt: Date.now(),
  };
  await put(STORES.appointments, appt);
  return appt;
}

export async function updateAppointment(id, patch) {
  const cur = await getAppointment(id);
  if (!cur) throw new Error('Appointment not found');
  const next = { ...cur, ...patch, id };
  await put(STORES.appointments, next);
  return next;
}

export async function deleteAppointment(id) {
  await remove(STORES.appointments, id);
}

export async function setStatus(id, status) {
  return updateAppointment(id, { status });
}

function toMin(t) {
  const [h, m] = (t || '').split(':').map(Number);
  return h * 60 + m;
}

export function generateSlots(opening, closing, slotDuration, buffer) {
  const slots = [];
  let cur = toMin(opening);
  const end = toMin(closing);
  const dur = slotDuration || 30;
  const buf = buffer || 0;
  while (cur + dur <= end) {
    const s = cur;
    const e = cur + dur;
    slots.push({ start: fmt(s), end: fmt(e), startMin: s, endMin: e });
    cur = e + buf;
  }
  return slots;
}

function fmt(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function to12h(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export async function conflicts(candidate, settings) {
  const sameDay = await listAppointmentsForDate(candidate.date);
  return sameDay.filter((a) => {
    if (a.id === candidate.id) return false;
    if (a.chair !== candidate.chair && a.doctor !== candidate.doctor) return false;
    const as = toMin(a.startTime), ae = toMin(a.endTime);
    const cs = toMin(candidate.startTime), ce = toMin(candidate.endTime);
    return cs < ae && ce > as;
  });
}

export async function listVisitsForDate(date) {
  const all = await getAll(STORES.visits);
  return all.filter((v) => v.date === date);
}

export async function listVisitsForPatient(patientId) {
  const all = await getAll(STORES.visits);
  return all.filter((v) => v.patientId === patientId).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function prettyDate(date) {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
