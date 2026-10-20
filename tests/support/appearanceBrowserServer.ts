import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { ControlledTime } from './controlledTime.js';
import type { UsageEvent } from '../../server/application/usage/contracts.js';

/** Producto compilado y HTTP/sockets/SQLite reales; solo reloj/planificador sustituidos. */
export async function appearanceBrowserServer() {
  const { createRuntime } = await import('../../dist-server/server/composition/createApp.js');
  const { createUsageRuntime } = await import('../../dist-server/server/composition/usage.js');
  const { loadInstallationDecks } = await import('../../dist-server/server/composition/decks.js');
  const { attachPublicFiles } = await import('../../dist-server/server/infrastructure/http/publicFiles.js');
  const { privateDirectory } = await import('../../dist-server/server/infrastructure/usage/privateFiles.js');
  const { privacyNotice } = await import('../../dist-server/shared/contracts/privacyNotice.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b20-browser-')); const secret = path.join(root, 'secret'); privateDirectory(secret, true);
  const key = path.join(secret, 'copy.key'); await fs.writeFile(key, randomBytes(32).toString('hex'), { mode: 0o600 });
  const time = new ControlledTime(); const previous = { ...process.env };
  let usage: Awaited<ReturnType<typeof createUsageRuntime>>;
  try {
    Object.assign(process.env, { KARTA3_ENV: 'pruebas', KARTA3_USAGE_COLLECTION: 'human', KARTA3_USAGE_DIRECTORY: root, KARTA3_USAGE_BACKUP_KEY_FILE: key });
    usage = await createUsageRuntime(privacyNotice.complete, { clock: time, scheduler: time });
  } finally {
    for (const name of ['KARTA3_ENV', 'KARTA3_USAGE_COLLECTION', 'KARTA3_USAGE_DIRECTORY', 'KARTA3_USAGE_BACKUP_KEY_FILE']) {
      if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    }
  }
  const loaded = await loadInstallationDecks();
  const runtime = createRuntime({ decks: loaded.catalog, deckVersions: loaded.catalog, gameDecks: loaded.catalog, clock: time, scheduler: time,
    usage: usage.recorder, usageHttp: usage.http, usageChoices: usage.choices, production: false });
  attachPublicFiles(runtime.app, path.resolve('dist'), loaded.catalog);
  const server = createServer(runtime.app); const io = runtime.attachRealtime(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw Error('puerto propio');
  const file = path.join(root, 'pruebas', 'human', 'usage.sqlite');
  const events = () => { const db = new DatabaseSync(file, { readOnly: true }); try {
    return db.prepare('SELECT payload FROM events ORDER BY rowid').all().map(row => JSON.parse(String(row.payload)) as UsageEvent);
  } finally { db.close(); } };
  return { base: `http://127.0.0.1:${address.port}`, time, events, usage, stop: async () => {
    runtime.dispose(); io.engine.close(); const closed = new Promise<void>(resolve => server.close(() => resolve())); server.closeAllConnections(); await closed;
    await io.close(); await usage.close();
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b20-browser-')) throw Error('ruta propia');
    await fs.rm(root, { recursive: true, force: true });
  } };
}
