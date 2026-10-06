import { useEffect, useRef, useState } from 'react';
import type { InitialGameRoomView } from '../shared/contracts/room';
import type { CardView } from '../shared/contracts/game';
import { suffixes } from './participantNames';
import { CardDetails, GameCard } from './GameCard';
import { useGameActions } from './useGameActions';
import type { CurrentRoomResponse, RoomView } from '../shared/contracts/room';
import { RoundReview } from './RoundReview';
import { useServerCountdown } from './useServerCountdown';
import { publicPlays } from './publicPlays';

export function GameScreen({ room, connected, activity, onRoom, onCurrent }: { room: InitialGameRoomView; connected: boolean; activity: string; onRoom: (room: RoomView) => boolean; onCurrent: (result: CurrentRoomResponse) => void }) {
  const remaining = useServerCountdown(room.game.interaction.turn?.timing ?? null);
  const actions = useGameActions(room, connected, onRoom, onCurrent, remaining === 0);
  const resyncedTurn = useRef<string | undefined>(undefined);
  const turnId = room.game.interaction.turn?.id;
  useEffect(() => {
    if (remaining !== 0 || !connected || actions.busy || !turnId || resyncedTurn.current === turnId) return;
    resyncedTurn.current = turnId;
    void actions.recover(); // Solo lectura; el cero local nunca envía una jugada ni un timeout.
  }, [remaining, connected, actions, turnId]);
  const title = useRef<HTMLHeadingElement>(null);
  const focusedGame = useRef<string | null>(null);
  const hand = useRef<HTMLDivElement>(null);
  const mesa = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [mesaOverflows, setMesaOverflows] = useState(false);
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
  }, [room.game.id, room.game.hand.length]);
  useEffect(() => {
    const element = mesa.current;
    if (!element) return;
    const resize = new ResizeObserver(() => setMesaOverflows(element.scrollWidth > element.clientWidth + 1));
    resize.observe(element);
    return () => resize.disconnect();
  }, [room.game.id, room.game.round.plays.length]);
  const displayed = suffixes(room);
  const label = (id: string) => {
    const person = room.participants.find((item) => item.id === id)!;
    return `${person.name}${displayed.has(id) ? ` (${displayed.get(id)})` : ''}${id === room.participant.id ? ' (tú)' : ''}`;
  };
  const players = room.participants.filter((person) => person.isPlayer);
  const observer = room.participants.find((person) => !person.isPlayer);
  const { round, attributes } = room.game;
  const active = attributes.find((attribute) => attribute.id === round.activeAttributeId)!;
  const mesaHint = round.plays.length === 5 && mesaOverflows;
  const showDetails = (card: CardView, trigger: HTMLButtonElement) => setDetails({ card, trigger });
  const closeDetails = () => {
    if (details?.trigger.isConnected) details.trigger.focus();
    else (hand.current ?? title.current)?.focus();
    setDetails(null);
  };
  return <main className="shell game-shell">
    <header><span className="brand">KARTA<span>3</span></span><span className="top-label">Partida</span></header>
    <h1 ref={title} tabIndex={-1}>Partida · {room.selectedDeck.name} · v{room.selectedDeck.contentVersion}</h1>
    {room.participant.playStatus === 'ACTIVE' && room.game.ownConsecutiveTimeouts === 1 && <p className="initial-table-notice" role="status">No completaste tu último turno a tiempo. Si vuelve a ocurrir sin una jugada manual entre medias, pasarás a automático</p>}
    {room.participant.playStatus === 'AUTOMATIC' && <p className="initial-table-notice" role="status">Has pasado a automático. Puedes seguir viendo la partida, pero ya no jugar manualmente</p>}
    <p className="game-summary">Ronda {round.number} · Mazo de robo: {room.game.drawPileCount}</p>
    {room.game.phase === 'FINAL_PHASE' && <p role="status">Fase final · ronda {round.finalRoundIndex} de 3 · sin reposición</p>}
    {room.game.phase === 'TIE_BREAK' && <p role="status">Desempate · una única ronda sin puntos nuevos</p>}
    {!connected && <p className="connection-notice" role="status">Conexión interrumpida. Intentando recuperarla…</p>}
    {activity && <p className="activity" role="status">{activity}</p>}
    <div className="game-layout">
      <aside className="game-panel game-people" aria-labelledby="game-players-title">
        <h2 id="game-players-title">Jugadores y puntuaciones</h2>
        <ol className="game-players">{players.map((person) => <li key={person.id} className={person.id === round.openerPlayerId ? 'is-opener' : undefined}>
          <strong>{label(person.id)}</strong><span className="game-score">{person.score} puntos</span>
          <span className="participant-badges">
            {person.role === 'HOST' && <span className="badge host-badge">Anfitrión</span>}
            {person.id === round.openerPlayerId && <span className="badge opener-badge">Abridor</span>}
            {person.id === room.game.interaction.turn?.playerId && <span className="badge">Juega</span>}
            {person.presence === 'DISCONNECTED' && <span className="badge reconnecting">Sin conexión</span>}
            {person.playStatus === 'AUTOMATIC' && <span className="badge">Automático</span>}
            {person.kind === 'BOT' && <><span className="badge bot-badge">Bot · {person.botDifficulty === 'EASY' ? 'Fácil' : 'Difícil'}</span><span className="bot-level" role="img" aria-label={`Bot · ${person.botDifficulty === 'EASY' ? 'Fácil' : 'Difícil'}`}>{person.botDifficulty === 'EASY' ? 'BF' : 'BD'}</span></>}
          </span>
        </li>)}</ol>
        {observer && <div className="observer-line"><strong>{label(observer.id)}<span className="observer-abbreviation" role="img" aria-label="Observador"> (O)</span></strong><span className="observer-description">Anfitrión · Observador</span>
          {observer.presence === 'DISCONNECTED' && <span className="badge reconnecting">Sin conexión</span>}</div>}
        {!room.participant.isPlayer && <p className="observing">Observando</p>}
      </aside>
      <section className="game-panel game-plays" aria-labelledby="game-plays-title">
        {!round.plays.length && <p className="empty-mesa">Aún no hay cartas jugadas</p>}
        <div ref={mesa} className="played-row" tabIndex={0} role="region" aria-label="Cartas públicas de Mesa" aria-describedby={mesaHint ? 'mesa-scroll-hint' : undefined}>{publicPlays(room.game).map((play) => <div key={play.playerId} role="group" aria-label={`Jugada de ${label(play.playerId)}`}><GameCard card={play.card} attributes={attributes} activeAttributeId={round.activeAttributeId} onDetails={showDetails} /><p className="play-author"><span className="play-number">{play.order}. </span>{label(play.playerId)}</p></div>)}</div>
        <h2 id="game-plays-title"><span className="mesa-title">Mesa</span><span className="mobile-mesa-title">Cartas jugadas</span></h2>
        {mesaHint && <p className="mesa-overflow-hint" id="mesa-scroll-hint">5 cartas · desliza →</p>}
      </section>
      <section className="game-panel game-indicator" aria-labelledby="game-indicator-title">
        <div className="game-card-panel-heading"><h2 id="game-indicator-title">Carta indicadora</h2><p className="indicator-attribute-label">Atributo indicador: {active.name}</p></div>
        <div className="indicator-full"><GameCard card={round.indicator} attributes={attributes} activeAttributeId={round.activeAttributeId} onDetails={showDetails} /></div>
        <div className="indicator-compact"><strong>{round.indicator.name}</strong>
          <button className="secondary" aria-label={`Detalles de ${round.indicator.name}`} onClick={(event) => showDetails(round.indicator, event.currentTarget)}>Detalles</button></div>
      </section>
      {room.participant.isPlayer && <section className="game-panel game-hand" aria-labelledby="game-hand-title">
        <div className="game-card-panel-heading"><h2 id="game-hand-title">Tu mano</h2>{overflows && <p className="swipe-hint" id="hand-scroll-hint">Desliza para ver tus cartas</p>}</div>
        <div ref={hand} className="hand-row" tabIndex={0} role="region" aria-label="Cartas de tu mano" aria-describedby={overflows ? 'hand-scroll-hint' : undefined}>
          {room.game.hand.map((card) => <GameCard key={card.id} card={card} attributes={attributes} activeAttributeId={round.activeAttributeId} onDetails={showDetails}
            onChoose={actions.chooseCard} disabled={!actions.enabled} selected={actions.selectedCard === card.id} />)}
        </div>
      </section>}
      <section className="game-panel game-initial-state" aria-labelledby="game-state-title"><h2 id="game-state-title">Estado de la partida</h2>
        {room.game.interaction.turn && <p role="status" className="turn-player">Juega:<span> {label(room.game.interaction.turn.playerId)}</span></p>}
        {remaining !== null && <p className="turn-time">Tiempo de turno:<span role="timer" aria-live="off"> {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span></p>}
        {remaining === 0 && <p role="status">Esperando actualización del servidor…</p>}
        <p>Abridor: {label(round.openerPlayerId)}</p><p>Atributo activo: <strong>{active.name}</strong></p><p>Dirección: {round.direction === null ? 'Sin elegir' : round.direction === 'HIGH' ? 'ALTO' : 'BAJO'}</p>
        {room.game.interaction.review && <RoundReview room={room} label={label} />}
        {actions.opening && <fieldset disabled={!actions.enabled}><legend>Elige dirección</legend>
          <button aria-pressed={room.game.interaction.openingSelection?.direction === 'HIGH'} onClick={() => actions.chooseDirection('HIGH')}>ALTO</button>
          <button aria-pressed={room.game.interaction.openingSelection?.direction === 'LOW'} onClick={() => actions.chooseDirection('LOW')}>BAJO</button>
          <p>Dirección aceptada (solo tú): {room.game.interaction.openingSelection?.direction === 'HIGH' ? 'ALTO' : room.game.interaction.openingSelection?.direction === 'LOW' ? 'BAJO' : 'Sin elegir'}</p>
        </fieldset>}
        {actions.busy && <p role="status">Enviando…</p>}
        {actions.error && <p className="field-error" role="alert">{actions.error}</p>}
        {actions.pending && <button disabled={actions.busy || !connected || remaining === 0} onClick={() => actions.pending!.recovered ? actions.retry() : void actions.recover()}>{actions.pending.recovered ? 'Reintentar confirmación' : 'Recuperar mesa'}</button>}
      </section>
    </div>
    <p className="game-legend">J: valor jugable · BF: bot fácil · BD: bot difícil · O: observador</p>
    {details && <CardDetails card={details.card} attributes={attributes} activeAttributeId={round.activeAttributeId} onClose={closeDetails} />}
  </main>;
}
