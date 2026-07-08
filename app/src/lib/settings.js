import { get, put, STORES } from '../db/database.js';

const SETTINGS_KEY = 'clinic';

export const ROLES = {
  owner: { label: 'Owner', canEditFinance: true, canManageTeam: true, screens: ['*'] },
  doctor: { label: 'Doctor', canEditFinance: false, canManageTeam: false, screens: ['*'] },
  receptionist: { label: 'Receptionist', canEditFinance: false, canManageTeam: false, screens: ['dashboard', 'appointments', 'patients', 'billing', 'staffonboard'] },
  assistant: { label: 'Assistant', canEditFinance: false, canManageTeam: false, screens: ['dashboard', 'patients', 'appointments', 'stock'] },
};

export const DEFAULT_SETTINGS = {
  key: SETTINGS_KEY,
  clinic: {
    name: '',
    registrationNumber: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
  },
  hours: {
    opening: '09:00',
    closing: '19:00',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  capacity: { chairs: 2, slotDuration: 30, buffer: 10 },
  billing: {
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1001,
    paymentModes: ['UPI', 'Cash', 'Card'],
    gstRates: [
      { label: 'Exempt healthcare service', rate: 0, kind: 'exempt' },
      { label: 'GST 5%', rate: 5, kind: 'gst' },
      { label: 'GST 12%', rate: 12, kind: 'gst' },
      { label: 'GST 18%', rate: 18, kind: 'gst' },
    ],
  },
  team: [],
  choices: {
    schedulingMode: 'grid',
    numberingSystem: 'fdi',
    invoiceTemplate: 'standard',
    dashboardLayout: 'command',
  },
  security: { autoLockMinutes: 5, pinLockoutThreshold: 5 },
  onboarded: false,
};

export async function loadSettings() {
  const s = await get(STORES.clinicSettings, SETTINGS_KEY);
  if (!s) return null;
  return mergeDefaults(s);
}

export async function saveSettings(settings) {
  const merged = mergeDefaults(settings);
  await put(STORES.clinicSettings, merged);
  return merged;
}

function mergeDefaults(s) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  deepMerge(merged, s);
  if (!merged.team) merged.team = [];
  return merged;
}

function deepMerge(target, src) {
  if (!src || typeof src !== 'object') return;
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && target[k] && typeof target[k] === 'object') {
      deepMerge(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
  }
}

export function canAccess(role, moduleId) {
  const r = ROLES[role];
  if (!r) return false;
  return r.screens.includes('*') || r.screens.includes(moduleId);
}

export function canEditFinance(role) { return !!ROLES[role]?.canEditFinance; }
export function canManageTeam(role) { return !!ROLES[role]?.canManageTeam; }

export function findTeamMember(settings, memberId) {
  return settings.team.find((m) => m.id === memberId);
}

export function verifyPin(settings, memberId, pin) {
  const m = findTeamMember(settings, memberId);
  if (!m) return false;
  if (m.locked) return false;
  return m.pin === pin;
}
