import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });

    test('E1/E3/E4/E6 crea, recupera, edita y cierra con confirmación', async ({ page }) => {
      await page.goto('/');
      const create = page.getByRole('button', { name: 'Crear sala' });
      await create.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByText('Esperando participantes')).toBeVisible();
      await expect(page.getByText('Jugador 1')).toBeVisible();
      await expect(page.getByText('Anfitrión')).toBeVisible();
      await page.screenshot({ path: `test-results/${viewport.width}-room.png`, fullPage: true });
      const code = await page.locator('.code').textContent();
      expect(code).toMatch(/^\d{6}$/);
      const roomUrl = page.url();
      await page.goto('/');
      await expect(page).toHaveURL(roomUrl);
      await page.reload();
      await expect(page.locator('.code')).toHaveText(code!);
      await page.getByLabel('Editar mi nombre').fill(' Ana María ');
      await page.getByRole('button', { name: 'Guardar' }).click();
      await expect(page.getByText('Ana María', { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByText('Ana María', { exact: true })).toBeVisible();
      await page.getByLabel('Editar mi nombre').fill(' ');
      await page.getByRole('button', { name: 'Guardar' }).click();
      await expect(page.getByRole('alert')).toContainText('nombre');
      await expect(page.getByText('Ana María', { exact: true })).toBeVisible();
      await page.getByLabel('Editar mi nombre').fill('a'.repeat(17));
      await page.getByRole('button', { name: 'Guardar' }).click();
      await expect(page.getByRole('alert')).toContainText('16 caracteres');
      await expect(page.getByText('Ana María', { exact: true })).toBeVisible();
      await page.getByLabel('Editar mi nombre').fill('a'.repeat(16));
      await page.getByRole('button', { name: 'Guardar' }).click();
      await expect(page.getByText('a'.repeat(16), { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Cerrar sala' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar' }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page.locator('.code')).toHaveText(code!);
      await page.getByRole('button', { name: 'Cerrar sala' }).click();
      await page.getByRole('button', { name: 'Sí, cerrar sala' }).click();
      await expect(page.getByRole('button', { name: 'Crear sala' })).toBeVisible();
      await page.goto('/sala/old-room');
      await expect(page.getByRole('alert')).toContainText('ya no está disponible');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test('E2/E7 copia seis cifras y muestra fallo sin anunciar éxito', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto('/');
      await page.getByRole('button', { name: 'Crear sala' }).click();
      const code = await page.locator('.code').textContent();
      await page.getByRole('button', { name: 'Copiar código' }).click();
      await expect(page.getByRole('status')).toContainText('Código copiado');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
      await page.evaluate(() => {
        Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: () => Promise.reject(new Error('denied')) });
      });
      await page.getByRole('button', { name: 'Copiar código' }).click();
      await expect(page.getByRole('status')).toContainText('cópialo manualmente');
      await page.route('**/api/rooms/*/name', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UNAVAILABLE', message: 'Inténtalo de nuevo.' } }) }));
      await page.getByLabel('Editar mi nombre').fill('Otro');
      await page.getByRole('button', { name: 'Guardar' }).click();
      await expect(page.getByRole('alert')).toContainText('Inténtalo de nuevo.');
      await expect(page.getByText('Jugador 1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}

test('E2 presenta y copia un código con cero inicial recibido del servidor', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('**/api/rooms', async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    payload.room.code = '000042';
    await route.fulfill({ response, json: payload });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear sala' }).click();
  await expect(page.locator('.code')).toHaveText('000042');
  await page.getByRole('button', { name: 'Copiar código' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('000042');
});

test('E7 al perderse el estado vuelve a portada con aviso', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear sala' }).click();
  await expect(page.getByText('Esperando participantes')).toBeVisible();
  await expect(page).toHaveURL(/\/sala\//);
  await page.route('**/api/rooms/current', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"room":null}' }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('ya no está disponible');
  await expect(page.getByRole('button', { name: 'Crear sala' })).toBeVisible();
});
