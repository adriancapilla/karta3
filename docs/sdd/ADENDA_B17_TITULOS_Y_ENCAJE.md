# Adenda correctiva B17 — Título en una línea, encaje e interacción

**Fecha:** 17/10/2026. **Estado:** alcance correctivo de B17 acordado; pendiente de implementar/verificar. No abre un bloque funcional nuevo. El autor aprueba **12 px CSS como mínimo del título normal y corte visual si aún no cabe en una línea**, conservando el nombre íntegro para accesibilidad y en Detalles.

**Actualización posterior del 17/10:** implementación y comprobación Windows registradas en [§8](#8-implementación-y-comprobación-local--17102026); Linux/CI completa y revisión humana pendientes. El estado y diagnóstico de preparación siguientes se conservan como históricos.

**Acuerdo posterior sobre G, 17/10:** el autor elige estudiar e implementar el reparto de columnas según el espacio real de atributo y dato si resuelve el encaje. La reducción de padding queda aceptada en principio como recurso posterior, no con un valor mínimo ya acordado. [§9](#9-continuación-acordada-columnas-y-diagnóstico-del-retorno-de-zoom--17102026) delimita uniformidad, medición previa y el caso T todavía independiente. No acredita corrección nueva ni cierra una solución para T.

**Actualización posterior:** [§10](#10-continuación-g-y-reparación-t-autorizada--17102026) registra G y la reparación T autorizada después del diagnóstico. Comprobación Windows correcta; Linux/CI completa del HEAD final pendientes. Se conserva §9 como preparación histórica.

**Continuidad comprobada:** carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, rama `chore/publicacion-b16-b17`, HEAD `f1d8d2416168b88d9f1503efd9ccab54a516ebc5`, árbol inicialmente limpio. PR #13 abierta y sin integrar según el registro recibido. Conservar commits, etiquetas, reservas, diagnósticos y cierres anteriores; no crear rama/checkout ni volver a otra versión.

## 1. Fuentes, diagnóstico y alcance de la autorización

- [B17 §4 y cierre local §8](BLOQUE_17_CARTA_IMAGEN_Y_SIMBOLOS.md): incompatibilidad y autorización histórica de relleno 6→unos 4,9; aprobación y pruebas locales del 16/10 conservadas.
- [Estado de publicación](../../../verificacion-b16-b17-20261016/estado-publicacion.md), [medidas Linux](../../../verificacion-b16-b17-20261016/medidas-linux.json), [trazas resumidas](../../../verificacion-b16-b17-20261016/trazas-resumen.txt) y [diagnóstico conservado](../../../verificacion-b16-b17-20261016/diagnostico-39009233226.log).
- [AGENTS](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), `src/GameCard.tsx`, `src/style.css`, `tests/browser/cardFace.spec.ts` y regresiones indicadas en §6.

Los datos Linux conservados muestran **Tritón carta-044**, en ambos modos: cara 230×321, imagen 230×172,5, cabecera de 38, tabla 95,34375 y Resistencia en dos líneas con fila de 42,28125; relleno 4,9 y hueco inferior **−2,84375 px**. La familia CSS registrada es una lista de fallback, no identificación suficiente de los glifos efectivos. El archivo contiene dos registros de Tritón; **no proporciona un déficit Linux de Grifo**. Medirlo individualmente; no extrapolarle este número ni sustituir el registro Windows anterior.

Las trazas también muestran un `td` interceptando el clic en Jugar en B08/1280. Los fallos posteriores de avance/resultado se conservan individualmente; no asumir que todos tienen idéntica causa o que todo es lentitud de servidor/CPU. Los cinco recorridos diagnósticos siguen fallidos, no corregidos por la nueva propuesta.

**Cambio autorizado del 17/10:** título en una línea en la **cara normal**, con reducción únicamente de su tamaño de letra hasta 12 px CSS y corte visual si a ese mínimo todavía no cabe, manteniendo dimensiones aprobadas y una banda de cabecera estable. El nombre recibido permanece íntegro. Esta autorización sustituye para ese título las prohibiciones previas de reducir fuente y recortar visualmente; no las sustituye para atributos, Detalles u otras representaciones.

No cambiar familia/peso/espaciado de la fuente para estrechar el texto, nombres/JSON, valores, imágenes, tabla, icono propio, presentación compacta o reglas. No aplicar la propuesta no aprobada de crecimiento adaptado ni relleno 4,4. Conservar el ajuste condicional 6/4,9 ya autorizado donde siga siendo necesario tras medir; no añadir otro umbral/relleno o modificar su propósito sin justificación y decisión del autor.

## 2. Decisión del autor: mínimo y corte visual

**Respuesta expresa del 17/10:** el autor aprueba 12 px y, si el nombre no cabe en una línea, que el texto quede cortado. Señala para después limitar los nombres de carta en las barajas a lo que pueda mostrarse a 12 px.

**Regla de esta corrección:** usar el mayor tamaño que permita mostrar el título completo, entre **12 px CSS** y el tamaño base actual del perfil (16 px en la referencia PC). Si ni a 12 px cabe, mantener 12 y **cortar visualmente el excedente al final del ancho disponible**, sin elipsis añadida, segunda línea o crecimiento de la carta. No cortar antes de alcanzar el mínimo ni reducir por debajo de él. Conservar la cadena completa en el DOM y su identificación accesible; Detalles muestra el nombre completo con su tipografía habitual, sin heredar este recorte o reducción.

El mínimo es una decisión de presentación, no una afirmación de legibilidad universal o de encaje ya probado. Esta excepción solo afecta al título de la cara normal; no permite ocultar atributos, datos, controles o desbordamientos de la tabla.

**Intención futura, fuera de la corrección:** definir con Gestor y el responsable del contrato un límite editorial de nombres que puedan verse completos a 12 px, con ancho y fuentes de referencia explícitos. No se fija aquí un número de caracteres: su recuento no garantiza el ancho. El tope técnico vigente de 128 puntos de código de `cards[].name` permanece intacto; no modificar contrato, validador, JSON o paquetes actuales ni bloquear esta corrección por esa tarea futura.

## 3. Contrato del ajuste de título

1. Conservar el texto exacto recibido y su identidad accesible, también en Detalles. No abreviar, quitar palabras/espacios, sustituir Unicode o editar el paquete. La restricción de una línea afecta a la composición de la cara, no a una nueva representación editorial.
2. Obtener el ancho interior real de la cabecera. Restar ancho exterior real del icono propio, gap y espacios/márgenes aplicables, sin restar dos veces padding ya descontado. No suponer 204 px de título: esa es la cabecera de la muestra y todavía contiene icono/separación. No medir el carrusel o viewport nominal.
3. Medir la cadena con familia efectiva, peso y demás estilos actuales del perfil. Elegir **el mayor font-size que quepa**, entre 12 px CSS y tamaño base del perfil; si no existe uno, aplicar 12 px y el corte visual de §2. Se permite búsqueda acotada con precisión de 0,1 px CSS o mejor, verificada sobre el DOM final; no umbrales por número de caracteres, tamaños por nombre/id o lista especial Tritón/Grifo/67P. Un título corto conserva su tamaño base.
4. Reservar para todas las cartas completas del mismo perfil una **banda de una línea de altura estable**, independiente del tamaño reducido o longitud de cada nombre. Usar como referencia la cabecera aprobada de una línea al tamaño base, incluido el icono; registrar su altura concreta Windows/Linux. La reducción no contrae esa banda ni modifica sus márgenes, y las imágenes de cartas alineadas empiezan a la misma cota relativa. No inventar otra altura o padding para esconder déficit.
5. Una línea real y sin colisión con icono: si el texto cabe, verificar sus extremos completos; si excede el ancho incluso a 12 px, limitar visualmente solo la caja del título conforme a §2. Medir por separado ancho completo necesario y ancho visible, registrando cuándo actúa el corte; no falsear encaje mediante ese recorte. Mantener cadena DOM/accesible completa, familia, peso, tipografía de atributos y dimensiones de icono/D. No `scaleX`, distorsión o recorte anticipado como sustituto de font-size; el recorte del título no puede ocultar otros defectos de geometría.
6. Medición/reajuste al cambiar carta/nombre, ancho de cabecera/representación y fuentes disponibles. Distinguir máximo base del perfil de la fuente ya reducida: no tomar esta última como base de la siguiente búsqueda. Observar un borde de anchura estable, no uno que cambie por el propio resultado; evitar oscilación y ajustes repetidos sin convergencia.
7. Carga de fuentes: reservar la banda desde el layout inicial; reevaluar cuando `document.fonts.ready` y cambios de fuentes efectivos lo requieran. No conservar como definitivo un resultado de fallback que deje de caber con la fuente final. No añadir fuentes nuevas al producto. Registrar familia declarada **y fuente utilizada por los glifos**, con CDP o método equivalente, sin asumir Segoe UI/Arial a partir de la lista CSS.
8. Redimensionar/reconectar/recargar no envía acciones, reinicia reloj/parcial o pierde foco de D/consulta. Si cambia a minicarta compacta, conservar su título/estilos actuales; al volver a carta completa, recalcular su título desde el máximo base del perfil, no desde un tamaño residual.
9. Zoom: medir en CSS px y registrar zoom/DPR/viewport/ancho útil. No dividir fuentes por DPR/zoom para neutralizar la ampliación. Probar 100 % y zoom real representativo 125 %/200 % donde el entorno lo permita; una emulación CSS se identifica como tal. Recalcular y aplicar el corte del título a 12 px cuando corresponda, conservando el acceso al nombre íntegro. Cualquier necesidad adicional de cambiar geometría, atributos o bajar del mínimo se devuelve al autor con datos; no contrarrestar silenciosamente la ampliación.

El algoritmo y su reserva son presentación cliente; no pertenecen al dominio, RoomSettings, transporte o contrato de barajas. La implementación podrá elegir medición DOM/canvas y helpers locales, con comprobación final del texto real. No necesita una preferencia nueva o infraestructura de fuentes.

## 4. Tres problemas que deben cerrarse por separado

### T — Títulos y alineación

Todos los títulos de cara normal quedan en una línea, completos al mayor tamaño que quepa o cortados visualmente solo si todavía exceden el ancho a 12 px; nombre íntegro accesible y en Detalles en ambos casos. Banda estable para títulos que antes ocupaban una/dos líneas, e imágenes alineadas en la misma fila. Medir **Tritón carta-044 en PLAY_VALUE y DISPLAY_VALUE, Grifo carta-032 individualmente, 67P, títulos cortos y genérica null**. No trasladar un déficit entre cartas, modos o sistemas operativos sin medirlo.

### G — Geometría de toda la cara

Verificar encabezado, separación existente, imagen y tabla completos dentro de la carta, incluida Resistencia activa/no activa cuando su nombre/símbolo ocupen dos líneas. No exigir una línea a los atributos. Referencia PC 230×321, imagen 4:3 de 230×172,5; en cada representación adaptada conservar sus dimensiones aprobadas, sin imponer 230 px a toda pantalla ni autorizar crecimiento nuevo. Consulta de indicadora completa respeta su representación; minicarta compacta intacta.

Registrar huecos superior/inferior de tabla, límites exteriores/interiores y desbordamiento con signo. Una aserción de «texto íntegro» que solo compare scrollWidth/clientWidth no prueba contención vertical. La corrección de títulos **no acredita por sí sola** el encaje de tabla o interacción. Si persiste déficit, no añadir 4,4, más altura/padding o modificar atributos/imagen: documentar necesidad y pedir decisión adicional.

### I — Interacción y zonas de control

Ningún texto, tabla, encabezado accesible u otro contenido puede cubrir Jugar, D o controles vecinos. Registrar cajas y, en los puntos de clic normales, elemento receptor/hit test cuando sea necesario. Los clics deben pasar por comprobaciones normales de eventos y producir una única selección/jugada autorizada. No solucionar superposición poniendo Jugar por encima del desbordamiento, usando pointer-events para esconder el defecto, force-click, dispatchEvent o invocación directa de la acción.

Conservar D/imágenes/consulta informativa ampliada, Enter/Space/Escape y foco, arrastre de carruseles, parcial y plazos sin pausa. Mantener los escenarios artificiales **válidos** B08/B13/T04/INC-01: prueban el consumidor/UI común y no se excluyen por no ser barajas publicadas. No cambiar sus textos/rangos para facilitar encaje, retirar aserciones de avance o ampliar esperas para ocultar clics interceptados.

## 5. Responsabilidades y límites

| Responsabilidad | Capa/pieza | Comprobación |
|---|---|---|
| Ajuste de título, banda y observación de fuente/ancho | Cliente `GameCard`/estilos/helper local si hace falta | Solo estado/presentación de cara completa; no campos nuevos ni dependencias server. Mayor tamaño admisible, mínimo 12, corte condicionado, estabilidad y nombre íntegro accesible/en Detalles. |
| Encaje de cara/tabla y zonas exteriores | Estilos/componentes actuales | Mantener geometría y ajuste histórico permitido; separar mediciones T/G/I, sin workaround de puntero o cambio de contenido. |
| Diagnóstico y regresiones | Pruebas de navegador existentes y añadidas focales | Escenarios legales conservados, clic real y aserciones independientes, fuentes Windows/Linux y trazas de fallos preservadas. |
| Reglas/contratos/paquetes/compacta | Sin cambios | Misma privacidad, selección, tiempos, modo, manos/ranking y hashes de las tres barajas; regresiones pertinentes. |

No nueva dependencia, refactorización general, telemetría/métricas de uso/rendimiento, rediseño de mesa, familia de fuente, publicación GHCR o despliegue. Las medidas geométricas exigidas son evidencia de aceptación de esta corrección. Fuentes TFM y documentos de publicación previos se conservan; conclusiones para alineación se devuelven al autor.

## 6. Verificación focal y puerta de CI

**Cinco recorridos que deben pasar primero**, manteniendo casos/aserciones y diagnóstico:

| Archivo | Recorrido |
|---|---|
| `tests/browser/cardFace.spec.ts` | B17 criaturas-magicas PLAY_VALUE: cara completa, encaje autorizado, datos, públicos y normal adaptada. |
| Mismo | B17 criaturas-magicas DISPLAY_VALUE: mismo recorrido en Dato. |
| `tests/browser/timedGame.spec.ts` | B08 T1 1280: deadline estable, carta local ignorada, aviso y recuperación. |
| `tests/browser/cancelGame.spec.ts` | B13/T04 A cancelada → B ordinary, F5, avisos/estados antiguos y límites propios. |
| `tests/browser/resultNotice.spec.ts` | INC-01 expired A → B ordinary: accepted result, reload, controlled expiry and old reads. |

Filtro diagnóstico conservado: `B17 criaturas-magicas.*cara completa|B13/T04 A cancelada.*B ordinary|INC-01 expired A.*B ordinary|B08 T1 1280`. Enumerar la selección y comprobar **cinco casos**, incluidos ambos modos. Ejecutar sobre build vigente en Windows y Linux, inicialmente un trabajador/cero reintentos como el diagnóstico; no confundir aumento de workers/timeout o reducción de cobertura con reparación. No iniciar otra batería completa mientras fallen.

La igualdad histórica de 16 px del título largo se sustituye por rango 12→base/mayor tamaño admisible/una línea/banda estable y las dos ramas de §2: nombre visible íntegro si cabe; corte visual solo a 12 si no cabe, con cadena DOM/accesible y Detalles íntegros. Es el cambio de expectativa autorizado, no quitar la comprobación. Mantener aserciones de tipografía de atributos, geometría, contenido, avance y recepción de clic; títulos cortos siguen comprobándose al máximo base del perfil.

**Comprobaciones nuevas proporcionales:**

- T: rango/mayor tamaño, una línea real, títulos cortos sin reducción, banda/imagen estables, icono/separación descontados y nombre DOM/accesible/de Detalles completo. Añadir o conservar una fixture válida cuyo nombre exceda el ancho incluso a 12: comprobar tamaño 12, corte visual únicamente del título, sin elipsis ni solapamiento, y acceso al nombre íntegro; no acortar su dato para superar la prueba. Registrar el caso como corte aplicado, no como encaje completo o transformación editorial.
- G: Tritón dos modos, Grifo medido por sí mismo, 67P, cortos y null; las tres barajas actuales, Resistencia y unidades, caja completa y ausencia de solapamientos. Referencia PC y normal adaptada, consulta completa y compacta protegida; útil 1367/1368 si se cruza la representación en la prueba.
- I: recepción real de clic de Jugar y avance único, D que no selecciona/juega, imagen proporcionada, consulta/Escape/foco, arrastre y resize. Tiempo controlado para deadline/revisión/contextos; separar de ejecución normal y no repetir toda la matriz de servidor/bots por rutina.
- Fuentes: registrar SO, versión de Node/Chrome, familia declarada y fuentes efectivas, peso/line-height, font-size base/aplicado/mínimo y ancho del título/icono/gap/banda; imagen/tabla/carta/Jugar, zoom y escala. `medidas-linux.json` previo se mantiene intacto; las mediciones nuevas van a otra evidencia, antes/después con mismas escenas y perfiles.

**Aceptación separada, toda pendiente:**

- [ ] **AC-T:** mínimo aprobado de 12 aplicado, ajuste y corte condicionado conforme a §§2–3, nombre íntegro accesible/en Detalles y banda/alineación verificados en Windows/Linux; Grifo independiente. La aprobación del mínimo no acredita esta ejecución.
- [ ] **AC-G:** cara completa dentro de dimensiones aprobadas, incluida tabla/Resistencia y casos adaptados; sin crecimiento o 4,4 ni cambios editoriales.
- [ ] **AC-I:** sin interceptación/superposición y cinco recorridos fallidos reparados con clics/aserciones genuinos; D/foco/arrastre/consultas conservados.
- [ ] **AC-C:** tres barajas/huellas y compacta/atributos/imagen/reglas intactos; comprobaciones nuevas pertinentes correctas sobre compilación identificada y `npm run check` local final registrado.
- [ ] **AC-GH:** después de AC-T/G/I/C focales correctos, GitHub reanuda **CI completa del HEAD final** antes de integrar PR #13. Un diagnóstico focal correcto o un check previo no equivale a CI completa/main/imagen final.

Si Linux solo está disponible a través del hilo GitHub, entregar al autor HEAD/árbol y selección para ejecutar **únicamente el diagnóstico focal** allí, sin nueva batería completa prematura. No declarar Linux superado por Windows o por sintaxis. Una vez correctos cinco y nuevos pertinentes, devolver el control a GitHub para su CI completa. Esta adenda no autoriza merge, GHCR o VPS.

## 7. Continuidad, coordinación de escritura y documentación

Implementación trabaja en `APP/karta3`, `chore/publicacion-b16-b17`. **Antes de escribir**, el autor coordina que el hilo GitHub ceda la escritura de esa carpeta/rama; no ejecutar dos agentes modificándola simultáneamente ni crear otro checkout para esquivarlo. SDD no envía mensajes entre hilos. Registrar HEAD/status y volver a comprobarlos si aparece trabajo externo; no sobrescribir, resetear, hacer amend/rebase o atribuir cambios ajenos a la corrección.

Preservar commits/cierres/datos Windows del 16/10 y diagnósticos Linux del 17/10. Esta adenda cambia la decisión futura sobre título, no convierte las pruebas anteriores en evidencia de la corrección ni borra que CI/PR siguen pendientes. Añadir evidencia fechada separada (por ejemplo `docs/sdd/evidencias/B17/adenda-20261017/`), con árbol/commit probado, comparación T/G/I por caso, fallos/reparaciones y límites. El HEAD devuelto debe corresponder al código compilado probado; cualquier cambio posterior relevante requiere su comprobación.

Conclusiones para autor/Coordinación/Arquitectura: autorización excepcional **solo del título normal**, mínimo 12 y corte visual condicionado con nombre íntegro accesible/en Detalles; banda por perfil/fuentes, encaje/interacción realmente demostrados y variantes aún bloqueadas, hashes conservados y puerta focal→CI completa. Registrar por separado la intención futura de limitar editorialmente nombres, sin dar por modificado el contrato actual. Actualizar README/descripción APP/cierre de adenda según lo real; trasladar después la descripción a Aplicación §§7.2/7.5–7.7 por sus responsables, sin editarlas aquí. No tratar la familia CSS como fuente efectiva o la imagen de una carta como prueba de todas.

**Estado de preparación:** fuentes, código/pruebas y trazas/medidas existentes consultados; mínimo y corte resueltos expresamente por el autor. No se ejecutó producto, no se aplicó el parche propuesto ni se modificaron paquetes/código/workflows. No queda una decisión funcional pendiente para esta política de título; implementación/verificación y coordinación de escritura de §7 siguen pendientes. [Prompt de Implementación](PROMPT_IMPLEMENTACION_ADENDA_B17.md).

## 8. Implementación y comprobación local — 17/10/2026

**Estado actual:** corrección implementada y comprobada técnicamente en Windows. **No verificada globalmente: Linux, CI completa del HEAD final y aprobación visual humana pendientes.** La preparación y las casillas de §6 describen su estado anterior, conservado; no se convierten en resultados por esta implementación.

### Base y cambio revisado

- Base efectiva `f1d8d2416168b88d9f1503efd9ccab54a516ebc5`, rama `chore/publicacion-b16-b17`. El autor confirmó «GitHub ya ha cesado las escrituras» antes de editar. Sin otras ramas/checkouts ni servidores ajenos detenidos.
- Cuatro documentos previos, con sus huellas iniciales, separados en `03d1e93`: esta adenda, su prompt, enlace en proceso y preparación de B17. No se reescriben el cierre B17 del 16/10 o los diagnósticos Linux.
- Código/pruebas revisados: `346a06325a8772157a0b6318f01c8d88857122fd` (commit local). [Integridad](evidencias/B17/adenda-20261017/integridad.json) identifica árbol probado, siete archivos y assets compilados. El commit documental posterior no cambia ese código. No push, PR, integración, GHCR, despliegue o coordinación directa con otros hilos.

### Corrección y responsabilidades

`useCardTitle`/encabezado local mide texto real, descuenta mediante flex el icono/gap/márgenes y busca a 0,1 px entre 12 y la base CSS del perfil. Mantiene una banda igual a la referencia de una línea al máximo, incluido icono y márgenes; verifica el Range DOM final. Solo corta el h3 si todavía excede el ancho a 12, sin elipsis; nombre recibido/DOM/accesibilidad/Detalles íntegros. Observa ancho estable, fuentes y resize; no cambia familia/peso, no neutraliza zoom ni envía acciones. La minicarta conserva sus estilos. No hay nombres especiales o reglas por longitud.

Las pruebas nuevas encontraron además un defecto de herencia en la consulta de indicadora completa: la superficie flex heredaba `align-items:start` y `gap:4px` de la minicarta. El encabezado podía encogerse a 84,59 px y los gaps adicionales dejaban un hueco inferior de −1,5 px. La cara completa declara `stretch`/`gap:0`, de acuerdo con su composición vigente; no se cambia el margen original del título de la consulta. Ahora se observa también la tabla para el ajuste histórico 6/4,9. Sin crecimiento adaptado, relleno 4,4, cambio de imagen/atributos o máscara de puntero.

Revisión semántica: tres archivos de producto, cuatro de pruebas; ninguna escritura/importación nueva en servidor, dominio, transporte, contratos, barajas o configuración. El helper/fuente/nombre largo de prueba solo se usan en instalaciones temporales validadas. [Mapa APP actualizado](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md#b17--carta-completa-minicarta-y-consulta-informativa).

### Ejecuciones reales y límites

Windows/Chrome instalado 155.0.8059.80, Playwright 1.63.0, aplicación 0.1.0; Node **24.19.0**, ICU **78.3**, Unicode **17.0**, npm 11.6.2. Ejecutable y hashes en evidencia. Zoom base 100 %, DPR 1. Conexiones HTTP/Socket.IO reales a servidores compilados propios en puertos efímeros; reloj/permutación sustituidos para escenas/recorridos deterministas. No prueba humana o física, media hora real, nuevo timeout real de 15 s o partida normal completa en esta corrección.

| Puerta | Resultado nuevo |
|---|---|
| Cinco diagnósticos antes del cambio, Windows | **5/5**, 35,2 s. El fallo Linux no se reprodujo aquí; se conserva como pendiente. |
| Check final | **538/538**, 43 archivos; tipos/lint/build correctos, **71 módulos** sin imports prohibidos/ciclos. |
| Chrome focal final, un trabajador/cero reintentos | **19/19**, 2,0 min: cinco exigidos + ocho nuevos + seis regresiones afectadas. |
| Capturas comparables | Ocho escenas antes y ocho después, 1320×850/1920×1080 y compactas 360×800/390×844. Separadas de la batería focal. |
| Integridad | **124/124** archivos APP/Git iguales a base; genérica/Solar 2/4 y Criaturas 2/2. Tres diagnósticos Linux originales intactos. |
| Fuentes/zoom | Glifos reales identificados con CDP; fuente tardía solo de prueba y emulación **CSS** 125/200/100 % correctas. Zoom nativo no ejecutado. |
| Linux | **No ejecutado**: motor Docker Linux no disponible; WSL solo anuncia docker-desktop. Se devuelve diagnóstico focal por el autor. |

La [evidencia nueva](evidencias/B17/adenda-20261017/README.md) enumera selección/comandos exactos, capturas revisadas, medidas T/G/I, fuentes efectivas y fallos/reparaciones. Hubo fallos durante desarrollo: seis de consulta completa por la herencia descrita; observación demasiado temprana tras font/resize; y comprobación del clic sobre un botón ya retirado por la jugada correcta. Se repararon presentación y observación donde correspondía, sin retirar geometría/atributos/avance, alargar timeout ni usar clicks forzados/dispatch/z-index/pointer-events. La recepción final se prueba con clic genuino y avance único.

### Aceptación separada al cierre local

| Criterio | Estado demostrable |
|---|---|
| AC-T | **Windows correcto / Linux pendiente**: Tritón ambos modos, Grifo independiente, 67P/cortos/null, máximo y corte a 12, banda estable/nombre íntegro. |
| AC-G | **Windows correcto / Linux pendiente**: referencia y normal adaptada/consulta, Resistencia activa/no activa completa, gaps con signo no negativos, sin otro relleno o crecimiento. |
| AC-I | **Windows correcto / Linux pendiente**: cinco diagnósticos y nuevos/regresiones, clic auténtico/avance único, D/foco/arrastre/plazos/quinta. No declarar reparados los cinco Linux. |
| AC-C | **Correcto localmente**: check, 19 focales finales, compacta/atributos/imagen y 124 huellas intactos. |
| AC-GH | **Pendiente**: diagnóstico Linux focal y después CI completa del HEAD final, antes de integrar. Ninguna ejecución remota en este encargo. |

El [traspaso al autor](evidencias/B17/adenda-20261017/README.md#diagnóstico-linux-y-puerta-posterior) proporciona las dos selecciones focales y medidas a devolver. No reanudar una batería completa mientras fallen cinco/nuevos pertinentes. El autor coordina el siguiente escritor; Implementación no envía mensajes a otros hilos. Mantener revisión humana/zoom nativo/dispositivos físicos y C09–C10 parciales. El futuro límite editorial de nombres y traslado descriptivo a Aplicación §§7.2/7.5–7.7 corresponden a sus responsables; no se cambió contrato/TFM/Diseño o contenido desde APP.

## 9. Continuación acordada: columnas y diagnóstico del retorno de zoom — 17/10/2026

**Estado:** decisión de G recibida; pendiente de medición e implementación. T requiere contraste de cálculo/recálculo antes de acordar su corrección. Base observada limpia **27eb1fa8e65c90cfaca251f3a676c66d51b276bf**, misma carpeta/rama y PR #13. Esta actualización es documental; no ejecuta pruebas, cambia producto o amplía el bloque funcional.

### 9.1 Evidencia y alcance de la decisión G

Fuentes nuevas conservadas: [estado de publicación](../../../verificacion-b16-b17-20261016/estado-publicacion.md), [diagnóstico con cajas/fuentes/receptores](../../../verificacion-b16-b17-20261016/diagnostico-adenda-39056325353.json). Linux5 pasó5/5 en35,672807s sobre6269b22; Linux19 terminó17/19 en174,056039s y los dos fallos nuevos se reprodujeron sobref04ba23. Check538/43/71 correcto, no CI completa ni integración. Windows19/19 sigue siendo otra categoría de evidencia.

G afecta a la fixture válida portada v7/carta-2 con100 W. `longTitle` solo cambia el nombre; mantiene Magnitud1/2/3, fuentes, valores e imagen/placeholder. El título cumple12/corte/banda21. La tabla mide127,34375 frente109,5px de espacio disponible, con déficit17,84375 y tres atributos en dos líneas; DejaVuSans-Bold efectivo. No se resuelve mediante otra reducción del título.

El CSS declara tabla204, reparto52/48 en PC, padding horizontal3px por lado en atributos y2 en valores, con layout fijo/cabecera accesible fuera del flujo. Faltan anchos efectivos de celdas, espacio útil y texto completo por columna: los porcentajes declarados no se presentan como medida real. Contrastar también cascada/representación antes de diseñar una solución a una distribución supuesta.

**Decisión expresa del autor:** priorizar reparto según necesidades de atributo y dato mediante una regla general. Reconoce que los extremos simultáneos pueden no caber y acepta reducir padding como alternativa posterior, sacrificando parte del espacio visual. Le preocupan la complejidad y que una excepción por carta rompa la uniformidad. Las futuras restricciones editoriales del constructor se mantienen como intención, sin nuevos límites de contrato o edición de las124 fuentes actuales.

### 9.2 Contrato de la corrección de columnas

1. Medir primero columnas/celdas/textos y verificar si el reparto declarado se aplica. Después, implementar la regla general de distribución si demuestra resolver G con las dimensiones, fuentes y contenido vigentes. No acortar fixture/atributos ni especializar por id, nombre de carta, baraja o una cadena de ejemplo.
2. La regla pertenece al consumidor de cara normal, no se activa por una lista de cartas fallidas. Las tres filas de una carta comparten columnas. Favorecer un reparto común entre cartas de la misma baraja, modo y perfil cuando sus necesidades son compatibles; comprobar la uniformidad de las tres barajas actuales. No dar por aprobados saltos de columnas por hover, selección, turno, revisión o llegada de otra carta. Mostrar cualquier excepción necesaria antes del cierre.
3. Medir símbolo/separación/atributo íntegros y dato/unidad literales, con padding/bordes efectivos y fuentes finales. No gastar en el atributo espacio que necesitan los datos largos de Solar; no exigir una sola línea a Resistencia si dos líneas quedan contenidas. Mantener carta/imagen/D/título/atributos y nombre accesible/Detalles según las decisiones aprobadas; minicarta sin nuevo reparto por esta corrección.
4. Uniformidad no permite trasladar las58 cartas, manos rivales, orden oculto o nuevos datos privados al cliente. Puede comprobarse el corpus aprobado completo fuera de la aplicación mediante pruebas; la política cliente solo utiliza información legítimamente disponible. No añadir metadatos/contratos/servicios para sostener el reparto sin otra decisión.
5. Preferir la solución más pequeña que acredite el encaje. No añadir infraestructura de layout, dependencias, bucles de ajuste permanentes o remonte de componentes/controles. Si hace falta medición cliente, acotarla a cambios pertinentes de contenido, ancho/representación y fuentes, con convergencia y limpieza; conservar foco y no enviar acciones o alterar el reloj. Elegir CSS o medición local es detalle técnico, no una aprobación anticipada de un algoritmo concreto.
6. **Padding como recurso posterior:** demostrar primero el límite del reparto y presentar qué padding horizontal/vertical actual produce el déficit, qué reducción mínima lo resolvería y su comparación visual. El autor acepta esta vía en principio, pero no se ha fijado aquí eje, mínimo ni nuevo umbral. No aplicar automáticamente el antiguo4,4, reducir todos los márgenes o declarar aprobado un valor arbitrario. Concretar ese dato con el autor antes de cerrar una modificación que lo necesite.
7. Si no caben simultáneamente ambas columnas dentro de esos acuerdos, devolver cajas, anchuras necesarias, altura resultante y alternativas. Sin overflow oculto de tabla, fuente de atributos menor, imagen distinta, carta más alta, contenido cambiado o control superpuesto. La política editorial futura no se utiliza para excluir la fixture válida actual.

**Medición previa pedida:** fixture100W/Magnitud1–3, Resistencia y datos largos de Solar, ambos modos; registrar cajas de th/td, contenido útil, padding/bordes/anchos calculados, rangos completos de símbolo/etiqueta/dato-unidad, filas y presupuesto vertical. Separar lo medido de una estimación de reparto factible. Comparar cartas cortas/largas de cada baraja para detectar cambios de columnas. No experimentar desde SDD cambiando CSS de producto.

### 9.3 T permanece independiente: diagnóstico antes de decidir

Repartir columnas no corrige por sí mismo el cálculo de la banda. Con la fuente tardía de ensayo DejaVuSansMono ya cargada, las tres cartas conservan al volver de CSSzoom2 a1 una banda20,5 frente referencia/icono21; imagen a37,5px del borde superior frente38 inicial. Tabla contenida, gaps+4/+4. A125/200% se midieron banda/icono26/26 y41/41. No se declara problema visual grave ni falso positivo.

Aplicación obtiene el máximo entre línea de prueba al tamaño base e icono mediante estilos calculados, y escribe altura CSS. La prueba obtiene una referencia similar y la multiplica por escala geométrica para compararla con cajas visuales. No hay evidencia suficiente de doble escala; revisar unidades, bordes/redondeo y momento de medición. Aplicación copia `fontVariationSettings` y prueba no: diferencia a contrastar, no causa demostrada con esta TTF. CDP confirma fuente cargada; no atribuirlo a descarga fallida.

Hipótesis compatible con20,5=41/2: medida tomada bajo200% que no se actualiza tras volver. El ensayo cambia `style.zoom`; falta saber qué callbacks de resize/ResizeObserver/fuentes se ejecutaron y qué valores leyeron/escribieron. No adoptar esa hipótesis como reparación cerrada.

**Petición diagnóstica concreta, no solución elegida:** sobre el mismo montaje1→1,25→2→1, registrar motivo/instante de cada recálculo, font-size base/aplicado, fuente efectiva/estado de carga, estilos calculados y cajas visuales de probeta/icono/banda/carta, offsetWidth/clientWidth, escala/DPR y altura escrita, con observación tras estabilizar layout. Comparar cálculo cliente y referencia independiente en unidades equivalentes. No provocar un resize adicional para hacer pasar el caso ni modificar producto desde SDD.

Si confirma estado antiguo o cálculo incorrecto de aplicación, proponer la reparación técnica que cumpla la banda vigente. Si confirma referencia incorrecta de prueba, explicar la discrepancia y la propiedad independiente que verificará: banda que contiene línea/icono, alineación y recuperación de geometría al volver al mismo zoom/fuente/ancho, con título y tabla íntegros. No basta ampliar tolerancia, copiar el resultado cliente como oráculo o retirar la condición. La solución T se consulta con el autor antes de cerrar otro cambio.

### 9.4 Aceptación y continuidad

- G: medida de columnas antes/después, misma fixture/contenido, tabla y textos contenidos, efecto sobre Resistencia/Solar y uniformidad documentado; reducción de padding solo si se concreta conforme a9.2.6. Un algoritmo propuesto no cuenta como encaje comprobado.
- I: llegar al turno habilitado, sondeo del punto del control y clic real mediante Playwright normal, recepción isTrusted y avance/jugada única; no usar los botones deshabilitados de los diagnósticos como prueba de interacción. D/consulta/foco/arrastre/resize y plazos conservados.
- T: separar diagnóstico, propuesta técnica y cambio de criterio; sin darlo por resuelto por las columnas o una tolerancia nueva.
- Conservación:124 archivos/hashes, reglas/permisos/privacidad, versiones de tres barajas, compacta y dependencias sin cambios; históricos y ramas/etiqueta original/reserva intactos.
- Puertas posteriores: check y recorridos focales pertinentes en Windows/Linux, cinco exactos y selección19 sobre fuente identificada, un trabajador/cero reintentos, reportes/trazas/acceptance explícitamente recogidos. Solo después CI completa del HEAD definitivo; el inventario actual182/22 no es ejecución. No reducir cobertura ni trasladar un resultado entre HEAD/entornos.

Preparación/implementación se mantiene en APP/karta3 y su rama existente mediante escritor único coordinado por el autor. Sin nueva rama/checkout, publicaciones, GHCR, VPS, métricas, fuentes TFM/Diseño/ASSETS/PRODUCTO o mensajes a otros hilos. [Continuación para Implementación y diagnóstico](PROMPT_IMPLEMENTACION_ADENDA_B17.md) distingue el G aprobado de T todavía abierto; el encargo original se conserva como histórico.

## 10. Continuación G y reparación T autorizada — 17/10/2026

**Estado:** G/T implementados y comprobados en Windows. **Linux focal y CI completa del HEAD final pendientes; no se declara el conjunto listo para CI completa.** La [evidencia nueva](evidencias/B17/continuacion-20261017/README.md) conserva comandos, fuentes, capturas, cajas, fallos y límites, sin sustituir cierres/diagnósticos previos.

### Base, código y conservación

Base efectiva `27eb1fa8e65c90cfaca251f3a676c66d51b276bf`, carpeta/rama existentes; dos documentos locales conservados en **4a8565a**. Escritor único, sin otra rama/checkout o servidor ajeno detenido. Commits locales separados **0591c0f G** y **f5c2c78 T**. Código final probado `f5c2c78776ec75964572664a52d32591f6b59b4b`; cierre documental posterior sin cambios de producto. [Integridad de fuentes/assets y 124 archivos APP/Git](evidencias/B17/continuacion-20261017/integridad.json).

### G: causa, corrección y uniformidad

Medición inicial: tabla204, reparto efectivo **102/102**, padding horizontal3+3 en th/2+2 en td y bordes laterales0. El52/48 declarado no describe ese layout fijo/cabecera absoluta. El primer intento de fijar solo th/td tampoco gobierna las columnas: quedó fallido y conservado. CSS automático cabe en muestras, pero Solar/Dato varía innecesariamente100,6875–108,390625 en el estudio auxiliar del corpus.

Solución general en cliente: medir copias efímeras de las seis celdas con fuente/símbolo/espacio/padding/bordes reales y gobernar las tres filas con un `colgroup` exclusivo de cara normal. Si caben ambas necesidades, reservar el máximo de los tres atributos públicos y dar el resto al dato. En extremos incompatibles, reparto proporcional con wrapping/contenido conservados. Observación acotada a contenido, ancho y fuentes; no acciones de juego, corpus oculto, dependencia o bucle permanente. Minicarta y Detalles sin ese reparto.

Windows1280, ambos modos: genérica85,6875/118,3125; Solar83,703125/120,296875; Criaturas94,28125/109,71875; fixture98,5/105,5. Tres cartas/tres filas con iguales columnas por escena. Probeta auxiliar fuera de Game contrasta58 cartas de cada baraja/modo, sin cambios de vistas: **no se necesitó excepción de uniformidad para el corpus actual**. Ninguna columna salta por selección, jugada o revisión.

La nueva regresión con monospace de ensayo falla en la compilación base con fixture100W intacta: atributo104,421875 frente96 útiles y tabla127,34375. Pasa en ambos modos después: columna110,421875/93,578125, tabla86, gaps+10,25/+10,25. **Sin reducir padding:** se conservan6/4,9 históricos y padding horizontal. No se presenta la fuente sustituida de Windows como Linux.

### T: diagnóstico, decisión y reparación

Con DejaVu de ensayo, CSSzoom1→1,25→2→1: aplicación lee altura natural del icono21/20,8/20,5 CSS (cajas21/26/41 visuales) y escribe esas alturas. Al retornar a1 el icono recupera21, pero la banda observada permanece204×20,5 CSS y no dispara recálculo. La referencia independiente21 es correcta. No es doble escala ni descarga fallida; la TTF no variable no explica el estado antiguo.

Se entregó diagnóstico/propuesta **antes de modificar T**; respuesta expresa del autor: **«Autorizar la reparación propuesta»**. Se observa también el icono natural con el mismo ResizeObserver. No se cambia cálculo, criterio, tolerancia o mínimo ni se provoca resize. La [traza final](evidencias/B17/continuacion-20261017/final-T-T-recalculations.json) registra callbacks, unidades, probeta/icono/banda/carta, alturas escritas, fuentes/carga/DPR: al volver se dispara callback y la banda recupera21. Secuencia visual21→26→41→21. CSSzoom no equivale a zoom nativo.

### Resultados nuevos y límites

Windows/Chrome155.0.8059.80/Playwright1.63; Node24.19.0/npm11.6.2/ICU78.3/Unicode17. Conexiones HTTP/Socket.IO reales a compilación propia/puertos efímeros, reloj y permutación controlados. Fuentes sustituidas solo de ensayo, sin instalación global ni fuentes nuevas de producto.

| Puerta final | Resultado real |
|---|---|
| `npm run check` | **538/538,43 archivos/71 módulos**, tipos/lint/build e imports/ciclos correctos. |
| Cinco diagnósticos exactos Windows | **5/5**,33,9s, un trabajador/cero reintentos. |
| `npm run test:browser` focal ampliado | **29/29**,180,334s:19 conservados+10 G; un trabajador/cero reintentos/omitidos/flaky. |
| T con DejaVu sustituida/compilación final | **1/1** diagnóstico adicional,5,9s; recálculos registrados. |
| Conservación | **124/124** archivos/blobs iguales; históricos y diagnósticos externos preservados. |

G comprueba botón habilitado antes del sondeo, clic normal `isTrusted` y avance/jugada única; conserva criterios/datos y geometría, D/foco/arrastre/recuperación/INC-01/plazos/revisión/frontera1367–1368/quinta. Sin timeouts ampliados o aserciones retiradas. Revisión semántica: producto solo mide DOM autorizado; servidor, contratos, reglas y paquetes sin cambios.

Reportes/trazas/medidas en `playwright-report/b17-adenda/acceptance/continuacion-20261017/`; copia documental segura enlazada, sin credenciales de trazas en Git. Linux local no disponible (motor Docker ausente): devolver mediante el autor HEAD final y selecciones5/29 al responsable GitHub; **solo tras las puertas focales procede CI completa**. No se reutilizan Linux5/5 o17/19 históricos como prueba de este código. Pendientes zoom nativo, revisión humana/física y C09–C10 completos. Sin fuentes TFM/Diseño/ASSETS/PRODUCTO, publicación, despliegue o mensajes a otros hilos.
