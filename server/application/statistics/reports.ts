import { categories, configuration, ends } from './catalog.js';
import { StatisticsError, dayOf, reports, retentionDay, type AggregateData, type AggregateReader, type Cell, type Filter, type ReportName } from './contracts.js';

const reportFamily: Record<ReportName, Cell['family']> = { access: 'HOME', creation: 'CREATION', joining: 'JOIN', 'room-conversion': 'WAITING',
  configuration: 'CONFIGURATION', completion: 'GAME', duration: 'DURATION', automatic: 'AUTOMATIC', appearance: 'APPEARANCE' };
export function validateFilter(filter: Filter, now: number) {
  const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
  if (!reports.includes(filter.report) || !validDay(filter.from) || !validDay(filter.to) || filter.from >= filter.to
    || filter.to > dayOf(now) || filter.from < retentionDay(now)) throw new StatisticsError('INVALID_FILTER');
}
const percent = (n: number, d: number, valid = true) => d > 0 && valid ? n * 100 / d : null;
export function buildReport(data: AggregateData, filter: Filter) {
  const family = reportFamily[filter.report]; const rows = data.cells.filter(c => c.family === family);
  const value = (category: string, dimension = 'balance', measure = 'count', f = family) => data.cells.filter(c => c.family === f && c.category === category && c.dimension === dimension && c.measure === measure).reduce((n, c) => n + c.value, 0);
  const distribution = (dimension: string, values?: readonly string[]) => {
    const names = values ?? [...new Set(rows.filter(c => c.dimension === dimension).map(c => c.category))].sort();
    const denominator = rows.filter(c => c.dimension === dimension && c.measure === 'count').reduce((n, c) => n + c.value, 0);
    return names.map(category => ({ dimension, category, count: value(category, dimension), denominator, percentage: percent(value(category, dimension), denominator) }));
  };
  const quality = data.coverage.filter(c => c.family === family);
  const compromised = quality.some(c => !['PARTIAL_DAY', 'DIMENSION_LIMIT'].includes(c.cause)) || value('unknown') > 0 || value('cut') > 0;
  const state = filter.to <= data.instrumentedFrom ? 'NOT_INSTRUMENTED' : compromised ? 'UNAVAILABLE'
    : family === 'APPEARANCE' && value('population') > 0 && !rows.some(c => ['start', 'end'].includes(c.dimension) && c.value > 0) ? 'NOT_CAPTURED'
      : rows.some(c => c.value > 0) ? 'VALUE' : 'ZERO';
  const base = { model: data.model, schema: data.schema, version: 1, report: filter.report, environment: data.environment, traffic: data.traffic,
    period: { from: filter.from, to: filter.to, granularity: 'UTC_DAY' }, asOf: data.asOf, frontier: data.frontier, instrumentedFrom: data.instrumentedFrom,
    state, quality, compromised, lossQuantity: compromised ? 'UNKNOWN' : null, restored: data.restored, rows, unit: 'count', resolution: 'integer' };
  switch (filter.report) {
    case 'access': case 'creation': return { ...base, count: value('all', 'total') };
    case 'joining': return { ...base, outcomes: distribution('outcome', ['NEW_JOIN', 'EXISTING_PARTICIPATION', 'REJECTED']),
      reasons: distribution('reason', ['INPUT', 'AVAILABILITY_OR_PHASE', 'CAPACITY', 'IDENTITY_OR_PERMISSION', 'CONFLICT', 'TECHNICAL']) };
    case 'room-conversion': {
      const c = value('created'), s = value('started'), w = value('closed'), p = value('pending'), u = value('unknown'), x = value('cut');
      return { ...base, cohort: 'CREATED', created: c, started: s, closed: w, pending: p, unknown: u, cut: x, balanced: c === s + w + p + u + x,
        numerator: s, denominator: c, percentage: percent(s, c, !compromised && c === s + w + p + u + x), provisional: p > 0 };
    }
    case 'completion': {
      const g = value('started'), a = value('active'), u = value('unknown'), x = value('cut'); const finals = ends.reduce((n, e) => n + value(e), 0);
      return { ...base, cohort: 'GAME_STARTED', started: g, active: a, unknown: u, cut: x, finals: Object.fromEntries(ends.map(e => [e, value(e)])),
        balanced: g === finals + a + u + x, numerator: value('DECK_COMPLETED'), denominator: finals, rateMeaning: 'BETWEEN_CONFIRMED_FINALS',
        percentage: percent(value('DECK_COMPLETED'), finals, !compromised && g === finals + a + u + x), provisional: a > 0 };
    }
    case 'configuration': return { ...base, cohort: 'GAME_STARTED', distributions: configuration.map(dimension => ({ dimension,
      denominator: rows.filter(c => c.dimension === dimension).reduce((n, c) => n + c.value, 0),
      state: dimension === 'package' && quality.some(c => c.cause === 'DIMENSION_LIMIT') ? 'NOT_CAPTURED' : state, values: distribution(dimension) })) };
    case 'duration': {
      const n = value('all', 'total'), sum = value('all', 'total', 'seconds');
      return { ...base, cohort: 'RESULT_PUBLISHED', unit: 'seconds', resolution: 'TRUNCATED_SECONDS', known: n, sum,
        mean: n ? sum / n : null, bins: distribution('bin', ['0', '1', '2', '3', '4', '5', '6']), binEdges: [0, 60, 180, 300, 600, 1200, 2400],
        reasons: ends.map(reason => ({ reason, count: value(reason, 'reason'), sum: value(reason, 'reason', 'seconds') })) };
    }
    case 'automatic': return { ...base, cohort: 'GAME_STARTED', baseHumans: value('base'), automatic: value('became'), open: value('open'), unknown: value('unknown'), cut: value('cut'),
      numerator: value('became'), denominator: value('base'), percentage: percent(value('became'), value('base'), !compromised), provisional: value('open') > 0 };
    case 'appearance': {
      const n = value('population'), s = distribution('start', categories), e = distribution('end', categories);
      const pairs = distribution('pair', categories.flatMap(a => categories.map(b => `${a}:${b}`)));
      const starts = s.reduce((n, c) => n + c.count, 0), finals = e.reduce((n, c) => n + c.count, 0), q = pairs.reduce((n, c) => n + c.count, 0);
      const balanced = q <= starts && q <= finals && n >= starts + finals - q;
      return { ...base, cohort: 'GAME_STARTED', population: n, pending: value('pending'), unknown: value('unknown'), cut: value('cut'), absent: value('absent'),
        start: s, end: e, pairs, balanced, withStart: starts, withEnd: finals, paired: q, onlyStart: balanced ? starts - q : null,
        onlyEnd: balanced ? finals - q : null, neither: balanced ? n - starts - finals + q : null,
        coverage: { start: percent(starts, n, balanced), end: percent(finals, n, balanced), paired: percent(q, n, balanced) }, provisional: value('pending') > 0 };
    }
  }
}
export class ReadStatisticsReport {
  constructor(private readonly reader: AggregateReader, private readonly now: () => number) {}
  async execute(filter: Filter) { validateFilter(filter, this.now()); const data = await this.reader.read(filter);
    if (data.environment !== filter.environment) throw new StatisticsError('ENVIRONMENT_MISMATCH'); return buildReport(data, filter); }
}
export function reportCsv(report: ReturnType<typeof buildReport>): string {
  const safe = (v: unknown) => { const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'; };
  // Metadatos/fórmulas en filas fijas; nunca un identificador individual o consulta libre.
  const header = ['model', 'schema', 'report', 'environment', 'traffic', 'from', 'to', 'asOf', 'state', 'field', 'value'];
  const prefix = [report.model, report.schema, report.report, report.environment, report.traffic, report.period.from, report.period.to, report.asOf, report.state];
  return [header, ...Object.entries(report).filter(([k]) => !['model', 'schema', 'report', 'environment', 'traffic', 'period', 'asOf', 'state'].includes(k))
    .map(([k, v]) => [...prefix, k, v])].map(row => row.map(safe).join(',')).join('\r\n') + '\r\n';
}
