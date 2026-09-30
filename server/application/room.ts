import { RoomError } from './roomError.js';
import type { TimePoint } from './waitingTime.js';

export const PRESENCE_GRACE_MS = 30_000;
export const WAITING_EXPIRY_MS = 30 * 60_000;
export const WARNING_BEFORE_MS = 60_000;
export type WaitingDeadline = { kind: 'WARNING' | 'INACTIVITY' | 'ABSENCE'; at: number; generation: number; participantId?: string };
type Presence = { connected: boolean; generation: number; absence?: { at: number; initial: boolean } };

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
  private readonly presence = new Map<string, Presence>();
  private expiry: { at: number; unix: number; generation: number; warning: boolean };
  private readonly roomSettings = {
    deckId: null,
    hostPlays: true,
    turnSeconds: 30,
    forceTieBreak: false,
    reviewSeconds: 5
  } as const;

  constructor(input: { id: string; code: string; hostSessionId: string; participantId: string; now: TimePoint; connected: boolean }) {
    if (!/^\d{6}$/.test(input.code)) throw new Error('Código interno de sala inválido.');
    this.id = input.id;
    this.code = input.code;
    this.hostSessionId = input.hostSessionId;
    this.participantId = input.participantId;
    const now = input.now;
    this.expiry = { at: now.monotonic + WAITING_EXPIRY_MS, unix: now.unix + WAITING_EXPIRY_MS, generation: 1, warning: false };
    this.addPresence(input.participantId, input.connected, now);
  }

  get status(): 'WAITING' | 'CLOSED' { return this.state; }
  get name(): string { return this.participantName; }
  get revision(): number { return this.roomRevision; }
  get memberSessions(): string[] { return [...this.guests.map((guest) => guest.sessionId), this.hostSessionId]; }
  get participants() {
    return [...this.guests.map((guest) => ({ ...guest, role: 'GUEST' as const })),
      { id: this.participantId, sessionId: this.hostSessionId, name: this.participantName, role: 'HOST' as const }]
      .map((person) => ({ ...person, presence: this.presence.get(person.id)!.connected ? 'CONNECTED' as const : 'RECONNECTING' as const }));
  }
  get settings() { return { ...this.roomSettings }; }

  participantFor(sessionId: string) { return this.participants.find((person) => person.sessionId === sessionId); }

  join(sessionId: string, id: string, value: unknown, now: TimePoint, connected: boolean): void {
    this.ensureWaiting();
    const name = normalizeName(value);
    if (this.participantFor(sessionId)) throw new Error('La sesión ya pertenece a la sala.');
    if (this.participants.length >= 5) throw new RoomError('ROOM_FULL', 'La sala está llena. Puedes volver a intentarlo cuando quede una plaza.');
    this.guests.push({ id, sessionId, name });
    this.addPresence(id, connected, now);
    this.renew(now);
    this.roomRevision += 1;
  }

  rename(value: unknown, now: TimePoint): void {
    this.renameFor(this.hostSessionId, value, now);
  }

  renameFor(sessionId: string, value: unknown, now: TimePoint): boolean {
    this.ensureWaiting();
    const person = this.participantFor(sessionId);
    if (!person) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    const name = normalizeName(value);
    if (person.name === name) return false;
    if (sessionId === this.hostSessionId) this.participantName = name;
    else this.guests.find((guest) => guest.sessionId === sessionId)!.name = name;
    this.renew(now);
    this.roomRevision += 1;
    return true;
  }

  leave(sessionId: string, participantId: string, now: TimePoint): { id: string; name: string } {
    const person = this.removeGuest(sessionId, participantId);
    this.renew(now);
    return person;
  }

  expirePresence(deadline: WaitingDeadline, now: number): void {
    if (deadline.kind !== 'ABSENCE' || !this.isCurrent(deadline) || deadline.at > now || deadline.participantId === this.participantId) {
      throw new Error('Ausencia no vencida de un invitado.');
    }
    const person = this.participants.find((item) => item.id === deadline.participantId)!;
    this.removeGuest(person.sessionId, person.id);
  }

  private removeGuest(sessionId: string, participantId: string): { id: string; name: string } {
    this.ensureWaiting();
    const index = this.guests.findIndex((guest) => guest.sessionId === sessionId && guest.id === participantId);
    if (index < 0) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    const [guest] = this.guests.splice(index, 1);
    this.presence.delete(guest.id);
    this.roomRevision += 1;
    return { id: guest.id, name: guest.name };
  }

  close(): void {
    this.ensureWaiting();
    this.state = 'CLOSED';
    this.roomRevision += 1;
  }

  lifecycle(serverNow: number) { return { serverNow, expiresAt: this.expiry.unix, warning: this.expiry.warning }; }

  deadlines(): WaitingDeadline[] {
    if (this.status !== 'WAITING') return [];
    const deadlines: WaitingDeadline[] = [
      { kind: 'INACTIVITY', at: this.expiry.at, generation: this.expiry.generation }
    ];
    if (!this.expiry.warning) deadlines.push({ kind: 'WARNING', at: this.expiry.at - WARNING_BEFORE_MS, generation: this.expiry.generation });
    for (const [participantId, state] of this.presence) {
      if (state.absence) deadlines.push({ kind: 'ABSENCE', at: state.absence.at, generation: state.generation, participantId });
    }
    // La caducidad general gana si coincide con cualquier ausencia.
    return deadlines.sort((a, b) => a.at - b.at || (a.kind === 'INACTIVITY' ? -1 : b.kind === 'INACTIVITY' ? 1 : 0));
  }

  isCurrent(deadline: WaitingDeadline): boolean {
    return this.deadlines().some((item) => item.kind === deadline.kind && item.generation === deadline.generation
      && item.participantId === deadline.participantId && item.at === deadline.at);
  }

  warn(deadline: WaitingDeadline, now: number): void {
    if (deadline.kind !== 'WARNING' || !this.isCurrent(deadline) || deadline.at > now) return;
    this.expiry.warning = true;
    this.roomRevision += 1;
  }

  changePresence(sessionId: string, connected: boolean, now: TimePoint): { changed: boolean; recovered: boolean } {
    this.ensureWaiting();
    const person = this.participantFor(sessionId);
    if (!person) return { changed: false, recovered: false };
    const state = this.presence.get(person.id)!;
    if (state.connected === connected) return { changed: false, recovered: false };
    const recovered = connected && !!state.absence && !state.absence.initial;
    state.connected = connected;
    state.generation += 1;
    state.absence = connected ? undefined : { at: now.monotonic + PRESENCE_GRACE_MS, initial: false };
    this.roomRevision += 1;
    return { changed: true, recovered };
  }

  private addPresence(id: string, connected: boolean, now: TimePoint): void {
    this.presence.set(id, { connected, generation: 1,
      ...(connected ? {} : { absence: { at: now.monotonic + PRESENCE_GRACE_MS, initial: true } }) });
  }

  private renew(now: TimePoint): void {
    this.expiry = { at: now.monotonic + WAITING_EXPIRY_MS, unix: now.unix + WAITING_EXPIRY_MS,
      generation: this.expiry.generation + 1, warning: false };
  }

  private ensureWaiting(): void {
    if (this.state !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
  }
}
