import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
async function setup() {
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(1_800_000_000_000);
  vi.stubGlobal('window', { setTimeout, clearTimeout });
  const fetch = vi.fn().mockResolvedValue({ status: 202, headers: new Headers({ 'X-Karta3-Usage-Collection': 'synthetic' }) }); vi.stubGlobal('fetch', fetch);
  const usage = await import('./usage'); usage.configureBrowserUsage('synthetic'); return { usage, fetch };
}
it('documento/StrictMode/rerender no duplica; visita técnica rota por inactividad y máximo', async () => {
  const { usage, fetch } = await setup(); usage.usageHome(true); usage.usageHome(true); expect(fetch).toHaveBeenCalledTimes(1);
  const a = usage.beginUsageIntent('create')!; vi.setSystemTime(Date.now() + 29 * 60_000);
  const b = usage.beginUsageIntent('join')!; expect(a.visitId).toBe(b.visitId); expect(a.intentId).not.toBe(b.intentId);
  vi.setSystemTime(Date.now() + 30 * 60_000); const c = usage.beginUsageIntent('create')!; expect(c.visitId).not.toBe(a.visitId);
  for (let i = 0; i < 24; i++) { vi.setSystemTime(Date.now() + 29 * 60_000); usage.beginUsageIntent('join'); }
  const d = usage.beginUsageIntent('join')!; vi.setSystemTime(Date.now() + 29 * 60_000);
  const e = usage.beginUsageIntent('join')!; expect(e.visitId).not.toBe(d.visitId);
  usage.usageHome(false); usage.usageHome(true); expect(JSON.parse(fetch.mock.calls.at(-1)![1].body).data.navigation).toBe('SPA_RETURN');
});
it('solo un reintento en memoria conserva eventId; apagado no genera intención ni tráfico', async () => {
  const { usage, fetch } = await setup(); fetch.mockRejectedValue(new Error('network'));
  usage.usageHome(true); await vi.advanceTimersByTimeAsync(500); await vi.advanceTimersByTimeAsync(10_000);
  expect(fetch).toHaveBeenCalledTimes(2); expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[1][1].body);
  usage.configureBrowserUsage(null); expect(usage.beginUsageIntent('create')).toBeUndefined(); expect(fetch).toHaveBeenCalledTimes(2);
});
it.each([null, 'off', '', 'HUMAN', 'unknown'])('OFF %s cancela reintento, visita y contextos; respuesta positiva vieja no reactiva', async (signal) => {
  const { usage, fetch } = await setup(); const uuid = vi.spyOn(crypto, 'randomUUID');
  fetch.mockRejectedValue(new Error('network'));
  const context = usage.beginUsageIntent('join')!; const old = usage.usageSignalTicket();
  await vi.advanceTimersByTimeAsync(100);
  usage.configureBrowserUsage(signal); const count = uuid.mock.calls.length;
  usage.configureBrowserUsage('human', old);
  expect(usage.currentUsageContext(context)).toBeUndefined(); expect(usage.beginUsageIntent('create')).toBeUndefined();
  usage.usageHome(true); await vi.advanceTimersByTimeAsync(10_000);
  expect(fetch).toHaveBeenCalledTimes(1); expect(uuid).toHaveBeenCalledTimes(count);
  uuid.mockRestore();
});
it('reactivar human no recupera portada/reintentos/contexto anteriores, y recibe nueva visita solo por gesto', async () => {
  const { usage, fetch } = await setup(); usage.usageHome(true); const before = usage.beginUsageIntent('create')!;
  usage.invalidateBrowserUsage(); const callback = vi.fn(); const unsubscribe = usage.onUsageInvalidated(callback);
  usage.configureBrowserUsage('human'); usage.usageHome(true);
  expect(fetch).toHaveBeenCalledTimes(2); expect(usage.currentUsageContext(before)).toBeUndefined();
  const next = usage.beginUsageIntent('join')!; expect(next.visitId).not.toBe(before.visitId);
  expect(usage.currentUsageContext(next)).toBe(next);
  usage.invalidateBrowserUsage(); expect(callback).toHaveBeenCalledOnce(); unsubscribe();
});
it('204/503 OFF de la ingesta invalida antes de decidir otro reintento', async () => {
  const { usage, fetch } = await setup();
  fetch.mockResolvedValue({ status: 503, headers: new Headers({ 'X-Karta3-Usage-Collection': 'off' }) });
  usage.beginUsageIntent('create'); await vi.advanceTimersByTimeAsync(10_000);
  expect(fetch).toHaveBeenCalledOnce(); expect(usage.beginUsageIntent('join')).toBeUndefined();
});
