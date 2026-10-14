import { test, expect, type Browser, type Page, type BrowserContext } from '@playwright/test';
import { io, type Socket } from 'socket.io-client';
import type { ConfigureRoomRequest, RoomView, SocketAck } from '../../shared/contracts/room.js';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';

const current = (page: Page): Promise<RoomView> => page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
async function pair(browser: Browser, base: string, width = 1280) {
  const hc = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 800 } });
  const gc = await browser.newContext({ viewport: { width: width === 390 ? 1280 : 390, height: width === 390 ? 800 : 844 } });
  const host = await hc.newPage(); const guest = await gc.newPage();
  await Promise.all([host.goto(base), guest.goto(base)]);
  await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
  await enter(guest); await expect(host.getByText('2 de 5 jugadores')).toBeVisible();
  const tab = await hc.newPage(); await tab.goto(base);
  await expect(tab.getByLabel('Tiempo por turno')).toHaveValue('30');
  return { hc, gc, host, guest, tab, close: () => Promise.all([hc.close(), gc.close()]) };
}
async function enter(page: Page, name = 'Ana') {
  await page.getByLabel('Código de sala').fill('000042'); await page.getByLabel('Tu nombre', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
const choose = (page: Page, id: string, version = 7) => page.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id, contentVersion: version }));
async function rawSession(base: string) {
  const response = await fetch(`${base}/api/rooms/current`); const cookie = response.headers.get('set-cookie')!.split(';')[0];
  const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: base } });
  await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); }); return socket;
}
const emit = (socket: Socket, event: string, payload: object): Promise<SocketAck<{ room: RoomView }>> => new Promise((resolve) => socket.emit(event, payload, resolve));
async function sessionId(context: BrowserContext, s: Awaited<ReturnType<typeof configurationBrowserServer>>) {
  return s.sessions.get((await context.cookies()).find((cookie) => cookie.name === 'karta3_session')!.value)!;
}

for (const width of [390, 1280]) test(`B05-01/03/04/07/09/11/13/15 recorrido compartido, dos sesiones y dos pestañas a ${width}px`, async ({ browser }) => {
  const s = await configurationBrowserServer(); const p = await pair(browser, s.base, width);
  try {
    expect((await current(p.host)).settings).toEqual({ deckId: null, deckContentVersion: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5, attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false });
    await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue(''); expect(s.requests).toHaveLength(0);
    expect(await p.guest.getByRole('combobox').count()).toBe(0);
    await p.host.getByLabel('Editar mi nombre').fill('Mi borrador'); await p.host.getByLabel('Editar mi nombre').focus();
    await choose(p.tab, 'portada');
    for (const page of [p.host, p.tab, p.guest]) {
      await expect(page.getByRole('heading', { name: 'Fixture portada · v7' })).toBeVisible({ timeout: 2000 });
      await expect(page.getByAltText('Portada sintética azul')).toBeVisible();
      expect(await page.getByAltText('Portada sintética azul').evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBe(8);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await expect(p.host.getByLabel('Editar mi nombre')).toBeFocused(); await expect(p.host.getByLabel('Editar mi nombre')).toHaveValue('Mi borrador');
    const selected = await current(p.guest); expect(Object.keys(selected.selectedDeck!)).toHaveLength(8);
    expect(JSON.stringify(selected)).not.toMatch(/"cards"\s*:|"playValue"\s*:|"sessionId"\s*:|"publication"\s*:/);
    await choose(p.host, 'sin-imagen'); await expect(p.guest.getByRole('heading', { name: 'Fixture sin-imagen · v7' })).toBeVisible({ timeout: 2000 });
    await expect(p.host.locator('.neutral-card')).toHaveAttribute('aria-hidden', 'true'); await expect(p.host.locator('.deck-card img')).toHaveCount(0);
    await p.host.getByLabel('El anfitrión juega').uncheck();
    for (const page of [p.host, p.guest, p.tab]) {
      await expect(page.getByText('1 de 5 jugadores')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText('Anfitrión · Observador', { exact: true })).toBeVisible();
      await expect(page.locator('.participant-list li')).toHaveCount(1);
    }
    expect((await current(p.host)).participant.id).toBe(selected.participants.find((person) => person.role === 'HOST')!.id);
    await p.host.getByLabel('Tiempo por turno').selectOption('15'); await expect(p.tab.getByLabel('Tiempo por turno')).toHaveValue('15');
    await p.tab.getByLabel('Tiempo por turno').selectOption('60'); await expect(p.host.getByLabel('Tiempo por turno')).toHaveValue('60');
    await Promise.all([p.host.getByLabel('Revisión de ronda').selectOption('0'), p.tab.getByLabel('Forzar desempate').check()]);
    await expect(p.host.getByLabel('Forzar desempate')).toBeChecked(); await expect(p.tab.getByLabel('Revisión de ronda')).toHaveValue('0');
    await expect(p.guest.getByText('Sin pausa (0 s)', { exact: true })).toBeVisible();
    // Control nativo y teclado; los nodos persisten a través de eventos remotos.
    await p.host.getByLabel('Tiempo por turno').focus(); await p.host.getByLabel('Tiempo por turno').press('Home'); await p.host.getByLabel('Tiempo por turno').press('Enter');
    await expect(p.host.getByLabel('Tiempo por turno')).toHaveValue('15'); await expect(p.host.getByLabel('Tiempo por turno')).toBeFocused();
    const accepted = await current(p.host); const count = s.requests.length;
    await p.tab.reload(); await expect(p.tab.getByLabel('Tiempo por turno')).toHaveValue('15'); await expect(p.tab.getByLabel('El anfitrión juega')).not.toBeChecked();
    expect(s.requests).toHaveLength(count); expect((await current(p.tab)).participant.id).toBe(accepted.participant.id);
    expect((await current(p.tab)).lifecycle.expiresAt).toBe(accepted.lifecycle.expiresAt);
    await p.host.screenshot({ path: `test-results/B05-${width}-host.png`, fullPage: true });
    await p.guest.screenshot({ path: `test-results/B05-${width === 390 ? 1280 : 390}-guest.png`, fullPage: true });
    await p.tab.getByLabel('Baraja', { exact: true }).selectOption(''); await expect(p.host.locator('.no-deck')).toHaveText('Sin baraja seleccionada');
    await expect(p.guest.locator('.no-deck')).toHaveText('Sin baraja seleccionada');
    const removed = await current(p.tab); expect(removed.settings).toMatchObject({ deckId: null, deckContentVersion: null }); expect(removed.selectedDeck).toBeNull();
    await p.tab.getByLabel('El anfitrión juega').check(); await expect(p.host.getByText('2 de 5 jugadores')).toBeVisible();
    await expect(p.host.locator('.participant-list li').last()).toContainText('Anfitrión');
  } finally { await p.close(); await s.stop(); }
});

test('B05-02 catálogo retrasado/error/reintento con una sola baraja; lectura no renueva ni selecciona, foco y nombre siguen', async ({ browser }) => {
  const s = await configurationBrowserServer(true); const context = await browser.newContext(); const page = await context.newPage();
  let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/decks', async (route) => { await gate; await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"code":"INTERNAL_ERROR","message":"Fixture fallo"}}' }); });
  try {
    await page.goto(s.base); await page.getByRole('button', { name: 'Crear sala' }).click(); await expect(page.getByText('Cargando barajas…')).toBeVisible();
    await page.getByLabel('Revisión de ronda').selectOption('0'); await expect(page.getByLabel('Revisión de ronda')).toHaveValue('0');
    await page.getByLabel('Editar mi nombre').fill('Borrador'); await page.getByLabel('Editar mi nombre').focus();
    const before = await current(page); release(); await expect(page.getByText('No se pudieron cargar las barajas')).toBeVisible();
    await expect(page.getByLabel('Editar mi nombre')).toBeFocused(); await expect(page.getByLabel('Editar mi nombre')).toHaveValue('Borrador');
    await page.unroute('**/api/decks'); s.time.elapse(5000);
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(page.getByRole('option', { name: 'Fixture portada · v7' })).toHaveCount(1); await expect(page.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await expect(page.locator('#catalog-reload')).toBeFocused();
    const after = await current(page); expect(after.revision).toBe(before.revision); expect(after.lifecycle.expiresAt).toBe(before.lifecycle.expiresAt);
    expect(s.requests).toHaveLength(1);
  } finally { release(); await context.close(); await s.stop(); }
});

test('B05-05/08/11 pendientes por control, acks invertidos, rechazo asociado y portada fallida conservan estado/foco/borrador', async ({ browser }) => {
  const s = await configurationBrowserServer(); const p = await pair(browser, s.base);
  const held: { payload: ConfigureRoomRequest; deliver: (result: SocketAck<{ room: RoomView }>) => void; result: SocketAck<{ room: RoomView }> }[] = [];
  s.intercept((payload, deliver, result) => { held.push({ payload, deliver, result }); });
  try {
    await p.host.getByLabel('Editar mi nombre').fill('No borrar');
    await p.host.getByLabel('Tiempo por turno').selectOption('15'); await expect(p.host.locator('#config-turnSeconds-state')).toHaveText('Aplicando…');
    await p.host.getByLabel('Revisión de ronda').selectOption('0'); await expect(p.host.locator('#config-reviewSeconds-state')).toHaveText('Aplicando…');
    await p.host.getByLabel('Tiempo por turno').selectOption('60'); await expect.poll(() => held.length).toBe(3);
    const latest = held[2]; latest.deliver(latest.result); await expect(p.host.locator('#config-turnSeconds-state')).toHaveText('Cambio aceptado');
    held[0].deliver(held[0].result); await expect(p.host.getByLabel('Tiempo por turno')).toHaveValue('60');
    await expect(p.host.locator('#config-reviewSeconds-state')).toHaveText('Aplicando…'); await expect(p.host.getByLabel('Editar mi nombre')).toHaveValue('No borrar');
    held[1].deliver(held[1].result); s.intercept(undefined);
    // El catálogo falsificado no acredita publicación; el servidor conserva la selección real.
    await choose(p.host, 'sin-imagen'); await expect(p.host.getByRole('heading', { name: 'Fixture sin-imagen · v7' })).toBeVisible();
    await p.tab.route('**/api/decks', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ decks: [{ ...s.loaded.response.decks[0], contentVersion: 8 }] }) }));
    await p.tab.reload(); await expect(p.tab.getByRole('option', { name: 'Fixture portada · v8' })).toHaveCount(1);
    await p.tab.getByLabel('Baraja', { exact: true }).focus(); await choose(p.tab, 'portada', 8);
    await expect(p.tab.locator('#config-deck-state')).toContainText('versión solicitada');
    await expect(p.tab.getByLabel('Baraja', { exact: true })).toHaveValue(JSON.stringify({ id: 'sin-imagen', contentVersion: 7 }));
    await expect(p.tab.getByLabel('Baraja', { exact: true })).toBeFocused(); await expect(p.tab.getByLabel('Baraja', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(p.tab.getByLabel('Baraja', { exact: true })).toHaveAttribute('aria-describedby', 'config-deck-state');
    await p.host.route('**/media/decks/**', (route) => route.abort()); await choose(p.host, 'portada');
    await expect(p.host.getByText('No se pudo cargar la portada')).toBeVisible(); await expect(p.host.locator('.neutral-card')).toBeVisible();
    expect((await current(p.host)).selectedDeck!.imageUrl).toBe('/media/decks/portada/v7/imagenes/portada.png');
  } finally { await p.close(); await s.stop(); }
});

test('B05-08/13 resultado sin confirmación y gesto offline no se reenvían; otra pestaña mantiene presencia', async ({ browser }) => {
  test.setTimeout(60_000);
  const s = await configurationBrowserServer(); const p = await pair(browser, s.base);
  try {
    s.intercept((payload, deliver, result) => { if (payload.change.field !== 'forceTieBreak') deliver(result); });
    await p.host.getByLabel('Forzar desempate').check(); await expect(p.host.locator('#config-forceTieBreak-state')).toHaveText('Aplicando…');
    await expect(p.host.locator('#config-forceTieBreak-state')).toHaveText('No se pudo confirmar el cambio; se muestra la última configuración recibida', { timeout: 7000 });
    await expect(p.guest.locator('.configuration-summary')).toContainText('Sí');
    const count = s.requests.length; const before = await current(p.tab);
    await p.host.reload(); await expect(p.host.getByLabel('Forzar desempate')).toBeChecked(); expect(s.requests).toHaveLength(count);
    expect((await current(p.host)).lifecycle.expiresAt).toBe(before.lifecycle.expiresAt);
    const hostId = await sessionId(p.hc, s); expect(s.repository.findActiveBySession(hostId)!.participantFor(hostId)!.presence).toBe('CONNECTED');
    // Cerrar todos los sockets de esta sesión produce una desconexión real del transporte.
    s.disconnect(hostId); await expect(p.host.getByText('Conexión interrumpida. Intentando recuperarla…')).toBeVisible();
    await p.host.getByLabel('Tiempo por turno').selectOption('15');
    await expect(p.host.locator('#config-turnSeconds-state')).toContainText('no se envió el cambio');
    await expect(p.host.getByLabel('Tiempo por turno')).toHaveValue('30'); expect(s.requests).toHaveLength(count);
    await p.host.reload(); await expect(p.host.getByLabel('Tiempo por turno')).toHaveValue('30'); expect(s.requests).toHaveLength(count);
  } finally { await p.close(); await s.stop(); }
});

test('B05-09/10/13 observador con cinco invitados, reservas y retirada con tiempo controlado, autoridad y cierre por ausencia', async ({ browser }) => {
  const s = await configurationBrowserServer(); const p = await pair(browser, s.base, 390); const sockets: Socket[] = [];
  try {
    await p.host.getByLabel('El anfitrión juega').uncheck(); await expect(p.host.getByText('Anfitrión · Observador', { exact: true })).toBeVisible();
    for (let n = 0; n < 4; n++) { const socket = await rawSession(s.base); sockets.push(socket); await emit(socket, 'room:join', { requestId: `guest-${n}`, code: '000042', name: `Persona ${n}` }); }
    await expect(p.host.getByText('5 de 5 jugadores')).toBeVisible(); await p.host.getByLabel('El anfitrión juega').check();
    await expect(p.host.locator('#config-hostPlays-state')).toContainText('plaza libre'); await expect(p.host.getByLabel('El anfitrión juega')).not.toBeChecked();
    sockets[0].disconnect(); await expect(p.host.locator('.participant-list')).toContainText('Reconectando');
    await p.host.getByLabel('El anfitrión juega').check(); await expect(p.host.locator('#config-hostPlays-state')).toContainText('plaza libre');
    s.time.elapse(30_000); await p.host.getByLabel('El anfitrión juega').check();
    await expect(p.host.getByLabel('El anfitrión juega')).toBeChecked(); await expect(p.host.getByText('5 de 5 jugadores')).toBeVisible();
    await expect(p.host.locator('.participant-list li').last()).toContainText('Anfitrión');
    await p.host.getByLabel('El anfitrión juega').uncheck(); const view = await current(p.host);
    await p.host.goto(s.base); await expect(p.host.getByText('Anfitrión · Observador', { exact: true })).toBeVisible();
    expect((await current(p.host)).participant.id).toBe(view.participant.id);
    await p.host.getByLabel('Editar mi nombre').fill('Ana'); await p.host.getByLabel('Editar mi nombre').press('Enter');
    await expect(p.host.locator('.observer-line')).toContainText('Ana (2)'); await expect(p.guest.locator('.participant-list li').first()).toContainText('Ana (1)');
    await p.host.getByLabel('Tiempo por turno').selectOption('60'); await expect(p.tab.getByLabel('Tiempo por turno')).toHaveValue('60');
    await p.hc.close(); await expect(p.guest.locator('.observer-line')).toContainText('Reconectando'); s.time.advance(30_000);
    await expect(p.guest.getByRole('alert')).toHaveText('La sala se cerró porque el anfitrión no recuperó la conexión', { timeout: 2000 });
  } finally { sockets.forEach((socket) => socket.disconnect()); await p.close(); await s.stop(); }
});

test('B05-14 cambios efectivos renuevan, lecturas no; caducidad exacta y ack antiguo no reabren (conexiones reales/reloj controlado)', async ({ browser }) => {
  const s = await configurationBrowserServer(); const p = await pair(browser, s.base); let old: (() => void) | undefined;
  try {
    s.time.advance(29 * 60_000); await expect(p.host.locator('.expiry-warning')).toBeVisible();
    const before = await current(p.host); await p.tab.reload(); await expect(p.tab.locator('.expiry-warning')).toBeVisible();
    expect((await current(p.tab)).lifecycle.expiresAt).toBe(before.lifecycle.expiresAt);
    await p.host.getByLabel('Revisión de ronda').selectOption('0'); await expect(p.guest.locator('.expiry-warning')).toHaveCount(0);
    const renewed = await current(p.host); expect(renewed.lifecycle.expiresAt).toBe(s.time.now().unix + 30 * 60_000);
    s.intercept((_payload, deliver, result) => { if (result.ok) old = () => deliver(result); else deliver(result); });
    await p.host.getByLabel('Tiempo por turno').selectOption('60'); await expect.poll(() => !!old).toBe(true);
    s.time.elapse(30 * 60_000); await p.tab.getByLabel('Forzar desempate').click();
    for (const page of [p.host, p.guest, p.tab]) await expect(page.getByRole('alert')).toHaveText('La sala se cerró por inactividad', { timeout: 2000 });
    old!(); await expect(p.host.getByRole('heading', { name: 'Crea una sala' })).toBeVisible(); await expect(p.host.locator('.configuration')).toHaveCount(0);
  } finally { await p.close(); await s.stop(); }
});

test('B05-08 rechazo de un control conserva otro pendiente, foco y nombre en edición', async ({ browser }) => {
  const s = await configurationBrowserServer(); const context = await browser.newContext(); const page = await context.newPage();
  let finish: (() => void) | undefined;
  await page.route('**/api/decks', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ decks: [{ ...s.loaded.response.decks[0], id: 'desconocida', name: 'No publicada' }] }) }));
  s.intercept((payload, deliver, result) => { if (payload.change.field === 'reviewSeconds') finish = () => deliver(result); else deliver(result); });
  try {
    await page.goto(s.base); await page.getByRole('button', { name: 'Crear sala' }).click();
    await expect(page.getByRole('option', { name: 'No publicada · v7' })).toHaveCount(1);
    await page.getByLabel('Editar mi nombre').fill('Conservar');
    await page.getByLabel('Revisión de ronda').selectOption('0'); await expect(page.locator('#config-reviewSeconds-state')).toHaveText('Aplicando…');
    await page.getByLabel('Baraja', { exact: true }).focus(); await choose(page, 'desconocida');
    await expect(page.locator('#config-deck-state')).toContainText('no está disponible');
    await expect(page.getByLabel('Baraja', { exact: true })).toHaveValue(''); await expect(page.getByLabel('Baraja', { exact: true })).toBeFocused();
    await expect(page.getByLabel('Editar mi nombre')).toHaveValue('Conservar');
    await expect(page.locator('#config-reviewSeconds-state')).toHaveText('Aplicando…'); await expect(page.getByLabel('Revisión de ronda')).toHaveValue('0');
    finish!(); await expect(page.locator('#config-reviewSeconds-state')).toHaveText('Cambio aceptado');
  } finally { await context.close(); await s.stop(); }
});

test('B05-13 reconexión real sin F5 recupera configuración/observación sin reenviar y otra pestaña conserva presencia', async ({ browser }) => {
  const s = await configurationBrowserServer(); const p = await pair(browser, s.base);
  try {
    await choose(p.host, 'sin-imagen'); await expect(p.host.getByRole('heading', { name: 'Fixture sin-imagen · v7' })).toBeVisible();
    await p.host.getByLabel('El anfitrión juega').uncheck(); await expect(p.host.getByText('Anfitrión · Observador', { exact: true })).toBeVisible();
    const before = await current(p.host); const count = s.requests.length; const id = await sessionId(p.hc, s);
    s.dropOneTransport(id);
    await expect(p.host.getByText('Conexión interrumpida. Intentando recuperarla…')).toBeVisible();
    expect(s.repository.findActiveBySession(id)!.participantFor(id)!.presence).toBe('CONNECTED');
    await expect(p.host.getByText('Conexión interrumpida. Intentando recuperarla…')).toHaveCount(0, { timeout: 7000 });
    await expect(p.host.getByLabel('El anfitrión juega')).not.toBeChecked(); await expect(p.host.getByRole('heading', { name: 'Fixture sin-imagen · v7' })).toBeVisible();
    expect(s.requests).toHaveLength(count); const after = await current(p.host);
    expect(after.participant).toEqual(before.participant); expect(after.settings).toEqual(before.settings); expect(after.revision).toBe(before.revision);
    expect(after.lifecycle.expiresAt).toBe(before.lifecycle.expiresAt);
  } finally { await p.close(); await s.stop(); }
});
