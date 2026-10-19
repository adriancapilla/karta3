import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { UsageAdmission, safeUsageContext } from './http.js';

it('cubos 60/min/ráfaga10 y global120/s/240, mapa4096/30min', () => {
  let now = 0; const admission = new UsageAdmission(() => now); const visit = randomUUID();
  for (let i = 0; i < 10; i++) expect(admission.admit(visit)).toBe(true); expect(admission.admit(visit)).toBe(false);
  now += 1000; expect(admission.admit(visit)).toBe(true); expect(admission.admit(visit)).toBe(false);
  const global = new UsageAdmission(() => now);
  for (let i = 0; i < 240; i++) expect(global.admit(randomUUID())).toBe(true); expect(global.admit(randomUUID())).toBe(false);
  now += 1000; for (let i = 0; i < 120; i++) expect(global.admit(randomUUID())).toBe(true); expect(global.admit(randomUUID())).toBe(false);
  const capped = new UsageAdmission(() => now);
  for (let i = 0; i < 4096; i++) { now += 10; expect(capped.admit(randomUUID())).toBe(true); }
  now += 1000; expect(capped.admit(randomUUID())).toBe(false); expect(capped.size).toBe(4096);
  now += 30 * 60_000; expect(capped.admit(randomUUID())).toBe(true); expect(capped.size).toBe(1);
});
it('contexto256bytes estricto sin coerción', () => {
  const context = { visitId: randomUUID(), intentId: randomUUID() };
  expect(safeUsageContext(JSON.stringify(context))).toEqual(context);
  expect(safeUsageContext({ ...context, code: 'excluido' })).toBeUndefined(); expect(safeUsageContext('x'.repeat(257))).toBeUndefined();
  expect(safeUsageContext({ visitId: 1, intentId: null })).toBeUndefined();
});
