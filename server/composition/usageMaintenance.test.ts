import { expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { privateDirectory } from '../infrastructure/usage/privateFiles.js';
import { SqliteUsageStore } from '../infrastructure/usage/sqliteStore.js';

it('CLI real mantiene/purga HUMAN fabricado aun con archivo de clave incorrecto, sin capturar ni exponerlo', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-b19-maintain-'));
  if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b19-maintain-')) throw new Error('ruta propia');
  try {
    const data = path.join(root, 'data'); const directory = path.join(data, 'pruebas', 'human'); privateDirectory(directory, true);
    const file = path.join(directory, 'usage.sqlite'); const at = Date.now() - 91 * 86_400_000;
    const prior = new SqliteUsageStore(file, 'pruebas', at, undefined, 'HUMAN', false);
    prior.append([{ eventId: randomUUID(), bootRef: randomUUID(), version: 1, environment: 'pruebas', traffic: 'HUMAN',
      occurredAt: at, receivedAt: at, source: 'SERVER', name: 'room_created', data: { roomRef: randomUUID() } }]); prior.close();
    const secret = path.join(root, 'secret'); privateDirectory(secret, true); const key = path.join(secret, 'invalid.key');
    fs.writeFileSync(key, 'invalid-copy-material', { mode: 0o600 });
    const result = await promisify(execFile)(process.execPath, ['dist-server/server/composition/usageMaintenanceCli.js', 'maintain'], {
      windowsHide: true, env: { ...process.env, KARTA3_ENV: 'pruebas', KARTA3_USAGE_DIRECTORY: data,
        KARTA3_USAGE_COLLECTION: 'off', KARTA3_USAGE_BACKUP_KEY_FILE: key, KARTA3_USAGE_BACKUP_KEY: '' } });
    expect(result.stdout.trim()).toBe('USAGE_MAINTAINED'); expect(result.stderr).toContain('USAGE_BACKUP_KEY_UNAVAILABLE');
    expect(result.stderr).not.toContain('invalid-copy-material');
    const db = new DatabaseSync(file, { readOnly: true });
    expect(db.prepare('SELECT count(*) n FROM events').get()?.n).toBe(0);
    expect(Number(db.prepare('SELECT count(*) n FROM monthly').get()?.n)).toBeGreaterThan(0); db.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
