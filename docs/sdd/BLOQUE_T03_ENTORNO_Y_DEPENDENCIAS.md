# T03 — Entorno Node y dependencias de desarrollo

**Alcance registrado antes de editar dependencias — 07/10/2026.** Encargo técnico autorizado; estado inicial `main`/`dd20e0a9d648f5d96ee034254fabbf91ac1bcc5c`, árbol limpio. Rama propia `chore/t03-entorno-dependencias`. Fuentes leídas: AGENTS, proceso SDD, README, manifiesto/lockfile, CI y registro operativo.

## Objetivo y decisiones de preparación

- Establecer Node **24.19.0 LTS** como referencia reproducible local/CI, alineando requisito, referencia de versión, documentación y tipos de Node. Verificar instalación limpia, check, desarrollo, compilado y todos los recorridos existentes, sin modificar instalaciones globales.
- Obtener `npm audit --json` completo y `--omit=dev`, revisar cadenas y correcciones oficiales, actualizar únicamente lo afectado; preferir el paquete incorporador y justificar un override si fuera necesario. Conservar lockfile y diagnóstico anterior/posterior.
- Conservar producto, contratos, reglas, interfaz, pruebas y genérica formato 1/contenido 2 disponible. No incluye INC-01, refactorización, TFM, publicación, integración ni despliegue. CI remota nueva pendiente del hilo GitHub.

La evidencia histórica operativa registra fallo Windows `0xC0000005` con 24.13.0 en TypeScript y éxito con 24.19.0; Linux/24.13.0 pasó. Conseguir un entorno operativo no demuestra la causa original. No se repetirá una investigación forense ni se atribuirán los recuentos históricos 413/114/65 a T03 sin ejecutar sus puertas nuevas.

Node inicial del PATH: `C:\Program Files\nodejs\node.exe`, **24.13.0**, npm **11.6.2**. Runtime alternativo comprobado: `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, **24.19.0**, Windows x64. Se utilizará sin modificarlo, junto al CLI npm existente; selección de herramientas limitada a los procesos de comprobación.

Fuentes oficiales consultadas el 07/10/2026: [Node 24.19.0 LTS](https://nodejs.org/en/blog/release/v24.19.0), [shell-quote GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), [source-map-js GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). Las correcciones publicadas son shell-quote 1.11.0 y source-map-js 1.2.2; contrastar con el registro npm y el árbol actual antes de aplicar cambios.

## Comprobación prevista

1. Audit completo/producción, árbol de dependencias y huellas de ambos JSON en APP/ASSETS antes del cambio.
2. Instalación limpia del lockfile final y auditorías posteriores; confirmar el ejecutable efectivo de los procesos.
3. `npm run check`, arranques `npm run dev`/`npm run start`, catálogo y batería completa `npm run test:browser -- --workers=2`, sin reducir aserciones/reintentos ni plazos.
4. Registrar versión/ruta/fecha/comandos/resultados, revisión del diff y límites. Cierre aún pendiente: este plan no acredita pruebas superadas.

## Cambio y revisión — 07/10/2026

Cambio comprobado: `271b8ff099d697ff6c489caf843682c9ee263c60`, posterior al registro de alcance `cc3bde9`. Aplicación 0.1.0; Windows x64, PowerShell, Chrome 154.0.8037.98 (`C:\Program Files\Google\Chrome\Application\chrome.exe`), Playwright 1.63.0, zona Europe/Madrid. No había cambios ajenos al preparar la rama; main permanece en la base aprobada. Se conservan los históricos B04–B12 y los documentos de Diseño integrados.

- `.node-version` fija **24.19.0**, CI utiliza ese archivo, `engines` exige `>=24.19.0 <25` y `.npmrc` activa `engine-strict=true`. Node es LTS según su publicación oficial citada arriba. Se seleccionó el runtime existente de la ruta registrada, sin instalarlo ni modificar el PATH global. npm **11.6.2** se ejecutó mediante `C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js` con ese Node; lanzadores temporales ignorados garantizaron también los npm anidados. Una sonda temporal de `process.execPath` confirmó 24.19.0 en TypeScript, herramientas, servidor y procesos hijos. Es un montaje de comprobación, no una dependencia de Codex para ejecutar KARTA3: README explica usar una distribución oficial con Node/npm juntos.
- `@types/node` **26.6.3→24.19.1** y su dependencia `undici-types` **8.9.0→7.24.6** alinean tipos/runtime. El registro declara TypeScript mínimo 5.6; el proyecto conserva 6.0.3 y supera su comprobación de tipos. Vite conserva 8.3.1 y admite estos tipos mediante su rango publicado.
- Cadena `Vite → PostCSS 8.5.28 → source-map-js 1.2.1`: actualización focal del incorporador **PostCSS 8.5.29**, dentro del rango existente de Vite, que exige **source-map-js ^1.2.2**. No se añade override a esa cadena.
- Cadena `concurrently 10.0.5 → shell-quote 1.9.0`: 10.0.5 sigue siendo la última publicación consultada y fija esa versión vulnerable. Override **solo bajo concurrently**, a **1.11.0**, mínimo corregido de la misma serie mayor; evita el downgrade mayor a 9.2.1 sugerido por audit. Compatibilidad comprobada con el arranque real de desarrollo. Revisar el override cuando el incorporador publique una corrección. Referencia adicional: [changelog oficial de shell-quote](https://github.com/ljharb/shell-quote/blob/main/CHANGELOG.md).

Comando de actualización: `npm update postcss --package-lock-only --ignore-scripts`, tras editar exclusivamente requisito/tipos/override. El diff del lockfile cambia **cinco versiones**: los dos tipos, PostCSS, source-map-js y shell-quote. Conserva el resto de versiones, dependencias directas de producción, scripts, pruebas, producto, arquitectura y contenido. No se utilizó `audit fix`, corrección forzada ni silenciado de alertas. Revisión semántica del diff y control de importaciones/ciclos: sin cambios de responsabilidades o contratos.

## Resultados realmente ejecutados

| Comprobación nueva | Resultado / fecha y duración |
| --- | --- |
| `npm audit --json` anterior | 07/10, 11:10: **3 alertas**, salida 1: dos críticas (`shell-quote` y su incorporador `concurrently`, misma cadena) y una alta (`source-map-js`). Son dos avisos originales, tres paquetes señalados. |
| `npm audit --omit=dev --json` anterior | **0**, salida 0. |
| Instalación limpia `npm ci` del lockfile final | 11:13:58–11:14:48, **50,40 s**, salida 0; 328 paquetes instalados, 329 auditados. Sin instalación parcial ni cambio de runtime global. |
| Auditorías completa / producción posteriores | 11:14:50: **0 / 0**, ambas salida 0. Árbol `npm ls concurrently shell-quote postcss source-map-js @types/node --all` confirma las resoluciones. Resultados limitados a la fecha consultada. |
| `npm run check` final | 11:17:32–11:18:32, **59,42 s**, salida 0: tipos, lint, preparación/build, **413/413 pruebas en 39 archivos**, Vitest 18,98 s, **65 módulos** sin imports prohibidos ni ciclos. |
| `npm run dev` | 11:27:43–11:27:54: Vite/servidor reales, `/` y `/api/decks` 200, genérica 2, `no-store`, sin cookie de catálogo; ambos JSON privados 404. Chrome automatizado crea/entra con **dos contextos independientes**, host sincronizado. Árbol propio detenido y puerto liberado. |
| `npm run start` | 11:28:22–11:38:07, compilación vigente del mismo cambio: `/` y `/api/decks` 200, genérica 2, `no-store`, sin cookie; JSON privados 404. Proceso efectivo `main.js` usa Node 24.19.0. Catálogo nuevamente 200 al finalizar; árbol propio detenido y puerto liberado. |
| `npm run test:browser -- --workers=2` completo | 11:28:43–11:36:58: **114/114 en 14 archivos**, salida 0, dos trabajadores, cero reintentos; **8,1 min Chrome**, **495,05 s incluyendo build**. Misma entrega compilada y servidor normal vigentes, sin cambios de producto entre arranques/construcciones. |

Los primeros ensayos auxiliares de desarrollo fallaron por una expectativa de título de anfitrión incorrecta y por consultar API antes de que el servidor estuviese listo, aunque Vite ya respondía. Se corrigió **solo el montaje temporal**, conservando pruebas/producto. La limpieza inicial bajo sandbox dejó hijos del ensayo; se identificaron y cerraron sus PID propios, sin detener runtimes ajenos. El ensayo final espera ambos servicios y termina correctamente. Al cerrar el compilado, el montaje no tenía stdin abierto; se verificaron y detuvieron únicamente su proceso/helper y descendientes registrados, confirmando puerto liberado. La consulta inicial de auditoría restringida no obtuvo datos; se repitió con acceso al registro y caché local antes de aplicar cambios, sin interpretarla como cero alertas.

Evidencia local ignorada/regenerable: `playwright-report/t03/` (audit anterior/posterior/producción, estados y tiempos de instalación/check/arranques/navegador, rutas efectivas, huellas), `t03-ci.log`, `t03-check.log`, `t03-browser.log`, árboles `t03-tree-before.log`/`t03-tree-after.log`. Las cifras anteriores son nuevas de T03, no reutilizadas de los cierres históricos. Horas de esta tabla en Madrid (UTC+2); estados de arranque en JSON usan UTC.

## Genérica y límites

Comparación antes/después de **todos los bytes** en APP y ASSETS contra las huellas aprobadas de activación §2; parejas iguales:

| Archivo | SHA-256 aprobado = APP = ASSETS | Bytes |
| --- | --- | --- |
| `baraja.json` | `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` | 4723 |
| `cartas.json` | `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c` | 34030 |

Se conserva formato 1/contenido 2 disponible, 58 cartas y semilla `generica-v1`. Catálogo y compilaciones permanecen generados/ignorados. Sin edición de ASSETS, TFM, reglas, interfaz, pruebas, INC-01 ni otros bloques. Este éxito no demuestra la causa del fallo nativo original. CI Linux con la nueva referencia pendiente del hilo GitHub; no publicación/PR/integración/despliegue. C09–C10 continúan parciales, sin afirmar evaluación con usuarios ni equilibrio. Pruebas de navegador son automatización en Chrome con móvil emulado y los montajes existentes; no revisión humana ni dispositivos físicos.

La batería final conserva todos los recorridos y aserciones B01–B12/T01/T02/activación, incluidos tiempo sustituido y conexiones reales. Nuevo caso B08 real: inicio **11:35:06.605**, límite **11:35:21.605**, cierre del transporte **11:35:06.679**, observación **11:35:21.749** (143,86 ms después), contador propio 1 e identidad recuperada; SystemClock/TimerScheduler/entropía normales, instalación temporal compilada sin ASSETS. No se atribuye media hora real a retención/caducidad controladas.

**Estado de cierre: implementado y verificado localmente el 07/10/2026**, sobre el cambio revisado `271b8ff`; el commit de cierre únicamente registra documentación. Instalación, check, desarrollo, compilado, auditorías y navegador final correctos; cartas intactas y procesos propios detenidos. Pendientes: nueva CI remota y revisión futura del override; causa nativa original no demostrada. Alcance técnico completado, sin abrir otro bloque ni publicar.
