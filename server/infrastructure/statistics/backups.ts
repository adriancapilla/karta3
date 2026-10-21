import { backup, DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { StatisticsError, dayOf, retentionDay, type Environment, type Traffic } from '../../application/statistics/contracts.js';
import { AggregateStore, validateMetadata } from './store.js';
import { privateDirectory, withPrivateExport } from './privateFiles.js';

const header = Buffer.from('K3AD01');
export async function pruneBackups(directory: string, now: number) {
  const files = (await fs.readdir(directory)).filter(name => /^agg-daily-v1-\d{4}-\d{2}-\d{2}\.enc$/.test(name)).sort().reverse();
  for (const [index, name] of files.entries()) if (index >= 7 || retentionDay(Date.parse(name.slice(13, 23) + 'T00:00:00Z')) < retentionDay(now))
    await fs.unlink(path.join(directory, name));
}
/** Snapshot coherente del único modelo nuevo -> archivo limpio -> AES-GCM, sin detalle ni WAL. */
export async function backupAggregates(file: string, directory: string, key: Uint8Array, environment: Environment, traffic: Traffic, now: number, token?: string) {
  if (key.byteLength !== 32) throw new StatisticsError('NOT_AUTHORIZED');
  privateDirectory(directory, true);
  return withPrivateExport(path.dirname(directory), async () => {
    for (const name of await fs.readdir(directory)) {
      const target = path.resolve(directory, name);
      if (path.dirname(target) !== path.resolve(directory)) throw new StatisticsError('INVALID_FILTER');
      if (/^\.statistics-[a-zA-Z0-9]+$/.test(name)) {
        const stat = await fs.lstat(target); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new StatisticsError('NOT_AUTHORIZED');
        await fs.rm(target, { recursive: true, force: true });
      } else if (/^agg-daily-v1-\d{4}-\d{2}-\d{2}\.enc\.tmp$/.test(name)) await fs.unlink(target);
    }
    const space = await fs.statfs(directory); const size = (await fs.stat(file)).size + (await fs.stat(file + '-wal').catch(() => ({ size: 0 }))).size;
    if (space.bavail * space.bsize < size * 3 + 128 * 1024 ** 2) throw new StatisticsError('STORAGE_UNAVAILABLE');
    const temp = await fs.mkdtemp(path.join(directory, '.statistics-')); await fs.chmod(temp, 0o700);
    if (path.dirname(temp) !== path.resolve(directory)) throw new StatisticsError('INVALID_FILTER');
    const source = new DatabaseSync(file, { readOnly: true });
    try {
      validateMetadata(source, environment, traffic); const snapshot = path.join(temp, 'snapshot.sqlite');
      await backup(source, snapshot); await fs.chmod(snapshot, 0o600);
      const db = new DatabaseSync(snapshot);
      const clean = path.join(temp, 'aggregates.sqlite');
      try {
        validateMetadata(db, environment, traffic); db.exec('BEGIN');
        db.prepare('DELETE FROM cells WHERE day<?').run(retentionDay(now)); db.prepare('DELETE FROM coverage_days WHERE day<?').run(retentionDay(now));
        db.exec('COMMIT'); db.prepare('VACUUM INTO ?').run(clean);
      } finally { db.close(); }
      await fs.chmod(clean, 0o600); const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv);
      const body = Buffer.concat([cipher.update(await fs.readFile(clean)), cipher.final()]);
      const target = path.join(directory, `agg-daily-v1-${dayOf(now)}.enc`);
      await fs.writeFile(target + '.tmp', Buffer.concat([header, iv, cipher.getAuthTag(), body]), { flag: 'wx', mode: 0o600 });
      await fs.rename(target + '.tmp', target); await pruneBackups(directory, now); return target;
    } finally { source.close(); await fs.rm(temp, { recursive: true, force: true }); }
  }, token);
}
export async function restoreAggregates(source: string, destination: string, key: Uint8Array, environment: Environment, traffic: Traffic, now: number) {
  if (key.byteLength !== 32) throw new StatisticsError('NOT_AUTHORIZED');
  privateDirectory(path.dirname(destination), true);
  const bytes = await fs.readFile(source);
  if (!bytes.subarray(0, 6).equals(header)) throw new StatisticsError('STORAGE_UNAVAILABLE');
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(6, 18)); decipher.setAuthTag(bytes.subarray(18, 34));
  const clear = Buffer.concat([decipher.update(bytes.subarray(34)), decipher.final()]);
  // Nunca sobreescribir archivo existente. Un error deja destino aislado, no se abre para capturar.
  await fs.writeFile(destination, clear, { flag: 'wx', mode: 0o600 });
  const db = new DatabaseSync(destination);
  try {
    validateMetadata(db, environment, traffic);
    if (db.prepare('PRAGMA integrity_check').get()?.integrity_check !== 'ok'
      || db.prepare('SELECT 1 FROM cells WHERE day<? LIMIT 1').get(retentionDay(now))
      || db.prepare('SELECT 1 FROM coverage_days WHERE day<? LIMIT 1').get(retentionDay(now))) throw new StatisticsError('STORAGE_UNAVAILABLE');
    db.prepare("UPDATE metadata SET value='true' WHERE key='restored'").run();
  } finally { db.close(); }
  const store = new AggregateStore({ file: destination, environment, traffic, now, restored: true }); store.close(true);
}
