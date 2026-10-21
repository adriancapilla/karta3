import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { io } from 'socket.io-client';
import type { RoomView, InitialGameRoomView, ResultsRoomView, SocketAck } from '../../shared/contracts/room.js';
import { approvedModels, approvedModelFiles } from '../support/approvedModels.js';
import { approvedInstalledDecks } from '../support/approvedSolar.js';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { statisticsInstallation } from '../support/statisticsInstallation.js';
import { manualTable, humanPlay, readRoom, readGame } from '../support/manualBrowserCases.js';
import { assertGamePrivacy } from '../support/gamePrivacy.js';

const evidence = 'playwright-report/b22/product';
const metadata = JSON.parse(await fs.readFile('barajas/modelos-ia-2026/baraja.json', 'utf8')) as { instructions: string };
const collection = JSON.parse(await fs.readFile('barajas/modelos-ia-2026/cartas.json', 'utf8')) as {
  cards: { id: string; name: string; note: string; values: Record<string, { playValue: number; displayValue: string; unit: string }> }[];
};
const literal = (v: { displayValue: string; unit: string }) => v.displayValue + (v.unit ? ` ${v.unit}` : '');
async function ownSocket(context: BrowserContext, base: string) {
  const cookie = (await context.cookies()).find(c => c.name === 'karta3_session')!;
  const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: `${cookie.name}=${cookie.value}`, Origin: base } });
  await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  return socket;
}
async function record(page: Page, name: string) {
  await page.evaluate(async () => { await document.fonts.ready; scrollTo(0, 0); });
  const measure = await page.evaluate(() => {
    const rect = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, right: r.right, bottom: r.bottom + scrollY }; };
    const composition = document.querySelector<HTMLElement>('.game-composition')!;
    return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scale: visualViewport?.scale }, useful: Number(composition.dataset.usefulWidth), layout: composition.dataset.layout,
      pageWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight,
      panels: Object.fromEntries(['people', 'initial-state', 'plays', 'hand'].map(key => [key, rect(document.querySelector(`.game-${key}`)!)])),
      cards: [...document.querySelectorAll('.game-layout .game-card')].filter(e => e.getBoundingClientRect().width > 0).map(e => ({ box: rect(e), name: e.querySelector('h3')!.textContent,
        titleFont: getComputedStyle(e.querySelector('h3')!).fontSize, family: getComputedStyle(e).fontFamily, details: rect(e.querySelector('.card-details-button')!),
        rows: [...e.querySelectorAll('tbody tr')].map(row => ({ text: row.textContent, columns: row.children.length, cells: [...row.children].map(cell => ({ box: rect(cell), text: cell.textContent, font: getComputedStyle(cell).fontSize, client: cell.clientWidth, scroll: cell.scrollWidth, overflow: getComputedStyle(cell).overflow, textOverflow: getComputedStyle(cell).textOverflow })) })) })) };
  });
  await fs.mkdir(evidence, { recursive: true }); await fs.writeFile(`${evidence}/${name}.json`, JSON.stringify({ ...measure, browser: page.context().browser()!.version(), clock: 'ControlledTime; permutación dirigida legal' }, null, 2) + '\n');
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
  expect(measure.pageWidth).toBeLessThanOrEqual(measure.viewport.width);
  for (const card of measure.cards) for (const row of card.rows) {
    expect(row.columns).toBe(2);
    for (const cell of row.cells) { expect(cell.font).toBe('14px'); expect(cell.scroll).toBeLessThanOrEqual(cell.client + 1); expect(cell.overflow).not.toBe('hidden'); expect(cell.textOverflow).not.toBe('ellipsis'); }
  }
  if (measure.layout === 'compact') {
    expect(measure.panels.people.width).toBe(Math.min(measure.useful, 450)); expect(measure.panels['initial-state'].width).toBe(Math.min(measure.useful, 450));
    expect(measure.cards.every(c => c.box.width === 220)).toBe(true);
  } else if (measure.useful === 1368) expect(measure.cards.every(c => c.box.width === 230 && c.box.height === 321)).toBe(true);
  return measure;
}

test('B22 catálogo normal: dos sesiones/pestañas, selección exacta, portada/instrucciones, 59 medios y ocho JSON privados', async ({ browser }) => {
  const installation = await statisticsInstallation(); const server = await installation.start(false);
  const contexts = await Promise.all([browser.newContext({ viewport: { width: 390, height: 844 } }), browser.newContext()]);
  const [host, guest] = await Promise.all(contexts.map(c => c.newPage())); const clients: Awaited<ReturnType<typeof ownSocket>>[] = [];
  try {
    const catalog = await contexts[0].request.get(server.base + '/api/decks'); expect(await catalog.json()).toEqual({ decks: approvedInstalledDecks });
    expect(catalog.headers()['set-cookie']).toBeUndefined(); expect(catalog.headers()['cache-control']).toBe('no-store'); expect(await contexts[0].cookies()).toEqual([]);
    await Promise.all([host.goto(server.base), guest.goto(server.base)]); await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await guest.getByLabel('Código de sala').fill((await host.locator('.code').textContent())!); await guest.getByLabel('Tu nombre', { exact: true }).fill('Invitado IA');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click(); await expect(guest.getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
    const tab = await contexts[0].newPage(); await tab.goto(host.url()); await expect(tab.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await host.getByLabel('Valor del Atributo').selectOption('DISPLAY_VALUE'); await tab.getByLabel('Optimizar para móvil').check();
    for (const deck of [...approvedInstalledDecks, approvedModels]) {
      await host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: deck.id, contentVersion: deck.contentVersion }));
      await expect(guest.locator('.deck-card h3')).toHaveText(`${deck.name} · v${deck.contentVersion}`);
    }
    for (const page of [host, guest, tab]) {
      await expect(page.locator('.deck-card img')).toHaveAttribute('src', approvedModels.imageUrl!);
      await expect(page.locator('.deck-card img')).toHaveAttribute('alt', approvedModels.imageAlt);
      await expect.poll(() => page.locator('.deck-card img').evaluate(e => (e as HTMLImageElement).naturalWidth)).toBe(640);
      await page.getByRole('button', { name: 'Información de la baraja', exact: true }).click();
      expect(await page.getByRole('dialog').locator('.literal-text').last().textContent()).toBe(metadata.instructions);
      await page.getByRole('button', { name: 'Cerrar consulta', exact: true }).press('Escape');
    }
    const original = await readRoom(host);
    for (const [index, context] of contexts.entries()) {
      const socket = await ownSocket(context, server.base); clients.push(socket);
      const ack = await new Promise<SocketAck<{ room: RoomView }>>(resolve => socket.emit('room:configure', { requestId: `b22-permission-${index}`, roomId: original.id, change: { field: 'deck', value: { id: 'modelos-ia-2026', contentVersion: index ? 2 : 4 } } }, resolve));
      expect(ack.ok).toBe(false); if (!ack.ok) expect(ack.error.code).toBe(index ? 'FORBIDDEN' : 'DECK_VERSION_MISMATCH');
    }
    const identities = await Promise.all([host, guest].map(readRoom)); await Promise.all([host.reload(), guest.reload()]);
    for (const [index, page] of [host, guest].entries()) {
      await expect(page.locator('.deck-card h3')).toHaveText(approvedModels.name + ' · v2'); const view = await readRoom(page);
      expect(view.participant.id).toBe(identities[index].participant.id); expect(view.selectedDeck).toEqual(approvedModels);
      expect(view.settings).toMatchObject({ attributeValueMode: 'DISPLAY_VALUE', optimizeForMobile: true, deckContentVersion: 2 });
      expect(JSON.stringify(view)).not.toMatch(/"cards"|"playValue"|"imageRef"|sessionId|drawPile|permutation/);
    }
    for (const file of approvedModelFiles.filter(f => f.path.startsWith('imagenes/'))) {
      const r = await contexts[0].request.get(server.base + '/media/decks/modelos-ia-2026/v2/' + file.path);
      expect(r.status()).toBe(200); expect(r.headers()['content-type']).toContain('image/webp'); expect(createHash('sha256').update(await r.body()).digest('hex')).toBe(file.sha256);
    }
    for (const deck of approvedInstalledDecks) for (const file of ['baraja.json', 'cartas.json']) for (const url of [`/barajas/${deck.id}/${file}`, `/media/decks/${deck.id}/v${deck.contentVersion}/${file}`]) {
      const r = await contexts[0].request.get(server.base + url); expect(r.status()).toBe(404); expect(await r.text()).not.toContain('<!doctype html>');
    }
    for (const path of ['/media/decks/modelos-ia-2026/v4/imagenes/portada.webp', '/media/decks/modelos-ia-2026/v2/%2e%2e%2fcartas.json', '/api/no-existe']) expect((await contexts[0].request.get(server.base + path)).status()).toBe(404);
    await host.getByLabel('Baraja', { exact: true }).selectOption(''); await expect(guest.locator('.no-deck')).toBeVisible();
    expect((await readRoom(host)).settings).toMatchObject({ attributeValueMode: 'DISPLAY_VALUE', optimizeForMobile: true });
    await host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'modelos-ia-2026', contentVersion: 2 }));
    await fs.mkdir(evidence, { recursive: true }); await host.screenshot({ path: `${evidence}/espera-390.png`, fullPage: true });
    expect(await fs.readdir(installation.root)).not.toContain('asset-access.txt');
  } finally { clients.forEach(c => c.disconnect()); await Promise.all(contexts.map(c => c.close())); await server.stop(); await installation.cleanup(); }
});

for (const profile of [{ width: 1920, optimize: true }, { width: 1280, optimize: true }, { width: 390, optimize: true }, { width: 390, optimize: false }])
  for (const mode of ['PLAY_VALUE', 'DISPLAY_VALUE'] as const) test(`B22 textos dirigidos ${profile.width} optimizar=${profile.optimize} ${mode}: mano/indicadora/Mesa/Detalles`, async ({ browser }) => {
    const server = await configurationBrowserServer(true, true, undefined, { models: true });
    const prefix = ['claude-sonnet-55-max', 'llama-31-405b', 'gpt-j-6b', 'gemini-31-pro', 'claude-sonnet-4', 'gpt-2-15b', 'gpt-3-175b'];
    server.permutation(ids => [...prefix, ...ids.filter(id => !prefix.includes(id))]);
    const p = await manualTable(browser, server.base, { deckId: 'modelos-ia-2026', version: 2, valueMode: mode, optimize: profile.optimize, width: profile.width, review: 5, turn: 60 });
    const label = `${profile.width}-${profile.optimize}-${mode}`;
    const sockets = await Promise.all(p.contexts.map(context => ownSocket(context, server.base)));
    const deliveries: InitialGameRoomView[][] = [[], []];
    try {
      const views = await Promise.all(p.pages.map(readGame)); expect(views[0].game.round.activeAttributeId).toBe('atributo1');
      for (const [index, socket] of sockets.entries()) {
        socket.on('room:state', (payload: { room: RoomView }) => { if (payload.room.status === 'IN_GAME') deliveries[index].push(payload.room); });
        const ack = await new Promise<SocketAck<{ room: RoomView | null }>>(resolve => socket.emit('room:resume', {}, resolve));
        expect(ack.ok).toBe(true);
        if (!ack.ok || ack.room?.status !== 'IN_GAME') throw new Error('No se recuperó la misma partida');
        assertGamePrivacy(ack.room, views[index].game.hand.map(c => c.id), views[1 - index].game.hand.map(c => c.id), (condition, reason) => expect(condition, reason).toBe(true));
      }
      for (const [index, page] of p.pages.entries()) {
        const view = views[index]; assertGamePrivacy(view, view.game.hand.map(c => c.id), views[1 - index].game.hand.map(c => c.id), (condition, reason) => expect(condition, reason).toBe(true));
        for (const card of view.game.hand) {
          const element = page.locator(`.game-hand [data-card-id="${card.id}"]`);
          await expect(element.locator('h3')).toHaveText(card.name);
          await expect(element.locator('tbody td')).toHaveText(view.game.attributes.map(a => mode === 'PLAY_VALUE' ? String(card.values[a.id].playValue) : literal(card.values[a.id])));
          await element.locator('.card-details-button').focus(); await element.locator('.card-details-button').press('Enter');
          const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(`Detalles de ${card.name}`);
          await expect(dialog.locator('thead th')).toHaveText(['Atributo', 'Dato']); await expect(dialog.locator('tbody td')).toHaveText(view.game.attributes.map(a => literal(card.values[a.id])));
          const approved = collection.cards.find(c => c.id === card.id)!;
          expect(await dialog.locator('.card-note').textContent()).toBe(approved.note);
          if (card.id === 'llama-31-405b') { await expect(dialog).toContainText('23/07/2024'); await expect(dialog).toContainText('131.072 tk'); }
          if (card.id === 'gpt-j-6b') await expect(dialog).toContainText('06/2021');
          if (card.id === 'gemini-31-pro') await expect(dialog).toContainText('1,049M tk');
          await page.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape'); await expect(page.locator('.card-details-dialog')).toHaveCount(0); await expect(element.locator('.card-details-button')).toBeFocused();
        }
      }
      const initial = await readGame(p.pages[1]); const compact = await p.pages[1].locator('.game-composition').getAttribute('data-layout') === 'compact';
      const indicator = p.pages[1].getByRole('button', { name: `${compact ? 'Carta indicadora:' : 'Detalles de'} ${initial.game.round.indicator.name}`, exact: true });
      await indicator.focus(); await indicator.press('Enter'); await expect(p.pages[1].getByRole('dialog')).toContainText(initial.game.round.indicator.name);
      await p.pages[1].getByRole('button', { name: compact ? 'Cerrar consulta' : 'Cerrar detalles', exact: true }).press('Escape');
      await expect(p.pages[1].locator('.consultation, .card-details-dialog')).toHaveCount(0); await expect(indicator).toBeFocused();
      await record(p.host, `mano-${label}`); expect(server.gameRequests).toHaveLength(0); expect((await readGame(p.pages[1])).game.interaction.turn!.timing).toEqual(initial.game.interaction.turn!.timing);
      await humanPlay(p, false, 'LOW'); await humanPlay(p);
      await expect(p.host.locator('.played-row .game-card')).toHaveCount(2); await expect(p.host.locator('.round-review')).toBeVisible();
      await record(p.host, `mesa-revision-${label}`);
      expect((await readGame(p.host)).game.interaction.review!.result.ranking).toHaveLength(2);
      expect(server.gameRequests.filter(r => r.event === 'game:play')).toHaveLength(2);
      for (const [index, messages] of deliveries.entries()) {
        await expect.poll(() => messages.length).toBeGreaterThan(0);
        for (const view of messages) assertGamePrivacy(view, view.game.hand.map(c => c.id), views[1 - index].game.hand.map(c => c.id).filter(id => !view.game.round.plays.some(p => p.card.id === id)), (condition, reason) => expect(condition, reason).toBe(true));
      }
    } finally { sockets.forEach(s => s.disconnect()); await p.close(); await server.stop(); }
  });

test('B22 partida completa normal y paquete estadístico SYNTHETIC: humano/EASY/HARD, F5, resultados y otra sala', async ({ browser }) => {
  test.setTimeout(120_000);
  const installation = await statisticsInstallation(); const server = await installation.start();
  const p = await manualTable(browser, server.base, { count: 1, bots: ['EASY', 'HARD'], deckId: 'modelos-ia-2026', version: 2, valueMode: 'DISPLAY_VALUE', optimize: true, width: 390, review: 0, turn: 60 });
  const tab = await p.contexts[0].newPage(); let moves = 0; const finals = new Set<number>();
  try {
    await tab.goto(server.base); await expect(tab.getByRole('heading', { level: 1 })).toContainText(approvedModels.name);
    await expect.poll(() => installation.total('CONFIGURATION', 'modelos-ia-2026:2:2', 'package')).toBe(1);
    while ((await readRoom(p.host)).status === 'IN_GAME') {
      await expect.poll(async () => { const v = await readRoom(p.host); return v.status !== 'IN_GAME' || v.game.interaction.turn?.playerId === v.participant.id; }).toBe(true);
      const view = await readRoom(p.host); if (view.status !== 'IN_GAME') break;
      expect(view.selectedDeck).toEqual(approvedModels); expect(view.game.ownConsecutiveTimeouts).toBe(0); if (view.game.phase === 'FINAL_PHASE') finals.add(view.game.round.number);
      await humanPlay(p, false, 'HIGH'); moves++;
      if (moves === 3) { await Promise.all([p.host.reload(), tab.reload()]); for (const page of [p.host, tab]) { await expect(page.getByRole('heading', { level: 1 })).toContainText(approvedModels.name); expect((await readGame(page)).participant.id).toBe(view.participant.id); } }
    }
    const result = await readRoom(p.host) as ResultsRoomView;
    expect(result.result.endReason).toBe('DECK_COMPLETED'); expect(result.result.completedNormally).toBe(true); expect(moves).toBe(15); expect(finals.size).toBe(3);
    expect(result.result.standings.reduce((sum, e) => sum + e.score, 0)).toBe(45); expect(JSON.stringify(result)).not.toMatch(/"hand"|"cards"|playValue|drawPile|sessionId/);
    await expect.poll(() => installation.total('GAME', 'DECK_COMPLETED')).toBe(1); expect(installation.total('CONFIGURATION', 'modelos-ia-2026:2:2', 'package')).toBe(1);
    await fs.mkdir(evidence, { recursive: true }); await p.host.screenshot({ path: `${evidence}/resultado-normal.png`, fullPage: true });
    await fs.writeFile(`${evidence}/partida-normal.json`, JSON.stringify({ clock: 'SystemClock', scheduler: 'TimerScheduler', entropy: 'CryptoCardPermutation', traffic: 'SYNTHETIC', moves, finals: [...finals], result: result.result, packageCount: installation.total('CONFIGURATION', 'modelos-ia-2026:2:2', 'package') }, null, 2) + '\n');
    await Promise.all([p.host.reload(), tab.reload()]); for (const page of [p.host, tab]) { await expect(page.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible(); const recovered = await readRoom(page) as ResultsRoomView; expect({ ...recovered.result, retention: { ...recovered.result.retention, serverNow: result.result.retention.serverNow } }).toEqual(result.result); }
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click(); await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible();
    await tab.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    expect(await fs.readdir(installation.root)).not.toContain('asset-access.txt');
  } finally { await p.close(); await server.stop(); await installation.cleanup(); }
});
