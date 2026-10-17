# Adenda correctiva B17 — Título en una línea, encaje e interacción

**Fecha:** 17/10/2026. **Estado:** alcance correctivo de B17 acordado; pendiente de implementar/verificar. No abre un bloque funcional nuevo. El autor aprueba **12 px CSS como mínimo del título normal y corte visual si aún no cabe en una línea**, conservando el nombre íntegro para accesibilidad y en Detalles.

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
