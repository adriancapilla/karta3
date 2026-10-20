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
      const contrast = await table.host.evaluate(() => {
        const s = getComputedStyle(document.documentElement);
        const value = (name: string) => s.getPropertyValue(`--${name}`).trim();
        const luminance = (hex: string) => {
          const h = hex.slice(1); const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
          return [0.2126, 0.7152, 0.0722].reduce((sum, weight, i) => {
            const v = parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255;
            return sum + weight * (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
          }, 0);
        };
        return [['text', 'page', 4.5], ['text', 'panel', 4.5], ['muted', 'panel', 4.5], ['card-text', 'card', 4.5],
          ['active-text', 'active', 4.5], ['primary-text', 'primary', 4.5], ['control-text', 'control', 4.5], ['detail-text', 'detail', 4.5],
          ['control-line', 'control', 3], ['detail-line', 'detail', 3], ['focus', 'panel', 3], ['card-focus', 'detail', 3]].map(([a, b, minimum]) => {
          const foreground = value(String(a)); const background = value(String(b)); const f = luminance(foreground); const t = luminance(background);
          return { pair: `${a}/${b}`, foreground, background, minimum: Number(minimum), ratio: (Math.max(f, t) + 0.05) / (Math.min(f, t) + 0.05) };
        });
      });
      if (theme !== 'BASE') for (const pair of contrast) expect(pair.ratio, `${theme}: ${pair.pair}`).toBeGreaterThanOrEqual(pair.minimum);
      await table.host.screenshot({ path: `${folder}/${width}-${theme}.png`, fullPage: true });
      measures.push({ ...await table.host.evaluate(theme => ({ theme, width: innerWidth, dpr: devicePixelRatio,
        useful: document.querySelector('.game-composition')!.getBoundingClientRect().width,
        compact: !!document.querySelector('.game-compact'),
        elements: [...document.querySelectorAll('.game-hand .game-card,.game-hand .card-heading,.game-hand .game-card-image,.game-hand .card-values,.game-hand .card-play-button')].map(e => {
          const b = e.getBoundingClientRect(); const s = getComputedStyle(e);
          return { className: e.className, width: b.width, height: b.height, font: s.fontFamily, size: s.fontSize, color: s.color, background: s.backgroundColor };
        }) }), theme), contrast });
      const after = await readGame(table.host);
      expect(after.game.id).toBe(before.game.id); expect(after.revision).toBe(before.revision);
      expect(after.game.interaction.turn?.id).toBe(before.game.interaction.turn?.id);
      const details = table.host.locator('.game-hand .card-details-button').first();
      await details.click(); await expect(table.host.getByRole('dialog')).toBeVisible();
      await table.host.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape');
      await expect(details).toBeFocused();
    }
    if (!process.env.KARTA3_B20_BASELINE) {
      const base = JSON.parse(await fs.readFile(`docs/sdd/evidencias/B20/p1/${width}-base-measures.json`, 'utf8'));
      const geometry = (v: unknown) => (v as { elements: { className: string; width: number; height: number; font: string; size: string }[] }).elements.map(({ className, width, height, font, size }) => ({ className, width, height, font, size }));
      for (const measurement of measures) expect(geometry(measurement)).toEqual(geometry(base[0]));
    }
    await fs.writeFile(`${folder}/${width}-measures.json`, JSON.stringify(measures, null, 2));
  } finally { await table.close(); await server.stop(); }
});

test('B20 P1 intermedio/observador y frontera útil: foco, dirección, cartas y estado invariables al cambiar tema', async ({ browser }) => {
  for (const observer of [false, true]) {
    const s = await configurationBrowserServer(true, true, undefined, { generic: true, solar: true }); s.permutation(ids => ids);
    const table = await manualTable(browser, s.base, { observer, count: 2, width: 1800, height: 1000, optimize: true,
      deckId: observer ? 'generica' : 'sistema-solar', version: 4, valueMode: 'DISPLAY_VALUE', turn: 60 });
    try {
      const opener = table.pages[1]; await opener.getByRole('button', { name: 'BAJO', exact: true }).click();
      const before = await readGame(opener); const measures = [];
      for (const useful of [1367, 1368, 992]) {
        await table.host.locator('.game-composition').evaluate((e, width) => { (e as HTMLElement).style.maxWidth = `${width}px`; }, useful);
        if (useful === 992) await table.host.setViewportSize({ width: 1100, height: 900 });
        await expect.poll(() => table.host.locator('.game-composition').getAttribute('data-layout')).toBe(useful < 1368 ? 'compact' : 'normal');
        for (const theme of ['DARK', 'HIGH_CONTRAST']) {
          const select = table.host.getByRole('combobox', { name: 'Apariencia', exact: true }); await select.selectOption(theme); await select.focus();
          await expect(select).toBeFocused(); const after = await readGame(opener);
          expect(after.game.interaction.turn).toEqual(before.game.interaction.turn); expect(after.game.interaction.openingSelection).toEqual(before.game.interaction.openingSelection);
          expect(after.revision).toBe(before.revision); expect(after.settings).toEqual(before.settings);
          const m = await table.host.evaluate(() => {
            const box = (selector: string) => { const b = document.querySelector(selector)?.getBoundingClientRect(); return b ? { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom } : null; };
            return { useful: Number((document.querySelector('.game-composition') as HTMLElement).dataset.usefulWidth), compact: !!document.querySelector('.game-compact'),
              select: box('.appearance-control'), cancel: box('.game-header-actions>.cancel-game-button'), card: box('.game-hand .game-card'), viewport: innerWidth,
              hand: document.querySelectorAll('.game-hand .game-card').length, labelVisible: [...document.querySelectorAll('.appearance-control label')].some(e => getComputedStyle(e).position !== 'absolute') };
          });
          expect(m.useful).toBe(useful); expect(m.compact).toBe(useful < 1368); expect(m.hand).toBe(observer ? 0 : 3); expect(m.labelVisible).toBe(false);
          if (m.compact) expect(m.select!.y).toBeGreaterThanOrEqual(m.cancel!.bottom);
          else expect(m.select!.right).toBeLessThanOrEqual(m.cancel!.x);
          await fs.mkdir('playwright-report/b20/matrix', { recursive: true });
          await table.host.screenshot({ path: `playwright-report/b20/matrix/${observer ? 'observer-null' : 'solar'}-${useful}-${theme}.png`, fullPage: true }); measures.push({ theme, ...m });
        }
      }
      await fs.writeFile(`playwright-report/b20/matrix/${observer ? 'observer' : 'player'}-measures.json`, JSON.stringify(measures, null, 2));
    } finally { await table.close(); await s.stop(); }
  }
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
    await control.selectOption('CREAM'); await page.setViewportSize({ width: 1100, height: 900 });
    await fs.mkdir('playwright-report/b20/secondary', { recursive: true });
    await page.screenshot({ path: 'playwright-report/b20/secondary/home-cream-1100.png', fullPage: true });
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.getByText('Preferencia personal', { exact: true })).toBeVisible();
    await expect(page.locator('.personal-preference label')).toHaveText('Apariencia');
    await page.screenshot({ path: 'playwright-report/b20/secondary/wait-host-cream-1100.png', fullPage: true });
    await independent.setViewportSize({ width: 390, height: 844 });
    await independent.getByLabel('Código de sala').fill((await page.locator('.code').textContent())!);
    await independent.getByLabel('Tu nombre', { exact: true }).fill('Invitado'); await independent.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(independent.locator('.configuration-summary')).toBeVisible();
    const accepted = await page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
    await independent.getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('DARK');
    await expect(independent.locator('.personal-preference label')).toHaveText('Apariencia');
    await independent.screenshot({ path: 'playwright-report/b20/secondary/wait-guest-dark-390.png', fullPage: true });
    const unchanged = await page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
    expect(unchanged.revision).toBe(accepted.revision); expect(unchanged.settings).toEqual(accepted.settings);
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked'); } }); });
    await page.reload(); await control.selectOption('HIGH_CONTRAST');
    await expect(page.getByRole('status').filter({ hasText: 'No se pudo guardar' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-appearance', 'HIGH_CONTRAST');
    await page.goto(`${s.base}/privacidad`); await expect(page.getByRole('heading', { name: 'Privacidad y analítica', exact: true })).toBeVisible();
  } finally { await context.close(); await other.close(); await s.stop(); }
});
