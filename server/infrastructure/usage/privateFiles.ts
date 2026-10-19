import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { UsageError } from '../../application/usage/contracts.js';
import { randomUUID } from 'node:crypto';

/** Autorización administrativa del SO: no cookies HOST ni contraseña propia. */
export function privateDirectory(directory: string, create: boolean) {
  if (!path.isAbsolute(directory)) throw new UsageError('INVALID_FILTER');
  const existed = fs.existsSync(directory);
  if (!existed && !create) throw new UsageError('STORAGE_UNAVAILABLE');
  if (!existed) {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (process.platform === 'win32') {
      const account = execFileSync('whoami', [], { encoding: 'utf8', windowsHide: true }).trim();
      execFileSync('icacls', [directory, '/inheritance:r', '/grant:r', `${account}:(OI)(CI)F`], { windowsHide: true, stdio: 'ignore' });
    }
  }
  if (process.platform === 'win32') {
    // ACL del propio directorio: solo propietario actual, SYSTEM y administradores del sistema.
    const script = `$ErrorActionPreference='Stop'; $a=[IO.Directory]::GetAccessControl('${directory.replaceAll("'", "''")}'); $me=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value; $ok=$a.AreAccessRulesProtected; foreach($r in $a.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){if($r.AccessControlType -eq 'Allow' -and $r.IdentityReference.Value -notin @($me,'S-1-5-18','S-1-5-32-544')){$ok=$false}}; if(-not $ok){exit 1}; exit 0`;
    try { execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, stdio: 'ignore' }); }
    catch { throw new UsageError('NOT_AUTHORIZED'); }
  } else {
    const stat = fs.statSync(directory);
    if (stat.uid !== process.geteuid?.() || (stat.mode & 0o077) !== 0) throw new UsageError('NOT_AUTHORIZED');
  }
}
export function privateOutput(file: string, text: string) {
  privateDirectory(path.dirname(file), false);
  fs.writeFileSync(file, text, { flag: 'wx', mode: 0o600 });
}
/** Clave de copia por archivo privado; nunca usa el contenido como diagnóstico. */
export function readPrivateUsageKey(file: string) {
  if (!path.isAbsolute(file)) throw new UsageError('INVALID_FILTER');
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.size > 128) throw new UsageError('NOT_AUTHORIZED');
  if (process.platform === 'win32') {
    const script = `$ErrorActionPreference='Stop'; $a=[IO.File]::GetAccessControl('${file.replaceAll("'", "''")}'); $me=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value; foreach($r in $a.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){if($r.AccessControlType -eq 'Allow' -and $r.IdentityReference.Value -notin @($me,'S-1-5-18','S-1-5-32-544')){exit 1}}; exit 0`;
    try { execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, stdio: 'ignore' }); }
    catch { throw new UsageError('NOT_AUTHORIZED'); }
  } else if (stat.uid !== process.geteuid?.() || (stat.mode & 0o077) !== 0) throw new UsageError('NOT_AUTHORIZED');
  const key = fs.readFileSync(file, 'utf8').trim();
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new UsageError('INVALID_FILTER');
  return key;
}
type LeaseOwner = { pid: number; token?: string; identity?: string };
/** Un PID puede repetirse en otro contenedor. Identidad del proceso, no del visitante. */
function linuxProcessIdentity(pid: number): string | undefined {
  if (process.platform !== 'linux') return undefined;
  const boot = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  const namespace = fs.statSync(`/proc/${pid}/ns/pid`).ino;
  const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
  const start = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
  if (!/^[a-f0-9-]{36}$/.test(boot) || !Number.isSafeInteger(namespace) || !/^\d+$/.test(start)) throw new Error('LOCK_IDENTITY_UNAVAILABLE');
  return `${boot}:${namespace}:${start}`;
}
function leaseOwnerAlive(owner: LeaseOwner) {
  if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0) throw new Error('LOCK_INVALID');
  try { process.kill(owner.pid, 0); }
  catch (error) { if (error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH') return false; throw error; }
  // Compatibilidad conservadora: un lock antiguo/incompleto con PID vivo no se roba.
  if (owner.identity === undefined) return true;
  if (typeof owner.identity !== 'string' || !/^[a-f0-9-]{36}:\d+:\d+$/.test(owner.identity)) throw new Error('LOCK_INVALID');
  const current = linuxProcessIdentity(owner.pid);
  if (!current) throw new Error('LOCK_IDENTITY_UNAVAILABLE');
  return current === owner.identity;
}
export function acquirePrivateLease(lock: string, token: string = randomUUID()) {
  const identity = linuxProcessIdentity(process.pid);
  let fd: number;
  try { fd = fs.openSync(lock, 'wx', 0o600); }
  catch {
    try {
      const owner = JSON.parse(fs.readFileSync(lock, 'utf8')) as LeaseOwner;
      if (leaseOwnerAlive(owner)) throw new Error('LOCK_BUSY');
      fs.unlinkSync(lock); fd = fs.openSync(lock, 'wx', 0o600);
    } catch { throw new UsageError('STORAGE_UNAVAILABLE'); }
  }
  fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, token, ...(identity ? { identity } : {}) }));
  return () => { fs.closeSync(fd); fs.unlinkSync(lock); };
}
export async function releaseOrphanWriter(file: string, token: string) {
  const lock = path.join(path.dirname(file), '.writer.lock');
  try {
    const owner = JSON.parse(await fs.promises.readFile(lock, 'utf8')) as { token: string };
    if (owner.token === token) await fs.promises.unlink(lock);
  } catch { /* Otro propietario o ya liberado: nunca se elimina su lease. */ }
}
export function hasLiveUsageWriter(file: string) {
  try { const owner = JSON.parse(fs.readFileSync(path.join(path.dirname(file), '.writer.lock'), 'utf8')) as LeaseOwner;
    return leaseOwnerAlive(owner);
  } catch { return false; }
}
export async function withPrivateExport<T>(directory: string, action: () => Promise<T>) {
  const release = acquirePrivateLease(path.join(directory, '.report.lock'));
  try { return await action(); } finally { release(); }
}
