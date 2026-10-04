import { useEffect, useRef, useState } from 'react';
import type { InitialGameRoomView } from '../shared/contracts/room';
import type { CardView } from '../shared/contracts/game';
import { suffixes } from './screens';
import { CardDetails, GameCard } from './GameCard';

export function GameScreen({ room, connected, activity }: { room: InitialGameRoomView; connected: boolean; activity: string }) {
  const title = useRef<HTMLHeadingElement>(null);
  const focusedGame = useRef<string | null>(null);
  const hand = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [details, setDetails] = useState<{ card: CardView; trigger: HTMLButtonElement } | null>(null);
  useEffect(() => {
    if (focusedGame.current !== room.game.id) { title.current?.focus(); focusedGame.current = room.game.id; }
  }, [room.game.id]);
  useEffect(() => {
    const element = hand.current;
    if (!element) return;
    const resize = new ResizeObserver(() => setOverflows(element.scrollWidth > element.clientWidth + 1));
    resize.observe(element);
    return () => resize.disconnect();
  }, [room.game.id]);
  const displayed = suffixes(room);
  const label = (id: string) => {
    const person = room.participants.find((item) => item.id === id)!;
    return `${person.name}${displayed.has(id) ? ` (${displayed.get(id)})` : ''}${id === room.participant.id ? ' (tú)' : ''}`;
  };
  const players = room.participants.filter((person) => person.isPlayer);
  const observer = room.participants.find((person) => !person.isPlayer);
  const { round, attributes } = room.game;
  const active = attributes.find((attribute) => attribute.id === round.activeAttributeId)!;
  const showDetails = (card: CardView, trigger: HTMLButtonElement) => setDetails({ card, trigger });
  const closeDetails = () => { details?.trigger.focus(); setDetails(null); };
  return <main className="shell game-shell">
    <header><span className="brand">KARTA<span>3</span></span><span className="top-label">Mesa inicial</span></header>
    <h1 ref={title} tabIndex={-1}>Mesa inicial · {room.selectedDeck.name} · v{room.selectedDeck.contentVersion}</h1>
    <p className="initial-table-notice">Mesa inicial preparada. La ejecución de turnos todavía no está disponible.</p>
    <p className="game-summary">Ronda {round.number} · Mazo de robo: {room.game.drawPileCount}</p>
    {!connected && <p className="connection-notice" role="status">Conexión interrumpida. Intentando recuperarla…</p>}
    {activity && <p className="activity" role="status">{activity}</p>}
    <div className="game-layout">
      <aside className="game-panel game-people" aria-labelledby="game-players-title">
        <h2 id="game-players-title">Jugadores y puntuaciones</h2>
        <ol className="game-players">{players.map((person) => <li key={person.id}>
          <strong>{label(person.id)}</strong><span className="game-score">{person.score} puntos</span>
          <span className="participant-badges">
            {person.role === 'HOST' && <span className="badge">Anfitrión</span>}
            {person.id === round.openerPlayerId && <span className="badge">Abridor</span>}
            {person.presence === 'DISCONNECTED' && <span className="badge reconnecting">Sin conexión</span>}
          </span>
        </li>)}</ol>
        {observer && <div className="observer-line"><strong>{label(observer.id)}</strong><span>Anfitrión · Observador</span>
          {observer.presence === 'DISCONNECTED' && <span className="badge reconnecting">Sin conexión</span>}</div>}
        {!room.participant.isPlayer && <p className="observing">Observando</p>}
      </aside>
      <section className="game-panel game-plays" aria-labelledby="game-plays-title"><h2 id="game-plays-title">Cartas jugadas</h2><p>Aún no hay cartas jugadas</p></section>
      <section className="game-panel game-indicator" aria-labelledby="game-indicator-title">
        <h2 id="game-indicator-title">Carta indicadora</h2>
        <p>Atributo indicador: {active.name}</p>
        <div className="indicator-full"><GameCard card={round.indicator} attributes={attributes} activeAttributeId={round.activeAttributeId} onDetails={showDetails} /></div>
        <div className="indicator-compact"><strong>{round.indicator.name}</strong>
          <button className="secondary" aria-label={`Detalles de ${round.indicator.name}`} onClick={(event) => showDetails(round.indicator, event.currentTarget)}>Detalles</button></div>
      </section>
      {room.participant.isPlayer && <section className="game-panel game-hand" aria-labelledby="game-hand-title">
        <h2 id="game-hand-title">Tu mano</h2>{overflows && <p className="swipe-hint" id="hand-scroll-hint">Desliza para ver las tres cartas</p>}
        <div ref={hand} className="hand-row" tabIndex={0} role="region" aria-label="Cartas de tu mano" aria-describedby={overflows ? 'hand-scroll-hint' : undefined}>
          {room.game.hand.map((card) => <GameCard key={card.id} card={card} attributes={attributes} activeAttributeId={round.activeAttributeId} onDetails={showDetails} />)}
        </div>
      </section>}
      <section className="game-panel game-initial-state" aria-labelledby="game-state-title"><h2 id="game-state-title">Estado inicial</h2>
        <p>Abridor: {label(round.openerPlayerId)}</p><p>Atributo activo: <strong>{active.name}</strong></p><p>Dirección: Sin elegir</p>
      </section>
    </div>
    {details && <CardDetails card={details.card} attributes={attributes} activeAttributeId={round.activeAttributeId} onClose={closeDetails} />}
  </main>;
}
