import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CRUMBS } from '../screens/nav.js';
import { initials as toInitials } from '../lib/name.js';

export default function Topbar({ module, onNavigate }) {
  const { session } = useApp();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const initials = toInitials(session?.name);
  const roleLabel = session?.role ? session.role.charAt(0).toUpperCase() + session.role.slice(1) : '';

  return (
    <header className="topbar">
      <div className="crumb">
        Clinic<span className="sep">/</span>{CRUMBS[module] || 'Dashboard'}
      </div>
      <div className="spacer" />
      <div className="clock">{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
      <button className="user-chip" onClick={() => onNavigate('staff')}>
        <div className="avatar">{initials}</div>
        <div>
          <div className="uname">{session?.name || '—'}</div>
          <div className="urole">{roleLabel}</div>
        </div>
      </button>
    </header>
  );
}
