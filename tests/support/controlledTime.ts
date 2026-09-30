import type { Clock, Scheduler, TimePoint } from '../../server/application/ports.js';

export class ControlledTime implements Clock, Scheduler {
  private instant = 0;
  readonly unixOrigin = 1_800_000_000_000;
  readonly tasks: { at: number; callback: () => void; cancelled: boolean; fired: boolean }[] = [];

  now(): TimePoint { return { monotonic: this.instant, unix: this.unixOrigin + this.instant }; }
  schedule(delayMs: number, callback: () => void): () => void {
    const task = { at: this.instant + Math.max(0, delayMs), callback, cancelled: false, fired: false };
    this.tasks.push(task);
    return () => { task.cancelled = true; };
  }
  get pending(): number { return this.tasks.filter((task) => !task.cancelled && !task.fired).length; }
  elapse(ms: number): void { this.instant += ms; }
  advance(ms: number): void {
    const target = this.instant + ms;
    for (;;) {
      const task = this.tasks.filter((item) => !item.cancelled && !item.fired && item.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!task) break;
      this.instant = Math.max(this.instant, task.at);
      task.fired = true;
      task.callback();
    }
    this.instant = target;
  }
}
