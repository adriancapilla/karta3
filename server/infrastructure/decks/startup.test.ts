import { afterEach, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { deckFixture, writeFixture } from '../../../tests/support/deckFixtures.js';
import { prepareDecks } from './catalog.js';
import { compiledInstallation, removeTestInstallation, startCompiledDeckServer } from '../../../tests/support/compiledDeckServer.js';
import { approvedGeneric } from '../../../tests/support/approvedGeneric.js';

let root: string;
let stop: (() => Promise<void>) | undefined;
beforeEach(async () => { root = await compiledInstallation(); });
afterEach(async () => { await stop?.(); stop = undefined; await removeTestInstallation(root); });

it('AGV2-02/03 y B04-01/08 construcción real con genérica 2 aislada de ASSETS; consulta conserva instantánea', async () => {
  await expect(promisify(execFile)(process.execPath, ['--import', './guard.mjs', '--input-type=module', '-e', 'import fs from "node:fs/promises"; await fs.readFile("ASSETS/probe.json");'], { cwd: root, windowsHide: true })).rejects.toMatchObject({ stderr: expect.stringContaining('ASSETS no permitido') });
  expect(await fs.readFile(path.join(root, 'asset-access.txt'), 'utf8')).toContain('ASSETS/probe.json');
  await fs.unlink(path.join(root, 'asset-access.txt'));
  for (const name of ['server', 'src', 'shared', 'tools']) await fs.cp(path.resolve(name), path.join(root, name), { recursive: true });
  for (const name of ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.server.json', 'tsconfig.client.json', 'vite.config.ts', 'index.html']) await fs.copyFile(path.resolve(name), path.join(root, name));
  await fs.cp(path.resolve('barajas/generica'), path.join(root, 'barajas/generica'), { recursive: true });
  const npmCli = path.join(path.dirname(process.env.npm_execpath ?? path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')), 'npm-cli.js');
  const { stdout } = await promisify(execFile)(process.execPath, [npmCli, 'run', 'build'], {
    cwd: root, env: { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(path.join(root, 'guard.mjs')).href}` }, windowsHide: true,
    timeout: 60_000
  });
  expect(stdout).toContain('Catálogo preparado: 1 barajas disponibles.');
  const server = await startCompiledDeckServer(root); stop = server.stop;
  expect(await (await fetch(`${server.base}/api/decks`)).json()).toEqual({ decks: [approvedGeneric] });
  const cards = path.join(root, 'barajas/generica/cartas.json'); await fs.writeFile(cards, '{');
  await writeFixture(path.join(root, 'barajas'), deckFixture('anadida-despues', true));
  for (let index = 0; index < 3; index++) expect(await (await fetch(`${server.base}/api/decks`)).json()).toEqual({ decks: [approvedGeneric] });
  expect(await fs.readdir(root)).not.toContain('asset-access.txt');
  const bundle = (await fs.readdir(path.join(root, 'dist/assets'))).filter((name) => name.endsWith('.js'));
  for (const file of bundle) {
    const bytes = await fs.readFile(path.join(root, 'dist/assets', file), 'utf8');
    expect(bytes).not.toContain('Simbolos'); expect(bytes).not.toContain('"playValue"'); expect(bytes).not.toContain('schemaVersion');
  }
}, 60_000);

it.each(['missing', 'corrupt', 'stale', 'available-invalid', 'uncertain'])('B04-08 proceso compilado %s sale con fallo antes de escuchar', async (kind) => {
  const decks = path.join(root, 'barajas'); const f = deckFixture();
  const directory = await writeFixture(decks, f); await prepareDecks(decks);
  const catalog = path.join(decks, 'catalogo.json');
  if (kind === 'missing') await fs.unlink(catalog);
  if (kind === 'corrupt') await fs.writeFile(catalog, '{');
  if (kind === 'stale') await fs.writeFile(catalog, '{"decks":[]}\n');
  if (kind === 'available-invalid') { f.metadata.name = ''; await writeFixture(decks, f); }
  if (kind === 'uncertain') await fs.writeFile(path.join(directory, 'baraja.json'), '{');
  const code = kind === 'missing' ? 'CATALOG_MISSING' : kind === 'corrupt' ? 'CATALOG_INVALID' : kind === 'stale' ? 'CATALOG_STALE' : kind === 'uncertain' ? 'JSON_SYNTAX' : 'INVALID_VALUE';
  await expect(promisify(execFile)(process.execPath, ['--import', './guard.mjs', 'dist-server/server/main.js'], { cwd: root, env: { ...process.env, PORT: '0' }, timeout: 5000, windowsHide: true })).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining(code), stdout: expect.not.stringContaining('KARTA3: http') });
  expect(await fs.readdir(root)).not.toContain('asset-access.txt');
});
