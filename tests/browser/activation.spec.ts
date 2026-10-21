import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { io, type Socket } from 'socket.io-client';
import type { ConfigureRoomRequest, RoomView, SocketAck } from '../../shared/contracts/room.js';
import { approvedGeneric } from '../support/approvedGeneric.js';

const current = (page: Page): Promise<RoomView> => page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
async function authenticatedSocket(base: string, context: BrowserContext) {
  const cookie = (await context.cookies()).find((entry) => entry.name === 'karta3_session')!;
  const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: `${cookie.name}=${cookie.value}`, Origin: base } });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(new Error('Conexión de prueba agotada')); }, 5000);
    socket.once('connect', () => { clearTimeout(timer); resolve(); });
    socket.once('connect_error', (error) => { clearTimeout(timer); socket.close(); reject(error); });
  });
  return socket;
}
const configure = (socket: Socket, payload: ConfigureRoomRequest): Promise<SocketAck<{ room: RoomView }>> => new Promise((resolve, reject) => {
  socket.timeout(3000).emit('room:configure', payload, (error: Error | null, ack: SocketAck<{ room: RoomView }>) => error ? reject(error) : resolve(ack));
});

for (const width of [390, 1280]) test(`AGV2-04–08 genérica 2 normal: dos sesiones, selección, permisos, recarga y quitar a ${width}px`, async ({ browser, baseURL }) => {
  // Instancia normal de main, sin fixtures, sustitutos de reloj, rutas HTTP simuladas ni servidor de prueba.
  const base = baseURL!;
  const hc = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 800 } });
  const guestWidth = width === 390 ? 1280 : 390;
  const gc = await browser.newContext({ viewport: { width: guestWidth, height: guestWidth === 390 ? 844 : 800 } });
  const host = await hc.newPage(); const guest = await gc.newPage();
  let browserConfigurations = 0;
  for (const page of [host, guest]) {
    page.on('websocket', (socket) => socket.on('framesent', (frame) => { if (String(frame.payload).includes('"room:configure"')) browserConfigurations++; }));
    page.on('request', (request) => { if (request.method() === 'POST' && request.url().includes('/socket.io/') && request.postData()?.includes('"room:configure"')) browserConfigurations++; });
  }
  let hs: Socket | undefined; let gs: Socket | undefined;
  try {
    await Promise.all([host.goto(base), guest.goto(base)]);
    await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
    await expect(host.getByRole('option', { name: 'KARTA3 — Baraja genérica · v4' })).toHaveCount(1);
    await expect(host.getByLabel('Baraja', { exact: true })).toHaveValue('');
    expect((await current(host)).settings).toEqual({ deckId: null, deckContentVersion: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5, attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false });
    expect(browserConfigurations).toBe(0);
    const code = (await host.locator('.code').textContent())!; expect(code).toMatch(/^\d{6}$/);
    await guest.getByLabel('Código de sala').fill(code); await guest.getByLabel('Tu nombre', { exact: true }).fill('Ana');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
    for (const page of [host, guest]) {
      await expect(page.getByText('2 de 5 jugadores')).toBeVisible({ timeout: 2000 });
      await expect(page.locator('.code')).toHaveText(code);
      await expect(page.locator('.no-deck')).toHaveText('Sin baraja seleccionada');
      await expect(page.locator('.participant-list li strong')).toHaveText(['Ana', 'Jugador 1']);
    }
    expect((await hc.cookies()).find((c) => c.name === 'karta3_session')!.value).not.toBe((await gc.cookies()).find((c) => c.name === 'karta3_session')!.value);
    await host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'generica', contentVersion: 4 }));
    for (const page of [host, guest]) {
      await expect(page.getByRole('heading', { name: 'KARTA3 — Baraja genérica · v4' })).toBeVisible({ timeout: 2000 });
      await expect(page.locator('.deck-card')).toContainText(approvedGeneric.description);
      await expect(page.locator('.neutral-card')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('.deck-card img')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await expect(guest.getByRole('combobox', { name: 'Apariencia', exact: true })).toBeEnabled();
    await expect(guest.getByRole('combobox', { name: /^(?!Apariencia$)/ })).toHaveCount(0);
    const acceptedHost = await current(host); const acceptedGuest = await current(guest);
    expect(acceptedHost.selectedDeck).toEqual(approvedGeneric); expect(acceptedGuest.selectedDeck).toEqual(approvedGeneric);
    expect(acceptedHost.settings).toMatchObject({ deckId: 'generica', deckContentVersion: 4 });
    expect(acceptedHost.participant.role).toBe('HOST'); expect(acceptedGuest.participant.role).toBe('GUEST');
    expect(JSON.stringify(acceptedHost)).not.toMatch(/"cards"\s*:|"playValue"\s*:|"sessionId"\s*:|"publication"\s*:|"imageRef"\s*:|ASSETS|baraja\.json/);
    await host.screenshot({ path: `test-results/AGV2-${width}-host.png`, fullPage: true });
    await guest.screenshot({ path: `test-results/AGV2-${guestWidth}-guest.png`, fullPage: true });
    expect(browserConfigurations).toBe(1);
    await Promise.all([host.reload(), guest.reload()]);
    for (const [page, accepted] of [[host, acceptedHost], [guest, acceptedGuest]] as const) {
      await expect(page.getByRole('heading', { name: 'KARTA3 — Baraja genérica · v4' })).toBeVisible();
      await expect(page.locator('.participant-list li strong')).toHaveText(['Ana', 'Jugador 1']);
      await expect.poll(async () => (await current(page)).participants.every((p) => p.presence === 'CONNECTED')).toBe(true);
      const recovered = await current(page);
      expect(recovered.participant.id).toBe(accepted.participant.id); expect(recovered.participant.role).toBe(accepted.participant.role);
      expect(recovered.participants.map((p) => p.id)).toEqual(accepted.participants.map((p) => p.id));
      expect(recovered.settings).toEqual(accepted.settings); expect(recovered.selectedDeck).toEqual(approvedGeneric);
      expect(recovered.lifecycle.expiresAt).toBe(accepted.lifecycle.expiresAt);
    }
    expect(browserConfigurations).toBe(1); // Observación de envíos reales: recargar no vuelve a configurar.
    await expect(guest.getByRole('combobox', { name: 'Apariencia', exact: true })).toBeEnabled();
    await expect(guest.getByRole('combobox', { name: /^(?!Apariencia$)/ })).toHaveCount(0);
    hs = await authenticatedSocket(base, hc); gs = await authenticatedSocket(base, gc);
    const beforeErrors = await current(host);
    const v2: ConfigureRoomRequest = { requestId: 'normal-repeat', roomId: acceptedHost.id, change: { field: 'deck', value: { id: 'generica', contentVersion: 4 } } };
    expect(await configure(gs, { ...v2, requestId: 'guest-forbidden' })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(await configure(hs, { ...v2, requestId: 'old-version', change: { field: 'deck', value: { id: 'generica', contentVersion: 1 } } })).toMatchObject({ ok: false, error: { code: 'DECK_VERSION_MISMATCH' } });
    expect(await configure(hs, v2)).toMatchObject({ ok: true, room: { selectedDeck: approvedGeneric } });
    expect(await configure(hs, v2)).toMatchObject({ ok: true, room: { selectedDeck: approvedGeneric } });
    const unchanged = await current(host);
    expect(unchanged.revision).toBe(beforeErrors.revision); expect(unchanged.lifecycle.expiresAt).toBe(beforeErrors.lifecycle.expiresAt);
    expect(unchanged.settings).toEqual(beforeErrors.settings);
    await host.getByLabel('Baraja', { exact: true }).selectOption('');
    for (const page of [host, guest]) await expect(page.locator('.no-deck')).toHaveText('Sin baraja seleccionada', { timeout: 2000 });
    const removed = await current(host); expect(removed.selectedDeck).toBeNull();
    expect(removed.settings).toMatchObject({ deckId: null, deckContentVersion: null });
    expect(await configure(hs, v2)).toMatchObject({ ok: true, room: { selectedDeck: null } }); // Replay antiguo no restaura v2.
    expect(await configure(hs, { requestId: 'equal-null', roomId: removed.id, change: { field: 'deck', value: null } })).toMatchObject({ ok: true, room: { selectedDeck: null } });
    const stillRemoved = await current(guest);
    expect(stillRemoved.revision).toBe(removed.revision); expect(stillRemoved.lifecycle.expiresAt).toBe(removed.lifecycle.expiresAt);
    await guest.getByRole('button', { name: 'Salir de la sala' }).click(); await guest.getByRole('button', { name: 'Sí, salir' }).click();
    await expect(host.getByText('1 de 5 jugadores')).toBeVisible({ timeout: 2000 });
    await host.getByRole('button', { name: 'Cerrar sala' }).click(); await host.getByRole('button', { name: 'Sí, cerrar sala' }).click();
    await expect(host.getByRole('button', { name: 'Crear sala' })).toBeVisible();
    await expect(guest.getByRole('button', { name: 'Crear sala' })).toBeVisible();
  } finally { hs?.close(); gs?.close(); await Promise.all([hc.close(), gc.close()]); }
});
