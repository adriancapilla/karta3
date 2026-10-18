import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { UsageError, type Aggregate, type UsageEnvironment, type UsageEvent, type UsageFilter, type UsageQuality, type UsageReport } from '../../application/usage/contracts.js';
import { mergeAggregates, usageReport, validateUsageFilter } from '../../application/usage/reports.js';
import { contributions, logicalKey, type Contribution, type Subject } from './projections.js';
import { validUsageEvent } from './eventValidation.js';

export const DETAIL_MS = 90 * 86_400_000;
export const month = (at: number) => new Date(at).toISOString().slice(0, 7);
export const firstMonth = (at: number, offset = 0) => { const d = new Date(at); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1); };
type Metadata = { environment: UsageEnvironment; version: 1; coverageFrom: number; bootRef: string | null; clean: boolean;
  possibleLoss: boolean; conflicts: number; unlinked: number; lastDurableAt: number | null; lastMaintenanceAt: number | null; restoredAggregatesOnly: boolean };

/** Uso exclusivo en worker (o prueba aislada). Nunca en la ruta síncrona de juego. */
export class SqliteUsageStore {
  readonly db: DatabaseSync;
  private metadata: Metadata;
  constructor(readonly file: string, readonly environment: UsageEnvironment, now: number, bootRef?: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file, { timeout: 100 });
    try {
      this.db.exec('CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL) STRICT');
      const existing = this.db.prepare('SELECT value FROM metadata WHERE id=1').get();
      this.metadata = existing ? JSON.parse(String(existing.value)) as Metadata : { environment, version: 1, coverageFrom: now, bootRef: null,
        clean: true, possibleLoss: false, conflicts: 0, unlinked: 0, lastDurableAt: null, lastMaintenanceAt: null, restoredAggregatesOnly: false };
      if (this.metadata.environment !== environment) throw new UsageError('ENVIRONMENT_MISMATCH');
      if (this.metadata.version !== 1) throw new UsageError('STORAGE_UNAVAILABLE');
      this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;
        PRAGMA journal_size_limit=67108864; PRAGMA max_page_count=131072;
        CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, logical TEXT UNIQUE NOT NULL, at INTEGER NOT NULL, signature TEXT NOT NULL, payload TEXT NOT NULL) STRICT;
        CREATE INDEX IF NOT EXISTS events_age ON events(at);
        CREATE TABLE IF NOT EXISTS subjects (key TEXT PRIMARY KEY, at INTEGER NOT NULL, payload TEXT NOT NULL) STRICT;
        CREATE INDEX IF NOT EXISTS subjects_age ON subjects(at);
        CREATE TABLE IF NOT EXISTS monthly (month TEXT NOT NULL, traffic TEXT NOT NULL, report TEXT NOT NULL, dimension TEXT NOT NULL,
          metric TEXT NOT NULL, count INTEGER NOT NULL, sum REAL NOT NULL, min REAL, max REAL,
          PRIMARY KEY(month,traffic,report,dimension,metric)) STRICT;`);
      if (bootRef) {
        this.transaction(() => {
          if (this.metadata.bootRef && this.metadata.bootRef !== bootRef) {
            for (const subject of this.subjects()) {
              if (subject.kind === 'room' && subject.state === 'WAITING') { subject.state = 'WAITING_LOST_ON_RESTART'; this.put(subject); }
              if (subject.kind === 'game' && subject.state === 'ACTIVE') { subject.state = 'UNRESOLVED_AFTER_RESTART'; this.put(subject); }
            }
            if (!this.metadata.clean) this.metadata.possibleLoss = true;
          }
          this.metadata.bootRef = bootRef; this.metadata.clean = false; this.saveMetadata();
        });
      } else this.saveMetadata();
      this.maintain(now); this.permissions();
    } catch (error) { this.db.close(); throw error; }
  }
  private permissions() {
    for (const file of [this.file, `${this.file}-wal`, `${this.file}-shm`]) if (fs.existsSync(file)) fs.chmodSync(file, 0o600);
  }
  private saveMetadata() { this.db.prepare('INSERT OR REPLACE INTO metadata VALUES (1,?)').run(JSON.stringify(this.metadata)); }
  private transaction(action: () => void) {
    const before = structuredClone(this.metadata);
    this.db.exec('BEGIN IMMEDIATE');
    try { action(); this.db.exec('COMMIT'); }
    catch (error) { this.db.exec('ROLLBACK'); this.metadata = before; throw error; }
  }
  private subjects(): Subject[] { return this.db.prepare('SELECT payload FROM subjects ORDER BY at,key').all().map((row) => JSON.parse(String(row.payload)) as Subject); }
  private get(key: string): Subject | undefined { const row = this.db.prepare('SELECT payload FROM subjects WHERE key=?').get(key); return row ? JSON.parse(String(row.payload)) as Subject : undefined; }
  private put(subject: Subject) { this.db.prepare('INSERT OR REPLACE INTO subjects VALUES (?,?,?)').run(subject.key, subject.at, JSON.stringify(subject)); }
  noteLoss() { this.metadata.possibleLoss = true; this.saveMetadata(); }

  append(events: readonly UsageEvent[], failBeforeCommit?: () => void): void {
    this.transaction(() => {
      for (const event of events) {
        if (!validUsageEvent(event) || event.environment !== this.environment) throw new UsageError('INVALID_FILTER');
        const logical = logicalKey(event); const signature = JSON.stringify([event.source, event.name, event.traffic,
          event.source === 'BROWSER' ? event.visitId : null, event.data]);
        const previous = this.db.prepare('SELECT signature FROM events WHERE id=? OR logical=?').all(event.eventId, logical);
        if (previous.length) { if (previous.some((row) => row.signature !== signature)) this.metadata.conflicts++; continue; }
        if (event.occurredAt <= (this.metadata.lastMaintenanceAt ?? 0) - DETAIL_MS) { this.metadata.unlinked++; continue; }
        this.db.prepare('INSERT INTO events VALUES (?,?,?,?,?)').run(event.eventId, logical, event.occurredAt, signature, JSON.stringify(event));
        this.project(event); this.metadata.lastDurableAt = event.receivedAt;
      }
      this.saveMetadata(); failBeforeCommit?.();
    });
    this.permissions();
  }
  private project(e: UsageEvent) {
    const base = { at: e.occurredAt, traffic: e.traffic, boot: e.bootRef };
    const update = (key: string, change: (s: Subject) => void) => { const s = this.get(key); if (s) { change(s); this.put(s); } else this.metadata.unlinked++; };
    const correlation = (d: { visitId?: string; intentId?: string }, kind: string) => d.visitId && d.intentId ? `${kind}:${d.visitId}:${d.intentId}` : undefined;
    switch (e.name) {
      case 'home_viewed': this.put({ ...base, key: logicalKey(e), kind: 'view' }); break;
      case 'room_create_intended': case 'room_join_attempted': {
        const kind = e.name === 'room_create_intended' ? 'create-intent' : 'join-intent';
        const key = correlation({ visitId: e.visitId, intentId: e.data.intentId }, kind)!;
        // Recibir la intención después del resultado también correlaciona sin inventar visitas.
        const matched = this.db.prepare('SELECT payload FROM events WHERE json_extract(payload,\'$.data.visitId\')=? AND json_extract(payload,\'$.data.intentId\')=? AND json_extract(payload,\'$.source\')=\'SERVER\'').all(e.visitId, e.data.intentId).some((row) => {
          const event = JSON.parse(String(row.payload)) as UsageEvent;
          return kind === 'create-intent' ? event.name === 'room_created' : event.name === 'room_join_resolved';
        });
        this.put({ ...base, key, kind, matched });
        if (matched) {
          for (const row of this.db.prepare('SELECT payload FROM events WHERE json_extract(payload,\'$.data.visitId\')=? AND json_extract(payload,\'$.data.intentId\')=? AND json_extract(payload,\'$.source\')=\'SERVER\'').all(e.visitId, e.data.intentId)) {
            const event = JSON.parse(String(row.payload)) as UsageEvent;
            const linked = event.name === 'room_created' && kind === 'create-intent' ? this.get(`room:${event.data.roomRef}`)
              : event.name === 'room_join_resolved' && kind === 'join-intent' ? this.get(logicalKey(event)) : undefined;
            if (linked && (linked.kind === 'room' || linked.kind === 'join')) { linked.linked = true; this.put(linked); }
          }
        }
        break;
      }
      case 'room_created': {
        const key = correlation(e.data, 'create-intent'); const intent = key ? this.get(key) : undefined;
        if (intent?.kind === 'create-intent') { intent.matched = true; this.put(intent); }
        this.put({ ...base, key: `room:${e.data.roomRef}`, kind: 'room', state: 'WAITING', linked: !!intent }); break;
      }
      case 'room_join_resolved': {
        const key = correlation(e.data, 'join-intent'); const intent = key ? this.get(key) : undefined;
        if (intent?.kind === 'join-intent') { intent.matched = true; this.put(intent); }
        this.put({ ...base, key: logicalKey(e), kind: 'join', outcome: e.data.outcome, reason: e.data.reason, linked: !!intent }); break;
      }
      case 'room_waiting_closed': update(`room:${e.data.roomRef}`, (s) => { if (s.kind === 'room') s.state = e.data.reason; }); break;
      case 'game_started':
        update(`room:${e.data.roomRef}`, (s) => { if (s.kind === 'room') s.state = 'STARTED'; });
        this.put({ ...base, key: `game:${e.data.gameRef}`, kind: 'game', state: 'ACTIVE', configuration: e.data.configuration,
          people: e.data.humanParticipations.map((p) => p.participationRef), automatic: [] }); break;
      case 'human_became_automatic': update(`game:${e.data.gameRef}`, (s) => {
        if (s.kind === 'game' && s.people.includes(e.data.participationRef) && !s.automatic.includes(e.data.participationRef)) s.automatic.push(e.data.participationRef);
        else this.metadata.unlinked++;
      }); break;
      case 'game_ended':
        update(`game:${e.data.gameRef}`, (s) => { if (s.kind === 'game') s.state = e.data.reason; });
        this.put({ ...base, key: `end:${e.data.gameRef}`, kind: 'end', reason: e.data.reason, duration: e.data.durationMs }); break;
    }
  }
  private consolidate(row: Contribution) {
    this.db.prepare(`INSERT INTO monthly VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(month,traffic,report,dimension,metric)
      DO UPDATE SET count=count+excluded.count,sum=sum+excluded.sum,min=CASE WHEN min IS NULL THEN excluded.min WHEN excluded.min IS NULL THEN min ELSE min(min,excluded.min) END,
      max=CASE WHEN max IS NULL THEN excluded.max WHEN excluded.max IS NULL THEN max ELSE max(max,excluded.max) END`)
      .run(month(row.at), row.traffic, row.report, row.dimension, row.metric, row.count, row.sum, row.min, row.max);
  }
  maintain(at: number) {
    this.transaction(() => {
      for (const subject of this.subjects()) if (subject.at <= at - DETAIL_MS) {
        if (subject.kind === 'room' && subject.state === 'WAITING') subject.state = 'WAITING_CENSORED';
        if (subject.kind === 'game' && subject.state === 'ACTIVE') subject.state = 'ACTIVE_CENSORED';
        for (const row of contributions(subject)) this.consolidate(row);
        this.db.prepare('DELETE FROM subjects WHERE key=?').run(subject.key);
      }
      this.db.prepare('DELETE FROM events WHERE at<=?').run(at - DETAIL_MS);
      this.db.prepare('DELETE FROM monthly WHERE month<?').run(month(firstMonth(at, -11)));
      this.metadata.lastMaintenanceAt = at; this.saveMetadata();
    });
    this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); this.permissions();
  }
  nextExpiry(now: number) {
    const first = this.db.prepare('SELECT min(at) AS at FROM (SELECT at FROM events UNION ALL SELECT at FROM subjects)').get();
    return Math.min(now + 86_400_000, first?.at === null ? Infinity : Number(first?.at) + DETAIL_MS);
  }
  read(filter: UsageFilter, now: number, traffic: 'HUMAN' | 'SYNTHETIC' = 'HUMAN'): UsageReport {
    validateUsageFilter(filter, this.environment); this.maintain(now);
    const earliest = Math.max(this.metadata.coverageFrom, firstMonth(now, -11));
    if (filter.from < earliest || filter.to > now) throw new UsageError('INSUFFICIENT_DETAIL');
    const cut = now - DETAIL_MS;
    if ((filter.from <= cut || this.metadata.restoredAggregatesOnly) && (filter.from !== firstMonth(filter.from)
      || filter.to < firstMonth(cut, 1) && filter.to !== firstMonth(filter.to))) throw new UsageError('INSUFFICIENT_DETAIL');
    const detailed = this.subjects().filter((s) => s.at >= filter.from && s.at < filter.to && s.traffic === traffic).flatMap(contributions);
    const monthly = this.db.prepare('SELECT report,dimension,metric,count,sum,min,max FROM monthly WHERE month>=? AND month<? AND traffic=?')
      .all(month(firstMonth(filter.from, filter.from === firstMonth(filter.from) ? 0 : 1)), month(firstMonth(filter.to)), traffic) as unknown as Aggregate[];
    const quality: UsageQuality = { coverageFrom: earliest, asOf: now, possibleLoss: this.metadata.possibleLoss, conflicts: this.metadata.conflicts,
      unlinked: this.metadata.unlinked, lastDurableAt: this.metadata.lastDurableAt, lastMaintenanceAt: this.metadata.lastMaintenanceAt, restoredAggregatesOnly: this.metadata.restoredAggregatesOnly };
    return usageReport(filter, quality, [...detailed, ...monthly]);
  }
  aggregateSnapshot(now: number) {
    this.maintain(now);
    const rows = this.db.prepare('SELECT * FROM monthly').all() as unknown as (Aggregate & { month: string; traffic: string })[];
    const detailed = this.subjects().flatMap(contributions).map((row) => ({ ...row, month: month(row.at) }));
    const buckets = new Map<string, (Aggregate & { month: string; traffic: string })[]>();
    for (const row of [...rows, ...detailed]) { const key = JSON.stringify([row.month, row.traffic]); const bucket = buckets.get(key) ?? []; bucket.push(row); buckets.set(key, bucket); }
    return { metadata: { ...this.metadata, restoredAggregatesOnly: true, bootRef: null, clean: true }, rows: [...buckets].flatMap(([key, bucket]) => {
      const [month, traffic] = JSON.parse(key) as [string, string]; return mergeAggregates(bucket).map((row) => ({ ...row, month, traffic }));
    }) };
  }
  close(clean = false) { if (clean) { this.metadata.clean = true; this.saveMetadata(); } this.db.close(); }
}
