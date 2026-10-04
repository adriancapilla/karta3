import { useEffect, useState } from 'react';
import type { InitialGameRoomView } from '../shared/contracts/room';
import { countdownSeconds } from './roomState';

export function RoundReview({ room, label }: { room: InitialGameRoomView; label: (id: string) => string }) {
  const review = room.game.interaction.review!;
  const [remaining, setRemaining] = useState(() => countdownSeconds(review.endsAt, review.serverNow, 0));
  useEffect(() => {
    const at = performance.now();
    const tick = () => setRemaining(countdownSeconds(review.endsAt, review.serverNow, performance.now() - at));
    const first = window.setTimeout(tick, 0); const timer = window.setInterval(tick, 250);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [review.endsAt, review.serverNow]);
  return <div className="round-review">
    <h3>Revisión de ronda</h3>
    {room.settings.reviewSeconds > 0 && <p>Revisión de ronda · siguiente etapa en <span role="timer" aria-live="off">00:{String(remaining).padStart(2, '0')}</span></p>}
    <p>Ganó {label(review.result.winnerPlayerId)}{review.result.awardedCardCount > 0 ? ` · +${review.result.awardedCardCount} puntos` : ' · desempate sin puntos nuevos'}</p>
    {review.result.nextOpenerPlayerId && <p>Abre {label(review.result.nextOpenerPlayerId)}</p>}
    <ol>{review.result.ranking.map((entry) => <li key={entry.playerId}>{label(entry.playerId)} · {entry.card.name} · Jugable: {entry.playValue}</li>)}</ol>
  </div>;
}
