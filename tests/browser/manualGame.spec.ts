import { test, expect } from '@playwright/test';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { humanPlay, manualTable, readGame, readRoom } from '../support/manualBrowserCases.js';
import type { ResultsRoomView } from '../../shared/contracts/room.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { compiledInstallation, removeTestInstallation, startCompiledDeckServer } from '../support/compiledDeckServer.js';

for (const cardFirst of [false, true]) test(`B07 M1 apertura ${cardFirst ? 'carta → BAJO' : 'ALTO → carta'} privada, Detalles y recuperación`, async ({ browser }) => {
  const server = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, server.base, { deckId: 'portada', version: 7, width: cardFirst ? 390 : 1280 });
  const first = p.pages[1]; const tab = await p.contexts[1].newPage();
  try {
    await tab.goto(server.base); await expect(tab.getByRole('heading', { level: 1 })).toContainText('Partida ·');
    const before = await readGame(first);
    await first.locator('.game-hand .card-details-button').first().click(); await expect(first.getByRole('dialog')).toBeVisible();
    await first.getByRole('button', { name: 'Cerrar detalles' }).press('Escape'); expect((await readGame(first)).game.round.plays).toEqual([]);
    if (cardFirst) {
      await first.locator('.game-hand .card-play-button').first().tap();
      expect((await readGame(first)).game.round.plays).toEqual([]);
      await expect(first.getByRole('button', { name: /Jugar/ }).first()).toHaveAttribute('aria-pressed', 'true');
      await expect(tab.getByRole('button', { name: /Jugar/ }).first()).toHaveAttribute('aria-pressed', 'false');
      await first.getByRole('button', { name: 'BAJO', exact: true }).tap();
    } else {
      await first.getByRole('button', { name: 'ALTO', exact: true }).click();
      await expect(tab.getByText('Dirección aceptada (solo tú): ALTO')).toBeVisible();
      expect((await readGame(p.host)).game.interaction.openingSelection).toBeNull();
      await first.reload(); await expect(first.getByText('Dirección aceptada (solo tú): ALTO')).toBeVisible();
      expect((await readGame(first)).game.round.plays).toEqual([]);
      await first.locator('.game-hand .card-play-button').first().click();
    }
    await expect.poll(async () => (await readGame(first)).game.round.plays.length).toBe(1);
    const after = await readGame(first); expect(after.game.round.direction).toBe(cardFirst ? 'LOW' : 'HIGH');
    expect(after.game.hand).toHaveLength(2); expect(after.game.round.plays[0].card.id).toBe(before.game.hand[0].id);
    await expect(tab.locator('.game-hand .card-play-button').first()).toBeDisabled();
    await expect(p.host.getByText(`Dirección: ${cardFirst ? 'BAJO' : 'ALTO'}`, { exact: true })).toBeVisible();
  } finally { await p.close(); await server.stop(); }
});

test('B07 parcial remoto no completa carta local; teclado y F5 recuperan solo dirección', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, server.base, { deckId: 'portada', version: 7, width: 390 });
  const first = p.pages[1]; const tab = await p.contexts[1].newPage();
  try {
    await tab.goto(server.base); await expect(tab.getByRole('button', { name: 'ALTO', exact: true })).toBeEnabled();
    await expect(first.locator('.game-hand .card-play-button').first()).toBeEnabled();
    await first.locator('.game-hand .card-play-button').first().press('Enter');
    await expect(first.locator('.game-hand .card-play-button').first()).toHaveAttribute('aria-pressed', 'true');
    await tab.getByRole('button', { name: 'ALTO', exact: true }).press('Enter');
    await expect(first.getByText('Dirección aceptada (solo tú): ALTO')).toBeVisible();
    expect((await readGame(first)).game.round.plays).toEqual([]);
    await first.reload();
    await expect(first.getByRole('button', { name: /Jugar/ }).first()).toHaveAttribute('aria-pressed', 'false');
    await expect(first.locator('.game-hand .card-play-button').first()).toBeEnabled();
    await first.locator('.game-hand .card-play-button').first().press('Enter');
    await expect.poll(async () => (await readGame(first)).game.round.plays.length).toBe(1);
    expect((await readGame(first)).game.round.direction).toBe('HIGH');
  } finally { await p.close(); await server.stop(); }
});

test('B07 Detalles conserva foco si otra pestaña juega la carta mostrada', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, server.base, { deckId: 'portada', version: 7, width: 360 });
  const first = p.pages[1]; const tab = await p.contexts[1].newPage();
  try {
    await tab.goto(server.base); await expect(tab.getByRole('button', { name: 'ALTO', exact: true })).toBeEnabled();
    await first.locator('.game-hand .card-details-button').first().tap();
    const dialog = first.getByRole('dialog'); await expect(dialog).toBeVisible();
    await tab.getByRole('button', { name: 'ALTO', exact: true }).tap();
    await tab.locator('.game-hand .card-play-button').first().tap();
    await expect(first.locator('.game-hand .game-card')).toHaveCount(2);
    await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Cerrar detalles' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Cerrar detalles' }).press('Escape');
    await expect(first.getByRole('region', { name: 'Cartas de tu mano' })).toBeFocused();
    expect((await readGame(first)).game.round.plays).toHaveLength(1);
  } finally { await p.close(); await server.stop(); }
});

for (const action of ['retorno', 'resume'] as const) test(`B07 respuesta antigua de ${action} no borra sala nueva creada en otra pestaña`, async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, review: 0, width: 390 });
  const tab = await p.contexts[0].newPage(); let release: (() => void) | undefined;
  try {
    while ((await readRoom(p.host)).status === 'IN_GAME') await humanPlay(p);
    await tab.goto(server.base); await expect(tab.getByRole('heading', { name: 'Partida terminada' })).toBeVisible();
    if (action === 'retorno') server.interceptHome((_input, ack, response) => { release = () => ack(response); });
    await p.host.getByRole('button', { name: 'Volver al inicio' }).click();
    await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    if (action === 'resume') {
      await expect(p.host.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
      server.interceptResume((ack, response) => { release = () => ack(response); });
      const token = (await p.contexts[0].cookies()).find((cookie) => cookie.name === 'karta3_session')!.value;
      server.dropOneTransport(server.sessions.get(token)!);
    }
    await expect.poll(() => !!release).toBe(true);
    await tab.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(p.host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    const newer = await readRoom(tab); release!();
    if (action === 'retorno') await expect(p.host.getByRole('button', { name: 'Guardar', exact: true })).toBeEnabled();
    else await expect(p.host.getByLabel('Baraja', { exact: true })).toBeEnabled(); // resume ya confirmado
    await expect(p.host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    expect((await readRoom(p.host)).id).toBe(newer.id);
    expect((await readRoom(tab)).id).toBe(newer.id);
  } finally { await p.close(); await server.stop(); }
});

test('B07 M4 normal genérica 2: partida completa real, resultados, dos pestañas, F5 y otra sala sin reinicio', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const p = await manualTable(browser, baseURL!, { width: 1280, review: 0 }); const tab = await p.contexts[0].newPage();
  try {
    await tab.goto(baseURL!); await expect(tab.getByRole('heading', { level: 1 })).toContainText('Partida ·');
    let moves = 0; let finalRounds = 0; const seen = new Set<number>();
    while ((await readRoom(p.host)).status === 'IN_GAME') {
      const before = await readGame(p.host); if (before.game.phase === 'FINAL_PHASE' && !seen.has(before.game.round.number)) { seen.add(before.game.round.number); finalRounds++; }
      await humanPlay(p, moves % 2 === 0, before.game.round.number % 2 ? 'HIGH' : 'LOW'); moves++;
      if (moves === 5) await Promise.all(p.pages.map((page) => page.reload()));
    }
    expect(moves).toBe(40); expect(finalRounds).toBe(3);
    await Promise.all([...p.pages, tab].map((page) => expect(page.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible()));
    const result = await readRoom(p.host) as ResultsRoomView; expect(result.selectedDeck.contentVersion).toBe(2);
    expect(result.result.standings.reduce((sum, person) => sum + person.score, 0)).toBe(40);
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeFocused();
    await expect(p.host.locator('.game-hand')).toHaveCount(0); await expect(p.host.getByRole('button', { name: /ALTO|BAJO|Jugar/ })).toHaveCount(0);
    await Promise.all([p.host.reload(), p.pages[1].reload()]);
    expect((await readRoom(p.pages[1]) as ResultsRoomView).result.gameId).toBe(result.result.gameId);
    await p.host.screenshot({ path: 'test-results/B07-normal-result-1280.png', fullPage: true });
    await p.host.getByRole('button', { name: 'Volver al inicio' }).click();
    await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await expect(p.pages[1].getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    await p.host.getByRole('link', { name: 'Ver último resultado' }).click();
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    expect(await p.host.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room)).toBeNull();
    await p.host.reload(); await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    await p.host.getByRole('button', { name: 'Volver al inicio' }).click();
    await p.host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    const newer = await readRoom(p.host); expect(newer.id).not.toBe(result.id); expect(newer.code).not.toBe(result.code);
    await tab.goto(`${baseURL}/resultado/${result.result.gameId}`);
    await expect(tab.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    expect(await tab.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room.id)).toBe(newer.id);
    await tab.reload(); await expect(tab.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    await expect(p.host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
  } finally { await p.close(); }
});

for (const count of [4, 5]) test(`B07 M4 traza validada ${count} empatados: reparto ${count === 5 ? 1 : 2}, revisión y resultados móviles`, async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await configurationBrowserServer(true, true, { count });
  const p = await manualTable(browser, server.base, { count, observer: true, deckId: 'manual', version: 7, width: count === 5 ? 360 : 390, review: 5, tie: true });
  try {
    let plays = 0; let tie = false;
    while ((await readRoom(p.host)).status === 'IN_GAME') {
      const view = await readGame(p.host);
      if (view.game.phase === 'TIE_BREAK' && !tie) {
        tie = true; expect(view.game.round.playerIds).toHaveLength(count); expect(view.game.round.direction).toBeNull();
        expect(view.game.round.number).toBe(server.prepared!.trace.length + 1);
        for (const page of p.pages.slice(1)) expect((await readGame(page)).game.hand).toHaveLength(count === 5 ? 1 : 2);
        const first = p.pages[1]; await first.reload(); await expect(first.getByRole('button', { name: 'ALTO', exact: true })).toHaveAttribute('aria-pressed', 'false');
        await first.screenshot({ path: `test-results/B07-tie-${count === 5 ? 360 : 390}.png`, fullPage: true });
        expect((await readGame(p.host)).game.hand).toEqual([]);
      }
      if (view.game.interaction.review) {
        await expect(p.host.getByRole('heading', { name: 'Revisión de ronda' })).toBeVisible();
        if (view.game.round.kind === 'TIE_BREAK') {
          expect(view.game.interaction.review.result.awardedCardCount).toBe(0);
          await p.host.reload(); expect((await readGame(p.host)).game.interaction.review?.endsAt).toBe(view.game.interaction.review.endsAt);
          expect((await readRoom(p.host)).status).toBe('IN_GAME');
        }
        server.time.advance(5000);
      } else { await humanPlay(p, plays % 2 === 1); plays++; }
    }
    const result = await readRoom(p.host) as ResultsRoomView; expect(tie).toBe(true);
    expect(plays).toBe(server.prepared!.trace.length * count + count);
    expect(result.result.standings.map((person) => person.score)).toEqual(server.prepared!.points);
    expect(result.result.standings.map((person) => person.position)).toEqual(Array(count).fill(1));
    expect(result.result.winnerIds).toHaveLength(1); expect(result.participant.score).toBeNull(); expect(server.permutations()).toBe(2);
    await expect(p.host.locator('.standings tbody tr')).toHaveCount(count);
    await expect(p.host.locator('.game-hand')).toHaveCount(0); await expect(p.host.getByRole('timer')).toHaveCount(0);
    await p.host.screenshot({ path: `test-results/B07-observer-results-${count === 5 ? 360 : 390}.png`, fullPage: true });
    for (const page of p.pages) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await p.close(); await server.stop(); }
});

test('B07 M4 retorno, lectura explícita y caducidad controlada preservan nueva sala y copia ya mostrada', async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, width: 390, review: 0 }); const tab = await p.contexts[0].newPage();
  try {
    while ((await readRoom(p.host)).status === 'IN_GAME') await humanPlay(p);
    const result = await readRoom(p.host) as ResultsRoomView; await tab.goto(server.base);
    await expect(tab.getByRole('heading', { name: 'Partida terminada' })).toBeVisible();
    await p.host.getByRole('button', { name: 'Volver al inicio' }).click(); await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await p.host.getByRole('button', { name: 'Crear sala', exact: true }).click(); const newer = await readRoom(p.host);
    await tab.goto(`${server.base}/resultado/${result.result.gameId}`); await expect(tab.getByRole('heading', { name: 'Partida terminada' })).toBeVisible();
    server.time.advance(1000);
    await p.host.evaluate(async (id) => fetch(`/api/rooms/${id}/name`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Nueva' }) }), newer.id);
    server.time.elapse(result.result.retention.expiresAt - server.time.now().unix);
    const response = await tab.evaluate(async (id) => { const response = await fetch(`/api/results/${id}`); return { status: response.status, body: await response.json() }; }, result.result.gameId);
    expect(response.status).toBe(404); expect(response.body.error.code).toBe('RESULT_NOT_AVAILABLE');
    await expect(tab.getByRole('heading', { name: 'Partida terminada' })).toBeVisible(); // copia pública anterior permitida
    expect((await readRoom(p.host)).id).toBe(newer.id);
    await tab.reload(); await expect(tab.getByText('El resultado ya no está disponible', { exact: true })).toBeVisible();
    await expect(tab.locator('.standings')).toHaveCount(0); expect((await readRoom(p.host)).id).toBe(newer.id);
    await expect(p.host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
  } finally { await p.close(); await server.stop(); }
});

test('B07 resultado por URL: fallo de red conserva incertidumbre y reintento solo de lectura', async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, server.base, { deckId: 'manual', version: 7, width: 390, review: 0 });
  try {
    while ((await readRoom(p.host)).status === 'IN_GAME') await humanPlay(p);
    const result = await readRoom(p.host) as ResultsRoomView;
    await p.host.getByRole('button', { name: 'Volver al inicio' }).click();
    await p.host.route('**/api/results/*', (route) => route.abort());
    await p.host.getByRole('link', { name: 'Ver último resultado' }).click();
    await expect(p.host.getByRole('alert')).toHaveText('No se pudo leer el resultado. Reintenta la conexión.');
    await expect(p.host.locator('.standings')).toHaveCount(0);
    expect(await readRoom(p.host)).toBeNull();
    await p.host.unroute('**/api/results/*');
    await p.host.getByRole('button', { name: 'Reintentar conexión' }).click();
    await expect(p.host.getByRole('heading', { name: 'Partida terminada' })).toBeVisible();
    expect(await readRoom(p.host)).toBeNull();
    const expiry = result.result.retention.expiresAt;
    await p.host.clock.setFixedTime(new Date(expiry - 1));
    await p.host.getByRole('button', { name: 'Volver al inicio' }).click();
    await expect(p.host.getByRole('link', { name: 'Ver último resultado' })).toBeVisible();
    await p.host.clock.setFixedTime(new Date(expiry));
    await expect(p.host.getByRole('link', { name: 'Ver último resultado' })).toHaveCount(0);
  } finally { await p.close(); await server.stop(); }
});

test('B07 main compilado autónomo: genérica 2 real, observador, partida completa y reinicio de resultados', async ({ browser }) => {
  test.setTimeout(90_000);
  const { prepareDecks } = await import('../../dist-server/server/infrastructure/decks/catalog.js');
  const root = await compiledInstallation(); let server: Awaited<ReturnType<typeof startCompiledDeckServer>> | undefined;
  let p: Awaited<ReturnType<typeof manualTable>> | undefined;
  try {
    await fs.cp(path.resolve('barajas/generica'), path.join(root, 'barajas/generica'), { recursive: true });
    await prepareDecks(path.join(root, 'barajas')); server = await startCompiledDeckServer(root);
    p = await manualTable(browser, server.base, { observer: true, width: 390, review: 0 });
    let moves = 0;
    while ((await readRoom(p.host)).status === 'IN_GAME') { await humanPlay(p, moves % 2 === 0, moves % 3 === 0 ? 'LOW' : 'HIGH'); moves++; }
    expect(moves).toBe(40); const result = await readRoom(p.host) as ResultsRoomView;
    expect(result.participant.score).toBeNull(); expect(result.result.standings.reduce((sum, person) => sum + person.score, 0)).toBe(40);
    await expect(p.host.getByRole('heading', { name: 'Partida terminada' })).toBeVisible();
    await p.host.screenshot({ path: 'test-results/B07-normal-observer-result-390.png', fullPage: true });
    const port = Number(new URL(server.base).port); await server.stop(); server = await startCompiledDeckServer(root, port);
    await Promise.all(p.pages.map((page) => page.reload()));
    for (const page of p.pages) {
      await expect(page.getByText('El resultado ya no está disponible', { exact: true })).toBeVisible();
      await expect(page.locator('.standings, .game-hand')).toHaveCount(0);
      expect(await readRoom(page)).toBeNull();
    }
    await p.host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    expect((await readRoom(p.host)).id).not.toBe(result.id);
    expect(await fs.stat(path.join(root, 'asset-access.txt')).then(() => true, () => false)).toBe(false);
    expect(server.errors()).toBe('');
  } finally { await p?.close(); await server?.stop(); await removeTestInstallation(root); }
});

test('B07 ack de jugada y evento perdidos: incertidumbre, recuperación y ninguna cola al reconectar', async ({ browser }) => {
  const server = await configurationBrowserServer(true, true); const p = await manualTable(browser, server.base, { deckId: 'portada', version: 7 });
  try {
    const first = p.pages[1]; const cookie = (await p.contexts[1].cookies()).find((cookie) => cookie.name === 'karta3_session')!;
    server.suppressGameState(server.sessions.get(cookie.value)); server.interceptGame((event, _input, ack, response) => { if (event !== 'game:play') ack(response); });
    await first.route('**/api/rooms/current', (route) => route.abort());
    await first.getByRole('button', { name: 'ALTO', exact: true }).click(); await first.locator('.game-hand .card-play-button').first().click();
    await expect(first.getByRole('alert')).toContainText('No se pudo confirmar', { timeout: 8000 });
    await expect(first.getByRole('button', { name: 'Recuperar mesa' })).toBeVisible();
    for (const button of await first.locator('.game-hand .card-play-button').all()) await expect(button).toBeDisabled();
    expect(server.gameRequests.filter((item) => item.event === 'game:play')).toHaveLength(1);
    await first.unroute('**/api/rooms/current'); server.suppressGameState(undefined); server.interceptGame(undefined);
    await first.getByRole('button', { name: 'Recuperar mesa' }).click();
    await expect(first.locator('.game-hand .game-card')).toHaveCount(2);
    expect(server.gameRequests.filter((item) => item.event === 'game:play')).toHaveLength(1);
    await first.reload(); await expect(first.locator('.game-hand .game-card')).toHaveCount(2);
    expect(server.gameRequests.filter((item) => item.event === 'game:play')).toHaveLength(1);
  } finally { await p.close(); await server.stop(); }
});

test('B07 M3 cinco humanos y observador: siete normales, tres finales, mano variable y revisión final', async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, server.base, { deckId: 'portada', version: 7, count: 5, observer: true, width: 360, review: 5 });
  try {
    let count = 0; const finals = new Map<number, string>();
    while (count < 50) {
      const before = await readGame(p.host);
      if (before.game.phase === 'FINAL_PHASE') {
        finals.set(before.game.round.finalRoundIndex!, before.game.round.indicator.id);
        const actor = p.actors.get(before.game.interaction.turn!.playerId)!;
        expect((await readGame(actor)).game.hand.length).toBe(4 - before.game.round.finalRoundIndex!);
        if (before.game.round.finalRoundIndex === 3) await expect(actor.getByText('Desliza para ver tus cartas')).toHaveCount(0);
      }
      await humanPlay(p, count % 2 === 0, before.game.round.number % 2 ? 'HIGH' : 'LOW'); count++;
      const current = await readGame(p.host);
      if (current.game.interaction.review && count < 50) server.time.advance(5000);
    }
    const review = await readGame(p.host); expect(review.game.round.number).toBe(10); expect(review.game.round.finalRoundIndex).toBe(3);
    expect(review.game.interaction.stage).toBe('ROUND_REVIEW'); expect(review.game.interaction.review?.nextStage).toBe('RESULTS');
    expect(review.game.hand).toEqual([]); expect([...finals.keys()]).toEqual([1, 2, 3]); expect(new Set(finals.values()).size).toBe(1);
    expect(review.participants.reduce((sum, person) => sum + (person.score ?? 0), 0)).toBe(50);
    await p.host.reload(); await expect(p.host.getByRole('heading', { name: 'Revisión de ronda' })).toBeVisible();
    expect((await readGame(p.host)).game.interaction.review?.endsAt).toBe(review.game.interaction.review?.endsAt);
    for (const page of p.pages) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await p.close(); await server.stop(); }
});

for (const review of [0, 5]) test(`B07 M2 resolución, puntuación, revisión ${review} y reposición sin duplicación`, async ({ browser }) => {
  const server = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, server.base, { deckId: 'portada', version: 7, review });
  try {
    const first = p.pages[1]; const before = await readGame(first);
    await first.getByRole('button', { name: 'ALTO', exact: true }).click();
    await first.locator('.game-hand .card-play-button').first().click();
    await expect(p.host.locator('.game-hand .card-play-button').first()).toBeEnabled();
    await p.host.locator('.game-hand .card-play-button').first().click();
    await expect(first.getByText(/Ronda 1: ganó/)).toBeVisible();
    if (review) {
      await expect(first.getByRole('timer')).toHaveText('00:05');
      const resolved = await readGame(first); expect(resolved.game.interaction.stage).toBe('ROUND_REVIEW');
      expect(resolved.game.hand).toHaveLength(2); await first.reload();
      await expect(first.getByRole('heading', { name: 'Revisión de ronda' })).toBeVisible();
      expect((await readGame(first)).game.interaction.review?.endsAt).toBe(resolved.game.interaction.review?.endsAt);
      await expect(first.locator('.game-hand .card-play-button').first()).toBeDisabled();
      server.time.advance(4999); expect((await readGame(first)).game.round.number).toBe(1);
      server.time.advance(1);
    }
    await expect.poll(async () => (await readGame(first)).game.round.number).toBe(2);
    const after = await readGame(first); expect(after.game.hand).toHaveLength(3);
    expect(after.game.round.direction).toBeNull(); expect(after.game.drawPileCount).toBe(before.game.drawPileCount - 3);
    expect(after.participants.map((person) => person.score)).toEqual([0, 2]);
    expect(after.game.round.openerPlayerId).toBe(before.participant.id);
    expect(server.permutations()).toBe(1); await expect(first.getByRole('timer')).toHaveCount(0);
    expect(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await p.close(); await server.stop(); }
});
