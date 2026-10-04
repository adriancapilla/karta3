import { describe, expect, it } from 'vitest';
import { timedApplication } from '../../tests/support/timedApplicationCases.js';
import type { InitialGameRoomView } from '../../shared/contracts/room.js';
import { manualApplication } from '../../tests/support/manualApplicationCases.js';

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

describe('B08 T2 coordinación automática y revisión/retención con tiempo controlado', () => {
  it('solo manual completa nueva resetea: parcial/replay/invalidación/reconexión conservan fallo', () => {
    const f = timedApplication(15, 0); const accepted = f.input('old-accepted'); f.rooms.playCard('g0', accepted); f.play();
    f.time.advance(15000); expect(f.room.game!.players[0].consecutiveTimeouts).toBe(1); f.play();
    const deadline = f.room.gameTurn; const partial = { ...f.context('partial'), direction: 'LOW' as const };
    f.rooms.openingDirection('g0', partial); f.rooms.openingDirection('g0', partial);
    f.rooms.playCard('g0', accepted);
    expect(() => f.rooms.playCard('g0', { ...f.input('bad'), cardId: 'missing' })).toThrow('no está en tu mano');
    f.connected.delete('g0'); f.rooms.presenceChanged('g0'); f.connected.add('g0'); f.rooms.presenceChanged('g0'); f.rooms.resume('g0');
    expect(f.room.game!.players[0].consecutiveTimeouts).toBe(1); expect(f.room.gameTurn).toBe(deadline);
    f.play(); expect(f.room.game!.players[0]).toMatchObject({ status: 'ACTIVE', consecutiveTimeouts: 0 });
    f.play(); f.time.advance(15000); expect(f.room.game!.players[0]).toMatchObject({ status: 'ACTIVE', consecutiveTimeouts: 1 });
  });
  it('segundo TIMEOUT pasa a automático; vistas propias/read/gestos nuevos y replay histórico coherentes', () => {
    const f = timedApplication(15, 0); const partial = { ...f.context('remembered'), direction: 'HIGH' as const };
    f.rooms.openingDirection('g0', partial); f.time.advance(15000); f.play(); f.time.advance(15000);
    const player = f.room.game!.players[0]; expect(player).toMatchObject({ status: 'AUTOMATIC', consecutiveTimeouts: 2 });
    expect(f.room.game!.round.plays[0].mode).toBe('TIMEOUT'); expect(f.room.gameTurn!.playerId).not.toBe(player.id);
    const current = f.room.game!; const context = f.context('manipulated');
    expect(() => f.rooms.playCard('g0', { ...context, cardId: player.hand[0].id, direction: null })).toThrow('Has pasado a automático');
    const replay = f.rooms.openingDirection('g0', partial) as InitialGameRoomView;
    expect(replay.participant.playStatus).toBe('AUTOMATIC'); expect(replay.game.ownConsecutiveTimeouts).toBe(2);
    expect(replay.game.interaction.openingSelection).toBeNull(); expect(f.room.game).toBe(current);
    f.play(); const queued = f.time.tasks.at(-1)!; expect(f.room.gameTurn).toBeUndefined();
    const before = f.room.game; const newContext = f.context('automatic-turn');
    expect(() => f.rooms.openingDirection('g0', { ...newContext, direction: 'LOW' })).toThrow('Has pasado a automático');
    expect(f.room.game).not.toBe(before); expect(f.room.game!.round.plays[0].mode).toBe('AUTOMATIC');
    const after = f.room.game; queued.callback(); queued.callback(); expect(f.room.game).toBe(after);
    expect(f.events.turnExpired).toHaveBeenCalledTimes(2); expect(f.room.game!.players[0].consecutiveTimeouts).toBe(2);
  });
  it.each([0, 5] as const)('sin clientes, revisión %i: final por inactividad tras puntuar, retención desde publicación', (review) => {
    const f = timedApplication(15, review, 3, true);
    f.connected.clear(); f.room.memberSessions.forEach((session) => f.rooms.presenceChanged(session));
    const oldTasks = [...f.time.tasks];
    // Dos oportunidades vencidas por humano, con revisión y publicaciones reales del caso de uso.
    while (f.room.status === 'IN_GAME') {
      if (f.room.gameReview) f.time.advance(review * 1000);
      else if (f.room.gameTurn) f.time.advance(f.room.gameTurn.at - f.time.now().monotonic);
      else f.time.advance(0);
      expect(f.room.game!.locations()).toHaveLength(58); expect(new Set(f.room.game!.locations().map((card) => card.id)).size).toBe(58);
    }
    expect(f.room.game!.result).toMatchObject({ endReason: 'NO_ACTIVE_HUMAN_PLAYERS', completedNormally: false, tieBreakWinnerId: null });
    expect(f.room.game!.players.reduce((sum, person) => sum + person.wonCards.length, 0)).toBe(6);
    expect(f.room.game!.drawPile.length).toBeGreaterThan(0); expect(f.room.gameTurn).toBeUndefined(); expect(f.room.gameReview).toBeUndefined();
    expect(f.time.pending).toBe(1); expect(f.room.retention!.at).toBe(f.time.now().monotonic + 1800000);
    const result = f.rooms.getResult('host', f.room.game!.id); expect(result.participant.isPlayer).toBe(false);
    const published = f.room.retention!.presentedAt;
    f.time.elapse(1); expect(f.rooms.getResult('host', f.room.game!.id).result.retention.presentedAt).toBe(published);
    f.rooms.returnHome('host', { requestId: 'home', roomId: f.room.id, gameId: f.room.game!.id });
    f.connected.add('host'); const newer = f.rooms.createOrGet('host');
    oldTasks.forEach((task) => task.callback()); expect(f.rooms.current('host')!.id).toBe(newer.id);
    // La nueva espera recibe actividad para seguir viva hasta la caducidad del resultado anterior.
    f.time.elapse(1799998); f.rooms.rename('host', newer.id, 'Nueva'); f.time.elapse(1);
    expect(() => f.rooms.getResult('host', f.room.game!.id)).toThrow('ya no está disponible');
    expect(f.rooms.current('host')!.id).toBe(newer.id); expect(f.repository.findActiveByCode(newer.code)!.id).toBe(newer.id);
  });
  it('paso automático acotado cede al siguiente callback; otra sala responde y fallo de emisión no repite', () => {
    const f = timedApplication(15, 0); f.time.advance(15000); f.play(); f.time.advance(15000); f.play();
    const task = f.time.tasks.at(-1)!; const before = f.room.game; f.events.updated.mockImplementationOnce(() => { throw new Error('emit'); });
    task.callback(); expect(f.room.game).not.toBe(before); expect(f.room.game!.round.plays).toHaveLength(1);
    expect(f.events.technicalFailure).toHaveBeenCalledTimes(1); const after = f.room.game;
    task.callback(); expect(f.room.game).toBe(after); expect(f.rooms.createOrGet('other').status).toBe('WAITING');
    const turnTask = f.time.tasks.filter((item) => !item.cancelled && !item.fired && item.at === f.room.gameTurn!.at)[0];
    f.coordinator.dispose(); turnTask.callback(); f.time.advance(100000); expect(f.room.game).toBe(after); expect(f.time.pending).toBe(0);
  });
  it('traza cinco a 10: revisión base→plazo desempate→todos automáticos→revisión→resultado sin puntos nuevos', () => {
    const f = manualApplication(5, { observer: true, tie: true, review: 5, turn: 15 });
    const survivor = f.room.game!.players[0].id;
    while (f.room.game!.round.kind === 'BASE') {
      if (f.room.gameReview) f.time.advance(5000);
      else {
        const game = f.room.game!; const session = f.room.participants.find((person) => person.id === game.turn!.playerId)!.sessionId;
        if (game.round.number >= 9 && (game.turn!.playerId !== survivor || game.round.number === 10)) {
          if (!game.round.plays.length) f.rooms.openingDirection(session, { requestId: `partial-${game.turn!.id}`, roomId: f.room.id,
            gameId: game.id, roundNumber: game.round.number, turnId: game.turn!.id, direction: 'HIGH' });
          f.time.advance(15000);
        } else f.play();
      }
    }
    expect(f.room.game!.players.map((person) => person.wonCards.length)).toEqual([10, 10, 10, 10, 10]);
    const deadline = f.room.gameTurn!; expect(deadline.at - deadline.started).toBe(15000); const old = f.time.tasks.at(-1)!;
    f.time.advance(15000); expect(f.room.status).toBe('IN_GAME'); expect(f.room.gameReview).toBeDefined(); expect(f.room.gameTurn).toBeUndefined();
    expect(f.room.game!.round.plays.map((play) => play.mode)).toEqual(['TIMEOUT', 'AUTOMATIC', 'AUTOMATIC', 'AUTOMATIC', 'AUTOMATIC']);
    const resolution = f.room.game!.resolution!; expect(resolution.awardedCardCount).toBe(0); f.time.elapse(4999); f.rooms.current('host'); expect(f.room.status).toBe('IN_GAME');
    f.time.elapse(1); f.rooms.current('host'); expect(f.room.status).toBe('RESULTS'); expect(f.room.game!.result).toMatchObject({ endReason: 'NO_ACTIVE_HUMAN_PLAYERS', tieBreakWinnerId: resolution.winnerPlayerId });
    expect(f.room.game!.players.map((person) => person.wonCards.length)).toEqual([10, 10, 10, 10, 10]);
    const finished = f.room.game; old.callback(); expect(f.room.game).toBe(finished);
  });
});
