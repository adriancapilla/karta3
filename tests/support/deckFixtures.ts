import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { Metadata, Collection } from '../../server/infrastructure/decks/packageFormat.js';

/** Contenido sintético de prueba: nunca se cambia disponibilidad de la genérica. */
export function deckFixture(id = 'prueba', available = true, order = 0) {
  const metadata: Metadata<2> = {
    schemaVersion: 2, contentVersion: 7, id, name: `Fixture ${id}`, subtitle: '', description: 'Paquete sintético para comprobar B04/B15.',
    notes: '', instructions: '', attributes: [1, 2, 3].map((index) => ({ id: `atributo${index}`, name: `Magnitud ${index}`, unit: '' })),
    imageRef: null, imageAlt: '', publication: { available, order }, credits: [], sources: []
  };
  const collection: Collection<2> = { schemaVersion: 2, contentVersion: 7, deckId: id,
    cards: Array.from({ length: 58 }, (_, index) => ({
      id: `carta-${index + 1}`, name: 'Nombre repetible', characteristic: '', imageRef: null, imageAlt: '',
      values: Object.fromEntries([1, 2, 3].map((attribute) => [`atributo${attribute}`, { playValue: index + 1, displayValue: String(700 - index), unit: '' }])),
      roundAttribute: 'atributo1', note: ''
    })) };
  return { metadata, collection };
}
export function legacyDeckFixture(id = 'prueba', available = true, order = 0) {
  const fixture = deckFixture(id, available, order);
  return { metadata: { ...fixture.metadata, schemaVersion: 1 as const }, collection: { ...fixture.collection, schemaVersion: 1 as const } };
}
export async function writeFixture(root: string, fixture: { metadata: Metadata<1 | 2>; collection: Collection<1 | 2> } = deckFixture(), folder = fixture.metadata.id) {
  const directory = path.join(root, folder);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'baraja.json'), `${JSON.stringify(fixture.metadata, null, 2)}\n`);
  await fs.writeFile(path.join(directory, 'cartas.json'), `${JSON.stringify(fixture.collection, null, 2)}\n`);
  return directory;
}
export async function realImage(format: 'png' | 'jpeg' | 'webp') {
  return sharp({ create: { width: 8, height: 6, channels: 3, background: '#3050aa' } }).toFormat(format).toBuffer();
}
