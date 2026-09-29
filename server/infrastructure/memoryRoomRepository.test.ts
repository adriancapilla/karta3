import { describe, expect, it } from 'vitest';
import { Room } from '../application/room.js';
import { MemoryRoomRepository } from './memoryRoomRepository.js';

function room(id: string, owner: string, code: string) {
  return new Room({ id, hostSessionId: owner, code, participantId: `${id}-participant` });
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
});
