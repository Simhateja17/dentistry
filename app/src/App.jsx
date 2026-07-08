import { useEffect, useRef, useState } from 'react';
import { useApp } from './context/AppContext.jsx';
import { loadSettings } from './lib/settings.js';
import { useAutoLock } from './lib/useAutoLock.js';
import LockScreen from './auth/LockScreen.jsx';
import SetupWizard from './onboarding/SetupWizard.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Dashboard from './screens/Dashboard.jsx';
import SettingsScreen from './screens/Settings.jsx';
import Placeholder from './screens/Placeholder.jsx';
import Patients from './screens/Patients.jsx';
import PatientRecord from './screens/PatientRecord.jsx';
import Appointments from './screens/Appointments.jsx';
import VisitEditor from './screens/VisitEditor.jsx';
import Billing from './screens/Billing.jsx';
import Plans from './screens/Plans.jsx';
import LabCases from './screens/LabCases.jsx';
import Stock from './screens/Stock.jsx';
import Suppliers from './screens/Suppliers.jsx';
import StaffOnDuty from './screens/StaffOnDuty.jsx';
import StaffOnboarding from './screens/StaffOnboarding.jsx';
import Reports from './screens/Reports.jsx';
import { clockIn, clockOut } from './lib/staff.js';
import { canAccess } from './lib/settings.js';

export default function App() {
  const { settings, setSettings, session, setSession } = useApp();
  const [booting, setBooting] = useState(true);
  const [module, setModule] = useState('dashboard');
  const [recordPatientId, setRecordPatientId] = useState(null);
  const [visitCtx, setVisitCtx] = useState(null); // { appt } or { patientId, patientName }
  const [focusInvoice, setFocusInvoice] = useState(null);
  const [focusPatient, setFocusPatient] = useState(null); // for booking after register
  const lockCb = useRef(() => setSession(null));
  lockCb.current = () => setSession(null);

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
      setBooting(false);
    })();
  }, []);

  const reset = useAutoLock(settings?.security?.autoLockMinutes || 5, lockCb, !!session);

  const prevSession = useRef(null);
  useEffect(() => {
    if (prevSession.current && !session) {
      clockOut(prevSession.current.memberId).catch(() => {});
    } else if (!prevSession.current && session) {
      clockIn(session.memberId, session.name, session.role).catch(() => {});
    } else if (prevSession.current && session && prevSession.current.memberId !== session.memberId) {
      clockOut(prevSession.current.memberId).catch(() => {});
      clockIn(session.memberId, session.name, session.role).catch(() => {});
    }
    prevSession.current = session;
  }, [session]);

  if (booting) return null;

  if (!settings || !settings.onboarded) return <SetupWizard />;
  if (!session) return <LockScreen />;

  const navigate = (id) => {
    setVisitCtx(null);
    if (id === 'records') { setModule('patients'); return; }
    if (!canAccess(session.role, id) && id !== 'settings') { setModule('dashboard'); return; }
    setModule(id);
  };

  const openRecord = (pid) => { setRecordPatientId(pid); setModule('records'); };
  const startVisit = (patient) => { setVisitCtx({ patientId: patient.id, patientName: patient.name }); };
  const openVisitFromAppt = (appt) => { setVisitCtx({ appt }); };
  const openInvoice = (id) => { setFocusInvoice(id); setModule('billing'); };

  const renderModule = () => {
    if (visitCtx) return <VisitEditor appt={visitCtx.appt} patientId={visitCtx.patientId} patientName={visitCtx.patientName} onDone={() => setVisitCtx(null)} onOpenInvoice={openInvoice} />;
    if (module === 'dashboard') return <Dashboard onNavigate={navigate} onOpenVisit={openVisitFromAppt} />;
    if (module === 'settings') return <SettingsScreen onNavigate={navigate} />;
    if (module === 'patients') return <Patients onNavigate={navigate} onOpenRecord={openRecord} />;
    if (module === 'records') return <PatientRecord patientId={recordPatientId} onBack={() => navigate('patients')} onStartVisit={startVisit} onOpenInvoice={openInvoice} />;
    if (module === 'appointments') return <Appointments onOpenVisit={openVisitFromAppt} focusPatient={focusPatient} />;
    if (module === 'billing') return <Billing focusInvoice={focusInvoice} />;
    if (module === 'plans') return <Plans focusPatient={focusPatient} />;
    if (module === 'lab') return <LabCases focusPatient={focusPatient} onOpenRecord={openRecord} />;
    if (module === 'stock') return <Stock />;
    if (module === 'suppliers') return <Suppliers />;
    if (module === 'staff') return <StaffOnDuty />;
    if (module === 'staffonboard') return <StaffOnboarding />;
    if (module === 'reports') return <Reports />;
    return <Placeholder module={module} onNavigate={navigate} />;
  };

  return (
    <div className="app-shell" onMouseMove={reset} onClick={reset}>
      <Sidebar module={module} onNavigate={navigate} />
      <div className="main">
        <Topbar module={module} onNavigate={navigate} />
        <div className="content" key={module + (visitCtx ? 'v' : '') + (recordPatientId || '')}>{renderModule()}</div>
      </div>
    </div>
  );
}
