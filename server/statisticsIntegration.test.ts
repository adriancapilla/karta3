import { afterEach, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { statisticsBrowserServer } from '../tests/support/statisticsBrowserServer.js';
import type { RoomResponse, RoomStateEvent, SocketAck } from '../shared/contracts/room.js';
import { STATISTICS_NOTICE_VERSION } from '../shared/contracts/statistics.js';
import type { Worker } from 'node:worker_threads';

const stops: (() => Promise<void>)[] = [];
afterEach(async () => { for (const stop of stops.splice(0)) await stop(); });
async function setup() {
  const s = await statisticsBrowserServer(); const sockets: Socket[] = [];
  stops.push(async () => { for (const socket of sockets) socket.disconnect(); await s.stop(); });
  const http = (route: string, cookie: string, body?: object, method = 'POST') => fetch(s.base + route, { method: body ? method : 'GET',
    headers: { Cookie: cookie, Origin: s.base, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const player = async (cookie?: string) => {
    cookie ??= (await fetch(s.base + '/api/rooms/current')).headers.get('set-cookie')!.split(';')[0];
    const socket = io(s.base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: s.base } }); sockets.push(socket);
    await new Promise<void>(resolve => socket.once('connect', resolve)); return { cookie, socket };
  };
  const send = (socket: Socket, event: string, data: object) => socket.emitWithAck(event, data) as Promise<SocketAck<RoomResponse>>;
  return { ...s, http, player, send };
}
it('B21 A01/A05/A08: dos sesiones y pestañas; altas nuevas, JOIN original, inicio/automático/terminal únicos y privacidad', async () => {
  const s = await setup(); const host = await s.player(); const tab = await s.player(host.cookie); const guest = await s.player();
  const room = (await (await s.http('/api/rooms', host.cookie, {})).json() as RoomResponse).room;
  await s.http('/api/rooms', host.cookie, {});
  const input = { requestId: 'join-original', code: room.code, name: 'Señuelo privado' };
  guest.socket.emit('room:join', input, () => {}); expect((await s.send(guest.socket, 'room:join', input)).ok).toBe(true);
  for (const [field, value] of Object.entries({ deck: { id: 'generica', contentVersion: 4 }, reviewSeconds: 0, turnSeconds: 15 }))
    expect((await s.send(host.socket, 'room:configure', { requestId: field, roomId: room.id, change: { field, value } })).ok).toBe(true);
  const start = { roomId: room.id, requestId: 'start' };
  expect((await s.send(host.socket, 'room:start', start)).ok).toBe(true); expect((await s.send(tab.socket, 'room:start', { ...start, requestId: 'start-tab' })).ok).toBe(true);
  s.time.advance(120_000); expect(s.repository.findById(room.id)?.status).toBe('RESULTS'); await s.writer.flush();
  expect(s.total('CREATION', 'all', 'total')).toBe(1); expect(s.total('JOIN', 'NEW_JOIN', 'outcome')).toBe(1);
  expect(s.total('GAME', 'started')).toBe(1); expect(s.total('GAME', 'NO_ACTIVE_HUMAN_PLAYERS')).toBe(1); expect(s.total('AUTOMATIC', 'became')).toBe(2);
  // Replay de JOIN posterior no sobrescribe su resolución original ni produce otra marginal.
  await s.send(guest.socket, 'room:join', input); await s.writer.flush(); expect(s.total('JOIN', 'NEW_JOIN', 'outcome')).toBe(1);
  const text = JSON.stringify(s.cells()); for (const excluded of [room.code, room.id, 'Señuelo privado', host.cookie, 'requestId', 'hand', 'gameId', 'eventId', 'visitId', 'proofRef']) expect(text).not.toContain(excluded);
  for (const path of ['/api/usage/choice', '/api/usage/events', '/agg-daily-v1.sqlite', '/statistics', '/statistics-data', '/backups']) expect((await s.http(path, host.cookie)).status).toBe(404);
});
it('B21 A05/A07: observador excluido corta ciclo, apariencia declinada no corta núcleo; cookie no se renueva por GET/replay', async () => {
  const s = await setup(); const host = await s.player(); const guest = await s.player();
  const get = async () => (await (await s.http('/api/statistics/exclusion', host.cookie)).json());
  const own = await get(); const cut = { excluded: true, expectedRevision: own.revision, requestId: 'cut' };
  const response = await s.http('/api/statistics/exclusion', host.cookie, cut, 'PUT'); expect(response.status).toBe(200); expect(response.headers.get('set-cookie')).toMatch(/karta3_statistics_exclusion=1%3A1/);
  expect((await s.http('/api/statistics/exclusion', host.cookie)).headers.get('set-cookie')).toBeNull();
  expect((await s.http('/api/statistics/exclusion', host.cookie, cut, 'PUT')).headers.get('set-cookie')).toBeNull();
  const revision = (await get()).revision; await s.http('/api/statistics/exclusion', host.cookie, { excluded: false, expectedRevision: revision, requestId: 'include' }, 'PUT');
  const room = (await (await s.http('/api/rooms', host.cookie, {})).json() as RoomResponse).room;
  await s.send(guest.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Invitado' });
  await s.send(host.socket, 'room:configure', { requestId: 'observer', roomId: room.id, change: { field: 'hostPlays', value: false } });
  await s.send(host.socket, 'room:bot-add', { requestId: 'bot', roomId: room.id });
  const before = await get(); await s.http('/api/statistics/exclusion', host.cookie, { excluded: true, expectedRevision: before.revision, requestId: 'cut-observer' }, 'PUT');
  await s.send(host.socket, 'room:configure', { requestId: 'deck', roomId: room.id, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
  expect((await s.send(host.socket, 'room:start', { requestId: 'start', roomId: room.id })).ok).toBe(true); await s.writer.flush();
  expect(s.total('WAITING', 'cut')).toBe(1); expect(s.total('GAME', 'started')).toBe(0);
});
it('B21 A07/A08: ventanas reales por conexión, sin permiso no hay metadata, primer par RAM y END antiguo no toca nueva sala', async () => {
  const s = await setup(); const host = await s.player(); const tab = await s.player(host.cookie); const guest = await s.player();
  const updates: RoomStateEvent[] = []; const other: RoomStateEvent[] = []; host.socket.on('room:state', e => updates.push(e)); tab.socket.on('room:state', e => other.push(e));
  const own = await (await s.http('/api/statistics/appearance-permission', host.cookie)).json();
  expect((await s.http('/api/statistics/appearance-permission', host.cookie, { decision: 'GRANT', noticeVersion: STATISTICS_NOTICE_VERSION, expectedRevision: own.revision, requestId: 'grant' }, 'PUT')).status).toBe(200);
  const room = (await (await s.http('/api/rooms', host.cookie, {})).json() as RoomResponse).room;
  await s.send(guest.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Invitado' });
  await s.send(host.socket, 'room:configure', { requestId: 'deck', roomId: room.id, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
  const start = await s.send(host.socket, 'room:start', { roomId: room.id, requestId: 'start' }); expect(start.ok).toBe(true);
  await expect.poll(() => updates.some(e => e.appearanceWindow?.moment === 'START')).toBe(true);
  await expect.poll(() => other.some(e => e.appearanceWindow?.moment === 'START')).toBe(true);
  const first = updates.find(e => e.appearanceWindow?.moment === 'START')!.appearanceWindow!;
  const second = other.find(e => e.appearanceWindow?.moment === 'START')!.appearanceWindow!; expect(first.token).not.toBe(second.token);
  const photo = (w: typeof first, theme: 'LIGHT' | 'DARK') => ({ version: 1, gameId: w.gameId, moment: w.moment, windowToken: w.token, theme, origin: theme === 'LIGHT' ? 'DEFAULT' : 'EXPLICIT' });
  expect((await s.http('/api/statistics/appearance', host.cookie, photo(first, 'LIGHT'))).status).toBe(202);
  expect((await s.http('/api/statistics/appearance', host.cookie, photo(second, 'DARK'))).status).toBe(204);
  expect((await s.http('/api/statistics/appearance', guest.cookie, photo(first, 'LIGHT'))).status).toBe(204);
  if (!start.ok || start.room.status !== 'IN_GAME') throw new Error('start');
  await s.send(host.socket, 'game:cancel', { roomId: room.id, gameId: start.room.game.id, requestId: 'cancel' });
  await expect.poll(() => updates.some(e => e.appearanceWindow?.moment === 'END')).toBe(true);
  const end = updates.find(e => e.appearanceWindow?.moment === 'END')!.appearanceWindow!;
  const next = (await (await s.http('/api/rooms', host.cookie, {})).json() as RoomResponse).room;
  expect((await s.http('/api/statistics/appearance', host.cookie, photo(end, 'DARK'))).status).toBe(202);
  expect((await s.http('/api/rooms/' + next.id, host.cookie)).status).toBe(200);
  await s.writer.flush(); expect(s.total('APPEARANCE', 'L0', 'start')).toBe(1); expect(s.total('APPEARANCE', 'D1', 'end')).toBe(1); expect(s.total('APPEARANCE', 'L0:D1', 'pair')).toBe(1);
  expect(JSON.stringify(s.cells())).not.toContain(first.token); expect(JSON.stringify(s.cells())).not.toContain(start.room.game.id);
});
it('B21 A03/A10: muerte real del writer no reinicia turno, admite juegos y solo observa salas nuevas tras sanear', async () => {
  const s = await setup(); const host = await s.player(); const guest = await s.player();
  const room = (await (await s.http('/api/rooms', host.cookie, {})).json() as RoomResponse).room;
  await s.send(guest.socket, 'room:join', { requestId: 'join', code: room.code, name: 'Invitado' });
  for (const [field, value] of Object.entries({ deck: { id: 'generica', contentVersion: 4 }, turnSeconds: 15, reviewSeconds: 0 }))
    await s.send(host.socket, 'room:configure', { requestId: field, roomId: room.id, change: { field, value } });
  const started = await s.send(host.socket, 'room:start', { requestId: 'start', roomId: room.id });
  if (!started.ok || started.room.status !== 'IN_GAME') throw new Error('start'); await s.writer.flush();
  const before = started.room.game.interaction.turn!.timing!;
  expect(before).not.toBeNull(); expect(before.endsAt - before.startedAt).toBe(15000);
  const resources = s.writer as unknown as { worker: Worker };
  await resources.worker.terminate(); await expect.poll(() => s.writer.available()).toBe(true);
  const recovered = await (await s.http('/api/rooms/' + room.id, host.cookie)).json() as RoomResponse;
  expect(recovered.room.status).toBe('IN_GAME'); if (recovered.room.status === 'IN_GAME') expect(recovered.room.game.interaction.turn!.timing).toEqual(before);
  s.time.advance(120_000); expect(s.repository.findById(room.id)?.status).toBe('RESULTS'); await s.writer.flush();
  expect(s.total('GAME', 'unknown')).toBe(1); expect(s.total('GAME', 'NO_ACTIVE_HUMAN_PLAYERS')).toBe(0);
  const a = s.repository.findById(room.id)!;
  await s.send(host.socket, 'results:return-home', { requestId: 'home', roomId: a.id, gameId: a.game!.id });
  const next = await s.http('/api/rooms', host.cookie, {}); expect(next.status).toBe(201); await s.writer.flush();
  expect(s.total('CREATION', 'all', 'total')).toBe(2); expect(s.total('WAITING', 'pending')).toBe(1);
});
