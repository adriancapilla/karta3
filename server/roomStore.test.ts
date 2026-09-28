import { describe, expect, it } from 'vitest';
import { RoomStore, normalizeName } from './roomStore.js';

describe('RoomStore', () => {
  it('E1/E2 conserva seis cifras, ceros iniciales y valores iniciales', () => {
    const store = new RoomStore(() => 42);
    const room = store.createOrGet('session-a');
    expect(room.code).toBe('000042');
    expect(room.status).toBe('WAITING');
    expect(room.participant).toMatchObject({ name: 'Jugador 1', role: 'HOST', isPlayer: true });
    expect(room.settings).toEqual({ deckId: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5 });
  });

  it('E3 devuelve una sola sala por sesión y evita códigos activos repetidos', () => {
    const codes = [42, 42, 43];
    const store = new RoomStore(() => codes.shift()!);
    const a = store.createOrGet('a');
    expect(store.createOrGet('a').id).toBe(a.id);
    const b = store.createOrGet('b');
    expect(b.id).not.toBe(a.id);
    expect(b.code).toBe('000043');
  });

  it('E4 valida grafemas y preserva identidad, código y nombre anterior ante error', () => {
    const store = new RoomStore(() => 123456);
    const first = store.createOrGet('a');
    const changed = store.rename('a', first.id, '  Ana María  ');
    expect(changed.participant.name).toBe('Ana María');
    expect(changed.participant.id).toBe(first.participant.id);
    expect(changed.code).toBe(first.code);
    expect(store.rename('a', first.id, '👩‍👩‍👧‍👧'.repeat(16)).participant.name).toBe('👩‍👩‍👧‍👧'.repeat(16));
    for (const name of ['', ' '.repeat(3), 'a'.repeat(17), 'Ana\nMaría', 'a\u0000b', '\u200B']) {
      expect(() => store.rename('a', first.id, name)).toThrow();
    }
    expect(store.current('a')?.participant.name).toBe('👩‍👩‍👧‍👧'.repeat(16));
    expect(normalizeName('  A 😊  ')).toBe('A 😊');
  });

  it('E6 borra la espera y deja crear otra', () => {
    const store = new RoomStore(() => 100000);
    const room = store.createOrGet('a');
    store.close('a', room.id);
    expect(store.current('a')).toBeNull();
    expect(() => store.getOwn('a', room.id)).toThrow();
    expect(store.createOrGet('a').id).not.toBe(room.id);
  });
});
