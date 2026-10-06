# B10 — Redistribución de bloques de la mesa

**Estado:** distribución y alcance acordados por el autor el 06/10/2026; implementación/verificación pendientes.
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

- [ ] **B10-01:** posiciones PC E1 y móvil E2 verificadas mediante cajas geométricas, no solo presencia de textos. Paneles de una misma fila alineados arriba (tolerancia 2 px); filas sucesivas sin solapamiento. Estado único, sin tercera fila PC ni duplicación móvil.
- [ ] **B10-02:** comparación visual con referencias en apertura y turno posterior a tamaños/estados equivalentes; respetar relaciones de posición. Cabecera/contadores y avisos actuales permanecen en su ubicación.
- [ ] **B10-03:** fuentes, contenidos, numeración/etiquetas, botones y reglas de tamaño interno de carta conservados frente a la base en igual viewport. Variaciones de altura por envoltura no autorizan cambiar fuentes ni padding interno.
- [ ] **B10-04:** página sin overflow horizontal; mesa/mano con desplazamiento contenido e independiente cuando desbordan. Nombres/atributos/unidades largos consultables, sin invasión ni abreviación.
- [ ] **B10-05:** aperturas en ambos órdenes, parcial privada, jugada posterior, bloqueo fuera de turno, envío/recuperación y Detalles/foco conservados; actualizar/resize no provoca acciones ni pérdidas de estado.
- [ ] **B10-06:** plazos/timeout/automático, revisión cero/positiva, fase final/desempate, bots y observador conservados. HTTP/acks/eventos siguen privados por destinatario. Espera y resultados sin cambios visuales o funcionales derivados.
- [ ] **B10-07:** residual vertical documentado con tamaño/estado y captura; incompatibilidades concretas consultadas. No declarar visibilidad simultánea resuelta solo por redistribuir.
- [ ] **B10-08:** check, navegador pertinente y dependencias pasan; evidencia nueva localizable y separada de resultados históricos.

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

**Código/pruebas/verificación:** pendientes. Esta preparación solo consulta fuentes/imágenes y crea SDD; no ejecuta pruebas del producto. Implementación registrará revisión, archivos, comandos/entorno/resultados, comparación visual y residual vertical. Mantener cierres históricos y C09–C10 parciales. No editar fuentes generales de Arquitectura/TFM ni publicar. La siguiente iteración podrá valorar tamaños/textos/acabado con autorización independiente.

**Prompt:** [encargo de implementación](PROMPT_IMPLEMENTACION_BLOQUE_10.md).
