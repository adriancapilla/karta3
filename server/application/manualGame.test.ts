import { describe, expect, it } from 'vitest';
import { initialGameCases } from '../../tests/support/initialGameCases.js';
import type { InitialGameRoomView } from '../../shared/contracts/room.js';
import { manualApplication } from '../../tests/support/manualApplicationCases.js';

function started() {
  const f = initialGameCases(); f.select(); f.join(); f.start();
  const view = (session = 'g0') => f.rooms.getOwn(session, f.room.id) as InitialGameRoomView;
  const context = (id: string) => ({ requestId: id, roomId: f.room.id, gameId: f.room.game!.id, roundNumber: f.room.game!.round.number, turnId: f.room.game!.turn!.id });
  return { ...f, view, context };
}

describe('B07 M1 permisos, dirección privada y dedupe', () => {
  it('parcial modificable, privada y recuperada sin jugar; repetir anterior no restaura', () => {
    const f = started(); const input = { ...f.context('high'), direction: 'HIGH' as const };
    f.rooms.openingDirection('g0', input);
    expect(f.view().game.interaction.openingSelection?.direction).toBe('HIGH');
    expect(f.view('host').game.interaction.openingSelection).toBeNull(); expect(f.view().game.round.direction).toBeNull();
    expect(f.view().game.round.plays).toEqual([]); expect(f.room.game!.players[0].hand).toHaveLength(3);
    f.rooms.openingDirection('g0', { ...input, requestId: 'low', direction: 'LOW' });
    const revision = f.room.revision; f.rooms.openingDirection('g0', input);
    expect(f.view().game.interaction.openingSelection?.direction).toBe('LOW'); expect(f.room.revision).toBe(revision);
    expect(() => f.rooms.openingDirection('g0', { ...input, direction: 'LOW' })).toThrow('otros datos');
  });
  it('primera apertura completa gana carrera de pestañas; replay antes de exigir turno', () => {
    const f = started(); const input = { ...f.context('play'), cardId: f.view().game.hand[0].id, direction: 'HIGH' as const };
    f.rooms.openingDirection('g0', { ...f.context('partial'), direction: 'LOW' });
    const after = f.rooms.playCard('g0', input) as InitialGameRoomView;
    expect(after.game.round.direction).toBe('HIGH'); expect(after.game.hand).toHaveLength(2);
    expect(after.game.interaction.openingSelection).toBeNull();
    expect(f.rooms.playCard('g0', input)).toEqual(f.view());
    expect(() => f.rooms.playCard('g0', { ...input, requestId: 'second' })).toThrow('turno ya no');
    expect(() => f.rooms.openingDirection('g0', { ...f.context('late'), direction: 'LOW' })).toThrow('otra persona');
    expect(() => f.rooms.playCard('g0', { ...input, cardId: 'other' })).toThrow('otros datos');
  });
  it('identidad y contexto se validan antes de proyectar mano', () => {
    const f = started(); const input = { ...f.context('bad'), cardId: f.view('host').game.hand[0].id, direction: 'HIGH' as const };
    expect(() => f.rooms.playCard('other', input)).toThrow('permiso');
    expect(() => f.rooms.playCard('g0', input)).toThrow('no está en tu mano');
    expect(() => f.rooms.playCard('g0', { ...input, requestId: 'oldgame', gameId: 'old' })).toThrow('partida ha cambiado');
    expect(f.room.game!.round.plays).toEqual([]);
  });
});

describe('B07 M3 coordinación final sin temporizadores de turno', () => {
  it('dos sesiones recorren todas las rondas y revisión final precede finalizar', () => {
    const f = initialGameCases(); f.select(); f.join(); f.start(); let plays = 0;
    const sessions = new Map(f.room.participants.map((person) => [person.id, person.sessionId]));
    while (!(f.room.game!.phase === 'FINAL_PHASE' && f.room.game!.round.finalRoundIndex === 3 && f.room.gameReview)) {
      const session = sessions.get(f.room.game!.turn!.playerId)!;
      const view = f.rooms.getOwn(session, f.room.id) as InitialGameRoomView;
      f.rooms.playCard(session, { requestId: `p${++plays}`, roomId: view.id, gameId: view.game.id, roundNumber: view.game.round.number,
        turnId: view.game.interaction.turn!.id, cardId: view.game.hand[0].id, direction: view.game.round.direction ? null : 'HIGH' });
      if (f.room.gameReview && f.room.gameReview.roundNumber < 20) f.time.advance(5000);
    }
    expect(plays).toBe(40); expect(f.room.game!.phase).toBe('FINAL_PHASE');
    expect((f.rooms.current('host') as InitialGameRoomView).game.interaction.review?.nextStage).toBe('RESULTS');
    expect(f.room.game!.players.reduce((sum, person) => sum + person.wonCards.length, 0)).toBe(40);
    expect(f.room.game!.players.every((person) => !person.hand.length)).toBe(true);
    f.time.elapse(4999); f.rooms.current('host'); expect(f.room.game!.phase).toBe('FINAL_PHASE');
    f.time.elapse(1); f.rooms.current('host'); expect(f.room.game!.phase).toBe('FINISHED');
  });
});

describe('B07 M2 revisión y avance controlados', () => {
  it('contexto anterior y callback cancelado no alteran otra ronda ni otra revisión', () => {
    const f = manualApplication(2, { review: 5 });
    const game = f.room.game!;
    const partial = { requestId: 'direction', roomId: f.room.id, gameId: game.id, roundNumber: 1, turnId: game.turn!.id, direction: 'LOW' as const };
    f.rooms.openingDirection('g0', partial); f.play(); f.play();
    const oldCallback = f.time.tasks.at(-1)!.callback;
    f.time.elapse(5000);
    expect(() => f.rooms.playCard('g0', { ...f.inputs[0].input, requestId: 'old-new' })).toThrow('turno ya no');
    expect(f.room.game!.round.number).toBe(2); expect(f.room.game!.round.plays).toEqual([]);
    f.rooms.openingDirection('g0', partial); // replay recupera; no restaura LOW
    expect(f.room.openingDirection).toBeNull();
    f.play(); f.play(); const current = f.room.game; const review = f.room.gameReview; const revision = f.room.revision;
    oldCallback(); oldCallback();
    expect(f.room.game).toBe(current); expect(f.room.gameReview).toBe(review); expect(f.room.revision).toBe(revision);
    f.time.advance(5000); expect(f.room.game!.round.number).toBe(3);
  });
  it('registrar última jugada antes de emitir permite recuperar ante fallo sin resolver/reponer dos veces', () => {
    const f = manualApplication(2); f.play(); f.events.updated.mockImplementationOnce(() => { throw new Error('emisión'); });
    expect(() => f.play()).toThrow('emisión'); const game = f.room.game; const revision = f.room.revision;
    const { session, input } = f.inputs.at(-1)!;
    expect((f.rooms.playCard(session, input) as InitialGameRoomView).game.round.number).toBe(2);
    expect(f.room.game).toBe(game); expect(f.room.revision).toBe(revision); expect(game!.players.map((person) => person.wonCards.length).reduce((a, b) => a + b)).toBe(2);
    expect(f.permutation).toHaveBeenCalledTimes(1);
  });
  function resolved(seconds: 0 | 5) {
    const f = initialGameCases(); f.configure({ field: 'reviewSeconds', value: seconds }); f.select(); f.join(); f.start();
    const act = (session: string, id: string) => {
      const view = f.rooms.getOwn(session, f.room.id) as InitialGameRoomView;
      return f.rooms.playCard(session, { requestId: id, roomId: view.id, gameId: view.game.id, roundNumber: view.game.round.number,
        turnId: view.game.interaction.turn!.id, cardId: view.game.hand[0].id, direction: view.game.round.direction ? null : 'HIGH' });
    };
    act('g0', 'first'); const ack = act('host', 'last');
    return { ...f, ack, act };
  }
  it('cinco segundos: resolución/puntos antes de reponer, lectura no renueva; igualdad avanza una vez', () => {
    const f = resolved(5); const deadline = f.room.gameReview!; const callbacks = f.time.tasks.map((task) => task.callback);
    expect((f.ack as InitialGameRoomView).game.interaction.stage).toBe('ROUND_REVIEW');
    expect(f.room.game!.players.map((person) => person.hand.length)).toEqual([2, 2]);
    expect(f.room.game!.players.reduce((sum, person) => sum + person.wonCards.length, 0)).toBe(2);
    f.time.elapse(4999); expect((f.rooms.current('g0') as InitialGameRoomView).game.interaction.review?.endsAt).toBe(deadline.unix);
    expect(() => f.rooms.playCard('g0', { requestId: 'review', roomId: f.room.id, gameId: f.room.game!.id, roundNumber: 1, turnId: 'old', cardId: 'carta-3', direction: 'HIGH' })).toThrow('revisión');
    f.time.elapse(1); f.rooms.resume('host'); expect(f.room.game!.round.number).toBe(2);
    const revision = f.room.revision; callbacks.forEach((callback) => callback()); f.time.advance(0);
    expect(f.room.revision).toBe(revision); expect(f.room.game!.players.map((person) => person.hand.length)).toEqual([3, 3]);
  });
  it('cero comunica resuelta/evento antes de habilitar siguiente ronda sin pausa', () => {
    const f = resolved(0);
    expect((f.ack as InitialGameRoomView).game.round.number).toBe(2); expect(f.room.gameReview).toBeUndefined();
    const views = f.events.updated.mock.calls.map(([entries]) => (entries[0].room as InitialGameRoomView));
    const reviewIndex = views.findIndex((view) => view.status === 'IN_GAME' && view.game.interaction.stage === 'ROUND_REVIEW');
    expect(reviewIndex).toBeGreaterThan(0); expect(views[reviewIndex + 1].game.round.number).toBe(2);
    expect(f.events.roundResolved).toHaveBeenCalledTimes(1); expect(f.events.roundResolved.mock.invocationCallOrder[0]).toBeLessThan(f.events.updated.mock.invocationCallOrder.at(-1)!);
    expect(f.time.pending).toBe(0);
  });
  it('fallo de emisión posterior no repite resolución ni reparto al recuperar/repetir', () => {
    const f = resolved(5); f.events.updated.mockImplementationOnce(() => { throw new Error('fallo'); });
    f.time.elapse(5000); expect(() => f.rooms.current('g0')).toThrow('fallo');
    const game = f.room.game; const revision = f.room.revision;
    f.rooms.current('g0'); expect(f.room.game).toBe(game); expect(f.room.revision).toBe(revision);
    expect(f.permutation).toHaveBeenCalledTimes(1);
  });
});
