import process from 'node:process';

export type TextIssue = { code: string; path: string; message: string; file: string; stage: 'format'; cardId?: string; attributeId?: string };
export const escapeTextDiagnostic = (value: string) => value.replace(/[\p{C}\p{M}]/gu,
  (char) => `\\u{${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}}`);
const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });
export function textValidationRuntime() {
  return { node: process.version, executable: process.execPath, icu: process.versions.icu, unicode: process.versions.unicode,
    segmentation: segmenter.resolvedOptions() };
}
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const malformed = (value: string) => /[\uD800-\uDFFF]/u.test(value);
const quoted = (value: string) => '"' + Array.from(value, (char) => /[\p{C}\p{M}\p{Z}]/u.test(char)
  ? `\\u{${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}}` : JSON.stringify(char).slice(1, -1)).join('') + '"';
const paragraph = (path: string) => /^(description|notes|instructions|cards\[\d+\]\.note|sources\[\d+\]\.note)$/.test(path);
const compact = (path: string) => /^(name|subtitle|imageAlt|attributes\[\d+\]\.(name|unit)|credits\[\d+\]\.(name|role)|sources\[\d+\]\.title|cards\[\d+\]\.(name|characteristic|imageAlt)|cards\[\d+\]\.values\.atributo[123]\.(displayValue|unit))$/.test(path);
function maximum(path: string): number | undefined {
  if (/^attributes\[\d+\]\.name$/.test(path)) return 32;
  if (/^(name|cards\[\d+\]\.name)$/.test(path)) return 128;
  if (path === 'subtitle') return 256;
  if (/^(imageAlt|cards\[\d+\]\.(characteristic|imageAlt))$/.test(path)) return 1024;
  if (/^(description|cards\[\d+\]\.note)$/.test(path)) return 4096;
  if (path === 'notes' || path === 'instructions') return 16384;
}

/** Restricciones editoriales V2. No normaliza, recorta ni interpreta datos. */
export function validateFormat2Text(metadata: unknown, collection: unknown): TextIssue[] {
  const errors: TextIssue[] = [];
  const runtime = textValidationRuntime();
  if (runtime.icu !== '78.3' || runtime.unicode !== '17.0' || runtime.segmentation.locale !== 'es') {
    return [{ code: 'TEXT_RUNTIME_MISMATCH', path: '$', file: 'baraja.json', stage: 'format',
      message: `Revisar runtime de segmentación: ICU ${runtime.icu}/Unicode ${runtime.unicode}; referencia 78.3/17.0.` }];
  }
  let file = 'baraja.json';
  function issue(code: string, path: string, message: string) {
    const match = /^cards\[(\d+)\]/.exec(path);
    const card = object(collection) && Array.isArray(collection.cards) && match ? collection.cards[Number(match[1])] : undefined;
    const attributeId = /\.values\.(atributo[123])/.exec(path)?.[1];
    errors.push({ code, path, message, file, stage: 'format', ...(object(card) && typeof card.id === 'string' ? { cardId: card.id } : {}),
      ...(attributeId ? { attributeId } : {}) });
  }
  function inspect(value: string, path: string, key = false) {
    if (malformed(value)) { issue('UNICODE_INVALID', path, `Unicode escalar no válido: ${quoted(value)}.`); return; }
    if (value !== value.normalize('NFC')) issue('TEXT_NOT_NFC', path, `El texto debe venir en NFC: ${quoted(value)}.`);
    if (key) return;
    if (/^(name|description|attributes\[\d+\]\.name|credits\[\d+\]\.(name|role)|sources\[\d+\]\.title|cards\[\d+\]\.name|cards\[\d+\]\.values\.atributo[123]\.displayValue)$/.test(path)
      && /^[\p{White_Space}\p{Cc}\p{Cf}]*$/u.test(value)) issue('TEXT_EMPTY', path, 'Se requiere texto visible, no solo espacios o caracteres invisibles.');
    const allowedParagraph = paragraph(path);
    if (Array.from(value).some((char) => /\p{Cc}/u.test(char) && !(allowedParagraph && char === '\n')) || /[\u2028\u2029]/u.test(value)) {
      issue('TEXT_CONTROL', path, `Control o salto prohibido: ${quoted(value)}; ${allowedParagraph ? 'solo se permite LF en párrafos' : 'una línea requerida'}.`);
    }
    if (compact(path)) {
      if (/^\p{White_Space}|\p{White_Space}$/u.test(value)) issue('TEXT_EDGE_SPACE', path, `Espacio Unicode de borde: ${quoted(value)}.`);
      for (const { segment } of segmenter.segment(value)) {
        if (!/^\p{White_Space}+$/u.test(segment) && !/[\p{L}\p{N}\p{P}\p{S}]/u.test(segment)) {
          issue('TEXT_GRAPHEME_BASE', path, `Grafema sin base gráfica: ${quoted(segment)}.`); break;
        }
      }
    }
    const limit = maximum(path); const count = Array.from(value).length;
    if (limit !== undefined && count > limit) issue('TEXT_CODE_POINT_LIMIT', path, `${count} puntos de código; máximo ${limit}.`);
  }
  function walk(value: unknown, path: string) {
    if (typeof value === 'string') inspect(value, path);
    else if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, `${path}[${index}]`));
    else if (object(value)) for (const [key, child] of Object.entries(value)) {
      const childPath = path === '$' ? key : `${path}.${key}`;
      inspect(key, childPath, true); walk(child, childPath);
    }
  }
  walk(metadata, '$'); file = 'cartas.json'; walk(collection, '$');
  if (object(collection) && Array.isArray(collection.cards)) collection.cards.forEach((card, index) => {
    if (!object(card) || !object(card.values)) return;
    for (const attributeId of ['atributo1', 'atributo2', 'atributo3']) {
      const value = card.values[attributeId];
      if (!object(value) || typeof value.displayValue !== 'string' || typeof value.unit !== 'string'
        || malformed(value.displayValue) || malformed(value.unit)) continue;
      const combined = value.displayValue + (value.unit === '' ? '' : ` ${value.unit}`);
      const count = [...segmenter.segment(combined)].length;
      if (count > 10) issue('TEXT_VALUE_GRAPHEME_LIMIT', `cards[${index}].values.${attributeId}`,
        `displayValue${value.unit === '' ? ' (unit vacío, sin espacio)' : ' + U+0020 + unit'} produce ${quoted(combined)}: ${count} grafemas; máximo 10. Propiedades displayValue y unit.`);
    }
  });
  return errors;
}
