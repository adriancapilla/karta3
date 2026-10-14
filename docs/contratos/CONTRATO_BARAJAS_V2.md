# Contrato común de barajas — formato 2

**Fecha:** 13/10/2026. **Estado:** contrato documental; consumidor, validación de formato 2 y contenido adaptado pendientes. Su redacción no acredita implementación, validación de paquetes ni aprobación visual.

**Base consultada:** carpeta activa `APP/karta3`, rama `feat/b14-sistema-solar`, HEAD `b2b29153d6e072c4735edc5d3ff4dce43bee0dd6`. Los archivos de Diseño sin registrar son trabajo previo y quedan conservados. Este entregable añade este contrato y su enlace en el proceso; no modifica código, barajas, Diseño ni fuentes TFM.

## 1. Norma, alcance y referencias

La fuente normativa principal es [Infraestructura §9.5](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), acuerdo del 13/10/2026. [Aplicación §§7.5–7.7](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md#75-valor-del-atributo--acuerdo-13102026-sin-implementar) concreta presentación literal, instrucciones y pendientes de Diseño. Este contrato materializa esas decisiones; no reabre su alcance.

El [contrato histórico de formato 1](CONTRATO_BARAJAS_V1.md), §§2–7, sigue siendo referencia de estructura, tipos, mínimos/vacíos, identificadores, versiones de contenido y recursos. **Formato 2 conserva sus campos y tipos**, sustituyendo `schemaVersion: 1` por `2` en ambos JSON y añadiendo únicamente las restricciones de texto aquí descritas. Ante diferencias de texto o compatibilidad, prevalecen este documento y la norma de §9.5; el contrato 1 no se edita ni se aplica retroactivamente este cambio.

Se conservan las invariantes de [Dominio §§4–5 y 25](../../../../TFM/Planificación/DOMINIO_KARTA3.md), las garantías de copia/catálogo de [B04](../sdd/BLOQUE_04_CARGA_BARAJAS.md) y la selección exacta/autorizada de [B05](../sdd/BLOQUE_05_CONFIGURACION_SALA.md). La [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) sigue vigente.

Quedan fuera de este entregable el consumidor, selector, parámetros de presentación, modificación de datos, migraciones y pruebas de producto. **No hay campos de nombre corto/completo, dato original alternativo, diccionario temático ni preferencia móvil dentro del paquete.** El umbral móvil pertenece a Diseño/autor; su decisión posterior cerrada se registra en §9 y en B15, sin añadirla al formato del paquete.

## 2. Archivos, campos y versiones

Dos archivos por paquete: `baraja.json` y `cartas.json`, más `imagenes/` cuando existan recursos. Todos los campos siguientes son obligatorios, incluso los que admiten vacío; no se aceptan propiedades adicionales, claves duplicadas, comentarios o comas finales. Los tipos no se convierten ni los campos se completan al leer.

| Objeto | Propiedades exactas y tipos conservados |
|---|---|
| `baraja.json` | `schemaVersion` entero **2**; `contentVersion` entero positivo; `id`, `name`, `subtitle`, `description`, `notes`, `instructions`, `imageAlt` textos; `imageRef` texto o `null`; `attributes`, `credits`, `sources` arrays; `publication` objeto. |
| Cada `attributes[]` | `id`, `name`, `unit`: textos. Exactamente tres entradas, ids `atributo1`, `atributo2`, `atributo3`, en ese orden. |
| `publication` | `available`: booleano; `order`: entero mayor o igual que cero. |
| Cada `credits[]` | `name`, `role`, `license`, `url`: textos. |
| Cada `sources[]` | `title`, `url`, `note`: textos. |
| `cartas.json` | `schemaVersion` entero **2**; `deckId` texto; `contentVersion` entero positivo; `cards` array de exactamente 58 cartas. |
| Cada `cards[]` | `id`, `name`, `characteristic`, `imageAlt`, `roundAttribute`, `note`: textos; `imageRef` texto o `null`; `values` objeto. |
| `values` | Exactamente `atributo1`, `atributo2`, `atributo3`, cada una un objeto con `playValue` entero, `displayValue` texto y `unit` texto. |

Los mínimos/vacíos de formato 1 permanecen: nombre de baraja/carta/atributo, descripción y `displayValue` no vacíos; `subtitle`, `notes`, `instructions`, `characteristic`, `note` y unidades admiten `""`. Créditos/fuentes admiten `[]`; `credits.name`/`role` y `sources.title` no vacíos, restantes textos de esas entradas admiten `""`. Sus URLs no vacías siguen siendo HTTP/HTTPS absolutas. No inventar fuentes, créditos o licencias.

`imageRef: null` exige `imageAlt: ""`; referencia no nula exige alt no vacío. `null` no es un vacío alternativo para otros campos. Un campo obligatorio vacío no puede ser una cadena formada únicamente por espacios o caracteres invisibles.

Id de baraja/carta: 1–64 caracteres, `^[a-z0-9]+(?:-[a-z0-9]+)*$`, con las exclusiones de nombres reservados del contrato 1. Carpeta, `baraja.id` y `cartas.deckId` coinciden; ids de carta únicos y estables. Nombres de carta repetidos siguen permitidos. Los dos `contentVersion` coinciden y no se reutiliza id/versión para bytes de contenido distintos.

Cada atributo conserva la permutación entera `1..58` de `playValue`; rechazar 0, 59, fracciones, textos numéricos, duplicados o ausencias. `roundAttribute` referencia uno de los tres ids, sin imponer reparto editorial 20/19/19. Orden del archivo no determina reparto. **Solo `playValue` decide el juego:** no derivarlo de `displayValue`, unidades, fechas o igualdad visual.

## 3. Unicode, NFC y campos de texto

### 3.1 Decodificación y normalización

JSON en UTF-8 válido, con cadenas de valores escalares Unicode: rechazar bytes UTF-8 inválidos y sustitutos UTF-16 aislados, también cuando aparezcan escapados como `\uD800`. Una pareja válida de sustitutos representa un punto de código suplementario; no es error. No sustituir bytes defectuosos por un carácter de reemplazo para admitir el archivo.

Los textos editoriales, incluidos metadatos, nombres, unidades, alt, notas, instrucciones y textos de créditos/fuentes, deben **venir ya en NFC**. La comprobación compara el texto con su forma NFC y rechaza la desigualdad; el Gestor normaliza durante la preparación. El consumidor no normaliza, recorta, colapsa espacios, abrevia ni redondea. NFC no significa NFKC: no convertir caracteres de compatibilidad ni sustituir signos/separadores. Referencia: [UAX #15, Unicode 17.0, revisión 57](https://www.unicode.org/reports/tr15/tr15-57.html).

### 3.2 Una línea, controles y espacios

- Campos breves de presentación: nombres de baraja/carta/atributo, subtítulo, característica, alt, `attributes[].unit` y cada `displayValue`/`unit` de carta son de **una línea**. No contienen tabulación, CR/LF ni separadores de línea/párrafo U+2028/U+2029. Los nombres/títulos breves de créditos/fuentes también son de una línea; ids, rutas y URLs conservan sus reglas propias de formato 1.
- Los párrafos de `description`, `notes`, `instructions`, `cards[].note` y notas de fuentes pueden conservar saltos **LF U+000A**, que cuentan en sus topes cuando exista uno. No convertir CRLF a LF durante carga; se prepara explícitamente el texto. No introducir nuevos máximos para créditos/fuentes ni otros campos sin tope aprobado.
- Rechazar controles Unicode de categoría `Cc`; LF es la excepción de los campos de párrafo. U+2028/U+2029 no sustituyen el LF autorizado. Una secuencia JSON `\n`/`\t` produce el carácter correspondiente tras analizarla y se somete a estas reglas; escribir literalmente los caracteres barra y letra no equivale a un salto/tabulación.
- Los campos de una línea no llevan espacios iniciales/finales. Para reconocerlos usar la propiedad **Unicode `White_Space` 17.0**, no únicamente U+0020 ni el comportamiento incidental de `trim()`. Incluye, entre otros, U+00A0 y U+202F. Los espacios/separadores internos admitidos se conservan literalmente; dos espacios internos cuentan dos, no uno. Un separador interno no permite introducir un control prohibido.
- En textos compactos, incluidos nombres/etiquetas y dato/unidad, rechazar cada grafema formado solo por controles, formatos invisibles o marcas sin base. Un grafema ordinario debe tener base gráfica (letra, número, puntuación o símbolo); los espacios internos permitidos son separadores, no bases para legitimar marcas sueltas. Así, U+0301 solo o U+200B solo no son texto compacto admisible. Se admiten combinaciones normales con base, marcas, selectores de variación o uniones dentro de un grafema válido, sin contarlos por separado. No rechazar todos los caracteres `Cf` indiscriminadamente: una unión válida y un formato invisible aislado no son el mismo caso.

La definición completa de `White_Space` está en [UCD 17.0, PropList.txt](https://www.unicode.org/Public/17.0.0/ucd/PropList.txt). Estas reglas no convierten el paquete en ASCII ni en un formato numérico o temático.

## 4. Cadena dato/unidad y dos recuentos distintos

Para cada atributo de cada carta, construir **solo para mostrar y comprobar**, sin añadir una propiedad JSON:

| Condición | Cadena exacta |
|---|---|
| `unit == ""` | `displayValue` |
| `unit != ""` | `displayValue` + **U+0020** + `unit` |

No añadir espacio con unidad vacía, heredar `attributes[].unit`, cambiar separadores o interpretar el texto. Cada campo se comprueba primero por tipo, Unicode, NFC, una línea, bordes y grafemas admisibles. Después se segmenta **la cadena conjunta**, no se suman contadores independientes de campos.

**Máximo conjunto: diez grafemas extendidos**, conforme a [UAX #29 para Unicode 17.0, revisión 47](https://www.unicode.org/reports/tr29/tr29-47.html), reglas de límites de grafema extendido. Signos, puntuación, separadores y espacio de unión cuentan. Combinaciones válidas como base + marca o secuencias emoji unidas cuentan según sus segmentos, no según bytes, unidades UTF-16 o número de puntos de código. No hay cupos de seis para dato y tres para unidad.

Los siguientes **topes técnicos cuentan puntos de código Unicode del texto ya NFC**. Se cuentan valores escalares completos, no unidades UTF-16; cada LF cuenta uno. Son comprobaciones separadas del límite conjunto y no garantizan anchura.

| Propiedad | Máximo en puntos de código |
|---|---:|
| `baraja.attributes[].name` | 32 |
| `baraja.name`, `cards[].name` | 128 cada una |
| `baraja.subtitle` | 256 |
| `cards[].characteristic` | 1024 |
| `baraja.imageAlt`, `cards[].imageAlt` | 1024 cada una |
| `baraja.description`, `cards[].note` | 4096 cada una |
| `baraja.notes`, `baraja.instructions` | 16384 cada una |

No aplicar diez a nombres, alt, notas o descripciones. No añadir un tope independiente a `displayValue` o `unit`: su regla aprobada es el conjunto de diez grafemas y el resto de condiciones de texto. `attributes[].unit` no es esa cadena de carta ni se hereda. Los ocho caracteres de nombre de atributo no son un máximo vigente: **Triángulo** tiene nueve y puede cumplir el contrato.

### 4.1 Runtime de referencia identificado

El proyecto fija **Node 24.19.0** en [`.node-version`](../../.node-version) y la base de [Dockerfile](../../Dockerfile). El 13/10/2026 se consultó exclusivamente la identidad/capacidad del ejecutable local de esa versión:

| Lectura | Resultado observado |
|---|---|
| Ejecutable | `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` |
| `process.version` | `v24.19.0` |
| `process.versions.icu` | `78.3` |
| `process.versions.unicode` | `17.0` |
| `new Intl.Segmenter('es', { granularity: 'grapheme' }).resolvedOptions()` | `{ locale: 'es', granularity: 'grapheme' }` |

Se identifica **`Intl.Segmenter`, granularidad `grapheme`, con ICU 78.3/Unicode 17.0** como mecanismo disponible de referencia para el futuro validador de formato; sin segmentación personalizada por temática. Node documenta su soporte internacional mediante ICU en [su documentación oficial](https://nodejs.org/docs/latest-v24.x/api/intl.html); [ICU describe la segmentación por límites de grafema](https://unicode-org.github.io/icu/userguide/boundaryanalysis/).

Esta consulta no ejecutó un validador ni comprobó sus casos; tampoco inspeccionó la imagen Linux, CI o VPS. La futura implementación registrará las mismas versiones/opciones en su runtime efectivo y comprobará los casos de §6 y conformidad con la segmentación referenciada. Si difieren, debe resolver/documentar la diferencia antes de aceptar paquetes; no suponerla por coincidir el nombre mayor de Node. Una actualización de Unicode/ICU requiere revisión de estos casos, sin reinterpretar copias aprobadas silenciosamente. El navegador puede anticipar diagnósticos, pero su versión de segmentación no sustituye la autoridad del servidor.

## 5. Recursos, aprobación y privacidad conservadas

El contrato 1 §6 sigue íntegro: `imageRef: null`/`imageAlt: ""` utiliza el icono neutro de la aplicación; no precisa archivo por defecto del Gestor. Referencia no nula empieza por `imagenes/`, usa `/`, segmentos portables y extensión WebP/PNG/JPEG permitida, sin rutas absolutas, URLs, `..`, segmentos vacíos o nombres reservados. Archivo existente con escritura exacta, decodificable, extensión coherente y dimensiones positivas; destino real contenido en el paquete, incluidos enlaces. Una referencia inválida nunca se convierte en `null`.

ASSETS es la fuente maestra; APP recibe una copia **aprobada y verificable**, no una segunda fuente editable. JSON y recursos de la entrega se comparan mediante SHA-256/manifiesto. Construcción y ejecución usan solo APP, sin leer ASSETS. El catálogo se genera, no lo mantiene el Gestor.

Se preservan autoridad del servidor, selección id/versión exacta, permisos, disponibilidad y proyecciones privadas por destinatario. El catálogo no expone paquetes completos, 58 cartas, manos ajenas, orden oculto, rutas locales o diagnósticos editoriales. Las imágenes públicas usan las URLs controladas existentes. No ampliar el resumen del catálogo para transportar todo el contenido editorial.

Aplicación §§7.5–7.7 exige acceso autorizado a **las instrucciones de la baraja seleccionada y su versión exacta** desde preparación/partida y Detalles mediante «Información de la baraja». Es una capacidad futura de vistas/transporte, no un nuevo campo de estos JSON. La futura especificación concretará su proyección segura. Detalles usará el nombre y dato/unidad almacenados, sin J ni un dato original alternativo; cartas/revisión/desempate seguirán el modo acordado, sin modificar comparación o privacidad.

## 6. Diagnósticos y casos previstos

El futuro validador localizará **archivo, propiedad/ruta JSON, condición y, cuando corresponda, índice e id de carta y atributo**. Para fallos anteriores al análisis JSON, incluir posición de bytes/línea/columna cuando el lector pueda obtenerla; no inventar una carta inexistente. Escapar controles/invisibles en el diagnóstico para que puedan identificarse por U+XXXX. Tipos/esquema/duplicados se diagnostican antes de suponer una cadena válida.

Condiciones distinguibles: UTF-8/Unicode inválido; no NFC; campo ausente/adicional o clave duplicada; tipo/vacío incorrecto; control o salto prohibido; espacio de borde; grafema sin base; tope individual; conjunto mayor que diez; id/versión incoherente; permutación/indicador inválido; recurso inválido; incompatibilidad del consumidor. Puede reutilizarse el formato interno de errores de B04; no se define aquí una nueva API pública.

Para el límite conjunto se citan **ambas propiedades `displayValue` y `unit`**, cadena escapada, recuento obtenido y máximo 10. Por ejemplo: `cartas.json — cards[7] (id de la carta).values.atributo2: displayValue + U+0020 + unit produce 11 grafemas; máximo 10`. No inventar un campo `combinedValue` en el archivo. Para un tope individual informar puntos de código obtenidos y máximo, sin llamarlos grafemas.

**Matriz de comprobaciones futuras, no pruebas ejecutadas ni contenido editorial aprobado.** Las cadenas ilustran casos aislados de validación; no constituyen cartas ni una baraja nueva.

| Caso de texto o paquete | Resultado exigido |
|---|---|
| `"Café"` en NFC, unidad `""` | Cuatro puntos de código/cuatro grafemas; admisible técnicamente. |
| `"Cafe\u0301"` | Rechazar no-NFC; no convertirlo a `"Café"` al cargar. |
| `"q\u0301"`, unidad `""` | Combinación NFC válida con base: dos puntos de código, un grafema; no prohibir todas las marcas. |
| Solo `"\u0301"`, `"\u200B"` o una unión `"\u200D"` sin base | Rechazar grafema compacto sin base gráfica; no aceptar un vacío invisible. |
| `"✈\uFE0F"` o `"👩\u200D🚀"` | Combinaciones con base válidas: un grafema cada una; más de un punto de código. Su admisibilidad técnica no aprueba su representación visual. |
| UTF-8 defectuoso o `"\uD800"` aislado | Rechazar Unicode inválido; una pareja de sustitutos válida no se rechaza. |
| LF, CR, tabulación, NUL o U+2028/U+2029 en dato/unidad/nombre | Rechazar; no cuentan como saltos utilizables en una fila. |
| LF en un párrafo permitido de instrucciones/notas | Conservar y contar un punto de código; no truncar ni colapsar. |
| `" 12"`, `"12 "`, unidad con U+00A0/U+202F en su borde | Rechazar espacios de borde, incluidos los no separables. |
| `"1 234"` o `"1\u202F234"`, unidad `"km"` | Cadena conjunta de ocho grafemas; preservar el separador interno original. |
| `"1  234"`, unidad `"km"` | Nueve grafemas; preservar los dos espacios internos. |
| `"12.34"`, unidad `"km/s"` | `"12.34 km/s"`, diez: admitir. |
| `"12.345"`, unidad `"km/s"` | Once conjuntos: rechazar aunque cada campo aislado tenga diez o menos. |
| `"999999"`, unidad `"MKm"` | Diez conjuntos: cumple recuento, **no aprobación editorial de MKm**. |
| `"13/10/2026"`, unidad `""` | Diez; sin espacio añadido ni parser de fechas. |
| `"sin dato"`, unidad `""` | Ocho; texto no numérico técnicamente admitido, sin inventar medición ni acreditar conveniencia editorial. |
| `displayValue: ""` o solo espacios | Rechazar; `unit: ""` sí es un vacío permitido, campo presente y sin herencia. |
| `"-12.5"`, unidad `"km"` | Ocho; signo, decimal y espacio cuentan. No cambiar puntuación o separadores. |
| `"WWWWWWWWWW"`, unidad `""` | Diez: no falla el contador; **no demuestra encaje ni aprueba una fila**. |
| Nombre de atributo de 32/33 puntos de código NFC | 32 cumple tope; 33 falla. En ambos casos, el encaje necesita revisión visual. |
| Un campo con tope M, longitudes M/M+1 | M admitido si cumple el resto; M+1 rechazado, contando puntos de código completos. |
| Dos cartas con igual dato/unidad y distintos `playValue` | Admitir si cada permutación `1..58` es correcta; incluye Encke/Borrelly y órdenes editoriales de fechas/textos. |
| `schemaVersion` 2/1 entre los dos archivos, `contentVersion` distintos o `deckId` diferente | Rechazar incoherencia; no corregir ni actualizar selección silenciosamente. |
| Campos ausentes/adicionales, claves JSON duplicadas, `playValue: "1"` o serie incompleta | Rechazar conforme a las garantías conservadas de formato 1/B04. |
| Imagen nula válida; referencia inexistente, inválida o fuera de carpeta | Admitir la primera; rechazar las otras y localizar carta/ruta. |

## 7. Compatibilidad y entrega coordinada

Los paquetes actuales de genérica y Sistema Solar permanecen **formato 1/contenido 2**, bajo reglas históricas. No ejecutar este contrato sobre ellos como nueva condición de aceptación ni declarar que formato 1 pasó a ser inválido. El lector actual no se cambia por este documento.

La futura herramienta distinguirá validación histórica de formato 1 y validación de formato 2; formato desconocido no se convierte ni se presupone borrador. La elegibilidad del **catálogo normal del consumidor que entregue los modos nuevos** es otra comprobación: únicamente copias disponibles de formato 2 y editorialmente aprobadas.

| Situación en esa entrega futura | Preparación/arranque |
|---|---|
| Formato 2 válido, aprobado, disponible | Incluir resumen y recursos autorizados. |
| Formato 1 disponible, aunque válido bajo contrato histórico | Fallo explícito de **incompatibilidad de la entrega**; no presentarlo como formato 1 inválido ni omitirlo para publicar un catálogo parcial. |
| Formato 2 disponible inválido o versiones incoherentes | Fallo de validación; sin catálogo parcial correcto. |
| Esquema reconocido 1/2 no disponible | Validar según su contrato y excluir del catálogo. Si es inválido pero `false` es fiable, informar y excluir sin bloquear, conforme a B04. La validación individual de ese paquete sí falla. |
| Disponibilidad indeterminable o esquema desconocido | Fallar, conservar diagnóstico; no interpretar incertidumbre como `false`. |
| Ninguna copia disponible elegible y ningún fallo fatal | Catálogo vacío válido, sin seleccionar una baraja por defecto. |

Disponibilidad fiable mantiene el criterio de B04: metadatos legibles, sin claves duplicadas, raíz/`publication` correctas, esquema reconocido y `available` booleano inequívoco. Esquema de cartas incoherente sigue siendo error del paquete, no reinterpretación de su disponibilidad. La generación es completa/determinista; un fallo no permite servir como vigente un catálogo anterior desalineado.

Entregar conjuntamente **consumidor compatible, contrato/documentación, validación y copias formato 2 adaptadas/aprobadas**. No copiar datos nuevos al consumidor viejo ni convertir al vuelo 1→2. Preparar catálogo desde APP y comprobar id/versión exactos al seleccionar. Una selección anterior no se actualiza sola.

Conservar versiones, manifiestos/certificados de aprobación, digest y configuración anterior para una reversión compatible. Reiniciar pierde el estado en memoria conforme al MVP; este contrato no añade persistencia ni acredita despliegue.

## 8. Instrucciones para el Gestor

1. Trabajar sobre los maestros de ASSETS, con este contrato y §9.5; conservar la entrega anterior y registrar el cambio. Preparar **`schemaVersion: 2` y siguiente `contentVersion` en ambos JSON**: si las actuales versiones 2 no reciben otra modificación aprobada antes, la siguiente será 3. Normalización, esquema, nombres o unidades son cambios versionados.
2. Conservar ids de baraja/cartas, las tres series `playValue`, `roundAttribute`, recursos e identificadores/rutas existentes. No recalcular rangos por nuevos textos, redondeo o igualdad informativa. Conservar procedencia, fuentes y créditos; no inventar precisión ni derechos.
3. Preparar Unicode válido/NFC y textos de una línea; revisar cada cadena conjunta con U+0020 y máximo diez grafemas, más los topes individuales por puntos de código. No repartir el presupuesto en 6+3 ni heredar unidades. Explicar los criterios editoriales de orden, aproximación y lectura donde corresponda.
4. Existe un único `attributes[].name`. **Vel y Dist están aprobados para adaptar Solar**, con correspondencias explícitas en `instructions`: «Vel: Velocidad; Dist: Distancia». **Triángulo se conserva completo; Triáng. no está aprobado.** No añadir nombres alternativos, diccionarios, preferencias de pantalla o dato original oculto.
5. **MKm y precisión variable requieren preparación/revisión editorial**. Si se propone MKm, explicar su significado exacto en instrucciones; justificar unidad, aproximación y precisión mediante las fuentes existentes. Los ejemplos de §6 o de una maqueta no aprueban cadenas científicas concretas. Detalles mostrará esa misma representación aprobada, sin restaurar otra precisión. Evitar ceros de relleno/decimales ficticios.
6. Revisar todas las cadenas en los perfiles visuales aprobados por Diseño/autor. Pasar diez no prueba encaje; 32 puntos de código no garantizan una etiqueta legible. Si no cabe información indispensable, devolver la necesidad al autor/Diseño antes de aprobar o activar; no aplicar menor fuente automática, elipsis, recorte o conversión en el juego.
7. Entregar JSON preparados, recursos conservados, manifiesto SHA-256, registro de modificaciones y de revisión editorial/visual, y textos de instrucciones comprensibles/accesibles. Estas instrucciones no autorizan una nueva activación, copia a APP o edición de catálogo: la incorporación corresponde a la entrega coordinada y su aprobación trazable.

## 9. Pendientes de la futura especificación y evidencia

**Actualización exclusiva de pendientes — 14/10/2026:** no cambia las reglas de §§2–8 ni la evidencia documental del 13/10. [B15](../sdd/BLOQUE_15_FORMATO_2_Y_PRESENTACION.md) concreta el consumidor y la presentación, todavía sin implementación o pruebas.

- **Gestor:** candidatas genérica/Solar formato 2/contenido 3 preparadas y editorialmente aprobadas en [APROBACION_CONTENIDO.md](../../../../ASSETS/Entregas/2026-10-14-formato-2-contenido-3/APROBACION_CONTENIDO.md), incluidos MKm/redondeos, con manifiesto propio; la aprobación posterior prevalece sobre las revisiones anteriores. Siguen available=false. Pendiente entrega activada nueva: siguiente contentVersion en ambos JSON (4 si no hay cambios intermedios), manifiesto/delta propios y contenido/recursos aprobados conservados, según B15 §2. La aprobación editorial no acredita producto ni encaje visual humano.
- **Diseño/autor:** umbral cerrado en **1368 CSS px útiles**, con condiciones de activación y orden final del 14/10 recogidos en B15 §6. No es un campo del paquete. Las adaptaciones extremas de fuente/zoom/espacio siguen siendo propuestas medidas, que deben resolverse ante incompatibilidad concreta; no se dan por aprobadas todas las variantes ni por probada la UI de producto.
- **SDD/Implementación futura:** especificación preparada en B15 para lector/validación Unicode/recursos por esquema, diagnóstico/matriz de compatibilidad, consumidor/copias coordinados, controles/recuperación y proyección autorizada de instrucciones exactas. Su ejecución sigue pendiente. No trasladar recuentos a GameSettings, comparación o políticas de bots. Mantener reglas puras de dominio y controles de archivo/Unicode/runtime en sus responsabilidades según la guía de dependencias.
- **Verificación futura:** ejecutar la matriz de §6, pruebas de paquetes/compatibilidad/privacidad, regresiones y comparación visual de producto en referencias equivalentes. Registrar runtime real y separar reloj controlado, conexiones reales, maqueta y revisión humana. B14-R01–R04 y C09–C10 conservan sus partes pendientes; no quedan completados por este contrato.

**Evidencia de este entregable:** lectura de fuentes y consulta de solo lectura de identidad/segmentación disponible del runtime indicada en §4.1; revisión documental de campos, referencias y alcance. No se ejecutaron pruebas de producto, validador de formato 2, migraciones, preparación de catálogo, publicación o despliegue; no se modificó ningún paquete actual. La documentación define las comprobaciones exigidas, no sus resultados.
