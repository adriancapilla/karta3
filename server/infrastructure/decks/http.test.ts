import { afterEach, expect, it } from 'vitest';
import request from 'supertest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRuntime } from '../../composition/createApp.js';
import { attachPublicFiles } from '../http/publicFiles.js';
import { MemoryRoomRepository } from '../memoryRoomRepository.js';
import { prepareDecks, loadPreparedDecks } from './catalog.js';
import { deckFixture, writeFixture, realImage } from '../../../tests/support/deckFixtures.js';
import { ControlledTime } from '../../../tests/support/controlledTime.js';
import { removeTestInstallation } from '../../../tests/support/compiledDeckServer.js';

const cleanups: (() => Promise<unknown> | void)[] = [];
afterEach(async () => { for (const cleanup of cleanups.reverse()) await cleanup(); cleanups.length = 0; });

it('B04-09 no crea sesión ni toca sala, revisión, presencia o caducidad', async () => {
  const repository = new MemoryRoomRepository(); const time = new ControlledTime();
  const runtime = createRuntime({ repository, clock: time, scheduler: time }); cleanups.push(() => runtime.dispose());
  const anonymous = await request(runtime.app).get('/api/decks').expect(200);
  expect(anonymous.body).toEqual({ decks: [] }); expect(anonymous.headers['set-cookie']).toBeUndefined();
  expect(anonymous.headers['cache-control']).toBe('no-store');
  const agent = request.agent(runtime.app); await agent.get('/api/rooms/current');
  const created = await agent.post('/api/rooms').send({}).expect(201); const roomId = created.body.room.id;
  const before = JSON.stringify(repository.findById(roomId)); time.advance(10_000);
  for (let index = 0; index < 3; index++) await agent.get('/api/decks').expect(200);
  expect(JSON.stringify(repository.findById(roomId))).toBe(before);
});

it('B04-09/10 solo resumen y recursos admitidos; ningún JSON interno ni fallback HTML', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-http-')); cleanups.push(() => removeTestInstallation(root));
  const f = deckFixture(); f.metadata.imageRef = 'imagenes/portada.png'; f.metadata.imageAlt = 'Portada';
  f.collection.cards[0] = { ...f.collection.cards[0], imageRef: 'imagenes/carta.jpeg', imageAlt: 'Carta' };
  const directory = await writeFixture(root, f); await fs.mkdir(path.join(directory, 'imagenes'));
  const cover = await realImage('png'); await fs.writeFile(path.join(directory, f.metadata.imageRef), cover);
  await fs.writeFile(path.join(directory, 'imagenes/carta.jpeg'), await realImage('jpeg'));
  const unpublished = deckFixture('borrador', false); unpublished.metadata.imageRef = 'imagenes/portada.png'; unpublished.metadata.imageAlt = 'Portada';
  const draft = await writeFixture(root, unpublished); await fs.mkdir(path.join(draft, 'imagenes')); await fs.writeFile(path.join(draft, unpublished.metadata.imageRef), cover);
  await prepareDecks(root); const loaded = await loadPreparedDecks(root);
  const runtime = createRuntime({ decks: loaded.catalog }); cleanups.push(() => runtime.dispose());
  const client = path.join(root, 'client'); await fs.mkdir(client); await fs.writeFile(path.join(client, 'index.html'), '<html>SPA</html>');
  attachPublicFiles(runtime.app, client, loaded.catalog);
  const response = await request(runtime.app).get('/api/decks').expect(200);
  expect(response.headers['set-cookie']).toBeUndefined(); expect(response.body).toEqual(loaded.response);
  expect(Object.keys(response.body.decks[0])).toEqual(['id', 'schemaVersion', 'contentVersion', 'name', 'subtitle', 'description', 'imageUrl', 'imageAlt']);
  const image = await request(runtime.app).get('/media/decks/prueba/v7/imagenes/portada.png').expect(200);
  expect(image.headers['content-type']).toBe('image/png'); expect(image.body).toEqual(cover);
  await request(runtime.app).get('/media/decks/prueba/v7/imagenes/carta.jpeg').expect(200).expect('Content-Type', 'image/jpeg');
  for (const url of [
    '/barajas', '/bar%61jas', '/%62arajas', '/%61pi', '/%6dedia', '/barajas/generica/baraja.json', '/barajas/prueba/cartas.json', '/barajas/catalogo.json', '/cartas.json',
    '/api/desconocida', '/api/decks/desconocida', '/media', '/media/decks', '/media/decks/prueba/v6/imagenes/portada.png',
    '/media/decks/prueba/v7/imagenes/ausente.png', '/media/decks/borrador/v7/imagenes/portada.png', '/media/decks/otra/v7/imagenes/portada.png',
    '/media/decks/prueba/v7/baraja.json', '/media/decks/prueba/v7/imagenes/..%2F..%2Fbaraja.json', '/docs', '/server/main.ts'
  ]) {
    const result = await request(runtime.app).get(url).expect(404);
    expect(result.text).not.toContain('<html>'); expect(result.text).not.toContain(root);
  }
  await request(runtime.app).get('/sala/ruta-cliente').expect(200).expect('Content-Type', /html/);
  await fs.unlink(path.join(directory, f.metadata.imageRef)); await fs.writeFile(path.join(directory, 'cartas.json'), '{');
  expect((await request(runtime.app).get('/api/decks').expect(200)).body).toEqual(response.body);
  expect((await request(runtime.app).get('/media/decks/prueba/v7/imagenes/portada.png').expect(200)).body).toEqual(cover);
});
