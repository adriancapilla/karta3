import { useEffect, useRef, useState } from 'react';
import type { CurrentRoomResponse, RoomView, WaitingRoomView } from '../shared/contracts/room';
import { suffixes } from './participantNames';
import { useBotActions } from './useBotActions';

function focusAvailable(button: HTMLButtonElement | null | undefined, heading: HTMLHeadingElement | null) {
  (button?.isConnected && !button.disabled ? button : heading)?.focus();
}
export function WaitingPlayers({ room, connected, onRoom, onCurrent, onPendingChange }: {
  room: WaitingRoomView; connected: boolean; onRoom: (room: RoomView) => boolean; onPendingChange: (pending: boolean) => void;
  onCurrent: (response: CurrentRoomResponse) => void;
}) {
  const bots = useBotActions(room.id, onRoom, onCurrent); const host = room.participant.role === 'HOST';
  const add = useRef<HTMLButtonElement>(null); const dialog = useRef<HTMLDialogElement>(null); const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [editing, setEditing] = useState<{ id: string; name: string; trigger: HTMLButtonElement } | null>(null);
  const [draft, setDraft] = useState('');
  const focusedRow = useRef('');
  useEffect(() => {
    if (focusedRow.current && !room.participants.some((person) => `participant-${person.id}` === focusedRow.current)
      && document.activeElement === document.body) focusAvailable(add.current, heading.current);
  }, [room.participants]);
  useEffect(() => onPendingChange(bots.pending), [bots.pending, onPendingChange]);
  const target = room.participants.find((p) => p.id === editing?.id && p.kind === 'BOT');
  const renameKey = editing ? `${editing.id}:RENAME` : '';
  const sendingName = bots.attempts[renameKey]?.state === 'SENDING';
  const close = () => { dialog.current?.close(); focusAvailable(editing?.trigger.isConnected ? editing.trigger : add.current, heading.current); setEditing(null); };
  useEffect(() => { if (editing && dialog.current && !dialog.current.open) { dialog.current.showModal(); input.current?.focus(); } }, [editing]);
  useEffect(() => {
    if (editing && !target) {
      dialog.current?.close(); focusAvailable(add.current, heading.current);
    }
  }, [editing, target]);
  const labels = suffixes(room); const players = room.participants.filter((p) => p.isPlayer); const observer = room.participants.find((p) => !p.isPlayer);
  const name = (person: typeof room.participants[number]) => `${person.name}${labels.has(person.id) ? ` (${labels.get(person.id)})` : ''}`;
  const remove = async (id: string) => {
    const focused = document.activeElement; const row = document.getElementById(`participant-${id}`);
    const moveFocus = !!row?.contains(focused);
    const next = row?.nextElementSibling?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? row?.previousElementSibling?.querySelector<HTMLButtonElement>('button:not(:disabled)');
    if (await bots.execute({ type: 'REMOVE', botId: id }) && moveFocus) focusAvailable(next?.isConnected ? next : add.current, heading.current);
  };
  return <section aria-labelledby="players-heading" onFocusCapture={(event) => { focusedRow.current = (event.target as Element).closest('.participant')?.id ?? ''; }}>
    <h2 ref={heading} id="players-heading" tabIndex={-1}>Jugadores</h2><p className="occupancy">{players.length} de 5 jugadores</p>
    <ol className="participant-list">{players.map((person) => <li className="participant" id={`participant-${person.id}`} key={person.id}>
      <strong>{name(person)}</strong><span className="participant-badges">
        {person.id === room.participant.id && <span className="badge">Tú</span>}{person.role === 'HOST' && <span className="badge">Anfitrión</span>}
        {person.presence === 'RECONNECTING' && <span className="badge reconnecting">Reconectando</span>}
        {person.kind === 'BOT' && <span className="badge">Bot · {person.botDifficulty === 'EASY' ? 'Fácil' : 'Difícil'}</span>}
      </span>
      {host && person.kind === 'BOT' && <div className="bot-controls">
        <label>Nivel de {name(person)}<select aria-label={`Nivel de ${name(person)}`} value={person.botDifficulty}
          disabled={!connected || !!bots.attempts[`${person.id}:DIFFICULTY`]}
          onChange={(event) => void bots.execute({ type: 'DIFFICULTY', botId: person.id, difficulty: event.target.value as 'EASY' | 'HARD' })}>
          <option value="EASY">Fácil</option><option value="HARD">Difícil</option></select></label>
        {bots.attempts[`${person.id}:DIFFICULTY`]?.state === 'SENDING' && <span role="status">Aplicando…</span>}
        {bots.errors[`${person.id}:DIFFICULTY`] && <p role="alert" className="field-error">{bots.errors[`${person.id}:DIFFICULTY`]}</p>}
        <button className="secondary" disabled={!connected || !!bots.attempts[`${person.id}:RENAME`]} onClick={(event) => { setEditing({ id: person.id, name: person.name, trigger: event.currentTarget }); setDraft(person.name); }}>Cambiar nombre</button>
        <button className="danger-link" disabled={!connected || !!bots.attempts[`${person.id}:REMOVE`]} onClick={() => void remove(person.id)}>{bots.attempts[`${person.id}:REMOVE`]?.state === 'SENDING' ? 'Retirando…' : 'Retirar bot'}</button>
        {bots.errors[`${person.id}:REMOVE`] && <p role="alert" className="field-error">{bots.errors[`${person.id}:REMOVE`]}</p>}
      </div>}
    </li>)}</ol>
    {observer && <div className="observer-line"><strong>{name(observer)}</strong><span>Anfitrión · Observador</span><span className="participant-badges">
      {observer.id === room.participant.id && <span className="badge">Tú</span>}{observer.presence === 'RECONNECTING' && <span className="badge reconnecting">Reconectando</span>}
    </span></div>}
    {host && <><button ref={add} className="secondary" disabled={!connected || players.length >= 5 || !!bots.attempts.ADD} onClick={() => void bots.execute({ type: 'ADD' })}>{bots.attempts.ADD?.state === 'SENDING' ? 'Añadiendo…' : 'Añadir bot'}</button>
      {players.length >= 5 && <p role="status">No quedan plazas para añadir un bot</p>}{bots.errors.ADD && <p role="alert" className="field-error">{bots.errors.ADD}</p>}
      {Object.entries(bots.attempts).filter(([, attempt]) => attempt.state !== 'SENDING').map(([key, attempt]) => <div key={key} className="alert">
        <p role="alert">{attempt.message}</p><button className="secondary" disabled={!connected} onClick={() => {
          if (attempt.state === 'RECOVERED') void bots.retry(key).then((accepted) => { if (accepted && editing?.id === ('botId' in attempt.operation ? attempt.operation.botId : null) && attempt.operation.type === 'RENAME') close(); });
          else void bots.recover(key);
        }}>{attempt.state === 'RECOVERED' ? 'Confirmar envío original' : 'Recuperar estado de la sala'}</button>
      </div>)}
    </>}
    {editing && !target && <p role="status">Ese bot ya no está en la espera; el borrador no se aplicó a otro participante.</p>}
    {editing && target && <dialog ref={dialog} className="bot-name-dialog" aria-labelledby="bot-name-title" onCancel={(event) => { event.preventDefault(); if (!sendingName) close(); }}>
      <form onSubmit={(event) => { event.preventDefault(); void bots.execute({ type: 'RENAME', botId: editing.id, name: draft }).then((accepted) => { if (accepted) close(); }); }}>
        <h2 id="bot-name-title">Cambiar nombre del bot</h2><label htmlFor="bot-name">Nombre del bot</label>
        <input ref={input} id="bot-name" value={draft} disabled={sendingName || !!bots.attempts[renameKey]} onChange={(event) => setDraft(event.target.value)} aria-describedby="bot-name-error" />
        {target.name !== editing.name && <p role="status">Nombre aceptado vigente: {target.name}. Se conserva tu borrador.</p>}
        <p id="bot-name-error" role="alert" className="field-error">{bots.errors[renameKey] || bots.attempts[renameKey]?.message}</p>
        <div className="modal-actions"><button type="button" className="secondary" disabled={sendingName} onClick={close}>{bots.attempts[renameKey] ? 'Cerrar diálogo' : 'Cancelar'}</button>
          <button className="primary" disabled={!connected || !!bots.attempts[renameKey]} type="submit">{sendingName ? 'Guardando…' : 'Aceptar'}</button>
          <button type="button" className="text-button" disabled={sendingName} onClick={close}>Cerrar</button></div>
      </form>
    </dialog>}
  </section>;
}
