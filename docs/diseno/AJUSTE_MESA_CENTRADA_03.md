# KARTA3 — Mesa centrada 03: entrega acordada para SDD

## Estado y objetivo

06/10/2026. **Decisiones de Diseño aprobadas por el autor para preparar el siguiente incremento SDD; todavía sin implementación ni pruebas de producto.** Base local consultada: HEAD `c300fcac470f5c3cdebdb87d1f60856eeffd7784`, con B11 presente. Antes de esta entrega solo aparecía `docs/diseno/` sin registrar. No se presupone main, publicación o despliegue.

El autor aprueba la maqueta de cinco columnas centradas y añade un ajuste mínimo de altura: eliminar la línea «Atributo indicador: …» encima de la indicadora y acercar los encabezados inferiores a las cartas, manteniendo alineadas indicadora y mano. El incremento reúne esos cambios con la mesa de cuatro cartas visibles, quinta consultable lateralmente y orden visual de mejor a peor J.

Se conserva el tamaño de carta **230 × 321 píxeles CSS**, su contenido y las interacciones de B11. No se persigue otro rediseño general ni se reduce letra/cartas para forzar un encuadre completo.

**Cambio expreso respecto al objetivo de encuadre anterior:** el autor permite desplazar verticalmente la página para apartar la cabecera —marca, título y baraja— o consultar el pie/leyenda. No es obligatorio que toda la página quede visible simultáneamente. Se busca una zona de juego compacta que permita consultar mesa, mano y turno con comodidad; su viabilidad real en altura se medirá sin convertirla en una promesa universal de ventana única.

## Fuentes y referencias aprobadas

- [Maqueta y cálculo original](PROPUESTA_MESA_CINCO_COLUMNAS_03.md).
- [Turno del quinto jugador, cuatro cartas públicas](referencias/composicion-pc-03/mesa-cinco-columnas-turno.png): composición aprobada.
- [Revisión de cinco jugadas](referencias/composicion-pc-03/mesa-cinco-columnas-revision.png) y [detalle desplazado hasta la quinta](referencias/composicion-pc-03/mesa-cinco-columnas-quinta-carta.png): límite horizontal y consulta de todas las cartas.
- [Medidas de la maqueta anterior al ajuste de encabezados](referencias/composicion-pc-03/medidas-maqueta.json).
- [Diseño 02](AJUSTE_MESA_PC_02.md), [B10](../sdd/BLOQUE_10_REDISTRIBUCION_MESA.md) y [B11](../sdd/BLOQUE_11_AJUSTE_MESA_PC_02.md) como antecedentes; conservar cierres históricos.
- [AGENTS](../../AGENTS.md), [proceso SDD](../sdd/PROCESO_SDD.md), [aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) §§7–12 y [contexto](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md).
- [GameScreen](../../src/GameScreen.tsx), [GameCard](../../src/GameCard.tsx), [RoundReview](../../src/RoundReview.tsx), [estilos](../../src/style.css) y [contrato de partida](../../shared/contracts/game.ts).

**Diferencia deliberada con las imágenes:** todavía muestran «Atributo indicador: Cuadrado» y la banda alta de encabezado. En el producto del nuevo incremento esa línea desaparece y la banda se compacta según M03-03. No copiarla por fidelidad a la imagen ni dejar un espacio vacío de la misma altura. Las imágenes son maquetas, no capturas de la implementación aprobada. Nombres, valores y tiempos son ejemplos.

## Decisiones implementables

### M03-01 — Área centrada de cinco columnas

Aplicar en el modo PC con ancho suficiente una cuadrícula lógica de cinco columnas de **264 px**, separadas por **12 px**. Cada columna permite una carta de 230 más márgenes y bordes de referencia. Cuadrícula = `5 × 264 + 4 × 12 = 1368 px`. Contenedor con 16 px exteriores a cada lado = **1400 px**, centrado horizontalmente. Mantener su ancho cuando la ventana crece; no estirar Mesa o mano para rellenar toda la pantalla.

| Fila | Izquierda | Centro | Derecha |
| --- | --- | --- | --- |
| Superior | Jugadores: 264 px | Mesa abarca las cuatro columnas restantes: 1092 px | Continuación de Mesa |
| Inferior | Indicadora: 264 px | Mano abarca tres columnas: 816 px | Turno: 264 px |

Las tres columnas de estructura equivalentes son **264 / 816 / 264**, con dos gaps de 12: total 1368. Los gaps de 12 entre las cinco columnas imaginarias producen **46 px entre bordes de cartas** dentro de los paneles agrupados. Mantener esa alineación de cartas superiores/inferiores; no confundir ambos gaps.

La cabecera, avisos y pie siguen el ancho del contenedor centrado. Con ventana más ancha quedan márgenes iguales a izquierda/derecha. El tamaño de carta no aumenta con espacio sobrante ni cuando quedan solo una/dos cartas de mano.

Este modo requiere ancho útil suficiente para sus 1400 px, considerando scrollbar vertical si corresponde. En un ancho menor, conservar acceso y adaptación existentes sin introducir un nuevo diseño de móvil/tableta, ocultar controles o provocar desbordamiento horizontal de página. SDD define la condición técnica de aplicación por espacio disponible; no añadir opciones del anfitrión.

### M03-02 — Mesa de cuatro cartas y acceso a la quinta

- Mantener Mesa a ancho de cuatro columnas, aunque la ventana permita ampliarla. Hasta cuatro cartas visibles completas en esta configuración.
- Con cinco jugadas, conservar ese ancho y permitir **desplazamiento horizontal contenido de Mesa** para consultar la quinta carta y sus Detalles. No crear otra fila, ampliar el contenedor ni comprimir cartas.
- Los autores quedan debajo de sus cartas; «Mesa», al pie. Mantener una altura estable del bloque al añadir cartas para evitar que la mano y sus botones salten durante el turno.
- Con desbordamiento, usar la indicación compacta de la referencia: «5 cartas · desliza →», con significado accesible y consulta posible con teclado además de ratón/táctil. No mostrarla con cuatro o menos.
- La mano mantiene sus tres cartas completas y botones exteriores sin desplazamiento lateral en el modo de referencia. Con una/dos conserva posiciones desde la izquierda y orden de adquisición.
- El desplazamiento de Mesa no mueve la mano ni toda la página horizontalmente. Ningún gesto de desplazamiento selecciona o juega una carta.

### M03-03 — Compactar encabezados de la fila inferior

- Eliminar **la línea visible completa «Atributo indicador: [nombre]»** encima de la indicadora en este modo PC. Mantener el título «Carta indicadora», la carta y su icono indicador propio, así como el atributo activo del panel de turno y su resaltado en las cartas. No eliminar datos del contrato o de la carta.
- Acercar título y carta eliminando la banda de altura que reservaba esa línea. El estilo actual `.game-card-panel-heading` reserva `min-height:68px`: **no conservar esa reserva sin contenido**. Compactar conjuntamente el encabezado de indicadora y mano para que ambos tengan la altura necesaria de título y separación, sin otra línea ficticia.
- Centrar horizontalmente **«Tu mano»** dentro de su panel. Conservar texto y tamaño de letra actuales. «Carta indicadora» mantiene su colocación actual.
- Mantener el borde superior de la indicadora y de todas las cartas de mano a la misma altura, con diferencia geométrica máxima de 2 px. Sus botones de jugar permanecen fuera y debajo, como B11.
- Implementación elige la separación corta compatible con las medidas actuales, registra su valor y el ahorro real de altura. No cambiar fuentes, imagen, Detalles o dimensiones de carta para conseguir ese ahorro.
- Si en un ancho menor el mecanismo existente necesita la ayuda «Desliza para ver tus cartas», conservarla accesible. En el PC de tres cartas completas no hace falta mostrarla para rellenar la antigua banda de encabezado. No rediseñar aquí la indicadora compacta móvil.

### M03-04 — Orden visual de mejor a peor

Ordenar las cartas **públicas de Mesa** por `playValue` del atributo activo, conservando asociación a su autor:

- Dirección pública ALTO: mayor J a la izquierda, menor a la derecha.
- Dirección pública BAJO: menor J a la izquierda, mayor a la derecha.
- Si todavía no hay dirección pública, conservar orden existente; no usar o revelar selecciones parciales privadas para reordenar la vista compartida.
- Durante revisión, utilizar la clasificación confirmada disponible en `interaction.review.result.ranking`.

La primera y segunda posición facilitan comparar jugadas; la interfaz no declara por sí misma ganador ni próximo abridor antes de resolución. Esos datos siguen siendo los comunicados por el servidor y pueden no existir al final/desempate. No añadir un resaltado de líder provisional, puntuación nueva o animaciones.

Ordenar una copia/proyección de presentación: **no modificar `plays.order`, el turno, las cartas disponibles, el resultado o la adquisición de la mano**. Conservar identidad de carta/autor y acceso a Detalles/foco al entrar una nueva jugada. No introducir desplazamiento automático de página o pérdida deliberada de la posición horizontal que el usuario esté consultando.

Esta reordenación es una diferencia aprobada respecto al orden de llegada conservado en entregas anteriores. SDD debe registrarla como decisión de presentación y comunicar cualquier referencia descriptiva que necesite alineación a su ámbito responsable, sin cambiar las reglas del juego.

### M03-05 — Altura y desplazamiento vertical autorizados

- Conservar cabecera y leyenda; pueden quedar fuera del encuadre al desplazar la página. No fijarlas, eliminarlas ni imponer una cabecera flotante.
- Permitir desplazamiento vertical natural cuando la altura útil sea insuficiente, también para revisar contenido extenso del panel de estado. No fijar una altura máxima que recorte revisión, errores o advertencias.
- No condicionar la especificación a que el autor elija una altura útil universal ni a una determinada combinación de barras del navegador. La disponibilidad de altura varía: medirla en las comprobaciones y registrar cuánto desplazamiento hace falta.
- No usar el área anterior de B11 **1800 × 1600** para acreditar encuadre en una pantalla física 1920 × 1080. Tampoco considerar fallo de este incremento el mero scroll necesario para cabecera o pie: está expresamente aceptado.
- Comprobar en 1920 × 1080 de viewport y en una muestra de menor altura útil, por ejemplo 1920 × 950, al 100 %, documentando diferencias. Son entornos reproducibles de prueba, no requisitos para que el autor configure su equipo. Si se obtiene una captura humana, registrar su viewport real sin obligarle a ocultar barras, cambiar zoom o usar F11.
- Antes del nuevo ajuste, la maqueta ocupa 1065,11 px en turno normal y 1187,55 en revisión. Son antecedentes medidos; la eliminación/compactación del encabezado debe reducir la altura inferior en el caso comparable. La revisión puede seguir siendo más alta por su contenido y no se elimina su listado en este encargo.

## Conservación de comportamiento y alcance

Cambiar solo composición, encabezados descritos y orden de presentación pública. Se conservan B11 y las garantías de aplicación: valores Dato/J y unidades; tres atributos; icono propio desde `roundAttribute`, fila activa desde `activeAttributeId`; Detalles dentro y acción exterior; selección y envío; direcciones parciales privadas; bloqueo, recuperación, plazos, avisos y autoridad del servidor.

No modificar privacidad, puntos, orden de jugadores, iniciativa, revisión, automático, bots, resultados, JSON, contratos o servidor. Conservar observador separado y sin mano/controles: no crear una mano ficticia para rellenar la cuadrícula. Mantener su comportamiento de redistribución existente compatible con esta composición y documentar su captura.

No incluir rediseño móvil/tableta, sala de espera, resultados, leyendas nuevas, cambios de texto adicionales, nuevas dimensiones o fuentes de carta, expansión del diálogo, animaciones, marca o contenido temático. Las decisiones de adaptación a otros tamaños se tomarán después de ver este resultado.

Piezas previsibles: `GameScreen.tsx` y estilos de mesa; componente/acción de carta y `RoundReview` se reutilizan sin cambiar su lógica. SDD elige la separación local mínima compatible con `AGENTS`, sin refactor general ni fuentes normativas de otros ámbitos. Esta entrega no edita esos archivos.

## Condiciones comprobables y entrega de SDD

SDD prepara la especificación del incremento y los criterios que correspondan; no necesita reabrir las preferencias ya aprobadas. La implementación debe comprobar:

1. **Ancho y centrado:** carta 230 × 321, contenedor 1400, cuadrícula 1368, Mesa 1092, mano 816 y laterales 264, tolerancia geométrica 2 px. Igual margen lateral, sin expansión por ancho extra o quinta jugada. Cartas superiores/inferiores alineadas por columnas.
2. **Encabezados:** ausencia de la línea eliminada, «Tu mano» centrado, ausencia de la reserva vacía de 68 px, indicadora/mano alineadas y ahorro de altura medido frente a B11/maqueta en el mismo estado.
3. **Cuatro/cinco jugadas:** cuatro completas sin scroll necesario; cinco con quinta completamente consultable en Mesa, autores/Detalles correctos y aviso de desbordamiento. Mano completa y sus botones accesibles; sin scroll horizontal global.
4. **Orden de datos:** ejemplos ALTO y BAJO, mismo atributo activo y valores distintos; primera posición es la mejor J para esa dirección. Mano sigue adquisición, el orden oficial de jugadas no cambia y la revisión usa resultado autorizado. Probar una entrada nueva con consulta de Detalles/foco o desplazamiento ya existente.
5. **Regresión proporcionada:** ambos órdenes de selección del abridor y turno posterior, Detalles sin jugar, teclado, desplazamiento sin enviar, revisión, dos/cinco participantes, mano de una/dos/tres y observador. Conservar avisos y manejo de error/vencimiento sin forzar una altura de panel. Muestra de menor ancho para detectar acceso perdido, sin exigir un nuevo diseño adaptable.
6. **Evidencia visual:** comparar implementación y referencias a tamaño/estado equivalentes. Adjuntar captura de turno posterior, revisión de cinco y consulta de quinta, más medidas de contenedor/cartas/encabezados. Explicar la diferencia deliberada de línea eliminada y encabezados compactos. Mostrar desplazamiento residual con honestidad: no ocultarlo mediante recorte, zoom o una altura de prueba elegida solo para que desaparezca.

Aplicar las comprobaciones del repositorio pertinentes y distinguir pruebas previstas de ejecutadas. «Verificado técnicamente» no equivale a aprobación visual final del autor. Tras implementar, revisar el resultado con él y dejar los ajustes de otras resoluciones como siguientes incrementos.

Si SDD encuentra una incompatibilidad real con reglas o información obligatoria, debe describirla y resolverla con el autor antes de sustituir la decisión; no interpretar esa obligación como permiso para reintroducir la línea eliminada, cambiar composición o exigir una altura universal por rutina. Conservar fuentes generales y cierres anteriores.
