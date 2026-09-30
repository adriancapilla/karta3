import type { RoomRepository } from '../application/ports.js';
import type { Room } from '../application/room.js';

export class MemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, Room>();
  private readonly activeCodes = new Map<string, string>();
  private readonly ownRoom = new Map<string, string>();
  private readonly membersByRoom = new Map<string, Set<string>>();

  findById(id: string): Room | undefined { return this.rooms.get(id); }

  findActiveByOwner(sessionId: string): Room | undefined {
    const room = this.findActiveBySession(sessionId);
    return room?.hostSessionId === sessionId ? room : undefined;
  }

  findActiveBySession(sessionId: string): Room | undefined {
    const id = this.ownRoom.get(sessionId);
    return id ? this.rooms.get(id) : undefined;
  }

  findActiveByCode(code: string): Room | undefined {
    const id = this.activeCodes.get(code);
    return id ? this.rooms.get(id) : undefined;
  }

  isCodeActive(code: string): boolean { return this.activeCodes.has(code); }

  save(room: Room): void {
    const stored = this.rooms.get(room.id);
    const ownerId = this.ownRoom.get(room.hostSessionId);
    const codeId = this.activeCodes.get(room.code);
    const members = room.memberSessions;
    if (room.status !== 'WAITING'
      || (stored && (stored.hostSessionId !== room.hostSessionId || stored.code !== room.code))
      || (ownerId && ownerId !== room.id)
      || (codeId && codeId !== room.id)
      || members.some((sessionId) => { const id = this.ownRoom.get(sessionId); return id && id !== room.id; })) {
      throw new Error('Índices de sala incompatibles.');
    }
    const previousMembers = this.membersByRoom.get(room.id) ?? new Set<string>();
    for (const sessionId of previousMembers) {
      if (!members.includes(sessionId)) this.ownRoom.delete(sessionId);
    }
    this.rooms.set(room.id, room);
    this.activeCodes.set(room.code, room.id);
    for (const sessionId of members) this.ownRoom.set(sessionId, room.id);
    this.membersByRoom.set(room.id, new Set(members));
  }

  remove(id: string): void {
    const room = this.rooms.get(id);
    if (!room) return;
    this.rooms.delete(id);
    this.activeCodes.delete(room.code);
    for (const sessionId of this.membersByRoom.get(id) ?? []) this.ownRoom.delete(sessionId);
    this.membersByRoom.delete(id);
  }
}
