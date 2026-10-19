import { DatabaseSync } from 'node:sqlite';
import { UsageError, type Aggregate, type UsageEnvironment, type UsageFilter, type UsageQuality, type UsageReport, type UsageTraffic } from '../../application/usage/contracts.js';
import { usageReport, validateUsageFilter } from '../../application/usage/reports.js';
import { contributions, type Subject } from '../../application/usage/projections.js';
import { DETAIL_MS, firstMonth, month, type Metadata } from './schema.js';
import { hasLiveUsageWriter } from './privateFiles.js';
import { validUsageHealth } from './eventValidation.js';

export function readSqliteUsage(db: DatabaseSync, environment: UsageEnvironment, filter: UsageFilter, now: number, traffic: UsageTraffic): UsageReport {
  validateUsageFilter(filter, environment);
  const metadata = JSON.parse(String(db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)) as Metadata;
  const earliest = Math.max(metadata.coverageFrom, firstMonth(now, -11));
  if (filter.from < firstMonth(earliest) || filter.to <= earliest || filter.to > now) throw new UsageError('INSUFFICIENT_DETAIL');
  const cut = now - DETAIL_MS;
  // Un lector nunca purga ni sirve el detalle que otro proceso debió consolidar.
  const due = db.prepare('SELECT min(at) at FROM (SELECT at FROM subjects UNION ALL SELECT at FROM events)').get();
  if (due?.at !== null && Number(due?.at) <= cut) throw new UsageError('STORAGE_UNAVAILABLE');
  if (metadata.restoredAggregatesOnly && (filter.from !== firstMonth(filter.from)
    || filter.from >= metadata.aggregateAsOf! || filter.to !== firstMonth(filter.to) && filter.to < metadata.aggregateAsOf!)) throw new UsageError('INSUFFICIENT_DETAIL');
  if (filter.from <= cut && (filter.from !== firstMonth(filter.from)
    || filter.to < firstMonth(cut, 1) && filter.to !== firstMonth(filter.to))) throw new UsageError('INSUFFICIENT_DETAIL');
  const detailed = db.prepare('SELECT payload FROM subjects WHERE at>=? AND at<?').all(filter.from, filter.to)
    .map((row) => JSON.parse(String(row.payload)) as Subject).filter((s) => s.traffic === traffic).flatMap(contributions);
  const monthly = db.prepare('SELECT report,dimension,metric,count,sum,min,max FROM monthly WHERE month>=? AND month<? AND traffic=?')
    .all(month(firstMonth(filter.from, filter.from === firstMonth(filter.from) ? 0 : 1)), month(firstMonth(filter.to,
      metadata.restoredAggregatesOnly && filter.to !== firstMonth(filter.to) && filter.to >= metadata.aggregateAsOf! ? 1 : 0)), traffic) as unknown as Aggregate[];
  const issues = db.prepare('SELECT kind,sum(count) n FROM quality WHERE month>=? AND month<=? GROUP BY kind').all(month(filter.from), month(filter.to - 1));
  const issue = (kind: string) => Number(issues.find((row) => row.kind === kind)?.n ?? 0);
  const operational = validUsageHealth(metadata.operational) ? metadata.operational : null;
  const operationalStale = !operational || now - operational.at > 60_000;
  const quality: UsageQuality = { coverageFrom: earliest, asOf: metadata.aggregateAsOf ?? now, possibleLoss: issue('loss') > 0, conflicts: issue('conflict'),
    unlinked: issue('unlinked'), lastDurableAt: metadata.lastDurableAt, lastMaintenanceAt: metadata.lastMaintenanceAt,
    restoredAggregatesOnly: metadata.restoredAggregatesOnly, partialCoverage: filter.from < earliest || metadata.restoredAggregatesOnly,
    lastBackupAt: metadata.lastBackupAt ?? null, collection: !metadata.collectionEnabled ? 'disabled'
      : metadata.possibleLoss || !operationalStale && operational?.degraded ? 'degraded' : 'enabled',
    operational, operationalStale };
  return usageReport(filter, quality, [...detailed, ...monthly], traffic);
}
/** Conexión administrativa SOLO LECTURA, sin migrar/reconciliar/purgar la DB viva. */
export class SqliteUsageReader {
  readonly db: DatabaseSync;
  constructor(readonly file: string, readonly environment: UsageEnvironment, readonly traffic: UsageTraffic) {
    this.db = new DatabaseSync(file, { readOnly: true, timeout: 100 });
    try {
      const metadata = JSON.parse(String(this.db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)) as Metadata;
      if (metadata.environment !== environment || metadata.traffic !== traffic) throw new UsageError('ENVIRONMENT_MISMATCH');
      if (metadata.version !== 1) throw new UsageError('STORAGE_UNAVAILABLE');
    } catch (error) { this.db.close(); throw error; }
  }
  read(filter: UsageFilter, now: number, traffic: UsageTraffic) {
    const metadata = JSON.parse(String(this.db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)) as Metadata;
    if (!metadata.clean && !hasLiveUsageWriter(this.file)) throw new UsageError('STORAGE_UNAVAILABLE');
    this.db.exec('BEGIN');
    try { return readSqliteUsage(this.db, this.environment, filter, now, traffic); }
    finally { this.db.exec('ROLLBACK'); }
  }
  close() { this.db.close(); }
}
