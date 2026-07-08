import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { saveSettings } from '../lib/settings.js';
import { exportBackup, importBackup, wipeAll } from '../lib/backup.js';
import { canEditFinance, canManageTeam } from '../lib/settings.js';
import { initials } from '../lib/name.js';
import { Icons } from '../components/Icons.jsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Settings({ onNavigate }) {
  const { settings, setSettings, session, toast } = useApp();
  const canFinance = canEditFinance(session?.role);
  const canTeam = canManageTeam(session?.role);
  const fileRef = useRef(null);
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(settings)));
  const [tab, setTab] = useState('clinic');

  const upd = (path, value) => {
    setDraft((d) => {
      const next = JSON.parse(JSON.stringify(d));
      const keys = path.split('.');
      let o = next;
      for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
      o[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    const saved = await saveSettings(draft);
    setSettings(saved);
    toast('Settings saved');
  };

  const onExport = async () => { await exportBackup(); toast('Backup downloaded'); };
  const onImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { await importBackup(f); toast('Backup restored — reload to apply'); setTimeout(() => location.reload(), 900); }
    catch (err) { toast('Import failed: ' + err.message); }
    e.target.value = '';
  };
  const onWipe = async () => {
    if (!confirm('Erase ALL clinic data? This cannot be undone unless you have a backup.')) return;
    await wipeAll(); toast('Data erased'); setTimeout(() => location.reload(), 900);
  };

  const toggleDay = (d) => {
    const days = draft.hours.daysOpen.includes(d) ? draft.hours.daysOpen.filter((x) => x !== d) : [...draft.hours.daysOpen, d];
    upd('hours.daysOpen', days);
  };

  const tabs = [
    { id: 'clinic', label: 'Clinic' },
    { id: 'ops', label: 'Hours & Capacity' },
    { id: 'billing', label: 'Billing & GST' },
    { id: 'choices', label: 'Preferences' },
    { id: 'team', label: 'Team' },
    { id: 'data', label: 'Backup & Data' },
  ];

  return (
    <div>
      <div className="page-head">
        <h1>Settings</h1>
        <div className="sub">Clinic configuration, tax, preferences, and data backup.</div>
      </div>

      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--line)', marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, color: tab === t.id ? 'var(--blue)' : 'var(--muted)', borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, transition: 'color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clinic' && (
        <div className="card pad" style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
          <div>
            <label className="field-label">Clinic name</label>
            <input className="field" value={draft.clinic.name} disabled={!canFinance} onChange={(e) => upd('clinic.name', e.target.value)} placeholder="Bright Smile Dental Clinic" />
          </div>
          <div className="field-row cols-2">
            <div><label className="field-label">Registration number</label><input className="field" value={draft.clinic.registrationNumber} disabled={!canFinance} onChange={(e) => upd('clinic.registrationNumber', e.target.value)} /></div>
            <div><label className="field-label">GSTIN</label><input className="field" value={draft.clinic.gstin} disabled={!canFinance} onChange={(e) => upd('clinic.gstin', e.target.value)} placeholder="29ABCDE1234F1Z5" style={{ fontFamily: 'var(--font-mono)' }} /></div>
          </div>
          <div className="field-row cols-2">
            <div><label className="field-label">Phone</label><input className="field" value={draft.clinic.phone} disabled={!canFinance} onChange={(e) => upd('clinic.phone', e.target.value)} /></div>
            <div><label className="field-label">Email</label><input className="field" value={draft.clinic.email} disabled={!canFinance} onChange={(e) => upd('clinic.email', e.target.value)} /></div>
          </div>
          <div><label className="field-label">Address</label><textarea className="field" rows={2} value={draft.clinic.address} disabled={!canFinance} onChange={(e) => upd('clinic.address', e.target.value)} /></div>
          <div className="field-row cols-3">
            <div><label className="field-label">City</label><input className="field" value={draft.clinic.city} disabled={!canFinance} onChange={(e) => upd('clinic.city', e.target.value)} /></div>
            <div><label className="field-label">State</label><input className="field" value={draft.clinic.state} disabled={!canFinance} onChange={(e) => upd('clinic.state', e.target.value)} /></div>
            <div><label className="field-label">Pincode</label><input className="field" value={draft.clinic.pincode} disabled={!canFinance} onChange={(e) => upd('clinic.pincode', e.target.value)} /></div>
          </div>
        </div>
      )}

      {tab === 'ops' && (
        <div className="card pad" style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
          <div className="field-row cols-2">
            <div><label className="field-label">Opening time</label><input type="time" className="field" value={draft.hours.opening} disabled={!canFinance} onChange={(e) => upd('hours.opening', e.target.value)} /></div>
            <div><label className="field-label">Closing time</label><input type="time" className="field" value={draft.hours.closing} disabled={!canFinance} onChange={(e) => upd('hours.closing', e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Days open</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map((d) => (
                <button key={d} onClick={() => canFinance && toggleDay(d)} disabled={!canFinance} className={'chip ' + (draft.hours.daysOpen.includes(d) ? 'chip-blue' : 'chip-soft')} style={{ padding: '6px 12px' }}>{d}</button>
              ))}
            </div>
          </div>
          <div className="field-row cols-3">
            <div><label className="field-label">Number of chairs</label><input type="number" min="1" className="field" value={draft.capacity.chairs} disabled={!canFinance} onChange={(e) => upd('capacity.chairs', parseInt(e.target.value) || 1)} /></div>
            <div><label className="field-label">Slot duration (min)</label><input type="number" min="5" step="5" className="field" value={draft.capacity.slotDuration} disabled={!canFinance} onChange={(e) => upd('capacity.slotDuration', parseInt(e.target.value) || 30)} /></div>
            <div><label className="field-label">Buffer (min)</label><input type="number" min="0" step="5" className="field" value={draft.capacity.buffer} disabled={!canFinance} onChange={(e) => upd('capacity.buffer', parseInt(e.target.value) || 0)} /></div>
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="card pad" style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
          <div className="field-row cols-2">
            <div><label className="field-label">Invoice prefix</label><input className="field" value={draft.billing.invoicePrefix} disabled={!canFinance} onChange={(e) => upd('billing.invoicePrefix', e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} /></div>
            <div><label className="field-label">Next invoice number</label><input type="number" className="field" value={draft.billing.nextInvoiceNumber} disabled={!canFinance} onChange={(e) => upd('billing.nextInvoiceNumber', parseInt(e.target.value) || 1001)} /></div>
          </div>
          <div>
            <label className="field-label">Payment modes accepted</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['UPI', 'Cash', 'Card', 'Wallet', 'Bank Transfer'].map((m) => {
                const on = draft.billing.paymentModes.includes(m);
                return <button key={m} disabled={!canFinance} onClick={() => upd('billing.paymentModes', on ? draft.billing.paymentModes.filter((x) => x !== m) : [...draft.billing.paymentModes, m])} className={'chip ' + (on ? 'chip-blue' : 'chip-soft')} style={{ padding: '6px 12px' }}>{m}</button>;
              })}
            </div>
          </div>
          <div>
            <label className="field-label">GST rate table</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {draft.billing.gstRates.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input className="field" style={{ flex: 1 }} value={r.label} disabled={!canFinance} onChange={(e) => { const a = [...draft.billing.gstRates]; a[i] = { ...a[i], label: e.target.value }; upd('billing.gstRates', a); }} />
                  <input type="number" className="field" style={{ width: 90 }} value={r.rate} disabled={!canFinance} onChange={(e) => { const a = [...draft.billing.gstRates]; a[i] = { ...a[i], rate: parseFloat(e.target.value) || 0 }; upd('billing.gstRates', a); }} />
                  <span style={{ fontSize: 12, color: 'var(--muted)', width: 60 }}>{r.kind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'choices' && (
        <div className="card pad" style={{ display: 'grid', gap: 18, maxWidth: 640 }}>
          <ChoiceRow label="Scheduling view" desc="How the appointment screen lays out." value={draft.choices.schedulingMode} disabled={!canFinance} onChange={(v) => upd('choices.schedulingMode', v)} options={[{ v: 'grid', t: 'Day grid', d: 'Chairs × time slots (recommended)' }, { v: 'list', t: 'Simple list', d: 'Sortable list of appointments' }, { v: 'week', t: 'Week view', d: 'Multi-day columns' }]} />
          <ChoiceRow label="Tooth numbering system" desc="How teeth are labeled on the odontogram." value={draft.choices.numberingSystem} disabled={!canFinance} onChange={(v) => upd('choices.numberingSystem', v)} options={[{ v: 'fdi', t: 'FDI (1–4 quadrants)', d: 'Standard in India' }, { v: 'universal', t: 'Universal (1–32)', d: 'US-style sequential' }]} />
          <ChoiceRow label="Invoice template" desc="Receipt layout style." value={draft.choices.invoiceTemplate} disabled={!canFinance} onChange={(v) => upd('choices.invoiceTemplate', v)} options={[{ v: 'standard', t: 'Standard', d: 'Itemized with GST split' }, { v: 'compact', t: 'Compact thermal', d: '80mm narrow format' }]} />
          <ChoiceRow label="Auto-lock minutes" desc="Idle time before the app locks." value={String(draft.security.autoLockMinutes)} disabled={!canFinance} onChange={(v) => upd('security.autoLockMinutes', parseInt(v))} options={[{ v: '1', t: '1 minute', d: 'Strict' }, { v: '5', t: '5 minutes', d: 'Balanced (recommended)' }, { v: '15', t: '15 minutes', d: 'Relaxed' }, { v: '0', t: 'Never', d: 'No auto-lock' }]} />
        </div>
      )}

      {tab === 'team' && (
        <div className="card pad" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title">Team roster ({draft.team.length})</div>
            {canTeam && <button className="btn btn-primary" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => onNavigate?.('staffonboard')}><Icons.plus size={15} /> Add team member</button>}
          </div>
          {draft.team.length === 0 && <div className="empty" style={{ padding: 24 }}>No team members. Onboarding created the owner profile.</div>}
          <div style={{ display: 'grid', gap: 8 }}>
            {draft.team.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 9 }}>
                <div className="avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(145deg,#1a6be8,#0058BA)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{initials(m.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.name} {m.role === 'owner' && <span className="chip chip-blue" style={{ marginLeft: 6 }}>Owner</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.role} · PIN set</div>
                </div>
                {m.locked && <span className="chip chip-red">Locked</span>}
              </div>
            ))}
          </div>
          {!canTeam && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>Only the owner can add or edit staff.</div>}
        </div>
      )}

      {tab === 'data' && (
        <div className="card pad" style={{ maxWidth: 640, display: 'grid', gap: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 4 }}>Export backup</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>Download a JSON file with all clinic data. Store it on a pen drive or cloud folder.</div>
            <button className="btn btn-primary" onClick={onExport}><Icons.download size={16} /> Download backup</button>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div className="section-title" style={{ marginBottom: 4 }}>Restore from backup</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>Replace all current data with a previously exported backup file.</div>
            <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onImport} />
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Icons.upload size={16} /> Choose backup file</button>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div className="section-title" style={{ marginBottom: 4, color: 'var(--red)' }}>Erase all data</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>Permanently delete every patient, appointment, invoice, and setting. Irreversible.</div>
            <button className="btn btn-danger" onClick={onWipe}>Erase everything</button>
          </div>
        </div>
      )}

      {canFinance && tab !== 'data' && tab !== 'team' && (
        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={save}><Icons.check size={16} /> Save changes</button>
        </div>
      )}
    </div>
  );
}

function ChoiceRow({ label, desc, value, options, onChange, disabled }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>{desc}</div>
      <div className="choice-grid">
        {options.map((o) => (
          <button key={o.v} className={'choice' + (value === o.v || value === o.v ? ' sel' : '')} disabled={disabled} onClick={() => onChange(o.v)} style={disabled ? { opacity: .7, cursor: 'default' } : {}}>
            <div className="ct">{o.t}</div>
            <div className="cd">{o.d}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
