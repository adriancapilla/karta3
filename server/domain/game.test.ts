import { describe, expect, it } from 'vitest';
import { Game } from './game.js';
import { validatePackageFormat } from '../infrastructure/decks/packageFormat.js';
import { deckFixture } from '../../tests/support/deckFixtures.js';
import { permuteCards } from '../infrastructure/cardPermutation.js';

const fixture = deckFixture();
const deck = validatePackageFormat(fixture.metadata, fixture.collection, 'prueba').data!.definition;
const ids = deck.cards.map((card) => card.id);
const input = (count: number) => ({ id: 'game', deck, players: Array.from({ length: count }, (_, n) => ({ kind: 'HUMAN' as const, id: `p${n}`, name: `Jugador ${n}` })),
  settings: { turnTimeout: 30 as const, forceTieBreak: true }, permutation: ids });

describe('B06 Game puro con permutación explícita', () => {
  it.each([2, 3, 4, 5])('B06-04/05 conserva 58 ubicaciones y adquisición con %i jugadores', (count) => {
    const game = new Game(input(count));
    const locations = [...game.players.flatMap((player) => player.hand), game.round.indicator, ...game.drawPile];
    expect(locations).toHaveLength(58); expect(new Set(locations.map((card) => card.id)).size).toBe(58);
    expect(game.drawPile).toHaveLength(57 - 3 * count);
    game.players.forEach((player, order) => {
      expect(player.hand.map((card) => card.id)).toEqual([ids[order], ids[count + order], ids[2 * count + order]]);
      expect(player).toMatchObject({ kind: 'HUMAN', status: 'ACTIVE', order, wonCards: [], consecutiveTimeouts: 0 });
      expect(game.score(player.id)).toBe(0);
    });
    expect(game.round).toMatchObject({ number: 1, state: 'WAITING_FOR_DIRECTION', openerPlayerId: 'p0',
      indicator: { id: ids[3 * count] }, activeAttributeId: deck.cards[3 * count].roundAttribute, direction: null, plays: [] });
    expect(game.phase).toBe('PLAYING'); expect(game.settings).toEqual({ turnTimeout: 30, forceTieBreak: true });
    expect(game.definition).toEqual(deck); expect(game.definition).not.toBe(deck);
    expect(Object.isFrozen(game.definition.cards[0].values.atributo1)).toBe(true);
    expect(Object.isFrozen(game.players[0].hand)).toBe(true);
    expect(Object.isFrozen(game)).toBe(true);
    expect(() => { game.players[0].hand.push(deck.cards[0]); }).toThrow();
    expect(Object.isFrozen(deck)).toBe(false);
  });
  it.each([[], ids.slice(1), [...ids.slice(1), ids[1]], [...ids.slice(1), 'ajena'], [...ids, 'extra']].map((permutation) => ({ permutation })))('rechaza permutación incompleta, repetida o ajena', ({ permutation }) => {
    expect(() => new Game({ ...input(2), permutation })).toThrow('INVALID_PERMUTATION');
  });
  it.each([0, 1, 6])('rechaza %i jugadores', (count) => expect(() => new Game(input(count))).toThrow('INVALID_PLAYERS'));
  it('rechaza IDs repetidos y definición inválida sin reparar datos', () => {
    expect(() => new Game({ ...input(2), players: [{ kind: 'HUMAN', id: 'p', name: 'A' }, { kind: 'HUMAN', id: 'p', name: 'B' }] })).toThrow('INVALID_PLAYERS');
    expect(() => new Game({ ...input(2), deck: { ...deck, cards: deck.cards.slice(1) } })).toThrow('INVALID_DECK');
  });
  it('adaptador de entropía real devuelve una permutación completa sin mutar la entrada', () => {
    const before = [...ids];
    for (let run = 0; run < 10; run++) expect([...permuteCards(ids)].sort()).toEqual([...ids].sort());
    expect(ids).toEqual(before);
  });
  it('instantánea conserva definición y valores ante modificaciones de la entrada externa', () => {
    const external = structuredClone(deck); const game = new Game({ ...input(2), deck: external });
    external.attributes[0].name = 'Editado después'; external.cards[0].name = 'Editada después'; external.cards[0].values.atributo1.playValue = -1;
    expect(game.definition).toEqual(deck); expect(game.players[0].hand[0].values.atributo1.playValue).toBe(1);
  });
});
