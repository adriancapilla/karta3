import { expect, it } from 'vitest';
import { readStrictJson } from './strictJson.js';

it.each([
  ['{"publication":{"available":false},"publication":{"available":true}}', 'publication'],
  ['{"cards":[{"values":{"atributo1":{"playValue":1,"play\\u0056alue":2}}}]}', 'cards[0].values.atributo1.playValue'],
  ['{"a":1,"\\u0061":2}', 'a'], ['{"__proto__":1,"__proto__":2}', '__proto__']
])('B04-03 detecta duplicados reales y equivalentes: %s', (json, path) => {
  expect(readStrictJson(Buffer.from(json))).toEqual({ errors: [expect.objectContaining({ code: 'JSON_DUPLICATE_KEY', path, message: expect.stringContaining('línea') })] });
});
it.each(['{"a":}', '{"a":1,}', '[1,]', '//comentario\n{}', '{} {}', '{"a":01}', '{"a":"\n"}', '{"a":"\\x20"}', '\ufeff{}'])('B04-03 rechaza sintaxis %s', (json) => {
  expect(readStrictJson(Buffer.from(json)).errors[0].code).toBe('JSON_SYNTAX');
});
it('B04-03 UTF-8 inválido y valores completos válidos', () => {
  expect(readStrictJson(Uint8Array.from([0x7b, 0xc3, 0x28, 0x7d])).errors[0].code).toBe('JSON_ENCODING');
  expect(readStrictJson(Buffer.from('{"a":[true,false,null,-1.25e2,"á\\u0062"]}')).value).toEqual({ a: [true, false, null, -125, 'áb'] });
});
