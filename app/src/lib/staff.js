import { getAll, put, STORES, uid } from '../db/database.js';
import { loadSettings } from './settings.js';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export async function clockIn(memberId, memberName, role) {
  const id = uid('ts');
  const entry = {
    id,
    memberId,
    memberName,
    role,
    date: todayStr(),
    clockIn: Date.now(),
    clockOut: null,
  };
  await put(STORES.staffTimesheets, entry);
  return entry;
}

export async function clockOut(memberId) {
  const all = await getAll(STORES.staffTimesheets);
  const open = all.filter((t) => t.memberId === memberId && t.date === todayStr() && !t.clockOut);
  for (const t of open) {
    t.clockOut = Date.now();
    await put(STORES.staffTimesheets, t);
  }
  return open.length;
}

export async function listTodayTimesheets() {
  const all = await getAll(STORES.staffTimesheets);
  return all.filter((t) => t.date === todayStr());
}

export async function listTimesheetsForDate(date) {
  const all = await getAll(STORES.staffTimesheets);
  return all.filter((t) => t.date === date);
}

export async function currentlyClockedIn() {
  const today = await listTodayTimesheets();
  const byMember = {};
  for (const t of today) {
    if (!t.clockOut) byMember[t.memberId] = t;
  }
  return byMember;
}

export function elapsedLabel(ms) {
  if (!ms) return '';
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export async function teamRoster() {
  const s = await loadSettings();
  return s?.team || [];
}
