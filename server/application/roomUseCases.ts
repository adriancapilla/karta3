import type { RoomView } from '../../shared/contracts/room.js';
import type { CodeCandidateSource, IdentifierGenerator, RoomRepository } from './ports.js';
import { Room } from './room.js';
import { RoomError } from './roomError.js';
import { toRoomView } from './roomView.js';

export interface RoomActions {
  current(sessionId: string): RoomView | null;
  createOrGet(sessionId: string): RoomView;
  getOwn(sessionId: string, roomId: string): RoomView;
  rename(sessionId: string, roomId: string, value: unknown): RoomView;
  close(sessionId: string, roomId: string): void;
}

export class RoomUseCases implements RoomActions {
  constructor(
    private readonly repository: RoomRepository,
    private readonly createId: IdentifierGenerator,
    private readonly drawCodeCandidate: CodeCandidateSource
  ) {}

  current(sessionId: string): RoomView | null {
    const room = this.repository.findActiveByOwner(sessionId);
    return room ? toRoomView(room) : null;
  }

  createOrGet(sessionId: string): RoomView {
    // No await between lookup and save: one Node process applies both atomically.
    const existing = this.repository.findActiveByOwner(sessionId);
    if (existing) return toRoomView(existing);

    let code: string | undefined;
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const candidate = String(this.drawCodeCandidate()).padStart(6, '0');
      if (/^\d{6}$/.test(candidate) && !this.repository.isCodeActive(candidate)) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new RoomError('CODE_EXHAUSTED', 'Ahora no se puede crear la sala. Inténtalo de nuevo.');

    const room = new Room({ id: this.createId(), code, hostSessionId: sessionId, participantId: this.createId() });
    this.repository.save(room);
    return toRoomView(room);
  }

  getOwn(sessionId: string, roomId: string): RoomView {
    return toRoomView(this.authorize(sessionId, roomId));
  }

  rename(sessionId: string, roomId: string, value: unknown): RoomView {
    const room = this.authorize(sessionId, roomId);
    room.rename(value);
    this.repository.save(room);
    return toRoomView(room);
  }

  close(sessionId: string, roomId: string): void {
    const room = this.authorize(sessionId, roomId);
    room.close();
    this.repository.remove(room.id);
  }

  private authorize(sessionId: string, roomId: string): Room {
    const room = this.repository.findById(roomId);
    if (!room || room.status !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
    if (room.hostSessionId !== sessionId) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    return room;
  }
}
