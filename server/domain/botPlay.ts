import type { Card } from './deck.js';

export type BotDifficulty = 'EASY' | 'HARD';
export function isBotDifficulty(value: unknown): value is BotDifficulty { return value === 'EASY' || value === 'HARD'; }

/** Entrada limitada a mano propia en adquisición y datos públicos necesarios. Sin memoria de rivales. */
export function botPlayPolicy(hand: readonly Card[], attribute: string, opening: boolean,
  direction: 'HIGH' | 'LOW' | null, difficulty: BotDifficulty): { cardId: string; direction: 'HIGH' | 'LOW' | null } {
  if (!isBotDifficulty(difficulty) || hand.length < 1 || hand.length > 3
    || hand.some((card) => !Number.isInteger(card.values[attribute]?.playValue) || card.values[attribute].playValue < 1 || card.values[attribute].playValue > 58)
    || new Set(hand.map((card) => card.values[attribute].playValue)).size !== hand.length
    || !opening && direction !== 'HIGH' && direction !== 'LOW') throw new Error('Mano, atributo o dificultad incompatibles.');
  const value = (card: Card) => card.values[attribute].playValue;
  if (opening) {
    const distance = (card: Card) => Math.min(value(card), 59 - value(card));
    const card = difficulty === 'EASY' ? hand[0] : [...hand].sort((a, b) => distance(a) - distance(b) || value(b) - value(a))[0];
    return { cardId: card.id, direction: value(card) <= 29 ? 'LOW' : 'HIGH' };
  }
  const ordered = [...hand].sort((a, b) => (value(a) - value(b)) * (direction === 'HIGH' ? -1 : 1));
  return { cardId: ordered[difficulty === 'HARD' || hand.length === 1 ? 0 : 1].id, direction: null };
}
