import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { botPlayPolicy, isBotDifficulty } from './botPlay.js';
import type { Card } from './deck.js';

type Decision = { values: number[]; attribute: 'active' | 'other'; baseDifficulty: 'EASY' | 'NORMAL';
  opening: boolean; direction: 'HIGH' | 'LOW' | null; expected: { cardId: string; direction: 'HIGH' | 'LOW' | null } };
it('T02 EASY/HARD equivalen a las 324 decisiones EASY/NORMAL capturadas antes de editar la base 4917d96', () => {
  const bytes = readFileSync(new URL('../../tests/fixtures/bot-policy-4917d96.json', import.meta.url), 'utf8');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('24855818d166edd5e590900f2b79189e5e0844812ae9b21c4ae6b7e74d557552');
  const captured = JSON.parse(bytes) as { baseCommit: string; decisions: Decision[] };
  expect(captured.baseCommit).toBe('4917d96bb36c1c805d9023d7c79dc4b98956e1d6'); expect(captured.decisions).toHaveLength(324);
  for (const vector of captured.decisions) {
    const hand: Card[] = vector.values.map((value) => ({ id: `c${value}`, name: 'Carta', characteristic: '', roundAttribute: 'other', note: '',
      values: { active: { playValue: value, displayValue: '9999', unit: 'literal' }, other: { playValue: 59 - value, displayValue: '0', unit: '' } } }));
    const difficulty = vector.baseDifficulty === 'NORMAL' ? 'HARD' : 'EASY';
    expect(botPlayPolicy(hand, vector.attribute, vector.opening, vector.direction, difficulty), JSON.stringify(vector)).toEqual(vector.expected);
  }
});
it('T02 dominio admite solo EASY/HARD sin alias ni coerción', () => {
  expect(isBotDifficulty('EASY')).toBe(true); expect(isBotDifficulty('HARD')).toBe(true);
  for (const value of ['NORMAL', 'UNKNOWN', 'hard', 'easy', true, false, 1, null, undefined, {}, []]) expect(isBotDifficulty(value)).toBe(false);
});
