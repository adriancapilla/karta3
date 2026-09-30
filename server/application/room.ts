import { RoomError } from './roomError.js';

const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });

export function normalizeName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RoomError('INVALID_INPUT', 'Escribe un nombre de 1 a 16 caracteres.');
  }
  const name = value.trim();
  const graphemes = [...segmenter.segment(name)].length;
  if (/\p{Cc}|[\u2028\u2029\u200B\u200E\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/u.test(name) || !/[\p{L}\p{N}\p{P}\p{S}]/u.test(name) || graphemes < 1 || graphemes > 16) {
    throw new RoomError('INVALID_INPUT', 'El nombre debe tener de 1 a 16 caracteres visibles, sin saltos de línea.');
  }
  return name;
}

export class Room {
  readonly id: string;
  readonly code: string;
  readonly hostSessionId: string;
  readonly participantId: string;
  private participantName = 'Jugador 1';
  private readonly guests: { id: string; sessionId: string; name: string }[] = [];
  private state: 'WAITING' | 'CLOSED' = 'WAITING';
  private roomRevision = 1;
  private readonly roomSettings = {
    deckId: null,
    hostPlays: true,
    turnSeconds: 30,
    forceTieBreak: false,
    reviewSeconds: 5
  } as const;

  constructor(input: { id: string; code: string; hostSessionId: string; participantId: string }) {
    if (!/^\d{6}$/.test(input.code)) throw new Error('Código interno de sala inválido.');
    this.id = input.id;
    this.code = input.code;
    this.hostSessionId = input.hostSessionId;
    this.participantId = input.participantId;
  }

  get status(): 'WAITING' | 'CLOSED' { return this.state; }
  get name(): string { return this.participantName; }
  get revision(): number { return this.roomRevision; }
  get memberSessions(): string[] { return [...this.guests.map((guest) => guest.sessionId), this.hostSessionId]; }
  get participants(): { id: string; sessionId: string; name: string; role: 'HOST' | 'GUEST' }[] {
    return [...this.guests.map((guest) => ({ ...guest, role: 'GUEST' as const })),
      { id: this.participantId, sessionId: this.hostSessionId, name: this.participantName, role: 'HOST' }];
  }
  get settings() { return { ...this.roomSettings }; }

  participantFor(sessionId: string) { return this.participants.find((person) => person.sessionId === sessionId); }

  join(sessionId: string, id: string, value: unknown): void {
    this.ensureWaiting();
    const name = normalizeName(value);
    if (this.participantFor(sessionId)) throw new Error('La sesión ya pertenece a la sala.');
    if (this.participants.length >= 5) throw new RoomError('ROOM_FULL', 'La sala está llena. Puedes volver a intentarlo cuando quede una plaza.');
    this.guests.push({ id, sessionId, name });
    this.roomRevision += 1;
  }

  rename(value: unknown): void {
    this.renameFor(this.hostSessionId, value);
  }

  renameFor(sessionId: string, value: unknown): boolean {
    this.ensureWaiting();
    const person = this.participantFor(sessionId);
    if (!person) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    const name = normalizeName(value);
    if (person.name === name) return false;
    if (sessionId === this.hostSessionId) this.participantName = name;
    else this.guests.find((guest) => guest.sessionId === sessionId)!.name = name;
    this.roomRevision += 1;
    return true;
  }

  leave(sessionId: string, participantId: string): { id: string; name: string } {
    this.ensureWaiting();
    const index = this.guests.findIndex((guest) => guest.sessionId === sessionId && guest.id === participantId);
    if (index < 0) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    const [guest] = this.guests.splice(index, 1);
    this.roomRevision += 1;
    return { id: guest.id, name: guest.name };
  }

  close(): void {
    this.ensureWaiting();
    this.state = 'CLOSED';
    this.roomRevision += 1;
  }

  private ensureWaiting(): void {
    if (this.state !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
  }
}
