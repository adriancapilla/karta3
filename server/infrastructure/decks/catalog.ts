import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DeckCatalog, PublishedDeckVersions, DeckVersionResult } from '../../application/deckCatalog.js';
import type { Deck } from '../../domain/deck.js';
import type { DecksResponse, DeckSummary } from '../../../shared/contracts/deck.js';
import { validatePackage } from './readPackage.js';
import { contained, type ValidatedImage } from './resources.js';
import { isObject, type PackageError } from './packageFormat.js';
import { readStrictJson } from './strictJson.js';

export type PackageDiagnostic = { package: string; available?: boolean; valid: boolean; errors: readonly PackageError[] };
export class DeckLoadError extends Error {
  constructor(public readonly errors: readonly PackageError[], public readonly diagnostics: readonly PackageDiagnostic[] = []) { super('No se pudo preparar o cargar el catálogo de barajas.'); }
}
const catalogError = (code: string, message: string): PackageError => ({ code, message, file: 'catalogo.json', path: '$', stage: 'catalog' });
const serialize = (response: DecksResponse) => `${JSON.stringify(response, null, 2)}\n`;

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Instantánea interna: las peticiones no abren archivos ni adoptan cambios editoriales. */
type PublishedDefinition = { contentVersion: number; definition: Deck };
export class LoadedDeckCatalog implements DeckCatalog, PublishedDeckVersions {
  private readonly summariesList: readonly DeckSummary[];
  private readonly definitions: ReadonlyMap<string, PublishedDefinition>;
  private readonly resources: ReadonlyMap<string, ValidatedImage>;
  constructor(summaries: readonly DeckSummary[], definitions: ReadonlyMap<string, PublishedDefinition>, resources: ReadonlyMap<string, ValidatedImage>) {
    this.summariesList = freeze(structuredClone(summaries));
    this.definitions = new Map([...definitions].map(([id, definition]) => [id, freeze(structuredClone(definition))]));
    this.resources = new Map([...resources].map(([url, image]) => [url, { mime: image.mime, bytes: Buffer.from(image.bytes) }]));
  }
  summaries(): readonly DeckSummary[] { return this.summariesList; }
  resolveVersion(id: string, contentVersion: number): DeckVersionResult {
    const summary = this.summariesList.find((deck) => deck.id === id);
    const published = this.definitions.get(id);
    if (!summary || !published || published.definition.id !== id || published.contentVersion !== summary.contentVersion) {
      return { ok: false, reason: 'DECK_NOT_AVAILABLE' };
    }
    if (summary.contentVersion !== contentVersion) return { ok: false, reason: 'DECK_VERSION_MISMATCH' };
    return { ok: true, summary };
  }
  // Acceso interno para comprobación; ningún transporte expone la definición.
  definition(id: string): Deck | undefined { return this.definitions.get(id)?.definition; }
  image(url: string): ValidatedImage | undefined {
    const image = this.resources.get(url);
    return image ? { mime: image.mime, bytes: Buffer.from(image.bytes) } : undefined;
  }
}

export async function loadPackages(root: string) {
  const diagnostics: PackageDiagnostic[] = [];
  const definitions = new Map<string, PublishedDefinition>();
  const resources = new Map<string, ValidatedImage>();
  const published: { order: number; summary: DeckSummary }[] = [];
  let directories: string[];
  let realRoot: string;
  try {
    realRoot = await fs.realpath(root);
    const entries = await fs.readdir(root, { withFileTypes: true });
    // Los enlaces también se inspeccionan, nunca se ignoran como borradores fiables.
    directories = entries.filter((entry) => entry.name !== 'catalogo.json' && (entry.isDirectory() || entry.isSymbolicLink())).map((entry) => entry.name).sort();
  } catch { throw new DeckLoadError([catalogError('IO_ERROR', 'No se pudo enumerar la raíz de barajas.')]); }
  for (const directory of directories) {
    const target = path.join(root, directory);
    try {
      if (!contained(realRoot, await fs.realpath(target))) throw new Error();
    } catch {
      diagnostics.push({ package: directory, valid: false, errors: [{ code: 'IO_ERROR', file: '$', path: '$', stage: 'io', message: 'La carpeta no puede leerse dentro de la raíz de barajas.' }] });
      continue;
    }
    const result = await validatePackage(target);
    diagnostics.push({ package: directory, valid: result.valid, available: result.available, errors: result.errors });
    if (!result.valid || !result.available) continue;
    const { metadata, definition } = result.data!;
    definitions.set(metadata.id, { contentVersion: metadata.contentVersion, definition });
    const prefix = `/media/decks/${metadata.id}/v${metadata.contentVersion}/`;
    for (const [ref, image] of result.images) resources.set(`${prefix}${ref}`, image);
    published.push({ order: metadata.publication.order, summary: {
      id: metadata.id, schemaVersion: metadata.schemaVersion, contentVersion: metadata.contentVersion,
      name: metadata.name, subtitle: metadata.subtitle, description: metadata.description,
      imageUrl: metadata.imageRef === null ? null : `${prefix}${metadata.imageRef}`, imageAlt: metadata.imageAlt
    } });
  }
  const fatal = diagnostics.filter((entry) => !entry.valid && entry.available !== false);
  if (fatal.length) throw new DeckLoadError(fatal.flatMap((entry) => entry.errors), diagnostics);
  published.sort((a, b) => a.order - b.order || (a.summary.id < b.summary.id ? -1 : a.summary.id > b.summary.id ? 1 : 0));
  const response: DecksResponse = { decks: published.map((entry) => entry.summary) };
  return { catalog: new LoadedDeckCatalog(response.decks, definitions, resources), response, bytes: serialize(response), diagnostics };
}

export async function prepareDecks(root: string) {
  const loaded = await loadPackages(root);
  const temporary = path.join(root, `.catalogo-${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, loaded.bytes, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(temporary, path.join(root, 'catalogo.json'));
  } catch {
    await fs.unlink(temporary).catch(() => undefined);
    throw new DeckLoadError([catalogError('IO_ERROR', 'No se pudo escribir el catálogo completo.')], loaded.diagnostics);
  }
  return loaded;
}

function catalogShape(value: unknown): value is DecksResponse {
  if (!isObject(value) || Object.keys(value).length !== 1 || !Array.isArray(value.decks)) return false;
  const keys = ['id', 'schemaVersion', 'contentVersion', 'name', 'subtitle', 'description', 'imageUrl', 'imageAlt'];
  return value.decks.every((deck: unknown) => isObject(deck) && Object.keys(deck).length === keys.length && keys.every((key) => Object.hasOwn(deck, key)) &&
    deck.schemaVersion === 1 && Number.isInteger(deck.contentVersion) && (deck.contentVersion as number) > 0 &&
    ['id', 'name', 'subtitle', 'description', 'imageAlt'].every((key) => typeof deck[key] === 'string') && (deck.imageUrl === null || typeof deck.imageUrl === 'string'));
}

export async function loadPreparedDecks(root: string) {
  const loaded = await loadPackages(root);
  let bytes: Buffer;
  try { bytes = await fs.readFile(path.join(root, 'catalogo.json')); }
  catch (error) { throw new DeckLoadError([catalogError((error as NodeJS.ErrnoException).code === 'ENOENT' ? 'CATALOG_MISSING' : 'IO_ERROR', 'No se pudo leer el catálogo preparado.')], loaded.diagnostics); }
  const json = readStrictJson(bytes);
  if (json.errors.length || !catalogShape(json.value)) throw new DeckLoadError([catalogError('CATALOG_INVALID', 'El catálogo preparado no cumple el contrato de resumen.')], loaded.diagnostics);
  // La preparación fija también orden de propiedades, espacios y LF; todo cambio requiere regeneración.
  if (bytes.toString('utf8') !== loaded.bytes) throw new DeckLoadError([catalogError('CATALOG_STALE', 'El catálogo no concuerda con las fuentes; ejecutar decks:prepare.')], loaded.diagnostics);
  return loaded;
}
