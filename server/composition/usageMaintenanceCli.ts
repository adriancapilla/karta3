import fs from 'node:fs';
import path from 'node:path';
import { usageLocation } from './usage.js';
import { UsageError } from '../application/usage/contracts.js';
import { privateDirectory, withPrivateExport } from '../infrastructure/usage/privateFiles.js';
import { restoreUsageBackup } from '../infrastructure/usage/backups.js';
import { SqliteUsageWorker } from '../infrastructure/usage/sqliteWorker.js';

let writer: SqliteUsageWorker | undefined;
try {
  const operation = process.argv[2];
  if (!['backup', 'restore', 'maintain'].includes(operation) || process.argv.length !== 3) throw new UsageError('INVALID_FILTER');
  const location = usageLocation(process.env.KARTA3_ENV, process.env.KARTA3_USAGE_DIRECTORY, process.env.KARTA3_ENV === 'test' ? 'SYNTHETIC' : 'HUMAN');
  const keyFile = process.env.KARTA3_USAGE_BACKUP_KEY_FILE;
  if (!keyFile && operation !== 'maintain') throw new UsageError('INVALID_FILTER');
  const key = keyFile ? fs.readFileSync(keyFile, 'utf8').trim() : '';
  if (keyFile && !/^[a-f0-9]{64}$/i.test(key)) throw new UsageError('INVALID_FILTER');
  privateDirectory(location.root, operation === 'restore');
  const execute = async () => {
    if (operation === 'backup' || operation === 'maintain') {
      const backupDirectory = path.join(location.root, 'backups'); privateDirectory(backupDirectory, true);
      writer = new SqliteUsageWorker({ ...location, existingOnly: true, readOnly: operation === 'backup', backupDirectory, ...(key ? { backupKey: key } : {}) });
      await writer.ready;
      if (operation === 'backup') { await writer.backup(Date.now()); console.log('AGGREGATES_BACKUP_CREATED'); }
      else { await writer.maintain(Date.now()); console.log('USAGE_MAINTAINED'); }
    } else {
      const source = process.env.KARTA3_USAGE_RESTORE_FILE;
      if (!source || !path.isAbsolute(source)) throw new UsageError('INVALID_FILTER');
      await restoreUsageBackup(source, location.file, Buffer.from(key, 'hex'), location.environment, Date.now(), location.traffic);
      console.log('AGGREGATES_ONLY_RESTORED');
    }
  };
  if (operation === 'restore') await withPrivateExport(location.root, execute);
  else await execute(); // El worker toma el mismo bloqueo al exportar la copia.
} catch (error) { console.error(error instanceof UsageError ? error.code : 'STORAGE_UNAVAILABLE'); process.exitCode = 1; }
finally { await writer?.close(); }
