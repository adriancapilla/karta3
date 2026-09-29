import type { RoomRepository } from '../application/ports.js';
import type { Room } from '../application/room.js';

export class MemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, Room>();
  private readonly activeCodes = new Map<string, string>();
  private readonly ownRoom = new Map<string, string>();

  findById(id: string): Room | undefined { return this.rooms.get(id); }

  findActiveByOwner(sessionId: string): Room | undefined {
    const id = this.ownRoom.get(sessionId);
    return id ? this.rooms.get(id) : undefined;
  }

  isCodeActive(code: string): boolean { return this.activeCodes.has(code); }

  save(room: Room): void {
    const ownerId = this.ownRoom.get(room.hostSessionId);
    const codeId = this.activeCodes.get(room.code);
    if (room.status !== 'WAITING' || (ownerId && ownerId !== room.id) || (codeId && codeId !== room.id)) {
      throw new Error('Índices de sala incompatibles.');
    }
    this.rooms.set(room.id, room);
    this.activeCodes.set(room.code, room.id);
    this.ownRoom.set(room.hostSessionId, room.id);
  }

  remove(id: string): void {
    const room = this.rooms.get(id);
    if (!room) return;
    this.rooms.delete(id);
    this.activeCodes.delete(room.code);
    this.ownRoom.delete(room.hostSessionId);
  }
}
