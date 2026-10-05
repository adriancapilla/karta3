import { initialGameCases } from './initialGameCases.js';
import type { InitialGameRoomView } from '../../shared/contracts/room.js';

export function timedApplication(turn: 15 | 30 | 60 = 15, review: 0 | 5 = 5, count = 2, observer = false) {
  const f = initialGameCases();
  f.configure({ field: 'turnSeconds', value: turn }); f.configure({ field: 'reviewSeconds', value: review });
  if (observer) f.configure({ field: 'hostPlays', value: false });
  f.select(); for (let index = 0; index < count - Number(!observer); index++) f.join(`g${index}`);
  f.start(); let n = 0;
  const context = (requestId = `timed-${++n}`) => ({ requestId, roomId: f.room.id, gameId: f.room.game!.id,
    roundNumber: f.room.game!.round.number, turnId: f.room.game!.turn!.id });
  const session = () => f.room.participants.find((person) => person.id === f.room.game!.turn!.playerId)!.sessionId;
  const input = (requestId?: string) => ({ ...context(requestId), cardId: f.room.game!.players.find((person) => person.id === f.room.game!.turn!.playerId)!.hand[0].id,
    direction: f.room.game!.round.plays.length ? null : 'HIGH' as const });
  const play = () => f.rooms.playCard(session(), input());
  const view = (id = 'g0') => f.rooms.current(id) as InitialGameRoomView;
  return { ...f, context, session, input, play, view };
}
