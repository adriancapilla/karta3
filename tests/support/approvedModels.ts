import fs from 'node:fs';
import type { DeckSummary } from '../../shared/contracts/deck.js';

/** Referencia congelada del manifiesto final aprobado; nunca se obtiene de APP o de HTTP. */
const reference = JSON.parse(fs.readFileSync(new URL('../fixtures/approved-models-ia-2026.json', import.meta.url), 'utf8')) as {
  manifestSha256: string; summary: DeckSummary; files: { path: string; bytes: number; sha256: string }[];
};
export const approvedModels = reference.summary;
export const approvedModelFiles = reference.files;
