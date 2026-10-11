import type { CancelGameRequest, OpeningDirectionRequest, PlayCardRequest, TurnExpiredEvent } from '../../shared/contracts/game.js';
import type { CurrentRoomResponse, LastResult, ResultsRoomView, ReturnHomeRequest, RoomView } from '../../shared/contracts/room.js';
import { GameRuleError } from '../domain/game.js';
import type { CardPermutation, Clock, GameChanges, RoomRepository, RoomRequests, Scheduler } from './ports.js';
import type { Room } from './room.js';
import { RoomError } from './roomError.js';
import { toRoomView } from './roomView.js';
import { toRoundResult } from './initialGameView.js';

export interface GameActions {
  started(room: Room): void;
  openingDirection(sessionId: string, input: OpeningDirectionRequest): RoomView;
  playCard(sessionId: string, input: PlayCardRequest): RoomView;
  cancelGame(sessionId: string, input: CancelGameRequest): ResultsRoomView;
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
      else if (room.status === 'IN_GAME' && room.gameTurn && room.gameTurn.at <= this.clock.now().monotonic) this.expireTurn(room, room.gameTurn.turnId);
      else if (room.status === 'IN_GAME' && !room.gameReview && !room.gameTurn && room.game!.turn) this.machineStep(room, room.game!.turn!.id, room.gameTaskGeneration);
      else if (room.status === 'RESULTS' && room.retention!.at <= this.clock.now().monotonic) this.expire(room);
    }
  }
  started(room: Room): void { this.activate(room); }
  private setTask(room: Room, context: string, delayMs: number, callback: () => void): void {
    this.tasks.get(room.id)?.cancel();
    const task = { context, cancel: () => {} };
    this.tasks.set(room.id, task);
    task.cancel = this.scheduler.schedule(delayMs, () => {
      if (this.stopped || this.tasks.get(room.id) !== task || this.repository.findById(room.id) !== room) return;
      try { callback(); } catch { this.changes.technicalFailure(); }
    });
  }
  private activate(room: Room): void {
    if (this.stopped || room.status !== 'IN_GAME' || room.gameReview || !room.game!.turn) return;
    room.activateTurn(this.clock.now());
    const deadline = room.gameTurn;
    if (deadline) this.setTask(room, `${deadline.gameId}:${deadline.turnId}:${deadline.generation}`, deadline.at - this.clock.now().monotonic,
      () => this.expireTurn(room, deadline.turnId));
    else {
      const turn = room.game!.turn!; const generation = room.gameTaskGeneration;
      this.setTask(room, `${room.game!.id}:${turn.id}:machine:${generation}`, 0, () => this.machineStep(room, turn.id, generation));
    }
  }
  private machineStep(room: Room, turnId: string, generation: number): void {
    if (this.stopped || room.status !== 'IN_GAME' || room.gameReview || room.gameTurn || room.gameTaskGeneration !== generation
      || room.game!.turn?.id !== turnId) return;
    const actor = room.game!.players.find((person) => person.id === room.game!.turn!.playerId)!;
    if (actor.kind !== 'BOT' && actor.status !== 'AUTOMATIC') return;
    room.applyGame(actor.kind === 'BOT' ? room.game!.botPlay(actor.id) : room.game!.automaticPlay(actor.id));
    this.afterPlay(room); this.repository.save(room);
    try {
      this.publish(room);
      if (room.gameReview) this.changes.roundResolved(room.memberSessions, { roomId: room.id, gameId: room.game!.id, result: toRoundResult(room) });
    } finally { this.continueZeroReview(room); }
  }
  private expireTurn(room: Room, turnId: string): void {
    const deadline = room.gameTurn;
    if (this.stopped || room.status !== 'IN_GAME' || !deadline || deadline.turnId !== turnId || room.game!.turn?.id !== turnId) return;
    if (deadline.at > this.clock.now().monotonic) { this.activate(room); return; }
    const next = room.game!.timeout(deadline.playerId, room.openingDirection);
    room.applyGame(next);
    this.afterPlay(room);
    this.repository.save(room);
    const event: TurnExpiredEvent = { id: `${deadline.gameId}:${turnId}:expired`, roomId: room.id, gameId: deadline.gameId,
      roundNumber: deadline.roundNumber, turnId, playerId: deadline.playerId,
      automatic: next.players.find((person) => person.id === deadline.playerId)!.status === 'AUTOMATIC' };
    try {
      this.publish(room);
      this.changes.turnExpired(room.memberSessions, event);
      if (room.gameReview) this.changes.roundResolved(room.memberSessions, { roomId: room.id, gameId: next.id, result: toRoundResult(room) });
    } finally { this.continueZeroReview(room); }
  }
  private afterPlay(room: Room): void {
    this.tasks.get(room.id)?.cancel(); this.tasks.delete(room.id);
    if (room.game!.resolution) { room.beginReview(this.clock.now()); this.schedule(room); }
    else this.activate(room);
  }
  private continueZeroReview(room: Room): void {
    if (room.gameReview && room.settings.reviewSeconds === 0) this.completeReview(room, room.gameReview.id);
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
    else this.activate(room);
    this.repository.save(room); this.publish(room);
  }
  private schedule(room: Room) {
    const review = room.gameReview!;
    const context = `${review.gameId}:${review.roundNumber}:${review.id}:${room.gameTaskGeneration}`;
    this.setTask(room, context, review.at - this.clock.now().monotonic, () => {
      if (review.at > this.clock.now().monotonic) this.schedule(room);
      else this.completeReview(room, review.id);
    });
  }
  private scheduleRetention(room: Room) {
    const context = `${room.game!.id}:results:${room.retention!.at}`;
    this.setTask(room, context, room.retention!.at - this.clock.now().monotonic, () => {
      if (room.status === 'RESULTS' && room.retention!.at <= this.clock.now().monotonic) this.expire(room);
      else if (room.status === 'RESULTS') this.scheduleRetention(room);
    });
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

  cancelGame(sessionId: string, input: CancelGameRequest): ResultsRoomView {
    this.prepare(); // El límite debido prevalece, incluso si el callback todavía está pendiente.
    const room = this.repository.findById(input.roomId);
    if (!room || room.status === 'CLOSED') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
    const person = room.participantFor(sessionId);
    if (!person || room.hostSessionId !== sessionId) throw new RoomError('FORBIDDEN', 'Solo el anfitrión puede cancelar la partida.');
    if (!room.game || room.game.id !== input.gameId) throw new RoomError('STALE_GAME_CONTEXT', 'La partida ha cambiado. Recupera el estado.');
    const signature = JSON.stringify([input.roomId, input.gameId]);
    const previous = this.requests.get(sessionId, input.requestId);
    if (previous && (previous.kind !== 'CANCEL_GAME' || previous.signature !== signature)) throw new RoomError('REQUEST_CONFLICT', 'Esta solicitud ya se utilizó con otros datos.');
    if (room.status === 'RESULTS' && room.game.result!.endReason !== 'HOST_CANCELLED') throw new RoomError('GAME_FINISHED', 'La partida ha terminado.');
    if (room.status === 'IN_GAME') {
      const recipients = [...room.memberSessions]; // El roster sigue autorizado aunque se liberen sus asociaciones.
      this.tasks.get(room.id)?.cancel(); this.tasks.delete(room.id);
      room.applyGame(room.game.cancel());
      room.presentResult(this.clock.now());
      for (const id of recipients) room.releaseResultSession(id);
      this.repository.save(room);
      this.requests.save(sessionId, input.requestId, { kind: 'CANCEL_GAME', signature, roomId: room.id, participantId: person.id });
      this.scheduleRetention(room);
      this.changes.updated(recipients.map((id) => ({ sessionId: id, room: this.view(room, id) })));
    } else if (!previous) {
      this.requests.save(sessionId, input.requestId, { kind: 'CANCEL_GAME', signature, roomId: room.id, participantId: person.id });
    }
    return this.view(room, sessionId) as ResultsRoomView;
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
    if (changed || room.game!.result!.endReason === 'HOST_CANCELLED') this.changes.resultsHome(sessionId, { id: `${input.gameId}:home:${input.requestId}`, roomId: room.id, gameId: input.gameId, lastResult: result.lastResult ?? null });
    return result;
  }

  openingDirection(sessionId: string, input: OpeningDirectionRequest): RoomView {
    return this.action(sessionId, input, 'OPENING_DIRECTION', (room, playerId) => {
      room.game!.assertManualActor(playerId);
      if (room.game!.round.plays.length !== 0) throw new RoomError('STALE_GAME_CONTEXT', 'La apertura ya está completa. Recupera la mesa.');
      return room.selectDirection(input.direction);
    }, true);
  }

  playCard(sessionId: string, input: PlayCardRequest): RoomView {
    return this.action(sessionId, input, 'PLAY', (room, playerId) => {
      room.applyGame(room.game!.play(playerId, input.cardId, input.direction));
      this.afterPlay(room);
      return true;
    });
  }

  private action(sessionId: string, input: OpeningDirectionRequest | PlayCardRequest, kind: 'OPENING_DIRECTION' | 'PLAY', apply: (room: Room, playerId: string) => boolean, privateOnly = false): RoomView {
    const room = this.repository.findById(input.roomId);
    if (!room || room.status === 'CLOSED') throw new RoomError('ROOM_NOT_AVAILABLE', 'La sala ya no está disponible.');
    const person = room.participantFor(sessionId);
    if (!person) throw new RoomError('FORBIDDEN', 'No tienes permiso para esta partida.');
    if (!room.game || room.game.id !== input.gameId) throw new RoomError('STALE_GAME_CONTEXT', 'La partida ha cambiado. Recupera la mesa.');
    const expiredOnEntry = room.gameTurn?.turnId === input.turnId && room.gameTurn.at <= this.clock.now().monotonic;
    const automaticOnEntry = room.game.turn?.id === input.turnId && room.game.round.number === input.roundNumber
      && room.game.players.find((player) => player.id === person.id)?.status === 'AUTOMATIC';
    this.prepare();
    const signature = JSON.stringify([input.roomId, input.gameId, input.roundNumber, input.turnId, 'cardId' in input ? input.cardId : null, input.direction]);
    const previous = this.requests.get(sessionId, input.requestId);
    if (previous) {
      if (previous.kind !== kind || previous.signature !== signature) throw new RoomError('REQUEST_CONFLICT', 'Esta solicitud ya se utilizó con otros datos.');
      if (previous.error) throw new RoomError(previous.error.code, previous.error.message);
      return this.view(room, sessionId);
    }
    let changed: boolean;
    try {
      if (expiredOnEntry) throw new RoomError('TURN_EXPIRED', 'El tiempo de ese turno terminó. Recupera la mesa.');
      if (automaticOnEntry) throw new RoomError('PLAYER_AUTOMATIC', 'Has pasado a automático; solo puedes ver la partida');
      if (room.game.phase === 'FINISHED') throw new RoomError('GAME_FINISHED', 'La partida ha terminado.');
      if (room.game.round.state === 'RESOLVED') throw new RoomError('ROUND_IN_REVIEW', 'Espera a que termine la revisión de ronda.');
      if (room.game.round.number !== input.roundNumber || room.game.turn?.id !== input.turnId) throw new RoomError('STALE_GAME_CONTEXT', 'Ese turno ya no está vigente. Recupera la mesa.');
      if (room.game.players.find((player) => player.id === person.id)?.status === 'AUTOMATIC') throw new RoomError('PLAYER_AUTOMATIC', 'Has pasado a automático; solo puedes ver la partida');
      changed = apply(room, person.id);
    } catch (cause) {
      const error = cause instanceof RoomError ? cause : cause instanceof GameRuleError
        ? new RoomError(cause.code, ({ NOT_YOUR_TURN: 'Ahora juega otra persona.', CARD_NOT_IN_HAND: 'La carta no está en tu mano.', INVALID_INPUT: 'La dirección no corresponde a esta jugada.', ROUND_IN_REVIEW: 'Espera a que termine la revisión.', GAME_FINISHED: 'La partida ha terminado.', PLAYER_AUTOMATIC: 'Has pasado a automático; solo puedes ver la partida' })[cause.code])
        : new RoomError('INTERNAL_ERROR', 'No se pudo confirmar la operación. Recupera la mesa.');
      this.requests.save(sessionId, input.requestId, { kind, signature, roomId: room.id, participantId: person.id, error: { code: error.code, message: error.message } });
      throw error;
    }
    this.repository.save(room);
    this.requests.save(sessionId, input.requestId, { kind, signature, roomId: room.id, participantId: person.id });
    if (changed) {
      try {
        this.changes.updated((privateOnly ? [sessionId] : room.memberSessions).map((id) => ({ sessionId: id, room: this.view(room, id) })));
        if (room.gameReview) this.changes.roundResolved(room.memberSessions, { roomId: room.id, gameId: room.game!.id, result: toRoundResult(room) });
      } finally {
        this.continueZeroReview(room);
      }
    }
    return this.view(room, sessionId);
  }
}
