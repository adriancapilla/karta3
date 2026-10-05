import type { InitialGameRoomView } from '../../shared/contracts/room.js';

/** Forma exacta y ubicaciones autorizadas; compartida solo por las baterías de pruebas. */
export function assertGamePrivacy(view: InitialGameRoomView, ownIds: readonly string[], forbiddenIds: readonly string[], assert: (condition: boolean, reason: string) => void) {
  const keys = (value: object, expected: string[]) => assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()), `Claves: ${Object.keys(value).join(',')}`);
  keys(view, ['id', 'code', 'status', 'revision', 'participant', 'participants', 'settings', 'selectedDeck', 'game']);
  keys(view.game, ['id', 'phase', 'execution', 'attributes', 'round', 'drawPileCount', 'hand', 'interaction', 'ownConsecutiveTimeouts']);
  keys(view.game.round, ['number', 'kind', 'finalRoundIndex', 'playerIds', 'state', 'openerPlayerId', 'indicator', 'activeAttributeId', 'direction', 'plays']);
  keys(view.game.interaction, ['stage', 'turn', 'openingSelection', 'review']);
  if (view.game.interaction.turn) {
    keys(view.game.interaction.turn, ['id', 'playerId', 'timing']);
    if (view.game.interaction.turn.timing) keys(view.game.interaction.turn.timing, ['serverNow', 'startedAt', 'endsAt']);
  }
  if (view.game.interaction.openingSelection) keys(view.game.interaction.openingSelection, ['direction']);
  if (view.game.interaction.review) {
    keys(view.game.interaction.review, ['id', 'serverNow', 'endsAt', 'nextStage', 'result']);
    keys(view.game.interaction.review.result, ['id', 'roundNumber', 'kind', 'ranking', 'winnerPlayerId', 'nextOpenerPlayerId', 'awardedCardCount']);
    for (const entry of view.game.interaction.review.result.ranking) keys(entry, ['playerId', 'card', 'playValue', 'position']);
  }
  for (const play of view.game.round.plays) keys(play, ['playerId', 'card', 'order', 'mode']);
  keys(view.settings, ['deckId', 'deckContentVersion', 'hostPlays', 'turnSeconds', 'forceTieBreak', 'reviewSeconds']);
  keys(view.selectedDeck, ['id', 'schemaVersion', 'contentVersion', 'name', 'subtitle', 'description', 'imageUrl', 'imageAlt']);
  for (const person of [view.participant, ...view.participants]) keys(person, ['id', 'name', 'kind', 'botDifficulty', 'role', 'isPlayer', 'presence', 'score', 'playStatus']);
  assert(view.participant.kind === 'HUMAN' && view.participant.botDifficulty === null, 'Destinatario humano autenticado');
  for (const person of view.participants) assert(person.kind === 'BOT' ? person.role === null && person.presence === null && person.playStatus === null && ['EASY', 'NORMAL'].includes(person.botDifficulty) : person.botDifficulty === null, 'Discriminación pública de jugador');
  for (const attribute of view.game.attributes) keys(attribute, ['id', 'name', 'unit']);
  for (const card of [view.game.round.indicator, ...view.game.hand, ...view.game.round.plays.map((play) => play.card)]) {
    keys(card, ['id', 'name', 'characteristic', 'imageUrl', 'imageAlt', 'values', 'roundAttribute', 'note']);
    keys(card.values, ['atributo1', 'atributo2', 'atributo3']);
    for (const value of Object.values(card.values)) keys(value, ['playValue', 'displayValue', 'unit']);
  }
  assert(JSON.stringify(view.game.hand.map((card) => card.id)) === JSON.stringify(ownIds), 'Mano propia en adquisición');
  const body = JSON.stringify(view);
  for (const id of forbiddenIds) assert(!body.includes(`"${id}"`), `Carta privada filtrada: ${id}`);
  assert(!/sessionId|hostSessionId|imageRef|publication|schemaVersion.*cards|permutation|seed|wonCards|drawPile"|monotonic|generation|consecutiveTimeouts"/.test(body), 'Campos privados adicionales');
}
