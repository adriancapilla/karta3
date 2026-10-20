import { expect, it } from 'vitest';
import { io } from 'socket.io-client';
import { statisticsInstallation } from '../tests/support/statisticsInstallation.js';
import type { RoomResponse, SocketAck } from '../shared/contracts/room.js';
for (const controlled of [false, true]) it(`B21 A04 proceso main real: ${controlled ? 'cierre controlado' : 'kill abrupto'} y rearranque`, async () => {
  const installation = await statisticsInstallation(); let server = await installation.start();
  const cookie = (await fetch(server.base + '/api/rooms/current')).headers.get('set-cookie')!.split(';')[0];
  const socket = io(server.base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: server.base } });
  try {
    await new Promise<void>(resolve => socket.once('connect', resolve));
    const created = await (await fetch(server.base + '/api/rooms', { method: 'POST', headers: { Cookie: cookie, Origin: server.base, 'Content-Type': 'application/json' }, body: '{}' })).json() as RoomResponse;
    const roomId = created.room.id; const send = (event: string, data: object) => socket.emitWithAck(event, data) as Promise<SocketAck<RoomResponse>>;
    expect((await send('room:bot-add', { requestId: 'bot', roomId })).ok).toBe(true);
    expect((await send('room:configure', { requestId: 'deck', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } })).ok).toBe(true);
    expect((await send('room:start', { requestId: 'start', roomId })).ok).toBe(true);
    await expect.poll(() => installation.total('GAME', 'started')).toBe(1);
    const disconnected = controlled ? new Promise<{ reason: string; active: boolean }>(resolve => socket.once('disconnect', reason => resolve({ reason, active: socket.active }))) : undefined;
    if (!controlled) socket.disconnect(); await server.stop(controlled);
    if (disconnected) { const result = await disconnected; expect(result.reason).not.toBe('io server disconnect'); expect(result.active).toBe(true); socket.disconnect(); }
    server = await installation.start();
    const recovered = await (await fetch(server.base + '/api/rooms/current', { headers: { Cookie: cookie } })).json(); expect(recovered.room).toBeNull();
    expect(installation.total('GAME', 'active')).toBe(0);
    expect(installation.total('GAME', 'TECHNICAL_INTERRUPTION')).toBe(controlled ? 1 : 0);
    expect(installation.total('GAME', 'unknown')).toBe(controlled ? 0 : 1);
    const choice = await (await fetch(server.base + '/api/statistics/exclusion', { headers: { Cookie: cookie } })).json();
    expect(choice.eligibility).toBe('PENDING_LEGACY_CHOICE');
    expect(server.errors()).not.toContain(cookie);
  } finally { socket.disconnect(); await server.stop(); await installation.cleanup(); }
}, 15_000); // Dos procesos reales y ACL Windows; no espera o modifica límites de juego.
