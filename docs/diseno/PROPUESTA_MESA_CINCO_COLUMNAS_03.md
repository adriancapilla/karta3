# KARTA3 — Propuesta de mesa centrada en cinco columnas

> **Decisión posterior del autor, 06/10/2026:** aprobada esta composición como referencia del siguiente ajuste, con eliminación de «Atributo indicador: …», encabezados inferiores más próximos a las cartas y permiso de desplazamiento vertical para apartar cabecera o consultar pie. La entrega vigente a SDD es [Ajuste de mesa centrada 03](AJUSTE_MESA_CENTRADA_03.md). Las medidas, imágenes y pendientes originales que siguen se conservan como antecedente; no son evidencia de implementación del nuevo ajuste.

06/10/2026. **Maqueta para conversar con el autor; composición visual pendiente de revisión.** No es una especificación SDD ni una modificación del producto. Se parte del tamaño acordado en B11, 230 × 321 píxeles CSS, y de la petición posterior de centrar un área de cinco columnas en lugar de extender los paneles a toda la ventana.

## Referencias a escala

- [Turno del quinto jugador, cuatro cartas públicas](referencias/composicion-pc-03/mesa-cinco-columnas-turno.png).
- [Revisión con cinco cartas; quinta accesible mediante desplazamiento](referencias/composicion-pc-03/mesa-cinco-columnas-revision.png).
- [Detalle de Mesa desplazada hasta la quinta carta](referencias/composicion-pc-03/mesa-cinco-columnas-quinta-carta.png): captura solo de ese panel, con la última carta completa.
- Versiones aisladas para consultar el desplazamiento: [turno](referencias/composicion-pc-03/mesa-cinco-columnas-turno.html) y [revisión](referencias/composicion-pc-03/mesa-cinco-columnas-revision.html). Son maquetas estáticas sin conexión ni ejecución de juego; los controles de jugar/Detalles no ejecutan acciones.
- [Medidas obtenidas del renderizado](referencias/composicion-pc-03/medidas-maqueta.json).

Renderizado con Chrome sin interfaz visible, viewport **1920 × 1080 CSS px**, escala 1; imágenes sin marcos de navegador. La referencia principal tiene 1920 × 1080 píxeles. La revisión se captura completa a 1920 × 1188 para no ocultar contenido fuera de la ventana. Estas medidas no equivalen al área útil de una pantalla física 1920 × 1080 con barras de navegador y escritorio.

Se reutilizan los estilos de mesa de B11 como base y datos reales de la genérica; los cambios de anchura/alineación se aplican únicamente a una maqueta aislada. Lectura de producto sobre HEAD local `c300fcac470f5c3cdebdb87d1f60856eeffd7784`. No se ha ejecutado una partida nueva ni validado este diseño en la aplicación.

## Cálculo de anchura propuesto

| Medida | Píxeles CSS |
| --- | ---: |
| Carta | 230 × 321 |
| Columna lógica: carta + 2 × (12 de padding de panel + 4 de fila + 1 de borde) | 264 |
| Separación entre columnas | 12 |
| Zona de juego: 5 × 264 + 4 × 12 | **1368** |
| Márgenes interiores exteriores: 16 a cada lado | 32 |
| Contenedor centrado total | **1400** |

En el viewport de 1920, el contenedor comienza en x=260; la cuadrícula comienza en x=276 y acaba en x=1644. Los márgenes del contenido de juego son iguales, 276 px a cada lado.

| Fila | Columna 1 | Columnas 2–4 | Columna 5 |
| --- | --- | --- | --- |
| Superior | Jugadores, 264 px | Mesa que abarca columnas 2–5: 1092 px | Continuación de mesa |
| Inferior | Indicadora, 264 px | Mano: 816 px | Turno: 264 px |

Los centros de cartas superiores e inferiores coinciden con las cinco columnas imaginarias. Esa coincidencia produce **46 px entre bordes de cartas** en los paneles agrupados, resultado de los márgenes interiores de cada columna más la separación de 12. No confundir esos 46 con un gap de columnas de 46. Esta separación es una propuesta local de alineación, pendiente de preferencia del autor.

La ventana de desplazamiento de Mesa mide 1066 px incluidos sus 4 px de padding a cada lado: se ven cuatro cartas completas de 230 con tres separaciones de 46. Con cinco cartas, el contenido mide 1342 y se desplaza 276 px para consultar la última. Se propone «5 cartas · desliza →» solo cuando haya desbordamiento, como indicación de que queda información fuera.

La mano no se desplaza en esta configuración. Con una/dos cartas se mantienen posiciones desde la izquierda, tamaño y orden de adquisición; no se estiran para rellenar la tercera posición. El contenedor no crece cuando la mesa pasa de cuatro a cinco jugadas.

## Orden público propuesto por el autor

Ordenar visualmente la mesa de mejor a peor **valor jugable del atributo activo**:

- ALTO: J mayor primero.
- BAJO: J menor primero.
- Antes de dirección pública, conservar el orden existente; no revelar ni utilizar parcial privada ajena.
- La mano conserva adquisición; no se ordena por valor.

La maqueta ilustra ALTO/Cuadrado. Durante el último turno muestra J=54,50,35,31; tras jugar la carta de J=56, la revisión muestra 56,54,50,35 y deja J=31 a la derecha, accesible desplazando. Los autores permanecen asociados a cada carta.

Ese orden es de presentación y no modifica `plays.order`, iniciativa, resultados, puntuación o contratos. Durante la revisión se usaría la clasificación confirmada por el servidor, disponible en `interaction.review.result.ranking`. Durante juego, ordenar solo los datos públicos no equivale a declarar ganador o siguiente abridor oficial. Conservar identidad/foco/Detalles y acceso a la quinta carta cuando nuevas jugadas cambien la posición visual. Los desempates/fin pueden no tener siguiente abridor; conservar lo que comunica el servidor.

Queda por aprobar la preferencia final de ordenar durante juego y revisión y su verificación de accesibilidad. No se incluye un resaltado nuevo de carta líder ni animaciones de reordenación. El rótulo «5 cartas · desliza →» es una propuesta visible en esta maqueta, no una decisión normativa nueva.

## Límite de altura observado

Esta maqueta conserva alturas/espacios y el contenido de revisión actuales para aislar el efecto de anchura y centrado:

- Turno normal: contenedor de **1065,11 px de alto**, incluida leyenda y padding; mano y tres botones completos, sin desplazamiento horizontal.
- Revisión: **1187,55 px**, debido al panel con resumen/listado completo de cinco jugadas. Se muestra completo en la imagen de 1188 px; no se recorta para simular encuadre.

Por tanto, la propuesta resuelve la anchura, pero **todavía no acredita ventana única en una pantalla física 1920 × 1080**. No reutilizar el viewport alto 1800 × 1600 de B11 como prueba de ese encuadre. El siguiente ajuste de altura deberá acordarse con el autor; no se reducen cartas ni fuentes, ni se suprime el listado de revisión, por iniciativa de Diseño en esta maqueta.

El modo de cinco columnas requiere por ahora 1400 px de ancho con márgenes. Un ancho o alto inferior necesita una adaptación posterior; no está comprobada su viabilidad en tabletas o móviles apaisados por el mero hecho de ser horizontales. Conservar cartas a escala no autoriza zoom para aparentar adaptación.

## Pendientes del diálogo

1. Confirmar ancho centrado de 1368/1400 y separación de cartas alineadas en columnas.
2. Confirmar orden visual por J y aviso de quinta carta accesible.
3. Ajustar después la altura normal/revisión al viewport real del autor, manteniendo reglas e información.
4. Una vez consolidado PC, concretar transformación a tamaños menores o verticales.

No se modifican código, barajas, contratos, fuentes generales o cierres de B10/B11. Esta propuesta no sustituye una decisión aprobada de implementación hasta que el autor confirme el siguiente alcance para SDD.
