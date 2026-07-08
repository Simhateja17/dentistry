import { Icons } from '../components/Icons.jsx';

const NOTES = {
  appointments: 'Day grid (chairs × slots), conflict-guarded booking, status flow to Visit. Phase 2.',
  records: 'Unified timeline + odontogram history scrubber. Phase 3.',
  plans: 'Staged quote + staged billing, no consent. Phase 3.',
  lab: 'Linked pipeline to fitting appointment. Phase 3.',
  billing: 'Multi-line GST invoice + jsPDF receipt. Phase 2.',
  stock: 'Batch/lot + expiry + FIFO dispensing. Phase 3.',
  suppliers: 'PO → received → stock-in. Phase 3.',
  staff: "Today's clocked-in roster + timesheet. Phase 3.",
  staffonboard: 'Owner-only add-staff flow. Phase 3.',
  reports: 'Day-close + GST-prep + business. Phase 4.',
};

export default function Placeholder({ module, onNavigate }) {
  const note = NOTES[module] || 'This module is part of a later phase.';
  return (
    <div>
      <div className="page-head">
        <h1>{module.charAt(0).toUpperCase() + module.slice(1)}</h1>
        <div className="sub">Scaffolded in Phase 1 — fully functional in a later phase.</div>
      </div>
      <div className="card pad empty">
        <div className="ic"><Icons.dashboard size={40} /></div>
        <div style={{ fontWeight: 700, color: 'var(--slate)', marginBottom: 4 }}>Coming soon</div>
        <div style={{ fontSize: 13 }}>{note}</div>
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => onNavigate('dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );
}
