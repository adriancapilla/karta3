# B08 — Temporización de turno y automático por inactividad

**Estado:** acordado el 04/10/2026 con el autor; pendiente de implementación y verificación.
**Tipo:** incremento funcional en dos etapas internas; ambas necesarias para cerrar B08.

## 1. Base y referencias

**Base comprobada en la preparación:** rama `main`, HEAD `097cffc21e1224aebc30ed3c353df837f4166839`; `main` y referencia local `origin/main` coinciden. Árbol limpio antes de crear estos documentos. Aplicación `0.1.0`. No se cambió de rama ni se ejecutaron pruebas del producto en SDD.

| Referencia | Decisiones que gobiernan B08 |
|---|---|
| [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) y [organización/dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) | Capas, autoridad del servidor, proyecciones privadas y evidencia por bloque. |
| [Contexto](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), §§9–10 | B06/B07 integrados; B08 aprobado en dos etapas, sin ampliar configuración ni implementar bots o vigilancia. |
| [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), §§6–7, 12–19, 21–24 y 26 | Antigüedad, modos de jugada, contador/automático, conservación, final y desempate. |
| [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§6–12 y 15 | Inicio del plazo, apertura parcial, revisión, recuperación, permisos y resultados. |
| [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §§5–8 | Sesión compartida, reloj monotónico, igualdad temporal, callbacks y limpieza. |
| [B05](BLOQUE_05_CONFIGURACION_SALA.md), [B06](BLOQUE_06_INICIO_Y_MESA_INICIAL.md), [B07 y cierre §9.1](BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md) | Configuración fijada al iniciar, mesa, contratos, jugadas, revisión, resultados y regreso al inicio. |
| [B03](BLOQUE_03_CICLO_VIDA_ESPERA.md), [B04](BLOQUE_04_CARGA_BARAJAS.md), [activación](ACTIVACION_GENERICA_V2.md), [contrato de barajas](../contratos/CONTRATO_BARAJAS_V1.md) | Espera exclusiva de WAITING; catálogo/instantánea y genérica formato 1/contenido 2 disponible. |

Código consultado: `server/domain/game.ts`, `server/application/{room,roomUseCases,roomCoordinator,gameCoordinator,initialGameView,ports}.ts`, `server/infrastructure/time.ts`, `shared/contracts/{room,game}.ts`, `src/{GameScreen,useGameActions,RoundReview,ResultsScreen,useRoomFlow}.tsx/.ts` y montaje de pruebas existente. La política automática está definida en las fuentes; su ejecución y los tipos de jugador/modo actuales todavía están limitados a B07 manual.

**Evidencia histórica:** contexto y cierre registran B06/B07 publicados mediante PR #3, con 295 pruebas, 63 recorridos Chrome y 57 módulos revisados; el autor confirma partida completa, recuperación y otra sala. Se cita esa entrega, sin repetir pruebas ni atribuirla a B08. La referencia `origin/main` comprobada aquí es local; no constituye una nueva consulta remota de CI.

**Contradicción ya señalada:** dominio §24.2 conserva el ejemplo `12/12/12/12/2`, incompatible con cinco cartas/puntos adjudicados por ronda de cinco jugadores. No modificar puntuación ni fórmula de desempate para reproducirlo. B07 usa una traza alcanzable `10/10/10/10/10` para manos reducidas. La corrección editorial corresponde a Arquitectura. No se detectó contradicción bloqueante en las reglas temporales de B08.

## 2. Objetivo, alcance y etapas

Hacer efectivo el tiempo configurado para jugar y permitir continuidad sin navegadores conectados, conservando la partida B07 y sus vistas privadas.

| Etapa | Entrega comprobable | Condición para continuar |
|---|---|---|
| T1 — Plazo y vencimiento | Plazo humano único, cuenta atrás, dirección parcial y sustitución una sola vez por timeout; invalidación de tareas. | Pruebas de borde, concurrencia y recuperación con al menos un primer timeout. |
| T2 — Automático y final por inactividad | Contador consecutivo, segundo timeout, política permanente y finalización base/desempate. | Pruebas del conjunto T1+T2, regresiones y vencimiento real desconectado. |

Son etapas de desarrollo y evidencia del mismo bloque. T1 no autoriza una modalidad de producto ni declarar B08 implementado/verificado completo. Los tipos/funciones pueden prepararse conjuntamente; no se exige dejar una versión parcial operativa para el autor.

**Incluye:** turnos humanos de 15/30/60 segundos, también en fase final y desempate; automático de humanos; avisos mínimos; conservación de revisión 0/2/5/10/15/30 y resultados durante 30 minutos. Sin selectores nuevos. `settings.turnSeconds` sigue trasladándose a `GameSettings.turnTimeout`; `forceTieBreak` mantiene su selector y ejecución existentes.

**Conserva:** B01–B05/T01, selección explícita y genérica 2; inicio único/orden/permisos B06; jugadas, puntos por cartas, reposición, fase final, desempate único, privacidad, retención y otra sala B07. Solo sustituye su limitación de turnos manuales sin plazo; no altera la evidencia histórica.

**Fuera:** bots/dificultades, nuevos parámetros, rediseño, visualización configurable, retirada o sustitución de jugadores, facultad del anfitrión para terminar, vigilancia técnica de dos minutos, persistencia, publicación y despliegue. Los requisitos futuros del MVP permanecen pendientes. B03 continúa gobernando únicamente las salas de espera.

## 3. Comportamiento temporal

### 3.1 Activación y vencimiento

1. Al confirmar el inicio B06, activar el turno inicial y registrar su plazo **antes** de publicar la mesa o devolver la confirmación. Cada turno posterior humano ACTIVE obtiene un plazo al activarse realmente en servidor: tras la jugada anterior o tras concluir la revisión y preparar la siguiente ronda/desempate. No se espera a que el cliente reciba o vea la mesa.
2. Conservar un registro por turno: sala/partida/ronda/turnId/jugador, generación, inicio y vencimiento monotónicos, más referencia pública Unix. Duración = configuración fijada al iniciar. El registro pertenece a aplicación; Game no consulta reloj.
3. Procesar cada lectura/recuperación/acción y callback respecto a los vencimientos debidos antes de devolver una vista o aceptar una acción nueva. Una tarea programada es un aviso para comprobar el reloj, no la autoridad temporal. Reutilizar el criterio serializado de infraestructura §7: `t < vencimiento` puede aceptar; `t >= vencimiento` ejecuta timeout si sigue pendiente. No usar fecha del navegador, llegada del ack ni número de sockets.
4. Aceptar una jugada manual completa invalida el plazo anterior y avanza una sola vez. Al vencer se aplica un único hecho de timeout en el dominio; se invalida ese plazo y se activa el siguiente turno o revisión. Un callback temprano revalida/reprograma, nunca vence antes; uno cancelado/tardío no toca otro turno, sala ni partida.
5. Un nuevo turno inicia su duración completa en su activación efectiva. Un callback retrasado no fabrica vencimientos retroactivos de turnos que aún no habían empezado. La revisión conserva sus reglas B07: no inicia plazos ni acciones automáticas de la ronda siguiente mientras esté vigente.
6. F5, reconectar, abrir pestañas, consultar, repetir solicitudes y selecciones parciales no sustituyen inicio/vencimiento. Repetir `room:start` tampoco vuelve a repartir ni activar el reloj inicial. El servidor sigue programando tareas sin conexiones; la ausencia del anfitrión no cierra IN_GAME.

En revisión, resultado, jugador AUTOMATIC o persona sin turno no hay un plazo humano propio. Al finalizar o desmontar el runtime se invalidan tareas de juego; resultados mantienen solo su retención B07. No aplicar reservas de 30 segundos ni caducidad de espera de 30 minutos a IN_GAME.

### 3.2 Apertura parcial y política de timeout

Conservar aplicación §8.2 y B07: apertura sin valores predeterminados, ambos órdenes de selección y envío al completar ambas, sin botón adicional. La dirección parcial es modificable y privada del abridor; se conserva en servidor para ese turno. La carta parcial permanece solo en la pestaña; no se incorpora al contrato.

| Estado aceptado al vencer | Decisión del dominio |
|---|---|
| Dirección parcial HIGH o LOW | Carta más antigua que siga en mano, conservando esa dirección. |
| Sin dirección aceptada, aunque haya carta local elegida | Carta más antigua y dirección desfavorable según su `playValue` del atributo activo: 1–29 HIGH; 30–58 LOW. |
| No abridor | Carta más antigua, sin modificar la dirección oficial de ronda. |

«Aceptada a tiempo» depende del procesamiento del servidor, aunque el ack llegue después del límite. Una dirección recibida exactamente al vencer no se guarda ni cambia la política. Un intento completo rechazado no guarda su dirección como parcial por efecto secundario. Una petición completa válida conserva el contrato B07: su dirección explícita decide la apertura aunque difiera de una parcial anterior.

### 3.3 Contador y automático

El dominio conserva por humano jugador `status: ACTIVE | AUTOMATIC` y `consecutiveTimeouts: 0 | 1 | 2`; comienza ACTIVE/0. Antigüedad = orden de adquisición existente, sin ordenar visualmente para decidir una jugada.

- Primer timeout: jugar con `mode: TIMEOUT`, contador 1, sigue ACTIVE.
- Jugada manual completa aceptada a tiempo: `mode: MANUAL`, contador 0. Rechazos, duplicados, reconexión o parcial no lo reinician.
- Segundo timeout consecutivo: esa jugada aún es `TIMEOUT`, contador 2 y status AUTOMATIC.
- Turnos posteriores: invocar política pura del dominio; carta más antigua, dirección desfavorable si abre, dirección oficial si no. Registrar `AUTOMATIC`, sin nuevo plazo humano ni más incrementos de contador. Sigue siendo HUMAN y puede ganar cartas, puntos y abrir.

Contador/status continúan entre rondas, fase final y desempate; no se reinician por una transición. El automático es permanente para esa partida, aunque vuelva a conectarse. Conserva su mano privada para verla y consultar Detalles, con acciones manuales deshabilitadas y rechazadas en servidor.

Coordinar actuaciones automáticas inmediatas mediante pasos acotados: sin duración humana ni pausa artificial, pero cediendo ejecución entre continuaciones cuando sea necesario. Revalidar partida/ronda/turno/generación en cada paso. Detener al requerir humano activo, revisión o resultado. La revisión cero no autoriza recursión ilimitada ni saltar publicaciones. Ningún transporte público puede pedir ejecutar el automático, vencer o avanzar la revisión.

### 3.4 Final por inactividad

Evaluar la condición del dominio sobre **todos los humanos jugadores de la partida base**, no sobre sockets, observadores ni solo los empatados que tengan turno en el desempate.

- Durante base, incluida FINAL_PHASE: cuando todos sean AUTOMATIC, completar la ronda actual, adjudicar sus cartas/puntos y conservar su revisión. No reponer, abrir otra ronda base ni iniciar desempate, incluso con `forceTieBreak` y empate máximo. Clasificar por cartas ganadas hasta ese momento; los líderes comparten victoria si empatan. Las cartas no jugadas no producen puntos.
- Durante un desempate ya iniciado: completar esa única ronda y su revisión; reconocer `tieBreakWinnerId` y único `winnerIds`, sin alterar puntos/puestos base.
- Con al menos un humano jugador ACTIVE, continuar normalmente; un observador conectado no evita el fin por inactividad y uno desconectado no lo provoca. Un jugador ACTIVE que no participa en el desempate sigue contando como humano activo.

Concretar `endReason: NO_ACTIVE_HUMAN_PLAYERS`, `completedNormally: false` cuando se cumpla la condición al resolver, incluso si coincide con la última ronda final o sucede dentro del desempate. En los demás finales conservar DECK_COMPLETED/true. Esto distingue el motivo, sin anular al ganador de un desempate terminado ni presentar cancelación técnica. Es la traducción técnica de dominio §§22–24 y aplicación §12; no añade otra condición de fin.

Todas las 58 cartas conservan ubicación lógica única, también al terminar antes de agotar manos/mazo o la función de la indicadora final. No hacer un reparto/descartado ficticio ni sumar las sobrantes. Los snapshots de revisión son referencias, no propietarios nuevos.

La retención comienza cuando aplicación presenta/publica RESULTS tras la última revisión, aunque no haya navegadores conectados. No empieza al pasar el último humano a automático ni al primer acceso posterior. Se conserva el retorno por sesión, acceso al último resultado, caducidad y creación de otra sala B07.

## 4. Presentación acordada

Reutilizar GameScreen, mano/Detalles, panel de estado, avisos y ResultsScreen. En móvil 360/390 y escritorio 1280, sin reorganización general:

- Sustituir «Partida manual» y retirar el aviso de ausencia de límite B07. Mostrar identificación del turno y **«Tiempo de turno · mm:ss»** en Estado de la partida; 60 comienza en 01:00. El contador de revisión B07 aparece solo durante revisión; no mostrar ambos como si corrieran juntos. En actuación AUTOMATIC no mostrar un plazo humano ficticio.
- Cuenta atrás estimada a partir de vencimiento/referencia del servidor y tiempo transcurrido monotónico del navegador; redondear hacia arriba, limitar a cero y recalcular con vistas vigentes. Cada tick no publica estado ni aumenta revisión. `role=timer`, sin anunciar cada segundo. No mover foco, cerrar Detalles ni perder scroll por ticks/presencia.
- Al llegar a cero con vista aún antigua: mostrar «Esperando actualización del servidor…», impedir nuevos gestos para ese turno y resincronizar sin enviar una jugada/timeout. No afirmar localmente que se ha jugado una carta o cambiado a automático. Sin red, conservar aviso de conexión, última mesa y contador estimado; sin reenvío automático.
- Tras timeout confirmado, aviso a todos durante **cinco segundos**: «[nombre mostrado] agotó el tiempo; se jugó su carta más antigua». Usar sufijos de nombres repetidos B02. Si provoca AUTOMATIC, añadir «[nombre] ha pasado a automático». No emitir otro aviso de timeout por sus posteriores jugadas automáticas.
- Con ACTIVE/contador 1, advertencia propia persistente: «No completaste tu último turno a tiempo. Si vuelve a ocurrir sin una jugada manual entre medias, pasarás a automático». Se conserva tras recarga y fuera de su turno; desaparece al aceptar jugada manual completa o al pasar a automático.
- Con AUTOMATIC, marca **«Automático»** en su fila, distinta de «Sin conexión», visible a todos. Aviso propio permanente: «Has pasado a automático. Puedes seguir viendo la partida, pero ya no jugar manualmente». No ofrecer recuperar control. Observador sin advertencia ni controles.
- Mantener aviso B07 de ganador y revisión, incluidos cero y positiva. Si coinciden timeout y resolución, combinar los avisos breves sin ocultar ganador/puntos ni prolongar revisión; no añadir resumen persistente o modal.
- En resultados por inactividad, añadir «La partida terminó porque todos los jugadores humanos pasaron a automático». Mantener clasificación, ganador(es), vencedor de desempate si existe y retorno B07. No confundir con error técnico ni con cierre de espera.

Los avisos se deduplican por hecho/contexto; una recuperación muestra el estado persistente vigente, no reproduce todos los avisos históricos. Mantener teclado, etiquetas y foco; al desaparecer una carta/acción usar el mecanismo B07 de foco seguro. El estado recibido en otra pestaña no envía la carta local parcialmente elegida.

## 5. Contratos y casos de uso mínimos

### 5.1 Acciones y vistas

Conservar exactamente entradas B07 `game:opening-direction` y `game:play`, con `requestId, roomId, gameId, roundNumber, turnId` y dirección/carta según su contrato. Mismos IDs, validación de forma exacta y ack `SocketAck<RoomResponse>`. No aceptar hora, modo, contador, status ni selección parcial de carta del cliente. Mantener rutas HTTP de sala/recuperación/resultados y no-store.

Ampliaciones concretas de la proyección segura:

| Campo | Contrato B08 |
|---|---|
| `game.execution` | Sustituir marcador manual por `TIMED_TURNS`. Capacidad de la versión, no selector ni modo del dominio. |
| `participant.playStatus` / `participants[].playStatus` en IN_GAME | ACTIVE o AUTOMATIC para jugador; null para anfitrión observador. Identidad/role/isPlayer/presence/score se conservan. No añadir por herencia estos campos a otras vistas sin proyectarlos deliberadamente. |
| `game.ownConsecutiveTimeouts` | 0/1/2 del destinatario jugador; null para observador. No enviar contadores privados ajenos; el estado AUTOMATIC sí es público. |
| `game.interaction.turn` | null en revisión; si hay turno, `{ id, playerId, timing }`. `timing: { serverNow, startedAt, endsAt }` para ACTIVE; null para AUTOMATIC pendiente de su paso interno. Los tres tiempos son Unix en ms; no exponer monotónico/generación. |
| `game.round.plays[].mode` | MANUAL, TIMEOUT o AUTOMATIC. No añadir BOT en B08. Son jugadas ya públicas. |
| `openingSelection` y `review` | Mantener proyección B07: dirección parcial solo para propio abridor ACTIVE; null para demás/observador/automático/revisión. Review mantiene id/serverNow/endsAt/nextStage/result. |
| `result.endReason` / `completedNormally` | DECK_COMPLETED/true o NO_ACTIVE_HUMAN_PLAYERS/false conforme a §3.4; conservar resto de resultados B07. |

La duración y el contexto del turno son iguales para todos. `startedAt`/`endsAt` quedan fijos; solo `serverNow` se actualiza al proyectar. Revisión de sala filtra estados antiguos; cambios efectivos de juego/control avanzan revisión coherentemente, sin tick remoto. Mano solo propia, observador `hand: []`. No difundir Game, paquete, mazo, cartas no jugadas, credenciales ni dirección parcial ajena. La retención RESULTS no necesita manos, plazos de turno ni contador privado.

Añadir evento público mínimo **`game:turn-expired`**:

`{ id, roomId, gameId, roundNumber, turnId, playerId, automatic }`

`id` único y estable por turno vencido; `automatic` indica si ese timeout lo pasó a AUTOMATIC. Solo datos públicos, sin carta oculta, contador ni dirección privada. Emitir una vez tras registrar el movimiento, con vistas autorizadas, antes de continuaciones que cambien de ronda. Todos los sockets autorizados de cada sesión reciben vista propia y evento público; no serializar una vista del anfitrión para todos. Reutilizar evento B07 de resolución. Los avisos solo se procesan para la misma partida todavía presentada, se deduplican y no se recrean en lecturas/replays; conservar resolución aunque review=0.

### 5.2 Coordinación interna

| Operación | Responsabilidad |
|---|---|
| Activar oportunidad de juego | Aplicación: crear plazo de ACTIVE una sola vez o programar continuación de AUTOMATIC; integrar inicio B06 y avance B07. |
| Registrar dirección / jugar manual | Casos de uso B07: aplicar vencimientos, autorizar, deduplicar y validar contexto/control; invocar dominio, guardar y publicar antes de continuar. |
| Vencer turno | Aplicación comprueba plazo/contexto; dominio recibe hecho y dirección aceptada, decide carta/dirección/contador/status y aplica jugada. |
| Ejecutar humano automático | Aplicación coordina paso interno; dominio invoca política y valida/aplica su decisión. No socket de máquina. |
| Resolver, revisar y avanzar | Domain decide resultado/próxima etapa; aplicación conserva revisión B07, crea nuevo plazo solo después y programa retención al finalizar. |
| Recuperar y finalizar recursos | Aplicación aplica tareas debidas y proyecta; conserva asociaciones/retención B07 e invalida tareas al terminar/expirar/dispose. |

Puede reutilizar GameCoordinator y los puertos reales Clock/Scheduler/CardPermutation/RoomRepository/RoomRequests/GameChanges. No crear un motor de temporizadores paralelo por anticipado. El registro de plazo puede vivir en Room o en coordinación, pero ha de ser único, recuperable por proyección y coherente con el Game guardado.

## 6. Errores, repetición y concurrencia

- Mantener autenticación y errores B07: SESSION_REQUIRED, FORBIDDEN, INVALID_INPUT, REQUEST_CONFLICT, STALE_GAME_CONTEXT, NOT_YOUR_TURN, CARD_NOT_IN_HAND, ROUND_IN_REVIEW, GAME_FINISHED y los de disponibilidad. Nuevo **PLAYER_AUTOMATIC** para intento manual nuevo con contexto vigente de un humano ya automático: «Has pasado a automático; solo puedes ver la partida». Conflicto de estado 409 donde corresponda en HTTP; los sockets mantienen ack de error.
- Nuevo **TURN_EXPIRED** si la acción nueva dirigida al turno que era vigente al entrar en procesamiento encuentra `t >= vencimiento`: aplicar timeout y devolver «El tiempo de ese turno terminó. Recupera la mesa». El efecto temporal no pertenece a la solicitud rechazada ni guarda su dirección/carta. No es necesario conservar una lista infinita de turnos vencidos: peticiones de contextos anteriores reciben los errores de fase/contexto B07 y recuperan la vista.
- Autorizar sesión/sala/partida; aplicar vencimientos debidos; reconocer registro previo antes de exigir el turno actual para una solicitud nueva. Repetir una aceptación con mismo ID/contenido devuelve vista vigente propia, incluso si ahora es AUTOMATIC, revisión o RESULTS, sin resetear contador, actuar ni repetir avisos. Repetir un error devuelve el registrado; reutilizar ID con contenido/tipo distinto produce REQUEST_CONFLICT.
- Una jugada manual válida antes del límite vence la carrera: un timeout antiguo queda sin efecto. En el límite o después, vence el timeout: no hay segundo movimiento, reinicio de contador ni aplicación al turno siguiente. Dos pestañas, clicks concurrentes o un callback repetido no producen dos cartas.
- Guardar Game, contador/control, plazo siguiente o revisión y deduplicación de aceptación en la misma decisión síncrona de sala, sin IO/await entre validar y registrar. Emitir después; ack perdido/fallo de emisión no permite repetir el movimiento. Serializar por sala con el mecanismo del único proceso; continuaciones futuras revalidan generación y contexto.
- El cliente conserva envío volátil, sin cola ni reenvío tras F5/reconectar. Ante aceptación incierta primero recupera; solo gesto explícito puede reintentar mismo ID si sigue siendo pertinente. Una vista de turno/control nuevo descarta parcial/pending anterior; un ack o HTTP antiguos no reactivan control, resucitan mano ni sustituyen otra sala/resultado.

## 7. Responsabilidades y dependencias

| Responsabilidad | Capa / piezas existentes | Dependencias y comprobación |
|---|---|---|
| Política de carta/dirección, contador/control, modos, fin por inactividad y conservación | `server/domain/game.ts` y política pura si separarla aclara | Tipos/datos puros; sin reloj, Node, transporte, shared de red, aplicación o React. Pruebas puras e invariantes; Game valida decisión de política. |
| Plazo/contexto, permisos, dedupe, pasos automáticos/revisión/retención y proyecciones | `Room`, `GameCoordinator`, integración de `RoomUseCases`/`RoomCoordinator`, `initialGameView`/`resultsView` | Dominio, contratos seguros y puertos propios. Sin adaptadores concretos. Pruebas con reloj/planificador sustitutos, callbacks viejos y emisión fallida. Presence no decide automático. |
| Medición monotónica, tareas cancelables, memoria, autenticación/decodificación y emisiones | `infrastructure/time.ts`, repositorios y adaptadores HTTP/Socket.IO | Implementar puertos; sin seleccionar cartas ni actualizar contador por cuenta propia. Conexiones reales, límite temporal y payloads inspeccionados. |
| Conexión de runtime y dispose | `server/composition/createApp.ts` y conexiones vigentes | Elegir adaptadores/compartir una coordinación; no reglas. Arranque normal y tareas funcionando sin clientes. |
| Tipos públicos y presentación | `shared/contracts`, GameScreen/useGameActions/useRoomFlow, contador reutilizable y ResultsScreen | Solo contratos seguros; sin imports de server, políticas oficiales o fechas enviadas para acreditar tiempo. Navegador, teclado, privacidad y filtrado de vistas antiguas. |

Catálogo/validador/medios B04 no cambian, ni JSON aprobado, orden base o configuración B05. Reutilizar test doubles de tiempo existentes; nuevas capacidades de prueba quedan en tests, sin endpoints/flags de reloj o ganador en producto.

**Autonomía:** nombres internos, funciones/clases, ubicación del registro temporal, factoring del contador y mecanismo acotado de continuaciones; montaje/fixtures y organización de pruebas, conservando garantías. No decidir nuevas duraciones, reactivación manual, política de cartas/dirección, criterio de fin, UI distinta a §4 ni nuevos modos. Consultar solo una contradicción normativa nueva o una necesidad real de cambiar comportamiento/arquitectura, citando la regla; no pedir otra revisión general por cambios descriptivos compatibles.

## 8. Ejemplos comprobables

| Caso | Dado / cuando | Entonces |
|---|---|---|
| E1 — Antes, en y después | Turno 15 s; acciones independientes a 14.999, 15.000 y 15.001 ms, con callback todavía pendiente | Primera puede aceptar una jugada válida; otras vencen una vez. Enviar una hora anterior desde navegador no cambia el resultado. |
| E2 — Parciales | Abridor con más antigua A de valor activo 29; carta B solo local; sin dirección aceptada al vencer | Juega A/HIGH/TIMEOUT. Si LOW fue aceptada antes, juega A/LOW. LOW en el instante exacto no cuenta. Valores 1, 29, 30 y 58 prueban extremos. |
| E3 — Contador | Ana timeout, después manual a tiempo, después timeout; en otra traza dos timeouts con dirección parcial entre ellos | Primera traza 1→0→1, sigue ACTIVE. Segunda 1→2, último movimiento TIMEOUT, siguientes AUTOMATIC; reconectar no devuelve control. |
| E4 — Revisión | Última jugada/timeout resuelve; revisión 5 s; siguiente abridor humano | No corre el turno durante revisión. Tras avanzar hay nuevo plazo completo. Con cero se publica resultado y continúa sin pausa añadida. |
| E5 — Sin humanos activos | Dos jugadores; el segundo consecutivo del último ACTIVE ocurre antes de completar la ronda | Completar con automático las jugadas restantes, puntuar/revisar y RESULTS/NO_ACTIVE_HUMAN_PLAYERS. Sin reposición ni desempate, con 58 cartas conservadas. |
| E6 — Desempate | Partida legal empatada llega a desempate con al menos un humano ACTIVE; este pasa a AUTOMATIC en su turno | Completar ronda única, revisar y destacar vencedor; puntos/puestos base intactos, motivo de inactividad si todos los humanos jugadores son AUTOMATIC. |
| E7 — Desconectado real | Dos sesiones crean/inician con 15 s; cortar el transporte del jugador activo sin detener servidor ni sustituir reloj | Tras plazo real el servidor juega TIMEOUT. El otro ve avance; al recuperar misma sesión vuelve misma partida con estado/contador vigentes. |

## 9. Criterios y verificación previstos

Todos pendientes; marcar solo con evidencia nueva localizable. Cada prueba debe indicar etapa, reloj/permutación y si usa conexiones reales.

- [ ] **B08-01 — Configuración:** 15/30/60 efectivos desde primer turno, sin nuevo selector; revisión y desempate configurados conservados. Inicio repetido/concurrente no repite activación/reparto.
- [ ] **B08-02 — Apertura:** ambos órdenes/autosend, parcial privada modificable y recuperable; dirección aceptada antes del límite conservada en timeout. Carta solo local no altera política; ninguna parcial renueva reloj/contador.
- [ ] **B08-03 — Política:** más antigua restante en apertura/no apertura, fase final y mano reducida de desempate; umbrales 1/29/30/58 del atributo activo, no displayValue/indicador de la carta propia. Primer movimiento TIMEOUT.
- [ ] **B08-04 — Bordes:** antes/en/después del límite para parcial y jugada completa; igualdad vence aunque no haya corrido callback. Callback temprano no vence; retrasado aplica solo plazo pendiente, sin tiempos retroactivos de turnos nuevos.
- [ ] **B08-05 — Unicidad:** manual/timeout concurrentes, mensajes repetidos/antiguos y callbacks duplicados/cancelados: una carta y un avance. Contexto completo impide afectar al siguiente turno/ronda/otra sala.
- [ ] **B08-06 — Recuperación:** F5/corte/restauración/varias pestañas conservan deadline y contador; nadie necesita permanecer conectado para programar vencimiento. Ack incierto y respuesta atrasada no reenvían ni reactivan una acción vieja.
- [ ] **B08-07 — Revisión:** cero y positiva conservan resolución, puntos, aviso de ganador y revisión final. No hay próximo plazo/acción automática antes del avance; después plazo humano completo una sola vez.
- [ ] **B08-08 — Reloj/vista:** mismo turnId/deadline para todas las sesiones/pestañas; serverNow actualizado sin renovar ni revisión por segundo. Cuenta atrás móvil/escritorio, cero esperando servidor; autoridad monotónica independiente de hora cliente.
- [ ] **B08-09 — Contador:** primer timeout ACTIVE/1; solo manual completa válida a tiempo reinicia a 0. Parciales, inválidas, replays, recarga/reconexión no; continúa a través de fase final/desempate.
- [ ] **B08-10 — Automático:** segundo consecutivo TIMEOUT/2/AUTOMATIC; siguientes modos AUTOMATIC sin plazo humano. Más antigua/dirección del dominio; conserva puntos/posibilidad de ganar/abrir, tipo HUMAN y estado irreversible.
- [ ] **B08-11 — Permisos:** automático conectado no juega manualmente; observador/otra sesión/tipo de mensaje manipulado tampoco. Repetición de una aceptación histórica sigue idempotente, no crea rechazo nuevo ni reinicia contador.
- [ ] **B08-12 — Continuación:** pasos automáticos circulares sin duplicados; parar en humano/revisión/resultado, revisión cero acotada. Otra sala sigue respondiendo; callbacks invalidan al avanzar/dispose, sin tareas activas de turno tras RESULTS.
- [ ] **B08-13 — Fin base:** todos los humanos AUTOMATIC, también con observador conectado, fase final o empate forzado: completar ronda/puntos y revisión, final por inactividad sin nueva ronda/reposición/desempate. Manos/mazo sobrantes conservados sin puntuarlos.
- [ ] **B08-14 — Fin desempate:** si ya empezó, completar y reconocer vencedor aun tras último humano automático; sin puntos/cartas ganadas adicionales ni segundo desempate. Si un humano del roster base sigue ACTIVE fuera de esa ronda, no inferir inactividad total.
- [ ] **B08-15 — Cartas y partidas:** trazas legales de 2–5 jugadores, anfitrión jugador/observador, HIGH/LOW, humanos y mezcla ACTIVE/AUTOMATIC hasta fase final/desempate cuando corresponda. 58 ubicaciones únicas tras cada transición; puntuación/reparto/orden B07 conservados.
- [ ] **B08-16 — Resultados:** DECK_COMPLETED o NO_ACTIVE_HUMAN_PLAYERS inequívocos, ganadores y puestos correctos; revisión y retención original de 30 minutos, incluso sin clientes; recuperación, retorno en pestañas, otra sala y expiración antigua sin borrar la nueva.
- [ ] **B08-17 — Privacidad:** inspeccionar HTTP, ack y eventos reales para jugador/observador/otra sesión, incluidos timeout/auto/resultado; solo mano propia, dirección parcial propia y campos seguros, sin paquetes completos/orden mazo/credenciales/contadores ajenos.
- [ ] **B08-18 — Avisos/accesibilidad:** cinco segundos/dedupe, advertencia propia persistente recuperable, marca AUTOMATIC distinta de presencia y aviso propio sin acciones; conservar ganador, Detalles, teclado/foco/scroll a 360/390/1280 sin rediseño.
- [ ] **B08-19 — Vencimiento real:** al menos E7 con reloj/planificador y compilación normales, cliente activo desconectado de verdad, sin sleeps/avance simulados como prueba del tiempo real. Registrar plazo/observación/recuperación y diferencia respecto a reloj controlado.
- [ ] **B08-20 — Regresiones/arquitectura:** B01–B07/T01/activación y genérica intactos; `npm run check`, navegador pertinente sobre build vigente, control automático de imports/ciclos y revisión semántica de §7. Completar T1 y T2 antes del cierre.

### Plan proporcionado

1. **Dominio:** ampliar `server/domain/manualGame.test.ts`/`game.test.ts` o añadir suite específica: políticas, contador, modos, finales y ubicaciones. Reutilizar paquetes/permutaciones validados y trazas legales B07; no fabricar puntos/ganadores para acreditar una partida alcanzable.
2. **Aplicación con tiempo controlado:** extender `server/application/manualGame.test.ts`, `results.test.ts`, `startGame.test.ts` y apoyos `tests/support/{controlledTime,manualApplicationCases,manualGameTrace}.ts`. Programador que permita retrasar/repetir callbacks y avanzar tiempo sin ejecutarlos; probar límites, generaciones, revisión/retención y fallo de emisión. No basta un fake timer que siempre dispare puntualmente.
3. **Integración:** conexiones HTTP/Socket.IO reales con reloj sustituido para bordes reproducibles y privacidad, sobre el montaje actual. Separar de un vencimiento de 15 s con SystemClock/TimerScheduler y transporte cerrado/cortado, manteniendo otra sesión y proceso activos; no confundir presencia detectada con vencimiento de turno.
4. **Navegador:** añadir casos B08 en `tests/browser` y reutilizar manualGame/initialGame/lifecycle/configuration/activation y otras regresiones pertinentes. Compilar código vigente y arrancar su servidor correcto. Fixtures deterministas para automatismo, fase final y empate; montaje fuera del producto. Revisar dos sesiones independientes, dos pestañas de una, observador y tamaños establecidos. Probar sin clientes conectados además mediante integración, hasta revisión/RESULTS por inactividad.
5. **Puertas:** `npm run check` y `npm run test:browser` sobre compilación B08 final, registrando comandos/entorno y resultados reales. Conservar las garantías de las 63 pruebas históricas, adaptando los casos que explícitamente esperaban ausencia de reloj: usar reloj controlado o jugadas a tiempo, no desactivar B08 mediante un modo de producto. Aumentar solo tiempos de pruebas que realmente esperen segundos reales; no ampliar plazos del juego para evitar fallos. El control automático se complementa con revisión de políticas/coordinación/proyecciones y ausencia de bucles bloqueantes.

**Prueba manual para autor/implementación:** arrancar compilación vigente, crear dos sesiones, seleccionar genérica 2, turno 15/revisión 5 y comenzar. Dejar vencer un turno, comprobar aviso/plazo siguiente y advertencia propia; recuperar/recargar esa sesión y completar manualmente otro turno para comprobar reset. En otra traza provocar dos fallos consecutivos, comprobar marca/visualización sin control tras reconectar. Repetir con observador y dos invitados; cerrar todas las pestañas después de iniciar y volver antes de expirar resultados: ronda final por inactividad, revisión y resultado existentes sin cierre del anfitrión. Usar fixture legal separada para desempate/fase final y revisión cero; una partida corta por abandono no acredita fase final/desempate. Comprobar retorno/otra sala y móvil/teclado. Registrar qué recorridos fueron humanos, automatizados o controlados.

**C09–C10:** preservar validación/versión/publicación, instantánea, recursos e icono, y privacidad B04–B07; B08 añade uso seguro de cartas por timeout/automático y presentación temporal. No declarar completos C09–C10 por esta especificación ni por las pruebas nuevas: mantener límites de comprensión con usuarios, equilibrio, dispositivos físicos y otras capacidades del MVP pendientes. Una prueba de reloj no acredita validación editorial ni despliegue.

## 10. Decisiones, cambios y responsables

| Tema | Estado / fuente |
|---|---|
| Plazos, política, contador, automático irreversible y fin | Confirmados por autor y fuentes citadas; no reabiertos. |
| Cuenta atrás de turno | Autor confirma 04/10: panel de estado, móvil/escritorio, sin modal/sonidos. |
| Timeout/automático | Autor confirma 04/10: aviso breve de cinco segundos a todos, advertencia propia persistente tras primero, marca pública/aviso propio permanente tras automático. |
| Representación de plazo/control/evento/errores | Concreción técnica de §§5–6 compatible con fuentes; implementación conserva significado y contratos especificados. |
| Errata §24.2 | Pendiente editorial ya identificada en B07/contexto; no modificar reglas ni TFM en este encargo. |

No quedan preguntas funcionales de presentación abiertas que bloqueen B08. No se ha solicitado otra revisión transversal de arquitectura.

| Fecha | Cambio | Criterios/fuentes afectados |
|---|---|---|
| 04/10/2026 | Concreción de B08 aprobado y presentación confirmada; sin ampliación de alcance | B08-01–20; requisitos generales conservados. |

**A trasladar tras implementación:** coordinación actualiza contexto con estado/evidencia real y próximos pendientes; Arquitectura actualiza descripción de aplicación §§6–12 (contratos parciales ya fijados, reloj/automático y resultado por inactividad) e infraestructura §§7–8 (descripción todavía futura/B06, capacidades efectivamente entregadas y plazos de juego frente a espera). Mantener historial B06/B07 y requisitos de bots/vigilancia de dos minutos pendientes; corregir errata de dominio §24.2 en su ámbito. Las presentaciones de §4 y concreciones seguras de §§5–6 deben quedar referenciadas, sin duplicar toda la especificación ni inventar una opción manual permanente.

Implementación puede actualizar README vigente, este bloque/cierre, prompt si precisa instrucciones operativas y descripción de módulos en APP. Entregará conclusiones para coordinación/Arquitectura. **No editar ninguna fuente general de TFM, no push, PR ni despliegue.** Trabajar en rama B08 nueva desde main integrado o sucesor compatible, conservando documentación y cambios existentes; commits locales.

## 11. Preparación y cierre

[Prompt para implementación](PROMPT_IMPLEMENTACION_BLOQUE_08.md).

**Base efectiva comprobada por implementación, 04/10/2026:** `main`, HEAD y referencia local `origin/main` = `097cffc21e1224aebc30ed3c353df837f4166839`, entrega integrada B06/B07. Cambios locales iniciales: proceso modificado y especificación/prompt B08 sin registrar; conservados en una preparación documental separada. Se crea `feat/b08-temporizacion-automatico` desde ese HEAD, sin restaurar ni consultar/publicar remoto. Comprobación nueva de base `npm run check`: salida 0, 295/295 en 28 archivos (19,25 s; inicio 21:56:28 Europe/Madrid), tipos/lint/build correctos, 57 módulos sin imports prohibidos/ciclos. Esta ejecución acredita la base, no B08. La batería base de navegador se registra al terminar. Huellas iniciales de los cuatro documentos TFM y ambos JSON APP/ASSETS conservadas para comparación al cierre; ninguna fuente general ni contenido autorizado será editado.

**Cambio de código B08:** pendiente. **Pruebas del producto/arquitectura ejecutadas en SDD:** ninguna. **Verificación B08:** pendiente, sin casillas acreditadas por evidencia anterior. La comprobación documental de base, fuentes, contratos y enlaces no constituye prueba de juego.

**Comprobación documental 04/10/2026:** enlaces locales de bloque/prompt/proceso existentes; 20 criterios únicos pendientes y siete ejemplos; `git diff --check` sin incidencias. Cambios limitados a esos tres documentos SDD. SHA-256 de contexto, dominio, aplicación e infraestructura idénticos a los leídos al comenzar la preparación. Sin cambios de rama, código, baraja ni fuentes generales.

Al cerrar, implementación añadirá base/commit, etapas T1/T2, criterios y pruebas efectivas, comandos/entorno, fallos y reparación, conexiones/reloj/entropía usados, vencimiento real desconectado, revisión de dependencias/privacidad y límites. No cambiar resultados históricos B04–B07. Mantener separados los requisitos no entregados y cualquier recorrido manual aún pendiente.
