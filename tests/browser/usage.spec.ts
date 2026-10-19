import { expect, test } from '@playwright/test';
import { usageInstallation } from '../support/usageCompiledServer.js';
import { readRoom, manualTable, humanPlay } from '../support/manualBrowserCases.js';

for (const width of [390, 1280]) test(`B18 ${width}: portada/gestos/dos sesiones/pestañas/F5 y privacidad con compilado sintético`, async ({ browser }) => {
  const installation = await usageInstallation(); const server = await installation.start();
  const hostContext = await browser.newContext({ viewport: { width, height: 844 } }); const guestContext = await browser.newContext({ viewport: { width, height: 844 } });
  const host = await hostContext.newPage(); const guest = await guestContext.newPage();
  try {
    await Promise.all([host.goto(server.base), guest.goto(server.base)]);
    await expect(host.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await expect.poll(() => installation.events().filter((e) => e.name === 'home_viewed').length).toBe(2);
    const initialHostView = installation.events().find((e) => e.name === 'home_viewed')!;
    expect(initialHostView.source).toBe('BROWSER');
    await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    const code = (await host.locator('.code').textContent())!;
    await guest.getByLabel('Código de sala').fill(code); await guest.getByLabel('Tu nombre', { exact: true }).fill('Sintética');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click(); await expect(guest.getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
    const tab = await hostContext.newPage(); await tab.goto(host.url());
    await expect(tab.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible(); await host.reload(); await guest.reload();
    await expect(host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    await expect.poll(() => installation.events().filter((e) => e.name === 'room_join_resolved').length).toBe(1);
    const events = installation.events();
    expect(events.filter((e) => e.name === 'home_viewed')).toHaveLength(2); // Recuperación directa, no portada.
    expect(events.filter((e) => e.name === 'room_created')).toHaveLength(1);
    expect(events.filter((e) => e.name === 'room_create_intended')).toHaveLength(1);
    expect(events.filter((e) => e.name === 'room_join_attempted')).toHaveLength(1);
    const created = events.find((e) => e.name === 'room_created')!;
    const intended = events.find((e) => e.name === 'room_create_intended')!;
    expect(created.data.intentId).toBe(intended.data.intentId);
    const current = await readRoom(host); expect(JSON.stringify(current)).not.toMatch(/visitId|intentId|bootRef|roomRef|participationRef/);
    const stored = JSON.stringify(events); for (const excluded of [code, current.id, 'Sintética', 'karta3_session', 'requestId', 'hand', '127.0.0.1']) expect(stored).not.toContain(excluded);
    for (const route of ['/usage', '/usage-data', '/backups', '/exports', '/usage.sqlite', '/usage.sqlite-wal', '/usage.sqlite-shm']) {
      const response = await host.request.get(server.base + route); expect(response.status()).toBe(404);
    }
    const storage = await host.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), cookie: document.cookie }));
    expect(JSON.stringify(storage)).not.toMatch(/visitId|intentId|usage/i);
    expect(await host.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await Promise.all([hostContext.close(), guestContext.close()]); await server.stop(); await installation.cleanup(); }
});

test('B18 documento/F5/SPA y ejecución normal apagada', async ({ browser }) => {
  const installation = await usageInstallation(); const server = await installation.start(); const context = await browser.newContext(); const page = await context.newPage();
  try {
    await page.goto(server.base); await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await expect.poll(() => installation.events().filter((e) => e.name === 'home_viewed').length).toBe(1);
    await page.reload(); await expect.poll(() => installation.events().filter((e) => e.name === 'home_viewed').length).toBe(2);
    const views = installation.events().filter((e) => e.name === 'home_viewed'); expect(new Set(views.map((e) => e.visitId)).size).toBe(2);
    expect(views.map((e) => e.data.navigation)).toContain('DOCUMENT_RELOAD');
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await page.getByRole('button', { name: 'Cerrar sala', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, cerrar sala', exact: true }).click();
    await expect.poll(() => installation.events().filter((e) => e.name === 'home_viewed').length).toBe(3);
    expect(installation.events().filter((e) => e.name === 'home_viewed').at(-1)?.data.navigation).toBe('SPA_RETURN');
  } finally { await context.close(); await server.stop(); }
  const off = await installation.start(false); const normal = await browser.newContext(); const normalPage = await normal.newPage(); let posts = 0;
  normalPage.on('request', (request) => { if (request.url().endsWith('/api/usage/events')) posts++; });
  try { const before = installation.events().length; await normalPage.goto(off.base); await normalPage.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(normalPage.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible(); expect(posts).toBe(0); expect(installation.events()).toHaveLength(before);
  } finally { await normal.close(); await off.stop(); await installation.cleanup(); }
});

test('B18 partida completa normal con dos humanos y bot: terminal durable único, F5 y otra sala', async ({ browser }) => {
  test.setTimeout(120_000); // Partida completa por gestos; el turno conserva sus 60 s configurados.
  const installation = await usageInstallation(); const server = await installation.start();
  const table = await manualTable(browser, server.base, { count: 2, bots: ['HARD'], review: 0, turn: 60, width: 1280 });
  const tab = await table.contexts[0].newPage(); let moves = 0;
  try {
    await tab.goto(server.base);
    for (;;) {
      await expect.poll(async () => { const room = await readRoom(table.host);
        return room.status !== 'IN_GAME' || !!room.game.interaction.turn && table.actors.has(room.game.interaction.turn.playerId);
      }).toBe(true);
      const room = await readRoom(table.host); if (room.status !== 'IN_GAME') break;
      await humanPlay(table, moves % 2 === 0, moves % 2 ? 'LOW' : 'HIGH'); moves++;
      if (moves === 4) { await table.host.reload(); await tab.reload(); }
    }
    const result = await readRoom(table.host); expect(result.status).toBe('RESULTS');
    if (result.status !== 'RESULTS') throw new Error('resultado esperado');
    expect(result.result.endReason).toBe('DECK_COMPLETED'); expect(moves).toBe(30);
    expect(result.result.standings.reduce((sum, person) => sum + person.score, 0)).toBe(45);
    await expect.poll(() => installation.events().filter((e) => e.name === 'game_ended').length).toBe(1);
    const facts = installation.events(); const starts = facts.filter((e) => e.name === 'game_started'); const ends = facts.filter((e) => e.name === 'game_ended');
    expect(starts).toHaveLength(1); expect(ends).toHaveLength(1);
    expect(starts[0].data.configuration).toMatchObject({ deckId: 'generica', deckSchemaVersion: 2, deckContentVersion: 4,
      humanPlayerCount: 2, botCount: 1, botsByDifficulty: { EASY: 0, HARD: 1 }, reviewSeconds: 0, turnSeconds: 60 });
    expect(ends[0].data).toMatchObject({ reason: 'DECK_COMPLETED', evidence: 'GAME_RESULT', gameRef: starts[0].data.gameRef });
    expect(ends[0].data.durationMs).toBeGreaterThan(0); expect(facts.filter((e) => e.name === 'human_became_automatic')).toHaveLength(0);
    for (const page of table.pages) { await page.reload(); await expect(page.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible(); }
    await table.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible(); await tab.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(table.host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await expect.poll(() => installation.events().filter((e) => e.name === 'room_created').length).toBe(2);
    expect(installation.events().filter((e) => e.name === 'game_ended')).toHaveLength(1);
    for (const excluded of ['Persona 1', 'Jugador 1', result.result.gameId]) expect(JSON.stringify(installation.events())).not.toContain(excluded);
  } finally { await table.close(); await server.stop(); await installation.cleanup(); }
});
