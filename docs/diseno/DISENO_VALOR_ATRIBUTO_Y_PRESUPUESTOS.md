# KARTA3 — Valor del Atributo y presupuestos de texto

**14/10/2026. Referencia final de distribución para SDD, con refinamiento aprobado por el autor.** Orden compacto vigente: **puntuaciones/identidades arriba → resumen de turno → Mesa lateral → mano lateral independiente y botones de jugar**. Sustituye la cabecera combinada de puntuaciones/turno del 13/10; no aprueba nuevos tamaños, fuentes, recortes o eliminación de contenido. Se conservan ambos modos, Detalles informativo sin J y el umbral de **1368 px útiles**. Todo lo comprobado aquí corresponde a maquetas, no producto ni dispositivos físicos.

**Prioridad de lectura para SDD:** utilizar primero [Referencia final del 14/10 y aceptación](#referencia-final-del-1410-y-aceptación-para-sdd). Las referencias anteriores se conservan como evidencia de carta, contenido, consultas y mediciones; **su cabecera combinada no es la distribución vigente**. El [Complemento §7.7](#complemento-77-medidas-referencias-y-conclusiones) conserva los ensayos históricos de fuente/espacio. No trasladar pendientes antiguos ya resueltos ni sustituir el orden final por el de una imagen anterior.

**Antecedente aprobado el 13/10, refinado el 14/10:** se conservan Mesa/mano laterales, carta y consultas. La cabecera esquemática que incluía puntuaciones dentro del resumen queda sustituida. [Móvil compacta anterior](valor-atributo-propuestas/movil-compacta.html?mode=data), [Dato anterior](valor-atributo-propuestas/capturas/movil-compacta-dato-390.png) y [1-58 anterior](valor-atributo-propuestas/capturas/movil-compacta-1-58-390.png) no deben utilizarse para decidir ahora la ubicación de puntuaciones. La mano apilada continúa descartada.

Trabajo exclusivamente en `E:\KARTA3\KARTA3_IA\APP\karta3`, rama existente `feat/b14-sistema-solar`, base leída `b2b29153d6e072c4735edc5d3ff4dce43bee0dd6`. Se crean únicamente documentación y maquetas bajo `docs/diseno`. No se modifican fuentes generales, producto, contratos o barajas, ni se ejecutan pruebas de producto, publicación o despliegue.

## Referencia final del 14/10 y aceptación para SDD

### Referencia elegida y procedencia exacta

**Referencia visual final de orden, con puntuaciones visibles arriba:** [móvil final 1-58, 390 × 844](valor-atributo-propuestas/capturas/referencia-final-14/movil-final-1-58-390.png).

Ruta exacta:
`E:\KARTA3\KARTA3_IA\APP\karta3\docs\diseno\valor-atributo-propuestas\capturas\referencia-final-14\movil-final-1-58-390.png`

**Encuadre equivalente después de apartar puntuaciones:** [resumen → Mesa → mano, 1-58, 390 × 800](valor-atributo-propuestas/capturas/referencia-final-14/movil-final-1-58-encuadre.png). Este encuadre ilustra el objetivo jugable; no reemplaza la referencia completa ni oculta definitivamente puntuaciones.

Ruta exacta:
`E:\KARTA3\KARTA3_IA\APP\karta3\docs\diseno\valor-atributo-propuestas\capturas\referencia-final-14\movil-final-1-58-encuadre.png`

El mismo orden en el segundo modo: [Dato, 390 × 844](valor-atributo-propuestas/capturas/referencia-final-14/movil-final-dato-390.png), [Dato encuadrado, 390 × 800](valor-atributo-propuestas/capturas/referencia-final-14/movil-final-dato-encuadre.png) y [Dato, 360 × 800](valor-atributo-propuestas/capturas/referencia-final-14/movil-final-dato-360.png). [Maqueta final aislada](valor-atributo-propuestas/referencia-final-14.html?opt=1&mode=play); usar `mode=data` para Dato. Las medidas de carta/fuente se conservan de la maqueta anterior; esta revisión cambia únicamente separación y posición de puntuaciones, y sus referencias de foco.

**Última captura aportada por el autor:** origen `C:\Users\Adrian\AppData\Local\Temp\codex-clipboard-4212cb66-b976-4786-923b-d5274b915fe0.png`. Se conserva una copia sin editar en [referencia del autor](valor-atributo-propuestas/capturas/referencia-final-14/referencia-autor-4212cb66.png), ruta estable:
`E:\KARTA3\KARTA3_IA\APP\karta3\docs\diseno\valor-atributo-propuestas\capturas\referencia-final-14\referencia-autor-4212cb66.png`

Esa captura muestra continuidad de resumen/Mesa/mano con los bloques apartados. **Es referencia de orden, no una nueva aprobación de dimensiones, imagen, tipografía o contenido.** Para SDD, la referencia completa final y su variante Dato anteriores hacen explícito dónde quedan las puntuaciones y qué sigue siendo consultable.

### Condiciones de aceptación de distribución

1. En compacta, puntuaciones/identidades **antes y fuera** del resumen de turno. Conservan inicial/puntos, posición estable/O y consulta completa. Se apartan mediante scroll natural; no se eliminan ni se insertan dentro del resumen.
2. A continuación, secuencia continua **resumen de turno → Mesa → mano y acciones**. No intercalar lista independiente de jugadores, carta indicadora completa, información de baraja u otros bloques secundarios. Mantener los dos carruseles independientes; la mano conserva su orden y Jugar fuera/debajo de cada carta.
3. Resumen incluye jugador activo, temporizador, ALTO/BAJO, atributo activo, acceso identificado a indicadora, ronda y mazo. La indicadora completa se consulta desde él, con sus datos y Detalles; no requiere un bloque permanente entre Mesa y mano. Abridor e identidades siguen consultables sin perder información.
4. Avisos propios, Información de la baraja y Cancelar partida permanecen accesibles según permisos/estado. En esta maqueta, avisos/cancelación están antes del área de juego y la información de baraja después de mano, además de su acceso desde Detalles. Admitir crecimiento/scroll para avisos obligatorios; no ocultarlos para conseguir el encuadre.
5. Sin altura fija, cabecera flotante ni espaciadores artificiales para forzar el resumen a una coordenada. El scroll depende de contenido y altura útil. En el caso de 390 × 800 de la maqueta, 182 px de desplazamiento dejan las puntuaciones fuera y el resumen al comienzo; **no es una cantidad normativa de scroll**.
6. «Optimizar para móvil» inicialmente No. Sí + contenedor útil < 1368 px → compacta final; desde 1368 → **misma presentación normal que con No**. Con No → normal adaptada. Medir el contenedor interior disponible; no dispositivo/orientación. El orden refinado no modifica la composición PC ni el umbral ya aprobado.
7. Ambos modos conservan exactamente la misma distribución: 1-58 muestra playValue; Dato muestra dato/unidad; Detalles siempre informativo sin J. No usar el cambio de orden para añadir Ambos, reinterpretar unidades, cambiar motor, redondear en ejecución o perder contenido.
8. Mantener consulta/teclado/foco de las identidades trasladadas. Al cruzar el umbral, foco en el control equivalente de la misma persona; consulta no juega ni reinicia plazos. La aprobación de este orden no cierra las propuestas extremas de tamaño/salto ni acredita funcionamiento de producto.

### Descripciones sustituidas: no implementar la cabecera combinada

- **VA-12 anterior**, el párrafo «cabecera de tres bandas» y la primera referencia móvil del 13/10 situaban puntuaciones dentro de la cabecera de turno. Los sustituye el orden final del 14/10. Ronda/mazo continúan en el resumen; solo puntuaciones/identidades salen arriba.
- `movil-compacta.html` y sus capturas, y `complemento-7-7.html` con capturas de `capturas/complemento-7-7/`, se conservan como antecedentes. **No copiar su fila de puntuaciones dentro del resumen.** Sus consultas, formatos, pruebas de fuente/espacio y controles siguen siendo evidencia en su alcance original.
- La secuencia normal adaptada con turno → jugadores → Mesa → indicadora → mano **no es** el modo compacto final. Con la opción No puede conservarse la normal adaptada; con Sí y ancho inferior al umbral debe aplicarse la secuencia final.
- Las referencias PC, reglas de valor/Detalles y umbral no quedan sustituidos. SDD debe registrar esta precedencia y comparar el producto con las capturas finales a modo/estado/tamaño equivalentes, explicando cualquier incompatibilidad antes de cambiarla.

### Evidencia proporcional de esta revisión

[Registro del 14/10](valor-atributo-propuestas/medidas-referencia-final-14.json) y [recorrido exclusivo del refinamiento](valor-atributo-propuestas/referencia-final-14.mjs). Se ejecutaron **13 comprobaciones focalizadas**, correctas: orden y separación, bloque oculto en compacta, contenido del resumen, apartar puntuaciones por scroll, geometría/fuente de cartas sin cambios, consulta/foco del control trasladado y su equivalente al redimensionar, Detalles informativo en 1-58, normal on/off desde 1368, normal adaptada con No, referencias previas intactas y ausencia de errores JS.

En 390 × 844, la banda independiente de puntuaciones mide 62 px; resumen 105.08 px, Mesa empieza en y=297.45 y mano en y=610.67, en ambos modos. Carta de muestra mantiene 220 × 188, nombre 18 y valores 14 px, imagen de 32. Son medidas del ejemplo conservado, **no nuevas medidas aprobadas por el refinamiento**. La toma 390 × 800 tras scroll empieza por resumen, seguido de Mesa y mano; no se añadió altura artificial para lograrlo.

[Normal on](valor-atributo-propuestas/capturas/referencia-final-14/normal-1368-on.png) y [normal off](valor-atributo-propuestas/capturas/referencia-final-14/normal-1368-off.png) a 1368 útiles: geometría, fuentes, textos y recursos iguales. El registro distingue pequeñas variaciones de rasterización en las fotografías de identidad binaria de PNG; no fija tolerancia normativa ni atribuye esas variaciones a un cambio de diseño.

No se repitieron las 75 composiciones, pruebas de texto200/zoom/contrastes, quinta carta o gestos del 13/10: el cambio no modifica esas implementaciones de maqueta y su evidencia anterior sigue siendo válida en el alcance registrado. Las **22 comprobaciones históricas** no se presentan como una nueva batería del 14/10. No se ejecutó producto, pruebas de permisos/transporte/reloj real, publicación o dispositivos físicos. **B14-R01–R04 continúan pendientes.** Se conserva el trabajo documental paralelo y no se realizan commits conjuntos.

## Fuentes consultadas

- [Aplicación §§7.5–7.7](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), [dominio §5.2](../../../../TFM/Planificación/DOMINIO_KARTA3.md) e [infraestructura §9.5](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md).
- [AGENTS](../../AGENTS.md), [B14 y controles pendientes](../sdd/BLOQUE_14_INCORPORACION_SISTEMA_SOLAR.md), [contrato vigente](../contratos/CONTRATO_BARAJAS_V1.md), [índice de referencias de Diseño](README.md) y [mesa centrada](AJUSTE_MESA_CENTRADA_03.md).
- Presentación leída: [GameCard](../../src/GameCard.tsx), [estilos](../../src/style.css) y [contrato de vistas](../../shared/contracts/game.ts).
- Copias APP de [genérica](../../barajas/generica/cartas.json) y [Sistema Solar](../../barajas/sistema-solar/cartas.json), con sus metadatos, instrucciones y recursos actuales. Se conserva la procedencia/atribución de esas barajas; no se hace una nueva validación científica ni se generan imágenes.

Las fuentes generales cierran **diez grafemas extendidos para el contenido visible conjunto**, con NFC y unión literal según Infraestructura §9.5, para el futuro formato 2. Sustituyen «6 de valor + 3 de unidad». Es una regla aprobada, todavía sin implementar en producto; no aplicar retroactivamente al formato 1.

## Decisiones elegidas con el autor

| ID | Decisión acordada |
| --- | --- |
| VA-01 | Selector «Valor del Atributo»: «1-58» inicial o «Dato», sin «Ambos». Lo configura el anfitrión durante preparación, persiste al cambiar baraja y queda fijo para todos al iniciar. |
| VA-02 | Tres atributos y dos columnas: símbolo/nombre y valor elegido. «1-58» muestra playValue; «Dato», displayValue y unidad juntos. Mantener nombre, imagen, icono propio y marca activa. |
| VA-03 | Detalles siempre contiene dato temático y unidad, característica/notas, sin J ni una columna adicional de valor jugable; también al elegir «1-58». |
| VA-04 | Máximo de **10 caracteres visibles para valor + unidad juntos**, incluidos signo, puntuación, separadores y espacio. Valor y unidad comparten espacio; no reservar seis/tres por separado. Con unidad vacía no añadir un espacio artificial. |
| VA-05 | Representación elegida por cada baraja: números, fechas, eras geológicas u otros textos. DD/MM/AAAA es un ejemplo de diez, no el formato universal exigido. Unidades comunes en Solar; otras barajas pueden usar unidades distintas entre cartas por su objetivo educativo. |
| VA-06 | Para el atributo Distancia de Solar, explorar contenido editorial en millones de kilómetros, con notación **MKm** (M mayúscula, K mayúscula, m minúscula). Explicar esa notación en la información de la baraja. No convertir automáticamente kilómetros en la aplicación. Diámetro conserva km en estas muestras. |
| VA-07 | Precisión variable: mayor precisión que permita el presupuesto, sin rellenar con ceros para igualar longitudes. El autor acepta la imprecisión del redondeo para este juego; no persigue precisión académica. Sigue sin autorizar decimales ficticios o nuevos valores jugables. |
| VA-08 | Abreviaturas aprobadas para Solar: **Vel** y **Dist**, con significado en instrucciones. Un solo nombre almacenado; Detalles muestra ese mismo nombre. **Triángulo completo** se conserva; Triáng. no está aprobado. Sin modificar JSON en esta entrega. |
| VA-09 | Fuentes actuales como referencia; valores a 14 px. Carta PC de 230 × 321 px como punto de partida. Móvil puede adaptar su forma; no reducir letra para introducir más caracteres. |
| VA-10 | **«Optimizar para móvil»**, opción del anfitrión, inicialmente desactivada, configurable durante preparación y fija al iniciar. Con opción activada y ancho útil **menor de 1368 px**, composición compacta; desde 1368, normal. Con opción desactivada, normal adaptada en cualquier ancho. Umbral aprobado por el autor en este complemento; no depende del dispositivo u orientación. |
| VA-11 | Comparación, bots y orden público siguen por playValue; revisión usa ranking del servidor. Igualdad visible de datos no crea empate de jugada. No cambiar privacidad, tiempos, puntos, permisos o envío. |
| VA-12 | **Refinado el 14/10:** puntuaciones/identidades arriba y fuera del resumen; a continuación **resumen de turno → Mesa lateral → mano lateral independiente y Jugar**. Resumen: atributo, turno/tiempo, ALTO/BAJO, acceso a indicadora, ronda y mazo. Sin lista/indicadora completas intercaladas, altura fija o cabecera flotante. |
| VA-13 | Iniciales coincidentes: sufijo estable del orden base para jugadores y O para observador (A·1/A·2/A·O), también en autores públicos. Consulta accesible completa de nombres, «tú», roles, dificultad, abridor, activo, automático y desconexión; observador sin puntos, bots sin presencia humana. |
| VA-14 | Avisos propios, Información de la baraja e instrucciones y Cancelar partida para HOST no se pierden al compactar. Admitir crecimiento/scroll; confirmación y permisos B13 conservados. |

La preferencia expresada por el autor es promover pantallas grandes para la experiencia educativa y conservar una alternativa jugable en móvil para ocio. **No son dos categorías de jugadores ni permisos distintos**; ambas presentaciones mantienen la información y las reglas acordadas.

## Referencia móvil del 13/10: antecedente de carta y consultas

**Orden de puntuaciones sustituido por la referencia final del 14/10.** Conservar estas capturas/medidas como antecedentes, no como cabecera combinada a implementar.

- [Móvil compacta «Dato», 390 × 844](valor-atributo-propuestas/capturas/movil-compacta-dato-390.png), [«1-58», mismo tamaño](valor-atributo-propuestas/capturas/movil-compacta-1-58-390.png) y [«Dato», 360 × 800](valor-atributo-propuestas/capturas/movil-compacta-dato-360.png).
- [Abridor](valor-atributo-propuestas/capturas/movil-compacta-abridor.png), [revisión](valor-atributo-propuestas/capturas/movil-compacta-revision.png), [quinta carta accesible](valor-atributo-propuestas/capturas/movil-compacta-quinta.png), [observador](valor-atributo-propuestas/capturas/movil-compacta-observador.png), [genérica/nulo](valor-atributo-propuestas/capturas/movil-compacta-generica.png), [nombre largo](valor-atributo-propuestas/capturas/movil-compacta-nombre-largo.png) y [Detalles](valor-atributo-propuestas/capturas/movil-compacta-detalles.png).
- [Maqueta local corregida](valor-atributo-propuestas/movil-compacta.html?mode=data); `mode=play` muestra «1-58» (defecto), `review=1` muestra revisión y `opening=1` apertura. Son parámetros de inspección, no ajustes de producto.
- [Medidas y recorrido exclusivo de esta maqueta](valor-atributo-propuestas/medidas-movil-compacta.json).

**Descripción histórica sustituida:** la cabecera del 13/10 ocupaba tres bandas: atributo/turno-tiempo; indicadora y ALTO/BAJO; iniciales/puntos, ronda y mazo. **Ya no debe implementarse así:** las puntuaciones salen arriba y fuera del resumen según la referencia final del 14/10. Ronda/mazo siguen dentro; la indicadora completa se consulta desde el resumen. Las cartas conservan icono propio y tres filas con marca activa.

En turno posterior ALTO/BAJO muestran dirección pública con controles inactivos; en la muestra de abridor están disponibles y parten sin selección. En revisión, la cabecera sustituye el tiempo humano por tiempo de revisión. Son estados ilustrativos, no nuevos comportamientos de envío/plazo. El observador no genera mano ni acciones manuales.

En Mesa/mano la referencia aprobada utiliza **carta compacta de 220 × 188 px para nombres cortos**, miniatura de **32 px**, nombre a **18 px** y valores/atributos a **14 px**; dos columnas y las tres filas sin una cabecera de tabla repetida. Son medidas de referencia para su adaptación. Detalles mantiene un control de al menos 44 px dentro y jugar otro fuera, debajo. Una segunda carta parcialmente visible y la leyenda «desliza ↔» muestran que existe contenido lateral. Con nombre largo la fila puede crecer; no se corta o reduce letra para aparentar tamaño fijo.

Los autores públicos también se muestran por inicial en esta primera muestra, con nombre completo accesible. Puntuaciones permiten consultar nombres completos; se conserva el sombreado del abridor. **Esta referencia anterior usa iniciales diferentes; el complemento aplica la regla ya cerrada de posición base/O y consulta completa.** No eliminar estados o dificultad para resolver espacio. La información se ilustra ahora en la nueva maqueta; su proyección segura y funcionamiento real siguen por especificar/verificar en producto.

Medición en Chrome con viewport móvil emulado y entrada táctil habilitada, fuentes Windows, escala 1:

| Caso | Cabecera | Mesa, banda completa | Mano, banda con acciones | Fin de contenido, incluida nota de maqueta |
| --- | ---: | ---: | ---: | ---: |
| «Dato»/«1-58», 390 × 844 | 133 px | 219 px | 249 px | y=721 px |
| «Dato», 360 × 800 | 133 px | 219 px | 249 px | y=721 px |
| Revisión, 390 × 844 | 133 px | 219 px | 249 px | y=759 px |
| Caso con nombre largo en Mesa | 133 px | 250 px | 249 px | y=752 px |

En esas muestras no hay desplazamiento horizontal de página ni desbordamiento de campos; se ven resumen, una carta completa de cada carrusel y la acción propia simultáneamente. **No se ven las tres cartas a la vez**: se consultan deslizando, como pide el autor. Avisos extensos, otras fuentes, pantalla útil más baja o más estados pueden requerir desplazamiento vertical; no se fija esta altura como garantía universal ni se añade cabecera flotante.

Recorrido solo de maqueta: quinta carta completa tras desplazar Mesa y mano sin desplazamiento impuesto; Detalles devuelve foco y no selecciona; Enter registra una selección ficticia; arrastre no selecciona; nombres completos consultables; observador sin mano generada; apertura sin dirección por defecto. Huellas de los nueve archivos de producto/contratos/barajas conservadas. No acredita gestos en un dispositivo físico, transporte o permisos reales ni controles B14-R01–R04.

## Maquetas independientes y referencias accesibles

[Comparador original de columnas y contenido](valor-atributo-propuestas/maqueta.html): elegir modo, baraja, contenido actual/propuesto y opción móvil. Son controles de inspección local, no el formulario de preparación del producto. La opción móvil empieza desactivada. No hay conexión, partida o envío real. El JS puede simular selección para comprobar acceso, sin ejecutar Game. Su variante móvil apilada se conserva únicamente como antecedente descartado; para la forma móvil elegida utilizar la nueva referencia anterior.

| Referencia | Qué permite revisar |
| --- | --- |
| [PC «1-58»](valor-atributo-propuestas/capturas/pc-1-58.png) y [PC «Dato»](valor-atributo-propuestas/capturas/pc-dato.png) | Indicadora y mano de tres; misma forma y fuentes, una sola columna de valor. |
| [PC con contenido actual](valor-atributo-propuestas/capturas/pc-actual-sin-adaptar.png) | Valores largos literales; rosa señala exceso de diez y contorno discontinuo, exceso de ancho. Es comparación de incompatibilidades, no alternativa aceptada. |
| [Móvil carta «1-58»](valor-atributo-propuestas/capturas/movil-carta-1-58.png) y [móvil carta «Dato»](valor-atributo-propuestas/capturas/movil-carta-dato.png) | Carta estrecha y consulta horizontal de mano, preservando imagen y sus tres atributos. |
| [Primera móvil optimizada «1-58»](valor-atributo-propuestas/capturas/movil-optimizada-1-58.png) y [«Dato»](valor-atributo-propuestas/capturas/movil-optimizada-dato.png) | **Antecedente descartado por el autor:** panel más ancho y bajo con mano vertical. Sus medidas de texto siguen siendo datos de comparación, no diseño elegido. |
| [Primera mano móvil en vertical](valor-atributo-propuestas/capturas/movil-optimizada-mano-dato.png) | Antecedente descartado; no implementar esa distribución. |
| [Detalles PC](valor-atributo-propuestas/capturas/detalles-pc.png) y [Detalles móvil](valor-atributo-propuestas/capturas/detalles-movil.png) | Dato y unidad sin J, imagen, característica, nota y cierre accesible. La muestra móvil se abrió estando en «1-58». |
| [Genérica «Dato»](valor-atributo-propuestas/capturas/generica-dato.png) | Nulo gráfico/icono neutro y dato igual al rango, sin duplicación. |
| [Revisión de cinco, cuatro visibles](valor-atributo-propuestas/capturas/revision-cinco-primeras-cuatro.png) y [consulta de quinta](valor-atributo-propuestas/capturas/revision-quinta-accesible.png) | Autores y acceso a todas las cartas; Encke/Borrelly siguen mostrando 4.8 km con orden de ejemplo por sus rangos diferentes. |
| [Fechas/textos y contraste](valor-atributo-propuestas/capturas/fechas-textos-contraste.png) | Ejemplos ficticios identificados y casos que cumplen recuento pero exceden ancho. |
| [Nombre actual extenso](valor-atributo-propuestas/capturas/nombre-actual-extenso.png) | «67P / Churyumov-Gerasimenko», nombre real de 27 caracteres conservado. |

Las notas «Propuesta editorial · maqueta» están fuera del borde de carta para identificar incluso las capturas recortadas. No se proponen como texto del producto. Tampoco se propone el color rosa/contorno de diagnóstico como estado de juego.

El contenido propuesto usa MKm, redondeo decimal al más próximo con mitad hacia arriba para los números positivos de estas muestras, y abreviaturas declaradas. El criterio de precisión está acordado; el texto final de cada carta sigue pendiente de revisión editorial/Gestor. La fecha 13/10/2026, «2.5 eones», «Indefinido» y las cadenas de W/i son **ejemplos ficticios**, no nuevas cartas publicables ni datos científicos contrastados.

`Triángulo` tiene nueve caracteres y permanece completo según el cierre posterior de Aplicación §7.5. **Triáng.** solo sobrevive en los primeros antecedentes de comparación; no está aprobado ni debe trasladarse. El complemento conserva Triángulo completo. El dato genérico no se altera.

## Medidas reales de las maquetas

Registro completo en [medidas.json](valor-atributo-propuestas/medidas.json); [alternativas editoriales](valor-atributo-propuestas/alternativas-editoriales.json) conserva fuente y propuesta para comparación. Ese archivo **no es un paquete de baraja ni una propuesta de doble representación en el contrato**.

Entorno: Windows, Chrome **154.0.8037.98** sin interfaz visible, Node **24.13.0**, escala 1; viewports 1920 × 1080, 390 × 844 y 360 × 800 CSS px. No equivalen a dispositivos físicos. La familia solicitada coincide con producto; Chrome identifica **Segoe UI** como fuente efectiva. Valores 14 px/peso 400; atributos 14 px/peso 700; nombres PC 16 px y móvil 18 px. Las capturas son de secciones/modal, no acreditan una página completa sin desplazamiento.

| Representación | Carta medida | Espacio útil de atributo* | Espacio útil de valor* |
| --- | --- | ---: | ---: |
| PC carta | 230 × 321 | 100.08 px | 91.92 px |
| Móvil carta, viewport 390/360 | 220 × 333 en muestra corta | 94.88 px | 87.13 px |
| Móvil optimizada, viewport 390 | 332 × 248 | 153.11 px | 140.89 px |
| Móvil optimizada, viewport 360 | 302 × 248 | 137.52 px | 126.48 px |

*Celdas sin padding. Se usa proporción 52/48 en ambas columnas; no es una nueva medida aprobada de producto. El ancho móvil responde a los márgenes del comparador: deberá comprobarse de nuevo al componer la mesa real. Botón exterior de jugar y nota de maqueta no están incluidos en la altura de carta.

| Cadena de valor | Caracteres | Ancho a 14 px |
| --- | ---: | ---: |
| 58 | 2 | 15.09 px |
| 12.34 km/s | 10 | 67.48 px |
| 81339 MKm | 9 | 74.33 px |
| 13/10/2026 | 10 | 71.30 px |
| 999999 MKm | 10 | 81.88 px |
| 2.5 eones | 9 | 58.69 px |
| WWWWWWWWWW | 10 | **130.78 px** |
| iiiiiiiiii | 10 | **33.91 px** |

**Resultado:** la propuesta editorial de las 174 posiciones de Solar y 174 de genérica no excede diez ni el espacio medido de los perfiles ensayados. Solar actual tiene **57 posiciones que exceden diez**; la propuesta modifica 81 cadenas conjuntas, incluidas las 58 distancias. Se trata de medidas de texto en maqueta, no validación científica/editorial o pruebas de producto. Diez W caben en la optimizada de 390, pero no en la de 360 ni en carta; es una limitación real que no se resuelve con el contador.

### Símbolo + ocho caracteres de atributo

La medición incluye símbolo, nombre, separaciones y marca activa pequeña; no ocho letras aisladas. En PC, con marca: Cuadrado (8) ocupa 89.52 px; Diámetro (8), 87.53; Velocidad (9), 89.88; Distancia (9), 85.92; Triángulo (9), 88.20; **ocho W, 138.31**. Los nombres actuales caben visualmente en los anchos ensayados aunque algunos excedan ocho.

La hipótesis de ocho queda superada como máximo obligatorio: el techo técnico aprobado es 32 puntos de código, sin garantía de ancho. Vel/Dist están aprobados; Triángulo permanece completo. Las medidas anteriores siguen siendo evidencia de anchura, no una validación universal. No abreviar nombres arbitrarios en ejecución.

### Nombre, información extensa y Detalles

La propuesta PC conserva dos líneas de nombre sin recortar: 16 px con línea de 20 px, espacio de unos 187 px por línea. El nombre de 67P ocupa dos líneas/40 px y cabe en 230 × 321. **La línea de 20 px es una propuesta local**, no una reducción de fuente ni un cambio en producto.

En móvil carta, manteniendo 18 px y línea de 24, se permite crecer: 67P produce **220 × 357**. Se evita cortar nombre o Detalles para aparentar proporción fija. En optimizada, ese nombre cabe en dos líneas conservando 248 px de alto. Son alternativas visuales pendientes; no imponer un máximo de 27 solo porque sea el mayor de Solar.

Detalles se mide en la primera referencia a 480 px en PC y 352 en viewport móvil de 390, con altura máxima de viewport menos 36 y desplazamiento natural. No tiene J. **Corrección normativa respecto a esos antecedentes:** Detalles utiliza el único nombre almacenado (Vel/Dist en la propuesta Solar), con significado completo accesible en instrucciones, no el nombre fuente reconstruido. El complemento lo muestra así. Detalles no reconstruye el dato original largo a partir del redondeado; carta y Detalles comparten dato/unidad informativos, sin segunda cadena JSON.

Inventario de contenido actual, **no límites aprobados**:

| Campo | Máximo observado en Solar | Máximo observado en genérica | Tratamiento recomendado/provisional |
| --- | ---: | ---: | --- |
| Nombre de carta | 27 | 8 | 1–2 líneas PC; mantener nombre íntegro; límite de caracteres definitivo pendiente. |
| Característica | 13 | 0 | Texto en Detalles; cierre semántico/editorial pendiente, sin aplicar diez a este párrafo. |
| Nota de carta | 76 | 0 | Párrafo íntegro y scroll de Detalles cuando sea necesario; límite técnico/editorial pendiente. |
| Texto alternativo de imagen | 101 | 0 | Descripción accesible completa; no reducir por el ancho de la carta. |
| Nombre de baraja | 13 | 24 | Comprobar también ficha/cabecera en su ámbito; no hay máximo derivado de estas cartas. |
| Descripción de baraja | 249 | 279 | Información de baraja; pendiente de su presupuesto propio. |
| Notas de baraja | 581 | 1073 | Contenido extenso fuera de carta; no recortar por la regla de diez. |
| Instrucciones de baraja | 750 | 638 | Explicar unidades/abreviaturas y criterio editorial; presupuesto propio pendiente. |

Subtítulos de ambas están vacíos. Créditos, fuentes, URLs, rutas e ids conservan contrato/tipos y controles vigentes; no se proponen límites nuevos por la geometría de esta maqueta. Estos campos no se han maquetado todos en esta entrega y sus límites no se dan por cerrados.

## Presupuestos recomendados y decisiones aún abiertas

- **Cerrado:** diez grafemas extendidos UAX #29, texto ya NFC y unión mediante U+0020 solo con unidad no vacía, según Infraestructura §9.5. Intl.Segmenter se utiliza para inspección de maqueta; no es la entrega del futuro validador ni acredita sus casos Unicode.
- **Recomendación visual para esta fuente ensayada:** valor de aproximadamente **84 px como objetivo editorial**, frente a 87.13 útiles en el perfil más estrecho; símbolo/nombre/marca, aproximadamente **92 px**, frente a 94.88. Son márgenes orientativos para revisión visual, no capacidades universales de fuente/dispositivo ni restricciones implementadas en el paquete.
- **Atributo:** máximo técnico 32 puntos de código; comprobar ancho con símbolo/marca. Triángulo completo. La hipótesis de ocho no es un límite obligatorio.
- **Nombre de carta:** máximo técnico 128 puntos de código; dos líneas como referencia PC, con crecimiento íntegro cuando no quepa. No aprobar visualmente cualquier nombre por cumplir el techo técnico.
- **Texto temático:** párrafos íntegros en Detalles; topes técnicos ya cerrados en Infraestructura §9.5. Diez solo se refiere a dato/unidad, no al contenido entero de Detalles.
- **Optimizada móvil vigente:** puntuaciones/identidades arriba y fuera del resumen; después **resumen → Mesa → mano**, con carruseles independientes, según la referencia final del 14/10. La geometría previa de carta se conserva como referencia sin nuevas aprobaciones. La mano apilada permanece descartada. Continúan pendientes implementación/verificación en producto y valoración de las adaptaciones visuales extremas.
- **Umbral aprobado en el complemento:** 1368 px útiles. Los 760 del comparador original siguen siendo un corte histórico sin aprobación; no reutilizarlos. Medir contenedor interior disponible, incluyendo tableta/horizontal, no agente de usuario ni orientación.
- **Recuento aprobado no garantiza encaje:** resolver un texto que cumpla diez pero exceda ancho mediante revisión editorial/adaptación acordada, no fuente menor, elipsis o conversión silenciosa.

## Comprobaciones ejecutadas, alcance y limitaciones

Se renderizaron las maquetas con imágenes locales originales y nulo de genérica. Se midieron ambos presupuestos sobre el contenido actual/propuesto de las dos barajas, con fuentes/espacios reales y capturas representativas. Se exploraron indicadora, mano de tres, Mesa/revisión de cinco, fechas/textos, nombre largo, decimal, unidad de cuatro y Encke/Borrelly. No se hizo una matriz de capturas exhaustiva.

Recorridos **solo de maqueta**: quinta carta completamente visible tras desplazar (276 px en PC); apertura de Detalles sin incrementar acciones de selección; cierre devuelve foco; Enter en acción exterior registra una única selección ficticia; movimiento de puntero mayor de seis píxeles no registra selección. Detalles de Hyakutake contiene las mismas cadenas temáticas en PC «Dato» y móvil «1-58», sin cabecera J. No hubo errores JS en el recorrido final.

Una primera comprobación de teclado leyó el contador antes de que el navegador completase la activación; la evidencia definitiva espera la actualización y registra una selección. La medición final también conserva el tamaño real de la marca activa y evita que el estilo móvil afecte accidentalmente al diálogo. Son correcciones de la maqueta, no reparaciones de producto.

Las huellas antes/después de nueve archivos de producto/contrato/barajas son idénticas en [el registro](valor-atributo-propuestas/medidas.json). No se ejecutó Game, servidor, build, check o navegador de producto. No se prueban privacidad real, envío/dedupe, persistencia, plazos, reconexión, ranking del servidor, T04/B13 o aceptación humana en dispositivos físicos. El primer registro no incluye zoom200; el complemento lo explora de forma emulada, sin acreditar fuentes Android/iOS, zoom de navegador físico o accesibilidad completa. **B14-R01–R04 siguen pendientes de replanificación/comprobación; estas maquetas no los completan.**

## Alineación normativa recibida: cierres que sustituyen los pendientes iniciales

Infraestructura §9.5 ya cierra formato 2, NFC/UAX #29, unión literal, errores, compatibilidad y topes. Mantener histórico formato 1; futuro catálogo normal solo con copias 2 editorialmente aprobadas, consumidor y adaptación entregados juntos. No introducir segundo nombre/dato JSON, diccionario temático, conversión en ejecución o cambios de playValue. Gestor prepara versiones/manifiesto y contenido; esta entrega no valida o copia paquetes.

| Campo | Techo técnico aprobado, puntos de código Unicode NFC salvo dato/unidad |
| --- | ---: |
| Nombre de atributo | 32 |
| Nombre de carta/baraja | 128 |
| Subtítulo de baraja | 256 |
| Característica / alt de carta o portada | 1024 por campo |
| Descripción de baraja / nota de carta | 4096 por campo |
| Notas / instrucciones de baraja | 16384 por campo |
| Dato + unidad juntos | 10 grafemas extendidos |

No confundir techo técnico con presupuesto visual o aprobación editorial. SDD concretará versión Unicode/ICU, diagnóstico y casos de validación conforme a esa fuente; no se entrega un nuevo contrato/validador desde Diseño. Los máximos observados del inventario anterior son antecedentes, no límites.

## Complemento §7.7: medidas, referencias y conclusiones

**Evidencia del 13/10 conservada.** El umbral y las reglas de contenido/consultas siguen vigentes. La fila de puntuaciones dentro del resumen que aparece en estas capturas queda sustituida por la referencia final del 14/10; las mediciones históricas de altura no son medidas de la nueva distribución.

### Umbral por ancho útil, aprobado tras presentar la propuesta

El autor respondió **«Aprobar 1368 px útiles»** el 13/10/2026, después de presentar la propuesta y antes de fijarla en esta entrega. La medida deriva de la composición normal aprobada: `5 × 264 + 4 × 12 = 1368`. Cada columna contiene carta de 230 y margen/padding/borde; Mesa ocupa 1092 y mano 816, con 1058/782 px interiores respectivamente. Caben cuatro cartas públicas y tres propias completas; la quinta pública se consulta lateralmente en normal.

**Regla elegida:** opción No → normal adaptada; opción Sí y útil < 1368 → compacta; opción Sí y útil ≥ 1368 → normal. Medir el ancho interior disponible para la cuadrícula **después** de márgenes, padding, barras y otros espacios reservados. No comparar `screen.width`, nombre de dispositivo, DPR, orientación ni ancho nominal de ventana. En la maqueta hay 16 px exteriores a cada lado: 1399/1400 de viewport producen 1367/1368 útiles. En producto puede corresponder otro ancho exterior; SDD debe medir el contenedor real.

La maqueta se centra con máximo exterior 1400; viewport 1920 mantiene 1368 útiles. ResizeObserver observa el contenedor disponible, no la pista desbordada de un carrusel. No cambiar el ancho reservado al alternar formas para crear una oscilación de umbral. Una barra real que reduzca el ancho debe quedar reflejada en la medida: esta muestra headless no acredita combinaciones de barras del usuario.

[Maqueta complementaria](valor-atributo-propuestas/complemento-7-7.html?opt=1&mode=data), [medidas completas](valor-atributo-propuestas/medidas-complemento-7-7.json) y [recorrido reproducible de maqueta](valor-atributo-propuestas/medir-complemento-7-7.mjs). Parámetros de inspección `opt=0/1`, `mode=play/data`, `review=1`, `opening=1`, `role=observer/guest`, `auto=1`, `disconnected=1`, `warn=1`, `deck=generic` y `stress=1`; no son parámetros de producto. Omitir opt conserva No y omitir mode conserva 1-58.

Se midieron 75 composiciones: los anchos pedidos como viewport **y** como útiles, ambos modos/on-off en el recorrido principal, estados representativos y tableta/horizontal. Es un registro numérico, no una matriz exhaustiva de capturas. En ambos modos se obtuvo la misma selección de forma y sin desbordamiento horizontal de página/celdas en las muestras.

| Viewport CSS, altura registrada | Útil | Opción Sí | Opción No |
| --- | ---: | --- | --- |
| 360 × 800 / 390 × 844 | 328 / 358 | Compacta | Normal adaptada |
| 600/700/760/800/900 × 1080 | 568/668/728/768/868 | Compacta | Normal adaptada |
| 632/732/792/832/932/1056 × 820 | **600/700/760/800/900/1024** | Compacta | Normal adaptada |
| 768 × 1024, tableta vertical | 736 | Compacta | Normal adaptada por la misma regla |
| 844 × 390, horizontal de poca altura | 812 | Compacta; scroll vertical | Normal adaptada por la misma regla |
| 1024 × 768 y 1024 × 600 | 992 | Compacta; 4 públicas completas | Normal adaptada |
| 1180 × 820 / 1366 × 768 | 1148 / 1334 | Compacta | Normal adaptada |
| **1399 × 1080** | **1367** | **Compacta** | Normal adaptada |
| **1400/1401 × 1080** | **1368** | **Normal** | Normal |
| 1920 × 1080, área centrada | 1368 | Normal | Normal |

Las tres filas de tableta/horizontal suplementarias a 768/844/1024 se recorrieron con opción Sí/Dato; la columna No de esas filas indica la regla aplicable, no una captura adicional ejecutada. El recorrido principal sí incluye ambos valores y on/off a 1024 × 768, además de todos los anchos principales.

Referencias: [1367 útiles](valor-atributo-propuestas/capturas/complemento-7-7/transicion-1367-utiles.png), [1368 útiles](valor-atributo-propuestas/capturas/complemento-7-7/transicion-1368-utiles.png), [PC mano de tres](valor-atributo-propuestas/capturas/complemento-7-7/pc-mano-tres.png), [tableta on](valor-atributo-propuestas/capturas/complemento-7-7/tablet-1024-on.png), [tableta off](valor-atributo-propuestas/capturas/complemento-7-7/tablet-1024-off.png), [horizontal](valor-atributo-propuestas/capturas/complemento-7-7/horizontal-844.png), [móvil off/papel](valor-atributo-propuestas/capturas/complemento-7-7/movil-off-papel.png). La adaptación normal del complemento sirve de comparación de acceso; no aprueba una nueva composición intermedia en sustitución del producto por iniciativa de Diseño.

**Altura:** no se exige encuadre único. El caso compacto de revisión/nombre largo/identidades repetidas ocupa aproximadamente 1023 px a 390 × 844 y 1048 a 360 × 800; el normal de revisión, unos 1177 px a 1400/1920 × 1080. En horizontal de 844 × 390, el contenido con aviso ocupa unos 963 px. Son casos deliberadamente más exigentes que la primera referencia; no ocultar avisos, roles consultables, cancelación o instrucciones para reproducir sus 721 px históricos. Consultar la medición final para las coordenadas exactas.

### Texto íntegro, fuente, ampliación y espacio reducido

**Propuesta de adaptación visual:** conservar dos columnas, texto literal y fuente base; permitir saltos dentro de celda y crecimiento de fila/carta. La composición sigue siendo cabecera + Mesa lateral + mano lateral: no convertir mano en lista ni desplegar una sola columna de atributos. Sin menor fuente automática, elipsis, recorte, conversión o inserción de guiones en los datos.

En la compacta, carta de 220 px como referencia; si el carrusel útil no permite una completa, proponer ancho `min(220, ancho de pista − 6)` para mantener una carta completa consultable. Se reduce geometría y aumenta altura, **no** letra. Se ensayan 212 px con 218 útiles y 157 CSS px con 163 útiles al zoom. La adaptación extrema permanece **propuesta**, sin garantía para cualquier ancho o alfabetos; requiere valoración visual, no se deduce del contador.

| Caso artificial, todas las cadenas intactas | Fuente efectiva / tamaño de valor | Diez W sin salto | Carta de estrés medida |
| --- | --- | ---: | --- |
| 390 × 844, referencia | Segoe UI 14 px | 130.77 px | 220 × 231.84 |
| 360 × 800, fuente alternativa | Arial 14 px | 132.14 px | 220 × 231.84 |
| 360 × 800, texto ampliado 200 % | Georgia **28 px** | 273.16 px | 220 × 606.53 |
| 390 × 844, zoom geométrico 200 % | Segoe UI 14 CSS px, escala 2 | 130.77 CSS px | 157 × 290.23 CSS px; 314 × 580.45 en coordenadas escaladas |
| 250 × 600, espacio reducido | Segoe UI 14 px | 130.77 px | 212 × 231.84 |
| 1920 × 1080, texto ampliado 200 % | Georgia 28 px | 273.16 px | 230 × 658.52 |

Se usó Chrome 154.0.8037.98 en Windows, escala inicial 1, con confirmación de fuentes mediante el navegador. Texto200 amplía los estilos de texto, no achica celdas ni fuente. **Zoom200 usa `zoom:2` de Chromium para emular ampliación y reducción del ancho CSS útil; no es una comprobación del zoom del menú de un navegador físico.** Registrar esa diferencia; SDD/revisión humana deben completar el zoom real. Los nombres, avisos y botones también crecen; no se mantienen controles artificialmente diminutos.

Diez W se parten en dos líneas en base, cuatro en Georgia28 y tres en el caso de zoom. El DOM conserva exactamente diez W; también `999999 MKm` y diez i, sin alterar texto ni unidad. No hubo contenido dibujado fuera de sus celdas en estas muestras. Los diálogos conservaron esas cadenas completas y sin scroll horizontal; con Georgia28 móvil, contenido de unos 1417 px dentro de 762 visibles requiere scroll vertical. El botón de cierre y la consulta de instrucciones permanecen accesibles.

Esto demuestra **acceso íntegro**, no lectura rápida: partir números o palabras aumenta el esfuerzo de comparación. Diez W es un caso ficticio de contraste, no un dato autorizado para publicar. Para texto indispensable que resulte poco legible incluso íntegro, Gestor debe proponer una representación editorial explícita o devolverlo al autor/Diseño; no aceptar automáticamente por diez ni convertirlo en ejecución. La fuente base 14 permanece referencia; no se promete encaje universal.

Referencias de propuesta: [diez W base](valor-atributo-propuestas/capturas/complemento-7-7/diez-w-base.png), [Arial](valor-atributo-propuestas/capturas/complemento-7-7/diez-w-arial.png), [Georgia texto200](valor-atributo-propuestas/capturas/complemento-7-7/diez-w-georgia-texto200.png), [zoom200 emulado](valor-atributo-propuestas/capturas/complemento-7-7/diez-w-zoom200.png), [espacio250](valor-atributo-propuestas/capturas/complemento-7-7/diez-w-espacio250.png) y [PC texto200](valor-atributo-propuestas/capturas/complemento-7-7/diez-w-pc-texto200.png). Datos, fechas y unidades anteriores siguen disponibles como antecedentes. No se adaptan silenciosamente JSON de genérica o Solar.

### Identidades, consultas y controles que no se sacrifican

Fixture de cinco jugadores con dos Alex y dos Ana, todos con inicial A. Etiquetas **A·1…A·5** ligadas al orden base; los autores públicos se muestran en otro orden sin cambiar sus etiquetas. Anfitrión observador adicional **A·O**, nombre Ana repetido, sin puntos ni mano. Identidades completas en botones accesibles, nunca tooltip exclusivo o nombre convertido en id. El sombreado corresponde a A·2 abridor; turno activo explícito A·5, o bot A·1 en los estados automáticos/observador.

Cada puntuación y autor público abre una consulta con nombre, sufijo base/O, «tú», HOST/GUEST/Observador, puntos solo de jugadores, dificultad BOT Fácil/Difícil, Abridor, Juega, Automático y Sin conexión/Conectado cuando corresponde. Los bots no tienen presencia humana ni plazo propio. No se exponen mano rival, contador de timeouts ajeno o dirección parcial. Las muestras se construyen con datos locales inventados; no acreditan proyección segura de producto.

La acción identificada **Indicadora: [nombre]** abre carta/imagen/tres atributos completos y Detalles informativo. Detalles utiliza **Vel/Dist/Diámetro** de la variante editorial almacenada en el fixture, nunca reconstruye Velocidad/Distancia. El botón **Información de la baraja**, tanto desde partida como desde Detalles, abre significado e instrucciones. El contenido de esa variante está identificado como propuesta editorial no publicada; la versión fuente actual 1/contenido2 se declara como procedencia, no se presenta como una nueva selección aceptada. El futuro producto debe usar la versión seleccionada exacta y proyección pública segura, sin enviar el paquete/58 cartas.

Se conservan avisos propios de primer timeout, Automático y Conexión interrumpida; también fase final/desempate en casos representativos. Pueden añadir bandas/scroll. **Cancelar partida** aparece arriba a la derecha para HOST jugador, observador o automático, también en revisión/desempate. Invitado sin control; desconectado conserva botón visible inactivo y aviso. Confirmación exacta B13, foco inicial en **Seguir jugando**, Escape sin cancelación y retorno al botón. Confirmar solo incrementa un contador ficticio y muestra «Cancelando…»; no finaliza una partida ni simula recuperación/resultado autorizado.

Referencias: [cabecera/aviso/identidades](valor-atributo-propuestas/capturas/complemento-7-7/movil-dato-identidades.png), [1-58](valor-atributo-propuestas/capturas/complemento-7-7/movil-1-58.png), [consulta completa](valor-atributo-propuestas/capturas/complemento-7-7/identidades-completas.png), [observador](valor-atributo-propuestas/capturas/complemento-7-7/host-observador.png), [observador y consulta](valor-atributo-propuestas/capturas/complemento-7-7/observador-identidades.png), [automático/fase final](valor-atributo-propuestas/capturas/complemento-7-7/host-automatico.png), [sin conexión](valor-atributo-propuestas/capturas/complemento-7-7/host-sin-conexion.png), [invitado](valor-atributo-propuestas/capturas/complemento-7-7/invitado.png), [cancelación](valor-atributo-propuestas/capturas/complemento-7-7/cancelar-confirmacion.png), [indicadora](valor-atributo-propuestas/capturas/complemento-7-7/indicadora-dialogo.png), [instrucciones desde Detalles](valor-atributo-propuestas/capturas/complemento-7-7/informacion-desde-detalles.png) y [genérica con Triángulo](valor-atributo-propuestas/capturas/complemento-7-7/generica-triangulo.png).

### Foco, teclado, gestos y redimensionamiento: evidencia de maqueta

22 comprobaciones del recorrido final pasan; ver `checks` y `interactions` en [el registro](valor-atributo-propuestas/medidas-complemento-7-7.json). Sin errores JS, y nueve huellas de producto/contratos/barajas iguales antes/después.

- Apertura sin dirección preseleccionada. Space en ALTO registra una dirección; Enter en Jugar registra una selección ficticia. Consultar Detalles con Space no añade jugada; dato/unidad siguen informativos en modo 1-58, sin J.
- Resize 390→1400→390 con diálogo abierto conserva selección Itokawa, dirección HIGH, contadores, título/contenido y foco de cierre. El reloj es un texto de fixture, **no un reloj real probado**. Detalles/información e indicadora/Detalles permiten consulta anidada; Escape vuelve al control invocador. Tab/Shift+Tab permanecen en el diálogo; se ajustó el ciclo de foco de la maqueta tras detectar salida del último botón en el primer recorrido.
- Foco de identidad mantiene el mismo id público al cambiar de representación; si su control compacto deja de mostrarse, se restaura en el equivalente de la lista normal. Indicadora y región Mesa conservan contexto/foco. Cambiar forma no invoca acciones. [Detalles antes](valor-atributo-propuestas/capturas/complemento-7-7/detalles-antes-resize.png) y [después](valor-atributo-propuestas/capturas/complemento-7-7/detalles-despues-resize.png).
- Quinta pública completamente visible con End en Mesa: desplazamiento 788 px en el caso móvil, mano sin arrastre impuesto. Con mano situada en 60, desplazar Mesa conserva 60. [Quinta en revisión](valor-atributo-propuestas/capturas/complemento-7-7/quinta-revision.png). Flechas/Home/End de una región actúan sobre esa región.
- Arrastre de puntero sobre carta no selecciona. Gesto táctil inyectado en Chrome desplaza mano, conserva Mesa en cero y contadores de jugada/consulta en cero. Es entrada táctil emulada, no teléfono físico. El desplazamiento exacto depende de inercia; la condición comprobada es independencia y ausencia de jugada.
- Al ampliar hasta normal, un desplazamiento que ya no cabe se limita al rango disponible: en el ensayo, mano pasa de 100 a 0 porque todas sus cartas caben. Se conserva selección/identidad, no se exige mantener un scroll imposible. No se promete restaurar el antiguo offset al volver a estrechar.
- Observador sin mano generada/acciones de jugar. Escape de Cancelar no confirma; confirmación de HOST automático registra una sola intención ficticia y desactiva el botón. Autorización, envío único real, deduplicación, incertidumbre, reconexión y resultados siguen siendo controles de producto pendientes.

La primera comprobación del complemento detectó una regla de cuadrícula que encogía artificialmente la lista normal; se corrigió exclusivamente en la maqueta antes de conservar la medición final. Sus cifras intermedias no son evidencia del producto ni argumento para el umbral. El registro entregado y las referencias finales corresponden al recorrido corregido.

### Estado de aprobación y traslado al autor

| Material | Estado y uso |
| --- | --- |
| Orden final del 14/10 y sus capturas de referencia | **Vigente para SDD:** puntuaciones arriba, resumen → Mesa → mano; sustituye ubicación de puntuaciones en cabecera combinada, sin nueva aprobación de tamaños/fuentes. |
| Ambos modos, Detalles sin J, móvil con dos carruseles, PC carta | Decisiones y referencias anteriores aprobadas según Aplicación §7.7; conservar jerarquía, posición relativa, visibilidad e interacción. |
| Nombre Optimizar para móvil, defecto No, topes/NFC/formato2, iniciales posición/O | Reglas cerradas de las fuentes; incorporadas al complemento, no reabiertas. |
| **Umbral 1368 útiles** | **Aprobado expresamente por el autor en este turno.** Trasladar para alinear fuente responsable/SDD; no se edita aquí Aplicación. |
| Nuevas capturas de roles/consultas/controles | Complemento de reglas cerradas; permiten revisar presentación y especificar, no equivalen a aceptación funcional del producto. |
| Saltos íntegros, crecimiento y estrechamiento extremo de carta | **Propuestas visuales medidas**. No garantizan lectura rápida o aceptación editorial; valorar con autor donde afecte legibilidad. |
| Cadenas MKm/redondeo del fixture e instrucciones propuestas | Pendientes de revisión editorial/Gestor; no publicables por aprobación del umbral o maqueta. |
| Mano apilada, Triáng. y 760 del comparador antiguo | Antecedentes descartados/no aprobados; no implementar. |
| Zoom real, Android/iOS, aceptación en dispositivos; B14-R01–R04 | Pendientes. El complemento no los completa. |

Entrega exclusivamente al autor. Sin mensajes a otros hilos, commits, nueva rama/checkout, producto, paquetes o fuentes generales modificados. SDD conservará los cierres y referencias, registrará qué detalles históricos sustituyen las reglas vigentes y exigirá comparación visual de producto en estados/modos/tamaños equivalentes. Si surge incompatibilidad, explicarla y resolverla con autor antes de sustituir la composición. R01–R04 se replanifican conforme a Aplicación §7.7; las 22 comprobaciones de maqueta no sustituyen esas verificaciones.
