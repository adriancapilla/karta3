import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { SqliteUsageWorker } from './sqliteWorker.js';
import type { UsageEvent, UsageScope } from '../../application/usage/contracts.js';

const fixtures: { root: string; writer: SqliteUsageWorker }[] = [];
afterEach(async () => { for (const { root, writer } of fixtures.splice(0)) {
  await writer.close(); if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b19-barrier-')) throw new Error('ruta propia');
  fs.rmSync(root, { recursive: true, force: true });
} });
async function setup(limits: ConstructorParameters<typeof SqliteUsageWorker>[0]['limits'] = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-b19-barrier-'));
  const file = path.join(root, 'usage.sqlite'); const writer = new SqliteUsageWorker({ file, environment: 'test', bootRef: randomUUID(), limits });
  fixtures.push({ root, writer }); await writer.ready;
  const events = () => { const db = new DatabaseSync(file, { readOnly: true }); try { return db.prepare('SELECT payload FROM events').all().map(row => JSON.parse(String(row.payload)) as UsageEvent); } finally { db.close(); } };
  return { root, file, writer, events };
}
function event(): UsageEvent { return { eventId: randomUUID(), version: 1, source: 'SERVER', environment: 'test', traffic: 'SYNTHETIC',
  bootRef: randomUUID(), occurredAt: Date.now(), receivedAt: Date.now(), name: 'room_created', data: { roomRef: randomUUID() } }; }
const cut = () => ({ kind: 'cut' as const, at: Date.now(), roomRefs: [], gameRefs: [], proofRefs: [] });
it('retira pendientes de un ámbito y confirma barrera, conservando los de otro y sin payload de permiso', async () => {
  const f = await setup(); const own: UsageScope = { active: true }; const other: UsageScope = { active: true };
  const a = event(); const b = event(); f.writer.tryRecord(a, [own]); f.writer.tryRecord(b, [other]);
  await f.writer.revoke([own], cut()); expect(own.active).toBe(false); expect(other.active).toBe(true);
  expect(f.writer.tryRecord(event(), [own])).toBe(false); expect(f.events()).toEqual([b]);
  expect(JSON.stringify(f.events())).not.toMatch(/guards|scope|proofRef|session|admission/);
});
it('batch en vuelo y SQLite bloqueado: revocar antes de commit no persiste lo revocado ni una aceptación falsa', async () => {
  const f = await setup({ batch: 1 }); const lock = new DatabaseSync(f.file); lock.exec('BEGIN IMMEDIATE');
  const scope: UsageScope = { active: true };
  try {
    expect(f.writer.tryRecord(event(), [scope])).toBe(true);
    await expect.poll(() => (f.writer as unknown as { flight: unknown[] }).flight.length).toBe(1);
    const barrier = f.writer.revoke([scope], cut()); expect(scope.active).toBe(false);
    lock.exec('ROLLBACK'); await barrier; expect(f.events()).toEqual([]);
  } finally { if (lock.isTransaction) lock.exec('ROLLBACK'); lock.close(); }
});
it('controles comparten límite de eventos/bytes y no forman otra cola ilimitada', async () => {
  const f = await setup({ events: 2, batch: 64, flushMs: 60_000 }); expect(f.writer.tryRecord(event())).toBe(true);
  const proof = { kind: 'accept' as const, proof: { proofRef: randomUUID(), noticeVersion: '2026-10-19.1', acceptedAt: Date.now(), validUntil: 0 } };
  proof.proof.validUntil = proof.proof.acceptedAt + 12 * 60 * 60_000;
  const pending = f.writer.control(proof); expect(f.writer.status().queue).toBe(2);
  const restrictive = f.writer.control(cut()); expect(f.writer.status().discarded['SERVER:EVICTED_FOR_SERVER']).toBe(1);
  await expect(f.writer.control(cut())).rejects.toThrow('STORAGE_UNAVAILABLE'); expect(f.writer.status().queue).toBeLessThanOrEqual(2);
  await f.writer.drain(); await pending; await restrictive;
  expect(f.writer.status()).toMatchObject({ queue: 0, bytes: 0 });
});
