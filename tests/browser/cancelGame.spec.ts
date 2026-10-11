import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { humanPlay, manualTable, readGame, readRoom } from '../support/manualBrowserCases.js';
import type { ResultsRoomView } from '../../shared/contracts/room.js';

const title = 'Partida cancelada por el anfitrión';
const question = '¿Cancelar la partida para todos?';
const dialog = (page: Page) => page.getByRole('dialog', { name: question });
const cancels = (s: Awaited<ReturnType<typeof configurationBrowserServer>>) => s.gameRequests.filter((r) => r.event === 'game:cancel');
const summary = (page: Page, id: string): Promise<ResultsRoomView> => page.evaluate(async (gameId) => (await (await fetch(`/api/results/${gameId}`)).json()).room, id);
const session = async (server: Awaited<ReturnType<typeof configurationBrowserServer>>, table: Awaited<ReturnType<typeof manualTable>>, index = 0) => {
  const token = (await table.contexts[index].cookies()).find((cookie) => cookie.name === 'karta3_session')!.value;
  return server.sessions.get(token)!;
};
async function cancel(page: Page) {
  await page.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Cancelar partida', exact: true }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}
async function nextGame(table: Awaited<ReturnType<typeof manualTable>>, creator = table.host, afterStart?: () => void) {
  await creator.getByRole('button', { name: 'Crear sala', exact: true }).click();
  await expect(creator.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
  const code = (await creator.locator('.code').textContent())!;
  const guest = table.pages[1]; await guest.goto(new URL('/', creator.url()).href);
  await guest.getByLabel('Código de sala').fill(code); await guest.getByLabel('Tu nombre', { exact: true }).fill('Persona B');
  await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(guest.getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
  await creator.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'manual', contentVersion: 7 }));
  await creator.getByLabel('Tiempo por turno').selectOption('15'); await creator.getByLabel('Revisión de ronda').selectOption('0');
  await expect(creator.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled();
  await creator.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  afterStart?.();
  for (const page of table.pages) await expect(page.getByRole('heading', { level: 1 })).toContainText('Partida ·');
  table.actors.clear(); for (const page of table.pages) table.actors.set((await readGame(page)).participant.id, page);
}

for (const width of [390, 1800]) test(`B13 botón/diálogo/resumen ${width}px: foco, no pausa, cero puntos y retorno en dos pestañas`, async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, width, turn: 15, review: 5 });
  try {
    await fs.mkdir('playwright-report/b13', { recursive: true });
    const initial = await readGame(p.host); const oldUrl = p.host.url(); const button = p.host.getByRole('button', { name: 'Cancelar partida', exact: true });
    await expect(p.pages[1].getByRole('button', { name: 'Cancelar partida', exact: true })).toHaveCount(0);
    const geometry = await button.evaluate((element) => {
      const r = element.getBoundingClientRect(); const h = document.querySelector('h1')!.getBoundingClientRect();
      return { x: r.x, right: r.right, bottom: r.bottom, headingTop: h.top, width: innerWidth, page: document.documentElement.scrollWidth };
    });
    expect(geometry.right).toBeLessThanOrEqual(width); expect(geometry.bottom).toBeLessThanOrEqual(geometry.headingTop); expect(geometry.page).toBe(width);
    await button.click(); await expect(dialog(p.host)).toBeVisible(); await expect(dialog(p.host).getByRole('button', { name: 'Seguir jugando', exact: true })).toBeFocused();
    await expect(dialog(p.host).getByText('La partida terminará inmediatamente. Todos podrán consultar el resumen y crear o unirse a otra mesa.', { exact: true })).toBeVisible();
    await p.host.keyboard.press('Escape'); await expect(dialog(p.host)).toHaveCount(0); await expect(button).toBeFocused(); expect(cancels(server)).toHaveLength(0);
    await button.click(); await dialog(p.host).getByRole('button', { name: 'Seguir jugando', exact: true }).click(); expect(cancels(server)).toHaveLength(0);
    const tab = await p.contexts[0].newPage(); await tab.goto(server.base); await expect(tab.getByRole('heading', { level: 1 })).toContainText('Partida ·');
    await button.click(); await p.host.screenshot({ path: `playwright-report/b13/dialog-${width}.png`, fullPage: true });
    server.time.elapse(15_000); const after = await readGame(p.pages[1]); // HTTP real prepara el timeout con callback retenido.
    expect(after.game.interaction.turn?.id).not.toBe(initial.game.interaction.turn?.id); expect(after.game.round.plays[0].mode).toBe('TIMEOUT');
    await expect(dialog(p.host)).toBeVisible(); expect(cancels(server)).toHaveLength(0);
    await dialog(p.host).getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    for (const page of [...p.pages, tab]) await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(p.host.getByRole('heading', { name: title, exact: true })).toBeFocused();
    await expect(p.host.getByRole('heading', { name: 'Puntuaciones parciales', exact: true })).toBeVisible();
    await expect(p.host.getByText('Puntos de rondas ya resueltas. No hay ganador.', { exact: true })).toBeVisible();
    await expect(p.host.locator('.victory,.winner-row,.standings .badge,.game-hand,.game-indicator,.activity')).toHaveCount(0);
    await expect(p.host.locator('.standings thead th')).toHaveCount(2); await expect(p.host.locator('.standings td[data-label="Puesto"]')).toHaveCount(0);
    expect(cancels(server)).toHaveLength(1); expect(await readRoom(p.host)).toBeNull(); expect(await readRoom(p.pages[1])).toBeNull();
    const a = await summary(p.host, initial.game.id); expect(a.result.standings.every((v) => v.score === 0)).toBe(true);
    await p.host.screenshot({ path: `playwright-report/b13/summary-${width}.png`, fullPage: true });
    await tab.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    for (const page of [tab, p.host]) await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    await expect(p.pages[1].getByRole('heading', { name: title, exact: true })).toBeVisible();
    await p.host.getByRole('link', { name: 'Ver último resultado', exact: true }).click();
    await expect(p.host.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await p.host.reload(); await expect(p.host.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect((await summary(p.host, initial.game.id)).result.retention.expiresAt).toBe(a.result.retention.expiresAt);
    await p.host.goto(oldUrl); await expect(p.host.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    await expect(p.host.getByRole('link', { name: 'Ver último resultado', exact: true })).toBeVisible(); await expect(p.host.locator('.game-hand')).toHaveCount(0);
    await fs.writeFile(`playwright-report/b13/geometry-${width}.json`, JSON.stringify(geometry, null, 2));
  } finally { await p.close(); await server.stop(); }
});

for (const mode of ['automatic', 'ordinary'] as const) test(`B13/T04 A cancelada → B ${mode}, F5, avisos/estados antiguos y límites propios`, async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, review: 0, turn: 15 });
  try {
    const prior = await readGame(p.host); await cancel(p.host); const a = await summary(p.host, prior.game.id);
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await expect(p.host.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    server.time.advance(1000); await nextGame(p);
    const id = await session(server, p);
    server.repeatRoomState(id, a); server.repeatRoomState(id, prior);
    server.repeatResultsHome(id, { id: 'old-home', roomId: a.id, gameId: a.result.gameId, lastResult: { roomId: a.id, gameId: a.result.gameId, expiresAt: a.result.retention.expiresAt } });
    expect((await readGame(p.host)).game.id).not.toBe(prior.game.id);
    if (mode === 'automatic') server.time.advance(60_000);
    else { let moves = 0; while ((await readRoom(p.host)).status === 'IN_GAME') { await humanPlay(p, moves % 2 === 0, moves % 3 === 0 ? 'LOW' : 'HIGH'); expect(++moves).toBeLessThanOrEqual(58); } }
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    const b = await readRoom(p.host) as ResultsRoomView; expect(b.result.endReason).toBe(mode === 'automatic' ? 'NO_ACTIVE_HUMAN_PLAYERS' : 'DECK_COMPLETED');
    server.time.elapse(a.result.retention.expiresAt - server.time.now().unix);
    const expired = await p.host.request.get(`${server.base}/api/results/${a.result.gameId}`); expect(expired.status()).toBe(404);
    for (const page of p.pages) { await page.reload(); await expect(page.locator('.standings')).toBeVisible(); await expect(page.getByRole('alert')).toHaveCount(0); expect((await readRoom(page) as ResultsRoomView).result.gameId).toBe(b.result.gameId); }
    const oldTab = await p.contexts[0].newPage(); await oldTab.goto(`${server.base}/resultado/${a.result.gameId}`);
    await expect(oldTab.getByText('El resultado ya no está disponible', { exact: true })).toBeVisible(); await expect(p.host.getByRole('alert')).toHaveCount(0);
    server.repeatRoomState(id, a); server.repeatResultsHome(id, { id: 'late-new-id', roomId: a.id, gameId: a.result.gameId, lastResult: null });
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    server.time.elapse(b.result.retention.expiresAt - server.time.now().unix - 1); expect((await p.host.request.get(`${server.base}/api/results/${b.result.gameId}`)).status()).toBe(200);
    server.time.elapse(1); expect((await p.host.request.get(`${server.base}/api/results/${b.result.gameId}`)).status()).toBe(404);
    await p.host.reload(); await expect(p.host.getByText('El resultado ya no está disponible', { exact: true })).toBeVisible();
  } finally { await p.close(); await server.stop(); }
});

test('B13 ack/evento perdidos: incertidumbre, recuperación por gameId y ack A atrasado frente a B', async ({ browser }) => {
  test.setTimeout(40_000);
  const server = await configurationBrowserServer(true, true, { count: 2 }); const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, review: 0, turn: 15 });
  let release: (() => void) | undefined;
  try {
    const a = await readGame(p.host); server.suppressResultsState(await session(server, p));
    server.interceptGame((event, _payload, deliver, result) => { if (event === 'game:cancel') release = () => deliver(result); else deliver(result); });
    await p.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click(); await dialog(p.host).getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await expect(p.pages[1].getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(dialog(p.host).getByRole('alert')).toHaveText('No se pudo confirmar la cancelación. Recupera el estado de la partida', { timeout: 8000 });
    expect(cancels(server)).toHaveLength(1); await expect(dialog(p.host).getByRole('button', { name: 'Cancelar partida', exact: true })).toBeDisabled();
    await dialog(p.host).getByRole('button', { name: 'Seguir jugando', exact: true }).click(); await expect(p.host.getByRole('button', { name: 'Cancelar partida', exact: true })).toBeFocused();
    await p.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await dialog(p.host).getByRole('button', { name: 'Recuperar estado de la partida', exact: true }).click();
    await expect(p.host.getByRole('heading', { name: title, exact: true })).toBeVisible(); expect(cancels(server)).toHaveLength(1);
    server.suppressResultsState(); const retained = (await summary(p.host, a.game.id)).result.retention;
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click(); await expect(p.host.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    await nextGame(p); const b = await readGame(p.host); release!();
    await expect(p.host.getByRole('heading', { level: 1 })).toContainText('Partida ·'); expect((await readGame(p.host)).game.id).toBe(b.game.id);
    await expect(p.host.getByRole('alert')).toHaveCount(0); expect(cancels(server)).toHaveLength(1); expect((await summary(p.host, a.game.id)).result.retention.expiresAt).toBe(retained.expiresAt);
  } finally { release?.(); await p.close(); await server.stop(); }
});

test('B13 envío perdido antes de registrar: recuperar primero y solo reintento explícito con ID/payload originales', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, { count: 2 }); const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7 });
  try {
    server.dropNextGameRequest('game:cancel'); await p.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await dialog(p.host).getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await expect(dialog(p.host).getByRole('alert')).toContainText('No se pudo confirmar la cancelación', { timeout: 8000 });
    const first = cancels(server)[0].payload; expect((await readGame(p.host)).status).toBe('IN_GAME');
    await dialog(p.host).getByRole('button', { name: 'Recuperar estado de la partida', exact: true }).click();
    await expect(dialog(p.host).getByRole('alert')).toContainText('conserva la partida en curso'); expect(cancels(server)).toHaveLength(1);
    await dialog(p.host).getByRole('button', { name: 'Cancelar partida', exact: true }).click(); await expect(p.host.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(cancels(server)).toHaveLength(2); expect(cancels(server)[1].payload).toEqual(first);
  } finally { await p.close(); await server.stop(); }
});

test('B13 final por inactividad con reloj controlado mientras el diálogo está abierto lo cierra sin cancelar', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, { count: 2 }); const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, review: 0, turn: 15 });
  try {
    await p.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click(); server.time.advance(60_000);
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeFocused(); await expect(dialog(p.host)).toHaveCount(0); expect(cancels(server)).toHaveLength(0);
    expect((await readRoom(p.host) as ResultsRoomView).result.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS');
  } finally { await p.close(); await server.stop(); }
});

test('B13/T04 HTTP de recuperación A cancelada atrasado no sustituye B recuperada', async ({ browser }) => {
  test.setTimeout(40_000);
  const server = await configurationBrowserServer(true, true, { count: 2 }); const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, review: 0, turn: 15 });
  let release: (() => void) | undefined;
  try {
    const a = await readGame(p.host); const hostSession = await session(server, p); server.suppressResultsState(hostSession);
    server.interceptGame((event, _payload, deliver, result) => { if (event !== 'game:cancel') deliver(result); });
    await p.host.getByRole('button', { name: 'Cancelar partida', exact: true }).click(); await dialog(p.host).getByRole('button', { name: 'Cancelar partida', exact: true }).click();
    await expect(dialog(p.host).getByRole('alert')).toContainText('No se pudo confirmar la cancelación', { timeout: 8000 });
    await p.host.route(`**/api/results/${a.game.id}`, async (route) => {
      const response = await route.fetch(); expect((await response.json()).room.result.endReason).toBe('HOST_CANCELLED');
      await new Promise<void>((resolve) => { release = resolve; }); await route.fulfill({ response });
    });
    await dialog(p.host).getByRole('button', { name: 'Recuperar estado de la partida', exact: true }).click(); await expect.poll(() => !!release).toBe(true);
    const tab = await p.contexts[0].newPage(); await tab.goto(server.base); await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    await nextGame(p, tab, () => server.dropOneTransport(hostSession)); const b = await readGame(tab);
    await expect.poll(() => new URL(p.host.url()).pathname).toBe(`/sala/${b.id}`);
    release!(); await expect(dialog(p.host)).toHaveCount(0); await expect(p.host.getByRole('alert')).toHaveCount(0);
    expect((await readGame(p.host)).game.id).toBe(b.game.id); expect(b.game.id).not.toBe(a.game.id);
  } finally { release?.(); await p.close(); await server.stop(); }
});

test('B13 anfitrión observador, bot y desconectado: resumen/reconexión sin reactivar asociación', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, { count: 3 }); const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, observer: true, count: 2, bots: ['EASY'], width: 390 });
  try {
    const before = await readGame(p.host); expect(before.participant.isPlayer).toBe(false);
    await p.contexts[1].setOffline(true); server.dropOneTransport(await session(server, p, 1));
    await cancel(p.host); const result = await summary(p.host, before.game.id);
    expect(result.participant.score).toBeNull(); await expect(p.host.locator('.observer-line')).toContainText('Observador'); await expect(p.host.locator('.standings')).toContainText('Bot · Fácil');
    await p.contexts[1].setOffline(false); await expect(p.pages[1].getByRole('heading', { name: title, exact: true })).toBeVisible({ timeout: 10_000 });
    expect(await readRoom(p.pages[1])).toBeNull(); await expect(p.pages[1].locator('.game-hand')).toHaveCount(0);
  } finally { await p.close(); await server.stop(); }
});
