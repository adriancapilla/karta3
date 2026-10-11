import { describe, expect, it } from 'vitest';
import { manualApplication } from '../../tests/support/manualApplicationCases.js';
import { initialGameCases } from '../../tests/support/initialGameCases.js';

type Fixture = ReturnType<typeof manualApplication>;
const input = (f: Fixture, requestId = 'cancel') => ({ requestId, roomId: f.room.id, gameId: f.room.game!.id });
function finalReview(f: Fixture, inactive = false) {
  let steps = 0;
  while (f.room.game!.resolution?.nextStage !== 'RESULTS') {
    if (++steps > 160) throw new Error('No llegó a revisión final');
    if (f.room.gameReview) f.time.advance(5000);
    else if (inactive) { f.time.elapse(f.room.gameTurn!.at - f.time.now().monotonic); f.rooms.resume('host'); }
    else f.play();
  }
}
function partial(f: Fixture, target: 'INITIAL' | 'PARTIAL' | 'REVIEW' | 'FINAL_PHASE' | 'TIE_BREAK' | 'TIE_REVIEW') {
  if (target === 'INITIAL') return;
  if (target === 'PARTIAL') { f.play(); return; }
  if (target === 'REVIEW') { while (!f.room.gameReview) f.play(); return; }
  while (f.room.game!.phase !== (target === 'FINAL_PHASE' ? 'FINAL_PHASE' : 'TIE_BREAK')) {
    if (f.room.gameReview) f.time.advance(5000); else f.play();
  }
  if (target === 'TIE_REVIEW') while (!f.room.gameReview) f.play(); else f.play();
}

describe('B13 coordinación de cancelación y liberación', () => {
  it.each(['INITIAL', 'PARTIAL', 'REVIEW', 'FINAL_PHASE', 'TIE_BREAK', 'TIE_REVIEW'] as const)('%s: conserva puntos/58 cartas, invalida callbacks y publica por roster pese a liberar', (target) => {
    const f = manualApplication(3, { observer: true, tie: true, review: 5 }); partial(f, target);
    const before = f.room.game!; const callbacks = f.time.tasks.map((task) => task.callback); f.events.updated.mockClear();
    f.events.updated.mockImplementationOnce((views) => {
      for (const session of f.room.memberSessions) expect(f.repository.findActiveBySession(session)).toBeUndefined();
      expect(f.requests.get('host', 'cancel')?.kind).toBe('CANCEL_GAME');
      expect(views).toHaveLength(4);
    });
    const result = f.rooms.cancelGame('host', input(f)); const retained = f.room.retention;
    expect(result.status).toBe('RESULTS'); expect(result.participant.isPlayer).toBe(false); expect(result.participant.score).toBeNull();
    expect(result.result).toMatchObject({ endReason: 'HOST_CANCELLED', completedNormally: false, winnerIds: [], tieBreakWinnerId: null });
    expect(result.result.standings.map((p) => p.score).sort()).toEqual(before.players.map((p) => before.score(p.id)).sort());
    expect(f.room.game!.locations().map((c) => c.id)).toEqual(before.locations().map((c) => c.id)); expect(f.room.game!.locations()).toHaveLength(58);
    expect(f.room.gameReview).toBeUndefined(); expect(f.room.gameTurn).toBeUndefined(); expect(f.room.openingDirection).toBeNull(); expect(f.time.pending).toBe(1);
    expect(f.events.updated).toHaveBeenCalledTimes(1);
    const snapshots = f.events.updated.mock.calls[0][0]; expect(snapshots.map((v) => v.sessionId)).toEqual(f.room.memberSessions);
    for (const view of snapshots) { expect(view.room.status).toBe('RESULTS'); expect(JSON.stringify(view.room)).not.toMatch(/hand|drawPile|presence|consecutiveTimeouts|sessionId|wonCards|seed|cards/); }
    callbacks.forEach((callback) => callback());
    expect(f.room.game!.players).toBe(before.players); expect(f.room.retention).toBe(retained); expect(f.time.pending).toBe(1);
  });
  it.each([false, true])('E3/E4 final %s con −1/0/+1 ms y callback retenido', (inactive) => {
    for (const offset of [-1, 0, 1]) {
      const f = manualApplication(2, { review: 5, turn: 15 }); finalReview(f, inactive);
      expect(f.room.status).toBe('IN_GAME'); expect(f.room.game!.result).not.toBeNull(); expect(f.room.retention).toBeUndefined();
      const candidate = f.room.game!.result!; f.time.elapse(f.room.gameReview!.at - f.time.now().monotonic + offset);
      if (offset < 0) expect(f.rooms.cancelGame('host', input(f)).result.endReason).toBe('HOST_CANCELLED');
      else { expect(() => f.rooms.cancelGame('host', input(f))).toThrow('terminado'); expect(f.room.game!.result).toBe(candidate); }
      expect(f.room.status).toBe('RESULTS'); expect(f.room.retention!.presentedAt).toBe(f.time.now().unix);
    }
  });
  it.each([false, true])('revisión cero: final %s ya registrado no se transforma', (inactive) => {
    const f = manualApplication(2, { review: 0, turn: 15 }); if (inactive) f.time.advance(60_000); else f.complete();
    const result = f.room.game!.result; const retained = f.room.retention;
    expect(f.room.status).toBe('RESULTS'); expect(() => f.rooms.cancelGame('host', input(f))).toThrow('terminado');
    expect(f.room.game!.result).toBe(result); expect(f.room.retention).toBe(retained);
  });
  it('HOST automático puede cancelar independientemente de turno; el timeout debido conserva su efecto', () => {
    const f = manualApplication(2, { review: 5, turn: 15 });
    f.time.advance(50_000); // Segundo timeout de un humano, pero aún queda un humano ACTIVE.
    while (f.room.game!.players.find((p) => p.id === f.room.participantId)!.status !== 'AUTOMATIC') {
      if (f.room.gameReview) f.time.advance(5000); else { f.time.elapse(f.room.gameTurn!.at - f.time.now().monotonic); f.rooms.resume('host'); }
    }
    const status = f.room.game!.players.find((p) => p.id === f.room.participantId)!.status;
    expect(status).toBe('AUTOMATIC'); expect(f.rooms.cancelGame('host', input(f)).result.endReason).toBe('HOST_CANCELLED');
  });
  it('cancelación en igualdad del último timeout adjudica antes; callbacks no producen otra jugada', () => {
    const f = manualApplication(2, { review: 5, turn: 15 }); f.play();
    const deadline = f.room.gameTurn!; const callback = f.time.tasks.at(-1)!.callback;
    f.time.elapse(deadline.at - f.time.now().monotonic);
    const result = f.rooms.cancelGame('host', input(f));
    expect(result.result.standings.reduce((sum, p) => sum + p.score, 0)).toBe(2);
    expect(f.room.game!.round.plays.at(-1)?.mode).toBe('TIMEOUT'); callback(); expect(f.room.game!.round.plays).toHaveLength(2);
  });
  it('jugada primero conserva efectos y replay; cancelar primero impide una nueva jugada', () => {
    const f = manualApplication(2); f.play(); const accepted = f.inputs[0];
    f.rooms.cancelGame('host', input(f)); const terminal = f.room.game;
    expect(f.rooms.playCard(accepted.session, accepted.input).status).toBe('RESULTS');
    expect(() => f.rooms.playCard(accepted.session, { ...accepted.input, requestId: 'after-cancel' })).toThrow('terminado');
    expect(f.room.game).toBe(terminal); expect(terminal!.round.plays).toHaveLength(1);
    expect(terminal!.players.reduce((sum, p) => sum + terminal!.score(p.id), 0)).toBe(0);
  });
  it('HOST jugador fuera de los empatados conserva permiso en desempate', () => {
    const f = manualApplication(5, { tie: true, review: 5, winners: [0, 1, 2, 0, 1, 2, 0, 1, 2, 3] });
    f.completeBase(); expect(f.room.game!.phase).toBe('TIE_BREAK');
    expect(f.room.game!.round.playerIds).not.toContain(f.room.participantId);
    expect(f.rooms.cancelGame('host', input(f)).result.endReason).toBe('HOST_CANCELLED');
  });
  it('mismo/nuevo ID de pestaña recupera sin renovar; conflicto, guest/ajeno y contexto rechazan', () => {
    const f = manualApplication(2); const request = input(f);
    expect(() => f.rooms.cancelGame('g0', request)).toThrow('anfitrión'); expect(() => f.rooms.cancelGame('other', request)).toThrow('anfitrión');
    expect(() => f.rooms.cancelGame('host', { ...request, gameId: 'otro' })).toThrow('cambiado');
    f.rooms.cancelGame('host', request); const retained = f.room.retention; f.events.updated.mockClear(); f.time.elapse(123);
    expect(f.rooms.cancelGame('host', request).result.endReason).toBe('HOST_CANCELLED');
    f.rooms.cancelGame('host', { ...request, requestId: 'tab-two' }); expect(f.room.retention).toBe(retained); expect(f.events.updated).not.toHaveBeenCalled();
    expect(() => f.rooms.cancelGame('host', { ...request, requestId: 'start' })).toThrow('otros datos');
    expect(() => f.rooms.cancelGame('g0', request)).toThrow('anfitrión');
    expect(Object.keys(f.requests.get('host', 'cancel')!).sort()).toEqual(['kind', 'signature', 'roomId', 'participantId'].sort());
    const waiting = f.rooms.createOrGet('host'); expect(() => f.rooms.cancelGame('host', { ...request, roomId: waiting.id })).toThrow('cambiado');
  });
  it('emisión falla después de registro; recupera sin otra publicación/liberación y permite B', () => {
    const f = manualApplication(2); const request = input(f);
    f.events.updated.mockImplementationOnce(() => { throw new Error('delivery failed'); });
    expect(() => f.rooms.cancelGame('host', request)).toThrow('delivery failed'); const retained = f.room.retention;
    const next = f.rooms.createOrGet('host'); f.events.updated.mockClear();
    expect(f.rooms.cancelGame('host', request).result.endReason).toBe('HOST_CANCELLED'); expect(f.room.retention).toBe(retained);
    expect(f.repository.findActiveBySession('host')?.id).toBe(next.id); expect(f.events.updated).not.toHaveBeenCalled();
  });
  it('E8 cada humano crea B; retorno/caducidad/replay A no liberan índices B', () => {
    const f = manualApplication(2); const request = input(f); f.rooms.cancelGame('host', request);
    const home = { ...request, requestId: 'home' }; const response = f.rooms.returnHome('host', home);
    expect(response.room).toBeNull(); expect(f.events.resultsHome).toHaveBeenCalledTimes(1);
    f.rooms.returnHome('host', home); expect(f.events.resultsHome).toHaveBeenCalledTimes(1);
    const next = f.rooms.createOrGet('host'); const guestNext = f.rooms.createOrGet('g0');
    expect(f.rooms.returnHome('host', home).room?.id).toBe(next.id);
    expect(() => f.rooms.returnHome('host', { ...home, requestId: 'late-home' })).toThrow('otra sala');
    expect(f.rooms.getOwn('host', f.room.id).status).toBe('RESULTS'); f.repository.save(f.room);
    f.rooms.cancelGame('host', { ...request, requestId: 'late-cancel' });
    f.time.advance(1000); f.rooms.rename('host', next.id, 'Mesa B'); f.rooms.rename('g0', guestNext.id, 'Mesa C');
    f.time.elapse(f.room.retention!.at - f.time.now().monotonic - 1);
    expect(f.rooms.getResult('host', request.gameId).result.endReason).toBe('HOST_CANCELLED');
    f.time.elapse(1); expect(() => f.rooms.getResult('host', request.gameId)).toThrow('no está disponible');
    f.time.elapse(1); expect(() => f.rooms.cancelGame('host', request)).toThrow('no está disponible');
    expect(f.repository.findActiveBySession('host')?.id).toBe(next.id); expect(f.repository.findActiveBySession('g0')?.id).toBe(guestNext.id);
    expect(f.repository.findActiveByCode(next.code)?.id).toBe(next.id); expect(f.repository.isCodeActive(f.room.code)).toBe(false);
  });
  it('continuación BOT extraída se invalida y cancelar no drena toda una ronda', () => {
    const f = initialGameCases(); f.select(); f.configure({ field: 'reviewSeconds', value: 5 });
    f.rooms.bot('host', 'bot', f.room.id, { type: 'ADD' }); f.start();
    expect(f.room.game!.turn?.playerId).not.toBe(f.room.participantId); const callbacks = f.time.tasks.map((t) => t.callback);
    f.rooms.cancelGame('host', { requestId: 'cancel', roomId: f.room.id, gameId: f.room.game!.id });
    const after = f.room.game!; expect(after.round.plays).toHaveLength(1); expect(after.round.plays[0].mode).toBe('BOT');
    callbacks.forEach((callback) => callback()); expect(f.room.game).toBe(after); expect(f.time.pending).toBe(1);
  });
  it('turno AUTOMATIC procesa solo su paso debido e invalida su continuación extraída', () => {
    const f = manualApplication(3, { observer: true, review: 5, turn: 15 }); const id = f.room.participantFor('g0')!.id;
    let steps = 0;
    while (f.room.game!.turn?.playerId !== id || f.room.game!.players.find((p) => p.id === id)!.status !== 'AUTOMATIC') {
      if (++steps > 160) throw new Error('No llegó al turno automático');
      if (f.room.gameReview) { f.time.elapse(f.room.gameReview.at - f.time.now().monotonic); f.rooms.resume('host'); }
      else if (f.room.gameTurn?.playerId === id) { f.time.elapse(f.room.gameTurn.at - f.time.now().monotonic); f.rooms.resume('host'); }
      else f.play();
    }
    const callbacks = f.time.tasks.map((t) => t.callback); const round = f.room.game!.round;
    f.rooms.cancelGame('host', input(f)); const after = f.room.game!;
    expect(after.round.plays).toHaveLength(round.plays.length + 1); expect(after.round.plays.at(-1)?.mode).toBe('AUTOMATIC');
    callbacks.forEach((callback) => callback()); expect(f.room.game).toBe(after); expect(f.time.pending).toBe(1);
  });
  it('requestId de A con contenido válido de otra partida B produce conflicto y conserva B', () => {
    const f = manualApplication(2); f.rooms.cancelGame('host', input(f));
    const next = f.rooms.createOrGet('host'); f.rooms.join('g0', 'join-b', next.code, 'Ana');
    f.rooms.configure('host', 'select-b', next.id, { field: 'deck', value: { id: f.definition.id, contentVersion: 7 } });
    f.rooms.start('host', 'start-b', next.id); const b = f.repository.findById(next.id)!;
    expect(() => f.rooms.cancelGame('host', { requestId: 'cancel', roomId: b.id, gameId: b.game!.id })).toThrow('otros datos');
    expect(b.status).toBe('IN_GAME'); expect(f.repository.findActiveBySession('host')).toBe(b);
  });
});
