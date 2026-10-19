import { type UsageEnvironment, type UsageFilter, type UsageReportReader } from './contracts.js';
import { validateUsageFilter } from './reports.js';

/** La autorización del SO precede a este caso; no admite SQL ni tablas. */
export class ReadUsageReport {
  constructor(private readonly reader: UsageReportReader, private readonly environment: UsageEnvironment) {}
  execute(filter: UsageFilter) { validateUsageFilter(filter, this.environment); return this.reader.read(filter); }
}
