import { useEffect, useRef, useState } from 'react';
import type { CancelGameRequest } from '../shared/contracts/game';
import type { CurrentRoomResponse, InitialGameRoomView, ResultsRoomView, RoomView } from '../shared/contracts/room';
import { api, ApiError } from './api';
import { sendGame } from './socket';

/** La intención pertenece a la partida mostrada, no a su turno; recuperar nunca la reenvía. */
export function useCancelGame(room: InitialGameRoomView, onRoom: (room: RoomView) => boolean, onCurrent: (result: CurrentRoomResponse) => void) {
  const context = `${room.id}:${room.game.id}`;
  const mountedContext = useRef<string | null>(null);
  const input = useRef<CancelGameRequest | null>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsRecovery, setNeedsRecovery] = useState(false);
  useEffect(() => { mountedContext.current = context; return () => { mountedContext.current = null; }; }, [context]);
  const relevant = () => mountedContext.current === context;

  async function recover() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      try {
        const result = await api.result(room.game.id);
        if (!relevant()) return;
        onRoom(result.room);
        return;
      } catch (cause) {
        if (!relevant()) return;
        if (!(cause instanceof ApiError && cause.code === 'RESULT_NOT_AVAILABLE')) throw cause;
      }
      const current = await api.current();
      if (!relevant()) return;
      onCurrent(current);
      if (current.room?.status === 'IN_GAME' && current.room.id === room.id && current.room.game.id === room.game.id) {
        setNeedsRecovery(false);
        setError('El servidor conserva la partida en curso. Puedes reintentar el mismo envío de cancelación.');
      }
    } catch {
      if (relevant()) { setNeedsRecovery(true); setError('No se pudo confirmar la cancelación. Recupera el estado de la partida'); }
    } finally { inFlight.current = false; if (relevant()) setBusy(false); }
  }

  async function cancel() {
    if (inFlight.current || needsRecovery) return;
    input.current ??= { requestId: crypto.randomUUID(), roomId: room.id, gameId: room.game.id };
    inFlight.current = true; setBusy(true); setError('');
    try {
      const result = await sendGame<{ room: ResultsRoomView }>('game:cancel', input.current);
      if (relevant()) onRoom(result.room);
    } catch (cause) {
      if (!relevant()) return;
      if (cause instanceof ApiError && ['NETWORK_ERROR', 'INTERNAL_ERROR', 'GAME_FINISHED'].includes(cause.code)) {
        setNeedsRecovery(true);
        setError(cause.code === 'GAME_FINISHED' ? 'La partida ya terminó. Recupera su resultado.' : 'No se pudo confirmar la cancelación. Recupera el estado de la partida');
      } else {
        input.current = null;
        setError(cause instanceof Error ? cause.message : 'No se pudo cancelar la partida.');
      }
    } finally { inFlight.current = false; if (relevant()) setBusy(false); }
  }
  return { busy, error, needsRecovery, cancel, recover };
}
