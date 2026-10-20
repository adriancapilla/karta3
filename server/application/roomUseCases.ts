import type { BotOperation, BotResponse, ConfigurationChange, CurrentRoomResponse, LastResult, ResultsRoomView, ReturnHomeRequest, RoomView } from '../../shared/contracts/room.js';
import type { PublishedDeckVersions, PublishedGameDecks } from './deckCatalog.js';
import type { CardPermutation, CodeCandidateSource, IdentifierGenerator, RoomRepository, RoomRequests } from './ports.js';
import { Game, GameInitializationError } from '../domain/game.js';
import { validateDeck } from '../domain/deck.js';
import { Room, normalizeName } from './room.js';
import { RoomError } from './roomError.js';
import { displayName } from './roomView.js';
import type { WaitingLifecycle } from './waitingLifecycle.js';
import type { GameActions } from './gameCoordinator.js';
import type { CancelGameRequest, OpeningDirectionRequest, PlayCardRequest } from '../../shared/contracts/game.js';
import { disabledStatistics, type StatisticsRecorder } from './statistics/recording.js';

export interface RoomActions extends Omit<GameActions, 'started'> {
  current(sessionId: string): RoomView | null;
  resume(sessionId: string): CurrentRoomResponse;
  presenceChanged(sessionId: string): void;
  createOrGet(sessionId: string): RoomView;
  getOwn(sessionId: string, roomId: string): RoomView;
  rename(sessionId: string, roomId: string, value: unknown): RoomView;
  close(sessionId: string, roomId: string): void;
  join(sessionId: string, requestId: string, code: string, name: string): RoomView;
  joinInputRejected?(sessionId: string, requestId: unknown): void;
  leave(sessionId: string, requestId: string, roomId: string, participantId: string): void;
  configure(sessionId: string, requestId: string, roomId: string, change: ConfigurationChange): RoomView;
  start(sessionId: string, requestId: string, roomId: string): RoomView;
  bot(sessionId: string, requestId: string, roomId: string, operation: BotOperation): BotResponse;
}

const ALREADY = 'Ya estás en una sala. Sal de ella antes de crear otra o entrar en una distinta.';
const UNAVAILABLE = 'No hay una sala disponible con ese código. Compruébalo.';

export class RoomUseCases implements RoomActions {
  private readonly invalidJoinRequests = new Map<string, number>();
  constructor(
    private readonly repository: RoomRepository,
    private readonly createId: IdentifierGenerator,
    private readonly drawCodeCandidate: CodeCandidateSource,
    private readonly requests: RoomRequests,
    private readonly lifecycle: Pick<WaitingLifecycle, 'prepare' | 'clock' | 'presence' | 'ends' | 'view' | 'publish' | 'presenceChanged' | 'close' | 'left'>,
    private readonly decks: PublishedDeckVersions = { resolveVersion: () => ({ ok: false, reason: 'DECK_NOT_AVAILABLE' }) },
    private readonly gameDecks: PublishedGameDecks = { gameDeck: () => ({ ok: false, reason: 'DECK_NOT_AVAILABLE' }) },
    private readonly permute: CardPermutation = () => { throw new Error('Entropía no conectada'); },
    private readonly games?: GameActions,
    private readonly statistics: StatisticsRecorder = disabledStatistics
  ) {}

  current(sessionId: string): RoomView | null {
    this.lifecycle.prepare();
    const room = this.repository.findActiveBySession(sessionId);
    return room ? this.lifecycle.view(room, sessionId) : null;
  }

  resume(sessionId: string): CurrentRoomResponse {
    const room = this.current(sessionId);
    const ended = room ? undefined : this.lifecycle.ends.getEnd(sessionId);
    const lastResult = this.lastResult(sessionId);
    return { room, ...(ended ? { ended } : {}), ...(lastResult ? { lastResult } : {}) };
  }

  presenceChanged(sessionId: string): void { this.lifecycle.presenceChanged(sessionId); }
  cancelGame(sessionId: string, input: CancelGameRequest): ResultsRoomView {
    if (!this.games) throw new RoomError('STALE_GAME_CONTEXT', 'La partida no está disponible.');
    return this.games.cancelGame(sessionId, input);
  }
  openingDirection(sessionId: string, input: OpeningDirectionRequest): RoomView {
    if (!this.games) throw new RoomError('INTERNAL_ERROR', 'Coordinación de juego no conectada.');
    return this.games.openingDirection(sessionId, input);
  }
  playCard(sessionId: string, input: PlayCardRequest): RoomView {
    if (!this.games) throw new RoomError('INTERNAL_ERROR', 'Coordinación de juego no conectada.');
    return this.games.playCard(sessionId, input);
  }
  getResult(sessionId: string, gameId: string): ResultsRoomView {
    this.lifecycle.prepare();
    if (!this.games) throw new RoomError('RESULT_NOT_AVAILABLE', 'El resultado ya no está disponible.');
    return this.games.getResult(sessionId, gameId);
  }
  lastResult(sessionId: string): LastResult | undefined { return this.games?.lastResult(sessionId); }
  returnHome(sessionId: string, input: ReturnHomeRequest): CurrentRoomResponse {
    this.lifecycle.prepare();
    if (!this.games) throw new RoomError('RESULT_NOT_AVAILABLE', 'El resultado ya no está disponible.');
    return this.games.returnHome(sessionId, input);
  }

  createOrGet(sessionId: string): RoomView {
    this.lifecycle.prepare();
    const existing = this.repository.findActiveBySession(sessionId);
    if (existing) {
      if (existing.hostSessionId !== sessionId) throw new RoomError('ALREADY_IN_ROOM', ALREADY);
      return this.lifecycle.view(existing, sessionId);
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

    const room = new Room({ id: this.createId(), code, hostSessionId: sessionId, participantId: this.createId(),
      now: this.lifecycle.clock.now(), connected: this.lifecycle.presence.isConnected(sessionId) });
    this.repository.save(room);
    this.lifecycle.ends.clearEnd(sessionId);
    this.statistics.created(room);
    this.lifecycle.publish(room);
    return this.lifecycle.view(room, sessionId);
  }

  getOwn(sessionId: string, roomId: string): RoomView {
    return this.lifecycle.view(this.authorize(sessionId, roomId), sessionId);
  }

  rename(sessionId: string, roomId: string, value: unknown): RoomView {
    const room = this.authorize(sessionId, roomId);
    if (room.renameFor(sessionId, value, this.lifecycle.clock.now())) {
      this.repository.save(room);
      this.lifecycle.publish(room);
    }
    return this.lifecycle.view(room, sessionId);
  }

  close(sessionId: string, roomId: string): void {
    const room = this.authorize(sessionId, roomId);
    if (room.hostSessionId !== sessionId) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    this.requireWaiting(room);
    this.lifecycle.close(room, 'HOST_CLOSED');
  }

  joinInputRejected(sessionId: string, requestId: unknown): void {
    if (this.statistics === disabledStatistics) return;
    if (typeof requestId !== 'string' || !requestId.length || requestId.length > 100) {
      // Sin ID válido no hay replay identificable; solo el rechazo observado, sin cuerpo/contexto.
      this.statistics.joinRejected('INVALID_INPUT', sessionId); return;
    }
    if (this.requests.get(sessionId, requestId)) return;
    const at = this.lifecycle.clock.now().monotonic;
    for (const [key, expiry] of this.invalidJoinRequests) if (expiry <= at) this.invalidJoinRequests.delete(key);
    const key = JSON.stringify([sessionId, requestId]); if (this.invalidJoinRequests.has(key)) return;
    // Solo dedupe estadístico RAM; nunca consume una solicitud de juego ni conserva su cuerpo.
    if (this.invalidJoinRequests.size >= 4096) { this.statistics.lost(); return; }
    this.invalidJoinRequests.set(key, at + 2 * 60 * 60_000); this.statistics.joinRejected('INVALID_INPUT', sessionId);
  }

  join(sessionId: string, requestId: string, codeInput: string, nameInput: string): RoomView {
    this.lifecycle.prepare();
    const signature = JSON.stringify([codeInput, nameInput]);
    const previous = this.requests.get(sessionId, requestId);
    if (previous) {
      this.checkReplay(previous.kind, previous.signature, 'JOIN', signature);
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      const active = this.repository.findActiveBySession(sessionId);
      if (active?.id === previous.roomId && active.participantFor(sessionId)?.id === previous.participantId) {
        return this.lifecycle.view(active, sessionId);
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
        if (active.status === 'RESULTS') this.requireWaiting(active);
        const participantId = active.participantFor(sessionId)!.id;
        this.requests.save(sessionId, requestId, { kind: 'JOIN', signature, roomId: active.id, participantId });
        this.statistics.joined(active, participantId, true);
        return this.lifecycle.view(active, sessionId);
      }

      const room = this.repository.findActiveByCode(code);
      if (!room) throw new RoomError('ROOM_NOT_AVAILABLE', UNAVAILABLE);
      this.requireWaiting(room);
      const participantId = this.createId();
      room.join(sessionId, participantId, name, this.lifecycle.clock.now(), this.lifecycle.presence.isConnected(sessionId));
      this.repository.save(room);
      this.requests.save(sessionId, requestId, { kind: 'JOIN', signature, roomId: room.id, participantId });
      this.lifecycle.ends.clearEnd(sessionId);
      this.statistics.joined(room, participantId, false);
      this.lifecycle.publish(room);
      return this.lifecycle.view(room, sessionId);
    } catch (error) {
      if (error instanceof RoomError && !this.requests.get(sessionId, requestId)) { this.requests.save(sessionId, requestId, {
        kind: 'JOIN', signature, roomId: '', participantId: '', error: { code: error.code, message: error.message }
      }); this.statistics.joinRejected(error.code, sessionId); }
      throw error;
    }
  }

  leave(sessionId: string, requestId: string, roomId: string, participantId: string): void {
    this.lifecycle.prepare();
    const signature = JSON.stringify([roomId, participantId]);
    const previous = this.requests.get(sessionId, requestId);
    if (previous) {
      this.checkReplay(previous.kind, previous.signature, 'LEAVE', signature);
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return;
    }
    try {
      const room = this.repository.findById(roomId);
      if (!room || room.status === 'CLOSED') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
      if (room.hostSessionId === sessionId || room.participantFor(sessionId)?.id !== participantId) {
        throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
      }
      this.requireWaiting(room);
      const name = displayName(room, participantId);
      room.leave(sessionId, participantId, this.lifecycle.clock.now());
      this.repository.save(room);
      this.requests.save(sessionId, requestId, { kind: 'LEAVE', signature, roomId, participantId });
      this.lifecycle.left(sessionId, roomId, participantId);
      this.lifecycle.publish(room, { id: `${roomId}:${room.revision}`, kind: 'LEFT', participantId, name });
    } catch (error) {
      if (error instanceof RoomError) this.requests.save(sessionId, requestId, {
        kind: 'LEAVE', signature, roomId, participantId, error: { code: error.code, message: error.message }
      });
      throw error;
    }
  }

  configure(sessionId: string, requestId: string, roomId: string, change: ConfigurationChange): RoomView {
    const room = this.authorize(sessionId, roomId);
    if (room.hostSessionId !== sessionId) throw new RoomError('FORBIDDEN', 'Solo el anfitrión puede configurar la sala.');
    const signature = JSON.stringify([roomId, change.field, change.field === 'deck'
      ? change.value === null ? null : [change.value.id, change.value.contentVersion] : change.value]);
    const previous = this.requests.get(sessionId, requestId);
    if (previous) {
      this.checkReplay(previous.kind, previous.signature, 'CONFIGURE', signature);
      if (previous.roomId !== room.id || previous.participantId !== room.participantId) {
        throw new RoomError('PARTICIPATION_ENDED', 'Esa participación ya terminó.');
      }
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return this.lifecycle.view(room, sessionId);
    }
    try {
      this.requireWaiting(room);
      let selected = null;
      if (change.field === 'deck' && change.value !== null) {
        const result = this.decks.resolveVersion(change.value.id, change.value.contentVersion);
        if (!result.ok) throw new RoomError(result.reason, result.reason === 'DECK_VERSION_MISMATCH'
          ? 'La versión solicitada no está disponible. Vuelve a consultar el catálogo.'
          : 'La baraja no está disponible. Vuelve a consultar el catálogo.');
        selected = { summary: result.summary, information: result.information };
      }
      const changed = room.configure(change, selected, this.lifecycle.clock.now());
      if (changed) this.repository.save(room);
      this.requests.save(sessionId, requestId, { kind: 'CONFIGURE', signature, roomId, participantId: room.participantId });
      if (changed) this.lifecycle.publish(room);
      return this.lifecycle.view(room, sessionId);
    } catch (error) {
      if (error instanceof RoomError && !this.requests.get(sessionId, requestId)) this.requests.save(sessionId, requestId, {
        kind: 'CONFIGURE', signature, roomId, participantId: room.participantId, error: { code: error.code, message: error.message }
      });
      throw error;
    }
  }

  bot(sessionId: string, requestId: string, roomId: string, operation: BotOperation): BotResponse {
    const room = this.authorize(sessionId, roomId);
    if (room.hostSessionId !== sessionId) throw new RoomError('FORBIDDEN', 'Solo el anfitrión puede gestionar bots.');
    const kind = `BOT_${operation.type}` as 'BOT_ADD' | 'BOT_DIFFICULTY' | 'BOT_RENAME' | 'BOT_REMOVE';
    const signature = JSON.stringify([roomId, operation.type, operation.type === 'ADD' ? null : operation.botId,
      operation.type === 'RENAME' ? operation.name : operation.type === 'DIFFICULTY' ? operation.difficulty : null]);
    const previous = this.requests.get(sessionId, requestId);
    if (previous) {
      this.checkReplay(previous.kind, previous.signature, kind, signature);
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return { room: this.lifecycle.view(room, sessionId), botId: previous.botId! };
    }
    let botId = operation.type === 'ADD' ? '' : operation.botId;
    try {
      this.requireWaiting(room);
      const now = this.lifecycle.clock.now();
      let name = '';
      let changed;
      if (operation.type === 'ADD') {
        if (room.playerCount >= 5) throw new RoomError('ROOM_FULL', 'No quedan plazas para añadir un bot.');
        botId = this.createId(); room.addBot(botId, now); changed = true;
      } else {
        if (operation.type === 'REMOVE' && room.participants.some((person) => person.id === botId && person.kind === 'BOT')) name = displayName(room, botId);
        changed = room.manageBot(operation, now);
      }
      if (changed) this.repository.save(room);
      this.requests.save(sessionId, requestId, { kind, signature, roomId, participantId: room.participantId, botId });
      if (changed) this.lifecycle.publish(room, operation.type === 'REMOVE'
        ? { id: `${roomId}:${room.revision}`, kind: 'BOT_REMOVED', participantId: botId, name } : undefined);
      return { room: this.lifecycle.view(room, sessionId), botId };
    } catch (error) {
      if (error instanceof RoomError && !this.requests.get(sessionId, requestId)) this.requests.save(sessionId, requestId, {
        kind, signature, roomId, participantId: room.participantId, error: { code: error.code, message: error.message }
      });
      throw error;
    }
  }

  start(sessionId: string, requestId: string, roomId: string): RoomView {
    const room = this.authorize(sessionId, roomId);
    if (room.hostSessionId !== sessionId) throw new RoomError('FORBIDDEN', 'Solo el anfitrión puede iniciar la partida.');
    const signature = JSON.stringify([roomId]);
    const previous = this.requests.get(sessionId, requestId);
    if (previous) {
      this.checkReplay(previous.kind, previous.signature, 'START', signature);
      if (previous.roomId !== room.id || previous.participantId !== room.participantId) {
        throw new RoomError('PARTICIPATION_ENDED', 'Esa participación ya terminó.');
      }
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return this.lifecycle.view(room, sessionId);
    }
    try {
      if (room.status === 'RESULTS') this.requireWaiting(room);
      if (room.status === 'WAITING') {
        const players = room.startPlayers();
        const selection = room.selectedDeck!;
        const result = this.gameDecks.gameDeck(selection.id, selection.contentVersion);
        if (!result.ok) throw new RoomError(result.reason, 'La baraja o su versión seleccionada ya no está disponible.');
        const snapshot = result.snapshot;
        if (snapshot.summary.id !== selection.id || snapshot.summary.contentVersion !== selection.contentVersion
          || snapshot.definition.id !== selection.id) throw new RoomError('INVALID_DECK', 'La definición de la baraja no es válida.');
        if (!validateDeck(snapshot.definition).valid) throw new RoomError('INVALID_DECK', 'La definición de la baraja no es válida.');
        const game = new Game({ id: this.createId(), deck: snapshot.definition, players,
          settings: { turnTimeout: room.settings.turnSeconds, forceTieBreak: room.settings.forceTieBreak },
          permutation: this.permute(snapshot.definition.cards.map((card) => card.id)) });
        room.beginGame(game, snapshot);
        // El primer plazo queda fijado antes de cualquier vista o confirmación del inicio.
        if (this.games) this.games.started(room);
        else room.activateTurn(this.lifecycle.clock.now());
        this.repository.save(room);
        // Registrar aceptación antes de emitir: perder el ack no permite repetir el reparto.
        this.requests.save(sessionId, requestId, { kind: 'START', signature, roomId, participantId: room.participantId });
        this.statistics.started(room);
        this.lifecycle.publish(room);
      } else {
        this.requests.save(sessionId, requestId, { kind: 'START', signature, roomId, participantId: room.participantId });
      }
      return this.lifecycle.view(room, sessionId);
    } catch (cause) {
      const error = cause instanceof RoomError ? cause : cause instanceof GameInitializationError && cause.code === 'INVALID_DECK'
        ? new RoomError('INVALID_DECK', 'La definición de la baraja no es válida.')
        : new RoomError('INTERNAL_ERROR', 'No se pudo confirmar el inicio. Recupera el estado de la sala.');
      if (room.status === 'WAITING') this.requests.save(sessionId, requestId, { kind: 'START', signature, roomId,
        participantId: room.participantId, error: { code: error.code, message: error.message } });
      throw error;
    }
  }

  private requireWaiting(room: Room): void {
    if (room.status === 'RESULTS') throw new RoomError('GAME_FINISHED', 'La partida ha terminado. Vuelve al inicio para crear otra sala.');
    if (room.status === 'IN_GAME') throw new RoomError('GAME_ALREADY_STARTED', 'La partida ya ha comenzado. No se puede cambiar la preparación.');
  }

  private authorize(sessionId: string, roomId: string): Room {
    this.lifecycle.prepare();
    const room = this.repository.findById(roomId);
    if (!room || room.status === 'CLOSED') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
    if (!room.participantFor(sessionId)) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta sala.');
    return room;
  }

  private checkReplay(actualKind: string, actualSignature: string, kind: string, signature: string): void {
    if (actualKind !== kind || actualSignature !== signature) {
      throw new RoomError('REQUEST_CONFLICT', 'Esta solicitud ya se utilizó con otros datos.');
    }
  }

}
