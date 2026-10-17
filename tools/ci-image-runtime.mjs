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
for (const name of ['ASSETS', 'PRODUCTO', 'TFM', 'MASTER', '.git', 'src', 'tests', 'deploy', '.env', '.env.private']) {
  await assert.rejects(fs.stat(`/app/${name}`), { code: 'ENOENT' });
}
const response = await globalThis.fetch('http://127.0.0.1:3000/api/decks');
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'no-store');
assert.equal(response.headers.get('set-cookie'), null);
const catalog = await response.json();
assert.deepEqual(catalog.decks.map(({ id, schemaVersion, contentVersion }) => ({ id, schemaVersion, contentVersion })), [
  { id: 'criaturas-magicas', schemaVersion: 2, contentVersion: 2 },
  { id: 'generica', schemaVersion: 2, contentVersion: 4 },
  { id: 'sistema-solar', schemaVersion: 2, contentVersion: 4 }
]);
assert.equal(catalog.decks[0].imageUrl, '/media/decks/criaturas-magicas/v2/imagenes/portada.webp');
assert.equal(catalog.decks[2].imageUrl, '/media/decks/sistema-solar/v4/imagenes/portada.webp');
for (const { id } of catalog.decks) for (const name of ['baraja.json', 'cartas.json']) {
  const response = await globalThis.fetch('http://127.0.0.1:3000/barajas/' + id + '/' + name);
  assert.equal(response.status, 404);
  assert(!((await response.text()).toLowerCase().includes('<!doctype html>')));
}
// Expected frozen from approved manifest b9a7510aca03864606f18df4597b5ca3398e03f1f1b1cb95cc86804f6f226f75.
// /paquetes/criaturas-magicas is mapped once here; runtime never reads a source/certificate.
const creatures = {
  "baraja.json": "f1cd46de8433ff439ccfdf4a367f0c03b61e597278e43f949c7889d5c3e0bde5",
  "cartas.json": "9783f44cbba4092d1d23eacccbd8ff267714f10c94393569d3c900deabba5f10",
  "imagenes/cartas/carta-001.webp": "feac4869a3d57883d534bc48dbb6d0d59bd6537a19ae4fd38d4c4cd6c71b6767",
  "imagenes/cartas/carta-002.webp": "d97ed0947b80a2b59003017c871c3d25ceb51917900452b0c8f34c8c6be5abd3",
  "imagenes/cartas/carta-003.webp": "91999bcc6f007074ac7a8e58927d36e2f87cb65149e069f07b25b49224ea63bc",
  "imagenes/cartas/carta-004.webp": "69cfccd87301be28362c6fbb2a0791863540c4e31cda14ac2e41de14e9344b1c",
  "imagenes/cartas/carta-005.webp": "abb10a45c8309ef0b1498e3fe6d06967f7a3a3b67e43719afebd8afca9107875",
  "imagenes/cartas/carta-006.webp": "8445bbc7afc88dc0192e762cf65e08a592e0bbffeb1a8e338f2cadd16393379a",
  "imagenes/cartas/carta-007.webp": "31891137da07a560cde6c30b47344dc9802348918a585bb06b0b31e5110e5c47",
  "imagenes/cartas/carta-008.webp": "092d661d12de2720393b0fd3e51063ad301f2f77734aff8fdd943b7fca8f60a1",
  "imagenes/cartas/carta-009.webp": "223fa8e9046e2569a71729b82eb53c34a3a39398b0ae5c6e648f14d96080a10b",
  "imagenes/cartas/carta-010.webp": "fef2ed7568e218c70f76004b99f07e05d828875d48f6b4093f1f899d7457d776",
  "imagenes/cartas/carta-011.webp": "83ff4dbf9ed6435cfcfd6a75f6d1eda01e61eb30e03c92f53bf1f9e600bb5332",
  "imagenes/cartas/carta-012.webp": "9cb6dbc4d2b5f0c90355f463d34e862decfa60ce957a67d37d1214c6f63666f4",
  "imagenes/cartas/carta-013.webp": "0967cc21668bd4b90556ea2f7106ac786dd6030f2bc54071d911651428fe4d04",
  "imagenes/cartas/carta-014.webp": "521dcc4c488834477e8c4071fe0f05b65b18086c7a9604a4bc934f72cbd8212a",
  "imagenes/cartas/carta-015.webp": "5c3b60548e29656b978c40349df1696fe8f120dace53f6db15be012683467f3c",
  "imagenes/cartas/carta-016.webp": "96223ef909808c1e432741d661b481399a9412affa232a84574584eba1bff8cf",
  "imagenes/cartas/carta-017.webp": "ab9f8593ec29fe0e3223c9fcb67669f48fb2e768114f1350e54d4880590896c7",
  "imagenes/cartas/carta-018.webp": "e4d4c7337a33e47744e019fc89c056217995634f960bb022b64417684b4ba29f",
  "imagenes/cartas/carta-019.webp": "b1bbdcb0cb90634fa9a7bd94b9582abcafa25695b56df8da9465c309ecbe4352",
  "imagenes/cartas/carta-020.webp": "e13e11f52556bc9f5b842f2def63efdee9d8c8dcd7618d95f7ce0437591666c3",
  "imagenes/cartas/carta-021.webp": "dc8689462de6ba17c2325441cdb7f38078d10115d6d4e4eb7c4799e14170aca3",
  "imagenes/cartas/carta-022.webp": "4a9ee8833c739e4f6dcaa932513acc922e0eac507d42e94ee08e50da07779872",
  "imagenes/cartas/carta-023.webp": "de47ec42e47f6fe1ee2d16a277b57d4932e3358d14414c35b15e47e629f66d4d",
  "imagenes/cartas/carta-024.webp": "944f1e2d9dc87f808333a993b0ca04862bce30b98b64739b08b0c6cc1a234344",
  "imagenes/cartas/carta-025.webp": "6ce6377f63df9253b505df64b28203536a95ed33dc37da4a3e71248f59466700",
  "imagenes/cartas/carta-026.webp": "4816a9030569afa5dc0143dee5ca5cafd7e35ecda4c098a95063de77f13cc347",
  "imagenes/cartas/carta-027.webp": "72c3f9771f6132e5e780bbb2e2292d7002b05d36400c5d8fbe5888827c3a43d1",
  "imagenes/cartas/carta-028.webp": "5dfc167da9627e8065b6bd9b0241e1602318ca073f6aa43216da054ddd7b01da",
  "imagenes/cartas/carta-029.webp": "204acaafcdd3c7d4d6dca0377467c46c1a8146edef224632293fa08c02cf4434",
  "imagenes/cartas/carta-030.webp": "87e749231c42cd28b340a78b36e8a13750f8944de3227a9c0432d5dc29ac5082",
  "imagenes/cartas/carta-031.webp": "9272589910983ef0dbcd9fb0a6b9950560eb415b45f964adb225e09ce02785f4",
  "imagenes/cartas/carta-032.webp": "ad057bb98c94bb9b13f4e982b9b91539d2a079707c1b84431af9ae63ca94016f",
  "imagenes/cartas/carta-033.webp": "ba2a573352609b43378eab75489bf65587d6d8d74de51a6c5bf5aea3476253a1",
  "imagenes/cartas/carta-034.webp": "520c71eb41e11002231399759f153a5fa011b5592fddead7f60f27882cb0b80e",
  "imagenes/cartas/carta-035.webp": "9a5c6c19fa8b2bdc13757b259b131c84b03efd3c63f506ba1f6d53ab97f3c993",
  "imagenes/cartas/carta-036.webp": "2d8c162b3172b364480f706e3b058277bd5ff487ca63d85efd2159d7c679aa19",
  "imagenes/cartas/carta-037.webp": "2f825fefce81759059dc0dd5cca6e4bba8a694e962ad9027662e035bd9bb07b9",
  "imagenes/cartas/carta-038.webp": "fb2c3c984a9dccdcfbb80b66ec7747680c11767bf3b0b1bc0014b882b59bded8",
  "imagenes/cartas/carta-039.webp": "4c36a5d3a22a4e90ab17e6fcb05a8eb3f0833cca3b1789e19ecf89fd6ee10956",
  "imagenes/cartas/carta-040.webp": "bb02be896e4afed775b332199e6e1a10a91b25376ab1726dab8c12b17589de19",
  "imagenes/cartas/carta-041.webp": "bf474e6229c71a1d5c63e3bb57dc84f9b79329d1a737739cb32767ec06e145f2",
  "imagenes/cartas/carta-042.webp": "6fd41b9856a908255864be7ec14e428e7e2bb35137710107b678de2bafb22cac",
  "imagenes/cartas/carta-043.webp": "2652d32ac52c3839478d8235432f5c13774ee8d0bfc72e71bef05a5dded30fff",
  "imagenes/cartas/carta-044.webp": "e54a823c61ff4f935cc9797a83f9ad02ee4eb926ed161093a81d4f07242fa6c4",
  "imagenes/cartas/carta-045.webp": "619a8888582e56190624012aeb687555f8f24d09c0c46e1338e98c77647618a7",
  "imagenes/cartas/carta-046.webp": "c0b662b17efca448f190995cd6b82be4a7552b3b90fab612a1a88f3b3a1ea902",
  "imagenes/cartas/carta-047.webp": "7629e12cd84a61f7570a803ddfb7b615a3592c720346c80f6e38952d04d2c837",
  "imagenes/cartas/carta-048.webp": "bbe0aa430f243f53d9aef48666fed7bd37c04d7cad1df1697cb5abb1f7b808af",
  "imagenes/cartas/carta-049.webp": "da7965f66796590605c1738015381ed57ecc319cef374656e734cce02ec29b30",
  "imagenes/cartas/carta-050.webp": "886d56c9f87389fd96cc8f3a6234e429aec7247bab2facc853a1a4fc998c5358",
  "imagenes/cartas/carta-051.webp": "df164c384e5d56c5c4150bf80190f0c87b009db58ed8c9d36b5a4a4862bb4655",
  "imagenes/cartas/carta-052.webp": "1bcbc1e08821a08e89208827b5814179854d3bf81b9bb09fca4fb3ac5285fdd0",
  "imagenes/cartas/carta-053.webp": "737920623529062b9063f3c9c10d894f443ca61bc454336819a3bb1971f0968a",
  "imagenes/cartas/carta-054.webp": "6f50ddd927c59d9259dce8ccb1839744f540843772d6d58d188a44fc2569381f",
  "imagenes/cartas/carta-055.webp": "522dd2f11cee48ce73e4ec525067af3bce8592294eb424578297965763265983",
  "imagenes/cartas/carta-056.webp": "aeb3b3cee4968f27fb7d518743a8417ac382b0eddb7e4410a85aeba7a00f74ea",
  "imagenes/cartas/carta-057.webp": "edee903e837bd23c7c51ef36b074533062e3245a8e8bdf17801ae808c0a68cc8",
  "imagenes/cartas/carta-058.webp": "85240325d84fce8b4ed0e80d1e0c576a7d2fea2ab6a30fdc8faa5dd8909d5e91",
  "imagenes/portada.webp": "a0fba2f4b38a4cffb6bd3d73cd777ea5c4fce316937747541ccb4aecf7e37805"
};
assert.equal(Object.keys(creatures).length, 61);
assert.equal(Object.keys(creatures).filter(file => file.startsWith('imagenes/')).length, 59);
for (const [file, hash] of Object.entries(creatures)) {
  const bytes = await fs.readFile('/app/barajas/criaturas-magicas/' + file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
  if (file.startsWith('imagenes/')) {
    const resource = await globalThis.fetch('http://127.0.0.1:3000/media/decks/criaturas-magicas/v2/' + file);
    assert.equal(resource.status, 200);
    assert(resource.headers.get('content-type').startsWith('image/webp'));
    assert.equal(createHash('sha256').update(globalThis.Buffer.from(await resource.arrayBuffer())).digest('hex'), hash);
  }
}
for (const [file, hash] of Object.entries({
  'baraja.json': '3e31db300c706738e69d743703f2bd1d4d027b2b08743313fe54d15eb6943e44',
  'cartas.json': 'bce5740a4ba3daf8da60ffad88a2cbc07271e95baae44bee078d0984973fa7fa'
})) assert.equal(createHash('sha256').update(await fs.readFile(`/app/barajas/sistema-solar/${file}`)).digest('hex'), hash);
console.log(JSON.stringify({ node: process.version, uid: process.getuid(), icu: process.versions.icu, unicode: process.versions.unicode, sharp: sharp.versions,
  deckHashes: expected, creaturesHashes: creatures, catalog, readonly: true }));
