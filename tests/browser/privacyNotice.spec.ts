import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { privacyNotice, privacyOperations } from '../../shared/contracts/privacyNotice.js';
import { usageInstallation } from '../support/usageCompiledServer.js';

for (const width of [390, 1280]) test(`H06 aviso factual ${width}: OFF,200/no-store, sin sesión, visita o captura`, async ({ browser }) => {
  const installation = await usageInstallation(); const server = await installation.start(false);
  const context = await browser.newContext({ viewport: { width, height: 844 } }); const page = await context.newPage();
  const apiRequests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.addInitScript(() => {
    const state = window as Window & { usageTestUuid: number }; state.usageTestUuid = 0;
    const original = crypto.randomUUID.bind(crypto); crypto.randomUUID = () => { state.usageTestUuid++; return original(); };
  });
  try {
    const response = await page.goto(`${server.base}/privacidad`);
    expect(response?.status()).toBe(200); expect(response?.headers()['cache-control']).toBe('no-store');
    expect(response?.headers()['set-cookie']).toBeUndefined(); expect(response?.headers()['x-karta3-usage-collection']).toBe('off');
    await expect(page.getByRole('heading', { name: 'Privacidad y analítica', exact: true })).toBeVisible();
    expect(privacyNotice.complete).toBe(true); await expect(page.locator('main')).toContainText(`Versión ${privacyNotice.version}`);
    for (const value of Object.values(privacyOperations)) await expect(page.locator('main')).toContainText(value);
    await expect(page.locator('main')).toContainText(privacyNotice.firstLayer);
    await expect(page.locator('main')).toContainText(privacyNotice.minorCaution);
    const text = (await page.locator('main').innerText()).replaceAll('\r\n', '\n') + '\n';
    expect(text).not.toMatch(/\[(DESTINATARIOS|COMPLETAR|PENDIENTE)|placeholder/);
    await page.getByRole('link', { name: 'Volver al juego', exact: true }).focus();
    await expect(page.getByRole('link', { name: 'Volver al juego', exact: true })).toBeFocused();
    expect(await context.cookies()).toEqual([]); expect(apiRequests).toEqual([]);
    expect(await page.evaluate(() => (window as Window & { usageTestUuid: number }).usageTestUuid)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(fs.access(installation.file)).rejects.toThrow();
    const alternate = await page.request.get(`${server.base}/PRIVACIDAD/`);
    expect(alternate.status()).toBe(200); expect(alternate.headers()['cache-control']).toBe('no-store');
    expect(alternate.headers()['set-cookie']).toBeUndefined();
    const folder = 'playwright-report/b19/aviso-final'; await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(`${folder}/aviso-${width}.txt`, text, 'utf8');
    await fs.writeFile(`${folder}/medidas-${width}.json`, JSON.stringify({ width, noticeVersion: privacyNotice.version,
      sha256: createHash('sha256').update(text).digest('hex'), status: response?.status(), cache: response?.headers()['cache-control'],
      signal: response?.headers()['x-karta3-usage-collection'], cookieCount: (await context.cookies()).length,
      apiRequests: apiRequests.length, fileCreated: false, capture: 'off' }, null, 2));
    await page.screenshot({ path: `${folder}/aviso-${width}.png`, fullPage: true });
  } finally { await context.close(); await server.stop(); await installation.cleanup(); }
});
