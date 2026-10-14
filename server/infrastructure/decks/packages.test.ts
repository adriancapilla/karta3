import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { removeTestInstallation } from '../../../tests/support/compiledDeckServer.js';
import { deckFixture, legacyDeckFixture, realImage, writeFixture } from '../../../tests/support/deckFixtures.js';
import { validatePackage } from './readPackage.js';
import { DeckLoadError, loadPreparedDecks, prepareDecks } from './catalog.js';

let root: string;
beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-')); });
afterEach(async () => { await removeTestInstallation(root); });
type Mutable = { metadata: Record<string, unknown>; collection: Record<string, unknown> };
const mutableFixture = () => deckFixture() as unknown as Mutable;

describe('B04-03/04 formato y coherencia', () => {
  it('paquetes con duplicados reales, escape equivalente anidado y UTF-8 inválido no producen definición', async () => {
    const directory = await writeFixture(root);
    const metadataPath = path.join(directory, 'baraja.json'); const cardsPath = path.join(directory, 'cartas.json');
    const metadata = await fs.readFile(metadataPath, 'utf8'); const cards = await fs.readFile(cardsPath, 'utf8');
    await fs.writeFile(metadataPath, metadata.replace('{', '{"name":"sobrescritura",'));
    const duplicate = await validatePackage(directory);
    expect(duplicate.available).toBeUndefined();
    expect(duplicate.errors).toContainEqual(expect.objectContaining({ code: 'JSON_DUPLICATE_KEY', file: 'baraja.json', path: 'name' }));
    await fs.writeFile(metadataPath, metadata);
    await fs.writeFile(cardsPath, cards.replace('"playValue": 1,', '"playValue": 1, "play\\u0056alue": 2,'));
    const nested = await validatePackage(directory);
    expect(nested.available).toBe(true); expect(nested.data).toBeUndefined();
    expect(nested.errors).toContainEqual(expect.objectContaining({ code: 'JSON_DUPLICATE_KEY', file: 'cartas.json', path: 'cards[0].values.atributo1.playValue' }));
    await fs.writeFile(cardsPath, Buffer.concat([Buffer.from(cards), Buffer.from([0xc3, 0x28])]));
    expect((await validatePackage(directory)).errors).toContainEqual(expect.objectContaining({ code: 'JSON_ENCODING', file: 'cartas.json' }));
  });
  it.each([
    ['nombre ausente', (f: Mutable) => { delete f.metadata.name; }, 'baraja.json', 'name', 'MISSING_FIELD'],
    ['propiedad adicional', (f: Mutable) => { f.metadata.title = 'no'; }, 'baraja.json', 'title', 'UNKNOWN_FIELD'],
    ['nombre vacío', (f: Mutable) => { f.metadata.name = ' '; }, 'baraja.json', 'name', 'INVALID_VALUE'],
    ['descripción vacía', (f: Mutable) => { f.metadata.description = ''; }, 'baraja.json', 'description', 'INVALID_VALUE'],
    ['subtítulo tipo', (f: Mutable) => { f.metadata.subtitle = null; }, 'baraja.json', 'subtitle', 'INVALID_TYPE'],
    ['versión textual', (f: Mutable) => { f.metadata.contentVersion = '7'; }, 'baraja.json', 'contentVersion', 'INVALID_TYPE'],
    ['versión cero', (f: Mutable) => { f.metadata.contentVersion = 0; }, 'baraja.json', 'contentVersion', 'INVALID_VALUE'],
    ['schema desconocido', (f: Mutable) => { f.metadata.schemaVersion = 9; }, 'baraja.json', 'schemaVersion', 'UNSUPPORTED_SCHEMA'],
    ['schema textual', (f: Mutable) => { f.metadata.schemaVersion = '1'; }, 'baraja.json', 'schemaVersion', 'UNSUPPORTED_SCHEMA'],
    ['id carpeta', (f: Mutable) => { f.metadata.id = 'otro'; }, 'baraja.json', 'id', 'DECK_ID_MISMATCH'],
    ['id colección', (f: Mutable) => { f.collection.deckId = 'otro'; }, 'cartas.json', 'deckId', 'DECK_ID_MISMATCH'],
    ['versiones distintas', (f: Mutable) => { f.collection.contentVersion = 8; }, 'cartas.json', 'contentVersion', 'VERSION_MISMATCH'],
    ['schema colección', (f: Mutable) => { f.collection.schemaVersion = 9; }, 'cartas.json', 'schemaVersion', 'UNSUPPORTED_SCHEMA'],
    ['atributos fuera de orden', (f: Mutable) => { (f.metadata.attributes as unknown[]).reverse(); }, 'baraja.json', 'attributes[0].id', 'INVALID_VALUE'],
    ['atributo visible en vez de id', (f: Mutable) => { (f.metadata.attributes as Record<string, unknown>[])[0].id = 'Magnitud'; }, 'baraja.json', 'attributes[0].id', 'INVALID_VALUE'],
    ['publicación orden', (f: Mutable) => { (f.metadata.publication as Record<string, unknown>).order = -1; }, 'baraja.json', 'publication.order', 'INVALID_VALUE'],
    ['URL relativa', (f: Mutable) => { f.metadata.sources = [{ title: 'Fuente', url: '/local', note: '' }]; }, 'baraja.json', 'sources[0].url', 'INVALID_VALUE'],
    ['crédito vacío', (f: Mutable) => { f.metadata.credits = [{ name: 'Autor', role: '', license: '', url: '' }]; }, 'baraja.json', 'credits[0].role', 'INVALID_VALUE']
  ])('%s', async (_name, mutate, file, property, code) => {
    const input = mutableFixture(); mutate(input); const before = structuredClone(input);
    const directory = await writeFixture(root, input as unknown as ReturnType<typeof deckFixture>, 'prueba');
    const result = await validatePackage(directory);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ file, path: property, code }));
    expect(input).toEqual(before);
    expect(result.data).toBeUndefined();
  });
  it.each([
    ['display vacío', 'displayValue', ' ', 'INVALID_VALUE'], ['display número', 'displayValue', 5, 'INVALID_TYPE'],
    ['play citado', 'playValue', '1', 'PLAY_VALUE_INTEGER'], ['play fracción', 'playValue', 1.1, 'PLAY_VALUE_INTEGER'],
    ['play fuera', 'playValue', 59, 'PLAY_VALUE_RANGE'], ['play repetido', 'playValue', 2, 'PLAY_VALUE_DUPLICATE'],
    ['unidad ausente', 'unit', undefined, 'MISSING_FIELD']
  ])('%s', async (_name, key, value, code) => {
    const fixture = deckFixture();
    const target = fixture.collection.cards[0].values.atributo1 as unknown as Record<string, unknown>;
    if (value === undefined) delete target[key]; else target[key] = value;
    const result = await validatePackage(await writeFixture(root, fixture));
    expect(result.errors).toContainEqual(expect.objectContaining({ file: 'cartas.json', path: `cards[${code === 'PLAY_VALUE_DUPLICATE' ? 1 : 0}].values.atributo1.${key}`, code }));
  });
  it('valor de atributo ausente, campos adicionales anidados e ids portables', async () => {
    const f = deckFixture();
    const values = f.collection.cards[0].values as Record<string, unknown>; delete values.atributo2;
    (values.atributo1 as Record<string, unknown>).extra = 1;
    f.collection.cards[1] = { ...f.collection.cards[1], id: 'No_Portable' };
    const result = await validatePackage(await writeFixture(root, f));
    expect(result.errors.map((error) => error.path)).toEqual(expect.arrayContaining(['cards[0].values.atributo2', 'cards[0].values.atributo1.extra', 'cards[1].id']));
  });
  it('acumula errores independientes de ambos archivos y recursos, sin derivar de JSON ilegible', async () => {
    const f = deckFixture(); f.metadata.name = ''; f.metadata.imageRef = '../fuera.png'; f.metadata.imageAlt = 'Alt';
    f.collection.cards[0] = { ...f.collection.cards[0], name: '' };
    const directory = await writeFixture(root, f);
    expect((await validatePackage(directory)).errors.map((error) => error.path)).toEqual(expect.arrayContaining(['name', 'cards[0].name', 'imageRef']));
    await fs.writeFile(path.join(directory, 'cartas.json'), '{"cards":');
    const result = await validatePackage(directory);
    expect(result.errors.some((error) => error.code === 'JSON_SYNTAX')).toBe(true);
    expect(result.errors.some((error) => error.code === 'CARD_COUNT')).toBe(false);
  });
});

describe('B04-05 recursos reales', () => {
  it('B15-01 copia real aprobada: formato 2/contenido 4 disponible, 58 cartas y null sin directorio', async () => {
    const result = await validatePackage(path.resolve('barajas/generica'));
    expect(result).toMatchObject({ valid: true, available: true, errors: [], data: { metadata: { schemaVersion: 2, contentVersion: 4, imageRef: null, imageAlt: '' } } });
    const collection = JSON.parse(await fs.readFile(path.resolve('barajas/generica/cartas.json'), 'utf8'));
    expect(collection).toMatchObject({ schemaVersion: 2, contentVersion: 4, deckId: 'generica' });
    expect(collection.cards).toHaveLength(58);
    for (const card of collection.cards) expect(card).toMatchObject({ imageRef: null, imageAlt: '' });
    expect(result.data!.metadata.notes).toContain('generica-v1');
    expect(result.images.size).toBe(0);
    expect(await fs.readdir(path.resolve('barajas/generica'))).toEqual(['baraja.json', 'cartas.json']);
    for (const [file, expected] of [
      ['baraja.json', 'b7855547acf56a728618f1e71be80cb19ca5c54a6ce0612cc3bee753270d2bd4'],
      ['cartas.json', 'c2896ccae66d0119b808db7adea72cca7b442a283bf576e0cfaa7de2628c5c9b']
    ]) expect(createHash('sha256').update(await fs.readFile(path.resolve('barajas/generica', file))).digest('hex')).toBe(expected);
  });
  it.each(['png', 'jpeg', 'webp'] as const)('decodifica portada y carta %s; repetición de recurso permitida', async (format) => {
    const f = deckFixture(); const ref = `imagenes/portada.${format}`;
    f.metadata.imageRef = ref; f.metadata.imageAlt = 'Portada sintética';
    f.collection.cards[0] = { ...f.collection.cards[0], imageRef: ref, imageAlt: 'Carta sintética' };
    const directory = await writeFixture(root, f);
    await fs.mkdir(path.join(directory, 'imagenes')); await fs.writeFile(path.join(directory, ref), await realImage(format));
    const result = await validatePackage(directory);
    expect(result.errors).toEqual([]); expect(result.images.size).toBe(1);
    expect(result.images.get(ref)?.mime).toBe(`image/${format}`);
  });
  it.each(['', '../fuera.png', '/imagenes/a.png', 'https://host/a.png', 'imagenes\\a.png', 'imagenes/../a.png', 'imagenes//a.png', 'imagenes/A.png', 'imagenes/a.png?q=1', 'imagenes/a.png#hash', 'imagenes/con.png', 'imagenes/nul/a.png', 'imagenes/a.svg'])('rechaza ruta %s', async (ref) => {
    const f = deckFixture(); f.metadata.imageRef = ref; f.metadata.imageAlt = 'Alt';
    expect((await validatePackage(await writeFixture(root, f))).errors).toContainEqual(expect.objectContaining({ code: 'IMAGE_PATH', file: 'baraja.json', path: 'imageRef' }));
  });
  it('rechaza alt vacío y alt con null; no corrige ninguno', async () => {
    const f = deckFixture(); f.metadata.imageRef = 'imagenes/a.png'; f.metadata.imageAlt = '';
    f.collection.cards[0] = { ...f.collection.cards[0], imageAlt: 'No compatible con null' };
    const result = await validatePackage(await writeFixture(root, f));
    expect(result.errors.map((error) => error.path)).toEqual(expect.arrayContaining(['imageAlt', 'cards[0].imageAlt', 'imageRef']));
  });
  it('rechaza imagen ausente y escritura distinta en Windows', async () => {
    const f = deckFixture(); f.metadata.imageRef = 'imagenes/a.png'; f.metadata.imageAlt = 'Alt';
    const directory = await writeFixture(root, f);
    expect((await validatePackage(directory)).errors).toContainEqual(expect.objectContaining({ code: 'IMAGE_NOT_FOUND' }));
    await fs.mkdir(path.join(directory, 'imagenes')); await fs.writeFile(path.join(directory, 'imagenes', 'A.png'), await realImage('png'));
    expect((await validatePackage(directory)).errors).toContainEqual(expect.objectContaining({ code: 'IMAGE_NOT_FOUND' }));
  });
  it.each(['mismatch', 'text', 'truncated-png', 'truncated-jpeg', 'truncated-webp'])('rechaza bytes %s mediante decodificación', async (kind) => {
    const format = kind.endsWith('jpeg') ? 'jpeg' : kind.endsWith('webp') ? 'webp' : 'png';
    const f = deckFixture(); f.metadata.imageRef = `imagenes/a.${format}`; f.metadata.imageAlt = 'Alt';
    const directory = await writeFixture(root, f); await fs.mkdir(path.join(directory, 'imagenes'));
    const original = await realImage(kind === 'mismatch' ? 'jpeg' : format);
    const bytes = kind === 'text' ? Buffer.from('No soy una imagen') : kind.startsWith('truncated') ? original.subarray(0, Math.floor(original.length * .65)) : original;
    await fs.writeFile(path.join(directory, f.metadata.imageRef), bytes);
    expect((await validatePackage(directory)).errors).toContainEqual(expect.objectContaining({ code: 'IMAGE_INVALID' }));
  });
  it('escape real mediante junction de directorio; no se simula la existencia', async () => {
    const f = deckFixture(); f.metadata.imageRef = 'imagenes/escape/a.png'; f.metadata.imageAlt = 'Alt';
    const directory = await writeFixture(root, f); const outside = path.join(root, 'externo');
    await fs.mkdir(path.join(directory, 'imagenes')); await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'a.png'), await realImage('png'));
    await fs.symlink(outside, path.join(directory, 'imagenes', 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    expect((await validatePackage(directory)).errors).toContainEqual(expect.objectContaining({ code: 'IMAGE_OUTSIDE_DECK', path: 'imageRef' }));
  });
});

describe('B04-06/07/08 publicación, catálogo y carga', () => {
  it('B15 E6: V1 disponible válida históricamente bloquea junto a V2, sin escribir catálogo parcial', async () => {
    const dir = await writeFixture(root, legacyDeckFixture('historica'));
    expect((await validatePackage(dir)).valid).toBe(true);
    await writeFixture(root, deckFixture('actual'));
    await fs.writeFile(path.join(root, 'catalogo.json'), 'anterior');
    for (const operation of [prepareDecks, loadPreparedDecks]) await expect(operation(root)).rejects.toMatchObject({ errors: expect.arrayContaining([expect.objectContaining({ code: 'CONSUMER_SCHEMA_INCOMPATIBLE', file: 'baraja.json', path: '$.schemaVersion' })]), diagnostics: expect.arrayContaining([expect.objectContaining({ package: 'historica', valid: true, compatible: false, available: true })]) });
    expect(await fs.readFile(path.join(root, 'catalogo.json'), 'utf8')).toBe('anterior');
  });
  it('B15 V1 borrador válido/ inválido mantiene false fiable y su contrato; no se convierte', async () => {
    const f = legacyDeckFixture('historica', false); f.metadata.name = 'Cafe\u0301';
    const dir = await writeFixture(root, f); expect((await validatePackage(dir)).valid).toBe(true);
    await writeFixture(root, deckFixture('actual')); expect((await prepareDecks(root)).response.decks.map(d => d.id)).toEqual(['actual']);
    f.collection.cards = []; await writeFixture(root, f);
    const result = await prepareDecks(root); expect(result.diagnostics.find(d => d.package === 'historica')).toMatchObject({ available: false, valid: false });
    expect((await validatePackage(dir)).valid).toBe(false);
  });
  it('ordena por order e id ASCII, excluye no disponibles; bytes deterministas sin depender del catálogo previo', async () => {
    for (const [id, available, order] of [['zeta', true, 1], ['beta', true, 1], ['alfa', true, 0], ['borrador', false, 0]] as const) await writeFixture(root, deckFixture(id, available, order));
    await fs.writeFile(path.join(root, 'catalogo.json'), 'anterior inválido');
    const first = await prepareDecks(root); const bytes = await fs.readFile(path.join(root, 'catalogo.json'));
    expect(first.response.decks.map((deck) => deck.id)).toEqual(['alfa', 'beta', 'zeta']);
    await prepareDecks(root); expect(await fs.readFile(path.join(root, 'catalogo.json'))).toEqual(bytes);
    expect(bytes.toString()).toBe(`${JSON.stringify(first.response, null, 2)}\n`); expect(bytes.toString()).not.toContain('\r');
    expect(Object.keys(first.response.decks[0])).toEqual(['id', 'schemaVersion', 'contentVersion', 'name', 'subtitle', 'description', 'imageUrl', 'imageAlt']);
    expect((await loadPreparedDecks(root)).response).toEqual(first.response);
  });
  it('borrador inválido fiable false informa/excluye pero comando individual devuelve fallo', async () => {
    const f = deckFixture('borrador', false); f.metadata.name = ''; f.collection.cards = [];
    const directory = await writeFixture(root, f);
    await writeFixture(root, deckFixture('publica', true));
    const result = await prepareDecks(root);
    expect(result.response.decks.map((deck) => deck.id)).toEqual(['publica']);
    expect(result.diagnostics.find((entry) => entry.package === 'borrador')).toMatchObject({ available: false, valid: false, errors: expect.arrayContaining([expect.objectContaining({ code: 'CARD_COUNT' })]) });
    expect((await loadPreparedDecks(root)).response).toEqual(result.response);
    await expect(promisify(execFile)(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'tools/decks.ts', 'validate', '--package', directory])).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('CARD_COUNT') });
  });
  it('borrador false fiable con colección ilegible no bloquea, no usa datos anteriores', async () => {
    const directory = await writeFixture(root, deckFixture('borrador', false));
    await fs.writeFile(path.join(directory, 'cartas.json'), '{');
    expect((await prepareDecks(root)).response).toEqual({ decks: [] });
    expect((await validatePackage(directory)).valid).toBe(false);
  });
  it.each(['available-invalid', 'missing-availability', 'wrong-availability', 'unknown-schema', 'broken-metadata', 'duplicate-metadata', 'unreadable-metadata'])('%s bloquea y conserva catálogo anterior sin escribir parcial', async (kind) => {
    const f = deckFixture(); const mutable = f.metadata as unknown as Record<string, unknown>;
    if (kind === 'available-invalid') f.metadata.name = '';
    if (kind === 'missing-availability') delete (mutable.publication as Record<string, unknown>).available;
    if (kind === 'wrong-availability') (mutable.publication as Record<string, unknown>).available = 'false';
    if (kind === 'unknown-schema') mutable.schemaVersion = 9;
    const directory = await writeFixture(root, f);
    if (kind === 'broken-metadata') await fs.writeFile(path.join(directory, 'baraja.json'), '{');
    if (kind === 'duplicate-metadata') await fs.writeFile(path.join(directory, 'baraja.json'), '{"schemaVersion":1,"publication":{"available":false},"name":"a","name":"b"}');
    if (kind === 'unreadable-metadata') await fs.unlink(path.join(directory, 'baraja.json'));
    await fs.writeFile(path.join(root, 'catalogo.json'), 'conservar');
    await expect(prepareDecks(root)).rejects.toBeInstanceOf(DeckLoadError);
    await expect(loadPreparedDecks(root)).rejects.toBeInstanceOf(DeckLoadError);
    expect(await fs.readFile(path.join(root, 'catalogo.json'), 'utf8')).toBe('conservar');
  });
  it('catálogo ausente, corrupto, duplicado y desactualizado tienen motivos distinguibles', async () => {
    await writeFixture(root);
    await expect(loadPreparedDecks(root)).rejects.toMatchObject({ errors: [expect.objectContaining({ code: 'CATALOG_MISSING' })] });
    for (const invalid of ['{', '{"decks":[],"decks":[]}', '{"decks":null}']) {
      await fs.writeFile(path.join(root, 'catalogo.json'), invalid);
      await expect(loadPreparedDecks(root)).rejects.toMatchObject({ errors: [expect.objectContaining({ code: 'CATALOG_INVALID' })] });
    }
    await fs.writeFile(path.join(root, 'catalogo.json'), '{"decks":[]}\n');
    await expect(loadPreparedDecks(root)).rejects.toMatchObject({ errors: [expect.objectContaining({ code: 'CATALOG_STALE' })] });
  });
  it('raíz ausente y escritura imposible fallan; raíz vacía válida', async () => {
    await expect(prepareDecks(path.join(root, 'ausente'))).rejects.toMatchObject({ errors: [expect.objectContaining({ code: 'IO_ERROR' })] });
    expect((await prepareDecks(root)).response).toEqual({ decks: [] });
    await fs.unlink(path.join(root, 'catalogo.json')); await fs.mkdir(path.join(root, 'catalogo.json'));
    await expect(prepareDecks(root)).rejects.toMatchObject({ errors: [expect.objectContaining({ code: 'IO_ERROR' })] });
    expect((await fs.readdir(root)).some((name) => name.endsWith('.tmp'))).toBe(false);
  });
  it('instantánea inmutable: no relee ni incorpora edición, incluso imágenes cambiadas', async () => {
    const f = deckFixture(); f.metadata.imageRef = 'imagenes/a.png'; f.metadata.imageAlt = 'Portada';
    const directory = await writeFixture(root, f); await fs.mkdir(path.join(directory, 'imagenes'));
    const image = await realImage('png'); await fs.writeFile(path.join(directory, f.metadata.imageRef), image);
    await prepareDecks(root); const loaded = await loadPreparedDecks(root);
    expect(path.dirname(path.resolve(directory))).toBe(path.resolve(root));
    await fs.rm(directory, { recursive: true });
    expect(loaded.catalog.summaries()).toEqual(loaded.response.decks);
    expect(Object.isFrozen(loaded.catalog.definition('prueba')!.cards[0].values)).toBe(true);
    const url = loaded.response.decks[0].imageUrl!;
    const returned = loaded.catalog.image(url)!; expect(returned.bytes).toEqual(image); returned.bytes.fill(0);
    expect(loaded.catalog.image(url)!.bytes).toEqual(image);
    expect(loaded.catalog.definition('ausente')).toBeUndefined();
  });
});
