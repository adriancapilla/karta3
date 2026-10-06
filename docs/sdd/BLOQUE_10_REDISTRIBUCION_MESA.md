# B10 — Redistribución de bloques de la mesa

**Estado:** distribución y alcance acordados por el autor el 06/10/2026; implementado y verificado localmente el mismo día. Cambio de código comprobado: `cbf2e8c5be8f58a7b79af438ca30bb86751f5f57`. Evidencia nueva en el cierre inferior; no acredita una ventana única ni validación humana.
**Base comprobada:** `main f2d84fb71ccf489b4987928d3a09cde4eb6ad1cf`, con partida completa, plazos y bots EASY/HARD. Antes de esta preparación solo aparece `docs/diseno/` sin registrar; conservar íntegramente esa entrega.
**Referencias:** [Diseño D01–D09 y sus límites](../diseno/DISENO_MESA_JUGABLE.md), [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md), [dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md); B06–B09/T02 y aplicación §§7–12 para comportamiento vigente, sin recuperar limitaciones históricas.

## Objetivo y alcance

Acercar mesa, mano y contexto de turno redistribuyendo **solo los bloques existentes**. Conservar cabecera con baraja/versión/ronda/mazo, avisos, contenido, tipografía, numeración, etiquetas, botones y dimensionado base de cartas. Reglas, privacidad, contratos y estado no cambian; no hay casos de uso ni controles nuevos.

Fuera: carta que va ganando, asteriscos/leyendas nuevas, abreviaciones, fuentes/cartas nuevas, movimientos adicionales de contadores, paneles fijos, animaciones y acabado visual. La selección propia y el atributo activo mantienen sus resaltados actuales.

## Distribución implementable

Mantener el corte actual: **móvil hasta 760 px inclusive; PC desde 761 px**, ancho útil de navegador en píxeles CSS. Conservar cabecera y avisos fuera de la distribución de paneles.

| Vista | Fila | Izquierda | Centro | Derecha |
| --- | --- | --- | --- | --- |
| PC | 1 | Jugadores/puntos | Mesa pública, abarcando centro y derecha | Continuación de mesa |
| PC | 2 | Indicadora completa | Mano propia | Estado/turno completo |
| Móvil | 1 | Jugadores/puntos | Estado/turno, en la columna derecha | — |
| Móvil | 2, 3, 4 | Indicadora compacta → mesa pública → mano, cada bloque a ancho disponible | | |

PC: alinear arriba los paneles de cada fila. Indicadora, mano y estado empiezan en la misma banda inferior; estado siempre a la derecha de la mano, sin tercera fila. El centro recibe la mayor parte del ancho restante; elegir anchos compatibles con los componentes actuales. Móvil: jugadores/estado alineados arriba; los tres bloques posteriores quedan debajo de ambos. Conservar envoltura de texto/control dentro de cada columna, sin reducir letra ni botones.

Un solo panel de estado, movido íntegro: turno/reloj, abridor, atributo/dirección, parcial privada, revisión, envío, error y recuperación. `RoundReview` sigue dentro de ese panel. No duplicar paneles, controles ni estado para cada tamaño.

Observador: conserva su identificación aparte en jugadores y no recibe mano/control de juego. En PC, indicadora y estado siguen en la fila inferior; estado puede ocupar también el hueco central sin crear una mano vacía. En móvil, misma distribución superior, omitiendo la mano.

Permitir únicamente cambios de estructura exterior, columnas/filas, anchos, alineación y separación entre paneles. Conservar estilos internos y reglas base actuales de `GameCard`, tablas, imágenes/icono, etiquetas, botones y Detalles; el ancho que ya depende del contenedor puede adaptarse naturalmente. Las cartas no deben encogerse para hacer caber tres. Mano y mesa mantienen desplazamientos laterales **independientes** y contenidos; no aparecen desplazamiento horizontal de página, solapamiento ni contenido recortado.

El desplazamiento vertical de página sigue permitido. No prometer una ventana única ni fijar alturas ocultando contenido. Registrar el caso residual (tamaño, estado, datos fuera de ventana) para la siguiente iteración. Si se demuestra una incompatibilidad con las posiciones o la consulta del contenido, describirla al autor antes de sustituir la distribución.

## Responsabilidades, dependencias y autonomía

| Responsabilidad | Piezas previstas | Dependencias y comprobación |
| --- | --- | --- |
| Colocar paneles y conservar contenido/estado | `src/style.css` y, solo si hace falta estructura, `src/GameScreen.tsx` | Cliente → contratos/componentes existentes; nunca server. Geometría, comparación visual, foco/selección/desplazamiento. |
| Comprobar presentación y regresión | Pruebas de navegador y soportes existentes | Adaptadores/fixtures solo en pruebas; mismas reglas autorizadas, sin endpoints de prueba en producto. |

Dominio, aplicación, puertos, adaptadores, composición y contratos permanecen sin cambios. `GameCard`, `RoundReview`, acciones y relojes se reutilizan; no refactorizarlos ni alterar su lógica. Acotar estilos a mesa para no modificar espera/resultados.

El implementador elige distribución CSS, anchos/gaps y pruebas mínimas compatibles. Preferir recolocar los nodos existentes; si necesita ajustar estructura/orden del DOM, conservar identidad de componentes, acceso con teclado y foco, sin recrearlos al cambiar de tamaño. Ninguna actualización remota o cambio de ancho debe enviar jugadas, perder parcial/selección local, cerrar Detalles o reiniciar deliberadamente desplazamientos. El ajuste natural al nuevo rango de desplazamiento no es un reinicio impuesto.

## Ejemplos y criterios de aceptación

| Ejemplo | Resultado comprobable |
| --- | --- |
| E1 — Abridor PC, cinco jugadores | Mesa encima de mano/estado; indicadora/mano/estado alineados en fila inferior. Elegir carta y ALTO/BAJO conserva ambos órdenes y envío. |
| E2 — Turno posterior móvil | Jugadores/estado vecinos arriba; indicadora/mesa/mano debajo. Deslizar mesa no mueve mano ni página horizontalmente; Detalles no juega. |
| E3 — Revisión y avisos | Estado conserva revisión/tiempo/resultado/errores sin cambiar ubicación, ocultar mensajes ni crear un segundo plazo. |
| E4 — Resize, evento y observador | Selección, diálogo/foco y desplazamientos conservados; observador mantiene estado público sin mano ficticia ni datos rivales. |

- [x] **B10-01:** posiciones PC E1 y móvil E2 verificadas mediante cajas geométricas, no solo presencia de textos. Paneles de una misma fila alineados arriba (tolerancia 2 px); filas sucesivas sin solapamiento. Estado único, sin tercera fila PC ni duplicación móvil.
- [x] **B10-02:** comparación visual con referencias en apertura y turno posterior a tamaños/estados equivalentes; respetar relaciones de posición. Cabecera/contadores y avisos actuales permanecen en su ubicación.
- [x] **B10-03:** fuentes, contenidos, numeración/etiquetas, botones y reglas de tamaño interno de carta conservados frente a la base en igual viewport. Variaciones de altura por envoltura no autorizan cambiar fuentes ni padding interno.
- [x] **B10-04:** página sin overflow horizontal; mesa/mano con desplazamiento contenido e independiente cuando desbordan. Nombres/atributos/unidades largos consultables, sin invasión ni abreviación.
- [x] **B10-05:** aperturas en ambos órdenes, parcial privada, jugada posterior, bloqueo fuera de turno, envío/recuperación y Detalles/foco conservados; actualizar/resize no provoca acciones ni pérdidas de estado.
- [x] **B10-06:** plazos/timeout/automático, revisión cero/positiva, fase final/desempate, bots y observador conservados. HTTP/acks/eventos siguen privados por destinatario. Espera y resultados sin cambios visuales o funcionales derivados.
- [x] **B10-07:** residual vertical documentado con tamaño/estado y captura; incompatibilidades concretas consultadas. No declarar visibilidad simultánea resuelta solo por redistribuir.
- [x] **B10-08:** check, navegador pertinente y dependencias pasan; evidencia nueva localizable y separada de resultados históricos.

## Comparación visual y verificación prevista

Referencias: [PC apertura](../diseno/referencias/redistribucion-01/escritorio-abridor.png), [PC jugador](../diseno/referencias/redistribucion-01/escritorio-jugador.png), [móvil](../diseno/referencias/redistribucion-01/movil-compacto.png). Fijan composición, **no equivalencia píxel a píxel**. Mantener deliberadamente los textos/símbolos/dimensiones actuales que difieren del boceto, incluidos contadores en cabecera. El lienzo móvil con rótulo «360 × 800» no acredita su viewport real; comparar con el esquema D03–D08 en ese viewport, sin inferir tamaño desde el PNG.

| Muestra mínima | Estados y contenido |
| --- | --- |
| PC 1280×800, 1366×768 y 1536×1024 (lienzo PC de referencia) | Apertura y turno posterior; cinco jugadores, mesa vacía/con jugadas. |
| Móvil 360×800 y 390×844 | Apertura y turno posterior; cinco jugadores y scroll independiente. |
| Límite 760×800 y 761×800 | Dos distribuciones acordadas, sin desbordamiento; cambiar ancho con carta parcial/Detalles abierto. |
| Muestra adicional repartida entre PC/móvil | Esperando turno, revisión, final/desempate con manos 1–3, automático/bots y observador; nombres/atributos/unidades largos, imágenes reales/nulas. |

No multiplicar todos los estados por todos los tamaños. Reutilizar paquetes temporales/permutaciones y reloj controlado existentes para obtener estados equivalentes **sin modificar producción ni genérica**. Comparar antes/después sobre la misma semilla/estado/viewport/zoom 100%; conservar capturas de viewport para valorar scroll vertical y de página completa cuando aporte contexto. Registrar condiciones/diferencias deliberadas y revisar visualmente; un test de posición o una captura sin revisar no sustituye la comparación.

Añadir comprobaciones geométricas y scroll a escenarios existentes o a un archivo mínimo de presentación. Conservar las aserciones funcionales. Al cerrar: `npm run check` y `npm run test:browser -- --workers=2` con los archivos de distribución nuevos/afectados y `initialGame.spec.ts`, `manualGame.spec.ts`, `timedGame.spec.ts`, `bots.spec.ts`. Estos cubren las regresiones pertinentes; no exigir otra batería completa ni repetir recorridos por rutina. Registrar el comando exacto y resultados sobre compilación vigente. Las capturas con tiempo controlado, conexiones reales y móvil emulado deben distinguirse; no afirmar dispositivo físico, equilibrio o comprensión.

## Dependencias, cierre y pendientes

Diseño D01–D09 está aprobado; no hay preguntas funcionales abiertas tras la lectura de fuentes/código. La compatibilidad final de anchuras se comprobará en implementación; una incompatibilidad real requiere consulta, no una distribución alternativa improvisada. Mantener la entrega de Diseño sin registrar y demás trabajo local al preparar la rama desde la base integrada.

**Preparación histórica:** la preparación consultó fuentes/imágenes y creó SDD; no ejecutó pruebas del producto. La implementación y sus comprobaciones nuevas se registran a continuación. Los cierres históricos y C09–C10 parciales se conservan. La siguiente iteración podrá valorar tamaños/textos/acabado con autorización independiente.

**Prompt:** [encargo de implementación](PROMPT_IMPLEMENTACION_BLOQUE_10.md).

## Cierre real — 06/10/2026

### Base, alcance y revisión

Base efectiva: `main f2d84fb71ccf489b4987928d3a09cde4eb6ad1cf`, coincidente con la aprobada. Rama creada: `feat/b10-redistribucion-mesa`. Al comenzar, producto limpio y cambios locales de preparación: enlace en PROCESO_SDD, especificación/prompt B10 y entrega `docs/diseno/`. Conservados sin restauraciones: preparación SDD en `897ce38`; Diseño permanece íntegro y **sin registrar**, según este encargo. La referencia de estilos/contenido anterior se capturó y registró en `c1cdb95` antes de modificar CSS. Código probado y revisado: `cbf2e8c`.

El único archivo de producto modificado es `src/style.css`: columnas/filas exteriores y extensión del estado del observador sobre el hueco central. Se conserva el corte 760/761. No se modifica el DOM ni se recrean componentes al cambiar tamaño. `GameScreen`, `GameCard`, `RoundReview`, acciones, relojes, transportes, dominio y contratos no cambian. Revisión semántica: los selectores afectados están limitados a `.game-layout` y sus paneles; espera/resultados no reciben estos cambios. Fuentes, padding, tablas, imágenes, estilos internos y bases de anchura 210/220 px de mano permanecen iguales. La anchura dependiente del contenedor se adapta y activa el aviso de desplazamiento existente cuando corresponde; no se fuerza a encajar tres cartas.

Archivos de comprobación: `tests/browser/tableLayout.spec.ts`, `tests/fixtures/table-layout-f2d84fb.json` y una opción de texto largo en `tests/support/configurationBrowserServer.ts`, aplicada únicamente a paquetes temporales antes de validarlos. No se publican fixtures ni endpoints de control; no se alteran genérica, ASSETS, dependencias, fuentes generales, organización arquitectónica ni cierres anteriores. Documentación vigente: README, este cierre y PROCESO_SDD; prompt preparado conservado.

### Entorno, comandos y resultados nuevos

Windows/PowerShell; 06/10/2026, Europe/Madrid (UTC+02); aplicación 0.1.0, Node 24.13.0, npm 11.6.2, Playwright 1.63.0 con Google Chrome instalado (`channel: chrome`), Vitest 5.0.2. Viewports en píxeles CSS y zoom 100%; móvil **emulado**, sin dispositivo físico ni recorrido humano del autor.

| Ejecución real | Resultado |
| --- | --- |
| `npm run build` sobre la base, antes de editar producto | Correcta; `b10-base-build.log`. |
| `B10_CAPTURE_BASE=1` en entorno PowerShell, después `npx playwright test tests/browser/tableLayout.spec.ts --workers=2` | **7/7**, 19,0 s; 14 estados anteriores y sus capturas, `b10-base-browser.log`. Variable retirada tras el comando. |
| `npm run build` y primera prueba focal de distribución | Build correcto; **9 pasan/3 fallan**, 29,4 s. Los tres PC fallaron en comparación textual por espacios al aparecer el aviso de scroll; no por geometría. `b10-layout-focal.log`. |
| `npx playwright test tests/browser/tableLayout.spec.ts --workers=2`, tras reparar la comparación y añadir texto largo | **14/14**, 29,3 s; `b10-layout-repair.log`. Se normaliza solo whitespace y se compara el aviso condicional por su condición real de desbordamiento; no se cambia producto para superar la prueba. |
| **`npm run check`**, código final | **Correcto**, 12:01:20–12:01:47 +02, 26,84 s. Tipos, lint, catálogo/build, **408/408 en 38 archivos**, arquitectura **64 módulos sin imports prohibidos ni ciclos**; `b10-final-check.log` y `b10-final-check-time.log`. |
| **`npm run test:browser -- --workers=2 tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/bots.spec.ts`** | **64/64** (14 B10 + 50 existentes), 12:03:14–12:09:25 +02, 370,98 s incluidos build/arranque; Playwright informa 6,1 min. `b10-final-browser.log` y `b10-final-browser-time.log`. No se eliminan ni rebajan aserciones de los cuatro archivos existentes. |

Las capturas equivalentes usan cinco humanos, paquete temporal validado `portada` v7, permutación identidad, turno de 60 s y revisión de 5 s. Apertura: Lucía abridora, mesa vacía y tres cartas propias. Turno posterior: cuatro jugadas humanas legales, turno del anfitrión y tres cartas propias. Conexiones HTTP/Socket.IO reales contra servidor compilado, **reloj sustituido** para estabilizar estados. Las regresiones incluyen además partidas con genérica 2, entropía/adaptadores normales. No se ejecuta de nuevo la prueba específica de 15 s reales desconectado, reserva real de 30 s o retención real de media hora; no se atribuye esa evidencia histórica a B10.

Instancia normal: `npm run start` sobre la compilación final, `http://127.0.0.1:3000`, no un servidor de desarrollo. A las 12:04:41 +02 se leyó `/assets/index-BV6Xqej9.css`: igualdad byte a byte con `dist`, SHA-256 `87cdc13ba2fcceef459b628163348d2e6fc98e22ffd9a60f464f639d135627d8`. `/api/decks` ofrece genérica formato 1/contenido 2 y metadatos seguros; `b10-served-evidence.log`. Las pruebas levantan sus propias instancias de la misma compilación; no utilizan la sala preexistente del navegador como evidencia.

### Evidencia por criterio y comparación revisada

| Criterio | Evidencia ejecutada / resultado |
| --- | --- |
| B10-01, E1–E2 | 14 mediciones en siete tamaños: alineación ≤2 px, filas sin solaparse, estado único, PC sin tercera fila; móvil con dos columnas superiores y tres filas posteriores. Observador en 390/761/1280 sin mano ficticia. **Pasa**. |
| B10-02 | Revisión visual de las tres referencias y de los 14 pares antes/después (apertura/turno posterior en cada tamaño). Misma base/paquete/permutación/estado/viewport; cabecera y resumen conservan coordenadas. Se revisan además texto largo 360/761, observador 390 y revisión 1280. Capturas finales representativas revisadas nuevamente tras la puerta final. **Pasa** para composición; no equivalencia del arte del boceto. |
| B10-03 | Estilos internos computados y textos comparados con la base congelada, incluidos tamaños de fuentes, padding, radios, flex de cartas, tablas y botones. Única excepción textual condicional: aviso existente de scroll, comprobado contra overflow real. **Pasa**, sin abreviaciones ni reducción de fuentes/cartas. |
| B10-04, E2 | `scrollWidth <= innerWidth` y `scrollX=0` en muestras; mano/mesa desbordan dentro de sus regiones, offsets independientes 50/100/180/80 px. Nombres de hasta 16 caracteres, atributo/unidad largos, imágenes reales/nulas, Detalles con unidad literal y controles contenidos. **Pasa**; la envoltura larga sigue necesitando altura. |
| B10-05, E1/E4 | Ambos órdenes de apertura y turno posterior en regresiones; parcial local, Detalles abierto/foco/scroll y vencimiento conservados al pasar 760→761→390→1280→760, también tras evento remoto de presencia. Cero envíos durante resize/Detalles y un envío al completar BAJO. Jugador ajeno bloqueado; recuperación/F5/pérdida de ack en pruebas existentes. **Pasa**. |
| B10-06, E3/E4 | Revisión 0/5, timeout/automático, avisos, finales/manos variables/desempate legal, bots, observador, resultados/otra sala y privacidad por destinatario en las regresiones nuevas ejecutadas. Captura de `RoundReview` dentro del único estado y turno null durante revisión. Batería general mantiene HTTP/ack/eventos, catálogo y ciclo de espera. **Pasa**; plazos controlados diferenciados de tiempo real. |
| B10-07 | Tabla de residual inferior y capturas viewport/full revisadas. No aparece incompatibilidad que exija otra distribución; no se ha consultado una sustitución de posiciones ni se promete una ventana única. **Pasa**, pendiente visual explícito. |
| B10-08 | Puertas finales anteriores correctas más revisión semántica del diff: producto solo CSS, componentes/contratos/servidor/paquete sin cambios, control de dependencias correcto. **Pasa** con evidencia de esta fecha, sin reutilizar resultados históricos como pruebas B10. |

Referencia congelada: `tests/fixtures/table-layout-f2d84fb.json`, SHA-256 sobre texto normalizado a LF `0d8b973d73c51e88d7f4b1f5eddf8a8e42461b731141d542a560dfacc734bc4a`, comprobado por la prueba. El modo de captura anterior rechaza CSS distinto de la huella de base `a00933484ee9c7676df79e850b676b387f86729253648f8cbed040ea0344dc20`; no regenera expectativas desde el producto final.

Evidencia local generada, ignorada en Git: `playwright-report/b10/before/` y `after/`, nombres `<ancho>x<alto>-opening|subsequent-viewport|full.png` y JSON de geometría para los 14 estados por versión. Ejemplos revisados: [PC antes](../../playwright-report/b10/before/1280x800-opening-full.png), [PC después](../../playwright-report/b10/after/1280x800-opening-full.png), [móvil antes](../../playwright-report/b10/before/390x844-subsequent-full.png), [móvil después](../../playwright-report/b10/after/390x844-subsequent-full.png), [revisión](../../playwright-report/b10/after/1280x800-review-full.png), [texto largo](../../playwright-report/b10/after/360-long-full.png), [observador](../../playwright-report/b10/after/390-observer-full.png). No se versionan capturas/logs ni artefactos generados; la referencia y los escenarios quedan reproducibles en Git.

### Scroll vertical residual y coordinación

Medidas finales en píxeles CSS de documento, redondeadas al entero; cinco jugadores, mismo contenido anterior. «Inicio mano» es la posición del borde superior, no la primera carta. Altura total incluye margen inferior. Capturas viewport y full de cada fila están en la carpeta anterior.

| Viewport | Apertura: inicio mano / altura página | Turno posterior: inicio mano / altura página |
| --- | --- | --- |
| 1280×800 | 765 / 1492 | 802 / 1529 |
| 1366×768 | 765 / 1492 | 802 / 1529 |
| 1536×1024 | 765 / 1492 | 802 / 1529 |
| 360×800 | 1139 / 1821 | 1567 / 2249 |
| 390×844 | 1055 / 1737 | 1519 / 2201 |
| 760×800 | 997 / 1703 | 1471 / 2177 |
| 761×800 | 761 / 1488 | 798 / 1525 |

En PC de 1280×800/1366×768 casi toda la banda inferior queda fuera de la primera ventana; en 1536×1024 se ven sus encabezados/parte de cartas pero no todo. En móvil la mano empieza fuera de la ventana en ambos estados; la mesa con cuatro cartas aumenta la distancia vertical. Con cinco jugadores queda espacio libre bajo la mesa vacía PC, porque la fila sigue la altura del listado. En 360 px el encabezado de jugadores puede partir una palabra; atributos/unidades largos envuelven en numerosas líneas. Todo sigue consultable con scroll/Detalles y las letras no se han reducido. Son pendientes de una siguiente iteración autorizada de tamaños/textos/acabado, sin ocultar contenido ni introducir paneles fijos aquí.

Comprobación humana propuesta: arrancar compilación vigente, crear/entrar con sesiones independientes y selección explícita de genérica 2; verificar apertura y turno posterior a 1280/390, redimensionar cruzando 760/761 con selección/Detalles, deslizar mesa y mano por separado y observar revisión/observador. El autor **no ha realizado este recorrido B10 dentro de esta tarea**. Automatización y revisión de capturas realizadas por implementación; no acreditan comprensión con usuarios, equilibrio, móvil físico o despliegue. **C09–C10 siguen parciales**.

Para coordinación: composición D01–D09 entregada sin cambios de comportamiento/contrato; residual vertical y envoltura estrecha documentados para Diseño. No hay cambio transversal que trasladar a fuentes generales de Arquitectura/TFM. Entrega local; sin push, PR, despliegue ni apertura de otro bloque.
