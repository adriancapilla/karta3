import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SystemClock } from '../infrastructure/time.js';
import { UsageRecording, disabledUsage } from '../application/usage/recording.js';
import { SqliteUsageWorker } from '../infrastructure/usage/sqliteWorker.js';
import { privateDirectory } from '../infrastructure/usage/privateFiles.js';
import { UsageAdmission } from '../infrastructure/usage/http.js';
import { UsageError, type UsageEnvironment, type UsageTraffic } from '../application/usage/contracts.js';
import fs from 'node:fs';

export function usageLocation(environment: string | undefined, directory: string | undefined, traffic: UsageTraffic = 'HUMAN') {
  if (!environment || !['development', 'test', 'pruebas', 'production'].includes(environment) || !directory || !path.isAbsolute(directory)) throw new UsageError('INVALID_FILTER');
  const root = path.resolve(directory, environment, traffic.toLowerCase());
  // No guardar datos administrativos en un árbol de producto/estático.
  if (['dist', 'dist-server', 'barajas', 'public', 'src'].some((segment) => root.split(path.sep).includes(segment))) throw new UsageError('INVALID_FILTER');
  return { root, file: path.join(root, 'usage.sqlite'), environment: environment as UsageEnvironment, traffic };
}
export async function createUsageRuntime() {
  const disabled = { recorder: disabledUsage, http: undefined, close: async () => {} };
  // Esta entrega NO proporciona activación HUMAN. Solo pruebas aisladas explícitas.
  const enabled = process.env.KARTA3_USAGE_COLLECTION === 'synthetic' && process.env.KARTA3_ENV === 'test';
  if (process.env.KARTA3_USAGE_COLLECTION && process.env.KARTA3_USAGE_COLLECTION !== 'off' && !enabled) console.error('USAGE_PUBLIC_COLLECTION_DISABLED');
  if (!enabled && (!process.env.KARTA3_USAGE_DIRECTORY || !process.env.KARTA3_ENV)) return disabled;
  try {
    const traffic = process.env.KARTA3_ENV === 'test' ? 'SYNTHETIC' : 'HUMAN';
    const location = usageLocation(process.env.KARTA3_ENV, process.env.KARTA3_USAGE_DIRECTORY, traffic);
    if (!enabled && !fs.existsSync(location.file)) return disabled;
    privateDirectory(location.root, enabled);
    const keyFile = process.env.KARTA3_USAGE_BACKUP_KEY_FILE;
    const backupKey = keyFile ? fs.readFileSync(keyFile, 'utf8').trim() : process.env.KARTA3_USAGE_BACKUP_KEY;
    const backupPath = path.join(location.root, 'backups');
    const backupDirectory = backupKey || fs.existsSync(backupPath) ? backupPath : undefined;
    if (backupDirectory) {
      if (backupKey && !/^[a-f0-9]{64}$/i.test(backupKey)) throw new UsageError('INVALID_FILTER');
      privateDirectory(backupDirectory, true);
    }
    const bootRef = randomUUID();
    const writer = new SqliteUsageWorker({ ...location, bootRef, collecting: enabled, warning: (code) => console.error(`USAGE_${code}`),
      backupDirectory, backupKey });
    await writer.ready;
    if (!enabled) return { ...disabled, close: () => writer.close() };
    const recorder = new UsageRecording(writer, new SystemClock(), randomUUID, location.environment, 'SYNTHETIC', bootRef);
    // El arranque del envelope y el de reconciliación son el mismo identificador estadístico.
    return { recorder, http: { enabled: true, recorder, admission: new UsageAdmission() }, close: () => writer.close() };
  } catch { console.error('USAGE_STORAGE_UNAVAILABLE'); return disabled; }
}
