# Retirada completada del subsistema sustituido — B21

Solo código/contratos/herramientas/pruebas sin consumidores del producto nuevo. Historial Git y evidencias conservados. **No borrado de bases, exportaciones, copias o secretos del autor.**

- `server/application/usage/appearanceReport.ts`
- `server/application/usage/appearanceWindows.test.ts`
- `server/application/usage/appearanceWindows.ts`
- `server/application/usage/choice.test.ts`
- `server/application/usage/choice.ts`
- `server/application/usage/contracts.ts`
- `server/application/usage/projections.ts`
- `server/application/usage/query.ts`
- `server/application/usage/recording.test.ts`
- `server/application/usage/recording.ts`
- `server/application/usage/reports.ts`
- `server/composition/usage.test.ts`
- `server/composition/usage.ts`
- `server/composition/usageCli.ts`
- `server/composition/usageCommand.ts`
- `server/composition/usageMaintenance.test.ts`
- `server/composition/usageMaintenanceCli.ts`
- `server/composition/usageSyntheticCli.ts`
- `server/infrastructure/usage/appearanceStore.test.ts`
- `server/infrastructure/usage/backups.ts`
- `server/infrastructure/usage/eventValidation.ts`
- `server/infrastructure/usage/http.test.ts`
- `server/infrastructure/usage/http.ts`
- `server/infrastructure/usage/privacyStore.test.ts`
- `server/infrastructure/usage/privacyWorker.test.ts`
- `server/infrastructure/usage/schema.ts`
- `server/infrastructure/usage/sqliteReader.ts`
- `server/infrastructure/usage/sqliteStore.test.ts`
- `server/infrastructure/usage/sqliteStore.ts`
- `server/infrastructure/usage/sqliteWorker.test.ts`
- `server/infrastructure/usage/sqliteWorker.ts`
- `server/infrastructure/usage/worker.ts`
- `server/infrastructure/usage/workerFailure.test.ts`
- `server/usageActivation.test.ts`
- `server/usageProcess.test.ts`
- `server/usageSocket.test.ts`
- `shared/contracts/usage.ts`
- `src/UsageChoiceControl.tsx`
- `src/apiUsage.test.ts`
- `src/socketUsage.test.ts`
- `src/usage.test.ts`
- `src/usage.ts`
- `src/useUsageChoice.ts`
- `tests/browser/appearanceUsage.spec.ts`
- `tests/browser/usage.spec.ts`
- `tests/browser/usageActivation.spec.ts`
- `tests/browser/usageChoice.spec.ts`
- `tests/support/appearanceBrowserServer.ts`
- `tests/support/usageCompiledServer.ts`
- `tools/ci-usage-human.mjs`
- `tools/ci-usage-runtime.mjs`

## Sustitución y garantías

- `server/application/statistics`, `server/infrastructure/statistics`, composición/CLI y `shared/contracts/statistics.ts` sustituyen eventos/recibos/lectores/esquemas anteriores por AGG_DAILY_V1. Sin coexistencia, migración o lector legacy.
- `src/statistics.ts`, `StatisticsControl.tsx` y contratos de ventana conservan control funcional y fotografías consentidas; desaparecen visitId/intenciones/contextos de analítica anteriores. Apariencia visual B20/adenda intacta.
- Las pruebas del protocolo eliminado se sustituyen por reductor, controles, SQLite/worker/proceso/CLI reales y navegador B21. Se conservan regresiones de juego/T04/privacidad; B05 distingue ahora el selector personal ya presente de controles HOST.
- Los nombres CLI `usage:*` y el orquestador `ci-usage.sh` se reutilizan con implementaciones exclusivamente nuevas. Las rutas antiguas permanecen solo como rechazos privados404, sin handlers o aliases.
- No había una dependencia npm exclusiva del modelo anterior: package.json scripts cambian, pero dependencias y package-lock permanecen intactos. Build limpia exclusivamente artefactos propios para no servir módulos retirados.

Inventario obtenido de `git diff --diff-filter=D 565795c d3f4486`; 51 archivos retirados. Evidencia de ausencias en dist/dist-server: [integridad](INTEGRIDAD.json).
