import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPreparedDecks, prepareDecks, DeckLoadError, type PackageDiagnostic } from '../infrastructure/decks/catalog.js';
import { validatePackage } from '../infrastructure/decks/readPackage.js';

export const installationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), import.meta.url.endsWith('.ts') ? '../..' : '../../..');
export const decksRoot = path.join(installationRoot, 'barajas');
export { DeckLoadError };
export const validateDeckPackage = (directory: string) => validatePackage(path.resolve(directory));
export const prepareInstallationDecks = () => prepareDecks(decksRoot);
export const loadInstallationDecks = () => loadPreparedDecks(decksRoot);

export function reportDeckDiagnostics(diagnostics: readonly PackageDiagnostic[]) {
  for (const entry of diagnostics) {
    console.log(`${entry.package}: ${entry.valid ? 'válida' : 'inválida'}${entry.compatible === false ? '; incompatible con este consumidor' : ''}; disponibilidad ${entry.available === undefined ? 'indeterminable' : entry.available ? 'true' : 'false'}`);
    for (const issue of entry.errors) console.error(`[${issue.stage}/${issue.code}] ${entry.package}/${issue.file} ${issue.path}: ${issue.message}`);
  }
}
