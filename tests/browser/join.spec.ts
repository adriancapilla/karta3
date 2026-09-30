import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';

async function pair(browser: Browser, hostWidth: number, guestWidth: number) {
  const hostContext = await browser.newContext({ viewport: { width: hostWidth, height: hostWidth === 390 ? 844 : 800 } });
  const guestContext = await browser.newContext({ viewport: { width: guestWidth, height: guestWidth === 390 ? 844 : 800 } });
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  await Promise.all([host.goto('/'), guest.goto('/')]);
  return { host, guest, hostContext, guestContext };
}

async function enter(page: Page, code: string, name: string) {
  await page.getByLabel('Código de sala').fill(code);
  await page.getByLabel('Tu nombre').fill(name);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test('B02 dos navegadores independientes sincronizan entrada, nombres, salida, reentrada y cierre', async ({ browser }) => {
  const { host, guest, hostContext, guestContext } = await pair(browser, 1280, 390);
  try {
    await guestContext.grantPermissions(['clipboard-read', 'clipboard-write']);
    await host.getByRole('button', { name: 'Crear sala' }).click();
    const code = (await host.locator('.code').textContent())!;
    const roomUrl = host.url();
    await enter(guest, code, 'Ana');
    await expect(guest.getByText('2 de 5 participantes')).toBeVisible({ timeout: 2000 });
    await expect(host.getByText('2 de 5 participantes')).toBeVisible({ timeout: 2000 });
    await expect(host.locator('.participant-list li strong')).toHaveText(['Ana', 'Jugador 1']);
    await expect(guest.locator('.participant-list li strong')).toHaveText(['Ana', 'Jugador 1']);
    await guest.getByRole('button', { name: 'Copiar código' }).click();
    expect(await guest.evaluate(() => navigator.clipboard.readText())).toBe(code);
    await expect(guest.locator('.participant-list li').first()).toContainText('Tú');
    await expect(host.locator('.participant-list li').last()).toContainText('Tú');
    await host.screenshot({ path: 'test-results/1280-joined.png', fullPage: true });
    await guest.screenshot({ path: 'test-results/390-joined.png', fullPage: true });
    const firstId = await guest.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room.participant.id);

    await guest.reload();
    await expect(guest.getByText('2 de 5 participantes')).toBeVisible();
    expect(await guest.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room.participant.id)).toBe(firstId);
    const guestTab = await guestContext.newPage();
    await guestTab.goto('/');
    await expect(guestTab).toHaveURL(roomUrl);
    await expect(host.getByText('2 de 5 participantes')).toBeVisible();

    await host.getByLabel('Editar mi nombre').fill('Ana');
    await host.getByRole('button', { name: 'Guardar' }).click();
    await expect(guest.locator('.participant-list li strong')).toHaveText(['Ana (1)', 'Ana (2)'], { timeout: 2000 });
    await expect(guestTab.locator('.participant-list li strong')).toHaveText(['Ana (1)', 'Ana (2)'], { timeout: 2000 });
    await expect(guest.getByLabel('Editar mi nombre')).toHaveValue('Ana');
    await host.getByLabel('Editar mi nombre').fill('Borrador');
    await guest.getByLabel('Editar mi nombre').fill('ana');
    await guest.getByRole('button', { name: 'Guardar' }).click();
    await expect(host.locator('.participant-list li strong')).toHaveText(['ana', 'Ana'], { timeout: 2000 });
    await guest.getByLabel('Editar mi nombre').fill('Berta');
    await guest.getByRole('button', { name: 'Guardar' }).click();
    await expect(host.locator('.participant-list li strong')).toHaveText(['Berta', 'Ana'], { timeout: 2000 });
    await expect(host.getByLabel('Editar mi nombre')).toHaveValue('Borrador');

    await guest.getByRole('button', { name: 'Salir de la sala' }).click();
    await guest.getByRole('button', { name: 'Cancelar' }).click();
    await expect(host.getByText('2 de 5 participantes')).toBeVisible();
    await guest.getByRole('button', { name: 'Salir de la sala' }).click();
    await guest.getByRole('button', { name: 'Sí, salir' }).click();
    await expect(guest.getByRole('button', { name: 'Crear sala' })).toBeVisible();
    await expect(guestTab.getByRole('button', { name: 'Crear sala' })).toBeVisible({ timeout: 2000 });
    await expect(guest.getByRole('alert')).toContainText('Has salido');
    await expect(host.getByText('1 de 5 participantes')).toBeVisible({ timeout: 2000 });
    await expect(host.getByText('Berta ha salido de la sala')).toBeVisible();
    await expect(host.getByText('Berta ha salido de la sala')).toBeHidden({ timeout: 6500 });
    await guest.reload();
    await expect(guest.getByRole('button', { name: 'Crear sala' })).toBeVisible();

    const thirdContext = await browser.newContext();
    try {
      const third = await thirdContext.newPage();
      await third.goto('/');
      await enter(third, code, 'Celia');
      await enter(guest, code, 'Ana');
      await expect(host.locator('.participant-list li strong')).toHaveText(['Celia', 'Ana (1)', 'Ana (2)'], { timeout: 2000 });
      expect(await guest.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room.participant.id)).not.toBe(firstId);
    } finally { await thirdContext.close(); }

    const closeButton = host.getByRole('button', { name: 'Cerrar sala' });
    await closeButton.focus();
    await host.keyboard.press('Enter');
    await expect(host.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await host.keyboard.press('Enter');
    await expect(closeButton).toBeFocused();
    await expect(guest.getByText('3 de 5 participantes')).toBeVisible();
    await host.getByRole('button', { name: 'Cerrar sala' }).click();
    await host.getByRole('button', { name: 'Sí, cerrar sala' }).click();
    await expect(guest.getByRole('alert')).toContainText('El anfitrión ha cerrado la sala');
    await expect(guest.getByRole('button', { name: 'Crear sala' })).toBeVisible();
    await enter(guest, code, 'Ana');
    await expect(guest.getByRole('alert')).toContainText('No hay una sala disponible');
    await expect(guest.getByLabel('Código de sala')).toHaveValue(code);
    await expect(guest.getByLabel('Tu nombre')).toHaveValue('Ana');
    expect(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally { await hostContext.close(); await guestContext.close(); }
});

test('B02 recorrido inverso, errores de código y capacidad con sesiones aisladas', async ({ browser }) => {
  const { host, guest, hostContext, guestContext } = await pair(browser, 390, 1280);
  const extraContexts: BrowserContext[] = [];
  try {
    await host.getByRole('button', { name: 'Crear sala' }).click();
    const code = (await host.locator('.code').textContent())!;
    await enter(guest, '12345', 'Ana');
    await expect(guest.getByRole('alert')).toContainText('seis cifras');
    await expect(guest.getByLabel('Código de sala')).toHaveValue('12345');
    await enter(guest, '12A456', 'Ana');
    await expect(guest.getByRole('alert')).toContainText('seis cifras');
    await enter(guest, '999999', 'Ana');
    await expect(guest.getByRole('alert')).toContainText('No hay una sala disponible');
    await guest.getByLabel('Código de sala').fill(code);
    await guest.getByLabel('Tu nombre').fill('Ana');
    await guest.getByLabel('Tu nombre').press('Enter');
    await expect(host.getByText('2 de 5 participantes')).toBeVisible({ timeout: 2000 });
    await host.screenshot({ path: 'test-results/390-host-joined.png', fullPage: true });
    await guest.screenshot({ path: 'test-results/1280-guest-joined.png', fullPage: true });
    for (let i = 0; i < 3; i += 1) {
      const context = await browser.newContext(); extraContexts.push(context);
      const page = await context.newPage();
      await page.goto('/');
      await enter(page, code, `Guest ${i}`);
      await expect(page.getByText(`${i + 3} de 5 participantes`)).toBeVisible();
    }
    const fullContext = await browser.newContext(); extraContexts.push(fullContext);
    const full = await fullContext.newPage();
    await full.goto('/');
    await enter(full, code, 'Extra');
    await expect(full.getByRole('alert')).toContainText('La sala está llena');
    await expect(host.getByText('Sala completa')).toBeVisible({ timeout: 2000 });
    expect(await host.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally {
    await Promise.all(extraContexts.map((context) => context.close()));
    await hostContext.close(); await guestContext.close();
  }
});

test('B02 cerrar la pestaña no libera la inscripción y un fallo de canal no anuncia entrada', async ({ browser }) => {
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    await guestContext.route('**/socket.io/**', (route) => route.abort());
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();
    await Promise.all([host.goto('/'), guest.goto('/')]);
    await host.getByRole('button', { name: 'Crear sala' }).click();
    const code = (await host.locator('.code').textContent())!;
    await enter(guest, code, 'Ana');
    await expect(guest.getByRole('alert')).toContainText('No se pudo');
    await expect(guest.getByLabel('Código de sala')).toHaveValue(code);
    await expect(host.getByText('1 de 5 participantes')).toBeVisible();
    await guestContext.unrouteAll();
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(guest.getByText('2 de 5 participantes')).toBeVisible({ timeout: 10000 });
    await expect(host.getByText('2 de 5 participantes')).toBeVisible({ timeout: 2000 });
    await guestContext.close();
    await expect(host.getByText('2 de 5 participantes')).toBeVisible();
    const current = await host.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
    expect(current.participants).toHaveLength(2);
  } finally { await hostContext.close(); await guestContext.close(); }
});

test('B02 pérdida de memoria simulada devuelve a ambas sesiones a portada sin reabrir la vista anterior', async ({ browser }) => {
  const { host, guest, hostContext, guestContext } = await pair(browser, 1280, 390);
  try {
    await host.getByRole('button', { name: 'Crear sala' }).click();
    const code = (await host.locator('.code').textContent())!;
    await enter(guest, code, 'Ana');
    await expect(host.getByText('2 de 5 participantes')).toBeVisible({ timeout: 2000 });
    for (const page of [host, guest]) {
      await page.route('**/api/rooms/current', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"room":null}' }));
      await page.route('**/socket.io/**', (route) => route.abort());
    }
    await Promise.all([host.reload(), guest.reload()]);
    for (const page of [host, guest]) {
      await expect(page.getByRole('button', { name: 'Crear sala' })).toBeVisible();
      await expect(page.getByRole('alert')).toContainText('La sala ya no está disponible');
      await expect(page.locator('.participant-list')).toHaveCount(0);
    }
  } finally { await hostContext.close(); await guestContext.close(); }
});

test('B02 código real 000042 generado por el servidor compilado conserva el cero en entrada, vista y copia', async ({ browser }) => {
  const { createRuntime } = await import('../../dist-server/server/composition/createApp.js');
  const runtime = createRuntime({ codes: () => 42 });
  const dist = path.resolve(process.cwd(), 'dist');
  runtime.app.use(express.static(dist));
  runtime.app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  const server = createServer(runtime.app);
  const io = runtime.attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  const base = `http://127.0.0.1:${address.port}`;
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  try {
    await guestContext.grantPermissions(['clipboard-read', 'clipboard-write']);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();
    await Promise.all([host.goto(base), guest.goto(base)]);
    await host.getByRole('button', { name: 'Crear sala' }).click();
    await expect(host.locator('.code')).toHaveText('000042');
    await guest.getByLabel('Código de sala').fill('000042');
    await expect(guest.getByLabel('Código de sala')).toHaveValue('000042');
    await guest.getByLabel('Tu nombre').fill('Ana');
    await guest.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(guest.locator('.code')).toHaveText('000042');
    await expect(host.getByText('2 de 5 participantes')).toBeVisible({ timeout: 2000 });
    await guest.getByRole('button', { name: 'Copiar código' }).click();
    expect(await guest.evaluate(() => navigator.clipboard.readText())).toBe('000042');
  } finally {
    await Promise.all([hostContext.close(), guestContext.close()]);
    await new Promise<void>((resolve) => io.close(() => resolve()));
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('B02 una interrupción breve del canal recupera la vista actual sin recargar ni perder plaza', async ({ browser }) => {
  const { host, guest, hostContext, guestContext } = await pair(browser, 1280, 390);
  try {
    await host.getByRole('button', { name: 'Crear sala' }).click();
    const code = (await host.locator('.code').textContent())!;
    await enter(guest, code, 'Ana');
    await expect(guest.getByText('2 de 5 participantes')).toBeVisible();
    const participantId = await guest.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room.participant.id);
    await guestContext.setOffline(true);
    await expect.poll(() => guest.evaluate(() => navigator.onLine)).toBe(false);
    await host.getByLabel('Editar mi nombre').fill('Nuevo nombre');
    await host.getByRole('button', { name: 'Guardar' }).click();
    await expect(host.locator('.participant-list li strong').last()).toHaveText('Nuevo nombre');
    await guestContext.setOffline(false);
    await expect(guest.locator('.participant-list li strong').last()).toHaveText('Nuevo nombre', { timeout: 10000 });
    expect(await guest.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room.participant.id)).toBe(participantId);
    await expect(guest.getByText('2 de 5 participantes')).toBeVisible();
  } finally { await hostContext.close(); await guestContext.close(); }
});
