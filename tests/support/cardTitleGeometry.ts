import { expect, type Locator, type Page } from '@playwright/test';

export async function titleGeometry(face: Locator) {
  return face.evaluate(element => {
    const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const title = element.querySelector<HTMLElement>('h3')!;
    const heading = title.parentElement!; const icon = heading.querySelector<HTMLElement>('.card-round-attribute')!;
    const style = getComputedStyle(title); const hs = getComputedStyle(heading); const is = getComputedStyle(icon);
    const base = parseFloat(hs.getPropertyValue('--card-title-base-size')) || parseFloat(style.fontSize);
    const size = parseFloat(style.fontSize);
    const scale = element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth;
    const probe = document.createElement('span');
    Object.assign(probe.style, { font: style.font, fontKerning: style.fontKerning, fontFeatureSettings: style.fontFeatureSettings,
      letterSpacing: style.letterSpacing, wordSpacing: style.wordSpacing, textTransform: style.textTransform,
      whiteSpace: 'nowrap', position: 'fixed', visibility: 'hidden', width: 'max-content', maxWidth: 'none', padding: '0', border: '0', margin: '0' });
    probe.textContent = title.textContent; heading.append(probe);
    const width = (fontSize: number) => { probe.style.fontSize = `${fontSize}px`; return probe.getBoundingClientRect().width; };
    const baseWidth = width(base); const minWidth = width(12); const nextWidth = width(Math.min(base, Math.round((size + 0.1) * 10) / 10));
    probe.style.fontSize = `${base}px`; probe.textContent = 'M';
    const referenceBand = Math.max(parseFloat(getComputedStyle(probe).height) + parseFloat(style.marginTop) + parseFloat(style.marginBottom),
      parseFloat(is.height) + parseFloat(is.marginTop) + parseFloat(is.marginBottom)) * scale;
    probe.remove();
    const range = document.createRange(); range.selectNodeContents(title);
    const rects = [...range.getClientRects()].map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }));
    const image = element.querySelector<HTMLElement>('.game-card-image')!; const table = element.querySelector<HTMLTableElement>('table')!;
    const d = element.querySelector<HTMLButtonElement>('.card-details-button')!;
    const play = element.parentElement!.querySelector<HTMLButtonElement>('.card-play-button');
    const hit = (e: HTMLElement | null) => {
      if (!e) return null; const r = e.getBoundingClientRect(); const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { box: box(e), received: !!target && (target === e || e.contains(target)), tag: target?.tagName, className: target?.getAttribute('class') };
    };
    const cb = box(element); const tb = box(table); const ib = box(image);
    return { name: title.textContent, title: box(title), heading: box(heading), icon: box(icon), size, base, min: 12,
      available: title.getBoundingClientRect().width, baseWidth, minWidth, nextWidth, referenceBand, textRects: rects,
      family: style.fontFamily, weight: style.fontWeight, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing,
      gap: parseFloat(hs.columnGap) * scale, titleMargins: (parseFloat(style.marginLeft) + parseFloat(style.marginRight)) * scale,
      iconMargins: (parseFloat(is.marginLeft) + parseFloat(is.marginRight)) * scale, whiteSpace: style.whiteSpace,
      overflow: style.overflow, textOverflow: style.textOverflow, card: cb, image: ib, table: tb,
      gaps: [tb.y - ib.bottom, cb.bottom - parseFloat(getComputedStyle(element).borderBottomWidth) * scale - tb.bottom],
      rows: [...table.querySelectorAll('tbody tr')].map(row => {
        const ranges = [...row.querySelectorAll('th,td')].flatMap(cell => { const r = document.createRange(); r.selectNodeContents(cell); return [...r.getClientRects()].map(b => ({ top: b.top, bottom: b.bottom, height: b.height })); });
        return { text: row.textContent, box: box(row), content: ranges };
      }), padding: getComputedStyle(table.querySelector('tbody th')!).paddingTop,
      d: hit(d), play: hit(play), useful: document.querySelector<HTMLElement>('.game-composition')?.dataset.usefulWidth,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scale: visualViewport?.scale, cssZoom: getComputedStyle(document.documentElement).zoom },
    };
  });
}

export async function glyphFonts(page: Page, selector: string) {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('DOM.enable'); await session.send('CSS.enable');
    const doc = await session.send('DOM.getDocument');
    const result: Record<string, unknown> = {};
    for (const [key, suffix] of [['title', 'h3'], ['lastAttribute', 'tbody tr:last-child th'], ['ownSymbol', '.card-round-attribute']]) {
      const node = await session.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `${selector} ${suffix}` });
      result[key] = node.nodeId ? await session.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId }) : null;
    }
    return result;
  } finally { await session.detach(); }
}

export async function assertFittedTitle(face: Locator, name: string) {
  await expect(face.locator('h3')).toHaveText(name);
  await expect(face.getByRole('heading', { name, exact: true })).toHaveCount(1);
  // ResizeObserver y FontFaceSet se completan tras el cambio de viewport/fuente.
  // Se espera el estado medido, con el timeout normal de expect, sin sleeps ni reintentos de acciones.
  await expect.poll(async () => {
    const g = await titleGeometry(face);
    const bandReady = Math.abs(g.heading.height - g.referenceBand) < 0.05;
    const rangeReady = g.size >= 12 && g.size <= g.base;
    const cut = g.minWidth > g.available + 0.02;
    return bandReady && rangeReady && (cut ? g.size === 12 && g.overflow === 'hidden'
      : g.textRects[0].right <= g.title.right + 0.05 && (g.size === g.base || g.nextWidth > g.available - 0.02));
  }).toBe(true);
  const g = await titleGeometry(face);
  expect(g.size).toBeGreaterThanOrEqual(12); expect(g.size).toBeLessThanOrEqual(g.base);
  expect(g.whiteSpace).toBe('nowrap'); expect(g.textRects).toHaveLength(1);
  expect(g.heading.height).toBeCloseTo(g.referenceBand, 1);
  expect(g.available + g.icon.width + g.gap + g.titleMargins + g.iconMargins).toBeCloseTo(g.heading.width, 1);
  if (g.minWidth > g.available + 0.02) {
    expect(g.size).toBe(12); expect(g.overflow).toBe('hidden'); expect(g.textOverflow).toBe('clip');
  } else {
    expect(g.textRects[0].right).toBeLessThanOrEqual(g.title.right + 0.05);
    expect(g.textRects[0].x).toBeGreaterThanOrEqual(g.title.x - 0.05);
    if (g.size < g.base) expect(g.nextWidth).toBeGreaterThan(g.available - 0.02);
    else expect(g.baseWidth).toBeLessThanOrEqual(g.available + 0.02);
  }
  return g;
}

export function assertWholeFace(g: Awaited<ReturnType<typeof titleGeometry>>) {
  expect(g.gaps.every(gap => gap >= -0.02), JSON.stringify(g)).toBe(true);
  expect(Math.abs(g.gaps[0] - g.gaps[1])).toBeLessThan(0.06);
  for (const row of g.rows) {
    expect(row.box.y).toBeGreaterThanOrEqual(g.card.y);
    expect(row.box.bottom).toBeLessThanOrEqual(g.card.bottom + 0.01);
    for (const text of row.content) { expect(text.top).toBeGreaterThanOrEqual(g.card.y); expect(text.bottom).toBeLessThanOrEqual(g.card.bottom + 0.01); }
  }
  if (g.play) expect(g.play.box.y).toBeGreaterThanOrEqual(g.card.bottom);
}
