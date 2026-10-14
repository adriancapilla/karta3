import { describe, expect, it, vi } from 'vitest';
import type { ConfigurationChange } from '../../shared/contracts/room.js';
import type { DeckSummary } from '../../shared/contracts/deck.js';
import type { PublishedDeckVersions } from './deckCatalog.js';
import type { ParticipationEnd } from '../../shared/contracts/room.js';
import type { RequestRecord, RoomRepository } from './ports.js';
import type { Room } from './room.js';
import { RoomUseCases } from './roomUseCases.js';
import { WaitingLifecycle } from './waitingLifecycle.js';
import { ControlledTime } from '../../tests/support/controlledTime.js';

const summary: DeckSummary = { id: 'prueba', schemaVersion: 2, contentVersion: 7, name: 'Prueba', subtitle: '', description: 'Sintética', imageUrl: null, imageAlt: '' };
const versions: PublishedDeckVersions = { resolveVersion: (id, contentVersion) => id !== 'prueba'
  ? { ok: false, reason: 'DECK_NOT_AVAILABLE' } : contentVersion !== 7 ? { ok: false, reason: 'DECK_VERSION_MISMATCH' } : { ok: true, summary, information: { id, contentVersion, instructions: 'Instrucciones\nliterales' } } };
function setup(port = versions) {
  const data = new Map<string, Room>();
  const repository: RoomRepository = {
    allActive: () => [...data.values()], findById: (id) => data.get(id),
    findActiveByOwner: (id) => [...data.values()].find((room) => room.hostSessionId === id),
    findActiveBySession: (id) => [...data.values()].find((room) => room.participantFor(id)),
    findActiveByCode: (code) => [...data.values()].find((room) => room.code === code),
    isCodeActive: (code) => [...data.values()].some((room) => room.code === code),
    save: (room) => { data.set(room.id, room); }, remove: (id) => { data.delete(id); }
  };
  const requests = new Map<string, RequestRecord>(); const ends = new Map<string, ParticipationEnd>();
  const connected = new Set(['host', 'foreign', ...Array.from({ length: 6 }, (_, n) => `g${n}`)]);
  const events = { updated: vi.fn(), left: vi.fn(), closed: vi.fn() }; const time = new ControlledTime();
  const lifecycle = new WaitingLifecycle(repository, time, time, { isConnected: (id) => connected.has(id) },
    { getEnd: (id) => ends.get(id), saveEnd: (id, end) => { ends.set(id, end); }, clearEnd: (id) => { ends.delete(id); } }, events);
  let n = 0;
  const rooms = new RoomUseCases(repository, () => `id-${++n}`, () => n + 42,
    { get: (session, id) => requests.get(`${session}:${id}`), save: (session, id, record) => { requests.set(`${session}:${id}`, record); } }, lifecycle, port);
  const initial = rooms.createOrGet('host'); const room = data.get(initial.id)!;
  const configure = (change: ConfigurationChange, requestId = `request-${++n}`) => rooms.configure('host', requestId, room.id, change);
  const join = (guest: string) => rooms.join(guest, `join-${++n}`, room.code, 'Ana');
  return { rooms, room, initial, configure, join, time, connected, events, ends, lifecycle };
}

describe('B05 preparación con puertos sustitutos y tiempo controlado', () => {
  it('B15 controles independientes, defaults, no-op/replay/conflicto, reservas y selección conservados', () => {
    const s = setup(); s.join('g0');
    expect(s.initial.settings).toMatchObject({ attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false }); expect(s.initial.deckInformation).toBeNull();
    s.connected.delete('g0'); s.rooms.presenceChanged('g0');
    const reserve = s.room.deadlines().find(d => d.kind === 'ABSENCE'); s.time.elapse(1000);
    const first = s.configure({ field: 'attributeValueMode', value: 'DISPLAY_VALUE' }, 'mode-first');
    expect(first.settings.attributeValueMode).toBe('DISPLAY_VALUE');
    s.configure({ field: 'optimizeForMobile', value: true }); s.configure({ field: 'reviewSeconds', value: 2 });
    const current = s.configure({ field: 'attributeValueMode', value: 'PLAY_VALUE' });
    expect(current.settings).toMatchObject({ attributeValueMode: 'PLAY_VALUE', optimizeForMobile: true, reviewSeconds: 2 });
    const count = s.events.updated.mock.calls.length; s.time.elapse(1000);
    expect(s.configure({ field: 'attributeValueMode', value: 'DISPLAY_VALUE' }, 'mode-first')).toEqual(s.rooms.current('host'));
    expect(s.configure({ field: 'attributeValueMode', value: 'PLAY_VALUE' }).revision).toBe(current.revision);
    expect(s.events.updated).toHaveBeenCalledTimes(count); expect(s.room.deadlines()).toContainEqual(reserve);
    expect(() => s.configure({ field: 'attributeValueMode', value: 'PLAY_VALUE' }, 'mode-first')).toThrow(expect.objectContaining({ code: 'REQUEST_CONFLICT' }));
    const selected = s.configure({ field: 'deck', value: { id: 'prueba', contentVersion: 7 } });
    expect(selected.deckInformation).toEqual({ id: 'prueba', contentVersion: 7, instructions: 'Instrucciones\nliterales' });
    Object.assign(selected.deckInformation!, { instructions: 'Alteradas', cards: [] });
    expect(s.rooms.current('g0')!.deckInformation).toEqual({ id: 'prueba', contentVersion: 7, instructions: 'Instrucciones\nliterales' });
    const removed = s.configure({ field: 'deck', value: null }); expect(removed.deckInformation).toBeNull();
    expect(removed.settings).toMatchObject({ attributeValueMode: 'PLAY_VALUE', optimizeForMobile: true });
  });
  it.each(['attributeValueMode', 'optimizeForMobile'] as const)('B15 %s: anfitrión observador sí; invitado/ajeno no; vencimiento exacto primero', field => {
    const s = setup(); s.join('g0'); s.configure({ field: 'hostPlays', value: false });
    const change = field === 'attributeValueMode' ? { field, value: 'DISPLAY_VALUE' } as const : { field, value: true } as const;
    for (const session of ['g0', 'foreign']) expect(() => s.rooms.configure(session, `bad-${session}`, s.room.id, change)).toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));
    const accepted = s.configure(change); expect(accepted.participant.isPlayer).toBe(false);
    s.time.elapse(30 * 60_000); expect(() => s.configure(change)).toThrow(expect.objectContaining({ code: 'ROOM_NOT_AVAILABLE' }));
  });
  it('B05-01/03/04 inicia sin selección, proyecta solo ficha, selección/quitar son atómicos y no comparte referencias', () => {
    const s = setup();
    expect(s.initial.settings).toEqual({ deckId: null, deckContentVersion: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5, attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false });
    expect(s.initial.selectedDeck).toBeNull();
    s.join('g0'); s.time.elapse(1000);
    const before = s.room.revision;
    const selected = s.configure({ field: 'deck', value: { id: 'prueba', contentVersion: 7 } });
    expect(selected.revision).toBe(before + 1); expect(selected.selectedDeck).toEqual(summary);
    expect(selected.settings).toMatchObject({ deckId: 'prueba', deckContentVersion: 7 });
    expect(s.rooms.current('g0')!.selectedDeck).toEqual(summary);
    expect(Object.keys(selected.selectedDeck!)).toHaveLength(8);
    Object.assign(selected.selectedDeck!, { name: 'Manipulado', cards: ['secreto'] });
    expect(s.rooms.current('host')!.selectedDeck).toEqual(summary);
    s.time.elapse(1000); const expires = s.configure({ field: 'deck', value: null });
    expect(expires.selectedDeck).toBeNull(); expect(expires.settings).toMatchObject({ deckId: null, deckContentVersion: null });
    const count = s.events.updated.mock.calls.length;
    s.time.elapse(1000); const same = s.configure({ field: 'deck', value: null });
    expect(same.revision).toBe(expires.revision); expect(same.lifecycle.expiresAt).toBe(expires.lifecycle.expiresAt);
    expect(s.events.updated).toHaveBeenCalledTimes(count);
  });
  it.each([['desconocida', 7, 'DECK_NOT_AVAILABLE'], ['borrador', 7, 'DECK_NOT_AVAILABLE'], ['prueba', 6, 'DECK_VERSION_MISMATCH']] as const)(
    'B05-05 rechaza %s v%i sin alterar selección ni actividad', (id, contentVersion, code) => {
      const s = setup(); const before = s.configure({ field: 'deck', value: { id: 'prueba', contentVersion: 7 } });
      s.time.elapse(1000);
      expect(() => s.configure({ field: 'deck', value: { id, contentVersion } })).toThrow(expect.objectContaining({ code }));
      expect(s.rooms.current('host')).toMatchObject({ settings: before.settings, selectedDeck: summary, revision: before.revision,
        lifecycle: { expiresAt: before.lifecycle.expiresAt } });
    });
  it('B05-05 el puerto que no acredita definición no permite elegir', () => {
    const s = setup({ resolveVersion: () => ({ ok: false, reason: 'DECK_NOT_AVAILABLE' }) });
    expect(() => s.configure({ field: 'deck', value: { id: 'prueba', contentVersion: 7 } })).toThrow(expect.objectContaining({ code: 'DECK_NOT_AVAILABLE' }));
    expect(s.room.selectedDeck).toBeNull();
  });
  it('B05-06 los cinco controles requieren anfitrión y pertenencia, entrada durante configuración recibe lo aceptado', () => {
    const s = setup(); s.join('g0'); s.rooms.createOrGet('foreign');
    const changes: ConfigurationChange[] = [{ field: 'deck', value: null }, { field: 'hostPlays', value: false },
      { field: 'turnSeconds', value: 15 }, { field: 'forceTieBreak', value: true }, { field: 'reviewSeconds', value: 0 }];
    for (const session of ['g0', 'foreign']) for (const change of changes) {
      expect(() => s.rooms.configure(session, 'attempt', s.room.id, change)).toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));
    }
    s.configure({ field: 'turnSeconds', value: 60 });
    expect(s.join('g1').settings.turnSeconds).toBe(60);
  });
  it('B05-07 cada valor permitido cambia solo su control', () => {
    const s = setup();
    const changes: ConfigurationChange[] = [false, true].flatMap((value) => [{ field: 'hostPlays', value }, { field: 'forceTieBreak', value }] as ConfigurationChange[]);
    changes.push(...[15, 30, 60].map((value) => ({ field: 'turnSeconds', value }) as ConfigurationChange));
    changes.push(...[0, 2, 5, 10, 15, 30].map((value) => ({ field: 'reviewSeconds', value }) as ConfigurationChange));
    for (const change of changes) {
      const before = s.room.settings; const result = s.configure(change);
      expect(result.settings[change.field as keyof typeof before]).toBe(change.value);
      for (const field of Object.keys(before) as (keyof typeof before)[]) if (field !== change.field) expect(result.settings[field]).toEqual(before[field]);
    }
  });
  it('B05-09 observación conserva identidad, autoridad, nombres, presencia y orden; no es salida', () => {
    const s = setup(); s.rooms.rename('host', s.room.id, 'Ana'); s.join('g0');
    s.connected.delete('host'); s.rooms.presenceChanged('host');
    const absence = s.room.deadlines().find((deadline) => deadline.participantId === s.room.participantId);
    const view = s.configure({ field: 'hostPlays', value: false });
    expect(view.participant).toMatchObject({ ...s.initial.participant, name: 'Ana', isPlayer: false, presence: 'RECONNECTING' });
    expect(view.participants.map((person) => person.role)).toEqual(['GUEST', 'HOST']);
    expect(s.room.playerCount).toBe(1); expect(s.room.deadlines()).toContainEqual(absence);
    expect(s.events.left).not.toHaveBeenCalled(); expect(s.rooms.createOrGet('host').id).toBe(s.room.id);
    s.rooms.rename('host', s.room.id, 'Observador'); s.configure({ field: 'forceTieBreak', value: true });
    s.rooms.close('host', s.room.id); expect(s.rooms.current('host')).toBeNull();
  });
  it.each(['join', 'host'] as const)('B05-10 la primera transición (%s) gana la última plaza', (first) => {
    const s = setup(); s.configure({ field: 'hostPlays', value: false });
    for (let n = 0; n < 4; n++) s.join(`g${n}`);
    const host = () => s.configure({ field: 'hostPlays', value: true }); const guest = () => s.join('g4');
    (first === 'join' ? guest : host)();
    expect(first === 'join' ? host : guest).toThrow(expect.objectContaining({ code: 'ROOM_FULL' }));
    expect(s.room.playerCount).toBe(5); expect(s.room.participants.at(-1)!.id).toBe(s.room.participantId);
    if (first === 'join') expect(s.room.participants).toHaveLength(6);
  });
  it('B05-10 reservas cuentan y retiradas debidas preceden capacidad con callback atrasado', () => {
    const s = setup(); s.configure({ field: 'hostPlays', value: false });
    for (let n = 0; n < 5; n++) s.join(`g${n}`);
    s.connected.delete('g0'); s.rooms.presenceChanged('g0');
    s.time.elapse(29_999);
    expect(() => s.configure({ field: 'hostPlays', value: true })).toThrow(expect.objectContaining({ code: 'ROOM_FULL' }));
    s.time.elapse(1);
    const returned = s.configure({ field: 'hostPlays', value: true });
    expect(returned.participants.filter((p) => p.isPlayer)).toHaveLength(5);
    expect(returned.participants.at(-1)!.role).toBe('HOST'); expect(s.ends.get('g0')!.reason).toBe('RECONNECT_TIMEOUT');
  });
  it('B05-11/12 último nuevo válido por campo, repeticiones devuelven presente, ids comparten espacio con join/leave', () => {
    const s = setup(); const old = { field: 'turnSeconds', value: 15 } as const;
    s.configure(old, 'old'); s.time.elapse(1000); s.configure({ field: 'reviewSeconds', value: 0 });
    const last = s.configure({ field: 'turnSeconds', value: 60 }); const count = s.events.updated.mock.calls.length;
    s.time.elapse(1000);
    expect(s.configure(old, 'old')).toMatchObject({ revision: last.revision, settings: { turnSeconds: 60, reviewSeconds: 0 }, lifecycle: { expiresAt: last.lifecycle.expiresAt } });
    expect(s.configure({ field: 'turnSeconds', value: 60 }).revision).toBe(last.revision);
    expect(s.events.updated).toHaveBeenCalledTimes(count);
    expect(() => s.configure({ field: 'turnSeconds', value: 30 }, 'old')).toThrow(expect.objectContaining({ code: 'REQUEST_CONFLICT' }));
    expect(() => s.rooms.join('host', 'old', s.room.code, 'Ana')).toThrow(expect.objectContaining({ code: 'REQUEST_CONFLICT' }));
    expect(() => s.rooms.leave('host', 'old', s.room.id, s.room.participantId)).toThrow(expect.objectContaining({ code: 'REQUEST_CONFLICT' }));
  });
  it('B05-12 un rechazo repetido no se revalida ni ocupa una plaza que acaba de quedar libre', () => {
    const s = setup(); s.configure({ field: 'hostPlays', value: false });
    for (let n = 0; n < 5; n++) s.join(`g${n}`);
    const change = { field: 'hostPlays', value: true } as const;
    expect(() => s.configure(change, 'rejected')).toThrow(expect.objectContaining({ code: 'ROOM_FULL' }));
    const person = s.room.participantFor('g0')!; s.rooms.leave('g0', 'leave', s.room.id, person.id);
    expect(() => s.configure(change, 'rejected')).toThrow(expect.objectContaining({ code: 'ROOM_FULL' }));
    expect(s.configure(change, 'new').settings.hostPlays).toBe(true);
  });
  it('B05-13/14 reconexión/lectura/repetición/igual/rechazo no renuevan; efectivo retira aviso sin reiniciar ausencias', () => {
    const s = setup(); s.configure({ field: 'turnSeconds', value: 15 }, 'old'); s.join('g0');
    s.time.advance(29 * 60_000);
    const before = s.rooms.current('host')!; expect(before.lifecycle.warning).toBe(true);
    s.connected.delete('g0'); s.rooms.presenceChanged('g0');
    const absence = s.room.deadlines().find((deadline) => deadline.participantId === s.room.participantFor('g0')!.id);
    s.configure({ field: 'turnSeconds', value: 15 }, 'old'); s.configure({ field: 'deck', value: null });
    expect(() => s.configure({ field: 'deck', value: { id: 'borrador', contentVersion: 7 } })).toThrow();
    s.connected.delete('host'); s.rooms.presenceChanged('host'); s.connected.add('host'); s.rooms.presenceChanged('host');
    expect(s.rooms.resume('host').room!.lifecycle.expiresAt).toBe(before.lifecycle.expiresAt);
    const effective = s.configure({ field: 'reviewSeconds', value: 0 });
    expect(effective.lifecycle).toMatchObject({ warning: false, expiresAt: s.time.now().unix + 30 * 60_000 });
    expect(s.room.deadlines()).toContainEqual(absence);
  });
  it.each([false, true])('B05-14 caducidad exacta gana con callback atrasado=%s incluso repetición y ausencia coincidente', (delayed) => {
    const s = setup(); s.configure({ field: 'hostPlays', value: false }, 'observe');
    s.time.advance(30 * 60_000 - 30_000); s.connected.delete('host'); s.rooms.presenceChanged('host');
    if (delayed) s.time.elapse(30_000); else s.time.advance(30_000);
    expect(() => s.configure({ field: 'hostPlays', value: false }, 'observe')).toThrow(expect.objectContaining({ code: 'ROOM_NOT_AVAILABLE' }));
    expect(() => s.configure({ field: 'forceTieBreak', value: true })).toThrow(expect.objectContaining({ code: 'ROOM_NOT_AVAILABLE' }));
    expect(s.events.closed).toHaveBeenCalledTimes(1); expect(s.ends.get('host')!.reason).toBe('INACTIVITY');
    expect(s.time.pending).toBe(0);
  });
  it('B05-13 observador ausente vence igual que anfitrión jugador', () => {
    const s = setup(); s.configure({ field: 'hostPlays', value: false }); s.connected.delete('host'); s.rooms.presenceChanged('host');
    s.time.advance(30_000); expect(s.ends.get('host')!.reason).toBe('HOST_DISCONNECTED'); expect(s.room.status).toBe('CLOSED');
  });
});
