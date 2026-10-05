import { expect, it } from 'vitest';
import { botInput } from './botInput.js';

const base = { requestId: 'request', roomId: 'room' };
it('P1 cuatro formas exactas sin identidad cliente', () => {
  expect(botInput(base, 'ADD')).toEqual({ ...base, operation: { type: 'ADD' } });
  expect(botInput({ ...base, botId: 'bot' }, 'REMOVE').operation).toEqual({ type: 'REMOVE', botId: 'bot' });
  expect(botInput({ ...base, botId: 'bot', name: ' A ' }, 'RENAME').operation).toEqual({ type: 'RENAME', botId: 'bot', name: ' A ' });
  for (const difficulty of ['EASY', 'NORMAL']) expect(botInput({ ...base, botId: 'bot', difficulty }, 'DIFFICULTY').operation).toEqual({ type: 'DIFFICULTY', botId: 'bot', difficulty });
});
it('P1 tipos/campos/IDs/niveles falsos no se coercionan', () => {
  for (const type of ['ADD', 'REMOVE', 'RENAME', 'DIFFICULTY'] as const) {
    const input = { ...base, ...(type === 'ADD' ? {} : { botId: 'bot' }), ...(type === 'RENAME' ? { name: 'A' } : type === 'DIFFICULTY' ? { difficulty: 'NORMAL' } : {}) };
    for (const field of Object.keys(input)) { const absent = { ...input }; delete absent[field as keyof typeof absent]; expect(() => botInput(absent, type)).toThrow(); }
    for (const extra of ['sessionId', 'kind', 'host', 'nameOverride', 'revision']) expect(() => botInput({ ...input, [extra]: 'fake' }, type)).toThrow();
    for (const id of ['', true, 12, null, 'x'.repeat(101)]) expect(() => botInput({ ...input, requestId: id }, type)).toThrow();
  }
  for (const difficulty of [true, false, 1, 'HARD', 'easy', null]) expect(() => botInput({ ...base, botId: 'bot', difficulty }, 'DIFFICULTY')).toThrow();
  for (const name of [true, 1, null, []]) expect(() => botInput({ ...base, botId: 'bot', name }, 'RENAME')).toThrow();
});
