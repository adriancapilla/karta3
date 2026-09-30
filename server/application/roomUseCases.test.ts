import { describe, expect, it, vi } from 'vitest';
import type { RequestRecord, RoomChanges, RoomRepository, RoomRequests } from './ports.js';
import type { Room } from './room.js';
import { RoomUseCases } from './roomUseCases.js';
import { WaitingLifecycle } from './waitingLifecycle.js';
import { ControlledTime } from '../../tests/support/controlledTime.js';

class FakeRooms implements RoomRepository {
  readonly rooms = new Map<string, Room>();
  saves = 0;
  allActive() { return [...this.rooms.values()]; }
  findById(id: string) { return this.rooms.get(id); }
  findActiveByOwner(sessionId: string) { return [...this.rooms.values()].find((room) => room.hostSessionId === sessionId); }
  findActiveBySession(sessionId: string) { return [...this.rooms.values()].find((room) => room.participantFor(sessionId)); }
  findActiveByCode(code: string) { return [...this.rooms.values()].find((room) => room.code === code); }
  isCodeActive(code: string) { return [...this.rooms.values()].some((room) => room.code === code); }
  save(room: Room) { this.saves += 1; this.rooms.set(room.id, room); }
  remove(id: string) { this.rooms.delete(id); }
}

class FakeRequests implements RoomRequests {
  readonly data = new Map<string, RequestRecord>();
  get(sessionId: string, requestId: string) { return this.data.get(`${sessionId}:${requestId}`); }
  save(sessionId: string, requestId: string, record: RequestRecord) { this.data.set(`${sessionId}:${requestId}`, record); }
}

const changes: RoomChanges = { updated() {}, left() {}, closed() {} };
function lifecycle(repository: RoomRepository, events: RoomChanges) {
  const time = new ControlledTime();
  return new WaitingLifecycle(repository, time, time, { isConnected: () => true },
    { getEnd: () => undefined, saveEnd() {}, clearEnd() {} }, events);
}

function setup(candidates: number[] = [42]) {
  const repository = new FakeRooms();
  const requests = new FakeRequests();
  const events = { updated: vi.fn(), left: vi.fn(), closed: vi.fn() };
  let id = 0;
  const useCases = new RoomUseCases(repository, () => `id-${++id}`, () => candidates.shift() ?? 42, requests, lifecycle(repository, events));
  return { repository, requests, events, useCases };
}

describe('casos de uso con puertos sustitutos', () => {
  it('E1/E2 crea valores iniciales, proyección pública copiada y sin identidad privada', () => {
    const { repository, useCases } = setup();
    const view = useCases.createOrGet('session-a');
    expect(view).toEqual({
      id: 'id-1', code: '000042', status: 'WAITING',
      revision: 1,
      participant: { id: 'id-2', name: 'Jugador 1', role: 'HOST', isPlayer: true, presence: 'CONNECTED' },
      participants: [{ id: 'id-2', name: 'Jugador 1', role: 'HOST', isPlayer: true, presence: 'CONNECTED' }],
      lifecycle: { serverNow: 1_800_000_000_000, expiresAt: 1_800_001_800_000, warning: false },
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
    const useCases = new RoomUseCases(repository, () => `id-${++id}`, () => { attempts += 1; return 42; }, new FakeRequests(), lifecycle(repository, changes));
    useCases.createOrGet('a');
    attempts = 0;
    expect(() => useCases.createOrGet('b')).toThrowError('Ahora no se puede crear');
    expect(attempts).toBe(1000);
    expect(repository.rooms.size).toBe(1);
    expect(repository.saves).toBe(1);
    expect(useCases.current('b')).toBeNull();
  });

  it('B02 recupera invitado, rechaza otra sala y deduplica entrada y salida sin reincorporación', () => {
    const { useCases, events } = setup([42, 43]);
    const room = useCases.createOrGet('host');
    const another = useCases.createOrGet('other-host');
    const joined = useCases.join('guest', 'join-1', room.code, 'Ana');
    expect(joined.participant).toMatchObject({ name: 'Ana', role: 'GUEST' });
    expect(joined.participants.map((person) => person.role)).toEqual(['GUEST', 'HOST']);
    expect(useCases.current('guest')?.participant.id).toBe(joined.participant.id);
    expect(useCases.join('guest', 'join-1', room.code, 'Ana').revision).toBe(joined.revision);
    expect(useCases.join('guest', 'join-2', room.code, 'Otro').participant.name).toBe('Ana');
    expect(() => useCases.join('guest', 'join-3', another.code, 'Ana')).toThrowError('Ya estás en una sala');
    expect(() => useCases.createOrGet('guest')).toThrowError('Ya estás en una sala');
    expect(() => useCases.join('guest', 'join-1', another.code, 'Ana')).toThrowError('Esta solicitud ya se utilizó');
    expect(events.updated).toHaveBeenCalledTimes(3);

    useCases.leave('guest', 'leave-1', room.id, joined.participant.id);
    expect(useCases.current('guest')).toBeNull();
    useCases.leave('guest', 'leave-1', room.id, joined.participant.id);
    expect(events.left).toHaveBeenCalledTimes(1);
    expect(() => useCases.join('guest', 'join-1', room.code, 'Ana')).toThrowError('Esa participación ya terminó');
    const rejoined = useCases.join('guest', 'join-4', room.code, 'Ana');
    expect(rejoined.participant.id).not.toBe(joined.participant.id);
    useCases.leave('guest', 'leave-1', room.id, joined.participant.id);
    expect(useCases.current('guest')?.participant.id).toBe(rejoined.participant.id);
    expect(events.left).toHaveBeenCalledTimes(1);
  });

  it('B02 no muta ni notifica al rechazar nombre, permiso o sala llena', () => {
    const { useCases, events } = setup();
    const room = useCases.createOrGet('host');
    const joined = useCases.join('guest', 'join', room.code, 'Ana');
    for (let i = 0; i < 3; i += 1) useCases.join(`guest-${i}`, `join-${i}`, room.code, `Persona ${i}`);
    const full = useCases.getOwn('host', room.id);
    const notifications = events.updated.mock.calls.length;
    expect(() => useCases.join('extra', 'extra', room.code, 'Extra')).toThrowError('La sala está llena');
    expect(() => useCases.rename('guest', room.id, '')).toThrow();
    expect(() => useCases.rename('outsider', room.id, '')).toThrowError('No tienes permiso');
    expect(() => useCases.close('guest', room.id)).toThrowError('No tienes permiso');
    expect(() => useCases.leave('host', 'leave', room.id, room.participant.id)).toThrowError('No tienes permiso');
    expect(useCases.getOwn('host', room.id).revision).toBe(full.revision);
    expect(useCases.current('guest')?.participant.id).toBe(joined.participant.id);
    expect(events.updated).toHaveBeenCalledTimes(notifications);
  });

  it('B02 conserva rechazo de solicitud y exige un ID nuevo para corregir datos o reintentar tras liberar plaza', () => {
    const { useCases } = setup();
    const room = useCases.createOrGet('host');
    expect(() => useCases.join('guest', 'attempt-1', '12345', 'Ana')).toThrowError('seis cifras');
    expect(() => useCases.join('guest', 'attempt-1', room.code, 'Ana')).toThrowError('ya se utilizó');
    for (let i = 0; i < 4; i += 1) useCases.join(`member-${i}`, `join-${i}`, room.code, `Miembro ${i}`);
    expect(() => useCases.join('guest', 'attempt-2', room.code, 'Ana')).toThrowError('La sala está llena');
    const first = useCases.current('member-0')!;
    useCases.leave('member-0', 'leave-0', room.id, first.participant.id);
    expect(() => useCases.join('guest', 'attempt-2', room.code, 'Ana')).toThrowError('La sala está llena');
    expect(useCases.join('guest', 'attempt-3', room.code, 'Ana').participant.name).toBe('Ana');
  });

  it('B02 crear y entrar casi simultáneamente con una sesión deja una sola asociación', async () => {
    const { useCases, repository } = setup([42, 43]);
    const target = useCases.createOrGet('host');
    const results = await Promise.allSettled([
      Promise.resolve().then(() => useCases.createOrGet('same')),
      Promise.resolve().then(() => useCases.join('same', 'join', target.code, 'Ana'))
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(repository.rooms.size).toBe(2);
    expect(useCases.current('same')).not.toBeNull();
  });

  it('B02 identifica una salida con el sufijo anterior de un nombre repetido', () => {
    const { useCases, events } = setup();
    const room = useCases.createOrGet('host');
    useCases.rename('host', room.id, 'Ana');
    const guest = useCases.join('guest', 'join', room.code, 'Ana');
    useCases.leave('guest', 'leave', room.id, guest.participant.id);
    expect(events.updated.mock.lastCall?.[1]).toMatchObject({ name: 'Ana (1)', participantId: guest.participant.id });
  });
});
