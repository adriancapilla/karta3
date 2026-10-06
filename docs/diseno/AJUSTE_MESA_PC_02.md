# KARTA3 — Ajuste de mesa PC 02

## Encargo aprobado y estado

06/10/2026. Entrega de Diseño a SDD para preparar la siguiente especificación, **todavía sin implementación ni verificación**. El autor aprueba trabajar primero la mesa en ordenador, con pantalla de referencia **1920 × 1080 y zoom del navegador al 100 %**. Una vez implementada y revisada con él, se diseñará la transformación a resoluciones verticales u otras proporciones.

Base consultada: HEAD local `09f4e5bff86a499cbcb66df29beafc27275c55b8`, con B10 presente. Antes de esta entrega, `git status --short` solo mostraba `docs/diseno/` sin registrar. No se presupone que este HEAD sea `main`, esté publicado o sea exactamente la versión de cada captura del autor.

Se conserva la composición de B10: jugadores y mesa en la fila superior; indicadora, mano y estado del turno en la inferior. Ahora se autorizan los ajustes concretos de espacio, presentación de carta y simplificación de etiquetas descritos aquí. Las restricciones de la entrega 01 que impedían esos ajustes son históricas para este nuevo encargo.

**Objetivo:** durante un turno humano normal, ver simultáneamente mesa pública, las tres cartas completas de la mano con sus acciones, indicadora, atributo activo, dirección, jugador activo y tiempo restante, sin desplazamiento vertical ni lateral para jugar en la configuración de referencia. No resolverlo mediante zoom, pantalla completa obligatoria, recortes o ocultación de datos.

## Fuentes y referencias

- [Entrega de Diseño 01](DISENO_MESA_JUGABLE.md) y [B10](../sdd/BLOQUE_10_REDISTRIBUCION_MESA.md): antecedentes y composición conservada.
- [AGENTS](../../AGENTS.md), [proceso SDD](../sdd/PROCESO_SDD.md) y [dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md).
- [Contexto](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), [aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§7–12, y [dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), si surge una duda de reglas.
- [GameScreen](../../src/GameScreen.tsx), [GameCard](../../src/GameCard.tsx), [RoundReview](../../src/RoundReview.tsx), [estilos](../../src/style.css) y [contrato de partida](../../shared/contracts/game.ts).

Capturas aportadas por el autor, guardadas como **situación anterior al ajuste**, no como imágenes del resultado esperado:

- [Vista superior de PC](referencias/ajuste-pc-02/antes-pc-vista-superior.png): cabecera alta, lista extensa y mano fuera del primer encuadre.
- [Carta 34, mano y estado](referencias/ajuste-pc-02/antes-pc-carta34-y-mano.png): **Carta 34 es la referencia inicial de tamaño exterior**. También muestra la tercera carta cortada y filas de atributos que ocupan más de una línea.
- [Revisión de ronda](referencias/ajuste-pc-02/antes-pc-revision.png): caso para conservar comunicación de revisión y comprobar el comportamiento con dos cartas restantes.

Los bocetos anteriores siguen enlazados en la entrega 01. Orientan la posición de los bloques; esta entrega escrita fija los cambios aprobados. No se genera una nueva imagen idealizada: la siguiente referencia será una captura de la implementación real. Los tiempos, nombres y repartos de las capturas son ejemplos, no datos que deban fijarse en producto.

## Distribución y presupuesto de espacio

| Zona | Relación aprobada |
| --- | --- |
| Cabecera | Compacta; conserva baraja y versión, ronda, mazo restante y fase cuando corresponda. |
| Fila superior izquierda | Lista compacta de jugadores y puntuaciones; observador aparte. |
| Fila superior centro/derecha | Mesa pública, con cartas alineadas arriba y nombres de sus autores debajo. |
| Fila inferior izquierda | Indicadora completa, con su nombre de sección y «Atributo indicador: …». |
| Fila inferior centro | Mano en fila, hasta tres cartas del mismo tamaño, con «Jugar carta» fuera y debajo de cada una. |
| Fila inferior derecha | Estado del turno, más estrecho, con dirección y temporizador. |
| Pie | Leyenda compacta de abreviaturas. |

### Ancho

La mesa debe utilizar el ancho de ventana que necesite. El máximo actual de `.game-shell` es 1280 px; la entrega autoriza retirar o ampliar esa restricción **en la mesa**, para evitar márgenes laterales grandes mientras se corta la tercera carta. No aplicar este ajuste a sala de espera, portada o resultados.

Dimensionar las columnas para reservar indicadora, tres cartas de mano completas, panel de turno, márgenes interiores y separaciones. El centro recibe el espacio necesario para las tres cartas; no imponerle una proporción que provoque desbordamiento cuando sobra ancho en la ventana. Las cartas no se estiran para rellenar el sobrante. Comprobar también la mesa con hasta cinco cartas públicas, sin cambiar su orden.

En la configuración de referencia no debe ser necesario desplazar horizontalmente la mano. Conservar el mecanismo de desplazamiento para cuando el espacio sea insuficiente en otros tamaños, sin desplazamiento horizontal de toda la página.

### Altura y cabecera

1920 × 1080 es la resolución de pantalla de referencia, **no una promesa de 1080 px útiles para la aplicación**. Registrar tamaño real de la ventana de contenido en píxeles CSS, escala del sistema, zoom y barras del navegador. La comprobación principal debe reproducir el navegador normal del autor, sin depender de F11 o de ocultar sus barras. Una prueba automatizada con viewport 1920 × 1080 puede complementar esa evidencia, no sustituirla.

Reducir espacios exteriores, separaciones entre bloques y altura de cabecera antes de reducir la letra de los valores. Compactar la presentación repetida de marca/título conservando identificación de baraja y versión; ronda y mazo permanecen en cabecera. No moverlos al panel de turno en este encargo.

SDD debe establecer un presupuesto verificable: cabecera/avisos, fila superior, separación, fila inferior, acciones exteriores y leyenda. Tomar Carta 34 como tamaño exterior inicial y registrar el ancho/alto de referencia en píxeles CSS al 100 %. No deducir una medida normativa únicamente de una imagen que puede estar recortada o escalada.

Mantener ese tamaño en la primera implementación. Si la medición demuestra que conservarlo impide el encuadre simultáneo aun tras los ajustes autorizados, SDD debe exponer el déficit de píxeles y la alternativa mínima al autor antes de especificar otra dimensión. No cerrar como conseguido el objetivo si requiere desplazamiento o zoom. No forzar alturas mediante contenido oculto.

El objetivo de ventana única se refiere a juego normal. Revisión, advertencias largas, errores y nombres o datos excepcionales conservan su contenido; pueden requerir crecimiento o desplazamiento, que debe quedar documentado. El panel de estado no tiene una altura máxima que recorte mensajes.

## Cambios de presentación aprobados

### P02-01 — Jugadores

- Sustituir el listado espacioso por filas compactas de nombre y puntos, manteniendo el orden de jugadores existente. Sin numeración de posición visible en este listado; no cambiar la clasificación final.
- Conservar `(tú)` en la identidad propia y el mecanismo actual para distinguir nombres repetidos.
- Eliminar la etiqueta visible «Anfitrión» durante la mesa. Es una decisión de presentación, no un cambio de rol, permisos o comportamiento.
- Mostrar `BF` para EASY y `BD` para HARD a continuación del nombre, sin las cápsulas grandes «Bot · Fácil/Difícil». No renombrar los bots ni cambiar dificultades/códigos.
- Eliminar la cápsula «Abridor». Marcar la fila del abridor con un sombreado suave de fondo, manteniendo texto oscuro legible. La identificación accesible de abridor sigue disponible.
- Diferenciar al jugador activo del abridor: conservar una indicación compacta «Juega» junto al jugador actual, además del nombre en el panel de turno. No usar el sombreado de abridor para indicar turno activo; ambos roles pueden coincidir o ser distintos.
- El observador se muestra aparte, sin número, puntos o plaza de jugador, como `Nombre (O)`; conserva `(tú)` cuando corresponda y la indicación propia «Observando».
- «Sin conexión» y «Automático» conservan su significado y comunicación cuando correspondan. No abreviarlos, confundirlos con BF/BD ni suprimirlos por falta de espacio. Pueden ocupar una línea de estado adicional en la fila afectada.
- Reducir separaciones y márgenes; nombres y puntos deben poder leerse al 100 %. No convertir el listado en botones ni añadir acciones de gestión durante la partida.

### P02-02 — Mesa pública

- Reemplazar el título «Cartas jugadas» por **«Mesa»** y situarlo al pie del bloque, con poca altura y conservando la asociación accesible de la sección.
- Alinear las cartas al principio del bloque con el padding necesario; no reservar una banda grande de título encima.
- Quitar la numeración anterior al autor de cada jugada. Mantener orden de jugadas y asociación carta/jugador.
- Colocar el nombre de quien jugó **debajo de su carta**, en letra algo menor que la información de la carta. Los pies y el rótulo Mesa pueden compartir la banda inferior si no se confunden entre sí.
- Con cero jugadas, conservar un mensaje de mesa vacía compacto. Reservar una altura estable para la fila de cartas, evitando que cada jugada desplace la mano y sus botones. No imponer la altura de la antigua lista espaciosa de jugadores.
- No incorporar resaltado de la carta que va ganando.

### P02-03 — Carta común e icono indicador

- Carta 34, en la captura enlazada, fija la referencia inicial de tamaño exterior. Indicadora, cartas públicas y cartas de mano usan ese mismo tamaño en PC. Con una o dos cartas de mano no aumenta su ancho; conservar orden de adquisición.
- Nombre arriba a izquierda, en negrita y algo menor que el actual. SDD concreta la reducción local y la registra; no reducir globalmente fuentes de todas las pantallas.
- Arriba a derecha, a la misma altura, mostrar **solo el icono del atributo indicador propio de esa carta**, obtenido de `card.roundAttribute`. No obtenerlo del atributo activo de la ronda. Conservar correspondencia de símbolos actual: círculo, triángulo y cuadrado para los atributos de la genérica; no atribuirles nuevas reglas.
- El atributo activo sigue procediendo del servidor (`round.activeAttributeId`). En la indicadora coincide con su icono propio; en otras cartas puede diferir. Deben poder distinguirse en un caso de prueba.
- Dar significado accesible al icono propio, por ejemplo «Atributo indicador: [nombre]», sin introducir otra línea visible. El encabezado debe admitir nombre e icono sin solaparlos.
- Mantener el tamaño actual de imagen o icono neutro, con/sin imagen y manejo actual de fallo. No generar imágenes de baraja ni cambiar el contenido.

### P02-04 — Tabla de atributos

- Orden de columnas: **Atributo | Dato | J**.
- `Dato` conserva `displayValue` y su unidad literal. `J` conserva `playValue`, el valor usado para comparar. Mostrar ambos también cuando sean iguales en la genérica.
- La columna J es estrecha y sus números se alinean **a la derecha del contenido interior de la carta**. Dato queda antes de ella y recibe más espacio; atributo conserva icono y nombre juntos.
- Cada fila de la genérica debe ocupar una sola línea: icono + nombre, dato y J. Evitar que el icono de Cuadrado quede encima del nombre o que se parta el encabezado J. Redistribuir columnas antes de reducir la letra de los valores.
- Eliminar la palabra visible «Activo» y su línea adicional. Mantener el fondo naranja de la fila activa; añadir una pequeña marca no textual y una identificación accesible, para reconocerla sin depender solo del color. No confundir esta marca con el icono indicador de la esquina.
- No abreviar unidades, truncar valores ni ocultar atributos para conseguir la línea única. Las barajas temáticas no se rediseñan aquí: SDD registra cómo se conserva texto más largo sin invadir J; un caso que requiera más altura es un límite que se revisará, no una autorización para perder contenido.

### P02-05 — Detalles

- Mantener el tamaño exterior de carta: el espacio vertical liberado por filas compactas se asigna a la zona inferior de Detalles.
- Detalles sigue siendo un botón de consulta a todo el ancho interior y **aumenta su altura**, ocupando ese espacio disponible. No hacer que toda la carta crezca por este cambio.
- Por ahora mantiene el texto «Detalles» y el diálogo informativo actual. Consultarlo no juega ni selecciona la carta y al cerrar devuelve el foco al control que lo abrió.
- Mostrar información relevante dentro de esa zona y ampliar el diálogo con atribución/origen de imágenes es una intención para barajas temáticas. No incluir contenidos nuevos, vacíos ficticios ni una plantilla temática en este encargo.

### P02-06 — Indicadora, mano y acción exterior

- Conservar «Carta indicadora» y «Atributo indicador: [nombre]» encima de la indicadora completa.
- Conservar «Tu mano» y la ayuda «Desliza para ver tus cartas» cuando exista desplazamiento horizontal. En el PC objetivo con tres cartas completas no mostrar una instrucción de deslizar innecesaria. Alinear el borde superior de las cartas de mano con el de la indicadora mediante la distribución del encabezado, sin inventar texto para rellenar espacio.
- Situar **«Jugar carta» fuera del borde de cada carta y debajo de ella**, asociado con claridad a esa carta y ocupando su ancho. Detalles permanece dentro. Indicadora y cartas públicas no tienen ese botón.
- El traslado es visual y estructural: no cambia la acción de elegir/jugar, sus condiciones, la selección del abridor, el texto seleccionado ni el estado deshabilitado. No añadir confirmación ni segundo paso de envío.
- Conservar el gesto existente de pulsar la superficie jugable de la carta y el acceso con teclado. El botón exterior y esa superficie deben disparar la misma acción una sola vez; Detalles queda excluido de la superficie de juego. Deslizar/arrastrar para consultar otras cartas no debe disparar una jugada. SDD concreta la estructura accesible compatible, sin imponer un patrón de componentes nuevo.
- Las acciones exteriores ocupan una banda propia alineada entre las cartas. Incluirlas en el presupuesto de altura: sacarlas del borde no elimina su espacio.

### P02-07 — Panel de turno

- Mantenerlo a la derecha de la mano, en la fila inferior, con menor ancho para ceder espacio a las cartas.
- Distribuir verticalmente: `Juega:` y nombre debajo; `Tiempo de turno:` y tiempo debajo; abridor; atributo activo; dirección pública. Conservar dato y etiqueta inteligibles. Los valores pueden ir debajo de su etiqueta para evitar cortes en una columna estrecha.
- Cuando el abridor deba elegir, ALTO va encima y BAJO debajo; ambos botones ocupan el ancho disponible dentro del panel. Sin valor elegido por defecto.
- Distinguir dirección pública de selección parcial privada aceptada por el servidor. No eliminar el aviso de parcial propio ni presentar esa selección como pública.
- Buscar una altura comparable a la carta en juego normal, sin obligarla con un recorte. Revisión, envío, vencimiento, error, recuperación y demás avisos siguen en este panel o en su posición existente y pueden aumentar altura legítimamente.
- La revisión conserva su resultado y cuenta atrás propios; no mostrar a la vez un temporizador humano activo. No cambiar duraciones, reloj, autoridad o políticas de bots/automático.

### P02-08 — Leyenda

Pie compacto con **«J: valor jugable · BF: bot fácil · BD: bot difícil · O: observador»**. Se explican solo las abreviaturas incorporadas. No añadir asterisco de anfitrión/abridor u otros símbolos de papel en este encargo. La leyenda es complementaria: el significado debe seguir siendo accesible en el elemento correspondiente.

## Comportamiento y límites

Mantener reglas, privacidad, permisos, datos de transporte y autoridad del servidor. En particular: mano propia exclusivamente; observador sin mano ni acciones; selección carta/dirección en ambos órdenes para abridor; envío inmediato al completar ambas o al jugar después; parcial de dirección privado aceptado y carta local; ninguna actualización/recarga envía por sí misma ni renueva plazos. Conservar foco, selección y consulta de Detalles durante actualizaciones.

No cambiar lógica de `RoundReview`, temporización, bots, automático, puntos, fase final, desempate o resultados. El sombreado del abridor, la selección propia y el atributo activo tienen significados diferentes.

No diseñar en este encargo un modo nuevo de móvil/tableta/orientación vertical ni añadir parámetros elegibles por el anfitrión. Conservar adaptación y acceso funcional existentes fuera del PC de referencia. Los cambios en el componente de carta pueden reflejarse naturalmente en otros tamaños; comprobar regresión de acceso, no declarar que el diseño móvil quedó resuelto.

La sala de espera/configuración y el botón Iniciar partida quedan fuera. También quedan fuera el líder provisional de la mesa, animaciones, transiciones, marca definitiva, nuevas imágenes, contenido temático nuevo y un rediseño de resultados. Acotar los estilos de mesa para no alterar otras pantallas ni el diálogo de Detalles accidentalmente.

## Coherencia que debe resolver SDD

Aplicación §7 todavía menciona anfitrión y las etiquetas «Bot · Fácil/Difícil» en mesa. El autor **ha aprobado expresamente** eliminar la marca visible de anfitrión y presentar BF/BD con leyenda en esta vista. Registrar la decisión y comunicar al ámbito responsable el ajuste descriptivo necesario; no reinterpretar la fuente antigua como una preferencia visual más reciente ni reintroducir esas cápsulas. La identificación funcional de bots, dificultad, self, abridor y observador permanece; espera y resultados no se rediseñan.

SDD conserva la prescripción de pulsar carta para jugar y su separación de Detalles. El código actual incluye un botón que cubre la superficie de juego en `GameCard`; mover el rótulo/acción al exterior exige revisar ese solapamiento, no cambiar el modelo de juego.

El contrato ya entrega `CardView.roundAttribute`, `values.playValue/displayValue/unit` y `round.activeAttributeId`. El icono no necesita nuevos campos ni recuperar datos adicionales de la baraja. Las piezas previsibles son `src/GameScreen.tsx`, `src/GameCard.tsx` y estilos locales; implementación elige la separación mínima compatible. No cambiar contratos, JSON, servidor o reglas para resolver una presentación.

Si surge otra incompatibilidad real, explicar dato/regla afectados y resolverla con el autor antes de sustituir la decisión. No editar desde este encargo las fuentes generales de Arquitectura, Dominio, Aplicación o Infraestructura ni cierres históricos.

## Condiciones comprobables y entrega de implementación

SDD transforma P02-01–08 en criterios de aceptación y prepara ejemplos/pruebas proporcionales. Comprobar geometría y relaciones visuales, no solo existencia de textos:

1. **Encuadre principal:** pantalla física 1920 × 1080, navegador normal al 100 %, área útil medida; mesa, indicadora, tres cartas y botones de mano, atributo/dirección/jugador/tiempo visibles a la vez durante apertura y turno posterior. No scroll vertical ni lateral para jugar, corte de tercera carta o cambio de zoom. La leyenda forma parte de la altura presupuestada.
2. **Composición:** dos filas conservadas; cartas públicas arriba del bloque Mesa; autores debajo sin numeración; jugadores compactos. Indicadora y mano comienzan a la misma altura. Estado a derecha, ALTO sobre BAJO cuando se elige.
3. **Carta:** tamaño de referencia medido y registrado; todas iguales en PC, sin ensanchar mano de una/dos. Icono propio a derecha del nombre, imagen conservada, Atributo/Dato/J y fila genérica de una línea. Dato/unidad y J correctos, Detalles más alto dentro, jugar fuera.
4. **Datos diferentes:** probar una carta cuyo `roundAttribute` sea distinto de `activeAttributeId`; icono y fila activa muestran sus respectivos datos. Probar también `displayValue` distinto de `playValue` y una unidad, sin cambiar barajas oficiales.
5. **Interacción:** ambos órdenes de apertura, turno posterior, pulsación de carta y botón exterior, selección/deshabilitado/pendiente, Detalles y devolución de foco, arrastre sin jugar. No envío doble, confirmación nueva, parcial revelado o renovación de reloj.
6. **Variabilidad:** muestra de dos y cinco jugadores, nombres largos/repetidos, mano de una/dos/tres, cartas con/sin imagen, revisión, fase final/desempate, bot/automático y observador. Estados especiales conservan información y límites de altura quedan documentados; el observador no ve mano o acciones ficticias.
7. **Regresión:** muestra móvil del tamaño existente y otro ancho PC para detectar contenido inaccesible, superposiciones, foco perdido o desbordamiento de página. No son nuevos criterios de encuadre completo para esos tamaños. Espera y resultados conservan presentación/comportamiento.
8. **Evidencia real:** conservar capturas antes/después con igual área útil, zoom y estado controlado en apertura y turno posterior; una muestra de revisión y cinco jugadores. Añadir tabla breve de medidas de cabecera, cartas, filas, columnas y altura total, con diferencias justificadas. Comparar con las referencias de distribución y estas decisiones, distinguiendo capturas anteriores de resultado aprobado.

Aplicar las puertas de `AGENTS.md` y los recorridos de navegador pertinentes; separar pruebas previstas de ejecutadas. No introducir esperas artificiales o cambios de reglas para obtener una captura; se pueden usar escenarios controlados en pruebas, claramente identificados.

La entrega de implementación debe indicar qué cabe realmente, las desviaciones o límites y qué queda por revisar con el autor. «Implementado/verificado técnicamente» no equivale a aprobación visual del autor. Una vez él revise el resultado PC, se concretará la adaptación a otras resoluciones y los ajustes posteriores. Si el objetivo de encuadre falla, registrarlo y volver a Diseño con medidas; no atribuirle un cierre satisfactorio por haber movido los bloques.
