import { useEffect, useRef } from 'react';
import type { ResultsRoomView } from '../shared/contracts/room';
import { suffixes } from './participantNames';

export function ResultsScreen({ room, activity, error, busy, onHome }: {
  room: ResultsRoomView; activity: string; error: string; busy: boolean; onHome: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null); const focused = useRef<string | null>(null);
  useEffect(() => { if (focused.current !== room.result.gameId) { title.current?.focus(); focused.current = room.result.gameId; } }, [room.result.gameId]);
  const duplicates = suffixes(room);
  const name = (id: string) => {
    const person = room.participants.find((item) => item.id === id)!;
    return `${person.name}${duplicates.has(id) ? ` (${duplicates.get(id)})` : ''}${id === room.participant.id ? ' (tú)' : ''}${person.kind === 'BOT' ? ` · Bot · ${person.botDifficulty === 'EASY' ? 'Fácil' : 'Normal'}` : ''}`;
  };
  const observer = room.participants.find((person) => !person.isPlayer);
  return <main className="shell game-shell results-shell">
    <header><span className="brand">KARTA<span>3</span></span><span className="top-label">Resultados</span></header>
    <h1 ref={title} tabIndex={-1}>Partida terminada</h1>
    <p>{room.selectedDeck.name} · v{room.selectedDeck.contentVersion}</p>
    {room.result.endReason === 'NO_ACTIVE_HUMAN_PLAYERS' && <p role="status">La partida terminó porque todos los jugadores humanos pasaron a automático</p>}
    <p className="victory" role="status">{room.result.winnerIds.length > 1 ? 'Victoria compartida' : 'Ganador'}: {room.result.winnerIds.map(name).join(', ')}{room.result.tieBreakWinnerId && ' · Desempate'}</p>
    {activity && <p className="activity" role="status">{activity}</p>}
    <section className="game-panel"><h2>Clasificación</h2><table className="standings"><thead><tr><th scope="col">Puesto</th><th scope="col">Jugador</th><th scope="col">Puntos</th></tr></thead>
      <tbody>{room.result.standings.map((entry) => <tr key={entry.playerId} className={room.result.winnerIds.includes(entry.playerId) ? 'winner-row' : undefined}>
        <td data-label="Puesto">{entry.position}</td><th scope="row">{name(entry.playerId)}{room.result.winnerIds.includes(entry.playerId) && <span className="badge">{room.result.winnerIds.length > 1 ? 'Ganador compartido' : 'Ganador'}</span>}</th><td data-label="Puntos">{entry.score}</td>
      </tr>)}</tbody></table>
      {observer && <div className="observer-line"><strong>{name(observer.id)}</strong><span>Anfitrión · Observador</span></div>}
    </section>
    <p>El resultado se conserva durante 30 minutos desde su publicación. Consultarlo no prolonga ese plazo.</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    <button className="primary" disabled={busy} onClick={onHome}>{busy ? 'Volviendo…' : 'Volver al inicio'}</button>
  </main>;
}
