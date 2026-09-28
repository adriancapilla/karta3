import { randomInt, randomUUID } from 'node:crypto';

export type RoomView = {
  id: string;
  code: string;
  status: 'WAITING';
  participant: { id: string; name: string; role: 'HOST'; isPlayer: true };
  settings: {
    deckId: null;
    hostPlays: true;
    turnSeconds: 30;
    forceTieBreak: false;
    reviewSeconds: 5;
  };
};

type Room = RoomView & { hostSessionId: string };

export type ErrorCode = 'INVALID_INPUT' | 'ROOM_NOT_AVAILABLE' | 'FORBIDDEN' | 'SESSION_REQUIRED' | 'CODE_EXHAUSTED';

export class AppError extends Error {
  constructor(public readonly code: ErrorCode, public readonly status: number, message: string) {
    super(message);
  }
}

const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });

export function normalizeName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError('INVALID_INPUT', 400, 'Escribe un nombre de 1 a 16 caracteres.');
  }
  const name = value.trim();
  const graphemes = [...segmenter.segment(name)].length;
  if (/\p{Cc}|[\u2028\u2029\u200B\u200E\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/u.test(name) || !/[\p{L}\p{N}\p{P}\p{S}]/u.test(name) || graphemes < 1 || graphemes > 16) {
    throw new AppError('INVALID_INPUT', 400, 'El nombre debe tener de 1 a 16 caracteres visibles, sin saltos de línea.');
  }
  return name;
}

export class RoomStore {
  private readonly rooms = new Map<string, Room>();
  private readonly activeCodes = new Map<string, string>();
  private readonly ownRoom = new Map<string, string>();

  constructor(private readonly drawCode: () => number = () => randomInt(1_000_000)) {}

  current(sessionId: string): RoomView | null {
    const id = this.ownRoom.get(sessionId);
    const room = id ? this.rooms.get(id) : undefined;
    if (!room) {
      if (id) this.ownRoom.delete(sessionId);
      return null;
    }
    return this.view(room);
  }

  createOrGet(sessionId: string): RoomView {
    // This synchronous section has no await: concurrent HTTP callbacks for one
    // session cannot both pass the current-room check in a single Node process.
    const existing = this.current(sessionId);
    if (existing) return existing;

    let code: string | undefined;
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const candidate = String(this.drawCode()).padStart(6, '0');
      if (/^\d{6}$/.test(candidate) && !this.activeCodes.has(candidate)) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new AppError('CODE_EXHAUSTED', 503, 'Ahora no se puede crear la sala. Inténtalo de nuevo.');

    const room: Room = {
      id: randomUUID(),
      code,
      status: 'WAITING',
      hostSessionId: sessionId,
      participant: { id: randomUUID(), name: 'Jugador 1', role: 'HOST', isPlayer: true },
      settings: { deckId: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5 }
    };
    this.rooms.set(room.id, room);
    this.activeCodes.set(code, room.id);
    this.ownRoom.set(sessionId, room.id);
    return this.view(room);
  }

  getOwn(sessionId: string, roomId: string): RoomView {
    return this.view(this.authorize(sessionId, roomId));
  }

  rename(sessionId: string, roomId: string, value: unknown): RoomView {
    const room = this.authorize(sessionId, roomId);
    room.participant.name = normalizeName(value);
    return this.view(room);
  }

  close(sessionId: string, roomId: string): void {
    const room = this.authorize(sessionId, roomId);
    this.activeCodes.delete(room.code);
    this.ownRoom.delete(sessionId);
    this.rooms.delete(roomId);
  }

  private authorize(sessionId: string, roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) throw new AppError('ROOM_NOT_AVAILABLE', 404, 'La sala ya no está disponible.');
    if (room.hostSessionId !== sessionId) throw new AppError('FORBIDDEN', 403, 'No tienes permiso para esta sala.');
    return room;
  }

  private view(room: Room): RoomView {
    return {
      id: room.id,
      code: room.code,
      status: room.status,
      participant: { ...room.participant },
      settings: { ...room.settings }
    };
  }
}
