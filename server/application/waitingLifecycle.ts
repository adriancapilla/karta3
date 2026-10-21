import type { RoomChange, RoomClosedEvent, RoomView } from '../../shared/contracts/room.js';
import type { Clock, ParticipationEnds, RoomChanges, RoomRepository, Scheduler, SessionPresence } from './ports.js';
import type { Room, WaitingDeadline } from './room.js';
import { displayName, toRoomView } from './roomView.js';
import { disabledStatistics, type StatisticsRecorder } from './statistics/recording.js';

type Scheduled = { deadline: WaitingDeadline; cancel: () => void };
const key = (deadline: WaitingDeadline) => `${deadline.kind}:${deadline.participantId ?? ''}:${deadline.generation}`;

export class WaitingLifecycle {
  private readonly tasks = new Map<string, Map<string, Scheduled>>();
  private stopped = false;

  constructor(
    private readonly repository: RoomRepository,
    readonly clock: Clock,
    private readonly scheduler: Scheduler,
    readonly presence: SessionPresence,
    readonly ends: ParticipationEnds,
    private readonly changes: RoomChanges,
    private readonly statistics: StatisticsRecorder = disabledStatistics
  ) {}

  prepare(): void {
    for (const room of this.repository.allActive()) this.settle(room);
  }

  view(room: Room, sessionId: string): RoomView { return toRoomView(room, sessionId, this.clock.now().unix); }

  publish(room: Room, change?: RoomChange): void {
    this.track(room);
    this.changes.updated(room.memberSessions.map((sessionId) => ({ sessionId, room: this.view(room, sessionId) })), change);
  }

  presenceChanged(sessionId: string): void {
    if (this.stopped) return;
    this.prepare();
    const room = this.repository.findActiveBySession(sessionId);
    if (!room || room.status !== 'WAITING') return;
    const result = room.changePresence(sessionId, this.presence.isConnected(sessionId), this.clock.now());
    if (!result.changed) return;
    this.repository.save(room);
    const person = room.participantFor(sessionId)!;
    this.publish(room, result.recovered ? { id: `${room.id}:${room.revision}`, kind: 'RECONNECTED',
      participantId: person.id, name: displayName(room, person.id) } : undefined);
  }

  left(sessionId: string, roomId: string, participantId: string): void {
    this.changes.left(sessionId, roomId, participantId, 'VOLUNTARY');
  }

  close(room: Room, reason: RoomClosedEvent['reason']): void {
    const people = room.participants.filter((person) => person.kind === 'HUMAN');
    room.close();
    if (reason !== 'HOST_CLOSED') {
      for (const person of people) this.ends.saveEnd(person.sessionId, { roomId: room.id, participantId: person.id, reason });
    }
    this.repository.remove(room.id);
    this.cancelRoom(room.id);
    this.statistics.closed(room, reason);
    this.changes.closed(people.map((person) => person.sessionId), room.id, room.revision, reason);
  }

  dispose(): void {
    this.stopped = true;
    for (const roomId of [...this.tasks.keys()]) this.cancelRoom(roomId);
  }

  private settle(room: Room): void {
    while (room.status === 'WAITING') {
      const deadline = room.deadlines()[0];
      if (!deadline || deadline.at > this.clock.now().monotonic) break;
      if (deadline.kind === 'INACTIVITY') this.close(room, 'INACTIVITY');
      else if (deadline.kind === 'WARNING') {
        room.warn(deadline, this.clock.now().monotonic);
        this.repository.save(room);
        this.publish(room);
      } else if (deadline.participantId === room.participantId) this.close(room, 'HOST_DISCONNECTED');
      else {
        const person = room.participants.find((item) => item.id === deadline.participantId)!;
        if (person.kind !== 'HUMAN') throw new Error('Reserva interna de un bot inválida.');
        const name = displayName(room, person.id);
        room.expirePresence(deadline, this.clock.now().monotonic);
        this.repository.save(room);
        this.ends.saveEnd(person.sessionId, { roomId: room.id, participantId: person.id, reason: 'RECONNECT_TIMEOUT' });
        this.changes.left(person.sessionId, room.id, person.id, 'RECONNECT_TIMEOUT');
        this.publish(room, { id: `${room.id}:${room.revision}`, kind: 'PRESENCE_EXPIRED', participantId: person.id, name });
      }
    }
  }

  private track(room: Room): void {
    if (this.stopped) return;
    const pending = this.tasks.get(room.id) ?? new Map<string, Scheduled>();
    this.tasks.set(room.id, pending);
    const deadlines = room.deadlines();
    for (const [id, task] of pending) {
      if (!deadlines.some((deadline) => key(deadline) === id)) { task.cancel(); pending.delete(id); }
    }
    for (const deadline of deadlines) {
      const id = key(deadline);
      if (pending.has(id)) continue;
      const task: Scheduled = { deadline, cancel: () => {} };
      pending.set(id, task);
      task.cancel = this.scheduler.schedule(deadline.at - this.clock.now().monotonic, () => {
        if (this.stopped || pending.get(id) !== task || this.repository.findById(room.id) !== room || !room.isCurrent(deadline)) return;
        pending.delete(id);
        this.settle(room);
        if (room.status === 'WAITING') this.track(room);
      });
    }
  }

  cancelRoom(roomId: string): void {
    for (const task of this.tasks.get(roomId)?.values() ?? []) task.cancel();
    this.tasks.delete(roomId);
  }
}
