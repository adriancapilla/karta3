import { expect, test } from '@playwright/test';
import { usageInstallation } from '../support/usageCompiledServer.js';

test('H02 compilado: creación incierta, reinicio OFF y reconexión descartan contexto sin reenviar la intención', async ({ browser }) => {
  const installation = await usageInstallation(); let server = await installation.start();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await context.newPage();
  const browserEvents: string[] = []; const creations: { body: string | null; statistical: string | undefined }[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/usage/events')) browserEvents.push(request.postData() ?? '');
    if (request.url().endsWith('/api/rooms') && request.method() === 'POST') creations.push({ body: request.postData(), statistical: request.headers()['x-karta3-usage-context'] });
  });
  try {
    await page.goto(server.base); await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await expect.poll(() => installation.events().filter(event => event.name === 'home_viewed').length).toBe(1);
    await page.route('**/api/rooms', route => route.abort('connectionreset'));
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('No se pudo conectar'); expect(creations[0].statistical).toBeTruthy();
    await server.stop(); const before = installation.events().length; const postsBefore = browserEvents.length;
    server = await installation.start(false, Number(new URL(server.base).port)); await page.unroute('**/api/rooms');
    await page.getByRole('button', { name: 'Reintentar conexión', exact: true }).click();
    await expect.poll(async () => (await page.request.get(server.base + '/api/rooms/current')).headers()['x-karta3-usage-collection']).toBe('off');
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    expect(creations.at(-1)).toEqual({ body: '{}', statistical: undefined }); expect(browserEvents).toHaveLength(postsBefore);
    expect(installation.events()).toHaveLength(before);
    await page.reload(); await expect(page.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    expect(browserEvents).toHaveLength(postsBefore);
  } finally { await context.close(); await server.stop(); await installation.cleanup(); }
});

test('H02 compilado: respuesta SYNTHETIC antigua no reactiva tras OFF del proceso nuevo', async ({ browser }) => {
  const installation = await usageInstallation(); let server = await installation.start();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await context.newPage();
  let release!: () => void; let intercepted!: () => void;
  const waiting = new Promise<void>(resolve => { intercepted = resolve; }); const hold = new Promise<void>(resolve => { release = resolve; });
  const posts: string[] = []; const creationContexts: (string | undefined)[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/usage/events')) posts.push(request.postData() ?? '');
    if (request.url().endsWith('/api/rooms') && request.method() === 'POST') creationContexts.push(request.headers()['x-karta3-usage-context']);
  });
  try {
    await page.goto(server.base); await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await page.route('**/api/decks', async route => { const response = await route.fetch(); intercepted(); await hold; await route.fulfill({ response }); });
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click(); await waiting;
    await server.stop(); const previousPosts = posts.length;
    server = await installation.start(false, Number(new URL(server.base).port));
    await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    const oldResponse = page.waitForResponse(response => response.url().endsWith('/api/decks'));
    release(); await (await oldResponse).finished(); await page.unroute('**/api/decks');
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    expect(posts).toHaveLength(previousPosts); expect(creationContexts.at(-1)).toBeUndefined();
  } finally { release?.(); await context.close(); await server.stop(); await installation.cleanup(); }
});
