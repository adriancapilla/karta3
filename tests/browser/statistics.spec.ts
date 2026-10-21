import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { statisticsBrowserServer } from '../support/statisticsBrowserServer.js';
import { manualTable } from '../support/manualBrowserCases.js';
import { publicationState, statisticsObservation } from '../support/b20b21PublicationDiagnostics.js';

async function confirmedControl(page: Page, route: string, action: () => Promise<void>) {
  const reply = page.waitForResponse(response => new URL(response.url()).pathname === `/api/statistics/${route}` && response.request().method() === 'PUT');
  await action(); const response = await reply; expect(response.status(), `confirmación de ${route}`).toBe(200);
  await response.finished();
  await expect(page.locator('.usage-choice-actions').first()).toHaveAttribute('aria-busy', 'false');
}

test('B21 apariencia consentida: dos sesiones/pestañas, congelado, F5, final, consulta tardía y otra sala', async ({ browser }) => {
  const s = await statisticsBrowserServer();
  const table = await manualTable(browser, s.base, { width: 390, optimize: true, beforeCreate: async pages => {
    for (const page of pages) { await page.getByRole('button', { name: 'Permitir', exact: true }).click(); await expect(page.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible(); }
    await pages[1].getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('DARK');
  } });
  try {
    await expect.poll(() => s.total('APPEARANCE', 'L0', 'start')).toBe(1); await expect.poll(() => s.total('APPEARANCE', 'D1', 'start')).toBe(1);
    const tab = await table.host.context().newPage(); await tab.goto(table.host.url()); await expect(tab.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
    await table.host.reload(); await expect(table.host.getByRole('heading', { name: /Partida ·/ })).toBeVisible();
    await table.host.getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('LIGHT');
    await table.pages[1].getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('CREAM');
    await table.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await table.host.getByRole('dialog').getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await expect(table.host.getByRole('heading', { name: 'Partida cancelada por el anfitrión', exact: true })).toBeVisible();
    await expect.poll(() => s.total('APPEARANCE', 'L0:L1', 'pair')).toBe(1); await expect.poll(() => s.total('APPEARANCE', 'D1:C1', 'pair')).toBe(1);
    const count = s.cells().filter(c => ['start', 'end', 'pair'].includes(c.dimension));
    await table.host.reload(); await expect(table.host.getByRole('heading', { name: 'Partida cancelada por el anfitrión', exact: true })).toBeVisible();
    await table.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await table.host.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(table.host.locator('.code')).toBeVisible();
    await s.writer.flush(); expect(s.cells().filter(c => ['start', 'end', 'pair'].includes(c.dimension))).toEqual(count);
    await fs.mkdir('playwright-report/b21/product', { recursive: true }); await table.host.screenshot({ path: 'playwright-report/b21/product/new-room-390.png', fullPage: true });
  } finally { await table.close(); await s.stop(); }
});

test('B21 HOME mínimo sin identificadores, permiso separado, exclusión compartida y pestañas', async ({ browser }) => {
  const s = await statisticsBrowserServer(); const context = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await context.newPage();
  const observations = new Map([[page, statisticsObservation(page)]]);
  let releaseExclusionReply = () => {}; let exclusionOperation: Promise<void> | undefined;
  const homeBodies: unknown[] = []; const photos: string[] = [];
  page.on('request', req => { if (req.url().endsWith('/api/statistics/home-view')) homeBodies.push(req.postDataJSON()); if (req.url().endsWith('/api/statistics/appearance')) photos.push(req.postData() ?? ''); });
  try {
    await page.goto(s.base); await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Consultar preferencias estadísticas', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Analítica y privacidad', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Excluir mi actividad de las estadísticas', exact: true })).toBeEnabled();
    await expect.poll(() => s.total('HOME', 'all', 'total')).toBe(1);
    await confirmedControl(page, 'appearance-permission', () => page.getByRole('button', { name: 'No permitir', exact: true }).click());
    await expect(page.getByRole('button', { name: 'Permitir', exact: true })).toBeVisible();
    await page.reload(); await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible(); await expect.poll(() => s.total('HOME', 'all', 'total')).toBe(2);
    await expect(page.getByRole('button', { name: 'Consultar preferencias estadísticas', exact: true })).toHaveCount(0);
    await expect(page.getByText('Sin permiso de apariencia: no se consulta ni transmite el tema para estadísticas.', { exact: true })).toBeVisible();
    expect(homeBodies).toEqual([{ version: 1 }, { version: 1 }]); expect(photos).toEqual([]);
    await page.getByRole('button', { name: 'Permitir', exact: true }).focus();
    await confirmedControl(page, 'appearance-permission', () => page.getByRole('button', { name: 'Permitir', exact: true }).press('Enter'));
    await expect(page.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(page.locator('.code')).toBeVisible();
    const tab = await context.newPage(); observations.set(tab, statisticsObservation(tab)); await tab.goto(page.url()); await expect(tab.locator('.code')).toBeVisible();
    await expect(tab.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Retirar permiso', exact: true }).focus();
    await confirmedControl(page, 'appearance-permission', () => page.getByRole('button', { name: 'Retirar permiso', exact: true }).press('Space'));
    for (const ownPage of [page, tab]) {
      await expect(ownPage.getByRole('button', { name: 'Permitir', exact: true })).toBeEnabled();
      await expect(ownPage.getByRole('button', { name: 'No permitir', exact: true })).toBeVisible();
      await expect(ownPage.getByRole('button', { name: 'Retirar permiso', exact: true })).toHaveCount(0);
      await expect(ownPage.getByRole('button', { name: 'Consultar preferencias estadísticas', exact: true })).toHaveCount(0);
    }
    // Contraejemplo del montaje anterior: el corte remoto ya es visible mientras
    // la petición de la pestaña de origen sigue pendiente. No invertir esa acción
    // hasta su confirmación, ni confundir un texto optimista con su finalización.
    let exclusionFetched = false;
    const released = new Promise<void>(resolve => { releaseExclusionReply = resolve; });
    await tab.route('**/api/statistics/exclusion', async route => {
      if (route.request().method() !== 'PUT' || route.request().postDataJSON().excluded !== true) { await route.continue(); return; }
      const response = await route.fetch(); exclusionFetched = true; await released; await route.fulfill({ response });
    });
    exclusionOperation = confirmedControl(tab, 'exclusion', () => tab.getByRole('button', { name: 'Excluir mi actividad de las estadísticas', exact: true }).click());
    await expect.poll(() => exclusionFetched).toBe(true);
    await expect(page.getByText('Actividad excluida de las estadísticas. Puedes jugar igual.', { exact: true })).toBeVisible();
    await expect(tab.locator('.usage-choice-actions').first()).toHaveAttribute('aria-busy', 'true');
    await publicationState(tab, 'B21-exclusion-visible-before-origin-ack', await observations.get(tab)!());
    releaseExclusionReply(); await exclusionOperation;
    await expect.poll(() => s.total('WAITING', 'cut')).toBe(1); expect(s.total('CREATION', 'all', 'total')).toBe(1);
    await confirmedControl(page, 'exclusion', () => page.getByRole('button', { name: 'Volver a incluir mi actividad', exact: true }).click());
    await expect(page.getByRole('button', { name: 'Excluir mi actividad de las estadísticas', exact: true })).toBeVisible();
    await expect(tab.getByRole('button', { name: 'Excluir mi actividad de las estadísticas', exact: true })).toBeVisible();
    expect(s.total('WAITING', 'cut')).toBe(1);
    await fs.mkdir('playwright-report/b21/product', { recursive: true }); await page.screenshot({ path: 'playwright-report/b21/product/controls-1280.png', fullPage: true });
    for (const [index, [observed, network]] of [...observations].entries()) await publicationState(observed, `B21-reinclude-completed-tab-${index}`, await network());
  } catch (error) {
    for (const [index, [observed, network]] of [...observations].entries()) await publicationState(observed, `B21-reinclude-tab-${index}`, await network());
    throw error;
  } finally { releaseExclusionReply(); await exclusionOperation?.catch(() => {}); await context.close(); await s.stop(); }
});

test('B21 sesión anterior pendiente sin HOME, fotos o alta; elegir inclusión no concede apariencia', async ({ browser }) => {
  const s = await statisticsBrowserServer(); const context = await browser.newContext();
  await context.addCookies([{ name: 'karta3_session', value: 'synthetic-previous-functional-cookie', url: s.base }]); const page = await context.newPage();
  try {
    await page.goto(s.base); await expect(page.getByText(/Confirma si quieres incluir tu actividad/)).toBeVisible();
    expect(s.total('HOME', 'all', 'total')).toBe(0); await page.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(page.locator('.code')).toBeVisible(); expect(s.total('CREATION', 'all', 'total')).toBe(0);
    await page.getByRole('button', { name: 'Volver a incluir mi actividad', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Permitir', exact: true })).toBeEnabled(); expect(s.total('CREATION', 'all', 'total')).toBe(0);
    await expect(page.getByText(/Sin permiso de apariencia/)).toBeVisible();
  } finally { await context.close(); await s.stop(); }
});
