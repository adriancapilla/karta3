import { Worker } from 'node:worker_threads';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { StatisticsError, type AggregateSink, type Delta, type qualityCauses } from '../../application/statistics/contracts.js';
import { validDelta } from '../../application/statistics/catalog.js';
import type { StoreOptions } from './store.js';
import { releaseOrphanWriter } from './privateFiles.js';

export const writerLimits = { entries: 2048, bytes: 2 * 1024 ** 2, reserve: 1024, batch: 64, flushMs: 250, ageMs: 60_000, drainMs: 2000, ackMs: 5000 };
type Entry = { unit: Delta; bytes: number; born: number; slots: number };
type Options = StoreOptions & { collecting?: boolean; limits?: Partial<typeof writerLimits>; warning?: (code: string) => void;
  testFault?: 'AFTER_COMMIT_EXIT' | 'BEFORE_COMMIT_EXIT'; backupDirectory?: string; backupKey?: string };
/** Sin reintento de lotes. La recuperación solo sanea el prefijo durable y admite ciclos nuevos. */
export class AggregateWriter implements AggregateSink {
  private worker?: Worker;
  private token = '';
  private exited: Promise<void> = Promise.resolve();
  private queue: Entry[] = [];
  private flight: Entry[] = [];
  private bytes = 0;
  private entries = 0;
  private packages: { day: string; category: string }[] = [];
  private generation = 0;
  private sequence = 0;
  private pending?: { id: number; resolve: () => void; reject: () => void; timer: NodeJS.Timeout };
  private paused = true;
  private stopped = false;
  private closing = false;
  private closePromise?: Promise<void>;
  private recovering?: Promise<void>;
  private readonly listeners = new Set<() => void>();
  private readonly limits: typeof writerLimits;
  private readonly interval: NodeJS.Timeout;
  private readonly warnings = new Map<string, number>();
  private lastDay = '';
  readonly ready: Promise<void>;
  constructor(private readonly options: Options) {
    this.limits = { ...writerLimits, ...options.limits };
    if (this.limits.batch > 64 || this.limits.reserve > this.limits.entries || this.limits.entries > 2048 || this.limits.bytes > 2 * 1024 ** 2)
      throw new StatisticsError('INVALID_FILTER');
    this.ready = this.open(true); void this.ready.catch(() => {});
    this.interval = setInterval(() => { void this.flush(); }, this.limits.flushMs); this.interval.unref();
  }
  available() { return !this.paused && !this.stopped && !this.closing && (this.options.collecting ?? true); }
  status() { return { paused: this.paused, entries: this.entries, bytes: this.bytes, generation: this.generation }; }
  packageCategories() { return this.packages; }
  onInvalidated(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private async open(first: boolean, recoveryCause?: typeof qualityCauses[number]) {
    const generation = ++this.generation; this.token = randomUUID();
    const workerUrl = import.meta.url.endsWith('.ts') ? new URL('../../../dist-server/server/infrastructure/statistics/worker.js', import.meta.url) : new URL('./worker.js', import.meta.url);
    const worker = new Worker(workerUrl, { resourceLimits: { maxOldGenerationSizeMb: 128 },
      workerData: { file: this.options.file, environment: this.options.environment, traffic: this.options.traffic,
        now: first ? this.options.now : Date.now(), initialize: first && this.options.initialize, token: this.token, recoveryCause,
        backupDirectory: this.options.backupDirectory, backupKey: this.options.backupKey, testFault: first ? this.options.testFault : undefined } });
    this.worker = worker;
    this.exited = new Promise(resolve => { worker.once('exit', () => { resolve(); if (generation === this.generation && !this.stopped && !this.closing) this.pause('WRITE_UNCERTAIN'); }); });
    await new Promise<void>((resolve, reject) => {
      let ready = false;
      const timeout = setTimeout(() => { this.pause('WRITE_UNCERTAIN'); reject(new StatisticsError('STORAGE_UNAVAILABLE')); }, this.limits.ackMs);
      worker.on('message', (message: { ready?: boolean; failed?: boolean; id?: number; packages?: { day: string; category: string }[]; warning?: 'DISK_WARNING' }) => {
        if (generation !== this.generation) return;
        if (message.warning) this.warn(message.warning);
        if (message.ready) { ready = true; clearTimeout(timeout); this.paused = false; this.packages = message.packages ?? []; this.lastDay = new Date().toISOString().slice(0, 10); resolve(); }
        else if (!message.id && message.failed) { clearTimeout(timeout); reject(new StatisticsError('STORAGE_UNAVAILABLE')); }
        if (message.id && message.id === this.pending?.id) {
          const pending = this.pending; this.pending = undefined; clearTimeout(pending.timer);
          if (message.failed) pending.reject(); else pending.resolve();
        }
      });
      worker.on('error', () => { clearTimeout(timeout); reject(new StatisticsError('STORAGE_UNAVAILABLE')); this.pause('WRITE_UNCERTAIN'); });
      worker.once('exit', () => { clearTimeout(timeout); if (!ready) reject(new StatisticsError('STORAGE_UNAVAILABLE')); });
    }).catch(async error => { this.paused = true; await worker.terminate(); await this.exited; await releaseOrphanWriter(this.options.file, this.token); throw error; });
  }
  admit(unit: Delta, source: 'SERVER' | 'BROWSER') {
    if (!this.available() || !validDelta(unit)) return false;
    const bytes = Buffer.byteLength(JSON.stringify(unit)); const slots = unit.cells.length + unit.coverage.length;
    if (this.entries + slots > this.limits.entries || slots > this.limits.batch || this.bytes + bytes > this.limits.bytes || source === 'BROWSER' && this.entries + slots > this.limits.entries - this.limits.reserve) return false;
    this.queue.push({ unit: structuredClone(unit), bytes, slots, born: performance.now() }); this.bytes += bytes; this.entries += slots;
    if (this.queue.reduce((sum, e) => sum + e.slots, 0) >= this.limits.batch) queueMicrotask(() => { void this.flush(); });
    return true;
  }
  pause(cause: typeof qualityCauses[number]) {
    if (this.paused || this.stopped) return;
    this.paused = true; this.generation++;
    this.queue = []; this.flight = []; this.bytes = 0; this.entries = 0;
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(); this.pending = undefined; }
    for (const listener of this.listeners) { try { listener(); } catch { /* Solo instrumentación. */ } }
    this.warn(cause);
    this.recovering = this.recover(cause); void this.recovering.catch(() => {});
  }
  private warn(cause: typeof qualityCauses[number] | 'DISK_WARNING') {
    if (performance.now() - (this.warnings.get(cause) ?? -Infinity) < 60_000) return;
    this.warnings.set(cause, performance.now()); queueMicrotask(() => { try { this.options.warning?.(cause); } catch { /* Diagnóstico no bloquea juego. */ } });
  }
  private async recover(cause: typeof qualityCauses[number]) {
    const worker = this.worker; const token = this.token;
    if (worker) await worker.terminate(); await this.exited;
    await releaseOrphanWriter(this.options.file, token);
    if (this.stopped) return;
    try { await this.open(false, cause); } catch { this.paused = true; } // Un intento, sin repetición de datos.
  }
  private rpc(type: 'append' | 'maintain' | 'close', units?: Delta[], deadline = this.limits.ackMs) {
    const id = ++this.sequence;
    return new Promise<void>((resolve, reject) => {
      const failure = () => reject(new StatisticsError('STORAGE_UNAVAILABLE'));
      const timer = setTimeout(() => { this.pending = undefined; failure(); }, deadline);
      this.pending = { id, resolve, reject: failure, timer };
      this.worker!.postMessage({ id, type, ...(units ? { units } : {}), now: Date.now() });
    });
  }
  async flush() {
    if (this.paused || this.pending || this.stopped || this.flight.length) return;
    const day = new Date().toISOString().slice(0, 10);
    if (day !== this.lastDay) {
      try { await this.rpc('maintain'); this.lastDay = day; } catch { this.pause('WRITE_UNCERTAIN'); return; }
    }
    if (!this.queue.length || this.paused || this.pending) return;
    if (performance.now() - this.queue[0].born >= this.limits.ageMs) { this.pause('QUEUE_FULL'); return; }
    let slots = 0, count = 0;
    for (const entry of this.queue) { if (slots + entry.slots > this.limits.batch) break; slots += entry.slots; count++; }
    const generation = this.generation; this.flight = this.queue.splice(0, count);
    try {
      await this.rpc('append', this.flight.map(entry => entry.unit));
      if (generation !== this.generation) return;
      this.bytes -= this.flight.reduce((sum, entry) => sum + entry.bytes, 0); this.entries -= slots; this.flight = [];
    } catch { if (generation === this.generation) this.pause('WRITE_UNCERTAIN'); }
  }
  close() { return this.closePromise ??= this.finishClose(); }
  private async finishClose() {
    this.closing = true;
    clearInterval(this.interval); const deadline = performance.now() + this.limits.drainMs;
    let stopDrain!: NodeJS.Timeout;
    const drain = (async () => {
      while (!this.stopped && !this.paused && (this.queue.length || this.flight.length || this.pending) && performance.now() < deadline) {
        await this.flush(); await new Promise(resolve => setTimeout(resolve, 5));
      }
      if (!this.stopped && !this.paused && !this.queue.length && !this.flight.length && !this.pending && performance.now() < deadline) {
        try { await this.rpc('close', undefined, Math.max(1, deadline - performance.now())); } catch { /* Siguiente apertura sanea. */ }
      }
    })();
    await Promise.race([drain, new Promise<void>(resolve => { stopDrain = setTimeout(resolve, this.limits.drainMs); })]); clearTimeout(stopDrain);
    this.stopped = true; this.generation++;
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(); this.pending = undefined; }
    this.queue = []; this.flight = []; this.bytes = 0; this.entries = 0;
    await this.worker?.terminate(); await this.exited; await this.recovering;
    await releaseOrphanWriter(this.options.file, this.token);
  }
}
