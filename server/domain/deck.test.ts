import { describe, expect, it } from 'vitest';
import { validateDeck } from './deck.js';
import { deckFixture } from '../../tests/support/deckFixtures.js';

function definition(alternative = false) {
  const { metadata, collection } = deckFixture();
  const result = { id: metadata.id, name: metadata.name, attributes: metadata.attributes, cards: collection.cards };
  if (alternative) {
    result.id = 'otra'; result.name = 'Otro tema';
    result.attributes.forEach((attribute, index) => { attribute.id = `variable-${index}`; attribute.name = `Nombre ${index}`; });
    result.cards = result.cards.map((card, index) => ({ ...card, id: `otra-${index}`, roundAttribute: 'variable-2',
      values: Object.fromEntries(result.attributes.map((attribute) => [attribute.id, { playValue: 58 - index, displayValue: 'Texto sin relación numérica', unit: 'u' }])) }));
  }
  return result;
}
describe('B04-02 dominio común; E1–E7 de la propuesta', () => {
  it('E1/E6/E7: dos temas y atributos distintos, vacíos, display independiente y 58 indicadores iguales sin mutación', () => {
    for (const input of [definition(), definition(true)]) {
      const before = structuredClone(input);
      expect(validateDeck(input)).toEqual({ valid: true, errors: [] });
      expect(validateDeck(input)).toEqual(validateDeck(input));
      expect(input).toEqual(before);
    }
  });
  it.each([57, 59])('E2: rechaza %i cartas', (size) => {
    const input = definition(); input.cards = Array.from({ length: size }, (_, index) => input.cards[index % 58]);
    expect(validateDeck(input).errors).toContainEqual(expect.objectContaining({ code: 'CARD_COUNT', path: 'cards' }));
  });
  it('E3/E4: localiza id y valor repetidos', () => {
    const input = definition(); input.cards[1] = { ...input.cards[1], id: input.cards[0].id,
      values: { ...input.cards[1].values, atributo2: { ...input.cards[1].values.atributo2, playValue: 1 } } };
    expect(validateDeck(input).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CARD_ID_DUPLICATE', path: 'cards[1].id', cardId: 'carta-1' }),
      expect.objectContaining({ code: 'PLAY_VALUE_DUPLICATE', path: 'cards[1].values.atributo2.playValue', attributeId: 'atributo2' })
    ]));
  });
  it.each([
    ['roundAttribute', 'ROUND_ATTRIBUTE_UNKNOWN'], ['values.atributo3', 'MISSING_FIELD'], ['note', 'MISSING_FIELD'],
    ['values.atributo1.unit', 'MISSING_FIELD'], ['name', 'INVALID_VALUE'], ['values.atributo1.displayValue', 'INVALID_VALUE']
  ])('E5/E6 presencia frente a vacío: %s', (field, code) => {
    const input = structuredClone(definition()) as unknown as { cards: Record<string, unknown>[] };
    const parts = field.split('.'); let record = input.cards[0];
    for (const part of parts.slice(0, -1)) record = record[part] as Record<string, unknown>;
    const key = parts.at(-1)!;
    if (field === 'roundAttribute') record[key] = 'desconocido';
    else if (code === 'INVALID_VALUE') record[key] = '   ';
    else delete record[key];
    expect(validateDeck(input).errors).toContainEqual(expect.objectContaining({ code, path: `cards[0].${field}` }));
  });
  it.each(['1', 1.2, 0, 59, null])('rechaza playValue %s sin coerción', (playValue) => {
    const input = definition(); input.cards[0] = { ...input.cards[0], values: { ...input.cards[0].values,
      atributo1: { ...input.cards[0].values.atributo1, playValue: playValue as number } } };
    expect(validateDeck(input).valid).toBe(false);
    expect(validateDeck(input).errors.some((error) => error.path === 'cards[0].values.atributo1.playValue')).toBe(true);
  });
  it('rechaza tamaño de atributos, atributo repetido y entradas mal formadas sin lanzar', () => {
    const input = definition(); input.attributes = [input.attributes[0], input.attributes[0]];
    expect(validateDeck(input).errors.map((error) => error.code)).toEqual(expect.arrayContaining(['ATTRIBUTE_COUNT', 'ATTRIBUTE_ID_DUPLICATE']));
    for (const invalid of [null, {}, { cards: [null], attributes: [null] }]) expect(validateDeck(invalid).valid).toBe(false);
  });
});
