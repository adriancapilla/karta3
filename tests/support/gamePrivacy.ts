import type { InitialGameRoomView } from '../../shared/contracts/room.js';

/** Forma exacta y ubicaciones autorizadas; compartida solo por las baterías de pruebas. */
export function assertGamePrivacy(view: InitialGameRoomView, ownIds: readonly string[], forbiddenIds: readonly string[], assert: (condition: boolean, reason: string) => void) {
  const keys = (value: object, expected: string[]) => assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()), `Claves: ${Object.keys(value).join(',')}`);
  keys(view, ['id', 'code', 'status', 'revision', 'participant', 'participants', 'settings', 'selectedDeck', 'game']);
  keys(view.game, ['id', 'phase', 'execution', 'attributes', 'round', 'drawPileCount', 'hand']);
  keys(view.game.round, ['number', 'state', 'openerPlayerId', 'indicator', 'activeAttributeId', 'direction', 'plays']);
  keys(view.settings, ['deckId', 'deckContentVersion', 'hostPlays', 'turnSeconds', 'forceTieBreak', 'reviewSeconds']);
  keys(view.selectedDeck, ['id', 'schemaVersion', 'contentVersion', 'name', 'subtitle', 'description', 'imageUrl', 'imageAlt']);
  for (const person of [view.participant, ...view.participants]) keys(person, ['id', 'name', 'role', 'isPlayer', 'presence', 'score']);
  for (const attribute of view.game.attributes) keys(attribute, ['id', 'name', 'unit']);
  for (const card of [view.game.round.indicator, ...view.game.hand]) {
    keys(card, ['id', 'name', 'characteristic', 'imageUrl', 'imageAlt', 'values', 'roundAttribute', 'note']);
    keys(card.values, ['atributo1', 'atributo2', 'atributo3']);
    for (const value of Object.values(card.values)) keys(value, ['playValue', 'displayValue', 'unit']);
  }
  assert(JSON.stringify(view.game.hand.map((card) => card.id)) === JSON.stringify(ownIds), 'Mano propia en adquisición');
  const body = JSON.stringify(view);
  for (const id of forbiddenIds) assert(!body.includes(`"${id}"`), `Carta privada filtrada: ${id}`);
  assert(!/sessionId|hostSessionId|imageRef|publication|schemaVersion.*cards|permutation|seed|wonCards|drawPile"/.test(body), 'Campos privados adicionales');
}
