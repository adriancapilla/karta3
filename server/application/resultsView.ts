import type { ResultParticipantView, ResultsRoomView } from '../../shared/contracts/room.js';
import type { Room } from './room.js';

/** Resultado no transporta cartas, presencia ni estado interno de Game. Autorización de roster en aplicación. */
export function toResultsRoomView(room: Room, sessionId: string, serverNow: number): ResultsRoomView {
  const game = room.game!; const result = game.result!; const retention = room.retention!;
  const participants = room.participants.map((person): ResultParticipantView => person.kind === 'BOT'
    ? { id: person.id, name: person.name, kind: 'BOT', botDifficulty: person.botDifficulty, role: null, isPlayer: true, score: game.score(person.id) }
    : { id: person.id, name: person.name, kind: 'HUMAN', botDifficulty: null, role: person.role,
      isPlayer: person.isPlayer, score: person.isPlayer ? game.score(person.id) : null });
  return { id: room.id, code: room.code, status: 'RESULTS', revision: room.revision,
    participant: participants.find((person): person is Extract<ResultParticipantView, { kind: 'HUMAN' }> => person.kind === 'HUMAN' && person.id === room.participantFor(sessionId)!.id)!, participants,
    settings: room.settings, selectedDeck: room.selectedDeck!, result: { gameId: game.id, endReason: result.endReason,
      completedNormally: result.completedNormally, standings: result.standings.map((entry) => ({ ...entry })),
      winnerIds: [...result.winnerIds], tieBreakWinnerId: result.tieBreakWinnerId,
      retention: { presentedAt: retention.presentedAt, serverNow, expiresAt: retention.expiresAt } } };
}
