import { expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { AggregateStore } from '../infrastructure/statistics/store.js';
import { statisticsCommand } from './statisticsCommand.js';
import { reports, type Cell } from '../application/statistics/contracts.js';
const run = promisify(execFile);
it('B21 A02/A09: CLI real prepara solo archivo nuevo, nueve CSV privados por días cerrados y mantenimiento OFF', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b21-admin-'));
  if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b21-admin-')) throw new Error('own path');
  const env = { ...process.env, KARTA3_ENV: 'test', KARTA3_STATISTICS_DIRECTORY: root, KARTA3_STATISTICS_MODE: 'off' };
  const file = path.join(root, 'test', 'synthetic', 'agg-daily-v1.sqlite'); const now = Date.now(); const today = new Date(now).toISOString().slice(0, 10);
  const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);
  try {
    const initialize = `Date.now=()=>${now - 86_400_000}; process.argv=['node','statisticsMaintenanceCli','initialize']; await import(${JSON.stringify(pathToFileURL(path.resolve('dist-server/server/composition/statisticsMaintenanceCli.js')).href)});`;
    const init = await run(process.execPath, ['--input-type=module', '-e', initialize], { env }); // Solo reloj de preparación sustituido.
    expect(init.stdout.trim()).toBe('AGG_DAILY_V1_ADMINISTRATION_COMPLETE');
    // Dataset agregado fabricado, no se atribuye a una partida o a usuarios.
    const s = new AggregateStore({ file, environment: 'test', traffic: 'SYNTHETIC', now: now - 86_400_000 });
    const c = (family: Cell['family'], dimension: string, category: string, value = 1, measure = 'count'): Cell => ({ day: yesterday, family, dimension, category, value, measure });
    s.append([{ cells: [c('HOME', 'total', 'all'), c('CREATION', 'total', 'all'), c('WAITING', 'balance', 'created'), c('WAITING', 'balance', 'started'),
      c('JOIN', 'outcome', 'NEW_JOIN'), c('GAME', 'balance', 'started'), c('GAME', 'balance', 'DECK_COMPLETED'), c('CONFIGURATION', 'hostPlays', 'true'),
      c('DURATION', 'total', 'all'), c('DURATION', 'total', 'all', 60, 'seconds'), c('DURATION', 'bin', '1'),
      c('AUTOMATIC', 'balance', 'base'), c('AUTOMATIC', 'balance', 'closed'), c('APPEARANCE', 'balance', 'population'), c('APPEARANCE', 'balance', 'absent')], coverage: [] }], now);
    s.maintain(now); s.close(true);
    vi.stubEnv('KARTA3_ENV', 'test'); vi.stubEnv('KARTA3_STATISTICS_DIRECTORY', root);
    for (const report of reports) {
      const name = await statisticsCommand(['--report', report, '--from', yesterday, '--to', today, '--environment', 'test', '--format', 'csv'], true);
      expect(path.basename(name)).toBe(name); const text = await fs.readFile(path.join(path.dirname(file), name), 'utf8');
      expect(text).toContain('AGG_DAILY_V1'); expect(text).not.toMatch(/roomId|gameId|session|proofRef|eventId|visitId/);
    }
    await expect(statisticsCommand(['--report', 'access', '--from', today, '--to', new Date(now + 86_400_000).toISOString().slice(0, 10), '--environment', 'test', '--format', 'csv'], true)).rejects.toThrow('INVALID_FILTER');
    const maintained = await run(process.execPath, ['dist-server/server/composition/statisticsMaintenanceCli.js', 'maintain'], { env }); expect(maintained.stdout).toContain('AGG_DAILY_V1_ADMINISTRATION_COMPLETE');
    await expect(run(process.execPath, ['dist-server/server/composition/statisticsMaintenanceCli.js', 'initialize'], { env })).rejects.toThrow();
  } finally { vi.unstubAllEnvs(); await fs.rm(root, { recursive: true, force: true }); }
}, 20_000); // Nueve workers de lectura y ACL/CLI reales; no cambia tiempos del producto.
