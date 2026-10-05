import type { Card } from './deck.js';

/** Solo mano propia y atributo público. La adquisición, nunca el orden visual, decide antigüedad. */
export function autoPlayPolicy(hand: readonly Card[], activeAttributeId: string, opening: boolean,
  acceptedDirection: 'HIGH' | 'LOW' | null = null): { cardId: string; direction: 'HIGH' | 'LOW' | null } {
  const oldest = hand[0];
  if (!oldest || !oldest.values[activeAttributeId]) throw new Error('Mano o atributo incompatibles.');
  return { cardId: oldest.id, direction: opening
    ? acceptedDirection ?? (oldest.values[activeAttributeId].playValue <= 29 ? 'HIGH' : 'LOW') : null };
}
