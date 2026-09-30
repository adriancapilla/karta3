import { describe, expect, it } from 'vitest';
import type { RoomView } from '../shared/contracts/room';
import { acceptsRoom } from './roomState';

const view = (revision: number, id = 'room-a', participantId = 'guest-a') => ({
  id, revision, participant: { id: participantId }
}) as RoomView;

describe('aplicación de vistas recibidas fuera de orden', () => {
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
