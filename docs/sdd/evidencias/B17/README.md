# B17 — evidencia de producto local, 16/10/2026

Código revisado: `9cea034c1698c1b4d515991c8d693c83a97bfa86`, desde main `e0de970`; preparación conservada en `0b9bf7a`. [Cierre por criterio](../../BLOQUE_17_CARTA_IMAGEN_Y_SIMBOLOS.md#8-implementación-y-cierre-técnico-local--16102026). La aceptación visual del autor sigue pendiente.

## Comparación equivalente

Las capturas `before` proceden de la compilación B16 anterior a editar producto; `after`, de la compilación final. No son maquetas ni montajes de imágenes. Misma carta/estado legal, paquetes, modo1-58, viewport y escala1; la referencia externa es la cuarta carta elegida. No se exige igualdad píxel a píxel. Fuentes efectivas finales confirmadas por Chrome DevTools: **Segoe UI**, encabezado SegoeUI-Bold; CSS PC nombre16/valores14, compacta nombre18/valores14, sin nuevas fuentes.

| Escena | Antes | Referencia | Después |
|---|---|---|---|
| Espíritu del arcoíris, activo Poder / propio Astucia | [Carta](before/criaturas-magicas-1320-carta-038.png) | [PNG elegido](referencia/carta-elegida-16-10-2026.png) | [Carta](after/criaturas-magicas-1320-carta-038.png) |
| Mano/indicadora, 1320×850 | [Producto](before/criaturas-magicas-1320-full.png) | Cuarta carta | [Producto](after/criaturas-magicas-1320-full.png) |
| Composición 1920×1080 | [Producto](before/criaturas-magicas-1920-full.png) | No sustituye el encuadre1320 | [Producto](after/criaturas-magicas-1920-full.png) |
| Mesa durante revisión, 1320×850 | [Producto](before/criaturas-magicas-1320-public-full.png) | Misma cara | [Producto](after/criaturas-magicas-1320-public-full.png) |
| Tritón, dos líneas | [Carta](before/criaturas-magicas-1320-carta-044.png) | Decisión de relleno §4 | [Carta](after/criaturas-magicas-1320-carta-044.png) |
| Grifo, dos líneas | [Carta](before/criaturas-magicas-1320-carta-032.png) | Decisión de relleno §4 | [Carta](after/criaturas-magicas-1320-carta-032.png) |
| 67P, dos líneas | [Carta](before/sistema-solar-1320-67p-churyumov-gerasimenko.png) | Decisión de relleno §4 | [Carta](after/sistema-solar-1320-67p-churyumov-gerasimenko.png) |
| Genérica null | [Producto](before/generica-1320-full.png) | Icono existente | [Producto](after/generica-1320-full.png) |
| Compacta390×844 /360×800 | [390](before/compacta-390-full.png), [360](before/compacta-360-full.png) | Cara B15 conservada | [390](after/compacta-390-full.png), [360](after/compacta-360-full.png) |
| Detalles desde normal | [Producto](before/criaturas-magicas-1320-details-full.png) | Solo ampliar imagen | [Producto](after/criaturas-magicas-1320-details-full.png) |
| Detalles desde compacta390 | [Producto](before/compacta-390-details-full.png) | Solo ampliar imagen | [Producto](after/compacta-390-details-full.png) |

Otras capturas del producto: [normal adaptada390, Criaturas/Dato](otros/criaturas-magicas-DISPLAY_VALUE-normal-390.png), [Solar/Dato](otros/sistema-solar-DISPLAY_VALUE-normal-390.png), [descarga fallida](otros/medio-fallido-normal-1320.png). El fallo se intercepta en la red del navegador de prueba, no en JSON o medios.

## Medidas y método

[Medidas comparadas](medidas-comparadas.json): 22 pares de muestras; JSON crudo equivalente en `before`/`after`. Contienen viewport, útil, escala/DPR, fuente, página, cajas de cartas/encabezado/imagen/filas/D, proporción original y detalle. Coordenadas de estas capturas referidas al documento; las muestras adicionales `otros/*normal-390.json` y `*1920.json` usan coordenadas del viewport en el instante del gesto. No mezclar sus posiciones absolutas.

- PC1320: útil1273; PC1920: útil1368. Exterior230×321, imagen230×172,5, D44×44 a5/5. Tabla95 y huecos5,75/5,75 en carta-038. Dos líneas: tabla88,34375 y huecos0,078125/0,078125 con relleno4,9 autorizado; [diagnóstico previo de déficit6,5](diagnostico-previo-relleno.json). No recorte ni reducción de fuente/imagen.
- Compacta390/360: útil358/328; miniatura32×32, botón inferior44, todas las métricas de caras iguales antes/después. Estado inicial residual de página8/149 px respectivamente. Scroll permitido, carruseles independientes.
- Detalles: normal PC imagen anterior104×78 → final434×325,5; compacta390:32×32 →306×229,5; compacta360:32×32 →276×207. Imagen final igual al ancho interior, relación4:3 original. Null/fallo mantienen el icono85×76.
- PC1320, Criaturas: residual301 px al inicio,356 en revisión; no se elimina desplazamiento vertical para acomodar la nueva cara. Normal adaptada390/Dato durante revisión alcanza2354 px de página (1510 residuales), con todos los bloques y texto consultables; no es el perfil compacto.

Escenas: servidor compilado con HTTP/Socket.IO reales, reloj/permutación controlados. Tres cartas propias elegidas del paquete y otra indicadora real con atributo1; prefijo legal alterna invitado/anfitrión en adquisición, anfitrión al final. Dos jugadas humanas válidas llegan a revisión. Sin puntos asignados ni acceso a manos rivales. Capturas auxiliares8/8 antes y8/8 después; las aserciones duraderas están en `tests/browser/cardFace.spec.ts` y regresiones seleccionadas.

## Comprobaciones e integridad

- [Check final](check.txt):538/538,43 archivos,70 módulos; typecheck/lint/build/arquitectura pasan.
- [Navegador final](browser-final.txt):31/31 (11 B17+20 regresiones), dos trabajadores, cero reintentos. Selección exacta expandida en el registro/cierre. [Captura anterior](before.txt) y [final](after.txt).
- [Instancia normal propia](normal-instance.json): adaptadores normales, tres versiones, JS/CSS SHA servidos iguales a dist; guardASSETS/PRODUCTO sin accesos, servidor vivo al terminar las pruebas y posteriormente cerrado por el helper. El caso de partida completa usa esa instancia. Las demás escenas temporales sustituyen reloj/permutación y no acreditan tiempo real.
- [124 huellas APP/Git](integridad.json), [base/preparación/runtime](base.json). HTML/PNG externos contrastados con las huellas aprobadas. Ningún paquete, fuente externa o catálogo manual cambiado.
- Fallos y reparaciones conservados: [26 PASS/5 FAIL iniciales](browser-first-failed.txt), [30 PASS/1 FAIL posterior](browser-second-failed.txt), [repetición focal de regresiones](repair-focused.txt), [foco concurrente](focus-repair.txt). La posición relativa contiene el thead oculto; el ref limita transferencia de foco a la misma carta. El cierre nativo del ensayo espera desmontaje React. Los registros con fallo no acreditan verificación.

Windows/Chrome automatizado, DPR1/escala1, sin cambiar zoom ni probar dispositivo físico/lector humano. Revisión visual de capturas realizada por el agente; **aprobación visual humana pendiente**. Sin CI/Linux nueva, publicación o despliegue; C09–C10 parciales. Instrucciones de dos sesiones y casos para el autor en README vigente.
