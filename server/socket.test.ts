import { createServer, type Server as HttpServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { createRuntime } from './composition/createApp.js';

const clients: Socket[] = [];
let server: HttpServer | undefined;

async function setup(codes: () => number = () => 42, production = false) {
  const runtime = createRuntime({ codes, production });
  server = createServer(runtime.app);
  const socketServer = runtime.attachRealtime(server);
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  const base = `http://127.0.0.1:${address.port}`;
  const session = async () => {
    const response = await request(base).get('/api/rooms/current');
    return String(response.headers['set-cookie'][0]).split(';')[0];
  };
  const connect = async (cookie: string, origin = base) => {
    const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: origin } });
    clients.push(socket);
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    return socket;
  };
  return { base, session, connect, socketServer };
}

function event<T>(socket: Socket, name: string): Promise<T> {
  return new Promise((resolve) => socket.once(name, resolve));
}

function ack<T>(socket: Socket, name: string, payload: object): Promise<T> {
  return new Promise((resolve) => socket.emit(name, payload, resolve));
}

afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect();
  if (server?.listening) await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = undefined;
});

describe('HTTP y Socket.IO comparten sala y sesión', () => {
  it('sincroniza dos sesiones, cambios HTTP, salida, reentrada y cierre con vistas propias', async () => {
    const { base, session, connect } = await setup();
    const hostCookie = await session();
    const guestCookie = await session();
    const outsiderCookie = await session();
    const created = (await request(base).post('/api/rooms').set('Cookie', hostCookie).send({})).body.room;
    const host = await connect(hostCookie);
    const guest = await connect(guestCookie);
    const outsider = await connect(outsiderCookie);
    let outsiderUpdates = 0;
    outsider.on('room:state', () => { outsiderUpdates += 1; });
    expect((await ack<{ ok: true; room: { participant: { role: string } } }>(host, 'room:resume', {})).room.participant.role).toBe('HOST');
    expect((await ack<{ ok: true; room: null }>(outsider, 'room:resume', {})).room).toBeNull();
    expect((await ack<{ ok: false; error: { code: string } }>(outsider, 'room:resume', { roomId: created.id })).error.code).toBe('INVALID_INPUT');
    const hostUpdate = event<{ room: { revision: number; participants: unknown[] } }>(host, 'room:state');
    const joined = await ack<{ ok: true; room: { id: string; participant: { id: string; role: string }; revision: number } }>(guest, 'room:join', { requestId: 'join-1', code: '000042', name: 'Ana' });
    expect(joined.ok).toBe(true);
    expect(joined.room.participant.role).toBe('GUEST');
    expect((await hostUpdate).room.participants).toHaveLength(2);
    expect(outsiderUpdates).toBe(0);
    expect(JSON.stringify(joined.room)).not.toContain('hostSessionId');
    expect(JSON.stringify(joined.room)).not.toContain(guestCookie.split('=')[1]);
    expect((await request(base).get('/api/rooms/current').set('Cookie', guestCookie)).body.room.participant.id).toBe(joined.room.participant.id);
    expect((await request(base).get(`/api/rooms/${created.id}`).set('Cookie', outsiderCookie)).status).toBe(403);
    expect((await request(base).delete(`/api/rooms/${created.id}`).set('Cookie', guestCookie)).status).toBe(403);
    expect((await ack<{ ok: false; error: { code: string } }>(outsider, 'room:leave', { requestId: 'steal', roomId: created.id, participantId: joined.room.participant.id })).error.code).toBe('FORBIDDEN');
    const renameUpdate = event<{ room: { participant: { name: string }; revision: number } }>(host, 'room:state');
    expect((await request(base).patch(`/api/rooms/${created.id}/name`).set('Cookie', guestCookie).send({ name: 'Ana María' })).status).toBe(200);
    expect((await renameUpdate).room.revision).toBe(joined.room.revision + 1);
    expect((await ack<{ ok: true; room: { participant: { name: string } } }>(guest, 'room:resume', {})).room.participant.name).toBe('Ana María');
    expect((await request(base).patch(`/api/rooms/${created.id}/name`).set('Cookie', guestCookie).send({ name: '' })).status).toBe(400);
    expect((await request(base).patch(`/api/rooms/${created.id}/name`).set('Cookie', guestCookie).send({ name: 'a'.repeat(17) })).status).toBe(400);
    const valid = await request(base).patch(`/api/rooms/${created.id}/name`).set('Cookie', guestCookie).send({ name: 'a'.repeat(16) });
    expect(valid.status).toBe(200);
    expect(valid.body.room.participant.id).toBe(joined.room.participant.id);

    const left = event<{ participantId: string }>(guest, 'room:left');
    const remaining = event<{ room: { participants: unknown[] }; change: { name: string } }>(host, 'room:state');
    expect((await ack<{ ok: boolean }>(guest, 'room:leave', { requestId: 'leave-1', roomId: created.id, participantId: joined.room.participant.id })).ok).toBe(true);
    expect((await left).participantId).toBe(joined.room.participant.id);
    expect((await remaining).change.name).toBe('a'.repeat(16));
    expect((await request(base).get('/api/rooms/current').set('Cookie', guestCookie)).body.room).toBeNull();
    let leaked = 0;
    guest.on('room:state', () => { leaked += 1; });
    const hostOnly = event(host, 'room:state');
    await request(base).patch(`/api/rooms/${created.id}/name`).set('Cookie', hostCookie).send({ name: 'Nuevo anfitrión' });
    await hostOnly;
    expect(leaked).toBe(0);
    expect((await ack<{ ok: boolean }>(guest, 'room:join', { requestId: 'join-1', code: '000042', name: 'Ana' })).ok).toBe(false);
    const again = await ack<{ ok: true; room: { participant: { id: string } } }>(guest, 'room:join', { requestId: 'join-2', code: '000042', name: 'Ana' });
    expect(again.room.participant.id).not.toBe(joined.room.participant.id);
    const closed = event<{ roomId: string; reason: string }>(guest, 'room:closed');
    expect((await request(base).delete(`/api/rooms/${created.id}`).set('Cookie', hostCookie)).status).toBe(204);
    expect(await closed).toMatchObject({ roomId: created.id, reason: 'HOST_CLOSED' });
    expect((await request(base).get('/api/rooms/current').set('Cookie', guestCookie)).body.room).toBeNull();
    expect((await ack<{ ok: boolean }>(guest, 'room:join', { requestId: 'join-3', code: '000042', name: 'Ana' })).ok).toBe(false);
  });

  it('solo acepta una entrada para la última plaza y rechaza origen o cookie ajenos', async () => {
    const { base, session, connect } = await setup();
    const hostCookie = await session();
    const room = (await request(base).post('/api/rooms').set('Cookie', hostCookie).send({})).body.room;
    const cookies = await Promise.all(Array.from({ length: 6 }, () => session()));
    const sockets = await Promise.all(cookies.map((cookie) => connect(cookie)));
    for (let i = 0; i < 3; i += 1) {
      expect((await ack<{ ok: boolean }>(sockets[i], 'room:join', { requestId: `join-${i}`, code: room.code, name: `Guest ${i}` })).ok).toBe(true);
    }
    const last = await Promise.all([3, 4].map((i) => ack<{ ok: boolean; error?: { code: string } }>(sockets[i], 'room:join', { requestId: `join-${i}`, code: room.code, name: `Guest ${i}` })));
    expect(last.filter((result) => result.ok)).toHaveLength(1);
    expect(last.find((result) => !result.ok)?.error?.code).toBe('ROOM_FULL');
    expect((await request(base).get(`/api/rooms/${room.id}`).set('Cookie', hostCookie)).body.room.participants).toHaveLength(5);
    const unauthenticated = io(base, { transports: ['websocket'], reconnection: false });
    clients.push(unauthenticated);
    await expect(new Promise((resolve) => unauthenticated.once('connect_error', resolve))).resolves.toBeInstanceOf(Error);
    const wrongOrigin = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookies[5], Origin: 'https://evil.example' } });
    clients.push(wrongOrigin);
    await expect(new Promise((resolve) => wrongOrigin.once('connect_error', resolve))).resolves.toBeInstanceOf(Error);
  });

  it('recupera instantánea al reconectar y no reinterpreta solicitudes antiguas con código reutilizado', async () => {
    const { base, session, connect } = await setup();
    const hostCookie = await session();
    const guestCookie = await session();
    const first = (await request(base).post('/api/rooms').set('Cookie', hostCookie).send({})).body.room;
    const host = await connect(hostCookie);
    const guest = await connect(guestCookie);
    const joinPayload = { requestId: 'entry-1', code: first.code, name: 'Ana' };
    const acceptedJoin = event(host, 'room:state');
    guest.emit('room:join', joinPayload, () => {});
    await acceptedJoin;
    const joined = await ack<{ ok: true; room: { participant: { id: string }; revision: number } }>(guest, 'room:join', joinPayload);
    expect((await ack<{ ok: true; room: { revision: number } }>(guest, 'room:join', joinPayload)).room.revision).toBe(joined.room.revision);
    guest.disconnect();
    const renamed = (await request(base).patch(`/api/rooms/${first.id}/name`).set('Cookie', hostCookie).send({ name: 'Anfitriona' })).body.room;
    const reconnected = await connect(guestCookie);
    const resumed = await ack<{ ok: true; room: { revision: number; participants: { name: string }[] } }>(reconnected, 'room:resume', {});
    expect(resumed.room.revision).toBe(renamed.revision);
    expect(resumed.room.participants.at(-1)?.name).toBe('Anfitriona');
    const leavePayload = { requestId: 'exit-1', roomId: first.id, participantId: joined.room.participant.id };
    const acceptedLeave = event(host, 'room:state');
    reconnected.emit('room:leave', leavePayload, () => {});
    await acceptedLeave;
    expect((await ack<{ ok: boolean }>(reconnected, 'room:leave', leavePayload)).ok).toBe(true);
    expect((await ack<{ ok: boolean }>(reconnected, 'room:leave', leavePayload)).ok).toBe(true);
    expect((await ack<{ ok: false; error: { code: string } }>(reconnected, 'room:join', joinPayload)).error.code).toBe('PARTICIPATION_ENDED');
    const secondJoin = await ack<{ ok: true; room: { participant: { id: string } } }>(reconnected, 'room:join', { requestId: 'entry-2', code: first.code, name: 'Ana' });
    expect(secondJoin.room.participant.id).not.toBe(joined.room.participant.id);
    expect((await ack<{ ok: boolean }>(reconnected, 'room:leave', leavePayload)).ok).toBe(true);
    expect((await request(base).get('/api/rooms/current').set('Cookie', guestCookie)).body.room.participant.id).toBe(secondJoin.room.participant.id);
    expect((await ack<{ ok: false; error: { code: string } }>(reconnected, 'room:join', { ...joinPayload, name: 'Berta' })).error.code).toBe('REQUEST_CONFLICT');
    await request(base).delete(`/api/rooms/${first.id}`).set('Cookie', hostCookie);
    const second = (await request(base).post('/api/rooms').set('Cookie', hostCookie).send({})).body.room;
    expect(second.code).toBe(first.code);
    expect((await ack<{ ok: false; error: { code: string } }>(reconnected, 'room:join', joinPayload)).error.code).toBe('PARTICIPATION_ENDED');
    expect((await request(base).get('/api/rooms/current').set('Cookie', guestCookie)).body.room).toBeNull();
  });

  it('pierde la memoria al crear un proceso nuevo sin recuperar identidades antiguas', async () => {
    const { base, session } = await setup();
    const hostCookie = await session();
    const guestCookie = await session();
    const first = (await request(base).post('/api/rooms').set('Cookie', hostCookie).send({})).body.room;
    const guest = await connectWithCookie(base, guestCookie);
    const joined = await ack<{ ok: true; room: { id: string } }>(guest, 'room:join', { requestId: 'join', code: first.code, name: 'Ana' });
    expect(joined.room.id).toBe(first.id);
    const fresh = createRuntime();
    for (const cookie of [hostCookie, guestCookie]) {
      const recovered = await request(fresh.app).get('/api/rooms/current').set('Cookie', cookie);
      expect(recovered.body.room).toBeNull();
      expect(recovered.headers['set-cookie']).toBeDefined();
    }
  });

  it('resuelve una entrada concurrente con cierre sin miembros huérfanos', async () => {
    const { base, session, connect } = await setup();
    const hostCookie = await session();
    const guestCookie = await session();
    const room = (await request(base).post('/api/rooms').set('Cookie', hostCookie).send({})).body.room;
    const guest = await connect(guestCookie);
    const [join, close] = await Promise.all([
      ack<{ ok: boolean; error?: { code: string } }>(guest, 'room:join', { requestId: 'race', code: room.code, name: 'Ana' }),
      request(base).delete(`/api/rooms/${room.id}`).set('Cookie', hostCookie)
    ]);
    expect(close.status).toBe(204);
    if (!join.ok) expect(join.error?.code).toBe('ROOM_NOT_AVAILABLE');
    expect((await request(base).get('/api/rooms/current').set('Cookie', hostCookie)).body.room).toBeNull();
    expect((await request(base).get('/api/rooms/current').set('Cookie', guestCookie)).body.room).toBeNull();
    expect((await request(base).get(`/api/rooms/${room.id}`).set('Cookie', guestCookie)).status).toBe(404);
  });

  it('en modo producción exige origen HTTPS y conserva cookie Secure', async () => {
    const { base, connect } = await setup(() => 42, true);
    const response = await request(base).get('/api/rooms/current');
    expect(String(response.headers['set-cookie'][0])).toContain('Secure');
    const cookie = String(response.headers['set-cookie'][0]).split(';')[0];
    const wrong = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: base } });
    clients.push(wrong);
    await expect(new Promise((resolve) => wrong.once('connect_error', resolve))).resolves.toBeInstanceOf(Error);
    const accepted = await connect(cookie, base.replace('http:', 'https:'));
    expect((await ack<{ ok: true; room: null }>(accepted, 'room:resume', {})).room).toBeNull();
  });
});

async function connectWithCookie(base: string, cookie: string): Promise<Socket> {
  const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: base } });
  clients.push(socket);
  await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  return socket;
}
