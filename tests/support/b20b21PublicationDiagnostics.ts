import type { Page } from '@playwright/test';
import fs from 'node:fs/promises';

/** Solo ensayos fabricados: no guarda cookies, cuerpos libres, ids de sala o tokens. */
export function statisticsObservation(page: Page) {
  const events: unknown[] = []; const pending: Promise<void>[] = [];
  page.on('request', request => {
    const route = new URL(request.url()).pathname;
    if (!route.startsWith('/api/statistics/')) return;
    let input: Record<string, unknown> = {};
    try { input = request.postDataJSON() ?? {}; } catch { /* Sin cuerpo JSON. */ }
    events.push({ at: Date.now(), kind: 'request', route, method: request.method(), input: Object.fromEntries(
      ['excluded', 'decision', 'expectedRevision', 'noticeVersion', 'version'].filter(key => key in input).map(key => [key, input[key]])) });
  });
  page.on('response', response => {
    const route = new URL(response.url()).pathname;
    if (!route.startsWith('/api/statistics/')) return;
    pending.push((async () => {
      const body = await response.json().catch(() => ({})) as Record<string, unknown> & { error?: { code?: string } };
      events.push({ at: Date.now(), kind: 'response', route, status: response.status(), error: body.error?.code,
        view: Object.fromEntries(['excluded', 'revision', 'eligibility', 'persistence', 'state', 'noticeVersion', 'version'].filter(key => key in body).map(key => [key, body[key]])) });
    })());
  });
  return async () => { await Promise.allSettled(pending); return events; };
}

export async function observeKeyboard(page: Page) {
  await page.evaluate(() => {
    const context = window as unknown as { publicationKeys: unknown[] }; context.publicationKeys = [];
    for (const type of ['keydown', 'keyup', 'click', 'focusin']) document.addEventListener(type, event => {
      const element = event.target instanceof Element ? event.target : null;
      context.publicationKeys.push({ at: performance.now(), type, key: event instanceof KeyboardEvent ? event.key : undefined,
        trusted: event.isTrusted, tag: element?.tagName, className: element?.className,
        text: element?.closest('button')?.textContent?.slice(0, 90), active: document.activeElement?.tagName });
    }, true);
  });
}

export async function publicationState(page: Page, label: string, network?: unknown[]) {
  const state = await page.evaluate(() => {
    const box = (element: Element) => { const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
      return { tag: element.tagName, className: element.className, x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height,
        bottom: rect.bottom + scrollY, font: style.font, display: style.display, overflow: style.overflow }; };
    const active = document.activeElement;
    return { viewport: { width: innerWidth, height: innerHeight }, page: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      boxes: [...document.querySelectorAll('main,header,.game-summary,.game-composition,.game-layout,.game-panel,.usage-choice,.appearance-control,dialog,.card-details-actions,.deck-information-button')].map(box),
      focus: active ? { ...box(active), text: active.closest('button')?.textContent } : null,
      controls: [...document.querySelectorAll('.usage-choice button,.usage-choice [aria-live],header select')].map(element => ({ ...box(element), text: element.textContent,
        disabled: element instanceof HTMLButtonElement ? element.disabled : undefined })),
      keys: (window as unknown as { publicationKeys?: unknown[] }).publicationKeys ?? [] };
  });
  const folder = 'playwright-report/b21/publication'; await fs.mkdir(folder, { recursive: true });
  const name = label.replace(/[^a-z0-9_-]/gi, '-');
  await fs.writeFile(`${folder}/${name}.json`, JSON.stringify({ state, network }, null, 2) + '\n');
  await page.screenshot({ path: `${folder}/${name}.png`, fullPage: true });
}
