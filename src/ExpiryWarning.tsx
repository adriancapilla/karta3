import { useEffect, useState } from 'react';
import type { RoomView } from '../shared/contracts/room';
import { countdownSeconds } from './roomState';

export function ExpiryWarning({ lifecycle, onZero }: { lifecycle: RoomView['lifecycle']; onZero: () => void }) {
  const { expiresAt, serverNow } = lifecycle;
  const [seconds, setSeconds] = useState(() => countdownSeconds(expiresAt, serverNow, 0));
  useEffect(() => {
    const receivedAt = performance.now();
    let requested = false;
    const tick = () => {
      const remaining = countdownSeconds(expiresAt, serverNow, performance.now() - receivedAt);
      setSeconds(remaining);
      if (remaining === 0 && !requested) { requested = true; onZero(); }
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 250);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [expiresAt, serverNow, onZero]);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <aside className="expiry-warning">
    <span role="status">La sala se cerrará por inactividad</span>{' '}
    <span role="timer" aria-live="off">en {time}</span>
  </aside>;
}
