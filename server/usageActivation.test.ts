import { afterEach, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { io, type Socket } from 'socket.io-client';
import type { Worker } from 'node:worker_threads';
import { createUsageRuntime } from './composition/usage.js';
import { createRuntime } from './composition/createApp.js';
import { loadInstallationDecks } from './composition/decks.js';
import { privateDirectory } from './infrastructure/usage/privateFiles.js';
import type { SqliteUsageWorker } from './infrastructure/usage/sqliteWorker.js';
import type { UsageEvent } from './application/usage/contracts.js';
import type { SocketAck, RoomResponse, CurrentRoomResponse } from '../shared/contracts/room.js';
import { ControlledTime } from '../tests/support/controlledTime.js';

const stops: (() => Promise<void>)[] = [];
let approvedDecks: ReturnType<typeof loadInstallationDecks> | undefined;
afterEach(async () => { for (const stop of stops.splice(0)) await stop(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
async function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-b19-wire-')); const data = path.join(root, 'data');
  const secret = path.join(root, 'secret'); privateDirectory(secret, true);
  const key = path.join(secret, 'copy.key'); fs.writeFileSync(key, randomBytes(32).toString('hex'), { mode: 0o600 });
  vi.stubEnv('KARTA3_ENV', 'pruebas'); vi.stubEnv('KARTA3_USAGE_COLLECTION', 'human'); vi.stubEnv('KARTA3_USAGE_DIRECTORY', data);
  vi.stubEnv('KARTA3_USAGE_BACKUP_KEY_FILE', key); vi.stubEnv('KARTA3_USAGE_BACKUP_KEY', '');
  // Información completa FABRICADA por contrato de la prueba, no autorización de usuarios reales.
  const usage = await createUsageRuntime(true); expect(usage.http?.enabled).toBe(true);
  const time = new ControlledTime(); const decks = (await (approvedDecks ??= loadInstallationDecks())).catalog;
  const runtime = createRuntime({ clock: time, scheduler: time, decks, deckVersions: decks, gameDecks: decks, usage: usage.recorder, usageHttp: usage.http });
  const server = createServer(runtime.app); runtime.attachRealtime(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); const base = `http://127.0.0.1:${address && typeof address === 'object' ? address.port : 0}`;
  const sockets: Socket[] = [];
  const post = (route: string, body: object, cookie = '') => fetch(base + route, { method: 'POST', headers: {
    Cookie: cookie, Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const player = async (original?: string) => {
    const cookie = original ?? (await fetch(base + '/api/rooms/current')).headers.get('set-cookie')!.split(';')[0];
    const socket = io(base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: base } }); sockets.push(socket);
    await new Promise<void>(resolve => socket.once('connect', resolve));
    const send = (event: string, payload: object) => socket.emitWithAck(event, payload) as Promise<SocketAck<RoomResponse>>;
    const current = async () => {
      const result = await (await fetch(base + '/api/rooms/current', { headers: { Cookie: cookie } })).json() as CurrentRoomResponse;
      if (!result.room) throw new Error('sala fabricada esperada'); return result.room;
    };
    return { cookie, socket, send, current };
  };
  const file = path.join(data, 'pruebas', 'human', 'usage.sqlite');
  const events = () => { const db = new DatabaseSync(file, { readOnly: true }); try {
    return db.prepare('SELECT payload FROM events ORDER BY at,rowid').all().map(row => JSON.parse(String(row.payload)) as UsageEvent);
  } finally { db.close(); } };
  stops.push(async () => {
    sockets.forEach(socket => socket.disconnect()); runtime.dispose(); await usage.close();
    await new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); });
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b19-wire-')) throw new Error('ruta propia');
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, file, usage, time, base, post, player, events };
}
it('H03 HUMAN fabricado: dos sesiones/dos sockets host, nueve hechos sin ampliar DTO y terminal único', async () => {
  const f = await setup(); const host = await f.player(); const tab = await f.player(host.cookie); const guest = await f.player();
  const visitId = randomUUID(); const intentId = randomUUID();
  for (const [name, data] of [
    ['home_viewed', { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' }],
    ['room_create_intended', { intentId }], ['room_join_attempted', { intentId: randomUUID() }]
  ] as const) expect((await f.post('/api/usage/events', { version: 1, eventId: randomUUID(), visitId, name, data })).status).toBe(202);
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  expect((await f.post('/api/rooms', {}, host.cookie)).status).toBe(201); // Recuperación, no nueva sala.
  const join = { requestId: 'join-fabricado', code: created.room.code, name: 'Ensayo' };
  expect((await guest.send('room:join', join)).ok).toBe(true); expect((await guest.send('room:join', join)).ok).toBe(true);
  expect((await host.send('room:bot-add', { requestId: 'bot', roomId })).ok).toBe(true);
  for (const change of [{ field: 'deck', value: { id: 'generica', contentVersion: 4 } }, { field: 'turnSeconds', value: 15 }, { field: 'reviewSeconds', value: 0 }]) {
    expect((await host.send('room:configure', { requestId: randomUUID(), roomId, change })).ok).toBe(true);
  }
  const start = { requestId: 'start-fabricado', roomId };
  const starts = await Promise.all([host.send('room:start', start), tab.send('room:start', start)]); expect(starts.every(ack => ack.ok)).toBe(true);
  let room = await host.current();
  for (let step = 0; step < 20 && room.status === 'IN_GAME'; step++) { f.time.advance(15_000); room = await host.current(); }
  expect(room.status).toBe('RESULTS'); if (room.status !== 'RESULTS') throw new Error('resultado fabricado esperado');
  expect(room.result.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS');
  const home = { requestId: 'home-fabricado', roomId, gameId: room.result.gameId };
  expect((await host.send('results:return-home', home)).ok).toBe(true);
  const next = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse;
  expect((await fetch(`${f.base}/api/rooms/${next.room.id}`, { method: 'DELETE', headers: { Cookie: host.cookie, Origin: f.base } })).status).toBe(204);
  await expect.poll(() => new Set(f.events().map(event => event.name)).size).toBe(9);
  const facts = f.events(); expect(facts.every(event => event.environment === 'pruebas' && event.traffic === 'HUMAN')).toBe(true);
  expect(facts.filter(event => event.name === 'game_started')).toHaveLength(1); expect(facts.filter(event => event.name === 'game_ended')).toHaveLength(1);
  expect(facts.filter(event => event.name === 'human_became_automatic')).toHaveLength(2);
  for (const excluded of [roomId, created.room.code, 'Ensayo', host.cookie, guest.cookie, room.result.gameId, 'requestId', 'hand', 'playValue']) expect(JSON.stringify(facts)).not.toContain(excluded);
  expect((await f.post('/api/usage/events', { ...facts[0], name: 'game_started' })).status).toBe(400);
});
it('H05 caída real del escritor retira señal, ignora ingestión tardía y conserva juego y plazos', async () => {
  const f = await setup(); const host = await f.player();
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  expect((await host.send('room:bot-add', { requestId: 'bot', roomId })).ok).toBe(true);
  for (const change of [{ field: 'deck', value: { id: 'generica', contentVersion: 4 } }, { field: 'turnSeconds', value: 15 }, { field: 'reviewSeconds', value: 0 }]) {
    expect((await host.send('room:configure', { requestId: randomUUID(), roomId, change })).ok).toBe(true);
  }
  expect((await host.send('room:start', { requestId: 'start', roomId })).ok).toBe(true);
  await expect.poll(() => f.events().filter(event => event.name === 'game_started').length).toBe(1); const before = f.events().length;
  const writer = (f.usage.recorder as unknown as { sink: SqliteUsageWorker }).sink;
  await (writer as unknown as { worker: Worker }).worker.terminate();
  await expect.poll(() => f.usage.http?.enabled).toBe(false);
  const response = await fetch(f.base + '/api/rooms/current', { headers: { Cookie: host.cookie } }); expect(response.headers.get('X-Karta3-Usage-Collection')).toBe('off');
  expect((await f.post('/api/usage/events', { eventId: randomUUID(), version: 1, visitId: randomUUID(), name: 'home_viewed',
    data: { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' } })).status).toBe(204);
  f.time.advance(15_000); const room = await host.current(); expect(room.status).toBe('IN_GAME');
  if (room.status !== 'IN_GAME') throw new Error('partida fabricada esperada');
  expect(room.game.ownConsecutiveTimeouts).toBe(1); expect(f.events()).toHaveLength(before);
});
