import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type RoomView } from './api';
import './style.css';

function roomPath(id: string) { return `/sala/${id}`; }
function isRoomPath() { return window.location.pathname.startsWith('/sala/'); }
function navigate(path: string) { window.history.replaceState(null, '', path); }

export default function App() {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  async function refresh() {
    setLoading(true);
    setNotice('');
    try {
      const result = await api.current();
      if (result.room) {
        setRoom(result.room);
        setName(result.room.participant.name);
        navigate(roomPath(result.room.id));
      } else {
        setRoom(null);
        if (isRoomPath()) setNotice('La sala ya no está disponible. Puedes crear una nueva.');
        navigate('/');
      }
    } catch (error) {
      setNotice(message(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void api.current().then((result) => {
      if (!active) return;
      if (result.room) {
        setRoom(result.room);
        setName(result.room.participant.name);
        navigate(roomPath(result.room.id));
      } else {
        if (isRoomPath()) setNotice('La sala ya no está disponible. Puedes crear una nueva.');
        navigate('/');
      }
    }).catch((error) => {
      if (active) setNotice(message(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

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

  async function saveName(event: FormEvent) {
    event.preventDefault();
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

  if (loading) return <main className="shell"><p role="status">Cargando tu sala…</p></main>;
  if (!room) return <main className="shell"><header><span className="brand">KARTA<span>3</span></span></header><section className="card home"><p className="eyebrow">Juega en compañía</p><h1>Crea una sala</h1><p>Prepara el espacio para compartir una partida de KARTA3.</p>{notice && <p className="alert" role="alert">{notice}</p>}<button className="primary" disabled={busy} onClick={() => void createRoom()}>{busy ? 'Creando sala…' : 'Crear sala'}</button>{notice && <button className="text-button" onClick={() => void refresh()}>Reintentar conexión</button>}</section></main>;

  return <main className="shell"><header><span className="brand">KARTA<span>3</span></span><span className="top-label">Sala de espera</span></header><section className="card room"><div className="status"><span className="status-dot" />Esperando participantes</div><h1>Tu sala está lista</h1><p>Comparte este código cuando la entrada de participantes esté disponible.</p><div className="code-panel"><span className="field-label">Código de sala</span><strong className="code" aria-label={`Código de sala ${room.code}`} tabIndex={0}>{room.code}</strong><button className="secondary" onClick={() => void copyCode()}>Copiar código</button><p className="copy-message" role="status">{copyMessage}</p></div><div className="participant"><div><span className="field-label">Participante</span><strong>{room.participant.name}</strong></div><span className="badge">Anfitrión</span></div><form onSubmit={(event) => void saveName(event)}><label htmlFor="player-name">Editar mi nombre</label><div className="name-row"><input id="player-name" value={name} onChange={(event) => { setName(event.target.value); setNameError(''); }} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'name-error' : undefined} autoComplete="nickname" /><button className="secondary" disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar'}</button></div>{nameError && <p className="field-error" id="name-error" role="alert">{nameError}</p>}</form>{notice && <p className="alert" role="alert">{notice}</p>}<button className="danger-link" onClick={() => setConfirmClose(true)}>Cerrar sala</button></section>{confirmClose && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="close-title"><h2 id="close-title">¿Cerrar esta sala?</h2><p>El código dejará de funcionar y no podrás recuperar esta espera.</p><div className="modal-actions"><button className="secondary" onClick={() => setConfirmClose(false)} disabled={busy}>Cancelar</button><button className="danger" onClick={() => void closeRoom()} disabled={busy}>{busy ? 'Cerrando…' : 'Sí, cerrar sala'}</button></div></div></div>}</main>;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'La operación no se pudo completar.';
}
