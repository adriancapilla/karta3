import { initialGameCases } from './initialGameCases.js';
import { manualTrace } from './manualGameTrace.js';
import type { InitialGameRoomView } from '../../shared/contracts/room.js';
import type { StatisticsRecorder } from '../../server/application/statistics/recording.js';
import type { ControlledTime } from './controlledTime.js';

export function manualApplication(count = 2, options: { observer?: boolean; tie?: boolean; review?: 0 | 5; winners?: readonly number[]; turn?: 15 | 30 | 60; statistics?: StatisticsRecorder; time?: ControlledTime } = {}) {
  const prepared = manualTrace(count, options.winners); const f = initialGameCases({ fixture: prepared.fixture, statistics: options.statistics, time: options.time });
  f.configure({ field: 'reviewSeconds', value: options.review ?? 0 });
  f.configure({ field: 'forceTieBreak', value: options.tie ?? false });
  if (options.turn) f.configure({ field: 'turnSeconds', value: options.turn });
  if (options.observer) f.configure({ field: 'hostPlays', value: false });
  f.select();
  for (let index = 0; index < count - Number(!options.observer); index++) f.join(`g${index}`);
  f.start();
  const sessions = new Map(f.room.participants.map((person) => [person.id, person.sessionId]));
  const playerSessions = f.room.game!.players.map((person) => sessions.get(person.id)!);
  let n = 0;
  const inputs: { session: string; input: Parameters<typeof f.rooms.playCard>[1] }[] = [];
  function play() {
    const session = sessions.get(f.room.game!.turn!.playerId)!;
    const view = f.rooms.getOwn(session, f.room.id) as InitialGameRoomView;
    const input = { requestId: `manual-${++n}`, roomId: f.room.id, gameId: view.game.id, roundNumber: view.game.round.number,
      turnId: view.game.interaction.turn!.id, cardId: view.game.hand[0].id, direction: view.game.round.direction ? null : 'HIGH' as const };
    inputs.push({ session, input });
    return f.rooms.playCard(session, input);
  }
  function completeBase() {
    while (f.room.status === 'IN_GAME' && f.room.game!.round.kind === 'BASE') {
      if (f.room.gameReview) f.time.advance((options.review ?? 0) * 1000);
      else play();
    }
  }
  function complete() {
    while (f.room.status === 'IN_GAME') {
      if (f.room.gameReview) f.time.advance((options.review ?? 0) * 1000);
      else play();
    }
  }
  return { ...f, prepared, playerSessions, inputs, play, completeBase, complete };
}
