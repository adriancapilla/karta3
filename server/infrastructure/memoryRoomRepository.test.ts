import { describe, expect, it } from 'vitest';
import { Room } from '../application/room.js';
import { MemoryRoomRepository } from './memoryRoomRepository.js';
const now = { monotonic: 0, unix: 0 };

function room(id: string, owner: string, code: string) {
  return new Room({ id, hostSessionId: owner, code, participantId: `${id}-participant`, now, connected: true });
}

describe('repositorio de salas en memoria', () => {
  it('mantiene índices y los libera al borrar, sin compartir instancias', () => {
    const first = new MemoryRoomRepository();
    const second = new MemoryRoomRepository();
    const value = room('room-a', 'owner-a', '000042');
    first.save(value);
    expect(first.findById(value.id)).toBe(value);
    expect(first.findActiveByOwner('owner-a')).toBe(value);
    expect(first.isCodeActive('000042')).toBe(true);
    expect(second.findById(value.id)).toBeUndefined();
    first.remove(value.id);
    expect(first.findById(value.id)).toBeUndefined();
    expect(first.findActiveByOwner('owner-a')).toBeUndefined();
    expect(first.isCodeActive('000042')).toBe(false);
    first.save(room('room-b', 'owner-a', '000042'));
    expect(first.findActiveByOwner('owner-a')?.id).toBe('room-b');
  });

  it('rechaza índices de propietario o código incompatibles', () => {
    const repository = new MemoryRoomRepository();
    repository.save(room('room-a', 'owner-a', '000042'));
    expect(() => repository.save(room('room-b', 'owner-a', '000043'))).toThrow();
    expect(() => repository.save(room('room-c', 'owner-c', '000042'))).toThrow();
    expect(repository.findById('room-b')).toBeUndefined();
    expect(repository.findById('room-c')).toBeUndefined();
  });

  it.each([
    ['propietario', 'owner-b', '000042'],
    ['código', 'owner-a', '000043']
  ])('rechaza cambiar el %s de una sala existente y libera sus índices al borrar', (_field, owner, code) => {
    const repository = new MemoryRoomRepository();
    const original = room('room-a', 'owner-a', '000042');
    repository.save(original);

    expect(() => repository.save(room('room-a', owner, code))).toThrow('Índices de sala incompatibles.');
    expect(repository.findById('room-a')).toBe(original);
    expect(repository.findActiveByOwner('owner-a')).toBe(original);
    expect(repository.findActiveByOwner('owner-b')).toBeUndefined();
    expect(repository.isCodeActive('000042')).toBe(true);
    expect(repository.isCodeActive('000043')).toBe(false);

    repository.remove('room-a');
    expect(repository.findById('room-a')).toBeUndefined();
    expect(repository.findActiveByOwner('owner-a')).toBeUndefined();
    expect(repository.findActiveByOwner('owner-b')).toBeUndefined();
    expect(repository.isCodeActive('000042')).toBe(false);
    expect(repository.isCodeActive('000043')).toBe(false);

    repository.save(room('room-b', 'owner-a', '000042'));
    repository.save(room('room-c', 'owner-b', '000043'));
    expect(repository.findActiveByOwner('owner-a')?.id).toBe('room-b');
    expect(repository.findActiveByOwner('owner-b')?.id).toBe('room-c');
  });

  it('indexa invitados, libera una salida y limpia todas las asociaciones al cerrar', () => {
    const repository = new MemoryRoomRepository();
    const value = room('room-a', 'owner-a', '000042');
    repository.save(value);
    value.join('guest-a', 'participant-a', 'Ana', now, true);
    value.join('guest-b', 'participant-b', 'Berta', now, true);
    repository.save(value);
    expect(repository.findActiveBySession('guest-a')).toBe(value);
    expect(repository.findActiveByCode('000042')).toBe(value);
    value.leave('guest-a', 'participant-a', now);
    repository.save(value);
    expect(repository.findActiveBySession('guest-a')).toBeUndefined();
    expect(repository.findActiveBySession('guest-b')).toBe(value);
    repository.remove(value.id);
    expect(repository.findActiveBySession('owner-a')).toBeUndefined();
    expect(repository.findActiveBySession('guest-b')).toBeUndefined();
    expect(repository.findActiveByCode('000042')).toBeUndefined();
    repository.save(room('room-b', 'guest-b', '000042'));
    expect(repository.findActiveBySession('guest-b')?.id).toBe('room-b');
  });
});
