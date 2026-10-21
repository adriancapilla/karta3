import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, humanPlay, readGame } from '../support/manualBrowserCases.js';
import { publicationState } from '../support/b20b21PublicationDiagnostics.js';
import { b11KeyboardObservation } from '../support/b11KeyboardObservation.js';

const before = process.env.B11_CAPTURE_BASE === '1';
const evidence = before ? path.resolve('playwright-report/b11/before') : path.resolve('playwright-report/b12/b11-regression');
async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y + scrollY, width: b.width, height: b.height, right: b.right, bottom: b.bottom + scrollY }; };
    const panels = Object.fromEntries(['people', 'plays', 'indicator', 'hand', 'initial-state'].map((key) => {
      const element = document.querySelector(`.game-${key}`); return [key, element ? box(element) : null];
    }));
    const cards = [...document.querySelectorAll('.game-layout .game-card')].filter((element) => element.getBoundingClientRect().width > 0).map((element) => ({
      ...box(element), area: element.closest('.game-hand') ? 'hand' : element.closest('.game-plays') ? 'plays' : 'indicator',
      title: element.querySelector('h3')?.textContent,
      content: [...element.querySelectorAll('h3,.card-round-attribute,.game-card-image,.game-card-image img,.game-card-image svg,table,.card-details-button')].map((child) => ({ tag: child.tagName, ...box(child), font: getComputedStyle(child).fontSize })),
      rows: [...element.querySelectorAll('tbody tr')].map((row) => ({ ...box(row), text: row.textContent, cells: [...row.children].map((cell) => ({ ...box(cell), font: getComputedStyle(cell).fontSize })) })),
      overflow: element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1
    }));
    const actions = [...document.querySelectorAll('.card-play-button')].map(box);
    const legend = document.querySelector('.game-legend'); const header = document.querySelector('.game-shell header')!;
    const hand = document.querySelector('.hand-row')!; const plays = document.querySelector('.played-row')!;
    return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scale: visualViewport?.scale },
      pageWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight,
      panels, cards, actions, game: box(document.querySelector('main.game-shell')!), statistics: box(document.querySelector('.usage-choice')!),
      header: box(header), legend: legend ? box(legend) : null,
      handOverflow: hand.scrollWidth - hand.clientWidth, playsOverflow: plays.scrollWidth - plays.clientWidth };
  });
}
type Measurement = Awaited<ReturnType<typeof measure>>;
function reference(sample: Measurement, review = false) {
  expect(sample.viewport).toEqual({ width: 1800, height: 1600, dpr: 1, scale: 1 });
  expect(sample.pageWidth).toBeLessThanOrEqual(1800); expect(sample.game.bottom).toBeLessThanOrEqual(1600);
  // Precisión del autor21/10: el bloque posterior puede alargar el documento,
  // pero no ocupar o tapar la composición de juego ni provocar overflow horizontal.
  expect(sample.statistics.y).toBeGreaterThanOrEqual(sample.game.bottom);
  expect(sample.statistics.x).toBeGreaterThanOrEqual(0); expect(sample.statistics.right).toBeLessThanOrEqual(1800);
  expect(sample.handOverflow).toBeLessThanOrEqual(1);
  // B12 limita Mesa a cuatro completas y permite consultar la quinta lateralmente.
  expect(sample.playsOverflow).toBe(sample.cards.filter((card) => card.area === 'plays').length === 5 ? 276 : 0);
  const panels = sample.panels; expect(Math.abs(panels.indicator!.y - panels.hand!.y)).toBeLessThanOrEqual(2);
  for (const card of sample.cards) {
    expect(card.width).toBe(230); expect(card.height).toBe(321); expect(card.overflow).toBe(false);
    for (const content of card.content) {
      expect(content.x).toBeGreaterThanOrEqual(card.x); expect(content.right).toBeLessThanOrEqual(card.right);
      expect(content.y).toBeGreaterThanOrEqual(card.y); expect(content.bottom).toBeLessThanOrEqual(card.bottom);
    }
    for (const row of card.rows) expect(row.height).toBeLessThan(36); // Generic names/values occupy one line.
  }
  for (const action of sample.actions) { expect(action.width).toBe(230); expect(action.bottom).toBeLessThanOrEqual(1600); }
  for (const panel of Object.values(panels)) if (panel) { expect(panel.right).toBeLessThanOrEqual(1800); expect(panel.bottom).toBeLessThanOrEqual(1600); }
  expect(sample.legend!.bottom).toBeLessThanOrEqual(1600);
  if (!review) expect(sample.cards.filter((card) => card.area === 'hand')).toHaveLength(3);
}
async function record(page: Page, name: string, review = false) {
  await page.evaluate(() => scrollTo(0, 0)); const sample = await measure(page);
  await fs.mkdir(evidence, { recursive: true });
  await fs.writeFile(path.join(evidence, `${name}.json`), JSON.stringify(sample, null, 2) + '\n');
  await page.screenshot({ path: path.join(evidence, `${name}-viewport.png`) });
  await page.screenshot({ path: path.join(evidence, `${name}-full.png`), fullPage: true });
  console.log(`B11_MEASURE ${name} ${JSON.stringify(sample)}`);
  if (!before) {
    try { reference(sample, review); }
    catch (error) { await publicationState(page, `B11-${name}`); throw error; }
    const privacy = page.getByRole('complementary', { name: 'Analítica y privacidad', exact: true }).getByRole('link', { name: 'Analítica y privacidad', exact: true });
    await privacy.scrollIntoViewIfNeeded(); await expect(privacy).toBeInViewport();
    await privacy.focus(); await expect(privacy).toBeFocused();
    await page.evaluate(() => scrollTo(0, 0));
  }
}
test.beforeAll(async () => {
  if (before) {
    const texts = await Promise.all(['src/GameScreen.tsx', 'src/GameCard.tsx', 'src/style.css'].map(async (file) => (await fs.readFile(file, 'utf8')).replace(/\r\n/g, '\n')));
    expect(createHash('sha256').update(texts.join('\n')).digest('hex')).toBe('6098056a678e0f57d78fd8be76752df95ef57e3f3c514c4f19c4d5cdda033d1c');
  }
});
for (const count of [2, 5]) test(`B11 reference ${count} humans: opening, subsequent, five public cards/review, one/two/three cards`, async ({ browser }) => {
  test.setTimeout(120_000);
  const s = await configurationBrowserServer(true, true, undefined, { generic: true });
  const p = await manualTable(browser, s.base, { count, width: 1800, deckId: 'generica', version: 4, turn: 60, review: 5, names: ['Lucía', 'Marcos', 'Sara', 'Diego'] });
  try {
    await Promise.all(p.pages.map((page) => page.setViewportSize({ width: 1800, height: 1600 })));
    await record(p.pages[1], `${count}-opening`);
    for (let index = 0; index < count - 1; index++) await humanPlay(p, index % 2 === 0);
    await record(p.host, `${count}-subsequent`);
    await humanPlay(p); await expect(p.host.locator('.round-review')).toBeVisible();
    await record(p.host, `${count}-review-two-cards`, true);
    if (!before && count === 2) {
      s.time.advance(5000);
      for (let guard = 0; guard < 80; guard++) {
        const view = await readGame(p.host);
        if (view.game.hand.length === 1) { await record(p.host, '2-final-one-card', true); break; }
        if (view.game.interaction.review) s.time.advance(5000); else await humanPlay(p);
        if (guard === 79) throw new Error('Legal trace did not reach one-card hand');
      }
    }
  } finally { await p.close(); await s.stop(); }
});

if (!before) {
  test('B11 card data and gestures: own triangle/active circle, Dato/J, outside action, drag, Details and one complete send', async ({ browser }) => {
    const s = await configurationBrowserServer(true, true, undefined, { distinct: true });
    const p = await manualTable(browser, s.base, { width: 1800, deckId: 'portada', version: 7, turn: 60 });
    try {
      const actor = p.pages[1]; await actor.setViewportSize({ width: 1800, height: 1600 });
      const view = await readGame(actor); expect(view.game.hand[0].roundAttribute).toBe('atributo2'); expect(view.game.round.activeAttributeId).toBe('atributo1');
      const slot = actor.locator('.game-hand .game-card-slot').first(); const card = slot.locator('.game-card');
      await expect(card.getByRole('img', { name: 'Atributo indicador: Magnitud 2' })).toHaveText('▲');
      await expect(card.locator('.active-attribute th')).toHaveAccessibleName('Magnitud 1, atributo activo');
      await expect(card.locator('tbody tr').first().locator('td')).toHaveText(['1']);
      const action = slot.locator('.card-play-button'); expect(await card.locator('.card-play-button').count()).toBe(0);
      expect((await action.boundingBox())!.y).toBeGreaterThanOrEqual((await card.boundingBox())!.y + (await card.boundingBox())!.height);
      const deadline = view.game.interaction.turn!.timing!.endsAt;
      await card.locator('.card-play-surface').click(); await expect(action).toHaveAttribute('aria-pressed', 'true'); expect(s.gameRequests).toHaveLength(0);
      const other = actor.locator('.game-hand .card-play-surface').nth(1); const bounds = (await other.boundingBox())!;
      await actor.mouse.move(bounds.x + 10, bounds.y + 20); await actor.mouse.down(); await actor.mouse.move(bounds.x + 80, bounds.y + 20, { steps: 8 }); await actor.mouse.up();
      await expect(action).toHaveAttribute('aria-pressed', 'true'); await expect(actor.locator('.game-hand .card-play-button').nth(1)).toHaveAttribute('aria-pressed', 'false');
      const details = card.locator('.card-details-button'); await details.press('Enter');
      await expect(actor.getByRole('dialog').locator('thead th')).toHaveText(['Atributo', 'Dato']);
      await expect(actor.getByRole('dialog').locator('tbody tr').first().locator('td')).toHaveText(['700 km']);
      await actor.getByRole('button', { name: 'Cerrar detalles' }).press('Escape'); await expect(details).toBeFocused();
      expect(s.gameRequests).toHaveLength(0); expect((await readGame(actor)).game.interaction.turn!.timing!.endsAt).toBe(deadline);
      await actor.getByRole('button', { name: 'ALTO', exact: true }).press('Space');
      await expect.poll(async () => (await readGame(p.host)).game.round.plays.length).toBe(1);
      expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(1);
      await p.host.locator('.game-hand .card-play-button').first().press('Enter');
      await expect(p.host.locator('.round-review')).toBeVisible(); expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(2);
      await fs.mkdir(evidence, { recursive: true }); await actor.screenshot({ path: path.join(evidence, 'distinct-data-review-viewport.png') });
    } finally { await p.close(); await s.stop(); }
  });
  for (const width of [390, 1280]) test(`B11 access ${width}: touch/keyboard, direction first, full data, scroll and focus`, async ({ browser }) => {
    const s = await configurationBrowserServer(true, true, undefined, { distinct: true });
    const p = await manualTable(browser, s.base, { width, deckId: 'portada', version: 7, turn: 60 });
    const observation = await b11KeyboardObservation(p.pages[1]);
    let completed = false;
    try {
      const actor = p.pages[1]; await actor.setViewportSize({ width, height: width === 390 ? 844 : 800 });
      let confirmDirection: (() => void) | undefined;
      if (width === 1280) s.interceptGame((event, _payload, deliver, result) => {
        if (event === 'game:opening-direction') confirmDirection = () => deliver(result);
        else deliver(result);
      });
      await actor.getByRole('button', { name: 'BAJO', exact: true }).click(); expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(0);
      if (width === 390) {
        const row = actor.locator('.hand-row'); await row.scrollIntoViewIfNeeded();
        const b = (await row.boundingBox())!; const input = await actor.context().newCDPSession(actor);
        await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + 220, y: b.y + 60 }] });
        for (const delta of [30, 60, 90, 120]) await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + 220 - delta, y: b.y + 60 }] });
        await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(0); await input.detach();
        await row.evaluate((element) => { element.scrollLeft = 0; });
      }
      const details = actor.locator('.game-hand .card-details-button').first(); await details.click(); await expect(actor.getByRole('dialog')).toContainText('700 km');
      await actor.getByRole('button', { name: 'Cerrar detalles' }).press('Escape');
      await expect(actor.locator('.card-details-dialog')).toHaveCount(0); await expect(details).toBeFocused();
      const surface = actor.locator('.game-hand .card-play-surface').first();
      const playButton = actor.locator('.game-hand .card-play-button').first();
      if (width === 1280) {
        // Esperar el ack: un botón deshabilitado no puede recibir foco de teclado.
        await expect(playButton).toBeDisabled();
        expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(0);
        await expect.poll(() => Boolean(confirmDirection)).toBe(true);
        await observation.mark('before-direction-ack'); confirmDirection!();
      }
      await expect(actor.getByRole('button', { name: 'BAJO', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(playButton).toBeEnabled();
      await observation.mark('before-activation');
      if (width === 390) { await surface.scrollIntoViewIfNeeded(); const b = (await surface.boundingBox())!; await actor.touchscreen.tap(b.x + 20, b.y + 20); }
      else await playButton.press('Space');
      await observation.mark('after-activation');
      await expect.poll(async () => (await readGame(p.host)).game.round.plays.length).toBe(1);
      expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(1);
      expect(await actor.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await fs.mkdir(evidence, { recursive: true }); await actor.evaluate(() => scrollTo(0, 0));
      const sample = await measure(actor); await fs.writeFile(path.join(evidence, `${width}-access.json`), JSON.stringify(sample, null, 2));
      await actor.screenshot({ path: path.join(evidence, `${width}-access-full.png`), fullPage: true });
      completed = true;
    } finally { try { await observation.save(width, s.gameRequests, completed ? 'completed' : 'failed'); } finally { await p.close(); await s.stop(); } }
  });
  test('B11 observer and repeated long names: separate O, no hand, public cards, compact roster', async ({ browser }) => {
    const s = await configurationBrowserServer(true, true, undefined, { generic: true });
    const p = await manualTable(browser, s.base, { width: 1800, observer: true, count: 2, names: ['María Alejandra', 'María Alejandra'], turn: 60 });
    try {
      await p.host.setViewportSize({ width: 1800, height: 1600 });
      await expect(p.host.locator('.game-players strong')).toHaveText(['María Alejandra (1)', 'María Alejandra (2)']);
      await expect(p.host.locator('.observer-line')).toContainText('Jugador 1 (tú) (O)');
      await expect(p.host.locator('.observer-abbreviation')).toHaveAccessibleName('Observador');
      await expect(p.host.getByText('Observando', { exact: true })).toBeVisible();
      expect((await readGame(p.host)).game.hand).toEqual([]); await expect(p.host.locator('.game-hand')).toHaveCount(0);
      await expect(p.host.locator('.host-badge')).not.toBeVisible();
      await humanPlay(p); await humanPlay(p); await expect(p.host.locator('.round-review')).toBeVisible();
      await fs.mkdir(evidence, { recursive: true }); await p.host.screenshot({ path: path.join(evidence, 'observer-repeat-review-viewport.png') });
    } finally { await p.close(); await s.stop(); }
  });
}
