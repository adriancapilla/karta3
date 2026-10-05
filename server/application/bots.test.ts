import { expect, it } from 'vitest';
import { initialGameCases } from '../../tests/support/initialGameCases.js';
import type { BotOperation, WaitingRoomView } from '../../shared/contracts/room.js';

const setup = () => {
  const f = initialGameCases(); let n = 0;
  const bot = (operation: BotOperation = { type: 'ADD' }, id = `bot-${++n}`, session = 'host') => f.rooms.bot(session, id, f.room.id, operation);
  return { ...f, bot };
};
it('P1 añade NORMAL/IDs únicos/números crecientes; replay, retirada y nombres duplicados sin sesiones bot', () => {
  const f = setup(); const one = f.bot({ type: 'ADD' }, 'one'); const two = f.bot();
  expect(one.room.participant.kind).toBe('HUMAN'); expect(one.botId).not.toBe(two.botId);
  f.bot({ type: 'RENAME', botId: one.botId, name: '  Bot 2  ' });
  f.bot({ type: 'DIFFICULTY', botId: one.botId, difficulty: 'EASY' });
  const remove = f.bot({ type: 'REMOVE', botId: one.botId }, 'remove');
  expect(f.events.updated.mock.lastCall![1]).toMatchObject({ kind: 'BOT_REMOVED', participantId: one.botId, name: 'Bot 2 (1)' });
  expect(f.events.left).not.toHaveBeenCalled(); expect(f.bot({ type: 'REMOVE', botId: one.botId }, 'remove')).toEqual(remove);
  const three = f.bot(); expect(three.room.participants.map((p) => p.name)).toEqual(['Bot 2', 'Bot 3', 'Jugador 1']);
  expect(f.bot({ type: 'ADD' }, 'one').botId).toBe(one.botId); expect(f.room.playerCount).toBe(3);
  expect(f.room.memberSessions).toEqual(['host']); expect(f.room.deadlines().some((d) => d.kind === 'ABSENCE')).toBe(false);
  for (const person of f.room.participants.filter((p) => p.kind === 'BOT')) {
    expect(person).not.toHaveProperty('sessionId'); expect(person.presence).toBeNull();
    expect(f.repository.findActiveBySession(person.id)).toBeUndefined(); expect(f.room.participantFor(person.id)).toBeUndefined();
  }
  expect(f.requests.get('host', 'one')).toEqual({ kind: 'BOT_ADD', signature: JSON.stringify([f.room.id, 'ADD', null, null]), roomId: f.room.id, participantId: f.room.participantId, botId: one.botId });
});
it('P1 orden mixto/nivel/nombre no mueven; última plaza add/add, add/join, add/hostPlays y reserva humana', () => {
  const f = setup(); f.configure({ field: 'hostPlays', value: false }); const one = f.bot(); f.join(); const two = f.bot(); const three = f.bot();
  const original = f.room.participants.map((p) => p.id);
  f.bot({ type: 'DIFFICULTY', botId: two.botId, difficulty: 'EASY' }); f.bot({ type: 'RENAME', botId: one.botId, name: 'Ana' });
  expect(f.room.participants.map((p) => p.id)).toEqual(original);
  f.connected.delete('g0'); f.rooms.presenceChanged('g0'); const absence = f.room.deadlines().find((d) => d.kind === 'ABSENCE')!;
  f.bot(); expect(f.room.playerCount).toBe(5); expect(() => f.bot()).toThrow('No quedan plazas');
  expect(() => f.join('g1')).toThrow('llena'); expect(() => f.configure({ field: 'hostPlays', value: true })).toThrow('plaza');
  expect(f.room.deadlines()).toContainEqual(absence);
  f.bot({ type: 'REMOVE', botId: three.botId }); f.configure({ field: 'hostPlays', value: true }); expect(() => f.bot()).toThrow('plazas');
  expect(f.room.participants.at(-1)!.role).toBe('HOST'); f.time.advance(30_000); expect(f.room.playerCount).toBe(4);
});
it('P1 efecto renueva, iguales/replays/errores/lecturas no; no renueva reserva ajena y caducidad exacta primero', () => {
  const f = setup(); f.join(); f.connected.delete('g0'); f.rooms.presenceChanged('g0'); const reserve = f.room.deadlines().find((d) => d.kind === 'ABSENCE');
  f.time.elapse(1000); const one = f.bot(); const view = one.room as WaitingRoomView; expect(view.lifecycle.expiresAt).toBe(f.time.now().unix + 1800000);
  expect(f.room.deadlines()).toContainEqual(reserve); const revision = f.room.revision;
  f.time.elapse(1000); f.bot({ type: 'DIFFICULTY', botId: one.botId, difficulty: 'NORMAL' });
  f.bot({ type: 'RENAME', botId: one.botId, name: ' Bot 1 ' }); f.rooms.current('host');
  expect(f.room.revision).toBe(revision); expect(f.room.lifecycle(0).expiresAt).toBe(view.lifecycle.expiresAt);
  f.time.elapse(1800000); expect(() => f.bot({ type: 'RENAME', botId: one.botId, name: 'Tarde' })).toThrow('no está disponible');
  expect(f.repository.findById(f.room.id)).toBeUndefined(); expect(f.events.closed).toHaveBeenCalledTimes(1);
});
it('P1 permisos, objetivos, nombres/niveles inválidos y conflicto; observer gestiona', () => {
  const f = setup(); f.join(); const one = f.bot();
  for (const session of ['g0', 'third']) expect(() => f.bot({ type: 'ADD' }, `deny-${session}`, session)).toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));
  for (const botId of ['unknown', f.room.participantId, f.room.participantFor('g0')!.id]) expect(() => f.bot({ type: 'REMOVE', botId })).toThrow('bot');
  for (const name of ['', 'a'.repeat(17), '\n', '\u200b']) expect(() => f.bot({ type: 'RENAME', botId: one.botId, name })).toThrow();
  for (const difficulty of ['HARD', false, 1]) expect(() => f.bot({ type: 'DIFFICULTY', botId: one.botId, difficulty: difficulty as 'EASY' })).toThrow('Fácil');
  f.bot({ type: 'RENAME', botId: one.botId, name: 'A' }, 'shared'); expect(() => f.bot({ type: 'REMOVE', botId: one.botId }, 'shared')).toThrow('otros datos');
  f.configure({ field: 'hostPlays', value: false }); expect(f.bot().room.participant.isPlayer).toBe(false);
});
it('P1 registro antes de emisión: fallo al añadir/retirar no duplica ni restaura', () => {
  const f = setup(); f.events.updated.mockImplementationOnce(() => { throw new Error('emisión'); });
  expect(() => f.bot({ type: 'ADD' }, 'lost')).toThrow('emisión'); const accepted = f.bot({ type: 'ADD' }, 'lost');
  expect(accepted.room.participants).toHaveLength(2); expect(accepted.room.participants[0].name).toBe('Bot 1');
  f.events.updated.mockImplementationOnce(() => { throw new Error('emisión'); });
  expect(() => f.bot({ type: 'REMOVE', botId: accepted.botId }, 'remove')).toThrow('emisión');
  const replay = f.bot({ type: 'REMOVE', botId: accepted.botId }, 'remove'); expect(replay.room.participants).toHaveLength(1);
  expect(() => f.bot({ type: 'REMOVE', botId: accepted.botId })).toThrow('bot');
});
it.each([1799999, 1800000, 1800001])('B09 B03 límite %i sin callbacks: gestión aplica primero caducidad y nunca registra ausencias BOT', (at) => {
  const f = setup(); const bot = f.bot(); f.time.elapse(at);
  if (at < 1800000) {
    const view = f.bot({ type: 'RENAME', botId: bot.botId, name: 'Antes' }).room as WaitingRoomView;
    expect(view.lifecycle.expiresAt).toBe(f.time.now().unix + 1800000);
  } else {
    expect(() => f.bot({ type: 'RENAME', botId: bot.botId, name: 'Tarde' })).toThrow(expect.objectContaining({ code: 'ROOM_NOT_AVAILABLE' }));
    expect(f.repository.findById(f.room.id)).toBeUndefined(); expect(f.events.closed).toHaveBeenCalledTimes(1);
  }
  expect(f.repository.findActiveBySession(bot.botId)).toBeUndefined(); expect(f.room.deadlines().filter((deadline) => deadline.kind === 'ABSENCE')).toEqual([]);
});
