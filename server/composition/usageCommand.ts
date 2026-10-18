import path from 'node:path';
import fs from 'node:fs';
import { SqliteUsageWorker } from '../infrastructure/usage/sqliteWorker.js';
import { privateDirectory, privateOutput, withPrivateExport } from '../infrastructure/usage/privateFiles.js';
import { usageLocation } from './usage.js';
import { reports, UsageError, type UsageReportName } from '../application/usage/contracts.js';
import { usageCsv } from '../application/usage/reports.js';
import { ReadUsageReport } from '../application/usage/query.js';

export async function usageCommand(args: string[], synthetic = false) {
  let writer: SqliteUsageWorker | undefined;
  try {
    const flags = new Map<string, string>();
    for (let i = 0; i < args.length; i += 2) {
      if (!['--report', '--from', '--to', '--environment', '--format'].includes(args[i]) || !args[i + 1] || flags.has(args[i])) throw new UsageError('INVALID_FILTER');
      flags.set(args[i], args[i + 1]);
    }
    const location = usageLocation(process.env.KARTA3_ENV, process.env.KARTA3_USAGE_DIRECTORY, synthetic ? 'SYNTHETIC' : 'HUMAN');
    if (flags.get('--environment') !== location.environment) throw new UsageError('ENVIRONMENT_MISMATCH');
    if (synthetic && location.environment !== 'test') throw new UsageError('NOT_AUTHORIZED');
    const report = flags.get('--report') as UsageReportName;
    const parseDate = (text: string | undefined) => {
      if (!text || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(text)) return NaN;
      const at = Date.parse(text); const canonical = text.includes('.') ? text : text.replace('Z', '.000Z');
      return Number.isFinite(at) && new Date(at).toISOString() === canonical ? at : NaN;
    };
    const from = parseDate(flags.get('--from')); const to = parseDate(flags.get('--to'));
    const format = flags.get('--format');
    if (!reports.includes(report) || !Number.isFinite(from) || !Number.isFinite(to) || !['json', 'csv'].includes(format ?? '')) throw new UsageError('INVALID_FILTER');
    if (!fs.existsSync(location.file)) throw new UsageError('COLLECTION_DISABLED');
    privateDirectory(location.root, false);
    writer = new SqliteUsageWorker({ ...location, existingOnly: true, readOnly: true }); await writer.ready;
    const current = writer;
    const query = new ReadUsageReport({ read: (filter) => current.read(filter, synthetic) }, location.environment);
    await withPrivateExport(location.root, async () => {
      const result = await query.execute({ report, from, to, environment: location.environment });
      const output = format === 'csv' ? usageCsv(result) : JSON.stringify(result, null, 2) + '\n';
      // Ruta elegida por configuración administrativa; no argumento arbitrario del solicitante.
      const filename = `${report}-${new Date(from).toISOString().slice(0, 7)}-${Date.now()}.${format}`;
      privateOutput(path.join(location.root, filename), output);
      console.log(filename);
    });
  } catch (error) {
    console.error(error instanceof UsageError ? error.code : 'STORAGE_UNAVAILABLE'); process.exitCode = 1;
  } finally { await writer?.close(); }
}
