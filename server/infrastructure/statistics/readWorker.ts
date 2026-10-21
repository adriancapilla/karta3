import { parentPort, workerData } from 'node:worker_threads';
import { readAggregates } from './store.js';
import type { Environment, Traffic } from '../../application/statistics/contracts.js';
const options = workerData as { file: string; environment: Environment; traffic: Traffic; from: string; to: string; now: number };
try { parentPort!.postMessage({ data: readAggregates(options.file, options.environment, options.traffic, options.from, options.to, options.now) }); }
catch { parentPort!.postMessage({ failed: true }); }
parentPort!.close();
