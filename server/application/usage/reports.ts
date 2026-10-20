import { reports, UsageError, type Aggregate, type UsageFilter, type UsageQuality, type UsageReport, type UsageTraffic } from './contracts.js';
import { appearanceCsv, appearanceReport } from './appearanceReport.js';

export function validateUsageFilter(filter: UsageFilter, environment: string) {
  if (filter.environment !== environment) throw new UsageError('ENVIRONMENT_MISMATCH');
  if (!reports.includes(filter.report) || !Number.isSafeInteger(filter.from) || !Number.isSafeInteger(filter.to)
    || filter.from < 0 || filter.to <= filter.from) throw new UsageError('INVALID_FILTER');
}
export function mergeAggregates(rows: readonly Aggregate[]): Aggregate[] {
  const result = new Map<string, Aggregate>();
  for (const row of rows) {
    const key = JSON.stringify([row.report, row.dimension, row.metric]); const old = result.get(key);
    if (!old) result.set(key, { ...row });
    else { old.count += row.count; old.sum += row.sum;
      if (row.min !== null) old.min = old.min === null ? row.min : Math.min(old.min, row.min);
      if (row.max !== null) old.max = old.max === null ? row.max : Math.max(old.max, row.max); }
  }
  return [...result.values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'));
}
export function usageReport(filter: UsageFilter, inputQuality: UsageQuality, inputs: readonly Aggregate[], traffic: UsageTraffic = 'HUMAN', instrumentedFrom: number | null = null): UsageReport {
  const rows = mergeAggregates(inputs.filter((row) => row.report === filter.report));
  const uncertain = rows.some((row) => row.count > 0 && /UNRESOLVED|LOST_ON_RESTART/.test(row.metric));
  const censored = rows.some((row) => row.count > 0 && /CENSORED|AT_BACKUP/.test(row.metric));
  const quality = { ...inputQuality, possibleLoss: inputQuality.possibleLoss || uncertain, partialCoverage: inputQuality.partialCoverage || censored };
  if (filter.report === 'appearance') return appearanceReport(filter, quality, rows, traffic, instrumentedFrom);
  const count = (metric: string) => rows.filter((row) => row.metric === metric).reduce((sum, row) => sum + row.count, 0);
  let numerator = 0; let denominator = 0;
  switch (filter.report) {
    case 'access': numerator = count('views'); denominator = numerator; break;
    case 'creation': numerator = count('confirmed-intentions'); denominator = count('intentions'); break;
    case 'joining': numerator = count('confirmed-intentions'); denominator = count('intentions'); break;
    case 'room-conversion': numerator = count('STARTED'); denominator = count('rooms'); break;
    case 'completion': numerator = count('DECK_COMPLETED'); denominator = ['DECK_COMPLETED', 'HOST_CANCELLED', 'NO_ACTIVE_HUMAN_PLAYERS', 'TECHNICAL_INTERRUPTION'].reduce((sum, key) => sum + count(key), 0); break;
    case 'automatic': numerator = count('automatic'); denominator = count('human-players'); break;
    case 'configuration': numerator = count('games'); denominator = numerator; break;
    case 'duration': numerator = rows.filter(row => row.metric === 'durationMs').reduce((sum, row) => sum + row.sum, 0);
      denominator = count('durationMs'); break;
  }
  const incomplete = quality.possibleLoss || censored || quality.conflicts > 0 || quality.unlinked > 0
    || count('unlinked-creations') > 0 || count('unlinked-results') > 0 || count('unconfirmed-intentions') > 0 || count('unresolved-intentions') > 0
    || numerator > denominator && filter.report !== 'duration';
  return { version: 1, traffic, filter, quality, rows, numerator, denominator,
    meanDurationMs: filter.report === 'duration' && denominator ? numerator / denominator : null,
    percentage: denominator && !incomplete && filter.report !== 'duration' ? numerator / denominator * 100 : null,
    provisional: filter.to > quality.asOf || ['room-conversion', 'completion', 'automatic'].includes(filter.report) };
}
/** CSV nunca contiene detalle o IDs; evita fórmulas incluso en texto futuro validado. */
export function usageCsv(report: UsageReport): string {
  if (report.report === 'appearance') return appearanceCsv(report);
  const cell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
  const header = ['report', 'dimension', 'metric', 'count', 'sum', 'min', 'max', 'numerator', 'denominator', 'percentage', 'meanDurationMs',
    'from', 'to', 'environment', 'traffic', 'asOf', 'coverageFrom', 'collection', 'possibleLoss', 'conflicts', 'unlinked', 'partialCoverage', 'aggregatesOnly',
    'writerSnapshotAt', 'writerQueue', 'writerBytes', 'writerDegraded', 'writerDiscarded'];
  const rows = report.rows.length ? report.rows : [{ report: report.filter.report, dimension: '', metric: 'no-observations', count: 0, sum: 0, min: null, max: null }];
  return [header, ...rows.map((row) => [row.report, row.dimension, row.metric, row.count, row.sum, row.min, row.max,
    report.numerator, report.denominator, report.percentage, report.meanDurationMs, report.filter.from, report.filter.to, report.filter.environment,
    report.traffic, report.quality.asOf, report.quality.coverageFrom, report.quality.collection, report.quality.possibleLoss, report.quality.conflicts,
    report.quality.unlinked, report.quality.partialCoverage, report.quality.restoredAggregatesOnly,
    report.quality.operational?.at, report.quality.operational?.queue, report.quality.operational?.bytes, report.quality.operational?.degraded,
    report.quality.operational ? Object.values(report.quality.operational.discarded).reduce((sum, count) => sum + count, 0) : null])]
    .map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
