# Bloque 05 — Selección de baraja y configuración de la sala

**Estado:** alcance y decisiones funcionales acordados con el autor el 02/10/2026; especificación preparada para implementación. No implementado ni verificado.

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

**Cambio de código B05:** pendiente. **Pruebas de producto durante esta preparación:** ninguna, por indicación del autor. **Comprobaciones de implementación/arquitectura:** pendientes. **Fecha de verificación:** pendiente.

**Revisión documental, 02/10/2026:** referencias locales existentes, ejemplo JSON analizable y 16 criterios distintos. Las huellas de los dos archivos de la genérica coinciden entre ASSETS y APP y con las registradas en B04; formato/contenido 1 y disponibilidad false conservados. Esta lectura y comparación no son una nueva validación del paquete por la aplicación ni una prueba de B05.

**Entrega a coordinación/implementación:** este documento, punto de partida y decisiones cerradas, B05-01–16, ampliaciones de vista/evento/puerto, evidencia histórica separada y pendientes C09–C10. El cierre futuro registrará código revisado, resultados nuevos, limitaciones y fuentes generales alineadas. La partida, su inicio y presentación permanecen para otros bloques.

Encargo listo para copiar: [prompt de implementación B05](PROMPT_IMPLEMENTACION_BLOQUE_05.md).

## 11. Base ejecutada antes de implementar — 02/10/2026

Rama `feat/b04-carga-barajas`, HEAD `7d2536f9c5ad1956fc218146e90c1fd6937a5a71`. Se conservan los cambios locales de proceso y los dos documentos de B05. No se detectaron contradicciones funcionales en las fuentes consultadas.

`npm run check` ejecutado sobre esa base: salida 0, tipos y lint correctos, 172/172 pruebas Vitest en 17 archivos, control de 37 módulos sin infracciones/ciclos y compilación completa. La preparación conserva la genérica válida/no disponible y el catálogo vacío. Entorno: Windows, Node 24.13.0, npm 11.6.2. Esta ejecución acredita la base B04; no acredita B05 ni sustituye las pruebas finales de navegador.
