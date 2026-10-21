import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function verifyRepository(repository) {
  assert.equal(repository.full_name, 'adriancapilla/karta3');
  assert.ok(Number.isSafeInteger(repository.id) && repository.id > 0);
  assert.equal(repository.private, false, 'El repositorio aprobado debe continuar público');
  assert.equal(repository.visibility, 'public');
}

export function verifyPackage(pkg, repository, reviewed = false) {
  verifyRepository(repository);
  assert.equal(pkg.visibility, 'private', 'GHCR debe continuar privado');
  if (pkg.repository != null) {
    assert.equal(pkg.repository.full_name, repository.full_name);
    assert.equal(pkg.repository.id, repository.id, 'La asociación debe identificar el mismo repositorio');
    assert.equal(pkg.repository.private, repository.private);
    return 'api';
  }
  assert.equal(reviewed, true, 'Repository source nulo requiere revisión explícita en Package settings');
  return 'github-package-settings-manual-review';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repository = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  verifyRepository(repository);
  if (process.argv[3]) {
    console.log(verifyPackage(JSON.parse(readFileSync(process.argv[3], 'utf8')), repository, process.argv[4] === 'true'));
  }
}
