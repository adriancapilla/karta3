import { DeckLoadError, prepareInstallationDecks, reportDeckDiagnostics, validateDeckPackage } from '../server/composition/decks.js';

try {
  const args = process.argv.slice(2);
  if (args.length === 3 && args[0] === 'validate' && args[1] === '--package') {
    const result = await validateDeckPackage(args[2]);
    reportDeckDiagnostics([{ package: args[2], valid: result.valid, available: result.available, errors: result.errors }]);
    if (!result.valid) process.exitCode = 1;
  } else if (args.length === 1 && args[0] === 'prepare') {
    const result = await prepareInstallationDecks();
    reportDeckDiagnostics(result.diagnostics);
    console.log(`Catálogo preparado: ${result.response.decks.length} barajas disponibles.`);
  } else {
    console.error('Uso: decks:validate -- --package <carpeta> o decks:prepare');
    process.exitCode = 1;
  }
} catch (error) {
  if (error instanceof DeckLoadError) {
    reportDeckDiagnostics(error.diagnostics);
    for (const issue of error.errors) console.error(`[${issue.code}] ${issue.file} ${issue.path}: ${issue.message}`);
  } else console.error('No se pudo completar la operación de barajas.');
  process.exitCode = 1;
}
