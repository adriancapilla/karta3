# B22 — evidencia de incorporación manual,22/10/2026

**Implementada/comprobada técnicamente en Windows.** [Cierre por criterio](../../BLOQUE_22_INCORPORACION_MODELOS_IA_2026.md#7-cierre-técnico-de-implementación--22102026). Incorporación nueva de contenido, sin consumidor o reglas nuevos. Finalidad demostrativa, sin finalidad formativa/ranking científico. Linux/CI/imagen conjunta y revisión humana pendientes; C09–C10 parciales.

## Procedencia e integridad

- [Inventario inicial y trabajo previo conservado](INICIAL.json): base `main/aa336d3`,124 archivos anteriores; hash de cada archivo de paneles/proceso/B11/preparación.
- [Copia verificada](COPIA.json):61 rutas/tamaños/SHA de origen=APP=Git en commit `a4f6cd0`;124 anteriores intactos y seis certificados idénticos. JSON de metadatos `2b05800cd6df64080366212f7fd7475ce66ca336116758b3ae7d071cb41e1ee2`; cartas `95871a98aefce784eff5b66dd07f5f6c3a8e3109531eb6227c4ee68b52926c30`.
- [Certificados originales](certificados/ENTREGA_IMPLEMENTACION.md), [manifiesto final](certificados/MANIFIESTO_SHA256.json), [aprobación/activación](certificados/APROBACION_FINAL_Y_ACTIVACION.md). Huellas y finales de línea originales protegidos por Git; no candidata1 o imágenes duplicadas en esta evidencia.
- [Fuente/runtime/build](FUENTE.json): pruebas/referencias `abb8619`, ajuste exclusivo de selector `fc99a2a`; código de ejecución equivalente entre ambos. CSS y pruebas previas de paneles, B11/proceso/prompt permanecen sin mezclar en los commits B22.

El árbol probado incluye el **ajuste local B15 de paneles pendiente de registrar**. Sus hashes se conservan en INICIAL/FUENTE y el CSS compilado; los resultados no son una prueba de checkout limpio del HEAD B22 aislado. Antes de CI/publicación, el autor debe reunir también esa entrega en la fuente conjunta. El estado Git no se declara limpio ni se mezcla el trabajo previo para aparentarlo.

## Puertas realmente ejecutadas

| Evidencia | Resultado |
|---|---|
|[Validador V2](validacion.txt), [prepare](prepare.txt)|Origen válido/disponible; copia APP idéntica y cuatro disponibles, catálogo generado. |
|[Check final](check-final.txt)|614/614,58 archivos,103 módulos;51,60s Vitest, tipos/lint/build correctos. |
|[Focal inicial](navegador-focal.txt)|2/2,20s; selección/recursos y compacta390 Dato. |
|[Grupo final](navegador-primer-grupo.txt)|13/15,1,4min; montaje de indicadora oculta falló solo en normal adaptada390 de ambos modos. No se cambió producto/contenido. |
|[Reparación focal](navegador-normal-adaptada.txt)|2/2,11,3s; nombre accesible visible y layout real. Lint focal correcto, sin ampliar plazos/reintentos o retirar asserts. |
|Resumen navegador|**15 casos únicos correctos**,diez nuevos+cinco regresiones. No batería completa ni un único grupo15/15. |
|Linux|Sintaxis `node --check tools/ci-image-runtime.mjs` y Git Bash `bash -n tools/ci-image.sh` correctas. No Linux/OCI ejecutados; sus controles siguen estrictos. |

Selección final ejecutada con Node24.19.0/npx existente, PATH fijado y main propio efímero (el driver está en `playwright-report/b22/run-browser.ts`):

```text
playwright test tests/browser/models.spec.ts tests/browser/decks.spec.ts tests/browser/solar.spec.ts tests/browser/creatures.spec.ts tests/browser/bots.spec.ts --grep "B22 |AGV2-02/03/08|B14 catálogo normal.*1280px|B16 instalación normal|B09 P2 normal compilado" --workers=2 --retries=0 --trace=on --output=playwright-report/b22/final-traces
```

Reparación únicamente de los dos casos afectados:

```text
npx --no-install playwright test tests/browser/models.spec.ts --grep "B22 textos dirigidos 390 optimizar=false" --workers=1 --retries=0 --trace on --output playwright-report/b22/normal-adaptada-traces
```

## Producto, capturas y mediciones

[16 escenas medidas](MEDIDAS.json): datos/celdas14px; normal230×321 a1368 útiles; compacta220px con alturas naturales213,66/221,66 según escena, paneles450/358 según útil1233/358. Normal adaptada358 útil sin optimización conserva su perfil existente. Títulos completos en DOM/accesibilidad/Detalles, fuentes vigentes y sin overflow de celdas/documento en estas escenas. No aceptación universal de toda carta/fuente/dispositivo.

| Escena | Captura |
|---|---|
|Preparación, dos sesiones y portada |[390](capturas/espera-390.png) |
|Normal, Dato/fecha/contexto |[1920](capturas/mano-1920-true-DISPLAY_VALUE.png) |
|Normal, Mesa/revisión1–58 |[1920](capturas/mesa-revision-1920-true-PLAY_VALUE.png) |
|Compacta, Dato/revisión/títulos largos |[390](capturas/mesa-revision-390-true-DISPLAY_VALUE.png) |
|Compacta intermedia y cota450 |[1280](capturas/mano-1280-true-DISPLAY_VALUE.png) |
|Normal adaptada sin optimizar |[390](capturas/mano-390-false-DISPLAY_VALUE.png) |
|Partida real con bots, resultado |[390](capturas/resultado-normal.png) |

Las escenas dirigidas usan paquetes reales, HTTP/Socket.IO reales, reloj controlado y permutación legal. Fechas/textos de §5 exactos, nota890 caracteres de Sonnet4, instrucciones1197 y valores por modo comprobados en DOM/Detalles/trace; consulta de indicadora por representación y foco de vuelta. Dos jugadas humanas reales pasan los títulos largos a Mesa y revisión. HTTP, ack y eventos por destinatario contrastados con el contrato de privacidad; no solo elementos ocultos.

## Partida normal y dimensión estadística

[Hechos agregados de la partida normal](PARTIDA_NORMAL.json): main aislado copiado de APP, sin ASSETS/PRODUCTO/certificados, SystemClock/TimerScheduler/CryptoCardPermutation, HUMAN+EASY/HARD,15 movimientos del humano a tiempo, tres rondas finales, DECK_COMPLETED y45 puntos oficiales. F5 durante partida/resultados, dos pestañas, retorno y sala nueva. No cartas/puntos asignados o saltos de motor. Gestos automatizados, no persona o prueba de habilidad humana.

Solo SYNTHETIC/test y almacenamiento fabricado, aislado/eliminado al terminar el ensayo propio. Paquete `modelos-ia-2026:2:2` observado por lector SQLite independiente una vez en la dimensión existente CONFIGURATION/package, terminalDECK_COMPLETED una vez. Sin nuevos eventos/campos/informes o permiso de fotos, recogida real o datos del autor. Las regresiones usan una instancia propia con estadísticas OFF. La existencia de esta evidencia no acredita operación pública.

La revisión de capturas fue del agente en Chrome/Windows; no dispositivos físicos, aprobación humana, zoom físico, Linux/CI/imagen o exactitud científica. Retención/plazos de regresión controlados y los tiempos normales de la partida son categorías distintas. Manual humano preparado en README, pendiente hasta realizarlo. Logs/trazas originales de intentos separados en `playwright-report/b22/`; sin DB/secretos reales en Git. Publicación/despliegue y alineación descriptiva se trasladan al autor, sin mensajes a otros hilos o fuentes TFM editadas.

## Recepción posterior del autor — 22/10/2026

El autor comunica partidas satisfactorias con la nueva baraja; se conserva el alcance real de esa valoración, sin extenderla a dispositivos físicos, fuentes o tamaños no comprobados. Publicación conjunta y verificaciones nuevas en [registro operativo](../../../operacion/PUBLICACION_B22_Y_TRASLADO_B21.md); las evidencias Windows anteriores permanecen históricas.
