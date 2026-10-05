import { Game, type PlayerPreparation } from '../../server/domain/game.js';
import { botPlayPolicy, type BotDifficulty } from '../../server/domain/botPlay.js';
import { validatePackageFormat } from '../../server/infrastructure/decks/packageFormat.js';
import { deckFixture } from './deckFixtures.js';

/** Entropía sustituida solo en pruebas. Paquete completo validado y actuaciones legales:
 * BOT siempre llama a Game.botPlay; el humano confirma elecciones reproducibles de su propia mano. */
export function botTrace(count: number, seed: number, difficulty: BotDifficulty = 'NORMAL') {
  const fixture = deckFixture('mixta');
  const definition = validatePackageFormat(fixture.metadata, fixture.collection, 'mixta').data!.definition;
  let state = seed;
  const permutation = definition.cards.map((card) => card.id);
  for (let n = permutation.length - 1; n > 0; n--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (n + 1); [permutation[n], permutation[j]] = [permutation[j], permutation[n]];
  }
  const players: PlayerPreparation[] = Array.from({ length: count }, (_, n) => n === count - 1
    ? { id: `p${n}`, name: 'Persona', kind: 'HUMAN' } : { id: `p${n}`, name: `Bot ${n + 1}`, kind: 'BOT', botDifficulty: difficulty });
  const game = new Game({ id: 'mixta', deck: definition, players, settings: { turnTimeout: 15, forceTieBreak: true }, permutation });
  return { fixture, definition, permutation, players, game };
}
export function mixedMove(game: Game) {
  const player = game.players.find((person) => person.id === game.turn!.playerId)!;
  if (player.kind === 'BOT') return game.botPlay(player.id);
  const choice = botPlayPolicy(player.hand, game.round.activeAttributeId, game.round.plays.length === 0, game.round.direction, 'NORMAL');
  return game.play(player.id, choice.cardId, choice.direction);
}
