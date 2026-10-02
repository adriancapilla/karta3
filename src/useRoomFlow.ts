import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurrentRoomResponse, RoomClosedEvent, RoomLeftEvent, RoomStateEvent, RoomView } from '../shared/contracts/room';
import { api, ApiError } from './api';
import { send, socket, type RoomAck } from './socket';
import { acceptsRoom, automaticEndMessage } from './roomState';

function roomPath(id: string) { return `/sala/${id}`; }
function isRoomPath() { return window.location.pathname.startsWith('/sala/'); }
function navigate(path: string) { window.history.replaceState(null, '', path); }
function message(error: unknown): string { return error instanceof Error ? error.message : 'La operación no se pudo completar.'; }

export function useRoomFlow() {
  const [room, setRoom] = useState<RoomView | null>(null);
  const roomRef = useRef<RoomView | null>(null);
  const ended = useRef(new Set<string>());
  const closed = useRef(new Set<string>());
  const seenChanges = useRef(new Set<string>());
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
    navigate('/');
    setNotice(noticeText);
  }, []);

  const applyRoom = useCallback((incoming: RoomView): boolean => {
    const current = roomRef.current;
    if (!acceptsRoom(current, incoming, ended.current, closed.current)) return false;
    if (!current || !dirtyName.current) setName(incoming.participant.name);
    roomRef.current = incoming;
    setRoom(incoming);
    navigate(roomPath(incoming.id));
    setNotice('');
    return true;
  }, []);

  const applyCurrent = useCallback((result: CurrentRoomResponse) => {
    if (result.room) {
      applyRoom(result.room);
    } else {
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

  const showActivity = useCallback((text: string) => {
    window.clearTimeout(noticeTimer.current);
    setActivity(text);
    noticeTimer.current = window.setTimeout(() => setActivity(''), 5000);
  }, []);

  useEffect(() => {
    let active = true;
    const onState = (event: RoomStateEvent) => {
      if (!active) return;
      const accepted = applyRoom(event.room);
      if (accepted && event.change && !seenChanges.current.has(event.change.id)) {
        seenChanges.current.add(event.change.id);
        showActivity(event.change.kind === 'RECONNECTED' ? `${event.change.name} ha recuperado la conexión`
          : event.change.kind === 'PRESENCE_EXPIRED' ? `${event.change.name} no recuperó la conexión; su plaza ha quedado libre`
          : `${event.change.name} ha salido de la sala`);
      }
    };
    const onLeft = (event: RoomLeftEvent) => {
      ended.current.add(event.participantId);
      if (roomRef.current?.id === event.roomId && roomRef.current.participant.id === event.participantId) {
        clearRoom(event.reason === 'RECONNECT_TIMEOUT' ? automaticEndMessage(event.reason) : 'Has salido de la sala');
      }
    };
    const onClosed = (event: RoomClosedEvent) => {
      closed.current.add(event.roomId);
      if (roomRef.current?.id === event.roomId && event.revision > roomRef.current.revision) {
        clearRoom(event.reason !== 'HOST_CLOSED' ? automaticEndMessage(event.reason) : roomRef.current.participant.role === 'HOST'
          ? 'Sala cerrada. Puedes crear una nueva.' : 'El anfitrión ha cerrado la sala');
      }
    };
    const onConnect = () => {
      void send<CurrentRoomResponse>('room:resume', {}).then((result) => {
        if (!active) return;
        setConnected(true);
        // Una portada voluntaria conserva su aviso; una participación terminada recibe su motivo.
        if (result.room || result.ended || roomRef.current) applyCurrent(result);
      }).catch(() => {});
    };
    const onConnectError = () => {
      void api.current().then((result) => {
        if (!active) return;
        if (result.room || result.ended || roomRef.current) applyCurrent(result);
        socket.connect();
      }).catch(() => { if (active) setNotice('No se pudo recuperar la conexión. Inténtalo de nuevo.'); });
    };
    const onDisconnect = () => { if (active) setConnected(false); };
    socket.on('room:state', onState);
    socket.on('room:left', onLeft);
    socket.on('room:closed', onClosed);
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    void api.current().then((result) => {
      if (!active) return;
      applyCurrent(result);
      socket.connect();
    }).catch((error) => { if (active) setNotice(message(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.clearTimeout(noticeTimer.current);
      socket.off('room:state', onState);
      socket.off('room:left', onLeft);
      socket.off('room:closed', onClosed);
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [applyCurrent, applyRoom, clearRoom, showActivity]);

  const confirmExpiry = useCallback(() => {
    if (!socket.connected) return;
    void send<CurrentRoomResponse>('room:resume', {}).then(applyCurrent).catch(() => {});
  }, [applyCurrent]);

  async function refresh() {
    setLoading(true);
    setNotice('');
    try { applyCurrent(await api.current()); socket.connect(); }
    catch (error) { setNotice(message(error)); }
    finally { setLoading(false); }
  }

  async function createRoom() {
    if (busy) return;
    setBusy(true);
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

  return {
    room, loading, busy, joining, notice, activity, code, joinName, joinError, name, nameError, copyMessage, connected, confirmExpiry, applyRoom,
    confirmClose, confirmLeave, refresh, createRoom, joinRoom, editName, saveName, copyCode,
    closeRoom, leaveRoom, setConfirmClose, setConfirmLeave,
    setCode: (value: string) => { setCode(value); setJoinError(''); pendingJoin.current = null; },
    setJoinName: (value: string) => { setJoinName(value); setJoinError(''); pendingJoin.current = null; }
  };
}
