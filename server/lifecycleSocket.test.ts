import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import type { CurrentRoomResponse, RoomClosedEvent, RoomLeftEvent, RoomStateEvent, RoomView, SocketAck } from '../shared/contracts/room.js';
import { ControlledTime } from '../tests/support/controlledTime.js';
import { createRuntime } from './composition/createApp.js';
import { MemoryRoomRepository } from './infrastructure/memoryRoomRepository.js';
import { MemorySessions } from './infrastructure/memorySessions.js';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
const ack = <T>(socket: Socket, name: string, payload: object = {}) => socket.timeout(2000).emitWithAck(name, payload) as Promise<SocketAck<T>>;
function event<T>(socket: Socket, name: string, matches: (value: T) => boolean = () => true): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(name, receive); reject(new Error(`No llegó ${name}`)); }, 2000);
    const receive = (value: T) => { if (!matches(value)) return; socket.off(name, receive); clearTimeout(timer); resolve(value); };
    socket.on(name, receive);
  });
}

async function setup() {
  const time = new ControlledTime();
  const repository = new MemoryRoomRepository(); const sessions = new MemorySessions();
  const runtime = createRuntime({ clock: time, scheduler: time, repository, sessions, codes: () => 42 });
  const server = createServer(runtime.app); const socketServer = runtime.attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  const base = `http://127.0.0.1:${address.port}`;
  const clients: Socket[] = [];
  cleanups.push(async () => {
    runtime.dispose(); clients.forEach((client) => client.disconnect());
    await new Promise<void>((resolve) => socketServer.close(() => resolve()));
    expect(time.pending).toBe(0);
  });
  const session = async () => {
    const result = await request(base).get('/api/rooms/current');
    const cookie = String(result.headers['set-cookie'][0]).split(';')[0];
    return { cookie, id: sessions.get(cookie.split('=')[1])! };
  };
  const connect = async (cookie: string) => {
    const client = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: base } });
    clients.push(client);
    await new Promise<void>((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject); });
    return client;
  };
  const disconnect = async (client: Socket) => {
    const serverSocket = socketServer.sockets.sockets.get(client.id!);
    const detected = new Promise<void>((resolve) => serverSocket!.once('disconnect', () => resolve()));
    client.disconnect(); await detected;
  };
  const current = async (cookie: string): Promise<CurrentRoomResponse> => (await request(base).get('/api/rooms/current').set('Cookie', cookie)).body;
  const create = async (cookie: string): Promise<RoomView> => (await request(base).post('/api/rooms').set('Cookie', cookie).send({})).body.room;
  const join = async (client: Socket, requestId = 'join') => {
    const result = await ack<{ room: RoomView }>(client, 'room:join', { requestId, code: '000042', name: 'Ana' });
    if (!result.ok) throw new Error(result.error.message);
    return result.room;
  };
  return { time, repository, sessions, socketServer, base, session, connect, disconnect, current, create, join };
}

describe('B03 conexiones HTTP/Socket.IO reales con tiempo controlado', () => {
  it('detección heartbeat real ante pérdida silenciosa de paquetes; solo la reserva posterior usa tiempo controlado', async () => {
    const s = await setup(); const a = await s.session(); const b = await s.session();
    const host = await s.connect(a.cookie); await s.create(a.cookie); const guest = await s.connect(b.cookie); await s.join(guest);
    const serverSocket = s.socketServer.sockets.sockets.get(guest.id!)!;
    const detected = new Promise<{ at: number; reason: string }>((resolve) => serverSocket.once('disconnect', (reason) => resolve({ at: performance.now(), reason })));
    const lostAt = performance.now();
    // Montaje de pruebas: el WebSocket permanece abierto, pero se descartan sus paquetes salientes, incluidos pong.
    guest.io.engine.transport.send = () => {};
    const result = await detected;
    expect(result.reason).toBe('ping timeout');
    expect(result.at - lostAt).toBeGreaterThanOrEqual(5000);
    expect(result.at - lostAt).toBeLessThan(12_000);
    expect((await s.current(a.cookie)).room!.participants[0].presence).toBe('RECONNECTING');
    s.time.advance(29_999); expect((await s.current(b.cookie)).room).not.toBeNull();
    const removal = event<RoomStateEvent>(host, 'room:state', (value) => value.change?.kind === 'PRESENCE_EXPIRED');
    s.time.advance(1); expect((await removal).change?.kind).toBe('PRESENCE_EXPIRED');
    console.log('B03 heartbeat real:', JSON.stringify({ detectionMs: result.at - lostAt, reason: result.reason, grace: 'controlled 30000ms' }));
  }, 15_000);

  it('B03-01/05 conserva presencia con otra pestaña; última pérdida y recuperación a 29.999 sin duplicar', async () => {
    const s = await setup(); const a = await s.session(); const b = await s.session();
    const host = await s.connect(a.cookie); await s.create(a.cookie);
    const b1 = await s.connect(b.cookie); const guest = await s.join(b1); const b2 = await s.connect(b.cookie);
    const revision = (await s.current(a.cookie)).room!.revision;
    await s.disconnect(b1);
    expect((await s.current(a.cookie)).room!.revision).toBe(revision);
    expect((await s.current(a.cookie)).room!.participants[0].presence).toBe('CONNECTED');
    const absent = event<RoomStateEvent>(host, 'room:state'); await s.disconnect(b2);
    expect((await absent).room.participants[0].presence).toBe('RECONNECTING');
    s.time.advance(29_999);
    const recovered = event<RoomStateEvent>(host, 'room:state'); const b3 = await s.connect(b.cookie);
    expect((await recovered).change).toMatchObject({ kind: 'RECONNECTED', participantId: guest.participant.id });
    const resumed = await ack<CurrentRoomResponse>(b3, 'room:resume');
    expect(resumed.ok && resumed.room?.participant.id).toBe(guest.participant.id);
    expect((await s.current(a.cookie)).room!.participants).toHaveLength(2);
  });

  it('B03-02/14/15 retira a 30.000; recupera solo el motivo propio y rechaza presencia/renovación declaradas por cliente', async () => {
    const s = await setup(); const a = await s.session(); const b = await s.session(); const c = await s.session();
    const host = await s.connect(a.cookie); const room = await s.create(a.cookie);
    const guest = await s.connect(b.cookie); const joined = await s.join(guest); const outsider = await s.connect(c.cookie);
    let leaked = 0; outsider.on('room:state', () => leaked++); outsider.on('room:left', () => leaked++);
    outsider.on('room:closed', () => leaked++);
    await s.disconnect(guest);
    const expired = event<RoomStateEvent>(host, 'room:state', (value) => value.change?.kind === 'PRESENCE_EXPIRED'); s.time.advance(30_000);
    expect((await expired).change?.kind).toBe('PRESENCE_EXPIRED');
    expect(s.repository.findActiveBySession(b.id)).toBeUndefined();
    const returning = await s.connect(b.cookie);
    const resumed = await ack<CurrentRoomResponse>(returning, 'room:resume');
    expect(resumed).toEqual({ ok: true, room: null, ended: { roomId: room.id, participantId: joined.participant.id, reason: 'RECONNECT_TIMEOUT' } });
    expect(await ack(outsider, 'room:resume', { sessionId: b.id })).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
    await expect(outsider.timeout(100).emitWithAck('room:presence', { sessionId: b.id, connected: true })).rejects.toThrow();
    await expect(outsider.timeout(100).emitWithAck('room:expire', { roomId: room.id })).rejects.toThrow();
    expect((await s.current(c.cookie))).toEqual({ room: null });
    expect((await request(s.base).patch(`/api/rooms/${room.id}/name`).set('Cookie', c.cookie).send({ name: 'Ana' })).status).toBe(403);
    expect((await ack<CurrentRoomResponse>(outsider, 'room:resume'))).toEqual({ ok: true, room: null });
    const expiry = (await s.current(a.cookie)).room!.lifecycle.expiresAt;
    host.emit('room:resume'); host.emit('room:join', {}); host.emit('room:leave', {});
    await ack(host, 'room:resume');
    expect((await s.current(a.cookie)).room!.lifecycle.expiresAt).toBe(expiry);
    expect(leaked).toBe(0);
    await s.join(returning, 'new'); expect((await s.current(b.cookie)).ended).toBeUndefined();
    expect((await s.current(b.cookie)).room!.participant.id).not.toBe(joined.participant.id);
  });

  it('B03-06 salida y cierre afectan inmediatamente todas las pestañas y no dejan timers ni índices', async () => {
    const s = await setup(); const a = await s.session(); const b = await s.session();
    const a1 = await s.connect(a.cookie); const a2 = await s.connect(a.cookie); const room = await s.create(a.cookie);
    const b1 = await s.connect(b.cookie); const joined = await s.join(b1); const b2 = await s.connect(b.cookie);
    const left1 = event<RoomLeftEvent>(b1, 'room:left'); const left2 = event<RoomLeftEvent>(b2, 'room:left');
    expect(await ack(b1, 'room:leave', { requestId: 'leave', roomId: room.id, participantId: joined.participant.id })).toMatchObject({ ok: true });
    expect((await left1).reason).toBe('VOLUNTARY'); expect((await left2).reason).toBe('VOLUNTARY');
    await s.disconnect(b1); await s.disconnect(b2); expect(s.time.pending).toBe(2);
    const closed1 = event<RoomClosedEvent>(a1, 'room:closed'); const closed2 = event<RoomClosedEvent>(a2, 'room:closed');
    await request(s.base).delete(`/api/rooms/${room.id}`).set('Cookie', a.cookie).expect(204);
    expect((await closed1).reason).toBe('HOST_CLOSED'); expect((await closed2).reason).toBe('HOST_CLOSED');
    await s.disconnect(a1); await s.disconnect(a2); s.time.advance(30_000);
    expect(s.time.pending).toBe(0); expect(s.repository.allActive()).toHaveLength(0);
  });

  it('B03-07 HTTP sin socket tiene margen inicial; socket previo evita reserva y conexión inicial no se anuncia', async () => {
    const s = await setup(); const a = await s.session(); const created = await s.create(a.cookie);
    expect(created.participant.presence).toBe('RECONNECTING');
    s.time.advance(29_999); const host = await s.connect(a.cookie);
    expect((await s.current(a.cookie)).room!.id).toBe(created.id);
    expect(s.time.pending).toBe(2);
    await request(s.base).delete(`/api/rooms/${created.id}`).set('Cookie', a.cookie).expect(204);
    const noReserve = await s.create(a.cookie); expect(noReserve.participant.presence).toBe('CONNECTED');
    await s.disconnect(host); s.time.advance(30_000);
    expect((await s.current(a.cookie)).ended?.reason).toBe('HOST_DISCONNECTED');
    const b = await s.session(); await s.create(b.cookie); s.time.advance(30_000);
    expect((await s.current(b.cookie)).ended?.reason).toBe('HOST_DISCONNECTED');
  });

  it('B03-08/09 minutos 29/30 con sockets abiertos, renovación HTTP, aviso coherente y motivos al recuperar', async () => {
    const s = await setup(); const a = await s.session(); const b = await s.session();
    const host = await s.connect(a.cookie); const room = await s.create(a.cookie); const guest = await s.connect(b.cookie); await s.join(guest);
    const warningA = event<RoomStateEvent>(host, 'room:state', (value) => value.room.lifecycle.warning);
    const warningB = event<RoomStateEvent>(guest, 'room:state', (value) => value.room.lifecycle.warning);
    s.time.advance(29 * 60_000);
    expect((await warningA).room.lifecycle.warning).toBe(true); expect((await warningB).room.lifecycle.warning).toBe(true);
    const renewB = event<RoomStateEvent>(guest, 'room:state');
    const renewed = (await request(s.base).patch(`/api/rooms/${room.id}/name`).set('Cookie', a.cookie).send({ name: 'Nuevo' })).body.room;
    expect(renewed.lifecycle.warning).toBe(false); expect((await renewB).room.lifecycle).toEqual(renewed.lifecycle);
    s.time.advance(30 * 60_000 - 1);
    const closeA = event<RoomClosedEvent>(host, 'room:closed'); const closeB = event<RoomClosedEvent>(guest, 'room:closed');
    s.time.advance(1);
    expect((await closeA).reason).toBe('INACTIVITY'); expect((await closeB).reason).toBe('INACTIVITY');
    expect((await s.current(b.cookie)).ended?.reason).toBe('INACTIVITY');
    expect(s.repository.allActive()).toHaveLength(0); expect(s.time.pending).toBe(0);
    const fresh = createRuntime();
    const lost = await request(fresh.app).get('/api/rooms/current').set('Cookie', b.cookie);
    expect(lost.body).toEqual({ room: null }); fresh.dispose();
  });
});
