import { afterEach, expect, it, vi } from 'vitest';
import type { RoomView } from '../shared/contracts/room';
import type { AppearanceValue } from '../shared/contracts/appearance';
const mocks = vi.hoisted(() => ({ value: { theme: 'LIGHT', origin: 'DEFAULT' } as AppearanceValue, record: vi.fn(), mode: 'human' as string | undefined }));
vi.mock('./appearance', () => ({ currentAppearance: () => mocks.value }));
vi.mock('./usage', () => ({ browserUsageMode: () => mocks.mode, recordAppearance: mocks.record }));
import { AppearanceCaptures } from './appearanceSnapshots';
afterEach(() => { mocks.record.mockClear(); mocks.mode = 'human'; mocks.value = { theme: 'LIGHT', origin: 'DEFAULT' }; vi.useRealTimers(); });
const room = (status: 'WAITING' | 'IN_GAME' | 'RESULTS', id = 'A', player = true) => ({ status, id, participant: { isPlayer: player }, game: { id: `game-${id}` }, result: { gameId: `game-${id}` } }) as unknown as RoomView;
it('ack antes del evento y misma revisión congelan una vez, sin remuestrear al llegar metadata', () => {
  const captures = new AppearanceCaptures(); captures.transition(room('WAITING'), room('IN_GAME'), 'connection');
  mocks.value = { theme: 'DARK', origin: 'EXPLICIT' }; captures.transition(room('IN_GAME'), room('IN_GAME'), 'connection');
  const window = { gameId: 'game-A', moment: 'START' as const, token: 'window', expiresAt: Date.now() + 10000 };
  captures.window(window, 'connection', () => true); captures.window(window, 'connection', () => true);
  expect(mocks.record).toHaveBeenCalledOnce(); expect(mocks.record.mock.calls[0][0]).toMatchObject({ theme: 'LIGHT', origin: 'DEFAULT' });
});
it('recuperación, observador, sin permiso y conexión nueva no fabrican fotos; END de A no reaplica A sobre B', () => {
  const captures = new AppearanceCaptures(); const window = { gameId: 'game-A', moment: 'END' as const, token: 'window', expiresAt: Date.now() + 10000 };
  captures.transition(null, room('RESULTS'), 'connection'); captures.window(window, 'connection', () => true); expect(mocks.record).not.toHaveBeenCalled();
  captures.transition(room('IN_GAME', 'A', false), room('RESULTS', 'A', false), 'connection'); captures.window(window, 'connection', () => true); expect(mocks.record).not.toHaveBeenCalled();
  mocks.mode = undefined; captures.transition(room('IN_GAME'), room('RESULTS'), 'connection'); mocks.mode = 'human'; captures.window(window, 'connection', () => true); expect(mocks.record).not.toHaveBeenCalled();
  captures.transition(room('IN_GAME'), room('RESULTS'), 'connection'); captures.window(window, 'new-connection', () => true); expect(mocks.record).not.toHaveBeenCalled();
  captures.transition(room('RESULTS'), room('WAITING', 'B'), 'connection'); captures.window(window, 'connection', () => true); expect(mocks.record).toHaveBeenCalledOnce();
  captures.clear(); expect(mocks.record.mock.calls[0][1]()).toBe(false);
});
it('evento antes del ack y borde local de diez segundos: una foto y ningún reintento vencido', () => {
  vi.useFakeTimers({ toFake: ['performance'] });
  const c = new AppearanceCaptures(); c.transition(room('WAITING'), room('IN_GAME'), 'connection');
  const window = { gameId: 'game-A', moment: 'START' as const, token: 'window', expiresAt: Date.now() + 10000 };
  c.window(window, 'connection', () => true); c.transition(room('IN_GAME'), room('IN_GAME'), 'connection');
  c.window(window, 'connection', () => true); expect(mocks.record).toHaveBeenCalledOnce();
  const retry = mocks.record.mock.calls[0][1]; vi.advanceTimersByTime(9999); expect(retry()).toBe(true);
  vi.advanceTimersByTime(1); expect(retry()).toBe(false);
});
