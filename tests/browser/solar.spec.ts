import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { InitialGameRoomView, ResultsRoomView } from '../../shared/contracts/room.js';
import { approvedGeneric } from '../support/approvedGeneric.js';
import { approvedInstalledDecks, approvedSolar } from '../support/approvedSolar.js';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { humanPlay, manualTable, readGame, readRoom } from '../support/manualBrowserCases.js';
import { assertGamePrivacy } from '../support/gamePrivacy.js';

const cancelled = 'Partida cancelada por el anfitrión';
async function cancel(page: Page) {
  await page.getByRole('button', { name: 'Cancelar partida', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar partida', exact: true }).click();
  await expect(page.getByRole('heading', { name: cancelled, exact: true })).toBeVisible();
}
async function loadedImages(page: Page, selector: string) {
  await expect.poll(() => page.locator(selector).evaluateAll((images) => images.length > 0
    && images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.getByText(/No se pudo cargar la (imagen|portada)/)).toHaveCount(0);
}
const result = (page: Page, gameId: string): Promise<ResultsRoomView> => page.evaluate(async (id) => (await (await fetch(`/api/results/${id}`)).json()).room, gameId);

for (const width of [390, 1280]) test(`B14 catálogo normal, cambio de baraja, portada y recuperación en dos sesiones a ${width}px`, async ({ browser, baseURL }, info) => {
  const contexts = await Promise.all([browser.newContext({ viewport: { width, height: 844 } }), browser.newContext({ viewport: { width: 1280, height: 844 } })]);
  const host = await contexts[0].newPage(); const guest = await contexts[1].newPage();
  try {
    const catalog = await contexts[0].request.get(`${baseURL}/api/decks`);
    expect(await catalog.json()).toEqual({ decks: approvedInstalledDecks }); expect(catalog.headers()['set-cookie']).toBeUndefined();
    expect(catalog.headers()['cache-control']).toBe('no-store');
    await Promise.all([host.goto(baseURL!), guest.goto(baseURL!)]);
    await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await guest.getByLabel('Código de sala').fill((await host.locator('.code').textContent())!);
    await guest.getByLabel('Tu nombre', { exact: true }).fill('Persona Solar');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(guest.getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
    await expect(guest.getByRole('combobox')).toHaveCount(0);
    for (const deck of [approvedSolar, approvedGeneric, approvedSolar]) {
      await host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: deck.id, contentVersion: 4 }));
      for (const page of [host, guest]) {
        await expect(page.locator('.deck-card h3')).toHaveText(`${deck.name} · v4`);
        expect((await readRoom(page)).selectedDeck).toEqual(deck);
        if (deck.imageUrl) { await loadedImages(page, '.deck-card img'); await expect(page.locator('.deck-card img')).toHaveAttribute('alt', deck.imageAlt); }
        else { await expect(page.locator('.deck-card img')).toHaveCount(0); await expect(page.locator('.neutral-card')).toBeVisible(); }
      }
    }
    const before = await Promise.all([readRoom(host), readRoom(guest)]);
    await Promise.all([host.reload(), guest.reload()]);
    for (const [index, page] of [host, guest].entries()) {
      await expect(page.locator('.deck-card h3')).toHaveText('Sistema Solar · v4'); await loadedImages(page, '.deck-card img');
      const view = await readRoom(page); expect(view.selectedDeck).toEqual(approvedSolar); expect(view.participant.id).toBe(before[index].participant.id);
      expect(view.settings).toEqual(before[index].settings); expect(view.participants.map((p) => p.id)).toEqual(before[index].participants.map((p) => p.id));
      expect(JSON.stringify(view)).not.toMatch(/"playValue"\s*:|"cards"\s*:|"imageRef"\s*:|"sessionId"\s*:|"publication"\s*:/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const deckId of approvedInstalledDecks.map(deck => deck.id)) for (const name of ['baraja.json', 'cartas.json']) {
      const response = await contexts[0].request.get(`${baseURL}/barajas/${deckId}/${name}`);
      expect(response.status()).toBe(404); expect(await response.text()).not.toContain('<!doctype html>');
    }
    if (width === 1280) {
      const manifest = JSON.parse(await fs.readFile('docs/sdd/evidencias/B14/huellas.json', 'utf8')) as { files: { file: string; masterSHA256: string }[] };
      const images = manifest.files.filter((entry) => entry.file.startsWith('imagenes/')); expect(images).toHaveLength(59);
      await Promise.all(images.map(async (entry) => {
        const response = await contexts[0].request.get(`${baseURL}/media/decks/sistema-solar/v4/${entry.file}`);
        expect(response.status()).toBe(200); expect(response.headers()['content-type']).toContain('image/webp');
        expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(entry.masterSHA256);
      }));
    }
    await host.screenshot({ path: info.outputPath(`B14-espera-${width}.png`), fullPage: true });
    await host.getByRole('button', { name: 'Cerrar sala', exact: true }).click(); await host.getByRole('button', { name: 'Sí, cerrar sala', exact: true }).click();
    await expect(guest.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
  } finally { await Promise.all(contexts.map((context) => context.close())); }
});

for (const direction of ['HIGH', 'LOW'] as const) test(`B14 Encke/Borrelly ${direction}: Dato/J, datos largos, privacidad, B13 y nueva genérica`, async ({ browser }, info) => {
  const width = direction === 'HIGH' ? 1920 : 390;
  const server = await configurationBrowserServer(true, true, undefined, { solar: true, generic: true });
  const prefix = ['encke', 'borrelly', 'hyakutake', 'sedna', 'eris', 'hale-bopp', 'ryugu'];
  server.permutation((ids) => ids.includes('encke') ? [...prefix, ...ids.filter((id) => !prefix.includes(id))] : [...ids]);
  const p = await manualTable(browser, server.base, { deckId: 'sistema-solar', version: 4, valueMode: 'DISPLAY_VALUE', review: 2, width });
  const captured: InitialGameRoomView[][] = p.pages.map(() => []);
  const traffic = p.pages.map(() => ({ acks: 0, events: 0 }));
  try {
    const own = await Promise.all(p.pages.map(readGame)); const gameId = own[0].game.id;
    expect(own[0].game.round.activeAttributeId).toBe('atributo3');
    for (const [index, page] of p.pages.entries()) {
      page.on('websocket', (socket) => socket.on('framereceived', ({ payload }) => {
        const text = String(payload); const bracket = text.indexOf('[');
        if (bracket < 0 || !/^4[23]/.test(text)) return;
        const values = JSON.parse(text.slice(bracket)) as { room?: InitialGameRoomView }[];
        for (const value of values) if (value?.room?.status === 'IN_GAME') {
          captured[index].push(value.room);
          if (text.startsWith('43')) traffic[index].acks++; else traffic[index].events++;
        }
      }));
      await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toContainText('Partida · Sistema Solar');
      await loadedImages(page, '.game-hand img');
      const rivalIds = own[1 - index].game.hand.map((card) => card.id);
      assertGamePrivacy(await readGame(page), own[index].game.hand.map((card) => card.id), rivalIds, (condition, reason) => expect(condition, reason).toBe(true));
      const first = page.locator('.game-hand .game-card').first(); const name = index === 0 ? 'Borrelly' : 'Encke';
      await expect(first.getByRole('heading', { name, exact: true })).toBeVisible();
      await expect(first.locator('tbody tr').last()).toContainText('4.8 km');
      expect(own[index].game.hand[0].values.atributo3.playValue).toBe(index === 0 ? 8 : 7); await expect(first.locator('tbody tr').last().locator('td')).toHaveCount(1);
      await first.getByRole('button', { name: `Detalles de ${name}`, exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText('Cometa'); await loadedImages(page, 'dialog img');
      await expect(page.getByRole('dialog')).toContainText(index === 0 ? 'Deep Space 1' : 'periodo orbital');
      await page.getByRole('button', { name: 'Cerrar detalles', exact: true }).click();
    }
    const long = p.pages[1].locator('.game-hand [data-card-id="hyakutake"]');
    await expect(long.locator('tbody tr').nth(1)).toContainText('317859 MKm');
    const numberFits = (number: Element) => {
      const bounds = number.getBoundingClientRect(); const cell = number.getBoundingClientRect();
      return number.getClientRects().length === 1 && bounds.left >= cell.left && bounds.right <= cell.right + 1;
    };
    expect(await long.locator('tbody tr').nth(1).locator('td').evaluate(numberFits)).toBe(true);
    await long.getByRole('button', { name: 'Detalles de Hyakutake', exact: true }).click();
    await expect(p.pages[1].getByRole('dialog').locator('tbody tr').nth(1)).toContainText('317859 MKm');
    expect(await p.pages[1].getByRole('dialog').locator('tbody tr').nth(1).locator('td').evaluate(numberFits)).toBe(true);
    await p.pages[1].getByRole('button', { name: 'Cerrar detalles', exact: true }).click();
    const measures = await long.locator('.game-card').evaluate((card) => ({ width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height,
      tableWidth: card.querySelector('table')!.getBoundingClientRect().width,
      tableFits: card.querySelector('table')!.getBoundingClientRect().right <= card.getBoundingClientRect().right - 1,
      jugableLines: [...card.querySelectorAll('tbody tr td:last-child')].map((cell) => { const range = document.createRange(); range.selectNodeContents(cell); return range.getClientRects().length; }),
      textFragments: [...card.querySelectorAll('tbody tr td:last-child')].map((cell) => {
        const range = document.createRange(); range.selectNodeContents(cell);
        return { text: cell.textContent, whiteSpace: getComputedStyle(cell).whiteSpace,
          rects: [...range.getClientRects()].map((rect) => ({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })) };
      }),
      values: [...card.querySelectorAll('td')].map((cell) => ({ text: cell.textContent, client: cell.clientWidth, scroll: cell.scrollWidth,
        clipped: getComputedStyle(cell).textOverflow === 'ellipsis' || getComputedStyle(cell).overflow === 'hidden' })) }));
    console.log('SOLAR_TEXT_MEASUREMENT', JSON.stringify(measures));
    expect(measures.tableFits).toBe(true);
    expect(measures.jugableLines).toEqual([1, 1, 1]);
    for (const cell of measures.values) { expect(cell.clipped).toBe(false); expect(cell.scroll).toBeLessThanOrEqual(cell.client + 1); }
    await p.pages[1].screenshot({ path: info.outputPath(`B14-cartas-${width}.png`), fullPage: true });
    server.time.elapse(1); await humanPlay(p, true, direction); server.time.elapse(1); await humanPlay(p);
    const review = await readGame(p.host); const resolution = review.game.interaction.review!.result;
    expect(resolution.ranking.map((entry) => entry.playValue)).toEqual(direction === 'HIGH' ? [8, 7] : [7, 8]);
    expect(resolution.winnerPlayerId).toBe(own[direction === 'HIGH' ? 0 : 1].participant.id);
    expect(resolution.ranking.map((entry) => entry.card.values.atributo3.displayValue)).toEqual(['4.8', '4.8']);
    for (const [index, messages] of captured.entries()) {
      expect(messages.length).toBeGreaterThan(0);
      expect(traffic[index].acks).toBeGreaterThan(0); expect(traffic[index].events).toBeGreaterThan(0);
      for (const view of messages) {
        const visible = new Set(view.game.round.plays.map((play) => play.card.id));
        const hidden = own[1 - index].game.hand.map((card) => card.id).filter((id) => !visible.has(id));
        assertGamePrivacy(view, own[index].game.hand.map((card) => card.id).filter((id) => !visible.has(id)), hidden,
          (condition, reason) => expect(condition, `HTTP/ack/event: ${reason}`).toBe(true));
      }
    }
    await cancel(p.host); await expect(p.pages[1].getByRole('heading', { name: cancelled, exact: true })).toBeVisible();
    const a = await result(p.host, gameId); expect(a.selectedDeck).toEqual(approvedSolar); expect(a.result.winnerIds).toEqual([]);
    expect(a.result.standings.map((entry) => entry.score).sort()).toEqual([0, 2]);
    for (const page of p.pages) { await page.reload(); await expect(page.getByRole('heading', { name: cancelled, exact: true })).toBeVisible(); }
    await p.host.screenshot({ path: info.outputPath(`B14-cancelacion-${width}.png`), fullPage: true });
    for (const page of p.pages) await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await p.host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await p.pages[1].getByLabel('Código de sala').fill((await p.host.locator('.code').textContent())!);
    await p.pages[1].getByLabel('Tu nombre', { exact: true }).fill('Otra mesa'); await p.pages[1].getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(p.pages[1].getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
    await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await p.host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'generica', contentVersion: 4 }));
    await expect(p.host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled(); await p.host.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    for (const page of p.pages) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Partida · KARTA3 — Baraja genérica');
      const b = await readGame(page); expect(b.game.id).not.toBe(gameId); expect(b.selectedDeck).toEqual(approvedGeneric);
      expect(b.game.hand.every((card) => card.name.startsWith('Carta ') && card.imageUrl === null)).toBe(true); await expect(page.getByRole('alert')).toHaveCount(0);
    }
    server.time.advance(2000); expect((await readGame(p.host)).selectedDeck).toEqual(approvedGeneric);
    const recoveredA = (await result(p.host, gameId)).result;
    expect({ ...recoveredA, retention: { ...recoveredA.retention, serverNow: a.result.retention.serverNow } }).toEqual(a.result);
    expect(recoveredA.retention.serverNow).toBeGreaterThan(a.result.retention.serverNow);
    await fs.writeFile(info.outputPath(`B14-medidas-${width}.json`), JSON.stringify({ ...measures, traffic }, null, 2));
    await cancel(p.host);
  } finally { await p.close(); await server.stop(); }
});

test('B14 ejecución normal: Sistema Solar con humano y Fácil/Difícil hasta resultado, recarga y otra sala', async ({ browser, baseURL }, info) => {
  test.setTimeout(90_000);
  const p = await manualTable(browser, baseURL!, { count: 1, bots: ['EASY', 'HARD'], deckId: 'sistema-solar', version: 4, review: 0, turn: 60 });
  const finals = new Set<number>(); let moves = 0;
  try {
    while ((await readRoom(p.host)).status === 'IN_GAME') {
      await expect.poll(async () => { const view = await readRoom(p.host); return view.status !== 'IN_GAME' || view.game.interaction.turn?.playerId === view.participant.id; }).toBe(true);
      const view = await readRoom(p.host); if (view.status !== 'IN_GAME') break;
      expect(view.selectedDeck).toEqual(approvedSolar); expect(view.game.ownConsecutiveTimeouts).toBe(0);
      if (view.game.phase === 'FINAL_PHASE') finals.add(view.game.round.number);
      await loadedImages(p.host, '.game-hand img');
      const button = p.host.locator(`.game-hand [data-card-id="${view.game.hand[0].id}"] .card-play-button`);
      if (view.game.round.direction === null) await p.host.getByRole('button', { name: moves % 2 === 0 ? 'ALTO' : 'BAJO', exact: true }).click();
      await button.click(); moves++; expect(moves).toBeLessThanOrEqual(58);
      await expect.poll(async () => { const after = await readRoom(p.host); return after.status !== 'IN_GAME' || after.game.interaction.turn?.id !== view.game.interaction.turn!.id; }).toBe(true);
    }
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    const finished = await readRoom(p.host) as ResultsRoomView; expect(finished.selectedDeck).toEqual(approvedSolar);
    expect(finished.result.endReason).toBe('DECK_COMPLETED'); expect(finished.result.completedNormally).toBe(true);
    expect(finished.result.standings.reduce((sum, entry) => sum + entry.score, 0)).toBe(45); expect(finals.size).toBe(3); expect(moves).toBe(15);
    expect(JSON.stringify(finished)).not.toMatch(/playValue|"hand"|drawPile|"cards"|sessionId/);
    await p.host.reload(); await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    const recovered = (await readRoom(p.host) as ResultsRoomView).result;
    expect({ ...recovered, retention: { ...recovered.retention, serverNow: finished.result.retention.serverNow } }).toEqual(finished.result);
    expect(recovered.retention.serverNow).toBeGreaterThanOrEqual(finished.result.retention.serverNow);
    await p.host.screenshot({ path: info.outputPath('B14-resultado-normal.png'), fullPage: true });
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click(); await p.host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue(''); await expect(p.host.getByRole('alert')).toHaveCount(0);
    await p.host.getByRole('button', { name: 'Cerrar sala', exact: true }).click(); await p.host.getByRole('button', { name: 'Sí, cerrar sala', exact: true }).click();
  } finally { await p.close(); }
});
