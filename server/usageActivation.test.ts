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
import type { SocketAck, RoomResponse, CurrentRoomResponse, RoomStateEvent } from '../shared/contracts/room.js';
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
  const time = new ControlledTime(); const usage = await createUsageRuntime(true, { clock: time, scheduler: time }); expect(usage.http?.enabled).toBe(true);
  const decks = (await (approvedDecks ??= loadInstallationDecks())).catalog;
  const runtime = createRuntime({ clock: time, scheduler: time, decks, deckVersions: decks, gameDecks: decks, usage: usage.recorder, usageHttp: usage.http });
  const server = createServer(runtime.app); runtime.attachRealtime(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); const base = `http://127.0.0.1:${address && typeof address === 'object' ? address.port : 0}`;
  const sockets: Socket[] = [];
  const post = (route: string, body: object, cookie = '') => fetch(base + route, { method: 'POST', headers: {
    Cookie: cookie, Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const player = async (original?: string, consent = true) => {
    const cookie = original ?? (await fetch(base + '/api/rooms/current')).headers.get('set-cookie')!.split(';')[0];
    const initialChoice = await (await fetch(base + '/api/usage/choice', { headers: { Cookie: cookie } })).json();
    if (consent && initialChoice.decision !== 'ACCEPTED') {
      const accepted = await fetch(base + '/api/usage/choice', { method: 'PUT', headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'ACCEPTED', noticeVersion: initialChoice.noticeVersion, expectedRevision: initialChoice.revision, requestId: randomUUID() }) });
      expect(accepted.status).toBe(200);
    }
    const socket = io(base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: base } }); sockets.push(socket);
    const states: RoomStateEvent[] = []; socket.on('room:state', value => states.push(value));
    await new Promise<void>(resolve => socket.once('connect', resolve));
    const send = (event: string, payload: object) => socket.emitWithAck(event, payload) as Promise<SocketAck<RoomResponse>>;
    const current = async () => {
      const result = await (await fetch(base + '/api/rooms/current', { headers: { Cookie: cookie } })).json() as CurrentRoomResponse;
      if (!result.room) throw new Error('sala fabricada esperada'); return result.room;
    };
    const choice = async () => (await fetch(base + '/api/usage/choice', { headers: { Cookie: cookie } })).json();
    const decide = async (decision: 'ACCEPTED' | 'REJECTED', extra: Record<string, unknown> = {}) => {
      const state = await choice(); return fetch(base + '/api/usage/choice', { method: 'PUT', headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, noticeVersion: state.noticeVersion, expectedRevision: state.revision, requestId: randomUUID(), ...extra }) });
    };
    return { cookie, socket, states, send, current, choice, decide };
  };
  const file = path.join(data, 'pruebas', 'human', 'usage.sqlite');
  const events = () => { const db = new DatabaseSync(file, { readOnly: true }); try {
    return db.prepare('SELECT payload FROM events ORDER BY at,rowid').all().map(row => JSON.parse(String(row.payload)) as UsageEvent);
  } finally { db.close(); } };
  const state = () => { const db = new DatabaseSync(file, { readOnly: true }); try { return {
    subjects: db.prepare('SELECT payload FROM subjects').all().map(row => JSON.parse(String(row.payload))),
    proofs: db.prepare('SELECT * FROM usage_choice_proofs').all() }; } finally { db.close(); } };
  stops.push(async () => {
    sockets.forEach(socket => socket.disconnect()); runtime.dispose(); await usage.close();
    await new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); });
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b19-wire-')) throw new Error('ruta propia');
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, file, usage, time, base, post, player, events, state };
}
// Incluye ACL/worker/catálogo fríos y varias conexiones; no es un SLA de ingesta.
// La espera de los nueve hechos y todos los plazos funcionales conservan sus límites.
it('H03 HUMAN fabricado: dos sesiones/dos sockets host, nueve hechos sin ampliar DTO y terminal único', async () => {
  const f = await setup(); const host = await f.player(); const tab = await f.player(host.cookie); const guest = await f.player();
  const visitId = randomUUID(); const intentId = randomUUID();
  for (const [name, data] of [
    ['home_viewed', { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' }],
    ['room_create_intended', { intentId }], ['room_join_attempted', { intentId: randomUUID() }]
  ] as const) expect((await f.post('/api/usage/events', { version: 1, eventId: randomUUID(), visitId, name, data }, host.cookie)).status).toBe(202);
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
}, 10_000);
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
it('H02 sin decidir permite jugar; aceptar después no reconstruye creación/entrada/inicio del ciclo', async () => {
  const f = await setup(); const host = await f.player(undefined, false); const guest = await f.player();
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse;
  expect(f.events()).toEqual([]); expect((await host.decide('ACCEPTED')).status).toBe(200);
  expect((await guest.send('room:join', { requestId: 'join-no-backfill', code: created.room.code, name: 'Ensayo' })).ok).toBe(true);
  expect((await host.send('room:configure', { requestId: 'deck', roomId: created.room.id, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } })).ok).toBe(true);
  expect((await host.send('room:start', { requestId: 'start', roomId: created.room.id })).ok).toBe(true);
  const room = await host.current(); expect(room.status).toBe('IN_GAME'); expect(f.events()).toEqual([]);
});
it('H03 sala mixta con anfitrión observador se censura sin impedir entrada o inicio y sin snapshot ajeno', async () => {
  const f = await setup(); const host = await f.player(); const guest = await f.player(); const other = await f.player(undefined, false);
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  await expect.poll(() => f.events().filter(event => event.name === 'room_created').length).toBe(1);
  expect((await host.send('room:configure', { requestId: 'observer', roomId, change: { field: 'hostPlays', value: false } })).ok).toBe(true);
  expect((await guest.send('room:join', { requestId: 'joined', code: created.room.code, name: 'Ensayo' })).ok).toBe(true);
  await expect.poll(() => f.events().filter(event => event.name === 'room_join_resolved').length).toBe(1);
  expect((await other.send('room:join', { requestId: 'mixed', code: created.room.code, name: 'Sin permiso' })).ok).toBe(true);
  await expect.poll(() => f.state().subjects.find(subject => subject.kind === 'room')?.state).toBe('OBSERVATION_CENSORED');
  expect((await other.decide('ACCEPTED')).status).toBe(200);
  expect((await host.send('room:configure', { requestId: 'deck', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } })).ok).toBe(true);
  expect((await host.send('room:start', { requestId: 'start', roomId })).ok).toBe(true);
  expect(f.events().filter(event => event.name === 'game_started')).toHaveLength(0);
  expect(f.events().filter(event => event.name === 'room_join_resolved')).toHaveLength(1); // Solo antes de perder cobertura.
  expect(JSON.stringify(f.events())).not.toContain('Sin permiso');
});
it('H03/H06 retirada entre pestañas corta SERVER/BROWSER y cola; no cambia Game ni revierte por replays', async () => {
  const f = await setup(); const host = await f.player(); const tab = await f.player(host.cookie); const guest = await f.player();
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  expect((await guest.send('room:join', { requestId: 'join', code: created.room.code, name: 'Ensayo' })).ok).toBe(true);
  for (const change of [{ field: 'deck', value: { id: 'generica', contentVersion: 4 } }, { field: 'turnSeconds', value: 15 }, { field: 'reviewSeconds', value: 0 }])
    expect((await host.send('room:configure', { requestId: randomUUID(), roomId, change })).ok).toBe(true);
  expect((await host.send('room:start', { requestId: 'start', roomId })).ok).toBe(true);
  await expect.poll(() => f.events().filter(event => event.name === 'game_started').length).toBe(1);
  const before = await host.current(); if (before.status !== 'IN_GAME') throw new Error('mesa esperada');
  const own: unknown[] = []; const second: unknown[] = []; const foreign: unknown[] = [];
  host.socket.on('usage:choice', data => own.push(data)); tab.socket.on('usage:choice', data => second.push(data)); guest.socket.on('usage:choice', data => foreign.push(data));
  const requestId = randomUUID(); const withdrawal = { requestId, noticeVersion: 'old', expectedRevision: 0 };
  const response = await host.decide('REJECTED', withdrawal); expect(response.status).toBe(200); const rejected = await response.json();
  expect(rejected.decision).toBe('REJECTED'); expect(response.headers.get('X-Karta3-Usage-Collection')).toBe('off');
  await expect.poll(() => second.length).toBe(1); expect(own).toHaveLength(1); expect(foreign).toHaveLength(0);
  expect(JSON.stringify(own)).not.toMatch(/session|proof|visit|roomRef|gameRef/);
  const after = await host.current(); if (after.status !== 'IN_GAME') throw new Error('mesa conservada');
  expect(after.game.id).toBe(before.game.id); expect(after.game.hand).toEqual(before.game.hand); expect(after.game.ownConsecutiveTimeouts).toBe(0);
  expect(f.state().subjects.find(subject => subject.kind === 'game')?.state).toBe('OBSERVATION_CENSORED');
  expect((await f.post('/api/usage/events', { version: 1, eventId: randomUUID(), visitId: randomUUID(), name: 'home_viewed',
    data: { navigation: 'DOCUMENT_INITIAL', viewId: randomUUID() } }, host.cookie)).status).toBe(204);
  expect((await host.decide('ACCEPTED')).status).toBe(200);
  const replay = await host.decide('REJECTED', withdrawal); expect((await replay.json()).decision).toBe('ACCEPTED');
  for (let step = 0; step < 12 && (await host.current()).status === 'IN_GAME'; step++) f.time.advance(15_000);
  expect((await host.current()).status).toBe('RESULTS');
  expect(f.events().filter(event => event.name === 'game_ended' || event.name === 'human_became_automatic')).toHaveLength(0);
});
it('H03 doce horas exactas cortan una partida recién iniciada sin terminarla (transporte real/reloj controlado)', async () => {
  const f = await setup(); const host = await f.player(); const guest = await f.player();
  f.time.advance(12 * 60 * 60_000 - 500);
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  expect((await guest.send('room:join', { requestId: 'join', code: created.room.code, name: 'Ensayo' })).ok).toBe(true);
  expect((await host.send('room:configure', { requestId: 'deck', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } })).ok).toBe(true);
  expect((await host.send('room:start', { requestId: 'start', roomId })).ok).toBe(true);
  await expect.poll(() => f.events().filter(event => event.name === 'game_started').length).toBe(1);
  f.time.advance(499); expect((await host.choice()).decision).toBe('ACCEPTED'); f.time.advance(1);
  expect((await host.choice()).decision).toBe('UNDECIDED'); expect((await host.current()).status).toBe('IN_GAME');
  await expect.poll(() => f.state().subjects.find(subject => subject.kind === 'game')?.state).toBe('OBSERVATION_CENSORED');
  expect(f.state().proofs.every(proof => proof.withdrawn_at === null)).toBe(true); // Vencimiento, no retirada inventada.
});
it('H02/H06 contrato HTTP cerrado: origen/sesión/tamaño/tipos, conflictos y replays nunca aceptan implícitamente', async () => {
  const f = await setup(); const host = await f.player(undefined, false); const initial = await host.choice();
  const input = { decision: 'ACCEPTED', noticeVersion: initial.noticeVersion, expectedRevision: initial.revision, requestId: randomUUID() };
  const put = (body: unknown, cookie = host.cookie, origin = f.base, type = 'application/json') => fetch(f.base + '/api/usage/choice', {
    method: 'PUT', headers: { Cookie: cookie, Origin: origin, 'Content-Type': type }, body: JSON.stringify(body) });
  expect(initial.decision).toBe('UNDECIDED'); expect(f.events()).toEqual([]); expect(f.state().proofs).toEqual([]);
  expect((await put(input, '', f.base)).status).toBe(401);
  expect((await put(input, host.cookie, 'https://untrusted.invalid')).status).toBe(403);
  expect((await put(input, host.cookie, f.base, 'text/plain')).status).toBe(400);
  for (const body of [null, [], { ...input, decision: true }, { ...input, expectedRevision: String(initial.revision) },
    { ...input, role: 'HOST' }, { ...input, requestId: '' }, { ...input, noticeVersion: '' }]) expect((await put(body)).status).toBe(400);
  expect((await put({ ...input, extra: 'x'.repeat(1024) })).status).toBe(413);
  expect((await put({ ...input, noticeVersion: 'old' })).status).toBe(409);
  const accepted = await put(input); expect(accepted.status).toBe(200); expect(accepted.headers.get('Cache-Control')).toBe('no-store');
  expect(accepted.headers.get('X-Karta3-Usage-Collection')).toBe('human');
  expect((await put(input)).status).toBe(200); expect(f.state().proofs).toHaveLength(1);
  expect((await put({ ...input, decision: 'REJECTED' })).status).toBe(409);
  const reject = await put({ decision: 'REJECTED', noticeVersion: 'old', expectedRevision: 0, requestId: randomUUID() });
  expect(reject.status).toBe(200); expect((await reject.json()).decision).toBe('REJECTED');
  const replay = await put(input); expect((await replay.json()).decision).toBe('REJECTED');
  expect(replay.headers.get('X-Karta3-Usage-Collection')).toBe('off');
  expect(JSON.stringify(f.state().proofs)).not.toMatch(/session|cookie|visit|room|game|role/);
});
it('H06 elección limita ráfaga por sesión sin impedir crear sala cuando se agota', async () => {
  const f = await setup(); const host = await f.player(undefined, false);
  for (let count = 0; count < 10; count++) expect((await host.decide('REJECTED')).status).toBe(200);
  expect((await host.decide('REJECTED')).status).toBe(429);
  expect((await f.post('/api/rooms', {}, host.cookie)).status).toBe(201); expect(f.events()).toEqual([]);
});

it('B20 HTTP/socket: ventanas privadas por conexión, dedupe, final A tras crear B y cuerpo normalizado', async () => {
  const f = await setup(); const host = await f.player(); const tab = await f.player(host.cookie); const guest = await f.player(); const foreign = await f.player();
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  await guest.send('room:join', { requestId: 'join-b20', code: created.room.code, name: 'Ensayo' });
  await host.send('room:configure', { requestId: 'deck-b20', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
  const start = { requestId: 'start-b20', roomId }; const ack = await host.send('room:start', start);
  expect(ack.ok).toBe(true); const playing = await host.current(); if (playing.status !== 'IN_GAME') throw Error('mesa esperada');
  const window = (p: typeof host, moment: 'START' | 'END') => p.states.find(state => state.appearanceWindow?.moment === moment)?.appearanceWindow;
  await expect.poll(() => [host, tab, guest].every(p => !!window(p, 'START'))).toBe(true);
  expect(window(host, 'START')!.token).not.toBe(window(tab, 'START')!.token);
  expect('appearanceWindow' in ack).toBe(false); expect(JSON.stringify(ack)).not.toContain(window(host, 'START')!.token);
  const photo = (p: typeof host, moment: 'START' | 'END', theme = 'LIGHT', origin = 'DEFAULT') => ({ eventId: randomUUID(), visitId: randomUUID(), version: 1,
    name: 'appearance_snapshot', data: { gameId: playing.game.id, moment, windowToken: window(p, moment)!.token, theme, origin } });
  const input = photo(host, 'START');
  expect((await f.post('/api/usage/events', input, foreign.cookie)).status).toBe(403);
  expect((await f.post('/api/usage/events', { ...input, data: { ...input.data, theme: 'DARK' } }, host.cookie)).status).toBe(400);
  expect((await f.post('/api/usage/events', input, host.cookie)).status).toBe(202);
  expect((await f.post('/api/usage/events', input, host.cookie)).status).toBe(204);
  expect((await f.post('/api/usage/events', { ...input, data: { ...input.data, theme: 'CREAM', origin: 'EXPLICIT' } }, host.cookie)).status).toBe(400);
  expect((await f.post('/api/usage/events', photo(tab, 'START', 'DARK', 'EXPLICIT'), tab.cookie)).status).toBe(204);
  expect((await f.post('/api/usage/events', photo(guest, 'START', 'CREAM', 'EXPLICIT'), guest.cookie)).status).toBe(202);
  const before = host.states.length; await tab.send('room:start', start); await host.send('room:resume', {});
  expect(host.states.slice(before).some(state => state.appearanceWindow?.moment === 'START')).toBe(false);
  await host.send('game:cancel', { requestId: 'cancel-b20', roomId, gameId: playing.game.id });
  await expect.poll(() => !!window(host, 'END')).toBe(true);
  const next = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse;
  expect((await f.post('/api/usage/events', photo(host, 'END', 'LIGHT', 'EXPLICIT'), host.cookie)).status).toBe(202);
  expect((await host.current()).id).toBe(next.room.id);
  const guestEnd = photo(guest, 'END'); f.time.advance(10000);
  expect((await f.post('/api/usage/events', guestEnd, guest.cookie)).status).toBe(204);
  await expect.poll(() => f.events().filter(event => event.name === 'appearance_snapshot').length).toBe(3);
  const photos = f.events().filter(event => event.name === 'appearance_snapshot');
  for (const event of photos) expect(Object.keys(event.data).sort()).toEqual(['gameRef', 'moment', 'origin', 'participationRef', 'roomRef', 'theme']);
  for (const excluded of [playing.game.id, roomId, host.cookie, input.data.windowToken, 'Ensayo', 'hand', 'windowToken', 'gameId']) expect(JSON.stringify(photos)).not.toContain(excluded);
});

it('B20 desconexión/retirada y escritor indisponible no reabren ventana ni bloquean acciones de juego', async () => {
  const f = await setup(); const host = await f.player(); const guest = await f.player();
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  await guest.send('room:join', { requestId: 'join-b20-lost', code: created.room.code, name: 'Ensayo' });
  await host.send('room:configure', { requestId: 'deck-b20-lost', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
  await host.send('room:start', { requestId: 'start-b20-lost', roomId });
  const playing = await host.current(); if (playing.status !== 'IN_GAME') throw Error('mesa esperada');
  await expect.poll(() => !!guest.states.find(state => state.appearanceWindow)).toBe(true);
  const photo = (p: typeof host) => ({ eventId: randomUUID(), visitId: randomUUID(), version: 1, name: 'appearance_snapshot',
    data: { gameId: playing.game.id, moment: 'START', windowToken: p.states.find(state => state.appearanceWindow)!.appearanceWindow!.token, theme: 'LIGHT', origin: 'DEFAULT' } });
  const guestPhoto = photo(guest); guest.socket.disconnect();
  const returned = await f.player(guest.cookie);
  expect((await f.post('/api/usage/events', guestPhoto, returned.cookie)).status).toBe(204);
  const writer = (f.usage.recorder as unknown as { sink: SqliteUsageWorker }).sink;
  const admission = vi.spyOn(writer, 'tryRecord').mockReturnValue(false);
  expect((await f.post('/api/usage/events', photo(host), host.cookie)).status).toBe(503); admission.mockRestore();
  await host.decide('REJECTED');
  expect((await f.post('/api/usage/events', photo(host), host.cookie)).status).toBe(204);
  const cancelled = await host.send('game:cancel', { requestId: 'cancel-b20-lost', roomId, gameId: playing.game.id });
  expect(cancelled.ok).toBe(true); if (!cancelled.ok) throw Error('cancelación esperada');
  expect(cancelled.room.status).toBe('RESULTS'); expect(f.events().filter(event => event.name === 'appearance_snapshot')).toEqual([]);
});
