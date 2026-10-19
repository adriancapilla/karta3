// Solo ensayo Linux sintético efímero; por stdin, nunca se incorpora a la imagen final.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Buffer } from 'node:buffer';
import { setTimeout } from 'node:timers';
import path from 'node:path';

const run = promisify(execFile);
const root = '/var/lib/karta3/usage';
const directory = root + '/test/synthetic';
const file = directory + '/usage.sqlite';
const base = 'http://127.0.0.1:3000';
const stage = process.env.B18_PROBE;
assert.equal(process.version, 'v24.19.0');
assert.equal(process.platform, 'linux');
assert.equal(process.arch, 'x64');
assert.equal(process.getuid(), 1000);
function snapshot() {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    return { metadata: JSON.parse(db.prepare('SELECT value FROM metadata WHERE id=1').get().value),
      events: db.prepare('SELECT payload FROM events ORDER BY rowid').all().map((r) => JSON.parse(r.payload)),
      subjects: db.prepare('SELECT payload FROM subjects').all().map((r) => JSON.parse(r.payload)) };
  } finally { db.close(); }
}
async function until(predicate) {
  const end = Date.now() + 10_000;
  while (Date.now() < end) { if (await predicate()) return; await new Promise((r) => setTimeout(r, 50)); }
  assert.fail('B18_PROBE_CONDITION_NOT_MET');
}
function dates() {
  const now = new Date();
  return ['--from', new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(), '--to', now.toISOString(), '--environment', 'test', '--format', 'json'];
}
async function cli(name, args, env = {}) {
  return run(process.execPath, ['dist-server/server/composition/' + name + '.js', ...args],
    { env: { ...process.env, ...env }, timeout: 10_000 });
}
async function report(name = 'creation', env = {}) {
  const result = await cli('usageSyntheticCli', ['--report', name, ...dates()], env);
  const output = result.stdout.trim();
  assert.equal(path.basename(output), output);
  const target = directory + '/' + output;
  assert.equal((await fs.stat(target)).mode & 0o777, 0o600);
  return JSON.parse(await fs.readFile(target, 'utf8'));
}
async function postEvent(status) {
  const response = await globalThis.fetch(base + '/api/usage/events', { method: 'POST',
    headers: { Origin: 'https://127.0.0.1:3000', 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId: randomUUID(), version: 1, visitId: randomUUID(), name: 'home_viewed',
      data: { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' } }) });
  assert.equal(response.status, status); assert.equal(response.headers.get('set-cookie'), null);
}
async function privateRoutes() {
  const routes = ['/usage', '/USAGE', '/usage-data', '/backups', '/exports', '/usage.sqlite', '/usage.sqlite-wal', '/usage.sqlite-shm',
    '/api/usage/report', '/usage/test/synthetic/usage.sqlite', '/backups/usage.agg.enc', '/exports/report.csv'];
  for (const route of routes) {
    const response = await globalThis.fetch(base + route); assert.equal(response.status, 404);
    assert.ok(!(await response.text()).includes('<!doctype html>'));
  }
  return routes.length;
}
if (stage === 'seed') {
  await assert.rejects(fs.writeFile('/app/.b18-probe', 'x', { flag: 'wx' }), { code: 'EROFS' });
  assert.equal((await fs.stat(root)).mode & 0o777, 0o700);
  await postEvent(202);
  const { io } = await import('socket.io-client');
  const session = await globalThis.fetch(base + '/api/rooms/current');
  const cookie = session.headers.get('set-cookie').split(';')[0];
  const created = await (await globalThis.fetch(base + '/api/rooms', { method: 'POST', headers: { Cookie: cookie,
    Origin: 'https://127.0.0.1:3000', 'Content-Type': 'application/json' }, body: '{}' })).json();
  assert.ok(created.room?.id);
  const socket = io(base, { transports: ['websocket'], extraHeaders: { Cookie: cookie, Origin: 'https://127.0.0.1:3000' }, reconnection: false, timeout: 5000 });
  try {
    await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    const roomId = created.room.id;
    for (const [name, data] of [['room:bot-add', {}], ['room:configure', { change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } }],
      ['room:configure', { change: { field: 'turnSeconds', value: 60 } }], ['room:start', {}]]) {
      const ack = await socket.timeout(5000).emitWithAck(name, { requestId: randomUUID(), roomId, ...data }); assert.equal(ack.ok, true);
    }
    await until(() => snapshot().events.some((e) => e.name === 'game_started' && !snapshot().events.some((end) => end.name === 'game_ended' && end.data.gameRef === e.data.gameRef)));
    const current = snapshot(); const start = current.events.filter((e) => e.name === 'game_started').at(-1);
    const lease = JSON.parse(await fs.readFile(directory + '/.writer.lock', 'utf8'));
    assert.equal(typeof lease.identity, 'string');
    await fs.writeFile(root + '/probe-context.json', JSON.stringify({ cookie, roomId, gameRef: start.data.gameRef, count: current.events.length,
      createdCount: current.events.filter((e) => e.name === 'room_created').length, leasePid: lease.pid, leaseIdentity: lease.identity }), { mode: 0o600 });
    assert.equal((await fs.stat(directory)).mode & 0o777, 0o700);
    for (const suffix of ['', '-wal', '-shm']) { const stat = await fs.stat(file + suffix); assert.equal(stat.uid, 1000); assert.equal(stat.mode & 0o777, 0o600); }
    const before = snapshot(); const admin = await report(); const after = snapshot();
    assert.equal(admin.traffic, 'SYNTHETIC'); assert.ok(admin.rows.some((r) => r.metric === 'created' && r.count >= 1));
    assert.deepEqual(after.events, before.events); assert.equal(after.metadata.bootRef, before.metadata.bootRef);
    assert.equal(after.metadata.lastDurableAt, before.metadata.lastDurableAt);
    for (const excluded of [cookie.split('=')[1], roomId, ...current.events.map((e) => e.eventId)]) assert.ok(!JSON.stringify(admin).includes(excluded));
    await assert.rejects(cli('usageCli', ['--report', 'creation', ...dates()]), (e) => e.code === 1 && e.stderr.includes('COLLECTION_DISABLED'));
    await assert.rejects(cli('usageSyntheticCli', ['--report', 'creation', ...dates()], { KARTA3_ENV: 'production' }), (e) => e.code === 1 && e.stderr.includes('ENVIRONMENT_MISMATCH'));
    await fs.writeFile(root + '/backup-key', randomBytes(32).toString('hex'), { mode: 0o600 });
    const keyEnv = { KARTA3_USAGE_BACKUP_KEY_FILE: root + '/backup-key' };
    const copyBefore = snapshot();
    await cli('usageMaintenanceCli', ['backup'], keyEnv);
    const copyAfter = snapshot();
    assert.deepEqual(copyAfter.events, copyBefore.events); assert.equal(copyAfter.metadata.lastBackupAt, copyBefore.metadata.lastBackupAt);
    const copies = (await fs.readdir(directory + '/backups')).filter((name) => name.endsWith('.agg.enc')); assert.equal(copies.length, 1);
    const bytes = await fs.readFile(directory + '/backups/' + copies[0]); assert.equal(bytes.subarray(0, 6).toString(), 'K3AGG1');
    assert.equal((await fs.stat(directory + '/backups/' + copies[0])).mode & 0o777, 0o600);
    for (const id of current.events.map((e) => e.eventId)) assert.ok(!bytes.includes(Buffer.from(id)));
    assert.ok(!(await fs.readdir(directory + '/backups')).some((name) => name.startsWith('.usage-') || name.endsWith('.tmp')));
    console.log(JSON.stringify({ stage, node: process.version, sqlite: process.versions.sqlite, uid: process.getuid(), privateRoutes: await privateRoutes(),
      rootReadOnly: true, volumeWritable: true, directoryMode: '0700', databaseModes: '0600', adminReadOnly: true, environmentsSeparated: true,
      backupEncrypted: true, backupSha256: createHash('sha256').update(bytes).digest('hex'), gameInRam: true }));
  } finally { socket.disconnect(); }
} else if (stage === 'after-stop' || stage === 'after-kill') {
  const context = JSON.parse(await fs.readFile(root + '/probe-context.json', 'utf8'));
  const state = await (await globalThis.fetch(base + '/api/rooms/current', { headers: { Cookie: context.cookie } })).json(); assert.equal(state.room, null);
  const current = snapshot();
  const lease = JSON.parse(await fs.readFile(directory + '/.writer.lock', 'utf8'));
  assert.notEqual(lease.identity, context.leaseIdentity);
  const expected = stage === 'after-stop' ? 'TECHNICAL_INTERRUPTION' : 'UNRESOLVED_AFTER_RESTART';
  const game = current.subjects.find((s) => s.kind === 'game' && s.key === 'game:' + context.gameRef); assert.equal(game.state, expected);
  const ends = current.events.filter((e) => e.name === 'game_ended' && e.data.gameRef === context.gameRef);
  assert.equal(ends.length, stage === 'after-stop' ? 1 : 0);
  if (stage === 'after-stop') assert.equal(ends[0].data.evidence, 'CONTROLLED_SERVER_STOP');
  else { assert.ok(game.detectedAt > 0); assert.equal(game.durationMs, undefined); }
  const before = current.events.length; await postEvent(204); assert.equal(snapshot().events.length, before);
  const admin = await report('completion'); assert.equal(admin.quality.collection, 'disabled');
  console.log(JSON.stringify({ stage, persistedEvents: before, ramEmpty: true, terminal: expected, off: true, privateRoutes: await privateRoutes(),
    pidReused: lease.pid === context.leasePid, writerIdentityChanged: true }));
} else if (stage === 'readonly-volume') {
  const before = createHash('sha256').update(await fs.readFile(file)).digest('hex');
  await assert.rejects(fs.writeFile(root + '/.readonly-volume-probe', 'x', { flag: 'wx' }), { code: 'EROFS' });
  await postEvent(204);
  const session = await globalThis.fetch(base + '/api/rooms/current');
  assert.equal(session.headers.get('X-Karta3-Usage-Collection'), 'off');
  const cookie = session.headers.get('set-cookie').split(';')[0];
  const response = await globalThis.fetch(base + '/api/rooms', { method: 'POST', headers: { Cookie: cookie,
    Origin: 'https://127.0.0.1:3000', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 201); assert.ok((await response.json()).room?.id);
  await assert.rejects(cli('usageSyntheticCli', ['--report', 'creation', ...dates()]), (e) => e.code === 1 && e.stderr.includes('STORAGE_UNAVAILABLE'));
  assert.equal(createHash('sha256').update(await fs.readFile(file)).digest('hex'), before);
  console.log(JSON.stringify({ stage, physicalReadOnlyVolume: true, safeStorageError: true, gameCreatesRoom: true, off: true, databaseUnchanged: true }));
} else if (stage === 'restore') {
  const copies = (await fs.readdir('/source/test/synthetic/backups')).filter((name) => name.endsWith('.agg.enc')); assert.equal(copies.length, 1);
  const source = '/source/test/synthetic/backups/' + copies[0];
  const env = { KARTA3_USAGE_BACKUP_KEY_FILE: '/source/backup-key', KARTA3_USAGE_RESTORE_FILE: source };
  await cli('usageMaintenanceCli', ['restore'], env);
  const restored = snapshot(); assert.equal(restored.events.length, 0); assert.equal(restored.subjects.length, 0);
  assert.equal(restored.metadata.restoredAggregatesOnly, true); assert.equal(restored.metadata.operational, undefined);
  const expected = JSON.parse(await fs.readFile('/source/probe-context.json', 'utf8'));
  const admin = await report(); assert.equal(admin.rows.find((r) => r.metric === 'created')?.count, expected.createdCount);
  assert.equal(admin.quality.restoredAggregatesOnly, true);
  await assert.rejects(cli('usageMaintenanceCli', ['restore'], env), (e) => e.code === 1);
  // Autenticación GCM negativa en un tercer destino nuevo de este volumen aislado.
  await fs.writeFile(root + '/wrong-key', randomBytes(32).toString('hex'), { mode: 0o600 });
  await assert.rejects(cli('usageMaintenanceCli', ['restore'], { ...env, KARTA3_USAGE_DIRECTORY: root + '/invalid', KARTA3_USAGE_BACKUP_KEY_FILE: root + '/wrong-key' }), (e) => e.code === 1);
  await assert.rejects(fs.stat(root + '/invalid/test/synthetic/usage.sqlite'), { code: 'ENOENT' });
  console.log(JSON.stringify({ stage, isolatedVolume: true, aggregatesOnly: true, detail: 0, subjects: 0, sameCounts: true, noOverwrite: true, wrongKeyRejected: true }));
} else { assert.fail('B18_PROBE_STAGE'); }
