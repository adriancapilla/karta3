import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { AggregateStore, readAggregates } from './store.js';
import { AggregateWriter } from './writer.js';
import type { Delta } from '../../application/statistics/contracts.js';
import { acquirePrivateLease } from './privateFiles.js';

const roots: string[] = [];
const now = Date.UTC(2026, 9, 20, 12);
function options() { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-b21-')); roots.push(root);
  return { file: path.join(root, 'agg-daily-v1.sqlite'), environment: 'test' as const, traffic: 'SYNTHETIC' as const, now, initialize: true }; }
const created: Delta = { cells: [
  { day: '2026-10-19', family: 'CREATION', dimension: 'total', category: 'all', measure: 'count', value: 1 },
  { day: '2026-10-19', family: 'WAITING', dimension: 'balance', category: 'created', measure: 'count', value: 1 },
  { day: '2026-10-19', family: 'WAITING', dimension: 'balance', category: 'pending', measure: 'count', value: 1 }], coverage: [] };
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) {
  if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b21-')) throw new Error('Unexpected temporary path');
  fs.rmSync(root, { recursive: true, force: true });
} });
describe('B21 P2 — SQLite real aislado', () => {
  it('A03: falta de reserva pausa antes de ready; aviso80% con metadatos de espacio controlados', () => {
    const o = options(); const actual = fs.statfsSync(path.dirname(o.file));
    const free = vi.spyOn(fs, 'statfsSync').mockReturnValue({ ...actual, bavail: 0 });
    expect(() => new AggregateStore(o)).toThrow('STORAGE_UNAVAILABLE'); free.mockRestore();
    const s = new AggregateStore(o); const size = fs.statSync(o.file); const stat = fs.statSync;
    vi.spyOn(fs, 'statSync').mockImplementation(((file: fs.PathLike) => file === o.file ? { ...size, size: 512 * 1024 ** 2 * .8 } : stat(file)) as typeof fs.statSync);
    try { expect(s.append([created], now)).toBe(true); } finally { s.close(); }
  });
  it('A03/A08: solo tres tablas agregadas; rollback completo ante saldo imposible', () => {
    const o = options(); const s = new AggregateStore(o);
    try {
      s.append([created], now);
      const broken = structuredClone(created); broken.cells[2].value = -2;
      expect(() => s.append([broken], now)).toThrow();
      expect(s.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name)).toEqual(['cells', 'coverage_days', 'metadata']);
      expect(s.db.prepare("SELECT value FROM cells WHERE family='CREATION'").get()!.value).toBe(1);
      expect(s.db.prepare("SELECT value FROM cells WHERE category='pending'").get()!.value).toBe(1);
      expect(JSON.stringify(s.db.prepare('SELECT * FROM metadata').all())).not.toMatch(/cursor|eventId|roomId|gameId|proofRef|bootRef|session/i);
    } finally { s.close(); }
  });
  it('A04: reapertura sanea abiertos una sola vez, conserva altas y rechaza otro entorno', () => {
    const o = options(); let s = new AggregateStore(o); s.append([created], now); s.close();
    s = new AggregateStore({ ...o, initialize: false }); s.close();
    s = new AggregateStore({ ...o, initialize: false });
    try { expect(s.db.prepare("SELECT value FROM cells WHERE category='unknown'").get()!.value).toBe(1);
      expect(s.db.prepare("SELECT value FROM cells WHERE category='pending'").get()!.value).toBe(0);
    } finally { s.close(); }
    expect(() => new AggregateStore({ ...o, environment: 'pruebas' })).toThrow('ENVIRONMENT_MISMATCH');
  });
  it('A09: no crea sin preparación explícita, no convierte SQLite anterior', () => {
    const o = options(); expect(() => new AggregateStore({ ...o, initialize: false })).toThrow();
    const db = new DatabaseSync(o.file); db.exec('CREATE TABLE events(id TEXT)'); db.close();
    expect(() => new AggregateStore(o)).toThrow();
    const prior = new DatabaseSync(o.file); try { expect(prior.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).toEqual([{ name: 'events' }]); } finally { prior.close(); }
  });
  it('A09: mes actual más once, repetible; lector privado distingue periodo', () => {
    const o = options(); const s = new AggregateStore(o);
    const release = acquirePrivateLease(path.join(path.dirname(o.file), '.writer.lock'));
    try {
      const old = structuredClone(created); old.cells = old.cells.map(c => ({ ...c, day: '2025-10-31' }));
      const edge = structuredClone(created); edge.cells = edge.cells.map(c => ({ ...c, day: '2025-11-01' }));
      s.append([old, edge, created], now); s.maintain(now); s.maintain(now);
      expect(s.db.prepare("SELECT COUNT(*) AS n FROM cells WHERE day<'2025-11-01'").get()!.n).toBe(0);
      expect(s.db.prepare("SELECT COUNT(*) AS n FROM cells WHERE day='2025-11-01'").get()!.n).toBe(3);
      const report = readAggregates(o.file, 'test', 'SYNTHETIC', '2026-10-19', '2026-10-20', now);
      expect(report.cells).toHaveLength(3); expect(report.model).toBe('AGG_DAILY_V1');
    } finally { s.close(); release(); }
  });
  it('A03: cola cuenta vuelo, reserva SERVER y una unidad completa, sin expulsar admitidas', async () => {
    const o = options(); const writer = new AggregateWriter({ ...o, limits: { entries: 9, reserve: 6, batch: 6, flushMs: 60_000 } });
    try { await writer.ready; expect(writer.admit(created, 'BROWSER')).toBe(true); expect(writer.admit(created, 'BROWSER')).toBe(false);
      expect(writer.admit(created, 'SERVER')).toBe(true); expect(writer.admit(created, 'SERVER')).toBe(true); expect(writer.admit(created, 'SERVER')).toBe(false);
      await writer.flush(); await writer.flush(); expect(writer.status().entries).toBe(0);
    } finally { await writer.close(); }
    const db = new DatabaseSync(o.file); try { expect(db.prepare("SELECT value FROM cells WHERE family='CREATION'").get()!.value).toBe(3); } finally { db.close(); }
  });
  it.each(['BEFORE_COMMIT_EXIT', 'AFTER_COMMIT_EXIT'] as const)('A03/A04: %s real de worker, sin replay, sanea y admite solo nueva generación', async fault => {
    const o = options(); const writer = new AggregateWriter({ ...o, testFault: fault, limits: { flushMs: 60_000 } });
    let invalidated = 0; writer.onInvalidated(() => { invalidated++; });
    try {
      await writer.ready; writer.admit(created, 'SERVER'); await writer.flush();
      await expect.poll(() => writer.available(), { timeout: 3000 }).toBe(true);
      expect(invalidated).toBe(1); expect(writer.status().entries).toBe(0);
      const db = new DatabaseSync(o.file, { readOnly: true });
      try {
        const c = db.prepare("SELECT value FROM cells WHERE family='CREATION'").get(); expect(c?.value ?? 0).toBe(fault === 'AFTER_COMMIT_EXIT' ? 1 : 0);
        expect(db.prepare("SELECT value FROM cells WHERE category='pending'").get()?.value ?? 0).toBe(0);
        expect(db.prepare("SELECT value FROM cells WHERE category='unknown'").get()?.value ?? 0).toBe(fault === 'AFTER_COMMIT_EXIT' ? 1 : 0);
      } finally { db.close(); }
      writer.admit(created, 'SERVER'); await writer.flush();
    } finally { await writer.close(); }
    const db = new DatabaseSync(o.file); try { expect(db.prepare("SELECT value FROM cells WHERE family='CREATION'").get()!.value).toBe(fault === 'AFTER_COMMIT_EXIT' ? 2 : 1); } finally { db.close(); }
  });
  it('A04: drenaje no espera el timeout RPC; cierre idempotente y no admite nuevos datos', async () => {
    const o = options(); const writer = new AggregateWriter({ ...o, limits: { flushMs: 60_000, drainMs: 25 } }); await writer.ready;
    // Solo respuesta RPC sustituida: no se atribuye a un COMMIT real o a una caída Linux.
    const resource = writer as unknown as { rpc: () => Promise<void> };
    const rpc = vi.spyOn(resource, 'rpc').mockImplementation(() => new Promise<void>(() => {})); writer.admit(created, 'SERVER');
    const at = performance.now(); const closing = writer.close(); expect(writer.admit(created, 'SERVER')).toBe(false); expect(writer.close()).toBe(closing);
    await closing; expect(performance.now() - at).toBeLessThan(1000); expect(writer.status().entries).toBe(0); rpc.mockRestore();
  });
});
