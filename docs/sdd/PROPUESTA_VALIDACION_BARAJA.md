# Propuesta posterior — Validación reutilizable de una baraja jugable

**Estado:** necesidad confirmada; prioridad posterior al primer incremento digital por acuerdo del 28/09/2026. El detalle sigue propuesto. No implementado ni verificado.  
**Referencias:** `TFM/Planificación/DOMINIO_KARTA3.md`, secciones 4, 5 y 25, invariantes D-INV-01 a D-INV-03 y D-INV-19; `TFM/Planificación/INFRAESTRUCTURA_KARTA3.md`, sección 9.3. La puntuación y el desempate confirmados no intervienen en este bloque.

**Concreción del 01/10/2026:** el [contrato común de formato 1](../contratos/CONTRATO_BARAJAS_V1.md) fija los dos JSON, ids `atributo1`–`atributo3`, nombres y valores mostrados no vacíos e imágenes opcionales como `null`, conservando todos los campos. Son condiciones del paquete que complementan las invariantes puras. CSV queda aplazado; la fuente maestra son JSON directos en ASSETS. El bloque futuro de carga/validación y catálogo debe reutilizar estos casos y añadir las comprobaciones del contrato, sin un validador por temática. Esta propuesta sigue sin implementar ni verificar.

**Integración en B04:** el [bloque 04](BLOQUE_04_CARGA_BARAJAS.md) concreta ahora su implementación junto a lectura, recursos y catálogo. E1–E7 se conservan como casos de validación pura; no son otro incremento a implementar ni otro validador. B04 fija el resultado `{ valid, errors }`, la localización y las responsabilidades. Esta propuesta se conserva como antecedente; estado de código/evidencia en B04, todavía pendientes.

## Objetivo

Disponer de una validación determinista y reutilizable que impida usar en una partida una baraja cuyos datos jugables sean incorrectos. La misma validación debe aceptar o rechazar cualquier baraja con las reglas comunes, sin conocer su tema ni su nombre.

## Alcance

- **Incluye:** validar una definición de baraja ya construida en memoria y devolver éxito o errores comprensibles que identifiquen la propiedad o carta afectada. Cubrir los requisitos del dominio para tamaño, atributos, cartas, valores jugables, indicador y presencia de campos.
- **Queda fuera de este bloque:** leer CSV o JSON, comprobar archivos e imágenes, generar catálogo, seleccionar baraja en la interfaz, iniciar partidas y publicar contenido. Son pasos posteriores previstos en infraestructura, no excepciones para cada baraja.
- **Confirmado:** reglas de baraja de las secciones citadas del dominio; una baraja inválida no puede utilizarse para jugar.
- **Propuesta de este bloque:** usar ejemplos de una baraja sintética válida y modificaciones aisladas de ella para comprobar cada rechazo. La forma exacta del tipo de retorno se decidirá al implementar; el resultado debe distinguir válido de inválido y localizar los errores.
- **Intención futura:** antes de usar barajas en una partida, conectar el validador común con la preparación de `baraja.json` y `cartas.json` y aplicar el mismo control a cada baraja aprobada en la construcción. No se elaborará una especificación distinta por temática.

## Comportamiento

Al recibir una definición de baraja, la validación comprueba las reglas del dominio sin consultar archivos, red ni interfaz. Una definición correcta produce un resultado válido. Una incorrecta produce uno o varios errores localizables y no se presenta como baraja jugable. La validación no modifica los datos recibidos ni repara valores silenciosamente.

Las reglas concretas están en las referencias: exactamente 58 cartas y tres atributos; identificadores de carta únicos; tres valores por carta; para cada atributo, una aparición de cada entero de 1 a 58; `roundAttribute` referido a un atributo existente; presencia de los campos definidos de carta y valor, respetando los vacíos permitidos. La unicidad de `playValue` da un orden total para cualquier atributo. Un mismo número en atributos distintos de una carta es válido.

## Ejemplos

| Caso | Dado | Cuando | Entonces |
|---|---|---|---|
| E1 | Baraja sintética con 58 cartas y tres series completas `1..58`, campos requeridos e indicadores válidos | Se valida | Resultado válido. |
| E2 | E1 sin una carta, o con una carta adicional | Se valida cada variante | Resultado inválido que indica el tamaño incorrecto. |
| E3 | E1 con un identificador de carta repetido | Se valida | Resultado inválido que localiza la repetición. |
| E4 | E1 con dos cartas que tienen el mismo `playValue` para un atributo | Se valida | Resultado inválido para ese atributo; se identifica el valor repetido o las cartas implicadas. |
| E5 | E1 con un `roundAttribute` desconocido o con un valor de atributo ausente | Se valida cada variante | Resultado inválido que localiza carta y propiedad. |
| E6 | E1 con `note` o `unit` presentes pero vacíos cuando no corresponden | Se valida | Resultado válido; si falta la propiedad, se rechaza. |
| E7 | E1 con el mismo número asignado a dos atributos distintos de una misma carta | Se valida | Resultado válido si cada serie por atributo conserva `1..58`. |

## Criterios de aceptación

- [ ] La misma operación valida dos barajas sintéticas diferentes sin reglas, ramas ni identificadores especiales por tema.
- [ ] Acepta el caso válido y los vacíos permitidos; no altera la entrada.
- [ ] Rechaza tamaños distintos de 58 cartas o tres atributos, identificadores de carta duplicados y cartas sin alguno de los tres atributos.
- [ ] Rechaza valores jugables ausentes, repetidos, no enteros o fuera de `1..58` en cualquiera de los tres atributos; acepta valores iguales entre atributos distintos cuando cada serie es válida.
- [ ] Rechaza indicadores que no referencian un atributo existente y campos definidos ausentes; distingue ausencia de contenido vacío permitido.
- [ ] Los rechazos indican al menos la propiedad o el atributo afectado y, cuando corresponde, la carta. Ningún error se corrige silenciosamente.
- [ ] Las comprobaciones automatizadas se ejecutan y sus resultados quedan registrados antes de marcar el bloque como verificado.

## Dependencias

No requiere una baraja editorial definitiva ni servidor, interfaz, acceso a archivos JSON o imágenes. El contrato de archivos ya está definido; la representación interna de `Deck`, `Card` y los valores puede adaptarse a él, manteniendo las reglas existentes y las dependencias de dominio puro. El bloque posterior de carga/validación y catálogo concretará la lectura y validación del paquete, con su evidencia.

## Dudas

| Duda | Bloquea este bloque | Tratamiento |
|---|---|---|
| ¿Qué forma tendrá el resultado de validación y cómo identificará los errores? | Resuelto en B04 §5 | `{ valid, errors }`, errores puros localizables y contexto de archivo añadido por infraestructura. |
| ¿Cómo se representarán exactamente los tres atributos en memoria? | Elección autónoma del implementador | Representación pequeña compatible con B04 y las invariantes; no reabrir ids del formato, nombres ni reglas. |
| ¿Cómo se ofrecerán los documentos fuente al revisor del repositorio público? | No | Resolver antes de publicar la documentación técnica. |

## Cambios de alcance o reglas

| Fecha | Motivo y decisión | Criterios y fuentes afectados |
|---|---|---|
| 28/09/2026 | Se prioriza la creación de sala como primer incremento digital. Esta validación se conserva para la etapa de contenidos, sin cambiar sus reglas. | Título, prioridad y secuencia del proceso SDD; criterios de validación sin cambios. |
| 01/10/2026 | Se define el contrato común y la entrada directa JSON, con imágenes opcionales, nombres/valores mostrados rellenados e ids fijos. | Referencias y dependencias; E1–E7 se conservan. El bloque de carga deberá añadir C01–C10 del contrato según su alcance. |
| 01/10/2026 | B04 integra la validación pura y concreta retorno/localización junto a la carga y el catálogo. | E1–E7 pasan a B04-02; C09–C10 tienen cobertura parcial explícita. Sin implementación ni verificación todavía. |

## Comprobación y cierre

**Cambio de código:** pendiente.  
**Pruebas ejecutadas:** ninguna; los ejemplos y criterios anteriores son verificaciones previstas.  
**Límites y continuación:** después de validar datos en memoria, especificar la preparación y validación de los archivos de cada baraja con las comprobaciones adicionales de infraestructura.  
**Fecha de verificación:** pendiente.
