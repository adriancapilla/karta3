import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllGlobals(); });
async function setup(oldNotice = false) {
  vi.resetModules(); const listeners = new Map<string, () => void>();
  const document = { visibilityState: 'hidden', cookie: '', addEventListener: (name: string, callback: () => void) => listeners.set(name, callback) };
  vi.stubGlobal('document', document); vi.stubGlobal('window', { setTimeout, clearTimeout }); vi.stubGlobal('BroadcastChannel', undefined);
  const fetch = vi.fn(async (url: string) => new Response(url.endsWith('exclusion') ? JSON.stringify({ version: 1, excluded: false, revision: 100, persistence: 'MEMORY_ONLY', eligibility: 'DEFAULT_ALLOWED' })
    : url.endsWith('appearance-permission') ? JSON.stringify({ version: 1, state: oldNotice ? 'GRANTED' : 'UNDECIDED', noticeVersion: oldNotice ? 'previous' : '2026-10-20.2', revision: 100, validUntil: oldNotice ? Date.now() + 10000 : null })
      : null, { status: url.endsWith('home-view') ? 202 : 200, headers: { 'X-Karta3-Statistics-Collection': 'synthetic' } }));
  vi.stubGlobal('fetch', fetch); const statistics = await import('./statistics'); return { statistics, document, listeners, fetch };
}
it('A06: visibilidad controlada difiere HOME; rerender/StrictMode y ocultar/mostrar no duplican; retorno sí', async () => {
  const s = await setup(); s.statistics.statisticsHome(true); s.statistics.startStatistics(); await s.statistics.refreshStatistics();
  const count = () => s.fetch.mock.calls.filter(([url]) => url.endsWith('/home-view')).length;
  expect(count()).toBe(0); s.document.visibilityState = 'visible'; s.listeners.get('visibilitychange')!(); expect(count()).toBe(1);
  s.statistics.statisticsHome(true); s.statistics.statisticsHome(true); expect(count()).toBe(1);
  s.document.visibilityState = 'hidden'; s.listeners.get('visibilitychange')!(); s.document.visibilityState = 'visible'; s.listeners.get('visibilitychange')!(); expect(count()).toBe(1);
  s.statistics.statisticsHome(false); s.statistics.statisticsHome(true); expect(count()).toBe(2);
  const requests = vi.mocked(globalThis.fetch).mock.calls.filter(([url]) => String(url).endsWith('/home-view'));
  expect(requests.map(([, init]) => JSON.parse(String(init?.body)))).toEqual([{ version: 1 }, { version: 1 }]);
});
it.each([false, true])('A07: permiso ausente o de aviso anterior=%s no transmite foto; HOME es independiente', async oldNotice => {
  const s = await setup(oldNotice); s.document.visibilityState = 'visible'; s.statistics.statisticsHome(true); s.statistics.startStatistics(); await s.statistics.refreshStatistics();
  expect(s.statistics.canCaptureAppearance()).toBe(false);
  s.statistics.recordAppearance({ gameId: 'functional-game', moment: 'START', windowToken: 'functional-token', theme: 'LIGHT', origin: 'DEFAULT' }, () => true);
  expect(s.fetch.mock.calls.filter(([url]) => url.endsWith('/appearance'))).toHaveLength(0);
  expect(s.fetch.mock.calls.filter(([url]) => url.endsWith('/home-view'))).toHaveLength(1);
});
