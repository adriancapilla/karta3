import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

assert.equal(process.version, 'v24.19.0');
assert.equal(process.platform, 'linux');
assert.equal(process.arch, 'x64');
assert.notEqual(process.getuid(), 0);
const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'blue' } }).png().toBuffer();
assert.equal((await sharp(png).metadata()).format, 'png');
await assert.rejects(fs.writeFile('/app/.ci-readonly-probe', 'probe', { flag: 'wx' }), { code: 'EROFS' });
const expected = {
  'baraja.json': 'b7855547acf56a728618f1e71be80cb19ca5c54a6ce0612cc3bee753270d2bd4',
  'cartas.json': 'c2896ccae66d0119b808db7adea72cca7b442a283bf576e0cfaa7de2628c5c9b'
};
for (const [file, hash] of Object.entries(expected)) {
  assert.equal(createHash('sha256').update(await fs.readFile(`/app/barajas/generica/${file}`)).digest('hex'), hash);
}
for (const name of ['ASSETS', 'TFM', 'MASTER', '.git', 'src', 'tests', 'deploy', '.env', '.env.private']) {
  await assert.rejects(fs.stat(`/app/${name}`), { code: 'ENOENT' });
}
const response = await globalThis.fetch('http://127.0.0.1:3000/api/decks');
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'no-store');
assert.equal(response.headers.get('set-cookie'), null);
const catalog = await response.json();
assert.equal(catalog.decks.length, 2);
assert.equal(catalog.decks[0].id, 'generica');
assert.equal(catalog.decks[0].schemaVersion, 2);
assert.equal(catalog.decks[0].contentVersion, 4);
assert.equal(catalog.decks[1].id, 'sistema-solar');
assert.equal(catalog.decks[1].schemaVersion, 2);
assert.equal(catalog.decks[1].contentVersion, 4);
assert.equal(catalog.decks[1].imageUrl, '/media/decks/sistema-solar/v4/imagenes/portada.webp');
for (const [file, hash] of Object.entries({
  'baraja.json': '3e31db300c706738e69d743703f2bd1d4d027b2b08743313fe54d15eb6943e44',
  'cartas.json': 'bce5740a4ba3daf8da60ffad88a2cbc07271e95baae44bee078d0984973fa7fa'
})) assert.equal(createHash('sha256').update(await fs.readFile(`/app/barajas/sistema-solar/${file}`)).digest('hex'), hash);
console.log(JSON.stringify({ node: process.version, uid: process.getuid(), icu: process.versions.icu, unicode: process.versions.unicode, sharp: sharp.versions,
  deckHashes: expected, catalog, readonly: true }));
