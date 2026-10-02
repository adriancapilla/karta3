# Bloque 04 — Carga de barajas, validación reutilizable y catálogo generado

**Estado:** implementado y verificado localmente el 02/10/2026, B04-01–12. C09–C10 solo en las partes de §9; selección y presentación siguen pendientes. Acuerdo y política de borradores del autor: 01/10/2026.

**Punto de partida:** `main`, `ac144fe`. Bloques 01, T01, 02 y 03 implementados con evidencia local en sus documentos. Hay cambios documentales previos en proceso/propuesta y archivos nuevos en `docs/contratos/`; conservarlos. La genérica existe en ASSETS; no se ha incorporado a APP desde este hilo.

## 1. Objetivo y referencias

Obtener desde APP una definición de baraja validada y un catálogo público generado, reproducibles sin ASSETS. Establecer un control común que sirva a cualquier temática y preparar la base para la selección posterior.

| Referencia | Decisiones aplicables |
|---|---|
| [Contrato de barajas, formato 1](../contratos/CONTRATO_BARAJAS_V1.md), §§2–7, 9 | Norma de archivos, campos, tipos, versiones, recursos y C01–C10. No duplicar sus tablas ni cambiar el esquema. |
| [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), §§2, 4, 5 y 25; D-INV-01–03, 19 | Datos de `Deck`/`Card`, valores comparados, presencia de campos y validación pura. |
| [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §§9.1–9.4 y 17 | JSON maestro directo, copia aprobada, publicación separada, catálogo, privacidad y evidencia parcial. |
| [AGENTS.md](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), §§2–7 | Dirección de dependencias, composición y pruebas. |
| [Proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md), [propuesta de validación](PROPUESTA_VALIDACION_BARAJA.md) | Ciclo SDD; incorporar E1–E7 de la propuesta a este bloque, sin mantener dos validadores. |
| [Bloque 01](BLOQUE_01_CREACION_SALA.md), [T01](BLOQUE_T01_REFACTOR_CREACION_SALA.md), [02](BLOQUE_02_ENTRADA_SALA.md), [03](BLOQUE_03_CICLO_VIDA_ESPERA.md) | Contratos y recorridos de sala conservados: E1–E7, B02-01–16 y B03-01–16. |

## 2. Alcance y decisiones confirmadas

**Incluye:** incorporación verificable de la genérica sin alterarla; validación pura, lectura estricta de JSON y control de recursos; generación de catálogo; carga al arranque; endpoint de resúmenes, acceso desde el cliente y servicio limitado de imágenes. Pruebas con paquetes temporales disponibles/no disponibles y recursos reales.

**Quedan fuera:** selector y configuración, aceptación de selección autorizada, presentación del icono/las cartas, partida, bots, equilibrio, CSV, creación editorial y despliegue. No se incorpora Sistema Solar ni se crea una baraja editorial de prueba.

**Paquete inicial:** `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\generica\`, id `generica`, `schemaVersion: 1`, `contentVersion: 1`, 58 cartas, imágenes `null` y `publication.available: false`. La incorporación a APP autorizada en este encargo conserva bytes, versiones y disponibilidad. No autoriza activarla. En la ejecución normal, el catálogo inicial será vacío.

El reparto 20/19/19 y la generación de permutaciones de la genérica son decisiones editoriales; no se comprueban como reglas de aceptación del validador. Tampoco se exige que `displayValue` coincida con `playValue` en otras barajas. Los ids fijos del formato son una regla común de serialización, no una condición por temática.

## 3. Incorporación y reproducción

1. Incorporar en la implementación `barajas/generica/baraja.json` y `cartas.json` como copia de la fuente aprobada para este bloque. No regenerar, reformatear ni corregir esos archivos. Si el origen difiere de las huellas siguientes, detener la incorporación y comunicar la diferencia para revisar la versión recibida.
2. Comparar lista de archivos y SHA-256 del origen y copia. Para paquetes con imágenes, copiar también los recursos referenciados y comparar sus bytes; no añadir imágenes de respaldo al paquete sin recursos. Registrar fecha, id/versiones, origen, destino, huellas y comprobación en la evidencia del bloque.
3. ASSETS sigue siendo la fuente maestra. Una corrección editorial se hace allí y se incorpora como nueva copia aprobada con el versionado del contrato; APP no se convierte en otra fuente editable.
4. Las subcarpetas de `APP/karta3/barajas/` son copias incorporadas mediante revisión, no una importación automática desde ASSETS. Aprobación es un acto trazable de incorporación, distinto de `publication.available`. No introducir una lista manual de ids en el código ni otro catálogo editorial.
5. Construcción y arranque leen exclusivamente los paquetes incluidos en APP. Resolver las rutas desde la instalación de la aplicación; no fijar rutas `E:\...` en código ni exigir acceso a ASSETS. No agregar un importador automático en la construcción.

Huellas de referencia leídas el 01/10/2026:

| Archivo | SHA-256 |
|---|---|
| `generica/baraja.json` | `a86a5fe34573226694016f3dc49fd45cd966c4c1afa677d8a0bb28c54fb05a06` |
| `generica/cartas.json` | `d3b22180d7ecfd991eeaca57ab664cacb566c198e20558104113d1a5de60461c` |

## 4. Operaciones y comportamiento

### 4.1 Validación individual

Exponer `npm run decks:validate -- --package <carpeta>` para validar un paquete completo sin modificarlo ni incorporarlo. Entrada: carpeta de paquete; salida: resultado y errores localizables. Código de salida `0` si cumple el contrato, distinto de cero si es inválido o no puede leerse, aunque declare `available: false`.

La operación común separa: lectura/JSON estricto → formato y coherencia → validación pura de `Deck` → recursos. Solo adapta a una definición utilizable tras satisfacer los controles necesarios. Puede acumular errores independientes; omite controles que requieran una estructura todavía inválida, sin inventar fallos derivados ni detenerse siempre en el primer campo incorrecto.

### 4.2 Preparación del catálogo

Exponer `npm run decks:prepare` e integrarlo en `npm run build`, y por tanto en `npm run check`. Recorrer las subcarpetas de paquetes aprobados de `barajas/`, validar cada una y escribir `barajas/catalogo.json` generado. El archivo raíz de catálogo no se interpreta como paquete ni como fuente de la siguiente generación.

| Paquete | Preparación y arranque |
|---|---|
| Válido, disponible | Cargar definición validada; incluir resumen y recursos públicos autorizados. |
| Válido, no disponible | Validar y registrar exclusión; cargarlo internamente si resulta útil, sin resumen ni recursos públicos. |
| Inválido, no disponible con disponibilidad fiable | Registrar todos los errores detectados; excluir definición, resumen y recursos. No bloquear la preparación ni el arranque por ese borrador. |
| Inválido, disponible | Fallar preparación/arranque; ningún catálogo parcial se presenta como resultado correcto. |
| Disponibilidad indeterminable | Fallar preparación/arranque. No tratar la incertidumbre como `false`. |

**Disponibilidad fiable:** `baraja.json` se ha leído y analizado sin claves duplicadas, su raíz es un objeto, declara el formato conocido `schemaVersion: 1` y contiene `publication` como objeto con un `available` booleano inequívoco. Errores en otros campos no transforman ese booleano. Un JSON de metadatos ilegible, duplicado, con formato desconocido o disponibilidad ausente/de tipo incorrecto es indeterminable. Un `cartas.json` ilegible puede clasificarse como borrador inválido si los metadatos sí permiten conocer `false`.

La validación individual siempre falla para un paquete inválido. El éxito global con borradores excluidos conserva avisos y errores en su informe; no presenta esos paquetes como válidos. Fallos de lectura/escritura de la raíz o catálogo son fatales. Una raíz sin subcarpetas genera un catálogo vacío válido; una raíz ausente es error de instalación.

El catálogo se construye exclusivamente con resultados válidos y disponibles, ordenados por `publication.order` y después id ascendente ASCII. Debe ser determinista para los mismos archivos: UTF-8, sangrado de dos espacios, saltos LF y salto final; no incluir fechas ni rutas del ordenador. Escribir el resultado completo después de validar, evitando archivos a medio escribir. Ante fallo fatal, terminar con código distinto de cero; el arranque no podrá aceptar un catálogo anterior que no concuerde con los paquetes actuales.

`catalogo.json` es un artefacto regenerable, no mantenido a mano ni usado como aprobación. Puede quedar fuera de Git según la práctica del repositorio; los paquetes aprobados y el código necesarios para generarlo sí deben formar parte de la versión.

### 4.3 Arranque y consultas

El arranque real lee y valida los paquetes de APP una vez, reutiliza las mismas operaciones y verifica que el catálogo generado existe, es válido y concuerda con el que producen esas fuentes. Fallar antes de escuchar peticiones si hay error fatal, catálogo ausente, corrupto o desactualizado. Los borradores inválidos siguen la política anterior y producen diagnóstico.

Conservar las definiciones admitidas y el catálogo como datos internos inmutables durante la ejecución. Consultar el catálogo no relee/parsa `cartas.json`, no cambia salas, no crea sesiones y no renueva actividad de espera. No hay recarga editorial en caliente; una nueva versión requiere preparación y arranque nuevos. Los montajes de pruebas pueden inyectar catálogo/lector; no pueden hacer que el arranque real sustituya silenciosamente un error de carga por un catálogo vacío.

## 5. Contratos internos y errores

El validador de dominio recibe una definición en memoria de `Deck`, no rutas ni los dos archivos de transporte. Devuelve `{ valid, errors }`: válido con lista vacía, inválido con al menos un error. Es puro, determinista y no muta los datos. Protege las invariantes citadas y la presencia/validez de campos; acepta los vacíos permitidos. No conoce disponibilidad, versiones de paquete, catálogo, texto editorial específico, archivos ni imágenes decodificadas.

Los tres ids fijos/orden del formato, propiedades adicionales, sobre de colección, créditos, descripción requerida del paquete y versiones se comprueban en infraestructura. El dominio trabaja con los tres atributos declarados y sus referencias: no necesita conocer que una temática se llama genérica ni cómo presenta sus símbolos.

Cada error puro contiene `code`, `path`, `message` y, cuando sea identificable, `cardId` y `attributeId`. El adaptador añade `stage` y `file`, una ruta relativa al paquete. `path` localiza la propiedad, por ejemplo `cards[7].values.atributo2.displayValue`; para un JSON que no puede analizarse indica raíz/posición disponible. No añadir acceso a archivos al dominio para obtener esa localización.

| Clase | Códigos mínimos o motivos distinguibles |
|---|---|
| JSON | `JSON_ENCODING`, `JSON_SYNTAX`, `JSON_DUPLICATE_KEY`. Detectar duplicados también anidados y nombres equivalentes tras interpretar escapes; un `JSON.parse` que sobrescribe claves no basta. |
| Formato | `MISSING_FIELD`, `UNKNOWN_FIELD`, `INVALID_TYPE`, `INVALID_VALUE`, `UNSUPPORTED_SCHEMA`; respetar todas las propiedades y vacíos del contrato. |
| Coherencia | `DECK_ID_MISMATCH`, `VERSION_MISMATCH`; carpeta/id/deckId, versiones conocidas/positivas/coincidentes. |
| Dominio | Diferenciar tamaño, atributos, id de carta duplicado, valores ausentes/repetidos/no enteros/fuera de rango e indicador desconocido. Los nombres concretos de estos códigos pueden elegirse al implementar. |
| Recursos | `IMAGE_PATH`, `IMAGE_NOT_FOUND`, `IMAGE_INVALID`, `IMAGE_OUTSIDE_DECK`; error con propiedad de portada o carta afectada. |
| Preparación/arranque | `IO_ERROR`, `CATALOG_MISSING`, `CATALOG_INVALID`, `CATALOG_STALE`; diagnóstico de operador, sin servir un resultado parcial. |

Los errores detallados se imprimen/registran para autor y pruebas. No se envían rutas locales, contenido de archivos o trazas al navegador. No se convierte un número textual, se rellena un nombre, se resuelve un indicador por nombre visible ni se sustituye un recurso roto por `null` para superar la validación.

**Recursos:** aplicar contrato §6 completo: referencia `null` sin archivo; no nula con alt no vacío, ruta permitida, escritura exacta, destino real contenido —incluidos enlaces— e imagen WebP/PNG/JPEG decodificable con extensión y dimensiones coherentes. Comprobar solo cabeceras o extensión no demuestra que los bytes sean una imagen válida. Las unidades y metadatos no se heredan ni se completan.

## 6. Catálogo y acceso público

`catalogo.json` y `GET /api/decks` usan el mismo contrato de resumen:

```json
{
  "decks": [
    {
      "id": "prueba-disponible",
      "schemaVersion": 1,
      "contentVersion": 1,
      "name": "Paquete de prueba",
      "subtitle": "",
      "description": "Resumen de una fixture disponible.",
      "imageUrl": null,
      "imageAlt": ""
    }
  ]
}
```

El ejemplo ilustra transporte; no entrega contenido editorial ni hace disponible la genérica. Las propiedades del resumen son exactamente las mostradas. `imageUrl` es `null` o una URL relativa al mismo origen, generada por el servidor; `imageAlt` conserva el texto del paquete. No añadir `cards`, `values`, `attributes`, créditos, notas, instrucciones, rutas internas ni flags de preparación al resumen. Respuesta sin disponibles: HTTP `200`, `{"decks":[]}`.

La consulta es pública, de solo lectura, sin requisito de sesión o sala ni creación de cookie; devuelve JSON y `Cache-Control: no-store`. Definir los tipos seguros en `shared/contracts` y añadir `api.decks()` al cliente mediante su transporte existente. No mostrar todavía un selector ni añadir una pantalla técnica. Comprobar acceso desde un navegador real mediante la API y el cliente mediante su prueba de transporte.

Si hay portada, la URL tendrá la forma `/media/decks/<id>/v<contentVersion>/<imageRef>`, por ejemplo `/media/decks/prueba-disponible/v1/imagenes/portada.png`. Servir solo recursos no nulos previamente validados de paquetes disponibles de esa ejecución, con tipo MIME correcto y esa versión. El registro de recursos también puede contener imágenes de cartas disponibles, conforme a infraestructura; esto no publica los JSON ni posiciones de cartas. No resolver una ruta arbitraria enviada por el solicitante contra todo `barajas/`.

Un recurso desconocido, una versión distinta, un paquete no disponible o una ruta de escape responde `404` sin ruta local. Bloquear explícitamente el acceso a `/barajas/` y sus JSON —incluido el catálogo interno— y evitar que esas solicitudes o las desconocidas de `/api/` y `/media/decks/` caigan en la respuesta HTML de la SPA. No montar `express.static` sobre la raíz de paquetes ni copiar los dos JSON completos a `public/` o al bundle del cliente.

## 7. Responsabilidades y dependencias

| Responsabilidad | Capa/pieza | Dependencias y comprobación |
|---|---|---|
| `Deck`, `Card` y validación de invariantes | `server/domain` | Tipos/datos puros; sin Node, reloj, red, aplicación, infraestructura ni formato de catálogo. Pruebas puras e importaciones. |
| Leer JSON, validar formato/coherencia/recursos y cargar definiciones | Adaptadores de `server/infrastructure` | Pueden usar archivos, decodificador y dominio. No deciden temas, reparto, puntuación ni permisos de sala. Integración con paquetes reales. |
| Preparar catálogo determinista y diagnósticos | Herramienta interna delgada y operaciones de infraestructura reutilizables | El comando conecta esas operaciones; no contiene otra copia de las invariantes. Misma validación en comando y arranque. |
| Listar el catálogo público | Caso de uso de aplicación y puerto de catálogo de solo lectura | Puerto definido en aplicación; devuelve resúmenes seguros, no entidades completas. Sin lector concreto, Express ni filesystem. Pruebas con sustituto. |
| Registro cargado, HTTP y recursos públicos permitidos | Infraestructura | Implementa el puerto y adapta HTTP; no cambia la sala ni devuelve el paquete. Integración, revisión de payloads y rutas. |
| Elegir lector, raíz y caso de uso, validar antes de escuchar | Composición y `server/main.ts` | Único borde que conecta concretos. Error fatal de carga impide arranque; pruebas de proceso compilado. |
| Tipos públicos y `api.decks()` | `shared/contracts` y cliente | Cliente no importa `server` ni paquetes JSON; no contiene reglas del validador. Prueba de transporte y navegador. |

No crear puertos de selección, modelos de partida, clases por campo ni módulos vacíos. La sala y su ciclo de vida continúan en sus capas actuales. El puerto nuevo solo necesita ofrecer la lista de resúmenes para este caso de uso; el acceso a definiciones para iniciar partidas se concretará después.

**Autonomía del implementador:** funciones o clases, nombres internos, representación inmutable, lector/parser que detecte duplicados, decodificador de imágenes, organización de la herramienta, forma de inyección y registro. Puede añadir la dependencia necesaria con justificación y versión fijada. Debe conservar las operaciones, contrato HTTP y política especificados. Cambiar disponibilidad, schema, alcance, permisos o reglas de juego requiere volver al autor; las elecciones técnicas locales compatibles no requieren una nueva ronda funcional.

## 8. Ejemplos y criterios comprobables

| Criterio | Dado / acción / resultado esperado |
|---|---|
| B04-01 — Copia | Incorporar la genérica y comparar bytes/huellas y lista. Coinciden con §3, permanece versión 1/no disponible y ASSETS no cambia. Construir/arrancar con solo APP funciona sin resolver ASSETS. |
| B04-02 — Dominio común | Ejecutar E1–E7 de la propuesta y dos definiciones sintéticas distintas. Aceptar series completas, vacíos permitidos y números iguales entre atributos; rechazar sus variantes inválidas sin mutar la entrada. Aceptar 58 indicadores del mismo atributo conocido. |
| B04-03 — JSON/formato | Paquetes con campo ausente/adicional, tipo incorrecto, nombre/descripción/display vacíos, claves duplicadas en metadatos y valores anidados —incluido un nombre escapado equivalente—, JSON roto y codificación inválida. Rechazo con archivo/propiedad/motivo, sin sobrescritura o reparación. |
| B04-04 — Coherencia | Carpeta/id/deckId distintos, versiones diferentes, no positivas o desconocidas, atributo fuera del esquema/orden, carta sin valor, número citado/fraccionario/fuera de rango o repetido. Rechazos localizables. No comprobar que display y play sean iguales ni el reparto 20/19/19. |
| B04-05 — Recursos | Aceptar paquete real con imágenes `null` sin directorio y fixture con portada/imagen de carta reales. Rechazar ruta inválida, ausencia, extensión/bytes incoherentes, imagen truncada/no decodificable, archivo fuera de raíz y escape por enlace. Probar alt vacío con referencia y ruta vacía. |
| B04-06 — Disponibilidad | Matriz de §4.2: válidos/inválidos disponibles y no disponibles, disponibilidad indeterminable. El borrador inválido informa y excluye sin fallar el conjunto; su comando individual falla. El disponible inválido o disponibilidad indeterminable falla. |
| B04-07 — Catálogo | Generar con genérica: lista vacía; con fixtures disponibles: solo resúmenes válidos ordenados, exclusión de no disponibles, duplicar preparación produce los mismos bytes. No depender de un catálogo anterior ni de ids en código. |
| B04-08 — Arranque | Ejecutar servidor compilado con catálogo correcto, ausente, corrupto y desactualizado; éxito solo cuando corresponda. Con fallo fatal no escucha. Consultas repetidas no vuelven a cargar cartas ni incorporan cambios editoriales. |
| B04-09 — API/cliente | GET sin cookie/sala devuelve `200`, JSON de §6 sin cookie nueva. Probar vacío y fixtures disponibles, `api.decks()` y consulta desde navegador real. Consultar no modifica participación, revisión ni plazos de una sala. |
| B04-10 — Privacidad/medios | Intentar descargar `baraja.json`, `cartas.json`, catálogo interno y acceder a versión/recurso/paquete no autorizado: `404`. Obtener una imagen disponible validada con MIME correcto. Revisar payload y build del cliente: ninguna colección de 58 cartas ni paquete completo incluido. |
| B04-11 — Arquitectura | Una única validación pura reutilizada; caso de uso con puerto sustituido; parser/archivos/decodificación fuera del dominio; composición conecta concretos; cliente usa solo contrato. Control de imports/ciclos y revisión de responsabilidades superados. |
| B04-12 — Regresiones/evidencia | `npm run check` y todos los recorridos de salas existentes superados en la versión entregada. Registrar pruebas, copia, artefactos, fallos y límites; no declarar completas las partes futuras de C09–C10. |

Los paquetes de prueba son fixtures temporales o de pruebas, con ids propios y propósito explícito. Para comprobar disponibilidad se crean allí metadatos `available: true`; no se modifica ni se publica una nueva versión de la genérica. Los ficheros para probar errores pueden ser deliberadamente inválidos. No se incorporan esas fixtures al catálogo de ejecución normal.

## 9. Cobertura de C09–C10 y plan de verificación

| Criterio del contrato | Evidencia de este bloque | Evidencia posterior |
|---|---|---|
| C09 | Copia aprobada, validación, exclusión de no disponibles/inválidas, fallo de disponible inválida y catálogo generado. | Petición de selección, autorización del anfitrión, conservación de la versión elegida y uso al iniciar. No hay endpoint de selección aquí. |
| C10 | Carga sin imágenes, `null` en resumen, privacidad de JSON y servicio limitado de recursos. | Presentación del icono, selector y cartas en móvil/escritorio y comprensión con usuarios. No se afirma probado el icono mediante una respuesta API. |

- **Puras:** validador `Deck` y mutaciones aisladas; conservar E1–E7. Verificar idempotencia/no mutación y ausencia de reglas por temática.
- **Formato/archivos:** directorios temporales, claves duplicadas reales en texto JSON, bytes y rutas reales, fixtures decodificables PNG/JPEG/WebP y ejemplos corruptos. Un mock de existencia no acredita la validación de recursos; registrar las capacidades de enlaces de la plataforma y ejecutar su caso de escape.
- **Aplicación/transportes:** puerto sustituido, HTTP real o integración del adaptador, cliente de API y navegador conectado a instancia con fixtures. Ninguna fixture de disponibilidad modifica el paquete maestro o su copia.
- **Construcción/arranque:** generar dos veces, comprobar igualdad; probar fallos y códigos de salida; ejecutar `npm run build` y servidor compilado en un entorno de prueba cuyo árbol de datos solo contiene APP. No retirar ni renombrar ASSETS real para simularlo: aislar la ejecución y/o interceptar lecturas ajenas para demostrar independencia. Comprobar que el cliente compilado no contiene los paquetes.
- **Regresiones:** `server/application/room.test.ts`, `roomUseCases.test.ts`, `waitingLifecycle.test.ts`; repositorio/sesiones, `server/app.test.ts`, `socket.test.ts`, `lifecycleSocket.test.ts`, `src/roomState.test.ts` y controles de arquitectura. Ejecutar completos `tests/browser/room.spec.ts`, `join.spec.ts`, `lifecycle.spec.ts`, además de los casos de catálogo necesarios.
- **Gates:** `npm run check`, `npm run test:browser` y `npm run check:architecture`; revisar también la herramienta, no cubierta íntegramente por el escáner de módulos de producción. La evidencia histórica 65 Vitest/18 navegador de B03 no sustituye la nueva ejecución; registrar los recuentos realmente obtenidos.

Las huellas prueban fidelidad de copia; las pruebas de dominio prueban invariantes; las de archivos prueban lectura y recursos; las de proceso/API prueban construcción, carga y exposición. Ninguna demuestra equilibrio, selector, partida o despliegue. Conservar evidencia breve ligada al cambio/versión y criterios, no informes masivos por rutina.

## 10. Decisiones, alineación y cierre

| Decisión | Estado y fuente |
|---|---|
| Incorporar genérica versión 1 sin modificar ni activar | Confirmado por el encargo del autor. Copia para implementación; disponibilidad sigue `false`. |
| Borrador inválido no bloquea preparación; individual sí falla; disponibilidad incierta bloquea | Confirmado por el autor el 01/10/2026 mediante pregunta de este hilo. Nueva aclaración a trasladar a coordinación/infraestructura §9.3. |
| JSON directo, imágenes opcionales, catálogo separado de selección | Confirmado en contrato e infraestructura alineada. |
| Comandos, arranque, resumen HTTP y rutas de medios | Concreciones técnicas de este bloque, compatibles con las fuentes; no decisiones editoriales nuevas. |

**Comprobación de alineación antes de cerrar:** se volvió a leer infraestructura §§9.1–9.4 y §17 el 01/10/2026 tras la actualización de su conversación responsable. Ya enlaza el contrato y fija JSON maestros directos, campos/ids/versiones, `null`, recursos validados, copia aprobada sin activación automática, catálogo privado/público y evidencia parcial C09–C10. No persiste el requisito inmediato de convertir CSV. La política de borradores anterior completa un caso que esa fuente no resolvía; no modifica su obligación de fallar para disponibles inválidas. La guía de dependencias se alinea documentalmente con ese flujo, conservando la dirección de capas.

No quedan decisiones funcionales que bloqueen esta especificación. La elección de baraja/dificultad predeterminadas y el diseño visual quedan para sus bloques.

**Cambios de alcance:** 01/10/2026 — se incorpora la aclaración de borradores inválidos; B04-06 y diagnóstico de construcción/arranque. Sin cambios a mecánica o disponibilidad de la genérica.

**Base comprobada el 02/10/2026:** `main`, `ac144fe`, paquete 0.1.0. `npm run check`: salida 0, 65/65 pruebas en 10 archivos, tipos/lint correctos, 25 módulos sin infracciones ni ciclos y build correcto. `npm run test:browser` con `CI=true` contra ese servidor compilado: salida 0, 18/18 recorridos Chrome (1,5 minutos), incluidos móvil/escritorio, sesiones independientes y margen real B03 (30.001,5 ms desde detección; detección de pérdida 2,9 ms). Se conservan las distinciones de tiempo de B03; este ensayo no acredita 30 minutos de espera física. Las ejecuciones se iniciaron sobre la base antes de crear código B04 y terminaron sobre su compilación.

**Cambio revisado:** `e5416f8`, rama local `feat/b04-carga-barajas`, sobre `ac144fe`. `bd2d6c9` conserva por separado los documentos locales anteriores, incluido el contrato íntegro, y registra la base. El commit de implementación añade la copia y el código/pruebas; este cierre registra los resultados después de ejecutar. Sin contradicciones funcionales ni cambios de contrato, mecánica o disponibilidad.

**Comprobaciones arquitectónicas de código:** control automático y revisión de responsabilidades superados, 37 módulos y cuatro casos negativos. **Fecha de trabajo:** 02/10/2026, fecha del cliente, zona Europe/Madrid. **Continuación:** selección/configuración de sala y presentación visual.

El [prompt de implementación](PROMPT_IMPLEMENTACION_BLOQUE_04.md) concreta el encargo. Al entregar código, añadir su referencia y resultados a este cierre y devolver a coordinación archivos, acuerdos, evidencia y pendientes.

## 11. Evidencia ejecutada — entrega B04

### Entorno y comandos

Windows NT 10.0.26300.0, PowerShell, Node 24.13.0, npm 11.6.2, TypeScript 6.0.3, Vitest 5.0.2, Playwright 1.63.0 y Chrome 154.0.8037.93. Decodificación: sharp 0.35.5 / libvips 8.18.7, fijados por dependencia directa y lockfile. Paquete KARTA3 0.1.0; código `e5416f8`. Comandos desde `E:\KARTA3\KARTA3_IA\APP\karta3`.

| Ejecución real | Resultado |
|---|---|
| `npm run check` sobre el código entregado | Salida 0: tipos, lint, **172/172 pruebas en 17 archivos** (11,59 s), arquitectura y build. Incluye las 65 pruebas previas, nuevo caso negativo de herramienta y 106 casos B04. |
| `npm run decks:validate -- --package barajas/generica` | Salida 0, válida y disponibilidad false; sin escribir el paquete. |
| `npm run decks:prepare` y preparación integrada en builds | Salida 0; catálogo normal `{ "decks": [] }`, bytes reproducibles. |
| `npm run check:architecture` separado | Salida 0: **37 módulos**, sin imports prohibidos ni ciclos. También incluye los comandos de raíz en tools. |
| `npm run test:browser`, `CI=true`, servidor compilado reiniciado | Salida 0: **22/22 recorridos** (1,5 minutos), los 18 anteriores y cuatro B04, a 390/1280px. Código compilado actual `e5416f8`. |
| `git diff --cached --check` del cambio de implementación | Sin errores tras indicar `whitespace=cr-at-eol` para las copias; no se cambió un byte del JSON para satisfacer este control. |
| HTTP real contra Vite local en 5173, conectado al compilado en 3000 | `/api/decks`: 200/vacío/sin cookie; `/barajas/generica/cartas.json` y medio no disponible: 404; acceso directo Vite `/@fs/.../barajas/generica/cartas.json`: 403 por fs.deny, sin datos de cartas. Ese 403 es la denegación de Vite, no el fallback de la aplicación. |

Las primeras iteraciones detectaron tres expectativas de fixture incorrectas (carpeta creada desde el id modificado, ubicación de la segunda repetición y directorio de catálogo considerado paquete), un `--import` de Windows expresado como ruta en vez de URL, tipado readonly al añadir contexto y un guard de prueba que no interceptaba rutas relativas. Se corrigieron el montaje, el escaneo del catálogo y el contexto. Se añadió una prueba positiva del propio guard antes de usarlo para afirmar independencia. No se registran esas ejecuciones como superadas. La ejecución final general pasó completa.

### Copia verificada

Origen: `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\generica`; destino: `E:\KARTA3\KARTA3_IA\APP\karta3\barajas\generica`. Copia del 02/10/2026 por `Copy-Item`, sin parsear/regenerar, con autorización de §3. Inventarios antes/después: **exactamente baraja.json y cartas.json**; no se añadió imagen ni archivo de sustitución. Formato 1, contenido 1, 58 cartas, referencias null y publicación false. Lectura final del origen confirma que ASSETS conserva lista y huellas.

| Archivo | SHA-256 de origen, copia y blob guardado en Git |
|---|---|
| `baraja.json` | `a86a5fe34573226694016f3dc49fd45cd966c4c1afa677d8a0bb28c54fb05a06` |
| `cartas.json` | `d3b22180d7ecfd991eeaca57ab664cacb566c198e20558104113d1a5de60461c` |

Comprobadas con `Get-FileHash` y con `git show HEAD:barajas/generica/<archivo>` leído como Buffer y SHA-256. `.gitattributes` usa `barajas/** -text whitespace=cr-at-eol`: conserva también los CRLF maestros al guardar/clonar; la política LF del resto del proyecto no convierte esos bytes. Hay una regresión de huellas que solo lee la copia APP. El contrato no se modificó respecto a `bd2d6c9`.

`catalogo.json` normal: UTF-8, dos espacios, LF y salto final; SHA-256 `c1835a70886802fa74ac40167dee8a7eabd409f0982e3d61b2b98f2f3fa566b6`. Es regenerable e ignorado en Git. La vigencia al arrancar exige sus bytes canónicos, no solo un JSON parecido; regenerar resuelve cambios de contenido, orden o formato.

### Resultados por criterio

| Criterio | Evidencia ejecutada y resultado |
|---|---|
| B04-01 | Inventarios/huellas y blobs anteriores coinciden. `packages.test.ts` verifica también huellas/estado de la copia. `startup.test.ts` construye realmente otro árbol con código/paquetes APP y enlace a las dependencias ya instaladas, sin ASSETS/TFM; intercepta IO hacia ASSETS en los procesos y valida primero que ese guard falla en un intento explícito. `npm run build`, arranque y consultas posteriores no producen accesos bloqueados. **Superado.** |
| B04-02 | `domain/deck.test.ts`: 16 casos, E1–E7, dos temas/ids de atributo distintos, vacíos frente a ausencia, 57/59 cartas, ids y valores repetidos, indicadores, enteros/rango; 58 indicadores iguales y display independiente aceptados. Entrada conservada y resultados repetibles. **Superado.** |
| B04-03 | `strictJson.test.ts` (14 casos) y sección formato de `packages.test.ts`: duplicados reales/escapados/anidados, JSON roto, comentarios/comas finales y UTF-8 inválido; campos/tipos/textos vacíos/adicionales. Paquetes completos con duplicado real y `play\\u0056alue` no producen definición. Errores con archivo, path, posición JSON y contexto identificable, sin reparación. **Superado.** |
| B04-04 | Sección formato/coherencia de `packages.test.ts`: carpeta/id/deckId, versiones citadas/no positivas/desconocidas/distintas, ids/orden, faltas y valores citados/fraccionarios/repetidos/fuera de rango. No se impone reparto editorial ni igualdad display/play. **Superado.** |
| B04-05 | 25 casos de recursos en `packages.test.ts`: genérica sin imagen/directorio y fixtures con portada/carta PNG/JPEG/WebP reales; bytes truncados, formato distinto, no imagen, ruta/alt vacíos, rutas prohibidas, ausencia y escritura distinta. Escape ejecutado mediante junction real de Windows a un directorio externo a la baraja, rechazado como IMAGE_OUTSIDE_DECK; no fue mock. Se decodifican píxeles completos, no solo metadata. **Superado.** |
| B04-06 | Matriz de publicación: válido true/false, inválido true/false fiable, colección ilegible con false fiable, metadata rota/duplicada/ausente, esquema desconocido y booleano ausente/mal tipado. El borrador informa/excluye; su CLI individual sale 1. Los casos fatales fallan preparación/carga y conservan el artefacto anterior sin aceptarlo al arrancar. **Superado.** |
| B04-07 | Catálogo normal vacío; fixtures alfa/beta/zeta y borrador prueban orden por order/id ASCII, exclusión, contrato exacto, UTF-8/LF y bytes iguales en dos preparaciones. Un catálogo anterior corrupto no dirige la preparación. Raíz vacía válida, raíz ausente/escritura imposible fallan y no queda temporal parcial. **Superado.** |
| B04-08 | `startup.test.ts`: seis casos con procesos compilados; build/arranque correctos, y catálogos ausente/corrupto/desactualizado, disponible inválida y disponibilidad incierta terminan con código 1 sin anunciar escucha. Tras arranque se rompe cartas y se añade un paquete: tres consultas mantienen la instantánea inicial. `packages.test.ts` conserva definición congelada y bytes de imagen incluso después de borrar la fuente. **Superado.** |
| B04-09 | `http.test.ts`: GET 200/no-store sin Set-Cookie, catálogo vacío y publicado; no cambia objeto de sala, participante, presencia, revisión ni vencimiento con reloj controlado. `api.test.ts` comprueba api.decks mediante el transporte existente y sus errores. Chrome realiza GET real sin cookie a 390/1280px y usa el catálogo de fixtures en procesos compilados. **Superado.** |
| B04-10 | `http.test.ts` y Chrome: resúmenes exactos, recursos públicos validados y disponibles con URL/version/MIME/bytes correctos; JSON/catalogo internos, recursos desconocidos/no disponibles/otra versión y recorridos de escape devuelven 404 sin fallback de aplicación. Se comprueban también prefijos escapados. El bundle del build aislado no incluye paquete/cartas/playValue. **Superado.** |
| B04-11 | `deckCatalog.test.ts` sustituye puerto y filtra propiedades internas. Escáner de 37 módulos y cuatro casos negativos; herramienta solo analiza argumentos/estado de salida y delega en composición. Revisión semántica: un validador jugable, formato/IO/decodificador en infraestructura, publicación/catálogo del paquete sin selección anticipada, proyección en aplicación, cliente solo contrato. **Superado.** |
| B04-12 | Todas las pruebas previas conservadas; check 172/172, arquitectura y build completos; navegador final 22/22. B03 distingue reloj controlado, conexiones reales con reloj sustituido y reserva/detección real. Medición final: recuperación detectada en 5,4 ms; pérdida por `transport close` en 9,3 ms; reserva 30.005,6 ms; total desde pérdida 30.014,9 ms, con pingInterval/pingTimeout de 5000/5000 ms. No se simula esa reserva ni se acredita media hora física. Capturas de aviso a 390/1280px revisadas visualmente: código, lista, aviso y edición legibles, sin desbordamiento horizontal. **Superado.** |

### Decisiones técnicas y archivos

Mapa de responsabilidades en [organización §6](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md). Las operaciones `validatePackage`, `prepareDecks` y `loadPreparedDecks` comparten parser, formato, dominio y recursos. La CLI no reproduce reglas ni elige una temática. Composición resuelve rutas desde su instalación, tanto con tsx como compilada; `predev` prepara y `build` integra preparación. El arranque real siempre carga explícitamente; el catálogo vacío por defecto de createRuntime es un montaje para pruebas, no un rescate ante errores de main.

Cambios de implementación (`e5416f8`, 38 archivos): copias `barajas/generica/*.json`; `.gitattributes`, `.gitignore`, package/lock; `server/domain/deck*`, `application/deckCatalog*`, `composition/decks.ts`/`createApp.ts`, `infrastructure/decks/*`, `http/expressApp.ts`/`publicFiles.ts`, `main.ts`; contrato público `shared/contracts/deck.ts`, `src/api*`; herramienta y control de arquitectura/caso negativo; fixtures/montaje/navegador B04; `vite.config.ts`, README y guía. El comando Git permite obtener los nombres exactos: `git show --stat e5416f8`. El cierre actualiza B04, proceso/propuesta y la aclaración autorizada en TFM infraestructura §9.3; los documentos anteriores y los bloques de salas conservan sus registros históricos.

### Límites y coordinación

- C09 solo copia/validación/filtrado/bloqueo/catálogo. Selección autorizada, versión elegida en sala y uso al iniciar quedan pendientes.
- C10 solo carga null, resumen, privacidad y servicio limitado de medios. No se presenta ni se prueba icono, selector o cartas; la revisión móvil/escritorio conserva la interfaz de espera.
- El incremento editorial de versiones y la aprobación son un proceso trazable; se comprueban versiones actuales, no un histórico automático de todas las publicaciones. No se activa la genérica ni se prueba equilibrio, licencias o calidad editorial.
- Los medios se retienen en memoria y no se recargan: una versión nueva requiere preparar/reiniciar. No se han medido catálogos grandes ni carga sostenida.
- Plataforma ejecutada: Windows/Chrome. Decodificador nativo instalado para este entorno; Linux/CI, HTTPS/VPS y publicación de esta rama se verifican en sus conversaciones responsables. No hay despliegue ni nueva ejecución remota de CI acreditados aquí.
- CSV, Sistema Solar, configuración, bots, partida y contenido editorial permanecen fuera. Las simulaciones de 30 minutos de B03 siguen siendo tiempo controlado; solo su reserva de 30 segundos se vuelve a ejecutar físicamente.

La aclaración de borradores quedó trasladada a `TFM/Planificación/INFRAESTRUCTURA_KARTA3.md` §9.3, como cambio local de su fuente responsable; no forma parte del repositorio Git APP. Entrega para coordinación: rama/commits locales, mapa anterior, resultados por criterio y estos límites. Revisión/publicación GitHub según el hilo responsable.
