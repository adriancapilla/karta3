import { dayOf, type AggregateSink, type Cell, type Coverage, type EndReason, type Snapshot } from './contracts.js';
import { histogram, joinReason, type Category } from './catalog.js';

type Photo = { start?: Category; end?: Category; closed: boolean };
type Cycle = { phase: 'WAITING' | 'GAME' | 'ENDED'; day: string; deadline: number; started: number;
  humans: Map<string, Photo>; automatic: Set<string>; finalDeadline?: number };
const LIFE = 2 * 60 * 60_000;
function cell(day: string, family: Cell['family'], dimension: string, category: string, value = 1, measure = 'count'): Cell {
  return { day, family, dimension, category, measure, value };
}
const balance = (day: string, family: Cell['family'], category: string, value = 1) => cell(day, family, 'balance', category, value);
/** Correlación funcional transitoria. El puerto solo recibe unidades reducidas completas. */
export class StatisticsReducer {
  private readonly cycles = new Map<object, Cycle>();
  private readonly seen = new WeakSet<object>();
  private readonly packages = new Map<string, Set<string>>();
  private readonly invalidated = new Set<() => void>();
  constructor(private readonly sink: AggregateSink, private readonly maxCycles = 4096) {
    sink.onInvalidated(() => { this.cycles.clear(); this.packages.clear(); for (const listener of this.invalidated) listener(); });
  }
  onInvalidated(listener: () => void) { this.invalidated.add(listener); return () => { this.invalidated.delete(listener); }; }
  private admit(cells: Cell[], source: 'SERVER' | 'BROWSER' = 'SERVER', coverage: Coverage[] = [], causal = true) {
    let accepted = false;
    try { accepted = this.sink.admit({ cells: cells.filter(c => c.value !== 0), coverage }, source); } catch { /* Juego independiente. */ }
    if (!accepted && causal) { try { this.sink.pause('QUEUE_FULL'); } catch { this.cycles.clear(); } }
    return accepted;
  }
  home(unix: number) { return this.admit([cell(dayOf(unix), 'HOME', 'total', 'all')], 'BROWSER', [], false); }
  created(key: object, unix: number, monotonic: number, allowed: boolean) {
    if (this.seen.has(key)) return;
    this.seen.add(key); if (!allowed || !this.sink.available()) return;
    this.sweep(monotonic);
    if (this.cycles.size >= this.maxCycles) { this.sink.pause('CORRELATION_LIMIT'); return; }
    const day = dayOf(unix);
    if (this.admit([cell(day, 'CREATION', 'total', 'all'), balance(day, 'WAITING', 'created'), balance(day, 'WAITING', 'pending')]))
      this.cycles.set(key, { phase: 'WAITING', day, deadline: monotonic + LIFE, started: monotonic, humans: new Map(), automatic: new Set() });
  }
  join(unix: number, outcome: 'NEW_JOIN' | 'EXISTING_PARTICIPATION' | 'REJECTED', allowed: boolean, reason?: string) {
    if (!allowed || !this.sink.available()) return;
    const day = dayOf(unix); this.admit([cell(day, 'JOIN', 'outcome', outcome), ...(reason ? [cell(day, 'JOIN', 'reason', joinReason(reason))] : [])], 'SERVER', [], false);
  }
  closed(key: object, reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY', monotonic: number) {
    this.sweep(monotonic); const c = this.cycles.get(key); if (c?.phase !== 'WAITING') return;
    if (this.admit([balance(c.day, 'WAITING', 'pending', -1), balance(c.day, 'WAITING', 'closed'), cell(c.day, 'WAITING', 'reason', reason)])) this.cycles.delete(key);
  }
  started(key: object, snapshot: Snapshot, humans: readonly string[], unix: number, monotonic: number) {
    this.sweep(monotonic); const c = this.cycles.get(key); if (c?.phase !== 'WAITING') return false;
    const day = dayOf(unix); const packageCategory = `${snapshot.deckId}:${snapshot.deckSchemaVersion}:${snapshot.deckContentVersion}`;
    const packages = this.packages.get(day) ?? new Set<string>();
    for (const category of this.sink.packageCategories?.() ?? []) if (category.day === day) packages.add(category.category);
    const omit = !packages.has(packageCategory) && packages.size >= 64;
    const cells = [balance(c.day, 'WAITING', 'pending', -1), balance(c.day, 'WAITING', 'started'),
      balance(day, 'GAME', 'started'), balance(day, 'GAME', 'active'), balance(day, 'AUTOMATIC', 'base', humans.length),
      balance(day, 'AUTOMATIC', 'open', humans.length), balance(day, 'APPEARANCE', 'population', humans.length), balance(day, 'APPEARANCE', 'pending', humans.length),
      ...histogram(snapshot).filter(([d]) => d !== 'package' || !omit).map(([d, v]) => cell(day, 'CONFIGURATION', d, v))];
    if (!this.admit(cells, 'SERVER', omit ? [{ day, family: 'CONFIGURATION', cause: 'DIMENSION_LIMIT' }] : [])) return false;
    packages.add(packageCategory); this.packages.set(day, packages);
    for (const d of this.packages.keys()) if (d < day) this.packages.delete(d);
    this.cycles.set(key, { phase: 'GAME', day, started: monotonic, deadline: monotonic + LIFE, automatic: new Set(),
      humans: new Map(humans.map(id => [id, { closed: false }])) }); return true;
  }
  automatic(key: object, human: string, monotonic: number) {
    this.sweep(monotonic); const c = this.cycles.get(key);
    if (c?.phase === 'GAME' && c.humans.has(human) && !c.automatic.has(human)
      && this.admit([balance(c.day, 'AUTOMATIC', 'became')])) c.automatic.add(human);
  }
  ended(key: object, reason: EndReason, unix: number, monotonic: number) {
    this.sweep(monotonic); const c = this.cycles.get(key); if (c?.phase !== 'GAME') return false;
    const seconds = Math.max(0, Math.floor((monotonic - c.started) / 1000));
    const bin = [60, 180, 300, 600, 1200, 2400].filter(limit => seconds >= limit).length;
    const endDay = dayOf(unix);
    if (!this.admit([balance(c.day, 'GAME', 'active', -1), balance(c.day, 'GAME', reason), balance(c.day, 'AUTOMATIC', 'open', -c.humans.size), balance(c.day, 'AUTOMATIC', 'closed', c.humans.size),
      cell(endDay, 'DURATION', 'total', 'all'), cell(endDay, 'DURATION', 'total', 'all', seconds, 'seconds'),
      cell(endDay, 'DURATION', 'reason', reason), cell(endDay, 'DURATION', 'reason', reason, seconds, 'seconds'), cell(endDay, 'DURATION', 'bin', String(bin))])) return false;
    c.phase = 'ENDED'; c.finalDeadline = monotonic + 10_000;
    if (reason === 'TECHNICAL_INTERRUPTION') for (const human of c.humans.keys()) this.photoCut(key, human, 'unknown');
    return true;
  }
  photo(key: object, human: string, moment: 'START' | 'END', category: Category, monotonic: number) {
    this.sweep(monotonic); const c = this.cycles.get(key); const p = c?.humans.get(human);
    if (!c || !p || p.closed || p[moment === 'START' ? 'start' : 'end'] || moment === 'START' && c.phase !== 'GAME' || moment === 'END' && c.phase !== 'ENDED') return false;
    const cells = [cell(c.day, 'APPEARANCE', moment.toLowerCase(), category)];
    if (moment === 'END') cells.push(balance(c.day, 'APPEARANCE', 'pending', -1), ...(p.start ? [cell(c.day, 'APPEARANCE', 'pair', `${p.start}:${category}`)] : []));
    if (!this.admit(cells, 'BROWSER', [], false)) return false;
    if (moment === 'START') p.start = category;
    else { p.end = category; p.closed = true; delete p.start; }
    return true;
  }
  photoCut(key: object, human: string, cause: 'unknown' | 'cut' | 'absent' = 'cut') {
    const c = this.cycles.get(key); const p = c?.humans.get(human); if (!c || !p || p.closed) return;
    if (this.admit([balance(c.day, 'APPEARANCE', 'pending', -1), balance(c.day, 'APPEARANCE', cause)])) { p.closed = true; delete p.start; }
  }
  cut(key: object, cause: 'cut' | 'unknown' = 'cut') {
    const c = this.cycles.get(key); if (!c) return;
    const cells: Cell[] = [];
    if (c.phase === 'WAITING') cells.push(balance(c.day, 'WAITING', 'pending', -1), balance(c.day, 'WAITING', cause));
    if (c.phase === 'GAME') cells.push(balance(c.day, 'GAME', 'active', -1), balance(c.day, 'GAME', cause),
      balance(c.day, 'AUTOMATIC', 'open', -c.humans.size), balance(c.day, 'AUTOMATIC', cause, c.humans.size));
    const pending = [...c.humans.values()].filter(p => !p.closed).length;
    if (pending) cells.push(balance(c.day, 'APPEARANCE', 'pending', -pending), balance(c.day, 'APPEARANCE', cause, pending));
    if (cells.length) this.admit(cells, 'SERVER', cause === 'unknown' ? [{ day: c.day, family: c.phase === 'WAITING' ? 'WAITING' : 'GAME', cause: 'CORRELATION_LIMIT' }] : []);
    this.cycles.delete(key);
  }
  observable(key: object) { return this.cycles.has(key); }
  nextDeadline() { return Math.min(...[...this.cycles.values()].map(c => c.phase === 'ENDED' ? Math.min(c.deadline, c.finalDeadline!) : c.deadline)); }
  sweep(monotonic: number) {
    for (const [key, c] of this.cycles) {
      if (monotonic >= c.deadline) this.cut(key, 'unknown');
      else if (c.phase === 'ENDED' && monotonic >= c.finalDeadline!) {
        for (const human of c.humans.keys()) this.photoCut(key, human, 'absent'); this.cycles.delete(key);
      }
    }
  }
}
