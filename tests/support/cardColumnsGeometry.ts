import type { Locator } from '@playwright/test';

/** Medición independiente de cajas y anchura íntegra; no cambia datos ni estilos de producto. */
export async function cardColumnsGeometry(face: Locator) {
  return face.evaluate(element => {
    const table = element.querySelector<HTMLTableElement>('.card-values')!;
    const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
    const scale = element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth;
    const cell = (e: HTMLElement) => {
      const s = getComputedStyle(e); const probe = document.createElement('span');
      for (const child of e.childNodes) probe.append(child.cloneNode(true));
      Object.assign(probe.style, { position: 'fixed', visibility: 'hidden', display: 'inline-block', whiteSpace: 'pre',
        width: 'max-content', maxWidth: 'none', padding: '0', border: '0', margin: '0', font: s.font,
        fontFeatureSettings: s.fontFeatureSettings, fontVariationSettings: s.fontVariationSettings, letterSpacing: s.letterSpacing, wordSpacing: s.wordSpacing });
      e.append(probe); const wholeWidth = probe.getBoundingClientRect().width / scale; probe.remove();
      const padding = [s.paddingLeft, s.paddingRight].map(parseFloat); const borders = [s.borderLeftWidth, s.borderRightWidth].map(parseFloat);
      const range = document.createRange(); range.selectNodeContents(e);
      return { text: e.textContent, box: box(e), cssWidth: s.width, clientWidth: e.clientWidth, offsetWidth: e.offsetWidth,
        useful: e.getBoundingClientRect().width / scale - padding.reduce((a, b) => a + b, 0) - borders.reduce((a, b) => a + b, 0),
        padding, borders, wholeWidth, font: s.font, align: s.textAlign, wrapping: s.overflowWrap,
        ranges: [...range.getClientRects()].map(r => ({ x: r.x, width: r.width, top: r.top, bottom: r.bottom })) };
    };
    return { scale, card: box(element), table: box(table), layout: getComputedStyle(table).tableLayout, declaredAttributeWidth: table.style.getPropertyValue('--card-attribute-width'),
      columns: [...table.querySelectorAll('tbody tr')].map(row => ({ row: box(row), attribute: cell(row.querySelector('th')!), value: cell(row.querySelector('td')!) })) };
  });
}
