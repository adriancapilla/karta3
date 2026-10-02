import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { isObject, reservedName, type PackageError } from './packageFormat.js';

export type ImageReference = { ref: string; path: string; file: string; cardId?: string };
export type ValidatedImage = Readonly<{ bytes: Buffer; mime: string }>;
export function contained(root: string, target: string) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function imageReferences(metadata: unknown, collection: unknown): ImageReference[] {
  const references: ImageReference[] = [];
  if (isObject(metadata) && typeof metadata.imageRef === 'string') references.push({ ref: metadata.imageRef, path: 'imageRef', file: 'baraja.json' });
  if (isObject(collection) && Array.isArray(collection.cards)) collection.cards.forEach((card: unknown, index: number) => {
    if (isObject(card) && typeof card.imageRef === 'string') references.push({ ref: card.imageRef, path: `cards[${index}].imageRef`, file: 'cartas.json', ...(typeof card.id === 'string' ? { cardId: card.id } : {}) });
  });
  return references;
}

export function imagePathAllowed(ref: string) {
  if (!/^imagenes\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:png|webp|jpg|jpeg)$/.test(ref)) return false;
  return ref.split('/').every((part) => !reservedName(part.split('.')[0]));
}

/** Comprueba escritura exacta incluso en Windows y decodifica todos los píxeles. */
export async function validateImages(directory: string, references: readonly ImageReference[]) {
  const errors: PackageError[] = [];
  const images = new Map<string, ValidatedImage>();
  const results = new Map<string, { image?: ValidatedImage; code?: string; message?: string }>();
  for (const reference of references) {
    let result = results.get(reference.ref);
    if (!result) {
      result = {};
      if (!imagePathAllowed(reference.ref)) result = { code: 'IMAGE_PATH', message: 'Ruta de imagen no admitida.' };
      else {
        try {
          const root = await fs.realpath(directory);
          let candidate = directory;
          for (const segment of reference.ref.split('/')) {
            const entries = await fs.readdir(candidate);
            if (!entries.includes(segment)) { result = { code: 'IMAGE_NOT_FOUND', message: 'No existe la imagen con esa escritura exacta.' }; break; }
            candidate = path.join(candidate, segment);
            const real = await fs.realpath(candidate);
            if (!contained(root, real)) { result = { code: 'IMAGE_OUTSIDE_DECK', message: 'El destino real sale de la baraja.' }; break; }
          }
          if (!result.code) {
            const bytes = await fs.readFile(candidate);
            try {
              const decoder = sharp(bytes, { failOn: 'warning', animated: true });
              const info = await decoder.metadata();
              const extension = path.extname(reference.ref).slice(1);
              const expected = extension === 'jpg' ? 'jpeg' : extension;
              if (info.format !== expected || !info.width || !info.height) throw new Error('Formato o dimensiones inválidos');
              await decoder.raw().toBuffer();
              result = { image: { bytes, mime: info.format === 'jpeg' ? 'image/jpeg' : `image/${info.format}` } };
            } catch { result = { code: 'IMAGE_INVALID', message: 'No es una imagen completa decodificable coherente con la extensión.' }; }
          }
        } catch (error) {
          result = { code: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'IMAGE_NOT_FOUND' : 'IO_ERROR', message: 'No se pudo leer el recurso declarado.' };
        }
      }
      results.set(reference.ref, result);
    }
    if (result.image) images.set(reference.ref, result.image);
    else errors.push({ code: result.code!, message: result.message!, path: reference.path, file: reference.file, stage: 'resources', ...(reference.cardId ? { cardId: reference.cardId } : {}) });
  }
  return { errors, images };
}
