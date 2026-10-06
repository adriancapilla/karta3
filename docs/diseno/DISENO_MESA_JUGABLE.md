# KARTA3 — Diseño de mesa jugable

> **Entrega vigente a SDD, 06/10/2026:** [Ajuste de mesa centrada 03](AJUSTE_MESA_CENTRADA_03.md), aprobado después de probar B11 y revisar la maqueta de cinco columnas. Conserva las cartas de 230 × 321 px, centra un contenedor de 1400 px, limita Mesa a cuatro cartas visibles con desplazamiento para la quinta y compacta los encabezados inferiores. El alcance y los permisos de desplazamiento de esa entrega prevalecen para el siguiente incremento; las entregas 01/02 se mantienen como antecedentes.

> **Actualización de Diseño, 06/10/2026:** la redistribución 01 que se conserva a continuación es el antecedente de B10. El siguiente encargo aprobado por el autor es [Ajuste PC 02 — referencia 1920 × 1080](AJUSTE_MESA_PC_02.md). Esa entrega autoriza los cambios concretos de carta, etiquetas y espacios allí enumerados, antes aplazados aquí. La adaptación a otras resoluciones queda para una iteración posterior. No modifica el cierre histórico de B10 ni acredita implementación del ajuste 02.

## Estado y alcance de la entrega

06/10/2026. Entrega de Diseño a SDD: **redistribución 01 de bloques en PC y móvil**, acordada por el autor en esta conversación. Base consultada: `main` / HEAD `f2d84fb71ccf489b4987928d3a09cde4eb6ad1cf`; árbol limpio antes de crear esta entrega. Producto con partida completa, temporización, automático y bots EASY/HARD. Este documento no acredita implementación ni pruebas de la redistribución.

El problema observado en las capturas del autor es la separación vertical entre mesa, mano y contexto de turno. El primer cambio debe acercar esos bloques. El autor pide una iteración contenida: redistribuir primero, observar el resultado y ajustar tamaños, textos o marcadores posteriormente.

**Límite aprobado:** cambiar la colocación y el reparto del espacio entre los bloques existentes. Conservar tipografía, contenido y presentación interna de cartas, textos, etiquetas, botones, datos, reglas e interacciones. No rediseñar el producto completo.

## Fuentes y responsabilidades

- [Reglas del repositorio](../../AGENTS.md) y [proceso SDD](../sdd/PROCESO_SDD.md).
- [Contexto vigente](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md).
- [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§7–12: información, selección, plazos, revisión, ausencia y resultados.
- [B06](../sdd/BLOQUE_06_INICIO_Y_MESA_INICIAL.md), §3, como antecedente visual; sus limitaciones de ejecución son históricas.
- [B07](../sdd/BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md), §3, y [B08](../sdd/BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md), §4, para conservar interacciones y avisos. Sus exclusiones de capacidades posteriores no describen el producto vigente completo.
- Presentación consultada: [GameScreen](../../src/GameScreen.tsx), [GameCard](../../src/GameCard.tsx), [RoundReview](../../src/RoundReview.tsx) y [estilos](../../src/style.css).
- Datos existentes: [contrato de partida](../../shared/contracts/game.ts) y [contrato de sala](../../shared/contracts/room.ts). No se proponen ampliaciones.

Diseño fija aquí las relaciones visuales acordadas. SDD prepara la especificación del incremento, comprueba compatibilidad y define verificación. Implementación conserva esa distribución y documenta evidencia. Las fuentes generales de Arquitectura y el código de producto no se modifican desde esta entrega.

## Referencias guardadas y cómo interpretarlas

Copias verificables de los bocetos anteriores, conservados también en `docs/sdd/referencias/b06`:

- [PC: apertura](referencias/redistribucion-01/escritorio-abridor.png).
- [PC: turno posterior](referencias/redistribucion-01/escritorio-jugador.png).
- [Móvil: composición superior en dos columnas](referencias/redistribucion-01/movil-compacto.png).

Las imágenes fueron generadas antes de implementarse la ejecución, de ahí su rótulo «FUTURO». Ahora se utilizan para recuperar relaciones de posición. Nombres, cartas, jugadas, valores y tiempos son ejemplos; no obligan a reproducir ese reparto.

**Prevalece el alcance de esta entrega sobre otros detalles de las imágenes.** No copiar sus tamaños de letra, reducción de texto, asterisco, desaparición de numeración o anfitrión, puntos de color, tamaño de cartas ni nuevas ubicaciones de ronda/mazo. Esas diferencias no se han autorizado para esta iteración. La referencia aprobada aquí es la composición de bloques que se concreta a continuación.

## Decisiones aprobadas para redistribución 01

| ID | Decisión comprobable |
|---|---|
| D01 | PC tiene dos filas principales: jugadores y mesa arriba; indicadora, mano y estado del turno debajo. |
| D02 | El estado del turno está a la derecha de la mano en la misma fila; nunca como una tercera fila debajo de ella. |
| D03 | Móvil comparte el bloque superior entre jugadores a izquierda y estado del turno a derecha. |
| D04 | Debajo del bloque superior móvil se sitúan indicadora compacta, cartas jugadas y mano, en ese orden y a ancho disponible. |
| D05 | Se conserva el desplazamiento horizontal contenido de mano y cartas jugadas, con orden existente y sin desbordar la página. |
| D06 | Nombre/versión de baraja y resumen de ronda/mazo conservan su contenido y ubicación en cabecera. No se trasladan los contadores al panel de turno en esta iteración, aunque el boceto móvil los muestre allí. |
| D07 | Se mantienen fuentes, textos, numeración, etiquetas y botones existentes, incluida información de anfitrión, abridor, jugador actual, bots, dificultad, conexión y automático cuando corresponda. |
| D08 | No se modifica el modelo de carta: tres atributos, Jugable/Dato, unidades, imágenes o icono neutro, fila activa, superficie de juego y Detalles actuales. |
| D09 | La adaptación PC/móvil es automática según espacio; no se añaden parámetros del anfitrión ni selectores de distribución. |

## PC: posiciones concretas

Tras la cabecera y los avisos existentes, distribuir los paneles en tres columnas lógicas y dos filas:

| Fila | Izquierda | Centro | Derecha |
|---|---|---|---|
| Superior | Jugadores y puntuaciones | Cartas jugadas, ocupando centro y derecha | Continuación de la mesa |
| Inferior | Carta indicadora completa | Tu mano | Estado de la partida / turno |

La mesa pública queda **encima** de mano y estado. Indicadora, mano y estado empiezan en la misma banda horizontal inferior; el contenido de la lista de jugadores no debe hacer que el estado quede después de la mano en una fila adicional. Alinear los paneles al principio de su fila, evitando centrados verticales que separen información accionable.

La columna izquierda conserva la relación lateral jugadores/indicadora. La columna central debe recibir la mayor parte del ancho restante para la mano. La derecha debe admitir el panel de estado y los controles actuales sin superposición ni corte. SDD puede determinar los anchos compatibles con los componentes actuales; no puede cambiar esas relaciones ni reemplazarlas por una pila vertical en PC.

El panel de estado incluye todo su contenido vigente: jugador actual, tiempo, abridor, atributo, dirección, selección parcial cuando corresponde, revisión, envío, errores y recuperación. Se mueve como un bloque, sin recortar mensajes ni sustituir controles.

Se permite ajustar la estructura de distribución exterior: columnas, filas, anchos de panel, alineación y separación entre paneles, eliminando una fila innecesaria. No aprovechar este encargo para cambiar tamaños de fuente, dimensiones base de cartas, imágenes, márgenes internos de carta o tamaños de botones. Los anchos que ya dependan del contenedor se adaptan naturalmente; no se obliga a las tres cartas a caber reduciendo su contenido.

## Móvil: posiciones concretas

Mantener cabecera, resumen ronda/mazo y avisos actuales. A continuación:

| Orden vertical | Izquierda | Derecha |
|---|---|---|
| Bloque superior | Jugadores y puntuaciones | Estado de la partida / turno |
| Después | Indicadora compacta, ocupando ambas columnas | |
| Después | Cartas jugadas, ocupando ambas columnas | |
| Después | Tu mano, ocupando ambas columnas | |

El bloque de estado no vuelve a aparecer debajo de la mano. La información del turno se consulta junto a los jugadores, antes de mesa y mano. Mantener el contenido actual de cada panel: **no** convertir las filas de jugadores en «nombre + puntos + asterisco» en este incremento, ni suprimir etiquetas para hacerlas más bajas.

Ambas columnas admiten envoltura de texto y contenido, con ancho mínimo lógico cero y sin invadir la vecina. Conservar fuentes y botones: si los controles ALTO/BAJO necesitan varias líneas, permitir el ajuste dentro del panel; no reducir su letra ni ocultarlos. El observador permanece aparte de jugadores y la indicadora continúa usando su variante compacta existente.

Mesa y mano tienen desplazamientos laterales independientes. El desplazamiento vertical de página sigue permitido para consultar las secciones; no se fija un número de cartas que deban verse simultáneamente. No incorporar en esta primera redistribución paneles nuevos fijos/flotantes, gestos nuevos, pestañas, colapsados de jugadores ni un desplazamiento inicial automático.

Como punto de partida, conservar la transición existente de presentación móvil a PC (actualmente 760 px), verificando los dos lados del límite. No añadir una tercera configuración de tableta ni una excepción de orientación. Si el corte actual produce una incompatibilidad concreta, SDD la documenta para resolverla con el autor antes de sustituir la distribución acordada.

## Qué permanece visible y qué puede desplazarse

Todos los elementos actualmente presentes siguen renderizados según su estado y papel, con los mismos datos y controles. «Visible» aquí no significa fijado permanentemente a la ventana: la página puede desplazarse verticalmente y las filas de cartas horizontalmente. Detalles conserva su consulta actual y su cierre con devolución del foco.

El objetivo es acercar mesa/mano/turno. **Esta iteración de estructura no garantiza que todo quepa en una única ventana con las dimensiones actuales.** Si persiste desplazamiento vertical, registrar a qué tamaño, con qué estado y qué información queda fuera. No resolverlo por iniciativa propia reduciendo fuentes/cartas, ocultando etiquetas, cambiando textos o añadiendo un panel fijo. Esa evidencia será la entrada para la siguiente iteración.

Para nombres largos, atributos largos y unidades temáticas, conservar todos los textos y las unidades. Usar las posibilidades de envoltura ya existentes; no abreviar identidades ni truncar valores sin acceso. Si las columnas no resultan legibles, comunicar el caso concreto para ajustar el siguiente encargo.

## Estados y comportamientos que se conservan

| Caso | Conservación exigida |
|---|---|
| Abridor | Ninguna selección inicial; carta/dirección en cualquier orden; completar ambas envía sin confirmación adicional. Parcial aceptado privado; carta local privada de la pestaña. |
| Turno posterior | Dirección pública ya fijada; pulsar carta propia envía inmediatamente. Detalles nunca juega. |
| Espera | Mismo estado público; sin selección anticipada ni envío fuera de turno. |
| Revisión | Misma comunicación, ganador, puntos, siguiente abridor y tiempo de revisión. No crear un plazo humano simultáneo ni cambiar duración. RoundReview conserva su pertenencia al panel de estado. |
| Fase final y desempate | Mantener mensajes, cartas restantes y tratamiento existente; mano de 1–3 cuando corresponda, sin prometer tres constantes ni alterar puntuación. |
| Automático / bots | Mantener distinción de estados y avisos; no inventar temporizador humano ni recuperar control manual. |
| Observador | Información pública, identidad aparte y Observando; no mano ni controles. En PC conserva la fila inferior para indicadora/estado; puede utilizarse el hueco de mano para el estado sin crear una mano vacía. |
| Conexión, vencimiento y error | Mensajes, bloqueo, recuperación, foco y selección actuales. El reloj del navegador no aplica jugadas ni timeouts. |
| Resultado final | La pantalla de resultados y su retorno permanecen intactos. |

No cambiar reglas, datos de transporte, autoridad del servidor, privacidad, orden de adquisición, orden de jugadores, temporización, adjudicación ni políticas de bots. Las actualizaciones remotas no deben reiniciar el desplazamiento, cerrar Detalles, perder selección parcial o mover foco por la redistribución.

## Condiciones para especificar y verificar

SDD debe convertir estas decisiones en criterios de aceptación del incremento, incluyendo:

1. **PC:** lista a izquierda y mesa a su derecha en fila superior; indicadora/mano/estado en fila inferior. El panel de estado no está debajo de la mano. Verificar posiciones de los paneles, no solo que existan sus textos.
2. **Móvil:** jugadores y estado en columnas vecinas arriba; luego indicadora, mesa y mano. No hay un segundo estado duplicado al final.
3. **Alcance:** fuentes y estilos internos de carta siguen con sus reglas/tamaños base anteriores; no hay sustitución de etiquetas por símbolos, eliminación de contenido, nuevo resaltado de líder, movimientos adicionales de contadores ni controles nuevos.
4. **Contenido e interacción:** todos los datos/avisos siguen disponibles en su estado correcto; ALTO/BAJO y jugar carta conservan envío, parcial y permisos; Detalles queda separado de jugar.
5. **Adaptación:** no hay desplazamiento horizontal de toda la página ni paneles solapados. Mesa y mano mantienen su desplazamiento contenido. Texto largo y unidades no invaden otras columnas.
6. **Evidencia visual:** comparar producto y referencias/esquemas en estados y tamaños equivalentes. Documentar qué diferencias son deliberadas por este alcance —tipografía/etiquetas actuales— y cuáles serían desviaciones de composición.
7. **Límites pendientes:** registrar desplazamiento vertical residual, anchuras insuficientes o zonas que no pueden consultarse juntas; no declarar resuelta la visibilidad simultánea si solo se recolocaron los paneles.

Muestra de tamaños para acordar en la especificación: PC 1280 × 800, 1366 × 768 y el tamaño de las capturas del autor; móvil 360 × 800 y 390 × 844, más un caso a cada lado del corte actual. Usar el área útil de navegador, zoom normal y mismo estado para las comparaciones; no inferirla solo de la resolución física del dispositivo.

Cubrir apertura y turno posterior como comparaciones principales. Completar una muestra proporcionada de espera, revisión, fase final, desempate, automático/bots y observador, 2–5 jugadores, manos de 1–3, nombres largos y cartas con/sin imagen. Reutilizar escenarios/pruebas existentes; no exigir todo el producto cartesiano de tamaños y estados. Separar pruebas previstas de las realmente ejecutadas. Ejecutar en implementación las puertas del repositorio y recorridos de navegador pertinentes, conservando la evidencia de regresión.

## Fuera de esta iteración y pendientes explícitos

- Carta pública «va ganando» o cualquier resaltado de mejor jugada: aplazado expresamente por el autor.
- Reducir o cambiar fuentes, dimensiones/proporción de cartas, imágenes, botones y espacios interiores: valorar después de ver el primer resultado.
- Minimizar textos, reemplazar anfitrión/abridor por símbolos, cambiar numeración, incorporar asteriscos y leyendas o sustituir Activo por un punto: ideas de iteración posterior, no cambios autorizados ahora.
- Reubicar mazo/ronda junto a indicadora o dentro del estado: pendiente, conservar cabecera actual.
- Panel de turno fijo, ocultación/despliegue de jugadores, otras distribuciones y nuevos parámetros elegibles: no incorporarlos en este cambio.
- Animaciones, transiciones, marca y acabado visual: posteriores.

Si SDD detecta incompatibilidad entre una posición acordada y una garantía vigente, debe describir la incompatibilidad y resolverla con el autor antes de sustituir, simplificar o eliminar esa decisión. Los ajustes locales de implementación compatibles no necesitan reabrir las preferencias del autor. Esta entrega modifica únicamente documentación de Diseño y conserva los cierres históricos de B06/B07/B08.
