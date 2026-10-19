import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.doUnmock('socket.io-client'); });
it('un join que espera conexión conserva datos/requestId pero no envía el contexto invalidado', async () => {
  vi.resetModules(); const listeners = new Map<string, () => void>();
  const emit = vi.fn((_event: string, _payload: object, ack: (error: null, response: object) => void) => ack(null, { ok: true }));
  const socket = { connected: false, once: (event: string, handler: () => void) => listeners.set(event, handler),
    off: (event: string) => listeners.delete(event), connect: vi.fn(), timeout: () => ({ emit }) };
  vi.doMock('socket.io-client', () => ({ io: () => socket }));
  vi.stubGlobal('window', { setTimeout, clearTimeout });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202, headers: { 'X-Karta3-Usage-Collection': 'human' } })));
  const usage = await import('./usage'); const transport = await import('./socket'); usage.configureBrowserUsage('human');
  const context = usage.beginUsageIntent('join');
  const pending = transport.send('room:join', { requestId: 'mismo-request', code: '000042', name: 'Ensayo', usageContext: context });
  usage.invalidateBrowserUsage(); usage.configureBrowserUsage('human'); socket.connected = true; listeners.get('connect')!();
  await pending; expect(emit.mock.calls[0][1]).toEqual({ requestId: 'mismo-request', code: '000042', name: 'Ensayo' });
});
