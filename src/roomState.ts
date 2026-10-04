import type { AutomaticEndReason, RoomView } from '../shared/contracts/room';

export function automaticEndMessage(reason: AutomaticEndReason): string {
  if (reason === 'RECONNECT_TIMEOUT') return 'Tu plaza se liberó porque no recuperaste la conexión a tiempo. Puedes entrar de nuevo si hay sitio';
  if (reason === 'HOST_DISCONNECTED') return 'La sala se cerró porque el anfitrión no recuperó la conexión';
  return 'La sala se cerró por inactividad';
}

export function countdownSeconds(expiresAt: number, serverNow: number, elapsed: number): number {
  return Math.max(0, Math.ceil((expiresAt - serverNow - elapsed) / 1000));
}

export function acceptsRoom(current: RoomView | null, incoming: RoomView, ended: ReadonlySet<string>, closed: ReadonlySet<string>): boolean {
  if (ended.has(incoming.participant.id) || closed.has(incoming.id)) return false;
  const phase = { WAITING: 0, IN_GAME: 1, RESULTS: 2 };
  if (current && phase[incoming.status] < phase[current.status]) return false;
  return !current || (current.id === incoming.id
    && current.participant.id === incoming.participant.id
    && current.revision <= incoming.revision);
}
