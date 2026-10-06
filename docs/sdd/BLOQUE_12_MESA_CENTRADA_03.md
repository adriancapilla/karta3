# B12 — Mesa centrada 03

**Estado:** acordado, implementado y verificado técnicamente el 06/10/2026. Producto `6396ae2a00ec8144da2850e55b211373f08dc826`; revisión final, incluida reparación del ensayo de teclado, `5c97512485d40ba6fd792fbc06a9d1c8451beb9a`. Resultados nuevos y fallos/reparaciones en el cierre. Aprobación visual humana del autor pendiente; no confundirla con inspección técnica de capturas.
**Tipo y base comprobada:** presentación sobre `feat/b11-ajuste-mesa-pc-02`, HEAD `c300fcac470f5c3cdebdb87d1f60856eeffd7784`. Al consultar solo `docs/diseno/` estaba sin registrar; conservarlo y cualquier trabajo posterior. No asumir main/publicación ni partir de una base sin B11.
**Referencias:** [Diseño M03-01–05](../diseno/AJUSTE_MESA_CENTRADA_03.md), [cálculo original](../diseno/PROPUESTA_MESA_CINCO_COLUMNAS_03.md), [B11 y cierre](BLOQUE_11_AJUSTE_MESA_PC_02.md), [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [dependencias §2](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), [aplicación §§7–10](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), [contrato de partida](../../shared/contracts/game.ts).

## Objetivo y alcance

Centrar y compactar la mesa PC mediante cinco columnas lógicas, mostrando cuatro cartas públicas completas y permitiendo consultar la quinta lateralmente. Ordenar únicamente esas cartas de mejor a peor J; mantener la mano en adquisición. Subir y alinear indicadora/mano eliminando la línea y reserva de encabezado indicadas.

**Incluye:** composición, encabezados inferiores, orden público y acceso al desbordamiento de Mesa; medidas y comparación visual. **Conserva:** contenido/fuentes/tamaño base de carta, acciones, Detalles, puntuaciones, privacidad, permisos, plazos, revisión, recuperación y contratos. **Fuera:** diseño de otros tamaños, espera/resultados, líder provisional, animaciones, cabecera fija, algoritmos/reglas, servidor y barajas.

Las decisiones siguientes están confirmadas. No hay propuestas funcionales pendientes. Otros tamaños se diseñarán después; mientras tanto conservar su acceso y adaptación existentes.

## Distribución y recorrido

### Ancho centrado

Aplicar el modo centrado cuando el ancho disponible para contenido permita **1400 CSS px**, considerando la barra vertical y los bordes exteriores. No confundir ancho nominal de ventana con espacio disponible. En menos espacio conservar la adaptación existente y no causar scroll horizontal de página; sin nuevo selector ni diseño móvil/tableta.

| Elemento | Dimensión/posición acordada |
| --- | --- |
| Contenedor | 1400 px exteriores, centrado; 16 px interiores a cada lado, cuadrícula de 1368 px. Cabecera/avisos/pie siguen este contenedor. |
| Columnas lógicas | Cinco de 264 px, cuatro separaciones de 12: `5×264 + 4×12 = 1368`. |
| Arriba | Jugadores en columna 1, 264 px; Mesa en columnas 2–5, 1092 px. |
| Abajo, jugador | Indicadora en 1, 264 px; mano en 2–4, 816 px; turno en 5, 264 px. |
| Abajo, observador | Indicadora en 1; estado ocupa 2–5, conservando la redistribución existente cuando no hay mano. Sin mano ni acciones ficticias. |
| Cartas | Referencia común B11 de 230×321 px, incluidos Detalles; autores/acciones fuera. Una/dos cartas no se estiran ni se centran: mantienen posiciones desde la izquierda. |

Puede implementarse con cinco columnas o la estructura equivalente `264 / 816 / 264` y gaps de 12. Dentro de Mesa/mano, las cartas se alinean con los centros de columnas lógicas: separación **46 px entre bordes de cartas**, distinta del gap de estructura de 12. Con los interiores de referencia, cada carta empieza 17 px después del borde de su columna (`12 + 1 + 4`). Mantener alineación superior/inferior con tolerancia 2 px.

**Balance horizontal previsto:** Mesa interior de 1066 px: `4×230 + 3×46 + 2×4`. Cinco cartas necesitan 1342 px: desplazamiento máximo de referencia 276 px. Mano interior de 790 px: `3×230 + 2×46 + 2×4`. Medir clientWidth/scrollWidth efectivos y reservas de scrollbar para asegurar cuatro públicas/tres propias completas. No ampliar Mesa para mostrar cinco aunque sobre ancho de ventana.

### Consulta de Mesa

Cartas alineadas arriba, autores debajo y «Mesa» al pie, con contenido B11. Reservar la banda pública estable desde cero jugadas, evitando saltos de mano/acciones al incorporar cartas. Cuatro o menos no necesitan scroll lateral en el modo centrado. Con cinco, la región de Mesa permite consultar completamente la quinta, su autor y Detalles mediante teclado, ratón y táctil; aparece «5 cartas · desliza →» en su pie únicamente con ese desbordamiento.

La región desplazable tendrá nombre accesible y acceso de teclado, con la ayuda asociada. Mantener autores vinculados a sus cartas y orden de lectura igual al visual. El scroll de Mesa es independiente de mano y página; deslizar no selecciona ni juega. No añadir otra fila, compresión, botones de juego públicos ni desplazamiento automático para enseñar una nueva jugada.

### Encabezados y altura

En este modo PC eliminar la línea visible completa **«Atributo indicador: …»** sobre la indicadora. Mantener «Carta indicadora», carta/icono propio, atributo activo del turno y fila activa. No eliminar datos del contrato ni reintroducir la línea porque las maquetas la muestran.

Compactar conjuntamente encabezados de indicadora/mano: retirar la reserva actual `min-height:68px`, usar la altura del título y una separación corta elegida por implementación. Sin reserva vacía equivalente ni línea ficticia. Centrar **«Tu mano»** dentro de su panel, conservar texto/fuente y acercarlo a las cartas. Alinear los bordes superiores de indicadora y todas las cartas de mano dentro de 2 px. Mantener botones exteriores y la ayuda lateral de mano cuando sea necesaria en tamaños existentes menores.

Se permite scroll vertical natural para apartar cabecera, consultar pie y contenido extenso. Sin altura universal exigida al autor, límite que recorte estado/revisión ni ocultación para encuadrar. Medir alto útil, altura de página y scroll residual en cada escenario. En contenido excepcional conservar el crecimiento documentado por B11 y señalar cualquier incompatibilidad con el tamaño de referencia antes de alterar texto, fuentes o imágenes; no afirmar encuadre universal de otras barajas.

## Datos, estados y contratos conservados

No hay operaciones HTTP/socket, permisos, errores de servidor o estados nuevos. Reutilizar [GameScreen](../../src/GameScreen.tsx), [GameCard](../../src/GameCard.tsx), [RoundReview](../../src/RoundReview.tsx) y acciones/relojes vigentes. El navegador recibe solo su mano e información pública; no solicitar paquetes ni datos adicionales.

| Estado recibido | Proyección de cartas públicas |
| --- | --- |
| Sin dirección pública (`round.direction === null`) | Conservar secuencia recibida de `round.plays`; nunca usar la dirección privada de `interaction.openingSelection`. |
| Jugadas en curso, `HIGH`/ALTO | Copia ordenada por `card.values[round.activeAttributeId].playValue`, descendente. |
| Jugadas en curso, `LOW`/BAJO | Mismo dato, ascendente. No usar Dato/displayValue ni `card.roundAttribute` para comparar. |
| Revisión de ronda | Usar la secuencia confirmada `interaction.review.result.ranking`, conservando carta/autor y posiciones del servidor; no recalcular el resultado. |

La proyección pública puede reutilizarse en la vista compartida sin rediseñar otros tamaños. No mutar `round.plays`, `plays.order`, mano, participantes, puntuación, turno ni resultado. Los valores del atributo son distintos por validación de baraja; no introducir una regla nueva de desempate de J. La lista de jugadores conserva el orden oficial. No declarar ganador/abridor provisional, ni añadir resaltado: durante revisión siguen siendo los comunicados por el servidor.

Una nueva jugada reordena solo la proyección. Conservar identidad de carta/autor, diálogo abierto y foco en su elemento si sigue presente; al cerrar Detalles usar el retorno existente. No reiniciar scrollLeft por un render, evento repetido o tick del reloj: mantener la consulta en curso dentro de los límites disponibles. El desplazamiento necesario por navegación de teclado es una acción del usuario. Recarga/reconexión reconstruyen orden desde la vista aceptada, sin nuevos envíos, plazos o persistencia de scroll en servidor.

## Responsabilidades y dependencias

| Responsabilidad | Capa/piezas | Dependencias y comprobación |
| --- | --- | --- |
| Cuadrícula, encabezados, región/hint de Mesa | Cliente GameScreen/estilos de mesa | Contratos seguros y componentes existentes; sin server. Geometría, acceso y comparación visual. |
| Orden de presentación pública | Proyección local del cliente | Solo datos públicos de vista; no importar dominio ni decidir resultados oficiales. Comparar orden visual con valores/ranking recibidos y revisar ausencia de mutaciones. |
| Evidencia y regresión | Pruebas/soportes existentes | Fixtures fuera del producto; sin endpoints ni paquetes nuevos en cliente. Medidas, recorridos y revisión de imports. |

Modelo de sala, dominio, casos de uso, puertos, adaptadores, composición y contratos no cambian. GameCard, selección/envío y RoundReview conservan contenido y lógica. Elegir funciones, nombres, CSS y condición técnica por ancho disponible es autonomía de implementación; sin refactor general. Consultar solo si una incompatibilidad exige sustituir una decisión confirmada.

## Ejemplos comprobables

| Caso | Dado/cuando | Resultado |
| --- | --- | --- |
| E1 | Cuatro jugadas con J recibidos `31,54,35,50` y ALTO | Mesa `54,50,35,31`, autores correctos, cuatro completas; `plays.order` y mano intactos. |
| E2 | Los mismos valores con BAJO | Mesa `31,35,50,54`; no ordenar por texto mostrado o indicador propio. |
| E3 | Quinta jugada y revisión positiva, ranking autorizado `56,54,50,35,31` | Primera ventana muestra las cuatro primeras; desplazarse permite consultar la quinta/Detalles. Igual ancho, mano inmóvil y revisión original. |
| E4 | Dirección parcial privada aceptada y aún sin jugada pública | Mantener la mesa/orden público sin revelar la parcial; ambos órdenes de apertura siguen enviando al completar carta y dirección. |
| E5 | Detalles/foco o scroll de Mesa ya abierto al entrar una jugada | Carta/autor no se confunden, foco/diálogo se conservan y no se envía acción ni se fuerza scroll de página. |
| E6 | Recarga, otra pestaña, mano de una/dos o anfitrión observador | Misma vista autorizada ordenada; mano en adquisición sin estirar; observador sin mano/control. |

## Criterios de aceptación previstos

- [x] **B12-01:** medidas 1400/1368/264/816/1092, cartas de referencia 230×321, gaps 12/46 y centrado/alineación dentro de 2 px. Mantener ancho con ventana mayor y con quinta jugada; considerar scrollbar vertical.
- [x] **B12-02:** cuatro cartas públicas completas sin scroll necesario; quinta completamente consultable con autor/Detalles, ayuda solo con overflow y acceso por teclado/ratón/táctil. No scroll horizontal global, desplazamiento de mano ni envío por deslizar.
- [x] **B12-03:** tres propias completas y botones exteriores; una/dos desde la izquierda, adquisición intacta. Observador con redistribución existente, información pública y ausencia de mano/acciones.
- [x] **B12-04:** línea eliminada y ninguna reserva vacía de 68 px; «Tu mano» centrado/cercano, indicadora/mano alineadas. Ahorro local de encabezado positivo medido frente a base en estado equivalente, sin cambiar cartas/fuentes/contenido.
- [x] **B12-05:** E1–E4, atributo correcto, datos Dato/J distintos y nueva jugada verificados. Revisión respeta ranking confirmado; ninguna mutación de orden oficial, puntuación, mano o resultado, ni revelación de parcial privada.
- [x] **B12-06:** foco/Detalles/scroll durante reordenación, ambos órdenes de apertura, turno posterior, bloqueos, recuperación/varias pestañas y revisión cero/positiva conservados. Sin reinicios de plazo ni dobles envíos.
- [x] **B12-07:** comparación con las tres referencias, medidas antes/después y residual vertical a 1920×1080 y 1920×950 de viewport, zoom100 %. Comprobar también ancho mayor/menor y acceso existente a 1280×800/390×844, sin exigirles rediseño ni encuadre completo.
- [x] **B12-08:** check, navegador pertinente y revisión arquitectónica/semántica registrados con resultados nuevos. Separar verificación técnica de aprobación visual humana; C09–C10 permanecen parciales.

## Dependencias, decisiones y cambios respecto a antecedentes

B11 aporta cartas, acciones y mesa vigentes. Su cierre acredita históricamente check408/408, arquitectura64 y navegador70/70 sobre `9b334b7`, con aprobación visual humana pendiente: esos resultados no son evidencia B12. El contrato ya aporta valores públicos y ranking; no hay dependencia funcional abierta.

| Decisión del autor — 06/10/2026 | Fuente/criterios que requieren alineación |
| --- | --- |
| Cinco columnas centradas, Mesa limitada a cuatro y quinta lateral | Sustituye expansión y cinco completas de B11 para este modo PC. |
| Retirar línea/compactar encabezados, incluso si la imagen la conserva | Sustituye el encabezado conservado y reserva B11; prevalece texto de Diseño/autor. |
| Orden visual público por J y ranking durante revisión | Sustituye orden de llegada visual anterior; comunicar descripción a Arquitectura/aplicación §7. Orden oficial y reglas intactos. |
| Scroll vertical aceptado, altura útil variable | Sustituye objetivo B11 de página completa sin scroll en 1800×1600; no trasladarlo a B12 como puerta. |

No editar Diseño, fuentes TFM ni cierres históricos. Comunicar estas diferencias a sus responsables. Fuera de las decisiones anteriores no se cambian textos, símbolos, fuentes ni comportamiento. No quedan preguntas bloqueantes.

## Plan de verificación y cierre

Capturar base antes de editar y resultado con igual viewport/zoom/estado. Usar escenarios existentes de `pcTable02.spec.ts`, `tableLayout.spec.ts`, `initialGame.spec.ts`, `manualGame.spec.ts`, `timedGame.spec.ts` y `bots.spec.ts`; añadir comprobaciones B12 focales. Ajustar solo expectativas superadas de geometría/orden/encabezado; conservar aserciones de privacidad, acciones y plazos. Separar los artefactos nuevos de los directorios de evidencia B10/B11, sin regenerar sus referencias.

Comparar con [turno](../diseno/referencias/composicion-pc-03/mesa-cinco-columnas-turno.png), [revisión](../diseno/referencias/composicion-pc-03/mesa-cinco-columnas-revision.png) y [quinta consultada](../diseno/referencias/composicion-pc-03/mesa-cinco-columnas-quinta-carta.png) en estados equivalentes: cinco jugadores, cuatro públicas/tres propias durante turno; cinco públicas/dos propias durante revisión, y scroll hasta la quinta. Nombres/valores/tiempos de maquetas son ejemplos, no reglas. Explicar la diferencia escrita de encabezados; no copiar leyendas auxiliares de maqueta al producto.

Registrar viewport/zoom/DPR, cajas de shell/grid/paneles/cartas/acciones, títulos/encabezados, scrollWidth/clientWidth/scrollLeft de Mesa/mano y altura de página. Medir separación título→carta y desplazamiento del inicio de cartas respecto al panel: ahorro local anterior−posterior. Registrar separadamente altura total y scroll residual `max(0, scrollHeight − clientHeight)`: el ahorro local puede no reducir la página durante revisión si el estado domina su altura; no recortar esa revisión para fabricar ahorro. Las [medidas de maqueta](../diseno/referencias/composicion-pc-03/medidas-maqueta.json), 1065,11 px en turno y 1187,55 en revisión, son antecedentes de Diseño, no medidas del producto B12.

Capturas de viewport y página completa, más consulta de quinta; mostrar scroll necesario sin recortes engañosos, zoom reducido o altura artificial para ocultarlo. 1920×1080/950 son entornos reproducibles, no pantalla física acreditada ni configuración exigida al autor. Si hay prueba física, registrar su área real. Reloj controlado permite comparar estados estables; distinguirlo de tiempos/conexiones reales.

En implementación ejecutar `npm run check` y `npm run test:browser -- --workers=2` seleccionando archivos afectados y regresiones pertinentes sobre compilación vigente; registrar selección/comandos/resultados. No repetir baterías por rutina. Revisar imports/ciclos con el mecanismo existente y que la proyección no importe server ni asuma autoridad oficial. Actualizar README, proceso y cierre B12 con evidencia y recorrido manual para el autor.

**Preparación inicial:** lectura de fuentes/código/contratos, inspección de referencias y estado Git; redacción SDD sin implementar ni ejecutar pruebas. Esa preparación y los cierres B10/B11 permanecen diferenciados de la evidencia nueva inferior. Aprobación visual humana pendiente; sin publicación/despliegue.

## Cierre técnico — 06/10/2026

### Base, revisión y archivos

Base efectiva `feat/b11-ajuste-mesa-pc-02`/`c300fcac470f5c3cdebdb87d1f60856eeffd7784`, coincidente con la observada. Se creó `feat/b12-mesa-centrada-03` conservando modificación local de proceso, especificación/prompt B12 y `docs/diseno/` completo. Preparación documental separada **`973d9c6`**; implementación/pruebas/ayuda README **`6396ae2`**; reparación del ensayo de teclado **`5c97512`**, revisión final probada. El commit documental posterior contiene este cierre y la actualización del proceso/README. Diseño continúa sin registrar y sin editar; no se cambiaron fuentes TFM ni cierres históricos.

| Archivo/responsabilidad | Revisión concreta |
| --- | --- |
| `src/GameScreen.tsx` | Región de Mesa con nombre/foco/ayuda, observación de overflow y proyección pública; clase para retirar solo la línea del modo centrado. Reutiliza GameCard, Detalles, acciones, recuperación, reloj y RoundReview sin cambiar su lógica. |
| `src/style.css` | Contenedor PC máximo de 1400, consulta de tamaño del área interior real, columnas de 264/816/264 y gaps de 12/46, encabezados 27+8, «Tu mano» centrado y ayuda de quinta. Fallback anterior en menos ancho y corte 760/761 intactos. |
| `src/publicPlays.ts` | Función de presentación local: copia de `round.plays` por J activo/HIGH/LOW, sin parcial privada; revisión proyectada según ranking recibido, con carta/autor originales. Sin mutar órdenes, manos, puntuaciones ni resolver ganadores. Solo importa contrato seguro. |
| `src/publicPlays.test.ts` | Cinco casos de contrato congelado: E1/E2 con Dato distinto de J y atributo propio diferente, E4 privado/HIGH/LOW y ranking recibido deliberadamente distinto de un recálculo. Este último es un fixture de proyección, no evidencia de una partida legal con ese resultado. |
| `tests/browser/centeredTable03.spec.ts` | Ocho casos B12: medidas/comparaciones equivalentes, E1–E6, quinta por teclado/rueda/tacto, consulta/foco/reordenación/pestañas/F5, anchuras/barra y observador. Copia genérica desde APP, permutación legal sustituida y gestos humanos, sin asignar puntos o saltar el motor. |
| `tests/browser/pcTable02.spec.ts` / `tableLayout.spec.ts` | Expectativa de cinco completas superada: cinco tienen 276 px de scroll en el modo B12. Artefactos nuevos redirigidos a `b12/b11-regression`/`b12/b10-regression`; baselines/capturas históricas B10/B11 conservados. Ensayo de teclado espera cierre efectivo del diálogo y confirmación de dirección/botón habilitado; incluye ack retenido a 1280. Las aserciones funcionales permanecen. |
| README / especificación / proceso | Estado vigente, instrucciones para revisar y evidencia nueva; históricos separados. |

No se modificaron servidor, contratos, dominio/aplicación, puertos/adaptadores/composición, GameCard, acciones, RoundReview, JSON o recursos aprobados. No hay endpoints ni datos adicionales de partida. Revisión semántica: la proyección solo consulta valores públicos/ranking y mantiene `play.order`, identificación y modos; las claves por jugador conservan los nodos/trigger de Detalles. No declara un líder/resultado provisional ni toca adquisición de la mano. Los timers y decisiones siguen en el servidor.

La consulta CSS `@container game-table (min-width:1368px)` considera el contenido real después de padding y reserva de scrollbar, en lugar de un breakpoint nominal de ventana. En la mano centrada se elimina únicamente la reserva lateral `scrollbar-gutter:stable` innecesaria: permite790 px útiles reales para tres cartas sin ocultar su scroll en tamaños menores. No fija alturas ni recorta revisión/avisos/textos excepcionales.

### Entorno y ejecución nueva

06/10/2026, Windows/PowerShell, Europe/Madrid (UTC+2), aplicación0.1.0, Node24.13.0, npm11.6.2, Chrome instalado (`channel:chrome`), Playwright1.63.0, Vitest5.0.2. Contextos de navegador con viewport1920×1080/950 CSS, zoom normal100 %, DPR1 y `visualViewport.scale=1`; no monitor físico acreditado.

| Comando/etapa | Resultado realmente ejecutado |
| --- | --- |
| `npm run build` en base B11, antes de editar producto | Correcto, `b12-base-build.log`. |
| `B12_CAPTURE_BASE=1`; `npx playwright test tests/browser/centeredTable03.spec.ts --workers=2` | **2/2**, 7,8 s, seis capturas/JSON previos. `b12-base-browser.log`. Variable retirada después; guardia de fuentes B11 normalizadas LF SHA-256 `47abd90c663ffc560b9d5fcfa40aca331958fdc88b18a9ea6b2baf074343c962`. |
| Build de edición + `npx vitest run src/publicPlays.test.ts` | Correctos; **5/5**, 215 ms, `b12-edit-build.log`/`b12-projection-focal.log`. |
| `npx playwright test tests/browser/centeredTable03.spec.ts tests/browser/pcTable02.spec.ts --workers=2` | **8/8**, 18,4 s, `b12-layout-focal.log`: primeros dos B12 +seis regresiones B11. |
| Tipo/lint focales | Correctos, `b12-type-focal.log` y `b12-lint-focal.log`. |
| Ampliación a ocho B12 | **5/8**, 34,3 s, `b12-interaction-focal.log`. Tres fallos de selectores nuevos: encabezado ambiguo h2/h3 del diálogo y `.first()` que señalaba otra carta tras ordenar. Se fijó h3 y carta por ID; sin cambiar comportamiento para superar el ensayo. |
| `npx playwright test tests/browser/centeredTable03.spec.ts --grep 'E1\|E5' --workers=2` | **3/3**, 12,5 s, `b12-interaction-repair.log`: ambas direcciones/foco/quinta y scroll consultado ante quinta remota. |
| Inspección adicional del pie/visibilidad y comparación | **2/2**, 8,3 s, `b12-visual-title-focal.log`: comprobación explícita de Mesa visible y capturas equivalentes; no reparación de producto. |
| `npm run check` antes del ajuste de ensayo | Correcto: **413/413 en 39 archivos**, tipos/lint/build/catálogo y **65 módulos** sin imports prohibidos/ciclos; 30,04 s. `b12-final-check.log`/`b12-final-check-time.log`. |
| Navegador compilado, siete archivos seleccionados | **77/78**, 19:13:54–19:20:21, **386,36 s** incluyendo build (Playwright 6,4 min). Falla únicamente Space en acceso B11 de 1280; los ocho B12 y los casos de juego/tiempo/bots seleccionados pasan. `b12-final-browser.log`/`b12-final-browser-time.log`. |
| Diagnóstico/reparación del ensayo | Primer intento con ack retenido **5/6**, 22,9 s; diagnóstico aislado **0/1**, caso de 6,7 s; espera del diálogo pero pulsación sobre deshabilitado **1/2**, 8,9 s. Los eventos registran Space en «Cerrar detalles», no en «Jugar carta»: intentar enfocar el botón deshabilitado mantiene foco en Detalles y puede abrirlo. Se elimina esa pulsación imposible, se espera confirmación/habilitación y desmontaje del diálogo, conservando foco/envío único y comprobación de pending. Sin cambiar producto. `b12-browser-confirmation-repair.log`, `b12-keyboard-diagnostic.log`, `b12-keyboard-dialog-repair.log`. |
| Reparación focal definitiva | **2/2**, 5,1 s, móvil/tacto y PC/teclado con ack retenido, `b12-keyboard-enabled-repair.log`. |
| **`npm run check` final en `5c97512`** | **Correcto: 413/413 en 39 archivos**, tipos/lint/build/catálogo y **65 módulos** sin imports prohibidos/ciclos. 19:27:01–19:27:27, **26,84 s** totales; Vitest 11,60 s. `b12-close-check.log`/`b12-close-check-time.log`. |
| **Navegador compilado final en `5c97512`** | **28/28**, ocho B12 + seis B11 + catorce B10. 19:27:38–19:28:33, **54,40 s** incluyendo build (Playwright **49,4 s**). `b12-close-browser.log`/`b12-close-browser-time.log`. |

Selección amplia sobre el producto `6396ae2` (resultado 77/78 indicado arriba):

```powershell
npm run test:browser -- --workers=2 tests/browser/centeredTable03.spec.ts tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/bots.spec.ts
```

Cierre tras reparar únicamente el ensayo, en `5c97512`, sobre la misma presentación compilada:

```powershell
npm run check
npm run test:browser -- --workers=2 tests/browser/centeredTable03.spec.ts tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts
```

Los otros cuatro archivos no se repitieron por rutina: sus 50 casos ya pasaron sobre producto idéntico, con ambas aperturas, recuperación/pérdida de confirmación, permisos/privacidad, respuestas antiguas frente a otra sala, revisión cero/positiva, tiempo controlado y partidas completas normales/finales/desempates/bots. Son evidencia nueva B12, diferenciada de históricos. No se presenta el primer comando como 78/78 ni se suma la repetición para fabricar un total de una ejecución. La puerta final afectada es 28/28.

El intento de `npm run start` adicional recibió `EADDRINUSE`: ya existía un servicio en3000, que continuó vivo. Se verificó a las19:13:54 el cliente realmente servido: `/assets/index-tvj-RpPF.js`, SHA-256 `504bf118b967d4a620a87610df8c80b77ef59964dcc79aff04fe93e961371194`; `/assets/index-DbmkoiLU.css`, `83f310810f93302aae916779e3c2a3b8b542a21851174d0ae6c212c856a09404`; **bytes idénticos al build actual**. Backend/contratos sin cambios. `/api/decks` ofrecía únicamente genérica formato1/contenido2, sin paquete completo. Evidencia `b12-served-evidence.log`. No se afirma haber reiniciado ese proceso ni desplegado otra instancia.

### Comparación visual y medidas

Antes/después con idénticos viewport/zoom, genérica2, cinco humanos y nombres, permiso/selección reales y acciones legales. Solo se sustituyen entropía por una permutación completa válida y reloj/planificador para estabilizar estados. Las primeras cartas tienen J activo recibidos31/54/35/50/56; la indicadora activa círculo. No se editó genérica ni se publicó fixture. Las conexiones HTTP/Socket.IO son reales. Otras regresiones normales usan servidor/entropía/relojes normales; esa evidencia se distingue de las capturas controladas.

Artefactos locales ignorados, separados de B10/B11: [`before`](../../playwright-report/b12/before/) y [`after`](../../playwright-report/b12/after/), con JSON, PNG del viewport y de toda la página. Comparación con las tres referencias de Diseño inspeccionadas: turno de cuatro, revisión de cinco y quinta consultada. Coinciden composición/espaciado/orden/consulta; cambian por decisión escrita la línea de atributo retirada y los encabezados compactos/centrado de «Tu mano». Las maquetas usan bots/nombres/atributo/tiempos de ejemplo; las capturas usan humanos, círculo y sus valores reales. No se copiaron leyendas auxiliares de maqueta ni se modificó RoundReview para igualar su altura.

| Medida nueva en1920 | Resultado |
| --- | --- |
| Contenedor /centrado | **1400 px**, x260; márgenes exteriores260/260. Cabecera/avisos/leyenda dentro del mismo ancho. |
| Grid /columnas /gap estructura | **1368 px**, x276; **264/816/264**, equivalente a cinco264 con cuatro gaps12. |
| Paneles | Jugadores/indicadora264; Mesa1092; mano816; estado264. Observador: estado1092 en columnas2–5, sin mano/acciones. |
| Carta /contenido | **230×321**, sin estirar manos1/2; nombre16, valores14, imagen78/neutro76 y Detalles/acción B11 conservados. |
| Mesa cuatro /cinco | **clientWidth1066**, scrollWidth1066 con cuatro; **1342** con cinco. Scroll final **276 px**. Cuarta completa a cero; quinta/autor/Detalles completos al final. |
| Mano de tres | **clientWidth=scrollWidth790**, scroll0; espacios **46 px** entre cartas, acciones exteriores230×48. Inicio de carta17 px desde panel/columna; públicas/propias alineadas por columnas. |
| Encabezado inferior | Altura de título27 y separación elegida8 (+4 de fila); `min-height:0`, sin reserva vacía68. Offset panel→carta **85→52**, título→carta **45→12**: **ahorro local33 px**. |
| Alineación vertical | Indicadora/mano y589,11 en turno, y644,11 en revisión; diferencia real **0 px**, tolerancia2. Título de mano centrado. |

Separación entre ahorro local y altura total, en estados equivalentes:

| Viewport/estado | Shell antes→después, px | Página antes→después, px | Residual vertical antes→después, px |
| --- | --- | --- | --- |
| 1920×1080, turno/cuatro | 1065,11→**1032,11** | 1080→1080 (altura mínima de página) | **0→0** |
| 1920×950, turno/cuatro | 1065,11→**1032,11** | 1065→1032 | **115→82** |
| 1920×1080, revisión/cinco | 1242,55→1242,55 | 1243→1243 | **163→163** |
| 1920×950, revisión/cinco | 1242,55→1242,55 | 1243→1243 | **293→293** |

La revisión conserva su listado completo y domina la fila inferior con609,44 px de estado; por ello el ahorro local de33 no reduce la página en esa muestra. Maqueta de revisión1187,55 y resultado1242,55 no son el mismo contenido: la aplicación muestra además su aviso real de resolución y nombres/datos de la partida. El turno sí pasa de1065,11 a1032,11. Los PNG de viewport950 dejan ver contenido inferior pendiente de consultar; los PNG full lo muestran íntegro. No hay recortes ni zoom reducido para ocultar el residual.

Muestras de ancho con `scrollbar-gutter:stable` añadido **solo al montaje de prueba**, reservando15 px verticales:

| Viewport | Ancho disponible real | Shell/grid | Resultado |
| --- | --- | --- | --- |
| 2560 /1420 | 2545 /1405 | 1400/1368 | Mismo modo centrado, sin expansión. |
| 1400 /1399 | 1385 /1384 | 1385/1353;1384/1352 | Fallback B11; no activar columnas fijas por ancho nominal. |
| 1280×950 | 1265 | Adaptación previa | Página1065/residual115; mano58 y Mesa33 de overflow en cuatro jugadas, independientes; Detalles/foco accesibles. |
| 390×844 | 375 | Adaptación móvil previa | Página2057/residual1213; scroll mano394/Mesa591 con cinco humanos/cuatro jugadas; sin overflow horizontal global. |

Las regresiones adicionales conservan el acceso pedido **1280×800/390×844** y otros tamaños anteriores. La fila pública se ordena en la vista compartida, sin rediseñar su composición móvil ni renumerar `play.order`. No se promete nueva ventana única, ocultación de mensajes o nuevas dimensiones para tamaños inferiores.

### Criterios y ejemplos

| Criterio | Evidencia ejecutada |
| --- | --- |
| B12-01 | Dos comparaciones1920 y anchos2560/1420/1400/1399 con reserva15: geometría exacta, centrado, gaps12/46, carta230×321, quinta sin ampliar panel. |
| B12-02 | Cuatro completas/cinco con overflow de 276 y región con nombre/ayuda. Flechas reales de teclado, rueda horizontal y swipe CDP consultan quinta; autor/Detalles/foco presentes, sin mover mano/página horizontal ni enviar jugadas. |
| B12-03 | Tres completas con adquisición comparada con HTTP y botones nativos; regresión B11 traza legal a manos2/1 sin estirar. Observador de tres sesiones, estado1092, mano privada vacía y cero acciones. |
| B12-04 | Línea invisible solo en modo centrado, atributo/datos de contrato/cartas/turno conservados; título centrado, min-height0, offset85→52 y ahorro33 medido. |
| B12-05 | Cinco pruebas puras con objetos congelados y ocho B12 de navegador. E1 ALTO54/50/35/31; E2 BAJO31/35/50/54; E3 ranking confirmado56/54/50/35/31 y quinta consultada; E4 parcial solo propia recuperable, dirección pública null, sin envío/renovación. |
| B12-06 | E5: foco/diálogo por carta al insertar otras, retorno a trigger y scroll12/276 conservado en vistas remotas; E6: F5/segunda pestaña/observador. Regresiones de ambas aperturas, bloqueos, privacidad, revisión0/positiva, plazos/recuperación/final/desempate/bots en puerta seleccionada. |
| B12-07 | Seis pares antes/después, tres referencias inspeccionadas, medidas de carta/panel/encabezado y tablas de residual; otras anchuras y accesos previos sin rediseño. |
| B12-08 | Check final 413/413 y arquitectura 65 más revisión semántica; puerta final afectada 28/28, con 77/78 y reparación anterior registrados. Los otros 50 casos pertinentes pasaron sobre producto idéntico. Aprobación visual humana pendiente. |

### Límites e instrucciones para autor/coordinación

La referencia normal sigue230×321; textos excepcionales conservan el crecimiento B11, sin recortar unidades ni reducir imagen/valores. Hay scroll vertical autorizado, especialmente durante revisión, avisos o equipos con menor altura. La condición de ancho usa área disponible; un viewport nominal1400 con scrollbar puede necesitar fallback, y eso no es un cambio de tamaño de carta.

Pruebas/capturas por automatización, inspección técnica de imágenes y reloj controlado no acreditan recorrido humano, dispositivo físico, comprensión/equilibrio ni media hora real. No se reejecutó en esta selección el vencimiento real desconectado15 s/reserva real30 s; se conservan esas pruebas y evidencias históricas, sin atribuirlas a B12. C09–C10 siguen **parciales**. La revisión visual del autor se registrará cuando ocurra.

Seguir README «Revisar B12»: dos perfiles independientes y una segunda pestaña; cinco plazas con humanos/bots existentes, ALTO/BAJO, quinta por Tab/flechas/Detalles/Escape y rueda/gesto; F5/parcial/revisión0/positiva; observador con A/B/C y manos variables. Registrar versión, viewport real, zoom100 %, pantalla/escala/barras, scroll residual y conformidad/diferencias. Se facilitan capturas de turno/revisión/quinta en ambas alturas; no obligar al autor a ocultar barras o cambiar zoom. Para otra partida usar retorno/nueva sala; reinicio solo limpia toda memoria.

**Coordinación:** B12 solo presentación, base y cambios anteriores, ahorro local33 px y residual medido, sin nueva regla/contrato. **Diseño:** contrastar realización1400/1368/cinco264 y gaps12/46, cuatro públicas/quinta lateral, encabezados compactos/linea retirada y scroll vertical autorizado; maquetas son referencia, no aprobación del resultado. **Arquitectura:** actualizar descripción de aplicación §7 para orden público por J y ranking confirmado durante revisión, sin cambiar orden oficial/mano/ganadores/privacidad; infraestructura no necesita nuevos puertos ni datos. Responsables actualizan sus fuentes; aquí no se editaron TFM/Diseño. Pendientes: aprobación visual del autor, diseño posterior de tamaños inferiores y C09–C10 restante. Commits locales; sin push/PR/despliegue ni otro bloque.
