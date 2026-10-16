# B17 — Imagen protagonista y símbolos de la carta normal

**Estado:** implementación del alcance confirmado el 16/10/2026; cierre y evidencia nueva en §8. La aprobación visual humana permanece separada de la verificación técnica local.

**Aclaración del autor:** «Optimizar para móvil» conserva íntegra la visualización compacta actual. Cambia la carta normal según la cuarta referencia, con D sobre la imagen. Al abrir Detalles, tanto desde normal como desde compacta, la imagen será mayor y proporcionada como en la demo; el resto de su contenido/funcionamiento se conserva. No se solicita otra maqueta, rama experimental ni devolución previa a Diseño. Esta aclaración autoriza preparar el encargo de implementación directa del alcance definido, con sus pruebas.

**Base comprobada:** carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, main `e0de970c75abbc43ecba09ed00a1daac44a663fe`, árbol limpio al comenzar, tres commits locales por delante de origin/main. Incluye incorporación/cierre B16; conservarlos. B17 estaba libre. Verificar el estado antes de implementar; no crear ramas/checkouts, revertir bloques o mezclar trabajo posterior. Este encargo prepara únicamente documentación.

## 1. Objetivo, fuente elegida y precedencia

Refinar la **cara normal de carta completa** según la cuarta carta «Símbolos ajustados», manteniendo los datos, modos, interacción y composición de mesa vigentes. Las tres primeras variantes no son alternativas a elegir.

Referencias:

- [Entrega de Diseño del 16/10](../../../../TFM/Maquetas/DISENO_CARTA_IMAGEN_Y_SIMBOLOS_16_10_2026.md), [HTML, elemento #refined](../../../../TFM/Maquetas/comparativa-imagen-carta.html#refined) y [captura elegida](../../../../TFM/Maquetas/referencias/carta-elegida-16-10-2026.png).
- [AGENTS](../../AGENTS.md), [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), [proceso](PROCESO_SDD.md), [B15 y cierre](BLOQUE_15_FORMATO_2_Y_PRESENTACION.md), [B16 y cierre](BLOQUE_16_INCORPORACION_CRIATURAS_MAGICAS.md).
- [Aplicación §§7.1–7.7](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md): representación, destinatarios, Detalles y composición/activación. [Contrato V2](../contratos/CONTRATO_BARAJAS_V2.md) y [Infraestructura §5.3/§9](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md): contenido literal, proyecciones y recursos conservados.

La aprobación fechada del autor sustituye los elementos de cara enumerados en §7, no las reglas del juego ni el orden de bloques final del 14/10. Las menciones anteriores a imagen pequeña, cabecera visible o Detalles al pie son antecedentes de presentación a alinear por sus responsables; no se reescriben cierres o Diseño desde este hilo.

**Identidad de referencia:** HTML SHA-256 `880f8f74d0e81b736a799f3a0a43a0a80283268c32f3ef6e4b4ae7701f27bc13`, coincidente con la entrega; PNG `0ceb56180ba3300e1f0c0386bea88c5eca9804911dce0efe97fefddefd21e63d`. La captura corresponde a Chrome 155.0.8059.80/Windows, viewport 1320×850, escala inicial 1; son condiciones de maqueta, no evidencia nueva del producto.

## 2. Estado actual y alcance de representaciones

La lectura de código sitúa la representación compartida en `src/GameCard.tsx` (`GameCard`, `CardInformation`, `CardImage`, `CardDetails`) y `src/style.css`. `GameScreen` la usa en mano, indicadora normal y jugadas públicas; las públicas permanecen durante revisión. `RoundReview` ofrece además una **lista textual de ranking**, no otro conjunto de cartas que deba crearse para este bloque.

| Representación | Aplicación del incremento |
|---|---|
| Carta completa normal en mano/indicadora/Mesa/revisión | Aplicar la nueva cara coherentemente, respetando roles, autores, acciones y orden existentes. Referencia PC 230×321. |
| Normal adaptada con optimización off | Misma familia de cara completa; conservar anchos/adaptación/tipografías actuales del perfil. La imagen ocupa el ancho real de esa carta; no imponer 230 px a una carta adaptada de otro ancho. Cualquier imposibilidad de encaje sigue el control de §4. |
| Minicarta compacta B15 | **Conservar su representación actual:** miniatura, nombre, filas, Detalles inferior y Jugar exterior. No heredar D superpuesto, imagen grande ni cambios de símbolos/cabecera/separadores de la cara normal por un selector CSS global. No ampliar sus imágenes ni rediseñar su composición. |
| Consulta de indicadora completa abierta desde resumen compacto | Es carta completa, aunque esté dentro de una pantalla compacta: aplicar cara normal de referencia, con D que abre Detalles y retorno a la consulta padre. Delimitar explícitamente estilos frente al ancestro compacto. |
| Diálogo informativo Detalles desde cualquier representación | Mantener contenido/política/interacción existentes, alineando **solo su imagen grande** con la referencia del HTML según §3.3. No aplicar la cara de 230×321, D, tabla sin cabecera o círculo de fila como rediseño de este diálogo. |

No se cambia umbral/medición: optimización off → normal adaptada; on + útil <1368 CSS px → compacta; desde 1368 → misma normal on/off. La compacta conserva puntuaciones arriba, resumen, Mesa y mano laterales independientes. No modificar cabecera, posiciones de bloques, autores/ranking, quinta pública, resultados o espera.

## 3. Cambios aprobados y comportamiento

### 3.1 Cara completa normal

- **Referencia exterior:** 230×321 CSS px. Nombre e icono propio arriba, con márgenes/tipografía actuales; no sobreponer D al encabezado. No usar la nueva geometría para cambiar fuente o texto.
- **Imagen hasta el borde lateral exterior**, incluido el espacio que antes ocupaban padding/borde. Texto conserva su sangrado. Usar el mismo recurso, proporción y contenido íntegro; sin crop, estirado, sustitución o regeneración. Para 4:3 en carta de 230, la imagen mide 230×172,5. No imponer esa proporción a un recurso de otra relación: medir su encaje antes de alterar la decisión.
- **D:** un único botón 44×44, a 5 px de derecha y borde inferior de imagen, con fondo blanco/texto azul oscuro/borde azulado/redondeo del control original. El rojo no se traslada. Su solapamiento pequeño sobre la imagen es el aprobado; no recortar ni desplazar la imagen para abrir un hueco. Eliminar el antiguo botón grande inferior **solo en esta cara completa**.
- **Tabla:** tres filas/dos columnas y valor vigente 1-58 o Dato, sin cabecera **visible**. Conservar semántica accesible de tabla, encabezados/relación atributo-valor y modo aceptado; no suprimirla del árbol accesible ni anunciar un playValue extra en Dato. Dos separadores interiores y ninguno bajo la tercera fila.
- **Centrado:** distribuir el bloque entero de tres filas en el espacio entre imagen y borde inferior interior: huecos superior/inferior equivalentes si existe espacio libre. No desplazar por constantes o aumentar altura para crear hueco. Los 5,75/5,75 px pertenecen al ejemplo, no a todos los textos/fuentes.
- **Activo:** sombreado por `round.activeAttributeId` e identificación «[nombre], atributo activo»; retirar ◆ sin otra marca visible nueva. **Propio:** icono por `card.roundAttribute`, tamaño/posición actuales, aunque sea distinto del activo.
- **Círculo de fila:** geometría vectorial llena 12×12 CSS px en la fila de atributo correspondiente; fill del color de texto, sin un sistema de colores, nuevo archivo editorial o dependencia del glifo ●. Triángulo/cuadrado conservados; alineación comparable. No aplicar este tamaño globalmente al icono propio, Detalles, resumen u otras pantallas.

La escena de comparación usa **carta-038, Espíritu del arcoíris**, de Criaturas: activo Poder, propio Astucia/triángulo. En producto la fila activa nunca depende de que sea la primera. Para una escena equivalente preparar una mano/jugada legal con otra indicadora que determine Poder; no usar esa misma carta como indicadora y falsear su atributo para imitar la foto.

### 3.2 Consulta D, selección y foco

Nombre accesible exacto «Detalles de [nombre de carta]»; contenido visual D, teclado Enter/Space y pulsación simple. Cada invocación abre una consulta de la carta autorizada, sin elegir carta, completar apertura, enviar jugada ni cambiar estado del servidor.

**Riesgo concreto del componente actual:** `GameCard` tiene una superficie con selección por clic y seguimiento de arrastre. D superpuesto no puede propagar un gesto que active esa selección. Resolver composición/propagación con el mecanismo local adecuado, sin copiar el listener global de la demo ni quitar el comportamiento de selección existente. Arrastrar desde/cerca del botón para desplazar no abre consulta ni juega. El resto de imagen/superficie conserva exactamente los gestos actualmente autorizados; no introducir otros envíos.

Jugar permanece exterior/debajo de cada carta propia, con estado seleccionado/deshabilitado y envío B07/B08 actuales. Mesa/indicadora no reciben Jugar. Consultar no pausa/reinicia turno, revisión o automático: el servidor continúa y la UI adopta el estado autorizado.

Cerrar/Escape devuelve foco al invocador si sigue disponible. Si resize sustituye la representación, usar el control equivalente de **la misma carta/contexto**, sin enviar acciones. Si la carta/contexto ya desapareció por avance/cierre, usar el retorno contextual existente a región o consulta padre, sin enfocar un control oculto u otra jugada. Preservar Information anidada, cierre de un nivel y protección de respuestas/contextos antiguos B13/T04.

### 3.3 Diferencia real en Detalles y alineación mínima

La demo usa `dialog .large-picture { width:100%; height:auto }`: imagen grande, proporcionada, dentro del área útil del diálogo. El código actual de APP reutiliza `CardImage`; por lectura de CSS, la imagen hereda **78 px** en normal y reglas de **32×32** bajo `.game-compact` (la excepción de `.consultation` no convierte `CardDetails` en esa consulta). Por tanto **esa imagen grande no se da por implementada** ni las medidas de la demo se atribuyen a APP.

Incluir únicamente la alineación necesaria: imagen al ancho interior disponible del diálogo, altura proporcional, recurso/alt íntegros, sin heredar la miniatura compacta ni la caja de carta de 230 px. Conservar el contenedor modal actual, límite vertical/scroll, título, característica, tres datos/unidades, nota, Información de la baraja y cierre. La tabla informativa conserva su propia cabecera/marca Activo, sin J; no trasplantar a ella la supresión de cabecera/rombo/círculo de la cara. No copiar de la demo fixtures, carga de JSON, título simplificado o ausencia de Información.

Esta es alineación acotada de imagen de una vista ampliada aprobada, no una nueva galería, aplicación paralela o rediseño del diálogo. Las medidas efectivas actuales/resultado deberán registrarse durante Implementación; esta conclusión es inspección de estilos, no medición de navegador.

## 4. Encaje, nombres, unidades y ausencia de imagen

La única carta medida por Diseño es de nombre de una línea e imagen 4:3. No extender su aprobación a todos los contenidos. Usar las tres barajas actuales sin editar sus bytes: genérica 2/4 (null), Solar 2/4 (unidades/datos largos admitidos) y Criaturas 2/2 (nombres y Resistencia completos).

Para null conservar el icono neutro de la aplicación y acceso a Detalles, sin imagen rota o nuevo recurso. En carta completa el área de sustitución puede conservar el espacio de imagen de referencia para alojar D y centrar filas; no agrandar/deformar el icono como si fuera una ilustración. El fallo de descarga se comprueba interceptando esa petición en el montaje de pruebas, no corrompiendo JSON/recursos. Mantener icono/aviso existente «No se pudo cargar la imagen», nombre y datos completos, con D utilizable y aviso accesible sin solapamientos. No confundir fallo de red con imageRef=null o modificar su referencia.

Casos indispensables: **67P / Churyumov-Gerasimenko**, **Tritón de las profundidades**, **Grifo de plumas de hierro**, unidades/MKm de Solar, Resistencia activa/no activa y genérica sin imagen. Verificar las dos líneas reales de nombre cuando ocurran, no fabricarlas recortando su anchura. Revisar también imagen pendiente/fallida y Detalles desde normal/compacta.

**Puerta de incompatibilidad:** si nombre/filas/imagen/aviso indispensables exceden el espacio y no pueden coexistir con la referencia, no resolver con overflow oculto, elipsis, menor letra, recorte, cambio de datos, desplazamiento sobre imagen/D o crecimiento silencioso de la carta. Registrar alto de encabezado/imagen/filas/huecos/total y déficit, fuente/ancho/zoom/contexto; presentar al autor una alternativa mínima con el efecto medido **antes** de sustituir la geometría. Se puede verificar el resto, pero el criterio afectado queda abierto. La especificación no aprueba de antemano alturas mayores o nombres abreviados.

**Resolución del autor durante Implementación — 16/10/2026:** medidos 42 px de encabezado, 172,5 de imagen y 95 de filas, faltaban 6,5 px en los tres nombres largos indicados. Respuesta expresa: «Mantener 230×321 y reducir solo el relleno vertical de las filas de 6 a unos 4,9 px cuando sea necesario, conservando fuentes, imagen y contenido». Se autoriza únicamente ese ajuste condicional; no otra geometría, fuente, recorte o cambio editorial. Diagnóstico y resultado medido en §8/evidencias.

## 5. Responsabilidades y límites

| Trabajo | Responsable / dependencias | Comprobación |
|---|---|---|
| Cara, D y separación normal/miniatura/consulta/diálogo | Cliente: GameCard/CardInformation/CardImage/CardDetails y estilos locales | Solo contratos públicos; CSS delimitado por representación, sin reglas de servidor o copias editoriales. Inspección/medidas y gestos reales. |
| Foco/contexto y selección ya existentes | GameScreen y consultas/UI si requiere ajuste local | Mantener ids de carta/contexto y retorno; no nuevos endpoints, settings o preferencias. Teclado/resize/avance temporal y conteo de envíos. |
| Valores/propio/activo y cartas autorizadas | Contratos/vistas existentes **sin cambios previstos** | Usar CardView recibido; no fetch del paquete, fallback editorial local o primera fila activa fija. Privacidad y valores literales conservados. |
| Dominio, aplicación, transportes, contenido | Sin cambios en este bloque | Reglas, comparación/ranking/bots/plazos, catálogo tres, versiones/huellas y B13/T04 intactos. Check/imports y regresiones focales. |

Autonomía del implementador: estructura local de componentes, nombres de clases, SVG inline del círculo, flex/grid y eventos, técnica accesible para ocultar cabecera visual y organización de pruebas. No redefinir decisiones de tamaño/alcance/compacta o resolver un déficit cambiando contenido/diseño; devolver incompatibilidad al autor. Reutilizar el pipeline UI actual, no copiar lógica/fixtures/file-fallback de la demo al producto.

## 6. Criterios y plan de verificación previstos

Plan acordado al preparar B17. Los resultados realmente ejecutados se registran por criterio en §8; esta tabla conserva lo exigido y no sustituye esa evidencia:

| Criterio | Resultado esperado |
|---|---|
| **B17-01 — Referencia** | Cara normal equivalente a #refined, 230×321 en la escena de referencia, imagen 230×172,5 sin margen lateral/crop, mismo encabezado/fuente; D azulado 44×44 a 5 px, sin botón inferior ni cabecera visible. |
| **B17-02 — Filas/símbolos** | Tres filas/dos columnas completas, solo dos separadores, bloque centrado geométricamente, sin solapamiento. Círculo 12×12, sin ◆, activo accesible por ronda y propio conservado; caso activo distinto de propio y rotación de atributo activo. |
| **B17-03 — Modos/accesibilidad** | 1-58/Dato literales según settings, encabezados/relaciones/mode accesibles pese a invisibilidad visual, sin playValue adicional anunciado en Dato. Detalles siempre informativo sin J y con Información. |
| **B17-04 — D/gestos/foco** | Pulsación/Enter/Space abren una vez, no seleccionan ni juegan, también con dirección parcial ya aceptada; Escape/cierre vuelven al control. Arrastre no abre/juega. Jugar/superficie anterior mantienen selección/envío único. |
| **B17-05 — Usos completos** | Mano, indicadora, públicas durante turno/revisión y consulta de indicadora desde compacta coherentes; Jugar exterior/autores/orden/quinta conservados, lista textual de revisión intacta. Observador solo cartas públicas. |
| **B17-06 — Compacta** | Miniatura/cara B15 sin refinamiento normal accidental, mismos controles/scroll/identidades/composición; frontera útil 1367/1368 y normal on/off desde 1368 preservadas. Consulta de carta completa y Detalles no heredan 32 px. |
| **B17-07 — Imagen ampliada** | Detalles al ancho interior disponible y proporcionado en PC/móvil, alt/datos/característica/nota/cierre/Información íntegros, scroll/foco anidado actuales; no rediseño de tabla o carta D dentro del diálogo. |
| **B17-08 — Casos indispensables** | Nombre real de dos líneas, Resistencia, unidades, null y descarga fallida completos/legibles, con medidas/defecto localizado. No aprobado por pasar un contador o por recortar captura; déficit no resuelto requiere decisión del autor. |
| **B17-09 — Comportamiento/contexto** | Consulta/redimensionado no reinician reloj, parcial o revisión; servidor avanza durante Detalles, UI recupera contexto autorizado. Permisos, privado por destinatario, cancelación HOST/resultados/nueva sala y filtros T04 conservados. |
| **B17-10 — Integridad/evidencia** | Tres paquetes/versiones/huellas intactos, sin cambios de esquema/DTO/reglas. npm run check y navegador pertinente sobre build actual, capturas/medidas/diferencias y límites nuevos; cierres anteriores no reescritos. |

**Secuencia para Implementación del alcance confirmado:**

1. Antes de editar, conservar capturas/medidas del producto actual con casos equivalentes y las referencias/huellas. Escena legal dirigida para carta-038/Poder/propio Astucia, PC 1320×850 como maqueta y composición PC 1920×1080; registrar tamaño útil real/fuente/escala. No reconstruir la referencia con datos privados o puntos asignados artificialmente.
2. Delimitar representaciones, adaptar cara y aislar imagen ampliada de Detalles. Comprobar pronto referencia, null, fallo y nombres largos; aplicar la puerta de déficit antes de generalizar. Preservar composición/fuentes/compacta.
3. Pruebas de navegador con HTTP/Socket reales y tiempo/permutación controlados para escenas reproducibles: D con parcial, dos sesiones, ambas representaciones, revisión y avance temporal sin pausa. Interceptar solo descarga del medio en el caso de fallo declarado. No API de reloj o lector paralelo en producción.
4. Comparar **producto** con cuarta carta/HTML/captura a estado/valor/fuente/tamaño equivalentes; no igualdad píxel a píxel ni aprobación de las otras variantes. Medir bordes imagen/carta, D, filas/huecos/separadores/círculo y déficit por caso. Los 5,75 son referencia, no tolerancia universal; registrar el redondeo subpíxel observado. Separar imágenes de antes, referencia y después.
5. Muestras 390×844/360×800, normal adaptada off y compacta on, útil 1367/1368/PC on-off, cartas completas en consulta, todas las barajas/modos y permisos jugador/observador. No imponer un encuadre sin scroll ni cambiar carruseles para ocultar un defecto.
6. Ejecutar `npm run check` y `npm run test:browser -- --workers=2 <archivos pertinentes>` sobre compilación vigente; añadir pruebas significativas de D/propagación/teclado/diálogos y seleccionar regresiones afectadas B15/B16/B13/T04. Actualizar expectativas visuales que este acuerdo sustituye, conservando contenido/accesibilidad/permisos. No repetir corpus V2, validación de paquetes, matriz completa de bots o Linux por rutina si no cambia ese código.

El cierre posterior actualizará README, descripción APP y B17 con archivos/commits propios, resultados reales/fallos/reparaciones, capturas/medidas/fuentes/zoom/scroll y cobertura por criterio. Conservar instancias del autor, usar servidor de prueba propio y distinguir reloj controlado de tiempos normales. Revisión humana, zoom real y dispositivos físicos se declaran solo si ocurren. Maqueta no es producto, captura no acredita accesibilidad completa y contador V2 no acredita encaje. Sin push/PR/GHCR/despliegue o mensajes a otros hilos.

## 7. Sustituciones y traslado documental

| Descripción anterior | Refinamiento aprobado del 16/10 |
|---|---|
| Imagen de 78 px de alto en cara normal | Ancho hasta borde exterior, relación original; ejemplo 230×172,5. |
| Botón Detalles grande al pie de cara completa | D 44×44 superpuesto azulado; Jugar exterior conservado. |
| Cabecera visible y línea al pie de tercera fila | Cabecera solo accesible, dos separadores interiores. |
| Rombo activo y punto pequeño en fila | Sombreado/semántica sin rombo y círculo vectorial 12 px, solo cara normal. |
| Se presupone Detalles ampliado idéntico a demo | Diferencia CSS localizada; alinear solo imagen grande, no el resto del diálogo. |

**Para el responsable de Aplicación mediante el autor:** alinear descripción de carta/Detalles en §§7.2 y 7.5, y explicar en §§7.6–7.7 que miniatura compacta conserva su cara mientras consulta de carta completa usa el refinamiento normal. Los formatos/casos de uso/reglas de visibilidad y significado no cambian. Las notas históricas B11/B15/B16 se conservan; la alineación debe registrar la nueva fecha y alcance, no atribuirles esta implementación.

**Para Organización/Diseño:** describir al cerrar la implementación el límite de estilos y retorno de foco de D; referencias anteriores quedan antecedentes. Infraestructura/contrato de barajas no requieren nuevos campos o reglas por esta presentación. No se editan esas fuentes generales o la entrega externa desde SDD.

La aclaración posterior del autor confirma este alcance y resuelve la sustitución de presentación descrita; no hace falta otra confirmación de Diseño para empezar a implementarlo. El traslado descriptivo a los responsables de las fuentes generales permanece identificado, sin convertirlo en una nueva aprobación funcional o una tarea de edición TFM de este hilo. No hay cambio de reglas ni dependencia de Gestor. Los casos largos/null son verificaciones de implementación, no una petición de prototipo previo: consultar al autor solo si la medición descubre una incompatibilidad real que obligue a cambiar una decisión aprobada.

**Evidencia de preparación:** lectura de Git/código/fuentes/HTML y visualización del PNG existente; comparación de estilos y hashes de referencia. No se abrió/modificó el producto para experimentar, ni se generaron maquetas nuevas o ejecutaron pruebas de producto. SDD prepara especificación, prompt y enlace del proceso; B17-01–10, implementación y aceptación quedan pendientes.

## 8. Implementación y cierre técnico local — 16/10/2026

### 8.1 Base, alcance y revisión

Base efectiva **main `e0de970c75abbc43ecba09ed00a1daac44a663fe`**, con B16 conservado. Cambios previos: solo proceso/prompt/especificación B17; inventario inicial en [base.json](evidencias/B17/base.json). Se conservaron en el commit documental separado **`0b9bf7a`**. Sin rama/checkout nuevo, restauraciones o cambios de paquetes. Código/pruebas revisados: **`9cea034c1698c1b4d515991c8d693c83a97bfa86`**; este cierre documental sucede a ese cambio.

Archivos de producto: `src/GameCard.tsx`, `src/GameScreen.tsx`, `src/style.css`. Prueba nueva: `tests/browser/cardFace.spec.ts`, **11 recorridos**, sin modificar ni suprimir aserciones anteriores. El cierre ajusta su aserción de relleno para permitir 6 o 4,9 en nombres largos según las métricas de la fuente, conservando las comprobaciones de encaje, huecos, fuentes y contenido: no fuerza condensación si otra fuente cabe con 6. Esto no acredita Linux, que no se ha ejecutado. README y organización describen el alcance vigente; prompt/preparación y cierres B04–B16 conservados. No se cambia servidor, contratos, reglas, catálogo, bots, tiempos o contenido.

Revisión semántica: `CardInformation` solo representa CardView autorizado; símbolo propio y activo proceden de campos distintos, modo solo determina el valor visible. D detiene propagación/arrastre local y no llama a acciones. Jugar permanece exterior. CSS separa cara completa, minicarta y diálogo. ResizeObserver local aplica únicamente el relleno autorizado cuando no caben las filas; reconstruye el relleno original al medir para evitar oscilación. GameScreen conserva carta/contexto del invocador; el ref de D transfiere foco durante sustitución únicamente si el botón anterior tenía foco y sigue siendo la misma carta. Carta desaparecida no devuelve foco a una jugada distinta. No hay acceso a paquetes ni lógica de servidor en React.

### 8.2 Entorno y comandos ejecutados

Windows x64, Chrome **155.0.8059.80**, Playwright **1.63.0**, Node **24.19.0**, npm **11.6.2**, ICU **78.3**/Unicode **17.0**. Ejecutable real: `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`. Se antepuso al PATH de esta terminal junto al wrapper npm T03; ninguna instalación global cambiada. CSS px, DPR/visualViewport.scale=1; zoom del navegador sin modificar. Fuentes efectivas y encuadres en medidas/capturas. Sin dispositivo físico o ensayo humano.

- Antes de editar producto: captura auxiliar del build B16 vigente, **8/8** escenas comparables. Después: **8/8** escenas del build final. Son capturas dirigidas, no sustituyen la batería de aserciones.
- **`npm run check`: PASS**, 538/538 pruebas en 43 archivos; typecheck/lint/build y arquitectura, **70 módulos**, sin imports prohibidos/ciclos. [Registro final](evidencias/B17/check.txt).
- **`npm run test:browser -- --workers=2` con selección explícita: PASS, 31/31**, 11 nuevas +20 regresiones, dos trabajadores, cero reintentos. [Registro final y comando expandido](evidencias/B17/browser-final.txt). Selección exacta:

```powershell
npm run test:browser -- --workers=2 `
  tests/browser/cardFace.spec.ts `
  tests/browser/format2Presentation.spec.ts:148 `
  tests/browser/format2Presentation.spec.ts:66 `
  tests/browser/format2Presentation.spec.ts:31 `
  tests/browser/creatures.spec.ts:134 `
  tests/browser/creatures.spec.ts:158 `
  tests/browser/pcTable02.spec.ts:92 `
  tests/browser/centeredTable03.spec.ts:78 `
  tests/browser/cancelGame.spec.ts:38 `
  tests/browser/cancelGame.spec.ts:82 `
  tests/browser/cancelGame.spec.ts:159 `
  tests/browser/resultNotice.spec.ts `
  tests/browser/manualGame.spec.ts:12 `
  tests/browser/manualGame.spec.ts:64
```

La selección usó `KARTA3_BASE_URL` de una instalación compilada temporal propia, copiada desde APP. [Instancia](evidencias/B17/normal-instance.json): bytes SHA de JS/CSS servidos iguales a dist final, catálogo tres/versiones correctas, SystemClock/TimerScheduler/CryptoCardPermutation normales, sin acceso a ASSETS/PRODUCTO bajo guard. Se cerró exclusivamente ese proceso al acabar. Los casos dirigidos crean otras instancias efímeras del servidor compilado con HTTP/Socket.IO reales, reloj/permutación sustituidos y paquetes aprobados o fixtures separados. No se detuvieron servicios del autor.

El recorrido B16 seleccionado completó otra partida real Criaturas/humano/EASY/HARD con adaptadores/entropía normales hasta resultado, F5 y otra sala. Los plazos dirigidos, revisión/retención y carreras se comprobaron con tiempo controlado; no constituyen nuevos 15 segundos desconectados o 30 minutos reales. No se repitió Linux, todo el corpus de navegador o matriz completa de bots por rutina.

### 8.3 Medidas, comparación y reparaciones

[Índice visual](evidencias/B17/README.md), [medidas comparadas](evidencias/B17/medidas-comparadas.json): producto antes/referencia/después separados, mismos paquetes, cartas, modos, estado legal y viewport. Escena carta-038 en mano y pública/revisión: activo Poder, propio Astucia, con otra carta indicadora válida; no se reasignan puntos ni atributos.

| Muestra final normal PC | Medida CSS px |
|---|---|
| Exterior / imagen 4:3 | 230×321 / 230×172,5, x inicial de imagen igual a borde exterior |
| D / separación derecha-inferior | 44×44 / 5 y 5 |
| Carta-038: encabezado / filas / huecos interiores | 24 / 95 / 5,75 arriba y abajo |
| Tres nombres largos: encabezado / filas / huecos | 42 / 88,34375 / 0,078125 arriba y abajo |
| Relleno vertical normal / ajuste autorizado | 6 / 4,9; fuentes PC nombre 16 y valores 14, sin reducirlas |
| Círculo / bordes inferiores de tres filas | 12×12 / 1, 1, 0 |

La medición previa del ajuste mostró déficit **6,5 px** (encabezado 42 + separación 4 + imagen 172,5 + filas 95 frente al interior disponible), no resuelto ocultando overflow. El autor autorizó §4; se aplicó solo reducción condicional del relleno. El redondeo subpíxel de Chrome deja 0,078125 de hueco equivalente en los tres casos, sin cambiar imagen/fuente/contenido. Se conserva [diagnóstico previo](evidencias/B17/diagnostico-previo-relleno.json).

Fallo nuevo durante regresiones: el thead absoluto visualmente oculto no tenía contenedor propio y escapaba del carrusel; página móvil de fixture B13 de 515 px frente a 390. También interfería con coordenadas táctiles/frontera útil. Corrección mínima: posición relativa de cara completa. Otra carrera real: cierre de consulta mientras resize sustituía el botón enfocado; se conserva el foco mediante ref local y comparación de cardId, también evitando transferirlo a una nueva indicadora. La prueba espera desmontaje React después del cierre nativo, sin sleeps/reintentos de producto. Registros conservados: primera selección 26 PASS/5 FAIL, segunda 30 PASS/1 FAIL; reparaciones focalizadas, después las puertas finales indicadas. No se atribuyen los fallos a pruebas pasadas ni se rebajan sus aserciones.

Compacta a 360/390 mantiene miniatura de 32 px, botón inferior de 44 px, glifos/rombo, cartas de 220 px y métricas de todas las caras iguales a las capturas anteriores; no se exige igualdad píxel a píxel. Detalles final se mide al ancho interior proporcional, incluidos móvil/ancestro compacto; tabla/característica/nota/Información conservadas. Scroll vertical residual por escena registrado, permitido; no se oculta ni se altera composición para eliminarlo.

### 8.4 Evidencia nueva por criterio

| Criterio | Resultado técnico y evidencia ejecutada |
|---|---|
| B17-01 | PASS: producto carta-038, 1320×850 y 1920×1080; referencia PNG/HTML con SHA aprobados, encuadre normal y medidas anteriores. Cara de ancho adaptado móvil comprobada sin imponerle 230. |
| B17-02 | PASS: 3 filas/2 columnas, centrado y 2 separadores, círculo vectorial, sin ◆; propio Astucia frente a activo Poder y activo Resistencia en consulta completa, recibidos del servidor. |
| B17-03 | PASS: tres barajas ×1-58/Dato, literales confrontados con CardView; tabla/encabezados accesibles, sin valor adicional en Dato. Detalles conserva Dato/unidad/Información. No ensayo con lector de pantalla humano. |
| B17-04 | PASS: clic/Enter/Space, parcial ALTO, arrastre desde D/dentro y fuera, Información anidada/Escape, único envío posterior desde superficie. Foco normal↔compacta, cierre/resize rápido y cambio de carta no dirigido a otra. |
| B17-05 | PASS: mano/indicadora/Mesa durante turno/revisión, consulta completa desde resumen compacto; quinta por teclado, observador sin mano, autores y ranking B12/B16 conservados. |
| B17-06 | PASS: métricas antes/después de miniaturas iguales en 360/390; frontera real 1367/1368 y normal on/off desde 1368 mediante regresión B15; scrolls independientes B16. |
| B17-07 | PASS: ancho interior/proporción en PC/390/360, ambas entradas; consulta padre/Información/cierre/alt y tabla original conservados. Capturas producto en índice. |
| B17-08 | PASS con decisión §4: 67P/Tritón/Grifo completos y encajados, Resistencia activa/no activa, unidades Solar/MKm y null genérica. Interceptación exclusiva de medio para fallo/pendiente, aviso accesible sin colisión, D usable y recurso original al recuperar. |
| B17-09 | PASS: dos sesiones/pestañas, HTTP y Socket reales; plazos/parcial sin reset, timeout/revisión avanzan con Detalles abierto y carta desaparecida retorna a región. Regresiones B07, B13 y cuatro T04: finales ordinario/inactividad, recuperación/caducidad legítima, respuesta antigua y nueva sala. |
| B17-10 | PASS: [integridad](evidencias/B17/integridad.json), **124/124** archivos APP/Git iguales a referencias aprobadas; criaturas2/genérica4/Solar4, esquemas2. Puertas finales actuales y revisión semántica, sin alterar cierres históricos ni fuentes externas. |

**Conclusión:** B17 implementado y verificado técnicamente en local dentro del alcance anterior. **Pendiente aprobación visual del autor**, uso físico/humano y cobertura completa C09–C10. Capturas, pruebas automatizadas, maqueta y aprobación humana son evidencias distintas. No se acredita toda resolución/recurso/editorial futuros, zooms no ensayados, CI nueva, accesibilidad completa con usuarios, equilibrio, publicación o despliegue.

### 8.5 Entrega para el autor y coordinación

Recorrido manual: [README, Revisar B17](../../README.md#revisar-b17-carta-normal-d-y-detalles), con dos sesiones, tres paquetes, modos/on-off, PC/móvil, D/teclado/arrastre, consultas anidadas, resize/avance, F5/cancelación/otra sala. Instrucciones listas; no presentadas como recorrido de una persona.

Para Coordinación: presentar este cambio acotado y la decisión condicional de relleno, capturas equivalentes y fallos reparados, conservando B14–B16 y genérica/Solar/Criaturas íntegros. Para responsables de Aplicación/Diseño: traslado descriptivo de §7 (Aplicación §§7.2/7.5–7.7, separación minicarta/carta completa/Detalles y foco); infraestructura/contrato no requieren campos o reglas nuevos. Sin editar fuentes TFM/Diseño/ASSETS o enviar mensajes a otros hilos. Commits locales, sin push/PR/GHCR/VPS.
