import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, readGame } from '../support/manualBrowserCases.js';

for (const width of [1800, 390]) test(`B20 P1 paletas y geometría ${width}`, async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, undefined, { generic: true, solar: true, creatures: true });
  server.permutation(ids => ids);
  const table = await manualTable(browser, server.base, { width, height: width === 390 ? 844 : 1000,
    deckId: 'criaturas-magicas', version: 2, optimize: true });
  const folder = `playwright-report/b20/${process.env.KARTA3_B20_BASELINE ? 'base' : 'p1'}`;
  await fs.mkdir(folder, { recursive: true });
  try {
    const before = await readGame(table.host);
    const themes = process.env.KARTA3_B20_BASELINE ? ['BASE'] : ['LIGHT', 'DARK', 'CREAM', 'HIGH_CONTRAST'];
    const measures: unknown[] = [];
    for (const theme of themes) {
      if (theme !== 'BASE') await table.host.getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption(theme);
      await table.host.evaluate(() => document.fonts.ready);
      await table.host.screenshot({ path: `${folder}/${width}-${theme}.png`, fullPage: true });
      measures.push(await table.host.evaluate(theme => ({ theme, width: innerWidth, dpr: devicePixelRatio,
        useful: document.querySelector('.game-composition')!.getBoundingClientRect().width,
        compact: !!document.querySelector('.game-compact'),
        elements: [...document.querySelectorAll('.game-hand .game-card,.game-hand .card-heading,.game-hand .game-card-image,.game-hand .card-values,.game-hand .card-play-button')].map(e => {
          const b = e.getBoundingClientRect(); const s = getComputedStyle(e);
          return { className: e.className, width: b.width, height: b.height, font: s.fontFamily, size: s.fontSize, color: s.color, background: s.backgroundColor };
        }) }), theme));
      const after = await readGame(table.host);
      expect(after.game.id).toBe(before.game.id); expect(after.revision).toBe(before.revision);
      expect(after.game.interaction.turn?.id).toBe(before.game.interaction.turn?.id);
      const details = table.host.locator('.game-hand .card-details-button').first();
      await details.click(); await expect(table.host.getByRole('dialog')).toBeVisible();
      await table.host.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape');
      await expect(details).toBeFocused();
    }
    if (!process.env.KARTA3_B20_BASELINE) {
      const base = JSON.parse(await fs.readFile(`playwright-report/b20/base/${width}-measures.json`, 'utf8'));
      const geometry = (v: unknown) => (v as { elements: { className: string; width: number; height: number; font: string; size: string }[] }).elements.map(({ className, width, height, font, size }) => ({ className, width, height, font, size }));
      for (const measurement of measures) expect(geometry(measurement)).toEqual(geometry(base[0]));
    }
    await fs.writeFile(`${folder}/${width}-measures.json`, JSON.stringify(measures, null, 2));
  } finally { await table.close(); await server.stop(); }
});

test('B20 P1 preferencia personal, teclado, pestañas, recarga y almacenamiento bloqueado con OFF', async ({ browser }) => {
  const s = await configurationBrowserServer();
  const context = await browser.newContext(); const other = await browser.newContext();
  const page = await context.newPage(); const tab = await context.newPage(); const independent = await other.newPage();
  const requests: string[] = []; page.on('request', r => { const route = new URL(r.url()).pathname; if (r.method() !== 'GET' && route.startsWith('/api/')) requests.push(route); });
  page.on('websocket', ws => ws.on('framesent', frame => { if (String(frame.payload).includes('"room:configure"')) requests.push('room:configure'); }));
  try {
    await Promise.all([page.goto(s.base), tab.goto(s.base), independent.goto(s.base)]);
    const control = page.getByRole('combobox', { name: 'Apariencia', exact: true });
    await expect(control).toHaveValue(''); await expect(control).toHaveAccessibleDescription(/Claro aplicado por defecto/);
    expect(await control.locator('option:not([disabled])').allTextContents()).toEqual(['Claro', 'Oscuro', 'Crema', 'Alto contraste']);
    expect(await page.evaluate(() => localStorage.getItem('karta3.appearance.v1'))).toBeNull();
    await control.focus(); await control.press('ArrowDown'); await control.press('Enter');
    await expect(control).toHaveValue('LIGHT');
    await control.selectOption('CREAM'); await expect(tab.locator('html')).toHaveAttribute('data-appearance', 'CREAM');
    await expect(independent.locator('html')).toHaveAttribute('data-appearance', 'LIGHT');
    await page.reload(); await expect(control).toHaveValue('CREAM');
    await tab.evaluate(() => localStorage.removeItem('karta3.appearance.v1'));
    await expect(control).toHaveValue(''); expect(requests).toEqual([]);
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.getByText('Preferencia personal', { exact: true })).toBeVisible();
    await expect(page.locator('.personal-preference label')).toHaveText('Apariencia');
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked'); } }); });
    await page.reload(); await control.selectOption('HIGH_CONTRAST');
    await expect(page.getByRole('status').filter({ hasText: 'No se pudo guardar' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-appearance', 'HIGH_CONTRAST');
    await page.goto(`${s.base}/privacidad`); await expect(page.getByRole('heading', { name: 'Privacidad y analítica', exact: true })).toBeVisible();
  } finally { await context.close(); await other.close(); await s.stop(); }
});
