import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, humanPlay, readGame } from '../support/manualBrowserCases.js';
import { titleGeometry, glyphFonts, assertFittedTitle, assertWholeFace } from '../support/cardTitleGeometry.js';

const evidence = 'playwright-report/b17-adenda/acceptance';
async function record(page: Page, name: string) {
  await fs.mkdir(evidence, { recursive: true });
  const cards = [];
  for (const slot of await page.locator('.game-hand [data-card-id]').all()) {
    const id = await slot.getAttribute('data-card-id');
    cards.push({ id, geometry: await titleGeometry(slot.locator('article')), fonts: await glyphFonts(page, `.game-hand [data-card-id="${id}"]`) });
  }
  await fs.writeFile(`${evidence}/${name}.json`, JSON.stringify({ date: new Date().toISOString(), browser: page.context().browser()!.version(), cards }, null, 2) + '\n');
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}
async function scene(id: string) {
  const s = await configurationBrowserServer(true, true, undefined, { generic: true, solar: true, creatures: true });
  const cards = (JSON.parse(await fs.readFile(`barajas/${id}/cartas.json`, 'utf8')) as { cards: { id: string; name: string; roundAttribute: string }[] }).cards;
  const names = id === 'criaturas-magicas' ? ['Espíritu del arcoíris', 'Tritón de las profundidades', 'Grifo de plumas de hierro']
    : id === 'sistema-solar' ? ['67P / Churyumov-Gerasimenko', 'Hyakutake', 'Encke'] : cards.slice(0, 3).map(c => c.name);
  const hand = names.map(name => cards.find(c => c.name === name)!.id); const indicator = cards.find(c => c.roundAttribute === 'atributo3' && !hand.includes(c.id))!.id;
  s.permutation(ids => { const rest = ids.filter(id => !hand.includes(id) && id !== indicator); return [rest.shift()!, hand[0], rest.shift()!, hand[1], rest.shift()!, hand[2], indicator, ...rest]; });
  return s;
}

for (const id of ['generica', 'sistema-solar', 'criaturas-magicas']) for (const mode of ['PLAY_VALUE', 'DISPLAY_VALUE'] as const) test(`ADENDA B17 T/G/C ${id} ${mode}: máximo, banda, contenido y Resistencia`, async ({ browser }) => {
  const s = await scene(id); const p = await manualTable(browser, s.base, { deckId: id, version: id === 'criaturas-magicas' ? 2 : 4, valueMode: mode, optimize: true, width: 1920, turn: 60, review: 5 });
  try {
    const original = await readGame(p.host); const samples = [];
    for (const card of original.game.hand) {
      const face = p.host.locator(`.game-hand [data-card-id="${card.id}"] article`);
      const g = await assertFittedTitle(face, card.name); assertWholeFace(g); samples.push(g);
      await expect(face.getByText(card.name, { exact: true })).toHaveCount(1);
      expect([g.card.width, g.card.height, g.image.width, g.image.height]).toEqual([230, 321, 230, 172.5]);
      await expect(face.locator('tbody tr').last()).toHaveClass('active-attribute');
      await expect(face.locator('tbody td')).toHaveText(original.game.attributes.map(a => mode === 'PLAY_VALUE' ? String(card.values[a.id].playValue) : card.values[a.id].displayValue + (card.values[a.id].unit ? ` ${card.values[a.id].unit}` : '')));
      if (card.name === 'Encke' || card.name.startsWith('Carta ')) expect(g.size).toBe(g.base);
    }
    for (const g of samples) {
      expect(g.heading.height).toBeCloseTo(samples[0].heading.height, 2);
      expect(g.image.y - g.card.y).toBeCloseTo(samples[0].image.y - samples[0].card.y, 2);
    }
    await record(p.host, `${id}-${mode}-1920-active3`);
    const d = p.host.locator('.game-hand .card-details-button').first(); await d.press('Enter');
    await expect(p.host.locator('#card-details-title')).toHaveText(`Detalles de ${original.game.hand[0].name}`);
    await p.host.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape'); await expect(d).toBeFocused();
    await p.host.setViewportSize({ width: 390, height: 844 }); await expect(p.host.locator('.game-composition')).toHaveAttribute('data-layout', 'compact');
    const compact = p.host.locator('.game-hand article').first();
    await expect(compact.locator('h3')).toHaveCSS('font-size', '18px'); await expect(compact.locator('h3')).not.toHaveClass('title-clipped');
    await expect(compact.locator('.card-details-button')).toHaveText('Detalles'); expect((await compact.locator('.game-card-image').boundingBox())!.width).toBe(32);
    const summary = p.host.locator('.summary-indicator'); await summary.click();
    const consultation = p.host.locator('.consultation article'); const indicator = await assertFittedTitle(consultation, original.game.round.indicator.name); assertWholeFace(indicator);
    expect(indicator.base).toBe(16); expect(indicator.card.width).toBe(230);
    await p.host.getByRole('button', { name: 'Cerrar consulta', exact: true }).press('Escape'); await expect(summary).toBeFocused();
    await p.host.setViewportSize({ width: 1920, height: 1080 }); await expect(p.host.locator('.game-composition')).toHaveAttribute('data-layout', 'normal');
    const again = await assertFittedTitle(p.host.locator('.game-hand article').first(), original.game.hand[0].name); expect(again.size).toBe(samples[0].size);
    expect((await readGame(p.host)).game.interaction.turn).toEqual(original.game.interaction.turn); expect(s.gameRequests).toHaveLength(0);
  } finally { await p.close(); await s.stop(); }
});

test('ADENDA B17 T/G/I fixture válida: corte solo a12, nombre íntegro, hit real y avance único', async ({ browser }) => {
  const s = await configurationBrowserServer(true, true, undefined, { longTitle: true });
  const p = await manualTable(browser, s.base, { deckId: 'portada', version: 7, width: 1280, turn: 60, review: 5 });
  try {
    const original = await readGame(p.host); const card = original.game.hand[0]; expect(card.name).toBe('W'.repeat(100));
    const slot = p.host.locator(`.game-hand [data-card-id="${card.id}"]`); const face = slot.locator('article');
    const g = await assertFittedTitle(face, card.name); assertWholeFace(g); expect(g.size).toBe(12); expect(g.minWidth).toBeGreaterThan(g.available);
    await record(p.host, 'fixture-corte-12-1280'); const d = face.locator('.card-details-button'); await d.click();
    await expect(p.host.locator('#card-details-title')).toHaveText(`Detalles de ${card.name}`); await expect(p.host.locator('#card-details-title')).toHaveCSS('font-size', '22px');
    await p.host.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape'); await expect(d).toBeFocused(); expect(s.gameRequests).toHaveLength(0);
    for (const width of [390, 360, 1280]) {
      await p.host.setViewportSize({ width, height: 844 });
      const sample = await assertFittedTitle(face, card.name); assertWholeFace(sample); expect(sample.size).toBe(12);
      await record(p.host, `fixture-corte-normal-${width}`);
    }
    await humanPlay(p); const before = await readGame(p.host); const button = slot.locator('.card-play-button'); await button.scrollIntoViewIfNeeded();
    const hit = await titleGeometry(face); expect(hit.play!.received).toBe(true); assertWholeFace(hit);
    await button.evaluate(e => {
      const region = e.closest('.game-hand')!;
      e.addEventListener('click', event => region.setAttribute('data-real-click', String(event.isTrusted)), { once: true });
    });
    await button.click(); await expect(p.host.locator('.game-hand')).toHaveAttribute('data-real-click', 'true');
    await expect.poll(async () => (await readGame(p.host)).game.interaction.turn?.id).not.toBe(before.game.interaction.turn!.id);
    const after = await readGame(p.host); expect(after.game.round.plays.filter(play => play.card.id === card.id)).toHaveLength(1);
    expect(s.gameRequests.filter(r => r.event === 'game:play')).toHaveLength(2);
  } finally { await p.close(); await s.stop(); }
});

test('ADENDA B17 T/G fuentes tardías y zoom CSS125/200 declarado: recalcula sin pausar ni neutralizar fuente', async ({ browser }) => {
  const s = await scene('criaturas-magicas'); const p = await manualTable(browser, s.base, { deckId: 'criaturas-magicas', version: 2, width: 1920, turn: 60 });
  try {
    const original = await readGame(p.host); const face = p.host.locator('.game-hand article').nth(1); const name = original.game.hand[1].name;
    const fontPath = process.platform === 'win32' ? 'C:/Windows/Fonts/cour.ttf' : '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf';
    const bytes = await fs.readFile(fontPath); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    await p.host.route('**/adenda-font.ttf', async route => { await gate; await route.fulfill({ body: bytes, contentType: 'font/ttf' }); });
    await p.host.addStyleTag({ content: "@font-face{font-family:AdendaDelayed;src:url('/adenda-font.ttf')} .full-card .card-heading h3{font-family:AdendaDelayed,sans-serif}" });
    await expect.poll(async () => {
      const g = await titleGeometry(face); return g.textRects[0].right <= g.title.right + 0.05 || g.size === 12 && g.overflow === 'hidden';
    }).toBe(true);
    await assertFittedTitle(face, name); release(); await p.host.evaluate(() => document.fonts.load('16px AdendaDelayed'));
    await expect.poll(() => p.host.evaluate(() => document.fonts.check('16px AdendaDelayed'))).toBe(true);
    await assertFittedTitle(face, name); await record(p.host, 'fuente-final-test-solo');
    await fs.writeFile(`${evidence}/fuente-fixture.json`, JSON.stringify({ fontPath, sha256: createHash('sha256').update(bytes).digest('hex'), category: 'fuente de prueba interceptada; producto no incorpora fuentes' }, null, 2));
    for (const zoom of [1.25, 2, 1]) {
      await p.host.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
      await expect.poll(async () => (await titleGeometry(face)).viewport.cssZoom).toBe(String(zoom));
      const sample = await assertFittedTitle(face, name); assertWholeFace(sample); expect(sample.size).toBeGreaterThanOrEqual(12);
      await record(p.host, `zoom-css-${zoom}`);
    }
    expect((await readGame(p.host)).game.interaction.turn).toEqual(original.game.interaction.turn); expect(s.gameRequests).toHaveLength(0);
  } finally { await p.close(); await s.stop(); }
});
