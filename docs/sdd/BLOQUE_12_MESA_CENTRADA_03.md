# B12 — Mesa centrada 03

**Estado:** acordado para implementación el 06/10/2026 por el autor. Especificación preparada; código y comprobaciones B12 pendientes.
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

- [ ] **B12-01:** medidas 1400/1368/264/816/1092, cartas de referencia 230×321, gaps 12/46 y centrado/alineación dentro de 2 px. Mantener ancho con ventana mayor y con quinta jugada; considerar scrollbar vertical.
- [ ] **B12-02:** cuatro cartas públicas completas sin scroll necesario; quinta completamente consultable con autor/Detalles, ayuda solo con overflow y acceso por teclado/ratón/táctil. No scroll horizontal global, desplazamiento de mano ni envío por deslizar.
- [ ] **B12-03:** tres propias completas y botones exteriores; una/dos desde la izquierda, adquisición intacta. Observador con redistribución existente, información pública y ausencia de mano/acciones.
- [ ] **B12-04:** línea eliminada y ninguna reserva vacía de 68 px; «Tu mano» centrado/cercano, indicadora/mano alineadas. Ahorro local de encabezado positivo medido frente a base en estado equivalente, sin cambiar cartas/fuentes/contenido.
- [ ] **B12-05:** E1–E4, atributo correcto, datos Dato/J distintos y nueva jugada verificados. Revisión respeta ranking confirmado; ninguna mutación de orden oficial, puntuación, mano o resultado, ni revelación de parcial privada.
- [ ] **B12-06:** foco/Detalles/scroll durante reordenación, ambos órdenes de apertura, turno posterior, bloqueos, recuperación/varias pestañas y revisión cero/positiva conservados. Sin reinicios de plazo ni dobles envíos.
- [ ] **B12-07:** comparación con las tres referencias, medidas antes/después y residual vertical a 1920×1080 y 1920×950 de viewport, zoom100 %. Comprobar también ancho mayor/menor y acceso existente a 1280×800/390×844, sin exigirles rediseño ni encuadre completo.
- [ ] **B12-08:** check, navegador pertinente y revisión arquitectónica/semántica registrados con resultados nuevos. Separar verificación técnica de aprobación visual humana; C09–C10 permanecen parciales.

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

**Preparación ejecutada:** lectura de fuentes/código/contratos, inspección de referencias y estado Git; redacción SDD. Sin código de producto ni pruebas ejecutadas en este hilo. **Cambio de código, pruebas B12, revisión arquitectónica de implementación y aprobación visual:** pendientes. Entregar después conclusiones para coordinación/Diseño/Arquitectura y límites de adaptación; sin publicación/despliegue.
