import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { afterEach, expect, it } from 'vitest';
import type { RoomView, SocketAck } from '../shared/contracts/room.js';
import { createRuntime } from './composition/createApp.js';
import { prepareDecks, LoadedDeckCatalog } from './infrastructure/decks/catalog.js';
import { deckFixture, writeFixture } from '../tests/support/deckFixtures.js';
import { removeTestInstallation } from '../tests/support/compiledDeckServer.js';
import { ControlledTime } from '../tests/support/controlledTime.js';

const clients: Socket[] = []; let stop: (() => Promise<void>) | undefined;
afterEach(async () => { for (const socket of clients.splice(0)) socket.disconnect(); await stop?.(); stop = undefined; });
async function boot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-b05-'));
  await writeFixture(root); await writeFixture(root, deckFixture('generica', false));
  const loaded = await prepareDecks(root); const time = new ControlledTime();
  const runtime = createRuntime({ decks: loaded.catalog, deckVersions: loaded.catalog, clock: time, scheduler: time, codes: () => 42 });
  const server = createServer(runtime.app); const sockets = runtime.attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  const base = `http://127.0.0.1:${address.port}`;
  stop = async () => { runtime.dispose(); await new Promise<void>((resolve) => sockets.close(() => resolve())); await removeTestInstallation(root); };
  const session = async () => {
    const response = await request(base).get('/api/rooms/current'); const cookie = String(response.headers['set-cookie'][0]).split(';')[0];
    const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: base } }); clients.push(socket);
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    return { cookie, socket };
  };
  const host = await session(); const guest = await session(); const foreign = await session();
  const room: RoomView = (await request(base).post('/api/rooms').set('Cookie', host.cookie).send({})).body.room;
  await ack(guest.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Ana' });
  return { base, time, session, host, guest, foreign, room, loaded };
}
const ack = (socket: Socket, event: string, payload: unknown) => new Promise<SocketAck<{ room: RoomView }>>((resolve, reject) => {
  socket.timeout(2000).emit(event, payload, (error: Error | null, result: SocketAck<{ room: RoomView }>) => error ? reject(error) : resolve(result));
});
const configured = (room: RoomView, change: unknown, requestId = crypto.randomUUID()) => ({ requestId, roomId: room.id, change });
const view = async (socket: Socket) => {
  const result = await ack(socket, 'room:resume', {}); if (!result.ok) throw new Error(result.error.code); return result.room;
};

it('B05-03/06/11 comunicación real: dos sesiones y dos pestañas del host, selección segura, últimos cambios y ningún conflicto por revisión', async () => {
  const s = await boot();
  const tab = io(s.base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: s.host.cookie, Origin: s.base } }); clients.push(tab);
  await new Promise<void>((resolve) => tab.once('connect', resolve));
  const guestUpdate = new Promise<RoomView>((resolve) => s.guest.socket.once('room:state', (event) => resolve(event.room)));
  const result = await ack(s.host.socket, 'room:configure', configured(s.room, { field: 'deck', value: { id: 'prueba', contentVersion: 7 } }));
  expect(result.ok).toBe(true); const guestView = await guestUpdate;
  expect(guestView.selectedDeck).toEqual(s.loaded.response.decks[0]); expect(guestView.participant.role).toBe('GUEST');
  expect(Object.keys(guestView.selectedDeck!)).toHaveLength(8); expect(JSON.stringify(guestView)).not.toMatch(/cards|playValue|SessionId|publication|instructions/);
  const first = await ack(tab, 'room:configure', configured(s.room, { field: 'turnSeconds', value: 15 }, 'first'));
  const outcomes = await Promise.all([
    ack(s.host.socket, 'room:configure', configured(s.room, { field: 'reviewSeconds', value: 0 }, 'review')),
    ack(tab, 'room:configure', configured(s.room, { field: 'turnSeconds', value: 60 }, 'last'))
  ]);
  expect(first.ok && outcomes.every((outcome) => outcome.ok)).toBe(true);
  const current = await view(s.guest.socket); expect(current.settings).toMatchObject({ turnSeconds: 60, reviewSeconds: 0 });
  const repeated = await ack(tab, 'room:configure', configured(s.room, { field: 'turnSeconds', value: 15 }, 'first'));
  expect(repeated.ok && repeated.room.settings.turnSeconds).toBe(60);
  for (const field of ['deck', 'hostPlays', 'turnSeconds', 'forceTieBreak', 'reviewSeconds']) {
    const value = field === 'deck' ? null : field === 'turnSeconds' ? 15 : field === 'reviewSeconds' ? 2 : false;
    for (const socket of [s.guest.socket, s.foreign.socket]) expect(await ack(socket, 'room:configure', configured(s.room, { field, value })))
      .toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  }
  const ended = await view(tab); expect(ended.settings).toEqual(current.settings); expect(ended.lifecycle.expiresAt).toBe(current.lifecycle.expiresAt);
});

it('B05-05/07 payloads estrictos y errores de versión no alteran la configuración ni actividad', async () => {
  const s = await boot(); const before = await view(s.host.socket); s.time.elapse(1000);
  const bad: unknown[] = [null, [], {}, { field: 'unknown', value: true }, { field: 'turnSeconds', value: '15' },
    { field: 'turnSeconds', value: 0 }, { field: 'reviewSeconds', value: 1 }, { field: 'reviewSeconds', value: '0' },
    { field: 'hostPlays', value: 0 }, { field: 'forceTieBreak', value: 'false' }, { field: 'deck', value: [] },
    { field: 'deck', value: { id: 'prueba', contentVersion: '7' } }, { field: 'deck', value: { id: 'prueba', contentVersion: 0 } },
    { field: 'deck', value: { id: 'prueba', contentVersion: 1.5 } }, { field: 'deck', value: { id: 'CON', contentVersion: 7 } },
    { field: 'deck', value: { id: 'con', contentVersion: 7 } }, { field: 'deck', value: { id: '../prueba', contentVersion: 7 } },
    { field: 'deck', value: { id: 'prueba', contentVersion: 7, available: true } }, { field: 'hostPlays', value: false, turnSeconds: 15 }];
  for (const change of bad) expect(await ack(s.host.socket, 'room:configure', configured(s.room, change)))
    .toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  const valid = configured(s.room, { field: 'reviewSeconds', value: 0 });
  for (const input of [{ ...valid, role: 'HOST' }, { ...valid, revision: 1 }, { ...valid, requestId: '' }, { ...valid, requestId: 'x'.repeat(101) }, { ...valid, roomId: 'x'.repeat(101) }]) {
    expect(await ack(s.host.socket, 'room:configure', input)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  }
  for (const [id, version, code] of [['missing', 7, 'DECK_NOT_AVAILABLE'], ['generica', 1, 'DECK_NOT_AVAILABLE'], ['prueba', 8, 'DECK_VERSION_MISMATCH']] as const) {
    expect(await ack(s.host.socket, 'room:configure', configured(s.room, { field: 'deck', value: { id, contentVersion: version } })))
      .toMatchObject({ ok: false, error: { code } });
  }
  expect(await view(s.host.socket)).toMatchObject({ revision: before.revision, settings: before.settings, lifecycle: { expiresAt: before.lifecycle.expiresAt } });
});

it('B05-10 carrera real por última plaza y B05-14 vencimiento controlado impide rescate', async () => {
  const s = await boot();
  expect((await ack(s.host.socket, 'room:configure', configured(s.room, { field: 'hostPlays', value: false }))).ok).toBe(true);
  for (let n = 0; n < 3; n++) {
    const guest = await s.session(); await ack(guest.socket, 'room:join', { requestId: `join-${n}`, code: s.room.code, name: 'Ana' });
  }
  const contender = await s.session();
  const race = await Promise.all([
    ack(s.host.socket, 'room:configure', configured(s.room, { field: 'hostPlays', value: true })),
    ack(contender.socket, 'room:join', { requestId: 'race', code: s.room.code, name: 'Última' })
  ]);
  expect(race.filter((result) => result.ok)).toHaveLength(1);
  expect(race.find((result) => !result.ok)).toMatchObject({ error: { code: 'ROOM_FULL' } });
  expect((await view(s.host.socket)).participants.filter((p) => p.isPlayer)).toHaveLength(5);
  const closes: unknown[] = []; s.host.socket.on('room:closed', (event) => closes.push(event));
  s.time.elapse(30 * 60_000);
  expect(await ack(s.host.socket, 'room:configure', configured(s.room, { field: 'reviewSeconds', value: 0 })))
    .toMatchObject({ ok: false, error: { code: 'ROOM_NOT_AVAILABLE' } });
  expect(closes).toHaveLength(1); expect(closes[0]).toMatchObject({ reason: 'INACTIVITY' });
});

it('B05-05 el adaptador requiere resumen y definición de la misma versión; un resumen solo no acredita disponibilidad', async () => {
  const s = await boot(); const summary = s.loaded.response.decks[0];
  const missing = new LoadedDeckCatalog([summary], new Map(), new Map());
  expect(missing.resolveVersion('prueba', 7)).toEqual({ ok: false, reason: 'DECK_NOT_AVAILABLE' });
  const wrong = new LoadedDeckCatalog([summary], new Map([['prueba', { contentVersion: 8, definition: s.loaded.catalog.definition('prueba')! }]]), new Map());
  expect(wrong.resolveVersion('prueba', 7)).toEqual({ ok: false, reason: 'DECK_NOT_AVAILABLE' });
  expect(s.loaded.catalog.resolveVersion('prueba', 6)).toEqual({ ok: false, reason: 'DECK_VERSION_MISMATCH' });
  expect(s.loaded.catalog.resolveVersion('prueba', 7)).toEqual({ ok: true, summary });
  expect(s.loaded.catalog.resolveVersion('generica', 1)).toEqual({ ok: false, reason: 'DECK_NOT_AVAILABLE' });
});
