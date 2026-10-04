import { randomInt } from 'node:crypto';
import type { CardPermutation } from '../application/ports.js';

/** Fisher–Yates con entropía del proceso; nunca adopta una semilla del navegador. */
export const permuteCards: CardPermutation = (ids) => {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};
