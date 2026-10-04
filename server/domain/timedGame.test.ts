import { describe, expect, it } from 'vitest';
import { Game } from './game.js';
import { deckFixture } from '../../tests/support/deckFixtures.js';
import { validatePackageFormat } from '../infrastructure/decks/packageFormat.js';

function initial(oldest = 1) {
  const fixture = deckFixture();
  // El indicador activo y el dato mostrado son distintos de la información de la carta en mano.
  fixture.collection.cards.forEach((card) => { card.values.atributo2.playValue = 59 - card.values.atributo1.playValue; });
  const deck = validatePackageFormat(fixture.metadata, fixture.collection, 'prueba').data!.definition;
  const card = deck.cards.find((item) => item.values.atributo1.playValue === oldest)!;
  return new Game({ id: 'timed', deck, players: [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Ana' }],
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
