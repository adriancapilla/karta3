# B07 — Partida manual completa con humanos

**Estado:** implementado y verificado localmente el 04/10/2026; evidencia y límites en §9.1. Revisión manual humana B07 pendiente.

**Fecha y responsable del acuerdo:** 04/10/2026, Adrian, mediante el diálogo SDD.

**Tipo:** incremento funcional; ejecución humana completa sin temporización de turno.

## 1. Base y referencias

**Base efectiva comprobada antes de editar código (04/10/2026):** rama B06 y HEAD `f3aca75676c4b3590b875d4c49aa48dfd219eb29`, main `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`. Únicos cambios locales: esta especificación, prompt B07 y proceso SDD; conservados. Se crea `feat/b07-partida-manual-completa` desde la entrega B06. `npm run check`: salida 0, 249/249 pruebas en 24 archivos (11,70 s), tipos/lint/build correctos y 50 módulos sin imports prohibidos/ciclos. Evidencia de base, no de B07. Entorno Windows/PowerShell, Node 24.13.0 y npm 11.6.2. Se conservan huellas de entrada de TFM y de genérica para comparar al cierre; no se editarán esas fuentes.

Observación local: rama `feat/b06-inicio-mesa-inicial`, HEAD `f3aca75676c4b3590b875d4c49aa48dfd219eb29`; main permanece en `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`. Árbol limpio antes de preparar B07. B06 y genérica formato 1/contenido 2 disponible están presentes. **La implementación B07 debe partir de una base que contenga B06, no del main anterior.** Conservar documentos y cambios existentes.

Referencias consultadas:

- [AGENTS](../../AGENTS.md), [proceso SDD](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) y [organización/dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), incluido incremento B06.
- [B06 y cierre](BLOQUE_06_INICIO_Y_MESA_INICIAL.md), `shared/contracts/{room,game}.ts` y componentes/casos de uso vigentes; [B03](BLOQUE_03_CICLO_VIDA_ESPERA.md), [B04](BLOQUE_04_CARGA_BARAJAS.md), [B05](BLOQUE_05_CONFIGURACION_SALA.md), [activación](ACTIVACION_GENERICA_V2.md) y [contrato de barajas](../contratos/CONTRATO_BARAJAS_V1.md).
- [Contexto](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), §9: B07 manual, dependencia B06 y reparto documental.
- [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), §§6–17, 21–26 y P-01: orden, jugadas, resolución, reposición, fase final, clasificación y desempate.
- [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§7–8, 10–16: interacción, revisión, recuperación, resultados y consistencia.
- [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §§5–9: mensajes por sesión, tiempos, memoria y contenidos.

El cierre B06 acredita sus pruebas locales —249/249, 47/47 navegador y 50 módulos— y coordinación registra la prueba manual del autor. Se cita evidencia histórica, no una ejecución de B07 ni repetición en este hilo.

## 2. Objetivo y alcance confirmado

Completar con 2–5 humanos la partida que B06 inicia: apertura, jugadas, resolución, reposición, fase final, desempate opcional y resultados. El anfitrión puede jugar u observar; se conserva la preparación fijada y la autoridad del servidor.

Incluye revisión configurada de ronda, también cero, y conservación de resultados durante 30 minutos. Son plazos de aplicación distintos del turno. La partida terminada permite volver al inicio y crear otra sala sin reiniciar el servidor ni introducir revancha.

**Fuera:** límite/cuenta atrás de turno, timeouts, automático, retirada por ausencia, vigilancia de dos minutos sin progreso, bots, visualización reducida/ampliada configurable, rediseño, contenido editorial y despliegue. Las opciones existentes de turno/desempate/revisión no cambian; `turnTimeout` se conserva pero no se ejecuta todavía. No se añade opción permanente de modo manual.

Mensaje visible durante el juego: **«En esta versión no hay límite de tiempo por turno. Si alguien deja de jugar, la partida espera a que vuelva.»** No mostrar un reloj de turno detenido ni simular su vencimiento. B03 continúa exclusivamente en las esperas; perder conexiones durante la partida conserva identidades, orden, manos y control humano B06.

## 3. Recorrido y decisiones de interacción

### 3.1 Apertura y jugada

Acuerdos del autor, 04/10/2026:

- Cada apertura nueva comienza sin carta ni dirección predeterminadas. Ambos órdenes son válidos: ALTO/BAJO → carta y carta → ALTO/BAJO. Completar ambas envía inmediatamente; no hay botón de confirmar.
- Dirección parcial comunicada y aceptada en servidor, modificable mientras no se acepte la apertura completa. Es privada para el abridor y sus pestañas. Los demás conocen la dirección al aceptar la jugada completa.
- Carta elegida primero: selección local de esa pestaña, modificable y no enviada como parcial. Recargar/reconectar recupera la dirección aceptada; no reconstruye una selección local perdida ni juega automáticamente. La otra pestaña tampoco recibe esa carta elegida.
- Completar apertura es una operación de jugada con carta y dirección explícitas. La dirección parcial no fija por sí sola la dirección oficial de `Round` ni avanza turno/estado de jugadas.
- Para los demás, pulsar una carta propia durante su turno envía inmediatamente esa carta. `Detalles` nunca juega. Antes del turno, revisión u observación no se permite elegir una carta para enviarla después.

Reutilizar `GameScreen`, `GameCard` y Detalles: controles ALTO/BAJO en el panel de estado, superficie de carta accionable accesible separada de Detalles, selección local visible y estado pendiente distinto del aceptado. Lista en orden base, marca «Juega [nombre]», abridor, atributo, dirección oficial, puntuaciones, ronda/mazo e indicador. Mantener ambos valores Jugable/Dato y unidades del contrato; el atributo destacado es el de ronda, no el `roundAttribute` de una mano.

No se añade contador público de cartas por jugador. La mano visible varía durante fase final y desempate; la pista móvil no puede prometer siempre tres cartas. Conserva adquisición y desplazamiento horizontal contenido, sin ordenar por valor. Observador y jugadores no participantes del desempate consultan la mesa pública sin controles de juego; solo los empatados reciben nueva mano de desempate.

Un envío pendiente bloquea duplicación local; perder confirmación exige recuperar contexto antes de reintentar el mismo ID. Ninguna acción se encola para enviarla al reconectar. Un rechazo no elimina una carta de la mano ni avanza visualmente el turno; se aplica la vista autorizada y se comunica el motivo. Una selección local solo puede conservarse si siguen vigentes partida, ronda, turno y pertenencia; cambiar cualquiera la limpia. Detalles/foco/desplazamiento no se pierden por presencia o puntuación remotas. Un gesto local que completa ambas selecciones dispara la apertura; recibir una dirección desde otra pestaña o una vista de recuperación no dispara por sí solo una carta local pendiente. Al recargar no hay carta parcial local que recuperar.

### 3.2 Revisión y comunicación de ronda

Al resolver se muestran cartas jugadas, ranking por valor activo, ganador, puntuaciones actualizadas y siguiente abridor cuando exista. Las cartas son representación de la ronda resuelta, no nuevas cartas disponibles. Durante la revisión ningún participante juega la siguiente ronda.

El autor elige **aviso breve, sin resumen persistente**. Reutilizar duración breve de cinco segundos del cliente; aviso de ronda base «Ronda X: ganó [nombre] · +N puntos · abre [nombre]» cuando exista siguiente abridor. En última ronda base omitir «abre» y anunciar fin base/desempate según corresponda. En desempate «[nombre] ganó el desempate», sin puntos añadidos ni siguiente abridor.

Con revisión positiva se mantiene el resultado completo en la zona de cartas jugadas hasta vencer. Con cero se comunica el resultado y se habilita enseguida la siguiente etapa; el aviso breve no retrasa ni bloquea el turno. No mantener después un panel de última ronda ni reanunciar resultados por F5/reconexión. El aviso se deduplica por resolución; una recuperación durante revisión sí muestra su resultado y tiempo vigente, sin reiniciar el plazo.

El autor confirma cuenta atrás **solo de revisión**: «Revisión de ronda · siguiente etapa en 00:05» en el panel de estado; con cero no aparece contador. Se estima con referencia del servidor, sin anunciar cada segundo al lector de pantalla. Llegar a cero no autoriza al cliente a jugar: espera la transición aceptada. La duración no depende de que una pantalla confirme haber leído el resultado. Si hay corte de red, conservar el aviso de conexión y recuperar el estado al volver.

### 3.3 Resultados y retorno

Aplicación §12 y dominio §24 ya fijan puntuaciones, puestos y ganadores. Mostrar todos los jugadores con sus puntos, puestos y victoria normal/compartida/desempate; el anfitrión observador aparece aparte, sin puesto ni puntos de jugador. No revelar manos, mazo ni paquetes completos al terminar.

El autor confirma pantalla específica **«Partida terminada»**, sustituyendo la mesa: tabla de clasificación en escritorio y filas compactas en móvil, victoria destacada y observador aparte. Se mueve el foco al título una vez al entrar; actualizaciones/consultas no lo vuelven a mover. Se retiran controles, mano y selecciones de juego. Sin desempate, ganadores máximos compartidos; con desempate, vencedor primero y marcado «Ganador», demás empatados mantienen puesto 1 y puestos posteriores se conservan. La posición numérica oficial sigue siendo la de puntos base.

«Volver al inicio» es inmediato, sin confirmación de cierre: todas las pestañas de esa sesión vuelven a portada. Libera solo su vinculación, permite crear/entrar en otra sala y no afecta al resultado de los demás. La portada muestra **«Ver último resultado»** mientras exista su conservación original de 30 minutos. Consultarlo es lectura, no una reincorporación ni renovación; no ofrece historial permanente. No hay reinicio/revancha dentro de la sala ni orden libre del anfitrión para terminar una partida activa.

## 4. Reglas y etapas internas comprobables

Las reglas siguientes concretan transiciones necesarias; sus definiciones se mantienen en las fuentes citadas, no se introducen variantes.

| Etapa interna | Entrega comprobable | Regla y límite |
|---|---|---|
| M1 — Jugadas | Abridor en ambos órdenes, dirección privada, mano/turno validado y una aceptación por jugador. | Dominio §§10–14, aplicación §8. Todos los modos de jugada entregados son `MANUAL`. No temporizadores de turno. |
| M2 — Resolución/reposición | Ranking, adjudicación, puntos, revisión y siguiente ronda circular. | Dominio §§14–17. Primero gana N cartas; segundo abre. Reponer desde segundo circularmente; nuevas adquisiciones al final de mano. |
| M3 — Fase final | Entrada precisa, atributo conservado y tres rondas sin reponer. | Dominio §21. Una carta en robo y tres por mano antes de abrir; extraer esa indicadora una sola vez. Cada ronda vuelve a elegir dirección. |
| M4 — Desempate/resultados | Única ronda adicional cuando corresponda, clasificación, recuperación, expiración y otra sala. | Dominio §§22–24, aplicación §§10–12. Desempate no suma puntos ni cartas ganadas; revisión final antes de presentar resultados. |

Comprobar cada etapa con reglas puras y casos de uso antes de extender la siguiente; todas pertenecen a este bloque y al mismo cierre. No son otros bloques ni autorizan una publicación intermedia.

Orden base inmutable; orden circular de jugadas desde abridor. Mantener lista visual estable entre rondas. El primero del orden base abre inicialmente; anfitrión jugador permanece al final. La comparación usa `playValue` del atributo activo según HIGH/LOW; no usa `displayValue` y no admite empates de ronda en una baraja válida.

Adjudicar las cartas jugadas y puntos una vez al resolver. Aplicación conserva resultado público para revisión y controla cuándo habilitar la siguiente etapa. Para concretar el contrato interno, la reposición y preparación de la siguiente ronda se ejecutan una sola vez al avanzar tras revisión; durante esta las manos reflejan las cartas restantes, sin acciones habilitadas. Si Game ya ha decidido fin o acceso a desempate, esa decisión no habilita acciones ni presenta clasificación antes de terminar revisión.

Las indicadoras normales pasan al descarte una vez. La indicadora final se mantiene como indicadora durante las tres rondas y se descarta una sola vez al completar su función. Sus representaciones/referencias de lectura no constituyen ubicaciones adicionales. Cada una de las 58 cartas tiene exactamente un propietario lógico después de toda transición, incluso durante revisión.

Comprobaciones derivadas para partida normal completa:

| Jugadores | Rondas normales | Rondas finales | Indicadoras descartadas | Cartas ganadas/puntos totales |
|---|---|---|---|---|
| 2 | 17 | 3 | 18 | 40 |
| 3 | 12 | 3 | 13 | 45 |
| 4 | 9 | 3 | 10 | 48 |
| 5 | 7 | 3 | 8 | 50 |

Desempate: barajar en servidor solo las indicadoras descartadas, incluida final; empatados en cabeza reciben `min(3, floor((D−1)/E))` cartas cada uno en adquisición, quedan indicador y cartas no utilizadas. Abre primero de empatados según orden base; solo una ronda circular, sin reposición ni siguiente abridor. Las cartas de desempate salen del descarte y se distinguen de `wonCards`; puntos/puestos base permanecen fijos. El ganador se presenta primero entre empatados en cabeza, sin renumerar puestos. No hay humanos automáticos ni fin por ausencia en B07.

**Incoherencia de ejemplo a trasladar a Arquitectura:** dominio §24.2 ejemplifica cuatro jugadores a 12 y otro a 2 con cinco participantes. Es incompatible con adjudicar cinco cartas por ronda: esos puntos son múltiplos de cinco. No cambiar puntuación ni desempate para reproducirlo. Una partida normal completa de cinco tiene diez rondas; cinco empatados a 10 sí es un ejemplo alcanzable y deja una carta de desempate por persona. Mantener fórmula general; no acreditar como partida completa alcanzable un estado artificial del ejemplo. La corrección de TFM corresponde a su responsable.

## 5. Contratos mínimos y estado

### 5.1 Acciones de juego

Conservar HTTP de recuperación, `room:resume`, `room:state`, sesión anónima, permisos/catálogo B04–B06 y envolturas `SocketAck`. Añadir estas acciones Socket.IO autenticadas:

| Evento | Entrada exacta | Efecto autorizado |
|---|---|---|
| `game:opening-direction` | `{ requestId, roomId, gameId, roundNumber, turnId, direction }` | Solo abridor de turno aún incompleto; direction HIGH/LOW. Conserva parcial privada o sustituye por otra, sin jugar ni avanzar. |
| `game:play` | `{ requestId, roomId, gameId, roundNumber, turnId, cardId, direction }` | Jugador propio de turno. Para abridor direction HIGH/LOW explícita; para los demás `null`. Aplicar carta y apertura completas atómicamente. |

IDs: textos no vacíos, hasta 100 caracteres como B06; `roundNumber` entero positivo, `direction` enum exacto o null según acción. Rechazar propiedades adicionales, tipos incorrectos, identidad/tiempo/valores proporcionados por navegador. Identidad exclusivamente de cookie/socket, no de nombre o un playerId enviado.

Éxito de acciones: `SocketAck<RoomResponse>` vigente, `{ ok: true, room }`, con vista propia actual de partida o resultado si se recupera una aceptación anterior tras el fin. Error: `{ ok: false, error: { code, message } }`. Una solicitud nueva después de terminar no juega y devuelve GAME_FINISHED. No se añade endpoint HTTP de jugada ni operación pública de avanzar revisión/forzar fin.

`turnId` se asigna estable a una oportunidad concreta de actuar y nunca se reutiliza en la partida. Puede derivarse en servidor de Game/ronda/posición; no requiere entidad Turn rica ni entropía. Una selección parcial no lo cambia. Abrir otro turno/ronda lo cambia; durante revisión no existe turno accionable. El desempate recibe un número de ronda nuevo y contexto distinto, sin reiniciar la numeración de la partida.

### 5.2 Vista de partida por destinatario

Ampliar unión B06, manteniendo WAITING intacto. En IN_GAME conservar id/código/revisión, miembros, configuración y ficha segura. `game.execution` pasa a `MANUAL_WITHOUT_TURN_TIMEOUT`, capacidad de este incremento y no regla/opción del dominio.

Campos seguros de `game`:

- `id`, `phase` (PLAYING/FINAL_PHASE/TIE_BREAK/FINISHED), `execution`, `attributes`, `drawPileCount` y `hand` propia: reutilizan definición/presentación B06. No asumen tamaño fijo tres. Observador tiene `[]`; excluidos del desempate no reciben mano adicional.
- `round`: `{ number, kind, finalRoundIndex, playerIds, state, openerPlayerId, indicator, activeAttributeId, direction, plays }`; kind BASE/TIE_BREAK, finalRoundIndex null o 1/2/3; playerIds lista de participantes de esa ronda en orden base (todos o solo empatados). State WAITING_FOR_DIRECTION/WAITING_FOR_PLAYS/RESOLVED. Dirección oficial null hasta apertura completa. Plays públicos `{ playerId, card, order, mode: 'MANUAL' }`; `card` usa CardView B06, order entero 1..N de actuación circular.
- `interaction`: `{ stage, turn, openingSelection, review }`; stage AWAITING_PLAY/ROUND_REVIEW. Turn null o `{ id, playerId }`. OpeningSelection `{ direction: HIGH | LOW | null }` solo para abridor propio de ese turno; `null` para todos los demás. No carta parcial.
- `interaction.review`: null o `{ id, serverNow, endsAt, nextStage, result }`, reloj público Unix ms más referencia del servidor; nextStage ROUND/TIE_BREAK/RESULTS. Result `{ id, roundNumber, kind, ranking, winnerPlayerId, nextOpenerPlayerId, awardedCardCount }`; ranking público `{ playerId, card, playValue, position }` con posiciones únicas 1..N. NextOpener nulo al terminar o en desempate; awardedCardCount N en ronda base y 0 en desempate.

AWAITING_PLAY tiene turn no nulo y review null. ROUND_REVIEW tiene turn/openingSelection nulos y review no nulo; round.state RESOLVED. Estos estados evitan mezclar una mano habilitada/turno nuevo con el resultado anterior. El resultado público se comunica a todas las sesiones miembros, incluidas las no participantes del desempate.

Los puntos de miembros se derivan de wonCards. La dirección parcial no se devuelve a otros jugadores/observador, ni como campo de revisión o evento. El reloj de revisión corresponde a coordinación, no a Game; no existe deadline de turno. Durante revisión la vista conserva la ronda resuelta aunque Game haya decidido su siguiente fase; la presentación usa la ronda revisada, sin anticipar el desempate. No enviar la siguiente indicadora/manos futuras antes de prepararlas. En desempate drawPileCount sigue siendo cero; no entregar conjunto barajado/orden ni IDs de cartas no utilizadas.

Para revisión cero, emitir/publicar resultado resuelto antes de avanzar, respetando orden/revisión; un evento público adicional `game:round-resolved` con `{ roomId, gameId, result }` permite el aviso breve incluso si React agrupa vistas sucesivas. Result.id único y mismo en vista/evento. Mantener publicación resuelta en revisiones positivas también; el cliente deduplica y no vuelve a anunciar por lectura. El aviso fresco puede seguir hasta sus cinco segundos en la siguiente ronda o pantalla final sin bloquearla; cambiar a otra sala lo limpia. Las representaciones públicas de cartas ya jugadas no son nuevas ubicaciones de dominio. Un receptor desconectado recupera estado vigente, no una cola de jugadas ni avisos históricos.

### 5.3 Resultado, recuperación y retorno

Nueva fase de coordinación RESULTS, Game FINISHED. `ResultsRoomView` conserva `{ id, code, status: 'RESULTS', revision, participant, participants, settings, selectedDeck, result }` y **no tiene game, hand, lifecycle de espera ni presence**. Participant/participants contienen `{ id, name, role, isPlayer, score }`, nombres/roster originales, entero de puntos para jugadores y null para observador. SelectedDeck y settings son las fijadas. Acceso solo a sesiones participantes originales, incluida observadora.

`result` contiene exactamente:

| Campo | Tipo y garantía |
|---|---|
| `gameId` | Identificador de la partida terminada. |
| `endReason`, `completedNormally` | Literales DECK_COMPLETED y true en B07; no fabricar cancelación o fin por ausencia. |
| `standings` | Array `{ playerId, score, position }`; score entero, position oficial `1 + jugadores con más puntos`. Orden por puntos descendente, vencedor de desempate primero entre los máximos y otros empates por orden base. Solo jugadores. |
| `winnerIds` | IDs de ganador único o máximos compartidos sin desempate. |
| `tieBreakWinnerId` | ID vencedor si se jugó; null en caso contrario. No cambia posiciones/puntos. |
| `retention` | `{ presentedAt, serverNow, expiresAt }`, números Unix ms; no contiene reloj monotónico interno. |

Mantener envolturas HTTP/ack/eventos por sesión; RoomView incorpora RESULTS y nunca se degrada a IN_GAME por mensaje atrasado. El evento final `room:state` se publica tras la revisión una vez, con resultado/fijación temporal coherentes. Sin manos, mazo, paquetes, credenciales o cartas no públicas. Publicar después de registrar el estado/efecto; una emisión fallida permite recuperar sin volver a terminar.

La conservación empieza en el instante del servidor en que se publica por primera vez el resultado final **tras la última revisión**, no al resolver antes de esa pausa ni al recargar cada navegador. Plazo monotónico de 30 minutos; guardar el instante una vez antes de la primera emisión para que reintentar/recuperar una emisión fallida no lo renueve. Al vencer se eliminan resultado, estado de sala/partida, tareas, índices y autorizaciones asociados. No retirar catálogo/medios compartidos ni índices de una sala nueva. Una pantalla ya mostrada puede conservar su copia, pero una lectura nueva/F5 no la recupera. Sin aviso ni cuenta atrás añadidos de caducidad de resultado.

Operaciones adicionales:

| Operación | Entrada/salida y permiso |
|---|---|
| `GET /api/results/:gameId` | Cookie propia; devuelve `{ room: ResultsRoomView }` si fue participante y sigue conservado, con Cache-Control no-store. No registra vinculación activa ni afecta otra sala. Tercero FORBIDDEN; inexistente/vencido/reinicio RESULT_NOT_AVAILABLE (404), sesión no vigente SESSION_REQUIRED. |
| `results:return-home` | Socket autenticado, entrada exacta `{ requestId, roomId, gameId }`. Solo participante de resultado conservado; jamás durante IN_GAME. Éxito `{ ok: true, room: null, lastResult }` usando extensión de CurrentRoomResponse. Desvincula esa sesión y notifica sus pestañas; no elimina roster/resultado ni devuelve a portada a terceros. |
| `results:home` | Notificación exclusivamente a la sesión solicitante: `{ id, roomId, gameId, lastResult }`; id único de retorno para deduplicar. No cancela Game. |

`lastResult` es `{ roomId, gameId, expiresAt }`; ampliar CurrentRoomResponse con `lastResult?`. Es el resultado propio más reciente todavía conservado, no lista de partidas. Si no hay ninguno se omite en lectura/ack y la notificación usa null. Tras volver, current/resume devuelven portada (room null y referencia si existe), no redirigen otra vez al resultado. Antes de volver, current/resume recuperan RESULTS como recuperaban la partida. Una sala WAITING/IN_GAME nueva tiene prioridad como vínculo actual; consultar resultado por dirección no la sustituye. Acceder mediante el enlace es lectura en esa pestaña, sin reincorporar sesión ni cambiar otras pestañas.

URL de resultado: `/resultado/<gameId>`; el enlace y F5 allí usan su lectura autorizada. La ruta `/sala/<roomId>` usada durante la partida también recupera su resultado mientras esté autorizado/conservado; puede normalizarse a la ruta de resultado al mostrarlo. El cliente distingue resultado consultado de vinculación activa: un current/resume con room null después de volver no borra por sí solo esa lectura explícita todavía válida. La portada reevalúa la referencia al montar/recuperar; después de su expiresAt oculta el enlace sin prorrogar. Si la lectura confirma ausencia/vencimiento, «El resultado ya no está disponible», sin afirmar una causa desconocida. Un fallo de red muestra error de conexión y permite reintentar lectura; no declara caducidad.

Separar **roster/autorización original del resultado** de **asociación activa por sesión**. Liberar al volver no quita nombres o permisos de lectura. Guardar/consultar el resultado o cambiar la presencia de otro participante no vuelve a asociar una sesión ya liberada. Mantener el código reservado durante conservación para que otra sala nueva tenga otro código; el código no admite nuevas entradas en RESULTS. Expirar compara los IDs al eliminar índices y no borra una asociación posterior. No se necesita base de datos ni historial permanente.

Retorno repetido con el mismo ID no repite notificación, no vuelve a vincular ni reemplaza la referencia por un resultado más antiguo. Si después ya existe otra sala activa, un retorno nuevo dirigido al resultado anterior no la desvincula: STALE_GAME_CONTEXT; repetir uno aceptado antes devuelve estado actual sin efectos. El cliente ignora notificaciones antiguas cuyo contexto no sea el mostrado/vigente. Desde una copia cuyo resultado ya venció, «Volver al inicio» recupera current y permite navegar; no necesita rescatar el resultado borrado. El reinicio sigue perdiendo memoria y referencias, como B06, sin inventar clasificación ni causa de expiración.

### 5.4 Errores y consistencia

Conservar errores de identidad/forma/permiso, no disponibilidad y conflicto B06. Nuevos errores comprensibles: contexto de partida/ronda/turno obsoleto (`STALE_GAME_CONTEXT`), turno de otra persona (`NOT_YOUR_TURN`), carta no propia (`CARD_NOT_IN_HAND`), acción durante revisión (`ROUND_IN_REVIEW`), partida terminada (`GAME_FINISHED`), resultado no disponible (`RESULT_NOT_AVAILABLE`). No exponer otra mano ni trazas para explicar rechazo. Rechazo no restaura cartas usadas ni altera puntos/turno.

Mantener entrada/configuración/nombre/salida/cierre bloqueados después del inicio; en RESULTS una acción nueva de juego/preparación devuelve GAME_FINISHED. En las rutas HTTP afectadas, forma 400, sesión 401, permiso 403, resultado no disponible 404 y fase/contexto 409; se conservan demás mappings B06. Repetir un inicio aceptado recupera su partida/resultado todavía autorizado, no vuelve a iniciarla.

Procesamiento serializado por sala, también callbacks de revisión/limpieza. Autorizar y revalidar contexto antes de acceder a información privada. Primera jugada completa válida del turno gana la carrera; otra pestaña no juega una segunda carta. Dirección parcial aceptada puede cambiar antes de esa jugada; después no modifica la dirección fijada.

La apertura completa fija la dirección explícita de su payload válido, reemplazando la parcial anterior si era distinta; no exige que una revisión del navegador coincida con la última selección de otra pestaña. Después se limpia la parcial. Una lectura/repetición no vuelve a sustituirla y un mensaje parcial posterior a la jugada queda obsoleto.

Deduplicación por sesión/requestId, tipo y contenido/contexto exactos: igual solicitud aceptada recupera vista vigente sin reaplicar; mismo ID con distinto contenido/tipo/contexto produce REQUEST_CONFLICT. Tras autorizar acceso a la partida/resultado, distinguir repetición aceptada de solicitud nueva **antes de exigir a esta el turno actual**. Solicitud nueva para un turno anterior se rechaza aunque sea de la misma persona que vuelve a jugar ahora. Repetir una parcial antigua no restaura una dirección reemplazada. Guardar resultados mínimos, no manos/vistas privadas en registros reutilizables.

Al vencer revisión, avanzar una vez aunque callback/lectura/reconexión coincidan. Cada tarea identifica Game/ronda/revisión/generación; un callback cancelado/retrasado no avanza otra revisión ni afecta a otra sala. Aplicar revisiones/conservaciones debidas antes de devolver estado o tramitar acción; en igualdad vence el plazo. Review cero usa un paso acotado que permite comunicar resolución antes de continuar, sin un bucle de rondas ni espera de ack de cada navegador.

Una repetición no duplica resolución/adjudicación/reposición/barajado de desempate/resultados o plazo. La definición B06 y estado de barajado no se reconstruyen desde catálogo/archivos. Mensajes/acks antiguos no degradan fase, ronda o revisión; una respuesta antigua de Game previo tampoco desplaza una sala nueva ni revela su mano a otra sesión.

## 6. Responsabilidades y dependencias

| Responsabilidad | Capa y límite | Comprobación prevista |
|---|---|---|
| Jugada/turno circular, ranking, cartas/puntos, reposición, final, desempate y clasificación | Game/dominio puro, definición inmutable B06 y datos explícitos. Sin reloj, transporte, Node, aplicación/React. Play necesario se concreta con jugador/carta/orden/mode MANUAL; no políticas vacías de modos futuros. | Pruebas puras de transiciones y 58 ubicaciones, partidas completas y empate. |
| Identidad/contexto, parcial privada, deduplicación, revisión, vistas y conservación | Aplicación: casos de uso/modelo de coordinación; Game decide juego y aplicación plazos/visibilidad. No adaptadores concretos. | Puertos sustitutos, tiempo controlado, errores y carreras. |
| Entropía de desempate | Reutilizar CardPermutation por puerto real; infraestructura baraja el subconjunto indicado, Game valida conjunto/permutación y distribuye. No usar mano rival o cliente como fuente. | Permutación fija/real, una llamada por desempate, invalidaciones sin estado parcial. |
| Reloj/planificador, sesión, memoria y mensajes | Reutilizar puertos B03/B06 y adaptadores; ciclos de espera, revisión y resultados separados por contexto. Memoria distingue roster autorizado, asociación activa y referencia al último resultado. Guardar/expirar una sala antigua no sobrescribe ni elimina índices de otra. Sin reglas de comparación en Socket.IO. | HTTP/ack/eventos reales, varias pestañas, limpieza y callbacks antiguos. |
| Composición | Conecta capacidades concretas y dispose. No políticas de juego ni endpoints de tiempo de pruebas. | Compilación/arranque y montajes de prueba actuales. |
| Contratos/UI | Shared seguro; React usa vistas y coordina selección/envío/presentación. Sin server ni decidir oficialmente puntuación/ranking. | Forma exacta de mensajes, privacidad, foco/Detalles y móvil/escritorio. |

Mantener la separación de RoomCoordinator/WaitingLifecycle y proyección por sesión; extraer coordinación de partida cuando su responsabilidad lo requiera, sin acumular reglas en transportes. Reutilizar almacenamiento si cubre retención y liberación de índices; añadir puerto solo por capacidad real. No crear una jerarquía de temporizadores/bots futuros.

Autonomía: nombres/estructura interna, transiciones mutables o inmutables de Game conservando instantánea y reglas, representaciones de propiedad/snapshots, derivación estable de turnId, componentes/CSS y montaje de fixtures. Las reglas/selecciones acordadas no se rediseñan por conveniencia técnica. Cambios normativos/transversales se comunican a Arquitectura; implementación no edita TFM.

## 7. Criterios y plan previstos

- [x] **B07-01 — Base:** B06 conservado; inicio/autorización/reparto/catálogo exacto y preparación bloqueada. No se modifica genérica ni ASSETS.
- [x] **B07-02 — Apertura:** sin valores predeterminados, ambos órdenes, parcial modificable/privada y comunicación; completar envía una vez sin confirmar. Recuperar solo dirección; no jugar al recuperar.
- [x] **B07-03 — Turno/mano:** identidad, fase/ronda/turno y carta propia validados; carta ajena/usada/inexistente y dirección ilegítima rechazadas sin efectos. Observador y excluidos de desempate no juegan.
- [x] **B07-04 — Orden:** circular desde abridor con orden base estable, anfitrión al final, una jugada por participante; varias pestañas no duplican.
- [x] **B07-05 — Ranking/puntos:** HIGH/LOW usan playValue activo, no dato mostrado; primero/segundo distintos, ganador recibe N cartas/puntos, score derivado. No punto por ronda ni por desempate.
- [x] **B07-06 — Reposición:** desde segundo circularmente, adquisición conservada, indicador descartado una vez y siguiente indicador correcto. Comprobar en cada transición las 58 ubicaciones únicas.
- [x] **B07-07 — Final:** condición exacta antes de abrir, una indicadora final y tres rondas con su atributo; direcciones nuevas, manos 3→2→1→0, sin reposición/indicadoras adicionales.
- [x] **B07-08 — Partidas completas:** 2/3/4/5 jugadores, anfitrión jugador/observador; cifras derivadas de §4 y fin normal. Script de acciones manuales válidas, no endpoint para terminar saltando el motor.
- [x] **B07-09 — Revisión positiva:** cartas/ranking/puntos visibles antes de nueva etapa; ningún juego siguiente aceptado antes; recargar/reconectar conserva plazo y estado, no lo reinicia.
- [x] **B07-10 — Revisión cero:** comunicar resolución antes de siguiente etapa, aviso breve observable sin pausa artificial/resumen persistente; no doble transición ni bucle automático.
- [x] **B07-11 — Empate sin ronda:** empate máximo comparte victoria, opción apagada o ganador único no barajan ni ejecutan desempate; clasificación correcta también con empates inferiores.
- [x] **B07-12 — Desempate:** opción activa y empate máximo, una ronda solo empatados, indicadoras descartadas/última incluidas, fórmula de reparto 1/2/3 probada, circularidad y ganador único. Puntajes/puestos base inmutables; no reposición/segundo desempate/siguiente abridor.
- [x] **B07-13 — Revisión final:** aplicar revisión también a última ronda base y desempate; no resultado final anticipado; conservar cartas/puntos correctamente.
- [x] **B07-14 — Repetición/antigüedad:** IDs iguales/distintos, ack perdido, parcial reemplazada, turno/ronda/Game anterior, conflictos y callbacks obsoletos no reaplican ni cambian contexto actual.
- [x] **B07-15 — Privacidad:** inspeccionar HTTP/ack/eventos exactos para humanos/observador; parcial solo propia, manos propias en todo ciclo/desempate y resultado sin secretos. Sin orden/IDs ocultos de mazo, paquetes/semillas/credenciales en mensajes o registros.
- [x] **B07-16 — Recuperación/presencia:** varias sesiones/pestañas, F5/corte/restauración en apertura, turnos, final, revisión, desempate y resultados. Misma partida sin redistribuir; ninguna ausencia produce automático/retirada o cierre aunque transcurran límites aplazados.
- [x] **B07-17 — Resultados/retención:** clasificación/vencedores y observador, plazo desde publicación tras revisión, recuperación antes del límite y rechazo/eliminación en igualdad/después; consultas no renuevan. Presentación ya abierta puede conservar copia sin F5.
- [x] **B07-18 — Otra sala:** volver al inicio en todas las pestañas de una sesión, acceder al último resultado y crear/entrar sin reinicio; código/participación nuevos, sin revancha ni afectar a terceros. Consultar/guardar resultado antiguo no recupera la vinculación anterior; expirarlo no borra sala/sesión/índices nuevos.
- [x] **B07-19 — Interfaz:** 360/390/1280 px, teclado/tacto, selección/estado pendiente, Detalles separado y foco preservado; mano variable legible sin desbordamiento de página; acciones solo actor y aviso claro sin límite de turno.
- [x] **B07-20 — Arquitectura/regresiones:** dependencias sin ciclos/imports server en src; responsabilidad semántica revisada. Garantías de espera B01–B05/activación y B06 conservadas; cambiar solo aserciones que describían ausencia temporal de ejecución, manteniendo su evidencia histórica.

Pruebas futuras por etapas M1–M4: dominio puro con permutaciones explícitas y conservación después de cada paso; casos de uso con puertos/tiempo controlado; HTTP/Socket.IO reales, credenciales, privacidad y confirmaciones; navegador sobre compilación vigente y revisión visual. Usar paquetes validados de prueba separados para resultados/empates/recursos; no alterar fuentes maestras ni paquetes aprobados. Los casos sintéticos se identifican y no se presentan como partidas completas alcanzables.

Exigir `npm run check` y `npm run test:browser`/recorridos pertinentes con compilación previa. Conservar baterías existentes; añadir recorridos completos con sesiones independientes y observador, aperturas en ambos órdenes, fase final, desempate, revisión/resultado y vuelta al inicio. Distinguir conexiones reales de reloj controlado y emulación de dispositivo físico. No esperar 30 minutos reales para acreditar solo un plazo controlado.

Ejemplos verificables (casos preparados, no resultados ejecutados):

| Caso | Dado / acción | Resultado esperado |
|---|---|---|
| E1 | Dos humanos, genérica 2, abridor elige HIGH y luego carta; en otra ronda elige carta y luego LOW. | Una jugada completa por apertura; dirección provisional privada, dirección aceptada pública y turno circular; ganador recibe dos cartas/puntos. |
| E2 | Abridor eligió dirección, otra pestaña recupera y F5 elimina carta parcial local. | Misma dirección privada aceptada, ninguna carta por defecto ni envío de recuperación; elegir carta explícitamente completa la jugada. |
| E3 | Revisión cinco segundos, cortar/reconectar o recargar; intentar jugar antes de terminar y coincidir callback/lectura al vencer. | Resultado/puntos vigentes, cuenta atrás restante sin reiniciar, rechazo antes; avance único después. |
| E4 | Cinco jugadores completan base con orden controlado. | Siete rondas normales y tres finales, ocho indicadoras, 50 cartas/puntos adjudicados; fase final comparte indicador/atributo y termina manos vacías. |
| E5 | Fixture validada de cinco con dos victorias por persona; forzar desempate activo. | 10 puntos cada uno, ocho indicadoras disponibles, una carta por empatado, indicador y dos no utilizadas; vencedor único sin cambiar puntos/puestos 1. |
| E6 | Clasificación base de cinco 15/15/15/5/0; forzar desempate activado/desactivado. | Activado: vencedor destacado y posiciones base 1/1/1/4/5; desactivado: tres ganadores compartidos, sin ronda adicional. Puntos siempre iguales. |
| E7 | Resultado publicado, dos pestañas de Ana; Ana vuelve al inicio, consulta resultado, crea otra sala y vence conservación de la anterior. | Ambas vuelven inicialmente; lectura no revincula/renueva; nueva sala queda intacta. Otros participantes mantienen su resultado hasta el límite. |

E5/E6 requieren trazas alcanzables de cartas/direcciones manuales con paquetes/permutaciones válidos; no asignar puntos directamente ni saltarse rondas para acreditar una partida completa. Tests aislados de clasificación/fórmula pueden usar entradas sintéticas, identificando esa evidencia.

Instrucciones manuales para implementación y autor:

1. Compilar y arrancar la versión vigente. Abrir dos navegadores/perfiles con cookies independientes, crear/entrar, seleccionar genérica 2 y mantener el tiempo de turno configurado, revisión cinco y desempate apagado.
2. Iniciar. Comprobar ausencia de dirección/carta predeterminadas y mensaje sin límite de turno. Probar ambas aperturas, cambiar una selección parcial, Detalles sin jugar y dirección privada; abrir una segunda pestaña del abridor y recargar antes de completar.
3. Jugar alternando HIGH/LOW. Ver cartas/puntos/segundo abridor, orden estable, reposición y cuenta atrás de revisión; cortar/restaurar red o recargar en un turno/revisión y comprobar misma mano/contexto. No hay que esperar un timeout para seguir: vuelve la persona de turno.
4. Completar fase final y resultado. Comprobar clasificación; volver al inicio, consultar último resultado, crear o entrar en otra sala sin reiniciar y verificar que el otro navegador conserva el resultado anterior.
5. Repetir con anfitrión observador y dos invitados en tres sesiones, revisión cero y forzar desempate activo. La ausencia de empate real solo acredita final sin desempate; para probar la ronda adicional usar el montaje determinista validado de E5/E6, separado de la instalación normal.
6. Revisar 360/390/1280 px, teclado/tacto emulado, foco, mano variable y vista observadora. El plazo de resultados se comprueba antes/en/después con reloj controlado; si se realiza además media hora real, registrarla aparte. No incorporar controles de reloj/resultado de prueba al producto.

**C09–C10 siguen parciales:** B07 amplía evidencia al uso de la baraja, cartas jugadas, manos variables, recursos y privacidad durante juego/resultados. No atribuir comprensión/jugabilidad validada con usuarios, equilibrio, móviles físicos, bots ni despliegue a estas pruebas. Mantener cobertura histórica y límites identificados, no marcar completos por terminar una partida automática de pruebas.

## 8. Decisiones y pendientes

| Tema | Estado 04/10/2026 |
|---|---|
| Límite humano/ausencia/vigilancia | Separación aprobada del bloque posterior; espera hasta que la persona vuelva. Revisión y retención sí incluidas. |
| Parcial de apertura | Confirmado: dirección aceptada en servidor, privada/modificable; carta solo local, recupera solo dirección. |
| Resultado de ronda | Confirmado: aviso breve, sin resumen persistente; revisión positiva mantiene ronda resuelta. |
| Contador de revisión | Confirmado: cuenta atrás solo de revisión; cero sin contador. |
| Pantalla de resultados | Confirmado: pantalla específica, tabla escritorio/filas móvil y observador aparte. |
| Retorno y enlace de resultado | Confirmado: todas las pestañas de esa sesión vuelven, portada con acceso al último resultado conservado. |
| Ejemplo de puntos §24.2 | Incoherencia aritmética señalada; trasladar corrección del ejemplo a Arquitectura sin cambiar reglas. |

## 9. Preparación, cierre y responsabilidades documentales

No quedan preguntas funcionales bloqueantes ni propuestas de interfaz sin resolver. Las elecciones internas compatibles de §6 pertenecen al implementador; no requieren nuevas decisiones del autor.

**Preparación original, antes de implementación:** código/pruebas B07 no implementados ni ejecutados en el hilo SDD. Arquitectura/verificación de implementación pendientes en ese momento. Se conserva el cierre histórico B06, no se le atribuyen resultados futuros. El cierre de implementación que sigue registra evidencia nueva.

**Comprobación documental, 04/10/2026:** enlaces locales de especificación/prompt/proceso existentes, 20 criterios únicos y revisión de contratos/decisiones cerradas. Cambios limitados a documentación SDD; huellas de genérica en APP iguales a las aprobadas de activación. No acredita implementación ni pruebas del producto.

[Prompt de implementación](PROMPT_IMPLEMENTACION_BLOQUE_07.md) preparado y B07 enlazado desde el proceso. El cierre de implementación registrará base/commit, etapas, criterios/resultados reales, comandos/entorno, limitaciones y evidencia manual efectivamente realizada. No marcar implementado/verificado antes de disponer de esa evidencia.

Implementación puede mantener README, documento/evidencia B07 y descripción del código en APP. **No editar contexto, aplicación o infraestructura de TFM.** Entregar conclusiones a coordinación y Arquitectura, incluido ejemplo inconsistente, acuerdos de interacción y límite manual. No encargar push, PR ni despliegue desde B07.

**Resumen de la preparación para coordinación/Arquitectura:** base B06 local f3aca75; alcance acordado de partida humana manual completa, revisión/retención temporizadas, selección parcial privada y retorno con resultado recuperable; sin tiempos de turno/ausencia/vigilancia ni bots. En la preparación aún no había evidencia B07; los resultados nuevos figuran en §9.1. Fuentes generales conservan requisitos completos del MVP y deben registrar el alcance/evidencia entregados en su ámbito responsable. Corregir el ejemplo aritmético de dominio §24.2 sin modificar reglas. C09–C10 permanecen acotados/parciales.

### 9.1 Cierre de implementación — 04/10/2026

**Cambio revisado:** `32f60e926b34c4afcb01d3147ea6ed1dc7925414` (48 archivos, implementación/pruebas/README/organización), corrección de foco y regresión `bfa5c5fed5179c4423266f0615831ae8c405de34`, y protección frente a confirmaciones antiguas con regresiones `eb73b1176934428adaa5c3cc4469f048bb8ecc2b` (base de todas las puertas finales). Rama `feat/b07-partida-manual-completa`, base efectiva B06 `f3aca75676c4b3590b875d4c49aa48dfd219eb29`; main permanece `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`. Preparación ajena conservada en commit separado `2372be35aecc420ab8935252e7f16940fde89280` (especificación/prompt/proceso y registro de base). Sin restauraciones, push, PR ni despliegue. Cierre documental posterior separado del código.

**Estado del cierre:** implementado y verificado localmente. Los 20 criterios y E1–E7 tienen evidencia nueva ejecutada, con check 295/295 y navegador compilado 63/63 sobre `eb73b11`. Incluye revisión semántica y visual asistida; no acredita revisión manual humana, dispositivos físicos ni media hora real de conservación. Esos límites y C09–C10 parciales se mantienen explícitos.

#### Entorno, base y etapas ejecutadas

Windows, PowerShell, Node `24.13.0`, npm `11.6.2`, aplicación `0.1.0`; Chrome `154.0.8037.93`, Playwright `1.63.0`. Fecha 04/10/2026, horas locales Europe/Madrid (UTC+02). Sesiones de navegador aisladas por cookies, pestañas del mismo contexto comparten identidad. Emulación de viewport 360/390/1280 × 844; no dispositivos físicos ni revisión humana de una partida B07.

Antes de editar: `npm run check` pasó 249/249 en 24 archivos (11,70 s), tipos/lint/build y 50 módulos de arquitectura. Primer intento de navegador sin proceso normal arrancado: 28 pasaron/19 fallaron por conexión rechazada; fallo de montaje, no acreditado. Tras `npm run start`, `npx playwright test --workers=2` contra B06 compilado pasó 47/47 (3,0 min). Estas dos comprobaciones solo acreditan la base.

Se comprobó cada etapa **antes de extender la siguiente**, en el mismo bloque:

| Etapa | Comandos/ejecución realizada | Resultado en ese punto |
|---|---|---|
| M1 | Vitest sobre Game B06 + pruebas M1 de dominio/aplicación; typecheck/lint; build y Playwright M1 | 20/20 seleccionadas; 2/2 recorridos de apertura/privacidad/Detalles/F5. |
| M2 | Vitest sobre `manualGame.test.ts` de dominio/aplicación; build y Playwright M1/M2 | 11/11 seleccionadas; 4/4 navegador. Revisión 0/5, ranking/adjudicación/reposición/emisión. Se corrigió impureza de lectura de tiempo en render detectada por lint. |
| M3 | Mismos archivos Vitest ampliados; build y Playwright M1/M2/M3 | 16/16 seleccionadas; 5/5 navegador. 2–5 completos en dominio y cinco jugadores/observador en conexiones compiladas con tiempo controlado. |
| M4 | Pruebas de dominio/aplicación/resultados e integración `server/manualSocket.test.ts`; Playwright ampliado | 16 pruebas puras + 9 de coordinación manual + 12 de resultados + 8 de HTTP/sockets en la batería final; 16 recorridos B07 de navegador tras añadir regresiones de foco y respuestas antiguas. Trazas reales del motor para empate/repartos/clasificación, no asignación sintética de puntos. |

Fallos encontrados y corregidos durante M4: comparación de claves sin ordenar en el test de privacidad (no fallo de contrato); recuperación de otra sala que ocultaba ausencia de un resultado leído por URL (corregido en `useRoomFlow`, ahora protege también lectura explícita fallida); dos aserciones de título esperaban el del invitado en una espera del anfitrión (corregidas, la captura mostraba correctamente «Tu sala está lista»). Ejecuciones intermedias con estos fallos no se cuentan como verificadas. El aviso de scroll se recalcula al cambiar el tamaño de mano; una prueba comprueba su retirada en la última ronda final. La revisión detectó además foco sin destino al cerrar Detalles si otra pestaña jugó esa carta: regresión ejecutada falló (destino inactivo), corrección devuelve foco a la región de mano si su botón ya no existe. Cuatro recorridos específicos posteriores pasaron, incluidos toque/teclado/F5 y este caso.

Una batería posterior de 61 casos produjo 60 pasados y un fallo: el gesto de teclado se adelantó a la habilitación tras reconectar; se corrigió la secuencia del test esperando habilitación y comprobando selección local. No se acredita esa ejecución como superada. La regresión de una confirmación real de retorno retenida mostró que borraba la nueva sala creada en otra pestaña. Se corrigió capturando la asociación de origen de lecturas/resume y guardando también el contexto del retorno en `useRoomFlow`/App. La primera prueba de resume retenido agotó 60 s antes de capturar la respuesta (montaje, no evidencia de ese fallo de producto); con espera explícita y timeout de prueba 90 s se ejecutaron ambos casos reales. Seis seleccionados pasaron después de la corrección, incluidos teclado/F5/foco, y los dos casos vuelven a pasar en la puerta global de 63.

#### Puertas y evidencia nueva

| Comando | Resultado real |
|---|---|
| `npm run check` (18:24:09, código eb73b11) | Salida 0; **295/295**, 28 archivos, 11,52 s. Tipos/lint/build correctos; preparación normal: una baraja genérica 2 disponible. Arquitectura: **57 módulos**, sin imports prohibidos/ciclos; se conservan sus casos negativos. Esta ejecución incorpora las correcciones de foco y contexto. |
| `npm run test:browser -- --workers=2` (primera batería completa B07) | Salida 0; **60/60**, 4,1 min, 47 regresiones + 13 B07. Se repite sobre el último ajuste de mano variable. |
| `npm run test:browser -- --workers=2` (compilación vigente, eb73b11, 04/10/2026) | Salida 0; **63/63**, **5,8 min**, 47 regresiones + 16 B07. Compila de nuevo antes de probar. La batería previa al ajuste de foco también pasó 60/60, 4,0 min; se registra como ejecución anterior. |
| `npx playwright test tests/browser/manualGame.spec.ts --grep 'B07 M1\|parcial remoto' --workers=1 --output test-results/b07-touch` | Salida 0, **3/3**, 6,9 s; carta/dirección por toque a 390, teclado y F5/privacidad/pestañas. |
| `npx playwright test tests/browser/manualGame.spec.ts --grep 'Detalles conserva foco\|B07 M1\|parcial remoto' --workers=1 --output test-results/b07-focus-fixed` tras build | Salida 0, **4/4**, 6,7 s; incorpora otra pestaña jugando la carta abierta en Detalles a 360, diálogo estable y regreso de foco a mano. |
| `npx playwright test tests/browser/manualGame.spec.ts --grep 'respuesta antigua\|Detalles conserva foco\|B07 M1\|parcial remoto' --workers=1 --output test-results/b07-context-fixed` tras build | Salida 0, **6/6**, 2,1 min; conexiones reales y respuestas reales retenidas de retorno/resume no borran la sala nueva. Sin reloj controlado en esas dos carreras de respuesta. |
| `git diff --check` y revisión semántica | Sin errores de whitespace. Game contiene reglas; aplicación coordina permisos/contexto/dedupe/plazos/vistas; infraestructura autentica/decodifica/almacena/programa/emite; composición conecta; React solo presenta/gestiona gestos y carta local. Mapa concreto en [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md). No desviaciones de capas. |

Logs finales locales ignorados: `b07-check-final.log`, `b07-browser-final.log`; seleccionados/correcciones: `b07-touch.log`, `b07-focus-before.log`, `b07-focus-fixed.log`, `b07-old-response-before.log`, `b07-context-fixed.log` (y ejecuciones previas `b07-*.log`). Comandos/tests versionados y este cierre permiten reconstruir las comprobaciones. Playwright sustituye su carpeta de resultados en cada ejecución: no se presenta una salida intermedia borrada como artefacto archivado. Las capturas finales se generan en `test-results`, no se publican como recursos ni se versionan por rutina.

#### Resultados por criterio

Todos los resultados de la tabla proceden de código ejecutado en esta implementación y la puerta compilada final ha pasado. D = `server/domain/manualGame.test.ts`; A = `server/application/manualGame.test.ts`; R = `server/application/results.test.ts`; S = `server/manualSocket.test.ts`; N = `tests/browser/manualGame.spec.ts`.

| Criterio | Evidencia ejecutada y resultado |
|---|---|
| B07-01 | Regresiones B06/activación en check y navegador; inicio único/versión exacta/preparación bloqueada. Huellas APP=ASSETS=aprobadas, sin cambios en JSON. Catálogo normal genérica 2 y sala sin selección inicial. |
| B07-02 | A/S/N M1: HIGH→carta y carta→LOW, parcial privada/modificable/deduplicada, F5 recupera solo dirección; evento de otra pestaña no completa carta local. Un gesto completo juega inmediatamente; Detalles no juega. |
| B07-03 | D/A/S: sesión/observador/contexto/mano/dirección/forma extra y tipos rechazados sin efectos; carta ajena/usada/inexistente y no empatados no juegan. No HTTP de jugar/avanzar/terminar. |
| B07-04 | D/S y regresión B06: orden base estable/anfitrión al final, circular desde abridor. Carrera de dos sockets de misma sesión acepta una carta; replay devuelve estado vigente. |
| B07-05 | D HIGH/LOW con Dato distinto de Jugable; ganador recibe N cartas/puntos, segundo abre. Puntos derivados; empate adicional no suma. N comunica ganador/segundo/puntos. |
| B07-06 | D comprueba adquisiciones circulares desde segundo al final de mano, nueva indicadora y descarte único. En cada jugada/transición comprueba 58 IDs/ubicaciones únicos, también empate y fin. |
| B07-07 | D 2–5 y N cinco humanos: tres finales, atributo/indicadora únicos, nuevas direcciones, manos 3→2→1→0; mazo cero, sin reposición; descarte final único y 50 puntos para cinco. |
| B07-08 | D/R/S completos 2/3/4/5; N dos reales normales y cinco/observador con paquete validado. Totales 40/45/48/50, normales 17/12/9/7 + tres finales, indicadoras 18/13/10/8. Solo acciones legales; nada salta el motor. |
| B07-09 | A/S/N revisión 5: puntos/ranking ya aplicados, siguientes jugadas bloqueadas, F5 conserva deadline, −1 ms no avanza, igualdad avanza una vez. Reloj controlado y conexiones reales, no cinco segundos de evidencia real. |
| B07-10 | A/S/N revisión 0: publicación resuelta + evento antes de avance acotado; aviso fresco observable de cinco segundos, sin contador/pausa artificial. No resumen persistente/reanuncio al recargar ni bucle automático. |
| B07-11 | D/R: empate con opción apagada comparte máximo; único con opción activa no baraja. E6 apagado conserva tres ganadores y puestos 1/1/1/4/5. |
| B07-12 | D/R/S: k=3 para 2/3 empatados, k=2 para 4, k=1 para cinco a 10. Indicadoras base incluida última, permutación validada, abre primer empatado, una ronda/0 puntos, sin reposición/otro abridor. N móviles prueba k=1/2 con observador. |
| B07-13 | R/N: revisión última base y empate antes de RESULTS; publicación final/retención aún inexistentes durante revisión. Puntajes/pilas base conservados. |
| B07-14 | A/R/S/N: replay, conflicto tipo/contenido/contexto, parcial sustituida, ack/evento perdidos, ronda/turno/Game viejo; primera completa gana. Callback antiguo invocado durante otra revisión no cambia Game/revisión. Fallos de emisión final/retorno no repiten efectos; roomState rechaza degradación/sala anterior. Dos respuestas reales retenidas (retorno/resume) no borran ni desplazan la sala nueva creada por otra pestaña; se verifica UI y asociación vigente. |
| B07-15 | S y helper `gamePrivacy`: claves/contenido exactos de GET/ack/eventos para cada destinatario durante ciclo completo/desempate/results; ningún ID oculto salvo mano propia/públicos. Parcial solo propia, observador/no empatados sin mano, RESULTS sin Game/cartas/presencia. Registros técnicos fijos sin objetos/payloads. |
| B07-16 | S/N + B06: F5/corte/restauración, turno/revisión/final/empate/results y pestañas. Una pestaña conectada conserva presencia; todas fuera +31 min **controlados** no cambian cartas/turno/participantes ni ejecutan límites aplazados. Entropía inicial/empate no se repite. |
| B07-17 | R/S/N: resultado/puestos/ganadores/observador; retención desde publicación tras revisión y lecturas no renuevan; −1/igual/+1 eliminan/autorización 404. Copia ya abierta puede quedarse, F5 ya no recupera. Fallo de red no se presenta como caducidad. |
| B07-18 | R/S/N E7: retorno a todas las pestañas propias, tercero conserva resultado; último resultado autorizado sin re-vincular. Crear otra sala/código sin reinicio; leer/guardar/expirar anterior no borra índices nuevos. Replay de retorno viejo devuelve asociación/último resultado vigentes, incluso tras otra partida completa. Lectura/resume y ack de retorno emitidos antes de la nueva sala tampoco la eliminan al llegar tarde. |
| B07-19 | N + regresiones B06 a 360/390/1280: mano variable, pendientes/error/recuperación, teclado, toque en carta/dirección/Detalles, Escape/foco, imágenes reales/nulas/fallidas y scroll sin desbordamiento de página. Dialog no pierde foco al recibir jugada de otra pestaña; cerrar vuelve a mano si desapareció el disparador. Inspección visual asistida de capturas de empate 360 y clasificación 390/1280 legibles. Comprobaciones táctiles específicas 3/3 y 4/4 pasadas. |
| B07-20 | Check + navegador completo conservan B01/T01/B02/B03/B04/B05/activación/B06. Solo se cambian aserciones B06 de ausencia temporal de ejecución, título y mano ahora variable; sus documentos históricos permanecen intactos. Puertas automática y semántica correctas, ninguna nueva dependencia de paquete. |

**Ejemplos E1–E7:** E1/E2 en M1/N/A/S (dos órdenes, dos pestañas, privado/local/F5); E3 A/S/N revisión 5 y callbacks; E4 D/N cinco humanos (7+3, 8 indicadoras, 50 puntos); E5 D/R/S/N cinco máximos a 10 (8 indicadoras, una por empatado + indicador + dos no utilizadas); E6 D/R dos opciones sobre traza 15/15/15/5/0, puestos 1/1/1/4/5; E7 R/S/N retorno/lectura/otra sala/expiración sin borrar contexto. E5/E6 se alcanzan mediante paquetes/permutaciones validados y cartas/direcciones humanas legales, nunca asignando puntos. Constructor independiente de trazas en `tests/support/manualGameTrace.ts`; las aserciones comparan acciones/ranking/puntuación reales del motor.

#### Compilación normal, privacidad e independencia

Se detuvo la instancia B06 anterior y se arrancó B07 con `npm run start`; se reinició de nuevo para la puerta final de esta entrega. Comprobación adicional del proceso normal el 04/10/2026 a las **18:41:19 UTC+02**: `http://127.0.0.1:3000/api/decks` responde HTTP 200, únicamente resumen seguro genérica, formato 1/contenido 2, portada null. Su HTML referencia la compilación final **`index-D7SF9srO.js` / `index-BcLg80en.css`**, iguales a la construcción comprobada. No fixture/interceptor en el proceso normal. N recorre 40 jugadas de dos sesiones con entropía `node:crypto`, F5, resultados y otra sala; otro proceso `main` compilado aislado recorre observador + dos invitados, 40 jugadas, resultado y reinicio con genérica 2 real y guard que bloquea cualquier acceso a ASSETS. No se registró acceso; proceso sin errores. Reutiliza instantánea B06 y medios validados B04, sin reread al jugar.

Huellas conservadas de ambos JSON (origen ASSETS = APP = activación aprobada):

| Archivo | SHA-256 |
|---|---|
| `baraja.json` | `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` |
| `cartas.json` | `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c` |

Formato 1/contenido 2/disponible true, 58 cartas, imágenes nulas y semilla editorial sin cambios. Catálogo/artefactos/logs ignorados. No se cambia contrato ni se publica contenido sintético. Las cuatro huellas de TFM se compararon con las leídas al preparar esta tarea y son iguales (contexto `4f5baa77…`, aplicación `180a4e4a…`, dominio `a08bafcd…`, infraestructura `434e96ee…`). No se editó ninguna fuente general ni el ejemplo de dominio.

#### Tiempo y límites de evidencia

- Dominio: permutaciones explícitas, sin tiempo/red. Casos de aplicación: reloj/planificador/entropía sustituibles. HTTP/Socket.IO: conexiones reales con plazos controlados; navegador de fixtures: compilación vigente, conexiones reales, reloj/permutación controlados. No acreditar media hora real con `advance/elapse`.
- Instalación normal y main aislado: entropía real, genérica aprobada, conexiones y reinicio de proceso reales. Los gestos los automatiza Playwright; no partida humana presencial. Cuenta atrás de revisión controlada; retención antes/en/después controlada. Margen B03 real de la puerta final: pingInterval/pingTimeout 5000/5000 ms, reserva desde detección 30000 ms; recuperación detectada en 5,8081 ms, última pérdida en 6,0950 ms, reserva observada 30007,6883 ms y total desde pérdida de red 30013,7833 ms, razón `transport close` (caso 41,8 s). No representa el máximo de detección por ping en una red silenciosa ni se extrapola a plazos futuros de juego.
- Capturas inspeccionadas por el agente: resultados normales 1280, empate 360 y observador/clasificación 390; se conservan capturas generadas por el recorrido para los tres anchos. Es revisión visual asistida de navegador emulado, no móvil físico ni comprensión validada con usuarios.
- [README](../../README.md) contiene instrucciones manuales completas: dos sesiones; observador y dos invitados; parciales/F5/pestañas; revisión/final/resultados y otra sala; fixture de empate separada; limpieza local por reinicio solo si el ensayo queda detenido. Pasos ejercitados por automatización; revisión manual humana B07 pendiente de autor, no acreditada por B06 histórico.

#### Entrega a coordinación y Arquitectura

Implementado Game humano manual completo y coordinación/results; mapa/archivos concretos en organización y commit. Mantener requisitos futuros de fuentes generales: límite/cuenta atrás de turno, timeout, automático, retirada por ausencia y vigilancia de dos minutos **no implementados**. TurnTimeout sigue dato configurado; se muestra el aviso acordado, sin selector permanente manual. No bots, visualización/configuración nueva, rediseño, despliegue ni siguiente bloque. Esperar indefinidamente al jugador no es una política provisional de tiempo: es el límite explícito B07.

Trasladar al responsable de dominio la errata §24.2: cinco jugadores adjudican 50 cartas/puntos en múltiplos de cinco; 12/12/12/12/2 no es una traza de esa partida. La prueba alcanzable de mano reducida es **10/10/10/10/10**, ocho indicadoras y k=1. E6 **15/15/15/5/0** comprueba puestos oficiales sin renumerar tras desempate. No se modifican reglas para reproducir el ejemplo ni se corrige TFM desde este encargo.

Coordinar actualización descriptiva de contexto/aplicación/infraestructura por sus responsables: partida manual completa, parcial privada/local, revisión/retención, resultado autorizado independiente de asociación activa y otra sala sin reinicio. Conservar requisitos MVP futuros. **C09–C10 parciales:** ahora hay uso/jugadas/manos variables/resultados/recursos/privacidad; no comprensión con usuarios, equilibrio, dispositivos físicos, bots o despliegue. Publicación/PR/integración siguen el hilo de GitHub/recuperación, fuera del encargo.
