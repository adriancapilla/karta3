import { useRef, useState } from 'react';
import type { CurrentRoomResponse, InitialGameRoomView, RoomView } from '../shared/contracts/room';
import type { Direction, OpeningDirectionRequest, PlayCardRequest } from '../shared/contracts/game';
import { api, ApiError } from './api';
import { sendGame, type RoomAck } from './socket';

export function gameSelectionContext(room: InitialGameRoomView): string {
  return `${room.id}:${room.game.id}:${room.game.round.number}:${room.game.interaction.turn?.id ?? 'review'}:${room.participant.id}`;
}

export function useGameActions(room: InitialGameRoomView, connected: boolean, onRoom: (room: RoomView) => boolean, onCurrent: (result: CurrentRoomResponse) => void) {
  const key = gameSelectionContext(room);
  const [selection, setSelection] = useState<{ key: string; cardId: string } | null>(null);
  const [pending, setPending] = useState<{ event: string; payload: PlayCardRequest | OpeningDirectionRequest; recovered: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [errorState, setErrorState] = useState<{ key: string; text: string } | null>(null);
  const error = errorState?.key === key ? errorState.text : '';
  const setError = (text: string) => setErrorState({ key, text });
  const activePending = pending && pending.payload.roomId === room.id && pending.payload.gameId === room.game.id
    && pending.payload.roundNumber === room.game.round.number && pending.payload.turnId === room.game.interaction.turn?.id ? pending : null;
  const actor = room.game.interaction.stage === 'AWAITING_PLAY' && room.game.interaction.turn?.playerId === room.participant.id;
  const selectedCard = actor && selection?.key === key && room.game.hand.some((card) => card.id === selection.cardId) ? selection.cardId : null;
  const opening = actor && room.game.interaction.openingSelection !== null;
  const enabled = actor && connected && !busy && !activePending;

  async function recover() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      const result = await api.current();
      onCurrent(result);
      if (result.room?.status !== 'IN_GAME' || gameSelectionContext(result.room) !== key) { setPending(null); setSelection(null); }
      else setPending((value) => value ? { ...value, recovered: true } : null);
    } catch { setError('No se pudo recuperar la mesa. La aceptación sigue sin confirmar.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function transmit(event: string, payload: PlayCardRequest | OpeningDirectionRequest) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { const result = await sendGame<RoomAck>(event, payload); onRoom(result.room); setPending(null); if (event === 'game:play') setSelection(null); }
    catch (cause) {
      const uncertain = cause instanceof ApiError && ['NETWORK_ERROR', 'INTERNAL_ERROR'].includes(cause.code);
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la acción.');
      setPending(uncertain ? { event, payload, recovered: false } : null);
      // Solo lectura. Un resultado incierto mantiene el ID; nunca se retransmite aquí.
      try {
        const result = await api.current();
        onCurrent(result);
        if (result.room?.status !== 'IN_GAME' || gameSelectionContext(result.room) !== key) { setPending(null); setSelection(null); }
        else if (uncertain) setPending({ event, payload, recovered: true });
      } catch { if (uncertain) setError('No se pudo confirmar la acción ni recuperar la mesa. Recupera antes de reintentar.'); }
    } finally { inFlight.current = false; setBusy(false); }
  }

  function context() {
    return { requestId: crypto.randomUUID(), roomId: room.id, gameId: room.game.id, roundNumber: room.game.round.number, turnId: room.game.interaction.turn!.id };
  }
  function chooseCard(cardId: string) {
    if (!enabled) return;
    const direction = room.game.interaction.openingSelection?.direction ?? null;
    if (opening && direction === null) { setSelection({ key, cardId }); setError(''); return; }
    void transmit('game:play', { ...context(), cardId, direction: opening ? direction : null });
  }
  function chooseDirection(direction: Direction) {
    if (!enabled || !opening) return;
    if (selectedCard) void transmit('game:play', { ...context(), cardId: selectedCard, direction });
    else void transmit('game:opening-direction', { ...context(), direction });
  }
  return { enabled, opening, selectedCard, busy, error, pending: activePending, chooseCard, chooseDirection, recover,
    retry: () => { if (activePending?.recovered && connected) void transmit(activePending.event, activePending.payload); } };
}
