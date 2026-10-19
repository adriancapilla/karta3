import { afterEach, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SqliteUsageWorker } from './sqliteWorker.js';
import type { UsageEvent } from '../../application/usage/contracts.js';
import { acquirePrivateLease, privateDirectory, hasLiveUsageWriter } from './privateFiles.js';
import type { Worker } from 'node:worker_threads';

const roots: string[] = []; const writers: SqliteUsageWorker[] = [];
function setup(limits: ConstructorParameters<typeof SqliteUsageWorker>[0]['limits'] = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-usage-worker-')); roots.push(root);
  const writer = new SqliteUsageWorker({ file: path.join(root, 'usage.sqlite'), environment: 'test', bootRef: randomUUID(), limits }); writers.push(writer);
  return { writer, root };
}
function event(source: 'BROWSER' | 'SERVER'): UsageEvent {
  const common = { eventId: randomUUID(), bootRef: randomUUID(), version: 1 as const, environment: 'test' as const, traffic: 'SYNTHETIC' as const, occurredAt: Date.now(), receivedAt: Date.now() };
  return source === 'SERVER' ? { ...common, source, name: 'room_created', data: { roomRef: randomUUID() } }
    : { ...common, source, name: 'home_viewed', visitId: randomUUID(), data: { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' } };
}
it('lease vivo conserva propietario y rechaza otro escritor, incluido formato histórico sin identidad', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-usage-worker-')); roots.push(root);
  const lock = path.join(root, '.writer.lock'); const file = path.join(root, 'usage.sqlite');
  const release = acquirePrivateLease(lock, 'first');
  try {
    const before = fs.readFileSync(lock, 'utf8');
    expect(hasLiveUsageWriter(file)).toBe(true);
    expect(() => acquirePrivateLease(lock, 'second')).toThrow('STORAGE_UNAVAILABLE');
    expect(fs.readFileSync(lock, 'utf8')).toBe(before);
  } finally { release(); }
  const legacy = JSON.stringify({ pid: process.pid, token: 'legacy' }); fs.writeFileSync(lock, legacy);
  expect(() => acquirePrivateLease(lock)).toThrow('STORAGE_UNAVAILABLE'); expect(fs.readFileSync(lock, 'utf8')).toBe(legacy);
});
if (process.platform === 'linux') it('PID reutilizado con otro inicio/namespace permite recuperar solo el lease obsoleto', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-usage-worker-')); roots.push(root);
  const lock = path.join(root, '.writer.lock'); const file = path.join(root, 'usage.sqlite');
  const first = acquirePrivateLease(lock); const owner = JSON.parse(fs.readFileSync(lock, 'utf8')) as { pid: number; token: string; identity: string }; first();
  expect(owner.identity).toMatch(/^[a-f0-9-]{36}:\d+:\d+$/);
  const identity = owner.identity.replace(/:\d+$/, (value) => ':' + (Number(value.slice(1)) + 1));
  fs.writeFileSync(lock, JSON.stringify({ ...owner, identity }));
  expect(hasLiveUsageWriter(file)).toBe(false);
  const release = acquirePrivateLease(lock, 'new-process');
  try { expect(JSON.parse(fs.readFileSync(lock, 'utf8'))).toMatchObject({ token: 'new-process', identity: owner.identity });
    expect(hasLiveUsageWriter(file)).toBe(true);
  } finally { release(); }
});
afterEach(async () => { vi.restoreAllMocks(); for (const writer of writers.splice(0)) await writer.close();
  for (const root of roots.splice(0)) { if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-usage-worker-')) throw new Error('ruta'); fs.rmSync(root, { recursive: true, force: true }); } });
it('worker real confirma solo un batch; reserva SERVER y contabilidad incluye vuelo', async () => {
  const { writer, root } = setup({ events: 4, serverReserve: 2, batch: 2, flushMs: 10 }); await writer.ready;
  expect(writer.tryRecord(event('BROWSER'))).toBe(true); expect(writer.tryRecord(event('BROWSER'))).toBe(true);
  expect(writer.tryRecord(event('BROWSER'))).toBe(false);
  expect(writer.tryRecord(event('SERVER'))).toBe(true); expect(writer.tryRecord(event('SERVER'))).toBe(true);
  expect(writer.status().queue).toBe(4); expect(writer.status().bytes).toBeGreaterThan(0);
  await writer.drain(); expect(writer.status().queue).toBe(0); expect(writer.status().bytes).toBe(0);
  const db = new DatabaseSync(path.join(root, 'usage.sqlite'), { readOnly: true });
  expect(db.prepare('SELECT count(*) n FROM events').get()?.n).toBe(4); db.close();
});
it('límite por bytes y disco no se propagan al llamante', async () => {
  const { writer } = setup({ bytes: 1 }); await writer.ready;
  expect(writer.tryRecord(event('SERVER'))).toBe(false); expect(writer.status().queue).toBe(0);
  const broken = setup({ databaseBytes: 1 }); await expect(broken.writer.ready).rejects.toThrow('STORAGE_UNAVAILABLE');
  expect(broken.writer.tryRecord(event('SERVER'))).toBe(false);
});
it('bloqueo transitorio acotado deja al hilo principal progresar y reintenta sin duplicar', async () => {
  const { writer, root } = setup({ retriesMs: [10, 20, 30], flushMs: 10 }); await writer.ready;
  const lock = new DatabaseSync(path.join(root, 'usage.sqlite')); lock.exec('BEGIN IMMEDIATE');
  const fact = event('SERVER'); writer.tryRecord(fact);
  await new Promise((resolve) => setTimeout(resolve, 150)); expect(writer.status().queue).toBe(1);
  lock.exec('ROLLBACK'); lock.close(); await writer.drain();
  const report = await writer.read({ report: 'creation', environment: 'test', from: fact.occurredAt, to: Date.now() }, true);
  expect(report.rows.find((r) => r.metric === 'created')?.count).toBe(1);
  const human = await writer.read({ report: 'creation', environment: 'test', from: fact.occurredAt, to: Date.now() }); expect(human.rows).toEqual([]);
});
it('ACL propia se comprueba y no autoriza una carpeta heredada', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-usage-worker-')); roots.push(root);
  const privateRoot = path.join(root, 'private'); privateDirectory(privateRoot, true); expect(() => privateDirectory(privateRoot, false)).not.toThrow();
  if (process.platform === 'win32') expect(() => privateDirectory(root, false)).toThrow('NOT_AUTHORIZED');
  else { fs.chmodSync(root, 0o750); expect(() => privateDirectory(root, false)).toThrow('NOT_AUTHORIZED'); fs.chmodSync(root, 0o700); }
});
it('admisión real inicial 2048 y rechazo inmediato; antigüedad máxima acotada', async () => {
  const { writer } = setup(); await writer.ready;
  for (let index = 0; index < 2048; index++) expect(writer.tryRecord(event('SERVER'))).toBe(true);
  expect(writer.tryRecord(event('SERVER'))).toBe(false); expect(writer.status().queue).toBe(2048);
  await writer.drain(); expect(writer.status().queue).toBe(0);
  const aged = setup(); await aged.writer.ready; const instant = Date.now();
  const now = vi.spyOn(Date, 'now').mockReturnValue(instant); aged.writer.tryRecord(event('SERVER'));
  now.mockReturnValue(instant + 60_000); await aged.writer.drain();
  expect(aged.writer.status().discarded['SERVER:TOO_OLD']).toBe(1); now.mockRestore();
});
it('fichero corrupto y entorno equivocado no son informes vacíos', async () => {
  const { writer, root } = setup(); await writer.ready; await writer.close();
  const wrong = new SqliteUsageWorker({ file: path.join(root, 'usage.sqlite'), environment: 'production' }); writers.push(wrong);
  await expect(wrong.ready).rejects.toThrow('ENVIRONMENT_MISMATCH');
  const bad = path.join(root, 'corrupt.sqlite'); fs.writeFileSync(bad, 'invalid SQLite');
  const corrupt = new SqliteUsageWorker({ file: bad, environment: 'test' }); writers.push(corrupt);
  await expect(corrupt.ready).rejects.toThrow('STORAGE_UNAVAILABLE'); expect(fs.readFileSync(bad, 'utf8')).toBe('invalid SQLite');
});
it('caída real del worker descarta de forma acotada sin propagar al llamante', async () => {
  const { writer } = setup(); await writer.ready;
  // Solo la prueba provoca la caída externa; producto no ofrece operación de control.
  await (writer as unknown as { worker: Worker }).worker.terminate();
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(writer.tryRecord(event('SERVER'))).toBe(false); expect(writer.status()).toMatchObject({ degraded: true, queue: 0, bytes: 0 });
  expect(writer.isCollecting()).toBe(false); expect(writer.status().enabled).toBe(false);
});
it('copia requerida fallida pausa captura sin impedir purga y se recupera por el mismo mantenimiento', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-usage-worker-')); roots.push(root);
  const destination = path.join(root, 'copies'); fs.writeFileSync(destination, 'not a directory');
  const writer = new SqliteUsageWorker({ file: path.join(root, 'usage.sqlite'), environment: 'test', bootRef: randomUUID(),
    requireBackup: true, backupDirectory: destination, backupKey: '08'.repeat(32) }); writers.push(writer);
  await writer.ready; expect(writer.isCollecting()).toBe(false); expect(writer.status()).toMatchObject({ paused: true, enabled: false });
  expect(writer.tryRecord(event('SERVER'))).toBe(false);
  const db = new DatabaseSync(path.join(root, 'usage.sqlite'), { readOnly: true });
  const metadata = JSON.parse(String(db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value));
  expect(metadata.lastMaintenanceAt).toBeGreaterThan(0); db.close();
  const report = () => writer.read({ report: 'creation', environment: 'test', from: metadata.coverageFrom, to: Date.now() }, true);
  await expect.poll(async () => (await report()).quality.operational?.paused).toBe(true);
  expect((await report()).quality.collection).toBe('degraded');
  fs.unlinkSync(destination); fs.mkdirSync(destination, { mode: 0o700 });
  await writer.maintain(Date.now()); expect(writer.isCollecting()).toBe(true);
  expect(fs.readdirSync(destination).filter(name => name.endsWith('.agg.enc'))).toHaveLength(1);
});
it.each(['databaseBytes', 'walBytes'] as const)('presupuesto %s reducido: pausa antes de escribir un batch sin ocupar un disco real', async (field) => {
  const { writer, root } = setup({ [field]: 64 * 1024 }); await writer.ready;
  expect(writer.tryRecord(event('SERVER'))).toBe(true); await writer.drain();
  expect(writer.status()).toMatchObject({ paused: true, degraded: true, queue: 0 });
  expect(writer.tryRecord(event('SERVER'))).toBe(false);
  expect(fs.statSync(path.join(root, 'usage.sqlite')).size).toBeLessThan(64 * 1024);
});
it('un escritor por fichero; informe/copia administrativos solo lectura no alteran el arranque vivo', async () => {
  const { writer, root } = setup(); await writer.ready; const file = path.join(root, 'usage.sqlite');
  const second = new SqliteUsageWorker({ file, environment: 'test', bootRef: randomUUID() }); writers.push(second);
  await expect(second.ready).rejects.toThrow('STORAGE_UNAVAILABLE');
  const fact = event('SERVER'); await writer.append([fact]);
  const snapshot = () => { const db = new DatabaseSync(file, { readOnly: true }); try { return String(db.prepare('SELECT value FROM metadata WHERE id=1').get()?.value); } finally { db.close(); } };
  const before = JSON.parse(snapshot());
  const copies = path.join(root, 'copies'); fs.mkdirSync(copies);
  const reader = new SqliteUsageWorker({ file, environment: 'test', readOnly: true, backupDirectory: copies, backupKey: '09'.repeat(32) }); writers.push(reader); await reader.ready;
  const report = await reader.read({ report: 'creation', environment: 'test', from: fact.occurredAt, to: Date.now() }, true);
  expect(report.rows.find((row) => row.metric === 'created')?.count).toBe(1);
  await reader.backup(Date.now()); await reader.close(); const after = JSON.parse(snapshot());
  // El propio escritor puede publicar su salud mientras se consulta/copia; arranque y datos no cambian.
  expect({ ...after, operational: undefined }).toEqual({ ...before, operational: undefined });
  if (after.operational) {
    expect(after.operational).toMatchObject({ enabled: true, degraded: false, queue: 0, bytes: 0, discarded: {} });
    expect(after.operational.at).toBeGreaterThanOrEqual(before.operational?.at ?? 0);
  }
  expect(fs.readdirSync(copies).filter((name) => name.endsWith('.agg.enc'))).toHaveLength(1);
  expect(writer.tryRecord(event('SERVER'))).toBe(true); await writer.drain();
});
it('salud privada durable fechada: cola/bytes y descartes por causa/origen, sin IDs ni eventos nuevos', async () => {
  const { writer } = setup(); await writer.ready; const fact = event('SERVER'); await writer.append([fact]);
  const filter = { report: 'creation' as const, environment: 'test' as const, from: fact.occurredAt, to: Date.now() + 1000 };
  const read = () => writer.read({ ...filter, to: Date.now() }, true);
  await expect.poll(async () => (await read()).quality.operational?.queue).toBe(0);
  writer.noteLoss('CORRELATION_LIMIT');
  await expect.poll(async () => (await read()).quality.operational?.discarded['SERVER:CORRELATION_LIMIT']).toBe(1);
  const report = await read(); expect(report.quality.operational).toMatchObject({ enabled: true, degraded: true, paused: false, queue: 0, bytes: 0 });
  expect(report.quality.operationalStale).toBe(false); expect(report.quality.possibleLoss).toBe(true);
  expect(report.rows.find((row) => row.metric === 'created')?.count).toBe(1);
  expect(JSON.stringify(report.quality.operational)).not.toMatch(/eventId|bootRef|visitId|roomRef|session/);
});
