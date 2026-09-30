import { performance } from 'node:perf_hooks';
import type { Clock, Scheduler, TimePoint } from '../application/ports.js';

export class SystemClock implements Clock {
  private readonly origin = performance.now();
  private readonly unixOrigin = Date.now();

  now(): TimePoint {
    const monotonic = performance.now();
    return { monotonic, unix: this.unixOrigin + monotonic - this.origin };
  }
}

export class TimerScheduler implements Scheduler {
  schedule(delayMs: number, callback: () => void): () => void {
    const timer = setTimeout(callback, Math.ceil(Math.max(0, delayMs)));
    timer.unref();
    return () => clearTimeout(timer);
  }
}
