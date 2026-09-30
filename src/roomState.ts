import type { RoomView } from '../shared/contracts/room';

export function acceptsRoom(current: RoomView | null, incoming: RoomView, ended: ReadonlySet<string>, closed: ReadonlySet<string>): boolean {
  if (ended.has(incoming.participant.id) || closed.has(incoming.id)) return false;
  return !current || (current.id === incoming.id
    && current.participant.id === incoming.participant.id
    && current.revision <= incoming.revision);
}
