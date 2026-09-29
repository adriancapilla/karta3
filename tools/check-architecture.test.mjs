import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { scanProject } from './check-architecture.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const checker = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-architecture.mjs');

function runFixture(name) {
  return spawnSync(process.execPath, [checker], { cwd: path.join(fixtures, name), encoding: 'utf8' });
}

describe('control de arquitectura', () => {
  it('rechaza una importación de tipo desde cliente hacia servidor', () => {
    const result = scanProject(path.join(fixtures, 'forbidden-type'));
    expect(result.violations.join('\n')).toMatch(/client no puede importar application/);
    const run = runFixture('forbidden-type');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/client no puede importar application/);
  });

  it('rechaza una reexportación por alias hacia servidor', () => {
    const result = scanProject(path.join(fixtures, 'forbidden-alias'));
    expect(result.violations.join('\n')).toMatch(/client no puede importar application/);
  });

  it('detecta un ciclo entre módulos locales', () => {
    const result = scanProject(path.join(fixtures, 'cycle'));
    expect(result.violations.join('\n')).toMatch(/ciclo: src[\\/]a.ts → src[\\/]b.ts → src[\\/]a.ts/);
    const run = runFixture('cycle');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/ciclo:/);
  });
});
