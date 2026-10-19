import { expect, test, type Page } from '@playwright/test';
import { usageInstallation } from '../support/usageCompiledServer.js';
import { manualTable, humanPlay, readRoom } from '../support/manualBrowserCases.js';

/** Datos HUMAN fabricados y aislados; main compilado y aviso factual completo, sin activar tráfico real. */
async function accept(pages: readonly Page[]) {
  for (const page of pages) {
    const area = page.getByRole('complementary', { name: 'Analítica y privacidad' });
    await expect(area.getByRole('button', { name: 'Rechazar analítica', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    const buttons = await area.locator('button.secondary').evaluateAll(items => items.map(item => {
      const style = getComputedStyle(item); return { color: style.color, background: style.backgroundColor, font: style.fontSize, height: item.getBoundingClientRect().height };
    }));
    expect(buttons).toHaveLength(2); expect(buttons[0]).toEqual(buttons[1]);
    await area.getByRole('button', { name: 'Aceptar analítica', exact: true }).focus(); await page.keyboard.press('Enter');
    await expect(area.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
  }
}
for (const width of [390, 1280]) test(`H06 ${width}: elección/retirada propias en mesa, otra pestaña, Detalles/foco y F5`, async ({ browser }, testInfo) => {
  const installation = await usageInstallation({ human: true }); const server = await installation.start();
  const table = await manualTable(browser, server.base, { count: 2, width, turn: 60, review: 0, beforeCreate: accept });
  const tab = await table.contexts[0].newPage();
  try {
    await expect.poll(() => installation.events().filter(event => event.name === 'game_started').length).toBe(1);
    expect(installation.state().proofs).toHaveLength(2);
    await tab.goto(table.host.url()); await expect(tab.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
    expect(installation.state().proofs).toHaveLength(2);
    const own = await readRoom(table.host); if (own.status !== 'IN_GAME') throw new Error('mesa esperada');
    await table.host.locator('.game-hand').getByRole('button', { name: /^Detalles de / }).first().click();
    const dialog = table.host.getByRole('dialog'); await expect(dialog).toBeVisible();
    const focusBefore = await table.host.evaluate(() => document.activeElement?.textContent);
    await tab.getByRole('button', { name: 'Retirar permiso', exact: true }).click();
    await expect(tab.getByRole('complementary', { name: 'Analítica y privacidad' })).toContainText('Analítica rechazada');
    await expect(table.host.getByRole('complementary', { name: 'Analítica y privacidad' })).toContainText('Analítica rechazada');
    await expect(table.pages[1].getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
    await expect(dialog).toBeVisible(); expect(await table.host.evaluate(() => document.activeElement?.textContent)).toBe(focusBefore);
    const after = await readRoom(table.host); if (after.status !== 'IN_GAME') throw new Error('mesa conservada');
    expect(after.game.id).toBe(own.game.id); expect(after.game.hand).toEqual(own.game.hand);
    expect(after.game.interaction.turn?.timing?.endsAt).toBe(own.game.interaction.turn?.timing?.endsAt);
    await expect.poll(() => installation.state().subjects.find(subject => subject.kind === 'game')?.state).toBe('OBSERVATION_CENSORED');
    await table.host.reload(); await expect(table.host.getByRole('complementary', { name: 'Analítica y privacidad' })).toContainText('Analítica rechazada');
    expect(await table.host.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await tab.screenshot({ path: `playwright-report/b19/eleccion-${width}.png`, fullPage: true });
    testInfo.annotations.push({ type: 'montaje', description: 'Datos HUMAN fabricados; main/aviso compilados, reloj y entropía normales; no activación pública.' });
  } finally { await table.close(); await server.stop(); await installation.cleanup(); }
});

test('H06 retirada sin red sigue pendiente: no reenvío automático ni BROWSER al volver señal positiva', async ({ browser }) => {
  const installation = await usageInstallation({ human: true }); const server = await installation.start();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await context.newPage();
  const events: string[] = []; const contexts: (string | undefined)[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/usage/events')) events.push(request.postData() ?? '');
    if (request.url().endsWith('/api/rooms') && request.method() === 'POST') contexts.push(request.headers()['x-karta3-usage-context']);
  });
  try {
    await page.goto(server.base); await accept([page]); await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    await context.setOffline(true); await page.getByRole('button', { name: 'Retirar permiso', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'Analítica y privacidad' })).toContainText('Retirada pendiente; no se ha podido confirmar en el servidor');
    const before = events.length; await context.setOffline(false);
    await expect(page.getByRole('button', { name: 'Cerrar sala', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Cerrar sala', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, cerrar sala', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    expect(contexts.at(-1)).toBeUndefined(); expect(events).toHaveLength(before);
    await expect(page.getByRole('complementary', { name: 'Analítica y privacidad' })).toContainText('Retirada pendiente');
    await page.getByRole('button', { name: 'Retirar permiso', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'Analítica y privacidad' })).toContainText('Analítica rechazada');
  } finally { await context.close(); await server.stop(); await installation.cleanup(); }
});

test('H03 HUMAN fabricado completo con bots normales: resultado/F5, retirada final y otra sala sin backfill', async ({ browser }) => {
  test.setTimeout(120_000); // Partida completa con gestos normales; el turno sigue siendo60 s.
  const installation = await usageInstallation({ human: true }); const server = await installation.start();
  const table = await manualTable(browser, server.base, { count: 1, bots: ['EASY', 'HARD'], width: 1280, review: 0, turn: 60, beforeCreate: accept });
  try {
    for (let step = 0; step < 58; step++) {
      await expect.poll(async () => { const room = await readRoom(table.host); return room.status !== 'IN_GAME' || !!room.game.interaction.turn && table.actors.has(room.game.interaction.turn.playerId); }).toBe(true);
      if ((await readRoom(table.host)).status !== 'IN_GAME') break;
      await humanPlay(table, step % 2 === 0, step % 2 === 0 ? 'HIGH' : 'LOW');
    }
    const result = await readRoom(table.host); expect(result.status).toBe('RESULTS');
    await expect.poll(() => installation.events().filter(event => event.name === 'game_ended').length).toBe(1);
    await table.host.reload(); await expect(table.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    await table.host.getByRole('button', { name: 'Retirar permiso', exact: true }).click();
    await expect(table.host.getByRole('complementary', { name: 'Analítica y privacidad' })).toContainText('Analítica rechazada');
    expect(installation.state().subjects.find(subject => subject.kind === 'game')?.state).toBe('DECK_COMPLETED');
    await table.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await table.host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(table.host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    expect(installation.events().filter(event => event.name === 'room_created')).toHaveLength(1);
  } finally { await table.close(); await server.stop(); await installation.cleanup(); }
});

test('H04 HUMAN fabricado → parada controlada → OFF: mismo histórico, sin permiso ni partida recuperados', async ({ browser }) => {
  const installation = await usageInstallation({ human: true }); let server = await installation.start();
  const table = await manualTable(browser, server.base, { count: 1, bots: ['EASY'], width: 390, review: 0, turn: 60, beforeCreate: accept });
  try {
    await expect.poll(() => installation.events().filter(event => event.name === 'game_started').length).toBe(1);
    const previous = await readRoom(table.host); if (previous.status !== 'IN_GAME') throw new Error('partida esperada');
    await server.stop();
    expect(installation.events().filter(event => event.name === 'game_ended')).toMatchObject([{ data: { reason: 'TECHNICAL_INTERRUPTION', evidence: 'CONTROLLED_SERVER_STOP' } }]);
    const durable = installation.events(); const proofs = installation.state().proofs;
    server = await installation.start(false, Number(new URL(server.base).port));
    await table.host.reload(); await expect(table.host.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    const response = await table.host.request.get(`${server.base}/api/usage/choice`);
    expect(response.headers()['x-karta3-usage-collection']).toBe('off');
    expect(await response.json()).toMatchObject({ available: false, decision: 'UNDECIDED' });
    expect(installation.state().proofs).toEqual(proofs); // El recibo histórico no restaura autorización RAM.
    await table.host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(table.host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    expect((await readRoom(table.host)).id).not.toBe(previous.id); expect(installation.events()).toEqual(durable);
  } finally { await table.close(); await server.stop(); await installation.cleanup(); }
});
