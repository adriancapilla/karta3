import path from 'node:path';
import { statisticsLocation } from './statistics.js';
import { AggregateStore } from '../infrastructure/statistics/store.js';
import { backupAggregates, pruneBackups, restoreAggregates } from '../infrastructure/statistics/backups.js';
import { acquirePrivateLease, privateDirectory, readPrivateKey, pruneExports } from '../infrastructure/statistics/privateFiles.js';
import { StatisticsError } from '../application/statistics/contracts.js';
import fs from 'node:fs';

let release: (() => void) | undefined;
try {
  const operation = process.argv[2];
  if (process.argv.length !== 3 || !['initialize', 'maintain', 'backup', 'restore'].includes(operation)) throw new StatisticsError('INVALID_FILTER');
  const location = statisticsLocation(process.env.KARTA3_ENV, process.env.KARTA3_STATISTICS_DIRECTORY, process.env.KARTA3_ENV === 'test' ? 'SYNTHETIC' : 'HUMAN');
  privateDirectory(location.root, ['initialize', 'restore'].includes(operation));
  const directory = path.join(location.root, 'backups'); const now = Date.now();
  if (operation === 'restore') {
    const source = process.env.KARTA3_STATISTICS_RESTORE_FILE;
    if (!source || !path.isAbsolute(source)) throw new StatisticsError('INVALID_FILTER');
    release = acquirePrivateLease(path.join(location.root, '.writer.lock'));
    await restoreAggregates(source, location.file, Buffer.from(readPrivateKey(process.env.KARTA3_STATISTICS_BACKUP_KEY_FILE ?? ''), 'hex'), location.environment, location.traffic, now);
  } else if (operation === 'backup') {
    await backupAggregates(location.file, directory, Buffer.from(readPrivateKey(process.env.KARTA3_STATISTICS_BACKUP_KEY_FILE ?? ''), 'hex'), location.environment, location.traffic, now);
  } else {
    if (operation === 'initialize' && fs.existsSync(location.file)) throw new StatisticsError('STORAGE_UNAVAILABLE');
    release = acquirePrivateLease(path.join(location.root, '.writer.lock'));
    const store = new AggregateStore({ ...location, now, initialize: operation === 'initialize' }); store.close(true);
    if (fs.existsSync(directory)) await pruneBackups(directory, now);
    pruneExports(location.root, now);
  }
  console.log('AGG_DAILY_V1_ADMINISTRATION_COMPLETE');
} catch (error) { console.error(error instanceof StatisticsError ? error.code : 'STORAGE_UNAVAILABLE'); process.exitCode = 1; }
finally { release?.(); }
