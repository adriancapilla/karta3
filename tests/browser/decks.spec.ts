import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { deckFixture, realImage, writeFixture } from '../support/deckFixtures.js';
import { compiledInstallation, removeTestInstallation, startCompiledDeckServer } from '../support/compiledDeckServer.js';
import { approvedInstalledDecks } from '../support/approvedSolar.js';

for (const width of [390, 1280]) {
  test.describe(`B04 catálogo ${width}px`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 800 } });
    test('AGV2-02/03/08 ejecución normal genérica 2; GET no crea cookie y sala inicialmente sin selección', async ({ page, context }) => {
      const response = await page.goto('/api/decks');
      expect(response?.status()).toBe(200); expect(response?.headers()['cache-control']).toBe('no-store');
      expect(await response?.json()).toEqual({ decks: approvedInstalledDecks }); expect(await context.cookies()).toEqual([]);
      await page.goto('/'); await page.getByRole('button', { name: 'Crear sala' }).click();
      await expect(page.getByText('1 de 5 jugadores')).toBeVisible();
      await expect(page.getByRole('option', { name: 'KARTA3 — Baraja genérica · v2' })).toHaveCount(1);
      await expect(page.locator('.no-deck')).toHaveText('Sin baraja seleccionada');
      await expect(page.getByLabel('Baraja', { exact: true })).toHaveValue('');
      await expect(page.getByLabel('El anfitrión juega')).toBeChecked();
      await expect(page.getByLabel('Tiempo por turno')).toHaveValue('30');
      await expect(page.getByLabel('Forzar desempate')).not.toBeChecked();
      await expect(page.getByLabel('Revisión de ronda')).toHaveValue('5');
      const responseAgain = await page.evaluate(async () => (await (await fetch('/api/decks')).json()));
      expect(responseAgain).toEqual({ decks: approvedInstalledDecks });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      for (const url of ['/barajas/generica/baraja.json', '/barajas/generica/cartas.json', '/barajas/catalogo.json', '/media/decks/generica/v1/imagenes/a.png', '/media/decks/generica/v2/imagenes/a.png', '/api/no-existe']) {
        const denied = await page.evaluate(async (path) => { const r = await fetch(path); return { status: r.status, text: await r.text() }; }, url);
        expect(denied.status).toBe(404); expect(denied.text).not.toContain('<!doctype html>');
      }
    });

    test('AGV2-09 instalación temporal vacía: servicio y presentación sin desactivar genérica normal', async ({ page, context }) => {
      const root = await compiledInstallation(); let stop: (() => Promise<void>) | undefined;
      try {
        const { prepareDecks } = await import('../../dist-server/server/infrastructure/decks/catalog.js');
        expect((await prepareDecks(path.join(root, 'barajas'))).response).toEqual({ decks: [] });
        const server = await startCompiledDeckServer(root); stop = server.stop;
        const response = await page.goto(`${server.base}/api/decks`);
        expect(response?.status()).toBe(200); expect(await response?.json()).toEqual({ decks: [] });
        expect(response?.headers()['cache-control']).toBe('no-store'); expect(await context.cookies()).toEqual([]);
        await page.goto(server.base); await page.getByRole('button', { name: 'Crear sala' }).click();
        await expect(page.getByText('No hay barajas disponibles. Puedes configurar las demás opciones.')).toBeVisible();
        await expect(page.getByLabel('Baraja', { exact: true })).toHaveValue('');
        await expect(page.locator('.no-deck')).toHaveText('Sin baraja seleccionada');
        await page.getByLabel('Tiempo por turno').selectOption('15');
        await expect(page.getByLabel('Tiempo por turno')).toHaveValue('15');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await fs.readdir(root)).not.toContain('asset-access.txt');
      } finally { await stop?.(); await removeTestInstallation(root); }
    });

    test('proceso compilado con fixture publicada: resumen seguro y medio real; borrador excluido', async ({ page, context }) => {
      const root = await compiledInstallation(); let stop: (() => Promise<void>) | undefined;
      try {
        const fixture = deckFixture('publicada', true); fixture.metadata.imageRef = 'imagenes/portada.webp'; fixture.metadata.imageAlt = 'Portada de prueba';
        const directory = await writeFixture(path.join(root, 'barajas'), fixture);
        await fs.mkdir(path.join(directory, 'imagenes')); const image = await realImage('webp'); await fs.writeFile(path.join(directory, fixture.metadata.imageRef), image);
        await writeFixture(path.join(root, 'barajas'), deckFixture('borrador', false));
        const { prepareDecks } = await import('../../dist-server/server/infrastructure/decks/catalog.js');
        await prepareDecks(path.join(root, 'barajas'));
        const server = await startCompiledDeckServer(root); stop = server.stop;
        const response = await page.goto(`${server.base}/api/decks`); expect(response?.status()).toBe(200);
        const payload = await response!.json(); expect(await context.cookies()).toEqual([]);
        expect(payload).toEqual({ decks: [{ id: 'publicada', schemaVersion: 1, contentVersion: 7, name: 'Fixture publicada', subtitle: '', description: fixture.metadata.description,
          imageUrl: '/media/decks/publicada/v7/imagenes/portada.webp', imageAlt: 'Portada de prueba' }] });
        const served = await page.evaluate(async (url: string) => { const r = await fetch(url); return { status: r.status, mime: r.headers.get('content-type'), bytes: Array.from(new Uint8Array(await r.arrayBuffer())) }; }, payload.decks[0].imageUrl);
        expect(served.status).toBe(200); expect(served.mime).toBe('image/webp'); expect(Buffer.from(served.bytes)).toEqual(image);
        for (const url of ['/media/decks/publicada/v6/imagenes/portada.webp', '/media/decks/borrador/v7/imagenes/a.webp', '/media/decks/publicada/v7/cartas.json']) {
          expect(await page.evaluate(async (url) => (await fetch(url)).status, url)).toBe(404);
        }
        await fs.writeFile(path.join(directory, 'cartas.json'), '{'); await fs.writeFile(path.join(directory, fixture.metadata.imageRef), 'recurso roto después del arranque');
        const cached = await page.evaluate(async () => (await (await fetch('/api/decks')).json())); expect(cached).toEqual(payload);
        // B05 consume en main la misma instantánea validada, incluso si después cambian los archivos.
        await page.goto(server.base); await page.getByRole('button', { name: 'Crear sala' }).click();
        await expect(page.getByLabel('Baraja', { exact: true })).toHaveValue('');
        await page.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: 'publicada', contentVersion: 7 }));
        await expect(page.getByRole('heading', { name: 'Fixture publicada · v7' })).toBeVisible();
        const selected = await page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
        expect(selected.selectedDeck).toEqual(payload.decks[0]);
        expect(selected.settings).toMatchObject({ deckId: 'publicada', deckContentVersion: 7 });
        expect(await fs.readdir(root)).not.toContain('asset-access.txt');
      } finally { await stop?.(); await removeTestInstallation(root); }
    });
  });
}
