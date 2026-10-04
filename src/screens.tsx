import { useRef, useState, type FormEvent } from 'react';
import type { CurrentRoomResponse, LastResult, RoomView, WaitingRoomView } from '../shared/contracts/room';
import { ExpiryWarning } from './ExpiryWarning';
import { RoomConfiguration } from './RoomConfiguration';
import { StartRoomControl } from './StartRoomControl';
import { LastResultLink } from './LastResultLink';

export function HomeScreen(props: {
  busy: boolean; joining: boolean; notice: string; code: string; joinName: string; joinError: string;
  onCreate: () => void; onRefresh: () => void; onJoin: () => void;
  onCodeChange: (value: string) => void; onJoinNameChange: (value: string) => void;
  lastResult?: LastResult; onViewResult?: (gameId: string) => void;
}) {
  const submit = (event: FormEvent) => { event.preventDefault(); props.onJoin(); };
  return <main className="shell">
    <header><span className="brand">KARTA<span>3</span></span></header>
    <div className="home-grid">
      <section className="card home">
        <p className="eyebrow">Juega en compañía</p>
        <h1>Crea una sala</h1>
        <p>Prepara el espacio para compartir una partida de KARTA3.</p>
        {props.notice && <p className="alert" role="alert">{props.notice}</p>}
        {props.lastResult && props.onViewResult && <LastResultLink result={props.lastResult} onView={props.onViewResult} />}
        <button className="primary" disabled={props.busy} onClick={props.onCreate}>{props.busy && !props.joining ? 'Creando sala…' : 'Crear sala'}</button>
        {props.notice && <button className="text-button" onClick={props.onRefresh}>Reintentar conexión</button>}
      </section>
      <section className="card home join-card">
        <h2>Entrar a una sala</h2>
        <form onSubmit={submit}>
          <label htmlFor="join-code">Código de sala</label>
          <input id="join-code" type="text" inputMode="numeric" autoComplete="off" value={props.code}
            onChange={(event) => props.onCodeChange(event.target.value)} aria-invalid={Boolean(props.joinError)}
            aria-describedby={props.joinError ? 'join-error' : undefined} />
          <label htmlFor="join-name">Tu nombre</label>
          <input id="join-name" type="text" autoComplete="nickname" value={props.joinName}
            onChange={(event) => props.onJoinNameChange(event.target.value)} aria-invalid={Boolean(props.joinError)}
            aria-describedby={props.joinError ? 'join-error' : undefined} />
          {props.joinError && <p className="field-error" id="join-error" role="alert">{props.joinError}</p>}
          <button className="primary" disabled={props.busy} type="submit">{props.joining ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </section>
    </div>
  </main>;
}

export function suffixes(room: RoomView): Map<string, number> {
  const counts = new Map<string, number>();
  for (const person of room.participants) counts.set(person.name, (counts.get(person.name) ?? 0) + 1);
  const positions = new Map<string, number>();
  const labels = new Map<string, number>();
  for (const person of room.participants) {
    const next = (positions.get(person.name) ?? 0) + 1;
    positions.set(person.name, next);
    if (counts.get(person.name)! > 1) labels.set(person.id, next);
  }
  return labels;
}

export function WaitingScreen(props: {
  room: WaitingRoomView; busy: boolean; notice: string; activity: string; name: string; nameError: string;
  copyMessage: string; confirmClose: boolean; confirmLeave: boolean;
  connected: boolean; onConfirmExpiry: () => void;
  onRoom: (room: RoomView) => boolean;
  onCurrent: (result: CurrentRoomResponse) => void;
  onNameChange: (value: string) => void; onSaveName: () => void; onCopyCode: () => void;
  onAskClose: () => void; onCancelClose: () => void; onClose: () => void;
  onAskLeave: () => void; onCancelLeave: () => void; onLeave: () => void;
}) {
  const exitButton = useRef<HTMLButtonElement>(null);
  const [pendingConfiguration, setPendingConfiguration] = useState(false);
  const submitName = (event: FormEvent) => { event.preventDefault(); props.onSaveName(); };
  const isHost = props.room.participant.role === 'HOST';
  const displayed = suffixes(props.room);
  const players = props.room.participants.filter((person) => person.isPlayer);
  const observer = props.room.participants.find((person) => !person.isPlayer);
  const cancel = () => {
    if (isHost) props.onCancelClose(); else props.onCancelLeave();
    exitButton.current?.focus();
  };
  return <main className="shell">
    <header><span className="brand">KARTA<span>3</span></span><span className="top-label">Sala de espera</span></header>
    <section className="card room">
      <div className="status"><span className="status-dot" />{isHost ? (players.length === 5 ? 'Sala completa' : 'Esperando participantes') : 'Esperando a que el anfitrión inicie la partida'}</div>
      <h1>{isHost ? 'Tu sala está lista' : 'Ya estás en la sala'}</h1>
      <p>Comparte este código para invitar a otras personas.</p>
      <div className="code-panel">
        <span className="field-label">Código de sala</span>
        <strong className="code" aria-label={`Código de sala ${props.room.code}`} tabIndex={0}>{props.room.code}</strong>
        <button className="secondary" onClick={props.onCopyCode}>Copiar código</button>
        <p className="copy-message" role="status">{props.copyMessage}</p>
      </div>
      {!props.connected && <p className="connection-notice" role="status">Conexión interrumpida. Intentando recuperarla…</p>}
      {props.room.lifecycle.warning && <ExpiryWarning lifecycle={props.room.lifecycle} onZero={props.onConfirmExpiry} />}
      <div className="waiting-columns"><section aria-labelledby="players-heading">
      <h2 id="players-heading">Jugadores</h2>
      <p className="occupancy">{players.length} de 5 jugadores</p>
      <ol className="participant-list">
        {players.map((person) => <li className="participant" key={person.id}>
          <strong>{person.name}{displayed.has(person.id) && <span className="name-suffix"> ({displayed.get(person.id)})</span>}</strong>
          <span className="participant-badges">
            {person.id === props.room.participant.id && <span className="badge">Tú</span>}
            {person.role === 'HOST' && <span className="badge">Anfitrión</span>}
            {person.presence === 'RECONNECTING' && <span className="badge reconnecting">Reconectando</span>}
          </span>
        </li>)}
      </ol>
      {observer && <div className="observer-line">
        <strong>{observer.name}{displayed.has(observer.id) && <span className="name-suffix"> ({displayed.get(observer.id)})</span>}</strong>
        <span>Anfitrión · Observador</span>
        <span className="participant-badges">
          {observer.id === props.room.participant.id && <span className="badge">Tú</span>}
          {observer.presence === 'RECONNECTING' && <span className="badge reconnecting">Reconectando</span>}
        </span>
      </div>}
      </section><RoomConfiguration room={props.room} connected={props.connected} onRoom={props.onRoom} onPendingChange={setPendingConfiguration} /></div>
      {isHost && <StartRoomControl room={props.room} connected={props.connected} pending={pendingConfiguration} onCurrent={props.onCurrent} />}
      <form onSubmit={submitName}>
        <label htmlFor="player-name">Editar mi nombre</label>
        <div className="name-row">
          <input id="player-name" value={props.name} onChange={(event) => props.onNameChange(event.target.value)} aria-invalid={Boolean(props.nameError)} aria-describedby={props.nameError ? 'name-error' : undefined} autoComplete="nickname" />
          <button className="secondary" disabled={props.busy} type="submit">{props.busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
        {props.nameError && <p className="field-error" id="name-error" role="alert">{props.nameError}</p>}
      </form>
      {props.activity && <p className="activity" role="status">{props.activity}</p>}
      {props.notice && <p className="alert" role="alert">{props.notice}</p>}
      <button ref={exitButton} className="danger-link" onClick={isHost ? props.onAskClose : props.onAskLeave}>
        {isHost ? 'Cerrar sala' : 'Salir de la sala'}
      </button>
    </section>
    {(props.confirmClose || props.confirmLeave) && <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="exit-title">
        <h2 id="exit-title">{isHost ? '¿Cerrar esta sala?' : '¿Salir de esta sala?'}</h2>
        <p>{isHost ? 'El código dejará de funcionar y las demás personas tendrán que salir.' : 'Tu plaza quedará libre. Para volver tendrás que entrar de nuevo.'}</p>
        <div className="modal-actions">
          <button className="secondary" autoFocus onClick={cancel} disabled={props.busy}>Cancelar</button>
          <button className="danger" onClick={isHost ? props.onClose : props.onLeave} disabled={props.busy}>
            {props.busy ? 'Confirmando…' : isHost ? 'Sí, cerrar sala' : 'Sí, salir'}
          </button>
        </div>
      </div>
    </div>}
  </main>;
}
