import { backup, DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { SqliteUsageStore, firstMonth, month } from './sqliteStore.js';
import type { UsageEnvironment, UsageTraffic } from '../../application/usage/contracts.js';
import { hasLiveUsageWriter, withPrivateExport } from './privateFiles.js';

export async function pruneUsageBackups(directory: string, at: number) {
  const files = (await fs.readdir(directory)).filter((name) => /^usage-\d{4}-\d{2}-\d{2}\.agg\.enc$/.test(name)).sort().reverse();
  for (const [index, name] of files.entries()) {
    const date = Date.parse(name.slice(6, 16) + 'T00:00:00Z');
    if (index >= 7 || month(firstMonth(date, -11)) < month(firstMonth(at, -11))) await fs.unlink(path.join(directory, name));
  }
}
export async function cleanUsageTemporaries(directory: string) {
  for (const name of await fs.readdir(directory)) {
    const target = path.resolve(directory, name);
    if (path.dirname(target) !== path.resolve(directory)) throw new Error('BACKUP_TEMP_PATH');
    if (/^\.usage-[a-zA-Z0-9]+$/.test(name)) await fs.rm(target, { recursive: true, force: true });
    if (/^usage-\d{4}-\d{2}-\d{2}\.agg\.enc\.tmp$/.test(name)) await fs.unlink(target);
  }
}

/** Online Backup -> intermedio privado -> DB NUEVA de agregados -> AES-256-GCM. */
type BackupSource = Pick<SqliteUsageStore, 'db' | 'file' | 'environment' | 'traffic'> & { copied?: (at: number) => void };
export async function backupUsage(store: BackupSource, directory: string, key: Uint8Array, at: number) {
  if (key.byteLength !== 32) throw new Error('BACKUP_KEY_INVALID');
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  return withPrivateExport(path.dirname(directory), () => createBackup(store, directory, key, at));
}
async function createBackup(store: BackupSource, directory: string, key: Uint8Array, at: number) {
  const space = await fs.statfs(directory);
  const originalBytes = (await fs.stat(store.file)).size + (await fs.stat(store.file + '-wal').catch(() => ({ size: 0 }))).size;
  if (space.bavail * space.bsize < originalBytes + 128 * 1024 ** 2) throw new Error('BACKUP_DISK_LIMIT');
  // Bajo el bloqueo único solo quedan intermedios de una operación anterior interrumpida.
  await cleanUsageTemporaries(directory);
  await pruneUsageBackups(directory, at);
  const temporary = await fs.mkdtemp(path.join(directory, '.usage-')); await fs.chmod(temporary, 0o700);
  if (path.resolve(path.dirname(temporary)) !== path.resolve(directory)) throw new Error('BACKUP_TEMP_PATH');
  try {
    const intermediate = path.join(temporary, 'snapshot.sqlite');
    await backup(store.db, intermediate); await fs.chmod(intermediate, 0o600);
    const snapshot = new SqliteUsageStore(intermediate, store.environment, at, undefined, store.traffic);
    let aggregates;
    try {
      const metadata = JSON.parse(String(store.db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)) as { clean: boolean };
      if (!metadata.clean && !hasLiveUsageWriter(store.file)) snapshot.noteLoss(at);
      aggregates = snapshot.aggregateSnapshot(at);
    } finally { snapshot.close(); }
    const cleanFile = path.join(temporary, 'aggregates.sqlite'); const clean = new SqliteUsageStore(cleanFile, store.environment, at, undefined, store.traffic);
    try {
      clean.db.exec('BEGIN IMMEDIATE');
      clean.db.prepare('UPDATE metadata SET value=? WHERE id=1').run(JSON.stringify(aggregates.metadata));
      for (const row of aggregates.rows) clean.db.prepare('INSERT INTO monthly VALUES (?,?,?,?,?,?,?,?,?)')
        .run(row.month, row.traffic, row.report, row.dimension, row.metric, row.count, row.sum, row.min, row.max);
      for (const row of aggregates.quality) clean.db.prepare('INSERT INTO quality VALUES (?,?,?,?,?)').run(row.month, row.kind, row.count, row.firstAt, row.lastAt);
      clean.db.exec('COMMIT; PRAGMA wal_checkpoint(TRUNCATE)');
    } finally { clean.close(); }
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv);
    const body = Buffer.concat([cipher.update(await fs.readFile(cleanFile)), cipher.final()]);
    const payload = Buffer.concat([Buffer.from('K3AGG1'), iv, cipher.getAuthTag(), body]);
    const file = path.join(directory, `usage-${new Date(at).toISOString().slice(0, 10)}.agg.enc`);
    await fs.writeFile(file + '.tmp', payload, { mode: 0o600 }); await fs.rename(file + '.tmp', file);
    store.copied?.(at);
    // Una copia antigua puede contener un mes ya caducado: se retira incluso con menos de siete.
    await pruneUsageBackups(directory, at);
    return file;
  } finally {
    // Destino absoluto comprobado, creado por mkdtemp dentro del directorio indicado.
    await fs.rm(temporary, { recursive: true, force: true });
  }
}

export async function restoreUsageBackup(file: string, destination: string, key: Uint8Array, environment: UsageEnvironment, at: number, traffic: UsageTraffic = 'SYNTHETIC') {
  const bytes = await fs.readFile(file);
  if (bytes.subarray(0, 6).toString() !== 'K3AGG1') throw new Error('BACKUP_INVALID');
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(6, 18)); decipher.setAuthTag(bytes.subarray(18, 34));
  const clear = Buffer.concat([decipher.update(bytes.subarray(34)), decipher.final()]);
  await fs.writeFile(destination, clear, { flag: 'wx', mode: 0o600 });
  const db = new DatabaseSync(destination, { readOnly: true });
  try {
    if (db.prepare('PRAGMA integrity_check').get()?.integrity_check !== 'ok'
      || Number(db.prepare('SELECT count(*) AS n FROM events').get()?.n) !== 0
      || Number(db.prepare('SELECT count(*) AS n FROM subjects').get()?.n) !== 0) throw new Error('BACKUP_INVALID');
  } finally { db.close(); }
  const restored = new SqliteUsageStore(destination, environment, at, undefined, traffic); restored.close();
}
