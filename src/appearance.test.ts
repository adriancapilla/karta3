import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllGlobals(); });
async function fixture(value: string | null = null) {
  vi.resetModules();
  const storage = { getItem: vi.fn(() => value), setItem: vi.fn((_key: string, next: string) => { value = next; }) };
  const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } };
  vi.stubGlobal('document', { documentElement: root }); vi.stubGlobal('localStorage', storage);
  const appearance = await import('./appearance'); appearance.initializeAppearance();
  return { appearance, storage, root, writeElsewhere: (next: string | null) => { value = next; } };
}
it.each([null, 'null', 'bad', '[]', '{"version":2,"theme":"DARK"}', '{"version":1,"theme":"dark"}', '{"version":1,"theme":"DARK","origin":"EXPLICIT"}'])('registro inválido %s es LIGHT/DEFAULT sin escritura', async value => {
  const f = await fixture(value); expect(f.appearance.currentAppearance()).toMatchObject({ theme: 'LIGHT', origin: 'DEFAULT' }); expect(f.storage.setItem).not.toHaveBeenCalled();
});
it('Claro elegido y cualquier registro válido son EXPLICIT; guarda solo versión/tema', async () => {
  const f = await fixture(); f.appearance.chooseAppearance('LIGHT'); expect(f.appearance.currentAppearance().origin).toBe('EXPLICIT');
  expect(f.storage.setItem).toHaveBeenCalledWith('karta3.appearance.v1', '{"version":1,"theme":"LIGHT"}');
  const restored = await fixture('{"version":1,"theme":"DARK"}'); expect(restored.root.dataset.appearance).toBe('DARK');
  expect(restored.appearance.currentAppearance().origin).toBe('EXPLICIT');
});
it('evento antiguo relee última escritura; eliminación/registro inválido vuelven al defecto', async () => {
  const f = await fixture(); f.writeElsewhere('{"version":1,"theme":"CREAM"}'); f.appearance.appearanceStorageChanged({ key: 'karta3.appearance.v1' });
  expect(f.appearance.currentAppearance().theme).toBe('CREAM'); f.writeElsewhere(null); f.appearance.appearanceStorageChanged({ key: null });
  expect(f.appearance.currentAppearance().origin).toBe('DEFAULT');
});
it('fallo de lectura o guardado mantiene preferencia en memoria y avisa sin excepción', async () => {
  const f = await fixture(); f.storage.getItem.mockImplementation(() => { throw Error('blocked'); }); f.appearance.initializeAppearance();
  f.storage.setItem.mockImplementation(() => { throw Error('blocked'); }); f.appearance.chooseAppearance('HIGH_CONTRAST');
  expect(f.appearance.currentAppearance()).toEqual({ theme: 'HIGH_CONTRAST', origin: 'EXPLICIT', saveFailed: true });
  f.appearance.appearanceStorageChanged({ key: null }); expect(f.appearance.currentAppearance().theme).toBe('HIGH_CONTRAST');
});
