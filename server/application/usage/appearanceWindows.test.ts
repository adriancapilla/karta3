import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ControlledTime } from '../../../tests/support/controlledTime.js';
import { AppearanceWindows } from './appearanceWindows.js';
import type { AppearanceRequest, UsageScope } from './contracts.js';

function fixture(capacity = 4096, scheduled = false) {
  const time = new ControlledTime(); let enabled = true; let connected = true; let losses = 0; const scope: UsageScope = { active: true };
  const windows = new AppearanceWindows(time, randomUUID, () => enabled, () => { losses++; }, capacity, scheduled ? time : undefined);
  windows.connect({ ids: session => session === 'owner' ? ['a', 'b'] : [], connected: () => connected });
  const refs = { roomRef: randomUUID(), gameRef: randomUUID(), participationRef: randomUUID() };
  const open = () => windows.open('owner', 'game', 'START', refs, [scope], () => scope.active);
  const request = (token: string): AppearanceRequest => ({ eventId: randomUUID(), visitId: randomUUID(), version: 1, name: 'appearance_snapshot',
    data: { windowToken: token, gameId: 'game', moment: 'START', theme: 'LIGHT', origin: 'DEFAULT' } });
  return { time, windows, open, request, scope, losses: () => losses, enabled: (v: boolean) => { enabled = v; }, connected: (v: boolean) => { connected = v; } };
}
it('ventana por conexión, emisión única y primera admisión válida gana entre pestañas sin sobrescribir', () => {
  const f = fixture(); f.open(); const a = f.windows.take('owner', 'a', 'game', 'START')!; const b = f.windows.take('owner', 'b', 'game', 'START')!;
  expect(a.token).not.toBe(b.token); expect(f.windows.take('owner', 'a', 'game', 'START')).toBeUndefined();
  const request = f.request(a.token); let calls = 0; const record = () => { calls++; return true; };
  expect(f.windows.admit(request, 'foreign', record)).toBe('FORBIDDEN'); expect(calls).toBe(0);
  expect(f.windows.admit(request, 'owner', record)).toBe('ADMITTED');
  expect(f.windows.admit(request, 'owner', record)).toBe('IGNORED');
  expect(f.windows.admit({ ...request, data: { ...request.data, theme: 'DARK', origin: 'EXPLICIT' } }, 'owner', record)).toBe('CONFLICT');
  expect(f.windows.admit(f.request(b.token), 'owner', record)).toBe('IGNORED'); expect(calls).toBe(1);
});
it.each([9999, 10000, 10001])('caducidad exacta %i sin ejecutar callback y sin nueva oportunidad al recuperar', elapsed => {
  const f = fixture(); f.open(); const window = f.windows.take('owner', 'a', 'game', 'START')!;
  f.time.advance(elapsed); expect(f.windows.admit(f.request(window.token), 'owner', () => true)).toBe(elapsed < 10000 ? 'ADMITTED' : 'IGNORED');
  expect(f.windows.take('owner', 'new-connection', 'game', 'START')).toBeUndefined();
});
it('retirada/OFF/desconexión invalidan; cola caída no reserva ganador ni bloquea el juego', () => {
  for (const invalidate of ['permission', 'off', 'connection'] as const) {
    const f = fixture(); f.open(); const w = f.windows.take('owner', 'a', 'game', 'START')!;
    if (invalidate === 'permission') f.scope.active = false;
    if (invalidate === 'off') f.enabled(false);
    if (invalidate === 'connection') { f.windows.disconnected('a'); f.connected(false); }
    expect(f.windows.admit(f.request(w.token), 'owner', () => true)).toBe('IGNORED');
  }
  const f = fixture(); f.open(); const w = f.windows.take('owner', 'a', 'game', 'START')!; const input = f.request(w.token);
  expect(f.windows.admit(input, 'owner', () => false)).toBe('UNAVAILABLE'); expect(f.windows.admit(input, 'owner', () => true)).toBe('ADMITTED');
});
it('presupuesto acotado omite oportunidades y contabiliza pérdida, libera por vencimiento', () => {
  const f = fixture(1); f.open(); expect(f.losses()).toBe(1); expect(f.windows.take('owner', 'b', 'game', 'START')).toBeUndefined();
  f.time.advance(10000); f.open(); expect(f.windows.take('owner', 'a', 'game', 'START')).toBeDefined();
});
it('limpieza planificada: callback temprano/retrasado, generación cancelada y dispose no reabren oportunidades', () => {
  const f = fixture(1, true); f.open(); const first = f.windows.take('owner', 'a', 'game', 'START')!;
  const callback = f.time.tasks[0].callback; f.time.tasks[0].fired = true; callback(); expect(f.time.pending).toBe(1);
  f.time.elapse(10000); callback(); // Ya sustituido: no modifica la generación vigente.
  expect(f.windows.admit(f.request(first.token), 'owner', () => true)).toBe('IGNORED');
  f.open(); const next = f.windows.take('owner', 'a', 'game', 'START')!; expect(next.token).not.toBe(first.token);
  const extracted = f.time.tasks.at(-1)!.callback; f.windows.dispose(); extracted();
  expect(f.windows.admit(f.request(next.token), 'owner', () => true)).toBe('IGNORED'); expect(f.time.pending).toBe(0);
});
