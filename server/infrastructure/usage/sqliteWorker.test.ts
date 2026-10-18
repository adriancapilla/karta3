import { afterEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SqliteUsageWorker } from './sqliteWorker.js';
import type { UsageEvent } from '../../application/usage/contracts.js';
import { privateDirectory } from './privateFiles.js';

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
afterEach(async () => { for (const writer of writers.splice(0)) await writer.close();
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
});
