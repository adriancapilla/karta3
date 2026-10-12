import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurrentRoomResponse, LastResult, ResultsHomeEvent, ResultsRoomView, ReturnHomeRequest, RoomClosedEvent, RoomLeftEvent, RoomStateEvent, RoomView } from '../shared/contracts/room';
import { api, ApiError } from './api';
import { send, sendGame, socket, type RoomAck } from './socket';
import { acceptsRoom, automaticEndMessage } from './roomState';
import type { RoundResolvedEvent, TurnExpiredEvent } from '../shared/contracts/game';

function roomPath(id: string) { return `/sala/${id}`; }
function isRoomPath() { return window.location.pathname.startsWith('/sala/'); }
function navigate(path: string) { window.history.replaceState(null, '', path); }
function message(error: unknown): string { return error instanceof Error ? error.message : 'La operación no se pudo completar.'; }

export function useRoomFlow() {
  const [room, setRoom] = useState<RoomView | null>(null);
  const roomRef = useRef<RoomView | null>(null);
  const activeRoomRef = useRef<RoomView | null>(null);
  const explicitResult = useRef<string | null>(window.location.pathname.startsWith('/resultado/') ? decodeURIComponent(window.location.pathname.slice(11)) : null);
  const releasedRooms = useRef(new Set<string>());
  const seenHomes = useRef(new Set<string>());
  const [lastResult, setLastResult] = useState<LastResult | undefined>();
  const [resultError, setResultError] = useState<{ gameId: string; message: string } | null>(null);
  const pendingHome = useRef<ReturnHomeRequest | null>(null);
  const ended = useRef(new Set<string>());
  const closed = useRef(new Set<string>());
  const seenChanges = useRef(new Set<string>());
  const seenResolutions = useRef(new Set<string>());
  const seenTimeouts = useRef(new Set<string>());
  const timeoutNoticeTimer = useRef<number | undefined>(undefined);
  const [timeoutNotice, setTimeoutNotice] = useState('');
  const dirtyName = useRef(false);
  const pendingJoin = useRef<{ id: string; code: string; name: string } | null>(null);
  const pendingLeave = useRef<{ id: string; roomId: string; participantId: string } | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [notice, setNotice] = useState('');
  const [activity, setActivity] = useState('');
  const [code, setCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [connected, setConnected] = useState(false);

  const clearRoom = useCallback((noticeText: string) => {
    roomRef.current = null;
    setRoom(null);
    setConfirmClose(false);
    setConfirmLeave(false);
    setActivity('');
    setTimeoutNotice('');
    setResultError(null);
    navigate('/');
    setNotice(noticeText);
  }, []);

  const applyRoom = useCallback((incoming: RoomView): boolean => {
    if (releasedRooms.current.has(incoming.id)) return false;
    if (explicitResult.current) {
      if (incoming.id !== roomRef.current?.id && (!activeRoomRef.current || activeRoomRef.current.id === incoming.id)) activeRoomRef.current = incoming;
      return false;
    }
    const current = roomRef.current;
    if (!acceptsRoom(current, incoming, ended.current, closed.current)) return false;
    if (!current || !dirtyName.current) setName(incoming.participant.name);
    roomRef.current = incoming;
    const cancelled = incoming.status === 'RESULTS' && incoming.result.endReason === 'HOST_CANCELLED';
    activeRoomRef.current = cancelled ? null : incoming;
    if (cancelled) {
      explicitResult.current = incoming.result.gameId;
      setLastResult({ roomId: incoming.id, gameId: incoming.result.gameId, expiresAt: incoming.result.retention.expiresAt });
      window.clearTimeout(noticeTimer.current); window.clearTimeout(timeoutNoticeTimer.current);
      setActivity(''); setTimeoutNotice('');
    }
    setRoom(incoming);
    setResultError((error) => incoming.status === 'RESULTS' && error?.gameId === incoming.result.gameId ? error : null);
    navigate(incoming.status === 'RESULTS' ? `/resultado/${encodeURIComponent(incoming.result.gameId)}` : roomPath(incoming.id));
    setNotice('');
    return true;
  }, []);

  const applyCurrent = useCallback((result: CurrentRoomResponse, expectedRoomId?: string | null) => {
    const activeId = activeRoomRef.current?.id ?? null;
    if (expectedRoomId !== undefined && activeId !== expectedRoomId && (!result.room || result.room.id !== activeId)) return;
    if (result.room && (releasedRooms.current.has(result.room.id)
      || activeRoomRef.current?.id === result.room.id && !acceptsRoom(activeRoomRef.current, result.room, ended.current, closed.current))) return;
    activeRoomRef.current = result.room;
    setLastResult(result.lastResult);
    if (explicitResult.current) return;
    if (result.room) {
      if (roomRef.current && roomRef.current.id !== result.room.id) clearRoom(''); // recuperación autorizada de otra asociación vigente
      applyRoom(result.room);
    } else {
      const previous = roomRef.current;
      if (previous?.status === 'IN_GAME' && result.lastResult?.gameId === previous.game.id && !result.ended) {
        // Cancelar libera antes de emitir. Una pestaña desconectada recupera por roster, no por asociación.
        void api.result(previous.game.id).then((summary) => {
          if (activeRoomRef.current || roomRef.current?.id !== previous.id || roomRef.current.status !== 'IN_GAME'
            || roomRef.current.game.id !== previous.game.id || explicitResult.current) return;
          applyRoom(summary.room);
        }).catch((error) => {
          if (activeRoomRef.current || roomRef.current?.id !== previous.id || roomRef.current.status !== 'IN_GAME'
            || roomRef.current.game.id !== previous.game.id || explicitResult.current) return;
          clearRoom(error instanceof ApiError && error.code === 'RESULT_NOT_AVAILABLE' ? 'El resultado ya no está disponible'
            : 'No se pudo recuperar el resumen. Recupera la conexión para consultarlo.');
        });
        return;
      }
      if (result.ended) {
        if (roomRef.current && (roomRef.current.id !== result.ended.roomId
          || roomRef.current.participant.id !== result.ended.participantId)) return;
        ended.current.add(result.ended.participantId);
        if (result.ended.reason !== 'RECONNECT_TIMEOUT') closed.current.add(result.ended.roomId);
      } else if (roomRef.current) ended.current.add(roomRef.current.participant.id);
      clearRoom(result.ended ? automaticEndMessage(result.ended.reason)
        : isRoomPath() ? 'La sala ya no está disponible. Puedes crear una nueva.' : '');
    }
  }, [applyRoom, clearRoom]);

  const showResult = useCallback((result: ResultsRoomView) => {
    roomRef.current = result; setRoom(result); setResultError(null); setNotice('');
    if (result.result.endReason === 'HOST_CANCELLED') {
      window.clearTimeout(noticeTimer.current); window.clearTimeout(timeoutNoticeTimer.current);
      setActivity(''); setTimeoutNotice('');
    }
    navigate(`/resultado/${encodeURIComponent(result.result.gameId)}`);
  }, []);
  const openResult = useCallback(async (gameId: string) => {
    explicitResult.current = gameId; setLoading(true); setNotice('');
    roomRef.current = null; setRoom(null);
    try {
      const result = await api.result(gameId);
      if (explicitResult.current === gameId) showResult(result.room);
    }
    catch (error) {
      if (explicitResult.current !== gameId) return;
      // Una lectura explícita (también fallida) no permite que resume sustituya
      // el destino por la asociación activa de esta misma sesión.
      if (error instanceof ApiError && ['RESULT_NOT_AVAILABLE', 'SESSION_REQUIRED', 'FORBIDDEN'].includes(error.code)) clearRoom(error.code === 'FORBIDDEN' ? error.message : 'El resultado ya no está disponible');
      else { navigate(`/resultado/${encodeURIComponent(gameId)}`); setNotice('No se pudo leer el resultado. Reintenta la conexión.'); }
    } finally { setLoading(false); }
  }, [showResult, clearRoom]);

  const showActivity = useCallback((text: string) => {
    window.clearTimeout(noticeTimer.current);
    setActivity(text);
    noticeTimer.current = window.setTimeout(() => setActivity(''), 5000);
  }, []);

  useEffect(() => {
    let active = true;
    const onHome = (event: ResultsHomeEvent) => {
      if (!active || seenHomes.current.has(event.id)) return;
      if (roomRef.current && roomRef.current.id !== event.roomId && !explicitResult.current) return;
      const current = activeRoomRef.current;
      if (current && (current.id !== event.roomId || current.status !== 'RESULTS' || current.result.gameId !== event.gameId)) return;
      if (!current && (roomRef.current?.id !== event.roomId || releasedRooms.current.has(event.roomId))) return;
      seenHomes.current.add(event.id); releasedRooms.current.add(event.roomId); activeRoomRef.current = null; explicitResult.current = null;
      setLastResult(event.lastResult ?? undefined); pendingHome.current = null; clearRoom('');
    };
    const onResolved = (event: RoundResolvedEvent) => {
      const current = roomRef.current;
      if (!active || !current || current.status !== 'IN_GAME' || current.id !== event.roomId || current.game.id !== event.gameId
        || current.game.round.number !== event.result.roundNumber || seenResolutions.current.has(event.result.id)) return;
      seenResolutions.current.add(event.result.id);
      const name = (id: string) => {
        const person = current.participants.find((item) => item.id === id)!;
        const duplicates = current.participants.filter((item) => item.name === person.name);
        return `${person.name}${duplicates.length > 1 ? ` (${duplicates.findIndex((item) => item.id === id) + 1})` : ''}`;
      };
      const result = event.result;
      showActivity(result.kind === 'TIE_BREAK' ? `${name(result.winnerPlayerId)} ganó el desempate`
        : `Ronda ${result.roundNumber}: ganó ${name(result.winnerPlayerId)} · +${result.awardedCardCount} puntos${result.nextOpenerPlayerId ? ` · abre ${name(result.nextOpenerPlayerId)}` : ' · fin de la partida base'}`);
    };
    const onExpired = (event: TurnExpiredEvent) => {
      const current = roomRef.current;
      if (!active || !current || current.status !== 'IN_GAME' || current.id !== event.roomId || current.game.id !== event.gameId
        || current.game.round.number !== event.roundNumber || seenTimeouts.current.has(event.id)) return;
      const person = current.participants.find((item) => item.id === event.playerId);
      if (!person) return;
      const duplicates = current.participants.filter((item) => item.name === person.name);
      const name = `${person.name}${duplicates.length > 1 ? ` (${duplicates.findIndex((item) => item.id === person.id) + 1})` : ''}`;
      seenTimeouts.current.add(event.id);
      window.clearTimeout(timeoutNoticeTimer.current);
      setTimeoutNotice(`${name} agotó el tiempo; se jugó su carta más antigua${event.automatic ? ` · ${name} ha pasado a automático` : ''}`);
      timeoutNoticeTimer.current = window.setTimeout(() => setTimeoutNotice(''), 5000);
    };
    const onState = (event: RoomStateEvent) => {
      if (!active) return;
      const accepted = applyRoom(event.room);
      if (accepted && event.change && !seenChanges.current.has(event.change.id)) {
        seenChanges.current.add(event.change.id);
        showActivity(event.change.kind === 'RECONNECTED' ? `${event.change.name} ha recuperado la conexión`
          : event.change.kind === 'PRESENCE_EXPIRED' ? `${event.change.name} no recuperó la conexión; su plaza ha quedado libre`
          : event.change.kind === 'BOT_REMOVED' ? `${event.change.name} ha sido retirado; su plaza ha quedado libre`
          : `${event.change.name} ha salido de la sala`);
      }
    };
    const onLeft = (event: RoomLeftEvent) => {
      if (roomRef.current?.status !== 'WAITING' && roomRef.current?.id === event.roomId) return;
      ended.current.add(event.participantId);
      if (roomRef.current?.id === event.roomId && roomRef.current.participant.id === event.participantId) {
        clearRoom(event.reason === 'RECONNECT_TIMEOUT' ? automaticEndMessage(event.reason) : 'Has salido de la sala');
      }
    };
    const onClosed = (event: RoomClosedEvent) => {
      if (roomRef.current?.status !== 'WAITING' && roomRef.current?.id === event.roomId) return;
      closed.current.add(event.roomId);
      if (roomRef.current?.id === event.roomId && event.revision > roomRef.current.revision) {
        clearRoom(event.reason !== 'HOST_CLOSED' ? automaticEndMessage(event.reason) : roomRef.current.participant.role === 'HOST'
          ? 'Sala cerrada. Puedes crear una nueva.' : 'El anfitrión ha cerrado la sala');
      }
    };
    const onConnect = () => {
      const expectedRoomId = activeRoomRef.current?.id ?? null;
      void send<CurrentRoomResponse>('room:resume', {}).then((result) => {
        if (!active) return;
        setConnected(true);
        // Una portada voluntaria conserva su aviso; una participación terminada recibe su motivo.
        if (result.room || result.ended || roomRef.current || result.lastResult) applyCurrent(result, expectedRoomId);
      }).catch(() => {});
    };
    const onConnectError = () => {
      const expectedRoomId = activeRoomRef.current?.id ?? null;
      void api.current().then((result) => {
        if (!active) return;
        if (result.room || result.ended || roomRef.current || result.lastResult) applyCurrent(result, expectedRoomId);
        socket.connect();
      }).catch(() => { if (active) setNotice('No se pudo recuperar la conexión. Inténtalo de nuevo.'); });
    };
    const onDisconnect = () => { if (active) setConnected(false); };
    socket.on('room:state', onState);
    socket.on('game:round-resolved', onResolved);
    socket.on('game:turn-expired', onExpired);
    socket.on('results:home', onHome);
    socket.on('room:left', onLeft);
    socket.on('room:closed', onClosed);
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    const initialRoomId = activeRoomRef.current?.id ?? null;
    void api.current().then(async (result) => {
      if (!active) return;
      applyCurrent(result, initialRoomId);
      if (explicitResult.current) await openResult(explicitResult.current);
      if (!active) return;
      socket.connect();
    }).catch((error) => { if (active) setNotice(message(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.clearTimeout(noticeTimer.current);
      window.clearTimeout(timeoutNoticeTimer.current);
      socket.off('room:state', onState);
      socket.off('game:round-resolved', onResolved);
      socket.off('game:turn-expired', onExpired);
      socket.off('results:home', onHome);
      socket.off('room:left', onLeft);
      socket.off('room:closed', onClosed);
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [applyCurrent, applyRoom, clearRoom, showActivity, openResult]);

  const confirmExpiry = useCallback(() => {
    if (!socket.connected) return;
    const expectedRoomId = activeRoomRef.current?.id ?? null;
    void send<CurrentRoomResponse>('room:resume', {}).then((result) => applyCurrent(result, expectedRoomId)).catch(() => {});
  }, [applyCurrent]);

  async function refresh() {
    if (explicitResult.current && !roomRef.current) { await openResult(explicitResult.current); socket.connect(); return; }
    setLoading(true);
    setNotice('');
    const expectedRoomId = activeRoomRef.current?.id ?? null;
    try { applyCurrent(await api.current(), expectedRoomId); socket.connect(); }
    catch (error) { setNotice(message(error)); }
    finally { setLoading(false); }
  }

  async function createRoom() {
    if (busy) return;
    setBusy(true);
    explicitResult.current = null;
    setNotice('');
    try { applyRoom((await api.create()).room); }
    catch (error) {
      setNotice(message(error));
      if (error instanceof ApiError && error.code === 'SESSION_REQUIRED') void refresh();
    } finally { setBusy(false); }
  }

  async function joinRoom() {
    if (busy) return;
    setBusy(true);
    explicitResult.current = null;
    setJoining(true);
    setNotice('');
    setJoinError('');
    const pending = pendingJoin.current?.code === code && pendingJoin.current.name === joinName
      ? pendingJoin.current : { id: crypto.randomUUID(), code, name: joinName };
    pendingJoin.current = pending;
    try {
      const result = await send<RoomAck>('room:join', { requestId: pending.id, code: pending.code, name: pending.name });
      pendingJoin.current = null;
      applyRoom(result.room);
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 'NETWORK_ERROR')) pendingJoin.current = null;
      setJoinError(message(error));
      if (error instanceof ApiError && error.code === 'ALREADY_IN_ROOM') void refresh();
    } finally { setBusy(false); setJoining(false); }
  }

  function editName(value: string) { dirtyName.current = true; setName(value); setNameError(''); }

  async function saveName() {
    const current = roomRef.current;
    if (!current || busy) return;
    setNameError(''); setBusy(true);
    try {
      const result = await api.rename(current.id, name);
      dirtyName.current = false;
      applyRoom(result.room);
    } catch (error) { setNameError(message(error)); }
    finally { setBusy(false); }
  }

  async function copyCode() {
    const current = roomRef.current;
    if (!current) return;
    setCopyMessage('');
    try { await navigator.clipboard.writeText(current.code); setCopyMessage('Código copiado'); }
    catch { setCopyMessage('No se pudo copiar. Selecciona el código y cópialo manualmente.'); }
  }

  async function closeRoom() {
    const current = roomRef.current;
    if (!current || busy) return;
    setBusy(true); setNotice('');
    try { await api.close(current.id); closed.current.add(current.id); clearRoom('Sala cerrada. Puedes crear una nueva.'); }
    catch (error) {
      setConfirmClose(false);
      setNotice(message(error));
      if (error instanceof ApiError && error.code === 'ROOM_NOT_AVAILABLE') clearRoom('La sala ya no está disponible. Puedes crear una nueva.');
    } finally { setBusy(false); }
  }

  async function leaveRoom() {
    const current = roomRef.current;
    if (!current || busy) return;
    setBusy(true); setNotice('');
    const pending = pendingLeave.current?.roomId === current.id && pendingLeave.current.participantId === current.participant.id
      ? pendingLeave.current : { id: crypto.randomUUID(), roomId: current.id, participantId: current.participant.id };
    pendingLeave.current = pending;
    try {
      await send('room:leave', { requestId: pending.id, roomId: pending.roomId, participantId: pending.participantId });
      ended.current.add(pending.participantId);
      pendingLeave.current = null;
      clearRoom('Has salido de la sala');
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 'NETWORK_ERROR')) pendingLeave.current = null;
      setConfirmLeave(false); setNotice(message(error));
    }
    finally { setBusy(false); }
  }

  async function returnHome() {
    const current = roomRef.current;
    if (!current || current.status !== 'RESULTS' || busy) return;
    setBusy(true); setResultError(null);
    const input = pendingHome.current?.gameId === current.result.gameId ? pendingHome.current
      : { requestId: crypto.randomUUID(), roomId: current.id, gameId: current.result.gameId };
    pendingHome.current = input;
    const isCurrentResult = () => roomRef.current?.id === current.id && roomRef.current.status === 'RESULTS'
      && roomRef.current.result.gameId === input.gameId;
    try {
      const result = await sendGame<CurrentRoomResponse>('results:return-home', input);
      if (!isCurrentResult() || activeRoomRef.current && activeRoomRef.current.id !== current.id) {
        if (pendingHome.current === input) pendingHome.current = null;
        return; // una confirmación anterior no limpia la nueva sala
      }
      explicitResult.current = null; releasedRooms.current.add(current.id); pendingHome.current = null;
      clearRoom(''); applyCurrent(result, current.id);
    } catch (error) {
      if (!isCurrentResult()) return;
      setResultError({ gameId: input.gameId, message: message(error) });
      try {
        const expectedRoomId = activeRoomRef.current?.id ?? null;
        const result = await api.current();
        if (!isCurrentResult()) return;
        if (result.room?.id !== current.id || error instanceof ApiError && error.code === 'RESULT_NOT_AVAILABLE') {
          if (activeRoomRef.current?.id !== expectedRoomId && result.room?.id !== activeRoomRef.current?.id) return;
          explicitResult.current = null; releasedRooms.current.add(current.id); pendingHome.current = null;
          clearRoom(''); applyCurrent(result, expectedRoomId);
        }
      } catch {
        if (isCurrentResult()) setResultError({ gameId: input.gameId, message: 'No se pudo confirmar el retorno. Recupera la conexión antes de reintentar.' });
      }
    } finally {
      if (!isCurrentResult() && pendingHome.current === input) pendingHome.current = null;
      setBusy(false);
    }
  }

  return {
    room, loading, busy, joining, notice, activity: [activity, timeoutNotice].filter(Boolean).join(' · '), code, joinName, joinError, name, nameError, copyMessage, connected, confirmExpiry, applyRoom, applyCurrent,
    lastResult, resultError: room?.status === 'RESULTS' && resultError?.gameId === room.result.gameId ? resultError.message : '', openResult, returnHome,
    confirmClose, confirmLeave, refresh, createRoom, joinRoom, editName, saveName, copyCode,
    closeRoom, leaveRoom, setConfirmClose, setConfirmLeave,
    setCode: (value: string) => { setCode(value); setJoinError(''); pendingJoin.current = null; },
    setJoinName: (value: string) => { setJoinName(value); setJoinError(''); pendingJoin.current = null; }
  };
}
