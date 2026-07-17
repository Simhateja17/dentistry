'use client';

import { useEffect } from 'react';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';

// Client entry — replaces the old Vite main.jsx. Everything imported from here
// (App, screens, components, lib, db) runs client-side only, exactly as before.
export default function AppClient() {
  useEffect(() => {
    const boot = document.getElementById('boot');
    if (boot) setTimeout(() => boot.remove(), 400);
  }, []);

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
