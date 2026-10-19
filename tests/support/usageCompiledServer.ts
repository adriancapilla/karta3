import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { compiledInstallation, removeTestInstallation } from './compiledDeckServer.js';
import type { UsageEvent } from '../../server/application/usage/contracts.js';
import { randomBytes } from 'node:crypto';
import { privateDirectory } from '../../server/infrastructure/usage/privateFiles.js';

/** Instancia propia compilada y datos fabricados; mismo main/aviso, transporte/entropía/reloj normales. */
export async function usageInstallation(options: { human?: boolean } = {}) {
  const root = await compiledInstallation();
  await fs.cp(path.resolve('barajas'), path.join(root, 'barajas'), { recursive: true });
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-usage-process-'));
  let keyFile = '';
  if (options.human) {
    const secret = path.join(data, 'secret'); privateDirectory(secret, true); keyFile = path.join(secret, 'copy.key');
    await fs.writeFile(keyFile, randomBytes(32).toString('hex'), { mode: 0o600 });
  }
  await fs.writeFile(path.join(root, 'usage-process.mjs'), `import './dist-server/server/main.js';
// Solo arnés privado del ensayo, sin endpoint ni control incorporado a producto.
process.on('message', (message) => { if (message === 'test-controlled-stop') process.emit('SIGTERM'); });
`);
  const file = path.join(data, options.human ? 'pruebas' : 'test', options.human ? 'human' : 'synthetic', 'usage.sqlite');
  const start = async (enabled = true, port = 0) => {
    const child = spawn(process.execPath, ['--import', './guard.mjs', 'usage-process.mjs'], { cwd: root, windowsHide: true,
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', KARTA3_ENV: options.human ? 'pruebas' : 'test', KARTA3_USAGE_COLLECTION: enabled ? options.human ? 'human' : 'synthetic' : 'off',
        KARTA3_USAGE_DIRECTORY: data, KARTA3_USAGE_BACKUP_DIRECTORY: '', KARTA3_USAGE_BACKUP_KEY: '', KARTA3_USAGE_BACKUP_KEY_FILE: keyFile }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    let output = ''; let errors = ''; child.stderr.on('data', (chunk: Buffer) => { errors += chunk.toString(); });
    const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
    const base = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => { child.kill(); reject(new Error(`arranque propio agotado: ${errors}`)); }, 10_000);
      child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); const match = /KARTA3: (http:\/\/127\.0\.0\.1:\d+)/.exec(output);
        if (match) { clearTimeout(timer); resolve(match[1]); } });
      child.once('error', reject); child.once('exit', () => { clearTimeout(timer); reject(new Error(`arranque propio fallido: ${errors}`)); });
    });
    let stopped = false;
    return { base, child, errors: () => errors, stop: async (controlled = true) => {
      if (stopped) return; stopped = true;
      if (controlled) child.send('test-controlled-stop'); else child.kill('SIGKILL');
      const timer = setTimeout(() => child.kill('SIGKILL'), 4000); await exited; clearTimeout(timer);
    } };
  };
  const events = () => {
    const db = new DatabaseSync(file, { readOnly: true });
    try { return db.prepare('SELECT payload FROM events').all().map((row) => JSON.parse(String(row.payload)) as UsageEvent); } finally { db.close(); }
  };
  const state = () => { const db = new DatabaseSync(file, { readOnly: true }); try {
    return { subjects: db.prepare('SELECT payload FROM subjects').all().map(row => JSON.parse(String(row.payload))),
      proofs: db.prepare('SELECT * FROM usage_choice_proofs').all() };
  } finally { db.close(); } };
  return { root, data, file, start, events, state, cleanup: async () => {
    await removeTestInstallation(root);
    if (path.dirname(data) !== os.tmpdir() || !path.basename(data).startsWith('karta3-usage-process-')) throw new Error('ruta propia');
    await fs.rm(data, { recursive: true, force: true });
  } };
}
