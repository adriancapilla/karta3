import { describe, expect, it } from 'vitest';
import { timedApplication } from '../../tests/support/timedApplicationCases.js';
import type { InitialGameRoomView } from '../../shared/contracts/room.js';

describe('B08 T1 plazo con Clock/Scheduler controlados, sin callback obligatorio', () => {
  it.each([15, 30, 60] as const)('activa %i s antes de publicar/iniciar; replay no reinicia', (seconds) => {
    const f = timedApplication(seconds); const deadline = f.room.gameTurn!;
    const first = f.events.updated.mock.calls.find(([views]) => views[0].room.status === 'IN_GAME')![0][0].room as InitialGameRoomView;
    expect(first.game.interaction.turn!.timing).toEqual({ serverNow: f.time.unixOrigin, startedAt: deadline.startedAt, endsAt: deadline.endsAt });
    expect(deadline.at - deadline.started).toBe(seconds * 1000); f.time.elapse(100);
    f.start(); f.start('new'); f.rooms.resume('g0'); f.rooms.presenceChanged('g0');
    expect(f.room.gameTurn).toBe(deadline); expect(f.permutation).toHaveBeenCalledTimes(1);
    expect(f.view().game.interaction.turn!.timing!.serverNow).toBe(f.time.unixOrigin + 100);
  });
  it.each([14999, 15000, 15001])('manual en %i ms: igualdad vence aunque callback pendiente', (elapsed) => {
    const f = timedApplication(); const input = f.input(); const old = f.time.tasks.at(-1)!;
    f.time.elapse(elapsed);
    if (elapsed < 15000) f.rooms.playCard('g0', input);
    else expect(() => f.rooms.playCard('g0', input)).toThrow('tiempo de ese turno terminó');
    expect(f.room.game!.round.plays).toHaveLength(1); expect(f.room.game!.round.plays[0].mode).toBe(elapsed < 15000 ? 'MANUAL' : 'TIMEOUT');
    expect(f.room.gameTurn!.at).toBe(elapsed + 15000); const current = f.room.game;
    old.callback(); old.callback(); expect(f.room.game).toBe(current);
    expect(f.events.turnExpired).toHaveBeenCalledTimes(elapsed < 15000 ? 0 : 1);
  });
  it.each([14999, 15000, 15001])('dirección en %i ms no renueva ni cuenta si llega en límite', (elapsed) => {
    const f = timedApplication(); const deadline = f.room.gameTurn; const input = { ...f.context(), direction: 'LOW' as const };
    f.time.elapse(elapsed);
    if (elapsed < 15000) { f.rooms.openingDirection('g0', input); expect(f.room.gameTurn).toBe(deadline); f.time.elapse(1); f.rooms.current('host'); }
    else expect(() => f.rooms.openingDirection('g0', input)).toThrow('tiempo de ese turno terminó');
    expect(f.room.game!.round.direction).toBe(elapsed < 15000 ? 'LOW' : 'HIGH');
    expect(f.room.game!.players[0].consecutiveTimeouts).toBe(1); expect(f.room.openingDirection).toBeNull();
  });
  it('parcial modificable/privada/replay no renueva; repetición aplica vencimiento y devuelve vigente', () => {
    const f = timedApplication(); const deadline = f.room.gameTurn; const original = { ...f.context('accepted'), direction: 'HIGH' as const };
    f.rooms.openingDirection('g0', original); f.time.elapse(14000);
    f.rooms.openingDirection('g0', { ...original, requestId: 'low', direction: 'LOW' });
    expect(f.view('host').game.interaction.openingSelection).toBeNull(); expect(f.room.gameTurn).toBe(deadline);
    f.time.elapse(1000); f.rooms.openingDirection('g0', original);
    expect(f.room.game!.round.direction).toBe('LOW'); expect(f.events.turnExpired).toHaveBeenCalledTimes(1);
    f.rooms.openingDirection('g0', original); expect(f.events.turnExpired).toHaveBeenCalledTimes(1);
    expect(() => f.rooms.openingDirection('g0', { ...original, direction: 'LOW' })).toThrow('otros datos');
  });
  it('callback temprano reprograma; retrasado no crea plazos retroactivos y cancelado no avanza', () => {
    const f = timedApplication(); const early = f.time.tasks.at(-1)!; f.time.elapse(1000); early.callback();
    expect(f.room.game!.round.plays).toEqual([]); expect(early.cancelled).toBe(true);
    const current = f.time.tasks.at(-1)!; f.time.elapse(89000); current.callback();
    expect(f.room.game!.round.plays).toHaveLength(1); expect(f.room.gameTurn!.at).toBe(105000);
    early.callback(); current.callback(); expect(f.room.game!.round.plays).toHaveLength(1);
    f.coordinator.dispose(); f.time.advance(100000); expect(f.room.game!.round.plays).toHaveLength(1); expect(f.time.pending).toBe(0);
  });
  it.each([0, 5] as const)('revisión %i: publica ganador y solo después activa duración completa', (review) => {
    const f = timedApplication(15, review); f.time.advance(15000); f.play();
    expect(f.events.roundResolved).toHaveBeenCalledTimes(1);
    if (review) { expect(f.room.gameTurn).toBeUndefined(); f.time.elapse(4999); f.rooms.current('host'); expect(f.room.gameReview).toBeDefined(); f.time.elapse(1); f.rooms.current('host'); }
    expect(f.room.game!.round.number).toBe(2); expect(f.room.gameTurn!.at - f.time.now().monotonic).toBe(15000);
  });
  it('fallo de emisión no reaplica timeout; quedan movimiento y plazo siguiente registrados', () => {
    const f = timedApplication(); f.events.updated.mockImplementationOnce(() => { throw new Error('emisión'); });
    f.time.advance(15000); const game = f.room.game; const deadline = f.room.gameTurn;
    expect(f.events.technicalFailure).toHaveBeenCalledTimes(1); expect(game!.round.plays).toHaveLength(1);
    expect(f.time.pending).toBe(1); f.rooms.resume('g0'); expect(f.room.game).toBe(game); expect(f.room.gameTurn).toBe(deadline);
  });
});
