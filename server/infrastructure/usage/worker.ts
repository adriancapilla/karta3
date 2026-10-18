import { parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import type { UsageEnvironment, UsageEvent, UsageFilter } from '../../application/usage/contracts.js';
import { UsageError } from '../../application/usage/contracts.js';
import { SqliteUsageStore } from './sqliteStore.js';
import { backupUsage } from './backups.js';

type Options = { file: string; environment: UsageEnvironment; bootRef?: string; now: number; backupDirectory?: string; backupKey?: string;
  limits: { databaseBytes: number; walBytes: number; reserveBytes: number } };
const options = workerData as Options;
let store: SqliteUsageStore;
let maintenance: NodeJS.Timeout;
let lastBackupDay = '';
let busy = false;
function budget() {
  const size = (file: string) => fs.existsSync(file) ? fs.statSync(file).size : 0;
  const free = fs.statfsSync(path.dirname(options.file));
  const database = size(options.file); const wal = size(options.file + '-wal');
  // Incluye temporales/copias del volumen, además del espacio libre efectivo.
  const used = fs.readdirSync(path.dirname(options.file), { withFileTypes: true }).filter((entry) => entry.isFile())
    .reduce((sum, entry) => sum + size(path.join(path.dirname(options.file), entry.name)), 0);
  if (database >= options.limits.databaseBytes * .8 || wal >= options.limits.walBytes * .8) parentPort!.postMessage({ warning: 'DISK_WARNING' });
  if (database >= options.limits.databaseBytes || wal >= options.limits.walBytes || used >= options.limits.databaseBytes + options.limits.walBytes
    || free.bavail * free.bsize < options.limits.reserveBytes) throw new Error('DISK_LIMIT');
}
async function maintain(at: number) {
  store.maintain(at);
  const day = new Date(at).toISOString().slice(0, 10);
  if (options.backupDirectory && options.backupKey && day !== lastBackupDay) {
    await backupUsage(store, options.backupDirectory, Buffer.from(options.backupKey, 'hex'), at); lastBackupDay = day;
  }
}
function schedule() {
  maintenance = setTimeout(async () => {
    if (!busy) {
      busy = true;
      try { await maintain(Date.now()); } catch { parentPort!.postMessage({ warning: 'MAINTENANCE_FAILED' }); }
      finally { busy = false; }
    }
    schedule();
  }, Math.max(250, store.nextExpiry(Date.now()) - Date.now()));
  maintenance.unref();
}
try {
  store = new SqliteUsageStore(options.file, options.environment, options.now, options.bootRef);
  budget(); await maintain(options.now); schedule(); parentPort!.postMessage({ ready: true });
  parentPort!.on('message', async (message: { id: number; type: string; events?: UsageEvent[]; filter?: UsageFilter; at?: number; synthetic?: boolean; loss?: boolean }) => {
    if (busy) { parentPort!.postMessage({ id: message.id, error: 'BUSY', transient: true }); return; }
    busy = true;
    try {
      if (message.loss) store.noteLoss();
      let result: unknown;
      if (message.type === 'append') { budget(); store.append(message.events!); }
      else if (message.type === 'read') result = store.read(message.filter!, message.at ?? Date.now(), message.synthetic ? 'SYNTHETIC' : 'HUMAN');
      else if (message.type === 'maintain') await maintain(message.at ?? Date.now());
      else if (message.type === 'backup') {
        if (!options.backupDirectory || !options.backupKey) throw new Error('BACKUP_NOT_CONFIGURED');
        result = await backupUsage(store, options.backupDirectory, Buffer.from(options.backupKey, 'hex'), message.at ?? Date.now());
      } else if (message.type === 'close') { clearTimeout(maintenance); store.close(!!options.bootRef); }
      else throw new Error('INVALID_OPERATION');
      parentPort!.postMessage({ id: message.id, result });
    } catch (error) {
      const code = error instanceof UsageError ? error.code : error instanceof Error && error.message === 'DISK_LIMIT' ? 'DISK_LIMIT' : 'STORAGE_UNAVAILABLE';
      const transient = !!error && typeof error === 'object' && 'errcode' in error && [5, 6].includes(Number(error.errcode));
      parentPort!.postMessage({ id: message.id, error: code, transient });
    } finally { busy = false; }
  });
} catch (error) { parentPort!.postMessage({ failed: error instanceof UsageError ? error.code : 'STORAGE_UNAVAILABLE' }); }
