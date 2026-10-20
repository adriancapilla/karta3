import { expect, it } from 'vitest';
import { buildReport, reportCsv, validateFilter } from './reports.js';
import { reports, type AggregateData, type Cell, type Filter } from './contracts.js';
const filter = (report: Filter['report']): Filter => ({ report, from: '2026-10-19', to: '2026-10-20', environment: 'test' });
const cell = (family: Cell['family'], dimension: string, category: string, value: number, measure = 'count'): Cell => ({ day: '2026-10-19', family, dimension, category, value, measure });
const data: AggregateData = { model: 'AGG_DAILY_V1', schema: 1, environment: 'test', traffic: 'SYNTHETIC', asOf: '2026-10-20T12:00:00.000Z',
  frontier: '2026-10-20', instrumentedFrom: '2026-10-19', restored: false, coverage: [], cells: [
    cell('HOME', 'total', 'all', 8), cell('CREATION', 'total', 'all', 4),
    ...Object.entries({ created: 4, started: 2, closed: 1, pending: 1 }).map(([c, n]) => cell('WAITING', 'balance', c, n)),
    ...Object.entries({ started: 2, active: 0, DECK_COMPLETED: 1, HOST_CANCELLED: 1 }).map(([c, n]) => cell('GAME', 'balance', c, n)),
    ...Object.entries({ base: 4, became: 1, closed: 4 }).map(([c, n]) => cell('AUTOMATIC', 'balance', c, n)),
    cell('DURATION', 'total', 'all', 2), cell('DURATION', 'total', 'all', 300, 'seconds'), cell('DURATION', 'bin', '1', 2),
    cell('CONFIGURATION', 'hostPlays', 'true', 1), cell('CONFIGURATION', 'hostPlays', 'false', 1),
    cell('APPEARANCE', 'balance', 'population', 4), cell('APPEARANCE', 'balance', 'absent', 2),
    cell('APPEARANCE', 'start', 'L0', 2), cell('APPEARANCE', 'end', 'L0', 1), cell('APPEARANCE', 'end', 'D1', 1), cell('APPEARANCE', 'pair', 'L0:L0', 1)
  ] };
it('A01/A02: nueve consultas fijas, distribuciones y denominadores independientes conocidos', () => {
  for (const name of reports) { const r = buildReport(data, filter(name)); expect(r.model).toBe('AGG_DAILY_V1'); expect(r.period.granularity).toBe('UTC_DAY'); expect(reportCsv(r)).not.toMatch(/roomId|gameId|visitId|participationId/); }
  expect(buildReport(data, filter('room-conversion'))).toMatchObject({ numerator: 2, denominator: 4, percentage: 50, provisional: true, balanced: true });
  expect(buildReport(data, filter('completion'))).toMatchObject({ numerator: 1, denominator: 2, percentage: 50, rateMeaning: 'BETWEEN_CONFIRMED_FINALS', balanced: true });
  expect(buildReport(data, filter('automatic'))).toMatchObject({ denominator: 4, numerator: 1, percentage: 25 });
  expect(buildReport(data, filter('duration'))).toMatchObject({ known: 2, sum: 300, mean: 150 });
  const appearance = buildReport(data, filter('appearance'));
  expect(appearance).toMatchObject({ population: 4, withStart: 2, withEnd: 2, paired: 1, onlyStart: 1, onlyEnd: 1, neither: 1, balanced: true, coverage: { start: 50, end: 50, paired: 25 } });
  expect('pairs' in appearance && appearance.pairs).toHaveLength(25);
});
it('A02/A09: solo días UTC cerrados y doce meses calendario', () => {
  const now = Date.UTC(2026, 9, 20, 12); validateFilter(filter('access'), now);
  for (const invalid of [{ from: '2026-10-20', to: '2026-10-21' }, { from: '2026-10-19T00:00:00Z' }, { from: '2025-10-31' }, { to: '2026-10-19' }, { from: '2026-02-30' }])
    expect(() => validateFilter({ ...filter('access'), ...invalid }, now)).toThrow('INVALID_FILTER');
});
it('A01/A07: cero base no es 0%; desconocidos/cortes no mejoran tasas; históricos no instrumentados', () => {
  expect(buildReport({ ...data, cells: [] }, filter('automatic'))).toMatchObject({ percentage: null, state: 'ZERO' });
  expect(buildReport({ ...data, instrumentedFrom: '2026-10-20', cells: [] }, filter('appearance'))).toMatchObject({ state: 'NOT_INSTRUMENTED' });
  const lost = { ...data, coverage: [{ day: '2026-10-19', family: 'WAITING' as const, cause: 'WRITE_UNCERTAIN' as const }] };
  expect(buildReport(lost, filter('room-conversion'))).toMatchObject({ percentage: null, state: 'UNAVAILABLE', created: 4 });
});
