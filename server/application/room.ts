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
  private state: 'WAITING' | 'CLOSED' = 'WAITING';
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
  get settings() { return { ...this.roomSettings }; }

  rename(value: unknown): void {
    this.ensureWaiting();
    this.participantName = normalizeName(value);
  }

  close(): void {
    this.ensureWaiting();
    this.state = 'CLOSED';
  }

  private ensureWaiting(): void {
    if (this.state !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
  }
}
