import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { ControlledTime } from './controlledTime.js';
import type { Cell } from '../../server/application/statistics/contracts.js';

/** Compilación actual, HTTP/Socket.IO/worker/SQLite reales. Solo tiempo/entropía opcionalmente sustituidos. */
export async function statisticsBrowserServer(options: { realTime?: boolean; enabled?: boolean } = {}) {
  const { createRuntime } = await import('../../dist-server/server/composition/createApp.js');
  const { loadInstallationDecks } = await import('../../dist-server/server/composition/decks.js');
  const { attachPublicFiles } = await import('../../dist-server/server/infrastructure/http/publicFiles.js');
  const { AggregateStore } = await import('../../dist-server/server/infrastructure/statistics/store.js');
  const { AggregateWriter } = await import('../../dist-server/server/infrastructure/statistics/writer.js');
  const { StatisticsControls } = await import('../../dist-server/server/application/statistics/controls.js');
  const { StatisticsRecording } = await import('../../dist-server/server/application/statistics/recording.js');
  const { SystemClock, TimerScheduler } = await import('../../dist-server/server/infrastructure/time.js');
  const { MemoryRoomRepository } = await import('../../dist-server/server/infrastructure/memoryRoomRepository.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b21-browser-')); const file = path.join(root, 'agg-daily-v1.sqlite');
  const time = new ControlledTime(); const clock = options.realTime ? new SystemClock() : time; const scheduler = options.realTime ? new TimerScheduler() : time;
  const store = new AggregateStore({ file, environment: 'test', traffic: 'SYNTHETIC', now: clock.now().unix, initialize: true }); store.close(true);
  const writer = new AggregateWriter({ file, environment: 'test', traffic: 'SYNTHETIC', now: clock.now().unix, collecting: options.enabled ?? true }); await writer.ready;
  const controls = new StatisticsControls(clock, scheduler, () => 100, () => writer.available());
  const recorder = new StatisticsRecording(writer, clock, controls, scheduler, randomUUID);
  const loaded = await loadInstallationDecks(); const repository = new MemoryRoomRepository();
  const runtime = createRuntime({ repository, decks: loaded.catalog, deckVersions: loaded.catalog, gameDecks: loaded.catalog, clock, scheduler,
    statistics: { recorder, controls, enabled: () => writer.available(), mode: 'synthetic' }, production: false });
  attachPublicFiles(runtime.app, path.resolve('dist'), loaded.catalog);
  const server = createServer(runtime.app); const io = runtime.attachRealtime(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('own port');
  const cells = () => { const db = new DatabaseSync(file, { readOnly: true }); try { return db.prepare('SELECT * FROM cells ORDER BY day,family,dimension,category,measure').all() as Cell[]; } finally { db.close(); } };
  const total = (family: Cell['family'], category: string, dimension = 'balance', measure = 'count') => cells().filter(c => c.family === family && c.dimension === dimension && c.category === category && c.measure === measure).reduce((n, c) => n + c.value, 0);
  return { base: `http://127.0.0.1:${address.port}`, time, clock, cells, total, writer, controls, recorder, repository, file, stop: async () => {
    runtime.dispose(); controls.dispose(); io.engine.close(); const closed = new Promise<void>(resolve => server.close(() => resolve())); server.closeAllConnections(); await closed;
    await io.close(); await writer.close();
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b21-browser-')) throw new Error('own path');
    await fs.rm(root, { recursive: true, force: true });
  } };
}
