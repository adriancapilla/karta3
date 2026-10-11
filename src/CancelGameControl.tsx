import { useEffect, useRef, useState } from 'react';
import type { CurrentRoomResponse, InitialGameRoomView, RoomView } from '../shared/contracts/room';
import { useCancelGame } from './useCancelGame';

export function CancelGameControl({ room, connected, onRoom, onCurrent }: {
  room: InitialGameRoomView; connected: boolean; onRoom: (room: RoomView) => boolean; onCurrent: (result: CurrentRoomResponse) => void;
}) {
  const action = useCancelGame(room, onRoom, onCurrent);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const keepPlaying = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) { dialog.current?.showModal(); keepPlaying.current?.focus(); } }, [open]);
  const close = () => { dialog.current?.close(); setOpen(false); if (trigger.current?.isConnected) trigger.current.focus(); };
  return <>
    <button ref={trigger} className="secondary cancel-game-button" disabled={action.busy || !connected} onClick={() => setOpen(true)}>Cancelar partida</button>
    {open && <dialog ref={dialog} className="card-details-dialog cancel-game-dialog" aria-labelledby="cancel-game-title" aria-describedby="cancel-game-description"
      onCancel={(event) => { event.preventDefault(); if (!action.busy) close(); }}>
      <h2 id="cancel-game-title">¿Cancelar la partida para todos?</h2>
      <p id="cancel-game-description">La partida terminará inmediatamente. Todos podrán consultar el resumen y crear o unirse a otra mesa.</p>
      {!connected && <p role="status">Sin conexión: no se envía la cancelación.</p>}
      {action.error && <p className="field-error" role="alert">{action.error}</p>}
      {action.needsRecovery && <button className="secondary" disabled={action.busy || !connected} onClick={() => void action.recover()}>Recuperar estado de la partida</button>}
      <div className="cancel-game-actions"><button ref={keepPlaying} className="secondary" disabled={action.busy} onClick={close}>Seguir jugando</button>
        <button className="danger" disabled={action.busy || !connected || action.needsRecovery} onClick={() => void action.cancel()}>{action.busy ? 'Cancelando…' : 'Cancelar partida'}</button></div>
    </dialog>}
  </>;
}
