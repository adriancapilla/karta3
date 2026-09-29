import type { FormEvent } from 'react';
import type { RoomView } from '../shared/contracts/room';

export function HomeScreen(props: { busy: boolean; notice: string; onCreate: () => void; onRefresh: () => void }) {
  return <main className="shell">
    <header><span className="brand">KARTA<span>3</span></span></header>
    <section className="card home">
      <p className="eyebrow">Juega en compañía</p>
      <h1>Crea una sala</h1>
      <p>Prepara el espacio para compartir una partida de KARTA3.</p>
      {props.notice && <p className="alert" role="alert">{props.notice}</p>}
      <button className="primary" disabled={props.busy} onClick={props.onCreate}>{props.busy ? 'Creando sala…' : 'Crear sala'}</button>
      {props.notice && <button className="text-button" onClick={props.onRefresh}>Reintentar conexión</button>}
    </section>
  </main>;
}

export function WaitingScreen(props: {
  room: RoomView;
  busy: boolean;
  notice: string;
  name: string;
  nameError: string;
  copyMessage: string;
  confirmClose: boolean;
  onNameChange: (value: string) => void;
  onSaveName: () => void;
  onCopyCode: () => void;
  onAskClose: () => void;
  onCancelClose: () => void;
  onClose: () => void;
}) {
  const submitName = (event: FormEvent) => { event.preventDefault(); props.onSaveName(); };
  return <main className="shell">
    <header><span className="brand">KARTA<span>3</span></span><span className="top-label">Sala de espera</span></header>
    <section className="card room">
      <div className="status"><span className="status-dot" />Esperando participantes</div>
      <h1>Tu sala está lista</h1>
      <p>Comparte este código cuando la entrada de participantes esté disponible.</p>
      <div className="code-panel">
        <span className="field-label">Código de sala</span>
        <strong className="code" aria-label={`Código de sala ${props.room.code}`} tabIndex={0}>{props.room.code}</strong>
        <button className="secondary" onClick={props.onCopyCode}>Copiar código</button>
        <p className="copy-message" role="status">{props.copyMessage}</p>
      </div>
      <div className="participant">
        <div><span className="field-label">Participante</span><strong>{props.room.participant.name}</strong></div>
        <span className="badge">Anfitrión</span>
      </div>
      <form onSubmit={submitName}>
        <label htmlFor="player-name">Editar mi nombre</label>
        <div className="name-row">
          <input id="player-name" value={props.name} onChange={(event) => props.onNameChange(event.target.value)} aria-invalid={Boolean(props.nameError)} aria-describedby={props.nameError ? 'name-error' : undefined} autoComplete="nickname" />
          <button className="secondary" disabled={props.busy} type="submit">{props.busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
        {props.nameError && <p className="field-error" id="name-error" role="alert">{props.nameError}</p>}
      </form>
      {props.notice && <p className="alert" role="alert">{props.notice}</p>}
      <button className="danger-link" onClick={props.onAskClose}>Cerrar sala</button>
    </section>
    {props.confirmClose && <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="close-title">
        <h2 id="close-title">¿Cerrar esta sala?</h2>
        <p>El código dejará de funcionar y no podrás recuperar esta espera.</p>
        <div className="modal-actions">
          <button className="secondary" onClick={props.onCancelClose} disabled={props.busy}>Cancelar</button>
          <button className="danger" onClick={props.onClose} disabled={props.busy}>{props.busy ? 'Cerrando…' : 'Sí, cerrar sala'}</button>
        </div>
      </div>
    </div>}
  </main>;
}
