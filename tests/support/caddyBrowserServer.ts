/** Ensayo externo al producto: Caddy real portable, TLS local, sin instalar su CA. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:net';
import https from 'node:https';
import { spawn, execFile, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

const binary = process.env.CADDY_BINARY;
if (!binary) throw new Error('Indica CADDY_BINARY: no se descarga ni instala automáticamente.');
const root = process.cwd(); const reportRoot = path.join(root, 'playwright-report/empaquetado');
await fs.mkdir(reportRoot, { recursive: true });
const dir = await fs.mkdtemp(path.join(reportRoot, 'caddy-check-'));
const children: ChildProcess[] = [];
const evidence: Record<string, unknown> = { started: new Date().toISOString(), node: process.version, executable: process.execPath, dir };
const stop = async () => {
  for (const child of children.reverse()) {
    if (child.exitCode !== null) continue;
    const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
    child.kill(); await exited;
  }
  evidence.stopped = new Date().toISOString();
  await fs.writeFile(path.join(dir, 'status.json'), JSON.stringify(evidence, null, 2) + '\n');
};
try {
  for (const port of [3080, 3443]) {
    const probe = createServer();
    await new Promise<void>((resolve, reject) => { probe.once('error', reject); probe.listen(port, '127.0.0.1', resolve); });
    await new Promise<void>((resolve) => probe.close(() => resolve()));
  }
  const version = await promisify(execFile)(binary, ['version'], { windowsHide: true }); evidence.caddy = version.stdout.trim();
  // Validate no inicia el servidor ni solicita certificados públicos.
  const validate = await promisify(execFile)(binary, ['validate', '--config', path.join(root, 'deploy/Caddyfile'), '--adapter', 'caddyfile'], {
    windowsHide: true, env: { ...process.env, KARTA3_DOMAIN: 'pruebas.karta3.com', XDG_CONFIG_HOME: path.join(dir, 'config'), XDG_DATA_HOME: path.join(dir, 'data') }
  });
  await fs.writeFile(path.join(dir, 'production-validation.log'), validate.stdout + validate.stderr); evidence.productionConfigurationValidated = true;
  const app = spawn(process.execPath, ['dist-server/server/main.js'], {
    cwd: root, windowsHide: true, env: { ...process.env, HOST: '127.0.0.1', PORT: '0', NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe']
  }); children.push(app);
  let output = ''; app.stderr!.on('data', (data: Buffer) => { void fs.appendFile(path.join(dir, 'app.log'), data); });
  const upstream = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No arrancó APP compilada')), 10_000);
    app.once('error', reject); app.once('exit', () => reject(new Error('APP terminó antes de estar lista')));
    app.stdout!.on('data', (data: Buffer) => {
      output += data.toString(); void fs.appendFile(path.join(dir, 'app.log'), data);
      const match = /KARTA3: http:\/\/(127\.0\.0\.1:\d+)/.exec(output);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const production = await fs.readFile(path.join(root, 'deploy/Caddyfile'), 'utf8');
  // Solo diferencias de montaje: puertos/origen local, destino y almacenamiento/CA de prueba.
  const configuration = production.replace('admin off', `admin off\n    http_port 3080\n    skip_install_trust\n    persist_config off\n    storage file_system {\n        root "${path.join(dir, 'data').replaceAll('\\', '/')}"\n    }`);
  const file = path.join(dir, 'Caddyfile'); await fs.writeFile(file, configuration);
  const caddy = spawn(binary, ['run', '--config', file, '--adapter', 'caddyfile'], {
    windowsHide: true, env: { ...process.env, KARTA3_DOMAIN: 'localhost:3443', KARTA3_UPSTREAM: upstream }, stdio: ['ignore', 'pipe', 'pipe']
  }); children.push(caddy);
  for (const stream of [caddy.stdout!, caddy.stderr!]) stream.on('data', (data: Buffer) => { void fs.appendFile(path.join(dir, 'caddy.log'), data); });
  const status = () => new Promise<number>((resolve, reject) => {
    const req = https.get('https://localhost:3443/api/decks', { rejectUnauthorized: false }, (res) => { res.resume(); resolve(res.statusCode!); });
    req.setTimeout(1000, () => req.destroy(new Error('Timeout del ensayo'))); req.once('error', reject);
  });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (app.exitCode !== null || caddy.exitCode !== null) throw new Error('Terminó un proceso del ensayo');
    try { if (await status() === 200) { ready = true; break; } } catch { /* Esperar solo procesos propios. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Caddy no atendió el catálogo');
  evidence.ready = new Date().toISOString(); evidence.upstream = upstream; evidence.appPid = app.pid; evidence.caddyPid = caddy.pid;
  await fs.writeFile(path.join(dir, 'status.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log('CADDY_TEST_READY https://localhost:3443 HTTP http://localhost:3080 ' + dir);
  process.stdin.setEncoding('utf8'); process.stdin.resume();
  await new Promise<void>((resolve) => {
    process.stdin.on('data', (data: string) => { if (data.includes('q')) resolve(); });
    process.once('SIGINT', resolve); process.once('SIGTERM', resolve);
  });
  process.stdin.pause();
} finally { await stop(); }
