# Ajuste de etiqueta de dificultad de bots

**Estado:** acordado y simplificado por el autor el 05/10/2026; implementación y comprobaciones pendientes.
**Base observada:** B09 en `feat/b09-bots`, HEAD `590be43`, sin cambios de producto locales.

## Encargo acotado

Cambiar la etiqueta visible «Normal» por «Difícil» en el selector y en las marcas de bots de espera, mesa y resultados. «Fácil» permanece igual. El bot añadido por defecto seguirá usando la misma política, presentada como «Difícil».

- Leer AGENTS.md y conservar el trabajo existente sobre la base con B09.
- Las apariciones localizadas están en `src/WaitingPlayers.tsx`, `src/GameScreen.tsx` y `src/ResultsScreen.tsx`. Ajustar también las expectativas textuales afectadas de `tests/browser/bots.spec.ts` y la ayuda vigente del README.
- Conservar por ahora `EASY`/`NORMAL`, nombres de funciones, contratos y algoritmos. No realizar refactorizaciones ni sustituciones globales de «normal».
- Comprobar Fácil/Difícil en las cuatro ubicaciones, incluido el bot recién añadido y la recuperación tras recarga. Ejecutar `npm run check` y los recorridos existentes pertinentes: `npm run test:browser -- --workers=2 --grep "B09 P1|B09 P2 normal compilado"` (o filtro equivalente si cambia el título). Aprovechar la partida existente para comprobar mesa y resultados.
- Registrar aquí los archivos, resultados reales y tiempo de edición separado del tiempo de pruebas; tokens únicamente si existe medición. Conservar el cierre histórico de B09. Sin publicación ni edición de fuentes generales TFM.

## Pendiente para coordinación y Arquitectura

La etiqueta «Difícil» y el identificador interno `NORMAL` quedarán desalineados **temporalmente**, por decisión expresa del autor. No se considera una denominación definitiva.

Cuando se revisen los niveles de dificultad, habrá que alinear identificadores, nombres de funciones asociados, contratos, pruebas y documentación de dominio/aplicación con los niveles acordados. Esto evitará confusiones si «Normal» se utiliza para un futuro nivel intermedio. Los nuevos niveles y sus algoritmos aún no están decididos.

El cierre de implementación comunicará a coordinación el cambio efectivamente realizado y este pendiente. Hasta entonces, el cambio está acordado, no implementado ni verificado; esta preparación no ejecuta pruebas del producto.
