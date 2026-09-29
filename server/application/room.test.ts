import { describe, expect, it } from 'vitest';
import { Room, normalizeName } from './room.js';

function room() { return new Room({ id: 'room-1', code: '000042', hostSessionId: 'host-1', participantId: 'player-1' }); }

describe('modelo de sala', () => {
  it('E1/E2 crea la espera con nombre provisional e IDs suministrados', () => {
    const value = room();
    expect(value.status).toBe('WAITING');
    expect(value.name).toBe('Jugador 1');
    expect(value.code).toBe('000042');
    expect(value.hostSessionId).toBe('host-1');
    expect(value.settings).toEqual({ deckId: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5 });
  });

  it('E4 recorta y valida grafemas sin alterar identidad ni nombre ante rechazo', () => {
    const value = room();
    value.rename('  Ana María  ');
    expect(value.name).toBe('Ana María');
    expect(value.participantId).toBe('player-1');
    value.rename('👩‍👩‍👧‍👧'.repeat(16));
    expect(value.name).toBe('👩‍👩‍👧‍👧'.repeat(16));
    for (const invalid of ['', ' '.repeat(3), 'a'.repeat(17), 'Ana\nMaría', 'a\u0000b', '\u200B']) {
      expect(() => value.rename(invalid)).toThrow();
    }
    expect(value.name).toBe('👩‍👩‍👧‍👧'.repeat(16));
    expect(normalizeName('  A 😊  ')).toBe('A 😊');
  });

  it('E6 cierra y rechaza cambios posteriores', () => {
    const value = room();
    value.close();
    expect(value.status).toBe('CLOSED');
    expect(() => value.rename('Otro')).toThrow();
    expect(() => value.close()).toThrow();
  });
});
