import { Worker } from 'node:worker_threads';
import { StatisticsError, type AggregateData, type AggregateReader, type Environment, type Filter, type Traffic } from '../../application/statistics/contracts.js';
/** Snapshot de solo lectura aislado y acotado; no abre otro escritor o sanea. */
export class SqliteAggregateReader implements AggregateReader {
  constructor(private readonly file: string, private readonly environment: Environment, private readonly traffic: Traffic) {}
  read(filter: Filter): Promise<AggregateData> {
    const url = import.meta.url.endsWith('.ts') ? new URL('../../../dist-server/server/infrastructure/statistics/readWorker.js', import.meta.url) : new URL('./readWorker.js', import.meta.url);
    const worker = new Worker(url, { workerData: { file: this.file, environment: this.environment, traffic: this.traffic, from: filter.from, to: filter.to, now: Date.now() }, resourceLimits: { maxOldGenerationSizeMb: 128 } });
    return new Promise((resolve, reject) => {
      let received = false;
      const timer = setTimeout(() => { void worker.terminate(); reject(new StatisticsError('REPORT_TIMEOUT')); }, 5000);
      worker.once('message', (message: { data?: AggregateData; failed?: boolean }) => {
        received = true;
        clearTimeout(timer); if (message.failed || !message.data) reject(new StatisticsError('STORAGE_UNAVAILABLE')); else resolve(message.data);
      });
      worker.once('error', () => { clearTimeout(timer); reject(new StatisticsError('STORAGE_UNAVAILABLE')); });
      worker.once('exit', code => { clearTimeout(timer); if (code !== 0 || !received) reject(new StatisticsError('STORAGE_UNAVAILABLE')); });
    });
  }
}
