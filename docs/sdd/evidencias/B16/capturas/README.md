# Producto integrado B16 — 16/10/2026

Compilación revisada `84eba0b`, Chrome 155.0.8059.80, Windows, DPR/escala visual 1. Los JSON del mismo prefijo registran viewport, ancho útil, layout, alturas/cajas/fuentes CSS, filas/fracciones de texto y scroll. [Medidas resumidas](../medidas.json) y [fuentes efectivas CDP](../fuentes-y-normal-on-off.json). Capturas automatizadas revisadas por Implementación, **sin aprobación visual humana ni dispositivos físicos**.

## Comparación Resistencia activa/no activa

Mismos perfiles, dos humanos, indicadora/permutación legal sustituida y primera jugada completa. Reloj controlado de 60 s; la partida normal completa se acredita aparte. Ambos modos se aceptan y conservan: aquí dato y rango coinciden por aprobación editorial y unit está vacío. El encabezado 1-58/Dato y el estado aceptado acreditan el modo, sin inventar diferencias numéricas.

| Perfil | No activa | Activa |
|---|---|---|
| PC, 1-58 | [1920×1080](PLAY_VALUE-1920-on-no-activa-mesa-full.png) | [1920×1080](PLAY_VALUE-1920-on-activa-mesa-full.png) |
| PC, Dato | [1920×1080](DISPLAY_VALUE-1920-on-no-activa-mesa-full.png) | [1920×1080](DISPLAY_VALUE-1920-on-activa-mesa-full.png) |
| Compacta, 1-58 | [390×844](PLAY_VALUE-390-on-no-activa-mesa-full.png) | [390×844](PLAY_VALUE-390-on-activa-mesa-full.png) |
| Compacta, Dato | [390×844](DISPLAY_VALUE-390-on-no-activa-mesa-full.png) | [390×844](DISPLAY_VALUE-390-on-activa-mesa-full.png) |
| Compacta estrecha | [360×800, 1-58](PLAY_VALUE-360-on-no-activa-mesa-full.png) | [360×800, 1-58](PLAY_VALUE-360-on-activa-mesa-full.png) |
| Compacta estrecha, Dato | [360×800](DISPLAY_VALUE-360-on-no-activa-mesa-full.png) | [360×800](DISPLAY_VALUE-360-on-activa-mesa-full.png) |
| Optimización off, normal adaptada | [390×844, Dato](DISPLAY_VALUE-390-off-no-activa-mesa-full.png) | [390×844, Dato](DISPLAY_VALUE-390-off-activa-mesa-full.png) |

Las celdas conservan Resistencia completa/símbolo/marca/valor; se permiten líneas distintas y crecimiento del CSS existente. Sin elipsis, fuente reducida, abreviatura ni contenido transformado. PC tiene filas de 32 px; compacta no activa 27,19 y activa 45,38 px en estas escenas. La normal adaptada estrecha tiene más scroll: no se oculta ni se convierte en una corrección de diseño dentro de B16.

Los avisos de recuperación en las capturas proceden del F5 que permite instalar el observador de tráfico antes de los sockets; son producto real. Las imágenes de la derecha parcialmente visibles pertenecen al carrusel. Texto fuera de la porción visible se consulta lateralmente, sin recorte editorial.

## Consultas, quinta y observador

- Detalles informativo: [PC no activa](PLAY_VALUE-1920-on-no-activa-detalles-full.png), [PC activa](PLAY_VALUE-1920-on-activa-detalles-full.png), [compacta no activa](DISPLAY_VALUE-390-on-no-activa-detalles-full.png), [compacta activa](DISPLAY_VALUE-390-on-activa-detalles-full.png).
- Indicadora consultada desde el resumen: [no activa](DISPLAY_VALUE-390-on-no-activa-indicadora-full.png) / [activa](DISPLAY_VALUE-390-on-activa-indicadora-full.png).
- [Observador/quinto Detalles durante revisión](observador-quinta-revision-detalles-full.png), [observador sin mano](observador-quinta-revision-full.png) y [jugador con mano/Mesa independientes](jugador-quinta-revision-full.png).
- [1367 útiles](quinta-frontera-1367-full.png), [1368 útiles](quinta-frontera-1368-full.png) y [358 útiles](quinta-frontera-358-full.png). El viewport requerido varía por márgenes/barras: usar la medición del JSON. Foco/consulta/revisión/contexto se preservan.
- [Resultado de partida normal con humano/EASY/HARD](resultado-normal.png). Adaptadores normales, sin fixture de producto; [traza resumida](../partida-normal.json).

## Revisión del autor pendiente

Seguir [README manual B16](../../../../../README.md#prueba-manual-b16-criaturas-mágicas-y-dos-sesiones) en puerto propio y dos perfiles independientes, más otra pestaña HOST. Registrar commit servido, fecha/navegador, equipo físico o emulación, viewport/área útil, zoom/escala, fuentes, legibilidad, scroll/foco/gestos y conformidad o diferencias. Galería del Gestor, capturas de producto, revisión humana y CI Linux son categorías distintas. C09–C10 permanecen parciales.
