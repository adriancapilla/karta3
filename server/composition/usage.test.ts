import { afterEach, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import request from 'supertest';
import { createUsageRuntime, usageMode } from './usage.js';
import { createApp } from './createApp.js';
import { privateDirectory, readPrivateUsageKey } from '../infrastructure/usage/privateFiles.js';
import { SqliteUsageStore } from '../infrastructure/usage/sqliteStore.js';

const roots: string[] = [];
const runtimes: Awaited<ReturnType<typeof createUsageRuntime>>[] = [];
afterEach(async () => {
  for (const runtime of runtimes.splice(0)) await runtime.close();
  vi.unstubAllEnvs(); vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b19-config-')) throw new Error('ruta propia');
    fs.rmSync(root, { recursive: true, force: true });
  }
});
function setup(mode = 'human') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-b19-config-')); roots.push(root);
  const secret = path.join(root, 'secret'); privateDirectory(secret, true);
  const file = path.join(secret, 'copy.key'); fs.writeFileSync(file, randomBytes(32).toString('hex'), { mode: 0o600 });
  vi.stubEnv('KARTA3_ENV', 'pruebas'); vi.stubEnv('KARTA3_USAGE_COLLECTION', mode);
  vi.stubEnv('KARTA3_USAGE_DIRECTORY', path.join(root, 'data')); vi.stubEnv('KARTA3_USAGE_BACKUP_KEY_FILE', file);
  vi.stubEnv('KARTA3_USAGE_BACKUP_KEY', '');
  return { root, key: file, db: path.join(root, 'data', 'pruebas', 'human', 'usage.sqlite') };
}
async function runtime(complete = true) { const value = await createUsageRuntime(complete); runtimes.push(value); return value; }
for (const [mode, environment, expected] of [
  [undefined, undefined, 'off'], ['off', 'production', 'off'], ['synthetic', 'test', 'synthetic'], ['human', 'pruebas', 'human'],
  ['human', 'test', undefined], ['human', 'production', undefined], ['human', 'development', undefined],
  ['synthetic', 'pruebas', undefined], ['', 'pruebas', undefined], ['HUMAN', 'pruebas', undefined], ['unknown', 'pruebas', undefined]
] as const) it(`matriz exacta ${String(mode)}/${String(environment)}`, () => { expect(usageMode(mode, environment)).toBe(expected); });

it('HUMAN fabricado: solo ready efectivo, metadata HUMAN/pruebas, copia cifrada y los mismos DTO', async () => {
  const fixture = setup(); const usage = await runtime(); expect(usage.http?.enabled).toBe(true); expect(usage.http?.mode).toBe('human');
  const browser = { eventId: randomUUID(), version: 1 as const, visitId: randomUUID(), name: 'home_viewed' as const,
    data: { viewId: randomUUID(), navigation: 'DOCUMENT_INITIAL' as const } };
  expect(usage.recorder.browser(browser)).toBe(true);
  const app = createApp({ usage: usage.recorder, usageHttp: usage.http });
  const response = await request(app).get('/api/rooms/current'); expect(response.headers['x-karta3-usage-collection']).toBe('human');
  expect(response.headers['cache-control']).toBe('no-store');
  await usage.close();
  const db = new DatabaseSync(fixture.db, { readOnly: true });
  const events = db.prepare('SELECT payload FROM events').all().map(row => JSON.parse(String(row.payload)));
  expect(events).toMatchObject([{ traffic: 'HUMAN', environment: 'pruebas', name: 'home_viewed' }]);
  db.close(); expect(fs.readdirSync(path.join(path.dirname(fixture.db), 'backups')).filter(name => name.endsWith('.agg.enc'))).toHaveLength(1);
});
it('sin información final o clave válida no fabrica un archivo nuevo ni acepta literal para HUMAN', async () => {
  const fixture = setup(); const warnings = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect((await runtime(false)).http).toBeUndefined(); expect(fs.existsSync(fixture.db)).toBe(false);
  vi.stubEnv('KARTA3_USAGE_BACKUP_KEY_FILE', ''); vi.stubEnv('KARTA3_USAGE_BACKUP_KEY', randomBytes(32).toString('hex'));
  expect((await runtime()).http).toBeUndefined(); expect(fs.existsSync(fixture.db)).toBe(false);
  vi.stubEnv('KARTA3_USAGE_BACKUP_KEY_FILE', fixture.key); fs.writeFileSync(fixture.key, 'invalid');
  expect((await runtime()).http).toBeUndefined(); expect(fs.existsSync(fixture.db)).toBe(false);
  expect(warnings.mock.calls.flat().every(value => /^USAGE_[A-Z_]+$/.test(String(value)))).toBe(true);
});
it('clave exige archivo privado; heredado/abierto se rechaza sin revelar el contenido', () => {
  const fixture = setup(); expect(readPrivateUsageKey(fixture.key)).toMatch(/^[a-f0-9]{64}$/);
  const open = path.join(fixture.root, 'public.key'); fs.writeFileSync(open, randomBytes(32).toString('hex'), { mode: 0o644 });
  expect(() => readPrivateUsageKey(open)).toThrow('NOT_AUTHORIZED');
});
it('clave ausente/incorrecta impide captura pero conserva mantenimiento del histórico existente', async () => {
  const fixture = setup(); privateDirectory(path.dirname(fixture.db), true);
  const prior = new SqliteUsageStore(fixture.db, 'pruebas', Date.now() - 91 * 86_400_000, undefined, 'HUMAN', false); prior.close();
  vi.stubEnv('KARTA3_USAGE_BACKUP_KEY_FILE', path.join(fixture.root, 'missing.key'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const usage = await runtime(); expect(usage.http).toBeUndefined(); await usage.close();
  const db = new DatabaseSync(fixture.db, { readOnly: true }); const metadata = JSON.parse(String(db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)); db.close();
  expect(metadata.collectionEnabled).toBe(false); expect(metadata.lastMaintenanceAt).toBeGreaterThan(Date.now() - 10_000);
});
it('OFF sin histórico no crea DB; corrupta no se reemplaza ni habilita', async () => {
  const fixture = setup('off'); expect((await runtime()).http).toBeUndefined(); expect(fs.existsSync(fixture.db)).toBe(false);
  privateDirectory(path.dirname(fixture.db), true); fs.writeFileSync(fixture.db, 'NOT SQLITE');
  vi.stubEnv('KARTA3_USAGE_COLLECTION', 'human'); vi.spyOn(console, 'error').mockImplementation(() => {});
  expect((await runtime()).http).toBeUndefined(); expect(fs.readFileSync(fixture.db, 'utf8')).toBe('NOT SQLITE');
});
it('segundo escritor rechazado no roba lease ni modifica el modo efectivo del primero', async () => {
  setup(); vi.spyOn(console, 'error').mockImplementation(() => {});
  const first = await runtime(); expect(first.http?.enabled).toBe(true);
  const second = await runtime(); expect(second.http).toBeUndefined(); expect(first.http?.enabled).toBe(true);
});
it('metadata de otro entorno se rechaza sin convertirla en HUMAN/pruebas', async () => {
  const fixture = setup(); privateDirectory(path.dirname(fixture.db), true);
  const prior = new SqliteUsageStore(fixture.db, 'production', Date.now(), undefined, 'HUMAN', false); prior.close();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect((await runtime()).http).toBeUndefined();
  const db = new DatabaseSync(fixture.db, { readOnly: true });
  expect(JSON.parse(String(db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)).environment).toBe('production'); db.close();
});
