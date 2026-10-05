import { describe, expect, it } from 'vitest';
import { Game } from './game.js';
import { deckFixture } from '../../tests/support/deckFixtures.js';
import { validatePackageFormat } from '../infrastructure/decks/packageFormat.js';
import { manualTrace } from '../../tests/support/manualGameTrace.js';

const fixture = deckFixture();
const deck = validatePackageFormat(fixture.metadata, fixture.collection, 'prueba').data!.definition;
export const initial = (count = 2, forceTieBreak = false) => new Game({ id: 'game', deck,
  players: Array.from({ length: count }, (_, index) => ({ kind: 'HUMAN' as const, id: `p${index}`, name: `P${index}` })),
  settings: { turnTimeout: 30, forceTieBreak }, permutation: deck.cards.map((card) => card.id) });

describe('B07 M1 apertura y turnos puros', () => {
  it('no hay dirección predeterminada; apertura explícita atómica, sucesor inmutable', () => {
    const game = initial(); const after = game.play('p0', game.players[0].hand[1].id, 'LOW');
    expect(game.round.direction).toBeNull(); expect(game.players[0].hand).toHaveLength(3);
    expect(after.round.direction).toBe('LOW'); expect(after.round.plays[0]).toMatchObject({ playerId: 'p0', order: 1, mode: 'MANUAL' });
    expect(after.players[0].hand.map((card) => card.id)).toEqual([game.players[0].hand[0].id, game.players[0].hand[2].id]);
    expect(after.turn?.playerId).toBe('p1'); expect(after.turn?.id).not.toBe(game.turn?.id);
    expect(after.definition).toBe(game.definition); expect(Object.isFrozen(after)).toBe(true);
  });
  it('rechaza actor, carta ajena/usada/inexistente y dirección incorrecta sin efecto', () => {
    const game = initial(); const card = game.players[0].hand[0].id;
    expect(() => game.play('p1', game.players[1].hand[0].id, 'HIGH')).toThrow('NOT_YOUR_TURN');
    expect(() => game.play('p0', card, null)).toThrow('INVALID_INPUT');
    for (const id of ['ajena', game.players[1].hand[0].id]) expect(() => game.play('p0', id, 'HIGH')).toThrow('CARD_NOT_IN_HAND');
    const after = game.play('p0', card, 'HIGH');
    expect(() => after.play('p0', card, null)).toThrow('NOT_YOUR_TURN');
    expect(() => after.play('p1', game.players[1].hand[0].id, 'LOW')).toThrow('INVALID_INPUT');
    const resolved = after.play('p1', game.players[1].hand[0].id, null);
    expect(resolved.round.state).toBe('RESOLVED');
    const next = resolved.advance();
    expect(next.turn?.playerId).toBe('p0');
    expect(() => next.play('p0', card, 'HIGH')).toThrow('CARD_NOT_IN_HAND'); // nuevo turno vigente, carta ya usada
    conserved(next);
  });
});

describe('B07 M4 empates alcanzables, clasificación y una ronda adicional', () => {
  function base(count: number, force = true, winners?: readonly number[]) {
    const prepared = manualTrace(count, winners);
    const definition = validatePackageFormat(prepared.fixture.metadata, prepared.fixture.collection, 'manual').data!.definition;
    let game = new Game({ id: 'tie', deck: definition, players: Array.from({ length: count }, (_, n) => ({ kind: 'HUMAN' as const, id: `p${n}`, name: `P${n}` })),
      settings: { turnTimeout: 15, forceTieBreak: force }, permutation: definition.cards.map((card) => card.id) });
    for (const expected of prepared.trace) {
      expect(game.round.openerPlayerId).toBe(`p${expected.opener}`);
      while (game.turn) {
        const id = game.turn.playerId; const index = Number(id.slice(1));
        expect(game.players[index].hand[0].id).toBe(expected.cards[index]);
        game = game.play(id, expected.cards[index], game.round.plays.length ? null : expected.direction); conserved(game);
      }
      expect(game.resolution?.winnerPlayerId).toBe(`p${expected.winner}`);
      if (game.resolution?.nextStage === 'ROUND') { game = game.advance(); conserved(game); }
    }
    expect(game.players.map((person) => person.wonCards.length)).toEqual(prepared.points);
    return { game, prepared };
  }
  it.each([[2, 3], [3, 3], [4, 2], [5, 1]])('%i empatados reciben %i, desde indicadoras; puntos intactos y solo una ronda', (count, size) => {
    const { game: finishedBase, prepared } = base(count); expect(finishedBase.resolution?.nextStage).toBe('TIE_BREAK');
    expect(finishedBase.attributeDiscard.map((card) => card.id)).toEqual(prepared.indicators);
    let game = finishedBase.advance([...finishedBase.tieBreakCardIds].reverse()); conserved(game);
    expect(game.phase).toBe('TIE_BREAK'); expect(game.round.number).toBe(prepared.trace.length + 1); expect(game.round.openerPlayerId).toBe('p0');
    expect(game.players.map((person) => person.hand.length)).toEqual(Array(count).fill(size)); expect(game.attributeDiscard).toEqual([]);
    game = round(game, 'LOW'); conserved(game);
    expect(game.resolution?.awardedCardCount).toBe(0); expect(game.resolution?.nextOpenerPlayerId).toBeNull();
    expect(game.players.map((person) => person.wonCards.length)).toEqual(prepared.points);
    expect(game.result?.winnerIds).toHaveLength(1); expect(game.result?.standings.map((person) => person.position)).toEqual(Array(count).fill(1));
    const winner = game.result!.winnerIds[0]; expect(game.result?.standings[0].playerId).toBe(winner);
    game = game.advance(); conserved(game); expect(game.phase).toBe('FINISHED'); expect(game.players.every((person) => !person.hand.length)).toBe(true);
    expect(game.result?.tieBreakWinnerId).toBe(winner); expect(() => game.advance()).toThrow('GAME_FINISHED');
  });
  it.each([false, true])('E6 cinco 15/15/15/5/0, opción %s mantiene puestos 1/1/1/4/5', (force) => {
    const { game } = base(5, force, [0, 1, 2, 0, 1, 2, 0, 1, 2, 3]);
    expect(game.result?.standings.map((person) => person.score)).toEqual([15, 15, 15, 5, 0]);
    expect(game.result?.standings.map((person) => person.position)).toEqual([1, 1, 1, 4, 5]);
    if (force) {
      let tie = game.advance(game.tieBreakCardIds); expect(tie.round.playerIds).toEqual(['p0', 'p1', 'p2']);
      expect(tie.players[3].hand).toEqual([]); expect(tie.players[4].hand).toEqual([]); conserved(tie);
      expect(() => tie.play('p3', 'carta-1', 'HIGH')).toThrow('NOT_YOUR_TURN');
      tie = round(tie); expect(tie.result?.standings.map((person) => person.position)).toEqual([1, 1, 1, 4, 5]);
      expect(tie.result?.winnerIds).toHaveLength(1); conserved(tie.advance());
    } else { expect(game.result?.winnerIds).toEqual(['p0', 'p1', 'p2']); expect(game.advance().phase).toBe('FINISHED'); }
  });
  it('sin opción comparte máximos, ganador único no pide desempate; permutación inválida no muta', () => {
    const shared = base(2, false).game; expect(shared.resolution?.nextStage).toBe('RESULTS'); expect(shared.result?.winnerIds).toEqual(['p0', 'p1']);
    const unique = base(2, true, Array(20).fill(1)).game; expect(unique.resolution?.nextStage).toBe('RESULTS'); expect(unique.result?.winnerIds).toEqual(['p1']);
    const tie = base(5).game;
    for (const permutation of [[], tie.tieBreakCardIds.slice(1), Array(8).fill('bad')]) expect(() => tie.advance(permutation)).toThrow('INVALID_PERMUTATION');
    expect(tie.players.map((person) => person.wonCards.length)).toEqual([10, 10, 10, 10, 10]); conserved(tie);
  });
});

describe('B07 M3 partidas completas 2–5 y fase final', () => {
  it.each([[2, 17, 18, 40], [3, 12, 13, 45], [4, 9, 10, 48], [5, 7, 8, 50]])('%i humanos: %i normales, 3 finales, %i indicadores y %i puntos', (count, normal, discarded, total) => {
    let game = initial(count); let normals = 0; let finals = 0; let indicator = ''; let attribute = '';
    while (game.phase !== 'FINISHED') {
      if (game.phase === 'PLAYING') normals++;
      else {
        finals++; expect(game.round.finalRoundIndex).toBe(finals); expect(game.drawPile).toHaveLength(0);
        expect(game.players.every((person) => person.hand.length === 4 - finals)).toBe(true);
        if (finals === 1) { indicator = game.round.indicator.id; attribute = game.round.activeAttributeId; }
        expect(game.round.indicator.id).toBe(indicator); expect(game.round.activeAttributeId).toBe(attribute);
      }
      expect(game.round.direction).toBeNull();
      const before = game; game = round(game, game.round.number % 2 ? 'HIGH' : 'LOW');
      if (before.phase === 'FINAL_PHASE') expect(game.players.every((person) => person.hand.length === 3 - finals)).toBe(true);
      if (finals === 3) { expect(game.resolution?.nextOpenerPlayerId).toBeNull(); expect(game.resolution?.nextStage).toBe('RESULTS'); }
      game = game.advance(); conserved(game);
    }
    expect(normals).toBe(normal); expect(finals).toBe(3); expect(game.attributeDiscard).toHaveLength(discarded);
    expect(game.players.every((person) => !person.hand.length)).toBe(true);
    expect(game.players.reduce((sum, person) => sum + game.score(person.id), 0)).toBe(total);
    expect(game.attributeDiscard.filter((card) => card.id === indicator)).toHaveLength(1);
    expect(() => game.advance()).toThrow('GAME_FINISHED');
  });
});

function conserved(game: Game) {
  const cards = game.locations().map((card) => card.id);
  expect(cards).toHaveLength(58); expect(new Set(cards).size).toBe(58);
}
function round(game: Game, direction: 'HIGH' | 'LOW' = 'HIGH') {
  let current = game;
  while (current.turn) {
    const id = current.turn.playerId; const hand = current.players.find((person) => person.id === id)!.hand;
    current = current.play(id, hand[0].id, current.round.plays.length ? null : direction); conserved(current);
  }
  return current;
}
describe('B07 M2 ranking, puntos, propiedad y reposición', () => {
  it.each(['HIGH', 'LOW'] as const)('%s compara Jugable, no Dato y adjudica N cartas una vez', (direction) => {
    const game = round(initial(4), direction);
    expect(game.resolution?.ranking.map((entry) => entry.playValue)).toEqual(direction === 'HIGH' ? [4, 3, 2, 1] : [1, 2, 3, 4]);
    expect(game.resolution?.winnerPlayerId).toBe(direction === 'HIGH' ? 'p3' : 'p0');
    expect(game.resolution?.nextOpenerPlayerId).toBe(direction === 'HIGH' ? 'p2' : 'p1');
    expect(game.players.reduce((sum, person) => sum + game.score(person.id), 0)).toBe(4);
    expect(game.players.every((person) => person.hand.length === 2)).toBe(true);
    expect(() => game.play('p0', 'carta-5', 'HIGH')).toThrow('ROUND_IN_REVIEW'); conserved(game);
  });
  it('reposición circular desde segundo, nuevas al final e indicador siguiente', () => {
    const game = round(initial(4)); const next = game.advance();
    expect(next.players.map((person) => person.id)).toEqual(['p0', 'p1', 'p2', 'p3']);
    expect(next.players.map((person) => person.hand.map((card) => card.id))).toEqual([
      ['carta-5', 'carta-9', 'carta-16'], ['carta-6', 'carta-10', 'carta-17'], ['carta-7', 'carta-11', 'carta-14'], ['carta-8', 'carta-12', 'carta-15']]);
    expect(next.round.indicator.id).toBe('carta-18'); expect(next.round.openerPlayerId).toBe('p2');
    expect(next.round.direction).toBeNull(); expect(next.round.number).toBe(2); expect(next.turn?.playerId).toBe('p2');
    expect(next.attributeDiscard.map((card) => card.id)).toEqual(['carta-13']);
    expect(game.players.every((person) => person.hand.length === 2)).toBe(true); conserved(next);
  });
});
