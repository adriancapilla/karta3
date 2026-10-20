import path from 'node:path';
import { ReadStatisticsReport, reportCsv } from '../application/statistics/reports.js';
import { StatisticsError, type ReportName } from '../application/statistics/contracts.js';
import { privateDirectory, privateOutput, withPrivateExport } from '../infrastructure/statistics/privateFiles.js';
import { SqliteAggregateReader } from '../infrastructure/statistics/reader.js';
import { statisticsLocation } from './statistics.js';

export async function statisticsCommand(args: string[], synthetic = false) {
  const flags = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    if (!['--report', '--from', '--to', '--environment', '--format'].includes(args[i]) || !args[i + 1] || flags.has(args[i])) throw new StatisticsError('INVALID_FILTER');
    flags.set(args[i], args[i + 1]);
  }
  const location = statisticsLocation(process.env.KARTA3_ENV, process.env.KARTA3_STATISTICS_DIRECTORY, synthetic ? 'SYNTHETIC' : 'HUMAN');
  if (flags.get('--environment') !== location.environment) throw new StatisticsError('ENVIRONMENT_MISMATCH');
  if (synthetic && location.environment !== 'test') throw new StatisticsError('NOT_AUTHORIZED');
  if (!['json', 'csv'].includes(flags.get('--format') ?? '')) throw new StatisticsError('INVALID_FILTER');
  privateDirectory(location.root, false);
  const query = new ReadStatisticsReport(new SqliteAggregateReader(location.file, location.environment, location.traffic), Date.now);
  return withPrivateExport(location.root, async () => {
    const filter = { report: flags.get('--report') as ReportName, from: flags.get('--from') ?? '', to: flags.get('--to') ?? '', environment: location.environment };
    const report = await query.execute(filter);
    const file = `${filter.report}-${filter.from}-${filter.to}-${Date.now()}.${flags.get('--format')}`;
    privateOutput(path.join(location.root, file), flags.get('--format') === 'csv' ? reportCsv(report) : JSON.stringify(report, null, 2) + '\n'); return file;
  });
}
