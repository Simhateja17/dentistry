import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { saveSettings, canManageTeam, ROLES } from '../lib/settings.js';
import { uid } from '../db/database.js';
import { initials } from '../lib/name.js';
import { Icons } from '../components/Icons.jsx';

const ROLE_PERMISSIONS = {
  owner: { label: 'Owner — full access', desc: 'Can edit all settings, finances, and reset any PIN' },
  doctor: { label: 'Doctor — clinical', desc: 'All clinical screens, billing, cannot edit tax settings' },
  receptionist: { label: 'Receptionist — front desk', desc: 'Appointments, patients, billing, onboarding' },
  assistant: { label: 'Assistant — limited', desc: 'Dashboard, patients, appointments, stock' },
};

export default function StaffOnboarding() {
  const { settings, setSettings, session, toast } = useApp();
  const canTeam = canManageTeam(session?.role);
  const [form, setForm] = useState({ name: '', role: 'receptionist', pin: '', chairs: '' });

  if (!canTeam) {
    return (
      <div>
        <div className="page-head"><h1>Staff Onboarding</h1></div>
        <div className="card pad empty"><div className="ic"><Icons.staff size={40} /></div>Only the owner can add or manage staff. Sign in as the owner profile.</div>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const add = async () => {
    if (!form.name.trim()) { toast('Enter staff name'); return; }
    if (!/^\d{4}$/.test(form.pin)) { toast('PIN must be 4 digits'); return; }
    const member = {
      id: uid('usr'),
      name: form.name.trim(),
      role: form.role,
      pin: form.pin,
      locked: false,
      chairs: form.chairs ? form.chairs.split(',').map((c) => parseInt(c.trim())).filter(Boolean) : [],
      addedAt: Date.now(),
    };
    const next = await saveSettings({ ...settings, team: [...(settings.team || []), member] });
    setSettings(next);
    toast(`${member.name} added as ${member.role}`);
    setForm({ name: '', role: 'receptionist', pin: '', chairs: '' });
  };

  const removeMember = async (m) => {
    if (m.role === 'owner') { toast('Cannot remove the owner'); return; }
    if (!confirm(`Remove ${m.name}? They will no longer be able to sign in.`)) return;
    const next = await saveSettings({ ...settings, team: settings.team.filter((x) => x.id !== m.id) });
    setSettings(next);
    toast(`${m.name} removed`);
  };

  const resetPin = async (m) => {
    const pin = prompt(`New 4-digit PIN for ${m.name}:`);
    if (!pin || !/^\d{4}$/.test(pin)) { if (pin !== null) toast('PIN must be 4 digits'); return; }
    const team = settings.team.map((x) => x.id === m.id ? { ...x, pin, locked: false } : x);
    const next = await saveSettings({ ...settings, team });
    setSettings(next);
    toast(`PIN reset for ${m.name}`);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div className="page-head">
        <h1>Staff Onboarding</h1>
        <div className="sub">Add team members and assign role-based access.</div>
      </div>

      <div className="card pad" style={{ marginBottom: 22 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Add a new team member</div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label className="field-label">Full name</label><input className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Anita Rao" /></div>
          <div>
            <label className="field-label">Role</label>
            <div className="choice-grid">
              {Object.entries(ROLE_PERMISSIONS).filter(([r]) => r !== 'owner').map(([r, info]) => (
                <button key={r} className={'choice' + (form.role === r ? ' sel' : '')} onClick={() => set('role', r)}>
                  <div className="ct">{info.label}</div>
                  <div className="cd">{info.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="field-row cols-2">
            <div><label className="field-label">4-digit PIN</label><input className="field" style={{ letterSpacing: 6 }} value={form.pin} onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" /></div>
            <div><label className="field-label">Assigned chairs (optional)</label><input className="field" value={form.chairs} onChange={(e) => set('chairs', e.target.value)} placeholder="1, 2" /></div>
          </div>
          <button className="btn btn-primary" onClick={add}><Icons.plus size={16} /> Add staff member</button>
        </div>
      </div>

      <div className="section-title" style={{ marginBottom: 10 }}>Team roster ({settings.team?.length || 0})</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {settings.team?.map((m) => (
          <div key={m.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(145deg,#1a6be8,#0058BA)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials(m.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name} {m.role === 'owner' && <span className="chip chip-blue" style={{ marginLeft: 6 }}>Owner</span>}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ROLE_PERMISSIONS[m.role]?.label || m.role} · {m.chairs?.length ? `Chairs ${m.chairs.join(', ')}` : 'No chair assignment'}</div>
            </div>
            {m.locked && <span className="chip chip-red">Locked</span>}
            {m.role !== 'owner' && <>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => resetPin(m)}>Reset PIN</button>
              <button className="btn btn-danger" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => removeMember(m)}>Remove</button>
            </>}
          </div>
        ))}
      </div>
    </div>
  );
}
