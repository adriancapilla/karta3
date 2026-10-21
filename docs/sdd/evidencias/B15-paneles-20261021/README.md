# B15 — Cota de paneles compactos, evidencia nueva21/10/2026

Fuente `main/aa336d3add598e4c59789ff053292295410da8dc` con reparación B11 incluida; cambio de producto limitado a `src/style.css`, sin commits nuevos. [Cierre y selección exacta](../../ADENDA_B15_ANCHO_PANELES_COMPACTOS.md#6-cierre-técnico--21102026).

## Comparaciones y capturas

[18 comparaciones medidas](comparacion.json): antes/después en el mismo Chrome155/Windows, viewport y fase, DPR1/escala1, fuentes efectivas iguales y datos de ensayo deterministas. C220/G10; caja exterior incluye padding8+borde1 por lado. Puntuaciones/resumen1233→450 en intermedio y358→358 en estrecho; composición/Mesa/mano sin reducción. Frontera1367 limitada;1368 normal on/off igual. Se preservan textos, alineación x, cartas y controles; no se exige igualdad píxel a píxel o altura invariable al envolver líneas.

| Escena | Antes | Después |
|---|---|---|
|1280 ·1–58 |[Captura](capturas/initial-1280-PLAY_VALUE-before.png) |[Captura](capturas/initial-1280-PLAY_VALUE-after.png) |
|1280 ·Dato |[Captura](capturas/initial-1280-DISPLAY_VALUE-before.png) |[Captura](capturas/initial-1280-DISPLAY_VALUE-after.png) |
|390 ·1–58 |[Captura](capturas/initial-390-PLAY_VALUE-before.png) |[Captura](capturas/initial-390-PLAY_VALUE-after.png) |
|390 ·Dato |[Captura](capturas/initial-390-DISPLAY_VALUE-before.png) |[Captura](capturas/initial-390-DISPLAY_VALUE-after.png) |
|1280 ·revisión/Dato/Oscuro |[Captura](capturas/dark-review-1280-DISPLAY_VALUE-before.png) |[Captura](capturas/dark-review-1280-DISPLAY_VALUE-after.png) |

Las imágenes fueron capturadas por navegador automatizado en producto compilado, no maqueta/VPS/dispositivo físico. El agente revisó estrecho/intermedio y revisión Oscuro; la aprobación visual humana sigue pendiente.

## Resultados realmente ejecutados

- [Check final](check.txt):614/614,58 archivos,103 módulos, tipos/lint/build correctos.
- [Navegador final](navegador-final.txt):9/9,1,1min, worker1/retries0. Cinco casos focales nuevos y cuatro regresiones existentes, no batería completa.
- [Montaje inicial](montaje-inicial.txt): nombres de ensayo inválidos,1/5; [scroll](montaje-scroll.txt):4 fallos de preparación; [medición previa completada](medicion-previa.txt):4/4. Reparaciones solo del montaje, explicadas en el cierre. La escena normal/frontera inicial ya correcta no se repitió hasta la puerta final tras CSS.
- Datos de juego, HTTP/Socket.IO y consultas de indicadora/identidad/Detalles reales; tiempo/permutación controlados. No prueba de duración real, Linux/CI o recogida estadística nueva.

Originales/trace de cada intento en `playwright-report/b15-paneles-20261021/`, sin sobrescribir los intentos. No bases o secretos reales. Proceso/prompt previos y `tableLayout.spec.ts` comparados por SHA-256 contra la referencia inicial; código B11 intacto. La [comparación](comparacion.json) incluye hashes de fuentes y versión/ruta Node.

## Revisión manual del autor

En una instancia propia de la compilación actual, dos sesiones, seleccionar explícitamente una baraja y activar Optimizar para móvil antes de iniciar. Revisar a1280 y390 en ambos modos: solo los dos paneles superiores se limitan; Mesa/mano ocupan su ancho y desplazan lateralmente por separado. Abrir indicadora/identidad con teclado, cerrar con Escape y comprobar foco; jugar hasta revisión y consultar la quinta. Oscuro conserva la misma geometría. Desde1368 útiles, normal activada/desactivada debe coincidir; el viewport no sustituye la medida útil `data-useful-width`. No se propone usar servidores del autor para estos ensayos ni publicar/activar nada.
