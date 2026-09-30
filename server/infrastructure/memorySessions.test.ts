import { expect, it } from 'vitest';
import { MemorySessions } from './memorySessions.js';

it('B03 último fin mínimo: copia, aislamiento, eliminación con sesión y pérdida al reiniciar', () => {
  const sessions = new MemorySessions();
  const a = sessions.establish(); const b = sessions.establish();
  sessions.saveEnd(a.id, { roomId: 'room', participantId: 'guest', reason: 'RECONNECT_TIMEOUT' });
  const end = sessions.getEnd(a.id)!;
  end.roomId = 'alterado';
  expect(sessions.getEnd(a.id)?.roomId).toBe('room');
  expect(sessions.getEnd(b.id)).toBeUndefined();
  expect(new MemorySessions().getEnd(a.id)).toBeUndefined();
  sessions.remove(a.id);
  expect(sessions.get(a.token)).toBeUndefined();
  expect(sessions.getEnd(a.id)).toBeUndefined();
  expect(sessions.get(b.token)).toBe(b.id);
});
