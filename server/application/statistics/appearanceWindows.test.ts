import { expect, it } from 'vitest';
import { AppearanceWindows } from './appearanceWindows.js';
import { ControlledTime } from '../../../tests/support/controlledTime.js';
it('A07: ventanas por conexión, entrega una vez, permiso revocado y borde 10s sin callback', () => {
  const time = new ControlledTime(); let sequence = 0; let permitted = true; let received = 0;
  const w = new AppearanceWindows(time, time, () => `token-${++sequence}`); w.connect({ ids: () => ['a', 'b'], connected: () => true });
  w.open('session', 'game', 'START', () => permitted, () => { received++; return true; });
  const a = w.take('session', 'a', 'game', 'START')!; const b = w.take('session', 'b', 'game', 'START')!;
  expect(a.token).not.toBe(b.token); expect(w.take('session', 'a', 'game', 'START')).toBeUndefined();
  const photo = { version: 1 as const, gameId: 'game', moment: 'START' as const, windowToken: a.token, theme: 'LIGHT' as const, origin: 'DEFAULT' as const };
  expect(w.admit(photo, 'other')).toBe('FORBIDDEN'); time.elapse(9999); expect(w.admit(photo, 'session')).toBe('ADMITTED');
  time.elapse(1); expect(w.admit({ ...photo, windowToken: b.token }, 'session')).toBe('IGNORED'); expect(received).toBe(1);
  w.open('session', 'game', 'END', () => permitted, () => true); permitted = false;
  expect(w.take('session', 'a', 'game', 'END')).toBeUndefined(); w.dispose();
});
it('A07: desconectar e invalidar elimina oportunidades; callback cancelado no reabre otra generación', () => {
  const time = new ControlledTime(); const w = new AppearanceWindows(time, time, () => 'token'); w.connect({ ids: () => ['connection'], connected: () => true });
  w.open('session', 'A', 'START', () => true, () => true); const old = time.tasks.at(-1)!; w.disconnected('connection');
  w.open('session', 'B', 'START', () => true, () => true); old.callback();
  expect(w.take('session', 'connection', 'B', 'START')?.gameId).toBe('B'); w.invalidate('session'); expect(w.take('session', 'connection', 'B', 'START')).toBeUndefined(); w.dispose();
});
