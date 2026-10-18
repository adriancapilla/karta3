import { afterEach, expect, it } from 'vitest';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { io, type Socket } from 'socket.io-client';
import { createRuntime } from './composition/createApp.js';
import { loadInstallationDecks } from './composition/decks.js';
import { UsageRecording } from './application/usage/recording.js';
import { SqliteUsageWorker } from './infrastructure/usage/sqliteWorker.js';
import { UsageAdmission } from './infrastructure/usage/http.js';
import { MemoryRoomRepository } from './infrastructure/memoryRoomRepository.js';
import { ControlledTime } from '../tests/support/controlledTime.js';
import type { UsageEvent } from './application/usage/contracts.js';
import type { SocketAck, RoomResponse } from '../shared/contracts/room.js';
import { SystemClock } from './infrastructure/time.js';

const stops: (() => Promise<void>)[] = [];
afterEach(async () => { for (const stop of stops.splice(0)) await stop(); });
async function setup(enabled = true, realTime = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-usage-socket-')); const time = new ControlledTime(); const repository = new MemoryRoomRepository();
  const file = path.join(root, 'usage.sqlite'); const boot = randomUUID();
  const clock = realTime ? new SystemClock() : time;
  const writer = new SqliteUsageWorker({ file, environment: 'test', bootRef: boot, now: Math.floor(clock.now().unix) }); await writer.ready;
  const usage = new UsageRecording(writer, clock, randomUUID, 'test', 'SYNTHETIC', boot);
  const decks = (await loadInstallationDecks()).catalog;
  const runtime = createRuntime({ repository, clock, ...(realTime ? {} : { scheduler: time }), decks, deckVersions: decks, gameDecks: decks,
    ...(enabled ? { usage, usageHttp: { enabled, recorder: usage, admission: new UsageAdmission(() => time.now().unix) } } : {}) });
  const server = createServer(runtime.app); runtime.attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve)); const address = server.address();
  const base = `http://127.0.0.1:${address && typeof address === 'object' ? address.port : 0}`; const sockets: Socket[] = [];
  const post = (route: string, body: object, cookie = '', extra: Record<string, string> = {}) => fetch(base + route,
    { method: 'POST', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });
  const player = async (cookie?: string) => {
    cookie ??= (await fetch(base + '/api/rooms/current')).headers.get('set-cookie')!.split(';')[0];
    const socket = io(base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: base } }); sockets.push(socket);
    await new Promise<void>((resolve) => socket.once('connect', resolve)); return { cookie, socket };
  };
  const facts = async () => { await writer.drain(); const db = new DatabaseSync(file, { readOnly: true });
    try { return db.prepare('SELECT payload FROM events ORDER BY at,rowid').all().map((r) => JSON.parse(String(r.payload)) as UsageEvent); } finally { db.close(); } };
  stops.push(async () => { for (const s of sockets) s.disconnect(); runtime.dispose(); await writer.close();
    await new Promise<void>((resolve) => server.close(() => resolve())); server.closeAllConnections();
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-usage-socket-')) throw new Error('ruta'); fs.rmSync(root, { recursive: true, force: true }); });
  return { root, file, time, repository, runtime, writer, post, player, facts, base };
}
const send = async (socket: Socket, event: string, data: object) => socket.emitWithAck(event, data) as Promise<SocketAck<RoomResponse>>;
it('HTTP/Socket.IO reales: dos sesiones/dos pestañas, repetición/concurrencia y privacidad en DB', async () => {
  const f = await setup(); const host = await f.player(); const tab = await f.player(host.cookie); const guest = await f.player();
  const context = { visitId: randomUUID(), intentId: randomUUID() };
  const intended = { eventId: randomUUID(), version: 1, visitId: context.visitId, name: 'room_create_intended', data: { intentId: context.intentId } };
  expect((await f.post('/api/usage/events', intended)).status).toBe(202); expect((await f.post('/api/usage/events', intended)).status).toBe(202);
  const created = await (await f.post('/api/rooms', {}, host.cookie, { 'X-Karta3-Usage-Context': JSON.stringify(context) })).json() as RoomResponse;
  await f.post('/api/rooms', {}, host.cookie); const roomId = created.room.id;
  const join = { requestId: 'join-same', code: created.room.code, name: 'Nombre que nunca se almacena', usageContext: { extra: 'invalid-context' } };
  // Se ignora la primera confirmación; repetir el mismo envío recupera la participación.
  guest.socket.emit('room:join', join, () => {});
  const joined = await send(guest.socket, 'room:join', join); expect(joined.ok).toBe(false); // Nombre >16: rechazo válido y deduplicado.
  const acceptedInput = { ...join, name: 'Invitado privado', requestId: 'join-valid' };
  guest.socket.emit('room:join', acceptedInput, () => {});
  const accepted = await send(guest.socket, 'room:join', acceptedInput); expect(accepted.ok).toBe(true);
  await send(host.socket, 'room:configure', { requestId: 'deck', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
  await send(host.socket, 'room:configure', { requestId: 'review', roomId, change: { field: 'reviewSeconds', value: 0 } });
  const starts = await Promise.all([send(host.socket, 'room:start', { requestId: 'start1', roomId }), send(tab.socket, 'room:start', { requestId: 'start2', roomId })]);
  expect(starts.every((r) => r.ok)).toBe(true);
  f.time.advance(120_000); expect(f.repository.findById(roomId)?.status).toBe('RESULTS');
  const facts = await f.facts(); const count = (name: string) => facts.filter((e) => e.name === name).length;
  expect(count('room_create_intended')).toBe(1); expect(count('room_created')).toBe(1); expect(count('room_join_resolved')).toBe(2);
  expect(count('game_started')).toBe(1); expect(count('human_became_automatic')).toBe(2); expect(count('game_ended')).toBe(1);
  const text = JSON.stringify(facts); for (const excluded of [created.room.code, created.room.id, 'Invitado privado', 'Nombre que nunca se almacena', host.cookie.split('=')[1], 'requestId', 'hand', 'permutation']) expect(text).not.toContain(excluded);
  for (const result of starts) expect(JSON.stringify(result)).not.toMatch(/visitId|intentId|roomRef|gameRef|bootRef|participationRef/);
});
it('snapshot de las tres copias aprobadas, versiones exactas, modos compartidos y roster humano/bots', async () => {
  const f = await setup(); const host = await f.player(); const guest = await f.player();
  const selections = [{ id: 'criaturas-magicas', contentVersion: 2 }, { id: 'generica', contentVersion: 4 }, { id: 'sistema-solar', contentVersion: 4 }];
  for (const [i, selection] of selections.entries()) {
    const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
    await send(guest.socket, 'room:join', { requestId: `join${i}`, code: created.room.code, name: 'Sintético' });
    await send(host.socket, 'room:bot-add', { requestId: `bot${i}`, roomId });
    for (const [field, value] of Object.entries({ deck: selection, hostPlays: i !== 1, attributeValueMode: i === 1 ? 'DISPLAY_VALUE' : 'PLAY_VALUE', optimizeForMobile: i > 0 })) {
      expect((await send(host.socket, 'room:configure', { requestId: `${i}:${field}`, roomId, change: { field, value } })).ok).toBe(true);
    }
    const started = await send(host.socket, 'room:start', { requestId: `start${i}`, roomId }); expect(started.ok).toBe(true);
    const room = f.repository.findById(roomId)!;
    expect((await send(host.socket, 'game:cancel', { requestId: `cancel${i}`, roomId, gameId: room.game!.id })).ok).toBe(true);
  }
  const facts = await f.facts(); const starts = facts.filter((e) => e.name === 'game_started');
  expect(starts.map((e) => [e.data.configuration.deckId, e.data.configuration.deckSchemaVersion, e.data.configuration.deckContentVersion]))
    .toEqual(selections.map((s) => [s.id, 2, s.contentVersion]));
  expect(starts.map((e) => e.data.configuration.hostPlays)).toEqual([true, false, true]);
  expect(starts.map((e) => e.data.humanParticipations.length)).toEqual([2, 1, 2]);
  expect(facts.filter((e) => e.name === 'game_ended')).toHaveLength(3);
});
it('B18 escritor bloqueado no impide un turno real de 15 s, activo desconectado y observación desde otra sesión', async () => {
  const f = await setup(true, true); const host = await f.player(); const guest = await f.player();
  const created = await (await f.post('/api/rooms', {}, host.cookie)).json() as RoomResponse; const roomId = created.room.id;
  expect((await send(guest.socket, 'room:join', { requestId: 'join', code: created.room.code, name: 'Sintético' })).ok).toBe(true);
  await send(host.socket, 'room:configure', { requestId: 'deck', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
  await send(host.socket, 'room:configure', { requestId: 'turn', roomId, change: { field: 'turnSeconds', value: 15 } });
  const started = await send(host.socket, 'room:start', { requestId: 'start', roomId }); expect(started.ok).toBe(true);
  await f.writer.drain(); const lock = new DatabaseSync(f.file); lock.exec('BEGIN IMMEDIATE');
  try {
    const room = f.repository.findById(roomId)!; const deadline = room.gameTurn!;
    guest.socket.disconnect();
    expect((await f.post('/api/usage/events', { eventId: randomUUID(), version: 1, visitId: randomUUID(), name: 'home_viewed', data: { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' } })).status).toBe(202);
    const observed = await new Promise<{ observedAt: number; turnId: string }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout de observación real')), 18_000);
      host.socket.on('game:turn-expired', (event) => { clearTimeout(timer); resolve({ observedAt: Date.now(), turnId: event.turnId }); });
    });
    expect(observed.turnId).toBe(deadline.turnId); expect(observed.observedAt).toBeGreaterThanOrEqual(Math.floor(deadline.endsAt));
    expect(room.game!.round.plays[0].mode).toBe('TIMEOUT'); expect(f.writer.status().queue).toBeGreaterThan(0);
    expect(f.writer.status().queue).toBeLessThanOrEqual(2048); expect(f.writer.status().bytes).toBeLessThanOrEqual(2 * 1024 ** 2);
    fs.mkdirSync('playwright-report/b18', { recursive: true });
    fs.writeFileSync('playwright-report/b18/writer-blocked-real-turn.json', JSON.stringify({ node: process.version, sqlite: process.versions.sqlite,
      gameId: room.game!.id, round: room.game!.round.number, turnId: deadline.turnId, startedAt: deadline.startedAt, deadline: deadline.endsAt,
      observedAt: observed.observedAt, disconnectedActive: true, otherSessionObserving: true, writer: f.writer.status() }, null, 2));
  } finally { lock.exec('ROLLBACK'); lock.close(); }
}, 25_000);
it('ingesta cerrada: origen, 2 KiB, extras/SERVER/UUID y límites; normal apagada sin hechos', async () => {
  const f = await setup(); const visitId = randomUUID();
  const fact = () => ({ eventId: randomUUID(), version: 1, visitId, name: 'home_viewed', data: { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' } });
  expect((await f.post('/api/usage/events', fact(), '', { Origin: 'https://ajeno.invalid' })).status).toBe(403);
  expect((await f.post('/api/usage/events', { ...fact(), name: 'game_started' })).status).toBe(400);
  expect((await f.post('/api/usage/events', { ...fact(), source: 'SERVER' })).status).toBe(400);
  expect((await f.post('/api/usage/events', { ...fact(), visitId: 'bad' })).status).toBe(400);
  expect((await f.post('/api/usage/events', { ...fact(), padding: 'x'.repeat(2048) })).status).toBe(413);
  for (let i = 0; i < 10; i++) expect((await f.post('/api/usage/events', fact())).status).toBe(202);
  expect((await f.post('/api/usage/events', fact())).status).toBe(429);
  const off = await setup(false); expect((await off.post('/api/usage/events', fact())).status).toBe(204);
  const host = await off.player(); expect((await off.post('/api/rooms', {}, host.cookie)).status).toBe(201); expect(await off.facts()).toEqual([]);
});
