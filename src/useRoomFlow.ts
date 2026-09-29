import { useCallback, useEffect, useState } from 'react';
import type { CurrentRoomResponse, RoomView } from '../shared/contracts/room';
import { api, ApiError } from './api';

function roomPath(id: string) { return `/sala/${id}`; }
function isRoomPath() { return window.location.pathname.startsWith('/sala/'); }
function navigate(path: string) { window.history.replaceState(null, '', path); }
function message(error: unknown): string {
  return error instanceof Error ? error.message : 'La operación no se pudo completar.';
}

export function useRoomFlow() {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  const applyCurrent = useCallback((result: CurrentRoomResponse) => {
    if (result.room) {
      setRoom(result.room);
      setName(result.room.participant.name);
      navigate(roomPath(result.room.id));
    } else {
      setRoom(null);
      if (isRoomPath()) setNotice('La sala ya no está disponible. Puedes crear una nueva.');
      navigate('/');
    }
  }, []);

  async function refresh() {
    setLoading(true);
    setNotice('');
    try {
      applyCurrent(await api.current());
    } catch (error) {
      setNotice(message(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void api.current().then((result) => {
      if (active) applyCurrent(result);
    }).catch((error) => {
      if (active) setNotice(message(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [applyCurrent]);

  async function createRoom() {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      const result = await api.create();
      setRoom(result.room);
      setName(result.room.participant.name);
      navigate(roomPath(result.room.id));
    } catch (error) {
      setNotice(message(error));
      if (error instanceof ApiError && error.code === 'SESSION_REQUIRED') void refresh();
    } finally {
      setBusy(false);
    }
  }

  function editName(value: string) {
    setName(value);
    setNameError('');
  }

  async function saveName() {
    if (!room || busy) return;
    setNameError('');
    setBusy(true);
    try {
      const result = await api.rename(room.id, name);
      setRoom(result.room);
      setName(result.room.participant.name);
    } catch (error) {
      setNameError(message(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!room) return;
    setCopyMessage('');
    try {
      await navigator.clipboard.writeText(room.code);
      setCopyMessage('Código copiado');
    } catch {
      setCopyMessage('No se pudo copiar. Selecciona el código y cópialo manualmente.');
    }
  }

  async function closeRoom() {
    if (!room || busy) return;
    setBusy(true);
    setNotice('');
    try {
      await api.close(room.id);
      setRoom(null);
      setConfirmClose(false);
      navigate('/');
      setNotice('Sala cerrada. Puedes crear una nueva.');
    } catch (error) {
      setConfirmClose(false);
      setNotice(message(error));
      if (error instanceof ApiError && error.code === 'ROOM_NOT_AVAILABLE') {
        setRoom(null);
        navigate('/');
      }
    } finally {
      setBusy(false);
    }
  }

  return {
    room, loading, busy, notice, name, nameError, copyMessage, confirmClose,
    refresh, createRoom, editName, saveName, copyCode, closeRoom, setConfirmClose
  };
}
