import { parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import type { UsageEnvironment, UsageEvent, UsageFilter, UsageTraffic, UsageHealth } from '../../application/usage/contracts.js';
import { UsageError } from '../../application/usage/contracts.js';
import { SqliteUsageStore } from './sqliteStore.js';
import { SqliteUsageReader } from './sqliteReader.js';
import { backupUsage, cleanUsageTemporaries, pruneUsageBackups } from './backups.js';
import { acquirePrivateLease, withPrivateExport } from './privateFiles.js';

type Options = { file: string; environment: UsageEnvironment; traffic: UsageTraffic; bootRef?: string; now: number; backupDirectory?: string; backupKey?: string;
  limits: { databaseBytes: number; walBytes: number; reserveBytes: number }; existingOnly?: boolean; readOnly?: boolean; writerToken: string; collecting: boolean; requireBackup?: boolean };
const options = workerData as Options;
let store: SqliteUsageStore | SqliteUsageReader;
let releaseWriter: (() => void) | undefined;
let maintenance: NodeJS.Timeout | undefined;
let lastBackupDay = '';
let busy = false;
let maintenancePaused = false;
let backupRetryAt = Infinity;
function budget(events?: readonly UsageEvent[]) {
  const size = (file: string) => fs.existsSync(file) ? fs.statSync(file).size : 0;
  const free = fs.statfsSync(path.dirname(options.file));
  const database = size(options.file); const wal = size(options.file + '-wal');
  // Incluye temporales/copias del volumen, además del espacio libre efectivo.
  const used = fs.readdirSync(path.dirname(options.file), { withFileTypes: true }).filter((entry) => entry.isFile())
    .reduce((sum, entry) => sum + size(path.join(path.dirname(options.file), entry.name)), 0);
  if (database >= options.limits.databaseBytes * .8 || wal >= options.limits.walBytes * .8) parentPort!.postMessage({ warning: 'DISK_WARNING' });
  // Margen previo conservador para páginas/índices del batch, no solo JSON lógico.
  const nextWrite = events ? 64 * 1024 + events.reduce((sum, e) => sum + Buffer.byteLength(JSON.stringify(e)) * 16, 0) : 0;
  if (database + nextWrite >= options.limits.databaseBytes || wal + nextWrite >= options.limits.walBytes || used + nextWrite >= options.limits.databaseBytes + options.limits.walBytes
    || free.bavail * free.bsize < options.limits.reserveBytes) throw new Error('DISK_LIMIT');
}
async function maintain(at: number) {
  if (!(store instanceof SqliteUsageStore)) throw new UsageError('STORAGE_UNAVAILABLE');
  store.maintain(at);
  maintenancePaused = false;
  try {
    if (options.requireBackup && (!options.backupDirectory || !options.backupKey)) throw new Error('BACKUP_NOT_CONFIGURED');
    if (options.backupDirectory) await withPrivateExport(path.dirname(options.backupDirectory), async () => {
      await cleanUsageTemporaries(options.backupDirectory!); await pruneUsageBackups(options.backupDirectory!, at);
    });
    const day = new Date(at).toISOString().slice(0, 10);
    if (options.bootRef && options.backupDirectory && options.backupKey && day !== lastBackupDay) {
      await backupUsage(store, options.backupDirectory, Buffer.from(options.backupKey, 'hex'), at); lastBackupDay = day;
    }
    backupRetryAt = Infinity;
  } catch { backupRetryAt = Date.now() + 60_000; parentPort!.postMessage({ warning: 'BACKUP_FAILED' }); }
  budget();
  if (options.requireBackup && backupRetryAt !== Infinity) parentPort!.postMessage({ paused: true, warning: 'BACKUP_FAILED' });
  else parentPort!.postMessage({ resumed: true });
}
function nextMaintenance() {
  if (!(store instanceof SqliteUsageStore)) return 86_400_000;
  if (maintenancePaused) return 60_000;
  return Math.max(busy ? 250 : 1, Math.min(store.nextExpiry(Date.now()), backupRetryAt) - Date.now());
}
function close() {
  if (maintenance) clearTimeout(maintenance);
  if (store instanceof SqliteUsageStore) store.close(!!options.bootRef); else store.close();
  if (releaseWriter) { releaseWriter(); releaseWriter = undefined; }
}
function requireWriter() {
  if (!(store instanceof SqliteUsageStore)) throw new UsageError('STORAGE_UNAVAILABLE');
  return store;
}
function schedule() {
  maintenance = setTimeout(async () => {
    if (!busy) {
      busy = true;
      try { await maintain(Date.now()); } catch { maintenancePaused = true; parentPort!.postMessage({ warning: 'MAINTENANCE_FAILED' }); }
      finally { busy = false; }
    }
    schedule();
  }, nextMaintenance());
  maintenance.unref();
}
try {
  if (options.existingOnly && !fs.existsSync(options.file)) throw new UsageError('COLLECTION_DISABLED');
  if (options.readOnly) store = new SqliteUsageReader(options.file, options.environment, options.traffic);
  else {
    fs.mkdirSync(path.dirname(options.file), { recursive: true, mode: 0o700 });
    releaseWriter = acquirePrivateLease(path.join(path.dirname(options.file), '.writer.lock'), options.writerToken);
    store = new SqliteUsageStore(options.file, options.environment, options.now, options.bootRef, options.traffic, options.collecting);
    budget(); await maintain(options.now); schedule();
  }
  parentPort!.postMessage({ ready: true });
  parentPort!.on('message', async (message: { id: number; type: string; events?: UsageEvent[]; filter?: UsageFilter; at?: number; synthetic?: boolean; loss?: boolean; health?: UsageHealth }) => {
    if (busy) { parentPort!.postMessage({ id: message.id, error: 'BUSY', transient: true }); return; }
    busy = true;
    try {
      if (message.loss && store instanceof SqliteUsageStore) store.noteLoss();
      let result: unknown;
      if (message.type === 'append') { if (maintenancePaused || options.requireBackup && backupRetryAt !== Infinity) throw new Error('MAINTENANCE_FAILED'); budget(message.events!); requireWriter().append(message.events!); }
      else if (message.type === 'read') result = store.read(message.filter!, message.at ?? Date.now(), message.synthetic ? 'SYNTHETIC' : 'HUMAN');
      else if (message.type === 'health') requireWriter().health(message.health!);
      else if (message.type === 'maintain') await maintain(message.at ?? Date.now());
      else if (message.type === 'backup') {
        if (!options.backupDirectory || !options.backupKey) throw new Error('BACKUP_NOT_CONFIGURED');
        result = await backupUsage(store, options.backupDirectory, Buffer.from(options.backupKey, 'hex'), message.at ?? Date.now());
      } else if (message.type === 'close') { if (message.health && store instanceof SqliteUsageStore) store.health(message.health); close(); }
      else throw new Error('INVALID_OPERATION');
      parentPort!.postMessage({ id: message.id, result });
    } catch (error) {
      const code = error instanceof UsageError ? error.code : error instanceof Error && error.message === 'DISK_LIMIT' ? 'DISK_LIMIT' : 'STORAGE_UNAVAILABLE';
      const transient = !!error && typeof error === 'object' && 'errcode' in error && [5, 6].includes(Number(error.errcode));
      parentPort!.postMessage({ id: message.id, error: code, transient, paused: code === 'DISK_LIMIT' });
    } finally { busy = false; }
  });
} catch (error) {
  releaseWriter?.(); releaseWriter = undefined;
  parentPort!.postMessage({ failed: error instanceof UsageError ? error.code : 'STORAGE_UNAVAILABLE' });
}
