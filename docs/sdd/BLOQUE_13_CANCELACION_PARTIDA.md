# B13 — Cancelación de partida por el anfitrión

**Estado:** ampliación funcional aprobada por el autor el **11/10/2026**; implementada y verificada técnicamente en local el mismo día. Check y selección final de navegador correctos. La revisión humana y alineación normativa de fuentes generales siguen pendientes, separadas de la evidencia técnica de §10; no se declara cerrado el traslado normativo.
**Numeración:** comprobada libre en los documentos SDD antes de crear este archivo.
**Base observada:** rama `fix/ghcr-asociacion-revisada`, HEAD `ee2efbb9d2b4515884629a2578ebc75697202865`; main local `2603d6638f6cc1c1a9f019386359b5e7f1967c8d`. Cambios locales previos en `docs/operacion/GITHUB_Y_RECUPERACION.md` y `tests/browser/tableLayout.spec.ts`: conservarlos, sin incluir su resolución en B13. No se cambió de rama ni se consultó GitHub. B07/B08/B09, presentación B12 y corrección T04 están presentes en el código/documentación consultados; no exigir que commits originales sean ancestros cuando las integraciones se hicieron mediante squash.

**Fuentes:** [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md), [organización §§2/4–5 y mapas B07–B09](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md); [B07 §§3/5–6](BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md), [B08 §§3/5–7](BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md), [B09 y cierre](BLOQUE_09_BOTS.md), [T04](BLOQUE_T04_AVISO_RESULTADO_ANTERIOR.md); [contexto §9, aprobación B13](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), [dominio §§8/22–24/26](../../../../TFM/Planificación/DOMINIO_KARTA3.md), [aplicación §§3/7/10–16](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), [infraestructura §§5–8](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md).

## 1. Objetivo, decisiones y alcance

Permitir al anfitrión terminar para todos una partida en curso mediante confirmación, conservar un resumen parcial autorizado y liberar inmediatamente las sesiones para otra mesa.

**Confirmado:** anfitrión jugador u observador, turnos/revisión/desempate, resumen sin ganador, puntos de rondas resueltas, retención de 30 minutos y ninguna reactivación. La aprobación del 11/10 sustituye la exclusión anterior de esta facultad. B09 usa hoy EASY/HARD por T02; no reabrir sus políticas.

**Fuera:** abandono individual de partida activa, revancha, transferencia de anfitrión, vigilancia/cancelación técnica de dos minutos, nuevas reglas de puntuación, rediseño, persistencia, publicación y despliegue. Conservar los recorridos y garantías B01–B12/T04, incluido que desconectarse no equivale a cancelar.

**Dependencias presentes:** Game y coordinación de partida/resultados B07, plazos y automático B08, ejecución de bots B09/T02, mesa actual y separación de contextos T04. Reutilizar esos componentes; no implementar una finalización paralela. La alineación normativa de las fuentes generales corresponde a Arquitectura (§9).

## 2. Recorrido y presentación

1. En `IN_GAME`, el anfitrión ve **«Cancelar partida» arriba a la derecha**, dentro de la cabecera/contenedor actual. Visible también si observa, no participa en el desempate o su jugador pasó a AUTOMATIC; no depende de su turno/control manual. Invitados no ven el control y el servidor rechaza su uso. Mantener acceso/foco sin superponer título o datos en móvil.
2. Abrir una confirmación accesible con estos textos exactos:

   **«¿Cancelar la partida para todos?»**

   **«La partida terminará inmediatamente. Todos podrán consultar el resumen y crear o unirse a otra mesa.»**

   Acciones: **«Seguir jugando»** y **«Cancelar partida»**.

3. Antes de confirmar, «Seguir jugando», Escape o cerrar el diálogo no envían acciones ni cambian el juego; volver el foco al botón. El diálogo **no pausa plazos, revisión ni bots**. Foco inicial en la acción no destructiva; usar el patrón accesible existente, sin nuevos atajos de cancelación.
4. Confirmar envía una intención para la sala/partida mostrada. Mostrar «Cancelando…» y evitar doble envío mientras se espera; sin terminar localmente ni modificar puntos. No enviar estando desconectado ni encolar para reconexión. Si el juego alcanza RESULTS mientras el diálogo está abierto, cerrarlo y seguir el resultado aceptado, con foco en su título.
5. Al aceptar la cancelación, todos los humanos originales reciben el resumen; desconectados lo recuperan al volver. Reutilizar ResultsScreen: título **«Partida cancelada por el anfitrión»**, baraja/versión y **«Puntuaciones parciales»**. Mostrar jugadores y puntos, sufijos/self y marcas de bots actuales; observador aparte sin puntos. Para este resumen no mostrar columna de puesto, victoria, ganador, badges de ganador ni distinción de vencedor de desempate. Conservarlos en resultados no cancelados.
6. Indicar **«Puntos de rondas ya resueltas. No hay ganador.»** y la conservación de 30 minutos desde publicación, sin renovación. No mostrar manos, indicadora, jugadas, mazo oculto, presencia, control ni contadores. Retirar avisos transitorios de turno/ganador de ronda del contexto cancelado; no heredarlos al resumen o a otra partida.
7. «Volver al inicio» conserva el recorrido por sesión/todas sus pestañas y acceso «Ver último resultado». La liberación de la asociación ya ocurrió al cancelar: permanecer consultando el resumen no ocupa una partida activa. Si la sesión tiene una nueva sala B, salir/consultar el resumen A no libera B; recuperar su asociación según el recorrido vigente. No se incorpora un abandono individual de B.

## 3. Transición terminal y prioridades

Reutilizar `Room.status: 'RESULTS'` y `Game.phase: 'FINISHED'`, distinguiendo el motivo **`HOST_CANCELLED`**. No introducir un estado CANCELLED paralelo ni confundirlo con cierre de espera, inactividad o futura cancelación técnica.

| Situación del servidor después de preparar vencimientos debidos | Cancelación nueva |
| --- | --- |
| IN_GAME: PLAYING/FINAL_PHASE/TIE_BREAK, turno humano o máquina | Permitida al anfitrión. |
| IN_GAME: revisión vigente, incluida la última base o del desempate | Permitida; publicar resumen inmediatamente, sin esperar el resto de revisión. |
| Revisión vencida, siguiente etapa ROUND/TIE_BREAK | Aplicar primero su avance vigente; si continúa IN_GAME, cancelar esa misma partida sin nuevos puntos por cancelar. |
| Revisión final vencida, siguiente etapa RESULTS | Aplicar primero el final; devolver GAME_FINISHED. Igual en el instante exacto aunque el callback no se haya ejecutado. |
| RESULTS por fin normal/inactividad ya registrado | Inmutable: una petición tardía nunca sustituye motivo, vencedor o retención. |
| RESULTS por HOST_CANCELLED, todavía autorizado/disponible | Éxito idempotente con el mismo resumen; sin nueva transición/publicación/plazo. |

**Límite preciso:** `Game.result` puede contener una clasificación calculada mientras sigue la revisión; eso no equivale al terminal de aplicación. El cierre definitivo vigente se registra al avanzar tras revisión: `Game FINISHED` y `Room RESULTS` con su retención, antes de emitir. Antes de ese registro y antes del vencimiento debido puede aceptarse cancelación; después nunca se reemplaza. Con revisión cero, la continuación vigente registra el final sin una ventana artificial de cancelación.

Preparar tiempo/estado antes de decidir y antes de resolver replays, con las prioridades monotónicas de infraestructura §7/B08. No atender la hora del navegador o del ack. Mantener continuaciones acotadas: no vaciar una cadena de bots/automáticos para fabricar un final previo a la cancelación. Una jugada/timeout aceptado primero conserva su efecto; cancelar primero impide cualquier movimiento posterior.

La aceptación es una sección síncrona por sala, sin IO/await entre validar y registrar: autorizar/contextualizar, producir sucesor terminal, invalidar ejecución, fijar retención una vez, liberar asociaciones de todos los humanos, guardar Room/índices/dedupe y programar solo retención **antes de emitir**. Capturar los destinatarios originales para publicarles vistas aun cuando `activeSessions` quede vacío. No usar `room:closed` ni `results:home` para fingir salida voluntaria/cierre de espera.

Cancelar tareas de turno, bot/automático, revisión y continuaciones de esa partida, limpiar parcial/registro de turno/revisión e invalidar generación. Callbacks ya extraídos de la cola deben revalidar objeto/contexto/generación y estado terminal; cancelar el handle no basta. Ninguna tarea antigua puede continuar, reponer, repartir desempate, puntuar o sustituir retención. No afectar tareas de otras salas.

### Puntos y cartas

La operación pura de Game congela los puntos derivados de `wonCards`. No resolver ni adjudicar jugadas incompletas, no elegir vencedor, completar ronda, reponer o iniciar desempate como efecto de cancelar. Una ronda BASE ya resuelta conserva puntos, también en revisión; desempate no suma puntos y la cancelación no distingue a su vencedor. Si se cancela antes de resolver ninguna ronda, todos tienen cero.

Conservar las 58 ubicaciones lógicas internas: cartas ya ganadas permanecen ganadas; manos, mazo, indicadoras y jugadas no adjudicadas no desaparecen ni se duplican para simular un final. Son estado terminal privado hasta su limpieza, sin nuevas acciones ni transporte de esas cartas. El resultado parcial conserva jugadores y fórmula de posición por puntos existente, con empate ordenado por orden base, pero no se presenta como clasificación final/victoria.

**Ampliación real del dominio:** D-INV-14 exigía resolver la ronda antes de finalizar. B13 introduce la excepción expresa HOST_CANCELLED: ronda incompleta terminal sin adjudicación. Esa excepción no se aplica al fin normal o por inactividad; sus reglas siguen intactas.

## 4. Contrato implementable y errores

**Nueva acción Socket.IO:** `game:cancel`.

```text
CancelGameRequest = { requestId: string, roomId: string, gameId: string }
ack = SocketAck<{ room: ResultsRoomView }>
```

Forma exacta: tres cadenas no vacías, máximo 100 caracteres, como contratos vigentes. Rechazar ausentes/adicionales/tipos incorrectos; no admitir rol, sessionId, motivo, puntos, plazo, roundNumber ni turnId declarados. Identidad desde sesión autenticada; permiso HOST del roster original de la sala identificada, no `isPlayer`, turno o asociación activa actual. Identificar Game, no código reutilizable: el diálogo puede atravesar un cambio de turno/ronda de la misma partida.

Extender `ResultsRoomView.result.endReason` con `HOST_CANCELLED`; para ese motivo `completedNormally: false`, `winnerIds: []`, `tieBreakWinnerId: null`, standings/puntos congelados y retención vigente. Mantener el resto del sobre RESULTS B07/B09, sin `game`, manos ni paquetes completos. Dominio define su propio resultado puro; contratos compartidos solo transportan la proyección segura.

Publicar `room:state { room }` a cada sesión humana original mediante GameChanges, con su participant autorizado y revisión terminal posterior. Ack, HTTP y eventos deben coincidir. No añadir un evento paralelo de cancelación si el estado terminal ya la comunica. Reutilizar `GET /api/results/:gameId`, `/resultado/<gameId>`, current/resume, `results:return-home` y `results:home`, con no-store y permisos originales.

| Error | Condición y efecto |
| --- | --- |
| INVALID_INPUT | Forma/tipos no válidos; sin cancelación. |
| SESSION_REQUIRED / FORBIDDEN | Sin identidad o no anfitrión original autorizado, incluido invitado que falsifica rol; sin revelar estado privado. |
| ROOM_NOT_AVAILABLE | Sala ausente/eliminada; no recuperarla desde dedupe. |
| STALE_GAME_CONTEXT | Game ausente, ID distinto o WAITING; no cancelar otra partida de esa sesión. |
| GAME_FINISHED | Resultado no cancelado ya confirmado, incluido vencimiento final procesado primero. Recuperar el resultado real; no transformarlo. |
| REQUEST_CONFLICT | Mismo requestId de sesión con otro tipo/contenido. |
| INTERNAL_ERROR o fallo de transporte | Resultado desconocido si pudo registrarse; recuperar, no afirmar rechazo ni revertir. |

Registrar dedupe mínimo `CANCEL_GAME` y firma sala/partida, sin guardar manos o vistas obsoletas. Repetición aceptada devuelve resumen vigente autorizado; otros requestId de pestañas del anfitrión para Game ya HOST_CANCELLED tienen éxito sin efecto adicional. No renuevan revisión/plazo, no emiten otro aviso ni liberan una nueva asociación. Guest sigue sin permiso aunque ya esté cancelada. Después de caducidad no recrear resultado ni autorización a partir de un replay.

## 5. Recuperación, sesiones y retención — T04

Separar **roster autorizado del resumen**, **asociación activa por sesión** y **vista que se está consultando**. Tras aceptar, liberar inmediatamente todas las asociaciones de A, sin esperar «Volver al inicio», desconexión o caducidad. Repositorio conserva el recurso/autorización originales; current/resume devuelve null o la nueva sala B, más el último resultado autorizado. El código de A sigue reservado hasta caducar como en B07; nunca admite entradas/reinicio.

Publicar el resumen cancelado con `presentedAt/expiresAt` fijados antes de la primera emisión y plazo monotónico **aceptación/publicación + 30 minutos**. No esperar revisión ni recepción por clientes. Lecturas/F5/replays/retorno y fallos de emisión no lo renuevan. En el límite exacto ya no puede recuperarse aunque su callback esté pendiente. Reinicio conserva la pérdida de memoria vigente.

Conservar guards T04: avisos/pending pertenecen a sala/gameId; respuestas y eventos antiguos de A no borran B, no le añaden mensajes ni disparan una recuperación obsoleta. Leer explícitamente A sigue mostrando A o su indisponibilidad propia, sin revincularse ni sustituir B. Mostrar A no acredita asociación activa a A. Una actualización atrasada IN_GAME nunca desplaza RESULTS de A; una confirmación cancelada A tampoco desplaza una B ya aceptada.

**Confirmación incierta:** conservar requestId/payload de ese gesto en memoria; comunicar «No se pudo confirmar la cancelación. Recupera el estado de la partida». Recuperar primero el resultado autorizado del gameId solicitado, usando el endpoint vigente. Si no hay resultado, recuperar current/resume: puede seguir IN_GAME, haber terminado/caducado o tener B activa. No tratar un fallo de red como caducidad ni un current null como prueba de cancelación. Solo un reintento explícito, tras recuperación pertinente, reutiliza el mismo ID; sin cola/reenvío automático/F5. Respuestas de recuperación validan destino/contexto antes de cambiar pantalla o aviso, como T04. Tras el timeout de transporte no bloquear indefinidamente la salida del diálogo.

Si llega estado terminal aceptado mientras se espera el ack, aplicarlo y cerrar el diálogo; el ack posterior solo confirma ese hecho y no vuelve a abrirlo. Al reconectar una pestaña que aún mostraba IN_GAME A, si current/resume no tiene asociación y lastResult identifica A, recuperar su resumen autorizado antes de mostrarlo. No hacer esa apertura automática desde una portada elegida expresamente ni si B ya es el contexto vigente. Recargar `/resultado/A` recupera resumen si aún autorizado; la ruta anterior de sala recupera la asociación actual o portada con acceso al último resultado, nunca juego A. Permitir B mientras otra pestaña consulta A; sigue siendo una sola partida activa por sesión.

«Volver al inicio» sigue siendo por sesión y conserva filtros de contexto. En A cancelada no realiza una liberación nueva. Un retorno nuevo autorizado, sin B activa, comunica `results:home` una vez a esa sesión aunque ya esté liberada, para que sus pestañas de A sigan el recorrido; es navegación, no otra desvinculación. No emitirlo como parte de cancelar para todos. Un retorno nuevo a A con B activa mantiene el rechazo STALE_GAME_CONTEXT vigente y recuperación de B; un replay de retorno aceptado no vuelve a desvincular ni emitir. Caducar A limpia solo su recurso, tareas, índices/dedupe/autorización, comparando IDs: jamás liberar/borrar B ni catálogo/medios compartidos.

## 6. Responsabilidades y dependencias

| Responsabilidad | Capa/piezas previstas | Límites y comprobación |
| --- | --- | --- |
| Terminal cancelado, puntos parciales, cartas/resultados | Dominio `Game` | Transición pura e inmutable, sin reloj/sesión/transporte; pruebas de terminal, conservación y no adjudicación. No decidir quién es anfitrión aquí. |
| Permiso, vencimientos, dedupe, ejecución y retención | Aplicación `GameCoordinator`, delegación RoomUseCases | Dominio, contratos/puertos; sin adaptadores. Usar Clock/Scheduler/GameChanges existentes; pruebas con tiempo/entropía controlados y callbacks inválidos. |
| Estado de sala, generaciones y liberación | Modelo `Room`; puerto RoomRepository/RoomRequests existentes | Room conserva retención/liberados; aplicación coordina. Repositorio implementa índices por roomId y no elimina el roster retenido. Probar A/B coexistentes y limpieza. |
| Decodificación, sesión, emisión/recuperación | Infraestructura gameInput/socketRooms, HTTP/repo/tiempo existentes | Forma exacta y traducción; sin reglas de puntos o cancelación por cuenta propia. Integración real de permisos, ack y no-store. |
| Dependencias concretas | Composición vigente | Conectar capacidad a la coordinación existente; sin segundo planificador o puertos vacíos. Revisión de imports/ciclos. |
| Botón/diálogo/resumen y contexto | Cliente GameScreen/ResultsScreen/useRoomFlow, acción/hook local mínimo | Solo contratos seguros; sin Game/servidor. Mantener T04 y separar resumen consultado de asociación; pruebas de foco/privacidad/varias pestañas. |

Autonomía: nombres privados, extracción local de funciones, montaje accesible del diálogo, integración mínima de tipos y reutilización de presentaciones/soportes. No crear infraestructura genérica de cancelaciones ni refactor general. Contrato/motivo, permisos, prioridades, puntos y retención aquí fijados no son decisiones abiertas.

## 7. Ejemplos y criterios comprobables

| Ejemplo | Dado / cuando | Resultado |
| --- | --- | --- |
| E1 | Primera ronda con dos cartas jugadas y anfitrión confirma | Cero puntos, ninguna carta adjudicada, resumen sin ganador y sesiones libres. |
| E2 | Ronda BASE resuelta con revisión vigente y confirma | Conservar sus puntos; cancelar la revisión y no reponer ni abrir otra ronda. |
| E3 | Revisión final con nextStage RESULTS, tiempo límite−1 ms | Cancelar con todos los puntos ya resueltos, sin ganador. |
| E4 | Misma revisión a límite exacto, callback retenido | Preparación registra final vigente; GAME_FINISHED, motivo/vencedor/retención originales. |
| E5 | Desempate en curso o su revisión, anfitrión observador confirma a tiempo | Resumen con puntos base, sin vencedor de desempate ni nuevos puntos. |
| E6 | Timeout debido acepta último movimiento de ronda antes de cancelación | Conservar efectos/puntos de la ronda si se resolvió; si ya confirmó RESULTS, no cancelar. |
| E7 | Dos pestañas confirman, ack/emisión de la primera se pierde | Un único terminal/retención/liberación; recuperar el mismo resumen sin repetir ejecución. |
| E8 | A cancelada, misma sesión inicia B antes de caducar A | A autorizada y consultable; su cleanup/ack/HTTP/evento/retorno tardíos no alteran B ni sus avisos. |

- [x] **B13-01:** botón exclusivo HOST, jugador/observador/automático/fuera de roster del desempate; invitado y sesión ajena rechazados por servidor. Forma exacta y contexto inválido probados.
- [x] **B13-02:** textos/acciones exactos, ubicación, teclado/foco/Escape; cerrar sin confirmar no envía ni pausa. Envío pendiente/desconectado e incertidumbre correctos, sin confirmación local falsa.
- [x] **B13-03:** cancelación en PLAYING, FINAL_PHASE y TIE_BREAK, turno humano/BOT/AUTOMATIC, revisión intermedia/final/base/desempate; transición inmediata a RESULTS sin esperar plazo restante.
- [x] **B13-04:** E1/E2/E5: puntos exclusivamente de rondas resueltas, incluido cero y revisión; manos/mazo/indicadoras/jugadas conservan 58 cartas. Ninguna ronda incompleta adjudicada ni reposición/desempate artificial.
- [x] **B13-05:** resultado HOST_CANCELLED/false/winnerIds vacíos/tieBreakWinnerId null, sin badges/victoria/puestos visibles ni datos privados; humano/bot/observador con puntos/identidad adecuados.
- [x] **B13-06:** E3/E4 y revisión cero: límite temporal en −1/0/+1 ms, callback retrasado y fin normal/inactividad previo preservados. Clasificación candidata durante revisión no se confunde con terminal publicado.
- [x] **B13-07:** cancelación contra jugada manual, timeout, bot/automático y final: una sola transición terminal. Efectos previos conservados; ningún movimiento posterior, aun forzando ejecución de callback antiguo/cancelado.
- [x] **B13-08:** dedupe mismo ID/contenido, conflicto otro contenido/tipo y dos IDs/pestañas; una retención/liberación/publicación efectiva, sin renovación ni segunda cancelación.
- [x] **B13-09:** ack perdido/error después de registrar, emisión fallida y recuperaciones retrasadas: estado durable en memoria, recuperación autorizada, no reenvío automático, no nuevo resultado por retry.
- [x] **B13-10:** HTTP/ack/room:state privados coherentes en dos sesiones independientes y observador. Recarga/reconexión/URL antigua no reactivan; mensajes antiguos no vuelven a mesa o controles.
- [x] **B13-11:** todas las sesiones humanas libres inmediatamente, antes de volver al inicio/caducar; cada una puede crear/entrar en B mientras mantiene A consultable en otra pestaña. Otra partida realmente activa sigue impidiendo una segunda.
- [x] **B13-12:** retención a −1 ms disponible y a 0/+1 ms indisponible, sin callback previo; consultas/F5/replays no desplazan plazo. Originales autorizados, ajenos prohibidos; reinicio sin persistencia.
- [x] **B13-13:** E8 y regresiones T04 con A cancelada/B ordinaria o por inactividad: cleanup, retorno/ack/evento/HTTP viejos y aviso A no borran/liberan/contaminan B. Consulta explícita A vencida sí informa de A.
- [x] **B13-14:** resultados normales/inactividad, retención/retorno originales, plazos/revisión, bots/puntuación/fase final/desempate, B12/Detalles y espera B03 conservados; sin nuevo abandono, revancha o vigilancia.
- [x] **B13-15:** check, navegador pertinente, imports/ciclos y revisión semántica registrados con evidencia nueva. Aprobación humana y C09–C10 parciales separados; ninguna prueba prevista presentada como ejecutada.

## 8. Verificación prevista y cierre

Pruebas puras sobre Game cancelado en fases/adjudicaciones/58 ubicaciones; casos de uso con Clock/Scheduler controlados para prioridades exactas, retención y callbacks, incluidos callbacks extraídos antes de invalidar. Integración Socket.IO/HTTP para validadores, autoridad, dedupe y privacidad de cada sobre; pérdida de ack/emisión simulada de manera explícita.

Reutilizar `server/domain/{manualGame,timedGame,botGame}.test.ts`, `server/application/{manualGame,timedGame,results}.test.ts`, pruebas del repositorio/montaje de sockets y `tests/browser/{manualGame,timedGame,timedRealGame,bots,resultNotice}.spec.ts`; añadir escenarios B13 focales. T04 completo debe permanecer en la selección pertinente y extender su A/B a cancelación; no debilitar sus aserciones ni reescribir cierres.

Dos perfiles/sesiones reales, varias pestañas de una sesión y anfitrión observador; ancho PC actual y móvil 390 px para el botón/diálogo/resumen sin rediseño. Registrar estados/capturas mínimas, identificación de solicitudes, revisión/motivo, timestamps, índices/tareas y ausencia de secretos. El tiempo controlado acredita bordes y 30 minutos simulados, **no media hora real**; distinguir HTTP/Socket.IO/navegador reales del reloj sustituido. Sin exigir repetir baterías completas o esperar todos los plazos reales por rutina.

Implementación ejecutará `npm run check` y `npm run test:browser -- <archivos nuevos/afectados y regresiones pertinentes> --workers=2` sobre la compilación vigente, registrando la selección exacta y resultados/fallos reparados. Revisión semántica además de imports: reglas en dominio, autoridad/retención en aplicación, transportes sin decisiones y cliente sin manos ajenas. Actualizar README, proceso y cierre del bloque con recorrido manual para el autor. Resultados históricos B07/B08/B09/T04 no son puertas B13.

**Registro histórico de preparación, previo a §10:** lectura de fuentes/código/contratos, comprobación de numeración/estado Git y redacción. **Código B13, pruebas de producto, comprobaciones de arquitectura sobre implementación y aprobación humana:** pendientes en esa preparación. No se ejecutaron entonces pruebas de producto, operaciones/publicación/despliegue ni mensajes a otros hilos.

## 9. Resoluciones y traslado a Arquitectura

La autorización expresa del autor/contexto el 11/10 resuelve las exclusiones previas; no pedir nueva aprobación para introducir esta facultad. Conservarlas como historia en B06–B09, sin reescribir sus evidencias. Las fuentes generales actuales requieren alineación en su ámbito responsable, sin edición desde SDD:

| Fuente | Ajuste que debe recibir su responsable |
| --- | --- |
| Dominio §§8/22/24/26 | HOST_CANCELLED terminal, puntos congelados y sin ganador; excepción D-INV-14 para ronda incompleta cancelada; conservación de cartas, puntos base y reglas normales/inactividad intactas. |
| Aplicación §§3/7/10–12/14–16 | Permiso HOST incluido observador; botón/confirmación/resumen; revisión final cancelable antes de vencimiento/registro terminal; caso CancelGame, dedupe/errores/privados; liberación inmediata distinta de consulta autorizada. Sustituir exclusión de §12 y referencias de pendiente en §§17.6/18–19. |
| Infraestructura §§5–8 | game:cancel, motivo/sobre RESULTS, invalidación temporal y registro atómico antes de emitir; destinatarios pese a sesiones liberadas; retención inmediata de 30 minutos e índices A/B seguros. No atribuir vigilancia técnica o persistencia a B13. |
| Organización APP §§2/4–5 y mapas B07–B09 | Mapa Game/Room/GameCoordinator/puertos/repo/transportes y cliente; diferencia entre asociación activa y resumen consultado; T04 intacto. Sin segundo planificador ni cambio en dirección de dependencias. |
| Contexto §9/evidencias | Coordinación recibe especificación/prompt, ampliación acordada y pendientes; código/evidencia/despliegue siguen sin acreditar por este encargo. |

Antes del cierre normativo, el responsable alinea esas fuentes conforme a AGENTS. La implementación podrá aportar evidencia técnica contra B13 aprobado, identificando por separado cualquier alineación aún pendiente; no convertir un texto antiguo en una razón para cambiar la decisión del autor o dejar sin especificar la cancelación.

**Preguntas funcionales abiertas:** ninguna tras aplicar el acuerdo y el límite de revisión vigente. Cualquier incompatibilidad nueva se documenta y devuelve al autor antes de alterar estas decisiones. [Prompt de implementación](PROMPT_IMPLEMENTACION_BLOQUE_13.md).

## 10. Implementación y evidencia nueva — 11/10/2026

### 10.1 Base efectiva y revisión

Rama `feat/b13-cancelacion-partida` creada desde `ee2efbb9d2b4515884629a2578ebc75697202865`, entrega compatible con B07–B12/T04/T03 y empaquetado posterior. No se restauró un main antiguo. Preparación conservada en `0ab5cba`; cambio de producto, pruebas, README y mapa APP revisado en **`b0173b7`**. Commits únicamente locales.

Trabajo ajeno conservado fuera de estos commits: dos líneas del documento operativo `GITHUB_Y_RECUPERACION.md` y el ensayo de Enter confiable/foco de `tableLayout.spec.ts`. El documento operativo mantiene SHA-256 `fafd0340d05bacf5f1e03fd267395c7d74de56ad08ca3a515b789da10e26908f`. En el archivo de pruebas compartido se registró **solo** el ajuste B13 de comparación de cabecera, mediante patch del índice; el hunk previo de teclado permanece íntegro sin registrar. Las puertas se ejecutan con esos cambios conservados presentes, sin atribuirlos a B13.

Antes de editar: comprobación Git/base, fuentes y lectura de resultados/plazos. `npx vitest run server/application/results.test.ts server/application/timedGame.test.ts server/domain/manualGame.test.ts`: **48/48**, tres archivos, 19:44:39, 1,24 s. El primer intento dentro del sandbox no ejecutó dos suites por ENOENT del caché SSR temporal; ejecución autorizada fuera de ese sandbox resolvió el montaje sin modificar producto/pruebas.

### 10.2 Organización concreta y acuerdos aplicados

- `Game.cancel()` devuelve un sucesor inmutable FINISHED. Conserva exactamente jugadores/pilas/mazo/ronda/indicadoras y sus 58 ubicaciones; genera puntos parciales derivados de `wonCards`, sin ganador. No adjudica jugadas incompletas ni calcula permisos o reloj.
- `GameCoordinator.cancelGame`, delegado por RoomUseCases, aplica preparación temporal antes de decidir; autoriza HOST del roster original, también observador/automático/ajeno al roster reducido del desempate. Diferencia candidato durante revisión de terminal confirmado. Registra sucesor, retención, liberación HUMAN, repositorio y dedupe mínimo **antes** de emisión; captura destinatarios originales. Reutiliza Clock/Scheduler/GameChanges y las generaciones de Room. Solo queda la tarea de retención; no hay planificador paralelo ni drenaje de una cadena de máquinas.
- Entrada estricta `game:cancel { requestId, roomId, gameId }`, tres strings requeridos, no vacíos y máximo 100 caracteres; sin propiedades adicionales. Ack/HTTP/room:state proyectan RESULTS por destinatario, con `HOST_CANCELLED`, false, winnerIds vacío y tieBreakWinnerId null. Conservan no-store y autorización original; no transportan Game, manos, mazo, credenciales o semillas.
- CancelGameControl/useCancelGame separan diálogo y gesto/transporte. Foco inicial no destructivo, Escape/restauración de foco, sin pausa ni envío al cerrar antes de confirmar. Pending/error no afirman éxito. Recuperación incierta consulta gameId primero, current después solo si no hay resultado; retry explícito conserva ID/payload. Contexto montado por Game y filtros T04 descartan ack/HTTP antiguos. Sin cola/reenvío al reconectar.
- useRoomFlow distingue asociación activa de resumen consultado: una cancelación libera antes de publicar; una pestaña aún IN_GAME recupera por roster/lastResult si no existe B vigente. Consultar A no la reactiva. Retorno nuevo de A comunica navegación por sesión aun ya liberada; replay no emite, y con B activa se conserva el rechazo vigente/recuperación de B. Guardas de índices, revisión/gameId/contexto evitan que A afecte a B.
- ResultsScreen reutiliza resultados, con «Puntuaciones parciales», sin puestos/victoria/badges de ganador. Observador aparte y etiquetas EASY/HARD intactas. Cabecera gana únicamente el espacio local necesario para el botón de HOST (mínimo 48 px); no cambia cartas, fuentes, paneles o distribución B12. La referencia histórica B10 y sus huellas siguen intactas: la comparación incorpora ese control en ambos encabezados HOST; invitados conservan la referencia original.

### 10.3 Entorno, comandos y resultados

Windows x64/PowerShell; aplicación 0.1.0; Node **24.19.0**, ejecutable `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm **11.6.2**, TypeScript **6.0.3**, Vitest **5.0.2**, Playwright **1.63.0**, Chrome **154.0.8037.98**. PATH por invocación mediante los wrappers locales T03, sin cambiar instalaciones globales. Horas Europe/Madrid, UTC+2.

| Comprobación ejecutada | Resultado nuevo |
|---|---|
| `npx vitest run server/domain/cancelGame.test.ts server/application/cancelGame.test.ts server/application/results.test.ts` durante edición | **57/57**, 19:54:13, 916 ms; posteriormente ampliada aplicación. |
| `npx vitest run server/cancelSocket.test.ts` | **2/2**, HTTP/Socket.IO reales con reloj/permutación sustituidos; 19:57:56, 1,4 s. |
| `npm run typecheck` + `npx vitest run server/application/cancelGame.test.ts` último ensayo focal | **20/20**, 20:15:28, 859 ms; tipos correctos. |
| `npx playwright test tests/browser/cancelGame.spec.ts tests/browser/tableLayout.spec.ts --grep 'B13 botón\|B10 base/comparison 390' --workers=2` | **3/3**, 9,0 s; diálogo/resumen 390/1800 y comparación móvil B10 reparados. |
| `npm run check` sobre `b0173b7` | **Salida 0: 466/466**, 42 archivos; Vitest 20:17:34, 13,20 s. Tipos/lint/preparación/build correctos; **68 módulos** sin imports prohibidos/ciclos. |
| Selección final `npm run test:browser`, dos trabajadores | **Salida 0: 86/86**, nueve B13 y 77 regresiones, nueve archivos/cero reintentos. 20:18:31–20:25:34 incluido build; Playwright **7,0 min**. Compilación vigente y misma huella del bundle (`index-ChFhQiBR.js`) que check. |

Selección final exacta, con instancia normal propia `http://127.0.0.1:3007`, PID 16060, dist-server de `b0173b7`, iniciada 20:18:09; no se detuvo la instancia del autor. El script reconstruye el mismo código antes de Playwright:

```powershell
$env:KARTA3_BASE_URL = 'http://127.0.0.1:3007'
npm run test:browser -- tests/browser/cancelGame.spec.ts tests/browser/resultNotice.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/timedRealGame.spec.ts tests/browser/bots.spec.ts tests/browser/centeredTable03.spec.ts tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts --workers=2
```

Fallos de montaje/expectativas detectados y reparados durante edición, sin reducir cobertura: autenticación Socket.IO sin cookie comunica «Sesión no disponible.» (la primera expectativa confundía ese mensaje con el código HTTP); un import de tipo no usado señalado por lint; «Ver último resultado» es enlace, no botón; recarga necesita esperar a que su consulta muestre el resumen; comparación B10 debe diferenciar HOST/invitado al incorporar el botón; la ronda de dominio usa `playerIds`, no `order`. El primer navegador focal fue 7/9 y el ensayo intermedio 0/3 por esas expectativas/sincronización; los tres casos reparados pasan. Los fallos y salidas se conservan localmente, sin marcarlos como pruebas superadas en aquella ejecución.

### 10.4 Cobertura por criterio y ejemplo

**B13-01–15 y E1–E8: correctos técnicamente con la evidencia siguiente**, incluidas las regresiones finalizadas. Las casillas de §7 acreditan esas comprobaciones técnicas; no aprobación humana o cierre normativo de TFM:

| Criterio | Evidencia concreta |
|---|---|
| B13-01 | Aplicación: HOST jugador/observador/automático y HOST fuera de empate reducido; guest/ajeno prohibidos. Sockets: forma estricta, cookie ausente, contexto/sala incorrectos, propiedades/valores adicionales rechazados. UI muestra control solo al HOST. |
| B13-02 | Navegador 390/1800: textos exactos, foco/teclado/Escape/restauración; cero solicitudes por cierre previo, reloj sigue con diálogo. Pérdida de confirmación, salida tras timeout, recuperación y retry explícito con mismo payload/ID. |
| B13-03 | Dominio: 2–5 jugadores en inicial/parcial/revisión/final/parcial y revisión de desempate. Aplicación: revisión intermedia/final, HOST observador/automático, pasos BOT/AUTOMATIC y turno humano. |
| B13-04 / E1–E2–E5 | **29 pruebas puras**: 28 combinaciones legales más final normal confirmado; identidad de las ubicaciones/58 IDs únicos, puntos derivados de rondas resueltas y cero inicial/incompleta. Aplicación congela revisión y desempate sin reposición ni adjudicación artificial. |
| B13-05 | Sockets/HTTP/ack/eventos comparan proyección por cada humano y ausencia de campos privados; observador separado/bot correcto. UI título/explicación/parciales, sin Puesto/Ganador/victoria/mesa/mano. |
| B13-06 / E3–E4 | Aplicación: finales ordinarios y por inactividad a revisión −1/0/+1 ms **sin disparar callback**; antes permite, igualdad/después GAME_FINISHED, retención/motivo/vencedor originales. Revisión cero confirma sin ventana artificial. |
| B13-07 / E6 | Jugada antes conserva efecto/replay, cancelación antes bloquea jugada nueva. Timeout debido de última carta puntúa primero. BOT/AUTOMATIC solo un paso debido; callbacks extraídos de turno/máquina/revisión no cambian terminal. |
| B13-08 / E7 | Mismo ID/nuevo ID de pestaña devuelve resumen, sin publicación/retención nuevas. Conflicto por otro tipo y por contenido válido de B; dos sockets host concurrentes publican una vez por destinatario. |
| B13-09 / E7 | Fallo de emisión tras registro en aplicación; pérdida real de entrega/ack en sockets, interceptada para el ensayo. Navegador con ack/evento suprimidos y con petición perdida antes de registrar: recuperación autorizada, sin reenvío automático, respuesta A retenida no sustituye B. |
| B13-10 | HTTP no-store, sesión propia/HOST observador/guest; ajenos 403 y anónimo 401. Recarga de `/resultado/A`, URL antigua de sala, pestañas y reconexión del invitado desconectado: resumen autorizado sin asociación A. |
| B13-11 / E8 | Registro inspeccionado dentro de emisión: índices de todas las sesiones HUMAN libres. HTTP cada humano crea B antes de retornar; A consultable, otra asociación única y B conservada. Navegador crea B desde segunda pestaña mientras se recupera A. |
| B13-12 | Aplicación: −1 ms consulta correcta, igualdad indisponible y +1 ms replay no recrea; callbacks retenidos. Sockets 404/ROOM_NOT_AVAILABLE y permisos originales. Lecturas/F5/replays no renuevan. Pruebas de reinicio de las regresiones B06/B07, sin persistencia. |
| B13-13 / E8 | Dos variantes A cancelada→B automática/ordinaria, F5, vencimiento B propio y consulta explícita A caducada; ack, HTTP, room:state y results:home A atrasados no contaminan B. A guarda/retorna/caduca sin borrar índices B. Los cuatro recorridos T04 originales integran la selección final sin eliminar aserciones. |
| B13-14 | **77 regresiones de navegador correctas** B06–B12/T04: genérica2 normal, observador, juego completo, finales/desempate, revisión0/5, plazos/bots, resultado/retorno/reinicio, cartas/Detalles/foco/quinta lateral/corte760–761. Check completo conserva también espera/catálogo/configuración/activación y pruebas puras de juego/tiempo/bots. |
| B13-15 | Check/imports/ciclos correctos, revisión semántica §10.2 y **86/86 de navegador final**. Cuatro T04 originales correctos más variantes B13; sin reducir aserciones. Revisión humana y alineación de fuentes separadas. |

### 10.5 Capturas, medidas, privacidad y baraja

Artefactos locales ignorados en `playwright-report/b13/`: `check-final.log`, `browser-final.log`, ensayos focales/fallos, `normal-start.json`, cuatro capturas `dialog-{390,1800}.png`/`summary-{390,1800}.png` y `geometry-{390,1800}.json`. Capturas revisadas por inspección visual del agente; no son aprobación humana. Viewports 390×844 y 1800×844 CSS px, DPR 1; screenshot de diálogo de página completa conserva scroll residual de la mesa, no acredita pantalla física ni rediseño de altura.

Botón móvil: x 212,95, derecha 376, inferior 69; título empieza en y85; página/ancho390. PC: x1420,95, derecha1584, inferior67; título y71; página/ancho1800. No se superpone título ni genera scroll horizontal global. Resumen parcial mantiene únicamente Jugador/Puntos; diálogos quedan en viewport con foco inicial visible. Comparaciones B10/B12 conservan referencias y medidas de contenido; el scroll vertical residual de mesa sigue permitido.

Revisión semántica: `Game` decide terminal/puntos/cartas; aplicación decide autoridad/tiempo/retención y proyección, escribe antes de emitir; infraestructura decodifica/autentica/transporta; React no calcula ganador ni termina localmente. Se inspeccionan **sobres reales** HTTP/ack/room:state por humano, no solo elementos escondidos. El roster de bots no crea sesiones/índices/destinatarios. Sin endpoints de timeout/reloj/avance ni parámetros de prueba en producto; interceptores/relojes/paquetes/permutaciones viven en tests/support.

Genérica aprobada intacta en APP y ASSETS, formato1/contenido2 disponible; huellas de ambos pares idénticas a activación: `baraja.json` **991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed**, `cartas.json` **868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c**. Arranque normal propio ofrece un único resumen seguro de genérica2. No se cambiaron barajas, dependencias, configuración Docker, fuentes TFM ni cierres históricos.

### 10.6 Límites y entrega al autor

Tiempo controlado: bordes de revisión/retención, pérdida de ack, carreras y ejecución de callbacks. HTTP/Socket.IO/Chrome usan conexiones reales con ese reloj sustituido en escenarios B13/T04; no acreditan 30 minutos reales. Ensayos normales B06/B07/B09 correctos: genérica2, reloj/planificador/entropía normales y procesos compilados sin ASSETS. **Vencimiento real B08 correcto**, SystemClock/TimerScheduler/CryptoCardPermutation: inicio `2026-10-11T18:24:43.245Z`, límite `18:24:58.245Z`, transporte cerrado `18:24:43.305Z`, observación `18:24:58.596Z` (**350,86 ms** después), contador1 y recuperación del mismo jugador. Contexto público de ese ensayo: Game `bbb823e7-526f-445a-ba86-cf0f19e023f8`, turno `:r1:p1`; duración17,2s. Se conserva como regresión nueva de esta ejecución, no como prueba de media hora real. Instancia propia3007 cerrada a20:26:08; el servicio del autor no se operó.

No se han realizado recorridos humanos, prueba con usuarios o dispositivos físicos; las instrucciones [README, Prueba manual B13](../../README.md#prueba-manual-b13-cancelación-y-otra-sala) están disponibles para el autor. C09–C10 continúan parciales. No se repitió por rutina la batería completa de navegador: se seleccionaron explícitamente los archivos afectados y regresiones relacionadas; check sí ejecuta todas las pruebas no-browser existentes.

Traslado para Coordinación/Arquitectura por el autor: esta entrega implementa la decisión expresa del 11/10, introduce `CancelGame`/`HOST_CANCELLED` y la excepción de ronda incompleta terminal sin adjudicación, con puntos parciales/sin ganador. Diferencia roster autorizado, resumen consultado y asociación activa; libera HUMAN inmediatamente, conserva retención propia 30 minutos y T04 protege otra sala. Aplicación debe alinear las exclusiones anteriores, permiso/confirmación y límite de revisión final; Dominio debe registrar excepción D-INV-14; Infraestructura debe describir acción, registro previo a emisión, destinatarios originales e invalidación. Se mantienen sus otros requisitos futuros. La alineación de §9 corresponde a sus responsables y **no se hizo aquí**; el cierre normativo sigue pendiente, sin alterar la decisión aprobada. No se solicitaron operaciones de publicación ni se enviaron mensajes a otros hilos.

### 10.7 Archivos de la entrega y revisión del autor

| Área | Archivos B13 |
|---|---|
| Dominio | `server/domain/game.ts`, nuevo `cancelGame.test.ts`. |
| Aplicación | `server/application/gameCoordinator.ts`, `ports.ts`, `roomUseCases.ts`, nuevo `cancelGame.test.ts`. Room/repositorio/proyecciones existentes se reutilizan sin modificar sus archivos. |
| Transporte/contratos | `shared/contracts/game.ts`, `room.ts`; `server/infrastructure/gameInput.ts`, `socketRooms.ts`; nuevo `server/cancelSocket.test.ts`. |
| Cliente | `src/App.tsx`, `GameScreen.tsx`, `ResultsScreen.tsx`, `useRoomFlow.ts`, `style.css`; nuevos `CancelGameControl.tsx` y `useCancelGame.ts`. |
| Navegador/soporte | nuevo `tests/browser/cancelGame.spec.ts`; ajuste B13 de `tableLayout.spec.ts` y `tests/support/configurationBrowserServer.ts`. El hunk ajeno de Enter queda fuera de la entrega. |
| Documentación | README, organización/dependencias, especificación B13 y proceso; prompt/preparación preservados en su commit separado. |

Revisión breve del autor: arrancar build vigente, crear/entrar con dos perfiles, abrir diálogo y probar Escape; confirmar una ronda incompleta y comprobar cero puntos/sin ganador en ambos, F5 del resumen y nueva sala desde otra pestaña. Repetir tras resolver una ronda, con anfitrión observador y durante revisión; revisar PC/móvil y confirmar que el diálogo no pausa el turno. Pérdidas de ack/callbacks/bordes temporales están automatizadas; provocar cortes manualmente no sustituye esos montajes controlados. Registrar la revisión humana cuando se realice; no queda acreditada por el agente.
