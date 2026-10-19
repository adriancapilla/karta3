// Solo stdin del runner: HUMAN fabricado y aislado; nunca se copia a la imagen final.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { URL, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as delay } from 'node:timers/promises';
import { io } from 'socket.io-client';

// El arnés por stdin carga artefactos compilados de su instalación, no dependencias fuente.
const compiledModule = relative => pathToFileURL(path.resolve('dist-server', relative)).href;
const root = '/var/lib/karta3/usage';
const directory = root + '/pruebas/human';
const file = directory + '/usage.sqlite';
const keyFile = '/run/karta3-secrets/copy.key';
const restoredRoot = '/restore';
const run = promisify(execFile);
const children = new Set();
const sockets = new Set();
const warnings = new Set();
let stage = 'environment';
let temporary;
function snapshot(target = file) {
  const db = new DatabaseSync(target, { readOnly: true });
  try {
    return { metadata: JSON.parse(db.prepare('SELECT value FROM metadata WHERE id=1').get().value),
      events: db.prepare('SELECT payload FROM events ORDER BY rowid').all().map(row => JSON.parse(row.payload)),
      subjects: db.prepare('SELECT payload FROM subjects').all().map(row => JSON.parse(row.payload)),
      proofs: db.prepare('SELECT * FROM usage_choice_proofs').all() };
  } finally { db.close(); }
}
async function until(predicate) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) { if (await predicate()) return; await delay(50); }
  assert.fail('B19_IMAGE_CONDITION_NOT_MET');
}
async function start({ mode = 'human', ready = true, normal = false, location = root, secret = keyFile } = {}) {
  const entry = path.join(temporary, ready ? 'ready.mjs' : 'incomplete.mjs');
  const child = spawn(process.execPath, [normal ? '/app/dist-server/server/main.js' : entry], {
    cwd: '/app', env: { ...process.env, HOST: '127.0.0.1', PORT: '0', NODE_ENV: 'production',
      KARTA3_ENV: 'pruebas', KARTA3_USAGE_COLLECTION: mode, KARTA3_USAGE_DIRECTORY: location,
      KARTA3_USAGE_BACKUP_KEY: '', KARTA3_USAGE_BACKUP_KEY_FILE: secret }, stdio: ['ignore', 'pipe', 'pipe'] });
  children.add(child);
  let stdout = '';
  // Solo códigos técnicos; ni stderr ni payloads se copian al expediente.
  child.stderr.on('data', bytes => { for (const line of bytes.toString().split('\n')) {
    if (/^USAGE_[A-Za-z_]+$/.test(line.trim())) warnings.add(line.trim());
  } });
  const base = await new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => { child.kill('SIGKILL'); reject(new Error('B19_IMAGE_START_TIMEOUT')); }, 10_000);
    child.stdout.on('data', bytes => { stdout += bytes.toString(); const match = /KARTA3: (http:\/\/127\.0\.0\.1:\d+)/.exec(stdout);
      if (match) { globalThis.clearTimeout(timer); resolve(match[1]); } });
    child.once('error', error => { globalThis.clearTimeout(timer); reject(error); });
    child.once('exit', () => { globalThis.clearTimeout(timer); reject(new Error('B19_IMAGE_START_EXIT')); });
  });
  return { base, stop: async () => {
    if (child.exitCode !== null) { children.delete(child); return; }
    const exited = once(child, 'exit'); child.kill('SIGTERM');
    const timer = globalThis.setTimeout(() => child.kill('SIGKILL'), 4000);
    try { const [code] = await exited; assert.equal(code, 0); } finally { globalThis.clearTimeout(timer); children.delete(child); }
  } };
}
async function player(base) {
  const response = await globalThis.fetch(base + '/api/rooms/current');
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const origin = 'https://' + new URL(base).host;
  const headers = { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' };
  const choice = async () => (await globalThis.fetch(base + '/api/usage/choice', { headers })).json();
  const decide = async decision => {
    const current = await choice();
    const result = await globalThis.fetch(base + '/api/usage/choice', { method: 'PUT', headers,
      body: JSON.stringify({ decision, noticeVersion: current.noticeVersion, expectedRevision: current.revision, requestId: randomUUID() }) });
    assert.equal(result.status, 200); const selected = await result.json(); assert.equal(selected.decision, decision); return selected;
  };
  const socket = io(base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: origin }, reconnection: false, timeout: 5000 });
  sockets.add(socket); await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  const send = async (name, data) => { const result = await socket.timeout(5000).emitWithAck(name, { requestId: randomUUID(), ...data }); assert.equal(result.ok, true); return result; };
  const createGame = async () => {
    const created = await globalThis.fetch(base + '/api/rooms', { method: 'POST', headers, body: '{}' }); assert.equal(created.status, 201);
    const room = (await created.json()).room;
    await send('room:bot-add', { roomId: room.id });
    await send('room:configure', { roomId: room.id, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } });
    await send('room:configure', { roomId: room.id, change: { field: 'turnSeconds', value: 60 } });
    const started = await send('room:start', { roomId: room.id });
    assert.equal(started.room.status, 'IN_GAME'); return started.room;
  };
  return { headers, cookie, socket, choice, decide, createGame, current: async () => (await globalThis.fetch(base + '/api/rooms/current', { headers })).json() };
}
async function report(name, location = root) {
  const now = new Date();
  const result = await run(process.execPath, ['/app/dist-server/server/composition/usageCli.js', '--report', name,
    '--from', new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(), '--to', now.toISOString(), '--environment', 'pruebas', '--format', 'json'],
    { env: { ...process.env, KARTA3_ENV: 'pruebas', KARTA3_USAGE_DIRECTORY: location }, timeout: 10_000 });
  const filename = result.stdout.trim(); assert.equal(path.basename(filename), filename);
  return JSON.parse(await fs.readFile(path.join(location, 'pruebas/human', filename), 'utf8'));
}
async function maintenance(operation, location = root, source) {
  return run(process.execPath, ['/app/dist-server/server/composition/usageMaintenanceCli.js', operation], {
    env: { ...process.env, KARTA3_ENV: 'pruebas', KARTA3_USAGE_COLLECTION: 'off', KARTA3_USAGE_DIRECTORY: location,
      KARTA3_USAGE_BACKUP_KEY_FILE: keyFile, ...(source ? { KARTA3_USAGE_RESTORE_FILE: source } : {}) }, timeout: 10_000 });
}
try {
  assert.equal(process.version, 'v24.19.0'); assert.equal(process.platform, 'linux'); assert.equal(process.getuid(), 1000);
  assert.equal(process.cwd(), '/app');
  await assert.rejects(fs.writeFile('/app/.b19-probe', 'x', { flag: 'wx' }), { code: 'EROFS' });
  assert.equal((await fs.stat(root)).mode & 0o777, 0o700);
  assert.equal((await fs.stat(keyFile)).mode & 0o777, 0o600);
  await assert.rejects(fs.writeFile(keyFile, 'not-a-key'), { code: 'EROFS' });
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b19-image-'));
  for (const ready of [true, false]) await fs.writeFile(path.join(temporary, ready ? 'ready.mjs' : 'incomplete.mjs'), `
// Readiness fabricada de ensayo, no se instala ni expone en la aplicación pública.
import {createServer} from 'node:http';
import {createRuntime} from '/app/dist-server/server/composition/createApp.js';
import {createUsageRuntime} from '/app/dist-server/server/composition/usage.js';
import {loadInstallationDecks} from '/app/dist-server/server/composition/decks.js';
import {attachPublicFiles} from '/app/dist-server/server/infrastructure/http/publicFiles.js';
const loaded=await loadInstallationDecks(); const usage=await createUsageRuntime(${ready});
const runtime=createRuntime({decks:loaded.catalog,deckVersions:loaded.catalog,gameDecks:loaded.catalog,usage:usage.recorder,usageHttp:usage.http,usageChoices:usage.choices});
attachPublicFiles(runtime.app,'/app/dist',loaded.catalog);
const server=createServer(runtime.app);const realtime=runtime.attachRealtime(server);let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;runtime.controlledStop();runtime.dispose();realtime.engine.close();server.close();server.closeAllConnections();void usage.close().finally(()=>process.exit(0));};
process.on('SIGTERM',stop);process.on('SIGINT',stop);
server.listen(0,'127.0.0.1',()=>console.log('KARTA3: http://127.0.0.1:'+server.address().port));
`, { mode: 0o600 });
  stage = 'legacy-fixture';
  const { SqliteUsageStore } = await import(compiledModule('server/infrastructure/usage/sqliteStore.js'));
  const legacy = new SqliteUsageStore(file, 'pruebas', Date.now(), undefined, 'HUMAN', false);
  const fact = { name: 'room_created', source: 'SERVER', version: 1, eventId: randomUUID(), bootRef: randomUUID(), environment: 'pruebas', traffic: 'HUMAN',
    occurredAt: Date.now(), receivedAt: Date.now(), data: { roomRef: randomUUID() } };
  legacy.append([fact]);
  const metadata = JSON.parse(legacy.db.prepare('SELECT value FROM metadata WHERE id=1').get().value); metadata.version = 1;
  legacy.db.prepare('UPDATE metadata SET value=? WHERE id=1').run(JSON.stringify(metadata)); legacy.db.exec('DROP TABLE usage_choice_proofs'); legacy.close();
  stage = 'choice-withdrawal';
  let server = await start();
  assert.equal(snapshot().metadata.version, 2); assert.deepEqual(snapshot().events.find(event => event.eventId === fact.eventId), fact);
  const host = await player(server.base); assert.equal((await host.choice()).available, true);
  await host.decide('ACCEPTED'); const game = await host.createGame();
  await until(() => snapshot().events.some(event => event.name === 'game_started'));
  assert.equal(snapshot().proofs.length, 1);
  const sensitive = [host.cookie.split('=')[1], game.id, game.game.id, ...snapshot().events.map(event => event.eventId), ...snapshot().proofs.map(proof => proof.proof_ref)];
  await host.decide('REJECTED');
  assert.equal(snapshot().proofs[0].withdrawn_at > 0, true);
  assert.equal(snapshot().subjects.find(subject => subject.kind === 'game').state, 'OBSERVATION_CENSORED');
  const retained = await host.current(); assert.equal(retained.room.status, 'IN_GAME'); assert.equal(retained.room.game.id, game.game.id);
  const beforePost = snapshot().events.length;
  const blocked = await globalThis.fetch(server.base + '/api/usage/events', { method: 'POST', headers: host.headers,
    body: JSON.stringify({ eventId: randomUUID(), version: 1, visitId: randomUUID(), name: 'home_viewed', data: { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' } }) });
  assert.equal(blocked.status, 204); assert.equal(snapshot().events.length, beforePost);
  const censored = await report('completion'); assert.equal(censored.percentage, null); assert(censored.rows.some(row => row.metric === 'OBSERVATION_CENSORED'));
  host.socket.disconnect(); await server.stop();
  stage = 'controlled-stop-and-copy';
  server = await start(); const next = await player(server.base); await next.decide('ACCEPTED'); await next.createGame();
  await until(() => snapshot().events.filter(event => event.name === 'game_started').length === 2);
  const beforeCopy = snapshot(); await maintenance('backup');
  assert.deepEqual(snapshot().events, beforeCopy.events); assert.equal(snapshot().metadata.bootRef, beforeCopy.metadata.bootRef);
  for (const suffix of ['', '-wal', '-shm']) { const stat = await fs.stat(file + suffix); assert.equal(stat.uid, 1000); assert.equal(stat.mode & 0o777, 0o600); }
  next.socket.disconnect(); await server.stop();
  const stopped = snapshot(); assert.equal(stopped.events.filter(event => event.name === 'game_ended' && event.data.evidence === 'CONTROLLED_SERVER_STOP').length, 1);
  stage = 'off-and-incomplete';
  server = await start({ mode: 'off' }); const off = await player(server.base);
  assert.equal((await off.choice()).available, false); assert.equal((await off.choice()).decision, 'UNDECIDED'); assert.equal((await off.current()).room, null);
  const count = snapshot().events.length; await globalThis.fetch(server.base + '/api/rooms', { method: 'POST', headers: off.headers, body: '{}' });
  assert.equal(snapshot().events.length, count); off.socket.disconnect(); await server.stop();
  server = await start({ ready: false }); const unavailable = await player(server.base); assert.equal((await unavailable.choice()).available, false);
  const privacy = await globalThis.fetch(server.base + '/privacidad');
  const { privacyNotice } = await import(compiledModule('shared/contracts/privacyNotice.js'));
  assert.equal(privacy.status, privacyNotice.complete ? 200 : 404); assert.equal(privacy.headers.get('set-cookie'), null); assert.equal(privacy.headers.get('cache-control'), 'no-store');
  for (const route of ['/usage', '/usage-data', '/backups', '/usage.sqlite', '/usage.sqlite-wal', '/usage.sqlite-shm', '/api/usage/report']) assert.equal((await globalThis.fetch(server.base + route)).status, 404);
  unavailable.socket.disconnect(); await server.stop();
  server = await start({ normal: true, mode: privacyNotice.complete ? 'off' : 'human' });
  const normal = await player(server.base); assert.equal((await normal.choice()).available, false);
  const normalResponse = await globalThis.fetch(server.base + '/api/decks'); assert.equal(normalResponse.headers.get('x-karta3-usage-collection'), 'off');
  normal.socket.disconnect(); await server.stop();
  server = await start({ secret: '/run/karta3-secrets/missing.key' }); const missing = await player(server.base); assert.equal((await missing.choice()).available, false);
  assert(snapshot().metadata.lastMaintenanceAt > Date.now() - 10_000); missing.socket.disconnect(); await server.stop();
  stage = 'aggregate-restore';
  await maintenance('backup');
  const copies = (await fs.readdir(directory + '/backups')).filter(name => name.endsWith('.agg.enc')); assert.equal(copies.length, 1);
  const source = directory + '/backups/' + copies[0]; await maintenance('restore', restoredRoot, source);
  const restored = snapshot(restoredRoot + '/pruebas/human/usage.sqlite'); assert.equal(restored.metadata.version, 2);
  assert.equal(restored.events.length, 0); assert.equal(restored.subjects.length, 0); assert.equal(restored.proofs.length, 0);
  const reportBefore = await report('completion'); const reportAfter = await report('completion', restoredRoot);
  // Aggregate tiene siete campos. Las contribuciones vivas incluyen además at/traffic;
  // esos metadatos de detalle no forman parte de la copia agregada aprobada.
  const aggregateRows = rows => rows.map(({ report, dimension, metric, count, sum, min, max }) =>
    ({ report, dimension, metric, count, sum, min, max }))
    .sort((a, b) => JSON.stringify([a.report, a.dimension, a.metric]).localeCompare(JSON.stringify([b.report, b.dimension, b.metric]), 'en'));
  assert.deepEqual(aggregateRows(reportAfter.rows), aggregateRows(reportBefore.rows));
  for (const field of ['numerator', 'denominator', 'percentage', 'meanDurationMs']) assert.equal(reportAfter[field], reportBefore[field]);
  assert.equal(reportAfter.percentage, null);
  for (const value of sensitive) assert(!JSON.stringify(reportAfter).includes(value));
  const restoredBytes = await fs.readFile(restoredRoot + '/pruebas/human/usage.sqlite');
  for (const proof of snapshot().proofs) assert(!restoredBytes.includes(Buffer.from(proof.proof_ref)));
  server = await start({ location: restoredRoot }); const aggregate = await player(server.base); assert.equal((await aggregate.choice()).available, false); aggregate.socket.disconnect(); await server.stop();
  console.log(JSON.stringify({ fixture: 'HUMAN fabricado aislado, no aviso final ni activación pública', node: process.version, sqlite: process.versions.sqlite, uid: process.getuid(),
    rootReadOnly: true, secretFileReadOnly: true, privateVolume: true, schemaMigration: '1->2', legacyEventUnchanged: true,
    choiceDurable: true, withdrawalBarrier: true, censoredWithoutEndingGame: true, postWithdrawalBlocked: true,
    controlledStop: true, compatibleOffSameVolume: true, ramPermissionLost: true, incompleteReadinessBlocked: true,
    noticeComplete: privacyNotice.complete, normalOffOrIncompleteHumanBlocked: true, missingKeyMaintenance: true, privateRoutes: 7, aggregateRestoreIsolatedVolume: true,
    receiptsInRestoredCopy: 0, detailInRestoredCopy: 0, sameAggregates: true, restoredCaptureRejected: true, publiclyEnabled: false }));
} catch (error) {
  console.error(JSON.stringify({ probe: 'B19_IMAGE_HUMAN_PROBE_FAILED', stage, type: error.name, code: error.code, warnings: [...warnings],
    location: String(error.stack).split('\n').find(line => line.includes('[eval'))?.trim() }));
  process.exitCode = 1;
} finally {
  for (const socket of sockets) socket.disconnect();
  for (const child of children) if (child.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited; }
  if (temporary) { assert.equal(path.dirname(temporary), os.tmpdir()); assert(path.basename(temporary).startsWith('karta3-b19-image-')); await fs.rm(temporary, { recursive: true, force: true }); }
}
