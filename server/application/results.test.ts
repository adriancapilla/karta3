import { describe, expect, it } from 'vitest';
import { manualApplication } from '../../tests/support/manualApplicationCases.js';
import type { ResultsRoomView } from '../../shared/contracts/room.js';
import type { InitialGameRoomView } from '../../shared/contracts/room.js';

describe('B07 M4 coordinación completa y resultados conservados', () => {
  it.each([2, 3, 4, 5])('%i humanos completan cada jugada, base/desempate y resultado seguro una vez', (count) => {
    const f = manualApplication(count, { tie: true, observer: true }); f.complete();
    const view = f.rooms.current('host') as ResultsRoomView;
    expect(view.status).toBe('RESULTS'); expect(view.participant.score).toBeNull();
    expect(view.result.tieBreakWinnerId).not.toBeNull(); expect(view.result.winnerIds).toHaveLength(1);
    expect(view.result.standings.map((entry) => entry.position)).toEqual(Array(count).fill(1));
    expect(view.participants.filter((person) => person.isPlayer).map((person) => person.score)).toEqual(f.prepared.points);
    expect(Object.keys(view).sort()).toEqual(['id', 'code', 'status', 'revision', 'participant', 'participants', 'settings', 'selectedDeck', 'result'].sort());
    expect(JSON.stringify(view)).not.toMatch(/hand|drawPile|presence|permutation|seed|sessionId|imageRef|wonCards|cards/);
    expect(f.permutation).toHaveBeenCalledTimes(2); expect(f.permutation.mock.calls[1][0]).toHaveLength(f.prepared.indicators.length);
    expect(f.room.game!.locations()).toHaveLength(58); expect(new Set(f.room.game!.locations().map((card) => card.id)).size).toBe(58);
    const time = view.result.retention; const { session, input } = f.inputs[0];
    expect(f.rooms.playCard(session, input)).toEqual(f.rooms.current(session));
    f.rooms.start('host', 'start', f.room.id); expect(f.permutation).toHaveBeenCalledTimes(2);
    expect(() => f.rooms.start('host', 'newstart', f.room.id)).toThrow('terminado');
    expect(() => f.rooms.playCard(session, { ...input, requestId: 'newplay' })).toThrow('terminado');
    expect(() => f.rooms.rename(session, f.room.id, 'X')).toThrow('terminado');
    expect(() => f.rooms.configure('host', 'newconfig', f.room.id, { field: 'forceTieBreak', value: false })).toThrow('terminado');
    f.time.elapse(9999); expect(f.rooms.getResult(session, view.result.gameId).result.retention.expiresAt).toBe(time.expiresAt);
  });
  it.each([false, true])('E6 15/15/15/5/0, opción %s, revisión final y clasificación', (tie) => {
    const f = manualApplication(5, { tie, review: 5, winners: [0, 1, 2, 0, 1, 2, 0, 1, 2, 3] });
    while (f.room.game!.round.number < 10 || !f.room.gameReview) {
      if (f.room.gameReview) f.time.advance(5000); else f.play();
    }
    expect(f.room.status).toBe('IN_GAME'); expect(f.room.gameReview).toBeDefined(); expect(f.room.retention).toBeUndefined();
    expect(f.room.game!.resolution?.nextStage).toBe(tie ? 'TIE_BREAK' : 'RESULTS');
    expect(() => f.rooms.getResult('host', f.room.game!.id)).toThrow('no está disponible');
    f.time.advance(5000);
    if (tie) {
      expect(f.room.game!.phase).toBe('TIE_BREAK'); expect(f.room.game!.players.map((person) => person.hand.length)).toEqual([2, 2, 2, 0, 0]);
      while (!f.room.gameReview) f.play(); expect(f.room.status).toBe('IN_GAME'); expect(f.room.retention).toBeUndefined();
      expect(f.room.game!.resolution?.awardedCardCount).toBe(0); f.time.advance(5000);
    }
    const view = f.rooms.getResult('host', f.room.game!.id);
    expect(view.result.standings.map((entry) => entry.score)).toEqual([15, 15, 15, 5, 0]);
    expect(view.result.standings.map((entry) => entry.position)).toEqual([1, 1, 1, 4, 5]);
    expect(view.result.winnerIds).toHaveLength(tie ? 1 : 3); expect(f.permutation).toHaveBeenCalledTimes(tie ? 2 : 1);
  });
  it('retención empieza tras revisión/publicación: −1, igualdad y después; callback atrasado no renueva', () => {
    const f = manualApplication(2, { review: 5 }); f.complete();
    const gameId = f.room.game!.id; const at = f.room.retention!.at; const stamp = f.room.retention!.presentedAt;
    expect(stamp).toBe(f.time.unixOrigin + 20 * 5000);
    const callbacks = f.time.tasks.map((task) => task.callback);
    f.time.elapse(at - f.time.now().monotonic - 1);
    expect(f.rooms.getResult('host', gameId).result.retention.presentedAt).toBe(stamp);
    f.time.elapse(1); expect(() => f.rooms.getResult('host', gameId)).toThrow('no está disponible');
    expect(f.repository.findById(f.room.id)).toBeUndefined(); expect(f.repository.findActiveByCode(f.room.code)).toBeUndefined();
    expect(f.rooms.resume('host')).toEqual({ room: null }); expect(f.requests.get(f.inputs[0].session, f.inputs[0].input.requestId)).toBeUndefined();
    callbacks.forEach((callback) => callback()); f.time.advance(1);
    expect(() => f.rooms.getResult('host', gameId)).toThrow('no está disponible'); expect(f.time.pending).toBe(0);
  });
  it('E7 retorno/dedupe libera asociación, lectura no revincula, guardar/expirar deja nueva sala intacta', () => {
    const f = manualApplication(2); f.complete(); const gameId = f.room.game!.id;
    const input = { requestId: 'home', roomId: f.room.id, gameId };
    const response = f.rooms.returnHome('host', input); expect(response.room).toBeNull(); expect(response.lastResult?.gameId).toBe(gameId);
    expect(f.events.resultsHome).toHaveBeenCalledTimes(1); expect(f.room.participants).toHaveLength(2);
    expect(f.rooms.current('host')).toBeNull(); expect(f.rooms.current('g0')?.status).toBe('RESULTS');
    const next = f.rooms.createOrGet('host'); expect(next.id).not.toBe(f.room.id); expect(next.code).not.toBe(f.room.code);
    expect(f.rooms.returnHome('host', input).room?.id).toBe(next.id); expect(f.events.resultsHome).toHaveBeenCalledTimes(1);
    expect(() => f.rooms.returnHome('host', { ...input, requestId: 'again' })).toThrow('otra sala');
    expect(f.rooms.getResult('host', gameId).id).toBe(f.room.id); expect(f.rooms.getOwn('host', f.room.id).status).toBe('RESULTS');
    f.repository.save(f.room); expect(f.repository.findActiveBySession('host')?.id).toBe(next.id);
    f.time.advance(1000); f.rooms.rename('host', next.id, 'Nueva');
    f.time.elapse(f.room.retention!.at - f.time.now().monotonic); f.rooms.current('host');
    expect(f.repository.findById(next.id)?.name).toBe('Nueva'); expect(f.repository.findActiveBySession('host')?.id).toBe(next.id);
    expect(f.repository.findActiveByCode(next.code)?.id).toBe(next.id); expect(f.repository.findById(f.room.id)).toBeUndefined();
    expect(f.rooms.lastResult('host')).toBeUndefined();
  });
  it('roster autoriza resultados, observador sin puntos, tercero no lee; retorno bloqueado durante juego', () => {
    const f = manualApplication(2, { observer: true }); const gameId = f.room.game!.id;
    expect(() => f.rooms.returnHome('host', { requestId: 'early', roomId: f.room.id, gameId })).toThrow('no está disponible');
    f.complete(); expect(() => f.rooms.getResult('other', gameId)).toThrow('permiso');
    expect(f.rooms.getResult('host', gameId).participant.score).toBeNull();
    f.rooms.returnHome('host', { requestId: 'home', roomId: f.room.id, gameId });
    expect(f.rooms.getResult('host', gameId).participant.role).toBe('HOST');
    expect(() => f.rooms.join('other', 'newentry', f.room.code, 'Nuevo')).toThrow('terminado');
  });
  it('otro resultado posterior prevalece al repetir retorno anterior; caducar anterior conserva asociación nueva', () => {
    const f = manualApplication(2); f.complete();
    const firstGame = f.room.game!.id; const input = { requestId: 'old-home', roomId: f.room.id, gameId: firstGame };
    f.rooms.returnHome('host', input);
    f.rooms.returnHome('g0', { ...input, requestId: 'guest-home' });
    f.time.advance(1000);
    const next = f.rooms.createOrGet('host');
    f.rooms.configure('host', 'next-deck', next.id, { field: 'deck', value: { id: 'manual', contentVersion: 7 } });
    f.rooms.configure('host', 'next-review', next.id, { field: 'reviewSeconds', value: 0 });
    f.rooms.join('g0', 'next-join', next.code, 'Ana'); f.rooms.start('host', 'next-start', next.id);
    let sequence = 0;
    while (f.rooms.current('host')?.status === 'IN_GAME') {
      const game = f.repository.findById(next.id)!.game!;
      const actor = f.repository.findById(next.id)!.participants.find((person) => person.id === game.turn!.playerId)!;
      const own = f.rooms.getOwn(actor.sessionId, next.id) as InitialGameRoomView;
      f.rooms.playCard(actor.sessionId, { requestId: `next-${++sequence}`, roomId: next.id, gameId: game.id, roundNumber: game.round.number,
        turnId: game.turn!.id, cardId: own.game.hand[0].id, direction: game.round.direction ? null : 'HIGH' });
    }
    expect(sequence).toBe(40);
    const current = f.rooms.current('host') as ResultsRoomView;
    expect(f.rooms.returnHome('host', input).lastResult?.gameId).toBe(current.result.gameId);
    expect(f.rooms.returnHome('host', input).room?.id).toBe(next.id);
    f.time.advance(f.room.retention!.at - f.time.now().monotonic);
    expect(f.repository.findById(f.room.id)).toBeUndefined();
    expect(f.rooms.current('host')?.id).toBe(next.id); expect(f.rooms.lastResult('host')?.gameId).toBe(current.result.gameId);
  });
  it('fallar emisión final o retorno no vuelve a finalizar/barajar/notificar al recuperar', () => {
    const f = manualApplication(2, { review: 5, tie: true });
    f.completeBase(); while (!f.room.gameReview) f.play();
    f.events.updated.mockImplementationOnce(() => { throw new Error('objeto privado no se registra'); });
    f.time.advance(5000); expect(f.events.technicalFailure).toHaveBeenCalledTimes(1); expect(f.room.status).toBe('RESULTS');
    const presentedAt = f.room.retention!.presentedAt; const game = f.room.game;
    const result = f.rooms.current('host') as ResultsRoomView; expect(f.room.game).toBe(game); expect(f.room.retention!.presentedAt).toBe(presentedAt);
    expect(f.permutation).toHaveBeenCalledTimes(2);
    f.events.resultsHome.mockImplementationOnce(() => { throw new Error('error de transporte'); });
    const input = { requestId: 'home', roomId: f.room.id, gameId: result.result.gameId };
    expect(() => f.rooms.returnHome('host', input)).toThrow('transporte');
    expect(f.rooms.returnHome('host', input).room).toBeNull(); expect(f.events.resultsHome).toHaveBeenCalledTimes(1);
  });
  it('entropía inválida al desempatar no deja reparto parcial; revisión aún recuperable', () => {
    const f = manualApplication(5, { review: 5, tie: true });
    while (f.room.game!.round.number < 10 || !f.room.gameReview) { if (f.room.gameReview) f.time.advance(5000); else f.play(); }
    const game = f.room.game; const review = f.room.gameReview; f.permutation.mockImplementationOnce(() => []);
    f.time.advance(5000); expect(f.events.technicalFailure).toHaveBeenCalledTimes(1);
    expect(f.room.game).toBe(game); expect(f.room.gameReview).toBe(review);
    const recovered = f.rooms.current('host'); expect(recovered?.status).toBe('IN_GAME');
    expect(f.room.game!.phase).toBe('TIE_BREAK'); expect(f.room.game!.players.map((person) => person.hand.length)).toEqual([1, 1, 1, 1, 1]);
  });
});
