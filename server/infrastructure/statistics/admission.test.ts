import { expect, it } from 'vitest';
import { Admission } from './http.js';
it('A05/A06: BROWSER global 120/s y ráfaga240, sin mapas de HOME; controles 60/min y ráfaga10', () => {
  let now = 0; const global = new Admission(() => now);
  for (let n = 0; n < 240; n++) expect(global.allow()).toBe(true); expect(global.allow()).toBe(false);
  expect((global as unknown as { sessions: Map<string, unknown> }).sessions.size).toBe(0);
  now = 1000; for (let n = 0; n < 120; n++) expect(global.allow()).toBe(true); expect(global.allow()).toBe(false);
  const controls = new Admission(() => now);
  for (let n = 0; n < 10; n++) expect(controls.allow('functional-session')).toBe(true); expect(controls.allow('functional-session')).toBe(false);
  now += 1000; expect(controls.allow('functional-session')).toBe(true); expect(controls.allow('functional-session')).toBe(false);
});
it('A05: mapa de controles máximo4096 y caducidad; no claves IP/visita o persistencia', () => {
  let now = 0; const a = new Admission(() => now);
  for (let n = 0; n < 4096; n++) { if (n % 200 === 0) now += 2000; expect(a.allow(`functional-${n}`)).toBe(true); }
  expect(a.allow('one-over')).toBe(false); now += 60_000; expect(a.allow('new')).toBe(true);
  expect((a as unknown as { sessions: Map<string, unknown> }).sessions.size).toBe(1);
});
