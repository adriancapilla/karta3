import { setTimeout } from 'node:timers';
// Datos fabricados de Pruebas en red loopback aislada; no recepción real ni publicación.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { io } from 'socket.io-client';
// Este verificador entra por stdin; estos son artefactos de la imagen, no raíces de fuente.
const compiled = relative => pathToFileURL(path.resolve('dist-server', relative)).href;
const { createStatisticsRuntime, statisticsLocation } = await import(compiled('server/composition/statistics.js'));
const { createRuntime } = await import(compiled('server/composition/createApp.js'));
const { AggregateStore } = await import(compiled('server/infrastructure/statistics/store.js'));
const { privateDirectory } = await import(compiled('server/infrastructure/statistics/privateFiles.js'));
const { loadInstallationDecks } = await import(compiled('server/composition/decks.js'));
const { STATISTICS_NOTICE_VERSION } = await import(compiled('shared/contracts/statistics.js'));
assert.equal(process.platform, 'linux'); assert.equal(process.arch, 'x64'); assert.equal(process.version, 'v24.19.0'); assert.equal(process.getuid(), 1000);
// Node24 detecta ESM en stdin. --input-type heredado impediría arrancar el worker
// desde archivo (ERR_INPUT_TYPE_NOT_ALLOWED), a diferencia del proceso real.
assert.ok(!process.execArgv.some(argument => argument.startsWith('--input-type')));
await assert.rejects(fs.writeFile('/run/karta3-secrets/.write-probe', 'fabricated'), { code: 'EROFS' });
Object.assign(process.env, { KARTA3_ENV: 'pruebas', KARTA3_STATISTICS_MODE: 'aggregate', KARTA3_STATISTICS_DIRECTORY: '/var/lib/karta3/statistics', KARTA3_STATISTICS_BACKUP_KEY_FILE: '/run/karta3-secrets/copy.key' });
const location = statisticsLocation('pruebas', process.env.KARTA3_STATISTICS_DIRECTORY); privateDirectory(location.root, true);
const initial = new AggregateStore({ ...location, now: Date.now(), initialize: true }); initial.close(true);
const statistics = await createStatisticsRuntime(true); assert.equal(statistics.enabled(), true);
const loaded = await loadInstallationDecks(); const runtime = createRuntime({ decks: loaded.catalog, deckVersions: loaded.catalog, gameDecks: loaded.catalog, statistics, production: false });
const server = createServer(runtime.app); const realtime = runtime.attachRealtime(server); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`; const sockets = [];
const request = (route, cookie, body, method = 'PUT') => globalThis.fetch(base + route, { method: body ? method : 'GET', headers: { Cookie: cookie, Origin: base, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
try {
  const cookie = (await globalThis.fetch(base + '/api/rooms/current')).headers.get('set-cookie').split(';')[0];
  const socket = io(base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: base } }); sockets.push(socket); await new Promise(resolve => socket.once('connect', resolve));
  const permission = await (await request('/api/statistics/appearance-permission', cookie)).json(); assert.equal(permission.state, 'UNDECIDED');
  assert.equal((await request('/api/statistics/appearance-permission', cookie, { decision: 'GRANT', expectedRevision: permission.revision, noticeVersion: STATISTICS_NOTICE_VERSION, requestId: randomUUID() })).status, 200);
  const { room } = await (await request('/api/rooms', cookie, {}, 'POST')).json(); const updates = []; socket.on('room:state', event => updates.push(event));
  for (const [event, payload] of [['room:bot-add', { requestId: 'bot', roomId: room.id }], ['room:configure', { requestId: 'deck', roomId: room.id, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } }], ['room:start', { requestId: 'start', roomId: room.id }]]) assert.equal((await socket.emitWithAck(event, payload)).ok, true);
  const deadline = Date.now() + 5000; while (!updates.some(e => e.appearanceWindow) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25));
  const window = updates.find(e => e.appearanceWindow)?.appearanceWindow; assert.ok(window);
  assert.equal((await request('/api/statistics/appearance', cookie, { version: 1, gameId: window.gameId, moment: 'START', windowToken: window.token, theme: 'LIGHT', origin: 'DEFAULT' }, 'POST')).status, 202);
  const exclusion = await (await request('/api/statistics/exclusion', cookie)).json();
  assert.equal((await request('/api/statistics/exclusion', cookie, { excluded: true, expectedRevision: exclusion.revision, requestId: 'exclude' })).status, 200);
  assert.equal((await socket.emitWithAck('game:cancel', { requestId: 'cancel', roomId: room.id, gameId: window.gameId })).ok, true);
  await new Promise(resolve => setTimeout(resolve, 300));
  const db = new DatabaseSync(location.file, { readOnly: true }); try {
    assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name), ['cells', 'coverage_days', 'metadata']);
    const text = JSON.stringify(db.prepare('SELECT * FROM cells').all()); for (const secret of [room.id, room.code, window.gameId, window.token, cookie, 'eventId', 'proofRef']) assert.ok(!text.includes(secret));
    assert.equal(db.prepare("SELECT value FROM cells WHERE family='GAME' AND category='cut'").get().value, 1);
  } finally { db.close(); }
  console.log(JSON.stringify({ model: 'AGG_DAILY_V1', traffic: 'HUMAN', fabricated: true, specificPermission: true, exclusion: true, gameContinues: true, publicCollection: false }));
} finally { for (const socket of sockets) socket.disconnect(); runtime.dispose(); statistics.controls.dispose(); realtime.engine.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await realtime.close(); await statistics.close(); }
