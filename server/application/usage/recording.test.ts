import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { UsageRecording } from './recording.js';
import type { UsageEvent } from './contracts.js';
import { initialGameCases } from '../../../tests/support/initialGameCases.js';
import { ControlledTime } from '../../../tests/support/controlledTime.js';
import { manualApplication } from '../../../tests/support/manualApplicationCases.js';

function setup(fail = false) {
  const events: UsageEvent[] = []; const time = new ControlledTime();
  const usage = new UsageRecording({ tryRecord: (e) => { if (fail) throw new Error('writer'); events.push(e); return true; } }, time, randomUUID, 'test', 'SYNTHETIC', randomUUID());
  return { ...initialGameCases({ time, usage }), events, usage };
}
it('hechos nuevos después de dedupe; recuperación/replay/conflicto no crean otra sala/entrada', () => {
  const f = setup(); f.rooms.createOrGet('host'); f.join(); f.join();
  f.rooms.join('g0', 'another', f.room.code, 'Privado');
  expect(() => f.rooms.join('g0', 'another', 'no', 'Privado')).toThrow();
  expect(f.events.filter((e) => e.name === 'room_created')).toHaveLength(1);
  expect(f.events.filter((e) => e.name === 'room_join_resolved').map((e) => e.data.outcome)).toEqual(['NEW_JOIN', 'EXISTING_PARTICIPATION']);
  expect(() => f.rooms.join('g1', 'bad', 'no', 'Dato excluido')).toThrow();
  expect(() => f.rooms.join('g1', 'bad', 'no', 'Dato excluido')).toThrow();
  expect(f.events.filter((e) => e.name === 'room_join_resolved')).toHaveLength(3);
  const text = JSON.stringify(f.events); for (const secret of [f.room.id, f.room.code, 'Privado', 'Dato excluido', 'host', 'g0', 'requestId']) expect(text).not.toContain(`"${secret}"`);
});
it('snapshot compartido exacto host observador, humano y EASY/HARD; no borradores', () => {
  const f = setup(); f.select(); f.join(); f.configure({ field: 'hostPlays', value: false });
  const bot = f.rooms.bot('host', 'add', f.room.id, { type: 'ADD' });
  f.rooms.bot('host', 'level', f.room.id, { type: 'DIFFICULTY', botId: bot.botId, difficulty: 'EASY' });
  f.rooms.bot('host', 'add2', f.room.id, { type: 'ADD' });
  f.configure({ field: 'attributeValueMode', value: 'DISPLAY_VALUE' }); f.configure({ field: 'optimizeForMobile', value: true });
  f.configure({ field: 'reviewSeconds', value: 2 }); f.configure({ field: 'forceTieBreak', value: true });
  f.start(); f.start(); f.rooms.current('host');
  const started = f.events.filter((e) => e.name === 'game_started'); expect(started).toHaveLength(1);
  expect(started[0].data.configuration).toEqual({ deckId: 'prueba', deckSchemaVersion: 2, deckContentVersion: 7,
    humanPlayerCount: 1, botCount: 2, playerCount: 3, hostPlays: false, humanObserverCount: 1, botsByDifficulty: { EASY: 1, HARD: 1 },
    turnSeconds: 30, reviewSeconds: 2, forceTieBreak: true, attributeValueMode: 'DISPLAY_VALUE', optimizeForMobile: true });
  expect(started[0].data.humanParticipations).toHaveLength(1);
});
it('primero no convierte; segundo una vez; publicación tras revisión incluye duración monotónica', () => {
  const f = setup(); f.select(); f.join(); f.configure({ field: 'turnSeconds', value: 15 }); f.start();
  f.time.advance(30_000); expect(f.events.some((e) => e.name === 'human_became_automatic')).toBe(false);
  f.time.advance(40_000); expect(f.room.status).toBe('RESULTS');
  expect(f.events.filter((e) => e.name === 'human_became_automatic')).toHaveLength(2);
  expect(f.events.filter((e) => e.name === 'game_ended')).toMatchObject([{ data: { reason: 'NO_ACTIVE_HUMAN_PLAYERS', durationMs: 70_000, evidence: 'GAME_RESULT' } }]);
  f.rooms.getResult('host', f.room.game!.id); f.usage.ended(f.room); f.usage.ended(f.room, true);
  expect(f.events.filter((e) => e.name === 'game_ended')).toHaveLength(1);
});
it('partida ordinaria por acciones legales; candidato final aún no es terminal; cancelación gana antes del límite', () => {
  for (const cancel of [false, true]) {
    const f = setup(); f.select(); f.join(); f.configure({ field: 'turnSeconds', value: 60 }); f.start(); let sequence = 0;
    while (f.room.status === 'IN_GAME') {
      const game = f.room.game!;
      if (f.room.gameReview) {
        if (game.result && cancel) {
          expect(f.events.filter((e) => e.name === 'game_ended')).toHaveLength(0);
          f.rooms.cancelGame('host', { roomId: f.room.id, gameId: game.id, requestId: 'cancel' }); break;
        }
        f.time.advance(5000); continue;
      }
      const turn = game.turn!; const person = f.room.participants.find((p) => p.id === turn.playerId)!;
      f.rooms.playCard(person.sessionId!, { requestId: `p${++sequence}`, roomId: f.room.id, gameId: game.id, roundNumber: game.round.number,
        turnId: turn.id, cardId: game.players.find((p) => p.id === turn.playerId)!.hand[0].id, direction: game.round.plays.length ? null : 'HIGH' });
    }
    expect(sequence).toBe(40);
    expect(f.events.filter((e) => e.name === 'game_ended')).toMatchObject([{ data: { reason: cancel ? 'HOST_CANCELLED' : 'DECK_COMPLETED' } }]);
    expect(f.events.filter((e) => e.name === 'human_became_automatic')).toHaveLength(0);
  }
});
it('parada controlada y sink roto no cambian reglas; cierres de espera no son inicios', () => {
  const f = setup(); f.rooms.close('host', f.room.id); expect(f.events.at(-1)).toMatchObject({ name: 'room_waiting_closed', data: { reason: 'HOST_CLOSED' } });
  const g = setup(); g.select(); g.join(); g.start(); g.time.elapse(999); g.usage.ended(g.room, true);
  expect(g.events.at(-1)).toMatchObject({ name: 'game_ended', data: { reason: 'TECHNICAL_INTERRUPTION', durationMs: 999 } });
  const broken = setup(true); broken.select(); broken.join(); broken.start(); expect(broken.room.status).toBe('IN_GAME');
});
it.each([-1, 0, 1])('frontera B13 revisión final %i ms: único motivo/retención, callbacks y A→B', (offset) => {
  const time = new ControlledTime(); const facts: UsageEvent[] = [];
  const usage = new UsageRecording({ tryRecord: (e) => { facts.push(e); return true; } }, time, randomUUID, 'test', 'SYNTHETIC', randomUUID());
  const f = manualApplication(2, { review: 5, turn: 15, usage, time });
  while (f.room.game!.resolution?.nextStage !== 'RESULTS') { if (f.room.gameReview) f.time.advance(5000); else f.play(); }
  expect(facts.filter((e) => e.name === 'game_ended')).toHaveLength(0);
  const callbacks = time.tasks.map((t) => t.callback); time.elapse(f.room.gameReview!.at - time.now().monotonic + offset);
  const cancel = { roomId: f.room.id, gameId: f.room.game!.id, requestId: 'cancel' };
  if (offset < 0) f.rooms.cancelGame('host', cancel); else expect(() => f.rooms.cancelGame('host', cancel)).toThrow('terminado');
  const ended = facts.filter((e) => e.name === 'game_ended'); expect(ended).toHaveLength(1);
  expect(ended[0].data.reason).toBe(offset < 0 ? 'HOST_CANCELLED' : 'DECK_COMPLETED');
  f.rooms.returnHome('host', { ...cancel, requestId: 'home' }); const next = f.rooms.createOrGet('host');
  for (const callback of callbacks) callback(); expect(f.rooms.current('host')!.id).toBe(next.id);
  expect(facts.filter((e) => e.name === 'game_ended')).toHaveLength(1);
  expect(new Set(facts.filter((e) => e.name === 'room_created').map((e) => e.data.roomRef)).size).toBe(2);
});
it.each(['TURN', 'REVIEW', 'FINAL_PHASE', 'TIE_BREAK', 'TIE_REVIEW'] as const)('cancelación %s no depende del candidato ni del destinatario', (phase) => {
  const time = new ControlledTime(); const facts: UsageEvent[] = [];
  const usage = new UsageRecording({ tryRecord: (e) => { facts.push(e); return true; } }, time, randomUUID, 'test', 'SYNTHETIC', randomUUID());
  const f = manualApplication(3, { observer: true, tie: true, review: 5, usage, time });
  if (phase === 'REVIEW') while (!f.room.gameReview) f.play();
  if (phase === 'FINAL_PHASE' || phase.startsWith('TIE')) {
    while (f.room.game!.phase !== (phase === 'FINAL_PHASE' ? 'FINAL_PHASE' : 'TIE_BREAK')) {
      if (f.room.gameReview) time.advance(5000); else f.play();
    }
    if (phase === 'TIE_REVIEW') while (!f.room.gameReview) f.play();
  }
  // Pérdida de emisión después del registro terminal: el reintento recupera sin otro hecho.
  f.events.updated.mockImplementationOnce(() => { throw new Error('emisión perdida'); });
  const input = { requestId: 'cancel', roomId: f.room.id, gameId: f.room.game!.id };
  expect(() => f.rooms.cancelGame('host', input)).toThrow('emisión perdida'); f.rooms.cancelGame('host', input);
  expect(facts.filter((e) => e.name === 'game_ended')).toMatchObject([{ data: { reason: 'HOST_CANCELLED' } }]);
});
