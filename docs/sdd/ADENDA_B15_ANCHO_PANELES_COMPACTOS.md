# Adenda B15 — Anchura de los dos paneles superiores compactos

**Actualización21/10/2026:** implementada y comprobada técnicamente en Windows; [cierre §6](#6-cierre-técnico--21102026) y [capturas/medidas nuevas](evidencias/B15-paneles-20261021/README.md). La preparación y sus condiciones siguientes se conservan como antecedente. No aprobación humana, CI global o despliegue.

**21/10/2026 · Criterio acordado por el autor; implementación y pruebas pendientes.** Ajuste de la [presentación compacta B15 §§6.1–6.3](BLOQUE_15_FORMATO_2_Y_PRESENTACION.md#6-presentación-normal-y-compacta), con apariencias y componentes vigentes. Sin nuevo bloque. [Encargo para Implementación](PROMPT_IMPLEMENTACION_ADENDA_PANELES_COMPACTOS.md).

## 1. Base y continuidad

Fuente leída: carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, rama `main`, HEAD `6359ceb2b52213f91e3de97ad3f66bf8d28f8570`, árbol inicialmente limpio. Consultados [AGENTS](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), GameScreen, estilos de producto y escenas de presentación existentes.

El autor sitúa la captura en un VPS anterior: **no acredita reproducción en este HEAD**. Implementación comprobará primero el comportamiento real vigente y guardará medidas/captura previas en escenas equivalentes. No generar una reproducción alterando CSS o contenido. Si el criterio ya se cumple, documentarlo y evitar cambios redundantes.

GitHub está reparando B11 en paralelo según el autor. Esta lectura no acredita que la reparación haya terminado o esté incorporada. Antes de escribir, compilar o ejecutar ensayos, verificar la fuente y la cesión de la carpeta mediante la evidencia disponible o el autor. Si la reparación sigue en curso, no escribir simultáneamente: esperar su entrega. Trabajar sobre la fuente que la conserve, sin fijar6359ceb como retorno, restaurar archivos, cambiar ramas/checkouts o enviar mensajes a otros hilos. Registrar el HEAD efectivo y cualquier cambio posterior.

## 2. Contrato de anchura

Aplicar solo con `optimizeForMobile=true` y ancho útil real de `.game-composition` **menor de1368 CSS px**, con el mecanismo actual de GameScreen. Sin otro punto de ruptura, reducción del contenedor de composición o cambio de su medida.

- Paneles afectados: `.game-compact .game-people` —puntuaciones/identidades— y `.game-compact .game-initial-state` —resumen de turno—.
- Sea C la anchura exterior efectiva de una carta compacta, G la separación entre cartas compactas y A el espacio horizontal disponible para el panel, según sus márgenes actuales. Anchura del panel: **min(A, 2×C+G)**. La cota se aplica a su caja exterior, incluidos padding y borde; no sumarlos otra vez.
- En el CSS leído: C=220px y G=10px, por tanto máximo450px. Son valores de fuente, **no medidas ejecutadas**. No usar cartas normales de230px ni sumar padding lateral del carrusel. Reutilizar las mismas magnitudes compactas al expresar la cota; la técnica CSS compatible es autónoma, sin modificar sus valores.
- Conservar posición/alineación actuales de cada panel. No centrarlos, ponerlos en paralelo, cambiar márgenes de alineación o redistribuir su contenido. Se permite el ajuste natural de líneas debido al espacio disponible, sin cambiar texto o tipografía.
- El botón `.summary-indicator` permanece en su celda y dentro del resumen, accesible y sin desbordarlo. No sustituirlo ni darle otro ancho independiente para aparentar que el panel cumple.
- Mesa y mano mantienen el ancho actual y sus desplazamientos laterales independientes. No aplicar el límite a todos los `.game-panel`, al layout o a los carruseles. No esconder desbordamiento del documento para superar la comprobación ni recortar focos/contenido.

## 3. Conservación y responsabilidades

Orden intacto: puntuaciones/identidades → resumen → Mesa → mano. Conservar normal adaptada con opción desactivada y equivalencia activada/desactivada desde1368 útiles; imágenes, cartas, textos, nombres y consultas completas; tipografía, controles, foco y gestos; permisos, plazos, selección parcial/envío, apariencias y analítica. Observador conserva su vista sin mano inventada. Baraja de Inteligencia Artificial fuera del alcance, sin nuevos paquetes o datos.

Responsabilidad exclusiva de presentación cliente, previsiblemente `src/style.css`. GameScreen y apariencia son referencias para revisar el alcance: no se autoriza cambiar el algoritmo de activación o las paletas. Aplicación, dominio, contratos, transportes y almacenamiento no necesitan cambios. Adaptar solo escenas/aserciones de anchura realmente afectadas, conservando las protecciones B11 y evidencias históricas.

**Incompatibilidad:** si la cota impide conservar contenido o controles utilizables, registrar caso, medidas y captura y presentarlo al autor antes de cambiar diseño, fuente, contenido o límite. No resolverlo con elipsis, ocultación, menor letra o nuevas disposiciones.

## 4. Aceptación y comprobaciones futuras

| Caso | Resultado exigido |
|---|---|
| Ancho intermedio que reproduzca el estiramiento | Medir ancho útil, C/G, A, caja de ambos paneles y botón. Después ambos paneles cumplen min(A,2C+G), conservando alineación horizontal previa; Mesa/mano siguen utilizando su espacio. |
| Pantalla estrecha | Paneles se ajustan al espacio disponible sin desplazamiento horizontal del documento, solapamiento o pérdida de controles/contenido. Se mantienen carruseles laterales propios. |
| Frontera1367/1368 útiles y optimización desactivada | Compacta limitada por debajo; normal sin este límite desde1368. Desde el umbral, opciones activada/desactivada equivalentes en estado/ancho iguales. Normal adaptada con opción desactivada tampoco cambia en el intermedio. |
| Modos1–58/Dato | Ambos conservan datos completos, nombres y dimensiones de cartas. Indicadora abre su consulta completa; cierre/Escape devuelve foco, sin jugada ni reinicio del plazo. Identidades y puntuaciones siguen consultables. |
| Interacción/estado representativos | Revisar abridor con ALTO/BAJO y estado de revisión con contenido real; cinco identidades/nombres extensos de escenas vigentes, invitado y observador cuando proceda. Ningún control de resumen queda tapado. Sin matriz cartesiana de todos los roles/barajas/temas. |

Reutilizar escenas de `tests/browser/format2Presentation.spec.ts`, especialmente su montaje y medida de `.game-composition`; no editar la reparación B11 de `tests/browser/tableLayout.spec.ts` para satisfacer esta adenda. Seleccionar un ancho intermedio representativo —p.ej.viewport1280px si reproduce en la fuente final— y uno estrecho —p.ej.390px—; registrar ancho útil real, no inferirlo del viewport. Cubrir ambos modos en compacta y controles normales representativos; usar Claro y una muestra Oscuro para comprobar conservación de apariencia, sin multiplicar toda la matriz.

Guardar comparación antes/después en mismos tamaños, escala, fuente efectiva, modo, contenido y fase. Capturas y medidas: cajas/x/anchos, C/G, padding/bordes, ancho de documento, ancho útil/layout, tamaño de cartas y acceso al botón. Tolerancia geométrica de redondeo≤1CSSpx, no margen para esconder un exceso. Mantener el borde medido de composición independiente de las dos nuevas cotas, sin oscilación del layout.

Durante ajustes, comprobaciones estáticas y solo casos focales invalidados; al cierre local `npm run check` y navegador pertinente sobre la compilación vigente, sin repetir toda Chrome ni ensayos de analítica/barajas. Puede añadirse un caso focal «B15 adenda paneles compactos» en el arnés existente y ejecutarlo con Playwright filtrado. La CI completa final pertenece al encargo posterior de publicación.

## 5. Cierre pendiente

Solo lectura y documentación desde SDD: sin producto modificado, pruebas de producto, publicación, despliegue, activación, servidores o fuentes generales TFM. Implementación registrará fuente final compatible con reparación B11, archivos propios, capturas/medidas antes/después, resultados reales y límites. Ningún criterio se declara superado por redactarlo. Conservar históricos y detenerse al devolver el resultado al autor.

## 6. Cierre técnico — 21/10/2026

**Fuente y cesión comprobadas antes de escribir/compilar/probar:** `main/aa336d3add598e4c59789ff053292295410da8dc`, que contiene la reparación B11 `f3bf91558dfa8cfaa8a1f9710e582c94e567f9c4` y su cierre posterior. La entrega `APP/verificacion-b11-20261021/cierre-b11.md`, «Git exacto y continuación», indica continuar sobre esta main local sin reaplicar la reparación. Se conservan sus cuatro commits y `tests/browser/tableLayout.spec.ts` idéntico. El proceso y ambos documentos preparados de esta adenda estaban pendientes: no se incorporó ni sobrescribió trabajo ajeno. HEAD/rama permanecen iguales, sin commits nuevos o checkouts.

**Reproducción real previa:** la captura antigua del VPS no se usó como evidencia vigente. Compilación propia de aa336d3 sin cambiar CSS: en viewport1280, composición útil1233 y ambos paneles1233; las cartas compactas exteriores miden220 y la separación10, por lo que no cumplía la cota450. En viewport390 hay358 útiles y ambos paneles358. Se registraron apertura y revisión con cinco jugadores, ambos modos y muestra Oscuro; normal/desactivado y frontera con medidas útiles reales.

**Cambio de producto exclusivo en `src/style.css`:** variables locales compactas220/10 reutilizadas en las reglas existentes de cartas/separación y un `max-width` para `.game-compact .game-people` y `.game-compact .game-initial-state`. `width:100%` y `box-sizing:border-box` conservados dan `min(A,2C+G)` exterior. No se modifica ninguna dimensión efectiva de carta, padding/borde, alineación, distribución interna o umbral. GameScreen, apariencias, contratos, juego, barajas y analítica no cambian.

| Escena medida, ambos modos compactos | Antes puntuaciones/resumen | Después puntuaciones/resumen | Composición/Mesa/mano después |
|---|---|---|---|
| viewport1280,1233 útiles |1233 /1233 |450 /450 |1233 /1233 /1233 |
| viewport390,358 útiles |358 /358 |358 /358 |358 /358 /358 |
|1367 útiles, optimización activada |1367 /1367 |450 /450 |1367 /1367 /1367 |
|1368 útiles, normal on/off |264 /264 |264 /264 |1368 /1092 /816 |
| viewport1280, normal desactivado |264 /240 |264 /240 |1233 /957 /705 |

Las filas de frontera/normal son controles representativos en PLAY_VALUE; las comparaciones de apertura/revisión390/1280 cubren PLAY_VALUE y DISPLAY_VALUE. En las18 comparaciones conservadas, x de los paneles permanece igual; x/ancho de composición, Mesa y mano, ancho/alto de carta y familia de fuente se conservan. En compacta, padding8/borde1 incluidos en la caja:450 exteriores→432 de contenido; en estrecho358→340. Sin desbordamiento del documento o recorte nuevo; el botón de indicadora permanece en su celda/dentro del resumen. El ajuste natural de líneas en revisión conserva todos los textos. Scroll vertical legítimo y carruseles laterales independientes permanecen.

**Pruebas propias añadidas solo en `tests/browser/format2Presentation.spec.ts`:** cuatro escenas390/1280×modos y una de normal/frontera; medición/captura, cinco nombres válidos hasta16 caracteres y sufijos, consulta de identidad e indicadora con Enter/Escape/retorno de foco, cinco jugadas reales hasta revisión, quinta consultable con teclado, scroll de Mesa sin mover la mano, muestra Oscuro y ausencia de acciones/plazo renovado al consultar. Se conservan íntegros los casos y aserciones anteriores, incluida la reparación B11.

### Puertas nuevas y fallos del montaje

- `npm run build` previo: correcto; solo para medir la versión vigente sin ajuste.
- Montaje inicial:1/5 (normal/frontera correcto); los cuatro casos nuevos usaban nombres fabricados de más de16 caracteres y el servidor los rechazó. Se corrigieron los nombres del montaje al límite vigente, sin cambiar validadores/reglas/paquetes.
- Segundo intento de esos cuatro: falló la preparación del scroll. End no proporcionaba el desplazamiento lateral esperado, y se exigía desplazamiento positivo a1280 aunque las cinco cartas cabían en la Mesa. Se usan ArrowRight como en la escena existente y se exige scroll positivo solo si hay overflow real; en estrecho se comprueba independencia y quinta. Sin forzar eventos/clics, ampliar plazos o retirar aserciones previas.
- Medición previa terminada:4/4 correctos en30,3s, más el control normal/frontera ya correcto. Acreditan comportamiento previo medido, no que la cota futura estuviera satisfecha.
- **`npm run check` final:**614/614,58 archivos,103 módulos; tipos/lint/build/imports/ciclos correctos,48,88s Vitest, Node24.19.0 fijado y `VITEST_MAX_WORKERS=2`.
- **Navegador final sobre esa compilación:**9/9 en1,1min, un trabajador/cero reintentos/traza. Cinco casos nuevos más normal genérica PLAY_VALUE1920, normal Solar DISPLAY_VALUE1920, frontera con parcial/foco/quinta y observador390 DISPLAY_VALUE. No batería completa ni reensayo de la focal B11 ya correcta.

Comando exacto de navegador (con Node/npx CLI fijados):

```text
npx --no-install playwright test tests/browser/format2Presentation.spec.ts --grep "B15 adenda paneles compactos|B15 frontera medida|B15 observador, cinco jugadores e identidades estables 390 DISPLAY_VALUE|B15 generica PLAY_VALUE 1920|B15 sistema-solar DISPLAY_VALUE 1920" --workers=1 --retries=0 --trace on --output playwright-report/b15-paneles-20261021/after-traces
```

[Evidencia versionable y revisión](evidencias/B15-paneles-20261021/README.md):18 comparaciones, diez capturas comparables, logs de fallos y resultados finales, fuente/huellas propias. Trazas y medidas completas en `playwright-report/b15-paneles-20261021/`. Windows x64, Node24.19.0, Chrome155, escala visual1/DPR1 y fuentes CSS efectivas registradas; no cambio de zoom. Revisión visual por el agente de PC/móvil emulado y Oscuro/revisión, no aprobación del autor ni dispositivos físicos. HTTP/Socket.IO y acciones reales en instancias propias aisladas; reloj y permutación controlados, sin acreditar segundos reales o caducidad física. Recogida de ensayo no disponible; no prueba estadística nueva o activación real.

**Estado al entregar:** cambios propios en CSS/prueba/esta adenda y evidencia nueva, sin commits. Proceso y prompt previos intactos; B11/servidor/contratos/paquetes/dependencias sin diff. Sin fuentes TFM/Diseño editadas, baraja IA, publicación, activación, despliegue, servidores del autor utilizados/detenidos o mensajes a otros hilos. CI conjunta/publicación y revisión humana quedan en su encargo posterior; no los acredita9/9 local. Tras entregar, Implementación se detiene.
