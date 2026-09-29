import { describe, expect, it } from 'vitest';
import type { RoomRepository } from './ports.js';
import type { Room } from './room.js';
import { RoomUseCases } from './roomUseCases.js';

class FakeRooms implements RoomRepository {
  readonly rooms = new Map<string, Room>();
  saves = 0;
  findById(id: string) { return this.rooms.get(id); }
  findActiveByOwner(sessionId: string) { return [...this.rooms.values()].find((room) => room.hostSessionId === sessionId); }
  isCodeActive(code: string) { return [...this.rooms.values()].some((room) => room.code === code); }
  save(room: Room) { this.saves += 1; this.rooms.set(room.id, room); }
  remove(id: string) { this.rooms.delete(id); }
}

function setup(candidates: number[] = [42]) {
  const repository = new FakeRooms();
  let id = 0;
  const useCases = new RoomUseCases(repository, () => `id-${++id}`, () => candidates.shift() ?? 42);
  return { repository, useCases };
}

describe('casos de uso con puertos sustitutos', () => {
  it('E1/E2 crea valores iniciales, proyección pública copiada y sin identidad privada', () => {
    const { repository, useCases } = setup();
    const view = useCases.createOrGet('session-a');
    expect(view).toEqual({
      id: 'id-1', code: '000042', status: 'WAITING',
      participant: { id: 'id-2', name: 'Jugador 1', role: 'HOST', isPlayer: true },
      settings: { deckId: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5 }
    });
    expect(JSON.stringify(view)).not.toContain('session-a');
    view.participant.name = 'Manipulado';
    Object.assign(view.settings, { turnSeconds: 60 });
    expect(useCases.current('session-a')?.participant.name).toBe('Jugador 1');
    expect(useCases.current('session-a')?.settings.turnSeconds).toBe(30);
    expect(repository.saves).toBe(1);
  });

  it('E3 recupera por sesión y evita colisión entre sesiones', () => {
    const { repository, useCases } = setup([42, -1, 42, 43]);
    const first = useCases.createOrGet('a');
    expect(useCases.createOrGet('a').id).toBe(first.id);
    const second = useCases.createOrGet('b');
    expect(second.code).toBe('000043');
    expect(second.id).not.toBe(first.id);
    expect(repository.saves).toBe(2);
  });

  it('E4/E5 autoriza antes de validar el nombre y no muta ante rechazos', () => {
    const { repository, useCases } = setup();
    const first = useCases.createOrGet('a');
    expect(() => useCases.rename('b', first.id, '')).toThrowError('No tienes permiso');
    expect(() => useCases.rename('a', first.id, '')).toThrowError('El nombre debe');
    expect(repository.saves).toBe(1);
    const changed = useCases.rename('a', first.id, ' Ana María ');
    expect(changed.participant.name).toBe('Ana María');
    expect(changed.participant.id).toBe(first.participant.id);
    expect(changed.code).toBe(first.code);
    expect(useCases.current('a')?.participant.name).toBe('Ana María');
    expect(() => useCases.close('b', first.id)).toThrowError('No tienes permiso');
    expect(repository.rooms.size).toBe(1);
  });

  it('E6 cierra, elimina la asociación y permite una sala nueva', () => {
    const { repository, useCases } = setup([42, 42]);
    const first = useCases.createOrGet('a');
    useCases.close('a', first.id);
    expect(useCases.current('a')).toBeNull();
    expect(repository.rooms.size).toBe(0);
    expect(() => useCases.getOwn('a', first.id)).toThrow();
    expect(useCases.createOrGet('a').id).not.toBe(first.id);
  });

  it('agota 1.000 candidatos sin guardar sala ni índices parciales', () => {
    const repository = new FakeRooms();
    let id = 0;
    let attempts = 0;
    const useCases = new RoomUseCases(repository, () => `id-${++id}`, () => { attempts += 1; return 42; });
    useCases.createOrGet('a');
    attempts = 0;
    expect(() => useCases.createOrGet('b')).toThrowError('Ahora no se puede crear');
    expect(attempts).toBe(1000);
    expect(repository.rooms.size).toBe(1);
    expect(repository.saves).toBe(1);
    expect(useCases.current('b')).toBeNull();
  });
});
