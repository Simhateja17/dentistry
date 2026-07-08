import { Icons } from '../components/Icons.jsx';
import { canAccess } from '../lib/settings.js';

export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard, group: 'Clinical' },
  { id: 'appointments', label: 'Appointments', icon: Icons.appointments, group: 'Front Desk' },
  { id: 'patients', label: 'Patients', icon: Icons.patients, group: 'Front Desk' },
  { id: 'records', label: 'Patient Records', icon: Icons.records, group: 'Clinical' },
  { id: 'plans', label: 'Treatment Plans', icon: Icons.plans, group: 'Clinical' },
  { id: 'lab', label: 'Lab Cases', icon: Icons.lab, group: 'Clinical' },
  { id: 'billing', label: 'Billing', icon: Icons.billing, group: 'Operations' },
  { id: 'stock', label: 'Clinical Stock', icon: Icons.stock, group: 'Operations' },
  { id: 'suppliers', label: 'Supplier Orders', icon: Icons.suppliers, group: 'Operations' },
  { id: 'staff', label: 'Staff on Duty', icon: Icons.staff, group: 'Team' },
  { id: 'staffonboard', label: 'Staff Onboarding', icon: Icons.staffonboard, group: 'Team' },
  { id: 'reports', label: 'Reports', icon: Icons.reports, group: 'Operations' },
];

export const CRUMBS = Object.fromEntries(MODULES.map((m) => [m.id, m.label]));

const GROUP_ORDER_DOCTOR = ['Clinical', 'Operations', 'Team'];
const GROUP_ORDER_REC = ['Front Desk', 'Operations'];

export function navFor(role) {
  const order = role === 'receptionist' || role === 'assistant' ? GROUP_ORDER_REC : GROUP_ORDER_DOCTOR;
  const visible = MODULES.filter((m) => canAccess(role, m.id));
  const groups = [];
  for (const g of order) {
    const items = visible.filter((m) => m.group === g);
    if (items.length) groups.push({ label: g, items });
  }
  return groups;
}
