import type { Page } from '@playwright/test';
import fs from 'node:fs/promises';

/** Observación de una instalación sintética; nunca conserva cookies o ids de sala/sesión. */
export async function b11KeyboardObservation(page: Page) {
  const transport: unknown[] = [];
  const pending: Promise<void>[] = [];
  const decode = (text: string, direction: string, at: number) => {
    for (const part of text.split('\x1e')) {
      const event = part.match(/^42(\d*)\["([^"]+)"/);
      const ack = part.match(/^43(\d+)(.*)$/);
      if (event) transport.push({ direction, at, kind: 'event', ack: event[1], event: event[2] });
      else if (ack) {
        try {
          const [result] = JSON.parse(ack[2]) as [{ ok?: boolean; error?: { code?: string }; room?: { revision?: number; game?: { round?: { direction?: string; plays?: unknown[] } } } }];
          transport.push({ direction, at, kind: 'ack', ack: ack[1], ok: result.ok, error: result.error?.code,
            revision: result.room?.revision, directionValue: result.room?.game?.round?.direction, plays: result.room?.game?.round?.plays?.length });
        } catch { transport.push({ direction, at, kind: 'unparsed-ack' }); }
      }
    }
  };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketFrameSent', event => decode(event.response.payloadData, 'sent-websocket', event.timestamp));
  cdp.on('Network.webSocketFrameReceived', event => decode(event.response.payloadData, 'received-websocket', event.timestamp));
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/socket.io/') && request.method() === 'POST') decode(request.postData() ?? '', 'sent-polling', Date.now());
  });
  page.on('response', response => {
    if (new URL(response.url()).pathname.startsWith('/socket.io/') && response.request().method() === 'GET') {
      pending.push(response.text().then(text => decode(text, 'received-polling', Date.now())).catch(() => {}));
    }
  });
  await page.evaluate(() => {
    const state = window as unknown as { b11Observation: unknown[] }; state.b11Observation = [];
    const describe = (element: Element | null) => ({ tag: element?.tagName, className: element?.className,
      label: element?.getAttribute('aria-label'), cardId: element?.closest<HTMLElement>('[data-card-id]')?.dataset.cardId,
      disabled: element instanceof HTMLButtonElement ? element.disabled : undefined });
    for (const type of ['keydown', 'keyup', 'click', 'focusin', 'focusout', 'close']) document.addEventListener(type, event => {
      const item = { at: performance.now(), type, key: event instanceof KeyboardEvent ? event.key : undefined,
        trusted: event.isTrusted, target: describe(event.target instanceof Element ? event.target : null),
        active: describe(document.activeElement), documentFocused: document.hasFocus(), prevented: event.defaultPrevented,
        dialogs: [...document.querySelectorAll<HTMLDialogElement>('dialog')].map(dialog => ({ open: dialog.open, connected: dialog.isConnected })) };
      state.b11Observation.push(item);
      queueMicrotask(() => { item.prevented = event.defaultPrevented; });
    }, true);
  });
  return {
    mark: async (label: string) => page.evaluate(label => {
      (window as unknown as { b11Observation: unknown[] }).b11Observation.push({ at: performance.now(), mark: label,
        documentFocused: document.hasFocus(), active: document.activeElement?.getAttribute('aria-label'),
        play: [...document.querySelectorAll<HTMLButtonElement>('.game-hand .card-play-button')].map(button => ({ label: button.getAttribute('aria-label'), disabled: button.disabled, focused: button === document.activeElement })),
        dialogs: [...document.querySelectorAll<HTMLDialogElement>('dialog')].map(dialog => ({ open: dialog.open, connected: dialog.isConnected })) });
    }, label),
    save: async (width: number, serverEvents: readonly { event: string }[], result: 'completed' | 'failed', scenario = '') => {
      await Promise.allSettled(pending);
      const dom = await page.evaluate(() => (window as unknown as { b11Observation: unknown[] }).b11Observation);
      const errors = await page.locator('.game-action-error,[role="alert"]').allTextContents();
      const folder = 'playwright-report/b21/publication'; await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(`${folder}/B11-access-${width}${scenario ? `-${scenario}` : ''}-${result}.json`, JSON.stringify({ width, scenario, result, dom, transport, serverEvents: serverEvents.map(({ event }) => ({ event })), errors }, null, 2) + '\n');
      await cdp.detach();
    }
  };
}
