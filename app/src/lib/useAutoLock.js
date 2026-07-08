import { useEffect, useRef } from 'react';

export function useAutoLock(minutes, onLock, enabled = true) {
  const timer = useRef(null);
  const cb = useRef(onLock);
  cb.current = onLock;

  useEffect(() => {
    if (!enabled || minutes <= 0) return;
    const arm = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => cb.current(), minutes * 60 * 1000);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => arm();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    arm();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [minutes, enabled]);

  return () => {
    if (timer.current) clearTimeout(timer.current);
    if (!enabled || minutes <= 0) return;
    timer.current = setTimeout(() => cb.current(), minutes * 60 * 1000);
  };
}
