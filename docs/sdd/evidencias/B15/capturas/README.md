# Capturas de producto B15 — 14/10/2026

Chrome headless 155.0.8059.40, Windows, DPR 1 y escala visual 1. Son recorridos automatizados y revisión de imágenes por Implementación. **No constituyen aprobación visual humana ni pruebas en dispositivos físicos.** Cada `.json` del mismo prefijo registra viewport, ancho útil, cajas, alturas, fuentes CSS y scroll. Fuentes efectivas obtenidas por CDP en [fuentes-efectivas.json](../fuentes-efectivas.json).

`full` conserva toda la altura, `viewport` el encuadre visible. Las capturas con `apartadas` muestran el scroll natural que aparta las puntuaciones sin ocultarlas del producto. Mesa y mano conservan sus desplazamientos independientes. Un borde lateral de carta visible pertenece al carrusel, no a contenido eliminado.

## Comparación antes/después

Estados equivalentes: dos humanos, adquisición/indicadora conocidas, inicio, revisión de 2 s y turno de 30 s. El cambio aprobado modifica contenido/versión, columnas, consultas y composición; no se busca igualdad de PNG. La captura anterior no registró la versión binaria de Chrome. Las capturas iniciales `generica-*`/`sistema-solar-*` usan 60 s; para comparación equivalente usar los pares `comparable-*` de esta tabla.

| Paquete/perfil | Antes B14 | Después B15 | Medidas después |
|---|---|---|---|
| genérica 390×844 | [Antes](../before-generica-390.png) | [Después](comparable-generica-390-full.png) | [JSON](comparable-generica-390.json) |
| Solar 390×844 | [Antes](../before-sistema-solar-390.png) | [Después](comparable-sistema-solar-390-full.png) | [JSON](comparable-sistema-solar-390.json) |
| genérica 1920×844 | [Antes](../before-generica-1920.png) | [Después](comparable-generica-1920-full.png) | [JSON](comparable-generica-1920.json) |
| Solar 1920×844 | [Antes](../before-sistema-solar-1920.png) | [Después](comparable-sistema-solar-1920-full.png) | [JSON](comparable-sistema-solar-1920.json) |

[Resumen de alturas](../comparacion.json): móvil ahorra 607/590 px, con 21/11 px residuales; PC crece 63/25 px, residual 274. No se promete encuadre universal.

## Referencias finales y escenas alcanzadas

Comparar con Diseño [PC Dato](../../../../diseno/valor-atributo-propuestas/capturas/pc-dato.png) y [móvil final Dato](../../../../diseno/valor-atributo-propuestas/capturas/referencia-final-14/movil-final-dato-390.png). Las referencias son maquetas, las imágenes siguientes son producto compilado:

- [PC ronda 6, cuatro públicas](referencia-r6-cuatro-1920-full.png) / [encuadre](referencia-r6-cuatro-1920-viewport.png).
- [390×844](referencia-r6-cuatro-390-full.png), [360×800](referencia-r6-cuatro-360-full.png), [1024×768](referencia-r6-cuatro-1024-full.png) y [puntuaciones apartadas](referencia-r6-apartadas.png).
- Traza legal: cinco humanos, 25 jugadas y cinco revisiones completas, luego cuatro cartas públicas; ronda 6/mazo 12, 25 puntos oficiales y mano activa de tres. No se asignaron puntos ni se saltó el motor. Actor invitado Ana (3): sin Cancelar; dirección ALTO oficial, sin controles de apertura tras abrir.
- [Genérica 1-58 móvil](generica-PLAY_VALUE-390-full.png), [Dato móvil](generica-DISPLAY_VALUE-390-full.png), [PC 1-58](generica-PLAY_VALUE-1920-full.png), [PC Dato](generica-DISPLAY_VALUE-1920-full.png).
- [Solar 1-58 móvil](sistema-solar-PLAY_VALUE-390-full.png), [Dato móvil](sistema-solar-DISPLAY_VALUE-390-full.png), [PC 1-58](sistema-solar-PLAY_VALUE-1920-full.png), [PC Dato](sistema-solar-DISPLAY_VALUE-1920-full.png).
- [1367 útiles](frontera-1367-full.png), [1368 útiles](frontera-1368-full.png), [normal on](normal-on-1368-full.png), [normal off](normal-off-1368-full.png). La anchura es del contenedor medido, no del viewport.
- [Observador, cinco jugadores, Dato 390](observador-cinco-publicas-390-DISPLAY_VALUE-full.png), [invitado/cuatro públicas 360](invitado-cuatro-publicas-360-PLAY_VALUE-full.png), [cinco públicas/revisión](cinco-publicas-revision-full.png) y [automático/aviso propio](compacta-automatico-aviso-full.png).

Las escenas dirigidas usan reloj sustituido y conexiones reales. El [vencimiento real](../vencimiento-real.json) es un ensayo independiente con adaptadores normales. La corrección final de diagnóstico/compatibilidad es de servidor: no cambió JS/CSS de estas capturas; la instancia normal final contrastó ambos archivos servidos con la compilación.

## Revisión del autor

Seguir [README: prueba manual B15](../../../../../README.md#prueba-manual-b15-modos-consultas-y-compacta), con puerto propio y dos perfiles independientes. Registrar fecha/commit, versión servida, dispositivo o emulación, viewport/área útil, escala/zoom/fuentes, legibilidad, quinta/scroll, foco/gestos y conformidad o diferencias. Revisar también selección/quitar/Información, observador y recuperación/cancelación/otra sala. Estos recorridos humanos están pendientes.
