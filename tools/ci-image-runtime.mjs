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
  'baraja.json': '991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed',
  'cartas.json': '868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c'
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
assert.equal(catalog.decks.length, 1);
assert.equal(catalog.decks[0].id, 'generica');
assert.equal(catalog.decks[0].schemaVersion, 1);
assert.equal(catalog.decks[0].contentVersion, 2);
console.log(JSON.stringify({ node: process.version, uid: process.getuid(), sharp: sharp.versions,
  deckHashes: expected, catalog, readonly: true }));
