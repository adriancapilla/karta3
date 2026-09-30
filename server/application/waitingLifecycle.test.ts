import { describe, expect, it, vi } from 'vitest';
import type { ParticipationEnd } from '../../shared/contracts/room.js';
import { MemoryRoomRepository } from '../infrastructure/memoryRoomRepository.js';
import { MemoryRoomRequests } from '../infrastructure/memoryRoomRequests.js';
import { ControlledTime } from '../../tests/support/controlledTime.js';
import { RoomUseCases } from './roomUseCases.js';
import { WaitingLifecycle } from './waitingLifecycle.js';

function setup(hostConnected = true) {
  const repository = new MemoryRoomRepository();
  const time = new ControlledTime();
  const connected = new Set(hostConnected ? ['host'] : []);
  const endings = new Map<string, ParticipationEnd>();
  const ends = { getEnd: (id: string) => endings.get(id), saveEnd: (id: string, end: ParticipationEnd) => { endings.set(id, end); }, clearEnd: (id: string) => { endings.delete(id); } };
  const events = { updated: vi.fn(), left: vi.fn(), closed: vi.fn() };
  const lifecycle = new WaitingLifecycle(repository, time, time, { isConnected: (id) => connected.has(id) }, ends, events);
  let id = 0;
  const rooms = new RoomUseCases(repository, () => `id-${++id}`, () => 42, new MemoryRoomRequests(), lifecycle);
  const room = rooms.createOrGet('host');
  const connect = (session: string) => { connected.add(session); rooms.presenceChanged(session); };
  const disconnect = (session: string) => { connected.delete(session); rooms.presenceChanged(session); };
  const join = (session = 'guest', requestId = `join-${session}`) => { connect(session); return rooms.join(session, requestId, room.code, 'Ana'); };
  return { rooms, room, join, connect, disconnect, repository, time, events, endings, lifecycle };
}

describe('B03 tiempo controlado: plazos, permisos e índices', () => {
  it('B03-01 recupera a 29.999 ms la misma identidad y posición, una sola vez y sin renovar', () => {
    const { rooms, room, join, disconnect, connect, time, events } = setup();
    const guest = join();
    join('second');
    const expiry = rooms.current('host')!.lifecycle.expiresAt;
    disconnect('guest');
    const absent = rooms.current('host')!;
    expect(absent.participants[0]).toMatchObject({ id: guest.participant.id, name: 'Ana', presence: 'RECONNECTING', role: 'GUEST' });
    time.advance(29_999);
    connect('guest'); connect('guest');
    expect(rooms.current('guest')!.participant).toEqual(guest.participant);
    expect(rooms.current('guest')!.participants.map((p) => p.id)).toEqual(absent.participants.map((p) => p.id));
    expect(rooms.current('guest')!.lifecycle.expiresAt).toBe(expiry);
    expect(events.updated.mock.calls.filter((call) => call[1]?.kind === 'RECONNECTED')).toHaveLength(1);
    expect(events.updated.mock.lastCall?.[1]?.name).toBe('Ana (1)');
    expect(room.id).toBe(guest.id);
  });

  it('B03-02 vence exactamente a 30.000 aunque el callback esté retrasado; lecturas HTTP no recuperan presencia', () => {
    const { rooms, join, disconnect, connect, time, repository, events } = setup();
    const guest = join(); disconnect('guest');
    time.elapse(29_999);
    expect(rooms.resume('guest').room?.participant.presence).toBe('RECONNECTING');
    time.elapse(1); connect('guest'); connect('guest');
    expect(rooms.resume('guest')).toEqual({ room: null, ended: { roomId: guest.id, participantId: guest.participant.id, reason: 'RECONNECT_TIMEOUT' } });
    expect(repository.findActiveBySession('guest')).toBeUndefined();
    expect(events.left).toHaveBeenCalledTimes(1);
    expect(events.updated.mock.lastCall?.[1]?.kind).toBe('PRESENCE_EXPIRED');
    const calls = events.updated.mock.calls.length;
    rooms.rename('host', guest.id, 'Nuevo');
    expect(events.updated.mock.calls[calls][0].map((v: { sessionId: string }) => v.sessionId)).not.toContain('guest');
  });

  it('B03-03/11 mantiene cinco plazas durante la reserva, libera una y la reentrada tiene otra identidad después de C', () => {
    const { rooms, room, join, disconnect, time, repository } = setup();
    const guest = join(); join('two'); join('three'); join('four');
    disconnect('guest');
    const old = time.tasks.filter((t) => t.at === 30_000).at(-1)!;
    expect(() => join('C', 'full')).toThrowError('llena');
    expect(rooms.current('host')!.participants).toHaveLength(5);
    time.advance(30_000);
    join('C', 'new-C');
    const two = rooms.current('two')!;
    rooms.leave('two', 'leave-two', room.id, two.participant.id);
    const rejoined = join('guest', 'new-guest');
    expect(rejoined.participant.id).not.toBe(guest.participant.id);
    expect(rejoined.participants.at(-2)?.id).toBe(rejoined.participant.id);
    expect(() => rooms.join('guest', 'join-guest', room.code, 'Ana')).toThrowError('ya terminó');
    old.callback();
    expect(repository.findActiveBySession('guest')?.participantFor('guest')?.id).toBe(rejoined.participant.id);
  });

  it('B03-04 la actividad ajena no prolonga la ausencia del anfitrión ni transfiere permisos', () => {
    const { rooms, room, join, disconnect, time, events, repository } = setup();
    join(); disconnect('host'); time.advance(29_000);
    rooms.rename('guest', room.id, 'Berta'); join('other');
    expect(() => rooms.close('guest', room.id)).toThrowError('permiso');
    time.advance(1000);
    expect(events.closed).toHaveBeenCalledTimes(1);
    expect(events.closed.mock.lastCall?.[3]).toBe('HOST_DISCONNECTED');
    expect(repository.allActive()).toHaveLength(0);
    expect(rooms.resume('guest').ended?.reason).toBe('HOST_DISCONNECTED');
    expect(() => rooms.rename('guest', room.id, 'Tarde')).toThrowError('disponible');
    expect(() => join('late')).toThrowError('disponible');
  });

  it('B03-06 salida/cierre explícitos cancelan recursos y desconexiones posteriores no los recrean', () => {
    const { rooms, room, join, disconnect, time, events } = setup();
    const guest = join(); disconnect('guest');
    rooms.leave('guest', 'leave', room.id, guest.participant.id);
    disconnect('guest');
    expect(time.pending).toBe(2);
    disconnect('host'); rooms.close('host', room.id); disconnect('host');
    expect(time.pending).toBe(0);
    for (const task of time.tasks) task.callback();
    expect(events.closed).toHaveBeenCalledTimes(1);
    expect(events.left).toHaveBeenCalledTimes(1);
    expect(rooms.resume('guest')).toEqual({ room: null });
  });

  it('B03-07 margen inicial desde creación y primera conexión sin aviso de recuperación', () => {
    const value = setup(false);
    expect(value.room.participant.presence).toBe('RECONNECTING');
    value.time.advance(29_999); value.connect('host'); value.time.advance(1);
    expect(value.rooms.current('host')?.id).toBe(value.room.id);
    expect(value.events.updated.mock.calls.some((call) => call[1]?.kind === 'RECONNECTED')).toBe(false);
    const expired = setup(false); expired.time.advance(30_000);
    expect(expired.rooms.resume('host').ended?.reason).toBe('HOST_DISCONNECTED');
    const previous = setup(); previous.time.advance(30_000);
    expect(previous.rooms.current('host')?.participant.presence).toBe('CONNECTED');
  });

  it('B03-08 aviso único al minuto 29 y cierre al 30 con todas las conexiones abiertas', () => {
    const { rooms, join, time, events, repository } = setup(); join();
    time.advance(29 * 60_000 - 1);
    expect(rooms.current('host')!.lifecycle.warning).toBe(false);
    time.advance(1);
    const revision = rooms.current('host')!.revision;
    expect(rooms.current('guest')!.lifecycle.warning).toBe(true);
    rooms.resume('guest');
    expect(rooms.current('host')!.revision).toBe(revision);
    time.advance(60_000);
    expect(events.closed).toHaveBeenCalledTimes(1);
    expect(events.closed.mock.lastCall?.[3]).toBe('INACTIVITY');
    expect(rooms.resume('host').ended?.reason).toBe('INACTIVITY');
    expect(rooms.resume('guest').ended?.reason).toBe('INACTIVITY');
    expect(repository.findActiveByCode('000042')).toBeUndefined();
    expect(time.pending).toBe(0);
  });

  it.each(['join', 'leave', 'rename'])('B03-09 %s renueva y elimina aviso coherentemente; tareas antiguas no tienen efecto', (action) => {
    const { rooms, room, join, time } = setup(); const guest = join();
    time.advance(29 * 60_000);
    const oldTasks = [...time.tasks];
    if (action === 'join') join('new');
    if (action === 'leave') rooms.leave('guest', 'leave', room.id, guest.participant.id);
    if (action === 'rename') rooms.rename('host', room.id, 'Nuevo');
    const renewed = rooms.current('host')!;
    expect(renewed.lifecycle).toMatchObject({ warning: false, expiresAt: time.now().unix + 30 * 60_000 });
    time.elapse(60_000); for (const task of oldTasks) task.callback();
    expect(rooms.current('host')!.revision).toBe(renewed.revision);
    expect(rooms.current('host')!.lifecycle.warning).toBe(false);
  });

  it('B03-10 lecturas, creación/entrada repetida, nombre igual, rechazo y presencia no renuevan ni revisan por sí solos', () => {
    const { rooms, room, join, time, disconnect, connect } = setup(); const guest = join();
    time.advance(29 * 60_000);
    const before = rooms.current('host')!;
    rooms.createOrGet('host'); rooms.getOwn('host', room.id); rooms.resume('guest');
    rooms.join('guest', 'join-guest', room.code, 'Ana'); rooms.join('guest', 'duplicate', room.code, 'Otro');
    rooms.rename('guest', room.id, '  Ana  ');
    expect(() => rooms.rename('guest', room.id, '')).toThrow();
    expect(() => rooms.rename('outsider', room.id, 'Intruso')).toThrow();
    expect(rooms.current('host')!.revision).toBe(before.revision);
    disconnect('guest'); connect('guest'); disconnect('guest'); time.advance(30_000);
    expect(rooms.current('host')!.lifecycle.expiresAt).toBe(before.lifecycle.expiresAt);
    expect(rooms.current('host')!.lifecycle.warning).toBe(true);
    expect(rooms.resume('guest').ended?.participantId).toBe(guest.participant.id);
    time.advance(30_000); expect(rooms.current('host')).toBeNull();
  });

  it('B03-10 una salida repetida conserva su resultado sin renovar la nueva espera', () => {
    const { rooms, room, join, time } = setup(); const guest = join();
    time.advance(1000); rooms.leave('guest', 'exit', room.id, guest.participant.id);
    const expiry = rooms.current('host')!.lifecycle.expiresAt;
    time.advance(29 * 60_000);
    rooms.leave('guest', 'exit', room.id, guest.participant.id);
    expect(rooms.current('host')!.lifecycle.expiresAt).toBe(expiry);
    expect(rooms.current('host')!.lifecycle.warning).toBe(true);
  });

  it.each(['host', 'guest'])('B03-12 caducidad prevalece sobre recuperación de %s y nombre en el borde exacto con callbacks retrasados', (session) => {
    const { rooms, room, join, time, disconnect, connect, events } = setup(); join();
    time.advance(session === 'host' ? 1770_000 : 1780_000); disconnect(session);
    time.elapse(session === 'host' ? 30_000 : 20_000);
    expect(() => rooms.rename('guest', room.id, 'Tarde')).toThrowError('disponible');
    connect(session); time.advance(0);
    expect(events.closed).toHaveBeenCalledTimes(1);
    expect(events.closed.mock.lastCall?.[3]).toBe('INACTIVITY');
    expect(rooms.resume(session).ended?.reason).toBe('INACTIVITY');
  });

  it('B03-12 aplica vencimientos retrasados en orden temporal y conserva causa de invitado ya retirado', () => {
    const { rooms, join, time, disconnect } = setup(); join(); disconnect('guest');
    time.elapse(30 * 60_000);
    expect(rooms.resume('guest').ended?.reason).toBe('RECONNECT_TIMEOUT');
    expect(rooms.resume('host').ended?.reason).toBe('INACTIVITY');
  });

  it('B03-13 cada ausencia es independiente de nombres y recuperaciones; callbacks obsoletos no alteran otro código reutilizado', () => {
    const { rooms, room, join, time, disconnect, connect, repository } = setup(); const guest = join();
    disconnect('guest'); const old = time.tasks.filter((t) => t.at === 30_000).at(-1)!;
    time.advance(1000); connect('guest'); time.advance(1000); disconnect('guest');
    rooms.rename('host', room.id, 'Ana');
    time.advance(28_000); old.callback();
    expect(rooms.current('guest')!.participant.id).toBe(guest.participant.id);
    time.advance(2000); expect(rooms.current('guest')).toBeNull();
    const tasks = [...time.tasks]; rooms.close('host', room.id);
    const replacement = rooms.createOrGet('host');
    expect(replacement.code).toBe(room.code); expect(replacement.id).not.toBe(room.id);
    time.elapse(30 * 60_000); for (const task of tasks.reverse()) task.callback();
    // No consultar: la nueva sala tiene su propio vencimiento; comprobar directamente que los viejos no actuaron.
    expect(repository.findById(replacement.id)?.revision).toBe(1);
    expect(repository.findById(replacement.id)?.status).toBe('WAITING');
  });

  it('B03-14/15 estado y motivo propios, sin permisos por IDs; nueva entrada limpia únicamente su motivo', () => {
    const { rooms, room, join, time, disconnect, connect, endings } = setup(); const guest = join(); disconnect('guest');
    time.advance(30_000);
    expect(rooms.resume('outsider')).toEqual({ room: null });
    connect('outsider');
    expect(() => rooms.getOwn('outsider', room.id)).toThrowError('permiso');
    expect(() => rooms.leave('outsider', 'fake', room.id, guest.participant.id)).toThrowError('permiso');
    expect(() => rooms.rename('outsider', room.id, 'Ana')).toThrowError('permiso');
    expect(endings.get('guest')?.reason).toBe('RECONNECT_TIMEOUT');
    join('guest', 'new'); expect(endings.has('guest')).toBe(false);
    rooms.close('host', room.id);
    expect(rooms.resume('guest')).toEqual({ room: null });
  });

  it('desmontar cancela tareas y evita nuevos hechos de presencia', () => {
    const { lifecycle, time, disconnect, rooms } = setup(); const revision = rooms.current('host')!.revision;
    lifecycle.dispose(); disconnect('host');
    expect(time.pending).toBe(0);
    time.advance(30_000);
    expect(rooms.current('host')!.revision).toBe(revision);
  });
});
