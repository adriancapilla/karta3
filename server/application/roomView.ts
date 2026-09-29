import type { RoomView } from '../../shared/contracts/room.js';
import type { Room } from './room.js';

export function toRoomView(room: Room): RoomView {
  if (room.status !== 'WAITING') throw new Error('No se proyecta una sala cerrada.');
  return {
    id: room.id,
    code: room.code,
    status: 'WAITING',
    participant: { id: room.participantId, name: room.name, role: 'HOST', isPlayer: true },
    settings: room.settings
  };
}
