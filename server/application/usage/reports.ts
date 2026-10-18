import { reports, UsageError, type Aggregate, type UsageFilter, type UsageQuality, type UsageReport } from './contracts.js';

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
export function usageReport(filter: UsageFilter, quality: UsageQuality, inputs: readonly Aggregate[]): UsageReport {
  const rows = mergeAggregates(inputs.filter((row) => row.report === filter.report));
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
    case 'duration': numerator = rows.reduce((sum, row) => sum + row.sum, 0); denominator = rows.reduce((sum, row) => sum + row.count, 0); break;
  }
  const incomplete = quality.possibleLoss || quality.conflicts > 0 || quality.unlinked > 0 || numerator > denominator && filter.report !== 'duration';
  return { version: 1, filter, quality, rows, numerator, denominator,
    meanDurationMs: filter.report === 'duration' && denominator ? numerator / denominator : null,
    percentage: denominator && !incomplete && filter.report !== 'duration' ? numerator / denominator * 100 : null,
    provisional: filter.to > quality.asOf || ['room-conversion', 'completion', 'automatic'].includes(filter.report) };
}
/** CSV nunca contiene detalle o IDs; evita fórmulas incluso en texto futuro validado. */
export function usageCsv(report: UsageReport): string {
  const cell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
  const header = ['report', 'dimension', 'metric', 'count', 'sum', 'min', 'max', 'numerator', 'denominator', 'percentage', 'meanDurationMs', 'asOf', 'possibleLoss'];
  return [header, ...report.rows.map((row) => [row.report, row.dimension, row.metric, row.count, row.sum, row.min, row.max,
    report.numerator, report.denominator, report.percentage, report.meanDurationMs, report.quality.asOf, report.quality.possibleLoss])].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
