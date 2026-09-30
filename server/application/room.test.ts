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

  it('B02 ordena invitados antes del anfitrión, conserva identidad y revisa solo cambios efectivos', () => {
    const value = room();
    expect(value.revision).toBe(1);
    value.join('guest-a', 'player-a', 'Ana');
    value.join('guest-b', 'player-b', 'Ana');
    expect(value.participants.map((person) => person.id)).toEqual(['player-a', 'player-b', 'player-1']);
    expect(value.revision).toBe(3);
    expect(value.renameFor('guest-a', 'Ana')).toBe(false);
    expect(value.revision).toBe(3);
    expect(() => value.renameFor('guest-b', '')).toThrow();
    expect(value.renameFor('guest-b', 'Berta')).toBe(true);
    expect(value.participantFor('guest-b')).toMatchObject({ id: 'player-b', name: 'Berta' });
    expect(value.revision).toBe(4);
    expect(() => value.leave('guest-a', 'player-b')).toThrow();
    expect(value.leave('guest-a', 'player-a')).toEqual({ id: 'player-a', name: 'Ana' });
    expect(value.participants.map((person) => person.id)).toEqual(['player-b', 'player-1']);
    expect(value.revision).toBe(5);
  });

  it('B02 limita la sala a cinco y no cambia revisión ante un sexto o entrada inválida', () => {
    const value = room();
    for (let i = 0; i < 4; i += 1) value.join(`guest-${i}`, `player-${i}`, `Invitado ${i}`);
    expect(value.participants).toHaveLength(5);
    expect(value.revision).toBe(5);
    expect(() => value.join('guest-5', 'player-5', 'Otro')).toThrowError('La sala está llena');
    expect(() => value.join('guest-5', 'player-5', '')).toThrow();
    expect(value.participants).toHaveLength(5);
    expect(value.revision).toBe(5);
  });
});
