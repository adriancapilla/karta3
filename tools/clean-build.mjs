import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name !== 'karta3') throw new Error('BUILD_ROOT_INVALID');
for (const name of ['dist', 'dist-server']) {
  const target = path.resolve(root, name);
  if (path.dirname(target) !== root || path.basename(target) !== name) throw new Error('BUILD_TARGET_INVALID');
  // Solo salidas generadas del producto; nunca datos, exports, copias o secretos.
  fs.rmSync(target, { recursive: true, force: true });
}
for (const name of ['tsconfig.server.tsbuildinfo', 'tsconfig.client.tsbuildinfo']) fs.rmSync(path.join(root, name), { force: true });
