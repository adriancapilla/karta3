import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { appearanceBrowserServer } from '../support/appearanceBrowserServer.js';
import { usageInstallation } from '../support/usageCompiledServer.js';
import { manualTable, humanPlay, readRoom } from '../support/manualBrowserCases.js';

async function accept(pages: readonly Page[]) {
  for (const page of pages) {
    await page.getByRole('button', { name: 'Aceptar analítica', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
  }
}
const snapshots = (events: ReturnType<Awaited<ReturnType<typeof appearanceBrowserServer>>['events']>) => events.filter(event => event.name === 'appearance_snapshot');

test('B20 transporte SYNTHETIC aislado conserva contexto autenticado y fotografías sin mezclar HUMAN', async ({ browser }) => {
  const installation = await usageInstallation(); const server = await installation.start();
  const table = await manualTable(browser, server.base, { turn: 60 });
  try {
    await expect.poll(() => snapshots(installation.events()).length).toBe(2);
    await table.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await table.host.getByRole('dialog').getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await expect.poll(() => snapshots(installation.events()).length).toBe(4);
    expect(installation.events().every(event => event.traffic === 'SYNTHETIC' && event.environment === 'test')).toBe(true);
  } finally { await table.close(); await server.stop(); await installation.cleanup(); }
});

test('B20 cancelación: dos sesiones/pestañas, par neto, recargas, consulta tardía y nueva sala', async ({ browser }) => {
  const s = await appearanceBrowserServer(); let tab: Page | undefined;
  const table = await manualTable(browser, s.base, { width: 390, optimize: true, beforeCreate: async pages => {
    await accept(pages); await pages[1].getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('DARK');
    tab = await pages[0].context().newPage(); await tab.goto(s.base);
    await expect(tab.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
  } });
  try {
    await expect.poll(() => snapshots(s.events()).length).toBe(2);
    const start = snapshots(s.events()); expect(start.map(event => [event.data.theme, event.data.origin]).sort()).toEqual([['DARK', 'EXPLICIT'], ['LIGHT', 'DEFAULT']]);
    await table.host.getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('DARK');
    await table.host.getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('LIGHT');
    await table.pages[1].getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('CREAM');
    expect(snapshots(s.events())).toHaveLength(2);
    await table.host.reload(); await expect(table.host.getByRole('heading', { name: /Partida ·/ })).toBeVisible();
    await table.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    const dialog = table.host.getByRole('dialog'); await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await expect(table.host.getByRole('heading', { name: 'Partida cancelada por el anfitrión', exact: true })).toBeVisible();
    await expect.poll(() => snapshots(s.events()).length).toBe(4);
    const end = snapshots(s.events()).filter(event => event.data.moment === 'END');
    expect(end.map(event => [event.data.theme, event.data.origin]).sort()).toEqual([['CREAM', 'EXPLICIT'], ['LIGHT', 'EXPLICIT']]);
    const resultUrl = table.host.url();
    // B13 libera la asociación activa; el resumen sigue autorizado por su URL.
    expect(await readRoom(table.host)).toBeNull();
    await table.host.reload(); await expect(table.host.getByRole('heading', { name: 'Partida cancelada por el anfitrión', exact: true })).toBeVisible();
    await table.host.getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('HIGH_CONTRAST');
    await table.host.screenshot({ path: 'playwright-report/b20/results-390.png', fullPage: true });
    expect(snapshots(s.events())).toHaveLength(4);
    await table.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await table.host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    const next = await readRoom(table.host); expect(table.host.url()).not.toBe(resultUrl);
    await tab!.goto(resultUrl); await expect(tab!.getByRole('heading', { name: 'Partida cancelada por el anfitrión', exact: true })).toBeVisible();
    expect((await readRoom(table.host)).id).toBe(next.id); expect(snapshots(s.events())).toHaveLength(4);
  } finally { await table.close(); await s.stop(); }
});

test('B20 inactividad y desconexión real: falta END, reconexión/consulta no lo reconstruyen', async ({ browser }) => {
  const s = await appearanceBrowserServer();
  const table = await manualTable(browser, s.base, { turn: 15, review: 0, beforeCreate: accept });
  try {
    await expect.poll(() => snapshots(s.events()).length).toBe(2);
    await table.contexts[1].setOffline(true);
    await expect(table.pages[1].getByText('Conexión interrumpida. Intentando recuperarla…')).toBeVisible();
    for (let step = 0; step < 12 && (await readRoom(table.host)).status === 'IN_GAME'; step++) { s.time.advance(15000); await readRoom(table.host); }
    await expect(table.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    await expect(table.host.getByText('La partida terminó porque todos los jugadores humanos pasaron a automático')).toBeVisible();
    await expect.poll(() => snapshots(s.events()).length).toBe(3);
    await table.contexts[1].setOffline(false);
    await expect(table.pages[1].getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible({ timeout: 10000 });
    await table.pages[1].reload(); await expect(table.pages[1].getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    expect(snapshots(s.events())).toHaveLength(3);
  } finally { await table.close(); await s.stop(); }
});

test('B20 observador y aceptación tardía: apariencia independiente sin fotos ni reactivación del ciclo censurado', async ({ browser }) => {
  const s = await appearanceBrowserServer();
  const table = await manualTable(browser, s.base, { observer: true, count: 2, beforeCreate: async pages => {
    await accept(pages.slice(1));
    await pages[0].getByRole('combobox', { name: 'Apariencia', exact: true }).selectOption('CREAM');
  } });
  try {
    expect(snapshots(s.events())).toEqual([]);
    await table.host.getByRole('button', { name: 'Aceptar analítica', exact: true }).click();
    await expect(table.host.getByRole('button', { name: 'Retirar permiso', exact: true })).toBeVisible();
    await table.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await table.host.getByRole('dialog').getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await expect(table.host.getByRole('heading', { name: 'Partida cancelada por el anfitrión', exact: true })).toBeVisible();
    expect(snapshots(s.events())).toEqual([]);
  } finally { await table.close(); await s.stop(); }
});

test('B20 final ordinario completo: main compilado, genérica, entropía y adaptadores normales con dos humanos', async ({ browser }) => {
  test.setTimeout(180000);
  const installation = await usageInstallation({ human: true }); const server = await installation.start();
  const table = await manualTable(browser, server.base, { review: 0, turn: 60, beforeCreate: accept });
  try {
    await expect.poll(() => snapshots(installation.events()).length).toBe(2);
    let room = await readRoom(table.host);
    for (let step = 0; step < 100 && room.status === 'IN_GAME'; step++) room = await humanPlay(table, step % 2 === 0, step % 3 === 0 ? 'LOW' : 'HIGH');
    await expect(table.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    expect(room.status).toBe('RESULTS'); if (room.status !== 'RESULTS') throw Error('partida completa esperada');
    expect(room.result.endReason).toBe('DECK_COMPLETED'); await expect.poll(() => snapshots(installation.events()).length).toBe(4);
    const facts = snapshots(installation.events());
    expect(new Set(facts.map(event => `${event.data.gameRef}:${event.data.participationRef}:${event.data.moment}`)).size).toBe(4);
    for (const event of facts) expect(event.data).toMatchObject({ theme: 'LIGHT', origin: 'DEFAULT' });
    expect(installation.events().filter(event => event.name === 'game_started')).toHaveLength(1);
    expect(installation.events().filter(event => event.name === 'game_ended')).toHaveLength(1);
    await fs.mkdir('playwright-report/b20', { recursive: true });
    await table.host.screenshot({ path: 'playwright-report/b20/ordinary-results-1280.png', fullPage: true });
  } finally { await table.close(); await server.stop(); await installation.cleanup(); }
});
