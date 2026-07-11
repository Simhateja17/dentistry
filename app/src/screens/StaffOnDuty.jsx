import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { listTodayTimesheets, currentlyClockedIn, elapsedLabel } from '../lib/staff.js';
import { initials } from '../lib/name.js';
import { Icons } from '../components/Icons.jsx';

export default function StaffOnDuty() {
  const { settings } = useApp();
  const [timesheets, setTimesheets] = useState([]);
  const [clockedIn, setClockedIn] = useState({});
  const [now, setNow] = useState(Date.now());

  const refresh = async () => {
    setTimesheets(await listTodayTimesheets());
    setClockedIn(await currentlyClockedIn());
  };
  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  const team = settings?.team || [];
  const onDuty = team.filter((m) => clockedIn[m.id]);
  const offDuty = team.filter((m) => !clockedIn[m.id]);

  return (
    <div>
      <div className="page-head">
        <h1>Staff on Duty</h1>
        <div className="sub">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {onDuty.length} clocked in</div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi kpi-green"><div className="label">On duty now</div><div className="value">{onDuty.length}</div></div>
        <div className="kpi kpi-blue"><div className="label">Team size</div><div className="value">{team.length}</div></div>
        <div className="kpi"><div className="label">Today's sessions</div><div className="value">{timesheets.length}</div></div>
      </div>

      <div className="section-title" style={{ marginBottom: 10 }}>Currently on duty</div>
      {onDuty.length === 0 ? (
        <div className="card pad empty" style={{ marginBottom: 18 }}><div className="ic"><Icons.staff size={40} /></div>No one clocked in. Signing in with a PIN clocks you in automatically.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 22 }}>
          {onDuty.map((m) => {
            const ts = clockedIn[m.id];
            const elapsed = ts ? elapsedLabel(now - ts.clockIn) : '';
            return (
              <div key={m.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(145deg,#1a6be8,#0058BA)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials(m.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name} <span className="chip chip-blue" style={{ marginLeft: 6 }}>{m.role}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Since {new Date(ts?.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {elapsed}</div>
                </div>
                <span className="chip chip-green">On duty</span>
              </div>
            );
          })}
        </div>
      )}

      {offDuty.length > 0 && (
        <>
          <div className="section-title" style={{ marginBottom: 10 }}>Not clocked in</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {offDuty.map((m) => (
              <div key={m.id} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: .7 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--line-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{initials(m.name)}</div>
                <div style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span> <span style={{ color: 'var(--muted)', fontSize: 12 }}>· {m.role}</span></div>
                <span className="chip chip-soft">Off duty</span>
              </div>
            ))}
          </div>
        </>
      )}

      {timesheets.length > 0 && (
        <>
          <div className="section-title" style={{ margin: '26px 0 10px' }}>Today's timesheet</div>
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: 'var(--line-2)' }}>{['Staff', 'Role', 'In', 'Out', 'Duration'].map((h) => <th key={h} style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--muted)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {timesheets.map((t) => (
                  <tr key={t.id} style={{ borderTop: '1px solid var(--line-2)' }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{t.memberName}</td>
                    <td style={{ padding: 10, color: 'var(--muted)' }}>{t.role}</td>
                    <td style={{ padding: 10, fontFamily: 'var(--font-mono)' }}>{new Date(t.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: 10, fontFamily: 'var(--font-mono)' }}>{t.clockOut ? new Date(t.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td style={{ padding: 10, fontWeight: 600 }}>{t.clockOut ? elapsedLabel(t.clockOut - t.clockIn) : elapsedLabel(now - t.clockIn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
