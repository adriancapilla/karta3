import { RoomError } from './roomError.js';
import type { TimePoint } from './waitingTime.js';
import type { ConfigurationChange, RoomSettings } from '../../shared/contracts/room.js';
import type { DeckSummary } from '../../shared/contracts/deck.js';
import { publicDeckSummary } from './deckCatalog.js';

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
  private deck: DeckSummary | null = null;
  private readonly roomSettings: RoomSettings = {
    deckId: null,
    deckContentVersion: null,
    hostPlays: true,
    turnSeconds: 30,
    forceTieBreak: false,
    reviewSeconds: 5
  };

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
    return [...this.guests.map((guest) => ({ ...guest, role: 'GUEST' as const, isPlayer: true })),
      { id: this.participantId, sessionId: this.hostSessionId, name: this.participantName, role: 'HOST' as const, isPlayer: this.roomSettings.hostPlays }]
      .map((person) => ({ ...person, presence: this.presence.get(person.id)!.connected ? 'CONNECTED' as const : 'RECONNECTING' as const }));
  }
  get settings() { return { ...this.roomSettings }; }
  get selectedDeck() { return this.deck ? publicDeckSummary(this.deck) : null; }
  get playerCount() { return this.guests.length + Number(this.roomSettings.hostPlays); }

  participantFor(sessionId: string) { return this.participants.find((person) => person.sessionId === sessionId); }

  join(sessionId: string, id: string, value: unknown, now: TimePoint, connected: boolean): void {
    this.ensureWaiting();
    const name = normalizeName(value);
    if (this.participantFor(sessionId)) throw new Error('La sesión ya pertenece a la sala.');
    if (this.playerCount >= 5) throw new RoomError('ROOM_FULL', 'La sala está llena. Puedes volver a intentarlo cuando quede una plaza.');
    this.guests.push({ id, sessionId, name });
    this.addPresence(id, connected, now);
    this.renew(now);
    this.roomRevision += 1;
  }

  rename(value: unknown, now: TimePoint): void {
    this.renameFor(this.hostSessionId, value, now);
  }

  configure(change: ConfigurationChange, selected: DeckSummary | null, now: TimePoint): boolean {
    this.ensureWaiting();
    if (change.field === 'deck') {
      if (change.value !== null && (typeof change.value !== 'object' || typeof change.value.id !== 'string'
        || !Number.isInteger(change.value.contentVersion) || change.value.contentVersion <= 0)) {
        throw new RoomError('INVALID_INPUT', 'La referencia de baraja no es válida.');
      }
      if (change.value && (!selected || selected.id !== change.value.id || selected.contentVersion !== change.value.contentVersion)) {
        throw new RoomError('DECK_NOT_AVAILABLE', 'La baraja no está disponible. Vuelve a consultar el catálogo.');
      }
      if (this.roomSettings.deckId === (change.value?.id ?? null)
        && this.roomSettings.deckContentVersion === (change.value?.contentVersion ?? null)) return false;
      this.deck = change.value ? publicDeckSummary(selected!) : null;
      this.roomSettings.deckId = this.deck?.id ?? null;
      this.roomSettings.deckContentVersion = this.deck?.contentVersion ?? null;
    } else {
      const { field, value } = change;
      if ((field === 'turnSeconds' && ![15, 30, 60].includes(value))
        || (field === 'reviewSeconds' && ![0, 2, 5, 10, 15, 30].includes(value))
        || ((field === 'hostPlays' || field === 'forceTieBreak') && typeof value !== 'boolean')) {
        throw new RoomError('INVALID_INPUT', 'El valor de configuración no es válido.');
      }
      if (this.roomSettings[field] === value) return false;
      if (field === 'hostPlays' && value && this.playerCount >= 5) {
        throw new RoomError('ROOM_FULL', 'Necesitas una plaza libre para volver a jugar.');
      }
      // Asignaciones discriminadas: nunca sustituir la configuración completa.
      switch (field) {
        case 'hostPlays': this.roomSettings.hostPlays = value; break;
        case 'forceTieBreak': this.roomSettings.forceTieBreak = value; break;
        case 'turnSeconds': this.roomSettings.turnSeconds = value; break;
        case 'reviewSeconds': this.roomSettings.reviewSeconds = value; break;
        default: throw new RoomError('INVALID_INPUT', 'El control de configuración no es válido.');
      }
    }
    this.renew(now);
    this.roomRevision += 1;
    return true;
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
