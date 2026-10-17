# Continuación G/T — evidencia nueva del 17/10/2026

**Actualización posterior de publicación B10/Solar:** autorización y cierre en [adenda §11](../../../ADENDA_B17_TITULOS_Y_ENCAJE.md#11-corrección-acotada-b10-y-solardato390--17102026). Producto8878462: Linux cuatro4/4 (39072288553,36,295611s) y ampliada38/38 (39072554983,293,431301s), worker1/retries0, con los29 anteriores. [Medidas antes/después](correccion-B10-Solar-medidas.json). Solo margen horizontal compartido de datos y actualización del criterio B10 vigente; referencias históricas/compacta intactas. Presupuesto Chrome30/trabajo35 por71c2025 con tiempos reales documentados. CI completa definitiva, integrado y clon se registran en PR #13; estos focales no los sustituyen. El texto siguiente es el cierre original de Implementación, con su estado Windows/Linux de aquella fecha.

**Windows correcto; Linux focal y CI completa pendientes.** No sustituye la primera adenda, sus cierres, Linux5/5, Linux17/19 o el diagnóstico externo39056325353.

## Continuidad y fuentes

- Carpeta única/rama `chore/publicacion-b16-b17`, base27eb1fa8e65c90cfaca251f3a676c66d51b276bf. Solo había dos documentos modificados: adenda/prompt; preservados en **4a8565a**. Sin ramas/checkouts/reset/amend, escrituras simultáneas o servidores ajenos detenidos.
- **0591c0f**: columnas G, cuatro archivos (`GameCard.tsx`, CSS, `cardColumns.spec.ts`, `cardColumnsGeometry.ts`). **f5c2c78**: T, únicamente `useCardTitle.ts`. Código final probado **f5c2c78776ec75964572664a52d32591f6b59b4b**, seguido por cierre documental sin cambio de producto.
- [Integridad](integridad.json): árbol/fuentes/assets/runtime y **124/124** bytes/blobs iguales a la evidencia previa aprobada; genérica/Solar2/4 y Criaturas2/2. Cinco diagnósticos externos identificados por SHA. `configurationBrowserServer.ts`, `cardTitleFit.spec.ts` y `cardTitleGeometry.ts` no cambiaron respecto a27eb1fa: `longTitle` sigue cambiando solo el nombre y las aserciones/criterios anteriores permanecen.
- Node24.19.0 en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm11.6.2, ICU78.3/Unicode17, Chrome155.0.8059.80/Playwright1.63, Windows. PATH de terminal, sin modificar runtimes globales o dependencias.
- Servidores propios compilados en puertos efímeros y dos sesiones HTTP/Socket.IO reales. Reloj/permutaciones legales controlados. Layout/font-loading/zoom CSS reales del navegador automatizado; no dispositivo físico, revisión humana, zoom nativo o nuevo vencimiento real de15s.

## G — medidas y solución

La medida inicial muestra **tabla204/columnas102–102**, aunque CSS declara52/48. th tiene padding3+3, td2+2 y bordes laterales0. La cabecera absoluta y el layout fijo requieren medir columnas efectivas: fijar solo el ancho de th/td del cuerpo tampoco las gobierna. Se conserva ese intento fallido, sin rebajar las aserciones. La solución usa **colgroup nativo** y elimina de las celdas completas los porcentajes heredados. Las tres filas comparten las dos columnas.

El hook local en GameCard mide seis copias efímeras con tipografía/símbolo/espacio/padding/bordes actuales. Con necesidades compatibles, la primera columna reserva el máximo de los tres atributos comunes; la segunda recibe el resto. Así no depende de qué carta se juega, llega a Mesa, se selecciona o se revisa. Para necesidades íntegras incompatibles solo existe reparto proporcional con wrapping íntegro, sin ocultar contenido. No añade un mínimo, regla editorial, fuente o dato de servidor. **No fue necesario ese reparto excepcional en los tres corpus aprobados comprobados.**

CSS `table-layout:auto` fue estudiado primero: cabe en las muestras, pero Solar/Dato varía100,6875–108,390625 por carta aunque todas son compatibles. [Estudio auxiliar](auto-corpus-layout-only.json). No se adoptó esa variación ni un catálogo de excepciones. La política cliente nunca recibe58 cartas/manos ajenas para decidir máximos; el estudio completo ocurre **fuera de Game como probeta de prueba**, separado de los recorridos de producto.

Resultados nativos Windows1280, carta230×321/imagen230×172,5, misma tipografía/padding; ambos modos:

| Paquete | Atributo/dato efectivos | Tabla/gaps | Uniformidad |
|---|---:|---:|---|
| Genérica |85,6875 /118,3125|95 /+5,75,+5,75|Tres cartas/tres filas;58 valores del corpus sin excepción.|
| Solar |83,703125 /120,296875|95 /+5,75,+5,75|Igual, incluidos datos/unidades largos.|
| Criaturas |94,28125 /109,71875|95 /+5,75,+5,75|Igual, incluida Resistencia.|
| Fixture100W |98,5 /105,5|95 /+5,75,+5,75|Tres filas/cartas; nombres y Magnitud1/2/3 intactos.|

[Medidas antes/después con todas las cajas th/td, contenido útil, anchura íntegra, padding/bordes/rangos y fuentes CDP](G-comparacion.json). [Diez resultados G](final-G/) conservan además corpus58, medidas del control habilitado, fuentes y confirmación de clic/jugada única. En las probetas de los corpus la altura máxima de fila32 confirma que tampoco se oculta un salto de línea de los datos al afirmar compatibilidad.

**Regresión G demostrada:** nueva prueba controlled-monospace/PLAY_VALUE falla sobre el build base, con la misma fixture100W y fuente local de ensayo. Magnitud1 necesita104,421875 frente96 útiles; columnas102/102, tabla127,34375. Después, en ambos modos, columna110,421875/93,578125, tabla86 y gaps+10,25/+10,25. Fuente Courier New de ensayo (Linux puede resolver DejaVuSansMono), no modificación de la tipografía de producto. El símbolo SVG de la primera fila y los otros glifos se miden por separado en la anchura íntegra de cada celda. **No se reduce padding horizontal o vertical** ni se aplica4,4: permanecen6/4,9 históricos donde corresponda.

Las ocho comparativas `comparacion/before-*.png`/`after-*.png` son escenas equivalentes: cuatro paquetes/dos modos,1280×844/zoom100/DPR1, misma permutación/control de tiempo. Se revisaron directamente fixture/Dato, Solar/Dato y control monospace. En las ocho escenas nativas, que ya cabían en Windows, los PNG son **idénticos por SHA**: las alineaciones izquierda/derecha y contenido visible permanecen, aunque las columnas sin borde vertical ahora tengan otro reparto. No se atribuye a esas imágenes la reproducción del fallo Linux. La reproducción controlada y sus medidas fallidas/pasadas son evidencia distinta.

Ejemplos: [fixture antes](comparacion/before-portada-DISPLAY_VALUE.png) / [después](comparacion/after-portada-DISPLAY_VALUE.png); [Solar antes](comparacion/before-sistema-solar-DISPLAY_VALUE.png) / [después](comparacion/after-sistema-solar-DISPLAY_VALUE.png). [Control monospace después de clic/jugada, durante revisión](final-G/controlled-monospace-DISPLAY_VALUE.png): ilustra interacción, no se presenta como estado equivalente al inicio.

## T — causa, consulta al autor y reparación autorizada

[Traza anterior con DejaVu sustituida](controlled-dejavu-T-recalculations.json), [traza final sobre la compilación comprobada](final-T-T-recalculations.json). Fuente de icono/atributos DejaVuSans local de ensayo; título tardío DejaVuSansMono recuperado del trace suministrado, SHA original **c805f9436dbc268644c1d9584f01a601a653e028e08fd74b9b949f6cf8304d88**. No se instala ni distribuye como recurso de producto. Los glifos efectivos se registran con CDP, sin inferirlos de una familia CSS. Es **Windows con fuentes sustituidas**, no Linux.

| CSSzoom | Icono calculado CSS | Caja visual / DPR1 | Banda antes | Banda después |
|---|---:|---:|---:|---:|
|1 inicial|21|21|21|21|
|1,25|20,8|26|26|26|
|2|20,5|41|41|41|
|1 retorno|21|21|**20,5**|**21**|

La línea de la probeta al máximo es menor que el icono (19 CSS en200%,38 visuales). La aplicación escribe correctamente20,5 CSS mientras el zoom es2. Al retornar, el icono natural vuelve a21 pero el **único borde observado sigue204×20,5 CSS**; no cambia su content box, por tanto no hay callback que reemplace la altura antigua. La referencia independiente crea su probeta y lee el icono a la escala actual:21. No es falsa tolerancia ni doble escala; las propiedades de variación son normales y la fuente está cargada. La tabla contenida no acredita la banda.

Se explicó la causa/propuesta y se recibió la respuesta expresa **«Autorizar la reparación propuesta»** antes de modificar T. Reparación mínima: añadir el icono natural al **mismo ResizeObserver**. Al volver a1, cambia su altura natural y se registra callback de aplicación; escribe21 y converge. Sin resize artificial, nuevo temporizador, cambio de cálculo, mínimo, referencia o tolerancia. Las trazas registran motivos/timestamps relativos, probeta/estilos/cajas/client/offset, icono/banda/carta, escala/DPR, altura escrita/carga y fuentes. La primera traza registra lecturas calculadas; la final amplía cajas visuales de probeta y unidades. No es evidencia de zoom nativo.

## Puertas ejecutadas y fallos conservados

| Puerta | Resultado nuevo |
|---|---|
| Check final |**538/538**,43 archivos, tipos/lint/build, **71 módulos** sin imports prohibidos/ciclos. [Registro](ejecuciones/check-final.txt).|
| Cinco diagnósticos Windows |**5/5**,33,9s. [Registro](ejecuciones/windows-five.txt)/[selección exacta](ejecuciones/windows-five.json).|
| Focal ampliada Windows |**29/29**,180,334s, un trabajador/cero reintentos/omitidos/flaky. **19 conservados+10 G**. [Registro](ejecuciones/windows-final29.txt)/[casos exactos](ejecuciones/windows-final29.json).|
| T final con DejaVu sustituida |**1/1**,5,9s, diagnóstico adicional con recálculos. [Registro](ejecuciones/T-final.txt).|
| Capturas G finales comparables |Un montaje, ocho escenas;15,6s. [Registro](ejecuciones/continuacion-diagnostico-after-native.txt). No otra batería de aceptación.|

Antes del cierre, [la regresión definitiva falla en el build base](ejecuciones/continuacion-G-regression-base.txt). El primer intento de anchos solo en th/td sigue fallando2/3 focales; [fallo](ejecuciones/continuacion-focal-edicion-first-failed.txt). Tras introducir colgroup pasan3/3 focales (dos modos y T), [registro](ejecuciones/continuacion-focal-edicion.txt), y posteriormente las puertas finales anteriores. No se aumentan timeouts o tolerancias, ni se retiran aserciones para pasar.

Cada nuevo G espera el turno **habilitado**, desplaza el control al viewport, comprueba receptor, recibe `click()` normal con **isTrusted=true** y verifica un único avance/jugada. Los sondeos históricos con botón deshabilitado no se reutilizan como I. D/foco, plazos y las expectativas anteriores permanecen. Los19 conservados cubren además recuperación/T04/INC-01, ambos modos, null/recursos/errores, arrastre, diálogo bajo timeout/revisión,360/390 y frontera útil1367/1368/quinta.

## Reproducción y traspaso Linux

Fuentes y todas las aserciones están en el **HEAD documental final devuelto al autor**, que contiene f5c2c78 sin cambio de código. Check final: `npm run check`. Chrome compilado:

```powershell
npm run test:browser -- --workers=1 --retries=0 tests/browser/cardFace.spec.ts tests/browser/cardTitleFit.spec.ts tests/browser/cardColumns.spec.ts tests/browser/timedGame.spec.ts tests/browser/cancelGame.spec.ts tests/browser/resultNotice.spec.ts tests/browser/format2Presentation.spec.ts --grep 'B17 criaturas-magicas.*cara completa|B13/T04 A cancelada.*B ordinary|INC-01 expired A.*B ordinary|B08 T1 1280|ADENDA B17|B17 D:|B17 consulta abierta|B17 compacta|B17 fallo/pendiente|B15 frontera' --reporter=list,json --trace=retain-on-failure --output=playwright-report/b17-adenda/acceptance/continuacion-20261017/traces-final29
```

**Linux no ejecutado localmente:** motor Docker no disponible. El autor traslada al responsable GitHub fuente/HEAD. Primero filtro de cinco exactos:

```text
B17 criaturas-magicas.*cara completa|B13/T04 A cancelada.*B ordinary|INC-01 expired A.*B ordinary|B08 T1 1280
```

Solo si pasan, usar el filtro ampliado del comando anterior: ahora enumera **29** con el archivo nuevo, incluyendo íntegra la selección anterior de19. El workflow diagnóstico existente admite `chrome_diagnostic`, fija un trabajador y conserva `acceptance/`; no usar filtro vacío/CI completa todavía. Recoger JSON/trazas/medidas/fuentes efectivas y comparar fixture Magnitud, Resistencia/Solar, ambos modos, uniformidad y retorno de zoom. No trasladar Windows al resultado Linux ni reutilizar los5/5 y17/19 anteriores.

Material bruto nuevo permanece en `playwright-report/b17-adenda/acceptance/continuacion-20261017/`, incluidas trazas fallidas de base; [montaje diagnóstico conservado como documento](diagnostico-montaje.txt). Las trazas con cookies de ensayo permanecen ignoradas, no se añaden a Git. Solo después de puertas focales correctas en Linux corresponde CI completa del HEAD definitivo. No se ordenó publicación, merge, GHCR o VPS desde este encargo.

Para revisión humana: con runtime/compilación vigente del README e instancia propia en puerto libre, crear dos sesiones independientes y seleccionar las tres versiones. Revisar1-58/Dato, Resistencia/datos Solar en indicadora/mano/Mesa/Detalles, normal/compacta, D/foco/carruseles/quinta/resize, recuperación y otra sala. El fixture100W y sustituciones de fuente son solo pruebas; no se publican. Zoom nativo125/200 y revisión visual/física quedan pendientes. C09–C10 permanecen parciales. Responsabilidades revisadas: solo cliente/medición DOM autorizado, sin reglas, contratos o información oculta nuevos; TFM/Diseño/ASSETS/PRODUCTO no se editaron.
