import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

export async function removeTestInstallation(root: string) {
  const absolute = path.resolve(root);
  if (path.dirname(absolute) !== path.resolve(os.tmpdir()) || !path.basename(absolute).startsWith('karta3-b04-')) throw new Error('Carpeta de prueba fuera del destino previsto');
  await fs.rm(absolute, { recursive: true, force: true });
}

/** Árbol de ejecución independiente: solo APP y dependencias instaladas, sin ASSETS/PRODUCTO/TFM. */
export async function compiledInstallation() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-install-'));
  await fs.cp(path.resolve('dist-server'), path.join(root, 'dist-server'), { recursive: true });
  await fs.cp(path.resolve('dist'), path.join(root, 'dist'), { recursive: true });
  await fs.mkdir(path.join(root, 'barajas'));
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}\n');
  await fs.symlink(path.resolve('node_modules'), path.join(root, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  // Guard real en procesos separados: cualquier acceso a ASSETS/PRODUCTO falla y queda registrado.
  await fs.writeFile(path.join(root, 'guard.mjs'), `
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const write = fs.appendFileSync.bind(fs);
const log = new URL('./asset-access.txt', import.meta.url);
function guarded(original) {
  return function (target, ...args) {
    const blocked = /(?:^|[/\\\\])(ASSETS|PRODUCTO)(?:[/\\\\]|$)/i.exec(String(target));
    if (blocked) {
      write(log, String(target) + '\\n'); throw new Error(blocked[1].toUpperCase() + ' no permitido en esta prueba');
    }
    return original.call(this, target, ...args);
  };
}
for (const name of ['readFileSync','readdirSync','realpathSync','openSync']) {
  const original = fs[name];
  const wrapped = guarded(original);
  if (name === 'realpathSync') wrapped.native = guarded(original.native);
  fs[name] = wrapped;
}
for (const name of ['readFile','readdir','realpath','open']) fs.promises[name] = guarded(fs.promises[name]);
syncBuiltinESMExports();
`);
  return root;
}

export async function startCompiledDeckServer(root: string, port = 0, options: { host?: string; production?: boolean } = {}) {
  const environment: NodeJS.ProcessEnv = { ...process.env, PORT: String(port), NODE_ENV: options.production ? 'production' : 'test' };
  if (options.host === undefined) delete environment.HOST;
  else environment.HOST = options.host;
  // Playwright fija FORCE_COLOR y hereda NO_COLOR: evitar el aviso de flags contradictorios en el hijo.
  delete environment.FORCE_COLOR;
  const child = spawn(process.execPath, ['--import', './guard.mjs', 'dist-server/server/main.js'], { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; let errors = '';
  child.stderr.on('data', (data: Buffer) => { errors += data.toString(); });
  const exited = new Promise<number | null>((resolve) => child.once('exit', resolve));
  const base = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => { child.kill(); reject(new Error(`Arranque agotado: ${output} ${errors}`)); }, 10_000);
    child.stdout.on('data', (data: Buffer) => {
      output += data.toString();
      const url = /KARTA3: (http:\/\/(?:127\.0\.0\.1|0\.0\.0\.0):\d+)/.exec(output)?.[1];
      if (url) { clearTimeout(timeout); resolve(url.replace('0.0.0.0', '127.0.0.1')); }
    });
    child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Arranque fallido ${code}: ${output} ${errors}`)); });
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
  });
  return { base, child, output: () => output, errors: () => errors,
    stop: async () => { if (child.exitCode === null) child.kill(); await exited; } };
}
