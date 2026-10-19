import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SystemClock, TimerScheduler } from '../infrastructure/time.js';
import { UsageRecording, disabledUsage } from '../application/usage/recording.js';
import { SqliteUsageWorker } from '../infrastructure/usage/sqliteWorker.js';
import { privateDirectory, readPrivateUsageKey } from '../infrastructure/usage/privateFiles.js';
import { UsageAdmission } from '../infrastructure/usage/http.js';
import { UsageError, type UsageEnvironment, type UsageTraffic } from '../application/usage/contracts.js';
import { UsageChoices } from '../application/usage/choice.js';
import { USAGE_NOTICE_VERSION } from '../../shared/contracts/usage.js';
import { drawChoiceRevision } from '../infrastructure/generators.js';
import type { Clock, Scheduler } from '../application/ports.js';
import fs from 'node:fs';

export function usageLocation(environment: string | undefined, directory: string | undefined, traffic: UsageTraffic = 'HUMAN') {
  if (!environment || !['development', 'test', 'pruebas', 'production'].includes(environment) || !directory || !path.isAbsolute(directory)) throw new UsageError('INVALID_FILTER');
  const root = path.resolve(directory, environment, traffic.toLowerCase());
  // No guardar datos administrativos en un árbol de producto/estático.
  if (['dist', 'dist-server', 'barajas', 'public', 'src'].some((segment) => root.split(path.sep).some((part) => part.toLowerCase() === segment))) throw new UsageError('INVALID_FILTER');
  return { root, file: path.join(root, 'usage.sqlite'), environment: environment as UsageEnvironment, traffic };
}
export function usageMode(mode: string | undefined, environment: string | undefined): 'off' | 'synthetic' | 'human' | undefined {
  if (mode === undefined || mode === 'off') return 'off';
  if (mode === 'synthetic' && environment === 'test') return 'synthetic';
  if (mode === 'human' && environment === 'pruebas') return 'human';
}
// informationReady acredita contenido completo incluido en la versión, no aprobación jurídica/operativa.
// main aporta la comprobación del aviso incluido; por defecto cerrado, sin variable de aprobación o activación HTTP.
export async function createUsageRuntime(informationReady = false, time?: { clock: Clock; scheduler: Scheduler }) {
  let writer: SqliteUsageWorker | undefined;
  let capturesHuman = false;
  const clock = time?.clock ?? new SystemClock(); const scheduler = time?.scheduler ?? new TimerScheduler();
  const choices = new UsageChoices({ control: command => writer ? writer.control(command) : Promise.reject(new UsageError('STORAGE_UNAVAILABLE')),
    revoke: (scopes, command) => writer ? writer.revoke(scopes, command) : Promise.reject(new UsageError('STORAGE_UNAVAILABLE')) },
    clock, scheduler, randomUUID, drawChoiceRevision, USAGE_NOTICE_VERSION, () => capturesHuman && !!writer?.isCollecting(),
    () => console.error('USAGE_CHOICE_CONTROL_UNAVAILABLE'));
  const disabled = { recorder: disabledUsage, http: undefined, choices, close: async () => { choices.dispose(); } };
  const mode = usageMode(process.env.KARTA3_USAGE_COLLECTION, process.env.KARTA3_ENV);
  if (mode === undefined) console.error('USAGE_INVALID_COLLECTION_MODE');
  const requested = mode === 'human' || mode === 'synthetic';
  if (!requested && (!process.env.KARTA3_USAGE_DIRECTORY || !process.env.KARTA3_ENV)) return disabled;
  try {
    const traffic = process.env.KARTA3_ENV === 'test' ? 'SYNTHETIC' : 'HUMAN';
    const location = usageLocation(process.env.KARTA3_ENV, process.env.KARTA3_USAGE_DIRECTORY, traffic);
    let enabled = requested;
    if (mode === 'human' && !informationReady) { console.error('USAGE_INFORMATION_UNAVAILABLE'); enabled = false; }
    let backupKey: string | undefined;
    try {
      const keyFile = process.env.KARTA3_USAGE_BACKUP_KEY_FILE;
      if (keyFile) backupKey = readPrivateUsageKey(keyFile);
      else if (mode === 'synthetic') backupKey = process.env.KARTA3_USAGE_BACKUP_KEY || undefined;
      if (backupKey && !/^[a-f0-9]{64}$/i.test(backupKey)) throw new UsageError('INVALID_FILTER');
      if (mode === 'human' && !backupKey) throw new UsageError('NOT_AUTHORIZED');
    } catch { console.error('USAGE_BACKUP_KEY_UNAVAILABLE'); backupKey = undefined; if (mode === 'human') enabled = false; }
    if (!enabled && !fs.existsSync(location.file)) return disabled;
    privateDirectory(location.root, enabled);
    const backupPath = path.join(location.root, 'backups');
    let backupDirectory: string | undefined;
    if (backupKey || fs.existsSync(backupPath)) {
      try { privateDirectory(backupPath, true); backupDirectory = backupPath; }
      catch { console.error('USAGE_BACKUP_DIRECTORY_UNAVAILABLE'); if (mode === 'human') enabled = false; }
    }
    const bootRef = randomUUID();
    writer = new SqliteUsageWorker({ ...location, bootRef, now: Math.floor(clock.now().unix), collecting: enabled, existingOnly: !enabled,
      warning: (code) => console.error(`USAGE_${location.environment}_${code}`), backupDirectory, backupKey,
      requireBackup: mode === 'human' && enabled, consentRequired: mode === 'human' });
    await writer.ready;
    const activeWriter = writer;
    if (!enabled) return { ...disabled, close: async () => { choices.dispose(); await activeWriter.close(); } };
    capturesHuman = mode === 'human';
    const recorder = new UsageRecording(activeWriter, clock, randomUUID, location.environment, traffic, bootRef, capturesHuman ? choices : undefined);
    return { recorder, http: { get enabled() { return activeWriter.isCollecting(); }, mode: mode as 'human' | 'synthetic', recorder,
      admission: new UsageAdmission(), choices }, choices, close: async () => { choices.dispose(); await activeWriter.close(); } };
  } catch { await writer?.close(); console.error('USAGE_STORAGE_UNAVAILABLE'); return disabled; }
}
