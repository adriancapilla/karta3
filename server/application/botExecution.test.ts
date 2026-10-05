import { expect, it } from 'vitest';
import type { BotOperation, InitialGameRoomView, ResultsRoomView } from '../../shared/contracts/room.js';
import { initialGameCases } from '../../tests/support/initialGameCases.js';
import { botTrace } from '../../tests/support/botTrace.js';
import { botPlayPolicy } from '../domain/botPlay.js';

function setup(count = 3, seed = 3, review: 0 | 5 = 0) {
  const prepared = botTrace(count, seed); const f = initialGameCases({ fixture: prepared.fixture, permutation: (ids) => ids.length === 58 ? prepared.permutation : [...ids] });
  let n = 0;
  const bot = (operation: BotOperation = { type: 'ADD' }, requestId = `bot-${++n}`) => f.rooms.bot('host', requestId, f.room.id, operation);
  f.select(); f.configure({ field: 'reviewSeconds', value: review }); f.configure({ field: 'forceTieBreak', value: true });
  const added = Array.from({ length: count - 1 }, () => bot());
  const start = (id = 'start') => f.start(id) as InitialGameRoomView;
  const human = () => {
    const game = f.room.game!; const player = game.players.find((person) => person.id === game.turn!.playerId)!;
    const choice = botPlayPolicy(player.hand, game.round.activeAttributeId, !game.round.plays.length, game.round.direction, 'NORMAL');
    return f.rooms.playCard('host', { requestId: `human-${++n}`, roomId: f.room.id, gameId: game.id, roundNumber: game.round.number, turnId: game.turn!.id, ...choice });
  };
  const complete = () => {
    let guard = 0;
    while (f.room.status === 'IN_GAME') {
      if (++guard > 200) throw new Error('Continuación bloqueada');
      f.time.advance(0);
      if (f.room.gameReview) f.time.advance(review * 1000);
      else if (f.room.game?.turn) human();
    }
  };
  return { ...f, bot, added, start, human, complete };
}
it.each([2, 3, 4, 5])('B09 P2 inicio único %i mixtos fija preparación, BOT sin reloj; replay Add es vista HOST', (count) => {
  const f = setup(count); const first = f.start();
  expect(first.game.interaction.turn!.playerId).toBe(f.added[0].botId); expect(first.game.interaction.turn!.timing).toBeNull();
  expect(first.game.interaction.openingSelection).toBeNull(); expect(first.game.hand).toHaveLength(3); expect(first.participant.kind).toBe('HUMAN');
  const frozen = f.room.game!; expect(f.room.startPlayers).toBeDefined();
  expect(() => f.bot()).toThrow(expect.objectContaining({ code: 'GAME_ALREADY_STARTED' }));
  expect(f.bot({ type: 'ADD' }, 'bot-1').botId).toBe(f.added[0].botId); // prepare puede procesar un paso; nunca vista BOT
  f.time.advance(0); expect(f.room.game!.turn!.playerId).toBe(f.room.participantId); expect(f.room.gameTurn!.playerId).toBe(f.room.participantId);
  expect(f.room.game!.round.plays.map((play) => play.mode)).toEqual(Array(count - 1).fill('BOT'));
  expect(frozen.players.filter((p) => p.kind === 'BOT').map((p) => p.botDifficulty)).toEqual(Array(count - 1).fill('NORMAL'));
  expect(f.permutation).toHaveBeenCalledTimes(1); expect(f.start().game.id).toBe(first.game.id);
});
it('B09 E5 solo BOT bloqueado; observador/invitado humano inicia, exige conexión humana y conserva índices humanos', () => {
  const f = setup(); f.configure({ field: 'hostPlays', value: false });
  expect(() => f.start()).toThrow(expect.objectContaining({ code: 'START_NOT_READY' }));
  f.join(); f.connected.delete('host'); f.rooms.presenceChanged('host');
  expect(() => f.start('not-connected')).toThrow(expect.objectContaining({ code: 'START_NOT_READY' }));
  f.connected.add('host'); f.rooms.presenceChanged('host'); const view = f.start('ready');
  expect(view.game.hand).toEqual([]); expect(view.game.ownConsecutiveTimeouts).toBeNull();
  expect(f.room.memberSessions).toEqual(['g0', 'host']);
  for (const added of f.added) expect(f.repository.findActiveBySession(added.botId)).toBeUndefined();
});
it.each([0, 5] as const)('B09 review=%i: partida mixta completa, bot-only desempate, registro antes de emisión/replay y retención', (review) => {
  const f = setup(3, 3, review); f.start(); f.time.advance(0);
  const before = f.room.game!; f.events.updated.mockImplementationOnce(() => { throw new Error('emisión perdida'); });
  expect(() => f.human()).toThrow('emisión perdida');
  expect(f.room.game!.players.map((p) => p.hand.length)).not.toEqual(before.players.map((p) => p.hand.length));
  const stored = f.requests.get('host', 'human-3')!; expect(stored).toBeDefined(); expect(stored).not.toHaveProperty('room');
  const oldTask = f.time.tasks.find((task) => task.cancelled && task.at === 0)!;
  const saved = f.room.game; oldTask.callback(); expect(f.room.game).toBe(saved);
  if (review) { const number = f.room.game!.round.number; f.time.advance(4999); expect(f.room.game!.round.number).toBe(number); f.time.advance(1); }
  f.complete(); const result = f.rooms.current('host') as ResultsRoomView;
  expect(result.result.completedNormally).toBe(true); expect(result.result.standings.map((p) => p.score)).toEqual([18, 18, 9]);
  expect(result.result.tieBreakWinnerId).not.toBeNull(); expect(f.permutation).toHaveBeenCalledTimes(2);
  expect(f.bot({ type: 'ADD' }, 'bot-1').room.participant.id).toBe(f.room.participantId);
  expect(() => f.bot()).toThrow(expect.objectContaining({ code: 'GAME_FINISHED' }));
  f.rooms.returnHome('host', { requestId: 'home', roomId: f.room.id, gameId: result.result.gameId });
  f.time.elapse(1000); const next = f.rooms.createOrGet('host'); f.time.elapse(1799000);
  expect(() => f.rooms.getResult('host', result.result.gameId)).toThrow(expect.objectContaining({ code: 'RESULT_NOT_AVAILABLE' }));
  expect(f.repository.findById(f.room.id)).toBeUndefined(); expect(f.repository.findActiveBySession('host')!.id).toBe(next.id);
});
it('B09 E8 sin clientes: segundo TIMEOUT humano termina ronda/review con BOT; ninguna nueva ronda, resultado recuperable', () => {
  const f = setup(3, 3, 5); f.configure({ field: 'turnSeconds', value: 15 }); f.start();
  f.connected.clear(); f.rooms.presenceChanged('host'); f.time.advance(0);
  expect(f.room.participantFor('host')!.presence).toBe('DISCONNECTED');
  f.time.advance(15000); expect(f.room.game!.players.find((p) => p.kind === 'HUMAN')!.consecutiveTimeouts).toBe(1);
  f.time.advance(5000); f.time.advance(15000); // bots por políticas y segundo TIMEOUT de humano
  expect(f.room.game!.result!.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS'); expect(f.room.status).toBe('IN_GAME');
  const round = f.room.game!.round.number; const pile = f.room.game!.drawPile; f.time.advance(5000);
  expect(f.room.status).toBe('RESULTS'); expect(f.room.game!.round.number).toBe(round); expect(f.room.game!.drawPile).toEqual(pile);
  expect(f.events.turnExpired).toHaveBeenCalledTimes(2); expect(f.room.retention!.presentedAt).toBe(f.time.now().unix);
  expect((f.rooms.getResult('host', f.room.game!.id)).result.completedNormally).toBe(false);
  for (const [deliveries] of f.events.updated.mock.calls) expect(deliveries.every((entry: { sessionId: string }) => entry.sessionId === 'host')).toBe(true);
});
it('B09 add/start ambas órdenes: preparación atómica; dos salas comparten continuaciones acotadas', () => {
  for (const startFirst of [true, false]) {
    const f = setup(2); if (startFirst) { f.start(); expect(() => f.bot()).toThrow(expect.objectContaining({ code: 'GAME_ALREADY_STARTED' })); }
    else { f.bot(); f.start(); expect(f.room.game!.players).toHaveLength(3); }
  }
  const f = setup(5); f.start(); const other = f.rooms.createOrGet('other');
  f.rooms.bot('other', 'other-bot', other.id, { type: 'ADD' });
  f.rooms.configure('other', 'other-select', other.id, { field: 'deck', value: { id: 'mixta', contentVersion: 7 } });
  f.rooms.start('other', 'other-start', other.id); f.time.advance(0);
  expect(f.repository.findById(other.id)!.game!.round.plays).toHaveLength(1); expect(f.room.game!.round.plays).toHaveLength(4);
  expect(f.room.gameTurn).not.toBeNull(); expect(f.repository.findById(other.id)!.gameTurn).not.toBeNull();
});
it('B09 E8 desempate ya iniciado: segundo timeout, review final y ganador sin alterar puntos', () => {
  const f = setup(2, 2, 5); f.configure({ field: 'turnSeconds', value: 15 }); f.start();
  while (f.room.game!.round.number < 20 || f.room.game!.round.number === 20 && !f.room.gameReview) {
    f.time.advance(0);
    if (f.room.gameReview) f.time.advance(5000);
    else if (f.room.game!.round.number === 20) f.time.advance(15000);
    else f.human();
  }
  expect(f.room.game!.resolution!.nextStage).toBe('TIE_BREAK'); expect(f.room.game!.players.map((p) => p.wonCards.length)).toEqual([20, 20]);
  f.time.advance(5000); expect(f.room.game!.phase).toBe('TIE_BREAK'); f.time.advance(0); f.time.advance(15000);
  expect(f.room.status).toBe('IN_GAME'); expect(f.room.game!.result!.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS');
  expect(f.room.game!.result!.tieBreakWinnerId).not.toBeNull(); f.time.advance(5000);
  expect(f.room.status).toBe('RESULTS'); expect(f.room.game!.players.map((p) => p.wonCards.length)).toEqual([20, 20]);
});
it('B09 fallo de emisión de paso BOT: estado/tarea ya registrados; callback antiguo/duplicado no repite carta', () => {
  const f = setup(4); f.start();
  const task = f.time.tasks.find((item) => !item.cancelled && item.at === 0)!;
  f.events.updated.mockImplementationOnce(() => { throw new Error('emisión BOT perdida'); });
  task.callback(); const after = f.room.game;
  expect(after!.round.plays).toHaveLength(1); expect(after!.round.plays[0].mode).toBe('BOT');
  expect(f.events.technicalFailure).toHaveBeenCalledTimes(1); task.callback(); expect(f.room.game).toBe(after);
  f.time.advance(0); expect(f.room.game!.round.plays).toHaveLength(3);
  expect(new Set(f.room.game!.round.plays.map((play) => play.card.id)).size).toBe(3);
  expect(f.room.game!.turn!.playerId).toBe(f.room.participantId); expect(f.room.gameTurn).not.toBeNull();
});
