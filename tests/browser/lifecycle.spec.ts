import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';
import type { Room } from '../../server/application/room.js';
import { ControlledTime } from '../support/controlledTime.js';

async function boot(controlled = true, port = 0) {
  const { createRuntime } = await import('../../dist-server/server/composition/createApp.js');
  const { MemoryRoomRepository } = await import('../../dist-server/server/infrastructure/memoryRoomRepository.js');
  const { MemorySessions } = await import('../../dist-server/server/infrastructure/memorySessions.js');
  const removedAt = new Map<string, number>();
  class ObservedRepository extends MemoryRoomRepository {
    private readonly people = new Map<string, string[]>();
    save(room: Room) {
      const people = room.participants.map((p) => p.id);
      for (const id of this.people.get(room.id) ?? []) if (!people.includes(id)) removedAt.set(id, performance.now());
      super.save(room); this.people.set(room.id, people);
    }
  }
  const time = new ControlledTime();
  const repository = new ObservedRepository(); const sessions = new MemorySessions();
  const runtime = createRuntime({ repository, sessions, codes: () => 42,
    ...(controlled ? { clock: time, scheduler: time } : {}) });
  const dist = path.resolve(process.cwd(), 'dist');
  runtime.app.use(express.static(dist));
  runtime.app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  const server = createServer(runtime.app); const io = runtime.attachRealtime(server);
  const disconnections: { sessionId: string; at: number; reason: string }[] = [];
  let stopping = false; const shutdownConnections = new Map<string, number>();
  io.on('connection', (socket) => {
    const session = socket.data.sessionId as string;
    if (stopping) shutdownConnections.set(session, (shutdownConnections.get(session) ?? 0) + 1);
    socket.on('disconnect', (reason) => {
      disconnections.push({ sessionId: socket.data.sessionId as string, at: performance.now(), reason });
    });
  });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  return { time, repository, sessions, removedAt, disconnections, port: address.port, base: `http://127.0.0.1:${address.port}`,
    websocketCount: (sessionId: string) => [...io.sockets.sockets.values()].filter((socket) => socket.data.sessionId === sessionId && socket.conn.transport.name === 'websocket').length,
    shutdownConnections: (session: string) => shutdownConnections.get(session) ?? 0,
    dropTransports: () => { for (const client of Object.values(io.engine.clients)) client.close(); },
    stop: async (beforeTransportClose?: () => Promise<void>) => {
      stopping = true; runtime.dispose();
      if (beforeTransportClose) await beforeTransportClose(); // Barrera privada solo del caso adverso.
      // Como main: cerrar transporte y HTTP activo, también si llega una reconexión.
      // io.close solo espera server.close y puede dejar un polling en vuelo abierto.
      io.engine.close();
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      server.closeAllConnections();
      await closed;
      await new Promise<void>((resolve) => io.close(() => resolve()));
    } };
}

async function pair(browser: Browser, base: string, hostWidth = 1280) {
  const guestWidth = hostWidth === 1280 ? 390 : 1280;
  const hostContext = await browser.newContext({ viewport: { width: hostWidth, height: hostWidth === 390 ? 844 : 800 } });
  const guestContext = await browser.newContext({ viewport: { width: guestWidth, height: guestWidth === 390 ? 844 : 800 } });
  const host = await hostContext.newPage(); const guest = await guestContext.newPage();
  await Promise.all([host.goto(base), guest.goto(base)]);
  await host.getByRole('button', { name: 'Crear sala' }).click();
  await enter(guest);
  await expect(host.getByText('2 de 5 jugadores')).toBeVisible({ timeout: 2000 });
  await expect(guest.getByText('2 de 5 jugadores')).toBeVisible();
  return { host, guest, hostContext, guestContext };
}
async function enter(page: Page) {
  await page.getByLabel('Código de sala').fill('000042'); await page.getByLabel('Tu nombre').fill('Ana');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
const current = (page: Page) => page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
async function sessionId(context: BrowserContext, sessions: Awaited<ReturnType<typeof boot>>['sessions']) {
  const cookie = (await context.cookies()).find((value) => value.name === 'karta3_session')!;
  return sessions.get(cookie.value)!;
}

for (const hostWidth of [1280, 390]) {
  test(`B03 tiempo controlado: aviso, reloj del navegador, borrador, renovación y cierre a ${hostWidth}px`, async ({ browser }) => {
    const s = await boot(); const p = await pair(browser, s.base, hostWidth);
    try {
      await p.host.getByLabel('Editar mi nombre').fill('Borrador');
      await p.host.getByLabel('Editar mi nombre').focus();
      // Solo cambia la hora de calendario del navegador; su contador usa performance.now.
      await p.host.clock.setSystemTime(new Date('2040-01-01T00:00:00Z'));
      s.time.advance(29 * 60_000);
      for (const page of [p.host, p.guest]) {
        await expect(page.locator('.expiry-warning')).toContainText('en 01:00', { timeout: 2000 });
        await expect(page.getByRole('timer')).toHaveAttribute('aria-live', 'off');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
      await expect(p.host.getByLabel('Editar mi nombre')).toBeFocused();
      await expect(p.host.getByLabel('Editar mi nombre')).toHaveValue('Borrador');
      await p.guest.reload(); await expect(p.guest.locator('.expiry-warning')).toBeVisible();
      const before = await current(p.host);
      expect(before.lifecycle.expiresAt).toBe(s.time.unixOrigin + 30 * 60_000);
      await p.host.screenshot({ path: `test-results/B03-${hostWidth}-warning.png`, fullPage: true });
      await p.guest.screenshot({ path: `test-results/B03-${hostWidth === 390 ? 1280 : 390}-guest-warning.png`, fullPage: true });
      await p.guest.getByLabel('Editar mi nombre').fill('Berta');
      await p.guest.getByLabel('Editar mi nombre').press('Enter');
      for (const page of [p.host, p.guest]) await expect(page.locator('.expiry-warning')).toHaveCount(0, { timeout: 2000 });
      await expect(p.host.getByLabel('Editar mi nombre')).toHaveValue('Borrador');
      s.time.advance(29 * 60_000); await expect(p.host.locator('.expiry-warning')).toBeVisible();
      s.time.advance(60_000);
      for (const page of [p.host, p.guest]) {
        await expect(page.getByRole('alert')).toHaveText('La sala se cerró por inactividad', { timeout: 2000 });
        await expect(page.getByRole('button', { name: 'Crear sala' })).toBeVisible();
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      await p.guest.reload(); await expect(p.guest.getByRole('alert')).toHaveText('La sala se cerró por inactividad');
    } finally { await s.stop(); await p.hostContext.close(); await p.guestContext.close(); }
  });
}

test('B03 tiempo controlado: marcas, recuperación y cierre por anfitrión en móvil y escritorio', async ({ browser }) => {
  const s = await boot(); const p = await pair(browser, s.base);
  try {
    const a = await sessionId(p.hostContext, s.sessions); const b = await sessionId(p.guestContext, s.sessions);
    const original = await current(p.guest);
    await p.guest.getByLabel('Editar mi nombre').fill('Borrador');
    await p.guest.getByLabel('Editar mi nombre').focus();
    await p.guestContext.setOffline(true);
    await expect(p.guest.getByText('Conexión interrumpida. Intentando recuperarla…')).toBeVisible();
    await expect.poll(() => s.repository.findActiveBySession(b)?.participantFor(b)?.presence, { timeout: 12_000 }).toBe('RECONNECTING');
    await expect(p.host.getByText('Reconectando')).toBeVisible({ timeout: 2000 });
    await p.host.screenshot({ path: 'test-results/B03-1280-reconnecting.png', fullPage: true });
    s.time.advance(29_999);
    await p.guestContext.setOffline(false);
    await expect(p.host.getByText('Ana ha recuperado la conexión')).toBeVisible({ timeout: 10_000 });
    await expect(p.guest.getByText('Conexión interrumpida. Intentando recuperarla…')).toHaveCount(0);
    expect((await current(p.guest)).participant.id).toBe(original.participant.id);
    await expect(p.guest.getByLabel('Editar mi nombre')).toHaveValue('Borrador');
    await expect(p.guest.getByLabel('Editar mi nombre')).toBeFocused();
    await p.hostContext.setOffline(true);
    await expect.poll(() => s.repository.findActiveBySession(a)?.participantFor(a)?.presence, { timeout: 12_000 }).toBe('RECONNECTING');
    await expect(p.guest.getByText('Reconectando')).toBeVisible({ timeout: 2000 });
    await p.guest.screenshot({ path: 'test-results/B03-390-host-reconnecting.png', fullPage: true });
    expect(await p.guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    s.time.advance(30_000);
    await expect(p.guest.getByRole('alert')).toHaveText('La sala se cerró porque el anfitrión no recuperó la conexión', { timeout: 2000 });
    await p.hostContext.setOffline(false);
    await expect(p.host.getByRole('alert')).toHaveText('La sala se cerró porque el anfitrión no recuperó la conexión', { timeout: 10_000 });
  } finally { await s.stop(); await p.hostContext.close(); await p.guestContext.close(); }
});

test('B03 tiempo controlado: cero visual sin confirmación no cierra; volver tras retirada libera identidad y orden', async ({ browser }) => {
  const s = await boot(); const p = await pair(browser, s.base);
  let thirdContext: BrowserContext | undefined;
  try {
    const b = await sessionId(p.guestContext, s.sessions); const original = await current(p.guest);
    s.time.advance(29 * 60_000); await expect(p.guest.locator('.expiry-warning')).toBeVisible();
    await p.guestContext.setOffline(true);
    await expect.poll(() => s.repository.findActiveBySession(b)?.participantFor(b)?.presence, { timeout: 12_000 }).toBe('RECONNECTING');
    // Adelanta únicamente el contador del navegador desconectado; el servidor controlado no avanza.
    await p.guest.clock.fastForward(61_000);
    await expect(p.guest.getByRole('timer')).toHaveText('en 00:00');
    await expect(p.guest.getByText('2 de 5 jugadores')).toBeVisible();
    await expect(p.guest.getByText('Conexión interrumpida. Intentando recuperarla…')).toBeVisible();
    s.time.advance(30_000);
    await expect(p.host.getByText('Ana no recuperó la conexión; su plaza ha quedado libre')).toBeVisible({ timeout: 2000 });
    thirdContext = await browser.newContext(); const third = await thirdContext.newPage(); await third.goto(s.base); await enter(third);
    await expect(third.getByText('2 de 5 jugadores')).toBeVisible();
    await p.guestContext.setOffline(false); await p.guest.clock.resume();
    await expect(p.guest.getByRole('alert')).toContainText('Tu plaza se liberó', { timeout: 10_000 });
    await enter(p.guest); await expect(p.host.getByText('3 de 5 jugadores')).toBeVisible({ timeout: 2000 });
    const rejoined = await current(p.guest);
    expect(rejoined.participant.id).not.toBe(original.participant.id);
    expect(rejoined.participants.at(-2).id).toBe(rejoined.participant.id);
    await expect(p.guest.locator('.expiry-warning')).toHaveCount(0);
  } finally { await s.stop(); await thirdContext?.close(); await p.hostContext.close(); await p.guestContext.close(); }
});

test('B03-15 reiniciar el runtime pierde el motivo privado y permite crear otra sala con sesión y presencia nuevas', async ({ browser }) => {
  // Detección (12 s), recuperación y reinicio (10 s cada uno) más cierre:
  // el presupuesto global de 30 s era menor que las esperas individuales.
  test.setTimeout(60_000);
  const s = await boot(); const p = await pair(browser, s.base);
  let fresh: Awaited<ReturnType<typeof boot>> | undefined;
  // Diagnóstico B19: solo señales técnicas y booleanos de instalaciones fabricadas.
  // No conserva cookies, IDs, query strings ni cuerpos de transporte.
  const began = performance.now();
  const events: Record<string, unknown>[] = [];
  const pendingObservations: Promise<unknown>[] = [];
  const observe = (kind: string, data: Record<string, unknown> = {}) => {
    if (events.length < 300) events.push({ ms: performance.now() - began, kind, ...data });
  };
  for (const [actor, page] of [['host', p.host], ['guest', p.guest]] as const) {
    page.on('websocket', ws => {
      observe('websocket.open', { actor });
      for (const direction of ['framesent', 'framereceived'] as const) ws.on(direction, frame => {
        const payload = String(frame.payload);
        // Solo tipo Engine.IO/Socket.IO. Nunca el resto del paquete con identidad/datos.
        observe(`websocket.${direction}`, { actor, packet: /^(40|41|44)/.exec(payload)?.[0] ?? payload.slice(0, 1) });
      });
      ws.on('close', () => observe('websocket.close', { actor }));
      ws.on('socketerror', () => observe('websocket.error', { actor }));
    });
    page.on('response', response => {
      const route = new URL(response.url()).pathname;
      if (!['/api/rooms/current', '/api/usage/choice'].includes(route)) return;
      pendingObservations.push((async () => {
        const body = await response.json().catch(() => null);
        const responseHeaders = await response.allHeaders();
        observe('http.response', { actor, route, status: response.status(), setCookie: !!responseHeaders['set-cookie'],
          hasRoom: !!body?.room, hasEnded: !!body?.ended, hasLastResult: !!body?.lastResult });
      })());
    });
    page.on('requestfailed', request => observe('http.failed', { actor,
      route: new URL(request.url()).pathname.replace(/^\/(sala|resultado)\/[^/]+/, '/$1/:id') }));
  }
  try {
    const b = await sessionId(p.guestContext, s.sessions); const original = await current(p.guest);
    await p.guestContext.setOffline(true);
    await expect.poll(() => s.repository.findActiveBySession(b)?.participantFor(b)?.presence, { timeout: 12_000 }).toBe('RECONNECTING');
    s.time.advance(30_000); await p.guestContext.setOffline(false);
    await expect(p.guest.getByRole('alert')).toContainText('Tu plaza se liberó', { timeout: 10_000 });
    observe('old.stop.begin'); await s.stop(); observe('old.stop.end');
    fresh = await boot(true, s.port); observe('fresh.listening');
    await expect(p.host.getByRole('alert')).toContainText('La sala ya no está disponible', { timeout: 10_000 });
    await expect(p.host.getByRole('button', { name: 'Crear sala' })).toBeVisible();
    await p.host.getByRole('button', { name: 'Crear sala' }).click();
    await expect(p.host.getByText('1 de 5 jugadores')).toBeVisible();
    const hostSession = await sessionId(p.hostContext, fresh.sessions);
    await expect.poll(() => fresh!.repository.findActiveBySession(hostSession)?.participantFor(hostSession)?.presence).toBe('CONNECTED');
    // Tras reinicio no consta un motivo para la ruta de la sala anterior.
    await p.guest.goto(`${fresh.base}/sala/${original.id}`);
    await expect(p.guest.getByRole('alert')).toContainText('La sala ya no está disponible');
    expect(await p.guest.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).ended)).toBeUndefined();
  } finally {
    observe('finally'); await Promise.allSettled(pendingObservations);
    const serverDisconnections = (entries: typeof s.disconnections) => entries.map(({ at, reason }) => ({ ms: at - began, reason }));
    await test.info().attach('B03-15-restart-signals', { body: JSON.stringify({ events,
      oldServerDisconnections: serverDisconnections(s.disconnections), freshServerDisconnections: serverDisconnections(fresh?.disconnections ?? []) }, null, 2), contentType: 'application/json' });
    // Cerrar clientes antes del servidor evita reconexiones durante la limpieza.
    try { await Promise.all([p.hostContext.close(), p.guestContext.close()]); }
    finally { await (fresh ?? s).stop(); }
  }
});

test('B03-15 adverso: una conexión entrante durante cierre conserva reconexión y recupera la ausencia de sala', async ({ browser }) => {
  const s = await boot(); const p = await pair(browser, s.base);
  const hostBefore = await sessionId(p.hostContext, s.sessions);
  let fresh: Awaited<ReturnType<typeof boot>> | undefined;
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  let namespaceDisconnected = false;
  const http: { route: string; status: number; setCookie: boolean; hasRoom: boolean }[] = [];
  const reads: Promise<unknown>[] = [];
  const packet = (text: string) => { if (text.split('\x1e').includes('41')) namespaceDisconnected = true; };
  p.host.on('websocket', ws => ws.on('framereceived', frame => packet(String(frame.payload))));
  p.host.on('response', response => {
    const route = new URL(response.url()).pathname;
    if (route === '/socket.io/') reads.push(response.text().then(packet).catch(() => {}));
    if (['/api/rooms/current', '/api/usage/choice'].includes(route)) reads.push(response.json().then(async body => {
      const headers = await response.allHeaders();
      if (http.length < 60) http.push({ route, status: response.status(), setCookie: !!headers['set-cookie'], hasRoom: !!body?.room });
    }).catch(() => {}));
  });
  // Conserva HTTP/Socket.IO reales: una barrera de cierre deja que llegue una reconexión
  // después de dispose y antes de cerrar la escucha. No hay endpoint o acción de juego de ensayo.
  const stopping = s.stop(async () => { s.dropTransports(); await gate; });
  try {
    // Esperar al propio anfitrión, no basta que la primera reconexión sea del invitado.
    await expect.poll(() => s.shutdownConnections(hostBefore)).toBeGreaterThan(0);
    release(); await stopping; fresh = await boot(true, s.port);
    await expect(p.host.getByRole('alert')).toContainText('La sala ya no está disponible', { timeout: 10_000 });
    expect(namespaceDisconnected).toBe(false);
    await expect(p.host.getByRole('button', { name: 'Crear sala' })).toBeVisible();
    await p.host.getByRole('button', { name: 'Crear sala' }).click();
    await expect(p.host.getByText('1 de 5 jugadores')).toBeVisible();
    const hostSession = await sessionId(p.hostContext, fresh.sessions);
    await expect.poll(() => fresh!.repository.findActiveBySession(hostSession)?.participantFor(hostSession)?.presence).toBe('CONNECTED');
  } finally {
    release(); await stopping; await Promise.allSettled(reads);
    await test.info().attach('B03-15-adverse-close', { body: JSON.stringify({ actor: 'host', namespaceDisconnected,
      connectionsDuringShutdown: s.shutdownConnections(hostBefore), freshListening: !!fresh, http }, null, 2), contentType: 'application/json' });
    try { await Promise.all([p.hostContext.close(), p.guestContext.close()]); }
    finally { await (fresh ?? s).stop(); }
  }
});

test('B03 conexiones y margen reales: última pestaña, recuperación sin F5 y retirada 30 segundos después de detectar red perdida', async ({ browser }) => {
  test.setTimeout(100_000);
  const s = await boot(false); const p = await pair(browser, s.base);
  try {
    const b = await sessionId(p.guestContext, s.sessions); const original = await current(p.guest);
    const tab = await p.guestContext.newPage(); await tab.goto(s.base);
    await expect(tab.getByText('2 de 5 jugadores')).toBeVisible();
    await expect.poll(() => s.websocketCount(b)).toBe(2);
    await tab.close();
    await expect.poll(() => s.disconnections.filter((entry) => entry.sessionId === b).length).toBe(1);
    expect(s.repository.findActiveBySession(b)?.participantFor(b)?.presence).toBe('CONNECTED');
    await expect(p.host.getByText('Reconectando')).toHaveCount(0);
    const firstLoss = performance.now(); await p.guestContext.setOffline(true);
    await expect.poll(() => s.repository.findActiveBySession(b)?.participantFor(b)?.presence, { timeout: 12_000 }).toBe('RECONNECTING');
    const firstDeadline = s.repository.findActiveBySession(b)!.deadlines().find((d) => d.participantId === original.participant.id)!;
    const firstDetected = firstDeadline.at - 30_000;
    await expect(p.host.getByText('Reconectando')).toBeVisible({ timeout: 2000 });
    await p.guestContext.setOffline(false);
    await expect(p.host.getByText('Ana ha recuperado la conexión')).toBeVisible({ timeout: 10_000 });
    expect((await current(p.guest)).participant.id).toBe(original.participant.id);
    await expect(p.host.getByText('Ana ha recuperado la conexión')).toHaveCount(0, { timeout: 6500 });
    const secondLoss = performance.now(); await p.guestContext.setOffline(true);
    await expect.poll(() => s.repository.findActiveBySession(b)?.participantFor(b)?.presence, { timeout: 12_000 }).toBe('RECONNECTING');
    const deadline = s.repository.findActiveBySession(b)!.deadlines().find((d) => d.participantId === original.participant.id)!;
    const detected = deadline.at - 30_000;
    await expect(p.host.getByText('2 de 5 jugadores')).toBeVisible();
    await expect.poll(() => s.removedAt.get(original.participant.id), { timeout: 33_000, intervals: [100, 250, 500] }).toBeDefined();
    const removed = s.removedAt.get(original.participant.id)!;
    expect(removed - detected).toBeGreaterThanOrEqual(30_000);
    expect(removed - detected).toBeLessThan(32_000);
    await expect(p.host.getByText('1 de 5 jugadores')).toBeVisible({ timeout: 2000 });
    await expect(p.host.getByText('Ana no recuperó la conexión; su plaza ha quedado libre')).toBeVisible();
    await p.guestContext.setOffline(false);
    await expect(p.guest.getByRole('alert')).toContainText('Tu plaza se liberó', { timeout: 10_000 });
    const metrics = {
      kind: 'real connections and real 30s grace', recoveryDetectionMs: firstDetected - firstLoss,
      expiryDetectionMs: detected - secondLoss, graceMs: removed - detected, totalFromNetworkLossMs: removed - secondLoss,
      cleanTabReason: s.disconnections.find((entry) => entry.sessionId === b)?.reason,
      offlineReasons: s.disconnections.filter((entry) => entry.sessionId === b).slice(1).map((entry) => entry.reason)
    };
    console.log('B03 real timing:', JSON.stringify(metrics));
    await test.info().attach('real-timing', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  } finally { await s.stop(); await p.hostContext.close(); await p.guestContext.close(); }
});
