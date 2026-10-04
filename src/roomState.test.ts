import { describe, expect, it } from 'vitest';
import type { RoomView } from '../shared/contracts/room';
import { acceptsRoom, countdownSeconds, automaticEndMessage } from './roomState';

const view = (revision: number, id = 'room-a', participantId = 'guest-a', status: 'WAITING' | 'IN_GAME' | 'RESULTS' = 'WAITING') => ({
  id, revision, status, participant: { id: participantId }
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
  it('B06 no degrada mesa a espera ni con confirmación tardía de revisión mayor', () => {
    const playing = view(5, 'room-a', 'guest-a', 'IN_GAME');
    for (const revision of [4, 5, 6]) expect(acceptsRoom(playing, view(revision), new Set(), new Set())).toBe(false);
    expect(acceptsRoom(playing, view(6, 'room-a', 'guest-a', 'IN_GAME'), new Set(), new Set())).toBe(true);
  });
  it('B07 resultado no degrada a ronda/espera, ni una respuesta de sala anterior desplaza la nueva', () => {
    const result = view(20, 'room-a', 'guest-a', 'RESULTS');
    for (const status of ['WAITING', 'IN_GAME'] as const) {
      expect(acceptsRoom(result, view(21, 'room-a', 'guest-a', status), new Set(), new Set())).toBe(false);
    }
    expect(acceptsRoom(result, view(19, 'room-a', 'guest-a', 'RESULTS'), new Set(), new Set())).toBe(false);
    expect(acceptsRoom(result, view(20, 'room-a', 'guest-a', 'RESULTS'), new Set(), new Set())).toBe(true);
    expect(acceptsRoom(view(1, 'room-b', 'guest-b'), result, new Set(), new Set())).toBe(false);
  });
});
