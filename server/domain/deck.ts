export type Attribute = Readonly<{ id: string; name: string; unit: string }>;
export type CardValue = Readonly<{ playValue: number; displayValue: string; unit: string }>;
export type Card = Readonly<{
  id: string;
  name: string;
  characteristic: string;
  imageRef: string | null;
  values: Readonly<Record<string, CardValue>>;
  roundAttribute: string;
  note: string;
}>;
export type Deck = Readonly<{ id: string; name: string; attributes: readonly Attribute[]; cards: readonly Card[] }>;
export type DeckError = Readonly<{ code: string; path: string; message: string; cardId?: string; attributeId?: string }>;
export type DeckValidation = Readonly<{ valid: boolean; errors: readonly DeckError[] }>;

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Invariantes de una definición en memoria, independientes del formato y del tema. */
export function validateDeck(input: unknown): DeckValidation {
  const errors: DeckError[] = [];
  function error(code: string, path: string, message: string, context: Pick<DeckError, 'cardId' | 'attributeId'> = {}) {
    errors.push({ code, path, message, ...context });
  }
  function text(record: Record<string, unknown>, key: string, path: string, empty: boolean, context: Pick<DeckError, 'cardId' | 'attributeId'> = {}) {
    if (!Object.hasOwn(record, key)) error('MISSING_FIELD', path, 'Falta la propiedad.', context);
    else if (typeof record[key] !== 'string') error('INVALID_TYPE', path, 'Se requiere texto.', context);
    else if (!empty && !record[key].trim()) error('INVALID_VALUE', path, 'El texto no puede estar vacío.', context);
  }
  if (!object(input)) {
    error('INVALID_TYPE', '$', 'Se requiere una definición de baraja.');
    return { valid: false, errors };
  }
  for (const key of ['id', 'name']) text(input, key, key, false);
  const attributes = new Set<string>();
  if (!Array.isArray(input.attributes)) error('INVALID_TYPE', 'attributes', 'Se requiere una lista de atributos.');
  else {
    if (input.attributes.length !== 3) error('ATTRIBUTE_COUNT', 'attributes', 'Se requieren exactamente tres atributos.');
    input.attributes.forEach((attribute: unknown, index: number) => {
      const path = `attributes[${index}]`;
      if (!object(attribute)) return error('INVALID_TYPE', path, 'Se requiere un atributo.');
      for (const key of ['id', 'name', 'unit']) text(attribute, key, `${path}.${key}`, key === 'unit');
      if (typeof attribute.id === 'string') {
        if (attributes.has(attribute.id)) error('ATTRIBUTE_ID_DUPLICATE', `${path}.id`, 'El atributo está repetido.', { attributeId: attribute.id });
        attributes.add(attribute.id);
      }
    });
  }
  if (!Array.isArray(input.cards)) error('INVALID_TYPE', 'cards', 'Se requiere una lista de cartas.');
  else {
    const attributesUsable = Array.isArray(input.attributes) && input.attributes.length === 3 && attributes.size === 3 &&
      input.attributes.every((attribute: unknown) => object(attribute) && typeof attribute.id === 'string' && attribute.id.trim());
    if (input.cards.length !== 58) error('CARD_COUNT', 'cards', 'Se requieren exactamente 58 cartas.');
    const ids = new Set<string>();
    const seen = new Map([...attributes].map((id) => [id, new Set<number>()]));
    input.cards.forEach((card: unknown, index: number) => {
      const path = `cards[${index}]`;
      if (!object(card)) return error('INVALID_TYPE', path, 'Se requiere una carta.');
      const context = typeof card.id === 'string' ? { cardId: card.id } : {};
      for (const key of ['id', 'name', 'characteristic', 'roundAttribute', 'note']) {
        text(card, key, `${path}.${key}`, key === 'characteristic' || key === 'note', context);
      }
      if (!Object.hasOwn(card, 'imageRef')) error('MISSING_FIELD', `${path}.imageRef`, 'Falta la propiedad.', context);
      else if (card.imageRef !== null && (typeof card.imageRef !== 'string' || !card.imageRef.trim())) {
        error('INVALID_VALUE', `${path}.imageRef`, 'Se requiere null o una referencia no vacía.', context);
      }
      if (typeof card.id === 'string') {
        if (ids.has(card.id)) error('CARD_ID_DUPLICATE', `${path}.id`, 'El id de carta está repetido.', context);
        ids.add(card.id);
      }
      if (attributesUsable && typeof card.roundAttribute === 'string' && !attributes.has(card.roundAttribute)) {
        error('ROUND_ATTRIBUTE_UNKNOWN', `${path}.roundAttribute`, 'El indicador no referencia un atributo declarado.', context);
      }
      if (!object(card.values)) return error('INVALID_TYPE', `${path}.values`, 'Se requieren los valores de la carta.', context);
      for (const key of Object.keys(card.values)) {
        if (attributesUsable && !attributes.has(key)) error('VALUE_ATTRIBUTE_UNKNOWN', `${path}.values.${key}`, 'El atributo no está declarado.', { ...context, attributeId: key });
      }
      for (const attributeId of attributesUsable ? attributes : []) {
        const value = card.values[attributeId];
        const valuePath = `${path}.values.${attributeId}`;
        const valueContext = { ...context, attributeId };
        if (!Object.hasOwn(card.values, attributeId)) {
          error('MISSING_FIELD', valuePath, 'Falta el valor del atributo.', valueContext);
          continue;
        }
        if (!object(value)) { error('INVALID_TYPE', valuePath, 'Se requiere un valor de atributo.', valueContext); continue; }
        text(value, 'displayValue', `${valuePath}.displayValue`, false, valueContext);
        text(value, 'unit', `${valuePath}.unit`, true, valueContext);
        if (!Object.hasOwn(value, 'playValue')) error('MISSING_FIELD', `${valuePath}.playValue`, 'Falta el valor jugable.', valueContext);
        else if (!Number.isInteger(value.playValue)) error('PLAY_VALUE_INTEGER', `${valuePath}.playValue`, 'Se requiere un entero.', valueContext);
        else if ((value.playValue as number) < 1 || (value.playValue as number) > 58) error('PLAY_VALUE_RANGE', `${valuePath}.playValue`, 'El entero debe estar entre 1 y 58.', valueContext);
        else {
          const values = seen.get(attributeId)!;
          if (values.has(value.playValue as number)) error('PLAY_VALUE_DUPLICATE', `${valuePath}.playValue`, 'Valor jugable repetido en el atributo.', valueContext);
          values.add(value.playValue as number);
        }
      }
    });
  }
  return { valid: errors.length === 0, errors };
}
