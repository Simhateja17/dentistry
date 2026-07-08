import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { DEFAULT_SETTINGS, saveSettings } from '../lib/settings.js';
import { ToothLogo, Icons } from '../components/Icons.jsx';
import { uid } from '../db/database.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SetupWizard() {
  const { setSettings, setSession, toast } = useApp();
  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(0);
  const [s, setS] = useState(() => JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  const [ownerName, setOwnerName] = useState('');
  const [ownerPin, setOwnerPin] = useState('');

  const TOTAL_STEPS = 5;
  const upd = (path, value) => setS((d) => {
    const next = JSON.parse(JSON.stringify(d));
    const keys = path.split('.');
    let o = next;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = value;
    return next;
  });

  const finish = async () => {
    if (!ownerName.trim()) { toast('Enter the owner name'); return; }
    if (!/^\d{4}$/.test(ownerPin)) { toast('PIN must be 4 digits'); return; }
    const owner = { id: uid('usr'), name: ownerName.trim(), role: 'owner', pin: ownerPin, locked: false, addedAt: Date.now() };
    const final = { ...s, team: [owner], onboarded: true };
    const saved = await saveSettings(final);
    setSettings(saved);
    setSession({ memberId: owner.id, role: 'owner', name: owner.name });
    toast('Clinic setup complete');
  };

  const stepMeta = [
    { badge: 'Step 01 · Clinic Identity', title: 'Tell us about your clinic.', sub: 'Enter details exactly as registered — they appear on receipts.', rail: 'Clinic identity', railDesc: 'Name, GSTIN, address' },
    { badge: 'Step 02 · Hours & Capacity', title: 'Set your hours and capacity.', sub: 'Used for appointment scheduling and chair utilisation.', rail: 'Hours & capacity', railDesc: 'Timings, chairs, slots' },
    { badge: 'Step 03 · Billing & Tax', title: 'Configure billing and GST.', sub: 'Invoice numbering, GST rates, and payment modes.', rail: 'Billing & tax', railDesc: 'Invoices, GST, payments' },
    { badge: 'Step 04 · Preferences', title: 'Choose how you work.', sub: 'Scheduling view, tooth numbering, and security.', rail: 'Preferences', railDesc: 'Views, charting, lock' },
    { badge: 'Step 05 · Owner profile', title: 'Create your owner PIN.', sub: 'You can reset any staff PIN and manage the clinic.', rail: 'Owner profile', railDesc: 'Your name & PIN' },
  ];
  const meta = stepMeta[step];

  if (showWelcome) return <Welcome onStart={() => setShowWelcome(false)} />;

  const back = () => setStep((i) => Math.max(0, i - 1));
  const next = () => setStep((i) => Math.min(TOTAL_STEPS - 1, i + 1));

  const toggleDay = (d) => {
    const days = s.hours.daysOpen.includes(d) ? s.hours.daysOpen.filter((x) => x !== d) : [...s.hours.daysOpen, d];
    upd('hours.daysOpen', days);
  };

  return (
    <div className="wizard-wrap wizard-wrap-full">
      <div className="wizard wizard-split">
        <aside className="wizard-rail">
          <div className="wizard-rail-brand">
            <div className="wizard-rail-logo"><ToothLogo size={22} /></div>
            <div>
              <div className="wizard-rail-name">Dental PMS</div>
              <div className="wizard-rail-sub">Clinic setup</div>
            </div>
          </div>
          <div className="wizard-steps">
            {stepMeta.map((m, i) => (
              <button
                key={i}
                className={'wstep' + (i === step ? ' active' : '') + (i < step ? ' done' : '')}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
              >
                <span className="wstep-num">{i < step ? <Icons.check size={13} /> : i + 1}</span>
                <span className="wstep-text">
                  <span className="wstep-title">{m.rail}</span>
                  <span className="wstep-desc">{m.railDesc}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="wizard-rail-foot"><Icons.lock size={13} /> Works fully offline · data stays on this device</div>
        </aside>

        <div className="wizard-main">
        <div className="wizard-head">
          <div className="badge">{meta.badge}</div>
          <h1>{meta.title}</h1>
          <div className="sub">{meta.sub}</div>
        </div>

        <div className="wizard-body">
          {step === 0 && (
            <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
              <div><label className="field-label">Clinic name</label><input className="field" value={s.clinic.name} onChange={(e) => upd('clinic.name', e.target.value)} placeholder="Bright Smile Dental Clinic" /></div>
              <div className="field-row cols-2">
                <div><label className="field-label">Registration number</label><input className="field" value={s.clinic.registrationNumber} onChange={(e) => upd('clinic.registrationNumber', e.target.value)} /></div>
                <div><label className="field-label">GSTIN</label><input className="field" value={s.clinic.gstin} onChange={(e) => upd('clinic.gstin', e.target.value)} placeholder="29ABCDE1234F1Z5" style={{ fontFamily: 'var(--font-mono)' }} /></div>
              </div>
              <div className="field-row cols-2">
                <div><label className="field-label">Phone</label><input className="field" value={s.clinic.phone} onChange={(e) => upd('clinic.phone', e.target.value)} placeholder="+91 98765 43210" /></div>
                <div><label className="field-label">Email</label><input className="field" value={s.clinic.email} onChange={(e) => upd('clinic.email', e.target.value)} /></div>
              </div>
              <div><label className="field-label">Address</label><textarea className="field" rows={2} value={s.clinic.address} onChange={(e) => upd('clinic.address', e.target.value)} placeholder="12, MG Road, Bengaluru, Karnataka 560001" /></div>
              <div className="field-row cols-2">
                <div><label className="field-label">City</label><input className="field" value={s.clinic.city} onChange={(e) => upd('clinic.city', e.target.value)} /></div>
                <div><label className="field-label">State</label><input className="field" value={s.clinic.state} onChange={(e) => upd('clinic.state', e.target.value)} /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
              <div className="field-row cols-2">
                <div><label className="field-label">Opening time</label><input type="time" className="field" value={s.hours.opening} onChange={(e) => upd('hours.opening', e.target.value)} /></div>
                <div><label className="field-label">Closing time</label><input type="time" className="field" value={s.hours.closing} onChange={(e) => upd('hours.closing', e.target.value)} /></div>
              </div>
              <div>
                <label className="field-label">Days open</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DAYS.map((d) => <button key={d} onClick={() => toggleDay(d)} className={'chip ' + (s.hours.daysOpen.includes(d) ? 'chip-blue' : 'chip-soft')} style={{ padding: '6px 12px' }}>{d}</button>)}
                </div>
              </div>
              <div className="field-row cols-3">
                <div><label className="field-label">Chairs</label><input type="number" min="1" className="field" value={s.capacity.chairs} onChange={(e) => upd('capacity.chairs', parseInt(e.target.value) || 1)} /></div>
                <div><label className="field-label">Slot (min)</label><input type="number" min="5" step="5" className="field" value={s.capacity.slotDuration} onChange={(e) => upd('capacity.slotDuration', parseInt(e.target.value) || 30)} /></div>
                <div><label className="field-label">Buffer (min)</label><input type="number" min="0" step="5" className="field" value={s.capacity.buffer} onChange={(e) => upd('capacity.buffer', parseInt(e.target.value) || 0)} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
              <div className="field-row cols-2">
                <div><label className="field-label">Invoice prefix</label><input className="field" value={s.billing.invoicePrefix} onChange={(e) => upd('billing.invoicePrefix', e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} /></div>
                <div><label className="field-label">Next invoice number</label><input type="number" className="field" value={s.billing.nextInvoiceNumber} onChange={(e) => upd('billing.nextInvoiceNumber', parseInt(e.target.value) || 1001)} /></div>
              </div>
              <div>
                <label className="field-label">Payment modes accepted</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['UPI', 'Cash', 'Card', 'Wallet', 'Bank Transfer'].map((m) => {
                    const on = s.billing.paymentModes.includes(m);
                    return <button key={m} onClick={() => upd('billing.paymentModes', on ? s.billing.paymentModes.filter((x) => x !== m) : [...s.billing.paymentModes, m])} className={'chip ' + (on ? 'chip-blue' : 'chip-soft')} style={{ padding: '6px 12px' }}>{m}</button>;
                  })}
                </div>
              </div>
              <div>
                <label className="field-label">GST rate table (healthcare services are exempt)</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {s.billing.gstRates.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input className="field" style={{ flex: 1 }} value={r.label} onChange={(e) => { const a = [...s.billing.gstRates]; a[i] = { ...a[i], label: e.target.value }; upd('billing.gstRates', a); }} />
                      <input type="number" className="field" style={{ width: 90 }} value={r.rate} onChange={(e) => { const a = [...s.billing.gstRates]; a[i] = { ...a[i], rate: parseFloat(e.target.value) || 0 }; upd('billing.gstRates', a); }} />
                      <span style={{ fontSize: 12, color: 'var(--muted)', width: 60 }}>{r.kind}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: 18, maxWidth: 560 }}>
              <Choice label="Scheduling view" value={s.choices.schedulingMode} onChange={(v) => upd('choices.schedulingMode', v)} options={[{ v: 'grid', t: 'Day grid', d: 'Chairs × time slots (recommended)' }, { v: 'list', t: 'Simple list', d: 'Sortable appointments' }, { v: 'week', t: 'Week view', d: 'Multi-day columns' }]} />
              <Choice label="Tooth numbering system" value={s.choices.numberingSystem} onChange={(v) => upd('choices.numberingSystem', v)} options={[{ v: 'fdi', t: 'FDI', d: 'Standard in India (quadrants 1–4)' }, { v: 'universal', t: 'Universal', d: 'Sequential 1–32' }]} />
              <Choice label="Invoice template" value={s.choices.invoiceTemplate} onChange={(v) => upd('choices.invoiceTemplate', v)} options={[{ v: 'standard', t: 'Standard', d: 'Itemized with GST split' }, { v: 'compact', t: 'Compact thermal', d: '80mm narrow' }]} />
              <Choice label="Auto-lock" value={String(s.security.autoLockMinutes)} onChange={(v) => upd('security.autoLockMinutes', parseInt(v))} options={[{ v: '1', t: '1 min', d: 'Strict' }, { v: '5', t: '5 min', d: 'Balanced (recommended)' }, { v: '15', t: '15 min', d: 'Relaxed' }, { v: '0', t: 'Never', d: 'No auto-lock' }]} />
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'grid', gap: 14, maxWidth: 480 }}>
              <div><label className="field-label">Owner name</label><input className="field" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Dr. Dev Sharma" /></div>
              <div>
                <label className="field-label">4-digit PIN</label>
                <input className="field" style={{ fontSize: 22, letterSpacing: 10, textAlign: 'center' }} value={ownerPin} onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" />
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>You'll use this PIN to sign in. You can reset other staff PINs.</div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-foot">
          <div className="pct">Step {step + 1} of {TOTAL_STEPS} · {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && <button className="btn btn-ghost" onClick={back}><Icons.back size={16} /> Back</button>}
            {step < TOTAL_STEPS - 1 ? (
              <button className="btn btn-primary" onClick={next}>Next</button>
            ) : (
              <button className="btn btn-primary" onClick={finish}><Icons.check size={16} /> Launch clinic</button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function Welcome({ onStart }) {
  const features = [
    { icon: Icons.appointments, title: 'Smart scheduling', desc: 'Chair-by-chair day grid with conflict guards' },
    { icon: Icons.records, title: 'Full odontogram', desc: 'FDI charting with per-surface conditions' },
    { icon: Icons.billing, title: 'GST-correct billing', desc: 'Tax-split invoices & bilingual receipts' },
    { icon: Icons.lock, title: '100% offline', desc: 'Every record stays private on this device' },
  ];
  return (
    <div className="welcome-wrap">
      <div className="welcome-card">
        <div className="welcome-logo"><ToothLogo size={38} /></div>
        <div className="welcome-eyebrow">Dental Practice Suite</div>
        <h1 className="welcome-title">Run your entire clinic<br />from one calm screen.</h1>
        <div className="welcome-sub">Appointments, charting, billing, inventory and reports — built for Indian dental practices, working fully offline.</div>
        <div className="welcome-features">
          {features.map((f) => {
            const Ic = f.icon;
            return (
              <div className="welcome-feature" key={f.title}>
                <span className="wf-ic"><Ic size={18} /></span>
                <div>
                  <div className="wf-title">{f.title}</div>
                  <div className="wf-desc">{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn btn-primary welcome-cta" onClick={onStart}>Set up your clinic <Icons.back size={16} style={{ transform: 'rotate(180deg)' }} /></button>
        <div className="welcome-foot">Takes about 2 minutes · You can change anything later in Settings</div>
      </div>
    </div>
  );
}

function Choice({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{label}</div>
      <div className="choice-grid">
        {options.map((o) => (
          <button key={o.v} className={'choice' + (value === o.v ? ' sel' : '')} onClick={() => onChange(o.v)}>
            <div className="ct">{o.t}</div>
            <div className="cd">{o.d}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
