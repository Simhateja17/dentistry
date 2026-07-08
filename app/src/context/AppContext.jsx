import { createContext, useContext, useCallback, useState } from 'react';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [session, setSession] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = {
    settings,
    setSettings,
    session,
    setSession,
    toast,
  };
  return <Ctx.Provider value={value}>{children}
    <div className="toast-wrap">{toasts.map((t) => <div className="toast" key={t.id}>{t.msg}</div>)}</div>
  </Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used within AppProvider');
  return c;
}
