import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, readGame } from '../support/manualBrowserCases.js';

const adendaPhase = process.env.KARTA3_B20_ADENDA_BASELINE ? 'base' : (process.env.KARTA3_B20_ADENDA_ATTEMPT ?? `run-${process.pid}-${Date.now()}`);
const adendaEvidence = `playwright-report/b20-adenda/20261020-selector-detalles/${adendaPhase}`;

for (const scenario of [
  { label: 'player-narrow', width: 390, observer: false, optimize: false, vertical: true },
  { label: 'observer-compact', width: 1100, observer: true, optimize: true, vertical: true },
  { label: 'player-horizontal', width: 1800, observer: false, optimize: true, vertical: false }
]) test(`Adenda B20 selector ${scenario.label}: caja real, conservación y foco exterior`, async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, undefined, { generic: true }); server.permutation(ids => ids);
  const table = await manualTable(browser, server.base, { ...scenario, height: 900, deckId: 'generica', version: 4, turn: 60 });
  try {
    const before = await readGame(table.host); const measurements = [];
    for (const theme of ['LIGHT', 'DARK']) {
      const measure = async (page: typeof table.host) => page.evaluate(() => {
        const box = (e: Element | null) => { if (!e) return null; const b = e.getBoundingClientRect(); const s = getComputedStyle(e);
          return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom, font: s.font, borderLeft: s.borderLeftWidth, borderRight: s.borderRightWidth,
            outlineWidth: s.outlineWidth, outlineOffset: s.outlineOffset, outlineStyle: s.outlineStyle }; };
        const select = document.querySelector('.appearance-control select')!;
        const cancelled = document.querySelector('.cancel-game-button');
        // Referencias intrínsecas del mismo navegador/fuente; independientes del ancho del grupo vertical.
        const natural = (e: Element | null) => {
          if (!e) return null; const wrapper = document.createElement('div'); wrapper.className = 'appearance-control'; wrapper.setAttribute('aria-hidden', 'true');
          Object.assign(wrapper.style, { position: 'fixed', visibility: 'hidden', maxWidth: 'none' });
          const clone = e.cloneNode(true) as HTMLElement; clone.removeAttribute('id');
          Object.assign(clone.style, { width: 'max-content', maxWidth: 'none', font: getComputedStyle(e).font });
          wrapper.append(clone); document.body.append(wrapper); const result = box(clone); wrapper.remove(); return result;
        };
        const clipping: string[] = []; for (let p = select.parentElement; p; p = p.parentElement) {
          const style = getComputedStyle(p); if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) clipping.push(p.className || p.tagName);
        }
        return { viewport: innerWidth, dpr: devicePixelRatio, useful: Number((document.querySelector('.game-composition') as HTMLElement).dataset.usefulWidth),
          select: box(select)!, cancel: box(cancelled), naturalSelect: natural(select), naturalCancel: natural(cancelled), focused: select === document.activeElement, clipping,
          card: box(document.querySelector('.game-hand .game-card')), labelHidden: getComputedStyle(document.querySelector('.appearance-control label')!).position === 'absolute' };
      });
      const samples = [];
      for (const [role, page] of [['host', table.host], ['guest', table.pages[1]]] as const) {
        const select = page.getByRole('combobox', { name: 'Apariencia', exact: true }); await select.selectOption(theme);
        await select.focus(); await select.press('Tab'); await page.keyboard.press('Shift+Tab'); await expect(select).toBeFocused();
        const sample = await measure(page); expect(sample.focused).toBe(true); expect(sample.labelHidden).toBe(true); expect(sample.clipping).toEqual([]);
        expect(sample.select.outlineWidth).toBe('3px'); expect(sample.select.outlineOffset).toBe('3px'); expect(sample.select.outlineStyle).not.toBe('none');
        expect(sample.select.x - 6).toBeGreaterThanOrEqual(0); expect(sample.select.right + 6).toBeLessThanOrEqual(scenario.width);
        if (role === 'guest') expect(sample.cancel).toBeNull();
        else {
          expect(!!sample.cancel).toBe(true);
          expect(sample.cancel!.width).toBe(sample.naturalCancel!.width); expect(sample.cancel!.height).toBe(sample.naturalCancel!.height);
          expect(sample.select.y >= sample.cancel!.bottom).toBe(scenario.vertical);
        }
        if (role === 'guest' || !scenario.vertical) expect(sample.select.width).toBe(sample.naturalSelect!.width);
        if (adendaPhase !== 'base') {
          if (role === 'host' && scenario.vertical) {
            expect(Math.abs(sample.select.width - sample.cancel!.width)).toBeLessThanOrEqual(1);
            expect(Math.abs(sample.select.x - sample.cancel!.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(sample.select.right - sample.cancel!.right)).toBeLessThanOrEqual(1);
            expect(sample.select.height).toBe(sample.naturalSelect!.height); expect(sample.select.font).toBe(sample.naturalSelect!.font);
          }
          // Comparación física antes/después solo al aportar la referencia del mismo sistema/fuentes.
          if (process.env.KARTA3_B20_ADENDA_REFERENCE === '1') {
            const baseline = JSON.parse(await fs.readFile(`docs/sdd/evidencias/B20/adenda-selector-detalles/base/${scenario.label}.json`, 'utf8'));
            const old = baseline.find((row: { theme: string }) => row.theme === theme).samples.find((row: { role: string }) => row.role === role).measurement;
            expect(sample.cancel).toEqual(old.cancel);
            if (role === 'host' && scenario.vertical) { expect(sample.select.height).toBe(old.select.height); expect(sample.select.font).toBe(old.select.font); }
            else expect(sample.select).toEqual(old.select);
            expect(sample.card).toEqual(old.card);
          }
        }
        await fs.mkdir(adendaEvidence, { recursive: true });
        await page.screenshot({ path: `${adendaEvidence}/${scenario.label}-${role}-${theme}.png`, fullPage: true }); samples.push({ role, measurement: sample });
      }
      measurements.push({ theme, samples });
    }
    const after = await readGame(table.host); expect(after.game.interaction.turn).toEqual(before.game.interaction.turn);
    expect(after.settings).toEqual(before.settings); expect(after.revision).toBe(before.revision);
    await fs.writeFile(`${adendaEvidence}/${scenario.label}.json`, JSON.stringify(measurements, null, 2) + '\n', { flag: 'wx' });
  } finally { await table.close(); await server.stop(); }
});

for (const width of [1800, 390]) test(`B20 P1 paletas y geometría ${width}`, async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, undefined, { generic: true, solar: true, creatures: true });
  server.permutation(ids => ids);
  const table = await manualTable(browser, server.base, { width, height: width === 390 ? 844 : 1000,
    deckId: 'criaturas-magicas', version: 2, optimize: true });
  const folder = process.env.KARTA3_B20_ADENDA_ATTEMPT ? `${adendaEvidence}/palettes`
    : `playwright-report/b20/${process.env.KARTA3_B20_BASELINE ? 'base' : 'p1'}`;
  await fs.mkdir(folder, { recursive: true });
  try {
    const before = await readGame(table.host);
    const themes = process.env.KARTA3_B20_BASELINE ? ['BASE'] : ['LIGHT', 'DARK', 'CREAM', 'HIGH_CONTRAST'];
    let nativeBase: unknown;
    if (!process.env.KARTA3_B20_BASELINE) {
      // Misma base aprobada pre-B20; las métricas de la fuente dependen del SO.
      // Se conserva la comparación geométrica exacta, con referencia del mismo navegador.
      const baseCss = (await fs.readFile('src/style.css', 'utf8')).replace(/\r\n/g, '\n');
      expect(createHash('sha256').update(baseCss).digest('hex')).toBe('dcb9076c6cb225835c773440015b665f2557ebde5186c41d6ce2f3abf65d01e8');
      nativeBase = await table.host.evaluate(async css => {
        const sheets = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(link => ({ link, disabled: link.disabled }));
        const reference = document.createElement('style'); reference.textContent = css;
        for (const { link } of sheets) link.disabled = true;
        document.head.append(reference);
        const settle = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        try {
          await document.fonts.ready; await settle();
          return { theme: 'BASE_NATIVE', width: innerWidth, platform: navigator.platform, dpr: devicePixelRatio,
            elements: [...document.querySelectorAll('.game-hand .game-card,.game-hand .card-heading,.game-hand .game-card-image,.game-hand .card-values,.game-hand .card-play-button')].map(e => {
              const b = e.getBoundingClientRect(); const s = getComputedStyle(e);
              return { className: e.className, width: b.width, height: b.height, font: s.fontFamily, size: s.fontSize };
            }) };
        } finally {
          reference.remove(); for (const { link, disabled } of sheets) link.disabled = disabled;
          await document.fonts.ready; await settle();
        }
      }, baseCss);
      await fs.writeFile(`${folder}/${width}-native-base.json`, JSON.stringify(nativeBase, null, 2));
      const session = await table.host.context().newCDPSession(table.host);
      try {
        await session.send('DOM.enable'); await session.send('CSS.enable');
        const { root } = await session.send('DOM.getDocument');
        const fonts = [];
        for (const selector of ['.game-hand .card-heading', '.game-hand .card-values th', '.game-hand .card-values td']) {
          const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
          fonts.push({ selector, ...await session.send('CSS.getPlatformFontsForNode', { nodeId }) });
        }
        await fs.writeFile(`${folder}/${width}-platform-fonts.json`, JSON.stringify(fonts, null, 2));
      } finally { await session.detach(); }
    }
    const measures: unknown[] = [];
    const focusEvidence: unknown[] = [];
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
      if (theme !== 'BASE') {
        const dColor = theme === 'HIGH_CONTRAST' ? 'rgb(0, 0, 0)' : theme === 'CREAM' ? 'rgb(85, 57, 31)' : 'rgb(24, 43, 88)';
        await expect(details).toHaveCSS('outline-color', dColor);
        const actor = table.pages[1]; await actor.getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption(theme);
        const play = actor.locator('.game-hand .card-play-button').first(); await expect(play).toBeEnabled(); await play.focus();
        await play.press('Tab'); await actor.keyboard.press('Shift+Tab'); // Modalidad de teclado real: :focus-visible, sin jugar.
        const playColor = { LIGHT: 'rgb(180, 90, 0)', DARK: 'rgb(255, 189, 102)', CREAM: 'rgb(151, 68, 0)', HIGH_CONTRAST: 'rgb(0, 189, 199)' }[theme];
        await expect(play).toBeFocused(); await expect(play).toHaveCSS('outline-color', playColor!);
        const real = await play.evaluate(e => { const s = getComputedStyle(e); return { background: s.backgroundColor, color: s.color, outline: s.outlineColor, outlineWidth: s.outlineWidth, outlineOffset: s.outlineOffset }; });
        focusEvidence.push({ theme, dColor, play: real });
      }
    }
    // Conservar las medidas también cuando falle una comparación posterior.
    await fs.writeFile(`${folder}/${width}-measures.json`, JSON.stringify(measures, null, 2));
    await fs.writeFile(`${folder}/${width}-focus.json`, JSON.stringify(focusEvidence, null, 2));
    if (!process.env.KARTA3_B20_BASELINE) {
      const geometry = (v: unknown) => (v as { elements: { className: string; width: number; height: number; font: string; size: string }[] }).elements.map(({ className, width, height, font, size }) => ({ className, width, height, font, size }));
      for (const measurement of measures) expect(geometry(measurement)).toEqual(geometry(nativeBase));
    }
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
