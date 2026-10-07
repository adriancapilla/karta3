import { expect, test, type Page } from '@playwright/test';
import type { ResultsRoomView } from '../../shared/contracts/room.js';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { humanPlay, manualTable, readGame, readRoom } from '../support/manualBrowserCases.js';

type Table = Awaited<ReturnType<typeof manualTable>>;
type Server = Awaited<ReturnType<typeof configurationBrowserServer>>;
const unavailable = 'El resultado ya no está disponible';

async function automaticResult(server: Server, table: Table): Promise<ResultsRoomView> {
  server.time.advance(60_000); // Dos turnos de 15 s por humano; ejecución real, reloj sustituido.
  await expect(table.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
  const result = await readRoom(table.host) as ResultsRoomView;
  expect(result.status).toBe('RESULTS');
  expect(result.result.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS');
  return result;
}

async function nextGame(table: Table, creator: Page = table.host, afterStart?: () => void) {
  await creator.getByRole('button', { name: 'Crear sala', exact: true }).click();
  await expect(creator.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
  const code = (await creator.locator('.code').textContent())!;
  const guest = table.pages[1]; await guest.goto(new URL('/', creator.url()).href);
  await guest.getByLabel('Código de sala').fill(code); await guest.getByLabel('Tu nombre', { exact: true }).fill('Persona B');
  await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(guest.getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
  await creator.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'manual', contentVersion: 7 }));
  await creator.getByLabel('Tiempo por turno').selectOption('15');
  await creator.getByLabel('Revisión de ronda').selectOption('0');
  await expect(creator.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled();
  await creator.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  afterStart?.();
  for (const page of table.pages) await expect(page.getByRole('heading', { level: 1 })).toContainText('Partida ·');
  table.actors.clear();
  for (const page of table.pages) table.actors.set((await readGame(page)).participant.id, page);
}

for (const mode of ['automatic', 'ordinary'] as const) test(`INC-01 expired A → B ${mode}: accepted result, reload, controlled expiry and old reads`, async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, width: mode === 'automatic' ? 390 : 1280, review: 0, turn: 15 });
  try {
    const a = await automaticResult(server, p);
    server.time.advance(a.result.retention.expiresAt - server.time.now().unix);
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await expect(p.host.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    expect(await readRoom(p.host)).toBeNull();
    await nextGame(p);
    await expect(p.host.getByText(unavailable, { exact: false })).toHaveCount(0);
    let b: ResultsRoomView;
    if (mode === 'automatic') b = await automaticResult(server, p);
    else {
      let moves = 0;
      while ((await readRoom(p.host)).status === 'IN_GAME') {
        await humanPlay(p, moves % 2 === 0, moves % 3 === 0 ? 'LOW' : 'HIGH');
        expect(++moves).toBeLessThanOrEqual(58);
      }
      b = await readRoom(p.host) as ResultsRoomView;
      expect(b.result.endReason).toBe('DECK_COMPLETED'); expect(b.result.completedNormally).toBe(true);
    }
    expect(b.result.gameId).not.toBe(a.result.gameId);
    await expect(p.host.locator('.standings')).toBeVisible();
    await expect(p.host.getByRole('alert')).toHaveCount(0); // Falla en T03: resultError de A llega a la clasificación B.
    for (const page of p.pages) {
      await page.reload(); await expect(page.locator('.standings')).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect((await readRoom(page) as ResultsRoomView).result.gameId).toBe(b.result.gameId);
    }
    const read = async (id: string) => p.host.evaluate(async (gameId) => {
      const response = await fetch(`/api/results/${gameId}`); return { status: response.status, body: await response.json() };
    }, id);
    expect((await read(a.result.gameId)).body.error.code).toBe('RESULT_NOT_AVAILABLE');
    expect((await read(b.result.gameId)).body.room.result.retention.expiresAt).toBe(b.result.retention.expiresAt);
    server.time.elapse(b.result.retention.expiresAt - server.time.now().unix - 1);
    expect((await read(b.result.gameId)).status).toBe(200);
    server.time.elapse(1); // B vence exactamente en su plazo, aunque su callback esté retrasado.
    const expired = await read(b.result.gameId);
    expect(expired.status).toBe(404); expect(expired.body.error.code).toBe('RESULT_NOT_AVAILABLE');
    expect((await read(a.result.gameId)).status).toBe(404);
    await p.host.reload(); await expect(p.host.getByText(unavailable, { exact: true })).toBeVisible();
    await expect(p.host.locator('.standings')).toHaveCount(0);
    await p.host.goto(`${server.base}/resultado/${a.result.gameId}`);
    await expect(p.host.getByText(unavailable, { exact: true })).toBeVisible();
    await expect(p.host.locator('.standings')).toHaveCount(0);
  } finally { await p.close(); await server.stop(); }
});

test('INC-01 late A return failure/ack/home cannot change available B or trigger obsolete recovery', async ({ browser }) => {
  test.setTimeout(40_000);
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, width: 390, review: 0, turn: 15 });
  const tab = await p.contexts[0].newPage();
  let release: (() => void) | undefined;
  let home: Parameters<typeof server.repeatResultsHome>[1] | undefined;
  try {
    const a = await automaticResult(server, p);
    await p.pages[1].getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await expect(p.pages[1].getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await tab.goto(server.base); await expect(tab.locator('.standings')).toBeVisible();
    server.interceptHome((input, deliver, response) => {
      release = () => deliver(response); // Aceptación real; el ack se retiene hasta después del límite de transporte.
      if (response.ok) home = { id: `${input.gameId}:home:${input.requestId}`, roomId: input.roomId, gameId: input.gameId, lastResult: response.lastResult ?? null };
    });
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    await expect.poll(() => !!release && !!home).toBe(true);
    await nextGame(p, tab); const b = await automaticResult(server, p);
    const cookie = (await p.contexts[0].cookies()).find((cookie) => cookie.name === 'karta3_session')!;
    const session = server.sessions.get(cookie.value)!;
    const transport = await p.contexts[0].newCDPSession(p.host);
    await transport.send('Network.enable');
    const receivedHomes: string[] = [];
    transport.on('Network.webSocketFrameReceived', (frame) => {
      if (frame.response.payloadData.includes('results:home')) receivedHomes.push(frame.response.payloadData);
    });
    let obsoleteReads = 0;
    p.host.on('request', (request) => { if (new URL(request.url()).pathname === '/api/rooms/current') obsoleteReads++; });
    await expect(p.host.getByRole('button', { name: 'Volver al inicio', exact: true })).toBeEnabled({ timeout: 8000 });
    await expect(p.host.getByRole('alert')).toHaveCount(0);
    expect(obsoleteReads).toBe(0); // La rama catch de A tampoco debe recuperar/borrar el contexto B.
    release!();
    server.repeatResultsHome(session, home!); // Replay del evento ya visto.
    server.repeatResultsHome(session, { ...home!, id: `${home!.id}:late-unseen` }); // Contexto A atrasado aun con ID no visto.
    await expect.poll(() => receivedHomes.filter((frame) => frame.includes(home!.id)).length).toBe(2);
    await transport.detach();
    expect(new URL(p.host.url()).pathname).toBe(`/resultado/${b.result.gameId}`);
    await expect(p.host.locator('.standings')).toBeVisible();
    expect((await readRoom(p.host) as ResultsRoomView).result.gameId).toBe(b.result.gameId);
    expect(b.result.gameId).not.toBe(a.result.gameId);
    await expect(p.host.getByRole('alert')).toHaveCount(0);
  } finally { await p.close(); await server.stop(); }
});

test('INC-01 delayed HTTP recovery of expired A does not clear B after authorized socket recovery', async ({ browser }) => {
  test.setTimeout(40_000);
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, width: 1280, review: 0, turn: 15 });
  const tab = await p.contexts[0].newPage(); let release: (() => void) | undefined;
  let held = false;
  try {
    const a = await automaticResult(server, p);
    server.time.advance(a.result.retention.expiresAt - server.time.now().unix);
    await p.host.route('**/api/rooms/current', async (route) => {
      if (held) { await route.continue(); return; }
      held = true;
      const response = await route.fetch();
      expect((await response.json()).room).toBeNull(); // Lectura real tras la caducidad; se retiene la respuesta original.
      await new Promise<void>((resolve) => { release = resolve; });
      await route.fulfill({ response });
    });
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await expect.poll(() => !!release).toBe(true);
    await tab.goto(server.base); await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    const cookie = (await p.contexts[0].cookies()).find((cookie) => cookie.name === 'karta3_session')!;
    await nextGame(p, tab, () => server.dropOneTransport(server.sessions.get(cookie.value)!));
    const b = await automaticResult(server, p);
    release!();
    await expect(p.host.getByRole('button', { name: 'Volver al inicio', exact: true })).toBeEnabled();
    await expect(p.host.locator('.standings')).toBeVisible(); await expect(p.host.getByRole('alert')).toHaveCount(0);
    expect(new URL(p.host.url()).pathname).toBe(`/resultado/${b.result.gameId}`);
    expect((await readRoom(p.host) as ResultsRoomView).result.gameId).toBe(b.result.gameId);
    expect(b.result.gameId).not.toBe(a.result.gameId);
  } finally { release?.(); await p.close(); await server.stop(); }
});
