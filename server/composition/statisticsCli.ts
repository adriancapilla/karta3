import { statisticsCommand } from './statisticsCommand.js';
import { StatisticsError } from '../application/statistics/contracts.js';
try { console.log(await statisticsCommand(process.argv.slice(2))); }
catch (error) { console.error(error instanceof StatisticsError ? error.code : 'STORAGE_UNAVAILABLE'); process.exitCode = 1; }
