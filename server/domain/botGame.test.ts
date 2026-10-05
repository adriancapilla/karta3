import { expect, it } from 'vitest';
import { Game, type PlayerPreparation } from './game.js';
import { botTrace, mixedMove } from '../../tests/support/botTrace.js';

function conserve(game: Game) {
  expect(game.locations()).toHaveLength(58); expect(new Set(game.locations().map((card) => card.id)).size).toBe(58);
  for (const player of game.players.filter((person) => person.kind === 'BOT')) {
    expect(Object.keys(player).sort()).toEqual(['id', 'displayName', 'order', 'hand', 'wonCards', 'kind', 'botDifficulty'].sort());
  }
}
function base(game: Game, inspect: (game: Game) => void = conserve) {
  while (game.turn || game.resolution?.nextStage === 'ROUND') {
    if (game.turn) game = mixedMove(game);
    else {
      const previous = game; game = game.advance();
      expect(game.round.openerPlayerId).toBe(previous.resolution!.nextOpenerPlayerId);
      if (previous.phase === 'PLAYING') {
        const opener = game.players.findIndex((person) => person.id === game.round.openerPlayerId);
        for (let offset = 0; offset < game.players.length; offset++) {
          const index = (opener + offset) % game.players.length;
          expect(game.players[index].hand.map((card) => card.id)).toEqual([...previous.players[index].hand.map((card) => card.id), previous.drawPile[offset].id]);
        }
      } else expect(game.drawPile).toHaveLength(0);
    }
    inspect(game);
  }
  return game;
}
it.each([2, 3, 4, 5].flatMap((count) => ['EASY', 'NORMAL'].map((difficulty) => ({ count, difficulty: difficulty as 'EASY' | 'NORMAL' }))))(
  'B09 P2 completa $count mixtos con política $difficulty, conservación/adquisición/final y vencedor', ({ count, difficulty }) => {
    const prepared = botTrace(count, 17, difficulty); const final: { round: number; size: number; indicator: string }[] = [];
    let game = base(prepared.game, (next) => {
      conserve(next);
      if (next.phase === 'FINAL_PHASE' && next.round.state === 'RESOLVED') final.push({ round: next.round.finalRoundIndex!, size: next.players[0].hand.length, indicator: next.round.indicator.id });
    });
    expect(final.map((item) => item.size)).toEqual([2, 1, 0]); expect(final.map((item) => item.round)).toEqual([1, 2, 3]);
    expect(new Set(final.map((item) => item.indicator)).size).toBe(1);
    const score = game.players.map((person) => person.wonCards.length);
    expect(score.reduce((a, b) => a + b)).toBe(({ 2: 40, 3: 45, 4: 48, 5: 50 })[count]);
    if (game.resolution!.nextStage === 'TIE_BREAK') {
      game = game.advance([...game.tieBreakCardIds].reverse()); while (game.turn) { game = mixedMove(game); conserve(game); }
      expect(game.resolution!.awardedCardCount).toBe(0); expect(game.players.map((person) => person.wonCards.length)).toEqual(score);
    }
    expect(game.round.plays.some((play) => play.mode === 'BOT')).toBe(true);
    expect(game.result!.completedNormally).toBe(true); conserve(game.advance());
  });
it.each([[2, 2, 3], [3, 3, 3], [4, 56, 2], [5, 98, 1]])('B09 E7 traza %i/seed%i: desempate legal con mano %i y política BOT, humano fuera si procede', (count, seed, size) => {
  let game = base(botTrace(count, seed).game); const scores = game.players.map((person) => person.wonCards.length);
  expect(game.resolution!.nextStage).toBe('TIE_BREAK');
  if (count === 3) { expect(game.result!.winnerIds).toEqual(['p0', 'p1']); expect(game.players[2].status).toBe('ACTIVE'); }
  if (count === 5) expect(scores).toEqual([10, 10, 10, 10, 10]);
  game = game.advance(game.tieBreakCardIds);
  expect(game.players.filter((person) => game.round.playerIds.includes(person.id)).map((person) => person.hand.length)).toEqual(Array(game.round.playerIds.length).fill(size));
  while (game.turn) { game = mixedMove(game); conserve(game); }
  expect(game.players.map((person) => person.wonCards.length)).toEqual(scores);
  expect(game.result!.winnerIds).toHaveLength(1); expect(game.result!.tieBreakWinnerId).toBe(game.resolution!.winnerPlayerId);
  expect(game.result!.endReason).toBe('DECK_COMPLETED'); conserve(game.advance());
});
it.each(['PLAYING', 'FINAL_PHASE'])('B09 E8 inactividad HUMAN en %s completa ronda, bots no evitan final ni fuerzan reposición/desempate', (phase) => {
  let game = botTrace(3, 3).game;
  if (phase === 'FINAL_PHASE') while (game.phase !== phase) game = game.turn ? mixedMove(game) : game.advance();
  while (!game.result) {
    if (!game.turn) { game = game.advance(); continue; }
    const player = game.players.find((person) => person.id === game.turn!.playerId)!;
    game = player.kind === 'BOT' ? game.botPlay(player.id) : game.timeout(player.id, null); conserve(game);
  }
  expect(game.round.plays).toHaveLength(3); expect(game.result.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS');
  expect(game.resolution!.nextStage).toBe('RESULTS'); expect(game.resolution!.awardedCardCount).toBe(3);
  const hands = game.players.map((person) => person.hand.map((card) => card.id)); const pile = game.drawPile;
  game = game.advance(); expect(game.phase).toBe('FINISHED'); expect(game.drawPile).toEqual(pile); expect(game.players.map((person) => person.hand.map((card) => card.id))).toEqual(hands); conserve(game);
});
it('B09 discrimina kind/nivel en ejecución; nadie juega manual/timeout por un bot ni BOT por humano', () => {
  const prepared = botTrace(2, 2); const game = prepared.game; const bot = game.players[0];
  expect(() => game.play(bot.id, bot.hand[0].id, 'HIGH')).toThrow('INVALID_INPUT');
  expect(() => game.timeout(bot.id, null)).toThrow('INVALID_INPUT'); expect(() => game.automaticPlay(bot.id)).toThrow('INVALID_INPUT');
  const human = game.botPlay(bot.id); expect(() => human.botPlay('p1')).toThrow('INVALID_INPUT');
  for (const players of [prepared.players.map((p) => ({ ...p, kind: 'ALIEN' })), prepared.players.map((p) => ({ ...p, kind: 'BOT', botDifficulty: 'HARD' })), prepared.players.map((p) => ({ ...p, kind: 'BOT', botDifficulty: 'NORMAL' }))]) {
    expect(() => new Game({ id: 'bad', deck: prepared.definition, players: players as PlayerPreparation[], settings: game.settings, permutation: prepared.permutation })).toThrow('INVALID_PLAYERS');
  }
});
it('B09 E8 segundo timeout durante desempate ya iniciado: completa/reconoce BOT vencedor sin puntos nuevos', () => {
  let game = botTrace(2, 2).game;
  while (game.turn || game.resolution?.nextStage === 'ROUND') {
    game = !game.turn ? game.advance() : game.turn.playerId === 'p1' && game.round.number === 20 ? game.timeout('p1', null) : mixedMove(game);
    conserve(game);
  }
  expect(game.players[1].consecutiveTimeouts).toBe(1); expect(game.players.map((p) => p.wonCards.length)).toEqual([20, 20]);
  game = game.advance(game.tieBreakCardIds); const scores = game.players.map((p) => p.wonCards.length);
  while (game.turn) { game = game.turn.playerId === 'p1' ? game.timeout('p1', null) : game.botPlay(game.turn.playerId); conserve(game); }
  expect(game.result!.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS'); expect(game.result!.tieBreakWinnerId).not.toBeNull();
  expect(game.result!.winnerIds).toEqual([game.resolution!.winnerPlayerId]); expect(game.players.map((p) => p.wonCards.length)).toEqual(scores);
  expect(game.resolution!.awardedCardCount).toBe(0); conserve(game.advance());
});
