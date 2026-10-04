import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { compiledInstallation, removeTestInstallation, startCompiledDeckServer } from '../support/compiledDeckServer.js';
import type { InitialGameRoomView } from '../../shared/contracts/room.js';
import { assertGamePrivacy } from '../support/gamePrivacy.js';

const current = (page: Page): Promise<InitialGameRoomView> => page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
async function enter(page: Page, code: string, name = 'Ana') {
  await page.getByLabel('Código de sala').fill(code); await page.getByLabel('Tu nombre', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
}
async function pair(browser: Browser, base: string, width = 1280) {
  const hc = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: width < 760, isMobile: width < 760 });
  const gc = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: width < 760, isMobile: width < 760 });
  const host = await hc.newPage(); const guest = await gc.newPage();
  await Promise.all([host.goto(base), guest.goto(base)]);
  await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
  const code = (await host.locator('.code').textContent())!;
  await enter(guest, code); await expect(host.getByText('2 de 5 jugadores')).toBeVisible();
  return { hc, gc, host, guest, code, close: () => Promise.all([hc.close(), gc.close()]) };
}
const choose = (page: Page, id = 'portada', contentVersion = 7) => page.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id, contentVersion }));
const ready = async (host: Page) => expect(host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled();
const table = async (page: Page) => expect(page.getByRole('heading', { level: 1 })).toContainText('Partida ·');
const sessionId = async (context: BrowserContext, s: Awaited<ReturnType<typeof configurationBrowserServer>>) => s.sessions.get((await context.cookies()).find((c) => c.name === 'karta3_session')!.value)!;

for (const width of [360, 390, 1280]) test(`B06 E1/01/03/10–12/14–16 genérica 2 normal, dos sesiones, reparto privado y recuperación ${width}px`, async ({ browser, baseURL }) => {
  const p = await pair(browser, baseURL!, width); const tab = await p.hc.newPage();
  const frames = { host: [] as string[], guest: [] as string[] }; let starts = 0;
  try {
    for (const [page, list] of [[p.host, frames.host], [p.guest, frames.guest]] as const) page.on('websocket', (socket) => {
      socket.on('framereceived', (frame) => list.push(String(frame.payload)));
      socket.on('framesent', (frame) => { if (String(frame.payload).includes('"room:start"')) starts++; });
    });
    // Registrar los sockets reales actuales tras recarga, antes del único gesto de inicio.
    await Promise.all([p.host.reload(), p.guest.reload()]);
    await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await expect(p.host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeDisabled();
    await expect(p.guest.getByRole('button', { name: 'Iniciar partida', exact: true })).toHaveCount(0);
    await choose(p.host, 'generica', 2); await ready(p.host); await tab.goto(baseURL!);
    await expect(tab.getByLabel('Baraja', { exact: true })).toHaveValue(JSON.stringify({ id: 'generica', contentVersion: 2 }));
    const waiting = await current(p.host); await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await Promise.all([table(p.host), table(p.guest), table(tab)]);
    const h = await current(p.host); const g = await current(p.guest);
    expect(h.game.id).not.toBe(h.id); expect(h.id).toBe(waiting.id); expect(h.selectedDeck.contentVersion).toBe(2);
    expect(h.game.round).toEqual(g.game.round); expect(h.game.id).toBe(g.game.id);
    expect(h.game.drawPileCount).toBe(51); expect(h.game.hand).toHaveLength(3); expect(g.game.hand).toHaveLength(3);
    expect(new Set([...h.game.hand, ...g.game.hand, h.game.round.indicator].map((card) => card.id)).size).toBe(7);
    expect(h.game.round.openerPlayerId).toBe(g.participant.id); expect(h.participants.map((person) => person.id)).toEqual([g.participant.id, h.participant.id]);
    for (const [page, own, rival, messages] of [[p.host, h, g, frames.host], [p.guest, g, h, frames.guest]] as const) {
      assertGamePrivacy(own, own.game.hand.map((card) => card.id), rival.game.hand.map((card) => card.id), (condition, reason) => expect(condition, reason).toBe(true));
      for (const frame of messages.filter((value) => value.includes('"IN_GAME"'))) for (const card of rival.game.hand) expect(frame).not.toContain(`"${card.id}"`);
      await expect(page.getByText('En esta versión no hay límite de tiempo por turno. Si alguien deja de jugar, la partida espera a que vuelva.', { exact: true })).toBeVisible();
      await expect(page.locator('.game-players li')).toHaveCount(2); await expect(page.locator('.game-score')).toHaveText(['0 puntos', '0 puntos']);
      await expect(page.getByText('Aún no hay cartas jugadas', { exact: true })).toBeVisible();
      await expect(page.getByText('Dirección: Sin elegir', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /Cerrar sala|Salir de la sala|Iniciar partida/ })).toHaveCount(0);
      // B07 sustituye solo ausencia temporal de ejecución: actor puede actuar, los demás no.
      if (own.participant.id === own.game.interaction.turn?.playerId) await expect(page.getByRole('button', { name: 'ALTO', exact: true })).toBeEnabled();
      else for (const button of await page.locator('.game-hand .card-play-button').all()) await expect(button).toBeDisabled();
      await expect(page.getByRole('timer')).toHaveCount(0); await expect(page.locator('.game-card img')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    }
    expect(frames.host.some((frame) => frame.includes('"room:state"') && frame.includes('"IN_GAME"'))).toBe(true);
    expect(frames.guest.some((frame) => frame.includes('"room:state"') && frame.includes('"IN_GAME"'))).toBe(true);
    const details = p.guest.locator('.game-hand .card-details-button').first(); await details.focus(); await details.press('Enter');
    await expect(p.guest.getByRole('dialog')).toBeVisible(); await p.guest.getByRole('button', { name: 'Cerrar detalles' }).press('Escape');
    await expect(p.guest.getByRole('dialog')).toHaveCount(0); await expect(details).toBeFocused();
    if (width < 760) { await expect(p.guest.getByText('Desliza para ver tus cartas')).toBeVisible(); await expect(p.guest.locator('.indicator-compact')).toBeVisible(); }
    await p.host.screenshot({ path: `test-results/B06-normal-${width}-host.png`, fullPage: true });
    await p.guest.screenshot({ path: `test-results/B06-normal-${width}-guest.png`, fullPage: true });
    await Promise.all([p.host.reload(), p.guest.reload(), tab.goto(baseURL!)]); await Promise.all([table(p.host), table(p.guest), table(tab)]);
    for (const [page, expected] of [[p.host, h], [p.guest, g], [tab, h]] as const) {
      const recovered = await current(page); expect(recovered.game).toEqual(expected.game); expect(recovered.participant.id).toBe(expected.participant.id);
      expect(recovered.settings).toEqual(expected.settings); expect(recovered.participants.map((person) => person.id)).toEqual(expected.participants.map((person) => person.id));
    }
    await p.host.goto(baseURL!); await table(p.host); expect((await current(p.host)).game).toEqual(h.game); expect(starts).toBe(1);
  } finally { await p.close(); }
});

test('B06 E2/02/10–14 anfitrión observador normal y dos invitados en tres sesiones, recarga de todos', async ({ browser, baseURL }) => {
  const p = await pair(browser, baseURL!, 390); const third = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const guest2 = await third.newPage();
  try {
    await p.host.getByLabel('El anfitrión juega').uncheck(); await choose(p.host, 'generica', 2);
    await expect(p.host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeDisabled();
    await guest2.goto(baseURL!); await enter(guest2, p.code, 'Ana'); await ready(p.host);
    await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await Promise.all([table(p.host), table(p.guest), table(guest2)]);
    const host = await current(p.host); const first = await current(p.guest); const second = await current(guest2);
    expect(host.game.hand).toEqual([]); expect(host.participant.score).toBeNull(); expect(host.game.drawPileCount).toBe(51);
    expect(host.game.round.openerPlayerId).toBe(first.participant.id);
    assertGamePrivacy(host, [], [...first.game.hand, ...second.game.hand].map((card) => card.id), (value, reason) => expect(value, reason).toBe(true));
    await expect(p.host.getByText('Observando', { exact: true })).toBeVisible(); await expect(p.host.getByRole('heading', { name: 'Tu mano', exact: true })).toHaveCount(0);
    await expect(p.host.locator('.observer-line')).toContainText('Anfitrión · Observador'); await expect(p.host.locator('.game-players strong')).toHaveText(['Ana (1)', 'Ana (2)']);
    await expect(p.guest.locator('.game-initial-state')).toContainText('Abridor: Ana (1) (tú)');
    for (const [page, expected] of [[p.host, host], [p.guest, first], [guest2, second]] as const) { await page.reload(); await table(page); expect((await current(page)).game).toEqual(expected.game); }
    await p.host.screenshot({ path: 'test-results/B06-observer-390.png', fullPage: true });
  } finally { await p.close(); await third.close(); }
});

test('B06-14 cinco jugadores, nombres repetidos y anfitrión al final, mazo 42', async ({ browser }) => {
  const s = await configurationBrowserServer(false, true); const p = await pair(browser, s.base); const others: BrowserContext[] = [];
  try {
    for (let n = 0; n < 3; n++) { const context = await browser.newContext(); others.push(context); const page = await context.newPage(); await page.goto(s.base); await enter(page, p.code); }
    await choose(p.host); await ready(p.host); await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await table(p.host);
    const view = await current(p.host); expect(view.game.drawPileCount).toBe(42);
    await expect(p.host.locator('.game-players strong')).toHaveText(['Ana (1)', 'Ana (2)', 'Ana (3)', 'Ana (4)', 'Jugador 1 (tú)']);
    await expect(p.host.locator('.game-score')).toHaveText(['0 puntos', '0 puntos', '0 puntos', '0 puntos', '0 puntos']);
    expect(s.permutations()).toBe(1);
  } finally { await Promise.all(others.map((context) => context.close())); await p.close(); await s.stop(); }
});

for (const width of [360, 390, 1280]) test(`B06-15/16 recursos reales/nulos/fallidos, valores literales, Detalles y presencia ${width}px`, async ({ browser }) => {
  const s = await configurationBrowserServer(false, true); const p = await pair(browser, s.base, width);
  try {
    await choose(p.host); await ready(p.host); await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await Promise.all([table(p.host), table(p.guest)]);
    const view = await current(p.guest); expect(view.game.hand[0].roundAttribute).toBe('atributo3'); expect(view.game.round.activeAttributeId).toBe('atributo2');
    const card = p.guest.locator('.game-hand .game-card').first();
    await expect(card.getByAltText('Imagen validada de carta 1')).toBeVisible();
    expect(await card.locator('img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(8);
    await expect(card.locator('thead th')).toHaveText(['Atributo', 'Jugable', 'Dato']);
    await expect(card.locator('tbody tr').first().locator('td')).toHaveText(['1', '1']);
    await expect(card.locator('tbody tr').nth(1).locator('td')).toHaveText(['1', 'Dato 700 km']);
    await expect(card.locator('.active-attribute')).toContainText('Magnitud 2'); await expect(card).not.toContainText('NO HEREDAR');
    await expect(p.host.locator('.game-hand .game-card img')).toHaveCount(0); // Mano par nula; no se solicita sustitución.
    const scroll = p.guest.locator('.hand-row'); if (width < 760) await scroll.evaluate((element) => { element.scrollLeft = 100; });
    const offset = await scroll.evaluate((element) => element.scrollLeft);
    const button = card.getByRole('button', { name: 'Detalles de Carta de prueba 1' }); await button.focus(); await button.press('Enter');
    const dialog = p.guest.getByRole('dialog'); await expect(dialog).toContainText('Característica completa de la carta 1'); await expect(dialog).toContainText('Nota completa de la carta 1');
    await expect(dialog.getByRole('button', { name: 'Cerrar detalles' })).toBeFocused();
    await p.host.close(); await expect(dialog).toBeVisible(); await expect(p.guest.getByText('Sin conexión', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cerrar detalles' })).toBeFocused(); expect(await scroll.evaluate((element) => element.scrollLeft)).toBe(offset);
    await dialog.getByRole('button', { name: 'Cerrar detalles' }).press('Escape'); await expect(button).toBeFocused();
    const hostAgain = await p.hc.newPage(); await hostAgain.goto(s.base); await table(hostAgain);
    await expect(p.guest.getByText('Sin conexión', { exact: true })).toHaveCount(0);
    // Fallo de red solo para la imagen: el paquete cargado permanece validado y conserva URL/alt.
    await p.guest.route('**/media/decks/portada/v7/imagenes/portada.png', (route) => route.abort()); await p.guest.reload(); await table(p.guest);
    await expect(p.guest.locator('.game-hand .game-card').first().getByText('No se pudo cargar la imagen')).toBeVisible();
    expect((await current(p.guest)).game.hand[0]).toEqual(view.game.hand[0]);
    const indicatorButton = width < 760 ? p.guest.locator('.indicator-compact button') : p.guest.locator('.indicator-full button');
    if (width < 760) await indicatorButton.tap(); else await indicatorButton.click();
    await expect(p.guest.getByRole('dialog')).toContainText('Carta de prueba 7');
    await expect(p.guest.getByRole('dialog').getByText('No se pudo cargar la imagen')).toBeVisible();
    await p.guest.getByRole('button', { name: 'Cerrar detalles' }).click(); await expect(indicatorButton).toBeFocused();
    expect(await p.guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await p.guest.screenshot({ path: `test-results/B06-fixture-failure-${width}.png`, fullPage: true });
    expect(s.starts).toHaveLength(1); expect(s.permutations()).toBe(1);
  } finally { await p.close(); await s.stop(); }
});

test('B06-06 inicio pendiente y rechazo accesible; ack incierto recupera antes de reintentar el mismo ID', async ({ browser }) => {
  const s = await configurationBrowserServer(false, true); const p = await pair(browser, s.base);
  try {
    let release: (() => void) | undefined;
    s.intercept((_payload, deliver, result) => { release = () => deliver(result); });
    await choose(p.host); await expect(p.host.getByText('Espera la confirmación de tus cambios de configuración.')).toBeVisible();
    await expect(p.host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeDisabled(); release!(); s.intercept(undefined); await ready(p.host);
    s.permutation(() => []); s.interceptStart(() => {});
    await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await expect(p.host.getByRole('alert')).toContainText('Puedes reintentar el mismo envío de inicio.', { timeout: 8000 });
    await ready(p.host); expect(s.starts).toHaveLength(1);
    s.interceptStart(undefined); s.permutation((ids) => [...ids]);
    await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await expect(p.host.getByRole('alert')).toContainText('El servidor confirma que sigues en espera.');
    expect(s.starts).toHaveLength(2); expect(s.starts[1].requestId).toBe(s.starts[0].requestId);
    expect(s.permutations()).toBe(1); // El rechazo previo no se reejecuta con el mismo ID.
    await ready(p.host); await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await table(p.host); await table(p.guest);
    expect(s.starts[2].requestId).not.toBe(s.starts[1].requestId); expect(s.permutations()).toBe(2);
  } finally { await p.close(); await s.stop(); }
});

test('B06-07 error técnico tras aceptación: recuperar antes de ofrecer nuevo inicio', async ({ browser }) => {
  const s = await configurationBrowserServer(false, true); const p = await pair(browser, s.base);
  try {
    await choose(p.host); await ready(p.host); s.suppressGameState(await sessionId(p.hc, s));
    s.interceptStart((_payload, deliver) => deliver({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'No se pudo confirmar el inicio. Recupera el estado de la sala.' } }));
    await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await table(p.host); await table(p.guest);
    expect((await current(p.host)).game.id).toBe((await current(p.guest)).game.id);
    expect(s.starts).toHaveLength(1); expect(s.permutations()).toBe(1);
  } finally { await p.close(); await s.stop(); }
});

test('B06-06 ack/evento perdidos: incertidumbre bloquea nuevo envío hasta recuperar aceptación HTTP', async ({ browser }) => {
  const s = await configurationBrowserServer(false, true); const p = await pair(browser, s.base);
  try {
    await choose(p.host); await ready(p.host); const id = await sessionId(p.hc, s);
    s.suppressGameState(id); s.interceptStart(() => {}); await p.host.route('**/api/rooms/current', (route) => route.abort());
    await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await table(p.guest);
    await expect(p.host.getByRole('button', { name: 'Recuperar estado' })).toBeVisible({ timeout: 8000 });
    await expect(p.host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeDisabled();
    await expect(p.host.getByRole('alert')).toContainText('sigue sin confirmar'); expect(s.starts).toHaveLength(1);
    await p.host.unroute('**/api/rooms/current'); s.suppressGameState();
    await p.host.getByRole('button', { name: 'Recuperar estado' }).click(); await table(p.host);
    expect((await current(p.host)).game.id).toBe((await current(p.guest)).game.id); expect(s.starts).toHaveLength(1); expect(s.permutations()).toBe(1);
  } finally { await p.close(); await s.stop(); }
});

test('B06-17/E7 reinicio real de main compilado sin ASSETS elimina mesa/identidad y permite otra espera', async ({ browser }) => {
  const { prepareDecks } = await import('../../dist-server/server/infrastructure/decks/catalog.js');
  const root = await compiledInstallation(); let instance: Awaited<ReturnType<typeof startCompiledDeckServer>> | undefined;
  let p: Awaited<ReturnType<typeof pair>> | undefined;
  try {
    await fs.cp(path.resolve('barajas/generica'), path.join(root, 'barajas/generica'), { recursive: true }); await prepareDecks(path.join(root, 'barajas'));
    instance = await startCompiledDeckServer(root); p = await pair(browser, instance.base, 390);
    await choose(p.host, 'generica', 2); await ready(p.host); await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await table(p.host); await table(p.guest);
    const accepted = await current(p.host); const oldCookie = (await p.hc.cookies()).find((c) => c.name === 'karta3_session')!.value;
    const port = Number(new URL(instance.base).port);
    await instance.stop(); instance = await startCompiledDeckServer(root, port);
    // Mismas páginas abiertas: el canal rechaza la cookie anterior y HTTP recupera null.
    // Así se comprueba retirar una mano ya visible, sin una navegación que remonte React.
    for (const page of [p.host, p.guest]) {
      await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible({ timeout: 10_000 }); await expect(page.getByRole('heading', { name: /Partida ·/ })).toHaveCount(0);
      await expect(page.locator('.game-hand')).toHaveCount(0); await expect(page.getByRole('alert')).toHaveText('La sala ya no está disponible. Puedes crear una nueva.');
    }
    expect((await p.hc.cookies()).find((c) => c.name === 'karta3_session')!.value).not.toBe(oldCookie);
    await p.host.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    expect((await current(p.host)).id).not.toBe(accepted.id); await expect(p.host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeDisabled();
    expect(await fs.stat(path.join(root, 'asset-access.txt')).then(() => true, () => false)).toBe(false);
    expect(instance.errors()).toBe('');
  } finally { await p?.close(); await instance?.stop(); await removeTestInstallation(root); }
});
