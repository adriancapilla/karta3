import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { compiledInstallation, removeTestInstallation, startCompiledDeckServer } from '../support/compiledDeckServer.js';
import { manualTable, readGame } from '../support/manualBrowserCases.js';

test('B08-19/E7 15 segundos reales: transporte activo cerrado, observación y recuperación; APP normal sin ASSETS', async ({ browser }, testInfo) => {
  test.setTimeout(60_000);
  const root = await compiledInstallation(); let server: Awaited<ReturnType<typeof startCompiledDeckServer>> | undefined;
  let table: Awaited<ReturnType<typeof manualTable>> | undefined;
  try {
    const { prepareDecks } = await import('../../dist-server/server/infrastructure/decks/catalog.js');
    await fs.cp(path.resolve('barajas/generica'), path.join(root, 'barajas/generica'), { recursive: true });
    await prepareDecks(path.join(root, 'barajas')); server = await startCompiledDeckServer(root);
    table = await manualTable(browser, server.base, { width: 390, turn: 15, review: 5 });
    const actor = table.pages[1]; const original = await readGame(actor); const timing = original.game.interaction.turn!.timing!;
    const gameId = original.game.id; const turnId = original.game.interaction.turn!.id;
    expect(timing.endsAt - timing.startedAt).toBe(15000); expect(original.game.execution).toBe('TIMED_TURNS');
    const closedAt = Date.now(); await actor.close(); // Cierra realmente el WebSocket; la cookie/contexto se conserva.
    await expect.poll(async () => (await readGame(table!.host)).participants.find((p) => p.id === original.participant.id)!.presence).toBe('DISCONNECTED');
    await expect(table.host.locator('.activity')).toContainText('agotó el tiempo; se jugó su carta más antigua', { timeout: 20_000 });
    const observedAt = Date.now(); const observed = await readGame(table.host);
    expect(observed.game.id).toBe(gameId); expect(observed.game.round.plays[0]).toMatchObject({ playerId: original.participant.id, mode: 'TIMEOUT', card: { id: original.game.hand[0].id } });
    expect(observedAt).toBeGreaterThanOrEqual(timing.endsAt); expect(observedAt - closedAt).toBeGreaterThan(12000);
    expect(server.child.exitCode).toBeNull();
    const recovered = await table.contexts[1].newPage(); await recovered.goto(server.base);
    await expect(recovered.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    const current = await readGame(recovered);
    expect(current.game.id).toBe(gameId); expect(current.participant.id).toBe(original.participant.id);
    expect(current.game.ownConsecutiveTimeouts).toBe(1); expect(current.game.hand).toEqual(original.game.hand.slice(1));
    expect(current.game.interaction.turn!.id).not.toBe(turnId);
    expect(await fs.access(path.join(root, 'asset-access.txt')).then(() => true, () => false)).toBe(false);
    expect(server.errors()).toBe('');
    const evidence = { clock: 'SystemClock', scheduler: 'TimerScheduler', entropy: 'CryptoCardPermutation', package: 'generica/2',
      roomId: original.id, gameId, playerId: original.participant.id, turnId, startedAt: new Date(timing.startedAt).toISOString(),
      endsAt: new Date(timing.endsAt).toISOString(), transportClosedAt: new Date(closedAt).toISOString(), observedAt: new Date(observedAt).toISOString(),
      observedAfterLimitMs: observedAt - timing.endsAt, counter: current.game.ownConsecutiveTimeouts, recoveredPlayerId: current.participant.id };
    console.log('B08_REAL_EXPIRY ' + JSON.stringify(evidence));
    await testInfo.attach('B08-real-expiry.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
    await recovered.screenshot({ path: testInfo.outputPath('B08-real-recovered-390.png'), fullPage: true });
  } finally { await table?.close(); await server?.stop(); await removeTestInstallation(root); }
});
