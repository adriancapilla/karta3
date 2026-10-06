import type { InitialGameView } from '../shared/contracts/game';

/** Solo presentación de datos públicos; el resultado oficial procede del servidor. */
export function publicPlays(game: InitialGameView): InitialGameView['round']['plays'] {
  const { round, interaction } = game;
  if (interaction.review) {
    return interaction.review.result.ranking.map((entry) => ({
      ...round.plays.find((play) => play.playerId === entry.playerId)!, card: entry.card
    }));
  }
  const plays = [...round.plays];
  if (round.direction === null) return plays;
  const sign = round.direction === 'HIGH' ? -1 : 1;
  return plays.sort((a, b) => sign * (a.card.values[round.activeAttributeId].playValue - b.card.values[round.activeAttributeId].playValue));
}
