import type { ConfigurationChange, CurrentRoomResponse, RoomView } from '../../shared/contracts/room.js';
import type { PublishedDeckVersions, PublishedGameDecks } from './deckCatalog.js';
import type { CardPermutation, CodeCandidateSource, IdentifierGenerator, RoomRepository, RoomRequests } from './ports.js';
import { Game, GameInitializationError } from '../domain/game.js';
import { validateDeck } from '../domain/deck.js';
import { Room, normalizeName } from './room.js';
import { RoomError } from './roomError.js';
import { displayName } from './roomView.js';
import type { WaitingLifecycle } from './waitingLifecycle.js';

export interface RoomActions {
  current(sessionId: string): RoomView | null;
  resume(sessionId: string): CurrentRoomResponse;
  presenceChanged(sessionId: string): void;
  createOrGet(sessionId: string): RoomView;
  getOwn(sessionId: string, roomId: string): RoomView;
  rename(sessionId: string, roomId: string, value: unknown): RoomView;
  close(sessionId: string, roomId: string): void;
  join(sessionId: string, requestId: string, code: string, name: string): RoomView;
  leave(sessionId: string, requestId: string, roomId: string, participantId: string): void;
  configure(sessionId: string, requestId: string, roomId: string, change: ConfigurationChange): RoomView;
  start(sessionId: string, requestId: string, roomId: string): RoomView;
}

const ALREADY = 'Ya estás en una sala. Sal de ella antes de crear otra o entrar en una distinta.';
const UNAVAILABLE = 'No hay una sala disponible con ese código. Compruébalo.';

export class RoomUseCases implements RoomActions {
  constructor(
    private readonly repository: RoomRepository,
    private readonly createId: IdentifierGenerator,
    private readonly drawCodeCandidate: CodeCandidateSource,
    private readonly requests: RoomRequests,
    private readonly lifecycle: Pick<WaitingLifecycle, 'prepare' | 'clock' | 'presence' | 'ends' | 'view' | 'publish' | 'presenceChanged' | 'close' | 'left'>,
    private readonly decks: PublishedDeckVersions = { resolveVersion: () => ({ ok: false, reason: 'DECK_NOT_AVAILABLE' }) },
    private readonly gameDecks: PublishedGameDecks = { gameDeck: () => ({ ok: false, reason: 'DECK_NOT_AVAILABLE' }) },
    private readonly permute: CardPermutation = () => { throw new Error('Entropía no conectada'); }
  ) {}

  current(sessionId: string): RoomView | null {
    this.lifecycle.prepare();
    const room = this.repository.findActiveBySession(sessionId);
    return room ? this.lifecycle.view(room, sessionId) : null;
  }

  resume(sessionId: string): CurrentRoomResponse {
    const room = this.current(sessionId);
    const ended = room ? undefined : this.lifecycle.ends.getEnd(sessionId);
    return { room, ...(ended ? { ended } : {}) };
  }

  presenceChanged(sessionId: string): void { this.lifecycle.presenceChanged(sessionId); }

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
        const participantId = active.participantFor(sessionId)!.id;
        this.requests.save(sessionId, requestId, { kind: 'JOIN', signature, roomId: active.id, participantId });
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
      this.lifecycle.publish(room);
      return this.lifecycle.view(room, sessionId);
    } catch (error) {
      if (error instanceof RoomError) this.requests.save(sessionId, requestId, {
        kind: 'JOIN', signature, roomId: '', participantId: '', error: { code: error.code, message: error.message }
      });
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
        selected = result.summary;
      }
      if (room.configure(change, selected, this.lifecycle.clock.now())) {
        this.repository.save(room);
        this.lifecycle.publish(room);
      }
      this.requests.save(sessionId, requestId, { kind: 'CONFIGURE', signature, roomId, participantId: room.participantId });
      return this.lifecycle.view(room, sessionId);
    } catch (error) {
      if (error instanceof RoomError) this.requests.save(sessionId, requestId, {
        kind: 'CONFIGURE', signature, roomId, participantId: room.participantId, error: { code: error.code, message: error.message }
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
        this.repository.save(room);
        // Registrar aceptación antes de emitir: perder el ack no permite repetir el reparto.
        this.requests.save(sessionId, requestId, { kind: 'START', signature, roomId, participantId: room.participantId });
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
