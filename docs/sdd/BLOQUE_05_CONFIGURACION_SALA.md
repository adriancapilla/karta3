# Bloque 05 — Selección de baraja y configuración de la sala

**Estado:** acordado, implementado y verificado localmente el 02/10/2026 para B05-01–16. Evidencia nueva, revisión y límites en §12; sin inicio, partida ni despliegue.

**Tipo y punto de partida:** incremento funcional sobre B01–B04. Rama observada `feat/b04-carga-barajas`, HEAD `7d2536f9c5ad1956fc218146e90c1fd6937a5a71`, paquete 0.1.0; árbol limpio al comenzar esta preparación. No se cambia de rama ni se descarta trabajo. B04 registra código revisado `e5416f8` y cierre en `7d2536f`: 172 pruebas/22 recorridos Chrome y comprobación de 37 módulos. Son resultados históricos de B04, no pruebas ejecutadas ni resultados de B05.

## 1. Objetivo y referencias

Permitir que el anfitrión seleccione una versión de baraja y ajuste la preparación desde la espera, después de crear la sala y obtener el código. Las personas pueden entrar durante la configuración y consultan los valores aceptados sin recargar.

| Referencia | Decisiones aplicables |
|---|---|
| [AGENTS.md](../../AGENTS.md), [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), §§2–7 | Servidor como autoridad, capas, puertos, composición y privacidad. |
| [Proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) | Acuerdos, aceptación, cambios y evidencia futura. |
| [B04](BLOQUE_04_CARGA_BARAJAS.md), §§4–7, 9 y cierre §§10–11 | Catálogo cargado/validado, `GET /api/decks`, `api.decks()`, resúmenes, medios y evidencia local con sus límites. |
| [Contrato formato 1](../contratos/CONTRATO_BARAJAS_V1.md), §§3–7 y 9 | Identidad/versiones, referencia gráfica opcional, datos seguros y C09–C10. No modificar el formato. |
| [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§3–7 y 10 | Permisos, configuración, capacidad, orden, observador y revisión de ronda. |
| [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), §§4–5 y 7 | Baraja validada, `turnTimeout` y `forceTieBreak`. No implementar reglas de partida. |
| [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §§5–9 | Identidad de sesión, tiempo real, prioridades de vencimiento y catálogo inmutable. |
| [B01](BLOQUE_01_CREACION_SALA.md), [T01](BLOQUE_T01_REFACTOR_CREACION_SALA.md), [B02](BLOQUE_02_ENTRADA_SALA.md), [B03](BLOQUE_03_CICLO_VIDA_ESPERA.md) | E1–E7, entrada/lista/nombres/salida y presencia/expiración; conservar contratos y garantías existentes. |

## 2. Alcance y decisiones confirmadas

| Control | Valores | Estado inicial |
|---|---|---|
| Baraja | Versión disponible y validada del catálogo, o ninguna | Sin baraja seleccionada, incluso si el catálogo contiene una sola. |
| El anfitrión juega | Booleano | Sí. |
| Tiempo por turno | 15, 30 o 60 segundos | 30. |
| Forzar desempate | Booleano | Desactivado. No añadir «Permitir empate». |
| Revisión de ronda | 0, 2, 5, 10, 15 o 30 segundos | 5. Mostrar 0 como «Sin pausa (0 s)». |

**Incluye:** aplicación inmediata de cada control; selección/quitar selección autorizadas; consulta de valores para invitados; participación del anfitrión, capacidad y orden; persistencia en la sala en memoria; sincronización y recuperación; carga/error/vacío del catálogo; portada o icono de ausencia. Esta persistencia no sobrevive a un reinicio del servidor, conforme al MVP.

**Fuera:** bots, dificultades y controles desactivados de bots, expulsión, inicio, motor, reparto, turnos, puntuación, ejecución del desempate, manos/cartas de juego, mesa/resultados, CSV, edición editorial, GitHub y despliegue. Cambiar estos valores no crea `Game` ni ejecuta una ronda. No añadir una acción operativa de inicio.

**Contenido inicial:** mantener en ASSETS y APP la genérica formato/contenido 1 y `publication.available: false`. El catálogo normal de B04 es vacío. Selección y presentación se comprobarán con paquetes de prueba explícitos, disponibles y validados, sin activar la genérica. La activación requiere otro encargo del autor y nueva versión en ambos JSON.

**Decisiones de este hilo:** cambios inmediatos; último cambio válido procesado por el servidor para cada control; observador fuera de la numeración de jugadores; permitir quitar selección; ante fallo volver al valor aceptado y mostrar el motivo. No hay botón «Guardar configuración» ni un borrador de todo el formulario pendiente de guardar.

## 3. Recorrido y presentación

### 3.1 Sala y actores

Conservar código/copia, nombres, avisos B03, salida/cierre y navegación. Añadir una sección «Configuración» en la espera, sin una pantalla previa a obtener código ni impedir nuevas entradas.

- **Anfitrión:** controles editables, también cuando observa. Cada gesto envía solo ese cambio. Mientras se confirma, el control puede mostrar el valor solicitado con «Aplicando…»; no se presenta como aceptado. Al confirmar adopta el estado vigente; al fallar vuelve al último valor aceptado y muestra un error junto al control.
- **Invitado:** resumen textual de los mismos valores aceptados, con nombre/descripción/portada de baraja. No ofrecer controles de edición ni confiar en esconderlos para autorizar. Conserva edición de su nombre y salida.
- **Lista:** «Jugadores», numerada según su orden, con contador de plazas derivado de `isPlayer`. Si el anfitrión observa, mostrar debajo una línea «Anfitrión · Observador», fuera de esa numeración, con nombre, «Tú» cuando corresponda y presencia. Sigue siendo miembro de la sala y recibe sus eventos. Usar todas las personas para los sufijos de nombres repetidos, conservando B02.

En móvil, disposición vertical: código/estado, jugadores/observador, configuración, nombre propio y acciones de salida/cierre. En escritorio, jugadores y configuración pueden ocupar dos columnas después del código, conservando el orden de lectura y tabulación. Reutilizar el estilo de la espera. Probar 390 y 1280 px, sin desbordamiento y sin depender de color o hover para entender estados.

### 3.2 Catálogo y portada

Usar un desplegable nativo: «Sin baraja seleccionada» y nombres con versión de contenido, por ejemplo «Baraja de prueba · v2». No elegir automáticamente una opción al cargar. Debajo, mostrar nombre, descripción y portada de la **selección aceptada por el servidor**; mientras se aplica otra, la ficha sigue identificando la selección vigente. En ausencia de selección, texto «Sin baraja seleccionada»; no inventar metadatos.

| Estado | Presentación y acciones |
|---|---|
| Cargando | «Cargando barajas…» como estado accesible. Mantener selección aceptada si existe y la opción de quitarla; aún no ofrecer otras opciones. Los demás controles siguen utilizables con conexión. |
| Catálogo vacío | «No hay barajas disponibles. Puedes configurar las demás opciones.» Solo opción sin selección; conservar la sala y las demás funciones. No activar ni mostrar la genérica como seleccionable. |
| Error de consulta | «No se pudieron cargar las barajas» y «Reintentar» para leer el catálogo. Conservar valores/ficha aceptados y opción de quitar selección; no ofrecer nuevas selecciones basadas en una respuesta fallida. Reintentar la lectura no renueva la espera. |
| Disponible | Ofrecer las entradas recibidas; seleccionar exige confirmación del servidor. El resultado del catálogo no sustituye a la selección ni altera por sí solo la sala. |
| Selección aceptada sin imagen | Icono neutro común de carta y nombre/descripción. Icono decorativo, oculto a lectores de pantalla si el texto ya identifica el contenido; no emitir un `<img>` con `null` o ruta vacía. |
| Selección aceptada con imagen | URL versionada de B04 y texto alternativo. Si su descarga falla, conservar selección/nombre/descripción, mostrar icono y «No se pudo cargar la portada». Ese aviso no convierte una referencia declarada en `null` ni sustituye la validación de recursos. |

Los invitados consultan la ficha segura recibida en la vista; no necesitan descargar el paquete ni resolver una definición por su cuenta. No interpretar HTML de descripciones ni instrucciones editoriales como reglas ejecutables.

### 3.3 Pendientes, errores y accesibilidad

Conservar el foco y los nodos de controles al actualizar participantes, presencia, avisos o configuración. Una actualización remota no borra el nombre propio que se esté escribiendo ni un valor local aún pendiente de confirmación. Los controles sin petición propia pendiente reflejan inmediatamente los valores aceptados.

Relacionar labels/errores mediante los mecanismos accesibles existentes; anunciar «Aplicando…», aceptación o fallo de forma breve, sin mover foco ni anunciar cada actualización de la lista. No reemplazar todo el formulario por una pantalla de carga. Los errores afectan al control correspondiente; conservan otras solicitudes pendientes y acciones de sala.

Sin conexión, no encolar cambios de configuración para enviarlos automáticamente al reconectar: mostrar el aviso y volver al valor aceptado. Si se pierde una confirmación, indicar «No se pudo confirmar el cambio; se muestra la última configuración recibida» y resincronizar cuando vuelva la conexión. No afirmar que el servidor rechazó algo cuyo resultado se desconoce. Tras recarga, recuperar la configuración aceptada; los valores provisionales no se persisten ni se reenvían. Nuevos gestos del anfitrión son nuevas acciones.

## 4. Estado del servidor y vista segura

Ampliar las propiedades actuales, manteniendo sus nombres y el resto de `RoomView`:

| Estado/vista | Contrato |
|---|---|
| `settings.deckId` | `string` o `null`; id aceptado. |
| `settings.deckContentVersion` | Entero positivo o `null`; nueva propiedad. Id/versión son ambos nulos o ambos presentes. |
| `settings.hostPlays` | Booleano. |
| `settings.turnSeconds` | 15, 30 o 60. |
| `settings.forceTieBreak` | Booleano. |
| `settings.reviewSeconds` | 0, 2, 5, 10, 15 o 30. |
| `selectedDeck` | Nueva propiedad de `RoomView`: `DeckSummary` de B04 o `null`. Coincide con id/versión de settings y contiene solo sus ocho campos públicos. |
| `participant.isPlayer`, `participants[].isPlayer` | Ampliar el literal actual `true` a booleano; solo el anfitrión puede ser `false` en este bloque. |
| `revision`, `lifecycle`, identidad y presencia | Mantener contratos B02/B03. Una modificación efectiva incrementa revisión una vez y publica una vista coherente. |

El servidor conserva la referencia exacta de selección y una ficha pública coherente obtenida de su catálogo validado. Las vistas no incluyen `Deck`, cartas, valores de comparación, orden oculto, rutas locales, credenciales ni marcas de validación internas. La selección queda vinculada a la versión publicada comprobada; no sustituirla silenciosamente por otra versión con el mismo id.

`participants` sigue incluyendo todos los miembros, también al anfitrión observador. Puede contener seis personas: cinco jugadores y ese observador. La ocupación se calcula con jugadores, incluyendo plazas reservadas de reconexión; no con la longitud de esa colección. El orden de jugadores es el de incorporación de invitados y después el anfitrión si juega. Cambiar su participación conserva id, nombre, sesión, autoridad, sala activa, presencia y reservas; no es salida, nueva entrada ni notificación de «ha salido».

## 5. Casos de uso, puerto y operación

**Caso de uso `ConfigureWaitingRoom`:** recibir identidad autenticada, sala, identificador de solicitud y un cambio; aplicar vencimientos debidos, autorizar pertenencia y anfitrión, deduplicar, validar y aplicar una transición atómica. Sus operaciones son seleccionar/quitar baraja, cambiar participación y cambiar uno de los tres valores de tiempos/desempate. Funciones o métodos internos son elección del implementador; no crear un caso de uso independiente por cada checkbox si comparte la misma coordinación.

Para una selección, aplicación usa un puerto de **consulta de versión disponible validada**. Entrada: id y versión; resultado: ficha segura de esa versión o motivo no disponible/versión distinta. Su adaptador reutiliza la instantánea B04 y verifica que existen resumen publicado y definición validada correspondientes. No importar `LoadedDeckCatalog` directamente en aplicación ni acreditar validez mediante el payload del navegador. Puede extenderse el puerto existente o añadir esta capacidad al mismo adaptador; B05 no necesita entregar las 58 cartas al caso de uso ni crear un puerto especulativo de inicio.

**Transporte:** añadir acción Socket.IO `room:configure`, reutilizando sesión autorizada, confirmaciones y `room:state`. No añadir otro endpoint de mutación ni cambiar los eventos/HTTP existentes. Entrada exacta:

```json
{
  "requestId": "solicitud-opaca-unica",
  "roomId": "id-interno-de-sala",
  "change": {
    "field": "deck",
    "value": { "id": "prueba-disponible", "contentVersion": 2 }
  }
}
```

| `change.field` | `change.value` |
|---|---|
| `deck` | Objeto exacto `{ id, contentVersion }`, o `null` para quitar selección. Id conforme al contrato; versión entero positivo. |
| `hostPlays` | Booleano. |
| `turnSeconds` | Número 15, 30 o 60. |
| `forceTieBreak` | Booleano. |
| `reviewSeconds` | Número 0, 2, 5, 10, 15 o 30. |

Las claves superiores son exactamente `requestId`, `roomId`, `change`; change contiene exactamente `field`, `value`. Rechazar campos extra, controles desconocidos, tipos/coerciones y valores ajenos a los permitidos. `requestId` y `roomId` usan los límites/codificación de identificadores de las acciones B02; el navegador no envía sesión, rol, nombre, revisión esperada ni una copia de todos los settings.

Resultado: `SocketAck<{ room: RoomView }>` existente. Éxito devuelve una vista autorizada vigente, también si no hubo cambio; error usa su sobre existente. Publicar `room:state` a todas las pestañas/sesiones miembro cuando haya modificación efectiva. Ningún cliente calcula por sí solo su nueva plaza o anuncia una selección como guardada antes de recibir estado autorizado.

| Error | Caso y resultado |
|---|---|
| `INVALID_INPUT` | Forma/tipo/valor incorrectos; rechazar sin modificar configuración. |
| `SESSION_REQUIRED` / `FORBIDDEN` | Credencial inválida o solicitante no anfitrión; usar las garantías existentes. Un invitado con payload válido no configura. |
| `ROOM_NOT_AVAILABLE` | Sala cerrada/inexistente o vencida; aplicar recorrido de recuperación/cierre B03. |
| `ROOM_FULL` | Activar participación con cinco plazas ocupadas/reservadas; conservar observador y explicar que necesita plaza libre. |
| `DECK_NOT_AVAILABLE` | Id ausente, no disponible o sin definición validada; no adoptar datos del cliente. |
| `DECK_VERSION_MISMATCH` | Id disponible, pero no la versión solicitada; rechazar sin cambiar a la versión actual automáticamente. Permitir releer catálogo. |
| `REQUEST_CONFLICT` | Reutilizar id de solicitud con otro contenido o tipo de acción. No es conflicto por editar desde otra pestaña. |

Los dos códigos de baraja son ampliaciones de los errores públicos/aplicación; conservar los códigos y comportamientos anteriores. No enviar al jugador diagnósticos internos de archivos.

## 6. Atomicidad, concurrencia y actividad

- Cada solicitud modifica un solo control. Selección id/versión/ficha y participación/capacidad/orden se actualizan como una transición, nunca parcialmente.
- Ante cambios del mismo control desde varias pestañas, prevalece el último **cambio nuevo, válido y procesado** por el servidor. No comparar horas del navegador ni rechazar por una revisión antigua. Cambios de controles diferentes se conservan ambos: no sobrescribir con el resto de un formulario antiguo. Entradas, nombres y presencia tampoco producen conflictos de edición.
- Una petición repetida con mismo id/contenido no se aplica de nuevo ni restaura su resultado antiguo sobre cambios posteriores. Tras validar que sigue en la misma sala/contexto, devolver estado vigente o el error ya registrado. Antes de resolver una repetición se aplican vencimientos debidos; no devolver una sala resucitada. Un nuevo gesto tras rechazo usa un nuevo id; una retransmisión del mismo intento conserva el suyo.
- Un valor igual al aceptado —incluido volver a seleccionar el mismo id/versión o quitar selección ya nula— es éxito sin efecto: no incrementa revisión, publica cambios artificiales ni renueva la espera.
- Un cambio efectivo aceptado incrementa revisión y renueva los 30 minutos desde el procesamiento, retira el aviso y sustituye su generación de vencimientos, según B03. Nunca reinicia reservas de ausencia. Lecturas, montajes de controles, errores, duplicados, recargas y reconexiones no renuevan actividad.
- Aplicar primero las prioridades B03, incluso con callbacks retrasados: a partir del instante exacto de caducidad, no aceptar una configuración que rescate la sala. Las retiradas de presencia debidas se aplican antes de comprobar capacidad. Si coinciden caducidad y ausencia del anfitrión, cierre único por inactividad. Los efectos temporales debidos no se atribuyen como modificaciones de una solicitud rechazada.
- Invitado que entra y anfitrión observador que intenta jugar compiten por las mismas plazas. Si queda una, el primero procesado que cumple condiciones la ocupa; el otro recibe `ROOM_FULL`. No expulsar, reordenar invitados ni quitarles reservas para aceptar el cambio.

El cliente identifica confirmaciones por solicitud/control y adopta vistas con las reglas de revisión de B02/B03. Una confirmación o error tardíos de un intento anterior no borran otro valor pendiente más reciente ni sustituyen una vista más nueva. Las actualizaciones remotas y recuperación no disparan `room:configure` automáticamente. En desconexión, evitar que el transporte encole una acción de configuración para ejecutarla solo al reconectar.

## 7. Responsabilidades y dependencias

| Responsabilidad | Capa/pieza | Límites y comprobación futura |
|---|---|---|
| Settings aceptados, transición de participación, plazas/orden, revisión y renovación | Modelo de sala en aplicación | Reglas de preparación; datos/tiempo explícitos, sin Socket.IO ni filesystem. Pruebas puras del modelo; identidad/presencia conservadas. |
| Autorización, selección validada, deduplicación y coordinación de vencimientos/publicación | Casos de uso de aplicación, puertos existentes y consulta de versión | Sin adaptadores concretos; reutilizar B03 y una capacidad real del catálogo. Pruebas con sustitutos y carreras serializadas. |
| Resolver versión admitida desde la carga B04 | Adaptador de catálogo en infraestructura | Instantánea validada, sin nueva lectura/validación por selección ni reglas por temática. Pruebas de disponible/inválida/versión. |
| Decodificar acción y emitir vistas/acks seguras | Adaptadores Socket.IO/HTTP existentes | Traducen contrato; no deciden capacidad o participación. Integración con sesiones, origen y datos reales. |
| Conectar capacidad del catálogo y casos de sala | Composición | Elegir concretos en ese borde; conservar arranque B04. Control de imports y prueba integrada. |
| Formato público ampliado y estado visual por campo | `shared/contracts`, transporte y UI cliente | Sin importar servidor, paquetes completos ni reglas definitivas. Pruebas de reducer/transporte y navegador. |

Dominio de partida/validador B04 no cambia. El tiempo de revisión sigue siendo coordinación de aplicación; `turnSeconds`/`forceTieBreak` se almacenan para su uso futuro sin ejecutar dominio. No crear timers de turno, `Game` ni carpetas vacías.

**Autonomía del implementador:** nombres/estructura local, funciones/clases, organización del puerto, estado de solicitudes por campo y layout compatible con §3. Puede actualizar montajes y expectativas de DTO ampliado sin quitar aserciones de garantía. Reabrir con el autor cambios a permisos, último cambio válido, valores/defaults, comportamiento de fallo, actividad, disponibilidad o alcance.

## 8. Ejemplos y criterios de aceptación

Cada fila es una comprobación futura; ninguna se declara superada en esta preparación.

| Criterio | Dado / acción / resultado esperado |
|---|---|
| B05-01 — Inicial/vacío | Crear sala con genérica no disponible: código inmediato, defaults de §2, sin selección y aviso de catálogo vacío. Otros controles/nombres/entrada/cierre operan. Ninguna activación, autoelección o inicio. |
| B05-02 — Carga y error | Retrasar/fallar la consulta: mostrar estados/reintento, mantener foco y valores aceptados/otras funciones. Releer no renueva ni selecciona. Con una sola fixture disponible tampoco elegirla por defecto. |
| B05-03 — Selección válida | Host y un invitado en dos sesiones; anfitrión elige fixture disponible/versionada. Servidor comprueba definición/versión, guarda referencia y ficha; ambos ven actualización sin recargar. Ninguna colección de cartas en mensajes. |
| B05-04 — Quitar selección | Con selección aceptada, elegir ninguna: limpiar id/versión/ficha juntos, comunicar y renovar una vez. Repetir con estado nulo es éxito sin efecto. |
| B05-05 — Selección rechazada | Id desconocido, genérica no disponible, puerto sin definición validada y versión incorrecta: error correspondiente, selección anterior intacta, control vuelve al valor aceptado. No renovación ni sustitución silenciosa. |
| B05-06 — Permisos/entrada | Invitado intenta todos los cambios con credencial propia y payload válido: `FORBIDDEN`. Host ajeno tampoco puede. Entrar durante cambios funciona; la nueva vista incluye configuración aceptada. Identidad/nombre no acreditan rol. |
| B05-07 — Controles/tipos | Aplicar cada valor permitido, incluidos revisión 0 y desempate true/false. Rechazar strings numéricos, otros números, booleanos falsificados, claves/controles extra. Cada aceptación cambia solo su control; «Forzar desempate» es el único selector de empate. |
| B05-08 — Pendiente/fallo | Retrasar ack: marcar solicitud pendiente sin afirmar guardado. Rechazo o fallo: volver al aceptado, error asociado y foco conservado, sin perder otro intento pendiente ni nombre en edición. Un resultado desconocido se indica como no confirmado. |
| B05-09 — Observador | Host deja de jugar: misma identidad/permisos/presencia/sala activa, plaza liberada; línea observador sin numeración, contador y orden correctos para todos. Puede configurar/renombrarse/cerrar y recuperar su sala desde portada. |
| B05-10 — Capacidad/orden | Observador con cinco invitados no puede jugar; plazas de invitados reconectando también cuentan. Con cuatro puede, al final. Carrera de entrada y vuelta del host a jugador por última plaza admite solo una; con retirada debida se usa capacidad actual. |
| B05-11 — Último válido | Dos pestañas de la misma sesión cambian el mismo control: último nuevo válido procesado prevalece. Cambian controles distintos: conservar ambos. Actualizaciones y acks desordenados no retroceden vista ni borran otro pendiente. No producir conflicto por entrada/presencia. |
| B05-12 — Repetidas/sin efecto | Repetir id/contenido antes y después de otra configuración: un solo efecto, sin restaurar antiguo. Id reutilizado con otro contenido: conflicto. Nuevo id/mismo valor: sin efecto. Comparar configuración/revisión y expiración atribuibles a esas operaciones. |
| B05-13 — Recuperación | Recargar o reconectar antes del margen: mismos id/rol, selección/versión y valores aceptados, sin duplicación ni reenvío automático. Otro tab conectado mantiene presencia. Host observador sigue sujeto a cierre B03 si pierde todas sus conexiones y vence su margen. |
| B05-14 — Actividad/plazos | Cambiar efectivamente durante el último minuto retira aviso y renueva; catálogo, sin efecto/rechazadas/repetidas/reconexión no. Cambio procesado al vencimiento exacto o con callback atrasado no rescata sala. Cierre prevalece sobre respuestas viejas; preservar motivos B03. |
| B05-15 — Ficha/accesibilidad | Fixture con portada y otra con `null`: nombre/descripción, imagen/alt o icono neutro; no imagen rota ni texto null. Fallo de descarga tiene aviso sin perder selección. Host/invitado en 390/1280 px, teclado, labels/errores, sin salto de foco ni borrado por eventos remotos. |
| B05-16 — Arquitectura/regresiones | Puertos/composición correctos, control de importaciones/ciclos y revisión de responsabilidades. Conservar B01–B04 y todas las regresiones vigentes; evidencias nuevas vinculadas a B05 y sus límites. |

## 9. Dependencias y verificación prevista

**Existe:** B04 validado localmente, catálogo/medios cargados, contratos de resumen, modelo/casos de sala y ciclo B03. La rama de B04 sigue siendo el punto observado; integración GitHub pertenece a su hilo y no se presupone. Ampliar la capacidad de catálogo, settings, proyección y evento como parte de B05; no es requisito activar contenido real.

| Contrato | Parte comprobable en B05 | Parte todavía posterior |
|---|---|---|
| C09 | Selección/quitar selección autorizadas, comprobación de disponible/validada y versión, conservación y recuperación en sala. Conservar evidencia de catálogo/filtrado B04. | Validación al iniciar y uso de esa definición en partida. No marcar completo C09 solo por guardar la selección. |
| C10 | Selector/ficha e icono neutro de ausencia en móvil/escritorio; información autorizada de sala; conservar privacidad y medios B04. | Representación de cartas/manos/mesa y alcance de su información durante juego. Las comprobaciones de navegador no sustituyen una prueba de comprensión con usuarios. No atribuir toda la presentación del juego a la ficha de baraja. |

Plan para el hilo de implementación:

- Modelo/casos de uso: defaults, autorización, puerto sustituido que confirme/refuse versiones, quitar selección, booleans/valores exactos, plazas/orden/identidad y carreras. No afirmar que un resumen fingido por el cliente valida una definición.
- Tiempo controlado con infraestructura de pruebas B03: actividad/sin efecto, generación de aviso/caducidad, reservas y borde exacto. Conexiones Socket.IO reales para emisiones, identidad y varias pestañas; registrar por separado conexiones reales y duración simulada. La evidencia anterior no acredita esos casos nuevos.
- Transporte y estado cliente: strict payloads, deduplicación, actualizaciones/acks fuera de orden, errores por campo, nombre provisional conservado y ausencia de emisión durante montaje/recuperación. Verificar que no se cambia el resto de settings por una captura antigua.
- Navegador: mínimo dos sesiones independientes y dos pestañas del anfitrión; invitados consultan solo estado aceptado; fixtures disponibles para selección, recursos reales/nulos y catálogos vacío/error. Incluir capacidad y retorno de observador, recuperación y recorrido móvil/escritorio. Mantener todos los tests actuales de `tests/browser/room.spec.ts`, `join.spec.ts`, `lifecycle.spec.ts` y los de catálogo/privacidad B04.
- Regresiones de servidor/UI: suites de room, roomUseCases, waitingLifecycle, HTTP, sockets/lifecycleSocket, repositorio/sesiones, roomState/api, dominio y paquetes/catálogo/recursos B04, además del escáner y casos negativos de arquitectura. Ejecutar `npm run check` (incluye `check:architecture`) y `npm run test:browser` en la versión entregada; registrar recuentos/resultados reales, no copiar 172/22 de la base.
- Conservar huellas y disponibilidad de los paquetes reales. Fixtures pertenecen a tests o entorno temporal explícito, sin publicarlas en la ejecución normal. No ejecutar comprobaciones de equilibrio, selector de bots, partida o despliegue dentro de este bloque.

## 10. Preguntas resueltas, cambios y cierre

| Pregunta funcional | Respuesta del autor, 02/10/2026 | Fuente a informar |
|---|---|---|
| Guardado explícito o cambios inmediatos | Aplicar cada cambio inmediatamente. | Aplicación §4 / coordinación. |
| Conflicto entre pestañas | Aceptar el último envío válido; concretado por control y orden de procesamiento servidor. | Aplicación §4 e infraestructura §§5–7. |
| Presentación del anfitrión observador | Jugadores ordenados y una línea aparte «Anfitrión · Observador». | Aplicación §§5 y 7. |
| Volver a no tener baraja | Permitir quitar la selección durante la espera. | Aplicación §4. |
| Cambio que falla | Volver al valor aceptado y mostrar el error. | Aplicación §4 / recorrido de interfaz. |

No quedan preguntas funcionales bloqueantes. Layout detallado, módulos, organización del puerto y manejo interno de pendientes son elecciones técnicas compatibles. No están decididas activación editorial, baraja predeterminada de un futuro flujo ni dificultades; permanecen fuera y no se infieren de estas respuestas.

**Cambios registrados:** 02/10/2026 — respuestas de la tabla completan el encargo; afectan §§3–6 y B05-04, 08, 09, 11. Sin cambio de reglas de juego, versión/disponibilidad de genérica ni garantías B03.

**Alineación:** las opciones/defaults, orden, capacidad y autoridad ya coinciden con aplicación §§4–7. Este bloque concreta las elecciones de interfaz y simultaneidad que allí no se fijaban; trasladarlas a la conversación responsable para mantener las fuentes generales. Infraestructura §9 y contrato siguen gobernando carga/publicación; B05 consume la instantánea B04, sin crear otro formato ni flujo editorial. No modificar silenciosamente el documento vivo de coordinación.

**Durante la preparación documental:** no se ejecutaron pruebas de producto, por indicación del autor. La implementación posterior, su versión revisada, pruebas y fecha de verificación se registran en §12; se conserva esta separación respecto a la evidencia histórica de B04.

**Revisión documental, 02/10/2026:** referencias locales existentes, ejemplo JSON analizable y 16 criterios distintos. Las huellas de los dos archivos de la genérica coinciden entre ASSETS y APP y con las registradas en B04; formato/contenido 1 y disponibilidad false conservados. Esta lectura y comparación no son una nueva validación del paquete por la aplicación ni una prueba de B05.

**Entrega a coordinación/implementación:** este documento, punto de partida y decisiones cerradas, B05-01–16, ampliaciones de vista/evento/puerto, evidencia histórica separada y pendientes C09–C10. El cierre futuro registrará código revisado, resultados nuevos, limitaciones y fuentes generales alineadas. La partida, su inicio y presentación permanecen para otros bloques.

Encargo listo para copiar: [prompt de implementación B05](PROMPT_IMPLEMENTACION_BLOQUE_05.md).

## 11. Base ejecutada antes de implementar — 02/10/2026

Rama `feat/b04-carga-barajas`, HEAD `7d2536f9c5ad1956fc218146e90c1fd6937a5a71`. Se conservan los cambios locales de proceso y los dos documentos de B05. No se detectaron contradicciones funcionales en las fuentes consultadas.

`npm run check` ejecutado sobre esa base: salida 0, tipos y lint correctos, 172/172 pruebas Vitest en 17 archivos, control de 37 módulos sin infracciones/ciclos y compilación completa. La preparación conserva la genérica válida/no disponible y el catálogo vacío. Entorno: Windows, Node 24.13.0, npm 11.6.2. Esta ejecución acredita la base B04; no acredita B05 ni sustituye las pruebas finales de navegador.

## 12. Implementación, revisión y evidencia final — 02/10/2026

### 12.1 Versión y entorno

Código revisado: `73091f6905d0476bed5a31fd588a562bc9356525` (`73091f6`), en la rama existente `feat/b04-carga-barajas`. El commit documental anterior `ac8672b` conserva los cambios locales de proceso, especificación y prompt, y registra la base ejecutada. No se cambió de rama ni se publicó en GitHub.

Windows NT 10.0.26300.0, PowerShell, Node 24.13.0, npm 11.6.2, TypeScript 6.0.3, Vitest 5.0.2, Playwright 1.63.0 y Chrome 154.0.8037.93. Ejecución local por loopback, un proceso por instancia. Fecha local 02/10/2026, Europe/Madrid (UTC+02:00). Navegadores con contextos/cookies independientes y dos pestañas del anfitrión; vistas 390×844 y 1280×800.

### 12.2 Puertas realmente ejecutadas

| Comprobación final | Resultado observado |
|---|---|
| `npm run check` | Salida 0; tipos/lint correctos; **197/197 pruebas en 21 archivos**, 11,53 s de Vitest. Incluye las 172 regresiones existentes y 25 pruebas nuevas de casos/configuración, sockets, pendientes y transporte. |
| `npm run check:architecture`, dentro de check | **41 módulos**, sin importaciones prohibidas ni ciclos. Los cuatro casos negativos del escáner pasan en la suite. |
| Preparación/compilación, dentro de check y browser | Genérica válida/no disponible; catálogo normal vacío. Vite compila 54 módulos. Artefactos finales `index-D13z2AtQ.js` y `index-DyT1_Y8O.css`. |
| `npm run start` | Proceso de `dist-server/server/main.js` iniciado con esa compilación antes de la ejecución final; escucha `http://127.0.0.1:3000`. Carga/valida APP antes de escuchar. |
| `npm run test:browser` | Salida 0; **31/31 recorridos Chrome**, 1,0 min, tres workers: los 22 anteriores y 9 de B05. El comando recompila el mismo código actual; se reinició el servidor tras la última corrección de UI. |
| Revisión visual | Inspeccionadas las cuatro capturas finales `test-results/B05-{390,1280}-{host,guest}.png`: orden móvil, columnas escritorio, numeración/observador, ficha/icono, foco visible y nombre provisional. Sin solapamientos ni desbordamiento observado; las aserciones de ancho también pasan. |
| Contenido y diff | Lista de genérica: los mismos dos JSON, huellas iguales APP/ASSETS y a B04; formato/contenido 1 y false. `git diff --check` sin errores de espacios. Sin nueva dependencia ni modificación del contrato de archivos. |

Las capturas y adjuntos de Playwright son artefactos locales ignorados; los recorridos y aserciones están versionados y permiten regenerarlos. No se han usado resultados históricos como sustituto de estas ejecuciones.

**Incidencias resueltas durante las ejecuciones:** la fixture de portada declaró inicialmente una ruta fuera de `imagenes/`; la carga estricta la rechazó y se corrigió la fixture, conservando validador/contrato. La primera ejecución de check exigió actualizar la aserción de claves HTTP para incluir `selectedDeck`. La prueba de caducidad cambió `check()` por `click()` porque el cierre retiraba el checkbox antes de la comprobación posterior de Playwright; conserva las aserciones de cierre y de ack antiguo inofensivo. Los selectores de B01 se acotaron al badge exacto y al estado del panel de copia porque los nuevos textos/avisos los hacían ambiguos; ninguna garantía anterior se eliminó. La revisión detectó que retirar el botón de reintento podía perder el foco: después de un error se conserva ese nodo, como «Actualizar catálogo» al recuperarse; la comprobación de foco añadida pasa. Tras esa corrección se repitieron check y navegador completos, con los resultados de la tabla.

### 12.3 Clases de evidencia temporal y de conexión

- **Tiempo controlado sin red:** `server/application/configuration.test.ts` usa puertos sustitutos y `ControlledTime`. Comprueba renovación/sin efecto, aviso al minuto 29, caducidad exacta al 30, reservas 29.999/30.000 ms, generaciones y callbacks atrasados; ambas prioridades de la carrera por plaza se ejecutan determinísticamente.
- **Conexiones reales con tiempo controlado:** `server/configurationSocket.test.ts` y `tests/browser/configuration.spec.ts` usan HTTP/Socket.IO por loopback. La primera usa código fuente; navegador importa los módulos de servidor compilados y sirve `dist`, con paquetes temporales preparados y cargados por B04. Sesiones independientes, dos sockets/pestañas del host, carrera casi simultánea con `Promise.all`, sincronización, reconexión y estados son reales. El avance de reservas/caducidad es controlado, no tiempo transcurrido real. Los interceptores de acks y las respuestas HTTP fallidas existen solo en pruebas; el timeout de confirmación de 5.000 ms sí se espera en el navegador.
- **Conexiones y margen reales, regresión B03 repetida:** `lifecycle.spec.ts` conserva reloj/planificador reales en su caso de reserva. En la última ejecución: detección de recuperación **2,7802 ms**, detección del segundo corte **7,3283 ms**, retirada a **30.004,0393 ms desde detección**, total **30.011,3676 ms desde corte local**, motivos `transport close`. Es un corte local de Chrome, no una avería física/WAN.

Detección Socket.IO conservada: `pingInterval=5.000 ms`, `pingTimeout=5.000 ms`; el margen de aplicación es detección+30.000 ms (también para anfitrión observador). No se promete retirada a los 30 segundos desde una pérdida física no detectada. La media hora, su aviso y las coincidencias de vencimiento se acreditan mediante tiempo controlado, no una espera real de 30 minutos.

### 12.4 Resultados por criterio

| Criterio | Resultado y evidencia ejecutada |
|---|---|
| B05-01 | **Superado.** Defaults/sin selección en casos y ejecución normal vacía a ambas anchuras (`decks.spec.ts`); nombres, copia, entradas y cierre en las regresiones. Ningún inicio ni selección automática. |
| B05-02 | **Superado.** Navegador retrasa GET, devuelve 500 y reintenta con una única fixture. Otros controles operan; borrador/foco se conservan durante el fallo y foco del botón tras recuperación. Lecturas no cambian revisión/expiración ni seleccionan. |
| B05-03 | **Superado.** Socket.IO y Chrome con host/invitado y dos pestañas: paquete disponible validado/versionado, ficha sincronizada en menos de 2 s desde aceptación; solo ocho campos públicos, sin cartas ni datos internos. También selección en el proceso real de `main` con fixture disponible (`decks.spec.ts`). |
| B05-04 | **Superado.** Seleccionar ninguna limpia id/versión/ficha y comunica. Los casos comparan revisión, emisiones y expiración: un efecto y repetición nula sin efecto. |
| B05-05 | **Superado.** Casos/adaptador/sockets: desconocida, genérica false, resumen sin definición o definición de otra versión y versión publicada distinta. Sin modificación/renovación. Navegador con versión no publicada vuelve al aceptado, explica error y conserva ficha/foco. |
| B05-06 | **Superado.** Casos con invitado y anfitrión de otra sala; integración real con invitado/ajeno: cinco controles denegados. Entrada durante configuración recibe settings aceptados. Credenciales de sesión, nunca nombre/código/payload de rol. |
| B05-07 | **Superado.** Matriz de todos los valores permitidos y aserciones de otros settings intactos; sockets rechazan coerciones, números ajenos, ids/versiones inválidos, claves extra y controles desconocidos. Revisión 0 y desempate true/false comprobados; un único selector de desempate. |
| B05-08 | **Superado.** Reducer/transporte y Chrome: acks retenidos/invertidos, error con otro campo pendiente y nombre provisional, error vinculado por aria y foco conservado. Timeout real de 5 s muestra incertidumbre; gesto offline no se emite ni espera conexión. |
| B05-09 | **Superado.** Casos prueban id/autoridad/nombre/presencia/ausencia conservados, ninguna salida, configuración/renombre/cierre como observador. Chrome prueba línea separada, contador, permisos visibles, renombre y retorno desde portada con misma participación. |
| B05-10 | **Superado.** Casos prueban ambos órdenes de la última plaza; integración compite por sockets reales casi simultáneos y admite exactamente uno. Chrome muestra cinco invitados, rechazo del host y reservas; retirada debida con callback atrasado precede vuelta al final de jugadores. |
| B05-11 | **Superado.** Dos pestañas reales: último nuevo válido por control; cambios distintos permanecen. Acks invertidos no retroceden vista ni borran otro pendiente; entrada/presencia no generan conflictos de revisión. |
| B05-12 | **Superado.** Casos/sockets: replay antes/después de cambios devuelve presente sin restaurar antiguo, igualdad nueva/no selección nula sin efecto, id con otros datos/tipo en espacio join/leave/configure da conflicto, rechazo repetido sigue siendo rechazo. Revisión, expiración y emisiones comparadas. |
| B05-13 | **Superado.** Chrome: recarga sin nuevas emisiones y reconexión real sin F5; conserva id/rol/selección/versión/valores. Otra pestaña mantiene presencia. Observador sin todas sus conexiones cierra por ausencia con reloj controlado; reglas y motivo B03 conservados. |
| B05-14 | **Superado.** Casos/sockets/Chrome: efectivo retira aviso/renueva, sin modificar ausencias. Lecturas, igualdad, rechazos, repetidos y recuperación no renuevan. Caducidad exacta, callbacks atrasados y empate con ausencia host cierran por inactividad una vez. Ack exitoso anterior no reabre UI. |
| B05-15 | **Superado para interfaz local.** Paquete con PNG real y otro null, alt, icono aria-hidden, ningún img nulo; fallo de descarga explica sin cambiar referencia aceptada. 390/1280, teclado nativo, labels/errores, foco y borradores: aserciones y cuatro capturas inspeccionadas. No es estudio de comprensión con usuarios ni prueba física móvil/lector de pantalla. |
| B05-16 | **Superado.** Check, 31 recorridos, escáner/casos negativos y revisión semántica de §12.5. B01/T01/B02/B03/B04 se vuelven a ejecutar. Sin cambios en dominio/validador/herramienta B04 ni en bytes de contenido aprobado. |

### 12.5 Mapa de responsabilidades y revisión

| Pieza revisada/modificada | Responsabilidad y límite observado |
|---|---|
| `application/room.ts` | Settings/selección juntos, booleano de participación, plazas/orden, revisión/renovación con tiempo explícito. No IO. Presencia/ausencias B03 permanecen independientes. |
| `application/roomUseCases.ts`, `ports.ts`, `roomError.ts` | `configure` cumple `ConfigureWaitingRoom`: vencimientos, autorización host, firmas canónicas por control, deduplicación/contexto, selección por puerto y publicación solo con efecto. Sección de decisión/escritura síncrona; sin espera entre admisión y cambio. |
| `application/deckCatalog.ts`, `roomView.ts` | Puerto `PublishedDeckVersions` y proyección de ocho campos reutilizada con ListDecks; vistas por destinatario, sin cartas ni credenciales. |
| `infrastructure/decks/catalog.ts` | Instantánea B04 conserva versión junto a definición validada; resolución exige resumen/definición correspondientes, no abre archivos al seleccionar. No decide permisos/plazas. |
| `infrastructure/configurationInput.ts`, `socketRooms.ts`, `http/expressApp.ts` | Forma/tipos/ids exactos, evento y traducción de errores. La sesión/origen/límites siguen vigentes; el transporte aplica preparación temporal antes de decodificar la nueva acción. No nueva mutación HTTP. |
| `composition/createApp.ts`, `main.ts` | Conexión explícita de puertos de resúmenes y versiones a la misma carga B04 antes de escuchar. Puertos separados permiten sustituir capacidades en pruebas sin importar concretos en aplicación. |
| `shared/contracts/room.ts` | DTO/change ampliados: settings, versión, ficha y isPlayer booleano; sin objetos de dominio. |
| `src/RoomConfiguration.tsx`, `useRoomConfiguration.ts`, `configurationState.ts`, `socket.ts` | Catálogo/ficha/controles y estado por intento/campo; vigente vs provisional; transporte volátil/no cola. No decide plazas/permisos oficiales ni plazos. |
| `src/screens.tsx`, `App.tsx`, `useRoomFlow.ts`, `style.css` | Lista numerada de isPlayer y observador aparte, ancho/orden/foco, aceptación de revisiones y borrador propio B02/B03. |
| Pruebas nuevas y adaptadas | Casos puros con sustitutos, sockets reales, reducer/transporte, navegador compilado con fixtures; aserciones anteriores solo amplían DTO y concretan textos/locators según B05. |
| README y organización | Arranque, recorrido, paquete vacío y prueba disponible aislada documentados. No nuevos paquetes npm ni cambios en comandos/root tools, dominio o contenido. |

Se revisaron los diffs y los consumidores de identidad/presencia/índices: `memberSessions` sigue incluyendo al observador; el repositorio conserva sus asociaciones y no usa número de jugadores como membresía. No hay dependencia circular por la ficha: el modelo usa proyección pura de aplicación/contratos y el catálogo concreto conoce el puerto. No se detectaron desviaciones de §7 ni contradicciones funcionales con las fuentes. Los controles nativos solo producen un change; el servidor mantiene la autorización aunque un navegador altere su payload.

### 12.6 Contenido e independencia

Huellas SHA-256 recalculadas, idénticas en ASSETS y APP y a B04:

| Archivo | SHA-256 |
|---|---|
| `generica/baraja.json` | `A86A5FE34573226694016F3DC49FD45CD966C4C1AFA677D8A0BB28C54FB05A06` |
| `generica/cartas.json` | `D3B22180D7ECFD991EEACA57AB664CACB566C198E20558104113D1A5DE60461C` |

El build normal sigue dando `{ "decks": [] }`. Las fixtures disponibles (`portada`, `sin-imagen`, `publicada`, `prueba`) y no disponibles viven solo en instalaciones temporales de pruebas; recursos reales decodificados y versión 7 coherente. No se activó ni editó genérica ni se publicó contenido sintético en APP/ASSETS. Las pruebas B04 de instalación independiente/guard de ASSETS y privacidad se repitieron en las puertas finales; el proceso compilado conserva catálogo, medios y selección aun si cambian sus archivos tras arrancar. B05 no añade lecturas/editoriales al consultar o configurar.

### 12.7 Límites y pendientes

Verificación local de B05-01–16, con los límites de entorno/tiempo de §12.3. Persistencia solo en memoria de un proceso: reiniciar pierde sala y configuración. Catálogo fijo durante ese proceso; cambios editoriales requieren nueva preparación/carga. No se ensayó WAN, HTTPS desplegado, dispositivo móvil físico, lector de pantalla ni comprensión con usuarios. Las garantías de cookie/origen de producción pasan sus regresiones, pero eso no acredita despliegue.

C09 se amplía únicamente con selección/quitar selección autorizadas, disponibilidad/definición/versión comprobadas y recuperación en espera; **validación al iniciar y uso en partida pendientes**. C10 acredita selector/ficha/icono, resumen autorizado y privacidad de B04; **cartas/manos/mesa/resultados y comprensión con usuarios pendientes**. No se marcan completos los criterios amplios.

Bots/dificultades, expulsión, inicio, Game/motor, reparto/turnos, puntuación, ejecución del desempate, equilibrio, CSV, edición/publicación editorial, GitHub y despliegue permanecen fuera. Al implementar inicio se deberá consumir la referencia exacta conservada, sin sustituir versión ni inferir una baraja predeterminada.

### 12.8 Entrega a coordinación

Código `73091f6`; documentos iniciales conservados en `ac8672b`; 197/197 pruebas, 31/31 recorridos, 41 módulos, genérica intacta/no disponible. No cambios funcionales adicionales a los acuerdos del autor. Resumen y mapa de esta sección disponibles para la conversación responsable; no se ha modificado silenciosamente su documento vivo.

| Fuente general responsable | Concreción que debe trasladarse |
|---|---|
| Aplicación §4 y casos de preparación | Cambios inmediatos por control; permitir quitar selección; ningún guardado global; error devuelve último aceptado y resultado desconocido se explica como tal. |
| Aplicación §§5–7 | Observador fuera de numeración/contador de jugadores, identidad/autoridad/presencia conservadas; capacidad incluye reservas, cinco invitados más observador; host vuelve al final si hay plaza. |
| Aplicación §4 e infraestructura §§5–7 | Último nuevo válido procesado por control; id deduplicado devuelve vigente, no antiguo; controles distintos no se sobrescriben y no se usa revisión esperada. |
| Infraestructura §§7–8 | Configuración efectiva aceptada se suma a actividad B03; igualdad/rechazo/replay/lectura/reconexión no renuevan; vencer precede configurar. Envío de configuración sin cola de reconexión. |
| Coordinación y seguimiento C09–C10 | Selección/configuración/ficha verificadas localmente con contenido de prueba; genérica sigue false, inicio/juego/presentación de cartas y despliegue pendientes. |

**Fecha de verificación local:** 02/10/2026. **Estado de cierre:** B05 verificado en el alcance acordado y entorno descrito; pendientes amplios y evidencia temporal delimitados arriba.
