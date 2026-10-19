import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { UsageError, type Aggregate, type UsageEnvironment, type UsageEvent, type UsageFilter, type UsageReport, type UsageTraffic, type UsageHealth, type UsagePrivacyControl } from '../../application/usage/contracts.js';
import { mergeAggregates } from '../../application/usage/reports.js';
import { contributions, logicalKey, type Contribution, type Subject } from '../../application/usage/projections.js';
import { canonicalUsage, validUsageEvent, validUsageHealth, validPrivacyControl } from './eventValidation.js';
import { DETAIL_MS, month, firstMonth, type Metadata } from './schema.js';
import { readSqliteUsage } from './sqliteReader.js';
export { DETAIL_MS, month, firstMonth } from './schema.js';

/** Uso exclusivo en worker (o prueba aislada). Nunca en la ruta síncrona de juego. */
export class SqliteUsageStore {
  readonly db: DatabaseSync;
  private metadata: Metadata;
  constructor(readonly file: string, readonly environment: UsageEnvironment, now: number, bootRef?: string, readonly traffic: UsageTraffic = 'SYNTHETIC', collecting = true, consentRequired = false) {
    const existed = fs.existsSync(file);
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file, { timeout: 100 });
    try {
      this.db.exec('CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL) STRICT');
      const existing = this.db.prepare('SELECT value FROM metadata WHERE id=1').get();
      if (existed && !existing) throw new UsageError('STORAGE_UNAVAILABLE');
      this.metadata = existing ? JSON.parse(String(existing.value)) as Metadata : { environment, traffic, version: 1, coverageFrom: now, bootRef: null,
        clean: true, possibleLoss: false, conflicts: 0, unlinked: 0, lastDurableAt: null, lastMaintenanceAt: null, restoredAggregatesOnly: false, lastBackupAt: null, collectionEnabled: collecting };
      if (this.metadata.environment !== environment || this.metadata.traffic !== traffic) throw new UsageError('ENVIRONMENT_MISMATCH');
      if (![1, 2].includes(this.metadata.version)) throw new UsageError('STORAGE_UNAVAILABLE');
      if (collecting && bootRef && this.metadata.restoredAggregatesOnly) throw new UsageError('STORAGE_UNAVAILABLE');
      this.metadata.collectionEnabled = collecting && !this.metadata.restoredAggregatesOnly;
      if (consentRequired) this.metadata.consentRequired = true;
      this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;
        PRAGMA journal_size_limit=67108864; PRAGMA max_page_count=131072;
        CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, logical TEXT UNIQUE NOT NULL, at INTEGER NOT NULL, signature TEXT NOT NULL, payload TEXT NOT NULL) STRICT;
        CREATE INDEX IF NOT EXISTS events_age ON events(at);
        CREATE TABLE IF NOT EXISTS subjects (key TEXT PRIMARY KEY, at INTEGER NOT NULL, payload TEXT NOT NULL) STRICT;
        CREATE INDEX IF NOT EXISTS subjects_age ON subjects(at);
        CREATE TABLE IF NOT EXISTS monthly (month TEXT NOT NULL, traffic TEXT NOT NULL, report TEXT NOT NULL, dimension TEXT NOT NULL,
          metric TEXT NOT NULL, count INTEGER NOT NULL, sum REAL NOT NULL, min REAL, max REAL,
          PRIMARY KEY(month,traffic,report,dimension,metric)) STRICT;
        CREATE TABLE IF NOT EXISTS quality (month TEXT NOT NULL, kind TEXT NOT NULL, count INTEGER NOT NULL, firstAt INTEGER NOT NULL, lastAt INTEGER NOT NULL,
          PRIMARY KEY(month,kind)) STRICT;
        CREATE TABLE IF NOT EXISTS usage_choice_proofs (proof_ref TEXT PRIMARY KEY, notice_version TEXT NOT NULL,
          accepted_at INTEGER NOT NULL, valid_until INTEGER NOT NULL, withdrawn_at INTEGER, purge_at INTEGER NOT NULL) STRICT;
        CREATE INDEX IF NOT EXISTS usage_choice_proofs_expiry ON usage_choice_proofs(purge_at);`);
      this.metadata.version = 2;
      if (bootRef) {
        this.transaction(() => {
          if (this.metadata.bootRef !== bootRef) {
            for (const subject of this.subjects()) {
              if (subject.kind === 'room' && subject.state === 'WAITING') { subject.state = 'WAITING_LOST_ON_RESTART'; subject.detectedAt = now; this.put(subject); }
              if (subject.kind === 'game' && subject.state === 'ACTIVE') { subject.state = 'UNRESOLVED_AFTER_RESTART'; subject.detectedAt = now; this.put(subject); }
            }
            if (!this.metadata.clean) this.quality('loss', now);
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
  private quality(kind: 'loss' | 'conflict' | 'unlinked', at: number) {
    this.db.prepare(`INSERT INTO quality VALUES (?,?,1,?,?) ON CONFLICT(month,kind) DO UPDATE SET count=count+1,firstAt=min(firstAt,excluded.firstAt),lastAt=max(lastAt,excluded.lastAt)`)
      .run(month(at), kind, at, at);
    if (kind === 'loss') this.metadata.possibleLoss = true;
    else if (kind === 'conflict') this.metadata.conflicts++;
    else this.metadata.unlinked++;
  }
  noteLoss(at = Date.now()) { this.quality('loss', at); this.saveMetadata(); }
  copied(at: number) { this.metadata.lastBackupAt = at; this.saveMetadata(); }
  health(value: UsageHealth) {
    if (!validUsageHealth(value)) throw new UsageError('INVALID_FILTER');
    this.metadata.operational = structuredClone(value); this.saveMetadata();
  }
  privacyControl(command: UsagePrivacyControl) {
    if (!validPrivacyControl(command) || this.metadata.restoredAggregatesOnly) throw new UsageError('INVALID_FILTER');
    this.transaction(() => {
      if (command.kind === 'accept') {
        const p = command.proof;
        const previous = this.db.prepare('SELECT * FROM usage_choice_proofs WHERE proof_ref=?').get(p.proofRef);
        if (previous) {
          if (previous.notice_version !== p.noticeVersion || previous.accepted_at !== p.acceptedAt || previous.valid_until !== p.validUntil) throw new UsageError('INVALID_FILTER');
        } else this.db.prepare('INSERT INTO usage_choice_proofs VALUES (?,?,?,?,NULL,?)').run(p.proofRef, p.noticeVersion, p.acceptedAt, p.validUntil, p.validUntil + DETAIL_MS);
      } else {
        for (const ref of command.proofRefs) this.db.prepare(`UPDATE usage_choice_proofs SET withdrawn_at=CASE WHEN ?<valid_until THEN coalesce(withdrawn_at,?) ELSE withdrawn_at END,
          purge_at=min(purge_at,min(?,valid_until)+?) WHERE proof_ref=?`).run(command.at, command.at, command.at, DETAIL_MS, ref);
        for (const [kind, refs] of [['room', command.roomRefs], ['game', command.gameRefs]] as const) for (const ref of refs) {
          const subject = this.get(`${kind}:${ref}`);
          if (subject?.kind === 'room' && subject.state === 'WAITING' || subject?.kind === 'game' && subject.state === 'ACTIVE') {
            subject.state = 'OBSERVATION_CENSORED'; this.put(subject);
          }
        }
      }
    });
    this.permissions();
  }

  append(events: readonly UsageEvent[], failBeforeCommit?: () => void): void {
    if (this.metadata.restoredAggregatesOnly) throw new UsageError('STORAGE_UNAVAILABLE');
    this.transaction(() => {
      for (const event of events) {
        if (!validUsageEvent(event) || event.environment !== this.environment || event.traffic !== this.traffic) throw new UsageError('INVALID_FILTER');
        if (event.source === 'SERVER') {
          const d = event.data as { roomRef?: string; gameRef?: string };
          const room = d.roomRef ? this.get(`room:${d.roomRef}`) : undefined; const game = d.gameRef ? this.get(`game:${d.gameRef}`) : undefined;
          if (room?.kind === 'room' && room.state === 'OBSERVATION_CENSORED' || game?.kind === 'game' && game.state === 'OBSERVATION_CENSORED') continue;
        }
        const logical = logicalKey(event); const signature = canonicalUsage([event.source, event.name, event.traffic,
          event.source === 'BROWSER' ? event.visitId : null, event.data]);
        const previous = this.db.prepare('SELECT signature FROM events WHERE id=? OR logical=?').all(event.eventId, logical);
        if (previous.length) { if (previous.some((row) => row.signature !== signature)) this.quality('conflict', event.receivedAt); continue; }
        if (event.occurredAt <= (this.metadata.lastMaintenanceAt ?? 0) - DETAIL_MS) { this.quality('unlinked', event.receivedAt); continue; }
        this.db.prepare('INSERT INTO events VALUES (?,?,?,?,?)').run(event.eventId, logical, event.occurredAt, signature, JSON.stringify(event));
        this.metadata.bootRef ??= event.bootRef;
        this.project(event); this.metadata.lastDurableAt = event.receivedAt;
      }
      this.saveMetadata(); failBeforeCommit?.();
    });
    this.permissions();
  }
  private project(e: UsageEvent) {
    const base = { at: e.occurredAt, traffic: e.traffic, boot: e.bootRef };
    const update = (key: string, change: (s: Subject) => void) => { const s = this.get(key); if (s) { change(s); this.put(s); } else this.quality('unlinked', e.receivedAt); };
    const correlation = (d: { visitId?: string; intentId?: string }, kind: string) => d.visitId && d.intentId ? `${kind}:${d.visitId}:${d.intentId}` : undefined;
    if ((e.name === 'room_created' || e.name === 'room_join_resolved') && e.data.visitId && e.data.intentId) {
      const matches = Number(this.db.prepare('SELECT count(*) n FROM events WHERE json_extract(payload,\'$.name\')=? AND json_extract(payload,\'$.data.visitId\')=? AND json_extract(payload,\'$.data.intentId\')=?')
        .get(e.name, e.data.visitId, e.data.intentId)?.n);
      if (matches > 1) this.quality('unlinked', e.receivedAt);
    }
    switch (e.name) {
      case 'home_viewed': this.put({ ...base, key: logicalKey(e), kind: 'view' }); break;
      case 'room_create_intended': case 'room_join_attempted': {
        const kind = e.name === 'room_create_intended' ? 'create-intent' : 'join-intent';
        const key = correlation({ visitId: e.visitId, intentId: e.data.intentId }, kind)!;
        // Recibir la intención después del resultado también correlaciona sin inventar visitas.
        const matchedRow = this.db.prepare('SELECT payload FROM events WHERE json_extract(payload,\'$.data.visitId\')=? AND json_extract(payload,\'$.data.intentId\')=? AND json_extract(payload,\'$.source\')=\'SERVER\'').all(e.visitId, e.data.intentId).find((row) => {
          const event = JSON.parse(String(row.payload)) as UsageEvent;
          return kind === 'create-intent' ? event.name === 'room_created' : event.name === 'room_join_resolved';
        });
        const matched = !!matchedRow; const resolved = matchedRow ? JSON.parse(String(matchedRow.payload)) as UsageEvent : undefined;
        this.put({ ...base, key, kind, matched, ...(resolved?.name === 'room_join_resolved' ? { outcome: resolved.data.outcome } : {}) });
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
        if (e.data.roomRef && !this.get(`room:${e.data.roomRef}`)) this.quality('unlinked', e.receivedAt);
        const key = correlation(e.data, 'join-intent'); const intent = key ? this.get(key) : undefined;
        if (intent?.kind === 'join-intent') {
          if (intent.outcome && intent.outcome !== e.data.outcome) this.quality('unlinked', e.receivedAt);
          else intent.outcome = e.data.outcome;
          intent.matched = true; this.put(intent);
        }
        this.put({ ...base, key: logicalKey(e), kind: 'join', outcome: e.data.outcome, reason: e.data.reason, linked: !!intent }); break;
      }
      case 'room_waiting_closed': update(`room:${e.data.roomRef}`, (s) => { if (s.kind === 'room') s.state = e.data.reason; }); break;
      case 'game_started':
        update(`room:${e.data.roomRef}`, (s) => { if (s.kind === 'room') s.state = 'STARTED'; });
        this.put({ ...base, key: `game:${e.data.gameRef}`, kind: 'game', state: 'ACTIVE', configuration: e.data.configuration,
          people: e.data.humanParticipations.map((p) => p.participationRef), automatic: [] }); break;
      case 'human_became_automatic': update(`game:${e.data.gameRef}`, (s) => {
        if (s.kind === 'game' && s.people.includes(e.data.participationRef) && !s.automatic.includes(e.data.participationRef)) s.automatic.push(e.data.participationRef);
        else this.quality('unlinked', e.receivedAt);
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
      this.db.prepare('DELETE FROM usage_choice_proofs WHERE purge_at<=?').run(at);
      this.db.prepare('DELETE FROM monthly WHERE month<?').run(month(firstMonth(at, -11)));
      this.db.prepare('DELETE FROM quality WHERE month<?').run(month(firstMonth(at, -11)));
      const count = (kind: string) => Number(this.db.prepare('SELECT coalesce(sum(count),0) n FROM quality WHERE kind=?').get(kind)?.n);
      this.metadata.possibleLoss = count('loss') > 0; this.metadata.conflicts = count('conflict'); this.metadata.unlinked = count('unlinked');
      if (this.metadata.bootRef && !this.db.prepare('SELECT 1 FROM events WHERE json_extract(payload,\'$.bootRef\')=? LIMIT 1').get(this.metadata.bootRef)
        && !this.db.prepare('SELECT 1 FROM subjects WHERE json_extract(payload,\'$.boot\')=? LIMIT 1').get(this.metadata.bootRef)) this.metadata.bootRef = null;
      this.metadata.lastMaintenanceAt = at; this.saveMetadata();
    });
    const checkpoint = this.db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();
    if (Number(checkpoint?.busy) !== 0) throw new UsageError('STORAGE_UNAVAILABLE');
    this.permissions();
    for (const name of fs.readdirSync(path.dirname(this.file))) {
      const match = /^(?:access|creation|joining|room-conversion|configuration|duration|completion|automatic)-(\d{4}-\d{2})-\d+\.(?:csv|json)$/.exec(name);
      if (match && match[1] < month(firstMonth(at, -11))) fs.unlinkSync(path.join(path.dirname(this.file), name));
    }
  }
  nextExpiry(now: number) {
    const first = this.db.prepare('SELECT min(at) AS at FROM (SELECT at FROM events UNION ALL SELECT at FROM subjects)').get();
    const proof = this.db.prepare('SELECT min(purge_at) at FROM usage_choice_proofs').get();
    return Math.min(now + 86_400_000, first?.at === null ? Infinity : Number(first?.at) + DETAIL_MS, proof?.at === null ? Infinity : Number(proof?.at));
  }
  read(filter: UsageFilter, now: number, traffic: 'HUMAN' | 'SYNTHETIC' = 'HUMAN'): UsageReport {
    this.maintain(now); return readSqliteUsage(this.db, this.environment, filter, now, traffic);
  }
  aggregateSnapshot(now: number) {
    this.maintain(now);
    const rows = this.db.prepare('SELECT * FROM monthly').all() as unknown as (Aggregate & { month: string; traffic: string })[];
    const detailed = this.subjects().flatMap((subject) => {
      if (subject.kind === 'room' && subject.state === 'WAITING') subject.state = 'WAITING_AT_BACKUP';
      if (subject.kind === 'game' && subject.state === 'ACTIVE') subject.state = 'ACTIVE_AT_BACKUP';
      return contributions(subject);
    }).map((row) => ({ ...row, month: month(row.at) }));
    const buckets = new Map<string, (Aggregate & { month: string; traffic: string })[]>();
    for (const row of [...rows, ...detailed]) { const key = JSON.stringify([row.month, row.traffic]); const bucket = buckets.get(key) ?? []; bucket.push(row); buckets.set(key, bucket); }
    return { metadata: { ...this.metadata, operational: undefined, aggregateAsOf: now, lastBackupAt: now, restoredAggregatesOnly: true, bootRef: null, clean: true, collectionEnabled: false },
      quality: this.db.prepare('SELECT * FROM quality').all(), rows: [...buckets].flatMap(([key, bucket]) => {
      const [month, traffic] = JSON.parse(key) as [string, string]; return mergeAggregates(bucket).map((row) => ({ ...row, month, traffic }));
    }) };
  }
  close(clean = false) { if (clean) { this.metadata.clean = true; this.metadata.collectionEnabled = false; this.saveMetadata(); } this.db.close(); }
}
