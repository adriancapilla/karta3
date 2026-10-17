import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, readGame, humanPlay } from '../support/manualBrowserCases.js';
import { cardColumnsGeometry } from '../support/cardColumnsGeometry.js';
import { titleGeometry, assertWholeFace, glyphFonts } from '../support/cardTitleGeometry.js';

const output = 'playwright-report/b17-adenda/acceptance/continuacion-20261017/final-G';
for (const id of ['portada', 'generica', 'sistema-solar', 'criaturas-magicas', 'controlled-monospace']) for (const mode of ['PLAY_VALUE', 'DISPLAY_VALUE'] as const) {
  test(`ADENDA B17 G columnas ${id} ${mode}: necesidades, uniformidad, contenido y clic habilitado`, async ({ browser }) => {
    const s = await configurationBrowserServer(true, true, undefined, { longTitle: true, generic: true, solar: true, creatures: true });
    const deckId = id === 'controlled-monospace' ? 'portada' : id;
    const p = await manualTable(browser, s.base, { deckId, version: deckId === 'portada' ? 7 : deckId === 'criaturas-magicas' ? 2 : 4, valueMode: mode, width: 1280, turn: 60, review: 5 });
    const label = `${id}-${mode}`;
    try {
      if (id === 'controlled-monospace') {
        await p.host.addStyleTag({ content: "@font-face{font-family:B17ColumnsMono;src:local('Courier New'),local('DejaVu Sans Mono')} .full-card .card-values{font-family:B17ColumnsMono,monospace}" });
        await p.host.evaluate(() => document.fonts.ready);
      }
      const before = await readGame(p.host); const measurements = [];
      await fs.mkdir(output, { recursive: true });
      for (const slot of await p.host.locator('.game-hand [data-card-id]').all()) {
        const face = slot.locator('article');
        await expect.poll(async () => {
          const c = await cardColumnsGeometry(face);
          return c.columns.every(row => row.attribute.wholeWidth <= row.attribute.useful + 0.02 && row.value.wholeWidth <= row.value.useful + 0.02);
        }).toBe(true);
        const columns = await cardColumnsGeometry(face); const geometry = await titleGeometry(face); assertWholeFace(geometry);
        expect(columns.columns.every(row => row.attribute.box.width === columns.columns[0].attribute.box.width)).toBe(true);
        measurements.push({ columns, geometry, fonts: await glyphFonts(p.host, `.game-hand [data-card-id="${await slot.getAttribute('data-card-id')}"]`) });
      }
      expect(new Set(measurements.map(m => m.columns.columns[0].attribute.box.width)).size).toBe(1);
      // Comprobación auxiliar del corpus aprobado fuera de Game, sin enriquecer HTTP o vistas privadas.
      let corpus: unknown;
      if (deckId !== 'portada') {
        const cards = (JSON.parse(await fs.readFile(`barajas/${deckId}/cartas.json`, 'utf8')) as { cards: { id: string; values: Record<string, { playValue: number; displayValue: string; unit: string }> }[] }).cards;
        corpus = await p.host.locator('.game-hand article').first().evaluate((element, args) => {
          const probe = element.parentElement!.cloneNode(true) as HTMLElement;
          Object.assign(probe.style, { position: 'fixed', visibility: 'hidden', top: '0', left: '0' }); probe.setAttribute('aria-hidden', 'true'); document.body.append(probe);
          const values = [...probe.querySelectorAll('tbody td')]; const results = [];
          for (const card of args.cards) {
            args.attributes.forEach((a, i) => { const v = card.values[a.id]; values[i].textContent = args.mode === 'PLAY_VALUE' ? String(v.playValue) : v.displayValue + (v.unit ? ` ${v.unit}` : ''); });
            const cells = values.map(cell => { const e = cell as HTMLElement; const style = getComputedStyle(e); const range = document.createRange(); range.selectNodeContents(e); return { text: e.textContent, width: e.getBoundingClientRect().width, padding: parseFloat(style.paddingLeft) + parseFloat(style.paddingRight), textWidth: range.getBoundingClientRect().width, vertical: e.getBoundingClientRect().height }; });
            results.push({ id: card.id, attributeWidth: probe.querySelector('tbody th')!.getBoundingClientRect().width, cells });
          }
          probe.remove(); return results;
        }, { cards, attributes: before.game.attributes, mode });
        const rows = corpus as { attributeWidth: number; cells: { width: number; padding: number; textWidth: number }[] }[];
        expect(rows).toHaveLength(58); expect(new Set(rows.map(r => r.attributeWidth)).size).toBe(1);
        expect(rows.every(r => r.cells.every(c => c.textWidth <= c.width - c.padding + 0.05))).toBe(true);
      }
      const d = p.host.locator('.game-hand .card-details-button').first(); await d.press('Enter');
      await p.host.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape'); await expect(d).toBeFocused();
      expect((await readGame(p.host)).game.interaction.turn).toEqual(before.game.interaction.turn);
      const card = before.game.hand[0]; const slot = p.host.locator(`.game-hand [data-card-id="${card.id}"]`);
      await humanPlay(p); const button = slot.locator('.card-play-button'); await expect(button).toBeEnabled(); await button.scrollIntoViewIfNeeded();
      const actionable = await titleGeometry(slot.locator('article')); expect(actionable.play!.received).toBe(true); assertWholeFace(actionable);
      await button.evaluate(e => { const region = e.closest('.game-hand')!; e.addEventListener('click', event => region.setAttribute('data-columns-click', String(event.isTrusted)), { once: true }); });
      const turn = (await readGame(p.host)).game.interaction.turn!.id;
      await button.click(); await expect(p.host.locator('.game-hand')).toHaveAttribute('data-columns-click', 'true');
      await expect.poll(async () => (await readGame(p.host)).game.interaction.turn?.id).not.toBe(turn);
      expect((await readGame(p.host)).game.round.plays.filter(play => play.card.id === card.id)).toHaveLength(1);
      await fs.writeFile(`${output}/${label}.json`, JSON.stringify({ measurements, corpus, actionable, trustedClick: true, singlePlay: true, browser: browser.version() }, null, 2) + '\n');
      await p.host.screenshot({ path: `${output}/${label}.png`, fullPage: true });
    } catch (error) {
      await fs.mkdir(output, { recursive: true });
      await fs.writeFile(`${output}/${label}-failure.json`, JSON.stringify(await cardColumnsGeometry(p.host.locator('.game-hand article').first()), null, 2) + '\n');
      throw error;
    } finally { await p.close(); await s.stop(); }
  });
}
