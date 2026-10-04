import { describe, expect, it, vi } from 'vitest';
import { initialGameCases } from '../../tests/support/initialGameCases.js';
import type { InitialGameRoomView, RoomView } from '../../shared/contracts/room.js';
import type { GameDeckResult } from './deckCatalog.js';

const gameView = (view: RoomView): InitialGameRoomView => { expect(view.status).toBe('IN_GAME'); if (view.status !== 'IN_GAME') throw new Error(); return view; };
const ready = () => { const s = initialGameCases(); s.join(); s.select(); return s; };
const expectCode = (action: () => unknown, code: string) => { try { action(); throw new Error('Se esperaba rechazo'); } catch (error) { expect(error).toMatchObject({ code }); } };

describe('B06 inicio/coordinación con tiempo y puertos controlados', () => {
  it('B06-01/02/03 autoriza anfitrión, requiere selección/dos humanos/conexión de todos', () => {
    const s = initialGameCases(); expectCode(s.start, 'START_NOT_READY'); s.select();
    expectCode(() => s.start('one'), 'START_NOT_READY'); s.join();
    expectCode(() => s.rooms.start('g0', 'guest', s.room.id), 'FORBIDDEN');
    expectCode(() => s.rooms.start('third', 'third', s.room.id), 'FORBIDDEN');
    expectCode(() => s.rooms.start('host', 'missing', 'no-room'), 'ROOM_NOT_AVAILABLE');
    s.connected.delete('g0'); s.rooms.presenceChanged('g0'); expectCode(() => s.start('offline'), 'START_NOT_READY');
    s.connected.add('g0'); s.rooms.presenceChanged('g0'); expect(gameView(s.start('valid')).game.drawPileCount).toBe(51);
  });
  it('B06-02/14 anfitrión observador exige dos invitados y su propia conexión; orden y nombres fijados', () => {
    const s = initialGameCases(); s.configure({ field: 'hostPlays', value: false }); s.select(); s.join();
    expectCode(s.start, 'START_NOT_READY'); s.join('g1'); s.connected.delete('host'); s.rooms.presenceChanged('host');
    expectCode(() => s.start('offline-observer'), 'START_NOT_READY');
    s.connected.add('host'); s.rooms.presenceChanged('host'); const view = gameView(s.start('ok'));
    expect(view.participant).toMatchObject({ isPlayer: false, score: null, role: 'HOST' }); expect(view.game.hand).toEqual([]);
    expect(view.participants.map((p) => p.name)).toEqual(['Ana', 'Ana', 'Jugador 1']);
    expect(s.room.game!.players.map((p) => p.id)).toEqual(view.participants.filter((p) => p.isPlayer).map((p) => p.id));
    expect(view.game.round.openerPlayerId).toBe(view.participants[0].id); expect(view.game.drawPileCount).toBe(51);
  });
  it('B06-02 cinco jugadores permitidos; sustituto con seis rechaza sin consumir entropía', () => {
    const s = ready(); ['g1', 'g2', 'g3'].forEach(s.join); expect(gameView(s.start()).game.drawPileCount).toBe(42);
    const invalid = ready(); vi.spyOn(invalid.room, 'playerCount', 'get').mockReturnValue(6);
    expectCode(invalid.start, 'START_NOT_READY'); expect(invalid.permutation).not.toHaveBeenCalled();
  });
  it.each(['DECK_NOT_AVAILABLE', 'DECK_VERSION_MISMATCH'] as const)('B06-03 puerto devuelve %s, no adopta otra versión', (reason) => {
    const s = initialGameCases({ gameDecks: { gameDeck: () => ({ ok: false, reason }) } }); s.join(); s.select();
    const before = s.room.revision; expectCode(s.start, reason); expect(s.room.status).toBe('WAITING'); expect(s.room.revision).toBe(before);
    expect(s.permutation).not.toHaveBeenCalled(); expect(s.room.game).toBeUndefined();
  });
  it.each(['definition', 'version', 'presentation', 'permutation'])('B06-03/05 fallo previo de %s deja la espera utilizable', (failure) => {
    const source = initialGameCases(); const snapshot = source.catalog.gameDeck('prueba', 7); if (!snapshot.ok) throw new Error();
    const broken = structuredClone(snapshot.snapshot);
    if (failure === 'definition') broken.definition.cards.pop();
    if (failure === 'version') broken.summary.contentVersion = 6;
    if (failure === 'presentation') broken.presentation = [];
    const result = { ok: true, snapshot: broken } as GameDeckResult;
    const port = { gameDeck: vi.fn(() => result) };
    const s = initialGameCases({ gameDecks: port, permutation: failure === 'permutation' ? () => [] : undefined }); s.join(); s.select();
    const before = s.room.revision; expectCode(s.start, ['definition', 'version'].includes(failure) ? 'INVALID_DECK' : 'INTERNAL_ERROR');
    expect(s.room.revision).toBe(before); expect(s.room.game).toBeUndefined(); expect(s.room.status).toBe('WAITING');
    expect(s.configure({ field: 'turnSeconds', value: 60 }).settings.turnSeconds).toBe(60);
    if (failure !== 'permutation') { port.gameDeck.mockReturnValue(snapshot); expect(gameView(s.start('repaired')).game.phase).toBe('PLAYING'); }
  });
  it('B06-06/E5 repetición, nuevos IDs y recuperación previa JOIN/CONFIGURE no publican ni reparten otra vez', () => {
    const s = ready(); const view = gameView(s.start()); const count = s.events.updated.mock.calls.length;
    for (const id of ['start', 'new-start']) expect(s.start(id)).toEqual(view);
    expect(s.rooms.configure('host', 'select', s.room.id, { field: 'deck', value: { id: 'prueba', contentVersion: 7 } })).toEqual(view);
    const guest = gameView(s.rooms.join('g0', 'join-g0', s.room.code, 'Ana'));
    expect(guest.game.id).toBe(view.game.id); expect(guest.game.hand).not.toEqual(view.game.hand);
    expect(s.rooms.join('g0', 'new-join', s.room.code, 'Otro').participant.name).toBe('Ana');
    expectCode(() => s.rooms.configure('host', 'start', s.room.id, { field: 'turnSeconds', value: 60 }), 'REQUEST_CONFLICT');
    expectCode(() => s.rooms.start('host', 'select', s.room.id), 'REQUEST_CONFLICT');
    expect(s.permutation).toHaveBeenCalledTimes(1); expect(s.events.updated).toHaveBeenCalledTimes(count);
    expect(s.room.revision).toBe(view.revision);
  });
  it('B06-06 rechazo repetido conserva error aunque ya esté listo; ID nuevo inicia', () => {
    const s = initialGameCases(); expectCode(s.start, 'START_NOT_READY'); s.join(); s.select();
    expectCode(s.start, 'START_NOT_READY'); expect(s.permutation).not.toHaveBeenCalled();
    expect(gameView(s.start('new')).game.phase).toBe('PLAYING');
  });
  it('B06-06 reutilizar requestId rechazado contra otra sala produce conflicto de contexto', () => {
    const s = initialGameCases(); expectCode(s.start, 'START_NOT_READY'); s.rooms.close('host', s.room.id);
    const later = s.rooms.createOrGet('host'); expectCode(() => s.rooms.start('host', 'start', later.id), 'REQUEST_CONFLICT');
    expect(s.permutation).not.toHaveBeenCalled();
  });
  it('B06-07 fallo de publicación posterior permite recuperar aceptación, sin otro reparto', () => {
    const s = ready(); s.events.updated.mockImplementationOnce(() => { throw new Error('datos internos no registrables'); });
    expectCode(s.start, 'INTERNAL_ERROR'); const view = gameView(s.rooms.current('host')!);
    expect(s.start()).toEqual(view); expect(s.start('other')).toEqual(view); expect(s.permutation).toHaveBeenCalledTimes(1);
    expect(s.time.pending).toBe(0);
  });
  it.each(['join', 'name', 'configure', 'leave', 'close'])('B06-07/E6 carrera %s antes y después de inicio respeta orden de procesamiento', (action) => {
    const apply = (s: ReturnType<typeof ready>) => {
      if (action === 'join') return s.join('g1');
      if (action === 'name') return s.rooms.rename('host', s.room.id, 'Luis');
      if (action === 'configure') return s.configure({ field: 'turnSeconds', value: 60 });
      if (action === 'leave') { const guest = s.room.participantFor('g0')!; return s.rooms.leave('g0', 'leave', s.room.id, guest.id); }
      return s.rooms.close('host', s.room.id);
    };
    const first = ready(); apply(first);
    if (action === 'close') expectCode(first.start, 'ROOM_NOT_AVAILABLE');
    else if (action === 'leave') expectCode(first.start, 'START_NOT_READY');
    else {
      const view = gameView(first.start());
      if (action === 'join') expect(view.participants).toHaveLength(3);
      if (action === 'name') expect(view.participant.name).toBe('Luis');
      if (action === 'configure') expect(first.room.game!.settings.turnTimeout).toBe(60);
    }
    const later = ready(); const accepted = later.start(); const count = later.events.updated.mock.calls.length;
    expectCode(() => apply(later), 'GAME_ALREADY_STARTED'); expect(later.rooms.current('host')).toEqual(accepted);
    expect(later.events.updated).toHaveBeenCalledTimes(count); expect(later.permutation).toHaveBeenCalledTimes(1);
  });
  it.each([-1, 0, 1])('B06-08 instante de caducidad %+i ms aplica primero vencimiento', (offset) => {
    const s = ready(); s.time.elapse(1_800_000 + offset);
    if (offset < 0) expect(gameView(s.start()).game.phase).toBe('PLAYING'); else expectCode(s.start, 'ROOM_NOT_AVAILABLE');
  });
  it.each([29_999, 30_000, 30_001])('B06-08 reserva a %i ms: desconexión impide iniciar y vencer retira primero', (elapsed) => {
    const s = ready(); s.connected.delete('g0'); s.rooms.presenceChanged('g0'); s.time.elapse(elapsed);
    expectCode(s.start, 'START_NOT_READY'); expect(s.room.participants).toHaveLength(elapsed < 30_000 ? 2 : 1);
    expect(s.permutation).not.toHaveBeenCalled();
  });
  it('B06-08/13/E4 callbacks cancelados, más de 30 min y todos ausentes no alteran mesa; otra espera caduca', () => {
    const s = ready(); s.rooms.createOrGet('other'); const oldTasks = [...s.time.tasks];
    s.time.elapse(1_799_999); const view = gameView(s.start());
    for (const session of ['host', 'g0']) { s.connected.delete(session); s.rooms.presenceChanged(session); }
    for (const callback of oldTasks) callback.callback();
    s.time.advance(1_900_000);
    expect(s.room.status).toBe('IN_GAME'); expect(s.rooms.current('other')).toBeNull();
    expect(s.time.pending).toBe(0); expect(s.room.deadlines()).toEqual([]);
    for (const session of ['host', 'g0']) { s.connected.add(session); s.rooms.presenceChanged(session); }
    const recovered = gameView(s.rooms.current('host')!); expect(recovered.game).toEqual(view.game);
    expect(recovered.participants.every((person) => person.presence === 'CONNECTED')).toBe(true);
    expect(s.permutation).toHaveBeenCalledTimes(1);
  });
  it('B06-09/12 mantiene índices, creación/HTTP propio/resume recuperan y sesión no cambia sala', () => {
    const s = ready(); const view = s.start();
    expect(s.repository.findActiveByCode(s.room.code)).toBe(s.room); expect(s.repository.findActiveByOwner('host')).toBe(s.room);
    expect(s.repository.findActiveBySession('g0')).toBe(s.room);
    expect(s.rooms.createOrGet('host')).toEqual(view); expect(s.rooms.getOwn('host', s.room.id)).toEqual(view);
    expect(s.rooms.resume('host').room).toEqual(view); expectCode(() => s.rooms.createOrGet('g0'), 'ALREADY_IN_ROOM');
    expectCode(() => s.rooms.join('g0', 'different', '123456', 'Ana'), 'ALREADY_IN_ROOM');
    expectCode(() => s.rooms.getOwn('third', s.room.id), 'FORBIDDEN');
  });
  it('B06-10 copia vista por destinatario sin alterar estado privado ni instantánea', () => {
    const s = ready(); const view = gameView(s.start()); const game = s.room.game!;
    Object.assign(view.game.hand[0].values.atributo1, { playValue: -100 }); view.game.attributes[0].name = 'alterado';
    view.selectedDeck.name = 'alterado'; view.settings.turnSeconds = 60;
    expect(game.players[1].hand[0].values.atributo1.playValue).toBeGreaterThan(0);
    expect(s.rooms.current('host')!.settings.turnSeconds).toBe(30); expect(s.catalog.definition('prueba')).toEqual(s.definition);
  });
  it('B06-18 desmontar coordinación cancela espera e invalida hechos de presencia y callbacks antiguos', () => {
    const s = ready(); const callbacks = [...s.time.tasks]; s.start(); const count = s.events.updated.mock.calls.length;
    s.coordinator.dispose(); s.connected.clear(); s.rooms.presenceChanged('host'); s.rooms.presenceChanged('g0');
    callbacks.forEach((task) => task.callback()); s.time.advance(2_000_000);
    expect(s.time.pending).toBe(0); expect(s.events.updated).toHaveBeenCalledTimes(count); expect(s.room.status).toBe('IN_GAME');
  });
});
