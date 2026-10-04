import { afterEach, expect, it } from 'vitest';
import { accepted, manualSockets, socketAck } from '../tests/support/manualSocketCases.js';
import { assertGamePrivacy } from '../tests/support/gamePrivacy.js';
import type { InitialGameRoomView } from '../shared/contracts/room.js';

let stop: (() => Promise<void>) | undefined;
afterEach(async () => { await stop?.(); stop = undefined; });
const boot = async (options: Parameters<typeof manualSockets>[1] = {}) => { const f = await manualSockets(2, { turn: 15, ...options }); stop = f.stop; return f; };
const delivered = () => new Promise<void>((resolve) => setImmediate(resolve));

it.each([14999, 15000, 15001])('B08 T1 HTTP/Socket.IO reales, reloj controlado: manual a %i sin callback', async (elapsed) => {
  const f = await boot(); const actor = f.people[1]; const own = await f.own(actor) as InitialGameRoomView;
  const payload = { requestId: 'edge', roomId: own.id, gameId: own.game.id, roundNumber: 1, turnId: own.game.interaction.turn!.id,
    cardId: own.game.hand[1].id, direction: 'HIGH' };
  f.time.elapse(elapsed); const ack = await socketAck(actor.socket, 'game:play', payload);
  if (elapsed < 15000) expect(accepted(ack).status).toBe('IN_GAME');
  else expect(ack).toMatchObject({ ok: false, error: { code: 'TURN_EXPIRED' } });
  const after = await f.own(actor) as InitialGameRoomView;
  expect(after.game.round.plays[0]).toMatchObject({ card: { id: own.game.hand[elapsed < 15000 ? 1 : 0].id }, mode: elapsed < 15000 ? 'MANUAL' : 'TIMEOUT' });
  expect(after.game.ownConsecutiveTimeouts).toBe(elapsed < 15000 ? 0 : 1);
  await delivered(); expect(actor.expirations).toHaveLength(elapsed < 15000 ? 0 : 1);
  const replay = await socketAck(actor.socket, 'game:play', payload);
  expect(replay.ok).toBe(ack.ok); expect((await f.own(actor) as InitialGameRoomView).game.round.plays).toHaveLength(1);
});

it('B08 T1 vistas privadas/evento exactos: dos pestañas, parcial y único vencimiento', async () => {
  const f = await boot({ observer: true }); const actor = f.people[1]; const tab = await f.tab(actor.cookie);
  const before = await f.own(actor) as InitialGameRoomView;
  const payload = { requestId: 'partial', roomId: before.id, gameId: before.game.id, roundNumber: 1, turnId: before.game.interaction.turn!.id, direction: 'LOW' };
  accepted(await socketAck(actor.socket, 'game:opening-direction', payload));
  const tabView = accepted(await socketAck(tab, 'room:resume', {})) as InitialGameRoomView;
  expect(tabView.game.interaction.openingSelection?.direction).toBe('LOW'); expect((await f.own()).status).toBe('IN_GAME');
  expect((await f.own()).participant.isPlayer).toBe(false);
  f.time.elapse(15000); const after = await f.own(actor) as InitialGameRoomView;
  const callback = f.time.tasks.find((task) => task.at === 15000)!; callback.callback(); callback.callback();
  await delivered(); expect(actor.expirations).toHaveLength(1); expect(f.host.expirations).toHaveLength(1);
  const event = actor.expirations[0]; expect(Object.keys(event).sort()).toEqual(['id', 'roomId', 'gameId', 'roundNumber', 'turnId', 'playerId', 'automatic'].sort());
  expect(event).toMatchObject({ turnId: payload.turnId, playerId: after.participant.id, automatic: false });
  expect(after.game.round.direction).toBe('LOW');
  for (const person of f.people) {
    const view = await f.own(person) as InitialGameRoomView;
    const publicIds = new Set([view.game.round.indicator.id, ...view.game.hand.map((card) => card.id), ...view.game.round.plays.map((play) => play.card.id)]);
    assertGamePrivacy(view, view.game.hand.map((card) => card.id), f.prepared.fixture.collection.cards.map((card) => card.id).filter((id) => !publicIds.has(id)),
      (condition, reason) => expect(condition, reason).toBe(true));
    expect(view.game.ownConsecutiveTimeouts).toBe(person === actor ? 1 : person === f.host ? null : 0);
  }
});

it('B08 T1 ack perdido después de registro: replay recibe vigente sin jugar/reset/avisar de nuevo', async () => {
  const f = await boot(); const actor = f.people[1]; const own = await f.own(actor) as InitialGameRoomView;
  const peer = [...f.channel.sockets.sockets.values()].find((socket) => socket.data.sessionId === actor.sessionId)!;
  const original = peer.listeners('game:play')[0]; peer.removeAllListeners('game:play');
  peer.on('game:play', (payload: unknown) => original(payload, () => {}));
  const payload = { requestId: 'lost', roomId: own.id, gameId: own.game.id, roundNumber: 1, turnId: own.game.interaction.turn!.id, cardId: own.game.hand[0].id, direction: 'HIGH' };
  await expect(socketAck(actor.socket, 'game:play', payload, 50)).rejects.toThrow();
  peer.removeAllListeners('game:play'); peer.on('game:play', original);
  f.time.advance(15000); const current = f.repository.findById(own.id)!.game;
  const replay = accepted(await socketAck(actor.socket, 'game:play', payload)) as InitialGameRoomView;
  expect(replay.game.round.number).toBe(2); expect(f.repository.findById(own.id)!.game).toBe(current);
  expect(actor.expirations).toHaveLength(1); expect(replay.game.ownConsecutiveTimeouts).toBe(0);
});
