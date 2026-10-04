import type { OpeningDirectionRequest, PlayCardRequest } from '../../shared/contracts/game.js';
import type { CurrentRoomResponse, LastResult, ResultsRoomView, ReturnHomeRequest, RoomView } from '../../shared/contracts/room.js';
import { GameRuleError } from '../domain/game.js';
import type { CardPermutation, Clock, GameChanges, RoomRepository, RoomRequests, Scheduler } from './ports.js';
import type { Room } from './room.js';
import { RoomError } from './roomError.js';
import { toRoomView } from './roomView.js';
import { toRoundResult } from './initialGameView.js';

export interface GameActions {
  openingDirection(sessionId: string, input: OpeningDirectionRequest): RoomView;
  playCard(sessionId: string, input: PlayCardRequest): RoomView;
  getResult(sessionId: string, gameId: string): ResultsRoomView;
  lastResult(sessionId: string): LastResult | undefined;
  returnHome(sessionId: string, input: ReturnHomeRequest): CurrentRoomResponse;
}

/** Identidad/parciales/solicitudes; Game es quien valida y aplica cartas. Sin IO/await entre decisión y registro. */
export class GameCoordinator implements GameActions {
  private readonly tasks = new Map<string, { context: string; cancel: () => void }>();
  private stopped = false;
  constructor(private readonly repository: RoomRepository, private readonly requests: RoomRequests, private readonly changes: GameChanges,
    private readonly clock: Clock, private readonly scheduler: Scheduler, private readonly permute: CardPermutation) {}

  prepare(): void {
    if (this.stopped) return;
    for (const room of this.repository.allActive()) {
      if (room.status === 'IN_GAME' && room.gameReview && room.gameReview.at <= this.clock.now().monotonic) this.completeReview(room, room.gameReview.id);
      else if (room.status === 'RESULTS' && room.retention!.at <= this.clock.now().monotonic) this.expire(room);
    }
  }
  dispose(): void { this.stopped = true; for (const task of this.tasks.values()) task.cancel(); this.tasks.clear(); }
  private view(room: Room, sessionId: string) { return toRoomView(room, sessionId, this.clock.now().unix); }
  private publish(room: Room) { this.changes.updated(room.activeSessions.map((sessionId) => ({ sessionId, room: this.view(room, sessionId) }))); }
  private completeReview(room: Room, id: string) {
    if (this.stopped || room.status !== 'IN_GAME' || room.gameReview?.id !== id || room.gameReview.at > this.clock.now().monotonic) return;
    let next;
    try { const game = room.game!; next = game.advance(game.tieBreakCardIds.length ? this.permute(game.tieBreakCardIds) : undefined); }
    catch { throw new RoomError('INTERNAL_ERROR', 'No se pudo avanzar la mesa. Recupera el estado.'); }
    this.tasks.get(room.id)?.cancel(); this.tasks.delete(room.id);
    room.applyGame(next);
    if (next.phase === 'FINISHED') { room.presentResult(this.clock.now()); this.scheduleRetention(room); }
    this.repository.save(room); this.publish(room);
  }
  private schedule(room: Room) {
    const review = room.gameReview!;
    const context = `${review.gameId}:${review.roundNumber}:${review.id}`;
    this.tasks.get(room.id)?.cancel();
    this.tasks.set(room.id, { context, cancel: this.scheduler.schedule(review.at - this.clock.now().monotonic, () => {
      if (this.stopped || this.tasks.get(room.id)?.context !== context || this.repository.findById(room.id) !== room) return;
      try { this.completeReview(room, review.id); } catch { this.changes.technicalFailure(); }
    }) });
  }
  private scheduleRetention(room: Room) {
    const context = `${room.game!.id}:results:${room.retention!.at}`;
    this.tasks.set(room.id, { context, cancel: this.scheduler.schedule(room.retention!.at - this.clock.now().monotonic, () => {
      if (this.stopped || this.tasks.get(room.id)?.context !== context || this.repository.findById(room.id) !== room) return;
      if (room.status === 'RESULTS' && room.retention!.at <= this.clock.now().monotonic) this.expire(room);
    }) });
  }
  private expire(room: Room) {
    this.tasks.get(room.id)?.cancel(); this.tasks.delete(room.id);
    this.repository.remove(room.id); this.requests.removeRoom(room.id);
  }

  getResult(sessionId: string, gameId: string): ResultsRoomView {
    this.prepare();
    const room = this.repository.allActive().find((item) => item.status === 'RESULTS' && item.game?.id === gameId);
    if (!room) throw new RoomError('RESULT_NOT_AVAILABLE', 'El resultado ya no está disponible.');
    if (!room.participantFor(sessionId)) throw new RoomError('FORBIDDEN', 'No tienes permiso para este resultado.');
    return this.view(room, sessionId) as ResultsRoomView;
  }

  lastResult(sessionId: string): LastResult | undefined {
    this.prepare();
    const room = [...this.repository.allActive()].reverse().filter((item) => item.status === 'RESULTS' && item.participantFor(sessionId))
      .sort((a, b) => b.retention!.presentedAt - a.retention!.presentedAt)[0];
    return room ? { roomId: room.id, gameId: room.game!.id, expiresAt: room.retention!.expiresAt } : undefined;
  }

  returnHome(sessionId: string, input: ReturnHomeRequest): CurrentRoomResponse {
    this.prepare();
    const view = this.getResult(sessionId, input.gameId);
    if (view.id !== input.roomId) throw new RoomError('STALE_GAME_CONTEXT', 'Ese resultado no corresponde a la sala.');
    const signature = JSON.stringify([input.roomId, input.gameId]);
    const previous = this.requests.get(sessionId, input.requestId);
    if (previous && (previous.kind !== 'RETURN_HOME' || previous.signature !== signature)) throw new RoomError('REQUEST_CONFLICT', 'Esta solicitud ya se utilizó con otros datos.');
    const active = this.repository.findActiveBySession(sessionId);
    const response = (): CurrentRoomResponse => {
      const current = this.repository.findActiveBySession(sessionId); const lastResult = this.lastResult(sessionId);
      return { room: current ? this.view(current, sessionId) : null, ...(lastResult ? { lastResult } : {}) };
    };
    if (previous) {
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return response();
    }
    if (active && active.id !== input.roomId) throw new RoomError('STALE_GAME_CONTEXT', 'Ya tienes otra sala activa. El resultado anterior no la cambia.');
    const room = this.repository.findById(input.roomId)!;
    const changed = room.releaseResultSession(sessionId);
    this.repository.save(room);
    this.requests.save(sessionId, input.requestId, { kind: 'RETURN_HOME', signature, roomId: room.id, participantId: view.participant.id });
    const result = response();
    if (changed) this.changes.resultsHome(sessionId, { id: `${input.gameId}:home:${input.requestId}`, roomId: room.id, gameId: input.gameId, lastResult: result.lastResult ?? null });
    return result;
  }

  openingDirection(sessionId: string, input: OpeningDirectionRequest): RoomView {
    return this.action(sessionId, input, 'OPENING_DIRECTION', (room, playerId) => {
      room.game!.assertActor(playerId);
      if (room.game!.round.plays.length !== 0) throw new RoomError('STALE_GAME_CONTEXT', 'La apertura ya está completa. Recupera la mesa.');
      return room.selectDirection(input.direction);
    }, true);
  }

  playCard(sessionId: string, input: PlayCardRequest): RoomView {
    return this.action(sessionId, input, 'PLAY', (room, playerId) => {
      room.applyGame(room.game!.play(playerId, input.cardId, input.direction));
      if (room.game!.resolution) room.beginReview(this.clock.now());
      return true;
    });
  }

  private action(sessionId: string, input: OpeningDirectionRequest | PlayCardRequest, kind: 'OPENING_DIRECTION' | 'PLAY', apply: (room: Room, playerId: string) => boolean, privateOnly = false): RoomView {
    const room = this.repository.findById(input.roomId);
    if (!room || room.status === 'CLOSED') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
    const person = room.participantFor(sessionId);
    if (!person) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta partida.');
    if (!room.game || room.game.id !== input.gameId) throw new RoomError('STALE_GAME_CONTEXT', 'La partida ha cambiado. Recupera la mesa.');
    const signature = JSON.stringify([input.roomId, input.gameId, input.roundNumber, input.turnId, 'cardId' in input ? input.cardId : null, input.direction]);
    const previous = this.requests.get(sessionId, input.requestId);
    if (previous) {
      if (previous.kind !== kind || previous.signature !== signature) throw new RoomError('REQUEST_CONFLICT', 'Esta solicitud ya se utilizó con otros datos.');
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return this.view(room, sessionId);
    }
    let changed: boolean;
    try {
      if (room.game.phase === 'FINISHED') throw new RoomError('GAME_FINISHED', 'La partida ha terminado.');
      if (room.game.round.state === 'RESOLVED') throw new RoomError('ROUND_IN_REVIEW', 'Espera a que termine la revisión de ronda.');
      if (room.game.round.number !== input.roundNumber || room.game.turn?.id !== input.turnId) throw new RoomError('STALE_GAME_CONTEXT', 'Ese turno ya no está vigente. Recupera la mesa.');
      changed = apply(room, person.id);
    } catch (cause) {
      const error = cause instanceof RoomError ? cause : cause instanceof GameRuleError
        ? new RoomError(cause.code, ({ NOT_YOUR_TURN: 'Ahora juega otra persona.', CARD_NOT_IN_HAND: 'La carta no está en tu mano.', INVALID_INPUT: 'La dirección no corresponde a esta jugada.', ROUND_IN_REVIEW: 'Espera a que termine la revisión.', GAME_FINISHED: 'La partida ha terminado.' })[cause.code])
        : new RoomError('INTERNAL_ERROR', 'No se pudo confirmar la operación. Recupera la mesa.');
      this.requests.save(sessionId, input.requestId, { kind, signature, roomId: room.id, participantId: person.id, error: { code: error.code, message: error.message } });
      throw error;
    }
    this.repository.save(room);
    this.requests.save(sessionId, input.requestId, { kind, signature, roomId: room.id, participantId: person.id });
    if (room.gameReview) this.schedule(room);
    if (changed) {
      try {
        this.changes.updated((privateOnly ? [sessionId] : room.memberSessions).map((id) => ({ sessionId: id, room: this.view(room, id) })));
        if (room.gameReview) this.changes.roundResolved(room.memberSessions, { roomId: room.id, gameId: room.game!.id, result: toRoundResult(room) });
      } finally {
        if (room.gameReview && room.settings.reviewSeconds === 0) this.completeReview(room, room.gameReview.id);
      }
    }
    return this.view(room, sessionId);
  }
}
