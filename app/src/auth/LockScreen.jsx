import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ToothLogo, Icons } from '../components/Icons.jsx';
import { verifyPin, saveSettings, findTeamMember } from '../lib/settings.js';
import { uid } from '../db/database.js';
import { initials as toInitials, firstName } from '../lib/name.js';

export default function LockScreen() {
  const { settings, setSettings, setSession, toast } = useApp();
  const [selId, setSelId] = useState(null);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [attempts, setAttempts] = useState({});
  const [resetting, setResetting] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [shake, setShake] = useState(false);

  const sel = selId ? findTeamMember(settings, selId) : null;
  const selAttempts = selId ? (attempts[selId] || 0) : 0;
  const isLockedOut = selAttempts >= (settings.security?.pinLockoutThreshold || 5);

  const press = (d) => {
    if (!sel || isLockedOut) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    setErr('');
    if (next.length === 4) {
      setTimeout(() => tryPin(next), 120);
    }
  };

  const tryPin = (p) => {
    if (verifyPin(settings, selId, p)) {
      setSession({ memberId: sel.id, role: sel.role, name: sel.name });
      setPin(''); setErr(''); setAttempts({});
    } else {
      const n = selAttempts + 1;
      setAttempts((a) => ({ ...a, [selId]: n }));
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 350);
      const limit = settings.security?.pinLockoutThreshold || 5;
      if (n >= limit) {
        setErr('Locked. Ask the owner to reset your PIN.');
        lockMember(sel.id);
      } else {
        setErr(`Wrong PIN. ${limit - n} attempt${limit - n === 1 ? '' : 's'} left.`);
      }
    }
  };

  const lockMember = async (id) => {
    const team = settings.team.map((m) => m.id === id ? { ...m, locked: true } : m);
    const next = await saveSettings({ ...settings, team });
    setSettings(next);
  };

  const ownerReset = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { toast('Enter a 4-digit PIN'); return; }
    const team = settings.team.map((m) => m.id === resetting ? { ...m, pin: newPin, locked: false } : m);
    const next = await saveSettings({ ...settings, team });
    setSettings(next);
    setResetting(null); setNewPin('');
    toast('PIN reset — the staff member can sign in now');
  };

  const owner = settings.team.find((m) => m.role === 'owner');

  return (
    <div className="lock-wrap">
      <div className="lock-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><ToothLogo size={34} /></div>
        <h1>{settings?.clinic?.name || 'Dental PMS'}</h1>
        <div className="sub">Tap your profile and enter your PIN</div>

        {!sel && (
          <div className="profile-tiles">
            {settings.team.map((m) => (
              <button key={m.id} className="profile-tile" onClick={() => { setSelId(m.id); setPin(''); setErr(''); }}>
                <div className="pi">{toInitials(m.name)}</div>
                <div className="pn">{firstName(m.name)}</div>
                <div className="pr">{m.role}</div>
              </button>
            ))}
          </div>
        )}

        {sel && !resetting && (
          <div className="pinpad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <button onClick={() => { setSelId(null); setPin(''); setErr(''); }} style={{ color: 'rgba(255,255,255,.6)' }}><Icons.back size={18} /></button>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{sel.name}</div>
            </div>
            {isLockedOut ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ff8a80', fontSize: 13, marginBottom: 14 }}>This profile is locked after too many wrong attempts.</div>
                {owner && sel.role !== 'owner' && (
                  <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => setResetting(sel.id)}>Reset PIN as owner</button>
                )}
              </div>
            ) : (
              <>
                <div className={'pin-dots' + (shake ? ' pin-shake' : '')}>
                  {[0, 1, 2, 3].map((i) => <div key={i} className={'pin-dot' + (pin.length > i ? ' filled' : '')} />)}
                </div>
                <div className="keys">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => <button key={d} className="key" onClick={() => press(String(d))}>{d}</button>)}
                  <button className="key fn" onClick={() => setPin((p) => p.slice(0, -1))}>⌫</button>
                  <button className="key" onClick={() => press('0')}>0</button>
                  <button className="key fn" onClick={() => setPin('')}>C</button>
                </div>
                <div className="pin-err">{err}</div>
              </>
            )}
          </div>
        )}

        {resetting && (
          <div className="pinpad">
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 18, textAlign: 'center' }}>Set new 4-digit PIN for {findTeamMember(settings, resetting)?.name}</div>
            <input className="field" style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8, marginBottom: 14 }} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => { setResetting(null); setNewPin(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={ownerReset}>Reset PIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
