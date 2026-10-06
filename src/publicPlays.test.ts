import { describe, expect, it } from 'vitest';
import type { CardView, Direction, InitialGameView } from '../shared/contracts/game';
import { publicPlays } from './publicPlays';

// Fixture de contrato/proyección; no pretende acreditar una partida completa.
function view(direction: Direction | null): InitialGameView {
  const card = (id: string, value: number): CardView => ({ id, name: id, characteristic: '', imageUrl: null, imageAlt: '', note: '', roundAttribute: 'atributo2',
    values: { atributo1: { playValue: value, displayValue: String(700 - value), unit: 'km' }, atributo2: { playValue: 59 - value, displayValue: 'Otro dato', unit: '' } } });
  const cards = [31, 54, 35, 50].map((value, index) => card(`public-${index}`, value));
  return { id: 'game', phase: 'PLAYING', execution: 'TIMED_TURNS', drawPileCount: 42, ownConsecutiveTimeouts: 0, attributes: [], hand: [card('private', 58)],
    round: { number: 1, kind: 'BASE', finalRoundIndex: null, playerIds: ['a', 'b', 'c', 'd'], state: 'WAITING_FOR_PLAYS', openerPlayerId: 'a', indicator: card('indicator', 2), activeAttributeId: 'atributo1', direction,
      plays: cards.map((c, index) => ({ playerId: ['a', 'b', 'c', 'd'][index], card: c, order: index + 1, mode: 'MANUAL' })) },
    interaction: { stage: 'AWAITING_PLAY', turn: null, openingSelection: { direction: 'LOW' }, review: null } };
}
function frozen(game: InitialGameView) {
  const freeze = (object: object) => { Object.freeze(object); for (const value of Object.values(object)) if (value && typeof value === 'object') freeze(value); };
  freeze(game); return game;
}
describe('B12 proyección pública, sin autoridad sobre Game ni mutación', () => {
  it.each([['HIGH', [54, 50, 35, 31], [2, 4, 3, 1]], ['LOW', [31, 35, 50, 54], [1, 3, 4, 2]]] as const)('E1/E2 %s compara J activo y conserva autores/orden oficial/mano', (direction, values, orders) => {
    const game = frozen(view(direction)); const snapshot = structuredClone(game); const projection = publicPlays(game);
    expect(projection.map((play) => play.card.values.atributo1.playValue)).toEqual(values);
    expect(projection.map((play) => play.order)).toEqual(orders); expect(projection.map((play) => play.playerId)).toEqual(orders.map((order) => game.round.plays[order - 1].playerId));
    expect(game).toEqual(snapshot); expect(projection.some((play) => play.card.id === 'private')).toBe(false);
  });
  it.each(['HIGH', 'LOW'] as const)('E4 sin dirección pública no usa la parcial privada %s', (direction) => {
    const game = view(null); game.interaction.openingSelection = { direction }; frozen(game);
    expect(publicPlays(game)).toEqual(game.round.plays); expect(publicPlays(game)).not.toBe(game.round.plays);
  });
  it('la revisión usa el ranking recibido sin recalcularlo ni modificar resultado/plays', () => {
    const game = view('HIGH'); game.interaction.review = { id: 'review', serverNow: 0, endsAt: 5000, nextStage: 'ROUND',
      result: { id: 'result', roundNumber: 1, kind: 'BASE', winnerPlayerId: 'c', nextOpenerPlayerId: 'a', awardedCardCount: 4,
        ranking: [2, 0, 3, 1].map((index, position) => ({ ...game.round.plays[index], playValue: game.round.plays[index].card.values.atributo1.playValue, position: position + 1 })) } };
    frozen(game); const snapshot = structuredClone(game);
    expect(publicPlays(game).map((play) => play.playerId)).toEqual(['c', 'a', 'd', 'b']); expect(game).toEqual(snapshot);
  });
});
