import type { Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { titleGeometry, glyphFonts } from './cardTitleGeometry.js';
import { cardColumnsGeometry } from './cardColumnsGeometry.js';

/** Solo observa una condición ya fallida; no modifica datos, acciones o criterios. */
export async function publicationDiagnostics(page: Page, name: string) {
  try {
    const directory = 'playwright-report/b17-adenda/acceptance/publicacion-192-20261017';
    await fs.mkdir(directory, { recursive: true });
    const cards = [];
    for (const slot of await page.locator('.game-layout [data-card-id]').all()) {
      const id = await slot.getAttribute('data-card-id'); const face = slot.locator('article').first();
      const geometry = await titleGeometry(face); const columns = await cardColumnsGeometry(face);
      const fonts = await glyphFonts(page, `.game-layout [data-card-id="${id}"]`);
      const session = await page.context().newCDPSession(page); let valueFonts;
      try {
        await session.send('DOM.enable'); await session.send('CSS.enable');
        const doc = await session.send('DOM.getDocument');
        const node = await session.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `.game-layout [data-card-id="${id}"] tbody tr:nth-child(2) td` });
        valueFonts = node.nodeId ? await session.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId }) : null;
      } finally { await session.detach(); }
      const control = await slot.evaluate(e => {
        const button = e.querySelector<HTMLButtonElement>('.card-play-button'); if (!button) return null;
        const r = button.getBoundingClientRect(); const x = r.x + r.width / 2; const y = r.y + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        return { disabled: button.disabled, label: button.getAttribute('aria-label'), x, y,
          inViewport: x >= 0 && x < innerWidth && y >= 0 && y < innerHeight,
          received: hit === button || !!hit && button.contains(hit), tag: hit?.tagName, className: hit?.getAttribute('class'),
          category: 'sondeo geométrico sin clic; no acredita avance' };
      });
      cards.push({ id, geometry, columns, fonts, valueFonts, control });
    }
    await fs.writeFile(`${directory}/${name}.json`, JSON.stringify({ date: new Date().toISOString(), node: process.version,
      browser: page.context().browser()!.version(), cards }, null, 2) + '\n');
    await page.screenshot({ path: `${directory}/${name}.png`, fullPage: true });
  } catch (error) { console.warn('No se pudo completar el diagnóstico de publicación:', error); }
}
