import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { SystemClock, TimerScheduler } from '../infrastructure/time.js';
import { AggregateWriter } from '../infrastructure/statistics/writer.js';
import { privateDirectory, readPrivateKey } from '../infrastructure/statistics/privateFiles.js';
import { StatisticsControls } from '../application/statistics/controls.js';
import { StatisticsRecording, disabledStatistics } from '../application/statistics/recording.js';
import { StatisticsError, type Environment, type Traffic } from '../application/statistics/contracts.js';
import { drawChoiceRevision } from '../infrastructure/generators.js';
import type { Clock, Scheduler } from '../application/ports.js';
import type { StatisticsHttp } from '../infrastructure/statistics/http.js';

export function statisticsLocation(environment: string | undefined, directory: string | undefined, traffic: Traffic = 'HUMAN') {
  if (!environment || !['development', 'test', 'pruebas', 'production'].includes(environment) || !directory || !path.isAbsolute(directory)) throw new StatisticsError('INVALID_FILTER');
  const root = path.resolve(directory, environment, traffic.toLowerCase());
  if (['dist', 'dist-server', 'barajas', 'public', 'src'].some(segment => root.split(path.sep).some(part => part.toLowerCase() === segment))) throw new StatisticsError('INVALID_FILTER');
  return { root, file: path.join(root, 'agg-daily-v1.sqlite'), environment: environment as Environment, traffic };
}
export function statisticsMode(mode: string | undefined, environment: string | undefined) {
  if (mode === 'off' || mode === undefined && environment !== 'pruebas') return 'off';
  if ((mode === undefined || mode === 'aggregate') && environment === 'pruebas') return 'aggregate';
  if (mode === 'synthetic' && environment === 'test') return 'synthetic';
}
export function disabledStatisticsRuntime(clock: Clock, scheduler: Scheduler): StatisticsHttp & { close(): Promise<void> } {
  const controls = new StatisticsControls(clock, scheduler, drawChoiceRevision, () => false);
  return { controls, recorder: disabledStatistics, enabled: () => false, mode: 'off', close: async () => { controls.dispose(); } };
}
/** La inicialización del archivo es un comando explícito separado; el arranque no convierte ni crea DB. */
export async function createStatisticsRuntime(informationReady = false, time?: { clock: Clock; scheduler: Scheduler }): Promise<StatisticsHttp & { close(): Promise<void> }> {
  const clock = time?.clock ?? new SystemClock(); const scheduler = time?.scheduler ?? new TimerScheduler();
  const disabled = disabledStatisticsRuntime(clock, scheduler);
  const mode = statisticsMode(process.env.KARTA3_STATISTICS_MODE, process.env.KARTA3_ENV);
  let writer: AggregateWriter | undefined;
  try {
    if (!mode) throw new StatisticsError('INVALID_FILTER');
    if (mode === 'off' && (!process.env.KARTA3_STATISTICS_DIRECTORY || !process.env.KARTA3_ENV)) return disabled;
    const traffic: Traffic = mode === 'synthetic' || process.env.KARTA3_ENV === 'test' ? 'SYNTHETIC' : 'HUMAN';
    const location = statisticsLocation(process.env.KARTA3_ENV, process.env.KARTA3_STATISTICS_DIRECTORY, traffic);
    if (!fs.existsSync(location.file)) return disabled;
    privateDirectory(location.root, false);
    let enabled = mode !== 'off' && informationReady;
    const keyFile = process.env.KARTA3_STATISTICS_BACKUP_KEY_FILE;
    let backupKey: string | undefined;
    try { backupKey = keyFile ? readPrivateKey(keyFile) : undefined; }
    catch { console.error('STATISTICS_BACKUP_KEY_UNAVAILABLE'); }
    if (mode === 'aggregate' && !backupKey) enabled = false;
    const backupDirectory = path.join(location.root, 'backups');
    writer = new AggregateWriter({ ...location, now: clock.now().unix, collecting: enabled,
      ...(backupKey || fs.existsSync(backupDirectory) ? { backupKey, backupDirectory } : {}), warning: code => console.error(`STATISTICS_${code}`) });
    await writer.ready;
    disabled.controls.dispose(); const activeWriter = writer;
    const controls = new StatisticsControls(clock, scheduler, drawChoiceRevision, () => activeWriter.available());
    const recorder = enabled ? new StatisticsRecording(activeWriter, clock, controls, scheduler, randomUUID) : disabledStatistics;
    return { controls, recorder, enabled: () => activeWriter.available(), mode,
      close: async () => { recorder.dispose(); controls.dispose(); await activeWriter.close(); } };
  } catch { await writer?.close(); console.error('STATISTICS_UNAVAILABLE'); return disabled; }
}
