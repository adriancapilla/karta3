# Bloque 02 — Entrada a una sala y espera sincronizada

**Estado:** recorrido y alcance acordados con el autor el 30/09/2026; especificación preparada para implementación. Implementación y verificación pendientes.

**Tipo y punto de partida:** incremento funcional sobre `main`, commit `24227ed`, con árbol de trabajo limpio al iniciar esta preparación. T01 está entregado, incluida la corrección de índices del 30/09/2026. Su evidencia de 22 pruebas de Vitest y 6 de navegador es histórica; no acredita este bloque.

## 1. Objetivo y referencias

Una persona crea una sala y otra entra con código y nombre desde una sesión independiente. Ambas ven la misma lista vigente sin recargar, conservan su identidad y pueden cambiar su propio nombre. El invitado puede salir voluntariamente; el anfitrión recibe el aviso y la plaza queda libre.

| Fuente | Decisiones que se aplican |
|---|---|
| [AGENTS.md](../../AGENTS.md) y [arquitectura](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) §§2–5, 7 | Responsabilidades, dependencias, composición y controles. |
| [Proceso SDD](PROCESO_SDD.md) y [plantilla](PLANTILLA_BLOQUE.md) | Acuerdo previo, aceptación, cambios y evidencia. |
| [Bloque 01](BLOQUE_01_CREACION_SALA.md), recorrido y E1–E7 | Código de seis cifras, nombre de 1–16 grafemas, sesión, edición propia, copia, recuperación y cierre confirmado. |
| [T01](BLOQUE_T01_REFACTOR_CREACION_SALA.md) §§3–6 y evidencia | Modelo de sala en aplicación, puertos, adaptadores, contratos públicos y comprobador arquitectónico existente. |
| [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) §§3, 5, 14–15 y 17 | Entrada directa, capacidad, orden, nombres repetidos, permisos, salida y consistencia. |
| [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md) §§2, 5–8, 14 | Socket.IO, sesión anónima, vistas autorizadas, memoria de un proceso y recuperación del estado vigente. |

Las reglas citadas siguen en sus fuentes. Este documento concreta el recorrido y el contrato del incremento; no redefine el juego.

## 2. Acuerdos y alcance

Decisiones confirmadas por el autor el **30/09/2026**:

| Decisión pendiente | Acuerdo |
|---|---|
| Entrada desde portada | Formulario visible de código y nombre junto a «Crear sala». |
| Presentación de la espera | Lista compacta y contador de ocupación; marcas «Tú» y «Anfitrión»; edición propia y salida. |
| Nombres repetidos | Sufijos visuales, por ejemplo «Ana (1)» y «Ana (2)», sin cambiar el nombre guardado. |
| Salida voluntaria | Confirmación, retorno a portada y aviso breve para quienes permanecen. |
| Salas simultáneas | Una sola sala activa por sesión. La portada recupera esa sala también para invitados; es necesario salir o cerrar antes de entrar en otra o crearla. |
| Expulsión | Se implementará en otro bloque; sigue siendo requisito del MVP. |

**Incluye:** entrada, identidad del invitado, lista y contador sincronizados, cambio del nombre propio, recuperación tras recarga, salida voluntaria, cierre del anfitrión comunicado al resto, errores y solicitudes repetidas.

**Queda para otros bloques:** expulsión, configuración editable, anfitrión observador, bots, inicio y juego; presencia con margen de 30 segundos; caducidad de la espera tras 30 minutos y su aviso. No se muestran controles de funciones aún no disponibles ni «Estoy listo».

**Limitación observable:** cerrar una pestaña o perder conexión no elimina a nadie ni libera su plaza; tampoco cierra la sala por ausencia del anfitrión. Una espera puede durar más de 30 minutos sin aviso ni cierre automático. La participación permanece hasta salir expresamente, hasta el cierre expreso del anfitrión o hasta perderse la memoria del servidor. Si se borran las credenciales, no se puede recuperar esa identidad. La lista representa inscripciones, no presencia en línea: no se muestran puntos de conexión ni cuentas atrás. Estos límites son temporales del incremento, no cambios del MVP.

El canal sí debe gestionar errores y recuperar una instantánea al reconectar. Esa recuperación técnica no aplica todavía la política de presencia, no expulsa ni programa sus plazos.

## 3. Recorrido e interfaz

### Portada y entrada

1. Al cargar, establecer o recuperar la sesión y consultar la sala activa antes de habilitar creación o entrada. Si existe, ir directamente a `/sala/:id` con el papel correspondiente. Otra pestaña del mismo navegador comparte participación; no crea otra persona.
2. Mostrar «Crear sala» y el formulario «Entrar a una sala», con «Código de sala», «Tu nombre» y botón «Entrar». Nombre inicialmente vacío y obligatorio. Mantener la creación sin pedir nombre, conforme al bloque 01.
3. Código como campo de texto con teclado numérico en móvil: conservar ceros iniciales al escribir, pegar, enviar, mostrar y copiar. Recortar espacios exteriores y exigir exactamente seis dígitos ASCII; no convertirlo en número, rellenar cifras ausentes ni eliminar caracteres interiores. Nombre: reutilizar íntegramente la validación del bloque 01.
4. `Enter` envía el formulario. Mientras se espera confirmación, mostrar «Entrando…» y bloquear envíos accidentales. No mostrar al invitado como incorporado antes de la aceptación del servidor. Ante rechazo, conservar código y nombre para corregirlos y situar el error junto al campo o formulario correspondiente.

### Espera compartida

- Código seleccionable y «Copiar código» disponibles para ambos papeles, con los mensajes ya definidos en el bloque 01. El anfitrión puede compartirlo desde ahora: sustituir el texto anterior que decía que la entrada aún no estaba disponible.
- Contador «2 de 5 participantes» y lista compacta, sin filas vacías. Invitados por orden de incorporación y anfitrión al final, conforme a aplicación §5.2. El anfitrión sigue jugando y ocupa una plaza: caben cuatro invitados.
- Marcar la fila propia como «Tú» y la del creador como «Anfitrión»; ambas marcas pueden coincidir. No cambiar el orden para colocar primero a quien mira. El invitado ve «Esperando a que el anfitrión inicie la partida». El anfitrión conserva «Esperando participantes» y, al alcanzar cinco, ve «Sala completa». El inicio aún no está disponible en este incremento.
- Ambos pueden editar solo su propio nombre con el recorrido del bloque 01. Guardarlo actualiza la lista de todos sin alterar identidad, orden o plaza. Las actualizaciones ajenas no borran un nombre que se esté escribiendo ni roban el foco.
- Sufijos: agrupar nombres guardados exactamente iguales; si hay varios, numerarlos `(1)`, `(2)`… según el orden de la lista. El sufijo se distingue visualmente del texto introducido y queda fuera del campo de edición y del límite de 16 grafemas. Se recalcula al entrar, renombrar o salir: puede cambiar o desaparecer, sin cambiar la identidad. Conservar siempre las marcas de papel y de fila propia. «Ana» y «ana» no forman el mismo grupo.

### Salida y cierre

- Solo el invitado tiene «Salir de la sala». Confirmación: «¿Salir de esta sala? Tu plaza quedará libre. Para volver tendrás que entrar de nuevo.» Ofrecer «Cancelar» y «Sí, salir». Cancelar no modifica nada. Tras aceptación, volver a portada con «Has salido de la sala»; no revocar la sesión anónima.
- Quienes permanecen, incluido el anfitrión, ven la nueva lista y contador y el aviso «[nombre mostrado] ha salido de la sala». Usar el nombre con su sufijo anterior a la salida para identificarlo. Mostrarlo durante cinco segundos como aviso accesible, sin mover el foco ni bloquear acciones; eliminarlo después. Las repeticiones de red no repiten el aviso. No se crea un historial de actividad.
- Una nueva entrada expresa de quien salió genera otra participación y ocupa el final de los invitados. Solo se acepta si queda plaza. Una recarga tras salir no reincorpora automáticamente.
- El anfitrión conserva «Cerrar sala» y su confirmación; añadir que las demás personas tendrán que salir. Tras aceptar, todas las pestañas participantes vuelven a portada; los invitados ven «El anfitrión ha cerrado la sala». No se transfiere la propiedad. Un código cerrado no admite entradas.
- Si un aviso de cierre se pierde por una interrupción, la recuperación posterior puede mostrar «La sala ya no está disponible»; no debe recuperar una lista obsoleta como activa. Un fallo sin confirmación muestra incertidumbre y permite reintentar, sin anunciar una salida o cierre inexistentes.

**Móvil y escritorio:** a 390×844, creación, entrada y campos apilados, botones accesibles y lista sin desbordamiento; a 1280×800, creación y entrada en dos zonas contiguas y espera en un panel de anchura legible. Mismos datos, orden y permisos. Formularios etiquetados, errores asociados, avisos anunciados y diálogos utilizables con teclado; al cerrar un diálogo se devuelve el foco a un lugar lógico.

## 4. Identidad, permisos y consistencia

| Acción | Anfitrión | Invitado inscrito | Sesión no inscrita |
|---|---|---|---|
| Leer/suscribirse a la espera | Sí | Sí | Solo después de una entrada aceptada; conocer el ID no basta. |
| Cambiar nombre | Solo el propio | Solo el propio | No |
| Salir como invitado | No; utiliza cierre | Solo su participación | No |
| Cerrar sala | Sí | No | No |
| Expulsar, configurar, iniciar | Fuera de este bloque | No | No |

La cookie sigue siendo `karta3_session`, con las propiedades de T01. Resolver la misma identidad interna en HTTP y Socket.IO; no aceptar una identidad, papel o destinatario declarado por el navegador. Los IDs públicos sirven de contexto, nunca de credencial.

- **Una sala por sesión:** creación, entrada y recuperación usan la misma asociación, tanto para anfitrión como para invitado. Repetir entrada en la sala propia devuelve la participación existente, incluso si ya hay cinco; no cambia el nombre ni cuenta como incorporación. Intentar otra sala se rechaza y permite volver a la actual. Un invitado que intenta crear otra recibe ese mismo rechazo; no se transforma en anfitrión.
- **Consistencia:** comprobar y modificar sala, participación e índices de forma síncrona, sin `await` en la sección de decisión y escritura del proceso único. Dos entradas para la última plaza aceptan solo una. Crear y entrar simultáneamente con una sesión solo pueden dejar una asociación activa. Una entrada concurrente con cierre se rechaza o queda seguida por el cierre, sin participantes huérfanos.
- **Repeticiones:** entrada y salida incluyen un `requestId` opaco, reutilizado al reintentar una operación sin respuesta. Mismo ID con contenido diferente se rechaza. Una entrada ya aceptada devuelve la vista vigente mientras siga activa esa participación; si terminó, rechaza la repetición sin reincorporarla. La salida lleva también el ID de participación: un mensaje antiguo no puede retirar una incorporación posterior.
- **Resultado perdido:** deduplicar por sesión y solicitud; conservar el mínimo resultado/contexto necesario en memoria mientras esa sesión siga siendo válida, incluso después del cierre de la sala. No reutilizar una repetición antigua contra otra sala con el mismo código. Se permite devolver el resultado ya conocido o un rechazo estable cuando la participación terminó. No emitir un segundo cambio por reintento.
- **Versiones:** la vista tiene una revisión creciente por sala; entrada, cambio efectivo de nombre, salida y cierre la avanzan una vez. Lecturas, suscripciones y repeticiones sin efecto no la avanzan. Una respuesta o aviso antiguo no sustituye una vista más reciente ni reabre una participación terminada. Cada pestaña compara también sala e identidad de participación.

## 5. Contrato mínimo de implementación

Se mantiene HTTP para las operaciones existentes y se incorporan **Socket.IO para entrada, salida y sincronización**, conforme a infraestructura §5. No se añade sondeo periódico como sustituto de la actualización en tiempo real.

### HTTP y vista pública

- Conservar rutas, cuerpos, estados y errores de T01 para el anfitrión y las sesiones ajenas no inscritas. `POST /api/rooms` sigue respondiendo 201 al crear o recuperar una sala propia; `DELETE /api/rooms/:id` sigue respondiendo 204 y un segundo cierre, 404.
- Extender `GET /api/rooms/current` a la participación activa de cualquier papel. Extender `GET /api/rooms/:id` a miembros reconocidos y `PATCH /api/rooms/:id/name` al nombre del solicitante reconocido. El cuerpo sigue siendo solo `{ name }`; no admite un participante objetivo. Una sesión no inscrita conserva los rechazos anteriores.
- Añadir `ALREADY_IN_ROOM` / 409 al intento de crear siendo invitado. Mensaje: «Ya estás en una sala. Sal de ella antes de crear otra o entrar en una distinta.» La portada ofrece volver a esa espera.
- Ampliar el contrato compartido `RoomView`, conservando `id`, `code`, `status`, `settings` y `participant`. **`participant` identifica a quien recibe la vista**: para el anfitrión conserva la semántica anterior; para el invitado tiene su ID, nombre y papel `GUEST`. Añadir `participants` en el orden acordado y `revision`. Cada participante público contiene `id`, `name`, `role: HOST | GUEST` e `isPlayer: true`; el contador se deriva de la lista. `settings` conserva los valores del bloque 01, sin edición.
- Las vistas se proyectan por destinatario. No devolver credenciales, IDs internos de sesión, mapas, registros de deduplicación ni entidades serializadas completas. Una modificación del objeto devuelto no puede cambiar el modelo.

### Mensajes de tiempo real

Primero establecer la cookie mediante la consulta HTTP vigente; después conectar Socket.IO con esa sesión. Verificar origen y credencial antes de autorizar mensajes o suscripciones. El socket no constituye por sí mismo una nueva identidad. Validar forma, tamaño y campos admitidos en el adaptador, y permisos/invariantes en aplicación.

| Dirección y mensaje | Datos mínimos | Respuesta o efecto |
|---|---|---|
| Cliente → `room:resume` | `{}` | Confirmación con la vista propia actual o `null`; suscribir a la participación vigente antes de entregar la instantánea. Se usa al conectar/reconectar. No permite consultar una sala arbitraria. |
| Cliente → `room:join` | `{ requestId, code, name }` | Comprobar espera y plaza, incorporar o recuperar, suscribir y confirmar con la vista propia. Emitir vistas vigentes a todos los miembros. |
| Cliente → `room:leave` | `{ requestId, roomId, participantId }` | Validar que es la participación invitada de esa sesión, eliminarla, liberar índices y confirmar. Notificar a todas sus pestañas y actualizar a quienes permanecen. |
| Servidor → `room:state` | `{ room, change? }` | Vista por destinatario con revisión. En una salida, `change` identifica el cambio por sala/revisión e incluye el ID y nombre mostrado del participante que salió. Sirve para el aviso sin duplicarlo. |
| Servidor → `room:left` | `{ roomId, participantId }` | Retirar la espera de todas las pestañas de la sesión que salió, revocar sus suscripciones y volver a portada. No afecta a otra participación posterior. |
| Servidor → `room:closed` | `{ roomId, revision, reason: 'HOST_CLOSED' }` | Notificar a quienes estaban autorizados antes del cierre y retirar sus suscripciones. |

Confirmaciones: `{ ok: true, room }` para recuperar/entrar; `{ ok: true, roomId, participantId }` para salir; `{ ok: false, error: { code, message } }` para rechazos. `room` puede ser `null` solo al recuperar. Los nombres de tipos internos son libres; los mensajes anteriores forman el contrato del bloque.

La aplicación comunica cambios aceptados también cuando proceden de HTTP: renombrar o cerrar debe actualizar a todos. Todas las pestañas conectadas de una sesión reciben el cambio de su participación. Suscribir y obtener instantánea debe evitar un intervalo que pierda una entrada; después de una interrupción se recupera la vista completa, sin depender del historial de eventos. Una sesión que salió deja de recibir vistas posteriores. No se difunde una misma vista personalizada a toda la sala.

| Fallo de entrada/salida | Código y presentación |
|---|---|
| Formato de código o nombre inválido | `INVALID_INPUT`; error del campo, sin cambio de estado. |
| Código inexistente o sala cerrada | `ROOM_NOT_AVAILABLE`: «No hay una sala disponible con ese código. Compruébalo.» No se necesita distinguir estos dos casos ni conservar un catálogo de códigos cerrados. |
| Cinco plazas ocupadas | `ROOM_FULL`: «La sala está llena. Puedes volver a intentarlo cuando quede una plaza.» |
| Otra sala activa | `ALREADY_IN_ROOM`; mensaje anterior y acceso a la propia. |
| Identidad ausente o permiso insuficiente | `SESSION_REQUIRED` o `FORBIDDEN`, conforme al significado de T01. |
| Mismo `requestId` con otra operación/datos | `REQUEST_CONFLICT`; no aplicar el segundo contenido. |
| Reintento referido a participación terminada | `PARTICIPATION_ENDED`: «Esa participación ya terminó. Para volver, entra de nuevo.» No eliminar una participación nueva. |
| Sin confirmación o error técnico | Aviso comprensible y reintento; conservar el ID de solicitud pendiente. No suponer aceptación, volver a incorporar ni liberar localmente una plaza. |

Comprobar pertenencia existente antes del límite de capacidad; permisos antes de validar una modificación de otro participante. El implementador fijará un tiempo técnico de espera de confirmación y lo registrará; ese tiempo solo presenta incertidumbre y nunca aplica una salida automática.

## 6. Responsabilidades y dependencias

| Responsabilidad | Ubicación | Dependencias y comprobación |
|---|---|---|
| Participantes, capacidad, orden, nombres, transiciones y revisión | Modelo `Room` en `server/application/` | Puro, con IDs suministrados; sin HTTP, Socket.IO, reloj real o mapas de transporte. Pruebas de entrada/salida, límites y conservación de identidad. |
| Entrar, recuperar, renombrar, salir, cerrar, autorizar y deduplicar | Casos de uso en aplicación | Modelo y puertos propios; sin adaptadores concretos. Pruebas con sustitutos, incluidos conflictos de sesión y solicitudes antiguas. |
| Consultar sala por código/ID y asociación por sesión; guardar; recordar solicitudes; comunicar cambios autorizados | Puertos de aplicación | Ampliar solo capacidades necesarias. Contratos puros; no exponer sockets ni respuestas HTTP. El caso de uso decide destinatarios y proyecta vistas. |
| Índices de código/miembros y resultados mínimos de solicitudes | Adaptadores en memoria | Implementan puertos; no deciden permisos ni reglas de capacidad. Probar altas/bajas/cierre sin asociaciones residuales y conservar la regresión de identidad de T01. |
| Cookie, validación de mensajes, conexiones, suscripciones, confirmaciones y envío | Adaptadores HTTP y Socket.IO | Aplicación y contratos públicos; no modifican participantes directamente. Integración con sesiones independientes, origen inválido y destinatarios correctos. |
| Unir HTTP, sockets, sesiones y repositorios del mismo proceso | `server/composition/` y arranque | Único punto que selecciona adaptadores. Ambos transportes usan las mismas instancias. Verificar arranque compilado y desarrollo con proxy de `/socket.io`. |
| Tipos públicos; transporte cliente; coordinación y presentación | `shared/contracts/` y `src/` | Contratos sin lógica ni secretos; cliente sin imports de servidor. Coordinar revisiones, borradores y avisos fuera de componentes de presentación. Pruebas de dos navegadores. |

El dominio del juego no cambia. Mantener el grafo de dependencias de AGENTS, incluidos tipos, sin ciclos. Pasar `npm run check:architecture` y revisar semánticamente que las reglas de sala no se hayan trasladado a los manejadores de sockets.

## 7. Ejemplos y criterios de aceptación

Cada fila es un criterio pendiente de comprobar. **A** es el navegador del anfitrión; **B**, otro navegador/perfil con cookies independientes. Una segunda pestaña del mismo perfil no cuenta como B. Cuando se requiere mayor capacidad, usar contextos adicionales C–F.

| Caso | Dado / cuando | Resultado exigido |
|---|---|---|
| B02-01 | A crea; B introduce su código y «Ana», y pulsa Entrar. | Ambos ven dos personas y contador 2/5 sin recargar, con invitada primero y anfitrión al final; cada uno tiene su marca «Tú» y permisos propios. |
| B02-02 | Sala real creada con generador de prueba `000042`; B pega ese código y entra. | Se conservan las seis cifras en servidor, formulario, vista y copia. Un código de cinco cifras o con letras no se completa ni admite. |
| B02-03 | A y B cambian su nombre a «Ana»; B edita otra vez. | Ambos ven los mismos sufijos y su fila propia. Editar conserva ID/plaza/orden; los sufijos no aparecen en el campo ni consumen el límite. Cambiar a nombre único elimina la colisión. |
| B02-04 | B recarga, abre otra pestaña o vuelve a `/`. | Recupera la misma participación y nombre, sin tercer participante ni nuevo aviso de entrada; A no necesita recargar. B tampoco puede crear o entrar en otra sala sin salir. |
| B02-05 | B cambia su nombre; intenta vacío, 17 grafemas y luego 16 válidos. A mantiene un borrador sin guardar. | Rechazos sin mutación; el válido se actualiza en ambos navegadores y conserva identidad. La actualización no borra el borrador de A. |
| B02-06 | B pulsa Salir, cancela y después confirma. | Cancelar mantiene 2/5. Confirmar devuelve B a portada, deja A con 1/5 y un solo aviso de salida; libera la plaza y B deja de recibir cambios. |
| B02-07 | Tras salir, B vuelve expresamente con el código, habiendo entrado C entre tanto. | Nueva identidad de participación, después de C y antes del anfitrión; F5 antes de esa entrada no reincorpora. Un reintento de la salida antigua no elimina a B de nuevo. |
| B02-08 | A y cuatro invitados ocupan cinco plazas; F intenta entrar. También se prueban dos entradas simultáneas para una única plaza. | F recibe sala llena sin aparecer en listas; en la carrera solo uno entra y nunca hay seis. Una salida permite una entrada posterior. |
| B02-09 | B envía código válido inexistente o el de una sala cerrada; después corrige el campo. | Error comprensible, conserva los datos, no crea participación y permite corregir/reintentar. |
| B02-10 | Se repiten entrada y salida, se pierde una confirmación y se reintenta; una misma solicitud reaparece después de salir o cerrar. | Un solo efecto y aviso; recuperar entrada ya activa funciona incluso con sala llena. La repetición antigua no crea una nueva participación ni actúa sobre otro código reutilizado. |
| B02-11 | B intenta cerrar o modificar a A; C no inscrito intenta leer/suscribirse; otra sesión usa el ID público de B. | Rechazos por servidor sin alterar estado ni transmitir vistas privadas. B sí puede leer y renombrarse tras entrar. Salir como invitado no permite al anfitrión dejar la sala abierta sin propietario. |
| B02-12 | A cancela y luego confirma Cerrar con B dentro; se prueba una entrada concurrente. | Cancelar no afecta a B; confirmar devuelve ambos a portada con aviso. La entrada se rechaza o queda seguida del cierre; no quedan miembros ni índices recuperables. |
| B02-13 | B interrumpe brevemente el canal; A cambia su nombre y B recupera conexión. Se entrega además una vista anterior con retraso. | B obtiene la instantánea actual sin F5; no retrocede de revisión ni duplica participación. No se libera su plaza ni se aplica un plazo de presencia. |
| B02-14 | B cierra la pestaña sin salir; se inspecciona el estado y se comprueba ausencia de caducidad en este bloque. | A sigue viendo la inscripción ocupada, sin anunciar presencia en línea. No hay eliminación por 30 segundos ni cierre/aviso de 30 minutos. Registrar esta limitación sin presentarla como aceptación del MVP completo. |
| B02-15 | Se pierde la memoria del servidor y ambos recuperan la conexión o recargan. | No se finge recuperar la sala; vuelven a portada con aviso y sesión utilizable. Una vista vieja no restaura identidad ni lista. |
| B02-16 | Recorridos anteriores en móvil/escritorio, con teclado y errores de red. | Formulario, lista, edición, avisos y diálogos utilizables; sin desbordamiento ni éxitos falsos. E1–E7 del bloque 01 y las garantías de T01 siguen cubiertos. |

En conexión local sana, comprobar que lista y contador de ambas sesiones convergen **en un máximo de dos segundos desde la aceptación**, sin recarga ni acción manual del receptor. Es un umbral de aceptación local, no una garantía para cualquier red. Las pruebas esperan un resultado observable, sin pausas fijas usadas como prueba de sincronización.

## 8. Dependencias y plan de verificación

**Dependencias:** bloque 01 y T01 entregados; incorporar paquetes cliente/servidor de Socket.IO con versiones compatibles y fijadas en el archivo de dependencias; conectar ambos transportes al mismo servidor HTTP y sesión. Adaptar el proxy de desarrollo, construcción y arranque existentes. No requiere barajas, base de datos, despliegue, configuración de partida ni temporizadores de presencia.

El hilo de implementación ejecutará primero la base vigente y después las comprobaciones del cambio:

- Conservar los casos de `server/application/room.test.ts`, `roomUseCases.test.ts`, `server/infrastructure/memoryRoomRepository.test.ts`, `server/app.test.ts`, `tools/check-architecture.test.mjs` y `tests/browser/room.spec.ts`. Adaptar montaje y vistas extendidas sin eliminar sus garantías. Mantener las regresiones de índices de propietario/código.
- Añadir pruebas puras de capacidad, orden, nombres, salida y permisos; casos de uso con puertos sustitutos para una sala por sesión, repeticiones y carreras. Verificar que un rechazo no deja índices ni participantes parciales.
- Integración real HTTP + Socket.IO: cookie compartida entre transportes, dos sesiones, instantánea inicial, suscripciones autorizadas, cambios por HTTP difundidos, pérdida de confirmación, reentrada y cierre. Cubrir las solicitudes antiguas y los errores sin confiar solo en botones deshabilitados.
- Navegador: A y B con contextos aislados, sin simular los eventos de entrada/lista/salida del recorrido principal. Ejecutar anfitrión escritorio/invitado móvil y el recorrido inverso; añadir C–F para capacidad. Usar la misma sesión en dos pestañas en el caso específico de recuperación. Para fallos y desorden de mensajes se permiten pruebas controladas, identificadas como tales.
- Revisar vistas y mensajes para comprobar ausencia de sesiones/credenciales y que quien salió no recibe cambios posteriores. Comprobar reglas tanto por HTTP como por el canal de tiempo real.
- Ejecutar **`npm run check`**, que incluye el control de arquitectura, y **`npm run test:browser`** contra una instancia recién compilada y arrancada con `npm run start`. Probar también que el proxy de desarrollo permite el canal. Registrar versión, comandos, resultados y límites; inspeccionar los dos tamaños cuando se cierre el bloque.

Las pruebas de ciclo de vida de 30 segundos/30 minutos siguen pendientes para su bloque. B02-14 documenta la limitación actual; no obliga a mantenerla cuando se implemente esa evolución.

## 9. Autonomía, cambios y cierre

El implementador puede decidir nombres de archivos y tipos internos, agrupación de casos de uso, detalles de almacenamiento/deduplicación, componentes, estilos y tiempo de confirmación del canal. Debe conservar contratos y comportamiento anteriores, atomicidad y dirección de dependencias. No necesita un contenedor de inyección, un motor de eventos genérico ni nuevas capas del juego. Si surge una contradicción real, citar primero la fuente y consultar antes de cambiar una decisión funcional o arquitectónica.

No quedan preguntas funcionales que bloqueen este recorrido. La distribución de mensajes, vista extendida, sufijos, revisión y comprobaciones de este documento concretan técnicamente los acuerdos; los ajustes internos compatibles se registran al implementar.

| Fecha | Cambio explícito respecto al punto de partida | Criterios/fuentes afectados |
|---|---|---|
| 30/09/2026 | Extender recuperación y una sala activa por sesión a invitados; admitir lectura y cambio de nombre propio tras entrar; ampliar vista con lista/revisión y papel invitado. | E3/E5 del bloque 01 conservan su garantía de identidad; se amplían los miembros autorizados. T01 §3 describe el contrato previo y su evidencia permanece histórica. |
| 30/09/2026 | Aprobar presentación, nombres repetidos y salida; posponer expulsión y ciclo de vida. | B02-01–16. Aplicación §§5 y 18 debe recibir los acuerdos de presentación y sesión mediante coordinación; sus reglas de expulsión y plazos permanecen vigentes para el MVP. |

**Cambio de código:** pendiente. **Pruebas del bloque 02:** pendientes. **Comprobaciones arquitectónicas de su implementación:** pendientes. **Fecha de verificación:** pendiente.

La preparación ha leído fuentes, código y pruebas; no ha implementado funciones ni ejecutado pruebas de la aplicación. Para cerrar, registrar resultados de B02-01–16, regresiones E1–E7/T01, commit revisado, comandos, evidencia de dos sesiones y límites. El resumen a coordinación debe incluir este archivo, acuerdos de interfaz/sesión, extensión de permisos/contrato, dependencias y los bloques pendientes; coordinación mantiene el documento general.
