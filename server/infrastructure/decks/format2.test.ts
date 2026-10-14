import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { deckFixture, realImage } from '../../../tests/support/deckFixtures.js';
import { removeTestInstallation } from '../../../tests/support/compiledDeckServer.js';
import { textValidationRuntime } from './format2Text.js';
import { validatePackageFormat, validatePackageFormat2 } from './packageFormat.js';
import { validateFormat2Package, validatePackage } from './readPackage.js';

const fixture = () => {
  const old = deckFixture('unicode-v2');
  return { metadata: { ...old.metadata, schemaVersion: 2 as const }, collection: { ...old.collection, schemaVersion: 2 as const } };
};
type Fixture = ReturnType<typeof fixture>;
const validate = (f: Fixture) => validatePackageFormat2(f.metadata, f.collection, 'unicode-v2');
let root: string;
beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-format2-')); });
afterEach(async () => { await removeTestInstallation(root); });
async function write(f = fixture()) {
  const dir = path.join(root, 'unicode-v2'); await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'baraja.json'), JSON.stringify(f.metadata));
  await fs.writeFile(path.join(dir, 'cartas.json'), JSON.stringify(f.collection));
  return dir;
}

describe('B15 F1 independiente: Unicode/conjuntos V2, sin incorporar contenido', () => {
  it('Intl.Segmenter coincide con cada frontera de GraphemeBreakTest oficial Unicode 17', async () => {
    const bytes = await fs.readFile('tests/fixtures/unicode-17/GraphemeBreakTest.txt');
    expect(createHash('sha256').update(bytes).digest('hex')).toBe('e2d134d2c52919bace503ebb6a551c1855fe1a1faec18478c78fff254a1793ec');
    const cases = bytes.toString('utf8').split(/\r?\n/).map((line) => line.split('#')[0].trim()).filter(Boolean);
    expect(cases).toHaveLength(766);
    const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });
    for (const trace of cases) {
      let text = ''; const boundaries: number[] = [];
      for (const token of trace.split(/\s+/)) {
        if (token === '÷') boundaries.push(text.length);
        else if (token !== '×') { expect(token).toMatch(/^[A-F0-9]+$/); text += String.fromCodePoint(Number.parseInt(token, 16)); }
      }
      expect([...segmenter.segment(text)].map((item) => item.index).concat(text.length), trace).toEqual(boundaries);
    }
  });
  it('usa White_Space Unicode en todos los bordes, y NFC sin NFKC ni transformación', () => {
    for (const point of [0x20, 0x85, 0xa0, 0x1680, ...Array.from({ length: 11 }, (_, n) => 0x2000 + n), 0x202f, 0x205f, 0x3000]) {
      for (const value of [String.fromCodePoint(point) + '1', '1' + String.fromCodePoint(point)]) {
        const f = fixture(); f.collection.cards[0].values.atributo1.displayValue = value;
        expect(validate(f).errors).toContainEqual(expect.objectContaining({ code: 'TEXT_EDGE_SPACE' }));
      }
    }
    const f = fixture(); f.collection.cards[0].values.atributo1.displayValue = '１２Ⅳ';
    expect(validate(f).errors).toEqual([]); expect(f.collection.cards[0].values.atributo1.displayValue).toBe('１２Ⅳ');
    f.collection.cards[0].values.atributo1.displayValue = '\uFEFF1';
    const errors = validate(f).errors; expect(errors.map((e) => e.code)).toContain('TEXT_GRAPHEME_BASE');
    expect(errors.map((e) => e.code)).not.toContain('TEXT_EDGE_SPACE'); // FEFF no pertenece a White_Space.
  });
  it('registra mecanismo real de referencia y conserva literalmente los datos', () => {
    expect(textValidationRuntime()).toMatchObject({ node: 'v24.19.0', icu: '78.3', unicode: '17.0', segmentation: { locale: 'es', granularity: 'grapheme' } });
    const f = fixture(); const before = structuredClone(f); const result = validate(f);
    expect(result.errors).toEqual([]); expect(result.data!.metadata).toBe(f.metadata); expect(result.data!.collection).toBe(f.collection);
    expect(f).toEqual(before); expect(result.data!.definition.cards).toBe(f.collection.cards);
  });
  it.each([
    ['Café', '', 4], ['q\u0301', '', 1], ['✈\uFE0F', '', 1], ['👩\u200D🚀', '', 1], ['🚀', '', 1],
    ['1 234', 'km', 8], ['1\u202F234', 'km', 8], ['1  234', 'km', 9], ['12.34', 'km/s', 10],
    ['999999', 'MKm', 10], ['13/10/2026', '', 10], ['sin dato', '', 8], ['-12.5', 'km', 8],
    ['WWWWWWWWWW', '', 10], ['q\u0301'.repeat(10), '', 10], ['1', '12345678', 10]
  ] as const)('admite %s + %s como %i grafemas sin cupos separados o parser temático', (displayValue, unit, count) => {
    const f = fixture(); Object.assign(f.collection.cards[0].values.atributo1, { displayValue, unit });
    const joint = displayValue + (unit === '' ? '' : ` ${unit}`);
    expect([...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(joint)]).toHaveLength(count);
    expect(validate(f).errors).toEqual([]); expect(f.collection.cards[0].values.atributo1.displayValue).toBe(displayValue);
  });
  it.each([
    ['Cafe\u0301', '', 'TEXT_NOT_NFC'], ['\u0301', '', 'TEXT_GRAPHEME_BASE'], ['\u200B', '', 'TEXT_GRAPHEME_BASE'],
    ['\u200D', '', 'TEXT_GRAPHEME_BASE'], ['\uD800', '', 'UNICODE_INVALID'], ['\uDC00', '', 'UNICODE_INVALID'],
    ['a\n1', '', 'TEXT_CONTROL'], ['a\r1', '', 'TEXT_CONTROL'], ['a\t1', '', 'TEXT_CONTROL'], ['a\0', '', 'TEXT_CONTROL'],
    ['a\u20281', '', 'TEXT_CONTROL'], ['a\u20291', '', 'TEXT_CONTROL'], [' 12', '', 'TEXT_EDGE_SPACE'], ['12 ', '', 'TEXT_EDGE_SPACE'],
    ['12', '\u00A0km', 'TEXT_EDGE_SPACE'], ['12', 'km\u202F', 'TEXT_EDGE_SPACE'], ['12', '\u200B', 'TEXT_GRAPHEME_BASE'],
    [' ', '', 'TEXT_EMPTY'], ['', '', 'TEXT_EMPTY'], ['12.345', 'km/s', 'TEXT_VALUE_GRAPHEME_LIMIT'],
    ['q\u0301'.repeat(11), '', 'TEXT_VALUE_GRAPHEME_LIMIT'], ['1', '123456789', 'TEXT_VALUE_GRAPHEME_LIMIT']
  ])('rechaza %s + %s con %s y localiza carta/atributo', (displayValue, unit, code) => {
    const f = fixture(); Object.assign(f.collection.cards[0].values.atributo1, { displayValue, unit }); const before = structuredClone(f);
    const result = validate(f); expect(result.data).toBeUndefined();
    expect(result.errors).toContainEqual(expect.objectContaining({ code, file: 'cartas.json', cardId: 'carta-1', attributeId: 'atributo1' }));
    if (code === 'TEXT_VALUE_GRAPHEME_LIMIT') {
      const issue = result.errors.find((e) => e.code === code)!;
      expect(issue.path).toBe('cards[0].values.atributo1'); expect(issue.message).toContain('11 grafemas; máximo 10');
      expect(issue.message).toContain('displayValue'); expect(issue.message).toContain('unit');
    }
    expect(f).toEqual(before);
  });
  const capped: [string, number, (f: Fixture, value: string) => void][] = [
    ['name', 128, (f, v) => { f.metadata.name = v; }], ['subtitle', 256, (f, v) => { f.metadata.subtitle = v; }],
    ['description', 4096, (f, v) => { f.metadata.description = v; }], ['notes', 16384, (f, v) => { f.metadata.notes = v; }],
    ['instructions', 16384, (f, v) => { f.metadata.instructions = v; }], ['imageAlt', 1024, (f, v) => { f.metadata.imageRef = 'imagenes/a.png'; f.metadata.imageAlt = v; }],
    ['attributes[0].name', 32, (f, v) => { f.metadata.attributes[0] = { ...f.metadata.attributes[0], name: v }; }],
    ['cards[0].name', 128, (f, v) => { f.collection.cards[0] = { ...f.collection.cards[0], name: v }; }],
    ['cards[0].characteristic', 1024, (f, v) => { f.collection.cards[0] = { ...f.collection.cards[0], characteristic: v }; }],
    ['cards[0].imageAlt', 1024, (f, v) => { f.collection.cards[0] = { ...f.collection.cards[0], imageRef: 'imagenes/a.png', imageAlt: v }; }],
    ['cards[0].note', 4096, (f, v) => { f.collection.cards[0] = { ...f.collection.cards[0], note: v }; }]
  ];
  it.each(capped)('%s: M/M+1 por puntos de código suplementarios, sin contar UTF-16', (property, limit, set) => {
    const f = fixture(); set(f, '🚀'.repeat(limit)); expect(validate(f).errors).toEqual([]);
    set(f, '🚀'.repeat(limit + 1)); const result = validate(f);
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'TEXT_CODE_POINT_LIMIT', path: property,
      message: `${limit + 1} puntos de código; máximo ${limit}.` })); expect(result.data).toBeUndefined();
  });
  it('LF solo en párrafos permitidos y cuenta en su tope; controles/bordes/marcas en otros textos', () => {
    const paragraphOnly = fixture(); paragraphOnly.metadata.description = '\u0301';
    // La regla de base gráfica es de textos compactos; no imponerla a un párrafo.
    expect(validate(paragraphOnly).errors).toEqual([]);
    const f = fixture(); f.metadata.instructions = 'a\n' + 'b'.repeat(16382); f.metadata.notes = 'Notas\nsegunda línea';
    f.metadata.sources = [{ title: 'Fuente', url: 'https://example.org', note: 'Una\notra' }];
    f.collection.cards[0] = { ...f.collection.cards[0], note: 'Nota\notra' }; expect(validate(f).errors).toEqual([]);
    f.metadata.instructions += '\n'; expect(validate(f).errors).toContainEqual(expect.objectContaining({ path: 'instructions', code: 'TEXT_CODE_POINT_LIMIT' }));
    f.metadata.instructions = 'a\r\nb'; f.metadata.subtitle = 'a\t'; f.metadata.sources[0].title = '\u0301'; f.metadata.credits = [{ name: ' Autor', role: '\u200B', license: '', url: '' }];
    const errors = validate(f).errors;
    for (const [property, code] of [['instructions', 'TEXT_CONTROL'], ['subtitle', 'TEXT_CONTROL'], ['sources[0].title', 'TEXT_GRAPHEME_BASE'], ['credits[0].name', 'TEXT_EDGE_SPACE'], ['credits[0].role', 'TEXT_GRAPHEME_BASE']]) {
      expect(errors).toContainEqual(expect.objectContaining({ path: property, code }));
    }
    expect(errors.find((e) => e.path === 'subtitle' && e.code === 'TEXT_CONTROL')?.message).toContain('\\u{0009}');
    f.metadata.description = '\u200B'; expect(validate(f).errors).toContainEqual(expect.objectContaining({ path: 'description', code: 'TEXT_EMPTY' }));
  });
  it('no agrega topes a créditos/fuentes/unidad de atributo ni hereda unidad en cartas', () => {
    const f = fixture(); f.metadata.credits = [{ name: 'a'.repeat(2000), role: 'Autor', license: 'b'.repeat(20000), url: '' }];
    f.metadata.sources = [{ title: 'Fuente'.repeat(1000), note: 'Nota'.repeat(10000), url: '' }];
    f.metadata.attributes[0] = { ...f.metadata.attributes[0], name: 'Triángulo', unit: 'u'.repeat(2000) };
    f.collection.cards[0].values.atributo1.displayValue = '13/10/2026'; expect(validate(f).errors).toEqual([]);
  });
  it('V1 permanece histórico: no recibe NFC, bordes ni cupos nuevos', () => {
    const f = deckFixture('unicode-v2'); f.metadata.name = 'Cafe\u0301'; f.metadata.attributes[0] = { ...f.metadata.attributes[0], name: 'a'.repeat(33) };
    f.collection.cards[0].values.atributo1.displayValue = '317858890240';
    expect(validatePackageFormat(f.metadata, f.collection, 'unicode-v2').errors).toEqual([]);
  });
});

describe('B15 F1 independiente: archivos reales, coherencia y recursos V2', () => {
  it('JSON V2 válido con null y un recurso real, sin reparación ni conversión', async () => {
    const f = fixture(); f.metadata.publication.available = false;
    f.collection.cards[1] = { ...f.collection.cards[1], imageRef: 'imagenes/a.png', imageAlt: 'Imagen fixture' };
    const directory = await write(f); await fs.mkdir(path.join(directory, 'imagenes')); const bytes = await realImage('png'); await fs.writeFile(path.join(directory, 'imagenes/a.png'), bytes);
    const result = await validateFormat2Package(directory); expect(result.valid).toBe(true); expect(result.available).toBe(false);
    expect(result.data!.metadata.schemaVersion).toBe(2); expect(result.images.get('imagenes/a.png')?.bytes).toEqual(bytes);
    expect(result.data!.definition.cards[0].imageRef).toBeNull();
    // El consumidor normal anterior no empieza a aceptar V2 antes del corte coordinado.
    expect((await validatePackage(directory)).errors).toContainEqual(expect.objectContaining({ code: 'UNSUPPORTED_SCHEMA' }));
  });
  it('UTF-8 inválido, sustituto escapado y claves duplicadas equivalentes localizados', async () => {
    const f = fixture(); const dir = await write(f); const cards = path.join(dir, 'cartas.json'); const original = await fs.readFile(cards, 'utf8');
    await fs.writeFile(cards, original.replace('"displayValue":"Dato 700"', '"displayValue":"Dato 700","display\\u0056alue":"otro"'));
    expect((await validateFormat2Package(dir)).errors).toContainEqual(expect.objectContaining({ code: 'JSON_DUPLICATE_KEY', file: 'cartas.json', path: 'cards[0].values.atributo1.displayValue', message: expect.stringContaining('línea') }));
    f.collection.cards[0].values.atributo1.displayValue = '\uD800'; await write(f);
    expect((await validateFormat2Package(dir)).errors).toContainEqual(expect.objectContaining({ code: 'UNICODE_INVALID', file: 'cartas.json', message: expect.stringContaining('D800') }));
    await fs.writeFile(cards, Buffer.concat([Buffer.from(original), Buffer.from([0xc3, 0x28])]));
    expect((await validateFormat2Package(dir)).errors).toContainEqual(expect.objectContaining({ code: 'JSON_ENCODING', file: 'cartas.json' }));
  });
  it('escapa controles/sustitutos también en paths, claves duplicadas e IDs de diagnósticos', async () => {
    const f = fixture(); f.collection.cards[0] = { ...f.collection.cards[0], id: 'carta-\uD800' };
    const dir = await write(f); const file = path.join(dir, 'baraja.json'); const json = await fs.readFile(file, 'utf8');
    await fs.writeFile(file, json.replace('{', '{"\\u0000":1,"\\u0000":2,'));
    const errors = (await validateFormat2Package(dir)).errors;
    expect(errors).toContainEqual(expect.objectContaining({ code: 'JSON_DUPLICATE_KEY', path: '\\u{0000}' }));
    expect(errors).toContainEqual(expect.objectContaining({ code: 'UNICODE_INVALID', cardId: 'carta-\\u{D800}' }));
    for (const issue of errors) for (const text of [issue.path, issue.message, issue.cardId ?? '']) {
      expect(text).not.toMatch(/[\p{C}\p{M}]/u);
    }
  });
  it.each(['../a.png', 'https://example.org/a.png', 'imagenes/ausente.png', 'imagenes/mala.png'])('recurso %s inválido nunca se transforma en null', async (reference) => {
    const f = fixture(); f.collection.cards[0] = { ...f.collection.cards[0], imageRef: reference, imageAlt: 'Texto' }; const dir = await write(f);
    await fs.mkdir(path.join(dir, 'imagenes')); await fs.writeFile(path.join(dir, 'imagenes/mala.png'), 'no es imagen');
    const result = await validateFormat2Package(dir); expect(result.valid).toBe(false); expect(result.data).toBeUndefined();
    expect(result.errors).toContainEqual(expect.objectContaining({ stage: 'resources', file: 'cartas.json', path: 'cards[0].imageRef', cardId: 'carta-1' }));
    expect(f.collection.cards[0].imageRef).toBe(reference);
  });
  it('enlace de directorio de imagen externo al paquete se rechaza', async () => {
    const f = fixture(); f.collection.cards[0] = { ...f.collection.cards[0], imageRef: 'imagenes/a.png', imageAlt: 'Texto' }; const dir = await write(f);
    const outside = path.join(root, 'outside'); await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'a.png'), await realImage('png'));
    await fs.symlink(outside, path.join(dir, 'imagenes'), 'junction');
    expect((await validateFormat2Package(dir)).errors).toContainEqual(expect.objectContaining({ code: 'IMAGE_OUTSIDE_DECK', cardId: 'carta-1' }));
  });
  it('incoherencia entre esquemas/versiones y claves/tipos no se repara; mismos datos con rangos distintos son válidos', () => {
    const f = fixture(); f.collection.cards[0].values.atributo1.displayValue = '4.8'; f.collection.cards[1].values.atributo1.displayValue = '4.8';
    expect(validate(f).errors).toEqual([]);
    expect(validatePackageFormat2(f.metadata, { ...f.collection, schemaVersion: 1, contentVersion: 8 }, 'unicode-v2').errors.map((e) => e.code)).toContain('VERSION_MISMATCH');
    expect(validatePackageFormat2(f.metadata, { ...f.collection, schemaVersion: 1 }, 'unicode-v2').errors.map((e) => e.code)).toContain('UNSUPPORTED_SCHEMA');
    f.collection.cards[0].values.atributo1.playValue = '1' as unknown as number;
    expect(validate(f).errors).toContainEqual(expect.objectContaining({ code: 'PLAY_VALUE_INTEGER', cardId: 'carta-1', attributeId: 'atributo1' }));
    expect(validatePackageFormat2({ ...f.metadata, name: null, shortName: 'no' }, f.collection, 'unicode-v2').errors.map((e) => e.code)).toEqual(expect.arrayContaining(['INVALID_TYPE', 'UNKNOWN_FIELD']));
  });
});
