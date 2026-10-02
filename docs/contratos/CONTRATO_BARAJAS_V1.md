# Contrato común de barajas — formato 1

**Fecha:** 01/10/2026. **Estado:** contrato documentado para preparar contenido. Decisiones funcionales confirmadas por el autor; nombres de propiedades y estructura técnica concretados en este documento. La carga, el validador, el catálogo y su presentación todavía no están implementados ni verificados por este entregable.

## 1. Referencias y decisiones

- [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), §§2, 4, 5 y 25: `Deck`, `Card`, tres atributos, 58 cartas, comparación por `playValue`, indicador y validación común.
- [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §9: dos JSON, recursos relativos, copia aprobada en APP, catálogo generado y definición completa interna del servidor.
- [Contexto de coordinación](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), §9: encargo al Gestor, entrada directa JSON y CSV aplazado.
- [Propuesta de validación reutilizable](../sdd/PROPUESTA_VALIDACION_BARAJA.md): necesidad técnica pendiente de implementar; no se especifica un validador por temática.

**Confirmado por el autor:** todos los campos del contrato deben figurar; nombres de baraja y cartas, descripción de baraja, nombres de atributos y todos los valores jugables y mostrados deben estar rellenados. `playValue` es un entero entre 1 y 58, incluidos; `displayValue` es texto no vacío. Las referencias de imagen deben existir como campos y admiten `null`. Los identificadores de atributo serán `atributo1`, `atributo2` y `atributo3`, asociados a nombres visibles en la definición de la baraja. Una primera baraja genérica puede carecer de imágenes.

**Concreción técnica de este contrato:** estructura y tipos siguientes, versiones enteras, identificadores portables, pares `imageRef`/`imageAlt` e icono común para la ausencia de imagen. No quedan decisiones funcionales pendientes para preparar estos archivos. CSV, herramienta editorial, carga y selección en la aplicación pertenecen a trabajo posterior.

## 2. Archivos y origen del contenido

```text
ASSETS/Barajas/<id-baraja>/        fuente maestra editable
├── baraja.json
├── cartas.json
└── imagenes/                     solo cuando existen recursos
    ├── portada.webp              ejemplo de ruta; no es obligatorio
    └── cartas/carta-001.webp      ejemplo de ruta; no es obligatorio

APP/karta3/barajas/<id-baraja>/    copia aprobada para reproducir la versión
├── baraja.json
├── cartas.json
└── imagenes/                     recursos referenciados, cuando existen
```

La ruta maestra absoluta es `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\<id-baraja>\`. El nombre de su carpeta coincide exactamente con `baraja.json.id`. Se entregan dos archivos por baraja, no un JSON por carta. No se necesitan imágenes completas de cartas maquetadas para impresión: la aplicación compone la carta a partir de sus campos.

El Gestor prepara y corrige ASSETS. Tras revisión y aprobación del autor, el hilo responsable incorpora a APP una copia de los JSON y recursos de esa versión. No se editan las dos copias de forma independiente. APP debe poder construir y ejecutar esa versión sin leer una ruta externa de ASSETS. La reproducción incluye comparar los JSON y recursos copiados con el origen aprobado; no exige reconvertir JSON a CSV.

`catalogo.json` lo genera la aplicación a partir de las copias aprobadas disponibles; el Gestor no lo crea ni mantiene. Los dos JSON completos son recursos internos del servidor, fuera del directorio público del cliente. El catálogo ofrece únicamente el resumen permitido por infraestructura §9; los recursos gráficos pueden servirse públicamente mediante URLs generadas por la aplicación.

## 3. Reglas generales del formato

- JSON en UTF-8, sin comentarios, claves duplicadas ni comas finales. Los nombres de propiedades distinguen mayúsculas y minúsculas.
- Todas las propiedades descritas en §§4–5 son obligatorias, también dentro de los objetos. No se admiten propiedades adicionales en el formato 1. Una extensión se acuerda y documenta antes de usarla.
- No se convierten tipos ni se completan datos silenciosamente. `"37"` no es un `playValue` numérico; `37` no es un `displayValue` textual.
- Texto no vacío significa una cadena con algún carácter distinto de espacio. Los textos son contenido literal; no ejecutan HTML, Markdown ni código. Los únicos vacíos permitidos se indican expresamente. `null` solo se admite en `imageRef`.
- Identificadores de baraja y carta: cadena de 1 a 64 caracteres que cumple `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Ejemplos: `generica`, `carta-001`. No usar como id de baraja nombres reservados de Windows: `con`, `prn`, `aux`, `nul`, `com1`–`com9` o `lpt1`–`lpt9`.
- El id de baraja es estable; el id de carta es único dentro de esa baraja y estable entre sus versiones. Los nombres visibles pueden cambiar sin cambiar los ids. No se exige unicidad de nombres de carta.
- `schemaVersion` es el entero `1` en ambos archivos. `contentVersion` es un entero positivo, igual en ambos archivos. La primera versión es `1`; cualquier cambio de datos, metadatos o recursos incrementa la versión en ambos JSON. No se reutiliza el mismo par id/versión para un contenido aprobado diferente.
- La versión de formato cambia si cambia el contrato de archivos. La versión de contenido cambia si cambia una baraja. Una corrección de redacción de esta documentación que no cambie el contrato no obliga a cambiar los JSON.

## 4. `baraja.json`

El archivo contiene un objeto, con estas propiedades exactas:

| Propiedad | Tipo | Contenido admitido |
|---|---|---|
| `schemaVersion` | número entero | `1`. |
| `contentVersion` | número entero | Mayor o igual que `1`. |
| `id` | texto | Identificador de baraja según §3; coincide con la carpeta y con `cartas.json.deckId`. |
| `name` | texto | Nombre visible de la baraja, no vacío. Es el título; no hay otra propiedad `title`. |
| `subtitle` | texto | Subtítulo; `""` si no corresponde. |
| `description` | texto | Descripción de la baraja, no vacía. |
| `notes` | texto | Notas generales; puede ser `""`. |
| `instructions` | texto | Explicaciones temáticas o de lectura; puede ser `""`. No introduce reglas nuevas. |
| `attributes` | array de objetos | Exactamente los tres objetos de atributo definidos abajo, en orden `atributo1`, `atributo2`, `atributo3`. |
| `imageRef` | texto o `null` | Portada según §6; `null` si no hay imagen. |
| `imageAlt` | texto | Texto alternativo de portada: no vacío si hay referencia; `""` si la referencia es `null`. |
| `publication` | objeto | Propiedades `available` y `order`, según tabla siguiente. |
| `credits` | array de objetos | Créditos conocidos; `[]` cuando no hay entradas que consignar. |
| `sources` | array de objetos | Fuentes conocidas; `[]` cuando no hay entradas que consignar. |

Cada objeto de `attributes` contiene exactamente:

| Propiedad | Tipo | Contenido admitido |
|---|---|---|
| `id` | texto | `atributo1`, `atributo2` o `atributo3`, una vez cada uno y en ese orden. |
| `name` | texto | Nombre visible del atributo, no vacío. |
| `unit` | texto | Unidad habitual del atributo; puede ser `""`. |

Por ejemplo, los nombres visibles podrían ser «Velocidad», «Tamaño» y «Distancia» manteniendo esos tres ids. Las cartas y `roundAttribute` referencian los ids, nunca los nombres visibles. Esta correspondencia permite un futuro CSV con columnas estables; sus cabeceras completas y su conversión no se definen ni implementan ahora.

`publication` contiene exactamente:

| Propiedad | Tipo | Contenido admitido |
|---|---|---|
| `available` | booleano | `false` mientras se prepara. Solo se pasa a `true` por indicación del autor para su publicación. |
| `order` | número entero | Mayor o igual que `0`; menor número aparece antes. Empates resueltos por id ascendente. |

Cada entrada de `credits` contiene los textos `name`, `role`, `license` y `url`. `name` y `role` no pueden estar vacíos; `license` y `url` admiten `""` si no hay un dato que consignar. Cada entrada de `sources` contiene los textos `title`, `url` y `note`; `title` no puede estar vacío y los otros dos admiten `""`. Una URL no vacía debe ser una dirección absoluta HTTP o HTTPS. No se inventan autorías, licencias ni fuentes para rellenar campos. Los créditos abarcan datos y recursos cuando proceda; un array vacío no constituye una declaración de derechos.

Ejemplo de estructura de estos dos arrays, con textos de sustitución que se rellenan únicamente si corresponden:

```json
{
  "credits": [
    { "name": "Nombre del autor o entidad", "role": "Datos", "license": "", "url": "" }
  ],
  "sources": [
    { "title": "Referencia editorial utilizada", "url": "", "note": "" }
  ]
}
```

La disponibilidad es un metadato de publicación, no una aprobación automática. Una carpeta de ASSETS o un `available: true` escrito sin revisión no bastan para incorporar una baraja a APP.

## 5. `cartas.json`

El archivo contiene un objeto, con estas propiedades exactas:

| Propiedad | Tipo | Contenido admitido |
|---|---|---|
| `schemaVersion` | número entero | `1`, igual que en `baraja.json`. |
| `deckId` | texto | El mismo id de `baraja.json`. |
| `contentVersion` | número entero | La misma versión de contenido que en `baraja.json`. |
| `cards` | array de objetos | Exactamente 58 cartas. El orden del archivo no fija el reparto ni el orden de robo. |

Cada carta contiene exactamente:

| Propiedad | Tipo | Contenido admitido |
|---|---|---|
| `id` | texto | Identificador de carta según §3, único dentro de la baraja. |
| `name` | texto | Nombre específico de la carta, no vacío. |
| `characteristic` | texto | Característica informativa; puede ser `""`. |
| `imageRef` | texto o `null` | Imagen de la carta según §6; `null` si no existe. |
| `imageAlt` | texto | No vacío si hay referencia; `""` si la referencia es `null`. |
| `values` | objeto | Exactamente las claves `atributo1`, `atributo2` y `atributo3`. |
| `roundAttribute` | texto | Uno de esos tres ids. Indicador según dominio §5.4; no se exige una distribución concreta de indicadores. |
| `note` | texto | Nota de la carta; puede ser `""`. |

Cada objeto de `values.atributo1`, `values.atributo2` y `values.atributo3` contiene exactamente:

| Propiedad | Tipo | Contenido admitido |
|---|---|---|
| `playValue` | número entero | De `1` a `58`, incluidos. Para cada atributo, las 58 cartas contienen cada entero una vez. |
| `displayValue` | texto | Dato mostrado, no vacío. Un dato numérico mostrado también se escribe como texto: `"524"`. |
| `unit` | texto | Unidad del dato mostrado en esta carta; puede ser `""`. No se hereda automáticamente de la definición de atributo. |

`playValue` decide la comparación; `displayValue` y `unit` explican el dato. No se obtiene uno convirtiendo el otro. Un mismo `playValue` en atributos diferentes de una carta es válido si cada serie de la baraja conserva `1..58`. No es obligatorio que cada unidad de carta coincida con la unidad habitual: puede reflejar la unidad del dato mostrado; no modifica la comparación.

## 6. Imágenes y presentación sin recursos

La ausencia se representa siempre mediante el par `"imageRef": null, "imageAlt": ""`. No se omite ninguna de las dos propiedades y no se usa `"imageRef": ""`. Si todas las referencias son `null`, no hace falta crear `imagenes/` ni un archivo de imagen por defecto.

Cuando existe una referencia:

- Es una ruta desde la raíz de esa baraja, empezando por `imagenes/`, por ejemplo `imagenes/portada.webp` o `imagenes/cartas/carta-001.png`. Usa `/` también en Windows.
- Los segmentos se forman con letras ASCII minúsculas, números y guiones; el último añade una extensión `.webp`, `.png`, `.jpg` o `.jpeg`. No se permiten nombres reservados de Windows, segmentos vacíos, `.` o `..`, barras invertidas, rutas absolutas, URLs, parámetros ni fragmentos.
- El archivo debe existir con la misma escritura de la ruta y ser una imagen WebP, PNG o JPEG decodificable, de dimensiones positivas, coherente con su extensión. Su destino real, incluidos posibles enlaces, debe quedar dentro de la carpeta de la baraja.
- `imageAlt` es texto descriptivo no vacío. Varias cartas pueden referenciar el mismo recurso cuando tenga sentido editorial; no se exige un archivo distinto por carta.

Ejemplos de pares de propiedades para sustituir en un objeto completo, no archivos independientes:

```json
{ "imageRef": null, "imageAlt": "" }
```

```json
{ "imageRef": "imagenes/cartas/carta-001.webp", "imageAlt": "Descripción del recurso de la carta" }
```

**Presentación acordada para implementar posteriormente:** con referencia `null`, mostrar un icono neutro común de carta, perteneciente a la aplicación. Mantener visibles el nombre y los datos que correspondan al contexto, sin imagen rota ni texto técnico «null». El icono es decorativo si el nombre ya identifica el contenido. No sustituye los valores ni requiere que el Gestor dibuje una carta. Una referencia declarada cuyo archivo falte o sea inválido produce error de validación; no se convierte silenciosamente en ausencia.

## 7. Comprobaciones y casos de aceptación

Esta lista es el control común para el Gestor y la futura implementación. No acredita pruebas de producto ejecutadas.

| Criterio | Comprobación y resultado esperado |
|---|---|
| C01 — Estructura | Ambos JSON cumplen §§3–5, con todos los campos y tipos. Rechazar una propiedad ausente, adicional o duplicada. Rechazar nombre, descripción o dato mostrado vacío o solo con espacios. |
| C02 — Coherencia | Carpeta, `id`, `deckId`, versiones y referencias concuerdan. Rechazar un `deckId` o `contentVersion` diferente entre archivos y una versión de formato desconocida. |
| C03 — Atributos | Hay exactamente los tres ids fijos en su orden y con nombres rellenados. Cada carta contiene exactamente esas claves de valores. Rechazar atributos ausentes, extra o referidos por el nombre visible. |
| C04 — Cartas | Hay exactamente 58 cartas con ids únicos y nombres rellenados. Rechazar 57/59 cartas o un id repetido. Nombres repetidos con ids diferentes no son error estructural. |
| C05 — Comparación | Cada serie de `playValue` es la permutación `1..58`. Rechazar `0`, `59`, `1.5`, `"1"`, `null`, duplicados y números ausentes. Aceptar el mismo número en columnas distintas si las series son correctas. |
| C06 — Indicador | Todo `roundAttribute` referencia uno de los tres ids. Rechazar `"Velocidad"` o `"atributo4"`. No imponer reglas editoriales adicionales sobre su reparto. |
| C07 — Vacíos | Aceptar `note: ""`, `characteristic: ""`, `unit: ""` y los otros vacíos expresamente permitidos; rechazar si se omite el campo. Aceptar `imageRef: null` con `imageAlt: ""`; rechazar `imageRef: ""`. |
| C08 — Recursos | Cada referencia no nula tiene texto alternativo y un archivo válido contenido en la baraja. Rechazar archivo inexistente, bytes inválidos, ruta absoluta o `../otra-carpeta/imagen.png`. |
| C09 — Publicación y uso | Solo copias aprobadas y disponibles alimentan el catálogo generado. Una disponible inválida hace fallar la construcción. Al seleccionar, el servidor solo acepta una definición validada de la versión publicada; una baraja ausente, no disponible o inválida no puede quedar seleccionada ni utilizarse. |
| C10 — Ausencia gráfica y privacidad | La futura interfaz muestra el icono ante `null`. El catálogo no entrega las 58 cartas; los JSON completos permanecen internos. El icono no oculta errores de referencias no nulas. |

Los errores deben localizar al menos archivo, propiedad y motivo; cuando proceda, carta y atributo. Ejemplo: `cartas.json — cards[7] (carta-008).values.atributo2.displayValue: se requiere texto no vacío`. No inventar valores ni normalizar contenido para que pase el control. Los errores editoriales detallados no obligan a mostrar rutas locales al jugador.

La comprobación al seleccionar puede reutilizar una definición validada e inmutable de la misma versión: no obliga a releer todos los archivos en cada solicitud. Una nueva versión se valida de nuevo antes de publicarse. Los detalles de carga, caché, respuesta HTTP y pruebas se concretarán en el bloque de implementación correspondiente.

## 8. Plantillas y ejemplos entregados

- [Plantilla de metadatos](barajas-v1/baraja.plantilla.json): todos los campos; rellenar id, nombre, descripción y nombres de atributos.
- [Plantilla de cartas](barajas-v1/cartas.plantilla.json): sobre y una carta con todos los campos. Duplicar hasta 58, asignar ids y datos reales; los `playValue: 1` son valores de muestra que deben sustituirse donde corresponda.
- [Ejemplo de metadatos sin imágenes](barajas-v1/baraja.ejemplo-sin-imagenes.json): estructura cumplimentada con textos técnicos neutros.
- [Ejemplo de dos cartas](barajas-v1/cartas.ejemplo-fragmento.json): valores jugables y mostrados separados, indicadores distintos y campos vacíos permitidos.
- [Encargo para el Gestor](ENCARGO_GESTOR_BARAJAS.md): instrucciones listas para copiar.

Las plantillas contienen textos requeridos vacíos y una sola carta: son deliberadamente incompletas y no pasan la validación de una baraja. El ejemplo de cartas contiene dos cartas: es un fragmento ilustrativo y tampoco constituye una baraja de 58 cartas. No se ha creado contenido editorial ni una baraja completa en este hilo.

## 9. Responsabilidades de la implementación futura

| Responsabilidad | Capa y límites | Cómo comprobarla |
|---|---|---|
| Invariantes `Deck`/`Card` y permutaciones | Dominio puro según §§4, 5 y 25; sin archivos, Node, interfaz ni conocimiento de temáticas. | Datos en memoria válidos e inválidos, reutilizando E1–E7 de la propuesta genérica. |
| Leer el paquete, comprobar formato y recursos, copiar/publicar y generar catálogo | Infraestructura y herramienta interna; pueden usar archivos y el validador puro, sin cambiar reglas de juego. | Paquetes temporales válidos e inválidos, rutas y archivos reales, coherencia y copia reproducible. |
| Ofrecer catálogo y aceptar selección autorizada de una versión válida | Aplicación mediante el puerto necesario; sin depender de un lector concreto ni del sistema de archivos. | Casos de uso con puerto sustituido; una inválida/no disponible nunca es seleccionable. |
| Elegir lectores y capacidades concretas | Composición, según la organización vigente. | Comprobaciones de dependencias e integración. |
| Resumen, datos autorizados e icono de ausencia | Cliente mediante contratos públicos; sin importar dominio servidor ni recibir el paquete oculto completo. | Recorrido visible con/sin imágenes y revisión de la información transmitida. |

La implementación podrá elegir librería de validación/lectura, representación interna, módulos, formato de errores y estrategia de caché compatibles con este contrato y la arquitectura. No podrá cambiar los nombres de campos, tipos, vacíos permitidos, ids fijos ni reglas para evitar corregir el contenido. El bloque posterior fijará sus criterios, regresiones y pruebas concretas; este documento no autoriza código ni declara esas comprobaciones pasadas.

## 10. Ajustes a trasladar a las fuentes generales

La conversación responsable debe alinear las referencias generales antes de cerrar el bloque que consuma estos archivos. Comprobación del 01/10/2026 al preparar B04: infraestructura §§9.1–9.4 y §17 ya están alineadas por su hilo responsable; la guía de dependencias se ajustó documentalmente al mismo flujo. Se conserva la tabla como trazabilidad, indicando las tareas realizadas. Aquí no se modifica el documento vivo de coordinación ni el formato de archivos:

| Fuente | Ajuste pendiente |
|---|---|
| Infraestructura §9 y §9.3 | Realizado: JSON maestros directos y copia aprobada en APP; CSV y herramienta editorial aplazados. |
| Infraestructura §§9.1–9.3 y §17 | Realizado: enlace al contrato, nombres/tipos, ids fijos, descripción y versiones. El esquema JSON ya no figura como pendiente. |
| Infraestructura §§9.1–9.3 | Realizado: imágenes `null`, presencia de campos, recursos no nulos comprobables, icono futuro y errores/bloqueo de disponibles inválidas. B04 añade la política de borradores inválidos confirmada por el autor para trasladarla a coordinación. |
| Dominio §§4–5 | Registrar la concreción del paquete: nombres y `displayValue` no vacíos, `displayValue` textual e imagen ausente como `null`. La descripción requerida es una condición del paquete editorial, más estricta que el `description?` conceptual; no cambia las comparaciones ni exige archivos al dominio. |
| Organización y dependencias, §§4 y 6 | Realizado: flujo JSON directo, copias aprobadas y catálogo generado; mismas dependencias por capa. |
| Contexto de coordinación | Contrato y recepción de genérica ya registrados. Devolver B04, su prompt y la aclaración de borradores, sin declarar código o verificación todavía. |

**Pendientes de desarrollo:** implementación del [bloque 04](../sdd/BLOQUE_04_CARGA_BARAJAS.md), ya especificado, con copia verificable de la genérica sin activación; selección/configuración y presentación en sus bloques. Ninguno exige una especificación distinta por baraja. La prueba real del producto y la evidencia de construcción pertenecen a esos bloques, no a la comprobación de sintaxis de estas plantillas.

## 11. Comprobación del entregable documental

El 01/10/2026 se comprobó la sintaxis de los cuatro archivos JSON adjuntos, sus conjuntos de propiedades, ids de atributo, coherencia de id/versiones entre cada pareja y tipos/rangos de los valores ilustrativos. Se confirmó que plantilla y ejemplo contienen respectivamente una y dos cartas: no son paquetes completos válidos. También se comprobaron los enlaces locales del contrato, proceso y propuesta, y el formato del cambio documental.

No se ejecutaron pruebas de aplicación, imágenes reales ni una baraja completa. No se creó código de carga o validación. Esta evidencia solo acredita la preparación documental; C01–C10 siguen siendo comprobaciones exigidas para contenido y producto en sus ámbitos correspondientes.
