import { RoomError } from './roomError.js';
import type { TimePoint } from './waitingTime.js';
import type { ConfigurationChange, RoomSettings } from '../../shared/contracts/room.js';
import type { DeckSummary } from '../../shared/contracts/deck.js';
import { publicDeckSummary } from './deckCatalog.js';
import type { CardPresentation, GameDeckSnapshot } from './deckCatalog.js';
import type { Game } from '../domain/game.js';

export const PRESENCE_GRACE_MS = 30_000;
export const WAITING_EXPIRY_MS = 30 * 60_000;
export const WARNING_BEFORE_MS = 60_000;
export type WaitingDeadline = { kind: 'WARNING' | 'INACTIVITY' | 'ABSENCE'; at: number; generation: number; participantId?: string };
type Presence = { connected: boolean; generation: number; absence?: { at: number; initial: boolean } };
export type GameReview = Readonly<{ id: string; gameId: string; roundNumber: number; at: number; unix: number }>;

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
  private state: 'WAITING' | 'IN_GAME' | 'RESULTS' | 'CLOSED' = 'WAITING';
  private initialGame?: Game;
  private partialDirection: 'HIGH' | 'LOW' | null = null;
  private review?: GameReview;
  private retained?: Readonly<{ at: number; presentedAt: number; expiresAt: number }>;
  private readonly released = new Set<string>();
  private graphics: readonly CardPresentation[] = [];
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

  get status(): 'WAITING' | 'IN_GAME' | 'RESULTS' | 'CLOSED' { return this.state; }
  get retention() { return this.retained; }
  get activeSessions() { return this.memberSessions.filter((sessionId) => !this.released.has(sessionId)); }
  presentResult(now: TimePoint): void {
    if (this.state !== 'IN_GAME' || this.initialGame?.phase !== 'FINISHED' || !this.initialGame.result) throw new Error('Resultado interno incompatible.');
    this.state = 'RESULTS';
    this.retained = Object.freeze({ at: now.monotonic + 30 * 60_000, presentedAt: now.unix, expiresAt: now.unix + 30 * 60_000 });
    this.roomRevision++;
  }
  releaseResultSession(sessionId: string): boolean {
    if (this.state !== 'RESULTS' || !this.participantFor(sessionId)) throw new Error('Retorno interno incompatible.');
    if (this.released.has(sessionId)) return false;
    this.released.add(sessionId);
    return true;
  }
  get game(): Game | undefined { return this.initialGame; }
  get openingDirection() { return this.partialDirection; }
  get gameReview() { return this.review; }
  beginReview(now: TimePoint): void {
    const game = this.initialGame!;
    if (!game.resolution || this.review) throw new Error('Revisión interna incompatible.');
    this.review = Object.freeze({ id: game.resolution.id, gameId: game.id, roundNumber: game.round.number,
      at: now.monotonic + this.roomSettings.reviewSeconds * 1000, unix: now.unix + this.roomSettings.reviewSeconds * 1000 });
  }
  selectDirection(direction: 'HIGH' | 'LOW'): boolean {
    if (this.partialDirection === direction) return false;
    this.partialDirection = direction;
    this.roomRevision++;
    return true;
  }
  applyGame(game: Game): void {
    if (this.state !== 'IN_GAME' || game.id !== this.initialGame?.id) throw new Error('Contexto interno de partida incompatible.');
    this.initialGame = game;
    this.partialDirection = null;
    this.review = undefined;
    this.roomRevision++;
  }
  cardPresentation(id: string): CardPresentation {
    const presentation = this.graphics.find((card) => card.id === id);
    if (!presentation) throw new Error('Presentación de carta ausente.');
    return presentation;
  }
  get name(): string { return this.participantName; }
  get revision(): number { return this.roomRevision; }
  get memberSessions(): string[] { return [...this.guests.map((guest) => guest.sessionId), this.hostSessionId]; }
  get participants() {
    return [...this.guests.map((guest) => ({ ...guest, role: 'GUEST' as const, isPlayer: true })),
      { id: this.participantId, sessionId: this.hostSessionId, name: this.participantName, role: 'HOST' as const, isPlayer: this.roomSettings.hostPlays }]
      .map((person) => ({ ...person, presence: this.presence.get(person.id)!.connected ? 'CONNECTED' as const
        : this.state === 'IN_GAME' ? 'DISCONNECTED' as const : 'RECONNECTING' as const }));
  }
  get settings() { return { ...this.roomSettings }; }
  get selectedDeck() { return this.deck ? publicDeckSummary(this.deck) : null; }
  get playerCount() { return this.guests.length + Number(this.roomSettings.hostPlays); }

  participantFor(sessionId: string) { return this.participants.find((person) => person.sessionId === sessionId); }

  startPlayers() {
    this.ensureWaiting();
    if (!this.deck) throw new RoomError('START_NOT_READY', 'Selecciona una baraja antes de iniciar.');
    if (this.playerCount < 2 || this.playerCount > 5) throw new RoomError('START_NOT_READY', 'Se necesitan entre dos y cinco jugadores humanos.');
    if (this.participants.some((person) => person.presence !== 'CONNECTED')) {
      throw new RoomError('START_NOT_READY', 'Todos los participantes deben estar conectados, también el anfitrión observador.');
    }
    return this.participants.filter((person) => person.isPlayer).map((person) => ({ id: person.id, name: person.name }));
  }

  beginGame(game: Game, snapshot: GameDeckSnapshot): void {
    const players = this.startPlayers();
    if (game.id === this.id || game.definition.id !== this.roomSettings.deckId
      || snapshot.summary.id !== this.roomSettings.deckId || snapshot.summary.contentVersion !== this.roomSettings.deckContentVersion
      || game.settings.turnTimeout !== this.roomSettings.turnSeconds || game.settings.forceTieBreak !== this.roomSettings.forceTieBreak
      || players.some((person, index) => game.players[index]?.id !== person.id || game.players[index]?.displayName !== person.name) || game.players.length !== players.length
      || snapshot.presentation.length !== 58 || new Set(snapshot.presentation.map((card) => card.id)).size !== 58
      || game.definition.cards.some((card) => !snapshot.presentation.some((image) => image.id === card.id))) {
      throw new RoomError('INTERNAL_ERROR', 'No se pudo preparar la partida. Inténtalo de nuevo.');
    }
    const graphics = Object.freeze(snapshot.presentation.map((card) => Object.freeze({ id: card.id, imageUrl: card.imageUrl, imageAlt: card.imageAlt })));
    const summary = publicDeckSummary(snapshot.summary);
    // Todo se ha construido/validado antes de fijar la preparación; no hay IO ni espera entre escrituras.
    this.initialGame = game;
    this.graphics = graphics;
    this.deck = summary;
    this.state = 'IN_GAME';
    for (const state of this.presence.values()) { state.absence = undefined; state.generation++; }
    this.roomRevision++;
  }

  changeGamePresence(sessionId: string, connected: boolean): { changed: boolean; recovered: boolean } {
    if (this.state !== 'IN_GAME') throw new Error('La sala no tiene partida.');
    const person = this.participantFor(sessionId);
    if (!person) return { changed: false, recovered: false };
    const state = this.presence.get(person.id)!;
    if (state.connected === connected) return { changed: false, recovered: false };
    state.connected = connected;
    this.roomRevision++;
    return { changed: true, recovered: connected };
  }

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
    if (this.state === 'RESULTS') throw new RoomError('GAME_FINISHED', 'La partida ha terminado. Vuelve al inicio para crear otra sala.');
    if (this.state === 'IN_GAME') throw new RoomError('GAME_ALREADY_STARTED', 'La partida ya ha empezado. La preparación está fijada.');
    if (this.state !== 'WAITING') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
  }
}
