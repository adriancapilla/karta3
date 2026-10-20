import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.doUnmock('socket.io-client'); });
async function setup() {
  vi.resetModules(); vi.stubGlobal('window', { setTimeout, clearTimeout });
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  return { fetch, api: (await import('./api')).api, statistics: await import('./statistics') };
}
it.each([204, 403, 503])('HTTP %s OFF se procesa antes del retorno/error sin modificar operaciones de juego', async status => {
  const { fetch, api, statistics } = await setup(); statistics.collectionSignal('synthetic', statistics.statisticsTicket());
  fetch.mockResolvedValue(new Response(status === 204 ? null : '{}', { status, headers: { 'X-Karta3-Statistics-Collection': 'off' } }));
  await api.close('sala-fabricada').catch(() => {}); expect(statistics.statisticsState().available).toBe(false);
  fetch.mockResolvedValue(new Response('{}')); await api.create();
  expect(fetch.mock.calls.at(-1)![1]).toMatchObject({ body: '{}', headers: { 'Content-Type': 'application/json' } });
});
it('una respuesta antigua no reactiva disponibilidad más reciente; fallo de red suspende fotos sin cambiar juego', async () => {
  const { fetch, api, statistics } = await setup(); let old!: (value: Response) => void;
  fetch.mockImplementationOnce(() => new Promise<Response>(resolve => { old = resolve; })); const earlier = api.current();
  fetch.mockResolvedValueOnce(new Response('{}', { headers: { 'X-Karta3-Statistics-Collection': 'off' } })); await api.decks();
  old(new Response('{}', { headers: { 'X-Karta3-Statistics-Collection': 'aggregate' } })); await earlier;
  expect(statistics.statisticsState().available).toBe(false);
  fetch.mockRejectedValueOnce(new Error('offline')); await expect(api.current()).rejects.toMatchObject({ code: 'NETWORK_ERROR' }); expect(statistics.canCaptureAppearance()).toBe(false);
});
it('join que espera conexión conserva requestId/código/nombre sin contexto estadístico', async () => {
  vi.resetModules(); const listeners = new Map<string, () => void>();
  const emit = vi.fn((_event: string, _payload: object, ack: (error: null, response: object) => void) => ack(null, { ok: true }));
  const socket = { connected: false, once: (event: string, handler: () => void) => listeners.set(event, handler),
    off: (event: string) => listeners.delete(event), connect: vi.fn(), timeout: () => ({ emit }) };
  vi.doMock('socket.io-client', () => ({ io: () => socket })); vi.stubGlobal('window', { setTimeout, clearTimeout });
  const transport = await import('./socket'); const pending = transport.send('room:join', { requestId: 'mismo-request', code: '000042', name: 'Ensayo' });
  socket.connected = true; listeners.get('connect')!(); await pending;
  expect(emit.mock.calls[0][1]).toEqual({ requestId: 'mismo-request', code: '000042', name: 'Ensayo' });
});
