import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { io } from 'socket.io-client';
import type { InitialGameRoomView, ResultsRoomView, SocketAck, RoomView } from '../../shared/contracts/room.js';
import { approvedCreatures } from '../support/approvedCreatures.js';
import { approvedInstalledDecks } from '../support/approvedSolar.js';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, humanPlay, readRoom, readGame } from '../support/manualBrowserCases.js';
import { assertGamePrivacy } from '../support/gamePrivacy.js';

const evidence = 'playwright-report/b16/capturas';
const metadata = JSON.parse(await fs.readFile('barajas/criaturas-magicas/baraja.json', 'utf8')) as { instructions: string };
const collection = JSON.parse(await fs.readFile('barajas/criaturas-magicas/cartas.json', 'utf8')) as { cards: { id: string; roundAttribute: string }[] };
const choose = (id: string, contentVersion: number) => JSON.stringify({ id, contentVersion });
async function socket(context: BrowserContext, base: string) {
  const cookie = (await context.cookies()).find(c => c.name === 'karta3_session')!;
  const client = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: `${cookie.name}=${cookie.value}`, Origin: base } });
  await new Promise<void>((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject); });
  return client;
}
async function images(page: Page, selector: string) {
  await expect.poll(() => page.locator(selector).evaluateAll(elements => elements.length > 0 && elements.every(e => e instanceof HTMLImageElement && e.complete && e.naturalWidth === 640 && e.naturalHeight === 480))).toBe(true);
}
function observe(page: Page, rooms: InitialGameRoomView[]) {
  page.on('websocket', transport => transport.on('framereceived', ({ payload }) => {
    const text = String(payload); if (!/^4[23]/.test(text) || !text.includes('[')) return;
    const values = JSON.parse(text.slice(text.indexOf('['))) as { room?: RoomView }[];
    for (const value of values) if (value?.room?.status === 'IN_GAME') rooms.push(value.room);
  }));
}
async function record(page: Page, name: string) {
  await page.evaluate(() => scrollTo(0, 0));
  const data = await page.evaluate(() => {
    const rect = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, right: r.right, bottom: r.bottom + scrollY }; };
    const composition = document.querySelector<HTMLElement>('.game-composition')!;
    const rows = [...document.querySelectorAll('.game-card tbody tr, dialog tbody tr')].filter(e => e.getBoundingClientRect().width > 0).map(row => {
      const th = row.querySelector('th')!; const td = row.querySelector('td')!;
      const range = document.createRange(); range.selectNodeContents(th);
      const spans = [...range.getClientRects()].map(r => ({ x: r.x, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY, height: r.height }));
      return { text: th.textContent, value: td.textContent, active: row.classList.contains('active-attribute'), box: rect(row), label: rect(th), data: rect(td), fragments: spans,
        font: getComputedStyle(th).fontSize, family: getComputedStyle(th).fontFamily, overflow: getComputedStyle(th).overflow, textOverflow: getComputedStyle(th).textOverflow, client: th.clientWidth, scroll: th.scrollWidth };
    });
    return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scale: visualViewport?.scale }, useful: Number(composition.dataset.usefulWidth), layout: composition.dataset.layout,
      pageWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight, residual: Math.max(0, document.documentElement.scrollHeight - innerHeight), rows,
      cards: [...document.querySelectorAll('.game-card')].filter(e => e.getBoundingClientRect().width > 0).map(e => ({ box: rect(e), name: e.querySelector('h3')!.textContent, nameFont: getComputedStyle(e.querySelector('h3')!).fontSize, details: rect(e.querySelector('.card-details-button')!) })),
      panels: Object.fromEntries(['people', 'initial-state', 'plays', 'hand'].map(key => { const e = document.querySelector('.game-' + key); return [key, e ? rect(e) : null]; })) };
  });
  const full = { ...data, date: new Date().toISOString(), browser: page.context().browser()!.version(), clock: 'Controlado; HTTP/Socket.IO reales, permutación legal sustituida' };
  await fs.mkdir(evidence, { recursive: true }); await fs.writeFile(`${evidence}/${name}.json`, JSON.stringify(full, null, 2) + '\n');
  await page.screenshot({ path: `${evidence}/${name}-full.png`, fullPage: true });
  const resistance = data.rows.filter(row => row.text?.includes('Resistencia'));
  expect(resistance.length).toBeGreaterThan(0);
  for (const row of resistance) {
    expect(row.text).toContain('Resistencia'); expect(row.font).toBe('14px'); expect(row.textOverflow).not.toBe('ellipsis'); expect(row.overflow).not.toBe('hidden'); expect(row.scroll).toBeLessThanOrEqual(row.client + 1);
    for (const fragment of row.fragments) { expect(fragment.x).toBeGreaterThanOrEqual(row.label.x - 1); expect(fragment.right).toBeLessThanOrEqual(row.label.right + 1); expect(fragment.top).toBeGreaterThanOrEqual(row.label.y - 1); expect(fragment.bottom).toBeLessThanOrEqual(row.label.bottom + 1); }
  }
  expect(data.pageWidth).toBeLessThanOrEqual(data.viewport.width);
  return full;
}

test('B16 instalación normal: tres sin default, dos sesiones/pestañas, versión exacta, permisos, 59 recursos y seis JSON privados', async ({ browser, baseURL }) => {
  const contexts = await Promise.all([browser.newContext({ viewport: { width: 390, height: 844 } }), browser.newContext(), browser.newContext()]);
  const pages = await Promise.all(contexts.map(c => c.newPage())); const [host, guest, other] = pages;
  const clients: Awaited<ReturnType<typeof socket>>[] = [];
  try {
    const catalog = await contexts[0].request.get(baseURL + '/api/decks'); expect(await catalog.json()).toEqual({ decks: approvedInstalledDecks }); expect(catalog.headers()['cache-control']).toBe('no-store'); expect(catalog.headers()['set-cookie']).toBeUndefined(); expect(await contexts[0].cookies()).toEqual([]);
    await Promise.all(pages.map(p => p.goto(baseURL!))); await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    expect((await readRoom(host)).selectedDeck).toBeNull(); expect((await readRoom(host)).settings.deckId).toBeNull();
    await guest.getByLabel('Código de sala').fill((await host.locator('.code').textContent())!); await guest.getByLabel('Tu nombre', { exact: true }).fill('Lectura invitada'); await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(guest.getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible(); await other.getByRole('button', { name: 'Crear sala', exact: true }).click();
    const tab = await contexts[0].newPage(); await tab.goto(baseURL!); await expect(tab.getByLabel('Baraja', { exact: true })).toHaveValue('');
    await host.getByLabel('Valor del Atributo').selectOption('DISPLAY_VALUE'); await tab.getByLabel('Optimizar para móvil').check();
    for (const deck of [approvedCreatures, approvedInstalledDecks[1], approvedInstalledDecks[2], approvedCreatures]) {
      await host.getByLabel('Baraja', { exact: true }).selectOption(choose(deck.id, deck.contentVersion));
      for (const p of [host, guest, tab]) { await expect(p.locator('.deck-card h3')).toHaveText(`${deck.name} · v${deck.contentVersion}`); expect((await readRoom(p)).selectedDeck).toEqual(deck); }
    }
    await images(host, '.deck-card img');
    for (const p of [host, guest]) { await p.getByRole('button', { name: 'Información de la baraja', exact: true }).click(); expect(await p.getByRole('dialog').locator('.literal-text').last().textContent()).toBe(metadata.instructions); await p.getByRole('button', { name: 'Cerrar consulta', exact: true }).press('Escape'); }
    const original = await readRoom(host);
    for (const [index, c] of contexts.entries()) {
      const client = await socket(c, baseURL!); clients.push(client);
      const ack = await new Promise<SocketAck<{ room: RoomView }>>(resolve => client.emit('room:configure', { requestId: `b16-permission-${index}`, roomId: original.id, change: { field: 'deck', value: { id: 'criaturas-magicas', contentVersion: index === 0 ? 4 : 2 } } }, resolve));
      expect(ack.ok).toBe(false); if (!ack.ok) expect(ack.error.code).toBe(index === 0 ? 'DECK_VERSION_MISMATCH' : 'FORBIDDEN');
    }
    expect((await readRoom(host)).selectedDeck).toEqual(approvedCreatures); await expect(guest.getByRole('combobox')).toHaveCount(0);
    const identities = await Promise.all([host, guest].map(readRoom)); await Promise.all([host.reload(), guest.reload()]);
    for (const [index, p] of [host, guest].entries()) { await expect(p.locator('.deck-card h3')).toHaveText('Criaturas Mágicas · v2'); const room = await readRoom(p); expect(room.participant.id).toBe(identities[index].participant.id); expect(room.settings).toMatchObject({ attributeValueMode: 'DISPLAY_VALUE', optimizeForMobile: true, deckContentVersion: 2 }); expect(JSON.stringify(room)).not.toMatch(/"cards"|"playValue"|"imageRef"|sessionId|drawPile|permutation/); }
    const manifest = JSON.parse(await fs.readFile('docs/sdd/evidencias/B16/incorporacion.json', 'utf8')) as { files: { file: string; sourceSHA256: string }[] };
    const resources = manifest.files.filter(f => f.file.startsWith('imagenes/')); expect(resources).toHaveLength(59);
    await Promise.all(resources.map(async e => { const response = await contexts[0].request.get(baseURL + '/media/decks/criaturas-magicas/v2/' + e.file); expect(response.status()).toBe(200); expect(response.headers()['content-type']).toContain('image/webp'); expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(e.sourceSHA256); }));
    for (const deck of approvedInstalledDecks) for (const file of ['baraja.json', 'cartas.json']) for (const url of [`/barajas/${deck.id}/${file}`, `/media/decks/${deck.id}/v${deck.contentVersion}/${file}`]) { const r = await contexts[0].request.get(baseURL + url); expect(r.status()).toBe(404); expect(await r.text()).not.toContain('<!doctype html>'); }
    for (const url of ['/media/decks/criaturas-magicas/v4/imagenes/portada.webp', '/media/decks/criaturas-magicas/v2/%2e%2e%2fcartas.json', '/api/no-existe']) { const r = await contexts[0].request.get(baseURL + url); expect(r.status()).toBe(404); expect(await r.text()).not.toContain('<!doctype html>'); }
    await host.getByLabel('Baraja', { exact: true }).selectOption(''); await expect(guest.locator('.no-deck')).toBeVisible(); expect((await readRoom(host)).settings).toMatchObject({ attributeValueMode: 'DISPLAY_VALUE', optimizeForMobile: true });
    await host.getByLabel('Baraja', { exact: true }).selectOption(choose('criaturas-magicas', 2));
  } finally { clients.forEach(c => c.disconnect()); await Promise.all(contexts.map(c => c.close())); }
});

for (const mode of ['PLAY_VALUE', 'DISPLAY_VALUE'] as const) for (const profile of [{ width: 1920, height: 1080, optimize: true }, { width: 390, height: 844, optimize: true }, { width: 360, height: 800, optimize: true }, { width: 390, height: 844, optimize: false }]) {
  test(`B16 Resistencia completa ${mode} ${profile.width} optimizar=${profile.optimize}: activa/no activa, indicadora/mano/Mesa/Detalles`, async ({ browser }) => {
    test.setTimeout(60_000);
    for (const active of [false, true]) {
      const server = await configurationBrowserServer(true, true, undefined, { creatures: true });
      const indicatorId = collection.cards.find(c => c.roundAttribute === (active ? 'atributo3' : 'atributo1'))!.id;
      server.permutation(ids => { const rest = ids.filter(id => id !== indicatorId); return [...rest.slice(0, 6), indicatorId, ...rest.slice(6)]; });
      const p = await manualTable(browser, server.base, { deckId: 'criaturas-magicas', version: 2, valueMode: mode, optimize: profile.optimize, width: profile.width, height: profile.height, turn: 60, review: 5 });
      const traffic = p.pages.map(() => [] as InitialGameRoomView[]); p.pages.forEach((page, i) => observe(page, traffic[i]));
      const name = `${mode}-${profile.width}-${profile.optimize ? 'on' : 'off'}-${active ? 'activa' : 'no-activa'}`;
      try {
        // El listener de Playwright observa nuevos sockets: recargar tras instalarlo.
        await Promise.all(p.pages.map(page => page.reload()));
        for (const page of p.pages) await expect(page.getByRole('heading', { level: 1 })).toContainText('Criaturas Mágicas');
        const before = await Promise.all(p.pages.map(readGame)); const timing = before[0].game.interaction.turn!.timing;
        expect(before[0].game.round.activeAttributeId).toBe(active ? 'atributo3' : 'atributo1');
        for (const page of p.pages) { const v = await readGame(page); expect(v.settings.attributeValueMode).toBe(mode); expect(v.deckInformation).toEqual({ id: 'criaturas-magicas', contentVersion: 2, instructions: metadata.instructions }); await images(page, '.game-hand img'); for (const card of v.game.hand) { expect(Object.values(card.values).every(value => value.unit === '' && value.displayValue === String(value.playValue))).toBe(true); const element = page.locator(`[data-card-id="${card.id}"]`); await expect(element.locator('thead th')).toHaveText(['Atributo', mode === 'PLAY_VALUE' ? '1-58' : 'Dato']); await expect(element.locator('tbody td')).toHaveText(Object.values(card.values).map(value => value.displayValue)); } }
        const first = p.host.locator('.game-hand .card-details-button').first(); await first.focus(); await first.press('Enter');
        const card = before[0].game.hand[0]; const dialog = p.host.getByRole('dialog'); await expect(dialog.locator('thead th')).toHaveText(['Atributo', 'Dato']); await expect(dialog).toContainText(card.characteristic); await expect(dialog).toContainText(card.note); await expect(dialog.locator('h3')).toHaveCount(0); await expect(dialog.getByText('J', { exact: true })).toHaveCount(0);
        await record(p.host, name + '-detalles'); await dialog.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape'); await expect(first).toBeFocused();
        const compact = profile.optimize && profile.width < 1400;
        if (compact) { await p.host.getByRole('button', { name: `Carta indicadora: ${before[0].game.round.indicator.name}`, exact: true }).click(); await record(p.host, name + '-indicadora'); await p.host.getByRole('button', { name: 'Cerrar consulta', exact: true }).press('Escape'); }
        else await images(p.host, '.game-indicator img');
        const surface = p.pages[1].locator('.game-hand .card-play-surface').first(); const bounds = await surface.boundingBox(); await p.pages[1].mouse.move(bounds!.x + 100, bounds!.y + 10); await p.pages[1].mouse.down(); await p.pages[1].mouse.move(bounds!.x + 15, bounds!.y + 10, { steps: 6 }); await p.pages[1].mouse.up(); expect(server.gameRequests).toHaveLength(0);
        expect((await readGame(p.host)).game.interaction.turn!.timing).toEqual(timing);
        await humanPlay(p, true, active ? 'HIGH' : 'LOW'); const after = await readGame(p.host); expect(after.game.round.plays).toHaveLength(1); expect(server.gameRequests.filter(r => r.event === 'game:play')).toHaveLength(1);
        const measurement = await record(p.host, name + '-mesa'); expect(measurement.layout).toBe(compact ? 'compact' : 'normal');
        if (compact) { expect(measurement.panels.people!.bottom).toBeLessThanOrEqual(measurement.panels['initial-state']!.y); expect(measurement.panels['initial-state']!.bottom).toBeLessThanOrEqual(measurement.panels.plays!.y); expect(measurement.panels.plays!.bottom).toBeLessThanOrEqual(measurement.panels.hand!.y); }
        for (const [index, messages] of traffic.entries()) { expect(messages.length).toBeGreaterThan(0); for (const v of [await readGame(p.pages[index]), ...messages]) { const visible = new Set(v.game.round.plays.map(play => play.card.id)); const own = before[index].game.hand.map(c => c.id).filter(id => !visible.has(id)); const rival = before[1-index].game.hand.map(c => c.id).filter(id => !visible.has(id)); assertGamePrivacy(v, own, rival, (condition, reason) => expect(condition, reason).toBe(true)); } }
      } finally { await p.close(); await server.stop(); }
    }
  });
}

test('B16 observador/cinco, quinta por teclado, revisión, scrolls independientes y resize conservan foco y plazo', async ({ browser }) => {
  test.setTimeout(60_000);
  const server = await configurationBrowserServer(true, true, undefined, { creatures: true });
  const p = await manualTable(browser, server.base, { count: 5, observer: true, deckId: 'criaturas-magicas', version: 2, optimize: true, valueMode: 'DISPLAY_VALUE', width: 390, turn: 60, review: 5 });
  try {
    const initial = await readGame(p.host); expect(initial.game.hand).toEqual([]); await expect(p.host.locator('.game-hand')).toHaveCount(0); await expect(p.host.getByRole('button', { name: 'Cancelar partida', exact: true })).toBeVisible();
    const observed: InitialGameRoomView[] = []; observe(p.host, observed);
    await p.host.reload(); await expect(p.host.getByRole('heading', { level: 1 })).toContainText('Criaturas Mágicas');
    for (let i = 0; i < 5; i++) await humanPlay(p, i % 2 === 0, 'HIGH');
    await expect(p.host.locator('.played-row .game-card')).toHaveCount(5); expect((await readGame(p.host)).game.interaction.stage).toBe('ROUND_REVIEW');
    const fifth = p.host.locator('.played-row .card-details-button').last(); await fifth.focus(); await fifth.press('Space'); await record(p.host, 'observador-quinta-revision-detalles'); await p.host.getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape'); await expect(fifth).toBeFocused();
    const own = p.pages[1]; const before = await readGame(own); const hand = own.locator('.hand-row'); const played = own.locator('.played-row');
    await played.evaluate(e => { e.scrollLeft = e.scrollWidth; }); const playScroll = await played.evaluate(e => e.scrollLeft); await hand.evaluate(e => { e.scrollLeft = e.scrollWidth; }); expect(await played.evaluate(e => e.scrollLeft)).toBe(playScroll);
    await record(own, 'jugador-quinta-revision'); await record(p.host, 'observador-quinta-revision');
    for (const target of [1367, 1368, 358]) { const extra = await own.evaluate(() => innerWidth - document.body.clientWidth); await own.setViewportSize({ width: target + 32 + extra, height: 844 }); await expect.poll(() => own.locator('.game-composition').getAttribute('data-useful-width')).toBe(String(target)); expect((await readGame(own)).game.id).toBe(before.game.id); await record(own, 'quinta-frontera-' + target); }
    expect(server.gameRequests.filter(r => r.event === 'game:play')).toHaveLength(5); await expect(own.locator('.game-hand .card-play-button').first()).toBeDisabled();
    for (const v of observed) assertGamePrivacy(v, [], [], (condition, reason) => expect(condition, reason).toBe(true));
    await p.host.reload(); await expect(p.host.getByRole('heading', { level: 1 })).toContainText('Criaturas Mágicas'); expect((await readGame(p.host)).game.id).toBe(initial.game.id);
    server.time.advance(5000); const turn = (await readGame(p.pages[1])).game.interaction.turn!; const actor = p.actors.get(turn.playerId)!;
    const button = actor.locator('.game-hand .card-play-button').first(); await button.focus(); await button.press('Enter'); const partial = await readGame(actor); expect(partial.game.round.plays).toEqual([]);
    await actor.getByRole('button', { name: 'BAJO', exact: true }).click(); expect(server.gameRequests.filter(r => r.event === 'game:play')).toHaveLength(6);
  } finally { await p.close(); await server.stop(); }
});

test('B16 partida completa normal: humano y EASY/HARD, tres rondas finales, resultados/F5/otra sala', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const p = await manualTable(browser, baseURL!, { count: 1, bots: ['EASY', 'HARD'], deckId: 'criaturas-magicas', version: 2, valueMode: 'DISPLAY_VALUE', optimize: true, width: 390, review: 0, turn: 60 });
  const tab = await p.contexts[0].newPage(); const finals = new Set<number>(); let moves = 0;
  try {
    await tab.goto(baseURL!); await expect(tab.getByRole('heading', { level: 1 })).toContainText('Criaturas Mágicas');
    while ((await readRoom(p.host)).status === 'IN_GAME') {
      await expect.poll(async () => { const v = await readRoom(p.host); return v.status !== 'IN_GAME' || v.game.interaction.turn?.playerId === v.participant.id; }).toBe(true);
      const v = await readRoom(p.host); if (v.status !== 'IN_GAME') break;
      expect(v.selectedDeck).toEqual(approvedCreatures); expect(v.game.ownConsecutiveTimeouts).toBe(0); if (v.game.phase === 'FINAL_PHASE') finals.add(v.game.round.number);
      await images(p.host, '.game-hand img'); const button = p.host.locator(`.game-hand [data-card-id="${v.game.hand[0].id}"] .card-play-button`);
      if (v.game.round.direction === null) await p.host.getByRole('button', { name: moves % 2 === 0 ? 'ALTO' : 'BAJO', exact: true }).click(); await button.click(); moves++;
      expect(moves).toBeLessThanOrEqual(58); await expect.poll(async () => { const after = await readRoom(p.host); return after.status !== 'IN_GAME' || after.game.interaction.turn?.id !== v.game.interaction.turn!.id; }).toBe(true);
    }
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible(); const result = await readRoom(p.host) as ResultsRoomView;
    expect(result.selectedDeck).toEqual(approvedCreatures); expect(result.result.endReason).toBe('DECK_COMPLETED'); expect(result.result.completedNormally).toBe(true); expect(result.result.standings.reduce((sum, e) => sum + e.score, 0)).toBe(45); expect(finals.size).toBe(3); expect(moves).toBe(15); expect(JSON.stringify(result)).not.toMatch(/"hand"|"cards"|playValue|drawPile|sessionId/);
    await fs.mkdir(evidence, { recursive: true }); await p.host.screenshot({ path: evidence + '/resultado-normal.png', fullPage: true }); await fs.writeFile('playwright-report/b16/partida-normal.json', JSON.stringify({ date: new Date().toISOString(), adapters: 'SystemClock/TimerScheduler/CryptoCardPermutation', selectedDeck: result.selectedDeck, moves, finals: [...finals], result: result.result }, null, 2));
    await Promise.all([p.host.reload(), tab.reload()]); for (const page of [p.host, tab]) { await expect(page.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible(); const recovered = await readRoom(page) as ResultsRoomView; expect({ ...recovered.result, retention: { ...recovered.result.retention, serverNow: result.result.retention.serverNow } }).toEqual(result.result); }
    await p.host.getByRole('button', { name: 'Volver al inicio', exact: true }).click(); await expect(tab.getByRole('button', { name: 'Crear sala', exact: true })).toBeVisible(); await p.host.getByRole('button', { name: 'Crear sala', exact: true }).click(); await expect(p.host.getByLabel('Baraja', { exact: true })).toHaveValue(''); expect((await readRoom(p.host)).settings).toMatchObject({ attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false }); await expect(p.host.getByRole('alert')).toHaveCount(0);
  } finally { await p.close(); }
});
