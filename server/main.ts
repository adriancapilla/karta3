import { createServer } from 'node:http';
import path from 'node:path';
import { createRuntime } from './composition/createApp.js';
import { DeckLoadError, installationRoot, loadInstallationDecks, reportDeckDiagnostics } from './composition/decks.js';
import { attachPublicFiles } from './infrastructure/http/publicFiles.js';
import { createUsageRuntime } from './composition/usage.js';

try {
  const loaded = await loadInstallationDecks();
  reportDeckDiagnostics(loaded.diagnostics);
  const usage = await createUsageRuntime();
  const runtime = createRuntime({ decks: loaded.catalog, deckVersions: loaded.catalog, gameDecks: loaded.catalog, usage: usage.recorder, usageHttp: usage.http });
  attachPublicFiles(runtime.app, path.join(installationRoot, 'dist'), loaded.catalog);
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '127.0.0.1';
  const server = createServer(runtime.app);
  const realtime = runtime.attachRealtime(server);
  let stopping = false;
  const stop = () => {
    if (stopping) return; stopping = true;
    runtime.controlledStop(); runtime.dispose(); realtime.disconnectSockets(true);
    server.close(); server.closeAllConnections();
    void usage.close().finally(() => process.exit(0));
  };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
  server.listen(port, host, () => {
    const address = server.address();
    const boundHost = address && typeof address === 'object' ? address.address : host;
    console.log(`KARTA3: http://${boundHost.includes(':') ? `[${boundHost}]` : boundHost}:${address && typeof address === 'object' ? address.port : port}`);
  });
} catch (error) {
  if (error instanceof DeckLoadError) {
    reportDeckDiagnostics(error.diagnostics);
    for (const issue of error.errors) console.error(`[${issue.code}] ${issue.file} ${issue.path}: ${issue.message}`);
  } else console.error('No se pudo iniciar KARTA3.');
  process.exitCode = 1;
}
