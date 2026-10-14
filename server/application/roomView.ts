import type { ParticipantView, RoomView } from '../../shared/contracts/room.js';
import type { Room } from './room.js';
import { toInitialGameRoomView } from './initialGameView.js';
import { toResultsRoomView } from './resultsView.js';

export function displayName(room: Room, participantId: string): string {
  const people = room.participants;
  const person = people.find((item) => item.id === participantId);
  if (!person) throw new Error('Participante ausente.');
  const matching = people.filter((item) => item.name === person.name);
  return matching.length === 1 ? person.name : `${person.name} (${matching.findIndex((item) => item.id === participantId) + 1})`;
}

export function toRoomView(room: Room, sessionId: string = room.hostSessionId, serverNow = 0): RoomView {
  if (room.status === 'CLOSED') throw new Error('No se proyecta una sala cerrada.');
  const participant = room.participantFor(sessionId);
  if (!participant) throw new Error('No se proyecta una sala ajena.');
  if (room.status === 'RESULTS') return toResultsRoomView(room, sessionId, serverNow);
  if (room.status === 'IN_GAME') return toInitialGameRoomView(room, sessionId, serverNow);
  return {
    id: room.id,
    code: room.code,
    status: 'WAITING',
    revision: room.revision,
    participant: { id: participant.id, name: participant.name, kind: 'HUMAN', botDifficulty: null, role: participant.role, isPlayer: participant.isPlayer, presence: participant.presence === 'CONNECTED' ? 'CONNECTED' : 'RECONNECTING' },
    participants: room.participants.map((person): ParticipantView => person.kind === 'BOT'
      ? { id: person.id, name: person.name, kind: 'BOT', botDifficulty: person.botDifficulty, role: null, isPlayer: true, presence: null }
      : { id: person.id, name: person.name, kind: 'HUMAN', botDifficulty: null, role: person.role, isPlayer: person.isPlayer, presence: person.presence === 'CONNECTED' ? 'CONNECTED' : 'RECONNECTING' }),
    lifecycle: room.lifecycle(serverNow),
    settings: room.settings,
    selectedDeck: room.selectedDeck,
    deckInformation: room.deckInformation
  };
}
