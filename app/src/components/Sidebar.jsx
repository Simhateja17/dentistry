import { useApp } from '../context/AppContext.jsx';
import { ToothLogo, Icons } from './Icons.jsx';
import { navFor } from '../screens/nav.js';

export default function Sidebar({ module, onNavigate }) {
  const { settings, session, setSession } = useApp();
  const groups = navFor(session?.role || 'doctor');

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo"><ToothLogo size={22} /></div>
        <div>
          <div className="name">{settings?.clinic?.name || 'Dental PMS'}</div>
          <div className="sub">Practice Suite</div>
        </div>
      </div>
      {groups.map((g) => (
        <div className="nav-group" key={g.label}>
          <div className="grp-label">{g.label}</div>
          {g.items.map((m) => {
            const Ic = m.icon;
            const active = m.id === module;
            return (
              <button key={m.id} className={'nav-item' + (active ? ' active' : '')} onClick={() => onNavigate(m.id)}>
                <span className="ic"><Ic size={18} /></span>
                {m.label}
              </button>
            );
          })}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div className="sidebar-status">
        <div className="status-title"><span className="status-dot" /> Clinic systems live</div>
        <div className="status-copy">Appointments, billing, records, and local data are ready.</div>
      </div>
      <div className="nav-group" style={{ marginTop: 'auto' }}>
        <button className={'nav-item' + (module === 'settings' ? ' active' : '')} onClick={() => onNavigate('settings')}>
          <span className="ic"><Icons.settings size={18} /></span>
          Settings
        </button>
        <button className="nav-item" onClick={() => setSession(null)}>
          <span className="ic"><Icons.lock size={18} /></span>
          Lock
        </button>
      </div>
    </aside>
  );
}
