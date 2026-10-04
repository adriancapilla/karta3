import { expect, test } from '@playwright/test';
import { configurationBrowserServer } from '../support/configurationBrowserServer';
import { manualTable, readGame } from '../support/manualBrowserCases';

for (const width of [390, 1280]) test(`B08 T1 ${width}: deadline estable, carta local ignorada, aviso y recuperación`, async ({ browser }, testInfo) => {
  const f = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, f.base, { width, deckId: 'manual', version: 7, turn: 15, review: 5 });
  try {
    const original = await readGame(p.host); const actor = p.actors.get(original.game.interaction.turn!.playerId)!;
    const own = await readGame(actor); const deadline = own.game.interaction.turn!.timing!.endsAt;
    await expect(actor.getByRole('timer')).toHaveText('00:15');
    await actor.locator(`.game-hand [data-card-id="${own.game.hand[1].id}"] .card-play-button`).click();
    expect(f.gameRequests).toHaveLength(0); f.time.elapse(14000); await actor.reload();
    await expect(actor.getByRole('timer')).toHaveText('00:01');
    expect((await readGame(actor)).game.interaction.turn!.timing!.endsAt).toBe(deadline);
    await actor.locator(`.game-hand [data-card-id="${own.game.hand[1].id}"] .card-play-button`).click();
    f.time.elapse(1000); await readGame(p.host); // lectura real aplica límite, sin disparar callback
    await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    const after = await readGame(actor);
    expect(after.game.round.plays[0]).toMatchObject({ card: { id: own.game.hand[0].id }, mode: 'TIMEOUT' });
    expect(after.game.ownConsecutiveTimeouts).toBe(1); expect(f.gameRequests).toHaveLength(0);
    await expect(p.host.locator('.activity')).toContainText('agotó el tiempo; se jugó su carta más antigua');
    expect((await readGame(p.host)).game.ownConsecutiveTimeouts).toBe(0);
    await actor.reload(); await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    await expect(actor.getByText('agotó el tiempo; se jugó su carta más antigua', { exact: false })).toHaveCount(0);
    await expect(actor.getByRole('button', { name: 'ALTO', exact: true })).toHaveCount(0);
    expect(await actor.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await actor.screenshot({ path: testInfo.outputPath(`B08-T1-${width}.png`), fullPage: true });
  } finally { await p.close(); await f.stop(); }
});
