import type { CurrentRoomResponse, WaitingRoomView } from '../shared/contracts/room';
import { useStartRoom } from './useStartRoom';

export function StartRoomControl({ room, connected, pending, onCurrent }: {
  room: WaitingRoomView; connected: boolean; pending: boolean; onCurrent: (result: CurrentRoomResponse) => void;
}) {
  const action = useStartRoom(room, onCurrent);
  const reason = !connected ? 'Recupera la conexión para iniciar.' : pending ? 'Espera la confirmación de tus cambios de configuración.'
    : !room.selectedDeck ? 'Selecciona una baraja para iniciar.' : room.participants.filter((person) => person.isPlayer).length < 2
      ? 'Se necesitan al menos dos jugadores humanos.' : room.participants.some((person) => person.presence !== 'CONNECTED')
        ? 'Todos los participantes deben estar conectados, también el anfitrión observador.' : '';
  return <section className="start-room" aria-label="Inicio de partida">
    <button className="primary" disabled={Boolean(reason) || action.busy || action.needsRecovery}
      aria-describedby="start-reason" onClick={() => void action.start()}>{action.busy ? 'Iniciando partida…' : 'Iniciar partida'}</button>
    <p id="start-reason" role="status">{reason}</p>
    {action.error && <p className="alert" role="alert">{action.error}</p>}
    {action.needsRecovery && <button className="secondary" disabled={action.busy} onClick={() => void action.recover()}>Recuperar estado</button>}
  </section>;
}
