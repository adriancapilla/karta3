import type { RoomChange, RoomView } from '../../shared/contracts/room.js';
import type { CodeCandidateSource, IdentifierGenerator, RoomChanges, RoomRepository, RoomRequests } from './ports.js';
import { Room, normalizeName } from './room.js';
import { RoomError } from './roomError.js';
import { displayName, toRoomView } from './roomView.js';

export interface RoomActions {
  current(sessionId: string): RoomView | null;
  createOrGet(sessionId: string): RoomView;
  getOwn(sessionId: string, roomId: string): RoomView;
  rename(sessionId: string, roomId: string, value: unknown): RoomView;
  close(sessionId: string, roomId: string): void;
  join(sessionId: string, requestId: string, code: string, name: string): RoomView;
  leave(sessionId: string, requestId: string, roomId: string, participantId: string): void;
}

const ALREADY = 'Ya estás en una sala. Sal de ella antes de crear otra o entrar en una distinta.';
const UNAVAILABLE = 'No hay una sala disponible con ese código. Compruébalo.';

export class RoomUseCases implements RoomActions {
  constructor(
    private readonly repository: RoomRepository,
    private readonly createId: IdentifierGenerator,
    private readonly drawCodeCandidate: CodeCandidateSource,
    private readonly requests: RoomRequests,
    private readonly changes: RoomChanges
  ) {}

  current(sessionId: string): RoomView | null {
    const room = this.repository.findActiveBySession(sessionId);
    return room ? toRoomView(room, sessionId) : null;
  }

  createOrGet(sessionId: string): RoomView {
    const existing = this.repository.findActiveBySession(sessionId);
    if (existing) {
      if (existing.hostSessionId !== sessionId) throw new RoomError('ALREADY_IN_ROOM', ALREADY);
      return toRoomView(existing, sessionId);
    }

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
    this.publish(room);
    return toRoomView(room, sessionId);
  }

  getOwn(sessionId: string, roomId: string): RoomView {
    return toRoomView(this.authorize(sessionId, roomId), sessionId);
  }

  rename(sessionId: string, roomId: string, value: unknown): RoomView {
    const room = this.authorize(sessionId, roomId);
    if (room.renameFor(sessionId, value)) {
      this.repository.save(room);
      this.publish(room);
    }
    return toRoomView(room, sessionId);
  }

  close(sessionId: string, roomId: string): void {
    const room = this.authorize(sessionId, roomId);
    if (room.hostSessionId !== sessionId) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    const members = room.memberSessions;
    room.close();
    this.repository.remove(room.id);
    this.changes.closed(members, room.id, room.revision);
  }

  join(sessionId: string, requestId: string, codeInput: string, nameInput: string): RoomView {
    const signature = JSON.stringify([codeInput, nameInput]);
    const previous = this.requests.get(sessionId, requestId);
    if (previous) {
      this.checkReplay(previous.kind, previous.signature, 'JOIN', signature);
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      const active = this.repository.findActiveBySession(sessionId);
      if (active?.id === previous.roomId && active.participantFor(sessionId)?.id === previous.participantId) {
        return toRoomView(active, sessionId);
      }
      throw new RoomError('PARTICIPATION_ENDED', 'Esa participación ya terminó. Para volver, entra de nuevo.');
    }

    try {
      const code = codeInput.trim();
      if (!/^\d{6}$/.test(code)) throw new RoomError('INVALID_INPUT', 'Escribe un código de seis cifras.');
      const name = normalizeName(nameInput);
      const active = this.repository.findActiveBySession(sessionId);
      if (active) {
        if (active.code !== code) throw new RoomError('ALREADY_IN_ROOM', ALREADY);
        const participantId = active.participantFor(sessionId)!.id;
        this.requests.save(sessionId, requestId, { kind: 'JOIN', signature, roomId: active.id, participantId });
        return toRoomView(active, sessionId);
      }

      const room = this.repository.findActiveByCode(code);
      if (!room || room.status !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', UNAVAILABLE);
      const participantId = this.createId();
      room.join(sessionId, participantId, name);
      this.repository.save(room);
      this.requests.save(sessionId, requestId, { kind: 'JOIN', signature, roomId: room.id, participantId });
      this.publish(room);
      return toRoomView(room, sessionId);
    } catch (error) {
      if (error instanceof RoomError) this.requests.save(sessionId, requestId, {
        kind: 'JOIN', signature, roomId: '', participantId: '', error: { code: error.code, message: error.message }
      });
      throw error;
    }
  }

  leave(sessionId: string, requestId: string, roomId: string, participantId: string): void {
    const signature = JSON.stringify([roomId, participantId]);
    const previous = this.requests.get(sessionId, requestId);
    if (previous) {
      this.checkReplay(previous.kind, previous.signature, 'LEAVE', signature);
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return;
    }
    try {
      const room = this.repository.findById(roomId);
      if (!room || room.status !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
      if (room.hostSessionId === sessionId || room.participantFor(sessionId)?.id !== participantId) {
        throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
      }
      const name = displayName(room, participantId);
      room.leave(sessionId, participantId);
      this.repository.save(room);
      this.requests.save(sessionId, requestId, { kind: 'LEAVE', signature, roomId, participantId });
      this.changes.left(sessionId, roomId, participantId);
      this.publish(room, { id: `${roomId}:${room.revision}`, kind: 'LEFT', participantId, name });
    } catch (error) {
      if (error instanceof RoomError) this.requests.save(sessionId, requestId, {
        kind: 'LEAVE', signature, roomId, participantId, error: { code: error.code, message: error.message }
      });
      throw error;
    }
  }

  private authorize(sessionId: string, roomId: string): Room {
    const room = this.repository.findById(roomId);
    if (!room || room.status !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
    if (!room.participantFor(sessionId)) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    return room;
  }

  private checkReplay(actualKind: string, actualSignature: string, kind: string, signature: string): void {
    if (actualKind !== kind || actualSignature !== signature) {
      throw new RoomError('REQUEST_CONFLICT', 'Esta solicitud ya se utilizó con otros datos.');
    }
  }

  private publish(room: Room, change?: RoomChange): void {
    this.changes.updated(room.memberSessions.map((sessionId) => ({ sessionId, room: toRoomView(room, sessionId) })), change);
  }
}
