import { test } from 'vitest';
import assert from 'node:assert/strict';
import { verifyPackage, verifyRepository } from './publish-package-policy.mjs';

const repository = { full_name: 'adriancapilla/karta3', id: 123, private: false, visibility: 'public' };
const pkg = { visibility: 'private', repository };
test('repositorio público y paquete privado asociado por identidad', () => {
  assert.equal(verifyPackage(pkg, repository), 'api');
});
test('rechaza un paquete público incluso con asociación correcta o revisión manual', () => {
  assert.throws(() => verifyPackage({ ...pkg, visibility: 'public' }, repository, true));
});
test('rechaza asociación a otro nombre o identificador', () => {
  for (const change of [{ full_name: 'otro/karta3' }, { id: 124 }]) {
    assert.throws(() => verifyPackage({ ...pkg, repository: { ...repository, ...change } }, repository, true));
  }
});
test('rechaza asociación de visibilidad inconsistente y repositorio no aprobado', () => {
  assert.throws(() => verifyPackage({ ...pkg, repository: { ...repository, private: true } }, repository));
  assert.throws(() => verifyRepository({ ...repository, private: true, visibility: 'private' }));
  assert.throws(() => verifyRepository({ ...repository, full_name: 'otro/karta3' }));
});
test('repository nulo no tiene excepción automática; exige revisión explícita', () => {
  assert.throws(() => verifyPackage({ ...pkg, repository: null }, repository));
  assert.equal(verifyPackage({ ...pkg, repository: null }, repository, true), 'github-package-settings-manual-review');
});
