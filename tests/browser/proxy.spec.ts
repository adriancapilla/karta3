import { expect, test } from '@playwright/test';
import type { InitialGameRoomView, RoomResponse } from '../../shared/contracts/room.js';
import { approvedInstalledDecks } from '../support/approvedSolar.js';

test('T05 origen único: dos sesiones, polling/WebSocket, permisos, privacidad y recuperación', async ({ browser, baseURL }) => {
  test.setTimeout(45_000);
  const base = baseURL!; const secure = new URL(base).protocol === 'https:';
  const options = { ignoreHTTPSErrors: process.env.KARTA3_TEST_INSECURE_TLS === '1' };
  const a = await browser.newContext({ ...options, viewport: { width: 390, height: 844 } });
  const b = await browser.newContext({ ...options, viewport: { width: 1280, height: 800 } });
  const stranger = await browser.newContext(options);
  try {
    const host = await a.newPage(); const guest = await b.newPage();
    const transports: string[] = []; let polling = 0;
    for (const page of [host, guest]) {
      page.on('websocket', (ws) => { if (ws.url().includes('/socket.io/')) transports.push(ws.url()); });
      page.on('request', (req) => { if (req.url().includes('/socket.io/') && req.url().includes('transport=polling')) polling++; });
    }
    const catalog = await a.request.get(`${base}/api/decks`);
    expect(catalog.status()).toBe(200); expect(catalog.headers()['cache-control']).toBe('no-store');
    expect(catalog.headers()['set-cookie']).toBeUndefined();
    expect(await catalog.json()).toEqual({ decks: approvedInstalledDecks });
    for (const path of ['/barajas/generica/baraja.json', '/barajas/generica/cartas.json', '/docs', '/server', '/api/desconocida', '/media/decks/desconocido']) {
      const response = await a.request.get(`${base}${path}`);
      expect(response.status()).toBe(404); expect(await response.text()).not.toContain('<!doctype html>');
    }
    const http = process.env.KARTA3_HTTP_BASE_URL;
    if (http) {
      const redirect = await a.request.get(`${http}/sala/consulta`, { maxRedirects: 0 });
      expect(redirect.status()).toBe(308);
      expect(redirect.headers().location).toBe(`${base}/sala/consulta`);
    }
    await host.goto(base); await guest.goto(base);
    for (const page of [host, guest]) await expect(page.getByRole('button', { name: 'Crear sala', exact: true })).toBeEnabled();
    const cookieA = (await a.cookies()).find((cookie) => cookie.name === 'karta3_session')!;
    const cookieB = (await b.cookies()).find((cookie) => cookie.name === 'karta3_session')!;
    expect(cookieA.value).not.toBe(cookieB.value);
    for (const cookie of [cookieA, cookieB]) expect(cookie).toMatchObject({ httpOnly: true, secure, sameSite: 'Strict', path: '/' });
    await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(host.getByRole('heading', { name: 'Tu sala está lista' })).toBeVisible();
    const read = async (page: typeof host) => (await page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()))) as RoomResponse;
    const waiting = (await read(host)).room;
    await guest.getByLabel('Código de sala').fill((await host.locator('.code').textContent())!);
    await guest.getByLabel('Tu nombre', { exact: true }).fill('Persona proxy');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(host.locator('.participant-list .participant')).toHaveCount(2);
    await expect.poll(() => transports.length).toBeGreaterThanOrEqual(2);
    expect(polling).toBeGreaterThan(0);
    expect(transports.every((url) => new URL(url).protocol === (secure ? 'wss:' : 'ws:'))).toBe(true);
    expect((await b.request.delete(`${base}/api/rooms/${waiting.id}`)).status()).toBe(403);
    expect((await stranger.request.get(`${base}/api/rooms/${waiting.id}`)).status()).toBe(401);
    expect((await a.request.post(`${base}/api/rooms`, { headers: { Origin: 'https://evil.example' }, data: {} })).status()).toBe(403);
    await host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'generica', contentVersion: 2 }));
    await host.getByLabel('Tiempo por turno').selectOption('60');
    await expect(host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled();
    await host.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await expect(guest.getByRole('heading', { level: 1 })).toContainText('Partida ·');
    const h = (await read(host)).room as InitialGameRoomView; const g = (await read(guest)).room as InitialGameRoomView;
    expect(h.game.id).toBe(g.game.id); expect(h.participant.id).not.toBe(g.participant.id);
    expect(h.game.hand).toHaveLength(3); expect(g.game.hand).toHaveLength(3);
    for (const [own, rival] of [[h, g], [g, h]]) {
      const json = JSON.stringify(own);
      for (const card of rival.game.hand) expect(json).not.toContain(`"id":"${card.id}"`);
      for (const key of ['sessionId', 'hostSessionId', 'seed', 'deckOrder']) expect(json).not.toContain(`"${key}"`);
    }
    await host.reload(); await guest.reload();
    for (const [page, prior] of [[host, h], [guest, g]] as const) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Partida ·');
      const recovered = (await read(page)).room as InitialGameRoomView;
      expect(recovered.game.id).toBe(prior.game.id); expect(recovered.participant.id).toBe(prior.participant.id);
      expect(recovered.game.hand).toEqual(prior.game.hand);
      const timing = prior.game.interaction.turn!.timing!;
      expect(recovered.game.interaction.turn!.id).toBe(prior.game.interaction.turn!.id);
      expect(recovered.game.interaction.turn!.timing).toMatchObject({ startedAt: timing.startedAt, endsAt: timing.endsAt });
      expect(recovered.game.interaction.turn!.timing!.serverNow).toBeGreaterThanOrEqual(timing.serverNow);
    }
    const tab = await a.newPage(); await tab.goto(base);
    await expect(tab.getByRole('heading', { level: 1 })).toContainText('Partida ·');
    expect(((await read(tab)).room as InitialGameRoomView).participant.id).toBe(h.participant.id);
  } finally { await a.close(); await b.close(); await stranger.close(); }
});
