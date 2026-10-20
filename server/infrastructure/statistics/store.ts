import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { MODEL, SCHEMA, StatisticsError, dayOf, families, retentionDay, type AggregateData, type Cell, type Coverage, type Delta, type Environment, type Traffic, type qualityCauses } from '../../application/statistics/contracts.js';
import { ends, validDelta } from '../../application/statistics/catalog.js';
import { hasLiveWriter, pruneExports } from './privateFiles.js';

export type StoreOptions = { file: string; environment: Environment; traffic: Traffic; now: number; initialize?: boolean; restored?: boolean; recoveryCause?: typeof qualityCauses[number] };
/** Único esquema nuevo. No busca, abre o convierte ningún almacén anterior. */
export class AggregateStore {
  readonly db: DatabaseSync;
  constructor(readonly options: StoreOptions) {
    const exists = fs.existsSync(options.file);
    if (!exists && !options.initialize) throw new StatisticsError('STORAGE_UNAVAILABLE');
    if (!exists) { const descriptor = fs.openSync(options.file, 'wx', 0o600); fs.closeSync(descriptor); }
    if (exists) {
      const stat = fs.lstatSync(options.file);
      if (!stat.isFile() || stat.isSymbolicLink() || process.platform !== 'win32' && (stat.uid !== process.geteuid?.() || (stat.mode & 0o077) !== 0)) throw new StatisticsError('NOT_AUTHORIZED');
    }
    this.db = new DatabaseSync(options.file, { timeout: 5000 });
    try {
      if (!exists) {
        fs.chmodSync(options.file, 0o600);
        this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA wal_autocheckpoint=512;
          CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
          CREATE TABLE cells(day TEXT NOT NULL,family TEXT NOT NULL,dimension TEXT NOT NULL,category TEXT NOT NULL,measure TEXT NOT NULL,value INTEGER NOT NULL CHECK(value>=0 AND value<=9007199254740991),PRIMARY KEY(day,family,dimension,category,measure)) STRICT;
          CREATE TABLE coverage_days(day TEXT NOT NULL,family TEXT NOT NULL,cause TEXT NOT NULL,PRIMARY KEY(day,family,cause)) STRICT;`);
        const values = { model: MODEL, schema: String(SCHEMA), environment: options.environment, traffic: options.traffic,
          frontier: dayOf(options.now), instrumentedFrom: dayOf(options.now), clean: 'false', lastMaintenance: dayOf(options.now), restored: String(options.restored ?? false), bins: '60,180,300,600,1200,2400', dimensions: '1' };
        this.transaction(() => { for (const [k, v] of Object.entries(values)) this.db.prepare('INSERT INTO metadata VALUES(?,?)').run(k, v); });
      }
      validateMetadata(this.db, options.environment, options.traffic);
      this.db.exec('PRAGMA synchronous=FULL; PRAGMA wal_autocheckpoint=512; PRAGMA max_page_count=131072;');
      if (exists) this.sanitize(options.now, options.restored ? 'RESTORED' : options.recoveryCause ?? 'RESTART');
      else for (const family of families) this.db.prepare('INSERT INTO coverage_days VALUES(?,?,?)').run(dayOf(options.now), family, 'PARTIAL_DAY');
      this.maintain(options.now);
      const space = fs.statfsSync(path.dirname(options.file));
      if (space.bavail * space.bsize < 128 * 1024 ** 2 || fs.statSync(options.file).size >= 512 * 1024 ** 2) throw new StatisticsError('STORAGE_UNAVAILABLE');
    } catch (error) { this.db.close(); throw error; }
  }
  transaction(action: () => void) {
    this.db.exec('BEGIN IMMEDIATE');
    try { action(); this.db.exec('COMMIT'); } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  append(units: readonly Delta[], now: number) {
    if (!units.length || units.length > 64 || !units.every(validDelta)) throw new StatisticsError('INVALID_FILTER');
    const disk = fs.statfsSync(path.dirname(this.options.file));
    const sizes = ['', '-wal', '-shm'].reduce((n, suffix) => n + (fs.existsSync(this.options.file + suffix) ? fs.statSync(this.options.file + suffix).size : 0), 0);
    const database = fs.statSync(this.options.file).size;
    const wal = fs.existsSync(this.options.file + '-wal') ? fs.statSync(this.options.file + '-wal').size : 0;
    const nextWrite = 64 * 1024 + Buffer.byteLength(JSON.stringify(units)) * 16;
    if (disk.bavail * disk.bsize - nextWrite < 128 * 1024 ** 2 || database + nextWrite >= 512 * 1024 ** 2 || sizes + nextWrite >= 576 * 1024 ** 2 || wal + nextWrite >= 64 * 1024 ** 2)
      throw new StatisticsError('STORAGE_UNAVAILABLE');
    this.transaction(() => {
      // Sumar primero: no depende del orden de deltas dentro de una unidad/lote.
      const totals = new Map<string, Cell>();
      for (const c of units.flatMap(u => [...u.cells])) {
        const key = JSON.stringify([c.day, c.family, c.dimension, c.category, c.measure]); const old = totals.get(key);
        const value = (old?.value ?? 0) + c.value;
        if (!Number.isSafeInteger(value)) throw new StatisticsError('INVALID_FILTER');
        totals.set(key, { ...c, value });
      }
      for (const c of totals.values()) {
        const keys = [c.day, c.family, c.dimension, c.category, c.measure];
        const old = this.db.prepare('SELECT value FROM cells WHERE day=? AND family=? AND dimension=? AND category=? AND measure=?').get(...keys) as { value: number } | undefined;
        const value = (old?.value ?? 0) + c.value;
        if (!Number.isSafeInteger(value) || value < 0) throw new StatisticsError('STORAGE_UNAVAILABLE');
        this.db.prepare('INSERT INTO cells VALUES(?,?,?,?,?,?) ON CONFLICT(day,family,dimension,category,measure) DO UPDATE SET value=excluded.value').run(...keys, value);
      }
      for (const c of units.flatMap(u => [...u.coverage])) this.db.prepare('INSERT OR IGNORE INTO coverage_days VALUES(?,?,?)').run(c.day, c.family, c.cause);
      this.assertBalances([...new Set(units.flatMap(u => u.cells.map(c => c.day)))]);
      this.set('frontier', dayOf(now)); this.set('clean', 'false');
    });
    return database >= 512 * 1024 ** 2 * .8 || wal >= 64 * 1024 ** 2 * .8;
  }
  private set(k: string, v: string) { this.db.prepare('UPDATE metadata SET value=? WHERE key=?').run(v, k); }
  private assertBalances(affected?: readonly string[]) {
    const days = affected ? affected.map(day => ({ day })) : this.db.prepare('SELECT DISTINCT day FROM cells').all();
    for (const { day } of days) {
      const rows = this.db.prepare("SELECT family,category,value FROM cells WHERE day=? AND dimension='balance'").all(day!);
      const n = (f: string, c: string) => Number(rows.find(row => row.family === f && row.category === c)?.value ?? 0);
      const countEnd = this.db.prepare("SELECT COALESCE(SUM(value),0) AS n FROM cells WHERE day=? AND family='APPEARANCE' AND dimension='end'").get(day!)!;
      if (n('WAITING', 'created') !== ['started', 'closed', 'pending', 'unknown', 'cut'].reduce((s, c) => s + n('WAITING', c), 0)
        || n('GAME', 'started') !== [...ends, 'active', 'unknown', 'cut'].reduce((s, c) => s + n('GAME', c), 0)
        || n('AUTOMATIC', 'base') !== ['open', 'closed', 'unknown', 'cut'].reduce((s, c) => s + n('AUTOMATIC', c), 0)
        || n('AUTOMATIC', 'became') > n('AUTOMATIC', 'base')
        || n('APPEARANCE', 'population') !== Number(countEnd.n) + ['pending', 'unknown', 'cut', 'absent'].reduce((s, c) => s + n('APPEARANCE', c), 0))
        throw new StatisticsError('STORAGE_UNAVAILABLE');
    }
  }
  sanitize(now: number, cause: typeof qualityCauses[number]) {
    this.transaction(() => {
      const opened = this.db.prepare("SELECT * FROM cells WHERE dimension='balance' AND value>0 AND ((family='WAITING' AND category='pending') OR (family='GAME' AND category='active') OR (family='AUTOMATIC' AND category='open') OR (family='APPEARANCE' AND category='pending'))").all() as Cell[];
      for (const c of opened) {
        this.db.prepare("INSERT INTO cells VALUES(?,?,'balance','unknown','count',?) ON CONFLICT(day,family,dimension,category,measure) DO UPDATE SET value=value+excluded.value").run(c.day, c.family, c.value);
        this.db.prepare('UPDATE cells SET value=0 WHERE day=? AND family=? AND dimension=? AND category=? AND measure=?').run(c.day, c.family, c.dimension, c.category, c.measure);
        this.db.prepare('INSERT OR IGNORE INTO coverage_days VALUES(?,?,?)').run(c.day, c.family, cause);
      }
      const prior = String(this.db.prepare("SELECT value FROM metadata WHERE key='frontier'").get()!.value);
      const clean = this.db.prepare("SELECT value FROM metadata WHERE key='clean'").get()!.value === 'true';
      const first = prior < retentionDay(now) ? retentionDay(now) : prior;
      for (let t = Date.parse(`${first}T00:00:00Z`); (!clean || opened.length > 0 || cause !== 'RESTART') && t <= now; t += 86_400_000) for (const family of families)
        this.db.prepare('INSERT OR IGNORE INTO coverage_days VALUES(?,?,?)').run(dayOf(t), family, cause);
      this.set('frontier', dayOf(now)); this.set('clean', 'false');
      this.assertBalances();
    });
  }
  maintain(now: number) {
    this.transaction(() => { const cutoff = retentionDay(now);
      this.db.prepare('DELETE FROM cells WHERE day<?').run(cutoff); this.db.prepare('DELETE FROM coverage_days WHERE day<?').run(cutoff);
      this.set('lastMaintenance', dayOf(now));
    });
    this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    pruneExports(path.dirname(this.options.file), now);
  }
  close(clean = false) { if (clean) this.set('clean', 'true'); this.db.close(); }
}
export function validateMetadata(db: DatabaseSync, environment: Environment, traffic: Traffic) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(row => row.name);
  if (JSON.stringify(tables) !== JSON.stringify(['cells', 'coverage_days', 'metadata'])) throw new StatisticsError('STORAGE_UNAVAILABLE');
  for (const [table, columns] of Object.entries({ cells: ['day', 'family', 'dimension', 'category', 'measure', 'value'], coverage_days: ['day', 'family', 'cause'], metadata: ['key', 'value'] })) {
    if (JSON.stringify(db.prepare(`PRAGMA table_info(${table})`).all().map(r => r.name)) !== JSON.stringify(columns)) throw new StatisticsError('STORAGE_UNAVAILABLE');
  }
  const metadata = Object.fromEntries(db.prepare('SELECT key,value FROM metadata').all().map(row => [row.key, row.value]));
  if (Object.keys(metadata).sort().join(',') !== 'bins,clean,dimensions,environment,frontier,instrumentedFrom,lastMaintenance,model,restored,schema,traffic') throw new StatisticsError('STORAGE_UNAVAILABLE');
  if (metadata.model !== MODEL || metadata.schema !== String(SCHEMA) || metadata.environment !== environment || metadata.traffic !== traffic)
    throw new StatisticsError('ENVIRONMENT_MISMATCH');
  if (metadata.bins !== '60,180,300,600,1200,2400' || metadata.dimensions !== '1' || !['true', 'false'].includes(String(metadata.clean)) || !['true', 'false'].includes(String(metadata.restored))
    || ['frontier', 'instrumentedFrom', 'lastMaintenance'].some(k => !/^\d{4}-\d{2}-\d{2}$/.test(String(metadata[k])) || !Number.isFinite(Date.parse(String(metadata[k]) + 'T00:00:00Z')))) throw new StatisticsError('STORAGE_UNAVAILABLE');
  return metadata;
}
export function readAggregates(file: string, environment: Environment, traffic: Traffic, from: string, to: string, now: number): AggregateData {
  if (!fs.existsSync(file)) throw new StatisticsError('STORAGE_UNAVAILABLE');
  const db = new DatabaseSync(file, { readOnly: true, timeout: 5000 });
  try {
    db.exec('PRAGMA query_only=ON; BEGIN');
    const m = validateMetadata(db, environment, traffic);
    if (!hasLiveWriter(file) && (m.clean !== 'true' || db.prepare("SELECT 1 FROM cells WHERE dimension='balance' AND value>0 AND ((family='WAITING' AND category='pending') OR (family='GAME' AND category='active') OR (family='AUTOMATIC' AND category='open') OR (family='APPEARANCE' AND category='pending')) LIMIT 1").get()))
      throw new StatisticsError('STORAGE_UNAVAILABLE');
    if (m.lastMaintenance !== dayOf(now)) throw new StatisticsError('STORAGE_UNAVAILABLE');
    const cells = db.prepare('SELECT * FROM cells WHERE day>=? AND day<? ORDER BY day,family,dimension,category,measure').all(from, to) as Cell[];
    const coverage = db.prepare('SELECT * FROM coverage_days WHERE day>=? AND day<? ORDER BY day,family,cause').all(from, to) as Coverage[];
    return { model: MODEL, schema: 1, environment, traffic, cells, coverage, asOf: new Date(now).toISOString(), frontier: String(m.frontier),
      instrumentedFrom: String(m.instrumentedFrom), restored: m.restored === 'true' };
  } finally { db.close(); }
}
