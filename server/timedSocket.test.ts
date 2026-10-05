import { afterEach, expect, it, vi } from 'vitest';
import { accepted, manualSockets, socketAck } from '../tests/support/manualSocketCases.js';
import { assertGamePrivacy } from '../tests/support/gamePrivacy.js';
import type { InitialGameRoomView } from '../shared/contracts/room.js';
import type { ResultsRoomView } from '../shared/contracts/room.js';
import request from 'supertest';

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
    expect(view.game.interaction.turn!.timing!.startedAt).toBe(before.game.interaction.turn!.timing!.endsAt);
    expect(view.game.interaction.turn!.timing!.endsAt).toBe(before.game.interaction.turn!.timing!.endsAt + 15000);
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

it.each([0, 5] as const)('B08 T2 sin transportes, revisión %i: continúa hasta resultado/retención y recupera por cookie', async (review) => {
  const f = await boot({ observer: true, review, tie: true });
  f.people.forEach((person) => person.socket.disconnect());
  await new Promise<void>((resolve) => setTimeout(resolve, 20));
  const room = f.repository.findById(f.room.id)!;
  expect(room.participants.every((person) => person.presence === 'DISCONNECTED')).toBe(true);
  while (room.status === 'IN_GAME') {
    if (room.gameReview) f.time.advance(review * 1000);
    else if (room.gameTurn) f.time.advance(room.gameTurn.at - f.time.now().monotonic);
    else f.time.advance(0);
    expect(new Set(room.game!.locations().map((card) => card.id)).size).toBe(58);
  }
  expect(room.game!.round.number).toBe(2); expect(room.game!.players.map((p) => p.wonCards.length).reduce((a, b) => a + b)).toBe(4);
  expect(f.time.pending).toBe(1); expect(room.retention!.at).toBe(f.time.now().monotonic + 1800000);
  const restored = await f.tab(f.host.cookie);
  const result = accepted(await socketAck(restored, 'room:resume', {})) as ResultsRoomView;
  expect(result.result).toMatchObject({ endReason: 'NO_ACTIVE_HUMAN_PLAYERS', completedNormally: false });
  expect(result.participant.isPlayer).toBe(false);
  const body = JSON.stringify(result);
  expect(body).not.toMatch(/hand|drawPile|monotonic|generation|consecutiveTimeouts|openingSelection|seed|sessionId|imageRef/);
  const denied = await request(f.base).get(`/api/results/${room.game!.id}`);
  expect(denied.body).toMatchObject({ error: { code: 'SESSION_REQUIRED' } });
  const outsider = await f.session();
  expect((await request(f.base).get(`/api/results/${room.game!.id}`).set('Cookie', outsider.cookie)).body).toMatchObject({ error: { code: 'FORBIDDEN' } });
  const end = room.retention!.at; f.time.elapse(1799999);
  expect((await f.own()).status).toBe('RESULTS'); expect(room.retention!.at).toBe(end);
  f.time.elapse(1); expect(await f.own()).toBeNull(); expect(f.repository.findById(room.id)).toBeUndefined(); expect(f.time.pending).toBe(0);
});

it('B08 T2 automático sigue HUMAN, público sin contadores ajenos; permisos/replay y pasos únicos', async () => {
  const f = await boot({ observer: true }); const person = f.people[1]; const tab = await f.tab(person.cookie);
  const own = await f.own(person) as InitialGameRoomView;
  const partial = { requestId: 'accepted', roomId: own.id, gameId: own.game.id, roundNumber: 1, turnId: own.game.interaction.turn!.id, direction: 'HIGH' };
  accepted(await socketAck(tab, 'game:opening-direction', partial)); f.time.advance(15000); await f.play();
  const room = f.repository.findById(own.id)!;
  while (room.game!.turn!.playerId !== own.participant.id) await f.play();
  f.time.advance(15000); const automatic = room.game!.players[0];
  expect(automatic).toMatchObject({ kind: 'HUMAN', status: 'AUTOMATIC', consecutiveTimeouts: 2 });
  await vi.waitFor(() => expect(person.expirations.map((event) => event.automatic)).toEqual([false, true]));
  const replay = accepted(await socketAck(tab, 'game:opening-direction', partial)) as InitialGameRoomView;
  expect(replay.game.ownConsecutiveTimeouts).toBe(2); expect(replay.game.interaction.openingSelection).toBeNull();
  for (const actor of f.people) {
    const view = await f.own(actor) as InitialGameRoomView;
    const internal = room.game!.players.find((p) => p.id === view.participant.id);
    const publicIds = new Set([view.game.round.indicator.id, ...view.game.hand.map((card) => card.id), ...view.game.round.plays.map((play) => play.card.id)]);
    assertGamePrivacy(view, internal?.hand.map((card) => card.id) ?? [], f.prepared.fixture.collection.cards.map((card) => card.id).filter((id) => !publicIds.has(id)),
      (condition, reason) => expect(condition, reason).toBe(true));
    expect(view.participants.find((p) => p.id === automatic.id)!.playStatus).toBe('AUTOMATIC');
  }
  const context = room.game!.turn!;
  const manipulated = { requestId: 'manipulated', roomId: room.id, gameId: room.game!.id, roundNumber: room.game!.round.number,
    turnId: context.id, cardId: automatic.hand[0].id, direction: 'HIGH' };
  expect(await socketAck(tab, 'game:play', manipulated)).toMatchObject({ ok: false, error: { code: 'PLAYER_AUTOMATIC' } });
  expect(room.game!.round.plays[0].mode).toBe('AUTOMATIC'); expect(f.time.pending).toBe(1);
  expect(await socketAck(f.host.socket, 'game:play', { ...manipulated, requestId: 'observer-play' })).toMatchObject({ ok: false, error: { code: 'NOT_YOUR_TURN' } });
  await delivered(); expect(person.expirations).toHaveLength(2); // AUTOMATIC no es otro timeout
  const current = room.game; expect(await socketAck(tab, 'game:play', { ...manipulated, requestId: 'extras', clientNow: 0 })).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  expect(room.game).toBe(current);
});

it('B08 T2 conexiones reales: cinco empatados legales a 10, último ACTIVE vence en desempate; revisión antes de resultado', async () => {
  const f = await manualSockets(5, { observer: true, turn: 15, review: 5, tie: true }); stop = f.stop;
  const room = f.repository.findById(f.room.id)!; const survivor = room.game!.players[0].id;
  while (room.game!.round.kind === 'BASE') {
    if (room.gameReview) f.time.advance(5000);
    else {
      const game = room.game!; const playerId = game.turn!.playerId;
      if (game.round.number >= 9 && (playerId !== survivor || game.round.number === 10)) {
        const actor = f.people.find((person) => person.sessionId === room.participants.find((p) => p.id === playerId)!.sessionId)!;
        if (!game.round.plays.length) accepted(await socketAck(actor.socket, 'game:opening-direction', { requestId: `direction-${game.turn!.id}`,
          roomId: room.id, gameId: game.id, roundNumber: game.round.number, turnId: game.turn!.id, direction: 'HIGH' }));
        f.time.advance(15000);
      } else await f.play();
    }
    expect(new Set(room.game!.locations().map((card) => card.id)).size).toBe(58);
  }
  expect(room.game!.players.map((person) => person.wonCards.length)).toEqual([10, 10, 10, 10, 10]);
  f.time.advance(15000); await delivered();
  const review = await f.own(f.people[1]) as InitialGameRoomView;
  expect(review.game.interaction.stage).toBe('ROUND_REVIEW'); expect(review.game.interaction.turn).toBeNull();
  expect(review.game.round.plays.map((play) => play.mode)).toEqual(['TIMEOUT', 'AUTOMATIC', 'AUTOMATIC', 'AUTOMATIC', 'AUTOMATIC']);
  expect(f.people[1].expirations).toHaveLength(10);
  f.time.advance(5000); await delivered();
  const result = await f.own() as ResultsRoomView;
  expect(result.result).toMatchObject({ endReason: 'NO_ACTIVE_HUMAN_PLAYERS', completedNormally: false });
  expect(result.result.standings.every((entry) => entry.score === 10)).toBe(true); expect(result.result.winnerIds).toHaveLength(1);
  for (const actor of f.people) expect(actor.states.filter((view) => view.status === 'RESULTS')).toHaveLength(1);
});
