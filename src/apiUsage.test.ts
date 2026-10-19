import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function setup() {
  vi.resetModules(); vi.stubGlobal('window', { setTimeout, clearTimeout });
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  return { fetch, api: (await import('./api')).api, usage: await import('./usage') };
}
it.each([204, 403, 503])('procesa OFF de HTTP %s antes de retorno/error y elimina contexto sin cambiar cuerpo de juego', async (status) => {
  const { fetch, api, usage } = await setup(); usage.configureBrowserUsage('human');
  fetch.mockResolvedValue(new Response(null, { status: 202, headers: { 'X-Karta3-Usage-Collection': 'human' } }));
  const context = usage.beginUsageIntent('create')!;
  fetch.mockResolvedValue(new Response(status === 204 ? null : '{}', { status, headers: { 'X-Karta3-Usage-Collection': 'off' } }));
  await api.close('sala-fabricada').catch(() => {});
  expect(usage.currentUsageContext(context)).toBeUndefined(); expect(usage.beginUsageIntent('join')).toBeUndefined();
  fetch.mockResolvedValue(new Response('{}'));
  await api.create(context); const request = fetch.mock.calls.at(-1)!;
  expect(request[1].body).toBe('{}'); expect(request[1].headers).not.toHaveProperty('X-Karta3-Usage-Context');
});
it('respuesta HUMAN anterior no invalida OFF más reciente; error de red invalida sin cambiar permisos de juego', async () => {
  const { fetch, api, usage } = await setup(); let old!: (value: Response) => void;
  fetch.mockImplementationOnce(() => new Promise<Response>(resolve => { old = resolve; }));
  const earlier = api.current(); fetch.mockResolvedValueOnce(new Response('{}', { headers: { 'X-Karta3-Usage-Collection': 'off' } }));
  await api.decks(); old(new Response('{}', { headers: { 'X-Karta3-Usage-Collection': 'human' } })); await earlier;
  expect(usage.beginUsageIntent('create')).toBeUndefined();
  usage.configureBrowserUsage('human'); fetch.mockRejectedValueOnce(new Error('offline'));
  await expect(api.current()).rejects.toMatchObject({ code: 'NETWORK_ERROR' }); expect(usage.beginUsageIntent('join')).toBeUndefined();
});
