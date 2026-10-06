# B11 — Ajuste de mesa PC 02

**Estado:** presentación y dimensiones de referencia aprobadas el 06/10/2026; especificación preparada para implementación. Presupuesto calculado de referencia; encuadre y medidas del resultado pendientes de comprobar. No implementado ni verificado.
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

- [ ] **B11-01:** viewport efectivo de referencia 1800×1600 y cartas exteriores 230×321 CSS px registrados; balance real de ancho/alto cerrado con déficit cero para juego normal, o alternativa mínima aprobada antes de sustituir tamaño. Comparar también dimensiones de base sin atribuirlas al nuevo objetivo.
- [ ] **B11-02:** apertura y turno posterior muestran simultáneamente todos los elementos/acciones y leyenda en el área de referencia al 100 %, sin desbordamiento vertical/horizontal de página ni scroll lateral necesario de mano. No basta scrollX/scrollY = 0: comprobar cajas visibles y scrollHeight/scrollWidth frente al viewport. Mesa admite hasta cinco cartas. Capturas de viewport completo, no recortes que oculten elementos fuera.
- [ ] **B11-03:** composición, cartas comunes, autores/pie Mesa, BF/BD/abridor/activo/observador, tabla/Detalles y turno corresponden a P02-01–08; mano de una/dos no se estira. Tolerancia geométrica de alineación 2 px.
- [ ] **B11-04:** ejemplo con roundAttribute = atributo2 y atributo activo = atributo1: icono propio triángulo, fila círculo activa. Otro fixture tiene displayValue distinto de playValue y unidad: Dato/J no se intercambian ni se deduplican. Sin alterar barajas oficiales.
- [ ] **B11-05:** ambas aperturas, superficie/botón exterior/teclado, Detalles/foco y arrastre comprobados; un gesto genera una elección, sin doble envío. Fuera de turno/pendiente/desconectado/automático bloquean igual que antes.
- [ ] **B11-06:** privacidad, recuperación, plazos/avisos y revisión cero/positiva preservados; fase final/desempate, bots y observador con manos 1–3 conservados. Estados excepcionales muestran mensajes completos y límites documentados.
- [ ] **B11-07:** antes/después en igual área útil/zoom/estado, muestras de dos/cinco jugadores, nombres repetidos/largos, imágenes nulas/reales. Regresión funcional en móvil existente 390×844 y PC 1280×800; sin exigir encuadre nuevo en ellos ni cambiar espera/resultados.
- [ ] **B11-08:** check/navegador pertinente pasan y evidencia nueva revisada; aprobación visual posterior del autor separada del cierre técnico.

Reutilizar escenarios de `tableLayout.spec.ts`, `initialGame.spec.ts`, `manualGame.spec.ts`, `timedGame.spec.ts` y `bots.spec.ts`. Las comparaciones B10 congelaban contenidos/estilos que **ahora cambian expresamente**: conservar esa referencia histórica y ajustar solo expectativas superadas, con comprobaciones B11 específicas; no regenerar el baseline antiguo ni retirar garantías funcionales.

Capturar base antes de editar y resultado con iguales condiciones de viewport 1800×1600, zoom y estado; conservar medidas de cartas, cabecera, filas/columnas, acciones, leyenda y altura total. Escenarios con reloj controlado sirven para comparación estable, no acreditan navegador físico ni permiten pausas/reglas nuevas en producción. La automatización con viewport 1800×1600 puede acreditar el encuadre geométrico de referencia; registrar separadamente el área real de cualquier prueba física. Una prueba en pantalla 1920×1080 no tendrá 1600 px útiles de alto y no equivale a esta referencia. El autor revisará después el resultado; registrar cualquier desplazamiento observado en su equipo como pendiente para adaptación posterior, sin cambiar por iniciativa propia las dimensiones acordadas.

Ejecutar en implementación `npm run check` y `npm run test:browser -- --workers=2` con archivos nuevos/afectados y regresiones pertinentes citadas; registrar selección exacta, entorno, revisión de código, resultados y fallos reparados. No repetir baterías completas por rutina ni atribuir las 408/64 de B10 a B11. C09–C10 siguen parciales, sin acreditar equilibrio/comprensión/dispositivos nuevos.

## Pendientes y cierre

Las dimensiones de referencia están cerradas por el autor: **1800×1600 de área útil de diseño y 230×321 de carta**. No quedan preguntas bloqueantes sobre medidas. Registrar navegador/viewport y cajas reales como parte de implementación, verificar el presupuesto calculado y consultar solo si aparece una incompatibilidad concreta. La cobertura de equipos y resoluciones inferiores no está acreditada por esta elección.

Código, capturas/medidas del resultado y pruebas B11: pendientes. Esta preparación solo consulta documentos/código/imágenes y redacta SDD; no implementa ni ejecuta pruebas del producto. Registrar después déficit/alternativa si procede, evidencia técnica y revisión visual del autor. La adaptación a otras resoluciones se acordará tras esa revisión. Sin edición de fuentes generales ni publicación.
