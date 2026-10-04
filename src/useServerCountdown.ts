import { useEffect, useState } from 'react';
import { countdownSeconds } from './roomState';

/** Estimación visual: Unix recibido + tiempo monotónico local, nunca Date.now como autoridad. */
export function useServerCountdown(timing: { serverNow: number; endsAt: number } | null): number | null {
  const key = timing ? `${timing.endsAt}:${timing.serverNow}` : '';
  const initial = timing ? countdownSeconds(timing.endsAt, timing.serverNow, 0) : null;
  const [sample, setSample] = useState({ key, seconds: initial });
  const endsAt = timing?.endsAt; const serverNow = timing?.serverNow;
  useEffect(() => {
    if (endsAt === undefined || serverNow === undefined) return;
    const at = performance.now();
    const tick = () => setSample({ key, seconds: countdownSeconds(endsAt, serverNow, performance.now() - at) });
    const first = window.setTimeout(tick, 0); const interval = window.setInterval(tick, 250);
    return () => { window.clearTimeout(first); window.clearInterval(interval); };
  }, [key, endsAt, serverNow]);
  return sample.key === key ? sample.seconds : initial;
}
