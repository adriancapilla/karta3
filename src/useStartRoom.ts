import { useEffect, useRef, useState } from 'react';
import type { CurrentRoomResponse, WaitingRoomView } from '../shared/contracts/room';
import { api, ApiError } from './api';
import { sendStart } from './socket';

export function useStartRoom(room: WaitingRoomView, accept: (result: CurrentRoomResponse) => void) {
  const active = useRef(false);
  const inFlight = useRef(false);
  const requestId = useRef<string | null>(null);
  const acknowledgedFailure = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsRecovery, setNeedsRecovery] = useState(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  async function recover() {
    setBusy(true);
    try {
      const result = await api.current();
      if (!active.current) return;
      accept(result);
      setNeedsRecovery(false);
      if (result.room?.status === 'WAITING') {
        if (acknowledgedFailure.current) {
          requestId.current = null;
          setError(`${acknowledgedFailure.current} El servidor confirma que sigues en espera. Puedes intentarlo de nuevo.`);
          acknowledgedFailure.current = null;
        } else setError('El servidor devuelve la espera. Puedes reintentar el mismo envío de inicio.');
      }
    } catch {
      if (active.current) { setNeedsRecovery(true); setError('El resultado del inicio sigue sin confirmar. Recupera el estado antes de reintentarlo.'); }
    } finally { if (active.current) setBusy(false); }
  }

  async function start() {
    if (inFlight.current || needsRecovery) return;
    inFlight.current = true;
    requestId.current ??= crypto.randomUUID();
    setBusy(true); setError('');
    try {
      const result = await sendStart({ requestId: requestId.current, roomId: room.id });
      if (active.current) accept({ room: result.room });
    } catch (cause) {
      if (!active.current) return;
      if (cause instanceof ApiError && (cause.code === 'NETWORK_ERROR' || cause.code === 'INTERNAL_ERROR')) {
        acknowledgedFailure.current = cause.code === 'INTERNAL_ERROR' ? cause.message : null;
        setError('No se pudo confirmar el inicio. Recuperando el estado de la sala…');
        setNeedsRecovery(true);
        await recover();
      } else {
        requestId.current = null;
        acknowledgedFailure.current = null;
        setError(cause instanceof Error ? cause.message : 'No se pudo iniciar la partida.');
      }
    } finally { inFlight.current = false; if (active.current) setBusy(false); }
  }
  return { busy, error, needsRecovery, start, recover };
}
