import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, humanPlay, readGame } from '../support/manualBrowserCases.js';

const before = process.env.B12_CAPTURE_BASE === '1';
const evidence = path.resolve('playwright-report/b12', before ? 'before' : 'after');
async function exampleServer() {
  const server = await configurationBrowserServer(true, true, undefined, { generic: true });
  const { cards } = JSON.parse(await fs.readFile('barajas/generica/cartas.json', 'utf8')) as { cards: { id: string; roundAttribute: string; values: Record<string, { playValue: number }> }[] };
  const first = [31, 54, 35, 50, 56].map((value) => cards.find((card) => card.values.atributo1.playValue === value)!.id);
  const indicator = cards.find((card) => card.roundAttribute === 'atributo1' && !first.includes(card.id))!.id;
  server.permutation((ids) => {
    const rest = ids.filter((id) => !first.includes(id) && id !== indicator);
    return [...first, ...rest.slice(0, 10), indicator, ...rest.slice(10)];
  });
  return server;
}
async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y + scrollY, width: b.width, height: b.height, right: b.right, bottom: b.bottom + scrollY }; };
    const find = (selector: string) => { const element = document.querySelector(selector); return element ? box(element) : null; };
    const row = (selector: string) => { const element = document.querySelector(selector)!; return { ...box(element), client: element.clientWidth, scroll: element.scrollWidth, left: element.scrollLeft }; };
    const cards = [...document.querySelectorAll('.game-layout .game-card')].filter((card) => card.getBoundingClientRect().width).map((card) => ({ ...box(card), area: card.closest('.game-hand') ? 'hand' : card.closest('.game-plays') ? 'plays' : 'indicator', name: card.querySelector('h3')!.textContent,
      values: [...card.querySelectorAll('tbody tr')].map((r) => r.textContent), titleFont: getComputedStyle(card.querySelector('h3')!).fontSize, valueFont: getComputedStyle(card.querySelector('td')!).fontSize }));
    const heads = ['indicator', 'hand'].map((area) => { const element = document.querySelector(`.game-${area} .game-card-panel-heading`)!; const title = element.querySelector('h2')!; const card = document.querySelector(`.game-${area} .game-card`); return { area, ...box(element), title: box(title), minHeight: getComputedStyle(element).minHeight, cardOffset: card ? box(card).y - find(`.game-${area}`)!.y : null, titleToCard: card ? box(card).y - box(title).bottom : null }; });
    return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scale: visualViewport?.scale }, availableWidth: document.body.clientWidth,
      pageWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight, residual: Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight),
      shell: find('.game-shell')!, grid: find('.game-layout')!, columns: getComputedStyle(document.querySelector('.game-layout')!).gridTemplateColumns,
      panels: Object.fromEntries(['people', 'plays', 'indicator', 'hand', 'initial-state'].map((p) => [p, find(`.game-${p}`)])), cards, heads,
      mesa: row('.played-row'), mesaTitle: find('#game-plays-title'), hand: row('.hand-row'), actions: [...document.querySelectorAll('.card-play-button')].map(box), legend: find('.game-legend') };
  });
}
type Measurement = Awaited<ReturnType<typeof measure>>;
function centered(sample: Measurement) {
  expect(sample.viewport.dpr).toBe(1); expect(sample.viewport.scale).toBe(1);
  expect(sample.shell.width).toBe(1400); expect(sample.grid.width).toBe(1368); expect(sample.columns).toBe('264px 816px 264px');
  expect(Math.abs(sample.shell.x - (sample.availableWidth - 1400) / 2)).toBeLessThanOrEqual(2);
  for (const [panel, width] of [['people', 264], ['plays', 1092], ['indicator', 264], ['hand', 816], ['initial-state', 264]] as const) expect(sample.panels[panel]!.width).toBe(width);
  expect(sample.hand.client).toBe(790); expect(sample.hand.scroll).toBe(790); expect(sample.mesa.client).toBe(1066);
  expect(sample.pageWidth).toBeLessThanOrEqual(sample.viewport.width);
  for (const card of sample.cards) { expect(card.width).toBe(230); expect(card.height).toBe(321); expect(card.titleFont).toBe('16px'); expect(card.valueFont).toBe('14px'); }
  const hand = sample.cards.filter((card) => card.area === 'hand'); const indicator = sample.cards.find((card) => card.area === 'indicator')!;
  for (const card of hand) expect(Math.abs(card.y - indicator.y)).toBeLessThanOrEqual(2);
  for (let i = 1; i < hand.length; i++) expect(hand[i].x - hand[i - 1].right).toBe(46);
  expect(hand[0].x - sample.panels.hand!.x).toBe(17);
  for (const head of sample.heads) { expect(head.minHeight).toBe('0px'); expect(head.titleToCard).toBeLessThanOrEqual(14); }
  const title = sample.heads.find((head) => head.area === 'hand')!.title;
  expect(Math.abs(title.x + title.width / 2 - (sample.panels.hand!.x + sample.panels.hand!.width / 2))).toBeLessThanOrEqual(2);
}
async function record(page: Page, name: string) {
  await expect(page.locator('.mesa-title')).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0)); const sample = await measure(page);
  await fs.mkdir(evidence, { recursive: true }); await fs.writeFile(path.join(evidence, `${name}.json`), JSON.stringify(sample, null, 2) + '\n');
  await page.screenshot({ path: path.join(evidence, `${name}-viewport.png`) }); await page.screenshot({ path: path.join(evidence, `${name}-full.png`), fullPage: true });
  console.log(`B12_MEASURE ${name} ${JSON.stringify(sample)}`);
  if (!before) centered(sample);
  return sample;
}
test.beforeAll(async () => {
  if (before) {
    const texts = await Promise.all(['src/GameScreen.tsx', 'src/GameCard.tsx', 'src/style.css'].map(async (file) => (await fs.readFile(file, 'utf8')).replace(/\r\n/g, '\n')));
    expect(createHash('sha256').update(texts.join('\n')).digest('hex')).toBe('47abd90c663ffc560b9d5fcfa40aca331958fdc88b18a9ea6b2baf074343c962');
  }
});

if (!before) {
  const publicIds = (page: Page) => page.locator('.played-row .game-card-slot').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-card-id')));
  async function acceptedOrder(page: Page) {
    const view = await readGame(page); const active = view.game.round.activeAttributeId;
    const expected = view.game.interaction.review ? view.game.interaction.review.result.ranking.map((entry) => entry.card.id) : [...view.game.round.plays].sort((a, b) => (view.game.round.direction === 'HIGH' ? -1 : 1) * (a.card.values[active].playValue - b.card.values[active].playValue)).map((play) => play.card.id);
    await expect.poll(() => publicIds(page)).toEqual(expected);
    expect(await page.locator('.game-hand .game-card-slot').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-card-id')))).toEqual(view.game.hand.map((card) => card.id));
    return view;
  }
  for (const direction of ['HIGH', 'LOW'] as const) test(`B12 E1–E6 ${direction}: private partial, new plays, focus/Details, keyboard fifth, tabs and reload`, async ({ browser }) => {
    const s = await exampleServer(); const p = await manualTable(browser, s.base, { count: 5, width: 1920, turn: 60, review: 5 });
    try {
      await Promise.all(p.pages.map((page) => page.setViewportSize({ width: 1920, height: 950 })));
      const opener = p.pages[1]; const initial = await readGame(opener); const ownHost = (await readGame(p.host)).game.hand;
      await opener.getByRole('button', { name: direction === 'HIGH' ? 'ALTO' : 'BAJO', exact: true }).click();
      await expect.poll(async () => (await readGame(opener)).game.interaction.openingSelection?.direction).toBe(direction);
      const publicView = await readGame(p.host); expect(publicView.game.round.direction).toBeNull(); expect(publicView.game.interaction.openingSelection).toBeNull();
      await expect(p.host.locator('.played-row .game-card')).toHaveCount(0);
      const tab = await p.contexts[1].newPage(); await tab.goto(opener.url()); await expect(tab.getByRole('button', { name: direction === 'HIGH' ? 'ALTO' : 'BAJO', exact: true })).toHaveAttribute('aria-pressed', 'true');
      expect((await readGame(tab)).game.interaction.turn!.timing!.endsAt).toBe(initial.game.interaction.turn!.timing!.endsAt);
      const sent = s.gameRequests.length; await opener.reload(); await expect(opener.locator('.game-hand .card-play-button')).toHaveCount(3); expect(s.gameRequests).toHaveLength(sent);
      await opener.locator('.game-hand .card-play-button').first().click(); await expect(p.host.locator('.played-row .game-card')).toHaveCount(1);
      const first = (await readGame(p.host)).game.round.plays[0]; const detail = p.host.locator(`.played-row [data-card-id="${first.card.id}"] .card-details-button`);
      await detail.focus(); const scrollY = await p.host.evaluate(() => window.scrollY);
      await humanPlay(p, true, direction); await expect(detail).toBeFocused(); expect(await p.host.evaluate(() => window.scrollY)).toBe(scrollY);
      await detail.press('Enter'); await expect(p.host.getByRole('dialog').getByRole('heading', { level: 3 })).toHaveText(first.card.name);
      const close = p.host.getByRole('button', { name: 'Cerrar detalles', exact: true }); await expect(close).toBeFocused();
      await humanPlay(p, false, direction); await expect(close).toBeFocused(); await expect(p.host.getByRole('dialog').getByRole('heading', { level: 3 })).toHaveText(first.card.name);
      await close.press('Escape'); await expect(detail).toBeFocused(); await humanPlay(p, true, direction);
      const four = await acceptedOrder(p.host); expect(four.game.round.plays.map((play) => play.card.values.atributo1.playValue)).toEqual([31, 54, 35, 50]);
      expect(four.game.hand).toEqual(ownHost);
      const values = await p.host.locator('.played-row .active-attribute td:last-child').allTextContents(); expect(values).toEqual(direction === 'HIGH' ? ['54', '50', '35', '31'] : ['31', '35', '50', '54']);
      await expect(p.host.locator('.mesa-overflow-hint')).toHaveCount(0);
      await humanPlay(p, false, direction); await expect(p.host.locator('.round-review')).toBeVisible();
      const review = await acceptedOrder(p.host); expect(review.game.round.plays.map((play) => play.card.values.atributo1.playValue)).toEqual([31, 54, 35, 50, 56]);
      expect(review.game.interaction.review!.result.ranking.map((entry) => entry.playValue)).toEqual(direction === 'HIGH' ? [56, 54, 50, 35, 31] : [31, 35, 50, 54, 56]);
      const row = p.host.getByRole('region', { name: 'Cartas públicas de Mesa', exact: true }); await expect(row).toHaveAttribute('aria-describedby', 'mesa-scroll-hint');
      await row.focus(); for (let i = 0; i < 12; i++) await row.press('ArrowRight');
      await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBe(276);
      const fifth = p.host.locator('.played-row>div').last(); const fifthName = await fifth.locator('h3').textContent(); const fifthAuthor = await fifth.locator('.play-author').textContent();
      const trigger = fifth.locator('.card-details-button'); await trigger.press('Enter'); await expect(p.host.getByRole('dialog').getByRole('heading', { level: 3 })).toHaveText(fifthName!);
      await p.host.getByRole('button', { name: 'Cerrar detalles' }).press('Escape'); await expect(trigger).toBeFocused();
      await expect(fifth.locator('.play-author')).toHaveText(fifthAuthor!); expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(5);
      const hostTab = await p.contexts[0].newPage(); await hostTab.goto(p.host.url()); await expect(hostTab.locator('.round-review')).toBeVisible();
      await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBe(276); await expect(trigger).toBeFocused();
      expect(await p.host.locator('.hand-row').evaluate((element) => element.scrollLeft)).toBe(0); expect(await p.host.evaluate(() => scrollX)).toBe(0);
      await record(p.host, `${direction.toLowerCase()}-keyboard-fifth`);
      await p.host.reload(); await acceptedOrder(p.host); expect((await readGame(p.host)).game.id).toBe(initial.game.id); expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(5);
    } finally { await p.close(); await s.stop(); }
  });
  test('B12 widths: larger/smaller and reserved vertical scrollbar select by available area, existing mobile/1280 access', async ({ browser }) => {
    const s = await exampleServer(); const p = await manualTable(browser, s.base, { count: 5, width: 1920, turn: 60 });
    try {
      for (let i = 0; i < 4; i++) await humanPlay(p);
      for (const width of [2560, 1920, 1420, 1400, 1399, 1280, 390]) {
        await p.host.setViewportSize({ width, height: width === 390 ? 844 : 950 });
        await p.host.evaluate(() => { document.documentElement.style.scrollbarGutter = 'stable'; });
        const sample = await measure(p.host);
        expect(sample.pageWidth).toBeLessThanOrEqual(width);
        if (sample.availableWidth >= 1400) centered(sample);
        else { expect(sample.shell.width).toBeLessThan(1400); expect(sample.columns).not.toBe('264px 816px 264px'); await expect(p.host.locator('.indicator-attribute-label')).toBeVisible(); }
        const details = p.host.locator('.game-hand .card-details-button').first(); await details.press('Enter'); await p.host.getByRole('button', { name: 'Cerrar detalles' }).press('Escape'); await expect(details).toBeFocused();
        await fs.mkdir(evidence, { recursive: true }); await fs.writeFile(path.join(evidence, `width-${width}.json`), JSON.stringify(sample, null, 2));
        await p.host.evaluate(() => scrollTo(0, 0)); await p.host.screenshot({ path: path.join(evidence, `width-${width}-full.png`), fullPage: true });
      }
    } finally { await p.close(); await s.stop(); }
  });
  test('B12 fifth consultation with touch and horizontal mouse wheel does not play or move hand/page', async ({ browser }) => {
    const s = await exampleServer(); const p = await manualTable(browser, s.base, { count: 5, width: 1920, turn: 60, review: 5 });
    try {
      await p.host.setViewportSize({ width: 1920, height: 950 }); for (let i = 0; i < 5; i++) await humanPlay(p);
      const row = p.host.locator('.played-row'); const b = (await row.boundingBox())!; const input = await p.host.context().newCDPSession(p.host);
      await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width - 60, y: b.y + 70 }] });
      for (const delta of [70, 140, 210, 280, 350, 420]) await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + b.width - 60 - delta, y: b.y + 70 }] });
      await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await input.detach(); await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBe(276);
      await p.host.mouse.move(b.x + 50, b.y + 70); await p.host.mouse.wheel(-400, 0); await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBe(0);
      await p.host.mouse.wheel(400, 0); await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBe(276);
      expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(5); expect(await p.host.locator('.hand-row').evaluate((element) => element.scrollLeft)).toBe(0); expect(await p.host.evaluate(() => scrollX)).toBe(0);
    } finally { await p.close(); await s.stop(); }
  });
  test('B12 E5 narrow access: consulted scroll/focus survive the last inserted play and remote review', async ({ browser }) => {
    const s = await exampleServer(); const p = await manualTable(browser, s.base, { count: 5, width: 1280, turn: 60, review: 5 });
    try {
      for (let i = 0; i < 4; i++) await humanPlay(p);
      const row = p.host.locator('.played-row'); await row.evaluate((element) => { element.scrollLeft = 12; }); expect(await row.evaluate((element) => element.scrollLeft)).toBe(12);
      const focusedId = await row.locator('.game-card-slot').first().getAttribute('data-card-id');
      const details = row.locator(`[data-card-id="${focusedId}"] .card-details-button`); await details.evaluate((element) => element.focus({ preventScroll: true }));
      const tab = await p.contexts[0].newPage(); await tab.goto(p.host.url()); await expect(tab.locator('.game-hand .card-play-button').first()).toBeEnabled();
      await tab.locator('.game-hand .card-play-button').first().click(); await expect(p.host.locator('.round-review')).toBeVisible(); await expect(details).toBeFocused();
      expect(await row.evaluate((element) => element.scrollLeft)).toBe(12); await acceptedOrder(p.host); expect(s.gameRequests.filter((r) => r.event === 'game:play')).toHaveLength(5);
    } finally { await p.close(); await s.stop(); }
  });
  test('B12 E6 centered observer: state spans four columns, no private hand or actions', async ({ browser }) => {
    const s = await exampleServer(); const p = await manualTable(browser, s.base, { count: 2, observer: true, width: 1920, turn: 60, review: 5, names: ['María Alejandra', 'María Alejandra'] });
    try {
      await p.host.setViewportSize({ width: 1920, height: 950 }); await humanPlay(p); await humanPlay(p); await expect(p.host.locator('.round-review')).toBeVisible();
      const view = await readGame(p.host); expect(view.game.hand).toEqual([]); await expect(p.host.locator('.game-hand,.card-play-button')).toHaveCount(0);
      const indicator = (await p.host.locator('.game-indicator').boundingBox())!; const state = (await p.host.locator('.game-initial-state').boundingBox())!;
      expect(indicator.width).toBe(264); expect(state.width).toBe(1092); expect(Math.abs(indicator.y - state.y)).toBeLessThanOrEqual(2); await expect(p.host.locator('.indicator-attribute-label')).not.toBeVisible();
      await expect(p.host.getByText('Observando', { exact: true })).toBeVisible(); await expect(p.host.locator('.observer-abbreviation')).toHaveAccessibleName('Observador');
      await fs.mkdir(evidence, { recursive: true }); await fs.writeFile(path.join(evidence, 'observer.json'), JSON.stringify({ viewport: [1920, 950], indicator, state }, null, 2));
      await p.host.screenshot({ path: path.join(evidence, 'observer-full.png'), fullPage: true });
    } finally { await p.close(); await s.stop(); }
  });
}
for (const height of [1080, 950]) test(`B12 equivalent 1920x${height}: four, review five and fifth consultation`, async ({ browser }) => {
  const s = await exampleServer(); const p = await manualTable(browser, s.base, { count: 5, width: 1920, turn: 60, review: 5, names: ['Lucía', 'Marcos', 'Sara', 'Diego'] });
  try {
    await Promise.all(p.pages.map((page) => page.setViewportSize({ width: 1920, height })));
    for (let i = 0; i < 4; i++) await humanPlay(p, i % 2 === 0);
    const four = await record(p.host, `1920x${height}-turn`);
    if (!before) { expect(four.mesa.scroll).toBe(1066); for (const card of four.cards.filter((c) => c.area === 'plays')) { expect(card.x).toBeGreaterThanOrEqual(four.mesa.x); expect(card.right).toBeLessThanOrEqual(four.mesa.right); } }
    await humanPlay(p); await expect(p.host.locator('.round-review')).toBeVisible();
    const five = await record(p.host, `1920x${height}-review`);
    if (!before) { expect(five.mesa.scroll).toBe(1342); expect(five.panels.plays!.width).toBe(four.panels.plays!.width); await expect(p.host.getByText('5 cartas · desliza →', { exact: true })).toBeVisible(); }
    await p.host.locator('.played-row').evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    const end = await record(p.host, `1920x${height}-fifth`);
    if (!before) { expect(end.mesa.left).toBe(276); const fifth = end.cards.filter((c) => c.area === 'plays').at(-1)!; expect(fifth.x).toBeGreaterThanOrEqual(end.mesa.x); expect(fifth.right).toBeLessThanOrEqual(end.mesa.right); expect(end.hand.left).toBe(0); }
  } finally { await p.close(); await s.stop(); }
});
