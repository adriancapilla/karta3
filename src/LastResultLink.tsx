import { useEffect, useState } from 'react';
import type { LastResult } from '../shared/contracts/room';

export function LastResultLink({ result, onView }: { result: LastResult; onView: (gameId: string) => void }) {
  const [available, setAvailable] = useState(() => Date.now() < result.expiresAt);
  useEffect(() => {
    const tick = () => setAvailable(Date.now() < result.expiresAt);
    const first = window.setTimeout(tick, 0); const timer = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [result.expiresAt]);
  return available ? <p><a href={`/resultado/${encodeURIComponent(result.gameId)}`} onClick={(event) => { event.preventDefault(); onView(result.gameId); }}>Ver último resultado</a></p> : null;
}
