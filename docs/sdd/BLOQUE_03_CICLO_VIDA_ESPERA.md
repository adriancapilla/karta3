# Bloque 03 — Ciclo de vida de la espera

**Estado:** verificado localmente el 30/09/2026 para B03-01–16 y las regresiones previas. Las clases de evidencia temporal y los límites constan en §10.

**Punto de partida:** `main`, commit `17a5efc`, árbol de trabajo limpio al preparar este bloque. Bloques 01, T01 y 02 entregados y comprobados localmente. La evidencia del bloque 02 —38 pruebas Vitest y 12 de navegador— es histórica; no acredita este incremento.

## 1. Objetivo y fuentes

Completar la reserva de identidad, plaza y orden durante una ausencia breve y cerrar las esperas abandonadas. Aplicar los plazos desde el servidor y comunicar recuperación, retirada y cierre con las mismas vistas autorizadas y recorridos del bloque 02.

| Referencia | Decisiones que gobiernan el bloque |
|---|---|
| [AGENTS.md](../../AGENTS.md), [arquitectura](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) §§2–5, 7 | Responsabilidades, dependencias, memoria de un proceso y comprobaciones. |
| [Proceso SDD](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) | Acuerdos, criterios, cambios y evidencia. |
| [Bloque 01](BLOQUE_01_CREACION_SALA.md), E1–E7; [T01](BLOQUE_T01_REFACTOR_CREACION_SALA.md), separación y regresiones | Identidad, código, nombre, HTTP, modelo de sala en aplicación y permisos. |
| [Bloque 02](BLOQUE_02_ENTRADA_SALA.md), §§3–8 y evidencia | Una sala por sesión, varias pestañas, lista ordenada, sincronización, revisiones, deduplicación y salida explícita. |
| [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) §5.4, §14 (`ResumeParticipation`, `ExpireWaitingPresence`, `CleanupExpiredRoom`), §§15 y 17 | Reserva de 30 segundos, retirada/cierre y espera de 30 minutos sin actividad. |
| [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md) §§5–8 | Sesión, detección del servidor, reloj, procesamiento coherente y aviso al minuto 29. |

No cambia el dominio del juego. **Quedan fuera:** configuración, expulsión, bots, inicio, partida, resultados y despliegue. La limpieza de este bloque se refiere a esperas y sus recursos; no implementa el ciclo de vida de partidas ni una política general nueva de cuentas o sesiones.

## 2. Decisiones cerradas en este hilo

Los plazos generales ya estaban acordados en las fuentes. El autor confirmó estas concreciones el **30/09/2026**:

| Cuestión abierta | Decisión |
|---|---|
| Presentar ausencia y recuperación | Marca «Reconectando» en la fila, sin segundos restantes; aviso de recuperación durante cinco segundos. |
| Aviso de caducidad | Franja persistente con cuenta atrás sobre la lista, sin bloquear la pantalla. |
| Presentar cierre automático | Retorno directo a portada con su motivo; sin pedir confirmación del cierre automático. |
| Varias pestañas | Basta una conexión autorizada de la sesión para mantener presencia. El margen empieza al perder la última. Salida/cierre explícitos afectan inmediatamente a todas. |
| Actividad válida | Creación, incorporación nueva, salida voluntaria y cambio efectivo de nombre. La retirada automática no renueva. |
| Borde del plazo | Recuperación registrada antes del vencimiento; en el instante exacto prevalece el vencimiento. Reconectar no prolonga la caducidad general. |
| Primera conexión del anfitrión | Si al crear por HTTP no existe una conexión autorizada de su sesión, dispone de 30 segundos desde la creación para establecerla; después se cierra. |

Una **pestaña abierta** mantiene presencia solo si su conexión autorizada llega al servidor. El servidor no se basa en visibilidad, foco, actividad del ratón o en una declaración del navegador. Si todas las pestañas pierden la red, se aplica el margen aunque sigan abiertas.

## 3. Comportamiento y tiempos

### Presencia de la sesión

- Cada participación conserva su identidad, nombre, plaza y posición. Se cuenta como conectada mientras exista al menos una conexión Socket.IO autenticada de su sesión. Conectar otra pestaña no incorpora a otra persona ni renueva los 30 minutos.
- Al detectar la pérdida de la última conexión, registrar una sola ausencia con vencimiento **detección + 30 segundos**. Mantener la participación y contar su plaza entre las cinco. Desconexiones duplicadas o eventos de sockets antiguos no empiezan otro margen.
- Al registrar una conexión válida **antes** del vencimiento, cancelar esa ausencia y recuperar exactamente la misma participación. Una desconexión posterior empieza un margen nuevo; no se reutiliza el temporizador anterior. Una recarga tiene el mismo tratamiento.
- Si no vuelve a tiempo un invitado, retirarlo y liberar su asociación y plaza. La misma sesión podrá entrar de nuevo expresamente con código/nombre y otra solicitud: será una participación nueva, al final de los invitados y solo si hay sitio. Recuperar o repetir una entrada antigua no lo reincorpora.
- Si vence el margen del anfitrión, cerrar la sala y avisar al resto; no transferir el control. El resto no puede prolongar ese margen con cambios de nombre ni entradas.
- Al crear por HTTP sin conexión autorizada previa del anfitrión, registrar la reserva inicial de 30 segundos desde la creación. Si ya había una conexión autenticada, crear con presencia conectada. No exigir una ruta nueva ni cambiar el éxito HTTP de creación.
- Consultar por HTTP, incluso con cookie válida, no sustituye una conexión de presencia ni cancela la ausencia. HTTP conserva la recuperación de la vista permitida; al registrar Socket.IO se decide la recuperación de presencia. Las operaciones explícitas autorizadas mantienen efecto inmediato mientras la sala/participación no hayan vencido.

El margen comienza en la **detección del servidor**, no al dibujar un aviso en el navegador ni al cerrar físicamente una pestaña. La detección de una pérdida de red puede tardar. El implementador fijará y registrará los parámetros reales de detección del transporte y comprobará su retraso; no prometerá retirada a los 30 segundos exactos desde una pérdida física no detectada.

### Inactividad de la sala

Al crear, fijar vencimiento de espera en **creación + 30 minutos**. Una actividad válida lo reemplaza por **aceptación + 30 minutos** y programa el aviso para un minuto antes. Las personas pueden estar conectadas todo ese tiempo y aun así caducar la sala.

| Hecho | ¿Renueva la espera? |
|---|---|
| Crear una sala nueva | Sí; establece el plazo inicial. |
| Incorporar realmente a otro participante | Sí. |
| Salida voluntaria aceptada de un invitado | Sí, para quienes permanecen. |
| Cambio aceptado a un nombre diferente, después de normalizar | Sí. |
| Recuperar la sala existente con creación/entrada repetida | No. |
| Guardar el mismo nombre; solicitud rechazada o duplicada | No. |
| Conectar, perder conexión, recuperar, recargar o abrir otra pestaña | No. |
| Leer vistas, copiar código, escribir sin guardar, abrir/cancelar un diálogo | No. |
| Heartbeats, mensajes vacíos o intentos de mantener la conexión | No. |
| Retirar por vencimiento de ausencia; mostrar el aviso | No. |
| Cierre explícito o automático | Termina la espera; no establece otro plazo. |

Al llegar al minuto 29, activar un aviso único para el vencimiento vigente. Una actividad válida posterior elimina ese aviso y reemplaza ambos temporizadores. Al minuto 30, cerrar con independencia del número de conexiones y de las reservas de presencia. No añadir «Seguir esperando» como renovación sin un cambio válido de preparación.

### Cercanía, repeticiones y temporizadores antiguos

La hora válida es la del procesamiento en el servidor. Registrar una recuperación a los 29.999 ms del margen conserva la participación; a los 30.000 ms o después, no. Si la espera general ya venció, tampoco se recupera, aunque aún quedara reserva de presencia. Un cambio de nombre recibido tras la caducidad no rescata la sala.

Antes de devolver vistas, recuperar o ejecutar una acción, aplicar los vencimientos que ya correspondan, aunque su callback se haya retrasado. Procesar los vencimientos aplicables en orden temporal; si la caducidad general y la ausencia del anfitrión coinciden exactamente, cerrar una sola vez con motivo de inactividad. No devolver una espera vencida como activa.

Cada aviso incluye contexto de sala y generación de plazo; cada ausencia, además, ID de participación y generación propia. Un callback revalida contexto, tiempo y ausencia de recuperación antes de actuar. Renombrar o cambiar otra presencia no invalida por accidente el margen de alguien. Una salida/cierre explícitos cancelan sus pendientes. Un temporizador viejo no puede afectar a una participación nueva ni a una sala que reutilice el código.

## 4. Presentación en móvil y escritorio

- **Lista:** añadir «Reconectando» junto a las marcas existentes, manteniendo nombre, sufijos, posición y contador. Sin cuenta atrás de reserva. Si era anfitrión, mantener también «Anfitrión». Al recuperar, quitar la marca y mostrar «[nombre mostrado] ha recuperado la conexión» durante cinco segundos, una sola vez por recuperación efectiva. La conexión inicial no se anuncia como recuperación de una ausencia anterior.
- **Pantalla que pierde conexión:** conservar la última lista con «Conexión interrumpida. Intentando recuperarla…». No asegurar que la plaza sigue reservada por lo que calcule el navegador. Actualizar con una instantánea autorizada al recuperar. Mantener los borradores, foco y garantías contra éxitos falsos del bloque 02.
- **Invitado retirado:** quienes permanecen ven lista y contador actualizados y «[nombre mostrado] no recuperó la conexión; su plaza ha quedado libre» durante cinco segundos. Usar el nombre con el sufijo anterior a la retirada. Al volver el afectado, ir a portada con «Tu plaza se liberó porque no recuperaste la conexión a tiempo. Puedes entrar de nuevo si hay sitio». No confundir la retirada automática con una salida voluntaria.
- **Aviso de caducidad:** franja sobre la lista, persistente y accesible: «La sala se cerrará por inactividad en 01:00», con cuenta atrás hasta el vencimiento del servidor. Aparece para anfitrión e invitados y para quien recupere durante ese último minuto. Una actividad válida la elimina para todos. No bloquea campos ni exige aceptar un diálogo. No anunciar cada segundo a lectores de pantalla.
- **Cierre:** ir a portada con «La sala se cerró por inactividad» o «La sala se cerró porque el anfitrión no recuperó la conexión». El cierre explícito conserva su confirmación y mensajes anteriores. La sesión anónima sigue utilizable para crear o entrar en otra sala.
- **Varios tamaños:** en móvil 390×844, permitir segunda línea para la marca y envolver el aviso sin desbordar; en escritorio 1280×800, integrar la marca con las actuales y el aviso como franja horizontal. Misma información y permisos; no mover foco por actualizaciones remotas.

La cuenta atrás es una estimación de presentación: usa vencimiento y referencia temporal del servidor, no la hora del navegador como autoridad. Llegar visualmente a cero no basta para inventar el cierre; el cliente obtiene la confirmación o resincroniza. Si no hay red, conserva el aviso de conexión y espera el resultado del servidor.

## 5. Contratos y responsabilidades para implementar

Conservar las operaciones HTTP y Socket.IO del bloque 02, la cookie, errores de permisos y deduplicación. No añadir un mensaje público que permita declarar presencia ajena, renovar plazos arbitrariamente o ejecutar un vencimiento. Salir o cerrar expresamente desde cualquier pestaña afecta a la participación completa, incluso si quedan otros sockets conectados.

Extensiones mínimas en `shared/contracts`:

| Dato o evento | Extensión requerida |
|---|---|
| `ParticipantView`, incluido el participante propio | `presence: 'CONNECTED' \| 'RECONNECTING'`. No cambia ID, papel, nombre ni `isPlayer`. |
| `RoomView` | `lifecycle: { serverNow, expiresAt, warning }`; tiempos públicos en milisegundos Unix y `warning` booleano. No enviar reloj monotónico interno, sockets ni sesiones. |
| `room:state` / `RoomChange` | Mantener `LEFT`; añadir `RECONNECTED` y `PRESENCE_EXPIRED`, con los campos actuales de ID único, participación y nombre mostrado. La marca de ausencia puede viajar con la vista sin otro aviso breve. |
| `room:left` | Añadir `reason?: 'VOLUNTARY' \| 'RECONNECT_TIMEOUT'`; motivo ausente conserva el significado voluntario anterior. Aplicarlo solo al ID de participación referido. |
| `room:closed` | Conservar `HOST_CLOSED`; añadir `HOST_DISCONNECTED` e `INACTIVITY`. Cierre con revisión terminal y un solo efecto. |
| Recuperación HTTP / `room:resume` | Si ya terminó automáticamente, devolver `room: null` y `ended?: { roomId, participantId, reason }`, donde `reason` es `RECONNECT_TIMEOUT`, `HOST_DISCONNECTED` o `INACTIVITY`. Si no consta un fin automático propio, omitir `ended`. Mantener la envoltura HTTP y `ok: true` de la confirmación Socket.IO. No devolver lista ni permisos de la participación eliminada. |

Conservar en memoria una referencia mínima del **último fin automático de la participación de esa sesión**, para informar al navegador que no recibió el evento por estar desconectado. Incluir sala, participación y causa; disponible solo con su credencial. Limpiarla al crear/entrar en otra sala, eliminarla al eliminar su sesión y perderla al reiniciar el proceso. No conservar listas, nombres ni una sala cerrada completa para este aviso, ni crear un historial. Los resultados mínimos de deduplicación siguen protegiendo frente a solicitudes antiguas, conforme al bloque 02. Estas referencias mínimas no mantienen la sala, su plaza ni sus autorizaciones.

Cambios de presencia, aviso y retirada/cierre deben tener una revisión que permita descartar vistas antiguas. El paso de cada segundo del contador no cambia la revisión ni obliga a publicar otra vista. Una actividad que cambia el modelo y su vencimiento se publica como una actualización coherente. Lecturas y recuperaciones repetidas sin cambio no avanzan revisión. Un aviso repetido no se muestra de nuevo y una vista atrasada no reabre una sala cerrada.

| Responsabilidad | Capa y límites | Comprobación |
|---|---|---|
| Estado de sala/participación, reserva, actividad, vencimientos y transiciones | Modelo puro en `server/application/`; recibe tiempos/datos explícitos, sin leer reloj real, sockets o almacenamiento. | Pruebas puras de identidad, orden, reserva, actividad y estado terminal. |
| Registrar hechos de presencia, recuperar, advertir, retirar y cerrar; autorización y revisión | Casos de uso de aplicación, coordinando modelo y puertos. Deciden consecuencias, no los manejadores de red. | Puertos sustitutos; carreras, borde exacto y callbacks antiguos. |
| Reloj, programación/cancelación y consulta de conexiones autorizadas | Puertos definidos en aplicación, solo para las capacidades usadas. Reloj monotónico para intervalos y referencia pública para presentación. | Reloj/planificador controlados sin esperas reales; contrato de cancelación y contexto. |
| Detectar primera/última conexión de la sesión y ejecutar avisos programados | Adaptadores Socket.IO y de reloj/planificador. Registran sockets internos y notifican hechos a aplicación; no deciden plazos funcionales ni expulsan por su cuenta. | Conexiones reales, pestañas, autenticación y detección de pérdida de red. |
| Guardar estado, índices y último motivo propio; emitir vistas | Adaptadores en memoria y comunicación existentes, según puertos. Limpiar recursos de la espera sin perder garantías de solicitudes antiguas. | Liberación de índices/temporizadores, privacidad y destinatarios. |
| Conectar las implementaciones y permitir sustitutos en pruebas | `server/composition/` y arranque. Ambos transportes comparten identidad, estado y reloj. | Servidor compilado y montaje de pruebas con tiempo controlado. |
| Marca, franja, cálculo informativo y navegación por motivo | Cliente `src/`, contratos públicos y coordinación; presentación sin autoridad de cierre ni imports de servidor. | Navegador en ambos tamaños, versiones atrasadas y borradores. |

Las decisiones/escrituras de una sala siguen siendo síncronas en el proceso único. Lecturas y callbacks aplican la misma política de vencimiento; no crear un camino que la omita. Al cerrar o retirar, cancelar tareas e índices correspondientes y evitar emisiones a personas sin autorización. Al desmontar un runtime de pruebas, cancelar sus tareas y dejar de registrar hechos nuevos de conexiones para que el desmontaje no reprograme ausencias. Los sockets supervivientes de una sesión que salió pueden servir para otra sala, pero no mantienen la participación anterior.

El implementador decide nombres y agrupación de módulos, funciones o clases, detalles de los puertos y del planificador y parámetros técnicos de Socket.IO. Debe registrar esos parámetros y mantener comprobaciones arquitectónicas; no necesita un marco genérico de eventos ni un nuevo dominio de juego. Los tres plazos funcionales son **30 s / 30 min / aviso 1 min antes**. Las pruebas pueden sustituir reloj/planificador; no introducir un interruptor público para modificar los plazos o provocar cierres.

## 6. Ejemplos y criterios de aceptación

A y B son sesiones independientes; B1 y B2 son pestañas de una misma sesión B. Los tiempos se miden desde hechos registrados por el servidor. Resultados ejecutados en §10.

| Criterio | Situación / acción | Resultado exigido |
|---|---|---|
| B03-01 | B pierde su última conexión; vuelve a los 29.999 ms. | Mismo ID, nombre, papel, plaza y posición; A ve «Reconectando» y después recuperación, sin duplicados. |
| B03-02 | B no vuelve, o intenta recuperar exactamente a los 30.000 ms. | Una retirada, plaza libre y aviso; no recupera identidad antigua ni recibe cambios posteriores. |
| B03-03 | Tras retirarse B, entra C y luego B vuelve expresamente. | B obtiene otra participación después de C; mensajes/temporizadores de la anterior no la retiran. Se conserva la capacidad de cinco. |
| B03-04 | El anfitrión pierde su última conexión y no vuelve a tiempo; otro invitado intenta renombrar o entrar. | Cierre único al vencer su margen, aviso por ausencia del anfitrión; no transferir control ni prolongar su reserva. |
| B03-05 | B1 se cierra pero B2 sigue conectado; después se pierde B2. | Primer hecho no inicia ausencia ni cambia ocupación; la última pérdida inicia un único margen. Otra pestaña recupera la misma participación antes de vencer. |
| B03-06 | B1 solicita salida, o A solicita cierre, con otras pestañas abiertas. | Efecto inmediato en todas, sin esperar 30 segundos; eventos de desconexión posteriores no crean otra reserva o cierre. |
| B03-07 | Crear por HTTP sin conexión previa del anfitrión; conectar antes de 30 segundos o no conectar. | Reserva inicial con el mismo código/ID; recupera a tiempo o cierra a los 30 segundos. Con socket previo no se inicia esta reserva. |
| B03-08 | Mantener conexiones abiertas sin cambios durante 29 y 30 minutos. | Aviso al minuto 29, cierre al 30 y motivo en portada para todas las sesiones. No depende de que se dispare un contador del cliente. |
| B03-09 | Durante el aviso se acepta incorporación, salida voluntaria o nombre distinto. | Nuevo vencimiento de 30 minutos, desaparición del aviso en todos y callbacks anteriores sin efecto. |
| B03-10 | Recargar, reconectar, leer, repetir entrada/salida, guardar nombre igual, enviar solicitudes rechazadas o vacías. | Ninguno renueva la espera ni duplica transiciones/avisos. La retirada automática tampoco renueva. |
| B03-11 | Sala con cinco miembros, uno en reserva; intentar sexta entrada antes y después de su retirada. | Antes: llena. Después: plaza disponible. Durante la reserva no cambia el orden ni se admite otro en su lugar. |
| B03-12 | Recuperar con 10 segundos de reserva aún disponibles cuando vence la inactividad; cambiar nombre justo al minuto 30. | Prevalece la caducidad; ninguna acción tardía rescata la sala. Coincidencias y callbacks retrasados producen un solo cierre y causa coherente. |
| B03-13 | Desconectar, recuperar y desconectar otra vez; ejecutar callbacks viejos fuera de orden o con código reutilizado. | Cada ausencia nueva tiene su contexto; los antiguos no retiran, advierten ni cierran recursos nuevos. |
| B03-14 | Sesión ajena intenta declarar conexión, renovar, recuperar o vencer la participación de B. | No modifica estado ni recibe vista/motivo privado. Nombre, código e ID público no conceden permisos. |
| B03-15 | Volver después de la retirada/cierre sin haber recibido su evento; luego perder la memoria del servidor. | Primero: motivo propio y ningún recurso activo recuperable. Tras reinicio: aviso genérico de no disponibilidad; no inventar la causa ni recuperar una sala. |
| B03-16 | Cambiar la hora del navegador y probar aviso/recuperación en móvil y escritorio. | La decisión del servidor no cambia; marcas, franja, motivos, teclado y borradores funcionan. Se preservan recorridos de 01/T01/02, sustituyendo la limitación histórica B02-14 por estos plazos. |

## 7. Verificación prevista y dependencias

Depende únicamente de los incrementos entregados y de extender puertos de reloj/presencia y sus adaptadores en el mismo proceso. Mantener `npm run check:architecture`, integrado en `npm run check`, y la revisión semántica de responsabilidades. No necesita barajas, otra persistencia ni despliegue.

El hilo de implementación registrará una ejecución de la base antes del cambio y conservará las pruebas pertinentes de `server/application/room.test.ts`, `roomUseCases.test.ts`, `server/app.test.ts`, `server/socket.test.ts`, `server/infrastructure/memoryRoomRepository.test.ts`, `src/roomState.test.ts`, `tools/check-architecture.test.mjs` y los recorridos de `tests/browser/room.spec.ts` y `join.spec.ts`. Adaptar las expectativas ampliadas; B02-14 documentó expresamente una limitación temporal y no debe exigir mantenerla.

Distinguir estas evidencias:

| Evidencia | Qué demuestra y cómo obtenerla |
|---|---|
| Tiempo controlado | Reloj y planificador sustitutos: 29.999/30.000 ms, minutos 29/30, renovación, concurrencia, retrasos y tareas viejas. No esperar media hora real ni reducir silenciosamente los plazos del producto. |
| Conexiones reales con tiempo controlado | Socket.IO/HTTP reales con dos cookies y varias conexiones; sustituir solo reloj/planificador del runtime. Comprueba cómo la detección alimenta presencia y cómo se emiten vistas/cierres al avanzar tiempo. Identificar que el tiempo está controlado. |
| Conexiones y margen reales | Al menos un recorrido de desconexión/recuperación y uno de vencimiento de invitado con los 30 segundos reales. Distinguir cierre limpio de socket de pérdida de red; registrar cuándo se pierde la red, cuándo la detecta el servidor y cuándo retira. Comprobar última pestaña y recuperación sin F5. |
| Interfaz con caducidad controlada | Servidor real de pruebas con reloj sustituido y navegadores independientes; avanzar hasta aviso y cierre para comprobar franja, renovación y motivos. No presentar este resultado como 30 minutos transcurridos en tiempo real. Inspeccionar 390×844 y 1280×800. |

Las pruebas no invocan únicamente el caso de uso para afirmar que funcionó la red. Tampoco dependen del reloj falso para afirmar que se midió el retraso real de detección. Los controles de tiempo se exponen solo en el montaje de pruebas, sin endpoints públicos ni opciones del usuario.

Puertas finales: **`npm run check`** y **`npm run test:browser`** contra la versión recién compilada y arrancada con `npm run start`; comprobar el proxy de desarrollo si se modifica su integración. Registrar comandos, versión, resultados, parámetros de detección y límites. La aceptación de sincronización local de dos segundos del bloque 02 se cuenta desde la transición aceptada por el servidor, no desde una pérdida física aún no detectada.

## 8. Cambios, cierre y coordinación

| Fecha | Concreción de decisiones | Referencias afectadas |
|---|---|---|
| 30/09/2026 | Agregar presencia por sesión, reserva inicial, actividad humana efectiva y prioridad del vencimiento; aprobar marcas, franja y motivos. | Aplicación §5.4 e infraestructura §§6.1–8: comunicar las concreciones a coordinación para su alineación. |
| 30/09/2026 | Sustituir la ausencia de limpieza/presencia del bloque 02 por el ciclo de vida acordado. | B02-14 queda como evidencia histórica de la versión anterior; no modificar sus resultados ni atribuirle las nuevas pruebas. |

No quedan decisiones funcionales abiertas necesarias para implementar este alcance. Si aparece una contradicción nueva con las fuentes, citarla y consultar antes de cambiar las reglas.

**Cambio de código revisado:** `76e9ecc`. **Pruebas del bloque 03:** ejecutadas, §10. **Comprobaciones arquitectónicas:** superadas, §10. **Fecha de verificación:** 30/09/2026.

Preparación documental realizada el 30/09/2026: lectura de fuentes, código y evidencia previa; sin implementación ni ejecución de pruebas del producto en este hilo. Para cerrar, registrar B03-01–16, regresiones previas, commit revisado, comandos y las cuatro clases de evidencia anteriores. El resumen para coordinación incluirá acuerdos, archivo, responsabilidades finales, resultados reales y pendientes de configuración, expulsión, bots, inicio, partida y despliegue.

## 9. Base ejecutada antes de modificar código — 30/09/2026

Versión `17a5efc`, rama `main`; únicos cambios locales iniciales: esta especificación y la actualización de `PROCESO_SDD.md`, conservados. Entorno: Windows, Node.js 24.13.0, npm 11.6.2, Chrome local sin interfaz gráfica, HTTP `127.0.0.1:3000`.

- `npm run check`: superado, 38/38 pruebas Vitest en 7 archivos, tipos, lint, 21 módulos sin imports prohibidos ni ciclos y compilación TypeScript/Vite.
- `npm run start` con esa compilación y `npm run test:browser`: superado, 12/12 pruebas (33,1 s), incluidos E1–E7 y los recorridos del bloque 02.

Esta ejecución acredita la base anterior. No verifica todavía los plazos ni la presencia del bloque 03. No se detectó contradicción funcional entre el alcance acordado y las fuentes consultadas.

## 10. Implementación y evidencia final — 30/09/2026

**Versiones:** `11b0d06` conserva por separado la especificación inicial, los cambios locales del proceso SDD y la ejecución de la base; `76e9ecc` contiene código, pruebas, README y mapa de responsabilidades. Este registro y el estado final del proceso se guardan en un commit documental posterior. Las puertas finales se ejecutaron sobre el contenido de código de `76e9ecc` antes de registrarlo; no se cambió código después.

**Entorno comprobado:** Windows NT 10.0.26300.0, Node.js 24.13.0, npm 11.6.2, Chrome 154.0.8037.92 sin interfaz gráfica, Socket.IO/cliente 4.8.4. Ejecuciones finales entre las 23:54 y 23:57 CEST. Instancia compilada en `127.0.0.1:3000`, reiniciada tras construir el código actual con `npm run start`. Los montajes adicionales usan puertos locales efímeros y esa misma salida `dist-server`/`dist`. No se añadieron dependencias.

### Comandos ejecutados y puertas finales

| Comprobación | Resultado real |
|---|---|
| `npm run check` | Superado: tipos, lint, **65/65 pruebas Vitest en 10 archivos**, control de **25 módulos** sin imports prohibidos ni ciclos, compilación TypeScript/Vite. Última ejecución Vitest: 23:54:32, 11,22 s. |
| `npm run start` después de esa compilación; `npm run test:browser` | Superado: **18/18 pruebas Chrome**, 57,7 s. Los 12 recorridos previos siguen presentes; se añaden seis del bloque 03. Los montajes de ciclo de vida importan la versión compilada, no módulos TypeScript de producción. |
| `npx playwright test tests/browser/lifecycle.spec.ts --grep 'margen reales'` | Superado: 1/1 recorrido de reserva real durante el ajuste de la prueba de pestañas, 43,7 s. Se repitió dentro de la puerta completa final. |
| `npx vitest run server/lifecycleSocket.test.ts -t 'heartbeat real' --reporter=verbose --disableConsoleIntercept` | Superado: 1/1 prueba seleccionada; las otras cinco quedaron omitidas únicamente en esta selección. Permitió registrar la medida de detección real por heartbeat. Las seis se ejecutaron en la puerta `check`. |
| `git diff --check`; revisión semántica de capas; capturas a 390×844 y 1280×800 | Sin errores de espacios ni dependencias invertidas. Franja, marcas, código, borrador, controles y motivos legibles, sin desbordamiento horizontal. Capturas regenerables `test-results/B03-*-warning.png`, `B03-*-reconnecting.png`, excluidas de Git. |

No se modificó la configuración del proxy de Vite. Las comprobaciones de este bloque usaron la compilación; la ejecución del proxy de §10 del bloque 02 permanece como evidencia histórica, no como una nueva ejecución de desarrollo en este bloque.

### Qué tiempo se comprobó

| Clase | Evidencia y alcance |
|---|---|
| Tiempo controlado | `waitingLifecycle.test.ts`, modelo y estado del cliente: 29.999/30.000 ms; minutos 29/30; renovaciones, capacidad, solicitudes antiguas, coincidencias, callbacks retrasados/desordenados y código reutilizado. `ControlledTime` mantiene los plazos originales del producto, adelanta el tiempo o retiene callbacks. No acredita 30 minutos reales. |
| Conexiones reales con tiempo controlado | `lifecycleSocket.test.ts`: HTTP/Socket.IO, cookies independientes, varias conexiones de la misma sesión, vistas por destinatario, retirada y recuperación de motivos. Solo reloj/planificación de aplicación sustituidos. El transporte, autenticación, detección y envío usan conexiones reales. |
| Detección heartbeat real con reserva posterior controlada | WebSocket real abierto; el montaje descarta paquetes salientes del cliente, incluidos `pong`. El servidor detectó `ping timeout` a los **10.015,1 ms** desde empezar el descarte. Después se avanzaron 29.999 + 1 ms controlados para comprobar la reserva. Es una pérdida silenciosa de paquetes inducida, no una avería física de la red ni una reserva de 30 s reales. |
| Conexiones y reserva reales | Último recorrido de `lifecycle.spec.ts`, sin reloj sustituido: segunda pestaña con WebSocket confirmado; cerrar una no cambia presencia. Corte local con `BrowserContext.setOffline(true)`, recuperación antes de vencer sin F5 y segundo corte hasta retirada. Detección de recuperación: **7,24 ms**; detección del segundo corte: **9,41 ms**; retirada **30.002,50 ms** después de la detección y **30.011,92 ms** desde iniciar el corte. Razón del cierre de pestaña y de ambos cortes: `transport close`. Medidas del proceso real mediante reloj monotónico/deadline y observación del repositorio al guardar la retirada; comprobación de convergencia del receptor en ≤2 s desde el efecto. |
| Interfaz con caducidad controlada | Servidor compilado real y dos contextos Chrome con cookies independientes; minuto 29, renovación y minuto 30 mediante sustitutos internos. Cambio de hora del navegador a 2040 no altera la decisión del servidor. Un contador adelantado a cero con el invitado sin conexión conserva lista/aviso hasta confirmación. Ambos tamaños y papeles, borrador, foco y teclado. |

**Detección configurada:** `pingInterval=5000`, `pingTimeout=5000` ms, `maxHttpBufferSize=4096`; confirmación del cliente 5000 ms, conservada del bloque 02. Una pérdida silenciosa puede tardar aproximadamente un intervalo más el timeout en detectarse; no se promete un límite universal para otras redes o procesos bloqueados. La reserva funcional es siempre **30.000 ms desde la detección aceptada**, no desde el gesto de desconexión. En la prueba del navegador la red se interrumpió en el contexto local de Chrome; no se desactivó una interfaz física ni se reprodujo una red WAN.

### B03-01–16 ejecutados

| Criterio | Resultado y evidencia |
|---|---|
| B03-01 | Superado: casos de uso y sockets reales a tiempo controlado 29.999 ms preservan ID/nombre/papel/posición y vencimiento general; recuperación única con sufijo. Chrome recupera sin F5 y conserva borrador/foco; el recorrido de margen real lo repite antes de vencer. |
| B03-02 | Superado: 30.000 ms produce una retirada, índices libres, aviso y motivo propio; conectar en el borde no recupera. Integración comprueba que no recibe vistas posteriores. Chrome espera además los 30 segundos reales hasta liberar la plaza. |
| B03-03 | Superado: nueva incorporación C antes de reentrar B, otra identidad para B, última posición de invitado, solicitud antigua rechazada y callback viejo sin efecto. Casos de uso y recorrido Chrome con tiempo controlado. |
| B03-04 | Superado: nombre/entrada de terceros durante ausencia del anfitrión no prolongan su reserva; cierre único `HOST_DISCONNECTED`, sin transferencia ni acciones posteriores. Sockets y Chrome presentan el motivo a quienes permanecen y a quien vuelve. |
| B03-05 | Superado: dos conexiones de una sesión; perder una no revisa presencia ni ocupación; última pérdida inicia una reserva y otra conexión recupera. Integración controlada y pestañas reales con reloj real. La prueba espera que ambos WebSockets estén establecidos. |
| B03-06 | Superado: salida y cierre inmediatos en todas las pestañas, cancelación de tareas e índices; desconexiones y callbacks posteriores no recrean reservas. Integración y regresión de salida/cierre del bloque 02. |
| B03-07 | Superado: creación HTTP sin socket obtiene reserva inicial; conexión a 29.999 conserva sala sin anuncio de recuperación; sin conexión cierra a 30.000. Socket previo crea `CONNECTED`. Casos de uso y HTTP/Socket.IO reales con tiempo controlado. |
| B03-08 | Superado con tiempo controlado: sockets abiertos, aviso único al minuto 29 y cierre al 30, en ambas sesiones; motivos y limpieza. Chrome muestra franja y retorna directamente a portada. No se esperó media hora real. |
| B03-09 | Superado: incorporación, salida voluntaria y nombre distinto renuevan coherentemente, quitan aviso y descartan callbacks anteriores. Las tres acciones en casos de uso; renovación HTTP difundida en integración; edición con teclado en ambos tamaños Chrome. |
| B03-10 | Superado: lecturas, crear/entrar existentes, repeticiones de entrada/salida, nombre normalizado igual, rechazos, mensajes vacíos sin confirmación, conexión y retirada automática no renuevan. Recuperación/recarga no duplica; aviso no aumenta revisión al releer. |
| B03-11 | Superado: cinco miembros contando la reserva, sexta entrada rechazada antes de retirada y permitida después con nueva solicitud; orden conservado. Se mantienen las carreras de última plaza del bloque 02. |
| B03-12 | Superado: vencimiento general mientras quedan 10 s de reserva, nombre en el borde y coincidencia exacta con anfitrión producen un cierre por inactividad; callbacks retrasados se procesan cronológicamente y conservan la causa propia del invitado retirado antes. |
| B03-13 | Superado: ausencias nuevas tienen generación propia, nombre ajeno no invalida la reserva; callbacks cancelados/desordenados no retiran la nueva participación ni advierten/cierran otra sala con código reutilizado. |
| B03-14 | Superado: otra cookie no recupera vista/motivo ni declara presencia ajena. Campos extra en resume se rechazan; mensajes públicos de presencia/vencimiento no existen; ID visible no permite renombrar/salir por otro. Regresiones de origen, cookie y permisos conservadas. |
| B03-15 | Superado: recuperar tras perder el evento devuelve únicamente motivo propio y `room:null`; crear/entrar limpia ese motivo. Eliminar sesión borra la referencia; runtime nuevo no conoce causas ni sala. Chrome reinicia realmente el runtime local en el mismo puerto y recupera el aviso genérico, sesión nueva y presencia utilizable sin F5 del anfitrión. No se mató un proceso del sistema operativo. |
| B03-16 | Superado: hora del navegador distinta, marcas/franja/recuperación, teclado, foco y borradores en 390×844 y 1280×800. Cero visual no decide cierre. E1–E7, T01, índices y recorridos pertinentes de B02 pasan; B02-14 queda como evidencia histórica de la limitación ya sustituida. |

### Responsabilidades, archivos y decisiones internas

| Responsabilidad | Archivos principales |
|---|---|
| Estado puro, actividad, generaciones y prioridades | `server/application/room.ts`, `waitingTime.ts`; parámetros explícitos, sin reloj real ni sockets. |
| Autorizar/deduplicar y coordinar vencimientos antes de acciones/vistas | `roomUseCases.ts`, `waitingLifecycle.ts`, `ports.ts`, `roomView.ts`. Cronología por sala; tareas identifican sala/generación/participación y revalidan. |
| Tiempo y presencia reales | `server/infrastructure/time.ts`, `socketRooms.ts`. Reloj monotónico con anclaje Unix al arrancar; temporizador cancelable redondeado hacia arriba; conjuntos de sockets autenticados por sesión. |
| Estado/índices y último fin mínimo | `memoryRoomRepository.ts`, `memorySessions.ts`. Sin lista ni historial en `ended`; resultados de deduplicación conservados. |
| Borde HTTP y composición | `http/expressApp.ts`, `server/composition/createApp.ts`. Misma identidad y colaboradores; `dispose()` detiene hechos nuevos y cancela tareas antes de cerrar conexiones de pruebas. |
| Contratos y cliente | `shared/contracts/room.ts`; `src/useRoomFlow.ts`, `roomState.ts`, `ExpiryWarning.tsx`, `screens.tsx`, `App.tsx`, `style.css`. Navegación por causa, revisiones e identidades terminadas; contador con `performance.now`, anuncio inicial y `aria-live="off"` para los segundos. |
| Pruebas y documentación | Pruebas anteriores adaptadas en modelo/casos de uso/repositorio/HTTP/sockets/estado y `join.spec.ts`; nuevas `waitingLifecycle.test.ts`, `memorySessions.test.ts`, `lifecycleSocket.test.ts`, `tests/support/controlledTime.ts`, `tests/browser/lifecycle.spec.ts`; README, guía de organización y especificación/proceso SDD. |

Revisión semántica: infraestructura valida transporte y cuenta conexiones, pero no decide los 30 s/30 min ni retira por su cuenta. Aplicación usa solo sus puertos/modelo y contratos; no importa Node, Express, Socket.IO o React. El navegador no recibe sesiones/sockets/reloj monotónico interno, no calcula el vencimiento oficial y no ejecuta limpieza. No se añadieron módulos vacíos de dominio, control público de tiempos ni excepciones de dependencias.

**Incidencias corregidas durante la ejecución:** la regresión de reconexión necesitó una revisión adicional por el cambio efectivo de presencia; dos pruebas de sockets esperaban el primer mensaje en vez de la transición buscada y recibieron una vista previa en tránsito, por lo que ahora esperan el evento correspondiente. Una aserción de tarea antigua necesitaba consultar el modelo almacenado, no el DTO inicial. La primera prueba de pestañas cerraba antes de establecer su segundo socket y no acreditaba su premisa; ahora espera dos WebSockets reales. La revisión del reinicio descubrió que, tras establecer una sesión nueva sin sala, faltaba volver a conectar el canal; se corrigió y añadió el recorrido de reinicio real del runtime. Se repitieron las puertas completas después de estas correcciones.

**Límites y coordinación:** comprobación local de un único proceso y Chrome con contextos aislados, no dispositivos físicos ni prueba de comprensión con una persona externa. Caducidad de 30 minutos acreditada con tiempo controlado; reserva de 30 segundos acreditada también con tiempo real. Sin HTTPS/Caddy/VPS ni persistencia; se conservan las regresiones de atributos de cookie de producción, sin afirmar despliegue. No se implementa una política general nueva de eliminación de sesiones: al eliminar explícitamente una sesión en el adaptador se elimina también su motivo mínimo. Configuración, expulsión, bots, inicio y partida siguen fuera; sus futuras acciones válidas deberán integrarse en la política de actividad. Coordinación debe trasladar las concreciones de presentación, presencia entre pestañas, primera conexión, actividad efectiva y prioridad del vencimiento a aplicación §5.4 e infraestructura §§6.1–8. No se detectó contradicción funcional que exigiera cambiar una regla acordada.
