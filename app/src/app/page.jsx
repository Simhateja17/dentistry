'use client';

import dynamic from 'next/dynamic';

// The app uses IndexedDB / document / window throughout, so it must render
// on the client only. ssr:false skips any server render and keeps behavior
// identical to the old single-page Vite build.
const AppClient = dynamic(() => import('../AppClient.jsx'), { ssr: false });

export default function Page() {
  return <AppClient />;
}
