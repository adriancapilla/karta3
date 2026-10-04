import type { RoomChange, RoomClosedEvent, RoomView } from '../../shared/contracts/room.js';
import type { RoomChanges, RoomRepository } from './ports.js';
import type { Room } from './room.js';
import { displayName, toRoomView } from './roomView.js';
import type { WaitingLifecycle } from './waitingLifecycle.js';

/** Coordinación por fase: el ciclo de espera no gobierna presencia ni plazos de Game. */
export class RoomCoordinator {
  private stopped = false;
  constructor(private readonly repository: RoomRepository, private readonly waiting: WaitingLifecycle, private readonly changes: RoomChanges) {}
  get clock() { return this.waiting.clock; }
  get presence() { return this.waiting.presence; }
  get ends() { return this.waiting.ends; }
  prepare() { this.waiting.prepare(); }
  view(room: Room, sessionId: string): RoomView { return toRoomView(room, sessionId, this.clock.now().unix); }
  publish(room: Room, change?: RoomChange) {
    if (this.stopped) return;
    if (room.status === 'WAITING') this.waiting.publish(room, change);
    else {
      this.waiting.cancelRoom(room.id);
      this.changes.updated(room.memberSessions.map((sessionId) => ({ sessionId, room: this.view(room, sessionId) })), change);
    }
  }
  presenceChanged(sessionId: string) {
    if (this.stopped) return;
    this.prepare();
    const room = this.repository.findActiveBySession(sessionId);
    if (room?.status !== 'IN_GAME') { this.waiting.presenceChanged(sessionId); return; }
    const result = room.changeGamePresence(sessionId, this.presence.isConnected(sessionId));
    if (!result.changed) return;
    this.repository.save(room);
    const person = room.participantFor(sessionId)!;
    this.publish(room, result.recovered ? { id: `${room.id}:${room.revision}`, kind: 'RECONNECTED', participantId: person.id, name: displayName(room, person.id) } : undefined);
  }
  left(sessionId: string, roomId: string, participantId: string) { this.waiting.left(sessionId, roomId, participantId); }
  close(room: Room, reason: RoomClosedEvent['reason']) { this.waiting.close(room, reason); }
  dispose() { this.stopped = true; this.waiting.dispose(); }
}
