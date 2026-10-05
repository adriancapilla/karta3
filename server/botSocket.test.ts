import request from 'supertest';
import { afterEach, expect, it } from 'vitest';
import { manualSockets, socketAck, accepted } from '../tests/support/manualSocketCases.js';
import { assertGamePrivacy } from '../tests/support/gamePrivacy.js';
import type { BotResponse, InitialGameRoomView, ResultsRoomView, RoomView } from '../shared/contracts/room.js';

let stop: (() => Promise<void>) | undefined;
afterEach(async () => { await stop?.(); stop = undefined; });
const boot = async (count = 3, observer = false, review: 0 | 5 = 0) => { const s = await manualSockets(count, { botSeed: ({ 2: 2, 3: 3, 4: 56, 5: 98 })[count], observer, tie: true, review, turn: 15 }); stop = s.stop; return s; };
function privacy(view: RoomView, ids: string[]) {
  expect(view.participant.kind).toBe('HUMAN'); expect(view.participant.botDifficulty).toBeNull();
  for (const person of view.participants) {
    if (person.kind === 'BOT') expect(['EASY', 'HARD']).toContain(person.botDifficulty);
    else expect(person.botDifficulty).toBeNull();
  }
  if (view.status === 'IN_GAME') {
    const visible = [view.game.round.indicator.id, ...view.game.hand.map((p) => p.id), ...view.game.round.plays.map((p) => p.card.id)];
    assertGamePrivacy(view, view.game.hand.map((p) => p.id), ids.filter((id) => !visible.includes(id)), (condition, reason) => expect(condition, reason).toBe(true));
  } else if (view.status === 'RESULTS') {
    for (const person of [view.participant, ...view.participants]) expect(Object.keys(person).sort()).toEqual(['id', 'name', 'kind', 'botDifficulty', 'role', 'isPlayer', 'score'].sort());
    for (const id of ids) expect(JSON.stringify(view)).not.toContain(`"${id}"`);
  }
  expect(JSON.stringify(view)).not.toMatch(/sessionId|hostSessionId|imageRef|publication|permutation|seed|wonCards|drawPile"|monotonic|generation/);
}
it.each([2, 3, 4, 5])('B09 HTTP/Socket reales %i mixtos: políticas BOT, partida/desempate/resultados privados, observador y replay host', async (count) => {
  const s = await boot(count, true, count % 2 ? 5 : 0); const tab = await s.tab(s.host.cookie);
  await s.complete(); const result = await s.own() as ResultsRoomView;
  expect(result.status).toBe('RESULTS'); expect(result.result.completedNormally).toBe(true); expect(s.permutation).toHaveBeenCalledTimes(2);
  const ids = s.prepared.fixture.collection.cards.map((p) => p.id);
  for (const person of s.people) {
    for (const view of person.states) privacy(view, ids);
    const own = await s.own(person); privacy(own, ids);
    const http = await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', person.cookie);
    expect(http.status).toBe(200); privacy(http.body.room, ids); expect(http.headers['cache-control']).toBe('no-store');
    for (const event of person.resolutions) expect(Object.keys(event).sort()).toEqual(['gameId', 'result', 'roomId']);
  }
  expect(s.host.states.filter((v): v is InitialGameRoomView => v.status === 'IN_GAME').every((v) => v.game.hand.length === 0)).toBe(true);
  const replay = await socketAck<BotResponse>(tab, 'room:bot-add', { requestId: 'bot-1', roomId: s.room.id });
  expect(replay.ok).toBe(true); if (replay.ok) { expect(Object.keys(replay).sort()).toEqual(['ok', 'room', 'botId'].sort()); privacy(replay.room, ids); expect(replay.room.participant.id).toBe(s.start.participant.id); }
  const third = await s.session(); expect((await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', third.cookie)).status).toBe(403);
  const bot = s.start.participants.find((p) => p.kind === 'BOT')!;
  expect((await request(s.base).get(`/api/results/${result.result.gameId}`).set('Cookie', `karta3_session=${bot.id}`)).status).toBe(401);
  expect(s.repository.findActiveBySession(bot.id)).toBeUndefined();
  const newAction = await socketAck(tab, 'room:bot-remove', { requestId: 'after', roomId: s.room.id, botId: bot.id });
  expect(newAction).toMatchObject({ ok: false, error: { code: 'GAME_FINISHED' } });
});
it('T02 espera con sockets reales: HARD inicial, EASY/HARD aceptados, cliente NORMAL y tipos/campos falsos rechazados sin efectos', async () => {
  const s = await boot(); const host = await s.session(); const tab = await s.tab(host.cookie); const guest = await s.session();
  const room = (await request(s.base).post('/api/rooms').set('Cookie', host.cookie).send({})).body.room as RoomView;
  accepted(await socketAck(guest.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Persona' }));
  const add = await socketAck<BotResponse>(host.socket, 'room:bot-add', { requestId: 'add', roomId: room.id });
  expect(add.ok).toBe(true); if (!add.ok) return;
  expect(add.room.participants.find((p) => p.id === add.botId)?.botDifficulty).toBe('HARD');
  const input = { requestId: 'invalid', roomId: room.id, botId: add.botId, difficulty: 'HARD' };
  const invalids: object[] = ['NORMAL', 'UNKNOWN', 'hard', 'easy', true, 1, null].map((difficulty) => ({ ...input, difficulty }));
  invalids.push({ ...input, extra: 1 });
  for (const field of Object.keys(input)) { const absent: Record<string, unknown> = { ...input }; delete absent[field]; invalids.push(absent); }
  const waiting = s.repository.findById(room.id)!; const before = waiting.participants; const revision = waiting.revision; const expiry = waiting.lifecycle(0).expiresAt;
  s.time.elapse(1000);
  for (const invalid of invalids) {
    const ack = await socketAck(tab, 'room:bot-difficulty', invalid);
    expect(ack).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
    expect(Object.keys(ack).sort()).toEqual(['error', 'ok']);
    if (!ack.ok) expect(Object.keys(ack.error).sort()).toEqual(['code', 'message']);
    expect(waiting.participants).toEqual(before); expect(waiting.revision).toBe(revision); expect(waiting.lifecycle(0).expiresAt).toBe(expiry);
  }
  for (const difficulty of ['EASY', 'HARD'] as const) {
    const ack = await socketAck<BotResponse>(tab, 'room:bot-difficulty', { ...input, requestId: difficulty, difficulty });
    expect(ack.ok).toBe(true); if (ack.ok) expect(ack.room.participants.find((p) => p.id === add.botId)?.botDifficulty).toBe(difficulty);
  }
  const current = (await request(s.base).get('/api/rooms/current').set('Cookie', guest.cookie)).body.room as RoomView;
  expect(current.participants.find((p) => p.id === add.botId)?.botDifficulty).toBe('HARD');
  expect(await socketAck(guest.socket, 'room:bot-difficulty', { ...input, requestId: 'guest' })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  const replay = await socketAck<BotResponse>(tab, 'room:bot-add', { requestId: 'add', roomId: room.id });
  expect(replay.ok).toBe(true); if (replay.ok) expect(replay.room.participant.id).toBe(add.room.participant.id);
});
it('B09 conexiones reales sin clientes: BOT/HUMAN automático terminan por inactividad y se recupera resultado', async () => {
  const s = await boot(3, false, 5); s.people.forEach((p) => p.socket.disconnect());
  await expect.poll(() => s.channel.engine.clientsCount).toBe(0);
  s.time.advance(0); s.time.advance(15000); s.time.advance(5000); s.time.advance(15000);
  const room = s.repository.findById(s.room.id)!; expect(room.game!.result!.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS');
  expect(room.status).toBe('IN_GAME'); const round = room.game!.round.number; s.time.advance(5000);
  expect(room.status).toBe('RESULTS'); expect(room.game!.round.number).toBe(round);
  const tab = await s.tab(s.host.cookie); const resumed = accepted(await socketAck(tab, 'room:resume', {})) as ResultsRoomView;
  expect(resumed.result.completedNormally).toBe(false); expect(resumed.result.retention.expiresAt - resumed.result.retention.presentedAt).toBe(1800000);
});
it('B09 canales reales: host dos pestañas, huésped/tercero/sesión ausente; entradas estrictas y replays tras inicio', async () => {
  const s = await boot(2, true); const tab = await s.tab(s.host.cookie); const third = await s.session();
  const bot = s.start.participants.find((p) => p.kind === 'BOT')!;
  for (const person of [s.people[1], third]) expect(await socketAck(person.socket, 'room:bot-remove', { requestId: 'deny', roomId: s.room.id, botId: bot.id })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  for (const invalid of [{ requestId: 'extra', roomId: s.room.id, botId: bot.id, difficulty: 'HARD', extra: 1 }, { requestId: 'legacy', roomId: s.room.id, botId: bot.id, difficulty: 'NORMAL' }]) {
    expect(await socketAck(tab, 'room:bot-difficulty', invalid)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  }
  const replay = await socketAck<BotResponse>(tab, 'room:bot-add', { requestId: 'bot-1', roomId: s.room.id });
  expect(replay.ok).toBe(true); if (replay.ok) expect(replay.room.participant.id).toBe(s.start.participant.id);
  expect(s.repository.findById(s.room.id)!.playerCount).toBe(2);
  const human = s.people[1]; const own = await s.own(human) as InitialGameRoomView;
  const hidden = s.repository.findById(s.room.id)!.game!.players.find((p) => p.kind === 'BOT')!.hand[0].id;
  const attack = { requestId: 'bot-card', roomId: s.room.id, gameId: own.game.id, roundNumber: own.game.round.number, turnId: own.game.interaction.turn!.id, cardId: hidden, direction: null };
  expect(await socketAck(human.socket, 'game:play', attack)).toMatchObject({ ok: false, error: { code: 'CARD_NOT_IN_HAND' } });
  expect(await socketAck(tab, 'game:play', { ...attack, requestId: 'observer-card' })).toMatchObject({ ok: false, error: { code: 'NOT_YOUR_TURN' } });
  expect(await socketAck(human.socket, 'game:play', { ...attack, requestId: 'spoof', playerId: bot.id })).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  expect(s.repository.findById(s.room.id)!.game!.players.find((p) => p.kind === 'BOT')!.hand.some((card) => card.id === hidden)).toBe(true);
});
it('B09 E4 espera real: ack omitido de add/rename, retirada desde otra pestaña, mismo payload confirma sin reinsertar ni emitir salida humana', async () => {
  const s = await boot(); const host = await s.session(); const tab = await s.tab(host.cookie);
  const room = (await request(s.base).post('/api/rooms').set('Cookie', host.cookie).send({})).body.room as RoomView;
  const input = { requestId: 'lost-add', roomId: room.id }; host.socket.emit('room:bot-add', input);
  await expect.poll(() => s.repository.findById(room.id)!.playerCount).toBe(2);
  const first = await socketAck<BotResponse>(tab, 'room:bot-add', input); expect(first.ok).toBe(true); if (!first.ok) return;
  const rename = { requestId: 'lost-name', roomId: room.id, botId: first.botId, name: '  Persona  ' };
  host.socket.emit('room:bot-rename', rename);
  await expect.poll(() => s.repository.findById(room.id)!.participants[0].name).toBe('Persona');
  const changes: unknown[] = []; let left = 0;
  host.socket.on('room:state', (event) => { if (event.change) changes.push(event.change); }); host.socket.on('room:left', () => left++);
  const removed = await socketAck<BotResponse>(tab, 'room:bot-remove', { requestId: 'remove', roomId: room.id, botId: first.botId }); expect(removed.ok).toBe(true);
  const replay = await socketAck<BotResponse>(host.socket, 'room:bot-rename', rename); expect(replay.ok).toBe(true);
  if (replay.ok) { expect(replay.botId).toBe(first.botId); expect(replay.room.participants).toHaveLength(1); expect(replay.room.participant.id).toBe(room.participant.id); }
  expect(changes).toHaveLength(1); expect(changes[0]).toMatchObject({ kind: 'BOT_REMOVED', name: 'Persona' }); expect(left).toBe(0);
  expect(await socketAck(tab, 'room:bot-rename', { ...rename, requestId: 'new' })).toMatchObject({ ok: false, error: { code: 'BOT_NOT_AVAILABLE' } });
  expect(await socketAck(tab, 'room:bot-add', rename)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
});
it('B09 E3 solicitudes casi simultáneas reales: add/add, add/join y add/hostPlays comparten quinta plaza', async () => {
  const s = await boot(); const host = await s.session(); const tab = await s.tab(host.cookie); const guest = await s.session();
  const room = (await request(s.base).post('/api/rooms').set('Cookie', host.cookie).send({})).body.room as RoomView;
  for (let n = 0; n < 3; n++) expect((await socketAck(host.socket, 'room:bot-add', { requestId: `base-${n}`, roomId: room.id })).ok).toBe(true);
  const add = (socket: typeof tab, id: string) => socketAck(socket, 'room:bot-add', { requestId: id, roomId: room.id });
  const check = (results: Awaited<ReturnType<typeof add>>[]) => { expect(results.filter((r) => r.ok)).toHaveLength(1); expect(results.find((r) => !r.ok)).toMatchObject({ error: { code: 'ROOM_FULL' } }); expect(s.repository.findById(room.id)!.playerCount).toBe(5); };
  check(await Promise.all([add(host.socket, 'race-a'), add(tab, 'race-b')]));
  await socketAck(host.socket, 'room:configure', { requestId: 'observer', roomId: room.id, change: { field: 'hostPlays', value: false } });
  check(await Promise.all([add(host.socket, 'race-c'), socketAck(guest.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Invitado' })]));
  const bot = s.repository.findById(room.id)!.participants.find((p) => p.kind === 'BOT')!;
  await socketAck(tab, 'room:bot-remove', { requestId: 'free', roomId: room.id, botId: bot.id });
  check(await Promise.all([add(host.socket, 'race-d'), socketAck(tab, 'room:configure', { requestId: 'play', roomId: room.id, change: { field: 'hostPlays', value: true } })]));
});
