# B11 — Ajuste de mesa PC 02

**Estado:** acordado, implementado y **verificado técnicamente el 06/10/2026**, sobre código `9b334b78b5304a607bdf693d990a0535dfb39de7`. B11-01–08 comprobados según el cierre inferior. **Aprobación visual humana del autor pendiente**; el encuadre automatizado de referencia no acredita su pantalla física ni otras resoluciones.
**Base comprobada:** `feat/b10-redistribucion-mesa`, HEAD `09f4e5bff86a499cbcb66df29beafc27275c55b8`, B10 presente. Antes de esta preparación solo `docs/diseno/` estaba sin registrar; conservarlo. No asumir main/publicación.
**Referencias:** [Diseño P02-01–08](../diseno/AJUSTE_MESA_PC_02.md), [B10 y cierre](BLOQUE_10_REDISTRIBUCION_MESA.md), [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), aplicación §§7–12. Las capturas de Diseño son antecedentes, no resultados aprobados.

## Objetivo y límites

En un área de contenido de referencia de **1800×1600 píxeles CSS**, al **100 %** de zoom, consultar simultáneamente mesa pública, indicadora, tres cartas completas de mano y sus acciones, atributo/dirección, jugador activo y temporizador, sin desplazamiento para jugar. Conservar dos filas: jugadores/mesa arriba; indicadora/mano/turno abajo. Carta común de **230×321 píxeles CSS**, con Detalles dentro y «Jugar carta» fuera y debajo.

**Resolución del autor posterior a Diseño:** estas dimensiones sustituyen para esta iteración la pantalla inicial de 1920×1080 y la conservación del tamaño exterior de Carta 34. El área elegida es una referencia de diseño, no una medición del navegador real. Sus 1600 px de alto superan los 1080 px físicos anteriores: el encuadre aquí no acredita encuadre en aquella pantalla ni cobertura de la mayoría de equipos. Resoluciones más bajas se acordarán después de implementar y revisar esta configuración.

Incluye aprovechar ancho, compactar cabecera/espacios/jugadores y los cambios internos concretos de Diseño. Fuera: adaptación nueva a otras resoluciones, rediseño móvil/espera/resultados, líder provisional, animaciones, contenido temático y ampliación del diálogo. No cambiar reglas, privacidad, permisos, contratos, plazos, selección, recuperación ni revisión.

## Presupuesto de espacio: referencia acordada y comprobación real

Las medidas acordadas son objetivos en píxeles CSS. Registrar el viewport efectivo de cada comprobación, zoom, navegador y, en una prueba física, pantalla/escala del sistema/barras; no deducir el área útil de la resolución de pantalla ni modificar zoom o barras para aparentar encuadre.

| Dato | Estado de esta preparación |
| --- | --- |
| Área de referencia `innerWidth × innerHeight` | **1800×1600 CSS px**, elegida por el autor; no medida físicamente. |
| Zoom | **100 %**. |
| Ancho/alto exterior de carta (`Wref`, `Href`) | **230×321 CSS px**, incluidos padding, borde y Detalles; excluidos autores y acción exterior. |
| Navegador real, pantalla, escala, barras y `devicePixelRatio` | Se registrarán con la evidencia de implementación; no condicionan las dimensiones de referencia ya aprobadas. |

Aplicar `Wref × Href` a indicadora, cartas públicas y mano, sin estirar una mano de una/dos cartas. La proporción aproximada 63:88 propuesta por el autor se concreta en estas dimensiones digitales; no exige unidades físicas en CSS ni acredita un formato de impresión. Carta 34 sigue siendo antecedente visual, no una medida pendiente ni una obligación de reproducir su reparto. Registrar las dimensiones anteriores y posteriores en escenarios de prueba, sin cambiar JSON/partida de producción.

**Cálculo de referencia, no evidencia de renderizado:** tres cartas de mano requieren 690 px sin separaciones; cinco cartas públicas, 1150 px. Con separaciones de 12 px e interiores de panel de 12 px por lado más bordes de 1 px, corresponden 740 px de ancho para la mano y 1224 px para Mesa. Un ejemplo de distribución con jugadores/indicadora de 256 px, turno de 240 px, separaciones de 12 px y márgenes de página de 16 px necesita 1524 px arriba y 1292 px abajo, frente a los 1800 disponibles. Las dos bandas de cartas suman 642 px de alto; quedan 958 px para cabecera, encabezados, autores, acciones, leyenda, separaciones y márgenes, siempre que jugadores y turno no excedan sus respectivas bandas. Son cifras de planificación: implementación puede redistribuir esos espacios manteniendo tamaño de carta y encuadre; debe medir también el contenido interior y la altura efectiva de ambos paneles.

**Antecedente cuantificado, no presupuesto nuevo:** cierre B10/medición automatizada de apertura a 1536×1024: shell máximo 1280; panel mano 625,45 px; inicio mano 765,41 px; altura página 1492 px. Sus tres cartas de base requieren al menos `3×210 + 2×12 + 8 + 38 = 700 px` (cartas, gaps, padding de fila/panel y bordes), déficit ≥74,55 px en la columna, sin contar reservas de scrollbar. Esa captura usa otro escenario y no fija Carta 34 ni el área útil del autor.

Comprobar con medidas reales el siguiente balance, sin duplicar acciones al sumar alturas:

- **Ancho inferior:** columna indicadora ≥ Wref + interiores/bordes; columna mano ≥ 3×Wref + 2 separaciones + interiores/bordes/reservas; turno con ancho suficiente para datos/botones. Añadir separaciones de columnas y márgenes de página.
- **Ancho superior:** zona Mesa debe admitir hasta cinco cartas de Wref con separaciones e interiores. Conservar orden y no estirar cartas para llenar sobrante.
- **Alto total:** cabecera/avisos + `max(jugadores, Href + autor/rótulo/interiores de Mesa)` + separación + `max(indicadora con encabezado, mano con encabezado + Href + separación + acción exterior, turno)` + leyenda + márgenes. Medir también que indicadora/mano comienzan a la misma altura.
- **Déficit:** `max(0, ancho necesario − innerWidth)` y `max(0, alto necesario − innerHeight)`, acompañados de las cajas de los elementos que quedan fuera. Medir borde derecho/inferior real; no declarar éxito solo porque scrollHeight coincida aproximadamente.

Retirar/ampliar el límite de 1280 **solo en mesa**; compactar exteriores/cabecera antes de tocar letra de valores. Reservar desde mesa vacía la banda de cartas/autores/Mesa, evitando saltos de mano al añadir jugadas.

Si, agotados esos ajustes autorizados, Wref/Href impiden el encuadre o su contenido no cabe: entregar déficit medido, desglose y **alternativa mínima** con sus dimensiones/ahorro y efecto sobre legibilidad; consultar al autor antes de sustituir la referencia o reducir letras/imágenes fuera de lo aprobado. El cálculo anterior no acredita por sí solo viabilidad del renderizado. Revisión, avisos extensos, errores y textos excepcionales pueden crecer/desplazarse: documentarlos sin ocultar ni recortar.

## Presentación y comportamiento implementables

| Zona | Cambio aprobado y condición |
| --- | --- |
| Cabecera | Compactar marca/título repetidos y espacios; conservar baraja/versión/ronda/mazo y fase. Sin trasladar contadores al turno. Mantener título semántico y foco de entrada. |
| Jugadores | Nombre/puntos en fila compacta, sin numeración ni marca visible Anfitrión. Mantener `(tú)`, sufijos y orden. EASY → BF, HARD → BD, sin cápsulas; significado accesible completo. Abridor: sombreado suave y nombre accesible; activo: «Juega», distinto del sombreado. Observador aparte `Nombre (O)`, self/«Observando» conservados. Sin conexión/Automático no se suprimen. |
| Mesa pública | Cartas alineadas arriba; autores debajo, sin número. Rótulo «Mesa» al pie con asociación accesible; mensaje vacío compacto y altura estable. No resaltado de mejor carta. |
| Carta común | Wref/Href iguales en PC, también con mano de una/dos; orden de adquisición conservado. Nombre en negrita **16 px en vez de 18** en GameCard (indicadora/pública/mano), sin cambiar CardDetails; autor debajo **13 px**, menor que valores actuales de 14 px. Mantener tamaño de imagen/icono neutro y fallo. |
| Icono propio / fila activa | Icono en esquina superior derecha obtenido de **card.roundAttribute**, asociado al nombre accesible del atributo. Símbolos actuales por atributo. Fondo naranja y pequeña marca no textual de fila proceden de **round.activeAttributeId**; retirar «Activo» visible, conservar significado accesible. No confundir ambos datos. |
| Tabla | Atributo / Dato / J. Dato = displayValue + unidad literal; J = playValue, estrecha y a la derecha. Icono/nombre juntos, filas genéricas de una línea. Conservar letra de valores 14 px en la primera implementación; redistribuir columnas, no abreviar ni ocultar texto temático largo. |
| Detalles | Dentro de carta, ancho interior completo; aumentar altura con el espacio liberado de filas, **sin aumentar Href**. Mantener texto, diálogo y foco; sin información nueva ficticia ni cambiar el diálogo compartido por accidente. |
| Mano e indicadora | Conservar sus encabezados y «Atributo indicador: …»; alinear borde superior de cartas. Botón exterior del ancho de carta, debajo; banda de acciones alineada. Sin ayuda de deslizar innecesaria en el objetivo, mecanismo conservado para otros tamaños. |
| Turno | Estrecho a la derecha. «Juega:»/nombre, «Tiempo de turno:»/contador debajo de etiquetas; abridor, atributo y dirección. ALTO sobre BAJO, a ancho disponible, sin preselección. Conservar parcial privada, envío/error/recuperación y revisión; sin altura máxima que los corte. |
| Pie | «J: valor jugable · BF: bot fácil · BD: bot difícil · O: observador». Incluido en el encuadre y significado accesible en cada elemento. |

Los cambios de letra aquí fijados son locales; las demás medidas de espaciado las decide implementación dentro del presupuesto. Si los textos excepcionales exigen crecer, registrar el caso, sin invadir J ni perder unidades/datos.

### Acción de carta y accesibilidad

Artículo informativo con zona de consulta Detalles dentro y acción canónica de teclado **fuera**: botón nativo «Jugar carta»/«Carta seleccionada», nombre accesible por carta, estado seleccionado/deshabilitado actuales. La superficie jugable de información conserva la pulsación simple con ratón/táctil y llama a la misma elección **una sola vez**. No convertir todo el artículo en botón con Detalles anidado ni crear activaciones duplicadas por propagación; no cubrir Detalles con la superficie.

Detalles no selecciona/juega. Arrastrar/deslizar no juega. Mantener acceso mediante Enter/Espacio en el botón exterior y foco visible, con un recorrido de teclado inequívoco; implementación elige el montaje mínimo de la superficie sin añadir controles de confirmación.

Abridor: dirección→carta o carta→dirección; completar ambas envía. Dirección parcial aceptada privada/recuperable, carta parcial local; evento/recarga no envían ni reinician plazo. Turno posterior: carta envía inmediatamente. Reutilizar acciones, bloqueo, deduplicación y relojes existentes; timeout/bot/automático/revisión no cambian.

## Responsabilidades y coherencia

| Responsabilidad | Piezas/capa | Dependencias y comprobación |
| --- | --- | --- |
| Distribución, identidad/leyenda y datos visibles | Cliente `GameScreen.tsx`, estilos locales | Solo contratos/componentes; sin server. Geometría, datos por destinatario y captura revisada. |
| Carta, icono, tabla y acción exterior | Cliente `GameCard.tsx`/estilos | Props existentes y callback; no reglas ni datos extra. Pruebas de semántica/gestos/foco y tamaño. |
| Regresión y medidas | Pruebas/soportes de navegador existentes | Montajes controlados fuera de producto; no endpoints nuevos. |

Servidor, contratos, JSON, dominio, aplicación, puertos y composición no se modifican. Reutilizar RoundReview y acciones/reloj; conservar consulta del diálogo. Sin rediseño de móvil: preservar adaptación/acceso actuales; identificar efectos naturales del componente compartido y comprobar regresión, no dar otra resolución por diseñada.

**Diferencias aprobadas:** B10 preservaba fuentes/etiquetas/dimensionado y «Cartas jugadas»; P02 autoriza las modificaciones indicadas. La decisión posterior del autor fija 1800×1600 y 230×321, sustituyendo en B11 las referencias dimensionales anteriores de Diseño; comunicar esta resolución a Diseño. Aplicación §7 todavía menciona Anfitrión y «Bot · Fácil/Difícil»: esta vista pasa a omitir la marca visible y usar BF/BD, manteniendo autoridad/identidad. Comunicar ajuste descriptivo a Arquitectura. Conservar superficies de pulsación de carta y separación de Detalles; no cambiar la regla para facilitar el montaje. Fuentes generales y cierres históricos permanecen intactos.

## Aceptación y verificación prevista

- [x] **B11-01:** viewport efectivo de referencia 1800×1600 y cartas exteriores 230×321 CSS px registrados; balance real de ancho/alto cerrado con déficit cero para juego normal, o alternativa mínima aprobada antes de sustituir tamaño. Comparar también dimensiones de base sin atribuirlas al nuevo objetivo.
- [x] **B11-02:** apertura y turno posterior muestran simultáneamente todos los elementos/acciones y leyenda en el área de referencia al 100 %, sin desbordamiento vertical/horizontal de página ni scroll lateral necesario de mano. No basta scrollX/scrollY = 0: comprobar cajas visibles y scrollHeight/scrollWidth frente al viewport. Mesa admite hasta cinco cartas. Capturas de viewport completo, no recortes que oculten elementos fuera.
- [x] **B11-03:** composición, cartas comunes, autores/pie Mesa, BF/BD/abridor/activo/observador, tabla/Detalles y turno corresponden a P02-01–08; mano de una/dos no se estira. Tolerancia geométrica de alineación 2 px.
- [x] **B11-04:** ejemplo con roundAttribute = atributo2 y atributo activo = atributo1: icono propio triángulo, fila círculo activa. Otro fixture tiene displayValue distinto de playValue y unidad: Dato/J no se intercambian ni se deduplican. Sin alterar barajas oficiales.
- [x] **B11-05:** ambas aperturas, superficie/botón exterior/teclado, Detalles/foco y arrastre comprobados; un gesto genera una elección, sin doble envío. Fuera de turno/pendiente/desconectado/automático bloquean igual que antes.
- [x] **B11-06:** privacidad, recuperación, plazos/avisos y revisión cero/positiva preservados; fase final/desempate, bots y observador con manos 1–3 conservados. Estados excepcionales muestran mensajes completos y límites documentados.
- [x] **B11-07:** antes/después en igual área útil/zoom/estado, muestras de dos/cinco jugadores, nombres repetidos/largos, imágenes nulas/reales. Regresión funcional en móvil existente 390×844 y PC 1280×800; sin exigir encuadre nuevo en ellos ni cambiar espera/resultados.
- [x] **B11-08:** check/navegador pertinente pasan y evidencia nueva revisada; aprobación visual posterior del autor separada del cierre técnico.

Reutilizar escenarios de `tableLayout.spec.ts`, `initialGame.spec.ts`, `manualGame.spec.ts`, `timedGame.spec.ts` y `bots.spec.ts`. Las comparaciones B10 congelaban contenidos/estilos que **ahora cambian expresamente**: conservar esa referencia histórica y ajustar solo expectativas superadas, con comprobaciones B11 específicas; no regenerar el baseline antiguo ni retirar garantías funcionales.

Capturar base antes de editar y resultado con iguales condiciones de viewport 1800×1600, zoom y estado; conservar medidas de cartas, cabecera, filas/columnas, acciones, leyenda y altura total. Escenarios con reloj controlado sirven para comparación estable, no acreditan navegador físico ni permiten pausas/reglas nuevas en producción. La automatización con viewport 1800×1600 puede acreditar el encuadre geométrico de referencia; registrar separadamente el área real de cualquier prueba física. Una prueba en pantalla 1920×1080 no tendrá 1600 px útiles de alto y no equivale a esta referencia. El autor revisará después el resultado; registrar cualquier desplazamiento observado en su equipo como pendiente para adaptación posterior, sin cambiar por iniciativa propia las dimensiones acordadas.

Ejecutar en implementación `npm run check` y `npm run test:browser -- --workers=2` con archivos nuevos/afectados y regresiones pertinentes citadas; registrar selección exacta, entorno, revisión de código, resultados y fallos reparados. No repetir baterías completas por rutina ni atribuir las 408/64 de B10 a B11. C09–C10 siguen parciales, sin acreditar equilibrio/comprensión/dispositivos nuevos.

## Pendientes y cierre

Las dimensiones de referencia están cerradas por el autor: **1800×1600 de área útil de diseño y 230×321 de carta**. No quedan preguntas bloqueantes sobre medidas. Registrar navegador/viewport y cajas reales como parte de implementación, verificar el presupuesto calculado y consultar solo si aparece una incompatibilidad concreta. La cobertura de equipos y resoluciones inferiores no está acreditada por esta elección.

La preparación inicial consultó documentos/código/imágenes y redactó SDD, sin implementar ni ejecutar pruebas. La evidencia nueva de implementación se registra a continuación; no sustituye los cierres anteriores. La adaptación a otras resoluciones se acordará tras la revisión del autor. Sin edición de fuentes generales ni publicación.

## Cierre técnico — 06/10/2026

### Base, cambios y revisión de responsabilidades

Base efectiva comprobada: `feat/b10-redistribucion-mesa`, `09f4e5bff86a499cbcb66df29beafc27275c55b8`; se creó `feat/b11-ajuste-mesa-pc-02` desde esa entrega. Se conservaron la modificación local de proceso, especificación/prompt B11 y toda la entrega `docs/diseno/`. Preparación registrada separadamente en `55b015d`; implementación y pruebas en **`9b334b7`**. Diseño continúa sin registrar y sin modificar, para su conversación responsable.

Revisión del cambio respecto a la base:

- `src/GameScreen.tsx`: composición de mesa, roster PC compacto, BF/BD, observador (O), autores/Mesa al pie, encabezados alineados, datos del turno y leyenda. El sombreado identifica al abridor; no identifica a la mejor carta.
- `src/GameCard.tsx`: icono propio, tabla Dato/J, superficie de pulsación y botón nativo exterior. El desplazamiento del puntero superior a 6 px o su cancelación impide que ese gesto juegue; Detalles queda fuera de la superficie. Teclado usa la acción nativa exterior, sin artículo convertido en botón ni controles anidados. La rama de contenido del diálogo conserva su tabla y presentación anteriores.
- `src/style.css`: medidas PC desde 761 px, bandas/columnas y espaciamiento; se conserva el corte móvil 760/761. Los cambios compartidos de icono/tabla/acción son naturales al componente común; no hay encuadre móvil nuevo.
- `tests/browser/pcTable02.spec.ts`: seis casos B11, capturas/medidas y gestos reales de Chromium. `tests/support/configurationBrowserServer.ts` permite copiar la genérica desde APP a una instalación temporal y montar datos distintos validados, sin publicar fixtures. `tableLayout.spec.ts`, `initialGame.spec.ts` y `bots.spec.ts` ajustan solo expectativas visuales superadas por B11; conservan recorridos y aserciones funcionales.
- README y esta especificación/proceso registran el estado e instrucciones. No cambian servidor, contratos, dominio/aplicación, puertos, composición, `useGameActions`, reloj, RoundReview, espera/resultados ni JSON aprobados. No se añaden endpoints o controles de prueba al producto.

Control automático: **64 módulos sin imports prohibidos ni ciclos**. Revisión semántica del diff: React sigue consumiendo vistas seguras y delegando elección/envío en las acciones existentes; no calcula jugadas, resultados o plazos oficiales. BF/BD y (O) tienen significado accesible completo; ocultar marcas visibles de PC no altera autoridad/identidad. Genérica APP/ASSETS sigue formato 1/contenido 2/disponible; huellas iguales al cierre de activación: `baraja.json` `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed`, `cartas.json` `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c`.

### Entorno, ejecución y reparaciones

Windows, PowerShell, Node **24.13.0**, npm **11.6.2**, aplicación **0.1.0**, Playwright **1.63.0**, Chrome instalado (`channel: chrome`), Vitest **5.0.2**. Fecha 06/10/2026, Europe/Madrid (UTC+2). Referencia automatizada: `innerWidth=1800`, `innerHeight=1600`, DPR=1 y `visualViewport.scale=1`, sin zoom adicional. Son píxeles CSS del contexto de navegador, no un monitor físico de esa altura.

| Ejecución nueva | Resultado y evidencia local |
| --- | --- |
| `npm run build`, antes de editar producto | Correcto; `b11-base-build.log`. |
| `B11_CAPTURE_BASE=1` y `npx playwright test tests/browser/pcTable02.spec.ts --workers=2`, antes de editar | **2/2**, 10,5 s; `b11-base-browser.log`. Seis estados de base. Guardia SHA-256 de las tres fuentes normalizadas LF: `6098056a678e0f57d78fd8be76752df95ef57e3f3c514c4f19c4d5cdda033d1c`; impide atribuir una captura posterior a la base. Variable retirada después. |
| Primer caso focal de geometría | **0/2**: carta normal de 322 px en vez de 321. `b11-layout-focal.log`. Se corrigió únicamente margen de Detalles de 6 a 3 px; se mantuvieron letra 14, imagen/icono, contenido y altura mínima del botón. No hizo falta cambiar las dimensiones aprobadas. |
| `npx playwright test tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts --workers=2` | **16/16**, 32,2 s; `b11-layout-repair.log`. |
| Focal B11/B06 tras ampliar gestos | **17/18**, 49,4 s; `b11-interaction-focal.log`. Una expectativa nueva de (O) se había aplicado erróneamente al caso móvil: se restauró su aserción previa «Anfitrión · Observador»; la comprobación PC está en B11. Sin cambio de producto por este fallo. |
| `npx playwright test tests/browser/pcTable02.spec.ts -g 'access 390' --workers=1` | **1/1**, 3,9 s; `b11-touch-focal.log`. Deslizamiento CDP táctil no juega y tap posterior envía una vez. |
| **`npm run check` final** | **Correcto**, 408/408 en 38 archivos, tipos/lint/build/catálogo y arquitectura 64 módulos. 15:04:34–15:05:20, **45,99 s** totales (Vitest 13,20 s). `b11-final-check.log` y `b11-final-check-time.log`. |
| **Navegador compilado final**, selección exacta inferior | **70/70**, seis B11 +64 regresiones pertinentes; dos trabajadores. 15:06:03–15:12:03, **360,45 s** incluyendo build; Playwright 5,9 min. `b11-final-browser.log` y `b11-final-browser-time.log`. |

Selección exacta de la puerta final:

```powershell
npm run test:browser -- --workers=2 tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/bots.spec.ts
```

Son ejecuciones nuevas sobre el producto `9b334b7`, no resultados históricos B10. Se seleccionaron los recorridos afectados, conservando las demás baterías; no se repitió el navegador completo por rutina. `check` sí ejecuta toda la batería no visual existente, incluidas garantías de sala/identidad/ciclo/catálogo/configuración/activación.

El proceso normal en `http://127.0.0.1:3000` continuó vivo, con backend sin cambios. A las 15:08:13 se compararon los **bytes servidos** con el build actual, no solo el directorio de salida: JS `/assets/index-BHmFa1p7.js` SHA-256 `fcdfbe1c6335aaef30669e96016dbda7fdf6fba51905056e8aa70180cf141389`; CSS `/assets/index-xLAGeZmY.css` SHA-256 `db4a5811c5e17ef224074426a7be82252b3c7ca7e884842dc9438e5ed3a64994`; ambos idénticos a `dist`. `/api/decks` ofreció genérica formato 1/contenido 2. Registro `b11-served-evidence.log`. Los recorridos normales B06/B07/B09 de la puerta final usan servidor compilado y adaptadores/entropía normales, con selección explícita de genérica 2. Construcción/ejecución no acceden a ASSETS; su lectura de huellas fue solo una comprobación externa de integridad.

### Comparación equivalente y presupuesto medido

Base/resultados: misma genérica 2 copiada desde APP, permutación sustituida estable, humanos/nombres/acciones legales, turno 60 s/revisión 5 s, conexiones HTTP/Socket.IO reales con reloj controlado y área 1800×1600. Capturas completas del viewport y de página, más JSON de cajas, en [`playwright-report/b11/before`](../../playwright-report/b11/before/) y [`after`](../../playwright-report/b11/after/). Las imágenes/informes/logs están ignorados según el repositorio, no se versionan como producto.

| Estado (archivo de captura/JSON) | Inicio mano antes → después, px | Scroll lateral necesario mano antes → después, px | Mesa antes → después, px | Borde inferior leyenda después, px |
| --- | --- | --- | --- | --- |
| `2-opening` | 522,41 → 537,11 | 90 → **0** | 0 → **0** | 1049,11 |
| `2-subsequent` | 724,41 → 537,11 | 90 → **0** | 0 → **0** | 1049,11 |
| `2-review-two-cards` | 779,41 → 592,11 | 0 → **0** | 0 → **0** | 1104,11 |
| `5-opening` | 765,41 → 537,11 | 90 → **0** | 0 → **0** | 1049,11 |
| `5-subsequent` | 765,41 → 537,11 | 90 → **0** | 0 → **0** | 1049,11 |
| `5-review-two-cards` | 820,41 → 592,11 | 0 → **0** | 213 → **0** | 1205,55 |

En estos seis pares la mano pasa de ancho 625,45 a **1240 px**. Base: cartas de mano con tres cartas **210×457** (incluían acción interior); con dos, aproximadamente **276,22×402**; indicadora **227,81×377**; pública **215×396**. Después: indicadora/públicas/manos de 1–3 **230×321**, con acción exterior medida aparte. La muestra adicional `2-final-one-card` se alcanza por jugadas humanas legales hasta ronda final 19; carta 230×321, leyenda termina a 1145,11 px. Esa muestra adicional no tiene pareja anterior y no se presenta como comparación.

Medidas finales de apertura/turno posterior de referencia:

- Márgenes 16 px; cabecera x16/y16, **1768×28** (antes 37 px de alto). Grid y112,11; jugadores **264 px**, Mesa **1492 px**, gap12. Mesa mantiene alto **413 px** vacía/con jugadas; no baja la mano al añadirlas.
- Fila inferior y537,11: indicadora **264×423**, mano **1240×487**, turno **240×446** en apertura. Las cartas de indicadora y mano empiezan ambas a **y622,11**; diferencia real **0 px**, tolerancia 2 px.
- Cartas hasta x1023/bottom943,11 en la mano de tres; acciones nativas **230×48**, y951,11/bottom999,11. Mesa acepta cinco cartas de 230 px sin overflow lateral. Último borde derecho de panel **1784**, leyenda inferior **1049,11**; incluyendo margen inferior, contenido normal **1065,11 px** de alto. Déficit ancho/alto **0/0** respecto a 1800×1600.
- Incluso revisión con cinco cartas/ranking, el mayor borde inferior observado de los seis pares es leyenda **1205,55** (más 16 px de margen: 1221,55). Página medida **1800×1600**, por su altura mínima; se comprobaron también cajas/contenido, no se confundió esa altura con la ocupación efectiva.

Interior de carta genérica final: ancho útil **204 px**; nombre **16 px**/caja21; icono propio18/caja24; neutro SVG **85×76** dentro de caja204×80, imagen real conserva **78 px** de alto. Tabla **204×126**, valores **14 px**, filas genéricas **32 px**, columnas aproximadamente **110,17 /65,27 /28,56 px**. Detalles interior **204×58** (antes48); ninguna caja medida sale del artículo. Autor exterior **13 px**; unidades completas y J alineada a la derecha. El fixture `700 km` frente a J=`1` conserva ambos datos; su triángulo propio no se confunde con la fila de círculo activa.

Revisadas visualmente las doce imágenes de los seis pares, y las muestras posteriores de mano única, observador/nombres repetidos, datos distintos con imagen real y acceso 390/1280. Esto es inspección técnica de capturas por implementación, **no aprobación visual humana del autor**. El visor puede reducir su visualización; las medidas/archivos originales conservan 1800×1600.

**Conservación de evidencia B10:** durante el primer focal, el test existente todavía escribió capturas nuevas en su directorio `b10/after`. Se corrigió a `b11/b10-regression` para separar iteraciones. Se reconstituyó aquella galería auxiliar ejecutando la entrega original `09f4e5b` en un checkout temporal: **14/14**, 28,9 s, `b11-b10-evidence-recovery.log`; checkout retirado después. Son capturas reconstituidas el 06/10, no se afirman idénticas en bytes a las originales. Baseline B10 congelado, fuentes antiguas y cierres/resultados históricos nunca se regeneraron ni modificaron. Esta recuperación no cuenta como puerta B11 ni aprobación nueva B10.

### Resultado por criterio

| Criterio | Evidencia ejecutada y resultado |
| --- | --- |
| **B11-01** | Seis JSON equivalentes de base/resultado, cajas interiores/exteriores y balance anterior. 1800×1600/DPR1/scale1, 230×321, **déficit cero normal**; sin alternativa dimensional. |
| **B11-02** | Dos/cinco humanos en apertura, turno y revisión: paneles/acciones/leyenda dentro del viewport; mano/Mesa sin scroll necesario; cinco públicas completas. Capturas `*-viewport.png` y `*-full.png`, sin recortes. |
| **B11-03** | Inspección y pruebas de alineación ≤2 px, cartas 1/2/3, autores/Mesa, roster/sufijos, BF/BD accesible en regresión bots, abridor/Juega, observador (O), tabla/Detalles y turno vertical. |
| **B11-04** | Caso `card data and gestures`: `roundAttribute=atributo2`/triángulo, activo atributo1/círculo; Dato `700 km` y J `1`, también en diálogo original. Fixture validado separado; ningún JSON oficial alterado. |
| **B11-05** | Ambos órdenes, click superficie, botón exterior Enter/Space, Detalles/Escape/foco, arrastre ratón y swipe/tap CDP táctil. Conteo real de solicitudes: una jugada al completar, ninguna por consultar/arrastrar. Regresiones B06–B09 conservan bloqueos/reintentos/varias pestañas. |
| **B11-06** | `initialGame`, `manualGame`, `timedGame`, `bots` y check: privacidad/observador, recuperación/ack perdido, contexto antiguo, timers/automático, avisos/review0/5, final/desempate legal/manos variables/resultados. No se reemplazaron reglas ni contratos para facilitar presentación. |
| **B11-07** | Seis pares 1800×1600 y muestras extra de nombres largos/repetidos, imágenes nulas/reales/fallo (regresión B06), móvil390×844 y PC1280×800. Acceso/foco/datos íntegros con residual inferior documentado. |
| **B11-08** | Código revisado `9b334b7`, **check408/408**, arquitectura64 sin ciclos/imports, **70/70 navegador compilado** y capturas inspeccionadas. Verificación técnica cerrada; aprobación visual humana pendiente expresamente. |

### Límites, revisión del autor y traslado

La referencia se verifica con genérica/textos normales. Textos excepcionales crecen sin recortar ni reducir contenido: el fixture con datos literales `Dato 700 km`/imagen real produce carta de **230×340**; no se declara encuadre 230×321 universal para todas las barajas. Errores/avisos/rankings y textos largos pueden ampliar el panel. Son excepciones previstas, no cambios silenciosos de la dimensión de referencia.

Acceso posterior registrado: a **390×844**, página **390×1984**, scroll lateral de mano restante **132 px**, sin desbordar página; a **1280×800**, fixture de datos distintos produce página **1280×1101**, sin desbordamiento horizontal. Continúa scroll vertical; estos ensayos no diseñan un encuadre nuevo. El caso de 1280 con dos cartas tiene overflow de mano0, sin prometerlo para toda mano/estado/tamaño. Se mantienen scrolls de mano/Mesa independientes.

No se hizo prueba física del equipo del autor, recorrido humano, comprensión/equilibrio con usuarios ni aprobación del aspecto. Tampoco se volvió a acreditar un vencimiento real desconectado de 15 s o una reserva real de 30 s en esta selección; temporización/retención se cubren con las baterías de tiempo controlado y adaptadores normales indicadas, sin atribuirles media hora real. La interfaz espera/resultados tiene regresión funcional, sin rediseño. C09–C10 siguen **parciales**.

Para revisión del autor: seguir la sección B11 de README con dos perfiles independientes y, para observador, tres; contrastar apertura/turno/revisión, ALTO/BAJO en ambos órdenes, click/botón/Detalles/teclado/drag, F5/segunda pestaña y avisos. Revisar además cinco jugadores y capturas antes/después. Registrar versión, `innerWidth/innerHeight`, zoom100 %, pantalla/escala/barras y cualquier scroll efectivo de su equipo, sin cambiar zoom para aparentar 1600 px útiles. Aprobar o describir diferencias visuales; las resoluciones inferiores se acordarán después.

**Coordinación:** B11 técnico completo, base/commits/evidencia anterior, cero déficit normal de referencia. **Diseño:** trasladar la decisión posterior 1800×1600 CSS/100 % y 230×321 con Detalles dentro/acción fuera, sustituyendo sus dimensiones antiguas; contrastar esta realización, sin copiar el arte ni simplificaciones de las escenas. **Arquitectura:** actualizar descripción de aplicación §§7–12 para roster PC BF/BD/(O)/abridor sombreado/Mesa al pie y carta Atributo/Dato/J/acción exterior, conservando autoridad, contratos, políticas, privacidad y plazos existentes. No cambia ningún límite de capas/puertos. Los responsables actualizan sus fuentes; aquí no se editó TFM ni Diseño. Pendientes: aprobación visual del autor, adaptación acordada a tamaños inferiores y cobertura C09–C10 restante. Commits locales, sin push/PR/despliegue ni otro bloque.
