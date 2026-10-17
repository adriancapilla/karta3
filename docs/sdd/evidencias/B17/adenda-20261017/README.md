# Adenda B17 — evidencia local nueva, 17/10/2026

**Implementada/comprobada en Windows; Linux y CI completa pendientes.** No sustituye B17 del 16/10 ni los cinco fallos Linux conservados por publicación. No acredita aprobación visual humana, dispositivo físico, zoom nativo o C09–C10 completos.

## Base, entorno y revisión

- Carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, rama `chore/publicacion-b16-b17`, base `f1d8d2416168b88d9f1503efd9ccab54a516ebc5`.
- El autor confirmó el cese de escrituras del hilo GitHub antes de editar. Preparación ajena registrada separada en **03d1e93**; corrección/pruebas en **346a06325a8772157a0b6318f01c8d88857122fd**. Cierre documental posterior sin cambio de código.
- [Base/status/huellas iniciales](base.json), [árbol probado, siete fuentes, assets, runtime y 124 archivos APP/Git](integridad.json). Código compilado probado igual al commit indicado; las rutas `dist`/`playwright-report` siguen ignoradas.
- Windows, Node 24.19.0 en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm 11.6.2, ICU 78.3/Unicode 17, Chrome **155.0.8059.80**, Playwright 1.63.0, aplicación 0.1.0. PATH local a la terminal, sin cambios globales.
- Servidores de prueba propios, compilación actual y puertos efímeros; conexiones HTTP/Socket.IO reales, reloj/permutaciones legales controlados. No se detuvo un servidor del autor ni se utilizaron sus sesiones.
- Revisión de responsabilidades: producto limitado a `GameCard.tsx`, `useCardTitle.ts` y CSS. Hook/presentación sin importaciones server, estados oficiales o tráfico. Cuatro archivos de pruebas, sin modificar fixtures artificiales anteriores; la nueva de 100 W es un paquete temporal validado. Sin reglas/contratos/paquetes/fuentes nuevas en el producto, rediseño, 4,4 o crecimiento adaptado.

## Ejecuciones y selección final

| Ejecución | Resultado / categoría |
|---|---|
| Cinco diagnósticos, antes de editar producto | **5/5**, 35,2 s, Windows. No reproduce los cinco Linux. [Registro](ejecuciones/before-five.txt). |
| Capturas antes | **8/8**, 48,1 s; escenas legales comparables, no batería de aceptación por sí sola. [Registro](ejecuciones/before-captures.txt). |
| Cinco con primera corrección | **5/5**, 25,3 s, intermedio; no se presenta como puerta final. [Registro](ejecuciones/after-five.txt). |
| Check final | **538/538**, 43 archivos, tipos/lint/build correctos, **71 módulos** sin imports prohibidos/ciclos. [Registro](ejecuciones/check-final.txt). |
| Chrome focal final | **19/19**, 117,346 s (2,0 min), **un trabajador, cero reintentos, cero omitidos/flaky**. [Registro](ejecuciones/final-focal.txt), [lista exacta y duración por caso](ejecuciones/seleccion-final.json). |
| Capturas después | **8/8**, 47,9 s. Mismos paquetes/cartas/estados/tamaños/permutación que antes. [Registro](ejecuciones/after-captures.txt). |
| Medida complementaria de consulta | **1/1**, 5,1 s; consulta completa Tritón/Dato desde compacta 390, no otra batería. [Medida/fuentes](acceptance/consulta-completa-390.json), [registro](ejecuciones/consulta-medida.txt). |

Los 19 se desglosan en **cinco exigidos** (Criaturas ambos modos, B08 T1/1280, cancelada→B ordinary e INC-01→B ordinary), **ocho nuevos** (tres barajas × dos modos, corte válido a12 con clic/avance y fuentes tardías/zoom CSS), **seis regresiones afectadas** (D/teclado/arrastre/foco/parcial; diálogo bajo timeout/revisión; compacta 360 y390; medio pendiente/fallido; frontera útil1367/1368/quinta). Conservar los demás recorridos no implica haber vuelto a ejecutar toda la batería de navegador.

Comandos finales, en la terminal con el PATH indicado:

```powershell
npm run check
npm run test:browser -- --workers=1 --retries=0 tests/browser/cardFace.spec.ts tests/browser/cardTitleFit.spec.ts tests/browser/timedGame.spec.ts tests/browser/cancelGame.spec.ts tests/browser/resultNotice.spec.ts tests/browser/format2Presentation.spec.ts --grep 'B17 criaturas-magicas.*cara completa|B13/T04 A cancelada.*B ordinary|INC-01 expired A.*B ordinary|B08 T1 1280|ADENDA B17|B17 D:|B17 consulta abierta|B17 compacta|B17 fallo/pendiente|B15 frontera' --reporter=list,json --trace=retain-on-failure
```

El comando de navegador vuelve a compilar antes de ejecutar. La captura usó `npm exec -- playwright test --config=playwright-report/b17-adenda/capture.config.ts --workers=1 --retries=0`, con `B17_PHASE=before/after`. [Montaje conservado como documento](captura-montaje.txt); no añade un test de producto fuera de `tests/browser`. La medida de consulta filtró únicamente `ADENDA medida final consulta` en ese montaje. Trazas generadas quedan locales/ignoradas; no se incorporan cookies o sesiones a Git.

## T — títulos, fuentes y banda

Medidas CSS en la mano normal de referencia 1920×1080, zoom100 %, DPR1, ancho útil1368. Todas las caras230×321 e imágenes230×172,5. Las mismas cartas se capturaron a1320×850. Familia declarada `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; CDP identifica **Segoe UI/SegoeUI-Bold** para título/atributo y **SegoeUI** para símbolo propio en estas muestras Windows. No se deducen glifos de la lista CSS. Peso700, line-height normal, espaciado normal sin estrechamiento. Base PC16, mínimo12; Detalles conserva22.

| Carta, medida independiente | Antes fuente/banda/líneas | Después fuente/banda/líneas | Ancho disponible después | Ancho a16 / a12 |
|---|---|---|---:|---:|
| Tritón carta-044 | 16 /42 /2 | **14,1 /24 /1** |182,4844|206,5938 /154,9531|
| Grifo carta-032 | 16 /42 /2 | **15,1 /24 /1** |182,4844|192,7969 /144,5938|
| 67P | 16 /42 /2 | **12,6 /24 /1** |187,1250|236,4219 /177,3125|
| Espíritu carta-038 |16 /24 /1|**16 /24 /1**|182,4844|143,7813 /107,8438|
| Genérica Carta01, null |16 /24 /1|**16 /24 /1**|187,1250|63,0781 /47,3125|
| Encke, corto |16 /24 /1|**16 /24 /1**|187,1250|43,2500 /32,4375|

La cabecera total es204 e incluye gap6 e icono propio de15,5156 o10,875 según glifo; **204 no es ancho de texto**. La prueba verifica que el siguiente paso0,1 no cabe cuando el elegido es menor que la base. Tritón se comprueba y registra en ambos modos; Grifo se mide por sí mismo. Las seis escenas `acceptance/*active3.json` comprueban Resistencia activa; los pares `before/after` conservan activo Poder, para no atribuir una escena a otra.

Banda normal móvil medida32 (base18, margen inferior original8); consulta completa desde compacta29 (base16, línea21+margen original8, icono24). Su altura no se contrae con el título ni se unifica artificialmente con la banda PC24. [Consulta390](acceptance/consulta-completa-390.png). Minicarta:18 y su composición anterior, sin ajuste del hook; las capturas completas390 antes/después tienen el mismo SHA-256 `934ea9ca3092b7ae3745fdc907c818f708364e3093259f61a38b108ab094ef72`.

**Corte autorizado realmente probado:** fixture válida temporal de100 W, ancho necesario a12 **1205,8594** frente a182,4844 disponible. Aplica12/overflow hidden/text-overflow clip, sin elipsis añadida o transformación de cadena. El DOM y heading accesible conservan100 W y Detalles conserva nombre íntegro/tamaño22. Se prueba normal1280/390/360; el resto de la cara permanece contenido y Jugar recibe clic real. [Medida](acceptance/fixture-corte-12-1280.json), [captura](acceptance/fixture-corte-12-1280.png). Es corte aplicado, no nombre visible completo.

**Fuentes tardías/zoom:** una fuente de sistema interceptada solo por la prueba fuerza un cambio real de glifos tras fallback; se registra su archivo/SHA en [fuente-fixture.json](acceptance/fuente-fixture.json) y glifos finales en [medida](acceptance/fuente-final-test-solo.json). Prueba CSS zoom1,25/2/1, sin dividir font-size por escala ni renovar plazo. Los JSON `acceptance/zoom-css-*.json` distinguen CSSzoom/DPR/viewport. **No es zoom nativo del navegador**, pendiente del autor; no se añadió una fuente al producto.

## G — cara, tabla y Resistencia

En estas muestras PC Windows, Tritón/Grifo/67P pasaron de banda42, tabla88,34375, relleno4,9 y gaps **+0,078125/+0,078125** a banda24, tabla95, relleno6 y gaps **+5,75/+5,75**. Filas finales31,5/32/31,5. Títulos cortos mantienen24/95/6. Imagen y borde no cambian; la menor banda permite volver al relleno original donde cabe. Se conserva el condicional6/4,9 para otras métricas, sin introducir un nuevo relleno.

Resistencia activa/no activa está completa en ambos modos, símbolo y nombre íntegros, con fuente14 y sus rangos literales. En Windows medido ocupa una línea; **no se atribuye ese resultado a Linux**, cuyo caso original ocupaba dos. Se inspeccionan límites de filas y rangos de texto verticales, no solo scrollWidth. Los datos Linux originales (Tritón, banda38/tabla95,34375/Resistencia42,28125/gap−2,84375) se preservan sin atribuirlos a Grifo.

La consulta completa tenía un déficit adicional detectado en la prueba nueva: heredaba `align-items:start` y `gap:4px` de la minicarta; encabezado84,59375, gaps4/−1,5. El aislamiento de la cara completa elimina esa herencia. Medida final Tritón390/Dato:230×321, imagen230×172,5, banda29, tabla95, relleno6, gaps **+3,25/+3,25**; ningún cambio de margen, atributo, tamaño de imagen o altura para esconder el déficit.

[Medidas comparadas, con cajas/glifos/hit tests por captura](medidas-comparadas.json). Los JSON originales de cada escena en `before/` y `after/` conservan coordenadas, scroll vertical, viewport y contexto; `*-titles.json` añade fuentes/anchos/rangos. No se exige igualdad píxel a píxel entre fuentes/plataformas.

Capturas revisadas directamente en esta sesión:

- Tritón: [antes](before/criaturas-magicas-1920-carta-044.png) / [después](after/criaturas-magicas-1920-carta-044.png).
- Grifo: [antes](before/criaturas-magicas-1920-carta-032.png) / [después](after/criaturas-magicas-1920-carta-032.png).
- 67P: [antes](before/sistema-solar-1920-67p-churyumov-gerasimenko.png) / [después](after/sistema-solar-1920-67p-churyumov-gerasimenko.png).
- Genérica null: [después](after/generica-1920-carta-001.png); perfiles/escena equivalentes en `before/`.
- Compacta390: [antes](before/compacta-390-full.png) / [después](after/compacta-390-full.png).
- También se conservan escenas completas de indicadora/mano/Mesa pública/revisión/Detalles para las tres barajas1920 y normales1320; y compacta360. Son producto local automatizado, no aprobación humana.

## I — interacción y fallos de desarrollo

La fixture larga conserva sus datos. Tras la jugada del invitado, el botón propio se desplaza al viewport y se comprueba su receptor central; un `click()` normal genera `isTrusted=true` y **un único avance/jugada**. El registro se conserva en la región de mano porque el botón desaparece legítimamente al jugar. No se usa fuerza, dispatchEvent, invocación de la acción, z-index o pointer-events para esquivar contenido. Los hit tests de capturas estáticas fuera del viewport o de botones deshabilitados no se interpretan como prueba de recepción: la evidencia I es el recorrido accionable.

D por clic/Enter/Space, arrastre, consulta/Información anidadas y foco tras Escape/resize conservan carta/contexto; no juegan ni pausan. Timeout/revisión con diálogo abierto avanza, quinta sigue consultable y recuperación/A→B ordinaria conserva T04. No se modificaron las aserciones de atributos/avance de los cinco casos, ni sus plazos/cobertura.

Fallos intermedios conservados, sin convertirlos en aprobados:

1. [Primera prueba nueva](ejecuciones/new-tests-first-failed.txt):1 correcta/7 fallidas; seis por consulta heredando composición compacta y una observación de fuente. [Diagnóstico con cajas](ejecuciones/diagnostic-new.txt): ancho84,59 y déficit−1,5, no supuesto fallo de CPU.
2. Tras corregir herencia/font loading, [7 correctas/1 fallida](ejecuciones/new-tests-resize-observation.txt): lectura antes de ResizeObserver tras resize. Se espera la condición geométrica con el **timeout normal de expect**, sin aumentar duración/reintentar acciones. [Ocho nuevas correctas intermedias](ejecuciones/new-tests.txt).
3. [Primer cierre focal](ejecuciones/final-focal-first-failed.txt):18 correctas/1 fallida; el clic sí jugó pero la aserción buscaba el botón retirado. Observación movida al padre persistente, conservando clic genuino/avance/conteo. Después19/19 final.
4. El primer lint rechazó mutación de un ref recibido por el hook. El hook pasó a poseer su ref local; no se desactivó la regla de lint.

## Diagnóstico Linux y puerta posterior

**Linux no ejecutado en este encargo.** `docker info` no encontró el motor `dockerDesktopLinuxEngine`; WSL solo enumeró docker-desktop. No se inició Docker, instaló distribución o alteró runtime global para este trabajo. Los diagnósticos previos siguen en `APP/verificacion-b16-b17-20261016` y sus tres SHA coinciden con la base.

El autor traslada al hilo GitHub el **HEAD documental final indicado en el cierre de entrega**, que contiene346a063 sin cambio de producto. Mantener escritor único; no modificar esta carpeta simultáneamente. Ejecutar primero diagnóstico focal5 en Linux/Node24.19/Chrome, un trabajador/cero reintentos:

```bash
npm run test:browser -- --workers=1 --retries=0 tests/browser/cardFace.spec.ts tests/browser/timedGame.spec.ts tests/browser/cancelGame.spec.ts tests/browser/resultNotice.spec.ts --grep 'B17 criaturas-magicas.*cara completa|B13/T04 A cancelada.*B ordinary|INC-01 expired A.*B ordinary|B08 T1 1280' --trace=retain-on-failure --reporter=list,json
```

Verificar **cinco**, no cuatro. Solo si pasan, ejecutar el filtro ampliado19 del apartado anterior, con la misma compilación/HEAD y parámetros. El `workflow_dispatch` existente acepta `chrome_diagnostic`; los dos regex se pueden usar secuencialmente en esa entrada (CI fija un trabajador y no configura reintentos). No activar aún la batería completa ni el trabajo de imagen con el filtro vacío.

Conservar reporte/trazas y **también `playwright-report/b17-adenda/acceptance/`**: contiene glifos efectivos, bandas/anchos/gaps/rangos/Tritón ambos modos/Grifo independiente y la fuente de prueba. El artefacto habitual del workflow guarda `test-results/`/JSON de reporte; el responsable debe recoger explícitamente las nuevas medidas antes de desechar el runner. Si falla, devolver test/cajas/receptor/fuente/contexto, sin mayor timeout o parche de puntero. No dar por reparados cinco Linux a partir de los resultados Windows.

**Solo después de cinco y nuevos pertinentes correctos en Linux** corresponde al responsable GitHub ejecutar la CI completa del HEAD final y revisar PR #13 antes de integrar. Los commits correctivos locales llevan `[skip ci]` para preservar esta secuencia si posteriormente se trasladan; no alteran el workflow ni impiden su despacho manual. Este encargo no publicó ni encargó push, merge, GHCR o VPS.

## Revisión humana / coordinación

Con runtime24.19/ICU78.3 correcto al principio del PATH, usa una instancia propia en un puerto libre; no reutilices una compilación/servidor anterior. README contiene los pasos completos de dos sesiones:

```powershell
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
node -p 'process.execPath + " | " + process.version + " | ICU " + process.versions.icu'
npm run build
if ($LASTEXITCODE -eq 0) { $env:PORT='3167'; npm run start }
```

Abre `http://127.0.0.1:3167` desde dos perfiles independientes. Elige explícitamente cada versión, modos1-58/Dato y optimización on/off. Revisa títulos largos/cortos/null en indicadora/mano/Mesa, tabla/Resistencia y Jugar exterior; D muestra nombre completo y devuelve foco. Repite390/360, consulta completa, carruseles/quinta y resize. Prueba **zoom nativo125/200 %**, aún no ejecutado aquí, sin pausar el reloj. Recarga ambos, cancela con HOST y crea otra sala; no detener servicios ajenos.

Traslado descriptivo para responsables de Aplicación §§7.2/7.5–7.7: excepción solo título normal12→base/corte condicionado, banda estable por perfil y nombre íntegro accesible/en Detalles; no cambio de reglas o contrato editorial. El futuro límite editorial de nombres requiere acuerdo posterior con Gestor/contrato y fuentes/ancho de referencia. TFM/Diseño/ASSETS/PRODUCTO y cierres históricos no se editaron. AC-T/G/I correctos **localmente**, Linux pendiente; AC-C correcto local; AC-GH pendiente. Aprobación visual humana/dispositivos físicos y C09–C10 completos siguen pendientes.
