import { expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { AggregateStore } from './store.js';
import { backupAggregates, pruneBackups, restoreAggregates } from './backups.js';
import { privateDirectory } from './privateFiles.js';
it('A08/A09: copia cifrada solo de tres tablas agregadas, restore aislado sanea y no sobreescribe', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b21-copy-')); const directory = path.join(root, 'private'); privateDirectory(directory, true);
  if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b21-copy-')) throw new Error('own path');
  const file = path.join(directory, 'agg-daily-v1.sqlite'); const now = Date.UTC(2026, 9, 20, 12); const key = randomBytes(32);
  try {
    const s = new AggregateStore({ file, environment: 'test', traffic: 'SYNTHETIC', now, initialize: true });
    s.append([{ cells: ['created', 'pending'].map(category => ({ day: '2026-10-19', family: 'WAITING', dimension: 'balance', category, measure: 'count', value: 1 })), coverage: [] }], now); s.close(true);
    const copied = await backupAggregates(file, path.join(directory, 'backups'), key, 'test', 'SYNTHETIC', now);
    expect((await fs.readFile(copied)).subarray(0, 6).toString()).toBe('K3AD01');
    const dest = path.join(root, 'restore'); privateDirectory(dest, true); const restored = path.join(dest, 'agg-daily-v1.sqlite');
    await restoreAggregates(copied, restored, key, 'test', 'SYNTHETIC', now);
    const db = new DatabaseSync(restored); try {
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name)).toEqual(['cells', 'coverage_days', 'metadata']);
      expect(db.prepare("SELECT value FROM cells WHERE category='pending'").get()!.value).toBe(0);
      expect(db.prepare("SELECT value FROM cells WHERE category='unknown'").get()!.value).toBe(1);
      expect(db.prepare("SELECT value FROM metadata WHERE key='restored'").get()!.value).toBe('true');
    } finally { db.close(); }
    await expect(restoreAggregates(copied, restored, key, 'test', 'SYNTHETIC', now)).rejects.toThrow();
    const names = await fs.readdir(path.join(directory, 'backups')); expect(names).toEqual(['agg-daily-v1-2026-10-20.enc']);
    for (let d = 1; d <= 9; d++) await fs.writeFile(path.join(directory, 'backups', `agg-daily-v1-2026-10-${String(d).padStart(2, '0')}.enc`), 'synthetic rotation fixture');
    await fs.writeFile(path.join(directory, 'backups', 'agg-daily-v1-2025-10-30.enc'), 'expired rotation fixture');
    await pruneBackups(path.join(directory, 'backups'), now); const retained = await fs.readdir(path.join(directory, 'backups'));
    expect(retained).toHaveLength(7); expect(retained).not.toContain('agg-daily-v1-2025-10-30.enc');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}, 15_000); // ACL Windows, cifrado y archivos reales; no cambia ningún plazo del juego.
