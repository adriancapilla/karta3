# B18 — Analítica básica de uso propia
**Publicación técnica — 18/10/2026:** alineación general recibida y Linux focal correcto. [Puerta final39161953043](https://github.com/adriancapilla/karta3/actions/runs/39161953043), fuente d73097f: **589/589 en51 archivos,93 módulos;4/4 Chrome en32,3s; imagen/Compose/volumen/copia/restauración correctos**. Worker1/retries0. El aumento respecto a587/92 son dos regresiones de lease Linux y el verificador, sin otra función. Los cierres Windows y pendientes de recepción/Linux anteriores son históricos conservados. CI completa196 casos/24 archivos, revisión/squash/main y clon todavía pendientes de ejecución; su cierre real se registra en la PR/registro operativo. **No verificado globalmente ni operativo públicamente:** privacidad/información, habilitación real expresa, acceso VPS, copia externa y ensayo del responsable siguen pendientes. Sin HUMAN/GHCR/VPS.

**Estado de preparación conservado:** especificación acordada por el autor el 18/10/2026; en ese momento no implementada, probada ni activada. Numeración B18 libre al preparar este documento. Alineación de fuentes por Arquitectura pendiente antes del cierre, sin requerir otra aprobación del alcance ya autorizado.

**Estado técnico actualizado — 18/10/2026:** tres etapas implementadas y comprobadas en Windows sobre `1ce58e2`; resultados por A01–A13 en §15. Check587/587 y47/47 Chrome seleccionados, recogida pública OFF. Linux, alineación documental recibida y preparación de privacidad/operación pendientes; **no marcado verificado globalmente**.

**Base comprobada:** `APP/karta3`, rama `main`, HEAD `555c50d4dc5146963805503442e08168b55a95b5`, árbol inicialmente limpio. Incluye B16+B17/adendas integrados por PR #13. Conservar cambios posteriores y cierres históricos. Su CI anterior no acredita B18. No se crea otra rama/checkout desde esta preparación.

## 1. Objetivo, decisiones y fuentes

Evaluar el uso del MVP con hechos acotados: acceso, recorridos de anfitrión/invitado, conversión de salas, configuración realmente utilizada, duración, finalización e inactividad humana. No medir personas únicas ni recurrencia.

**Confirmado por el autor:** solución propia sin suscripciones/servicios externos, inicialmente SQLite; dominio independiente; detalle 90 días y resúmenes mensuales 12 meses; entornos separados; exclusión de automatizaciones conocidas/carga; sin IP, huellas, credenciales o identificadores estadísticos persistentes entre visitas. Partidas vivas continúan en RAM. El 18/10 confirma medir **pulsación de «Crear sala» y creación confirmada, sin añadir formulario**.

**Entrega aceptada el 18/10:** recoger, conservar y consultar mediante comando administrativo/CSV en este bloque; panel web privado en uno posterior. El autor acepta también copias de agregados que no recuperan el detalle de eventos perdido con el disco. Los límites operativos siguientes son valores iniciales verificables, ajustables con evidencia documentada sin alterar privacidad, retención o alcance. Los contratos/fórmulas de esta especificación guían la implementación; no son evidencia ejecutada. Recogida pública desactivada hasta completar la revisión de privacidad y preparación operativa; este encargo no autoriza su activación.

Referencias:

- [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) y [organización de responsabilidades](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), especialmente coordinación/puertos/proyecciones B07–B09/B13 y composición.
- [Contexto vigente](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), paso actual del 18/10; [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) §§4–5/8–12 y §§7.5–7.7; [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md) §§1–4/6–8/12/14–15. [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md): reglas conservadas.
- Contratos y código leídos: `shared/contracts/room.ts`, `game.ts`; `src/App.tsx`, `screens.tsx`, `useRoomFlow.ts`; `server/application/{roomUseCases,gameCoordinator,waitingLifecycle,ports}.ts`; adaptador HTTP, composición, `main.ts`, Dockerfile y Compose.

**Ampliación explícita para alinear:** Infraestructura §1 excluía base de datos/persistencia en el MVP. El autor autoriza SQLite **solo para estadística**; no guardar/restaurar Game, sesiones, manos, resultados jugables o asociaciones activas. La autenticación administrativa de consultas tampoco crea cuentas de jugadores. Trasladar esta excepción a Arquitectura mediante el autor, sin editar TFM aquí.

## 2. Alcance y límites

Incluye catálogo pequeño de eventos versionados, persistencia privada, calidad de datos, consultas fijas por fecha/entorno, CSV agregado, agregación/purga y procedimiento de copia/restauración. Preparar configuración de volumen/operación y comprobarla localmente/Linux; activación pública y despliegue posteriores.

Fuera: panel visual, recurrencia, perfiles/personas únicas, geolocalización, dispositivo/navegador/viewport, campañas/referrer, atención, movimientos, grabaciones, jugadas detalladas, cada ajuste de preparación, dificultad nueva, informes arbitrarios, plataforma general de observabilidad, watchdog de juego o cambio de persistencia viva. Sin cambios en barajas, diseño, reglas o fuentes TFM.

## 3. Unidad de medida, identificadores y tiempo

| Referencia | Alcance y creación | Caducidad y límites |
|---|---|---|
| `visitId` | UUID aleatorio en memoria de **un documento/pestaña**; nunca cookie, localStorage, sessionStorage, URL o identidad de juego. | Nuevo al recargar/abrir documento. Rotar al siguiente evento permitido tras 30 min sin uno, o a las 12 h máximas. No heartbeat/escucha de movimientos para mantenerlo. Cerrar pierde la referencia. |
| `intentId` | UUID de un gesto de crear/entrar; correlaciona intención y resultado de esa operación. | Solo memoria del documento mientras la operación esté pendiente; nuevo gesto tras resultado definitivo usa otro. Reintento del mismo envío incierto conserva el original. No usar el `requestId` de juego como identificador almacenado. |
| `roomRef`, `gameRef` | UUID estadísticos nuevos, asignados por aplicación a esa sala/partida; independientes de código, ids públicos, cookie y sesión. | Mapeo operativo solo en RAM y acotado al objeto; eliminar al retirar el objeto. Persistencia analítica dentro de la ventana detallada de §9; nunca vincular dos salas por una misma sesión. |
| `participationRef` | UUID por incorporación humana a una sala; cambia al salir/volver. Reanudación/F5/pestaña conserva esa participación. | Mismo límite que sala/partida; tras otra sala no se puede enlazar al humano anterior. Bots no reciben identidad estadística humana. |
| `eventId`, `bootRef` | Id de evento y arranque técnico, creados sin datos personales. | Eventos/dedupe y registros técnicos detallados: 90 días como máximo. No identifican visitantes entre visitas. |

El adaptador estadístico **no recibe objetos de sesión ni credenciales**. La coordinación puede conocer al actor para autorizar la operación, pero le entrega solo referencias nuevas y campos permitidos. No persistir tablas de correspondencia con ids/cookies/tokens de juego, ni sus hashes. Relacionar una visita con su propia acción no autoriza enlazar visitas posteriores; recuperar una misma participación identifica esa participación, no recurrencia de una persona.

Fechas de evento y recepción en UTC, milisegundos enteros. Para navegador manda la **hora de recepción del servidor**, no una fecha declarada por el cliente. Hechos del servidor conservan hora de transición y de recepción; duración con reloj monotónico desde inicio aceptado hasta publicación terminal, incluidas revisiones/desempate, excluida retención del resumen. Nunca usar horas de pestañas para ordenar hechos oficiales.

Consultas `[from,to)` en UTC; la salida explicita zona, límites, granularidad y fecha de actualización. Agrupación diaria solo mientras existe detalle; datos anteriores únicamente por meses UTC completos, sin inventar días a partir de un resumen mensual. Una franja mixta se devuelve en segmentos detallado/mensual y exige meses completos en la parte resumida.

## 4. Catálogo de eventos v1

Sobre común interno, con lista cerrada de claves: `eventId`, `name`, `version: 1`, `source: BROWSER | SERVER`, `environment: development | test | pruebas | production`, `traffic: HUMAN | SYNTHETIC`, `occurredAt`, `receivedAt`, `bootRef` y `data`. Fuente/entorno/tráfico/fechas oficiales los impone el servidor. Las referencias indicadas como opcionales solo existen cuando hay contexto autorizado conocido; ausencia no se convierte en cadena vacía. Sin campo libre `metadata`, mensajes, URL o cuerpo original.

| Evento / emisor responsable | `data` obligatorio | Opcional y clave lógica única | Métrica |
|---|---|---|---|
| `home_viewed` / cliente, al presentar realmente HomeScreen | `visitId`, `viewId`, `navigation: DOCUMENT_INITIAL | DOCUMENT_RELOAD | SPA_RETURN` | Único `(visitId,viewId)`. Render/StrictMode/actualización de aviso no crea otra vista. | Portada |
| `room_create_intended` / cliente, gesto admitido por el control | `visitId`, `intentId` | Único `(visitId,intentId)`. No pulsaciones mientras está deshabilitado. | Intento de crear |
| `room_created` / aplicación tras guardar una **sala nueva** | `roomRef` | `visitId`, `intentId`; único por `roomRef`. `createOrGet` que recupera sala no lo emite. | Creación/cohorte |
| `room_join_attempted` / cliente al enviar el formulario de entrada | `visitId`, `intentId` | Único `(visitId,intentId)`. Sin código/nombre, incluso si son inválidos. | Intento de invitado |
| `room_join_resolved` / servidor, resultado definitivo de una operación de entrada | `intentRef`, `outcome: NEW_JOIN | EXISTING_PARTICIPATION | REJECTED`, `reason` | `visitId`, `intentId`; `roomRef`, `participationRef` solo en éxito autorizado. Único por operación deduplicada; `reason: null` en éxito, enum cerrado de §5 en rechazo. | Resultado/entrada nueva |
| `room_waiting_closed` / aplicación B03/cierre explícito | `roomRef`, `reason: HOST_CLOSED | HOST_DISCONNECTED | INACTIVITY` | Único por sala; transición a partida **no** es este evento. | Cerradas sin iniciar |
| `game_started` / aplicación tras fijar Game/preparación, antes de emisiones | `roomRef`, `gameRef`, `configuration`, `humanParticipations: [{participationRef,isHost}]` | Solo humanos jugadores en esa lista; único por `gameRef`. Una partida, no una por receptor/pestaña. | Conversión/configuración/denominadores |
| `human_became_automatic` / coordinación al observar ACTIVE→AUTOMATIC confirmado | `roomRef`, `gameRef`, `participationRef`, `phase: BASE | TIE_BREAK` | Único `(gameRef,participationRef)`; primer timeout o un bot no lo emite. | Inactividad humana |
| `game_ended` / coordinación terminal, o parada controlada del proceso | `roomRef`, `gameRef`, `reason`, `durationMs`, `evidence: GAME_RESULT | CONTROLLED_SERVER_STOP` | Único por partida; motivos y frontera terminal en §6. Duración real calculable en estos casos, no reloj de navegador. | Duración/completado |

`intentRef` es una referencia estadística del servidor, distinta de `requestId`, para deduplicar también entradas de clientes sin contexto estadístico. Para esos clientes no se inventa una visita/intención de navegador. No añadir eventos de cada carta, timeout, ronda o cambio de configuración. `game_started` permite contar participaciones y tipo de anfitrión sin registrar nombres, puestos individuales o manos.

En `human_became_automatic`, `phase` corresponde al tipo de ronda: las tres rondas de fase final siguen siendo BASE; solo el desempate es TIE_BREAK. Emitir por transición de estado, no cada vez que actúe después un humano ya automático.

No unir el embudo de creación con el de invitado: una visita puede recorrer ambos o ninguno; sus contadores se presentan separados. Una intención sin resultado observado es **sin confirmación estadística**, no fallo demostrado. Nuevo gesto tras un rechazo cuenta otro intento; reenvío del mismo envío incierto no. El éxito `EXISTING_PARTICIPATION` no añade plaza ni nueva entrada confirmada.

## 5. Captura y contratos mínimos

### Navegador

Proponer `POST /api/usage/events` con un evento por petición y contrato exacto `{eventId,name,version,visitId,data}` para **solo los tres eventos BROWSER**. `data` contiene únicamente `viewId/navigation` o `intentId`, según tabla. Sin timestamp, entorno, actor o resultado aceptados del cliente; UUID válidos, enums cerrados y claves adicionales rechazadas. JSON máximo 2 KiB; 400 inválido, 403 origen, 413 tamaño, 429 límite y 503 recogida no disponible. 202 indica encolado, **no escritura durable**; 204 si recogida desactivada. Respuestas sin estado de salas o confirmación de códigos.

Mismo origen estricto en entorno publicado; no CORS abierto. No precisa cookie de juego para contar una vista y no crea una sesión nueva con finalidad estadística. No recoger IP/UA/Referer/URL desde cabeceras. Limitar inicialmente 60 eventos/min por visita con ráfaga 10 y 120/s global con ráfaga 240; mapa de admisión acotado a 4096 visitas, expiración 30 min y límite global también al desbordarlo. Valores técnicos revisables con evidencia, no límites generales nuevos sobre jugadores.

Envío auxiliar sin esperar para navegar/jugar; sin almacenamiento offline ni persistente. Un reintento como máximo en memoria durante 10 s, mismo `eventId`; no contar los reintentos como otras vistas. La caída de analítica no muestra errores en la partida ni bloquea crear/entrar. Bloqueadores, cierre inmediato o red pueden perder estos eventos; no prometer total de accesos HTTP o personas.

Para correlacionar intención con creación/entrada, contexto opcional `{visitId,intentId}`: cabecera `X-Karta3-Usage-Context` JSON acotada a 256 bytes en creación HTTP, cuyo cuerpo sigue siendo `{}`; campo opcional `usageContext` en `room:join`, declarado/validado en contrato compartido. Clientes anteriores sin contexto siguen válidos. Contexto estadístico inválido se descarta con diagnóstico fijo sin rechazar una operación de juego antes válida; no incorpora privilegios ni cambia dedupe de juego. No guardar el contexto entre visitas ni permitir al cliente elegir `roomRef`/`gameRef`/`participationRef`.

### Servidor

Emitir hechos desde los puntos de decisión de aplicación, después de estado y dedupe registrados y **antes de emitir HTTP/ack/sockets**; fallar una emisión no repite el hecho. No instrumentar la difusión `updated` por destinatario como fuente de creación/inicio/final. Captura de cierres también en WaitingLifecycle; rechazo de entrada en el límite que ya conoce un resultado validado. Un decodificador que rechaza tipos/campos aporta solo `INVALID_INPUT`, sin conservar el cuerpo.

Resultado de entrada: `reason` admite los códigos actuales aplicables `INVALID_INPUT`, `SESSION_REQUIRED`, `ROOM_NOT_AVAILABLE`, `ROOM_FULL`, `ALREADY_IN_ROOM`, `PARTICIPATION_ENDED`, `GAME_ALREADY_STARTED`, `GAME_FINISHED`, `REQUEST_CONFLICT`, `FORBIDDEN`, `INTERNAL_ERROR`. No distinguir código inexistente de cerrado si el contrato público actual no lo distingue. Un fallo de transporte sin respuesta no se transforma en rechazo: queda sin resolver; los reenvíos observados del mismo requestId se vinculan en RAM a un único `intentRef`, nunca persistiendo requestId/firma/código/nombre. Conflicto por reutilizar el requestId con otro contenido no altera el resultado anterior ni crea otra incorporación.

## 6. Instantánea inicial, terminales y recuperación

`configuration` es una lista cerrada construida del estado **aceptado al iniciar**, no del último borrador o evento cliente:

| Campo estadístico | Origen efectivo / significado |
|---|---|
| `deckId`, `deckSchemaVersion`, `deckContentVersion` | Snapshot validado seleccionado. Tres barajas actuales: Criaturas 2/2, genérica/Solar 2/4; no fijar esos valores como catálogo inmutable. |
| `humanPlayerCount`, `botCount`, `playerCount`, `hostPlays`, `humanObserverCount` | Roster inicial; jugadores 2–5, al menos un humano; observador no ocupa plaza. |
| `botsByDifficulty: {EASY,HARD}` | Cantidades enteras cuya suma es botCount. Etiquetas Fácil/Difícil; HARD conserva la política existente. Nada de NORMAL, booleanos o dificultad futura. |
| `turnSeconds`, `reviewSeconds`, `forceTieBreak` | RoomSettings actuales, mismos enums/semántica que B05/B08. |
| `attributeValueMode`, `optimizeForMobile` | RoomSettings: `PLAY_VALUE`/`DISPLAY_VALUE` y booleano. **Compartidos**, no preferencias individuales ni reglas de Game. No registrar otra copia por pestaña/participación o el ancho real del dispositivo. |

No se ha encontrado otra opción inicial configurable vigente. `humanObserverCount` es 1 si HOST observa y 0 si juega. El desglose de dificultad es colectivo, sin nombres/ids de bots. Añadir una opción futura exige revisar contrato/evento, no absorber campos automáticamente de RoomSettings.

`game_ended.reason`: `DECK_COMPLETED` (normal), `HOST_CANCELLED`, `NO_ACTIVE_HUMAN_PLAYERS` o **`TECHNICAL_INTERRUPTION` estadístico**. Los tres primeros proceden de la publicación terminal única de resultados B07/B08/B13, no de clasificación candidata durante revisión final. Cancelar durante revisión compite con el vencimiento conforme a B13; una sola transición gana. No retrasar, pausar, alterar ni adjudicar cartas por la instrumentación.

`TECHNICAL_INTERRUPTION` solo cuando una **parada controlada** constata que esa partida seguía IN_GAME y va a perderse la RAM: evidencia `CONTROLLED_SERVER_STOP`, duración hasta esa constatación y diagnóstico operativo fijo `SERVER_STOP`. Es estadística, no un nuevo resultado del juego, cancelación del anfitrión o mecanismo de recuperación. `technicalFailure()` actual no termina necesariamente la partida: un log/excepción aislado no emite un final.

Arranque nuevo: reconciliar registros persistidos abiertos del proceso anterior antes de declarar datos actuales. Los que no tienen final durable pasan a **`UNRESOLVED_AFTER_RESTART`**, con `detectedAt` y referencia al arranque anterior, sin `endedAt`/duración exactos o motivo inventado: pudo perderse también un evento de finalización. Esta es una clasificación de calidad/proyección, no un décimo evento de juego ni un ganador. Salas esperando pasan análogamente a `WAITING_LOST_ON_RESTART`, distintas de cierre B03. No mostrarlas eternamente activas ni contarlas como abandono/cancelación o partida normal. Una actualización temporal de analítica sin perder RAM no aplica esta reconciliación.

F5, otra pestaña, conexiones, lecturas de resultados y su retención no emiten nuevos inicios/finales/entradas. Una sala nueva tras consultar A recibe otras referencias; caducar A no altera B (T04/B13). Si se activa analítica con partidas previas ya vivas, excluirlas de cohortes completas y mostrar cobertura desde activación; no inventar su inicio histórico.

## 7. Consultas y fórmulas

Todas las salidas incluyen cantidades brutas, denominadores, porcentaje o `null` si denominador 0, cobertura/calidad, periodo y `asOf`. Nunca presentar 0 % cuando no hay denominador o recogida. Usar el mismo conjunto de entorno/tráfico/fechas para numerador y denominador.

Un hecho sin su padre retenido se marca no enlazado; no reconstruir un inicio/creación por conveniencia. Si una pérdida impide establecer el conjunto coherente de una tasa —incluido numerador mayor que denominador—, devolver tasa `null` y diagnóstico de incompletitud, conservando los recuentos observados. No corregirla artificialmente a 100 % ni ocultar el dato de calidad.

| Consulta fija | Definición y fecha de agrupación |
|---|---|
| `access` | Número de `home_viewed` deduplicados, por recepción. Cada F5 que vuelve a mostrar portada es otra vista/visita técnica; volver por navegación interna cuenta otra vista de la misma visita. Una recarga que recupera directamente una sala no es portada vista. No contar assets, healthcheck o GET de catálogo. No «personas/navegadores únicos». |
| `creation` | Intenciones de crear del cliente y salas **nuevas** confirmadas, separadas. Relación por intentId solo cuando existe; indicar intenciones sin confirmación y creaciones sin intención recibida. No dividir todos los inicios de invitado por creaciones como embudo único. |
| `joining` | Intentos únicos recibidos del cliente, resultados únicos de servidor por outcome/reason, y NEW_JOIN como entrada nueva confirmada. Mostrar no enlazados/sin resolver; no restar ciegamente contadores de fuentes con pérdidas distintas. |
| `room-conversion` | Salas con un inicio confirmado / salas creadas, **cohorte por fecha de creación**, no fecha de inicio. Por cohorte: iniciadas, WAITING pendientes, cerradas sin iniciar por motivo y perdidas/desconocidas por reinicio/cobertura. Una sala abierta nunca se denomina abandonada. |
| `configuration` | Partidas iniciadas y distribución de campos de snapshot por fecha de inicio; desglose baraja/versiones, composición humana/bots y opciones. No contar cambios de espera o selecciones sin partida. Permitir columnas/desgloses fijos, no cualquier cruce de dimensiones. |
| `duration` | Por motivo terminal confirmado y fecha de final, número con duración válida, suma, media=suma/n, mínimo/máximo. Incluye revisión final; no retención. UNKNOWN tras reinicio aparte, sin imputarle 0 o duración hasta reiniciar. No prometer mediana/percentiles históricos a partir de sumas. |
| `completion` | DECK_COMPLETED / (DECK_COMPLETED + HOST_CANCELLED + NO_ACTIVE_HUMAN_PLAYERS + TECHNICAL_INTERRUPTION confirmados), cohorte por **fecha de inicio** y estado a asOf. Activas, sin inicio registrado y UNRESOLVED_AFTER_RESTART aparte, fuera del denominador. Mostrar cifras de cada motivo y advertencia de posible sesgo si hay pérdidas/desconocidas. |
| `automatic` | Participaciones humanas jugadoras con transición a AUTOMATIC / participaciones humanas jugadoras de partidas iniciadas de la cohorte de inicio. Numerador distinto por gameRef/participationRef, incluidos empatados/no empatados del roster base. No incluye HOST observador ni bots; no etiqueta «abandono voluntario». |

Los informes por cohortes recientes son provisionales y pueden cambiar con inicios/finales posteriores; no confundirlos con actividad ocurrida en esas fechas. No calcular conversión detallada enlazando visitantes entre pestañas o visitas. Un inicio por HTTP/ack/eventos repetidos sigue siendo uno.

**Ejemplo de exactitud:** en un periodo/cohorte con 4 salas creadas, 2 iniciadas, 1 pendiente y 1 cerrada sin iniciar: conversión 2/4=50 %. Si una partida termina normal y otra se cancela, completado 1/2=50 %; las activas de otra cohorte no aumentan ese denominador. Si las dos iniciadas suman 3 participaciones humanas y una pasa a automático: 1/3. Reenviar esos eventos no cambia ninguna cifra. Si falta un hecho base, declarar dato incompleto, no fabricar la sala/inicio para cuadrar.

## 8. Responsabilidades y organización

| Responsabilidad | Capa/piezas afectadas | Dependencias y comprobación |
|---|---|---|
| Selección de hechos y DTO permitidos; referencias acotadas; snapshot/cohortes/reglas de consulta | Aplicación, junto a RoomUseCases/WaitingLifecycle/GameCoordinator; módulos pequeños de analítica | Solo puertos/reloj/tipos puros; sin Node/SQLite/React. No trasladar la analítica a Game o decorar toda emisión de vistas. Pruebas con sink/repositorio sustitutos. |
| `UsageEventSink.tryRecord(event)` | Puerto en aplicación, retorno inmediato con admisión/descartado; implementación segura no lanza al juego | Sin await/IO en la sección decisión→estado→dedupe. No recibe Room/Game o credenciales para serializarlos. Una llamada no se multiplica por receptor. |
| Almacenar hechos y proyecciones; consultas agregadas y mantenimiento | Puertos de aplicación `UsageEventStore`, `UsageReportReader`, `UsageMaintenance` | Contratos de eventos/consultas cerrados, sin SQL/Database en firmas. Separar registro/lectura aunque un mismo adaptador implemente dos puertos. Sin event bus genérico o jerarquías para métricas futuras. |
| Cola/escritor SQLite, consultas, migraciones y copias | Infraestructura; worker dedicado y adaptador SQLite | Worker con mensajes DTO permitidos; SQL preparado, transacciones/índices. Solo aquí archivos/Node/SQLite. El puerto de mantenimiento lleva cortes temporales explícitos. |
| Contratos de ingesta y límites de transporte | `shared/contracts` y adaptador HTTP/socket | Contratos BROWSER separados de eventos internos SERVER. No exponer referencias operativas, resultados agregados privados o SQL en rutas públicas. Integración HTTP real. |
| Hechos de UI y presentación de informes | Cliente auxiliar y comando administrativo, respectivamente | Cliente no decide éxito/inicio/final. Comando llama casos de uso de consulta, nunca tablas directamente. El futuro panel reutilizaría esos casos. |
| Construcción/configuración/ciclo del proceso | Composición y main | Conecta sink nulo o persistente, procesos de entorno, reloj, worker y cierre acotado; dominio y repositorio de juego siguen sin SQLite. |

Revisar imports/ciclos con el verificador vigente y semánticamente quién decide cada hecho. No ocultar SQL o DTO de Room en un puerto para aparentar separación. Definir módulos/funciones y nombres locales libremente dentro de estos límites; no refactorización general ni dependencia externa de analítica.

## 9. Persistencia, resúmenes y conservación

**Propuesta técnica:** aprovechar `node:sqlite` del runtime fijado por el proyecto (**24.19.0**), en worker para no ejecutar operaciones síncronas de DB en el hilo que resuelve plazos/jugadas. La API documentada es release candidate y DatabaseSync es síncrona; registrar esa condición y verificar la versión SQLite efectiva en Windows/Linux al implementar. No añadir otro driver ni actualizar Node por inercia. Referencia: [Node 24.19.0, SQLite](https://nodejs.org/download/release/v24.19.0/docs/api/sqlite.html).

La consulta de solo lectura de esta preparación encontró Node **24.13.0/SQLite 3.50.4** en el PATH general; **no** se usó para probar producto ni se atribuye al runtime fijado. Implementación debe seleccionar 24.19.0 antes de construir/verificar; no cambiar instalaciones globales desde este bloque.

SQLite local, un escritor por entorno; WAL, foreign keys, sentencias preparadas y transacciones cortas. Datos lógicos: eventos con claves únicas; proyecciones mínimas de sala/partida/participación; agregados mensuales/versionados; estado técnico de recogida/mantenimiento. No event sourcing para reconstruir Game. Tablas exactas e índices los decide Implementación contra los contratos/consultas; no JSON libre que acepte campos futuros inadvertidamente.

- **Detalle:** eventos, claves de dedupe, correspondencias estadísticas y proyecciones identificables como máximo 90×24 h desde el hecho correspondiente. Para seguimiento de una sala/partida se fija una ventana de observación máxima de 90 días desde creación/inicio; no renovar indefinidamente un registro individual por consultas o nuevos eventos.
- **Mensual:** 12 meses calendario UTC **incluido el actual**, provisional; eliminar meses anteriores al primero de esos doce. Guardar solo contadores/sumas/min/max y dimensiones fijas acordadas, sin visitId/intentId/roomRef/gameRef/participationRef, nombres ni secuencias individuales.
- **Agregación antes de purgar:** inserción deduplicada y actualización de proyecciones/contribuciones en una transacción. Final de una sala mueve su contribución de pendiente a iniciada/cerrada; no suma otra sala. Igual para partida activa→terminal. Publicar/reemplazar de forma atómica el resumen de la parte consolidada, con versión y marca de consolidación; sumar únicamente la parte detallada aún no consolidada. No sumar de nuevo todo el histórico al repetir un job. Probar transacción interrumpida y repetición tras reinicio.
- Al vencer la ventana con una entidad todavía sin resolución, resumir como **pendiente/activa al corte de observación**, sin identificarla ni llamarla abandonada/terminada. El informe histórico indica esa censura y su fecha; un hecho posterior sin padre retenido no se enlaza inventando un registro anterior. Puede contarse en actividad actual si es verificable, señalando falta de seguimiento de cohorte. Es una limitación explícita de conservar detalle 90 días, no una regla que cierre partidas.
- Mantenimiento diario y al arrancar, con purga adicional programada para el siguiente vencimiento de detalle; no interpretar 90 días como 90 más un día hasta el siguiente job. Corte y progreso persistidos, consultas siempre sujetas al corte. Excluir datos ya consolidados al consultar detalle. Fechas anteriores a cobertura o purgadas no dan ceros ficticios. Si falla agregación, no eliminar su fuente antes de consolidar; corregir dentro del plazo de retención o detener recogida y registrar incumplimiento/degradación, sin convertir la retención máxima en permiso de guardar indefinidamente. Restaurar copias aplica primero mantenimiento antes de abrir consultas. Configurar borrado seguro de celdas SQLite y checkpoint/truncado de WAL tras purga cuando sea posible, comprobando el efecto en los archivos; no confundir un filtro de consulta con eliminación del detalle.

No combinar un resumen de una cohorte con eventos de la misma cohorte ya incluidos. Las pruebas deben permitir recalcular con un conjunto conocido y demostrar igualdad de detalle/resumen en el solapamiento, sin doble conteo de participaciones o duraciones.

## 10. Fallos, límites y calidad de datos

La estadística ofrece **deduplicación de lo recibido, no garantía de entrega exactamente una vez**. El estado de juego y SQLite no comparten una transacción: un corte entre ambos puede perder el evento. No persistir el juego ni bloquearlo para ocultar esa limitación.

Propuesta de límites iniciales verificables:

- Cola total 2048 eventos **y** 2 MiB, incluyendo mensajes en vuelo; reservar 1024 plazas para SERVER. Un batch máximo 64 en vuelo, con confirmación del worker; no llenar una cola ilimitada de MessagePort. Al saturar, descartar primero BROWSER que aún no se haya enviado; si no hay capacidad, contar pérdida del hecho nuevo, sin bloquear juego.
- Vaciar cada 250 ms o al alcanzar batch; reintentos de fallo transitorio acotados a 1/5/30 s y antigüedad máxima 60 s. No reintentar datos inválidos/corrupción. Cierre ordenado con drenaje máximo 2 s; al vencer informar descartes. Caída abrupta puede perder cola y contadores en RAM: informar **pérdida posible, cantidad desconocida**, no un cero exacto.
- Presupuesto por entorno: SQLite 512 MiB, WAL 64 MiB y reserva operativa de espacio 128 MiB. Aviso al 80 %, mantenimiento/checkpoint acotado y pausa de admisión antes del límite; no borrar detalle joven para ganar espacio. Limitar lectores/consultas (5 s y una exportación a la vez) para no retener WAL indefinidamente. Si el disco impide persistir, juego continúa y analítica se marca degradada. Verificar límites reales incluyendo WAL y archivos temporales, no solo tamaño lógico de tablas.
- Estado privado consultable: enabled/disabled/degraded, periodo cubierto, último commit durable, cola, descartes por razón/origen, errores, último mantenimiento/copia y huecos conocidos o posibles por arranque. Registros técnicos con códigos fijos, contadores y entorno/arranque; sin cuerpos, SQL expandido, nombres o error.message externo. Avisos repetidos como máximo una vez/min por causa; usar rotación operativa vigente. No confundir estos errores con acciones/abandono humanos.

Si DB no se abre o una migración falla, arrancar el juego con sink degradado/nulo y diagnóstico operativo visible; no crear silenciosamente una DB vacía que simule historial intacto ni borrar la corrupta. Consultas fallidas devuelven error/calidad no disponible, no un informe vacío exitoso. Durante una pérdida de escritura no reconstruir sesiones o resultados supuestos a partir de logs.

No conocemos: personas únicas, recurrencia, abandono voluntario a partir de automático, visitas bloqueadas/no enviadas, instante exacto de un corte abrupto, por qué alguien no actúa, edad/identidad, dispositivo ni atención. Los datos BROWSER son declaraciones limitadas, susceptibles de pérdidas/manipulación; rate limit no demuestra humanidad o exactitud absoluta.

## 11. Entornos, seguridad, privacidad y copias

Mismo mecanismo/código en pruebas y producción, **archivos/volúmenes, configuración y copias separados**. Entorno obligatorio impuesto desde composición, comprobado contra el metadato del fichero: no reutilizar un fichero de pruebas como producción o aceptar un environment del navegador. No usar NODE_ENV para distinguirlos: el despliegue de Pruebas también lo fija a production.

Recogida desactivada por defecto hasta configuración explícita y revisión previa. Tests/CI/carga usan sink nulo por defecto; pruebas de esta función activan la misma tubería en DB temporal/environment=test y traffic=SYNTHETIC, excluido del informe humano. Ensayos automatizados en Pruebas usan instancia/datos aislados o recogida desactivada; no una cabecera pública que permita marcar/reclasificar hechos del servidor. Identificar y excluir automatizaciones conocidas del procedimiento; no afirmar que se detecta cualquier bot que imite un navegador. Robots que no ejecutan HomeScreen no generan vistas; bots del juego no generan eventos humanos.

Proponer volumen dedicado por entorno en `/var/lib/karta3/usage`, fuera de `/app/dist`, `/media`, barajas, imagen efímera y Git. Mantener contenedor no root/raíz solo lectura, con **solo** ese montaje escribible; directorio 0700 y DB/WAL/SHM 0600, propietario del proceso. Comprobar creación/permisos UID 1000 en Linux y ACL equivalente local. No descargas HTTP de `.sqlite`, `-wal`, `-shm`, backups o exportaciones; revisar fallback SPA para no confundir 200 HTML con acceso autorizado.

**Acceso inicial:** comando fijo autenticado por SSH con clave y autorización administrativa del sistema; cuenta sin ese permiso no puede consultar/ejecutar exportación. Si se delega lectura, permitir solo el comando de informes mediante una regla acotada, sin SQL arbitrario/shell. El comando accede a aplicación/puerto de consultas, nunca presenta tablas. Salidas y CSV en ubicación privada 0600, sin ids detallados; no enlace desde la portada. No se crea API pública de consultas ni se usa cookie HOST como permiso de analista. Futuro panel requerirá autorización administrativa independiente; no se da por resuelta aquí su autenticación web.

**Copia propuesta:** diaria, siete copias rotatorias protegidas y cifradas, al menos una copia fuera del contenedor/disco principal bajo control del autor, sin servicio de analítica externo. Obtener una instantánea consistente mediante Online Backup API; desde ella exportar los agregados de los doce meses a **un archivo nuevo**, incluyendo el mes actual y la contribución del detalle todavía no purgado. Ese archivo final contiene solo resúmenes y cobertura/mantenimiento, sin eventos ni identificadores individuales. No basta con borrar tablas de una copia completa que conserve páginas libres con sus bytes. El intermedio completo es privado, temporal y se elimina al terminar la tarea, sin incorporarlo al archivo de copias. No copiar únicamente el `.sqlite` abierto. Así las copias no prolongan los 90 días de detalle; restaurar advierte de pérdida de detalle no copiado y del intervalo desde la última copia. Al vencer un mes, retirar también copias que lo conserven; no prolongar doce meses por la rotación semanal. Reconciliar cifras pendientes al corte restaurado sin presentarlas como partidas vivas del nuevo proceso. Volumen no es backup; probar integridad/restauración temporal. RPO propuesto 24 h para agregados, sin prometer restauración de partidas vivas o todos los eventos. Procedimiento coherente: [SQLite Online Backup](https://sqlite.org/backup.html) y [WAL](https://www.sqlite.org/wal.html).

**Puerta previa a activación pública:** responsable del tratamiento documentará finalidad/base jurídica, información al usuario, proporcionalidad de ids/plazos, acceso y derechos cuando proceda; revisar RGPD/LSSI y uso de información del terminal, cookies de juego/contexto y posible uso por menores. No afirmar anonimato irreversible por usar UUID o carecer de nombres, ni exención automática por alojamiento propio/sin cookies nuevas. Si la revisión exige consentimiento u otro mecanismo no contemplado, mantener recogida apagada y concretar esa dependencia antes de activar; no instalar un banner o recoger anticipadamente por iniciativa técnica. Referencias oficiales: [RGPD, especialmente arts. 5/6/13/25/32](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=celex:32016R0679), [AEPD, medición de audiencia](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf) y [guía de cookies](https://www.aepd.es/guias/guia-cookies.pdf). No es una conclusión jurídica de exención.

## 12. Consultas y entrega mínima al autor

Comando propuesto `npm run usage:report -- --report <consulta de §7> --from <ISO-UTC> --to <ISO-UTC> --environment <entorno> --format json|csv`. Composición selecciona la DB configurada; el usuario no suministra SQL, rutas arbitrarias o tráfico HUMAN/SYNTHETIC para mezclar informes. Pruebas tienen un comando/montaje explícito de diagnóstico sintético separado. Informe con esquema/versiones y desglose fijo; CSV UTF-8 con cabecera, escape correcto y protección de fórmulas de hoja de cálculo en texto. Exportar **solo agregados**, no log de eventos o participaciones individuales.

Errores administrativos estables: `INVALID_FILTER`, `ENVIRONMENT_MISMATCH`, `INSUFFICIENT_DETAIL` (se piden días que solo tienen resumen), `COLLECTION_DISABLED`, `STORAGE_UNAVAILABLE`, `REPORT_TIMEOUT`, `NOT_AUTHORIZED`; código de salida no cero y mensaje seguro. Una franja parcial ofrece límites válidos, no datos inventados. Recogida disabled no borra el histórico permitido: una consulta puede devolverlo indicando periodos apagados. Filtro de fechas/entorno obligatorio; numerador/denominador presentes también en CSV.

Panel posterior acordado: solo estas consultas, filtro fecha/entorno y CSV, acceso privado autenticado cuando se especifique. No diseñarlo ni exigirlo como criterio de cierre de este incremento.

## 13. Etapas y aceptación prevista

1. **Contrato y almacenamiento aislado:** DTO/puertos/sink nulo, SQLite en worker, dedupe, proyecciones/consultas y retención con datos sintéticos; todavía sin recogida pública.
2. **Instrumentación focal:** tres hechos cliente y transiciones servidor; correlación opcional, fuentes/entornos separados, snapshot, fronteras terminales/reinicio y calidad.
3. **Consulta/operación y regresión:** comando/CSV, volumen/copias/restauración, límites/fallos, pruebas integradas y documentación; recogida desactivada hasta puerta de privacidad/operación. No cerrar B18 solo por insertar eventos.

| Criterio pendiente | Comprobación futura proporcionada |
|---|---|
| A01 — Acceso e intenciones | Portada real, refresh, SPA return, actualización/re-render/StrictMode, acceso directo a sala y healthcheck. Crear/intentar entrar separados, sin formulario añadido ni contar invitado como creación fallida. |
| A02 — Creación/entrada | Dos sesiones, dos pestañas, creación recuperada, código inválido/no disponible/lleno, rechazo validado y éxito. Capturar intento sin nombre/código, mismo envío incierto/replay, nuevo gesto y contadores exactos; datos incompletos visibles. |
| A03 — Unicidad | HTTP/ack/socket perdido, replay y concurrencia no duplican sala/participación/inicio/automático/terminal; reinsertar lote y volver a ejecutar agregación/purga mantiene cifras. Duplicado conflictivo no sobrescribe payload anterior: diagnóstico seguro. |
| A04 — Snapshot completo | Las tres barajas/versiones, ambas modalidades, optimize true/false, host jugador/observador, EASY/HARD mezclados, turn/review/forceTieBreak. Igual snapshot para todos, ajeno a borradores/viewport y sin control individual inventado. |
| A05 — Cohortes/fórmulas | Ejemplo §7, cruce de medianoche/mes/UTC, salas que inician otro día, pendientes y cerradas; activos/desconocidos/denominador cero, sumas/min/max sin promediar medias. Casos fuera de cobertura no se convierten en ceros. |
| A06 — Final y automático | Normal, inactividad, HOST_CANCELLED en turno/revisión/desempate, revisión final debida y parada controlada. Primer timeout no cuenta conversión a automático; segundo una sola participación, bot/observador excluidos. Duración monotónica sin retención y sin duplicar por resultado/F5. |
| A07 — Corte y recuperación | Caída abrupta del proceso propio con partida/espera abiertas, arranque nuevo y evento final faltante: UNKNOWN sin duración inventada; sin nueva regla de finalización o restauración de Game. No adjudicar fallo aislado como final técnico. A→B/resultado anterior T04 intactos. |
| A08 — Privacidad/transporte | Inspección de DB, proyecciones, CSV, logs y mensajes: ausencia de nombres, códigos, manos, ids/credenciales de sesión, IP/UA/referrer/cuerpos y recurrencia. UUID memoria nuevos en F5/documento; participación misma sin crear enlace entre salas. Claves extra/tamaños/orígenes/rate limits y evento SERVER falsificado rechazados. |
| A09 — Entornos/automatización | Pruebas y producción con ficheros distintos; mismo mecanismo con sintéticos y consultas humanas que los excluyen. Fichero equivocado falla sin abrirlo como otro entorno; carga/CI/healthcheck no contaminan cifras humanas. |
| A10 — Retención | Reloj controlado: borde exacto 90 días, cambio de mes/año y doce meses, corte de entidad aún abierta, consolidación antes de borrar, interrupción/reanudación y consultas sin solapamiento. No esperar 90 días reales ni declarar abandono por purga. |
| A11 — Fallos acotados | DB bloqueada/corrupta/solo lectura/disco lleno, worker lento/caído, colas y WAL al límite; juego sigue, tiempos y respuesta de sala conservados, sin colas crecientes o ceros falsos. Drenaje limitado y pérdida desconocida tras kill explicitados. |
| A12 — Operación/consulta | SQLite no público, autenticación/autorización de comando, CSV seguro, montaje/permisos no root, reinicio de contenedor conserva analítica pero pierde estado vivo según MVP; backup/restauración privada de agregados y retención. Windows/local y Linux separados de VPS aún no desplegado. |
| A13 — Arquitectura/regresión | `npm run check`, control de imports/ciclos y revisión semántica. Navegador pertinente sobre compilación vigente: creación/entrada/configuración, humano-bots hasta resultado, timeout, cancelación/T04, recuperación/privacidad y ambas formas de presentación sin cambio. Selección focal justificada, sin repetir por rutina toda la matriz de barajas. |

Pruebas puras/aplicación con puertos sustitutos para fórmulas, dedupe y fallos; integración con **SQLite real temporal** para transacciones/contención/backup; HTTP/Socket.IO reales y navegador para los hechos UI y privacidad. Retención/terminales dirigidos con reloj controlado, distinguiéndolos de un cierre/rearranque real de una instancia propia. Medir que un bloqueo artificial del escritor no detiene un turno real; no usar click forzado o ampliar plazos para superar regresiones. Exigir Linux con runtime fijado y volumen, sin atribuirlo a Windows; publicación y VPS se encargan después.

## 14. Formación, pendientes y cierre

Relación con el [índice del máster](../../../../TFM/Requisitos/MASTER_CONTENIDOS_Y_PROGRESO.md): métricas accionables (convierte, completa, dónde falta confirmación), observabilidad (cobertura/degradación separadas de uso), logging seguro (listas cerradas y sin secretos), persistencia/transacciones/conservación y Clean Architecture (puertos, adaptadores, composición). Las tasas orientan hipótesis, no prueban por sí solas comprensión, causalidad o equilibrio. El índice no proporciona una plantilla/método exacto de lección; no se afirma haberlo reproducido ni se adopta Sentry por aparecer allí. Si el autor quiere ese método concreto, necesitará aportar el material.

**Decisiones cerradas el 18/10:** consultas administrativas/CSV ahora y panel posterior; copias de agregados con pérdida del detalle si se pierde el disco. No queda una elección funcional abierta para comenzar la implementación. Valores operativos de §§3/9–12 se comprobarán como punto de partida. Pendientes antes de activar: revisión de privacidad/base jurídica/información y preparación real de volumen/copias/autorización. Ninguno autoriza ya recogida pública. La única contradicción funcional encontrada —formulario de creación inexistente— está resuelta expresamente por el autor. No se han encontrado preferencias individuales iniciales que deban atribuirse por participación.

**Traslado a Arquitectura/Coordinación antes del cierre:** registrar la autorización ya dada por el autor de SQLite exclusivamente estadístico y volumen privado frente a RAM viva; mapa de puertos/escritor/consulta y autenticación administrativa; alcance de identificadores/privacidad, retención y censura; semántica de reinicios/calidad y ausencia de garantía de entrega; copias solo de agregados, sin recuperación de detalle perdido. Responsable general alineará Infraestructura §§1–4/12/14–15, Aplicación en métricas/permisos informativos y contexto; la organización APP describirá las piezas realmente entregadas, sin modificar reglas de dominio. Implementación devolverá el texto y referencias al autor, sin editar fuentes TFM ni enviar mensajes. Registrar la alineación recibida antes de declarar B18 cerrado/verificado; si el código está entregado antes, distinguir implementación y pruebas técnicas de ese cierre pendiente. Esta tarea documental no bloquea comenzar el desarrollo ya autorizado ni requiere reabrir la decisión de SQLite.

**Autonomía de Implementación:** estructura local, SQL/índices, precisión/formato interno y pruebas equivalentes dentro de estos contratos. Antes de cambiar campos admitidos, denominadores, privacidad, plazos de conservación, comportamiento visible o persistencia de juego, volver al autor. No implementar recurrencia o panel por anticipación.

**Encargo:** [prompt de Implementación por tres etapas](PROMPT_IMPLEMENTACION_BLOQUE_18.md). La activación de recogida pública, publicación y despliegue permanecen fuera de ese encargo.

**Cierre actual:** solo lectura de documentación/código/estado y documentación de esta especificación; consulta de versiones del PATH y fuentes oficiales. No cambios de código, dependencias, barajas, operación o TFM; sin pruebas de producto, captura real de uso, commits, publicación o despliegue. Todos A01–A13 pendientes. Implementación documentará commit/build, pruebas reales/fallos/límites, README/ejemplos seguros y conclusiones para autor/Arquitectura; después se decidirá la activación/entrega operativa.

## 15. Registro de implementación — 18/10/2026

Base efectiva `main 555c50d4dc5146963805503442e08168b55a95b5`. Conservados sin reescritura los tres documentos preparados (este bloque, prompt y proceso), registrados separadamente en `d9262c9`. Implementación en rama local `feat/b18-analitica-basica`; ningún servidor del autor detenido. Inventario previo de los 124 archivos en `playwright-report/b18/barajas-antes.json` (artefacto local ignorado).

Runtime comprobado: `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, Node **24.19.0**, ICU **78.3**, SQLite **3.53.3**, Windows. No se cambia PATH global ni instalaciones. `node:sqlite` es release candidate y síncrono según [documentación oficial de esta versión](https://nodejs.org/download/release/v24.19.0/docs/api/sqlite.html); las operaciones se aíslan en worker. Sin dependencia nueva.

### Etapa 1 — puerta focal ejecutada

Comandos: `npm run typecheck`; `npx vitest run server/infrastructure/usage/sqliteStore.test.ts server/infrastructure/usage/sqliteWorker.test.ts`; `npm run check:architecture`.

Resultado nuevo: **13/13 pruebas, 2 archivos**, SQLite temporal real; tipos correctos y **88 módulos** sin imports prohibidos/ciclos en el árbol de trabajo de ese momento. Comprobado: conflicto sin sobrescritura, rollback inducido antes de commit, 2/4 y 1/2 y 1/3, consolidación repetida/corte exacto, desconocidos de reinicio/censura, doce meses UTC, copias nuevas sin detalle/ids y siete rotatorias cifradas, cola y reserva SERVER, bytes, bloqueo transitorio con reintento y ACL Windows de directorio propio. No acredita Linux, cierre/rearranque real ni todas las degradaciones A11.

Fallos reparados: el filtro admitía detalle en igualdad con el corte de 90 días; se rechaza esa granularidad tras consolidación. La comprobación ACL invocaba `Get-Acl` en Windows PowerShell heredando módulos de PowerShell 7 incompatibles; se usa lectura ACL .NET sin autoload y sin relajar permisos. Dos avisos de lint localizados durante edición reparados; puerta final aún pendiente.

Estado al superar esta primera puerta: etapas 2/3 en desarrollo; **B18 no verificado ni recogida pública activada**. La alineación documental general, Linux y las comprobaciones integradas estaban pendientes. Los resultados posteriores se registran a continuación sin sustituir esta evidencia de etapa.

### Etapas 2 y 3 — entrega técnica local

Código inicial registrado en `341d04d`; reparación de lint de fixture `0eb16bd`; correcciones focales posteriores `167a069`, `08df5b1`, `d59f027`, calidad operativa/partida durable `4e326d6` y privacidad de rutas `1ce58e2`. Implementadas las tres etapas: instrumentación focal, proyecciones/consultas/CSV privados, mantenimiento y copias/restauración de agregados. La referencia general de alineación **no se ha recibido** y no existe runtime Linux disponible aquí. Estado: **implementado/comprobado técnicamente en Windows; alineación documental y verificación Linux pendientes; B18 no cerrado como verificado**. No se activa recogida pública.

**Puerta final nueva, código `1ce58e22dcbb051cfe36e3724798101494b9273d`:** `npm run check`, salida0, **587/587 pruebas en51 archivos**, **92 módulos** sin imports prohibidos/ciclos. Incluye49 pruebas nuevas B18 y538 regresiones ejecutadas de nuevo; no se atribuye evidencia histórica a este bloque. Tipos/lint/build correctos; catálogo generado de tres, sin cambios de contenido. Registro final local ignorado `playwright-report/b18/check-final.log`; ejecuciones anteriores conservadas con su referencia de código.

**Navegador final compilado, Windows/Chrome155.0.8059.80, Playwright1.63.0, dos trabajadores/cero reintentos:**

```text
npm run test:browser -- --workers=2 --retries=0 usage.spec.ts room.spec.ts join.spec.ts configuration.spec.ts cancelGame.spec.ts resultNotice.spec.ts timedRealGame.spec.ts
# 39/39, 1,9 min
npm exec -- playwright test --workers=2 --retries=0 bots.spec.ts format2Presentation.spec.ts timedGame.spec.ts --grep "B09 P2 normal compilado|B15 espera:|B15 frontera medida|B08 T1|B08 T2"
# 8/8, 49.8s; mismo build, sin reconstrucción adicional
```

Instancia propia normal `http://127.0.0.1:60901`, PID18176, recogida off, detenida al finalizar. Las pruebas B18 usan además hijos propios con `environment=test/traffic=SYNTHETIC`; ningún servidor del autor se detuvo. Verificador del arnés compara rutas/SHA de dist-server, dist y catálogo antes/después: **idénticos en ambas selecciones**. No hubo cambios de producto durante estas puertas. `browser-summary.json`, `browser-1.log`, `browser-2.log` y capturas de regresiones permanecen locales/ignorados. No se ejecutó batería completa de navegador ni matriz completa V2 entre etapas.

**Tiempo real separado:** integración HTTP/Socket.IO con SystemClock/TimerScheduler, SQLite bloqueado y activo desconectado: inicio14:36:43.769 UTC, límite14:36:58.769, observado14:36:58.784; movimiento TIMEOUT mientras cola estadística conservaba1 evento/386 bytes. No se avanzó reloj simulado. Regresión Chrome B08 compilada normal: inicio17:24:40.059 UTC, límite17:24:55.059, observación17:24:55.614, recuperación del mismo jugador y contador1. Los bordes de revisión/retención/90 días/meses, edades de cola y timeout de consulta se comprobaron con tiempo controlado; no90 días ni30 minutos reales.

**Procesos reales:** `usageProcess.test.ts` arranca, termina y rearranca procesos compilados propios. Kill abrupto sin final durable → UNKNOWN sin duración inventada; parada controlada → TECHNICAL_INTERRUPTION estadístico. En Windows el arnés privado notifica SIGTERM al manejador dentro del hijo: prueba el cierre/reinicio real y su manejador, **no** una señal POSIX nativa. No incorpora IPC o endpoint de prueba al producto. No restaura partidas/sesiones.

**Fallos y reparaciones registrados durante el desarrollo:**

- Corte exacto90 días; correlación tardía y agregados/restauración del mes actual ajustados sin solapamiento. Diferenciar respuesta de entrada resuelta de NEW_JOIN; resultados faltantes permanecen incompletos.
- ACL Windows: evitar autoload incompatible de módulos PowerShell heredados. Verificados directorio propio y rechazo de herencia abierta; Linux no acreditado por esta prueba.
- Ensayos iniciales de navegador: nombre sintético mayor de16 grafemas y selector de confirmación incorrecto; reparados los datos/selectores **nuevos**, sin cambiar regla ni aserciones anteriores.
- Orden del fixture con timestamps iguales: inspección usa orden de inserción, no UUID aleatorio. Edad de cola se controla en el borde real de60 s, evitando una carrera de1 ms del ensayo inicial.
- Fixture de worker sin respuesta necesitaba copiar su nueva dependencia privada; control de ruta movido antes de finally para cumplir lint. Conserva test de5 s y no devuelve informe vacío.
- Revisión semántica: contribuciones/fórmulas en aplicación; lector administrativo realmente solo lectura; lease de escritor; copia de lectura sin modificar arranque vivo; no pausar ingesta por contención de un informe/copia. Parámetros operativos de B18 sin cambios; margen previo de páginas/índices y heap128 MiB se documentan como detalles técnicos.
- Contratos internos estrictos: números como cadenas no se convierten; rechazo seguro de entrada malformada sin requestId y pérdida diagnosticada al saturar el mapa acotado. Directorios estáticos prohibidos también con variantes de mayúsculas en Windows.
- Una ejecución intermedia detectó EPERM al borrar la instalación temporal antes de terminar el cierre nativo del worker en Windows. La fixture espera la salida nativa y limpieza de su lease después del cierre acotado; no aumenta el drenaje de producto ni cambia aserciones del juego. Reparación `d59f027`; puerta final correcta.
- Salud técnica privada con instantánea fechada de cola/bytes/descartes, validación cerrada y señal de antigüedad superior a60 s. Publicación al cambiar con una sola actualización pendiente, fuera de la decisión síncrona. No añade un evento de catálogo ni transmite identificadores. El informe no la presenta como estado en vivo ni garantía de ausencia de pérdidas.
- Primera selección de38 pasó con NODE_ENV=test heredado por Vite, produciendo bundle de desarrollo distinto (577,62 kB frente339,53 kB). **No se acredita como puerta final**. Se corrigió únicamente el arnés ignorado, reconstruyó producción y repitió con huellas idénticas. Las ampliaciones focales posteriores concluyen en la selección final39+8 sobre1ce58e2; los registros intermedios conservan su SHA (0eb16bd/d59f027/4e326d6). Diagnóstico preservado en `browser-inicial-node-env-test.log` y `browser-summary-inicial-node-env-test.json`.

### Resultado por criterio

| Criterio | Evidencia nueva ejecutada / alcance y límite |
|---|---|
| A01 | Chrome B18: documento/F5/SPA, dos sesiones, pestaña directa a sala, recuperación sin nueva portada. Unidad StrictMode/rerender/rotación30 min/12 h y reintento único. Normal off no genera tráfico. |
| A02 | HTTP/Socket.IO reales: crear/recuperar, entradas nuevas/existentes/rechazadas, contexto inválido descartado; replay de aceptación/rechazo y ack ignorado. Regresiones compiladas de capacidad/código/configuración. Intención sin resultado no se clasifica fallo. |
| A03 | SQLite real: id/claves lógicas/conflicto sin sobrescritura, rollback inducido/repetición/purga repetida; inicio concurrente de dos sockets host, hechos únicos y emisiones fallidas dirigidas. No demuestra entrega exactamente una vez entre RAM y SQL. |
| A04 | Snapshot de las tres copias aprobadas con esquemas/versiones actuales, host jugador/observador, modos/optimización; caso de aplicación EASY/HARD y configuración completa aceptada. Sin datos ocultos ni borradores. |
| A05 | Dataset conocido2/4,1/2,1/3; sumas/media/min/max; entrada resuelta no equivale a éxito; cruce UTC de mes/medianoche, cobertura/denominador cero/null y censura. Tiempo controlado. |
| A06 | Acciones legales hasta fin ordinario, inactividad/automático, cancelación en turno/revisión/final/desempate y límite−1/0/+1 ms con callbacks/emit perdidos; parada controlada. Además, Chrome sintético con dos humanos y bot HARD/adaptadores normales hasta fin: un único terminal durable, duración positiva,45 puntos/30 jugadas humanas, F5 y otra sala. Revisión forma parte de duración; lectura/retención no añaden final. |
| A07 | Dos procesos propios compilados con corte/rearranque real, UNKNOWN sin duración y RAM vacía; regresiones T04/B13 ordinario/automático/retorno/F5/otra sala. No señal POSIX en Windows. |
| A08 | DTO runtime cerrados, origen/tamaño/contexto/rate limits, falsificación SERVER rechazada; inspección DB/hechos/ack/vistas/CSV y fuente de logs sin datos excluidos. HTTP404 de privados sin fallback, cookies/LS/sessionStorage sin identificadores analíticos. No auditoría jurídica ni de toda la red del VPS. |
| A09 | Archivo/metadatos separados por entorno y tráfico; mismatch no aceptado, sintéticos excluidos de lectura HUMAN. Sink nulo por defecto en automatizaciones; normal compilado sin env activa ni hechos. No detección universal de robots. |
| A10 | SQLite real, reloj controlado:90 días exactos,12 meses/cambio de año, consolidación antes de borrar, rollback/repetición, cohorte abierta censurada, meses sin duplicación. SHA/UUID ausentes de bytes del archivo purgado y WAL truncado. Copias nuevas sin eventos/proyecciones/IDs. No borrado físico forense del soporte. |
| A11 | Cola2048/2 MiB y reserva, edad60 s controlada, DB bloqueada con reintentos y juego/turno real15 s, corrupción intacta, caída de worker real, DB/WAL con presupuestos de64 KiB en fixture (defaults512/64 MiB intactos) que pausan antes de batch; consulta5 s con worker sustituto sin respuesta. Salud técnica fechada/descartes y antigüedad explícitos. Sonda SQLite real query_only rechaza escritura y conserva el evento anterior. No disco físico lleno ni capacidad512 MiB/VPS demostrados. |
| A12 | Comando fijo/CSV real en proceso propio, autorización ACL Windows positiva/negativa, lector sin mutación, backup/restauración SQLite nueva/AES-GCM/7 rotatorias/caducidad mensual. Compose validado sintácticamente. **Pendientes Linux no root/volumen real, SSH/delegación/tarea/copias fuera de disco y supervisión operativa.** |
| A13 | Check587 y92 módulos;47 Chrome seleccionados sobre build idéntico, partida completa humano/EASY/HARD normal y partida completa con SQLite sintético, normal/compacta/frontera1367–1368 y360/390/1280, privacidad/recuperación. Revisión semántica en mapa APP. Sin cambios en Game, presentación ni124 archivos aprobados. No aprobación humana/dispositivos físicos/C09–C10 completos. |

### Cierre y traslado

Integridad124/124 antes/APP/Git contra base: [inventario y huellas](evidencias/B18/integridad.json). [Resumen de evidencia](evidencias/B18/README.md). [Guía y recorrido manual sintético](../operacion/ANALITICA_USO.md). [Texto para el autor → Arquitectura/Coordinación](evidencias/B18/TRASLADO_ARQUITECTURA.md): excepción estadística, worker/lector/volumen, snapshot compartido, cohortes/unknown, privacidad, retención y copias exclusivamente agregadas. **Referencia de alineación recibida: pendiente.** No se han editado fuentes TFM.

Linux no ejecutado: `docker info` no encuentra `dockerDesktopLinuxEngine`; WSL no proporciona aquí un entorno utilizable. No se instala ni arranca infraestructura ajena para sortearlo. Son pendientes reales que impiden el cierre global como verificado. El autor debe preparar/validar Linux y operación externa, revisión de privacidad e información, acceso administrativo real y devolución de alineación. Recorridos manuales humanos de B18 no realizados; instrucciones listas. Datos de pruebas exclusivamente sintéticos y temporales, sin DB/CSV/secreto en Git.

**Entrega local sin push/PR/GHCR/despliegue; recogida pública OFF al terminar.** No hay panel ni modo HUMAN habilitable desde configuración actual. Salas/partidas/sesiones siguen en RAM; C09–C10 permanecen parciales.

## Recepción de Arquitectura y preparación de publicación — 18/10/2026

Referencia general recibida del autor y contrastada en lectura: **18/10/2026**, Aplicación §16.1 y evidencia §17.12; Infraestructura §§1–4, 12.1, 14.1, 15.1–15.2 y evidencia §16.9. Alineación recibida, sin modificar TFM ni el contexto de coordinación. Los textos de cierre anteriores que indican recepción pendiente son históricos de su fecha.

Windows conserva 587/587,51 archivos/92 módulos y39/39+8/8 seleccionados con dos trabajadores, no batería completa ni Linux. El autor comunica partidas manuales en instancia sintética; coordinación confirmó dos salas/inicios/finales, configuración y duraciones en informes privados. Es evidencia recibida local/sintética, no consulta nueva de este hilo al histórico del autor ni operación pública.

La publicación verificará primero Linux focal B18 y la misma imagen con UID1000, raíz read-only, volumen privado, permisos, administración solo lectura, parada POSIX/recreación, persistencia estadística sin RAM jugable, copia cifrada y restauración aislada. Después CI completa de fuente y squash/main, con un trabajador/cero reintentos. No se declara superada una puerta por describirla; resultados y fallos reales se enlazarán desde el registro operativo y la PR.

Siguen pendientes privacidad/información, habilitación expresa futura de recogida real, acceso administrativo en VPS, copia externa/supervisión y ensayo del responsable. Sin modo HUMAN habilitado, GHCR, VPS, dashboard, métricas nuevas o cambios editoriales. B18 no se declara verificado globalmente ni operativo públicamente.

## Incidencia Linux y reparación de portabilidad — 18/10/2026

Primera puerta Linux39161057170/fuente3d043d8: check587/587 en51 archivos/93 módulos (92 entregados+verificador), Chrome B18 **4/4 en23,6s**. Imagen construida, sharp/solo lectura/HTTPS y fase seed correctas, Node24.19.0/SQLite3.53.3/UID1000/modos0700–0600. Parada POSIX controlada/recreación conserva estadísticas y registra TECHNICAL_INTERRUPTION, RAM vacía. Tras KILL y recreación: USAGE_STORAGE_UNAVAILABLE, sujeto ACTIVE frente UNRESOLVED_AFTER_RESTART esperado; puerta fallida, sin CI completa/integración. Logs/reportes/OCI fallido conservados en APP/verificacion-b18-20261018/linux-focal-39161057170; no candidato aprobado.

Causa técnica: la lease solo comprobaba PID; los namespaces Docker reutilizan números de proceso tras recreación, confundiendo un escritor muerto con el nuevo proceso. Reparación conserva exclusión y locks incompletos/antiguos con PID vivo: Linux registra identidad técnica de boot/namespace/inicio del proceso y solo recupera el propietario demostrado distinto. No identificadores de visitantes, eventos, retención, fórmulas o reglas nuevos. Lector y escritor usan el mismo control. Regresiones nuevas: propietario vivo/legacy no se roba y PID reutilizado con identidad distinta se recupera. La sonda conserva solo booleanos de reutilización/cambio, nunca la lease o token. Restauración exige igualdad exacta del contador del origen, no solo existencia de agregado.

Verificación local focal inicial aislada:10/12, EPERM de ACL en temporales sandbox y lector STORAGE_UNAVAILABLE; se conserva log y se comprueba fuera de ese aislamiento sin modificar criterios. Resultado posterior se registra por separado. Linux pendiente de nueva puerta justificada por esta reparación; no relanzar el HEAD fallido sin cambio.

La comprobación focal Windows fuera del aislamiento pasó **12/12 en3,65s** sobre el build reparado; el intento10/12 por ACL sandbox permanece histórico. Esta selección no acredita Linux ni batería completa.

Ampliación de verificación dentro del contrato: la pila CI usará también compose.usage.yaml (test/off fijo), y otra recreación propia montará el volumen estadístico físicamente read-only. Se exige error administrativo seguro, DB inalterada, recogida deshabilitada y creación de sala válida; no cambia el comportamiento de producto para pasar. Se conserva el presupuesto vigente. Estas comprobaciones todavía no se acreditan hasta una ejecución Linux sobre su fuente.

## Cierre focal Linux previo a CI completa — 18/10/2026

- Intento39161057170/3d043d8:587/51/93 y4/4 Chrome23,6s, pero imagen fallida tras KILL por lease PID; se conserva como diagnóstico, no candidato aprobado.
- Reparación39161576279/e111df4:589/51/93 y4/4 Chrome27,662665s; imagen215s, paso157s; señales/volumen/backup/restore correctos.
- Puerta final39161953043/d73097f:589/51/93 y4/4 Chrome32,3s; Compose con montaje usage y off fijo, todos los controles nuevos correctos. HTTPS Chrome1/1 en4,7s. Informes, resultados resumidos y logs descargados en APP/verificacion-b18-20261018 por ejecución.

Linux real: Node24.19.0/SQLite3.53.3, UID1000, raíz read-only, red ninguna/sin puertos para las instancias sintéticas, volumen0700/archivos0600, acceso denegadoUID1001 y doce rutas privadas404. Consulta/copia de solo lectura sin cambiar hechos/arranque vivo; informe humano no abre sintéticos y entorno erróneo falla. SIGTERM y recreación conservan estadística/TECHNICAL_INTERRUPTION; KILL y recreación conservan histórico/UNKNOWN sin duración; juego/sesiones RAM vacíos. Reutilización de PID controlada observada y cubierta también por regresión Linux de identidad distinta.

Copia K3AGG1/AES-GCM privada sin UUID/detalle, restauración en otro volumen con mismo contador, cero eventos/subjects y sin salud volátil. Rechazo de clave incorrecta y destino existente. Volumen físicamente read-only: error seguro, DB inalterada, recogida off y sala creada correctamente. No se prueba aquí disco físicamente lleno, capacidad VPS,90d reales,5s de SQL lento real o recuperación exactamente una vez. Límites/retención/rotación/fallos mediante SQLite y reloj/fixtures declarados en B18, reejecutados en el check Linux.

e111df4 conserva contrato del bloqueo: propietario vivo/legacy dudoso no se roba; Linux identifica proceso con boot/namespace/inicio. Es portabilidad del adaptador, no identidad estadística nueva. Windows focal12/12 fuera sandbox; intento10/12 por permisos del sandbox conservado. Montaje y verificadores posteriores no alteran producto.124 huellas/versiones conservadas. Fuente recibida archivada en etiqueta publicada archivo/2026-10-18/b18-fuente-original→fedd873; reserva4516d23 intacta.

La versión definitiva añade solo este cierre documental a d73097f. La CI completa sobre ese HEAD se solicita sin filtro y debe ejecutar196 recorridos/24 archivos,589 pruebas/51 archivos/93 módulos e imagen Linux. Sin presupuesto ampliado, tolerancias mayores, aserciones reducidas o reintentos nuevos. El cierre fuente/squash/main/clon/OCI se registra en la PR, sin commits solo para anotar el SHA integrado.

## Corrección de recuperación autorizada por el autor — 18/10/2026

CI global39162421739/65efd1a: check589/51/93 e imagen correctos; **195/196 Chrome**,1490,078997s, sin omitidos/flaky/reintentos. Fallo B06-17/E7: mesa antigua desconectada tras reinicio, Crear sala no reaparece. Presupuesto suficiente: Chrome24min50,079 dentro30, trabajo27min25 dentro35; no ampliación de límites. Reportes/contexto/OCI conservados, sin candidato final aprobado.

El cierre B18 llamaba a disconnectSockets(true); el servidor Socket.IO recorre cada namespace y emite DISCONNECT antes de cerrar cliente. La librería cliente procesa io server disconnect, destruye sus suscripciones de reconexión y deja active=false; el manejador de UI solo muestra desconectado. El contexto de error muestra esa mesa inmóvil; no es prueba a corregir con más espera. Alternativas presentadas: cierre de transporte del servidor, manejo cliente más amplio o traslado a Implementación.

**Autorización expresa recibida en este hilo:** «Corregir el cierre del servidor, conservando reconexión y drenaje estadístico (recomendado)». Se sustituye únicamente el cierre voluntario de namespace por cierre Engine.IO del transporte, manteniendo controlledStop, dispose, servidor HTTP, drenaje estadístico máximo2s y salida. No reglas, identidad/privacidad, estadísticas o retención nuevas; no cambio de cliente/reintentos. La prueba de proceso controlado mantiene el socket hasta parar el hijo y exige que el motivo no sea io server disconnect y que la reconexión siga activa, antes de su limpieza propia. B06 conserva todas sus aserciones.

Puerta siguiente: Linux focal B06-17/E7+los4 B18, con imagen y controles de volumen/copia. Solo después completa del HEAD final. No ejecución global ciega del HEAD fallido. Main remoto555c50d; main local d9262c9 (preparación original, ancestro conservado de la rama y de la etiqueta fedd873), sin actualizar o sobrescribir. La mención previa a main555c50d se refería a la base/remoto; se precisa su estado local real. Reserva4516d23 intacta, sin aplicar. Sin HUMAN/GHCR/VPS.

Puerta focal Windows posterior: build correcto, **3/3 de usageProcess.test.ts en22,32s**, incluida preservación de active/reconexión tras parada y terminal estadístico único. No acredita señal POSIX Windows; Linux focal5 e imagen se ejecutan a continuación. El main local d9262c9 está confirmado como ancestro de la fuente y de su etiqueta original; no hay trabajo local desconocido que absorber.

Precisación de esa evidencia Windows: el intento de22,32s comenzó antes de terminar el build; se conserva como intermedio, sin acreditarlo como verificación estable del compilado final. Tras finalizar el build se repite únicamente esa selección: **3/3 en15,38s**, con todas las huellas de dist/dist-server idénticas antes y después. Log y huellas en APP/verificacion-b18-20261018/reconexion-focal-windows-estable.log y reconexion-build-estable-huellas.json. No se repite otra batería local completa.

Puerta Linux de la reparación: [39165051205](https://github.com/adriancapilla/karta3/actions/runs/39165051205),29083ff, **589/51/93 y5/5 Chrome en39,614512s**, B06-17/E7 y cuatro B18, worker1/retries0/omitidos0/flaky0. Imagen263s/paso192s, HTTPS1/1 en4,6s, permisos/volumen privado, SIGTERM/KILL y copia cifrada/restauración aislada correctos. El KILL observó PID reutilizado/identidad distinta y recuperó UNKNOWN; parada controlada conserva TECHNICAL_INTERRUPTION. Mismo volumen conserva estadística y no juego RAM. Volumen físicamente read-only conserva DB, off y creación de sala. La puerta no sustituye CI completa; fuente final, squash/main/clon y candidato final se documentarán en PR #14 y cierre de ejecución, sin otra modificación funcional.
