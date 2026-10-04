import request from 'supertest';
import { afterEach, expect, it } from 'vitest';
import type { CurrentRoomResponse, InitialGameRoomView, ResultsRoomView, RoomView } from '../shared/contracts/room.js';
import { accepted, manualSockets, socketAck } from '../tests/support/manualSocketCases.js';
import { assertGamePrivacy } from '../tests/support/gamePrivacy.js';

let stop: (() => Promise<void>) | undefined;
afterEach(async () => { await stop?.(); stop = undefined; });
const boot = async (count = 2, options: Parameters<typeof manualSockets>[1] = {}) => { const s = await manualSockets(count, options); stop = s.stop; return s; };
function privacy(view: RoomView, ids: string[]) {
  if (view.status === 'IN_GAME') {
    const publicIds = new Set([view.game.round.indicator.id, ...view.game.round.plays.map((play) => play.card.id), ...view.game.hand.map((card) => card.id)]);
    assertGamePrivacy(view, view.game.hand.map((card) => card.id), ids.filter((id) => !publicIds.has(id)), (condition, reason) => expect(condition, reason).toBe(true));
    if (view.game.interaction.openingSelection) expect(view.game.interaction.turn?.playerId).toBe(view.participant.id);
  } else if (view.status === 'RESULTS') {
    expect(Object.keys(view).sort()).toEqual(['id', 'code', 'status', 'revision', 'participant', 'participants', 'settings', 'selectedDeck', 'result'].sort());
    expect(Object.keys(view.result).sort()).toEqual(['gameId', 'endReason', 'completedNormally', 'standings', 'winnerIds', 'tieBreakWinnerId', 'retention'].sort());
    expect(Object.keys(view.result.retention).sort()).toEqual(['presentedAt', 'serverNow', 'expiresAt'].sort());
    for (const person of [view.participant, ...view.participants]) expect(Object.keys(person).sort()).toEqual(['id', 'name', 'role', 'isPlayer', 'score'].sort());
    for (const entry of view.result.standings) expect(Object.keys(entry).sort()).toEqual(['playerId', 'score', 'position'].sort());
    for (const id of ids) expect(JSON.stringify(view)).not.toContain(`"${id}"`);
  }
  expect(JSON.stringify(view)).not.toMatch(/sessionId|hostSessionId|imageRef|publication|permutation|seed|wonCards|drawPile"/);
}

it.each([2, 3, 4, 5])('B07 HTTP/ack/eventos reales: %i humanos completan base y desempate, privacidad exacta por destinatario', async (count) => {
  const s = await boot(count, { observer: true, tie: true }); await s.complete();
  const ids = s.prepared.fixture.collection.cards.map((card) => card.id);
  const result = await s.own() as ResultsRoomView; expect(result.status).toBe('RESULTS'); expect(s.permutation).toHaveBeenCalledTimes(2);
  expect(result.result.standings.map((person) => person.score)).toEqual(s.prepared.points);
  expect(s.inputs).toHaveLength(s.prepared.trace.length * count + count);
  for (const item of s.inputs) privacy(item.ack, ids);
  for (const person of s.people) {
    const own = await s.own(person); privacy(own, ids);
    const http = await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', person.cookie);
    expect(http.status).toBe(200); expect(http.headers['cache-control']).toBe('no-store'); privacy(http.body.room, ids);
    const replay = accepted(await socketAck(person.socket, 'room:resume', {})); privacy(replay, ids);
    for (const view of person.states) if (view.status !== 'WAITING') privacy(view, ids);
    expect(person.resolutions).toHaveLength(s.prepared.trace.length + 1);
    for (const event of person.resolutions) {
      expect(Object.keys(event).sort()).toEqual(['gameId', 'result', 'roomId']);
      const publicIds = new Set(event.result.ranking.map((entry) => entry.card.id));
      for (const id of ids.filter((id) => !publicIds.has(id))) expect(JSON.stringify(event)).not.toContain(`"${id}"`);
      expect(Object.keys(event.result).sort()).toEqual(['id', 'roundNumber', 'kind', 'ranking', 'winnerPlayerId', 'nextOpenerPlayerId', 'awardedCardCount'].sort());
    }
  }
  expect(result.participant.score).toBeNull();
  const first = s.inputs[0]; const repeated = accepted(await socketAck(first.person.socket, 'game:play', first.input)); expect(repeated.status).toBe('RESULTS');
  expect(s.permutation).toHaveBeenCalledTimes(2);
}, 30_000);

it('B07 decoder exacto, contexto, permisos y carta ajena; no endpoint HTTP de jugar/avanzar/finalizar', async () => {
  const s = await boot(); const opener = s.people[1]; const view = await s.own(opener) as InitialGameRoomView;
  const context = { requestId: 'valid', roomId: view.id, gameId: view.game.id, roundNumber: 1, turnId: view.game.interaction.turn!.id };
  const partial = { ...context, direction: 'HIGH' };
  for (const bad of [{ ...partial, playerId: view.participant.id }, { ...partial, at: 0 }, { ...partial, roundNumber: '1' }, { ...partial, roundNumber: 0 }, { ...partial, turnId: '' }, { ...partial, requestId: 'x'.repeat(101) }, { ...partial, direction: null }, { ...partial, direction: 'ALTO' }]) {
    expect(await socketAck(opener.socket, 'game:opening-direction', bad)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  }
  const input = { ...partial, cardId: view.game.hand[0].id };
  expect(await socketAck(s.host.socket, 'game:play', input)).toMatchObject({ ok: false, error: { code: 'NOT_YOUR_TURN' } });
  const outsider = await s.session(); expect(await socketAck(outsider.socket, 'game:play', input)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  const host = await s.own() as InitialGameRoomView;
  expect(await socketAck(opener.socket, 'game:play', { ...input, requestId: 'foreign', cardId: host.game.hand[0].id })).toMatchObject({ ok: false, error: { code: 'CARD_NOT_IN_HAND' } });
  for (const bad of [{ ...input, direction: null }, { ...input, time: 5 }, { ...input, cardId: 1 }]) expect(await socketAck(opener.socket, 'game:play', bad)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  for (const route of ['/api/game/play', '/api/game/advance', '/api/game/finish']) expect((await request(s.base).post(route).set('Cookie', s.host.cookie).send({})).status).toBe(404);
  expect((await request(s.base).get('/api/results/unknown')).status).toBe(401);
  expect(s.repository.findById(view.id)!.game!.round.plays).toEqual([]);
});

it('B07 parcial solo propia, dos pestañas y carrera; ack perdido/repetición no repite ni restaura', async () => {
  const s = await boot(); const opener = s.people[1]; const second = await s.tab(opener.cookie);
  const view = await s.own(opener) as InitialGameRoomView; const context = { requestId: 'partial', roomId: view.id, gameId: view.game.id, roundNumber: 1, turnId: view.game.interaction.turn!.id };
  const partial = accepted(await socketAck(opener.socket, 'game:opening-direction', { ...context, direction: 'HIGH' })) as InitialGameRoomView;
  expect(partial.game.interaction.openingSelection?.direction).toBe('HIGH');
  const otherTab = accepted(await socketAck(second, 'room:resume', {})) as InitialGameRoomView; expect(otherTab.game.interaction.openingSelection?.direction).toBe('HIGH');
  expect((await s.own() as InitialGameRoomView).game.interaction.openingSelection).toBeNull();
  await socketAck(second, 'game:opening-direction', { ...context, requestId: 'replace', direction: 'LOW' });
  expect((accepted(await socketAck(opener.socket, 'game:opening-direction', { ...context, direction: 'HIGH' })) as InitialGameRoomView).game.interaction.openingSelection?.direction).toBe('LOW');
  const payload = { ...context, requestId: 'complete', direction: 'HIGH', cardId: view.game.hand[0].id };
  const responses = await Promise.all([socketAck(opener.socket, 'game:play', payload), socketAck(second, 'game:play', { ...payload, requestId: 'competing', cardId: view.game.hand[1].id })]);
  expect(responses[0].ok).toBe(true); expect(responses[1]).toMatchObject({ ok: false, error: { code: 'STALE_GAME_CONTEXT' } });
  const revised = await s.own(opener) as InitialGameRoomView; expect(revised.game.round.plays).toHaveLength(1); expect(revised.game.hand).toHaveLength(2);
  expect(accepted(await socketAck(second, 'game:play', payload))).toEqual(revised);
  expect(await socketAck(opener.socket, 'game:opening-direction', { ...context, requestId: 'complete', direction: 'HIGH' })).toMatchObject({ ok: false, error: { code: 'REQUEST_CONFLICT' } });
  const next = await s.own() as InitialGameRoomView;
  const last = { requestId: 'lost', roomId: view.id, gameId: view.game.id, roundNumber: 1, turnId: next.game.interaction.turn!.id, cardId: next.game.hand[0].id, direction: null };
  const serverSocket = [...s.channel.sockets.sockets.values()].find((socket) => socket.data.sessionId === s.host.sessionId)!;
  const original = serverSocket.listeners('game:play')[0]; serverSocket.removeAllListeners('game:play');
  serverSocket.on('game:play', (input, ack) => original(input, input.requestId === 'lost' ? () => {} : ack));
  await expect(socketAck(s.host.socket, 'game:play', last, 80)).rejects.toThrow();
  const recovered = await s.own() as InitialGameRoomView; expect(recovered.game.round.number).toBe(2);
  serverSocket.removeAllListeners('game:play'); serverSocket.on('game:play', original);
  expect(accepted(await socketAck(s.host.socket, 'game:play', last))).toEqual(recovered); expect(s.permutation).toHaveBeenCalledTimes(1);
});

it('B07 resultados/retorno reales por sesión: copia autorizada, nueva sala y límite exacto sin borrar índices', async () => {
  const s = await boot(2, { review: 5, observer: true }); await s.complete();
  const result = await s.own() as ResultsRoomView; const oldDeadline = result.result.retention.expiresAt;
  const tab = await s.tab(s.host.cookie); const homeEvents: unknown[] = []; tab.on('results:home', (event) => homeEvents.push(event));
  const outsider = await s.session(); expect((await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', outsider.cookie)).status).toBe(403);
  const payload = { requestId: 'home', roomId: result.id, gameId: result.result.gameId };
  const response = await socketAck<CurrentRoomResponse>(s.host.socket, 'results:return-home', payload); expect(response).toMatchObject({ ok: true, room: null, lastResult: { gameId: result.result.gameId } });
  await new Promise<void>((resolve) => setImmediate(resolve)); expect(homeEvents).toHaveLength(1); expect(s.people[1].homes).toHaveLength(0);
  const newer: RoomView = (await request(s.base).post('/api/rooms').set('Cookie', s.host.cookie).send({})).body.room;
  expect(newer.code).not.toBe(result.code);
  expect((await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', s.host.cookie)).body.room.result.retention.expiresAt).toBe(oldDeadline);
  expect((await s.own()).id).toBe(newer.id);
  expect(await socketAck(s.host.socket, 'results:return-home', { ...payload, requestId: 'stale' })).toMatchObject({ ok: false, error: { code: 'STALE_GAME_CONTEXT' } });
  expect(await socketAck<CurrentRoomResponse>(s.host.socket, 'results:return-home', payload)).toMatchObject({ ok: true, room: { id: newer.id } });
  s.time.advance(1000); await request(s.base).patch(`/api/rooms/${newer.id}/name`).set('Cookie', s.host.cookie).send({ name: 'Nueva sala' });
  s.time.elapse(oldDeadline - s.time.now().unix - 1); expect((await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', s.host.cookie)).status).toBe(200);
  s.time.elapse(1); expect((await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', s.host.cookie)).status).toBe(404);
  expect((await s.own()).id).toBe(newer.id); expect(s.repository.findActiveByCode(newer.code)?.id).toBe(newer.id);
  expect(s.repository.findById(result.id)).toBeUndefined(); expect(s.host.homes).toHaveLength(1);
});

it('B07 conexiones reales y reloj controlado: varias pestañas/ausencia no ejecutan límites aplazados', async () => {
  const s = await boot(2, { observer: true }); const first = s.people[1]; const tab = await s.tab(first.cookie);
  const view = await s.own(first) as InitialGameRoomView;
  await socketAck(first.socket, 'game:opening-direction', { requestId: 'partial', roomId: view.id, gameId: view.game.id, roundNumber: 1, turnId: view.game.interaction.turn!.id, direction: 'LOW' });
  first.socket.disconnect(); await new Promise<void>((resolve) => setTimeout(resolve, 15));
  expect((await s.own(first) as InitialGameRoomView).participant.presence).toBe('CONNECTED'); tab.disconnect();
  s.people.forEach((person) => person.socket.disconnect()); await new Promise<void>((resolve) => setTimeout(resolve, 15));
  s.time.advance(31 * 60_000); const away = await s.own(first) as InitialGameRoomView;
  expect(away.game.hand).toEqual(view.game.hand); expect(away.game.interaction.openingSelection?.direction).toBe('LOW'); expect(away.participant.presence).toBe('DISCONNECTED');
  expect(away.game.round.plays).toEqual([]); expect(s.time.pending).toBe(0);
  const restored = await s.tab(first.cookie); const ack = accepted(await socketAck(restored, 'room:resume', {})) as InitialGameRoomView;
  expect(ack.participant.presence).toBe('CONNECTED'); expect(ack.game.hand).toEqual(view.game.hand); expect(s.permutation).toHaveBeenCalledTimes(1);
});
