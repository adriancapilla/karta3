import { expect, test } from '@playwright/test';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, readGame, readRoom } from '../support/manualBrowserCases.js';
import type { Page } from '@playwright/test';
import type { InitialGameRoomView, ResultsRoomView } from '../../shared/contracts/room.js';

async function playOwn(page: Page, own: InitialGameRoomView, preferBest = true) {
  const value = (card: typeof own.game.hand[number]) => card.values[own.game.round.activeAttributeId].playValue;
  const opening = own.game.round.direction === null;
  const chosen = preferBest ? [...own.game.hand].sort((a, b) => opening ? Math.min(value(a), 59 - value(a)) - Math.min(value(b), 59 - value(b)) || value(b) - value(a)
    : (value(a) - value(b)) * (own.game.round.direction === 'HIGH' ? -1 : 1))[0] : own.game.hand[0];
  const button = page.locator(`.game-hand [data-card-id="${chosen.id}"] .card-play-button`);
  await expect(button).toBeEnabled();
  if (opening) await page.getByRole('button', { name: value(chosen) <= 29 ? 'BAJO' : 'ALTO', exact: true }).click();
  await button.click();
  await expect.poll(async () => { const next = await readRoom(page); return next.status !== 'IN_GAME' || next.game.interaction.turn?.id !== own.game.interaction.turn!.id; }).toBe(true);
}

for (const width of [360, 390, 1280]) test(`B09 P1 ${width}: gestión explícita, diálogo/teclado/cancelación, mezcla y foco con dos sesiones y pestañas`, async ({ browser }, info) => {
  test.setTimeout(60_000);
  const server = await configurationBrowserServer();
  const hostContext = await browser.newContext({ viewport: { width, height: 844 } }); const guestContext = await browser.newContext({ viewport: { width, height: 844 } });
  const host = await hostContext.newPage(); const guest = await guestContext.newPage(); const tab = await hostContext.newPage();
  try {
    await Promise.all([host.goto(server.base), guest.goto(server.base)]); await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    const code = await host.locator('.code').textContent(); await guest.getByLabel('Código de sala').fill(code!); await guest.getByLabel('Tu nombre', { exact: true }).fill('Bot 1');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click(); await tab.goto(server.base);
    await host.getByRole('button', { name: 'Añadir bot', exact: true }).click(); await expect(guest.locator('.participant-list')).toContainText('Bot · Difícil');
    expect(await guest.getByRole('button', { name: 'Añadir bot' }).count()).toBe(0);
    const row = host.locator('.participant').filter({ has: host.getByText('Bot · Difícil', { exact: true }) });
    await expect(row.getByRole('combobox')).toHaveValue('HARD'); await expect(row.locator('option[value="HARD"]')).toHaveText('Difícil');
    await row.getByRole('button', { name: 'Cambiar nombre' }).click(); const field = host.getByLabel('Nombre del bot', { exact: true });
    await expect(field).toHaveValue('Bot 1'); await expect(field).toBeFocused(); const requestsBeforeCancel = server.botRequests.length; await field.fill('Cancelado'); await field.press('Escape');
    await expect(host.getByRole('dialog')).toHaveCount(0); await expect(row.getByRole('button', { name: 'Cambiar nombre' })).toBeFocused();
    expect(server.botRequests).toHaveLength(requestsBeforeCancel);
    for (const button of ['Cancelar', 'Cerrar']) {
      await row.getByRole('button', { name: 'Cambiar nombre' }).click(); await field.fill('Cancelado'); await host.getByRole('dialog').getByRole('button', { name: button, exact: true }).click();
      await expect(host.getByRole('dialog')).toHaveCount(0); expect(server.botRequests).toHaveLength(requestsBeforeCancel);
    }
    await row.getByRole('button', { name: 'Cambiar nombre' }).click(); await field.fill(''); await host.getByRole('button', { name: 'Aceptar', exact: true }).click();
    await expect(host.getByRole('dialog')).toBeVisible(); await expect(host.getByRole('dialog').getByRole('alert')).toContainText('1 a 16');
    await field.fill('Mi borrador');
    const remote = tab.locator('.participant').filter({ has: tab.getByText('Bot · Difícil', { exact: true }) });
    await remote.getByRole('button', { name: 'Cambiar nombre' }).click(); await tab.getByLabel('Nombre del bot', { exact: true }).fill('Remoto'); await tab.getByRole('button', { name: 'Aceptar', exact: true }).click();
    await expect(host.getByText('Nombre aceptado vigente: Remoto.', { exact: false })).toBeVisible(); await expect(field).toHaveValue('Mi borrador');
    await host.getByRole('dialog').getByRole('button', { name: 'Aceptar', exact: true }).click(); await expect(host.getByRole('dialog')).toHaveCount(0);
    const bot = host.locator('.participant').filter({ hasText: 'Mi borrador' }); await bot.getByRole('combobox').selectOption('EASY');
    await expect(guest.locator('.participant-list')).toContainText('Bot · Fácil'); await expect(bot.getByRole('combobox')).toHaveValue('EASY');
    await host.reload(); await expect(host.locator('.participant-list')).toContainText('Mi borrador'); await host.getByLabel('Editar mi nombre').fill('Sin guardar');
    await host.getByRole('button', { name: 'Añadir bot', exact: true }).click(); await expect(host.locator('.participant-list')).toContainText('Bot 2');
    await host.locator('.participant').filter({ hasText: 'Mi borrador' }).getByRole('button', { name: 'Retirar bot', exact: true }).click();
    await expect(guest.locator('.activity')).toContainText('Mi borrador ha sido retirado; su plaza ha quedado libre');
    await expect(host.locator('.participant').filter({ hasText: 'Bot 2' }).getByRole('button', { name: 'Cambiar nombre', exact: true })).toBeFocused(); await expect(host.getByLabel('Editar mi nombre')).toHaveValue('Sin guardar');
    await host.getByRole('button', { name: 'Añadir bot', exact: true }).click(); await expect(host.locator('.participant-list')).toContainText('Bot 3');
    await host.getByRole('button', { name: 'Añadir bot', exact: true }).click(); await expect(host.getByText('5 de 5 jugadores')).toBeVisible();
    await expect(host.getByRole('button', { name: 'Añadir bot', exact: true })).toBeDisabled(); await expect(host.getByText('No quedan plazas para añadir un bot')).toBeVisible();
    for (const page of [host, guest, tab]) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await host.screenshot({ path: info.outputPath(`B09-waiting-${width}.png`), fullPage: true });
  } finally { await Promise.all([hostContext.close(), guestContext.close()]); await server.stop(); }
});

for (const [count, seed, width, review] of [[2, 2, 360, 0], [3, 3, 390, 5], [4, 56, 1280, 0], [5, 98, 390, 5]]) test(`B09 P2 ${count} mixtos ${width}: final/desempate legal review=${review}, observador, privacidad y F5`, async ({ browser }, info) => {
  test.setTimeout(100_000);
  const server = await configurationBrowserServer(true, true, { count, botSeed: seed });
  const p = await manualTable(browser, server.base, { count: 1, observer: true, bots: Array(count - 1).fill('HARD'), width, review, tie: true, turn: 60, deckId: 'mixta', version: 7 });
  const human = p.pages[1]; const tab = await p.contexts[1].newPage();
  try {
    await tab.goto(server.base); let moves = 0; const finalRounds = new Set<number>(); let sawTie = false;
    while (server.repository.allActive()[0].status === 'IN_GAME') {
      server.time.advance(0);
      const internal = server.repository.allActive()[0]; if (internal.status !== 'IN_GAME') break;
      if (internal.gameReview) {
        if (review) {
          await expect(p.host.getByText('Revisión de ronda', { exact: true })).toBeVisible();
          await expect(p.host.getByRole('timer')).toHaveText('00:05'); const number = internal.game!.round.number;
          server.time.advance(4999); expect(internal.game!.round.number).toBe(number); server.time.advance(1);
        } else server.time.advance(0);
        continue;
      }
      const own = await readGame(human); if (own.game.phase === 'FINAL_PHASE') finalRounds.add(own.game.round.number);
      if (own.game.phase === 'TIE_BREAK') sawTie = true;
      // Un desempate solo BOT se ejecuta sin pedir gesto al humano fuera de su roster.
      if (own.game.interaction.turn?.playerId !== own.participant.id) { server.time.advance(0); continue; }
      expect((await readGame(p.host)).game.hand).toEqual([]); expect(own.game.ownConsecutiveTimeouts).toBe(0);
      if (moves === 2) { await human.reload(); await tab.reload(); }
      await playOwn(human, own); moves++;
    }
    const result = await readRoom(human) as ResultsRoomView;
    expect(result.status).toBe('RESULTS'); expect(result.result.completedNormally).toBe(true); expect(result.result.tieBreakWinnerId).not.toBeNull();
    expect(result.participants.filter((person) => person.kind === 'BOT')).toHaveLength(count - 1);
    expect(finalRounds.size).toBe(3); expect(sawTie || count === 3).toBe(true); expect(server.permutations()).toBe(2);
    await Promise.all([p.host, human, tab].map((page) => expect(page.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible()));
    await expect(human.getByText('Bot · Difícil', { exact: false }).first()).toBeVisible(); await expect(human.locator('.game-hand')).toHaveCount(0);
    for (const page of [p.host, human, tab]) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await human.screenshot({ path: info.outputPath(`B09-results-${count}-${width}.png`), fullPage: true });
    await human.getByRole('button', { name: 'Volver al inicio', exact: true }).click(); await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await tab.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(human.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
  } finally { await p.close(); await server.stop(); }
});

test('B09 P2 normal compilado genérica 2: persona contra fácil/difícil, entropía/plazos normales, resultado y otra sala', async ({ browser, baseURL }, info) => {
  test.setTimeout(120_000);
  const p = await manualTable(browser, baseURL!, { count: 1, bots: ['HARD', 'EASY'], review: 0, turn: 60, width: 1280 });
  const tab = await p.contexts[0].newPage();
  try {
    expect(await p.host.evaluate(async () => (await (await fetch('/api/decks')).json()).decks.map((deck: { id: string; contentVersion: number }) => [deck.id, deck.contentVersion]))).toEqual([['generica', 2]]);
    await tab.goto(baseURL!); let moves = 0; const final = new Set<number>();
    for (const page of [p.host, tab]) {
      await expect(page.getByRole('img', { name: 'Bot · Difícil', exact: true })).toHaveText('BD'); await expect(page.getByRole('img', { name: 'Bot · Fácil', exact: true })).toHaveText('BF');
    }
    while ((await readRoom(p.host)).status === 'IN_GAME') {
      await expect.poll(async () => { const view = await readRoom(p.host); return view.status !== 'IN_GAME' || view.game.interaction.turn?.playerId === view.participant.id; }).toBe(true);
      const view = await readRoom(p.host); if (view.status !== 'IN_GAME') break;
      if (view.game.phase === 'FINAL_PHASE') final.add(view.game.round.number);
      expect(view.game.hand.length).toBeGreaterThan(0); expect(view.game.interaction.turn!.timing).not.toBeNull();
      await playOwn(p.host, view, false); moves++;
      if (moves === 3) {
        await p.host.reload(); await tab.reload();
        for (const page of [p.host, tab]) await expect(page.getByRole('img', { name: 'Bot · Difícil', exact: true })).toHaveText('BD');
      }
    }
    const result = await readRoom(p.host) as ResultsRoomView;
    expect(result.selectedDeck).toMatchObject({ id: 'generica', contentVersion: 2 }); expect(result.result.completedNormally).toBe(true);
    expect(result.result.standings.reduce((sum, p) => sum + p.score, 0)).toBe(45); expect(moves).toBe(15); expect(final.size).toBe(3);
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    await expect(p.host.locator('.standings')).toContainText('Bot · Difícil'); await expect(p.host.locator('.standings')).toContainText('Bot · Fácil');
    await p.host.screenshot({ path: info.outputPath('B09-generica2-normal-1280.png'), fullPage: true });
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click(); await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await tab.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue('');
  } finally { await p.close(); }
});

test('B09 observador: solo bots no inicia; respuesta antigua Add no restaura espera tras inicio remoto', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true); const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guestContext = await browser.newContext(); const host = await context.newPage(); const tab = await context.newPage(); const guest = await guestContext.newPage();
  try {
    await host.goto(server.base); await host.getByRole('button', { name: 'Crear sala', exact: true }).click(); await tab.goto(server.base);
    await host.getByLabel('El anfitrión juega').uncheck(); await host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'portada', contentVersion: 7 }));
    await host.getByRole('button', { name: 'Añadir bot', exact: true }).click(); await host.getByRole('button', { name: 'Añadir bot', exact: true }).click();
    await expect(host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeDisabled(); await expect(host.getByText('Debe jugar al menos una persona humana. El observador no cuenta.')).toBeVisible();
    await guest.goto(server.base); await guest.getByLabel('Código de sala').fill((await host.locator('.code').textContent())!); await guest.getByLabel('Tu nombre', { exact: true }).fill('Persona');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
    let release: (() => void) | undefined; server.interceptBot((_event, _payload, deliver, result) => { release = () => deliver(result); });
    await host.getByRole('button', { name: 'Añadir bot', exact: true }).click(); await expect.poll(() => !!release).toBe(true);
    await expect(host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeDisabled();
    await expect(tab.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled(); await tab.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await expect(host.getByRole('heading', { level: 1 })).toContainText('Partida ·'); release!(); server.time.advance(0);
    await expect(host.locator('.game-hand .game-card')).toHaveCount(0); await expect(guest.locator('.game-hand .game-card')).toHaveCount(3);
    await expect(host.getByRole('button', { name: 'Añadir bot' })).toHaveCount(0); expect(server.repository.allActive()[0].game!.players).toHaveLength(4);
  } finally { await Promise.all([context.close(), guestContext.close()]); await server.stop(); }
});

test('B09 inactividad: dos timeouts HUMAN, solo observar/Detalles; sin páginas termina review y recupera resultados', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true, { count: 3, botSeed: 3 });
  const p = await manualTable(browser, server.base, { count: 1, bots: ['HARD', 'EASY'], deckId: 'mixta', version: 7, width: 360, review: 5, turn: 15 });
  try {
    server.time.advance(0); server.time.advance(15000);
    await expect(p.host.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    server.time.advance(5000); server.time.advance(15000);
    await expect(p.host.getByText('Has pasado a automático. Puedes seguir viendo la partida, pero ya no jugar manualmente', { exact: true })).toBeVisible();
    await expect(p.host.locator('.game-hand .card-play-button').first()).toBeDisabled();
    await p.host.locator('.game-hand .card-details-button').first().click(); await expect(p.host.getByRole('dialog')).toBeVisible(); await p.host.getByRole('button', { name: 'Cerrar detalles' }).press('Escape');
    await p.host.close(); server.time.advance(5000); expect(server.repository.allActive()[0].status).toBe('RESULTS');
    const recovered = await p.contexts[0].newPage(); await recovered.goto(server.base);
    await expect(recovered.getByText('La partida terminó porque todos los jugadores humanos pasaron a automático', { exact: true })).toBeVisible();
    const result = await readRoom(recovered) as ResultsRoomView; expect(result.result.endReason).toBe('NO_ACTIVE_HUMAN_PLAYERS'); expect(result.result.completedNormally).toBe(false);
  } finally { await p.close(); await server.stop(); }
});

test('B09 E4 navegador: rename incierto conserva ID/payload, cierre sin cancelación ficticia, retirada remota y confirmación original', async ({ browser }) => {
  test.setTimeout(45_000);
  const server = await configurationBrowserServer(); const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const host = await context.newPage(); const tab = await context.newPage();
  try {
    await host.goto(server.base); await host.getByRole('button', { name: 'Crear sala', exact: true }).click(); await tab.goto(server.base);
    await host.getByRole('button', { name: 'Añadir bot', exact: true }).click();
    let dropped = false; server.interceptBot((event, _payload, deliver, result) => { if (event === 'room:bot-rename' && !dropped) dropped = true; else deliver(result); });
    await host.getByRole('button', { name: 'Cambiar nombre', exact: true }).click(); await host.getByLabel('Nombre del bot', { exact: true }).fill('Incierto');
    await host.getByRole('button', { name: 'Aceptar', exact: true }).click(); await expect(host.getByRole('button', { name: 'Cerrar', exact: true })).toBeDisabled();
    await expect(host.getByRole('dialog').getByRole('alert')).toContainText('No se pudo confirmar', { timeout: 8000 });
    await host.getByRole('button', { name: 'Cerrar', exact: true }).click(); await expect(host.getByRole('dialog')).toHaveCount(0);
    await tab.getByRole('button', { name: 'Retirar bot', exact: true }).click();
    await host.getByRole('button', { name: 'Recuperar estado de la sala', exact: true }).click();
    await host.getByRole('button', { name: 'Confirmar envío original', exact: true }).click();
    await expect(host.getByRole('button', { name: 'Confirmar envío original', exact: true })).toHaveCount(0);
    const names = server.botRequests.filter((r) => r.event === 'room:bot-rename'); expect(names).toHaveLength(2); expect(names[0].payload).toEqual(names[1].payload);
    await expect(host.getByText('1 de 5 jugadores', { exact: true })).toBeVisible(); await host.reload();
    expect(server.botRequests.filter((r) => r.event === 'room:bot-rename')).toHaveLength(2);
  } finally { await context.close(); await server.stop(); }
});
test('B09 pendientes independientes: retirar conserva foco aunque siguiente renombre y Añadir estén inciertos', async ({ browser }) => {
  test.setTimeout(45_000);
  const server = await configurationBrowserServer(); const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); const host = await context.newPage();
  try {
    await host.goto(server.base); await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    for (let n = 1; n <= 2; n++) { await host.getByRole('button', { name: 'Añadir bot', exact: true }).click(); await expect(host.locator('.bot-controls select')).toHaveCount(n); }
    server.interceptBot((event, _payload, deliver, result) => { if (event === 'room:bot-remove') deliver(result); });
    const row = (name: string) => host.locator('.participant').filter({ has: host.getByText(name, { exact: true }) });
    await row('Bot 2').getByRole('button', { name: 'Cambiar nombre' }).click(); await host.getByLabel('Nombre del bot', { exact: true }).fill('Pendiente');
    await host.getByRole('button', { name: 'Aceptar', exact: true }).click(); await expect(host.getByRole('dialog').getByRole('alert')).toContainText('No se pudo confirmar', { timeout: 8000 });
    await host.getByRole('button', { name: 'Cerrar', exact: true }).click(); await host.getByRole('button', { name: 'Añadir bot', exact: true }).click();
    await expect(host.getByRole('button', { name: 'Recuperar estado de la sala', exact: true })).toHaveCount(2, { timeout: 8000 });
    await expect(row('Pendiente').getByRole('button', { name: 'Cambiar nombre' })).toBeDisabled(); await expect(host.getByRole('button', { name: 'Añadir bot', exact: true })).toBeDisabled();
    await row('Bot 1').getByRole('button', { name: 'Retirar bot', exact: true }).click();
    await expect(row('Pendiente').getByRole('button', { name: 'Retirar bot', exact: true })).toBeFocused();
    await expect(host.getByRole('button', { name: 'Recuperar estado de la sala', exact: true })).toHaveCount(2);
  } finally { await context.close(); await server.stop(); }
});
