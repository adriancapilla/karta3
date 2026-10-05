# Ajuste de etiqueta de dificultad de bots

**Estado:** acordado y simplificado por el autor el 05/10/2026; implementado y verificado localmente el mismo día. Evidencia nueva al final; cierre histórico B09 intacto.
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

La preparación no ejecutó pruebas del producto. El cierre siguiente registra la implementación y sus comprobaciones nuevas.

## Cierre de implementación — 05/10/2026

Base efectiva `590be43b2a6da9847624209e4e1d8ff053a9dac2`, rama `feat/b09-bots`. Conservados el proceso modificado y este documento inicialmente sin registrar; preparación incorporada en commit separado. No restauración, publicación o cambios de fuentes generales TFM.

Archivos: `src/WaitingPlayers.tsx` (selector y marca de espera), `src/GameScreen.tsx` (mesa), `src/ResultsScreen.tsx` (clasificación/ganadores), `tests/browser/bots.spec.ts` (expectativas y comprobación de etiquetas), README vigente, este cierre y el enlace/estado del proceso. Producción: cuatro sustituciones literales, sin refactorización. EASY/NORMAL, funciones, contratos, algoritmos y valor predeterminado interno permanecen iguales; nuevo bot se muestra Difícil. Fácil no cambia. No sustitución global de «normal»: instancias/rondas normales conservan su significado.

La instalación previa fallida había dejado ausentes TypeScript/Express. Detenida la instancia propia que bloqueaba sharp; `npm ci --offline --no-audit --no-fund` restauró 328 paquetes en 10,89 s, sin cambiar package-lock ni dependencias acordadas. Esto es preparación del entorno, no edición de código ni tiempo de pruebas. Reiniciar pierde la memoria de ensayos; se arrancó la compilación nueva con `npm run start`.

| Comprobación nueva | Resultado real |
|---|---|
| `npm run check` | Salida 0, tipos/lint/build y **402/402 en 37 archivos**, 17,17 s Vitest; arquitectura **64 módulos** sin imports prohibidos/ciclos. Comando completo: **44,59 s**, 17:20:14–17:20:59 Europe/Madrid. |
| `npm run test:browser -- --workers=2 --grep "B09 P1\|B09 P2 normal compilado"` | Salida 0, **4/4 Chrome**, un trabajador efectivo. P1 360/390/1280:28,4/25,5/27,7 s; partida normal:38,7 s. Playwright2,0 min; comando incluida construcción: **127,55 s**, 17:21:39–17:23:47. |
| Contenido comprobado | Añadir presenta Difícil, opción visible Difícil mantiene value NORMAL; Fácil sigue visible/valor EASY. Dos sesiones y dos pestañas, gestión/errores/foco; mesa de ambos niveles, F5 de ambas pestañas y resultados con Fácil/Difícil. Partida genérica2 completa con adaptadores/entropía normales, resultado y nueva sala. |
| Instancia servida | HTTP 15:24:07.055 UTC: bundle `index-BM1k2g2P.js` igual a dist, SHA-256 `9DE4969EC298299E903DEE683C82BA3F12413F0A65D8D7BCB68FAFF58690CE31`; servidor normal 127.0.0.1:3000. |

Entorno: Windows/PowerShell, aplicación0.1.0, Node24.13.0/npm11.6.2, Chrome154.0.8037.93, Playwright1.63.0/Vitest5.0.2. Navegador automatizado compilado, móvil emulado y conexiones reales; no nuevo recorrido humano ni dispositivos físicos. Solo se ejecutaron los cuatro recorridos pertinentes: las 86 pruebas del cierre B09 son históricas y no se atribuyen a este ajuste. Logs/compilación/catálogo/capturas ignorados. No fallos nuevos de check/navegador.

Tiempos separados (ventanas de edición registradas): componentes/pruebas/README **65,52 s** (17:19:09–17:20:14), revisión/cierre documental **80,89 s** (desde 17:25:30 hasta 17:26:51); edición total **146,41 s**. Pruebas completas **172,14 s** (44,59 +127,55), sin sumar esperas entre comandos. Instalación10,89 s excluida. No hay medición independiente de tokens y no se estima.

**Conclusión para coordinación:** La etiqueta Normal se ha cambiado a Difícil. El código conserva temporalmente NORMAL. Cuando revisemos los niveles de dificultad, queda pendiente alinear identificadores, funciones, contratos, pruebas y documentación para evitar confusiones con un posible nivel Normal intermedio.
