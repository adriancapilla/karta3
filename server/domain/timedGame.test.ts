import { describe, expect, it } from 'vitest';
import { Game } from './game.js';
import { deckFixture } from '../../tests/support/deckFixtures.js';
import { validatePackageFormat } from '../infrastructure/decks/packageFormat.js';
import { manualTrace } from '../../tests/support/manualGameTrace.js';

function initial(oldest = 1) {
  const fixture = deckFixture();
  fixture.collection.cards[oldest - 1].roundAttribute = 'atributo2';
  // El indicador activo y el dato mostrado son distintos de la información de la carta en mano.
  fixture.collection.cards.forEach((card) => { card.values.atributo2.playValue = 59 - card.values.atributo1.playValue; });
  const deck = validatePackageFormat(fixture.metadata, fixture.collection, 'prueba').data!.definition;
  const card = deck.cards.find((item) => item.values.atributo1.playValue === oldest)!;
  return new Game({ id: 'timed', deck, players: [{ kind: 'HUMAN', id: 'a', name: 'Ana' }, { kind: 'HUMAN', id: 'b', name: 'Ana' }],
    settings: { turnTimeout: 15, forceTieBreak: false }, permutation: [card.id, ...deck.cards.filter((item) => item.id !== card.id).map((item) => item.id)] });
}
function conserved(game: Game) { expect(game.locations()).toHaveLength(58); expect(new Set(game.locations().map((card) => card.id)).size).toBe(58); }

describe('B08 T1 política pura de vencimiento', () => {
  it.each([[1, 'HIGH'], [29, 'HIGH'], [30, 'LOW'], [58, 'LOW']] as const)('extremo %i usa %s del atributo activo y más antigua', (value, direction) => {
    const before = initial(value); const after = before.timeout('a', null);
    expect(after.round.plays[0]).toMatchObject({ card: { id: before.players[0].hand[0].id }, mode: 'TIMEOUT' });
    expect(after.round.direction).toBe(direction); expect(after.players[0]).toMatchObject({ status: 'ACTIVE', consecutiveTimeouts: 1 });
    expect(before.players[0].consecutiveTimeouts).toBe(0); expect(after.definition).toBe(before.definition); conserved(after);
  });
  it('conserva dirección aceptada del abridor; otro jugador no redefine la oficial', () => {
    let game = initial(1); game = game.timeout('a', 'LOW'); expect(game.round.direction).toBe('LOW');
    game = game.timeout('b', 'HIGH'); expect(game.round.direction).toBe('LOW');
    expect(game.round.plays.map((play) => play.mode)).toEqual(['TIMEOUT', 'TIMEOUT']);
    expect(game.players.every((person) => person.consecutiveTimeouts === 1 && person.status === 'ACTIVE')).toBe(true); conserved(game);
  });
});

function traced(count: number, winners?: readonly number[]) {
  const prepared = manualTrace(count, winners);
  const deck = validatePackageFormat(prepared.fixture.metadata, prepared.fixture.collection, 'manual').data!.definition;
  return { prepared, game: new Game({ id: 'trace', deck, players: Array.from({ length: count }, (_, n) => ({ kind: 'HUMAN' as const, id: `p${n}`, name: 'Ana' })),
    settings: { turnTimeout: 15, forceTieBreak: true }, permutation: deck.cards.map((card) => card.id) }) };
}
function move(game: Game, timeout: boolean, direction: 'HIGH' | 'LOW' = 'HIGH') {
  const player = game.players.find((person) => person.id === game.turn!.playerId)!;
  const next = player.status === 'AUTOMATIC' ? game.automaticPlay(player.id) : timeout ? game.timeout(player.id, game.round.plays.length ? null : direction)
    : game.play(player.id, player.hand[0].id, game.round.plays.length ? null : direction);
  conserved(next); return next;
}
function advance(game: Game) { const next = game.advance(game.tieBreakCardIds.length ? [...game.tieBreakCardIds].reverse() : undefined); conserved(next); return next; }

describe('B08 T2 contador/control y finales puros mediante trazas legales', () => {
  it('1→0→1 por manual completa; 1→2 TIMEOUT y después AUTOMATIC/2 irreversible', () => {
    let game = initial(); game = game.timeout('a', 'HIGH'); game = move(game, false); game = advance(game);
    game = game.play('a', game.players[0].hand[1].id, 'HIGH'); expect(game.players[0].consecutiveTimeouts).toBe(0);
    game = move(game, false); game = advance(game);
    while (game.turn!.playerId !== 'a') game = move(game, false);
    game = game.timeout('a', game.round.plays.length ? null : 'HIGH'); expect(game.players[0].consecutiveTimeouts).toBe(1);
    while (game.turn) game = move(game, false); game = advance(game);
    while (game.turn!.playerId !== 'a') game = move(game, false);
    game = game.timeout('a', game.round.plays.length ? null : 'HIGH'); expect(game.players[0]).toMatchObject({ status: 'AUTOMATIC', consecutiveTimeouts: 2, kind: 'HUMAN' });
    expect(game.round.plays.find((play) => play.playerId === 'a')!.mode).toBe('TIMEOUT');
    expect(() => game.play('a', game.players[0].hand[0].id, null)).toThrow('PLAYER_AUTOMATIC');
    while (game.turn) game = move(game, false); game = advance(game);
    while (game.turn!.playerId !== 'a') game = move(game, false);
    const oldest = game.players[0].hand[0].id; game = game.automaticPlay('a');
    expect(game.round.plays.find((play) => play.playerId === 'a')).toMatchObject({ mode: 'AUTOMATIC', card: { id: oldest } });
    expect(game.players[0].consecutiveTimeouts).toBe(2); conserved(game);
  });
  it.each([2, 3, 4, 5])('%i humanos, mezcla ACTIVE/AUTOMATIC hasta final: 58 ubicaciones por movimiento', (count) => {
    let { game } = traced(count); let moves = 0; let sawFinal = false; let automaticPlays = 0;
    while (game.phase !== 'FINISHED') {
      if (!game.turn) game = advance(game);
      else {
        const player = game.players.find((person) => person.id === game.turn!.playerId)!;
        if (player.status === 'AUTOMATIC') automaticPlays++;
        game = move(game, player.id !== 'p0', game.round.number % 2 ? 'HIGH' : 'LOW');
        expect(++moves).toBeLessThan(65);
      }
      sawFinal ||= game.phase === 'FINAL_PHASE';
    }
    expect(sawFinal).toBe(true); expect(automaticPlays).toBeGreaterThan(0);
    expect(game.players[0]).toMatchObject({ status: 'ACTIVE', consecutiveTimeouts: 0 });
    expect(game.players.slice(1).every((person) => person.status === 'AUTOMATIC' && person.consecutiveTimeouts === 2)).toBe(true);
    expect(game.result).toMatchObject({ endReason: 'DECK_COMPLETED', completedNormally: true });
    expect(game.players.reduce((sum, person) => sum + person.wonCards.length, 0)).toBe(({ 2: 40, 3: 45, 4: 48, 5: 50 } as Record<number, number>)[count]);
  });
  it('base todos automáticos con empate máximo y force: puntúa/revisa sin reponer ni desempatar', () => {
    let { game } = traced(2); while (game.round.number === 1) { if (game.turn) game = move(game, true); else game = advance(game); }
    const pile = game.drawPile;
    while (game.turn) game = move(game, true);
    expect(game.resolution).toMatchObject({ nextStage: 'RESULTS', awardedCardCount: 2, nextOpenerPlayerId: null });
    expect(game.result).toMatchObject({ completedNormally: false, endReason: 'NO_ACTIVE_HUMAN_PLAYERS', winnerIds: ['p0', 'p1'] });
    expect(game.players.map((person) => person.wonCards.length)).toEqual([2, 2]);
    game = advance(game); expect(game.drawPile).toBe(pile); expect(game.players.every((person) => person.hand.length === 2)).toBe(true);
  });
  it.each([17, 19])('inactividad en final iniciada tras ronda %i: prioridad aun si coincide agotamiento', (firstTimeoutRound) => {
    let { game } = traced(2);
    while (game.phase !== 'FINISHED') {
      if (game.turn) game = move(game, game.round.number >= firstTimeoutRound);
      else game = advance(game);
    }
    expect(game.round.number).toBe(firstTimeoutRound + 1); expect(game.drawPile).toHaveLength(0);
    expect(game.result).toMatchObject({ endReason: 'NO_ACTIVE_HUMAN_PLAYERS', completedNormally: false, tieBreakWinnerId: null });
    expect(game.players.every((person) => person.hand.length === (firstTimeoutRound === 17 ? 2 : 0))).toBe(true);
    expect(new Set(game.attributeDiscard.map((card) => card.id)).size).toBe(game.attributeDiscard.length);
  });
  it.each([2, 4, 5])('%i empatados legales, k=3/2/1: último ACTIVE pasa en desempate y se reconoce vencedor', (count) => {
    const preparedCase = traced(count); const { prepared } = preparedCase; let { game } = preparedCase;
    const finalRound = prepared.trace.length;
    while (game.round.kind === 'BASE') {
      if (game.turn) game = move(game, game.round.number >= finalRound - 1 && (game.turn.playerId !== 'p0' || game.round.number === finalRound));
      else game = advance(game);
    }
    expect(game.players.map((person) => person.wonCards.length)).toEqual(prepared.points);
    if (count === 5) expect(prepared.points).toEqual([10, 10, 10, 10, 10]);
    expect(game.players.map((person) => person.hand.length)).toEqual(Array(count).fill(count === 2 ? 3 : count === 4 ? 2 : 1));
    expect(game.players[0]).toMatchObject({ status: 'ACTIVE', consecutiveTimeouts: 1 });
    game = game.timeout('p0', null); conserved(game);
    expect(game.resolution).toBeNull(); expect(game.players.every((person) => person.status === 'AUTOMATIC')).toBe(true);
    while (game.turn) game = move(game, false);
    expect(game.resolution!.awardedCardCount).toBe(0); const winner = game.resolution!.winnerPlayerId;
    expect(game.result).toMatchObject({ endReason: 'NO_ACTIVE_HUMAN_PLAYERS', completedNormally: false, winnerIds: [winner], tieBreakWinnerId: winner });
    game = advance(game); expect(game.players.map((person) => person.wonCards.length)).toEqual(prepared.points); expect(game.result!.standings.every((entry) => entry.position === 1)).toBe(true);
  });
  it('ACTIVE fuera del desempate cuenta en roster base: automáticos empatados terminan normalmente', () => {
    const preparedCase = traced(5, [0, 1, 2, 0, 1, 2, 0, 1, 2, 3]); const { prepared } = preparedCase; let { game } = preparedCase;
    while (game.round.kind === 'BASE') {
      if (game.turn) game = move(game, game.round.number >= 9 && game.turn.playerId !== 'p4'); else game = advance(game);
    }
    expect(prepared.points).toEqual([15, 15, 15, 5, 0]); expect(game.round.playerIds).toEqual(['p0', 'p1', 'p2']);
    expect(game.players[4].status).toBe('ACTIVE');
    while (game.turn) game = move(game, false);
    expect(game.result).toMatchObject({ endReason: 'DECK_COMPLETED', completedNormally: true });
    game = advance(game); expect(game.result!.standings.map((entry) => entry.position)).toEqual([1, 1, 1, 4, 5]);
  });
});
