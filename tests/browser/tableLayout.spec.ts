import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { humanPlay, manualTable, readGame } from '../support/manualBrowserCases.js';

// Capture the compiled base before editing CSS; expected content/styles are never regenerated at verification.
const captureBase = process.env.B10_CAPTURE_BASE === '1';
const evidence = captureBase ? path.resolve('playwright-report/b10/before') : path.resolve('playwright-report/b12/b10-regression');
const sizes = [[1280, 800], [1366, 768], [1536, 1024], [360, 800], [390, 844], [760, 800], [761, 800]];
const panels = ['people', 'plays', 'indicator', 'hand', 'initial-state'] as const;
async function measure(page: Page) {
  return page.evaluate((panels) => {
    const boxes = Object.fromEntries(panels.map((panel) => {
      const element = document.querySelector<HTMLElement>(`.game-${panel}`)!;
      const box = element.getBoundingClientRect();
      return [panel, { x: box.x, y: box.y + scrollY, width: box.width, height: box.height, bottom: box.bottom + scrollY }];
    }));
    const selectors = ['.game-panel h2', '.game-players li', '.game-people .badge', '.hand-row .game-card', '.game-card h3', '.game-card-image', '.card-values', '.card-values thead th', '.card-values td', '.card-details-button', '.game-initial-state fieldset button'];
    const styles = Object.fromEntries(selectors.map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return [selector, null];
      const style = getComputedStyle(element);
      return [selector, Object.fromEntries(['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'borderRadius', 'flexBasis', 'flexGrow', 'flexShrink'].map((key) => [key, style[key as keyof CSSStyleDeclaration]]))];
    }));
    // Public text only, excluding live countdown. IDs/credentials/private packets are never saved.
    const content = Object.fromEntries(['.game-shell header', '.game-shell h1', '.game-summary', '.game-people', '.game-plays', '.game-indicator', '.game-hand'].map((selector) => [selector, document.querySelector<HTMLElement>(selector)!.innerText]));
    const header = document.querySelector('header')!.getBoundingClientRect();
    const summary = document.querySelector('.game-summary')!.getBoundingClientRect();
    return { boxes, styles, content, header: { x: header.x, y: header.y + scrollY }, summary: { x: summary.x, y: summary.y + scrollY },
      viewport: { width: innerWidth, height: innerHeight }, pageWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight, scrollX, stateCount: document.querySelectorAll('.game-initial-state').length };
  }, [...panels]);
}
type Measurement = Awaited<ReturnType<typeof measure>>;
function geometry(sample: Measurement, mobile: boolean) {
  const { people, plays, indicator, hand, 'initial-state': state } = sample.boxes;
  const aligned = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(2);
  expect(sample.stateCount).toBe(1); expect(sample.pageWidth).toBeLessThanOrEqual(sample.viewport.width); expect(sample.scrollX).toBe(0);
  if (mobile) {
    aligned(people.y, state.y); expect(people.x + people.width).toBeLessThanOrEqual(state.x);
    expect(indicator.y).toBeGreaterThanOrEqual(Math.max(people.bottom, state.bottom));
    expect(plays.y).toBeGreaterThanOrEqual(indicator.bottom); expect(hand.y).toBeGreaterThanOrEqual(plays.bottom);
    aligned(indicator.x, people.x); aligned(plays.width, indicator.width); aligned(hand.width, indicator.width);
  } else {
    aligned(people.y, plays.y); expect(people.x + people.width).toBeLessThanOrEqual(plays.x);
    aligned(indicator.y, hand.y); aligned(hand.y, state.y);
    expect(hand.y).toBeGreaterThanOrEqual(Math.max(people.bottom, plays.bottom));
    expect(indicator.x + indicator.width).toBeLessThanOrEqual(hand.x); expect(hand.x + hand.width).toBeLessThanOrEqual(state.x);
    aligned(plays.x, hand.x); aligned(plays.x + plays.width, state.x + state.width);
  }
}
async function record(page: Page, name: string, width: number, height: number) {
  await page.evaluate(() => scrollTo(0, 0));
  const overflowing = await page.locator('.hand-row').evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  await expect(page.locator('.swipe-hint')).toHaveCount(overflowing ? 1 : 0);
  const sample = await measure(page); const file = `${width}x${height}-${name}`;
  await fs.mkdir(evidence, { recursive: true });
  if (!captureBase) {
    const bytes = (await fs.readFile(path.resolve('tests/fixtures/table-layout-f2d84fb.json'), 'utf8')).replace(/\r\n/g, '\n');
    expect(createHash('sha256').update(bytes).digest('hex')).toBe('0d8b973d73c51e88d7f4b1f5eddf8a8e42461b731141d542a560dfacc734bc4a');
    const frozen = JSON.parse(bytes) as { baseCommit: string; samples: Record<string, Measurement> };
    expect(frozen.baseCommit).toBe('f2d84fb71ccf489b4987928d3a09cde4eb6ad1cf');
    const base = frozen.samples[file];
    // B11 expressly replaces the PC header, roster, card table/size and labels.
    // Keep the historical reference immutable and retain unaffected text/font and geometry guarantees.
    for (const selector of ['.game-shell h1', '.game-summary']) expect(sample.content[selector]).toBe(base.content[selector]);
    for (const selector of ['.game-panel h2', '.game-card-image', '.card-values td', '.card-details-button']) {
      for (const key of ['fontFamily', 'fontSize', 'fontWeight']) expect(sample.styles[selector]?.[key]).toBe(base.styles[selector]?.[key]);
    }
    expect(sample.styles['.game-card h3']!.fontSize).toBe(width <= 760 ? '18px' : '16px');
    if (width <= 760) { expect(sample.header).toEqual(base.header); expect(sample.summary).toEqual(base.summary); }
    geometry(sample, width <= 760);
  }
  await fs.writeFile(path.join(evidence, `${file}.json`), `${JSON.stringify(sample, null, 2)}\n`);
  await page.screenshot({ path: path.join(evidence, `${file}-viewport.png`) });
  await page.screenshot({ path: path.join(evidence, `${file}-full.png`), fullPage: true });
  console.log(`B10_GEOMETRY ${file} ${JSON.stringify(sample.boxes)} pageHeight=${sample.pageHeight}`);
}
test.beforeAll(async () => {
  if (captureBase) expect(createHash('sha256').update((await fs.readFile('src/style.css', 'utf8')).replace(/\r\n/g, '\n')).digest('hex')).toBe('a00933484ee9c7676df79e850b676b387f86729253648f8cbed040ea0344dc20');
});
for (const [width, height] of sizes) test(`B10 base/comparison ${width}x${height}: opening and subsequent turn, five humans`, async ({ browser }) => {
  test.setTimeout(60_000);
  const server = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, server.base, { count: 5, width, deckId: 'portada', version: 7, turn: 60, review: 5, names: ['Lucía', 'Marcos', 'Sara', 'Diego'] });
  try {
    await Promise.all(p.pages.map((page) => page.setViewportSize({ width, height })));
    const opener = p.pages[1];
    await expect(opener.getByRole('button', { name: 'ALTO', exact: true })).toBeEnabled();
    await expect(opener.locator('.game-hand .card-play-button')).toHaveCount(3);
    await record(opener, 'opening', width, height);
    for (let play = 0; play < 4; play++) await humanPlay(p, play % 2 === 0);
    await expect(p.host.locator('.played-row .game-card')).toHaveCount(4);
    await expect(p.host.locator('.game-hand .card-play-button').first()).toBeEnabled();
    await record(p.host, 'subsequent', width, height);
    if (width === 1280 && !captureBase) {
      await humanPlay(p); await expect(p.host.locator('.round-review')).toBeVisible();
      expect((await readGame(p.host)).game.interaction.turn).toBeNull();
      geometry(await measure(p.host), false);
      await p.host.screenshot({ path: path.join(evidence, '1280x800-review-full.png'), fullPage: true });
    }
  } finally { await p.close(); await server.stop(); }
});

if (!captureBase) {
  for (const width of [360, 761]) test(`B10 long text ${width}: full names, attributes, literal units, images and controls stay consultable`, async ({ browser }) => {
    const server = await configurationBrowserServer(true, true, undefined, { longText: true });
    const p = await manualTable(browser, server.base, { count: 5, width, deckId: 'portada', version: 7, turn: 60, names: ['María Alejandra', 'Alejandro Pérez', 'Nombre muy largo', 'Diego Fernández'] });
    try {
      const actor = p.pages[1]; const current = await readGame(actor);
      await expect(actor.locator('.game-people')).toContainText('Nombre muy largo');
      const card = actor.locator('.game-hand .game-card').first();
      await expect(card).toContainText(current.game.attributes[0].name); await expect(card).toContainText(current.game.hand[0].values.atributo1.unit);
      await expect(actor.locator('.game-hand img').first()).toBeVisible(); await expect(actor.locator('.game-hand svg')).not.toHaveCount(0);
      const buttons = actor.locator('.game-initial-state button'); const bounds = (await actor.locator('.game-initial-state').boundingBox())!;
      for (const button of await buttons.all()) {
        const box = (await button.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(bounds.x); expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width);
      }
      geometry(await measure(actor), width <= 760);
      const details = card.locator('.card-details-button'); await details.press('Enter');
      await expect(actor.getByRole('dialog')).toContainText(current.game.hand[0].values.atributo1.unit);
      await actor.getByRole('button', { name: 'Cerrar detalles' }).press('Escape'); await expect(details).toBeFocused();
      await fs.mkdir(evidence, { recursive: true }); await actor.evaluate(() => scrollTo(0, 0));
      await actor.screenshot({ path: path.join(evidence, `${width}-long-viewport.png`) }); await actor.screenshot({ path: path.join(evidence, `${width}-long-full.png`), fullPage: true });
      console.log(`B10_LONG ${width} ${JSON.stringify((await measure(actor)).boxes)}`);
    } finally { await p.close(); await server.stop(); }
  });
  test('B10 cutoff: selection, details, focus, scroll and private partial survive resize and remote presence', async ({ browser }) => {
    const server = await configurationBrowserServer(true, true);
    const p = await manualTable(browser, server.base, { count: 2, width: 760, deckId: 'portada', version: 7, turn: 60 });
    const actor = p.pages[1];
    try {
      const before = await readGame(actor); const selected = actor.locator('.game-hand .card-play-button').first();
      await selected.press('Enter'); await expect(selected).toHaveAttribute('aria-pressed', 'true');
      const row = actor.locator('.hand-row'); await row.evaluate((element) => { element.scrollLeft = 6; });
      const offset = await row.evaluate((element) => element.scrollLeft); expect(offset).toBeGreaterThan(0);
      const details = actor.locator('.game-hand .card-details-button').first(); await details.press('Enter');
      const close = actor.getByRole('button', { name: 'Cerrar detalles', exact: true });
      for (const width of [761, 390, 1280, 760]) {
        await actor.setViewportSize({ width, height: 800 });
        await expect(close).toBeFocused(); await expect(actor.getByRole('dialog')).toBeVisible(); await expect(selected).toHaveAttribute('aria-pressed', 'true');
        const current = await readGame(actor); expect(current.game.round.plays).toEqual([]); expect(current.game.interaction.turn?.timing?.endsAt).toBe(before.game.interaction.turn?.timing?.endsAt);
        expect(await row.evaluate((element) => element.scrollLeft)).toBe(offset); geometry(await measure(actor), width <= 760);
      }
      await p.host.close(); await expect(actor.getByText('Sin conexión', { exact: true })).toBeVisible(); await expect(close).toBeFocused();
      await close.press('Escape'); await expect(details).toBeFocused(); await expect(selected).toHaveAttribute('aria-pressed', 'true');
      expect(server.gameRequests).toHaveLength(0);
      await actor.getByRole('button', { name: 'BAJO', exact: true }).press('Enter');
      await expect.poll(async () => (await readGame(actor)).game.round.plays.length).toBe(1);
      expect(server.gameRequests.filter((item) => item.event === 'game:play')).toHaveLength(1);
    } finally { await p.close(); await server.stop(); }
  });
  test('B10 mobile: table and hand scroll independently, waiting player blocked, Details does not play', async ({ browser }) => {
    const server = await configurationBrowserServer(true, true);
    const p = await manualTable(browser, server.base, { count: 5, width: 390, deckId: 'portada', version: 7, turn: 60 });
    try {
      for (let play = 0; play < 4; play++) await humanPlay(p);
      const played = p.host.locator('.played-row'); const hand = p.host.locator('.hand-row');
      for (const row of [played, hand]) expect(await row.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeGreaterThan(100);
      await hand.evaluate((element) => { element.scrollLeft = 50; }); await played.evaluate((element) => { element.scrollLeft = 100; });
      expect(await hand.evaluate((element) => element.scrollLeft)).toBe(50);
      await played.evaluate((element) => { element.scrollLeft = 180; }); expect(await hand.evaluate((element) => element.scrollLeft)).toBe(50);
      await hand.evaluate((element) => { element.scrollLeft = 80; }); expect(await played.evaluate((element) => element.scrollLeft)).toBe(180);
      await expect(p.pages[1].locator('.game-hand .card-play-button').first()).toBeDisabled();
      const count = server.gameRequests.length; const detail = p.host.locator('.played-row .card-details-button').first(); await detail.click();
      await p.host.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape'); await expect(detail).toBeFocused();
      expect(server.gameRequests).toHaveLength(count); expect(await hand.evaluate((element) => element.scrollLeft)).toBe(80);
      geometry(await measure(p.host), true);
    } finally { await p.close(); await server.stop(); }
  });
  for (const width of [390, 761, 1280]) test(`B10 observer ${width}: no fictitious hand, state beside players/mobile and indicator/PC`, async ({ browser }) => {
    const server = await configurationBrowserServer(true, true);
    const p = await manualTable(browser, server.base, { count: 2, observer: true, width, deckId: 'portada', version: 7, turn: 60, names: ['María Alejandra', 'Alejandro Pérez'] });
    try {
      await expect(p.host.locator('.game-hand')).toHaveCount(0); await expect(p.host.locator('.game-initial-state')).toHaveCount(1);
      expect((await readGame(p.host)).game.hand).toEqual([]); await expect(p.host.getByText('Observando', { exact: true })).toBeVisible();
      const people = (await p.host.locator('.game-people').boundingBox())!; const state = (await p.host.locator('.game-initial-state').boundingBox())!;
      const indicator = (await p.host.locator('.game-indicator').boundingBox())!; const plays = (await p.host.locator('.game-plays').boundingBox())!;
      expect(Math.abs(state.y - (width <= 760 ? people.y : indicator.y))).toBeLessThanOrEqual(2);
      expect(state.x).toBeGreaterThan(width <= 760 ? people.x : indicator.x);
      if (width > 760) expect(state.y).toBeGreaterThanOrEqual(Math.max(people.y + people.height, plays.y + plays.height));
      else expect(indicator.y).toBeGreaterThanOrEqual(Math.max(state.y + state.height, people.y + people.height));
      expect(await p.host.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await fs.mkdir(evidence, { recursive: true }); await p.host.screenshot({ path: path.join(evidence, `${width}-observer-full.png`), fullPage: true });
    } finally { await p.close(); await server.stop(); }
  });
}
