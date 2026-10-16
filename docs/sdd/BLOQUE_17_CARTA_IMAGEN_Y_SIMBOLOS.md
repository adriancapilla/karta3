# B17 — Imagen protagonista y símbolos de la carta normal

**Estado:** alcance confirmado por el autor el 16/10/2026; listo para Implementación mediante el [prompt B17](PROMPT_IMPLEMENTACION_BLOQUE_17.md). Implementación y pruebas de producto pendientes; el encaje de casos representativos se comprobará durante el trabajo.

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

## 5. Responsabilidades y límites

| Trabajo | Responsable / dependencias | Comprobación |
|---|---|---|
| Cara, D y separación normal/miniatura/consulta/diálogo | Cliente: GameCard/CardInformation/CardImage/CardDetails y estilos locales | Solo contratos públicos; CSS delimitado por representación, sin reglas de servidor o copias editoriales. Inspección/medidas y gestos reales. |
| Foco/contexto y selección ya existentes | GameScreen y consultas/UI si requiere ajuste local | Mantener ids de carta/contexto y retorno; no nuevos endpoints, settings o preferencias. Teclado/resize/avance temporal y conteo de envíos. |
| Valores/propio/activo y cartas autorizadas | Contratos/vistas existentes **sin cambios previstos** | Usar CardView recibido; no fetch del paquete, fallback editorial local o primera fila activa fija. Privacidad y valores literales conservados. |
| Dominio, aplicación, transportes, contenido | Sin cambios en este bloque | Reglas, comparación/ranking/bots/plazos, catálogo tres, versiones/huellas y B13/T04 intactos. Check/imports y regresiones focales. |

Autonomía del implementador: estructura local de componentes, nombres de clases, SVG inline del círculo, flex/grid y eventos, técnica accesible para ocultar cabecera visual y organización de pruebas. No redefinir decisiones de tamaño/alcance/compacta o resolver un déficit cambiando contenido/diseño; devolver incompatibilidad al autor. Reutilizar el pipeline UI actual, no copiar lógica/fixtures/file-fallback de la demo al producto.

## 6. Criterios y plan de verificación previstos

Todos pendientes de ejecución:

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
