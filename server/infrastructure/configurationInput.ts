import type { ConfigurationChange } from '../../shared/contracts/room.js';
import { RoomError } from '../application/roomError.js';
import { isObject, portableId, reservedName } from './decks/packageFormat.js';

export function exactObject(value: unknown, keys: string[]): value is Record<string, unknown> {
  return isObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

/** Decodifica el mensaje sin coerciones. La transición y las plazas pertenecen a Room. */
export function configurationInput(input: unknown): ConfigurationChange {
  const invalid = () => new RoomError('INVALID_INPUT', 'El cambio de configuración no es válido.');
  if (!exactObject(input, ['field', 'value'])) throw invalid();
  const { field, value } = input;
  switch (field) {
    case 'deck':
      if (value === null) return { field, value };
      if (!exactObject(value, ['id', 'contentVersion']) || typeof value.id !== 'string'
        || !portableId(value.id) || reservedName(value.id) || !Number.isInteger(value.contentVersion) || (value.contentVersion as number) <= 0) throw invalid();
      return { field, value: { id: value.id, contentVersion: value.contentVersion as number } };
    case 'hostPlays': case 'forceTieBreak':
      if (typeof value !== 'boolean') throw invalid();
      return { field, value };
    case 'turnSeconds':
      if (value !== 15 && value !== 30 && value !== 60) throw invalid();
      return { field, value };
    case 'reviewSeconds':
      if (value !== 0 && value !== 2 && value !== 5 && value !== 10 && value !== 15 && value !== 30) throw invalid();
      return { field, value };
    default: throw invalid();
  }
}
