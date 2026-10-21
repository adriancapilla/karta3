import { test, expect } from '@playwright/test';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, readGame } from '../support/manualBrowserCases.js';
import { b11KeyboardObservation } from '../support/b11KeyboardObservation.js';

for (const ready of [false, true]) test(`B11 Space causal polling: dirección confirmada, escritura ${ready ? 'terminada' : 'retenida'}`, async ({ browser }) => {
  const s = await configurationBrowserServer(true, true, undefined, { distinct: true });
  s.pollingOnly();
  let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; });
  let actualPostAccepted = false, postFinished = false;
  let confirmDirection: (() => void) | undefined;
  s.interceptGame((event, _payload, deliver, result) => {
    if (event === 'game:opening-direction') confirmDirection = () => deliver(result);
    else deliver(result);
  });
  const p = await manualTable(browser, s.base, { width: 1280, deckId: 'portada', version: 7, turn: 60,
    beforeCreate: async pages => {
      const actor = pages[1];
      actor.on('requestfinished', request => { if (request.method() === 'POST' && request.postData()?.includes('"game:opening-direction"')) postFinished = true; });
      await actor.route('**/socket.io/**', async route => {
        if (route.request().method() !== 'POST' || !route.request().postData()?.includes('"game:opening-direction"')) { await route.continue(); return; }
        const response = await route.fetch(); expect(response.status()).toBe(200);
        actualPostAccepted = true; await held; await route.fulfill({ response });
      });
    }
  });
  const actor = p.pages[1], observation = await b11KeyboardObservation(actor); let completed = false;
  try {
    const before = await readGame(actor);
    await actor.getByRole('button', { name: 'BAJO', exact: true }).click();
    const details = actor.locator('.game-hand .card-details-button').first();
    await details.click(); await expect(actor.getByRole('dialog')).toContainText('700 km');
    await actor.getByRole('button', { name: 'Cerrar detalles' }).press('Escape');
    await expect(actor.locator('.card-details-dialog')).toHaveCount(0); await expect(details).toBeFocused();
    await expect.poll(() => actualPostAccepted && !!confirmDirection).toBe(true);
    const play = actor.locator('.game-hand .card-play-button').first(); await expect(play).toBeDisabled();
    confirmDirection!();
    await expect(actor.getByRole('button', { name: 'BAJO', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(play).toBeEnabled(); expect(postFinished).toBe(false);
    if (ready) { release(); await expect.poll(() => postFinished).toBe(true); }
    await actor.bringToFront(); await play.focus(); await expect(play).toBeFocused(); await expect(play).toBeEnabled();
    await observation.mark(ready ? 'write-finished-before-Space' : 'write-held-before-Space');
    await actor.keyboard.press('Space');
    const input = await actor.evaluate(() => {
      const events = (window as unknown as { b11Observation: { type?: string; key?: string; trusted?: boolean;
        target?: { className?: string; disabled?: boolean; cardId?: string }; active?: { className?: string; cardId?: string } }[] }).b11Observation;
      return events.filter(event => ['keydown', 'keyup', 'click'].includes(event.type ?? '') && event.target?.className?.includes('card-play-button'));
    });
    expect(input).toMatchObject([
      { type: 'keydown', key: ' ', trusted: true, target: { disabled: false, cardId: before.game.hand[0].id }, active: { cardId: before.game.hand[0].id } },
      { type: 'keyup', key: ' ', trusted: true, target: { disabled: false, cardId: before.game.hand[0].id }, active: { cardId: before.game.hand[0].id } },
      { type: 'click', trusted: true, target: { disabled: false, cardId: before.game.hand[0].id } }
    ]);
    if (!ready) {
      release(); await expect.poll(() => postFinished).toBe(true);
      await expect(actor.getByRole('alert')).toHaveText('No se pudo confirmar la acción. Recupera la mesa antes de reintentar.');
      expect(s.gameRequests.filter(event => event.event === 'game:play')).toHaveLength(0);
      expect((await readGame(p.host)).game.round.plays).toEqual([]);
    } else {
      await expect.poll(async () => (await readGame(p.host)).game.round.plays.length).toBe(1);
      expect(s.gameRequests.filter(event => event.event === 'game:play')).toHaveLength(1);
      expect((await readGame(p.host)).game.round.plays[0].card.id).toBe(before.game.hand[0].id);
    }
    await observation.mark(ready ? 'causal-write-finished-result' : 'causal-write-held-result'); completed = true;
  } finally {
    release();
    try { await observation.save(1280, s.gameRequests, completed ? 'completed' : 'failed', ready ? 'write-finished' : 'write-held'); }
    finally { await p.close(); await s.stop(); }
  }
});
