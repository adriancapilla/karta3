import type { CardView } from '../../shared/contracts/game.js';
import type { InitialGameRoomView, GameParticipantView } from '../../shared/contracts/room.js';
import type { Card } from '../domain/deck.js';
import type { Room } from './room.js';

/** Proyección explícita por destinatario; no serializa Game ni la instantánea del paquete. */
export function toInitialGameRoomView(room: Room, sessionId: string): InitialGameRoomView {
  const game = room.game!;
  const cardView = (card: Card): CardView => ({ id: card.id, name: card.name, characteristic: card.characteristic,
    imageUrl: room.cardPresentation(card.id).imageUrl, imageAlt: room.cardPresentation(card.id).imageAlt,
    values: Object.fromEntries(game.definition.attributes.map((attribute) => [attribute.id, { ...card.values[attribute.id] }])),
    roundAttribute: card.roundAttribute, note: card.note });
  const participants: GameParticipantView[] = room.participants.map((person) => ({ id: person.id, name: person.name,
    role: person.role, isPlayer: person.isPlayer, presence: person.presence === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
    score: person.isPlayer ? game.score(person.id) : null }));
  const participant = participants.find((person) => person.id === room.participantFor(sessionId)!.id)!;
  return { id: room.id, code: room.code, status: 'IN_GAME', revision: room.revision, participant, participants,
    settings: room.settings, selectedDeck: room.selectedDeck!, game: {
      id: game.id, phase: game.phase, execution: 'INITIAL_TABLE_ONLY', attributes: game.definition.attributes.map((attribute) => ({ ...attribute })),
      round: { number: game.round.number, state: game.round.state, openerPlayerId: game.round.openerPlayerId,
        indicator: cardView(game.round.indicator), activeAttributeId: game.round.activeAttributeId, direction: null, plays: [] },
      drawPileCount: game.drawPile.length, hand: game.players.find((player) => player.id === participant.id)?.hand.map(cardView) ?? []
    } };
}
