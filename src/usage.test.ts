import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
async function setup() {
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(1_800_000_000_000);
  vi.stubGlobal('window', { setTimeout });
  const fetch = vi.fn().mockResolvedValue({ status: 202 }); vi.stubGlobal('fetch', fetch);
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
