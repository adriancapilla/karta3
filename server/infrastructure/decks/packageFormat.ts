import { validateDeck, type Attribute, type Card, type Deck, type DeckError } from '../../domain/deck.js';

export type PackageError = DeckError & { stage: 'json' | 'format' | 'coherence' | 'domain' | 'resources' | 'catalog' | 'io'; file: string };
export type Metadata = {
  schemaVersion: 1; contentVersion: number; id: string; name: string; subtitle: string; description: string;
  notes: string; instructions: string; attributes: Attribute[]; imageRef: string | null; imageAlt: string;
  publication: { available: boolean; order: number };
  credits: { name: string; role: string; license: string; url: string }[];
  sources: { title: string; url: string; note: string }[];
};
export type PackageCard = Card & { imageAlt: string };
export type Collection = { schemaVersion: 1; contentVersion: number; deckId: string; cards: PackageCard[] };
export type ParsedPackage = { metadata: Metadata; collection: Collection; definition: Deck };
export const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export const portableId = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 64;
export const reservedName = (value: string) => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(value);
const attributes = ['atributo1', 'atributo2', 'atributo3'];

export function reliableAvailability(metadata: unknown): boolean | undefined {
  return isObject(metadata) && metadata.schemaVersion === 1 && isObject(metadata.publication) && typeof metadata.publication.available === 'boolean'
    ? metadata.publication.available : undefined;
}

/** Esquema de archivos y coherencia; las invariantes jugables se delegan al dominio. */
export function validatePackageFormat(metadata: unknown, collection: unknown, folder: string): { errors: PackageError[]; data?: ParsedPackage } {
  const errors: PackageError[] = [];
  let file = 'baraja.json';
  function error(code: string, path: string, message: string, stage: PackageError['stage'] = 'format') { errors.push({ code, path, message, stage, file }); }
  function record(value: unknown, path: string, keys: readonly string[]): value is Record<string, unknown> {
    if (!isObject(value)) { error('INVALID_TYPE', path, 'Se requiere un objeto.'); return false; }
    for (const key of keys) if (!Object.hasOwn(value, key)) error('MISSING_FIELD', path === '$' ? key : `${path}.${key}`, 'Falta la propiedad.');
    for (const key of Object.keys(value)) if (!keys.includes(key)) error('UNKNOWN_FIELD', path === '$' ? key : `${path}.${key}`, 'Propiedad no admitida.');
    return true;
  }
  function text(value: unknown, path: string, empty = false) {
    if (value === undefined) return;
    if (typeof value !== 'string') error('INVALID_TYPE', path, 'Se requiere texto.');
    else if (!empty && !value.trim()) error('INVALID_VALUE', path, 'El texto no puede estar vacío.');
  }
  function id(value: unknown, path: string, deck = false) {
    text(value, path);
    if (typeof value === 'string' && (!portableId(value) || (deck && reservedName(value)))) error('INVALID_VALUE', path, 'Identificador no portable.');
  }
  function integer(value: unknown, path: string, min: number) {
    if (value === undefined) return;
    if (typeof value !== 'number' || !Number.isInteger(value)) error('INVALID_TYPE', path, 'Se requiere un número entero.');
    else if (value < min) error('INVALID_VALUE', path, `Debe ser mayor o igual que ${min}.`);
  }
  function version(value: Record<string, unknown>) {
    if (Object.hasOwn(value, 'schemaVersion') && value.schemaVersion !== 1) error('UNSUPPORTED_SCHEMA', 'schemaVersion', 'Solo se admite el formato 1.');
    integer(value.contentVersion, 'contentVersion', 1);
  }
  function array(value: unknown, path: string, inspect: (entry: unknown, path: string, index: number) => void) {
    if (value === undefined) return;
    if (!Array.isArray(value)) { error('INVALID_TYPE', path, 'Se requiere una lista.'); return; }
    value.forEach((entry, index) => inspect(entry, `${path}[${index}]`, index));
  }
  function image(value: Record<string, unknown>, path: string) {
    const prefix = path === '$' ? '' : `${path}.`;
    if (value.imageRef !== undefined && value.imageRef !== null && typeof value.imageRef !== 'string') error('INVALID_TYPE', `${prefix}imageRef`, 'Se requiere texto o null.');
    text(value.imageAlt, `${prefix}imageAlt`, true);
    if (typeof value.imageRef === 'string' && typeof value.imageAlt === 'string' && !value.imageAlt.trim()) error('INVALID_VALUE', `${prefix}imageAlt`, 'Con referencia se requiere texto alternativo no vacío.');
    if (value.imageRef === null && typeof value.imageAlt === 'string' && value.imageAlt !== '') error('INVALID_VALUE', `${prefix}imageAlt`, 'Con null se requiere exactamente texto vacío.');
  }
  function url(value: unknown, path: string) {
    text(value, path, true);
    if (typeof value === 'string' && value !== '') {
      try { const parsed = new URL(value); if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || !/^https?:\/\//i.test(value)) throw new Error(); }
      catch { error('INVALID_VALUE', path, 'Se requiere una URL absoluta HTTP o HTTPS.'); }
    }
  }
  const metaOk = metadata !== undefined && record(metadata, '$', ['schemaVersion', 'contentVersion', 'id', 'name', 'subtitle', 'description', 'notes', 'instructions', 'attributes', 'imageRef', 'imageAlt', 'publication', 'credits', 'sources']);
  if (metaOk) {
    version(metadata); id(metadata.id, 'id', true);
    if (typeof metadata.id === 'string' && metadata.id !== folder) error('DECK_ID_MISMATCH', 'id', 'El id no coincide con la carpeta.', 'coherence');
    for (const key of ['name', 'subtitle', 'description', 'notes', 'instructions']) text(metadata[key], key, ['subtitle', 'notes', 'instructions'].includes(key));
    array(metadata.attributes, 'attributes', (attribute, path, index) => {
      if (!record(attribute, path, ['id', 'name', 'unit'])) return;
      if (attribute.id !== attributes[index]) error('INVALID_VALUE', `${path}.id`, 'Se requieren atributo1, atributo2 y atributo3 en ese orden.');
      text(attribute.name, `${path}.name`); text(attribute.unit, `${path}.unit`, true);
    });
    image(metadata, '$');
    if (record(metadata.publication, 'publication', ['available', 'order'])) {
      if (metadata.publication.available !== undefined && typeof metadata.publication.available !== 'boolean') error('INVALID_TYPE', 'publication.available', 'Se requiere un booleano.');
      integer(metadata.publication.order, 'publication.order', 0);
    }
    array(metadata.credits, 'credits', (credit, path) => {
      if (!record(credit, path, ['name', 'role', 'license', 'url'])) return;
      text(credit.name, `${path}.name`); text(credit.role, `${path}.role`); text(credit.license, `${path}.license`, true); url(credit.url, `${path}.url`);
    });
    array(metadata.sources, 'sources', (source, path) => {
      if (!record(source, path, ['title', 'url', 'note'])) return;
      text(source.title, `${path}.title`); url(source.url, `${path}.url`); text(source.note, `${path}.note`, true);
    });
  }
  file = 'cartas.json';
  const cardsOk = collection !== undefined && record(collection, '$', ['schemaVersion', 'contentVersion', 'deckId', 'cards']);
  if (cardsOk) {
    version(collection); id(collection.deckId, 'deckId', true);
    if (metaOk && typeof collection.deckId === 'string' && typeof metadata.id === 'string' && collection.deckId !== metadata.id) error('DECK_ID_MISMATCH', 'deckId', 'No coincide con baraja.json.', 'coherence');
    if (metaOk && Number.isInteger(collection.contentVersion) && Number.isInteger(metadata.contentVersion) && collection.contentVersion !== metadata.contentVersion) error('VERSION_MISMATCH', 'contentVersion', 'No coincide con baraja.json.', 'coherence');
    array(collection.cards, 'cards', (card, path) => {
      if (!record(card, path, ['id', 'name', 'characteristic', 'imageRef', 'imageAlt', 'values', 'roundAttribute', 'note'])) return;
      id(card.id, `${path}.id`); image(card, path);
      if (record(card.values, `${path}.values`, attributes)) {
        for (const attributeId of attributes) {
          if (Object.hasOwn(card.values, attributeId)) record(card.values[attributeId], `${path}.values.${attributeId}`, ['playValue', 'displayValue', 'unit']);
        }
      }
    });
  }
  if (metaOk && cardsOk) {
    const definition = { id: metadata.id, name: metadata.name, attributes: metadata.attributes, cards: collection.cards };
    for (const issue of validateDeck(definition).errors) {
      const target = issue.path.startsWith('cards') ? 'cartas.json' : 'baraja.json';
      if (!errors.some((existing) => existing.file === target && existing.code === issue.code && existing.path === issue.path)) errors.push({ ...issue, file: target, stage: 'domain' });
    }
    if (Array.isArray(collection.cards)) errors.forEach((issue, index) => {
      const match = /^cards\[(\d+)\]/.exec(issue.path);
      const card = match ? (collection.cards as unknown[])[Number(match[1])] : undefined;
      const attribute = /\.values\.([^.]+)/.exec(issue.path)?.[1];
      errors[index] = { ...issue, ...(isObject(card) && typeof card.id === 'string' ? { cardId: card.id } : {}), ...(attribute ? { attributeId: attribute } : {}) };
    });
    if (errors.length === 0) return { errors, data: { metadata: metadata as Metadata, collection: collection as Collection, definition: definition as Deck } };
  }
  return { errors };
}
