import { parentPort, workerData } from 'node:worker_threads';
import path from 'node:path';
import { AggregateStore, type StoreOptions } from './store.js';
import { acquirePrivateLease } from './privateFiles.js';
import type { Delta } from '../../application/statistics/contracts.js';
import { backupAggregates, pruneBackups } from './backups.js';

const options = workerData as StoreOptions & { token: string; testFault?: 'AFTER_COMMIT_EXIT' | 'BEFORE_COMMIT_EXIT'; backupDirectory?: string; backupKey?: string };
let store: AggregateStore | undefined; let release: (() => void) | undefined;
async function maintain(now: number) {
  store!.maintain(now);
  if (options.backupDirectory && options.backupKey) {
    await backupAggregates(options.file, options.backupDirectory, Buffer.from(options.backupKey, 'hex'), options.environment, options.traffic, now, options.token);
  }
  if (options.backupDirectory) await pruneBackups(options.backupDirectory, now);
}
try {
  release = acquirePrivateLease(path.join(path.dirname(options.file), '.writer.lock'), options.token);
  store = new AggregateStore(options); await maintain(options.now);
  parentPort!.postMessage({ ready: true, packages: store.db.prepare("SELECT day,category FROM cells WHERE family='CONFIGURATION' AND dimension='package'").all() });
} catch { store?.close(); release?.(); parentPort!.postMessage({ failed: true }); parentPort!.close(); }
let busy = false;
parentPort!.on('message', async (message: { id: number; type: 'append' | 'maintain' | 'close'; units?: Delta[]; now: number }) => {
  if (!store) return;
  if (busy) { parentPort!.postMessage({ id: message.id, failed: true }); return; } busy = true;
  try {
    if (message.type === 'append') {
      if (options.testFault === 'BEFORE_COMMIT_EXIT') process.exit(1);
      if (store.append(message.units!, message.now)) parentPort!.postMessage({ warning: 'DISK_WARNING' });
      if (options.testFault === 'AFTER_COMMIT_EXIT') process.exit(1);
    } else if (message.type === 'maintain') await maintain(message.now);
    else { store.maintain(message.now); store.close(true); store = undefined; release?.(); release = undefined; }
    parentPort!.postMessage({ id: message.id }); if (message.type === 'close') parentPort!.close();
  } catch { parentPort!.postMessage({ id: message.id, failed: true }); }
  finally { busy = false; }
});
