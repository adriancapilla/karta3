import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { afterEach, expect, it, vi } from 'vitest';
import type { InitialGameRoomView, RoomView, SocketAck } from '../shared/contracts/room.js';
import { createRuntime } from './composition/createApp.js';
import { prepareDecks } from './infrastructure/decks/catalog.js';
import { MemoryRoomRepository } from './infrastructure/memoryRoomRepository.js';
import { MemorySessions } from './infrastructure/memorySessions.js';
import { attachPublicFiles } from './infrastructure/http/publicFiles.js';
import { deckFixture, realImage, writeFixture } from '../tests/support/deckFixtures.js';
import { removeTestInstallation } from '../tests/support/compiledDeckServer.js';
import { ControlledTime } from '../tests/support/controlledTime.js';
import { assertGamePrivacy } from '../tests/support/gamePrivacy.js';

const clients: Socket[] = []; let stop: (() => Promise<void>) | undefined;
afterEach(async () => { for (const socket of clients.splice(0)) socket.disconnect(); await stop?.(); stop = undefined; });
type Ack = SocketAck<{ room: RoomView }>;
const ack = (socket: Socket, event: string, payload: unknown, timeout = 2000) => new Promise<Ack>((resolve, reject) => {
  socket.timeout(timeout).emit(event, payload, (error: Error | null, result: Ack) => error ? reject(error) : resolve(result));
});
const game = (result: Ack) => { expect(result.ok).toBe(true); if (!result.ok || result.room.status !== 'IN_GAME') throw new Error('No hay mesa'); return result.room; };
async function boot(observer = false) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-b06-socket-'));
  const fixture = deckFixture(); fixture.collection.cards[0].imageRef = 'imagenes/carta.png'; fixture.collection.cards[0].imageAlt = 'Carta sintética azul';
  const directory = await writeFixture(root, fixture); await fs.mkdir(path.join(directory, 'imagenes')); await fs.writeFile(path.join(directory, 'imagenes/carta.png'), await realImage('png'));
  const loaded = await prepareDecks(root); const time = new ControlledTime(); const repository = new MemoryRoomRepository(); const sessions = new MemorySessions();
  const permutation = vi.fn((ids: readonly string[]) => [...ids]);
  const runtime = createRuntime({ decks: loaded.catalog, deckVersions: loaded.catalog, gameDecks: loaded.catalog,
    repository, sessions, clock: time, scheduler: time, permutation, codes: () => 42 });
  attachPublicFiles(runtime.app, path.resolve('dist'), loaded.catalog);
  const server = createServer(runtime.app); const sockets = runtime.attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  const base = `http://127.0.0.1:${address.port}`;
  stop = async () => { runtime.dispose(); await new Promise<void>((resolve) => sockets.close(() => resolve())); await removeTestInstallation(root); };
  const tab = async (cookie: string) => {
    const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: base } }); clients.push(socket);
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    await ack(socket, 'room:resume', {}); return socket;
  };
  const session = async () => {
    const response = await request(base).get('/api/rooms/current'); const cookie = String(response.headers['set-cookie'][0]).split(';')[0];
    const socket = await tab(cookie); const events: RoomView[] = []; socket.on('room:state', (event) => events.push(event.room));
    return { cookie, socket, events, id: sessions.get(cookie.split('=')[1])! };
  };
  const host = await session(); const guest = await session(); const third = await session();
  const room: RoomView = (await request(base).post('/api/rooms').set('Cookie', host.cookie).send({})).body.room;
  await ack(guest.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Ana' });
  await ack(host.socket, 'room:configure', { requestId: 'select', roomId: room.id, change: { field: 'deck', value: { id: 'prueba', contentVersion: 7 } } });
  if (observer) {
    await ack(host.socket, 'room:configure', { requestId: 'observer', roomId: room.id, change: { field: 'hostPlays', value: false } });
    await ack(third.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Ana' });
  }
  const start = (socket = host.socket, requestId = 'start') => ack(socket, 'room:start', { requestId, roomId: room.id });
  return { base, sockets, time, repository, permutation, session, tab, room, host, guest, third, start };
}

it('B06-01/05 transporte real: cookie, payload exacto, origen y permisos; sin ruta HTTP de inicio', async () => {
  const s = await boot();
  const payload = { requestId: 'start', roomId: s.room.id };
  for (const value of [null, [], {}, { ...payload, requestId: '' }, { ...payload, requestId: 1 }, { ...payload, roomId: 'x'.repeat(101) },
    { ...payload, requestId: 'x'.repeat(101) }, { ...payload, roomId: '' }, { ...payload, sessionId: s.host.id }, { ...payload, seed: 1 },
    { ...payload, cards: [] }, { ...payload, settings: {} }, { ...payload, participantId: s.room.participant.id }, { ...payload, revision: 1 }]) {
    expect(await ack(s.host.socket, 'room:start', value)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  }
  for (const socket of [s.guest.socket, s.third.socket]) expect(await s.start(socket)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  expect((await request(s.base).get(`/api/rooms/${s.room.id}`)).status).toBe(401);
  expect((await request(s.base).post(`/api/rooms/${s.room.id}/start`).set('Cookie', s.host.cookie).send(payload)).status).toBe(404);
  for (const headers of [{}, { Cookie: 'karta3_session=invalid' }, { Cookie: s.host.cookie, Origin: 'https://evil.example' }]) {
    const client = io(s.base, { reconnection: false, transports: ['websocket'], extraHeaders: headers }); clients.push(client);
    await new Promise<void>((resolve) => client.once('connect_error', () => resolve()));
    expect(client.connected).toBe(false);
  }
  expect(s.permutation).not.toHaveBeenCalled(); expect(game(await s.start()).game.drawPileCount).toBe(51);
});

it.each([false, true])('B06-10/11 HTTP/ack/eventos reales privados por sesión; observador=%s, recursos validados', async (observer) => {
  const s = await boot(observer); const host = game(await s.start()); const internal = s.repository.findById(s.room.id)!.game!;
  const publicRound = host.game.round; const participants = observer ? [s.host, s.guest, s.third] : [s.host, s.guest];
  const assert = (condition: boolean, reason: string) => expect(condition, reason).toBe(true);
  for (const person of participants) {
    const mine = internal.players.find((p) => p.id === s.repository.findById(s.room.id)!.participantFor(person.id)!.id)?.hand.map((card) => card.id) ?? [];
    const forbidden = [...internal.drawPile, ...internal.players.filter((p) => !mine.includes(p.hand[0].id)).flatMap((p) => p.hand)].map((card) => card.id);
    const bodies = [game(await ack(person.socket, 'room:resume', {})),
      (await request(s.base).get('/api/rooms/current').set('Cookie', person.cookie)).body.room,
      (await request(s.base).get(`/api/rooms/${s.room.id}`).set('Cookie', person.cookie)).body.room];
    if (person === s.host) {
      bodies.push(game(await s.start(s.host.socket, 'new-id')),
        (await request(s.base).post('/api/rooms').set('Cookie', person.cookie).send({})).body.room,
        game(await ack(person.socket, 'room:configure', { requestId: 'select', roomId: s.room.id, change: { field: 'deck', value: { id: 'prueba', contentVersion: 7 } } })));
    } else bodies.push(game(await ack(person.socket, 'room:join', { requestId: 'join', code: s.room.code, name: 'Ana' })));
    await vi.waitFor(() => expect(person.events.some((view) => view.status === 'IN_GAME')).toBe(true));
    bodies.push(...person.events.filter((view): view is InitialGameRoomView => view.status === 'IN_GAME'));
    for (const body of bodies) { assertGamePrivacy(body, mine, forbidden, assert); expect(body.game.round).toEqual(publicRound); expect(body.game.id).toBe(host.game.id);
      expect(JSON.stringify(body)).not.toContain(person.cookie.split('=')[1]); expect(JSON.stringify(body)).not.toContain(person.id); }
  }
  const guest = game(await ack(s.guest.socket, 'room:resume', {})); const image = guest.game.hand[0];
  expect(image).toMatchObject({ imageUrl: '/media/decks/prueba/v7/imagenes/carta.png', imageAlt: 'Carta sintética azul' });
  expect((await request(s.base).get(image.imageUrl!)).headers['content-type']).toContain('image/png');
  expect(host.game.hand.every((card) => card.imageUrl === null)).toBe(true);
  for (const uri of ['/barajas/prueba/cartas.json', '/media/decks/prueba/v6/imagenes/carta.png', '/api/game', '/api/rooms/game']) {
    const response = await request(s.base).get(uri).set('Cookie', s.third.cookie); expect(response.status).toBeGreaterThanOrEqual(400); expect(response.text).not.toContain('<!doctype html>');
  }
});

it('B06-06/E5 inicios casi simultáneos en dos pestañas y ack perdido recuperan una única aceptación', async () => {
  const s = await boot(); const tab = await s.tab(s.host.cookie);
  const outcomes = await Promise.all([s.start(), s.start(tab, 'second-tab')]);
  const accepted = game(outcomes[0]); expect(game(outcomes[1])).toEqual(accepted); expect(s.permutation).toHaveBeenCalledTimes(1);
  const hostServerSocket = [...s.sockets.sockets.sockets.values()].find((socket) => socket.id === s.host.socket.id)!;
  const original = hostServerSocket.listeners('room:start')[0]; hostServerSocket.removeAllListeners('room:start');
  hostServerSocket.on('room:start', (payload) => original(payload, () => {}));
  await expect(ack(s.host.socket, 'room:start', { requestId: 'lost-ack', roomId: s.room.id }, 100)).rejects.toThrow();
  expect((await request(s.base).get('/api/rooms/current').set('Cookie', s.host.cookie)).body.room).toEqual(accepted);
  expect(game(await s.start(tab, 'lost-ack'))).toEqual(accepted); expect(s.permutation).toHaveBeenCalledTimes(1);
});

it('B06-06 pérdida del ack del primer inicio: HTTP y repetición recuperan la aceptación original', async () => {
  const s = await boot(); const socket = s.sockets.sockets.sockets.get(s.host.socket.id!)!;
  const original = socket.listeners('room:start')[0]; socket.removeAllListeners('room:start');
  socket.on('room:start', (payload) => original(payload, () => {}));
  await expect(ack(s.host.socket, 'room:start', { requestId: 'lost-first', roomId: s.room.id }, 100)).rejects.toThrow();
  const accepted = (await request(s.base).get('/api/rooms/current').set('Cookie', s.host.cookie)).body.room;
  expect(accepted.status).toBe('IN_GAME'); expect(s.permutation).toHaveBeenCalledTimes(1);
  const tab = await s.tab(s.host.cookie); expect(game(await s.start(tab, 'lost-first'))).toEqual(accepted);
  expect(s.permutation).toHaveBeenCalledTimes(1);
});

it.each([false, true])('B06-12/13 conexiones reales, varias pestañas y tiempo controlado >30 min; observador=%s', async (observer) => {
  const s = await boot(observer); const accepted = game(await s.start()); const tab = await s.tab(s.host.cookie);
  s.host.socket.disconnect(); await ack(tab, 'room:resume', {});
  expect(game(await ack(s.guest.socket, 'room:resume', {})).participants.find((p) => p.role === 'HOST')!.presence).toBe('CONNECTED');
  tab.disconnect(); s.guest.socket.disconnect(); if (observer) s.third.socket.disconnect();
  await vi.waitFor(() => expect(s.repository.findById(s.room.id)!.participants.every((p) => p.presence === 'DISCONNECTED')).toBe(true));
  expect((await request(s.base).get('/api/rooms/current').set('Cookie', s.host.cookie)).body.room.participant.presence).toBe('DISCONNECTED');
  for (const ms of [30_001, 120_001, 1_800_001]) s.time.advance(ms);
  expect(s.time.pending).toBe(0); expect(s.repository.findById(s.room.id)!.status).toBe('IN_GAME');
  const restored = await s.tab(s.host.cookie); const view = game(await ack(restored, 'room:resume', {}));
  expect(view.game).toEqual(accepted.game); expect(view.settings).toEqual(accepted.settings); expect(view.participant.presence).toBe('CONNECTED');
  expect(s.permutation).toHaveBeenCalledTimes(1);
});

it('B06-09 HTTP existente bloquea nombre/cierre incluso anfitrión y rechaza preparación/entrada nueva', async () => {
  const s = await boot(); const accepted = game(await s.start());
  for (const person of [s.host, s.guest]) expect((await request(s.base).patch(`/api/rooms/${s.room.id}/name`).set('Cookie', person.cookie).send({ name: 'Cambio' })).body)
    .toMatchObject({ error: { code: 'GAME_ALREADY_STARTED' } });
  expect((await request(s.base).delete(`/api/rooms/${s.room.id}`).set('Cookie', s.host.cookie)).status).toBe(409);
  expect((await request(s.base).delete(`/api/rooms/${s.room.id}`).set('Cookie', s.third.cookie)).status).toBe(403);
  expect(await ack(s.third.socket, 'room:join', { requestId: 'new', code: s.room.code, name: 'Tercero' })).toMatchObject({ ok: false, error: { code: 'GAME_ALREADY_STARTED' } });
  expect(await ack(s.host.socket, 'room:configure', { requestId: 'new', roomId: s.room.id, change: { field: 'deck', value: null } })).toMatchObject({ ok: false, error: { code: 'GAME_ALREADY_STARTED' } });
  expect(await ack(s.guest.socket, 'room:leave', { requestId: 'new', roomId: s.room.id, participantId: s.repository.findById(s.room.id)!.participantFor(s.guest.id)!.id })).toMatchObject({ ok: false, error: { code: 'GAME_ALREADY_STARTED' } });
  expect(game(await ack(s.host.socket, 'room:resume', {}))).toEqual(accepted);
});
