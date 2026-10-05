import { expect, it } from 'vitest';
import { botPlayPolicy } from './botPlay.js';
import type { Card } from './deck.js';

const hand = (values: number[]): Card[] => values.map((value) => ({ id: `c${value}`, name: 'Carta', characteristic: '', roundAttribute: 'other', note: '',
  values: { active: { playValue: value, displayValue: '9999', unit: 'literal' }, other: { playValue: 59 - value, displayValue: '0', unit: '' } } }));
for (const value of [1, 29, 30, 58]) for (const difficulty of ['EASY', 'NORMAL'] as const) it(`${difficulty} abre extremo ${value} por atributo activo`, () => {
  expect(botPlayPolicy(hand([value]), 'active', true, null, difficulty)).toEqual({ cardId: `c${value}`, direction: value <= 29 ? 'LOW' : 'HIGH' });
});
it('EASY abre más antigua aunque no sea extrema; NORMAL distancias empatadas favorece HIGH', () => {
  expect(botPlayPolicy(hand([12, 1, 58]), 'active', true, null, 'EASY')).toEqual({ cardId: 'c12', direction: 'LOW' });
  expect(botPlayPolicy(hand([2, 57]), 'active', true, null, 'NORMAL')).toEqual({ cardId: 'c57', direction: 'HIGH' });
  expect(botPlayPolicy(hand([2, 56]), 'active', true, null, 'NORMAL')).toEqual({ cardId: 'c2', direction: 'LOW' });
});
for (const values of [[12, 33, 51], [12, 51], [12]]) for (const direction of ['HIGH', 'LOW'] as const) it(`políticas mano ${values.length} ${direction}`, () => {
  const ordered = [...values].sort((a, b) => (a - b) * (direction === 'HIGH' ? -1 : 1));
  expect(botPlayPolicy(hand(values), 'active', false, direction, 'EASY')).toEqual({ cardId: `c${ordered[Math.min(1, values.length - 1)]}`, direction: null });
  expect(botPlayPolicy(hand(values), 'active', false, direction, 'NORMAL')).toEqual({ cardId: `c${ordered[0]}`, direction: null });
});
it('rechaza HARD/tipos/niveles desconocidos, mano/atributo/dirección inválidos sin reparar', () => {
  for (const difficulty of ['HARD', true, 1, null, 'easy']) expect(() => botPlayPolicy(hand([1]), 'active', true, null, difficulty as 'EASY')).toThrow();
  for (const values of [[], [1, 2, 3, 4], [0], [59], [1, 1]]) expect(() => botPlayPolicy(hand(values), 'active', true, null, 'NORMAL')).toThrow();
  expect(() => botPlayPolicy(hand([1]), 'missing', true, null, 'NORMAL')).toThrow();
  expect(() => botPlayPolicy(hand([1]), 'active', false, null, 'NORMAL')).toThrow();
});
