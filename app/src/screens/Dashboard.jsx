import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getAll, count, STORES } from '../db/database.js';
import { canEditFinance, canManageTeam } from '../lib/settings.js';
import { listAppointmentsForDate, updateAppointment, STATUS_META, todayStr, to12h } from '../lib/appointment.js';
import { currentlyClockedIn } from '../lib/staff.js';
import { listPlans } from '../lib/plan.js';
import { initials as toInitials, firstName } from '../lib/name.js';
import { Icons } from '../components/Icons.jsx';

const QUEUE_STATUSES = ['booked', 'arrived', 'ready', 'inchair'];

export default function Dashboard({ onNavigate, onOpenVisit }) {
  const { settings, session, toast } = useApp();
  const [counts, setCounts] = useState({ patients: 0, appointments: 0, invoices: 0 });
  const [appts, setAppts] = useState([]);
  const [staffOnDuty, setStaffOnDuty] = useState(0);
  const [plansInReview, setPlansInReview] = useState(0);
  const [justUpdated, setJustUpdated] = useState(null);
  const isDoctor = session?.role === 'doctor' || session?.role === 'owner';
  const canFinance = canEditFinance(session?.role);
  const canTeam = canManageTeam(session?.role);

  const refresh = async () => {
    const [patients, appointments, invoices, todays, clockedIn, plans] = await Promise.all([
      count(STORES.patients), count(STORES.appointments), count(STORES.invoices),
      listAppointmentsForDate(todayStr()), currentlyClockedIn(), listPlans(),
    ]);
    setCounts({ patients, appointments, invoices });
    setAppts(todays);
    setStaffOnDuty(Object.keys(clockedIn).length);
    setPlansInReview(plans.filter((p) => p.status === 'draft').length);
  };

  useEffect(() => { refresh(); }, []);

  const isEmpty = counts.patients === 0 && counts.appointments === 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const guideSteps = [
    { label: 'Finish clinic setup', desc: 'Review GSTIN, hours, and tax rates', action: 'settings', done: settings?.onboarded },
    { label: 'Add your first patient', desc: 'Register a patient to start their record', action: 'patients', done: counts.patients > 0 },
    { label: 'Book the first appointment', desc: 'Schedule a visit on the chair grid', action: 'appointments', done: counts.appointments > 0 },
  ];

  const queue = appts.filter((a) => QUEUE_STATUSES.includes(a.status)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const readyCount = appts.filter((a) => a.status === 'ready').length;
  const inChairCount = appts.filter((a) => a.status === 'inchair').length;
  const completedCount = appts.filter((a) => a.status === 'completed').length;
  const upcomingCount = appts.filter((a) => a.status === 'booked').length;

  const kpis = isDoctor ? [
    { label: 'Scheduled today', value: appts.length, delta: appts.length ? (upcomingCount ? `${upcomingCount} not yet arrived` : 'All checked in') : 'No appointments', tone: 'blue' },
    { label: 'Ready for Doctor', value: readyCount, delta: readyCount ? `${readyCount} waiting on you` : 'None waiting', tone: 'amber' },
    { label: 'In chair', value: inChairCount, delta: inChairCount ? `${inChairCount} being treated` : 'No one in chair', tone: 'blue' },
    { label: 'Completed today', value: completedCount, delta: completedCount ? `${completedCount} visits closed` : 'No visits closed', tone: 'green' },
  ] : [
    { label: "Today's appointments", value: appts.length, delta: appts.length ? `${upcomingCount} upcoming` : 'Empty schedule', tone: 'blue' },
    { label: 'Waiting / Arrived', value: appts.filter((a) => a.status === 'arrived').length, delta: 'Needs check-in', tone: 'amber' },
    { label: 'Ready for Doctor', value: readyCount, delta: readyCount ? 'Seated and waiting' : 'Nothing pending', tone: 'blue' },
    { label: 'Staff on duty', value: staffOnDuty, delta: session?.name || '—', tone: 'green' },
  ];

  const advance = async (appt, status) => {
    await updateAppointment(appt.id, { status });
    setJustUpdated(appt.id);
    setTimeout(() => setJustUpdated(null), 1100);
    refresh();
    toast(`${appt.patientName} marked ${STATUS_META[status].label}`);
  };

  const fName = firstName(session?.name) || 'there';

  return (
    <div>
      <div className="page-head">
        <h1>{greeting()}, {fName}</h1>
        <div className="sub">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      {isEmpty && (
        <div className="card pad" style={{ marginBottom: 22, background: 'linear-gradient(135deg,#eaf2ff,#f6f9ff)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Welcome to {settings?.clinic?.name || 'your clinic'} — let's get started</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Complete these steps to start running your clinic on Dental PMS.</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {guideSteps.map((s, i) => (
              <button key={i} onClick={() => onNavigate(s.action)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: '#fff', border: '1px solid var(--line)', textAlign: 'left', width: '100%' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: s.done ? 'var(--green-bg)' : 'var(--blue-bg)', color: s.done ? 'var(--green)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {s.done ? <Icons.check size={14} /> : i + 1}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, display: 'block' }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.desc}</span>
                </span>
                <Icons.back size={16} style={{ transform: 'rotate(180deg)', color: 'var(--muted)' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        {kpis.map((k) => (
          <div className={`kpi kpi-${k.tone}`} key={k.label}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className={'delta tone-' + k.tone}>{k.delta}</div>
          </div>
        ))}
      </div>

      {!isEmpty && (
        <div className="card pad" style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="section-title">Today's patients</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{queue.length ? `${queue.length} in the loop` : ''}</div>
          </div>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 10px', color: 'var(--muted)' }}>
              <Icons.check size={26} style={{ opacity: .4, marginBottom: 8 }} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--slate)' }}>{completedCount ? 'All patients seen' : 'Nothing booked today'}</div>
              <div style={{ fontSize: 12.5, marginTop: 2 }}>Booked and checked-in patients line up here through the day.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {queue.map((a) => {
                const m = STATUS_META[a.status];
                return (
                  <div key={a.id} className={'card' + (justUpdated === a.id ? ' pulse-once' : '')} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(145deg,#1a6be8,#0058BA)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{toInitials(a.patientName)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.patientName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{to12h(a.startTime)} · Chair {a.chair} · {a.reason || '—'}</div>
                    </div>
                    <span className={'chip ' + m.cls}>{m.label}</span>
                    {a.status === 'booked' && (
                      <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '7px 13px' }} onClick={() => advance(a, 'arrived')}>Check in</button>
                    )}
                    {a.status === 'arrived' && (
                      <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '7px 13px' }} onClick={() => advance(a, 'ready')}>Mark ready</button>
                    )}
                    {isDoctor && (a.status === 'ready' || a.status === 'inchair') && (
                      <button className="btn btn-primary" style={{ fontSize: 12.5, padding: '7px 13px' }} onClick={() => onOpenVisit?.(a)}>
                        {a.status === 'ready' ? 'Seat & start visit' : 'Resume visit'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="card pad">
        <div className="section-title" style={{ marginBottom: 12 }}>Quick actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={'btn ' + (queue.length ? 'btn-ghost' : 'btn-primary')} onClick={() => onNavigate('appointments')}><Icons.plus size={16} /> New appointment</button>
          <button className="btn btn-ghost" onClick={() => onNavigate('patients')}><Icons.plus size={16} /> New patient</button>
          <button className="btn btn-ghost" onClick={() => onNavigate('billing')}><Icons.billing size={16} /> Billing queue</button>
          {canFinance && <button className="btn btn-ghost" onClick={() => onNavigate('reports')}><Icons.reports size={16} /> Day close</button>}
          {canTeam && <button className="btn btn-ghost" onClick={() => onNavigate('staffonboard')}><Icons.plus size={16} /> Add staff</button>}
        </div>
      </div>
    </div>
  );
}
