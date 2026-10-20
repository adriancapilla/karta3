import type { AppearanceValue } from '../../../shared/contracts/appearance.js';
import type { Aggregate, AppearanceReport, UsageFilter, UsageQuality, UsageTraffic } from './contracts.js';

const categories: AppearanceValue[] = [{ theme: 'LIGHT', origin: 'DEFAULT' }, ...(['LIGHT', 'DARK', 'CREAM', 'HIGH_CONTRAST'] as const).map(theme => ({ theme, origin: 'EXPLICIT' as const }))];
export function appearanceReport(filter: UsageFilter, quality: UsageQuality, rows: Aggregate[], traffic: UsageTraffic, instrumentedFrom: number | null): AppearanceReport {
  const count = (metric: string, dimension?: string) => rows.filter(row => row.metric === metric && (dimension === undefined || row.dimension === dimension)).reduce((sum, row) => sum + row.count, 0);
  const ratio = (n: number, d: number) => ({ count: n, denominator: d, percentage: d ? n / d * 100 : null });
  const population = { eligible: count('eligible'), withStart: count('withStart'), withEnd: count('withEnd'), paired: count('paired'),
    onlyStart: count('onlyStart'), onlyEnd: count('onlyEnd'), neither: count('neither'), pending: count('pending'), notInstrumented: count('notInstrumented') };
  const marginal = (moment: 'START' | 'END') => categories.map(value => ({ ...value,
    ...ratio(count(moment, JSON.stringify([value.theme, value.origin])), moment === 'START' ? population.withStart : population.withEnd) }));
  return { report: 'appearance', version: 1, traffic, filter, cohort: 'GAME_STARTED', rows,
    quality: { ...quality, partialCoverage: quality.partialCoverage || population.notInstrumented > 0 || instrumentedFrom === null || filter.from < instrumentedFrom, instrumentedFrom },
    population, start: marginal('START'), end: marginal('END'),
    transitions: categories.flatMap(from => categories.map(to => ({ from, to,
      ...ratio(count('PAIR', JSON.stringify([from.theme, from.origin, to.theme, to.origin])), population.paired) }))),
    provisional: filter.to > quality.asOf || population.pending > 0 };
}
export function appearanceCsv(report: AppearanceReport) {
  const cell = (v: unknown) => '"' + String(v ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
  const header = ['moment', 'theme', 'origin', 'endTheme', 'endOrigin', 'count', 'denominator', 'percentage', 'cohort', 'from', 'to', 'environment', 'traffic', 'asOf', 'instrumentedFrom', 'partialCoverage', 'possibleLoss'];
  const data: unknown[][] = [];
  for (const moment of ['START', 'END'] as const) for (const row of moment === 'START' ? report.start : report.end) data.push([moment, row.theme, row.origin, '', '', row.count, row.denominator, row.percentage]);
  for (const row of report.transitions) data.push(['PAIR', row.from.theme, row.from.origin, row.to.theme, row.to.origin, row.count, row.denominator, row.percentage]);
  for (const [metric, count] of Object.entries(report.population)) data.push(['COVERAGE', metric, '', '', '', count, metric === 'notInstrumented' ? null : report.population.eligible, null]);
  return [header, ...data.map(row => [...row, report.cohort, report.filter.from, report.filter.to, report.filter.environment, report.traffic,
    report.quality.asOf, report.quality.instrumentedFrom, report.quality.partialCoverage, report.quality.possibleLoss])].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
