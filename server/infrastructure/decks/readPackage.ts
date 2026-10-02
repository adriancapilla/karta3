import fs from 'node:fs/promises';
import path from 'node:path';
import { readStrictJson } from './strictJson.js';
import { reliableAvailability, validatePackageFormat, type PackageError, type ParsedPackage } from './packageFormat.js';
import { contained, imageReferences, validateImages, type ValidatedImage } from './resources.js';

export type PackageValidation = { valid: boolean; available?: boolean; errors: PackageError[]; data?: ParsedPackage; images: ReadonlyMap<string, ValidatedImage> };

export async function validatePackage(directory: string): Promise<PackageValidation> {
  const errors: PackageError[] = [];
  async function read(file: string) {
    try {
      if (!(await fs.readdir(directory)).includes(file)) throw new Error('Nombre de archivo no exacto');
      const root = await fs.realpath(directory);
      const target = await fs.realpath(path.join(directory, file));
      if (!contained(root, target)) throw new Error('JSON externo al paquete');
      const json = readStrictJson(await fs.readFile(target));
      errors.push(...json.errors.map((issue): PackageError => ({ ...issue, file, stage: 'json' })));
      return json.value;
    } catch { errors.push({ code: 'IO_ERROR', path: '$', file, stage: 'io', message: 'No se pudo leer el archivo.' }); return undefined; }
  }
  const metadata = await read('baraja.json');
  const collection = await read('cartas.json');
  const available = reliableAvailability(metadata);
  const format = validatePackageFormat(metadata, collection, path.basename(path.resolve(directory)));
  const resources = await validateImages(directory, imageReferences(metadata, collection));
  errors.push(...format.errors, ...resources.errors);
  return { valid: errors.length === 0, available, errors, ...(errors.length === 0 ? { data: format.data } : {}), images: resources.images };
}
