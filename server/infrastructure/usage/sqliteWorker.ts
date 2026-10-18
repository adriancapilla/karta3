import { Worker } from 'node:worker_threads';
import type { UsageEnvironment, UsageEvent, UsageEventSink, UsageEventStore, UsageFilter, UsageMaintenance, UsageReport, UsageReportReader } from '../../application/usage/contracts.js';
import { UsageError, type UsageErrorCode } from '../../application/usage/contracts.js';

export type UsageLimits = { events: number; bytes: number; serverReserve: number; batch: number; flushMs: number;
  retriesMs: number[]; maxAgeMs: number; drainMs: number; databaseBytes: number; walBytes: number; reserveBytes: number };
export const usageLimits: UsageLimits = { events: 2048, bytes: 2 * 1024 ** 2, serverReserve: 1024, batch: 64, flushMs: 250,
  retriesMs: [1000, 5000, 30_000], maxAgeMs: 60_000, drainMs: 2000, databaseBytes: 512 * 1024 ** 2, walBytes: 64 * 1024 ** 2, reserveBytes: 128 * 1024 ** 2 };
type Entry = { event: UsageEvent; bytes: number; born: number };
type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: NodeJS.Timeout };
type WriterOptions = { file: string; environment: UsageEnvironment; bootRef?: string; now?: number; backupDirectory?: string; backupKey?: string;
  limits?: Partial<UsageLimits>; warning?: (code: string) => void };

/** Un batch en vuelo; el puerto nunca admite espera/IO o excepciones hacia el juego. */
export class SqliteUsageWorker implements UsageEventSink, UsageEventStore, UsageReportReader, UsageMaintenance {
  private readonly worker: Worker;
  private readonly limits: UsageLimits;
  private readonly queue: Entry[] = [];
  private flight: Entry[] = [];
  private bytes = 0;
  private nextId = 0;
  private pending = new Map<number, Pending>();
  private retry = 0;
  private retryAt = 0;
  private readonly timer: NodeJS.Timeout;
  private stopped = false;
  private failed = false;
  private exportBusy = false;
  private drops: Record<string, number> = {};
  private warnings = new Map<string, number>();
  readonly ready: Promise<void>;
  constructor(private readonly options: WriterOptions) {
    this.limits = { ...usageLimits, ...options.limits };
    const workerUrl = import.meta.url.endsWith('.ts') ? new URL('../../../dist-server/server/infrastructure/usage/worker.js', import.meta.url) : new URL('./worker.js', import.meta.url);
    this.worker = new Worker(workerUrl, { workerData: { ...options, warning: undefined, now: options.now ?? Date.now(), limits: this.limits } });
    this.ready = new Promise((resolve, reject) => {
      const initial = setTimeout(() => { this.fail(); reject(new UsageError('STORAGE_UNAVAILABLE')); }, 5000);
      this.worker.on('message', (message: { ready?: boolean; failed?: string; warning?: string; id?: number; result?: unknown; error?: string; transient?: boolean }) => {
        if (message.ready) { clearTimeout(initial); resolve(); }
        if (message.failed) { clearTimeout(initial); this.fail(); reject(new UsageError(message.failed as UsageErrorCode)); }
        if (message.warning) this.warn(message.warning);
        if (message.id) {
          const pending = this.pending.get(message.id); if (!pending) return;
          clearTimeout(pending.timer); this.pending.delete(message.id);
          if (message.error) pending.reject(Object.assign(new UsageError(message.error === 'BUSY' || message.error === 'DISK_LIMIT' ? 'STORAGE_UNAVAILABLE' : message.error as UsageErrorCode), { transient: message.transient }));
          else pending.resolve(message.result);
        }
      });
      this.worker.on('error', () => { clearTimeout(initial); this.fail(); reject(new UsageError('STORAGE_UNAVAILABLE')); });
      this.worker.on('exit', () => { if (!this.stopped) this.fail(); });
    });
    // La promesa también es consultable por composición; nunca una rejection global sin consumidor.
    void this.ready.catch(() => {});
    this.timer = setInterval(() => void this.flush(), this.limits.flushMs); this.timer.unref();
  }
  status() { return { enabled: true, degraded: this.failed || Object.keys(this.drops).length > 0, queue: this.queue.length + this.flight.length,
    bytes: this.bytes, discarded: { ...this.drops } }; }
  private warn(code: string) {
    if (Date.now() - (this.warnings.get(code) ?? -Infinity) < 60_000) return;
    this.warnings.set(code, Date.now()); this.options.warning?.(code);
  }
  private drop(entry: Entry, reason: string) { this.bytes -= entry.bytes; this.count(reason, entry.event.source); }
  private count(reason: string, source: string) { const key = `${source}:${reason}`; this.drops[key] = (this.drops[key] ?? 0) + 1; this.warn(reason); }
  tryRecord(event: UsageEvent): boolean {
    try {
      if (this.stopped || this.failed) { this.count('WRITER_UNAVAILABLE', event.source); return false; }
      const entry = { event: structuredClone(event), bytes: Buffer.byteLength(JSON.stringify(event)), born: Date.now() };
      const full = () => this.queue.length + this.flight.length >= this.limits.events || this.bytes + entry.bytes > this.limits.bytes;
      if (event.source === 'BROWSER' && this.queue.length + this.flight.length >= this.limits.events - this.limits.serverReserve) { this.count('BROWSER_RESERVE', event.source); return false; }
      while (full() && event.source === 'SERVER') {
        const index = this.queue.findIndex((item) => item.event.source === 'BROWSER'); if (index < 0) break;
        this.drop(this.queue.splice(index, 1)[0], 'EVICTED_FOR_SERVER');
      }
      if (full()) { this.count('QUEUE_FULL', event.source); return false; }
      this.queue.push(entry); this.bytes += entry.bytes;
      if (this.queue.length >= this.limits.batch) queueMicrotask(() => void this.flush());
      return true;
    } catch { this.count('INVALID_EVENT', event.source); return false; }
  }
  private rpc(type: string, extra: object = {}, timeout = 5000): Promise<unknown> {
    if (this.failed) return Promise.reject(new UsageError('STORAGE_UNAVAILABLE'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); this.fail(); reject(new UsageError(type === 'read' ? 'REPORT_TIMEOUT' : 'STORAGE_UNAVAILABLE')); }, timeout);
      this.pending.set(id, { resolve, reject, timer }); this.worker.postMessage({ id, type, loss: Object.keys(this.drops).length > 0, ...extra });
    });
  }
  private fail() {
    this.failed = true; this.warn('WRITER_UNAVAILABLE');
    for (const entry of [...this.queue, ...this.flight]) this.drop(entry, 'WRITER_UNAVAILABLE');
    this.queue.length = 0; this.flight = [];
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new UsageError('STORAGE_UNAVAILABLE')); }
    this.pending.clear(); void this.worker.terminate();
  }
  private async flush() {
    if (this.stopped || this.failed || this.flight.length || !this.queue.length || this.retryAt > Date.now()) return;
    while (this.queue[0] && Date.now() - this.queue[0].born >= this.limits.maxAgeMs) this.drop(this.queue.shift()!, 'TOO_OLD');
    if (!this.queue.length) return;
    this.flight = this.queue.splice(0, this.limits.batch);
    try {
      await this.ready; await this.rpc('append', { events: this.flight.map((entry) => entry.event) });
      for (const entry of this.flight) this.bytes -= entry.bytes;
      this.flight = []; this.retry = 0; this.retryAt = 0;
    } catch (error) {
      if (this.failed) return;
      if (error && typeof error === 'object' && 'transient' in error && error.transient && this.retry < this.limits.retriesMs.length) {
        this.queue.unshift(...this.flight); this.flight = []; this.retryAt = Date.now() + this.limits.retriesMs[this.retry++];
      } else { for (const entry of this.flight) this.drop(entry, 'WRITE_FAILED'); this.flight = []; }
    }
  }
  async append(events: readonly UsageEvent[]) { for (const event of events) this.tryRecord(event); await this.drain(); }
  async drain(maxMs = this.limits.drainMs) {
    const until = Date.now() + maxMs;
    while (!this.failed && (this.queue.length || this.flight.length) && Date.now() < until) { await this.flush(); await new Promise((resolve) => setTimeout(resolve, 5)); }
  }
  async read(filter: UsageFilter, synthetic = false): Promise<UsageReport> {
    await this.ready; await this.drain();
    const report = await this.rpc('read', { filter, synthetic }) as UsageReport;
    if (Object.keys(this.drops).length) { report.quality.possibleLoss = true; report.percentage = null; }
    return report;
  }
  async maintain(at: number) { await this.ready; await this.rpc('maintain', { at }); }
  async backup(at: number) {
    if (this.exportBusy) throw new UsageError('STORAGE_UNAVAILABLE');
    this.exportBusy = true;
    try { await this.ready; await this.drain(); await this.rpc('backup', { at }); } finally { this.exportBusy = false; }
  }
  async close() {
    clearInterval(this.timer); await this.drain(); this.stopped = true;
    for (const entry of this.queue.splice(0)) this.drop(entry, 'SHUTDOWN_DEADLINE');
    if (!this.failed && !this.flight.length) { try { await this.rpc('close', {}, this.limits.drainMs); } catch { this.warn('SHUTDOWN_DEADLINE'); } }
    await this.worker.terminate();
  }
}
