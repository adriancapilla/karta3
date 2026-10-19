import { expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SqliteUsageWorker } from './sqliteWorker.js';

it('límite de consulta 5 s con worker sin respuesta y reloj controlado; no informe vacío', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-usage-unresponsive-')); let writer: SqliteUsageWorker | undefined;
  if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-usage-unresponsive-')) throw new Error('ruta');
  try {
    const infrastructure = path.join(root, 'server/infrastructure/usage'); const application = path.join(root, 'server/application/usage');
    await fs.mkdir(infrastructure, { recursive: true }); await fs.mkdir(application, { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await fs.copyFile('dist-server/server/infrastructure/usage/sqliteWorker.js', path.join(infrastructure, 'sqliteWorker.js'));
    await fs.copyFile('dist-server/server/infrastructure/usage/privateFiles.js', path.join(infrastructure, 'privateFiles.js'));
    await fs.copyFile('dist-server/server/application/usage/contracts.js', path.join(application, 'contracts.js'));
    // Solo esta instalación de prueba sustituye el worker; no toca el build del producto.
    await fs.writeFile(path.join(infrastructure, 'worker.js'), "import { parentPort } from 'node:worker_threads'; parentPort.postMessage({ready:true}); parentPort.on('message',()=>{});");
    const module = await import(pathToFileURL(path.join(infrastructure, 'sqliteWorker.js')).href) as { SqliteUsageWorker: typeof import('./sqliteWorker.js').SqliteUsageWorker };
    writer = new module.SqliteUsageWorker({ file: path.join(root, 'unused.sqlite'), environment: 'test' }); await writer.ready;
    vi.useFakeTimers();
    const assertion = expect(writer.read({ report: 'access', from: 0, to: 1, environment: 'test' }, true)).rejects.toMatchObject({ code: 'REPORT_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(4999); expect(writer.status().degraded).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await assertion; expect(writer.status().degraded).toBe(true);
  } finally {
    vi.useRealTimers(); await writer?.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
