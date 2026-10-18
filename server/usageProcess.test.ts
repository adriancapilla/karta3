import { expect, it } from 'vitest';
import { io } from 'socket.io-client';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { usageInstallation } from '../tests/support/usageCompiledServer.js';
import type { RoomResponse, SocketAck } from '../shared/contracts/room.js';
import { usageLocation } from './composition/usage.js';

it('directorio privado no admite árboles públicos con diferencias de mayúsculas', () => {
  for (const name of ['dist', 'DiSt', 'PUBLIC', 'barajas', 'SRC', 'dist-server']) {
    expect(() => usageLocation('test', path.resolve(name), 'SYNTHETIC')).toThrow('INVALID_FILTER');
  }
});

for (const controlled of [false, true]) it(`B18 proceso compilado: ${controlled ? 'parada controlada' : 'kill abrupto'} y rearranque reales, consulta administrativa privada`, async () => {
  const installation = await usageInstallation(); let server = await installation.start();
  const result = await fetch(server.base + '/api/rooms/current'); const cookie = result.headers.get('set-cookie')!.split(';')[0];
  const socket = io(server.base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: server.base } });
  try {
    await new Promise<void>((resolve) => socket.once('connect', resolve));
    const created = await (await fetch(server.base + '/api/rooms', { method: 'POST', headers: { Cookie: cookie, Origin: server.base, 'Content-Type': 'application/json' }, body: '{}' })).json() as RoomResponse;
    const roomId = created.room.id;
    const send = (name: string, data: object) => socket.emitWithAck(name, data) as Promise<SocketAck<RoomResponse>>;
    expect((await send('room:bot-add', { requestId: 'bot', roomId })).ok).toBe(true);
    expect((await send('room:configure', { requestId: 'deck', roomId, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } })).ok).toBe(true);
    expect((await send('room:start', { requestId: 'start', roomId })).ok).toBe(true);
    await expect.poll(() => installation.events().filter((e) => e.name === 'game_started').length).toBe(1);
    socket.disconnect(); await server.stop(controlled);
    server = await installation.start();
    const recovered = await (await fetch(server.base + '/api/rooms/current', { headers: { Cookie: cookie } })).json(); expect(recovered.room).toBeNull();
    const facts = installation.events(); const ends = facts.filter((e) => e.name === 'game_ended');
    if (controlled) expect(ends).toMatchObject([{ data: { reason: 'TECHNICAL_INTERRUPTION', evidence: 'CONTROLLED_SERVER_STOP' } }]);
    else expect(ends).toHaveLength(0);
    const db = new DatabaseSync(installation.file, { readOnly: true });
    const subjects = db.prepare('SELECT payload FROM subjects').all().map((row) => JSON.parse(String(row.payload)));
    const metadata = JSON.parse(String(db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)); db.close();
    expect(subjects.find((s) => s.kind === 'game').state).toBe(controlled ? 'TECHNICAL_INTERRUPTION' : 'UNRESOLVED_AFTER_RESTART');
    if (!controlled) expect(subjects.find((s) => s.kind === 'game').detectedAt).toBeGreaterThan(0);
    await server.stop();
    const env = { ...process.env, KARTA3_ENV: 'test', KARTA3_USAGE_DIRECTORY: installation.data, KARTA3_USAGE_COLLECTION: 'off' };
    const args = ['dist-server/server/composition/usageSyntheticCli.js', '--report', 'completion', '--from', new Date(metadata.coverageFrom).toISOString(), '--to', new Date().toISOString(), '--environment', 'test', '--format', 'csv'];
    const command = await promisify(execFile)(process.execPath, args, { env, windowsHide: true });
    const csv = await fs.readFile(path.join(installation.data, 'test', 'synthetic', command.stdout.trim()), 'utf8');
    expect(csv).toContain('denominator'); expect(csv).toContain(controlled ? 'TECHNICAL_INTERRUPTION' : 'UNRESOLVED_AFTER_RESTART');
    for (const id of [roomId, cookie.split('=')[1], ...facts.map((e) => e.eventId)]) expect(csv).not.toContain(id);
    await expect(promisify(execFile)(process.execPath, [...args.slice(0, -3), 'production', '--format', 'json'], { env, windowsHide: true })).rejects.toMatchObject({ code: 1 });
  } finally { socket.disconnect(); await server.stop(); await installation.cleanup(); }
}, 25_000);
