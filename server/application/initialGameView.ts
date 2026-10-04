import type { CardView, RoundResultView } from '../../shared/contracts/game.js';
import type { InitialGameRoomView, GameParticipantView } from '../../shared/contracts/room.js';
import type { Card } from '../domain/deck.js';
import type { Room } from './room.js';

export function toCardView(room: Room, card: Card): CardView {
  return { id: card.id, name: card.name, characteristic: card.characteristic,
    imageUrl: room.cardPresentation(card.id).imageUrl, imageAlt: room.cardPresentation(card.id).imageAlt,
    values: Object.fromEntries(room.game!.definition.attributes.map((attribute) => [attribute.id, { ...card.values[attribute.id] }])),
    roundAttribute: card.roundAttribute, note: card.note };
}
export function toRoundResult(room: Room): RoundResultView {
  const result = room.game!.resolution!;
  return { id: result.id, roundNumber: result.roundNumber, kind: result.kind,
    ranking: result.ranking.map((entry) => ({ playerId: entry.playerId, card: toCardView(room, entry.card), playValue: entry.playValue, position: entry.position })),
    winnerPlayerId: result.winnerPlayerId, nextOpenerPlayerId: result.nextOpenerPlayerId, awardedCardCount: result.awardedCardCount };
}

/** Proyección explícita por destinatario; no serializa Game ni la instantánea del paquete. */
export function toInitialGameRoomView(room: Room, sessionId: string, serverNow = 0): InitialGameRoomView {
  const game = room.game!;
  const cardView = (card: Card) => toCardView(room, card);
  const participants: GameParticipantView[] = room.participants.map((person) => ({ id: person.id, name: person.name,
    role: person.role, isPlayer: person.isPlayer, presence: person.presence === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
    score: person.isPlayer ? game.score(person.id) : null }));
  const participant = participants.find((person) => person.id === room.participantFor(sessionId)!.id)!;
  return { id: room.id, code: room.code, status: 'IN_GAME', revision: room.revision, participant, participants,
    settings: room.settings, selectedDeck: room.selectedDeck!, game: {
      id: game.id, phase: game.phase, execution: 'MANUAL_WITHOUT_TURN_TIMEOUT', attributes: game.definition.attributes.map((attribute) => ({ ...attribute })),
      round: { number: game.round.number, kind: game.round.kind, finalRoundIndex: game.round.finalRoundIndex, playerIds: [...game.round.playerIds], state: game.round.state, openerPlayerId: game.round.openerPlayerId,
        indicator: cardView(game.round.indicator), activeAttributeId: game.round.activeAttributeId, direction: game.round.direction,
        plays: game.round.plays.map((play) => ({ playerId: play.playerId, card: cardView(play.card), order: play.order, mode: play.mode })) },
      interaction: room.gameReview ? { stage: 'ROUND_REVIEW', turn: null, openingSelection: null,
        review: { id: room.gameReview.id, serverNow, endsAt: room.gameReview.unix, nextStage: game.resolution!.nextStage, result: toRoundResult(room) } }
        : { stage: 'AWAITING_PLAY', turn: game.turn, openingSelection: game.round.plays.length === 0 && game.turn?.playerId === participant.id ? { direction: room.openingDirection } : null, review: null },
      drawPileCount: game.drawPile.length, hand: game.players.find((player) => player.id === participant.id)?.hand.map(cardView) ?? []
    } };
}
