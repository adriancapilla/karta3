import { describe, expect, it } from 'vitest';
import type { RoomView } from '../shared/contracts/room';
import { acceptsRoom, countdownSeconds, automaticEndMessage } from './roomState';

const view = (revision: number, id = 'room-a', participantId = 'guest-a') => ({
  id, revision, participant: { id: participantId }
}) as RoomView;

describe('aplicación de vistas recibidas fuera de orden', () => {
  it('B03 estima el contador con referencia del servidor y tiempo transcurrido, sin hora de navegador ni cierre local', () => {
    expect(countdownSeconds(1_860_000, 1_800_000, 0)).toBe(60);
    expect(countdownSeconds(1_860_000, 1_800_000, 999)).toBe(60);
    expect(countdownSeconds(1_860_000, 1_800_000, 1000)).toBe(59);
    expect(countdownSeconds(1_860_000, 1_800_000, 100_000)).toBe(0);
    expect(automaticEndMessage('RECONNECT_TIMEOUT')).toContain('Tu plaza se liberó');
    expect(automaticEndMessage('HOST_DISCONNECTED')).toContain('anfitrión');
    expect(automaticEndMessage('INACTIVITY')).toBe('La sala se cerró por inactividad');
  });
  it('acepta la revisión vigente y descarta revisiones anteriores o identidades distintas', () => {
    expect(acceptsRoom(view(3), view(4), new Set(), new Set())).toBe(true);
    expect(acceptsRoom(view(3), view(3), new Set(), new Set())).toBe(true);
    expect(acceptsRoom(view(3), view(2), new Set(), new Set())).toBe(false);
    expect(acceptsRoom(view(3), view(4, 'room-b'), new Set(), new Set())).toBe(false);
    expect(acceptsRoom(view(3), view(4, 'room-a', 'guest-b'), new Set(), new Set())).toBe(false);
  });

  it('no reabre una participación terminada ni una sala cerrada con un mensaje tardío', () => {
    expect(acceptsRoom(null, view(4), new Set(['guest-a']), new Set())).toBe(false);
    expect(acceptsRoom(null, view(4), new Set(), new Set(['room-a']))).toBe(false);
  });
});
