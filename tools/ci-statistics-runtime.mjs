import { Buffer } from 'node:buffer';
// Solo stdin en runner efímero Linux; no activa recogida real ni contiene datos del autor.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { io } from 'socket.io-client';
const run = promisify(execFile);
const root = '/var/lib/karta3/statistics', directory = root + '/test/synthetic', file = directory + '/agg-daily-v1.sqlite';
const base = 'http://127.0.0.1:3000', stage = process.env.B21_PROBE;
const origin = 'https://127.0.0.1:3000'; // main de imagen confía en HTTPS del proxy; transporte interno loopback.
assert.equal(process.version, 'v24.19.0'); assert.equal(process.platform, 'linux'); assert.equal(process.arch, 'x64'); assert.equal(process.getuid(), 1000);
await assert.rejects(fs.writeFile('/app/.statistics-write-probe', 'synthetic'), { code: 'EROFS' });
const snapshot = () => { const db = new DatabaseSync(file, { readOnly: true }); try {
  assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name), ['cells', 'coverage_days', 'metadata']);
  const metadata = Object.fromEntries(db.prepare('SELECT * FROM metadata').all().map(r => [r.key, r.value]));
  assert.equal(metadata.model, 'AGG_DAILY_V1'); assert.equal(metadata.schema, '1'); assert.equal(metadata.environment, 'test'); assert.equal(metadata.traffic, 'SYNTHETIC');
  return { metadata, cells: db.prepare('SELECT * FROM cells').all() };
} finally { db.close(); } };
const total = (category, family = 'GAME') => snapshot().cells.filter(c => c.family === family && c.dimension === 'balance' && c.category === category).reduce((n, c) => n + c.value, 0);
async function until(predicate) { const limit = Date.now() + 5000; while (Date.now() < limit) { if (predicate()) return; await delay(25); } assert.fail('STATISTICS_PROBE_NOT_OBSERVED'); }
async function startGame() {
  const current = await globalThis.fetch(base + '/api/rooms/current'); const cookie = current.headers.get('set-cookie').split(';')[0];
  assert.match(cookie, /^karta3_session=/); const socket = io(base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: origin } });
  await new Promise(resolve => socket.once('connect', resolve));
  const res = await globalThis.fetch(base + '/api/rooms', { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: '{}' });
  const { room } = await res.json(); const send = async (event, data) => { const ack = await socket.emitWithAck(event, data); assert.equal(ack.ok, true); return ack; };
  await send('room:bot-add', { requestId: 'bot', roomId: room.id });
  await send('room:configure', { requestId: 'deck', roomId: room.id, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
  await send('room:start', { requestId: 'start', roomId: room.id }); socket.disconnect(); return { roomId: room.id, cookie };
}
let game;
if (stage === 'seed') {
  const before = total('started'); game = await startGame(); await until(() => total('started') === before + 1);
  assert.equal(total('active'), 1); assert.equal(total('base', 'AUTOMATIC') > 0, true);
} else if (stage === 'after-stop') {
  assert.equal(total('active'), 0); assert.ok(total('TECHNICAL_INTERRUPTION') >= 1);
} else if (stage === 'after-kill') {
  assert.equal(total('active'), 0); assert.ok(total('unknown') >= 1);
} else if (stage === 'readonly-volume') {
  const before = snapshot().cells; await startGame(); await delay(300);
  assert.deepEqual(snapshot().cells, before); assert.equal((await globalThis.fetch(base + '/api/decks')).headers.get('x-karta3-statistics-collection'), 'off');
} else if (stage === 'restore') {
  // Entrada por stdin en el contenedor: resolver el artefacto compilado desde /app,
  // sin tratar dist-server como otra raíz de código de producción del guard.
  const { restoreAggregates } = await import(pathToFileURL(path.resolve('dist-server/server/infrastructure/statistics/backups.js')).href);
  const { privateDirectory } = await import(pathToFileURL(path.resolve('dist-server/server/infrastructure/statistics/privateFiles.js')).href);
  privateDirectory(directory, true); const sources = (await fs.readdir('/source/test/synthetic/backups')).filter(n => n.endsWith('.enc')).sort();
  await restoreAggregates('/source/test/synthetic/backups/' + sources.at(-1), file, Buffer.from((await fs.readFile('/source/copy.key', 'utf8')).trim(), 'hex'), 'test', 'SYNTHETIC', Date.now());
  assert.equal(snapshot().metadata.restored, 'true'); assert.equal(total('active'), 0);
} else assert.fail('UNEXPECTED_STAGE');
if (stage !== 'restore') for (const route of ['/statistics', '/statistics-data', '/backups', '/exports', '/agg-daily-v1.sqlite', '/agg-daily-v1.sqlite-wal', '/api/usage/events', '/api/statistics/report']) {
  const response = await globalThis.fetch(base + route); assert.equal(response.status, 404); assert.ok(!(await response.text()).includes('<!doctype html>'));
}
const state = snapshot(); const text = JSON.stringify(state);
for (const forbidden of ['eventId', 'visitId', 'participationId', 'roomId', 'gameId', 'proofRef', 'bootRef', 'requestId', 'cursor']) assert.ok(!text.includes(forbidden));
if (game) { assert.ok(!text.includes(game.roomId)); assert.ok(!text.includes(game.cookie)); }
for (const suffix of ['', '-wal', '-shm']) { const stat = await fs.stat(file + suffix).catch(() => null); if (stat) assert.equal(stat.mode & 0o777, 0o600); }
if (stage !== 'restore' && stage !== 'readonly-volume') {
  const today = new Date().toISOString().slice(0, 10), yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const report = await run(process.execPath, ['dist-server/server/composition/statisticsSyntheticCli.js', '--report', 'appearance', '--from', yesterday, '--to', today, '--environment', 'test', '--format', 'csv']);
  const name = report.stdout.trim(); assert.equal(path.basename(name), name); assert.equal((await fs.stat(path.join(directory, name))).mode & 0o777, 0o600);
  const csv = await fs.readFile(path.join(directory, name), 'utf8'); assert.ok(csv.includes('AGG_DAILY_V1')); assert.ok(!/roomId|gameId|visitId/.test(csv));
  await run(process.execPath, ['dist-server/server/composition/statisticsMaintenanceCli.js', 'backup']);
}
console.log(JSON.stringify({ model: 'AGG_DAILY_V1', stage, linux: true, nonRoot: true, private: true, individualDetail: false, publication: false }));
