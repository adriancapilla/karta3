import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { compiledInstallation, removeTestInstallation } from './compiledDeckServer.js';
import { privateDirectory } from '../../server/infrastructure/statistics/privateFiles.js';
import { AggregateStore } from '../../server/infrastructure/statistics/store.js';
import type { Cell } from '../../server/application/statistics/contracts.js';

/** main real aislado con transporte, reloj/planificador y entropía normales. Sin datos reales. */
export async function statisticsInstallation() {
  const root = await compiledInstallation(); await fs.cp(path.resolve('barajas'), path.join(root, 'barajas'), { recursive: true });
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b21-process-'));
  const directory = path.join(data, 'test', 'synthetic'); const file = path.join(directory, 'agg-daily-v1.sqlite');
  await fs.writeFile(path.join(root, 'statistics-process.mjs'), `import './dist-server/server/main.js';
// Solo arnés de proceso propio; no endpoint de prueba en producto.
process.on('message', message => { if (message === 'test-controlled-stop') process.emit('SIGTERM'); });\n`);
  const start = async (enabled = true, port = 0) => {
    if (enabled) {
      privateDirectory(directory, true);
      try { await fs.access(file); } catch { const s = new AggregateStore({ file, environment: 'test', traffic: 'SYNTHETIC', now: Date.now(), initialize: true }); s.close(true); }
    }
    const child = spawn(process.execPath, ['--import', './guard.mjs', 'statistics-process.mjs'], { cwd: root, windowsHide: true,
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', KARTA3_ENV: 'test', KARTA3_STATISTICS_MODE: enabled ? 'synthetic' : 'off',
        KARTA3_STATISTICS_DIRECTORY: data, KARTA3_STATISTICS_BACKUP_KEY_FILE: '' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    let output = ''; let errors = ''; child.stderr.on('data', (chunk: Buffer) => { errors += chunk.toString(); });
    const exited = new Promise<void>(resolve => child.once('exit', () => resolve()));
    const base = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => { child.kill(); reject(new Error(`own startup: ${errors}`)); }, 10_000);
      child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); const match = /KARTA3: (http:\/\/127\.0\.0\.1:\d+)/.exec(output);
        if (match) { clearTimeout(timer); resolve(match[1]); } });
      child.once('error', reject); child.once('exit', () => { clearTimeout(timer); reject(new Error(`own startup failed: ${errors}`)); });
    });
    let stopped = false;
    return { base, child, errors: () => errors, stop: async (controlled = true) => {
      if (stopped) return; stopped = true;
      if (controlled) child.send('test-controlled-stop'); else child.kill('SIGKILL');
      const timer = setTimeout(() => child.kill('SIGKILL'), 4000); await exited; clearTimeout(timer);
    } };
  };
  const cells = () => { const db = new DatabaseSync(file, { readOnly: true }); try { return db.prepare('SELECT * FROM cells ORDER BY day,family,dimension,category,measure').all() as Cell[]; } finally { db.close(); } };
  const total = (family: Cell['family'], category: string, dimension = 'balance') => cells().filter(c => c.family === family && c.dimension === dimension && c.category === category && c.measure === 'count').reduce((n, c) => n + c.value, 0);
  return { root, data, file, start, cells, total, cleanup: async () => {
    await removeTestInstallation(root);
    if (path.dirname(data) !== os.tmpdir() || !path.basename(data).startsWith('karta3-b21-process-')) throw new Error('own path'); await fs.rm(data, { recursive: true, force: true });
  } };
}
