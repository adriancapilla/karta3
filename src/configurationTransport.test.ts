import { afterEach, expect, it, vi } from 'vitest';
const transport = vi.hoisted(() => ({ connected: false, timeout: vi.fn(), emit: vi.fn(), connect: vi.fn() }));
vi.mock('socket.io-client', () => ({ io: () => ({ get connected() { return transport.connected; }, volatile: { timeout: transport.timeout }, connect: transport.connect }) }));
import { sendConfiguration, ACK_TIMEOUT_MS } from './socket';
afterEach(() => { vi.clearAllMocks(); transport.connected = false; });
const request = { requestId: 'id', roomId: 'room', change: { field: 'turnSeconds', value: 15 } } as const;
it('B05-13 un gesto offline falla sin conectar, esperar ni emitir', async () => {
  await expect(sendConfiguration(request)).rejects.toMatchObject({ code: 'NOT_CONNECTED' });
  expect(transport.timeout).not.toHaveBeenCalled(); expect(transport.emit).not.toHaveBeenCalled(); expect(transport.connect).not.toHaveBeenCalled();
});
it('B05-08 el envío conectado es volátil, un solo control y confirma/indica incertidumbre sin reenviar', async () => {
  transport.connected = true; transport.timeout.mockReturnValue({ emit: transport.emit });
  transport.emit.mockImplementationOnce((_event, _request, callback) => callback(null, { ok: true, room: { id: 'room' } }));
  expect(await sendConfiguration(request)).toMatchObject({ room: { id: 'room' } });
  expect(transport.timeout).toHaveBeenCalledWith(ACK_TIMEOUT_MS);
  expect(transport.emit).toHaveBeenCalledWith('room:configure', request, expect.any(Function));
  transport.emit.mockImplementationOnce((_event, _request, callback) => callback(new Error('timeout')));
  await expect(sendConfiguration(request)).rejects.toMatchObject({ code: 'NETWORK_ERROR', message: expect.stringContaining('No se pudo confirmar el cambio') });
  expect(transport.emit).toHaveBeenCalledTimes(2);
});
