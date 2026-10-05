# B09 — Gestión y ejecución completa de bots fácil y normal

**Estado:** acordado con el autor el 05/10/2026; pendiente de implementación y verificación.
**Tipo:** incremento funcional con dos etapas internas, ambas necesarias para cerrar B09.

## 1. Base y referencias

Preparación comprobada en `APP/karta3`: rama `main`, HEAD/main/referencia local `origin/main` **`8d305e0e2e13b60b6dc2e412ae9fc073d6bff28f`**, aplicación `0.1.0`, árbol limpio antes de añadir estos documentos. No se cambió de rama ni se ejecutaron pruebas del producto en SDD. La referencia remota comprobada es local; no se consultó de nuevo GitHub/CI.

| Referencia | Decisión normativa para B09 |
|---|---|
| [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) y [organización/dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) | Responsabilidades, autoridad, privacidad, dependencias y evidencia. |
| [Contexto](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), §§9–10 | B08 integrado mediante PR #4; alcance/interacción B09 confirmados. |
| [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), §§6, 9–19, 21–24 y 26 | HUMAN/BOT, antigüedad, políticas EASY/NORMAL de §§19.4–19.6, puntuación, fase final, desempate e inactividad. |
| [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§3–12 y 14–19 | Gestión por anfitrión, capacidad/orden mixtos, inicio con humano jugador, preparación, revisión y resultados. |
| [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §§5–8 | Autenticación humana, memoria, transporte, actividad válida, tiempo y continuaciones acotadas. |
| [B03](BLOQUE_03_CICLO_VIDA_ESPERA.md), [B05](BLOQUE_05_CONFIGURACION_SALA.md), [B06](BLOQUE_06_INICIO_Y_MESA_INICIAL.md), [B07](BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md), [B08 y cierre §11](BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md) | Espera, cambios por control, inicio único, partida completa y coordinación de máquina/plazos ya existentes. |
| [B04](BLOQUE_04_CARGA_BARAJAS.md), [activación](ACTIVACION_GENERICA_V2.md) y [contrato de barajas](../contratos/CONTRATO_BARAJAS_V1.md) | Catálogo seguro y genérica aprobada formato 1/contenido 2 disponible. |

Código consultado: Game/autoPlay, Room/RoomUseCases/GameCoordinator/WaitingLifecycle, puertos/proyecciones/repositorio/sockets, shared/contracts y pantallas/hooks de espera/inicio/juego. Hoy los jugadores del modelo son humanos; B08 ofrece continuaciones de AUTOMATIC reutilizables, pero todavía no BOT.

**Evidencia histórica:** cierre B08 registra T1+T2, check **341/341**, navegador compilado **74/74**, **59 módulos**, revisión semántica y vencimiento real desconectado de 15 s. Contexto confirma publicación/integración y prueba del autor. No son pruebas nuevas de B09. La errata de dominio §24.2 y la descripción general B07/B08 fueron alineadas por Arquitectura el 05/10; no arrastrar ese pendiente ya resuelto.

**Alineación pendiente conocida:** aplicación §4/§18 todavía deja abierto el nivel inicial. El encargo vigente del autor lo cierra en **Normal**; registrar esa actualización para Arquitectura, sin reabrir políticas ni modificar aquí TFM. No se detecta contradicción bloqueante con las reglas de bots.

## 2. Objetivo, alcance y dependencias

Permitir preparar y completar una partida con humanos y bots fáciles/normales, incluida una persona contra bots, sobre el juego y plazos B08.

| Etapa interna | Entrega y comprobación |
|---|---|
| P1 — Preparación y políticas | Añadir, dificultad, nombre/diálogo, retirar, orden/capacidad/actividad/permisos y políticas puras. Comprobar casos de sala y decisiones de política. |
| P2 — Ejecución completa | Inicio mixto, turnos BOT, puntuación/reposición/final/desempate/inactividad, privacidad/recuperación y regresiones. Comprobar partidas legales completas y transporte/navegador. |

P1 no cierra B09 ni autoriza una entrega definitiva de controles sin ejecución. Ambas etapas pertenecen a un mismo bloque; no crear selectores o modos temporales para separar su ejecución.

**Incluye:** incorporación expresa uno a uno, nivel inicial NORMAL, nombre sucesivo, gestión individual solo del anfitrión durante WAITING; máximo cinco jugadores; inicio 2–5 con al menos un HUMAN jugador; ejecución de ambos niveles con políticas vigentes. Se conservan el resto de configuración, sala, partida, plazos/revisión/resultados y retorno B01–B08/T01.

**Fuera:** rediseño de mesa, expulsión humana, vigilancia técnica de dos minutos, HARD, IA externa, visualización configurable, despliegue y publicación. No modificar baraja, catálogo, algoritmos aprobados o puntuación/desempate. La mejora visual y los otros requisitos pendientes tendrán sus propios encargos.

Dependencias disponibles: memoria de un proceso, generación de IDs, autenticación, dedupe, validación de nombres/sufijos, Clock/Scheduler y continuaciones B08, Game inmutable, catálogo/instantánea y medios aprobados. No se necesita servicio de IA, nueva sesión de bot, repositorio separado de bots ni registro extensible de políticas por anticipado.

## 3. Preparación de sala y presentación

### 3.1 Añadir, orden y plazas

- En Jugadores de la espera, anfitrión jugador u observador ve **«Añadir bot»**. Un gesto incorpora exactamente uno NORMAL; no autoañadir al crear/iniciar ni rellenar huecos. Invitados no ven controles de gestión.
- Añadir solo al recibir aceptación/vista autorizada; mientras se envía mostrar «Añadiendo…» y evitar doble envío del mismo gesto. Con cinco plazas ocupadas/reservadas, deshabilitar con motivo «No quedan plazas para añadir un bot»; siguen disponibles las demás gestiones. El servidor comprueba igualmente la capacidad.
- Cada incorporación aceptada crea ID nuevo, independiente del nombre y de cualquier sesión. Nombre inicial **Bot 1, Bot 2…** conforme al número de incorporaciones aceptadas en esa sala. Concreción del contrato: contador creciente por sala, sin reutilizar números por retirada/renombre; rechazo o replay no lo consume. Una sala nueva empieza en Bot 1. Los nombres repetidos siguen permitidos.
- Una secuencia común conserva la incorporación de invitados humanos y bots. El anfitrión jugador se presenta al final; el observador aparte. Renombrar/cambiar nivel no mueve ni libera plaza; retirar elimina solo ese ID. Una incorporación posterior va al final de los no anfitriones, aunque use el mismo nombre que otro bot retirado.
- Un bot ocupa una plaza sin reserva de conexión. Humanos RECONNECTING siguen reservando la suya según B03. Máximo cinco jugadores; el anfitrión observador no cuenta. La sala puede temporalmente contener solo bots jugadores, pero **no iniciar** así; no corregir esa preparación automáticamente ni hacer jugador al anfitrión.

### 3.2 Fila de bot y diálogo de nombre

Cada fila muestra nombre/sufijo, marca **«Bot»** y dificultad **Fácil/Normal**. El anfitrión dispone de selector EASY/NORMAL, **«Cambiar nombre»** y **«Retirar bot»**; los invitados consultan los valores aceptados. Móvil: controles pueden ocupar una segunda línea de la misma fila; escritorio: junto a ella si caben. Reutilizar estilos y componentes, sin cambiar la distribución general ni exigir iconos nuevos.

Cambiar dificultad aplica inmediatamente un único campo, conforme al patrón B05. No exponer booleano ni opciones deshabilitadas de HARD; recibir cualquier otro valor se rechaza. Pendiente = «Aplicando…», no guardado. Rechazo vuelve al valor aceptado y muestra error por control.

**Cambiar nombre:** diálogo pequeño con nombre actual almacenado, sin incluir sufijo visual en el campo; título identificable y campo etiquetado, foco inicial en campo, Aceptar/Cancelar y cierre mediante Escape/control de cierre. Cancelar/cerrar antes de aceptar no envía solicitud ni renueva espera. Aceptar envía el nombre al servidor; reutiliza exactamente `normalizeName` y límites de B01/B02: trim, 1–16 caracteres visibles y restricciones vigentes. Permitir repetidos; no inventar validación especial por prefijo Bot.

Durante el envío mostrar «Guardando…», impedir doble aceptación y cambios del payload; bloquear Cancelar/cierre solo mientras se espera ack, con el timeout de transporte vigente. Un rechazo mantiene diálogo/borrador con error accesible para corregir o cancelar. Al confirmar éxito, actualizar desde vista autorizada y cerrar devolviendo foco al botón de la misma fila. Cancelar un borrador no equivale a deshacer una solicitud ya enviada. Al terminar la espera de ack con incertidumbre debe poder cerrarse sin afirmar que se canceló la operación del servidor.

Un cambio remoto de nombre/nivel/presencia no reemplaza el texto que la persona está editando. Si otro anfitrión de la misma sesión lo renombra en otra pestaña, conservar borrador e indicar el nombre aceptado vigente; una aceptación posterior aplica la regla del último cambio válido procesado. No exigir CAS/revisión esperada nueva. Si el bot desaparece o la espera se inicia/cierra, cerrar/inutilizar el diálogo de ese ID, explicar el motivo y conservar el estado autorizado; no dirigir el borrador a otro bot con igual nombre.

### 3.3 Retirada y accesibilidad

El autor confirma el 05/10: **retirada inmediata**, sin confirmación adicional. «Retirar bot» envía solicitud explícita y libera plaza tras aceptación. Publicar aviso de **cinco segundos** a todos: «[nombre mostrado] ha sido retirado; su plaza ha quedado libre», usando nombre/sufijo antes de retirarlo. No emitir `room:left` como si el bot tuviera sesión humana; no anunciar otro abandono ni repetir aviso por replays/lecturas.

Reutilizar filtros de sala/revisión, avisos deduplicados, etiquetas/errores y manejo de foco. Abrir/cerrar diálogo y actualizaciones no borran otros borradores o pendientes. Al retirar la fila enfocada, usar un destino seguro —fila siguiente/anterior o Añadir bot—; al iniciar, foco de la pantalla vigente. Ticks/lecturas no reconstruyen campos. Comprobar teclado y vista 360/390/1280 sin desbordamiento.

## 4. Operaciones, estado y contratos

### 4.1 Operaciones de espera

Nuevos eventos Socket.IO autenticados con credencial **del anfitrión**, decodificación exacta sin coerciones:

| Evento / caso de uso | Propiedades requeridas | Efecto |
|---|---|---|
| `room:bot-add` / AddBot | `{ requestId, roomId }` | Crear uno NORMAL con ID/nombre siguientes del servidor. No recibir identidad, nombre o nivel inicial del cliente. |
| `room:bot-difficulty` / SetBotDifficulty | `{ requestId, roomId, botId, difficulty }` | Cambiar solo dificultad de ese bot a EASY/NORMAL. |
| `room:bot-rename` / RenameBot | `{ requestId, roomId, botId, name }` | Cambiar solo nombre validado/normalizado. |
| `room:bot-remove` / RemoveBot | `{ requestId, roomId, botId }` | Retirar ese bot y liberar su plaza. |

IDs como en contratos vigentes: string no vacío, máximo 100 caracteres; name string validado con reglas existentes; difficulty enum explícito **EASY | NORMAL**. Rechazar propiedades ausentes/adicionales, booleanos/números, HARD u otros strings. Bot de otra sala, humano u observador no es objetivo válido de estas operaciones.

Ack de las cuatro: **`SocketAck<{ room: RoomView; botId: string }>`**. `botId` identifica la operación aceptada, incluso en un replay si el bot ya se retiró; `room` es vista propia **actual**, nunca la copia antigua ni la mano del bot. El identificador no implica que siga en la lista. Error conserva forma B08. No añadir rutas HTTP de gestión: recuperación usa lecturas existentes.

Reutilizar `room:state` y RoomChanges para estados aceptados. Ampliar RoomChange con `kind: 'BOT_REMOVED'`, manteniendo `id, participantId, name`; participantId es el bot retirado, name su nombre mostrado anterior. ID del hecho estable/único; publicar solo por efecto nuevo. Para añadir/renombrar/dificultad basta vista sincronizada, sin toasts nuevos obligatorios.

### 4.2 Participantes y vistas por destinatario

Extender contratos mediante **`kind: HUMAN | BOT`**, conservando IDs y campos humanos existentes. Campos requeridos de discriminación en la vista:

| Vista | HUMAN | BOT |
|---|---|---|
| Todas: `id`, `name`, `kind`, `role`, `isPlayer`, `botDifficulty` | Role HOST/GUEST, isPlayer vigente, botDifficulty null. | Role null, isPlayer true, botDifficulty EASY/NORMAL. |
| WAITING: `presence` | CONNECTED/RECONNECTING existentes. | null: no conexión simulada. |
| IN_GAME: `presence`, `score`, `playStatus` | CONNECTED/DISCONNECTED, score/estado B08 o null si observador. | presence null, score propio público, playStatus null. No mostrar ACTIVE/AUTOMATIC como control humano del bot. |
| RESULTS | Proyección B07/B08 sin presencia/control. | Misma proyección pública, conservando kind y nivel fijado. |

`room.participant` siempre identifica al HUMAN autenticado, también al observador. `participants` incluye humanos/bots; capacidad/orden usan jugadores, permisos/emisiones y asociaciones de sesión usan **solo humanos**. No usar longitudes indistintas ni sesiones sintéticas para conservar interfaces anteriores. Los sufijos consideran todos los miembros, incluido observador; variar el sufijo por una coincidencia nueva no cambia los nombres almacenados de los demás.

Mantener `game.execution: TIMED_TURNS`. Añadir **BOT** a modos de jugadas públicas. Turno de bot: timing null, openingSelection null; no plazo humano, contador o elección parcial. `ownConsecutiveTimeouts` sigue siendo el del humano destinatario, null para observador. Mano propia del humano; observador `[]`. Un BOT no es destinatario HTTP/socket, no tiene «mi mano» en cliente, link de resultado, cookie, SessionPresence ni reserva B03.

Mesa/resultados reutilizados: marcar «Bot · Fácil/Normal» junto a su nombre, también si gana; en turno de bot mostrar quién actúa sin cronómetro humano/controles. No retrasar su jugada para hacerlo visible, no rediseñar mesa ni añadir controles de bot en IN_GAME/RESULTS. Sus cartas solo se revelan al jugarse, igual que las humanas.

### 4.3 Estado interno y dominio

Room conserva ID/nombre/nivel/orden de incorporación de cada bot y contador de nombres sucesivos; un modelo de invitados discriminado o una secuencia común es elección interna, siempre que produzca un único orden mixto. Índices del repositorio, roster de sesiones y presencia siguen perteneciendo a humanos. Aplicar fin/cierre de sala limpia los bots como estado de esa sala, sin crear sesiones o participación final ficticias.

Al iniciar pasar datos explícitos de jugador HUMAN/BOT y botDifficulty cuando corresponda. Game valida en profundidad 2–5 IDs únicos, al menos un HUMAN y nivel válido para BOT, además de baraja/configuración/permutación vigentes. No inferir kind a partir de nombre ni admitir valores desconocidos por estar escritos en TypeScript.

Dominio separa:

- HUMAN: status ACTIVE/AUTOMATIC y contador 0/1/2 B08.
- BOT: botDifficulty EASY/NORMAL, sin status/contador humanos; comparte mano en adquisición, wonCards/score/orden.

MANUAL/TIMEOUT/AUTOMATIC solo corresponden a humanos según B08; **BOT** corresponde exclusivamente a la actuación interna de un bot de turno. Game valida carta/dirección/turno y modo; no permitir jugar bot como humano ni contar su actuación como timeout/reset humano.

## 5. Consistencia, actividad y recuperación

**Permisos/fase:** solo anfitrión de esa sala, incluso observador, y WAITING para acciones nuevas. Invitado/tercero FORBIDDEN; sesión ausente SESSION_REQUIRED. IN_GAME bloquea preparación con GAME_ALREADY_STARTED, RESULTS con GAME_FINISHED, cerrada/no disponible con ROOM_NOT_AVAILABLE. Añadir o gestionar bot no otorga derecho a jugar por él o ver su mano.

**Errores de contenido:** INVALID_INPUT para forma/nombre/nivel; ROOM_FULL al perder última plaza; nuevo **BOT_NOT_AVAILABLE** si el objetivo no es un bot vigente de esta sala —incluidos humano, retirado o ID ajeno—, sin revelar información de otra sala. START_NOT_READY para inicio sin humano jugador, número inválido o humanos pendientes de conexión. Mantener errores y mapping anteriores; SocketAck de error, 409 de estado donde proceda en HTTP existente.

**Atomicidad:** vencimientos B03 antes de acción, identidad/fase/capacidad/objetivo, transición de Room y dedupe dentro de la decisión síncrona por sala, sin IO/await entre validar y registrar. Generar ID/nombre solo para incorporación nueva aceptada y guardar antes de emitir. Reutilizar RoomRequests, ampliando tipos de operación y resultado mínimo botId; no guardar vistas/manos completas. Fallo de emisión/ack tras aceptación no vuelve a añadir/retirar ni altera actividad dos veces.

**Repetición:** mismo ID/tipo/contenido devuelve aceptación con mismo botId y vista propia vigente, sin reinsertar bot retirado, restaurar nivel/nombre antiguo, repetir aviso, ocupar plaza, aumentar numeración o renovar plazo. Error registrado se repite; ID reutilizado con otro tipo/contenido REQUEST_CONFLICT. Autorizar y aplicar vencimientos antes del replay; para una aceptación anterior no exigir que su bot o la fase WAITING sigan vigentes, mientras la sala/resultado y autorización se conserven. Nueva retirada de un bot ausente con distinto requestId devuelve BOT_NOT_AVAILABLE, sin efecto.

**Concurrencia:**

- Incorporaciones bot/humano y paso de anfitrión observador a jugador comparten cómputo, incluidas reservas: primera válida procesada gana última plaza, demás ROOM_FULL. No retirar reservas para hacer sitio.
- Cambios de nombre/nivel independientes se conservan ambos; en el mismo campo prevalece el último cambio nuevo válido procesado como B05, no hora cliente ni formulario entero. Retirada antes de cambio lo rechaza; cambio antes de retirada puede aceptar y luego desaparecer.
- Carrera con inicio: si la gestión entra primero, Game fija sus valores aceptados; si inicio entra primero, nueva gestión queda rechazada. Un replay anterior puede recuperar partida propia, sin mutar preparación/reparto. No borrar la partida por una respuesta de espera atrasada.

**Actividad válida:** incorporación nueva, retirada explícita aceptada, nombre normalizado distinto o dificultad distinta renuevan espera a procesamiento +30 minutos, eliminan aviso y reemplazan tareas/generación general; avanzan revisión y publican el efecto coherente. No reinician ausencias humanas. No renuevan diálogo/borrador/cancelación, valores iguales, errores, replays, lecturas/reconexión ni actuaciones de juego. En igualdad de caducidad prevalece B03; una gestión tardía no rescata sala.

**Cliente:** sin cola ni reenvío automático tras desconexión/F5. Mantener última lista aceptada y aviso de conexión; borradores sin guardado ficticio. Pendientes por operación/bot/campo, sin borrar otros. Mientras haya gestión enviada o incierta, la pestaña evita iniciar hasta recuperar/confirmar; otra pestaña sigue sometida a la carrera del servidor. Una mera apertura de diálogo no es cambio pendiente en servidor.

Ante error reconocido, mostrar motivo y último aceptado; nombre rechazado conserva borrador para corrección. Ante ack perdido/INTERNAL_ERROR tras envío, **no afirmar rechazo**: «No se pudo confirmar la operación. Recupera el estado de la sala». Primero leer vista vigente; si aún hace falta confirmar/reintentar, gesto explícito con mismo requestId/payload. Para Añadir bot, no crear un requestId nuevo como reintento de un resultado desconocido; botId en replay permite identificar el original aunque otra pestaña añadiera o retirara bots. Lectura no prueba por sí sola qué solicitud produjo un nombre o fila.

F5 descarta provisionales locales y recupera estado autoritativo, sin reemitir. Inicios/cierre/retirada remotos invalidan controles/borrador de contexto anterior; ack/HTTP/evento atrasados no borran pending nuevo ni restablecen otra sala/espera. La confirmación incierta no debe dejar un modal bloqueado indefinidamente: tras agotarse la espera de ack puede cerrarse, manteniendo el aviso/contexto de incertidumbre fuera del borrador hasta recuperación o cambio de fase.

## 6. Inicio y ejecución completa

### 6.1 Inicio mixto

Conservar room:start, autorización/dedupe y baraja/versión exacta B06. Admitir **2–5 jugadores HUMAN/BOT con al menos un HUMAN jugador**; anfitrión observador no cuenta. Todos los miembros HUMAN deben estar conectados al iniciar, incluido observador; ningún BOT requiere conexión/presencia. No exigir llenar plazas ni cambiar participación automáticamente.

Fijar roster, orden, nombres, niveles y configuración para toda partida. Repartir a bots las mismas tres cartas en orden de adquisición y reglas B06, sin otra baraja/reparto. Abridor inicial = primero del orden base, que puede ser BOT. Antes de publicar/ack, preparar primera oportunidad: plazo humano ACTIVE o continuación interna de bot; nunca esperar confirmación/petición de un navegador para activar al bot.

Al asociar Game a Room, comprobar también que kind y dificultad coinciden con la preparación aceptada, junto a IDs/nombres/orden/configuración/versión que ya verifica B06. No basta que dos listas tengan los mismos IDs si cambió el nivel o tipo de jugador.

### 6.2 Políticas vigentes

Implementar directamente dominio §§19.4–19.6, sin reabrir algoritmo. Entrada de política pura acotada a **su propia mano**, adquisición, atributo activo, apertura/dirección oficial y dificultad. No pasar Game entero, manos rivales, mazo, memoria de jugadas o servicios externos. Usa playValue del atributo activo, no displayValue ni roundAttribute de su propia carta. Devuelve decisión; Game la valida/aplica, no modifica pilas desde la política.

Resumen de referencia para comprobar —las fuentes contienen el detalle—:

| Nivel | Abridor | No abridor |
|---|---|---|
| EASY | Más antigua; 1–29 LOW, 30–58 HIGH. | Segunda mejor según dirección con 3 o 2 cartas; única con 1. |
| NORMAL | Menor distancia a 0/59; empate entre extremos favorece HIGH. | Mejor valor de su mano para dirección oficial, aunque no pueda ganar. |

Ejemplo de apertura NORMAL: 2/57 tienen igual distancia, juega 57/HIGH; con 2/56 juega 2/LOW. EASY con 12/33/51 juega 33 como no abridor en ambas direcciones; con 12/51 juega 12 en HIGH y 51 en LOW. Conservar independencia respecto a AutoPlayPolicy, cuya dirección desfavorece al humano inactivo.

### 6.3 Coordinación y final

Ampliar **la coordinación de máquina B08**, sin segundo sistema de tareas: distinguir BOT por kind y humano AUTOMATIC por status. Un bot actúa al corresponderle sin plazo humano, contador, evento de timeout ni pausa artificial. Cada continuación valida sala/partida/ronda/turnId/generación/tarea, aplica una jugada, registra y publica antes de programar la siguiente; cede ejecución como B08, también con revisión cero. Replays/lecturas/callbacks antiguos no repiten actuación.

Parar ante humano ACTIVE, revisión o fin. Respetar revisión configurada antes de ejecutar bots de nueva ronda; publicar resultado/puntos y revisión final/desempate B07/B08. Conservar recorrido circular, segundo abre, reposición, indicadoras/descartes, fase final y propiedad única de 58 cartas. Las manos de una/dos cartas y del desempate usan la misma política, sin excepciones por temática.

Un bot puede ganar, abrir y aparecer en clasificación como ganador único o compartido; juega el único desempate si queda entre líderes, sin sumar puntos/cartas ganadas extra. Un desempate compuesto solo por bots **sí se completa** cuando ya se inició legalmente y sigue al menos un HUMAN ACTIVE en el roster base, aunque ese humano no esté empatado.

Actualizar condición de inactividad del dominio B08 para filtrar roster **HUMAN**, con al menos uno y todos AUTOMATIC; no comprobar todos los jugadores indistintamente ni solo los que tengan turno en desempate. Si último humano pasa a AUTOMATIC en base/fase final, completar ronda con bots/humanos automáticos, puntuar/revisar y finalizar sin reposición/nueva ronda/desempate. Si ya había desempate, completar esa ronda/revisión y reconocer vencedor. Bots y observador no mantienen viva la base por sí solos. Ausencia del anfitrión no termina IN_GAME; servidor continúa sin navegadores.

Conservar DECK_COMPLETED/NO_ACTIVE_HUMAN_PLAYERS, completedNormally, puestos/puntos/ganadores y retención/retorno/otra sala B08. Sesiones humanas originales autorizan resultados, incluidos bots en clasificación; los bots no tienen retorno propio ni asociación que impida crear una sala nueva o expirar la anterior.

## 7. Responsabilidades y dependencias

| Responsabilidad | Capa / piezas afectadas | Dependencias y comprobación |
|---|---|---|
| Políticas EASY/NORMAL, kind/validación de jugadores, modo BOT, conservación y final por roster humano | `server/domain/game.ts` y política pura de bots | Tipos/datos puros propios; sin reloj, Node, red, shared de transporte, aplicación/React. Test de decisión con información limitada y Game completo; mantener autoPlay separado. |
| Orden/capacidad/nombre/nivel/numeración y preparación fijada | Room, en aplicación | Datos explícitos, normalizeName/tiempo recibido; sin reloj real/sesión falsa/selección de cartas. Tests de modelo, orden mixto, reservas y cambios sin efecto. |
| Casos de gestión, autorización/dedupe/actividad, inicio y proyecciones | RoomUseCases/RoomCoordinator/WaitingLifecycle y vistas | Dominio, contratos seguros y puertos propios; sin adaptadores concretos. Operaciones atómicas con tiempo/IDs sustitutos, pérdidas de ack, carrera inicio/capacidad y privacidad. |
| Coordinación interna BOT/AUTOMATIC, revisión/retención y emisión | GameCoordinator y puertos Clock/Scheduler/GameChanges existentes | Invoca política a través de dominio, no calcula estrategias. Test de un paso/generación/revisión y servicio de otra sala; conexión real para publicaciones. |
| Memoria, decodificación/autenticación Socket.IO y composición | Repositorios/Input/socketRooms/createApp vigentes | Solo índices/emisiones de humanos, entrada exacta, conectar casos de uso. Integración con cookies/sockets reales, no endpoints de bots de juego ni registro de manos. |
| Discriminación segura, filas/diálogo, pending/recuperación y marcas de partida/resultados | shared/contracts, espera/hooks, StartRoomControl, GameScreen/ResultsScreen | Cliente solo contratos; no server, estrategias o baraja oculta. Tests de estado/transporte y navegador compilado, teclado/foco/móvil. |

Reutilizar IdentifierGenerator/RoomRequests y los demás puertos existentes; ampliar solo tipos/emisiones necesarias. No puertos de IA, BotSession, almacenes especulativos, registro de HARD ni nueva dependencia externa. Elegir representación interna que no conserve suposiciones de «todo participante tiene sessionId/presence/status».

**Autonomía del implementador:** nombres internos, funciones/clases, módulos puros de política, representación de orden mixto, hook/componente de bots y montaje de pruebas; compartir validación o factoring proporcionado. Mantener operaciones/contratos y comportamiento de este documento. Consultar solo contradicción nueva o necesidad de cambiar reglas/arquitectura, citando lo decidido; no revisión general redundante por adaptar un tipo o descripción.

## 8. Ejemplos verificables

| Caso | Dado / cuando | Entonces |
|---|---|---|
| E1 — Una persona contra bots | Anfitrión jugador añade NORMAL, luego EASY; selecciona genérica 2 e inicia | Orden Bot 1, Bot 2, anfitrión; primer bot abre mediante su política; dos niveles fijados, humanos con plazo, sin manos de bots en payloads. |
| E2 — Identidad/nombres | Crear Bot 1/2, renombrar 1 con nombre humano repetido, cancelar otro borrador; retirar 1 y añadir de nuevo | IDs/orden/nivel ajenos conservados, cancelación sin envío; sufijos visuales correctos. Nuevo ID y Bot 3 al final de invitados, sin reutilizar 1. |
| E3 — Última plaza | Cuatro plazas, dos pestañas añaden o añadir compite con entrada humana/hostPlays | Primera válida ocupa quinta, otra ROOM_FULL. Replay no crea sexto ni consume nuevo número/actividad. |
| E4 — Nombre incierto | Servidor acepta RenameBot, ack se pierde; otra pestaña cambia nivel o retira ese ID | Leer estado actual, reintento explícito original confirma sin restaurar ni reinsertar; petición nueva sobre retirado BOT_NOT_AVAILABLE. |
| E5 — Observador | Host observa y tiene dos bots sin jugadores humanos; luego retira uno y entra un invitado | Inicio inicial START_NOT_READY; invitado + bot permite iniciar si humanos conectados. Host no ocupa plaza ni ve manos. |
| E6 — Políticas | EASY mano 12/51, dirección HIGH/LOW; NORMAL abre 2/57 y luego 2/56 en pruebas independientes | EASY 12/51 respectivamente; NORMAL 57/HIGH y 2/LOW. Valor mostrado/indicador propio no alteran elección. |
| E7 — Revisión/final/desempate | Partida mixta legal alcanza ronda resuelta, final o empate forzado | Bots no avanzan antes de review; misma adquisición/58 cartas; final de tres rondas sin reposición; desempate único sin puntos adicionales, aun si todos sus empatados son bots y hay humano ACTIVE fuera. |
| E8 — Inactividad | Único humano acumula dos timeouts, quedan bots por actuar en esa ronda | Completar ronda/revisión y resultado NO_ACTIVE_HUMAN_PLAYERS, sin otra ronda/desempate; bots no sostienen la base. En desempate ya iniciado completar/reconocer vencedor. |

## 9. Criterios y comprobación previstos

Todos pendientes; una lista prevista o evidencia B08 no acredita B09.

- [ ] **B09-01 — Añadir:** uno NORMAL por gesto aceptado, sucesión/ID servidor, sin auto-relleno ni cliente determinando identidad. Rechazos/replays no consumen número ni crean sesión/presencia bot.
- [ ] **B09-02 — Niveles:** EASY/NORMAL individuales/mezclados, aplicación inmediata y recuperación; HARD/booleanos/números/tipos/campos extra rechazados en borde y dominio, sin controles anticipados.
- [ ] **B09-03 — Diálogo/nombre:** actual sin sufijo, aceptar/cancelar/cerrar/Escape, no envío al cancelar, normalizeName vigente, repetidos/trim/1–16 y errores. Renombrar preserva ID/plaza/orden/nivel/nombres ajenos; concurrencia mantiene borrador y objetivo.
- [ ] **B09-04 — Retirada:** inmediata aceptada libera plaza/solo ese bot, aviso cinco segundos con sufijo anterior y dedupe; no simulación de salida humana. Retirar/editar inexistente/humano/ajeno rechazados; retirada repetida aceptada no reaplica.
- [ ] **B09-05 — Permisos/fase:** solo host incluso observador; sesión ausente/guest/tercero sin gestión; controles/servidor bloqueados tras inicio/RESULTS/cierre. Replay autorizado anterior devuelve estado vigente sin mutar Game.
- [ ] **B09-06 — Capacidad/orden:** 5 total con reservas humanas, host jugador último/observador aparte; carreras add/add, add/join, add/hostPlays y add/start sin sexta plaza ni cambio de roster fijado. Bot nuevo al final, no reordenar por nombre/nivel.
- [ ] **B09-07 — Actividad/plazos:** nuevos cambios efectivos renuevan/avanzan revisión/publican una vez; iguales/cancelados/rechazados/repetidos/lecturas no. B03 antes/en/después de caducidad, sin renovar ausencia ajena ni reservar bots.
- [ ] **B09-08 — Dedupe/incertidumbre:** ack/emisión perdido, replays/conflicto de ID/otra pestaña y respuestas antiguas no duplican/revierten/reinsertan; payload inmutable/mismo ID al confirmar intento incierto, sin cola ni reenvío por reconexión/F5.
- [ ] **B09-09 — Inicio:** 2–5 con HUMAN jugador, incluido uno contra 1–4 bots y observador con invitado/bots; solo bots o observador+solo bots no inician. Humanos pendientes bloquean; bots no requieren conexión. Inicio único fija kind/nombres/niveles/orden y baraja exacta.
- [ ] **B09-10 — EASY:** apertura más antigua y LOW 1/29, HIGH 30/58; no abridor segunda mejor con 3/2 y única con 1 para HIGH/LOW, distinto de automático. Propio atributo indicador/display no gobiernan elección.
- [ ] **B09-11 — NORMAL:** apertura distancia 0/59 y empate a favor HIGH, extremos 1/29/30/58; no abridor mejor por dirección, manos 1/2/3, sin adaptar estrategia a jugadas rivales. Misma decisión si cambia información no permitida.
- [ ] **B09-12 — Ejecución BOT:** políticas reales invocadas y validadas por Game, modo BOT únicamente, sin timeout/contador/status humano. Ningún humano puede enviar jugada por bot o obtener su mano, incluido anfitrión.
- [ ] **B09-13 — Continuaciones:** primer abridor BOT y varios seguidos actúan en servidor sin petición cliente/pausa humana; generación/tarea/contexto invalidados, un movimiento por paso y otra sala responde; parar en humano/review/resultados, cero sin bucle bloqueante.
- [ ] **B09-14 — Partidas completas:** 2–5 jugadores mixtos, EASY/NORMAL y niveles combinados, host jugador/observador; puntuación por cartas, ganador bot/humano, orden base circular, reposición/adquisición y 58 ubicaciones tras cada transición.
- [ ] **B09-15 — Final/desempate:** políticas con manos reducidas en tres rondas finales, misma indicadora/sin reposición; único desempate con bots, posibles empatados solo bots, puntos/puestos fijos y vencedor correcto. Review cero/positiva y última review conservadas.
- [ ] **B09-16 — Inactividad/recuperación:** bots no evitan fin por todos HUMAN AUTOMATIC en base/final; completar última ronda/review sin reposición/desempate. Si desempate ya empezó reconocer vencedor; HUMAN ACTIVE fuera de él evita inferencia falsa. Servidor continúa sin conexiones; regresar no recupera control automático.
- [ ] **B09-17 — Privacidad/resultados:** HTTP/ack/eventos para humano/observador/tercero inspeccionados: solo mano propia/público, sin manos de bots/rivales, paquetes/mazo oculto/credenciales. BOT en clasificación sin sesión/link propio; retención/retorno/otra sala y expiración antigua conservados.
- [ ] **B09-18 — Interfaz:** filas/marcas y controles solo en espera, pendientes/errores por operación, diálogo/foco/Escape/teclado y tamaños 360/390/1280; no Bot «Reconectando»/«Automático» ni countdown humano. F5 y actualizaciones conservan aceptado, sin desbordar ni borrar otros borradores.
- [ ] **B09-19 — Regresiones/contenido:** B01–B08/T01/activación, bordes de deadline, parciales/timeouts humanos, review y retención intactos; genérica y contrato/publicación sin cambios. Normal compilado completa al menos una partida humano contra bots con conexiones/entropía normales.
- [ ] **B09-20 — Puertas/arquitectura:** P1+P2 comprobadas, npm run check/test:browser finales; imports/ciclos y revisión semántica de política con información limitada, IDs/índices solo humanos y coordinación única. Registrar resultados reales, no cierre tras controles solamente.

### Plan proporcionado y evidencias

1. **Políticas/dominio:** tests puros nuevos y regresiones `game/manualGame/timedGame` existentes. Manos/atributos explícitos para reglas y extremos; paquetes completos validados y trazas legales para partidas. Ejecutar políticas BOT durante trazas, no simularlas con jugadas MANUAL ni inventar puntos/ganadores para forzar empate. Cubrir manos 1/2/3 en políticas; variar información oculta ajena no modifica su decisión. Conservación/puntos reales después de cada movimiento.
2. **Sala/aplicación:** ampliar Room/RoomUseCases/configuration/startGame/waitingLifecycle, memoria y GameCoordinator con IDs/Clock/Scheduler sustitutos. Matriz de operaciones/roles/fases, última plaza, actividad antes/en/después, targets retirados, dedupe/pérdida ack, generaciones/revisión/plazos. Tests de repositorio confirman que bots no aparecen como sesiones/propietarios/receptores/ausencias. Programador controlado acredita secuencia, no tiempo real.
3. **HTTP/Socket.IO reales:** seguir montaje configuration/start/manual/timedSocket para autenticación, gestión/recuperación, dos sockets del host, invitado/observador/tercero, bloqueo al iniciar y privacidad de todo payload, incluido ack de replay de AddBot en IN_GAME. Conexiones reales con tiempo/permutación controlados se rotulan como tales.
4. **Navegador compilado:** casos B09 de gestión/diálogo/uncertidumbre/cancelación/mezcla/plazas/partida/observador y regresiones anteriores sobre servidor de esa build. Fixtures legales temporales separadas para final/desempate/inactividad; normal con genérica 2, entropía/Clock/Scheduler reales para partida humano contra bots. Comprobar niveles mixtos y uno contra bots en aplicación/dominio además del recorrido visible.
5. **Puertas finales:** `npm run check` y `npm run test:browser`, con las garantías de los 341 tests/74 Chrome anteriores conservadas. Mantener regresión del vencimiento real B08 y separar su evidencia de reloj controlado; no añadir otras esperas reales largas salvo riesgo concreto. La retención de media hora sigue verificable con reloj controlado, sin atribuir media hora real. No reducir cobertura ni desactivar bots/plazos en producto para probar. Revisar imports de valor/tipo/ciclos y semántica de §7.

**Recorrido manual entregable:** host crea, añade Normal y Fácil, renombra válido/repetido, cancela borrador y retira con aviso; F5/segunda pestaña recuperan aceptado. Invitado independiente observa y no modifica. Probar cinco plazas y host observador sin humanos —inicio rechazado—; después humano+bot válido. Seleccionar genérica 2 y completar partida normal uno contra bots, con cartas/ganador/resultado y nueva sala sin reinicio. Comprobar review=0/5, F5/corte/restauración y pérdida de control humano tras dos timeouts. Usar montaje legal de pruebas aparte para final/desempate si el recorrido normal no los alcanza; un final por abandono no acredita agotar mazo. Revisar móvil emulado/teclado y consignar si lo hizo autor, automatización o tiempo controlado.

**C09–C10 siguen parciales:** B09 añade uso/presentación segura con bots y conserva versión/validación/instantánea/medios; no declara completos los criterios generales ni acredita equilibrio, comprensión con usuarios, dispositivos físicos o despliegue. Los resultados históricos B04–B08 mantienen su ámbito.

## 10. Decisiones, responsabilidades documentales y cierre

| Tema | Estado al 05/10/2026 |
|---|---|
| Añadir explícito Normal, niveles/nombres/diálogo/host | Confirmados en encargo y contexto; no reabiertos. |
| Políticas EASY/NORMAL, cartas y final por HUMAN inactivos | Confirmadas en dominio/aplicación; se implementan sin variar algoritmos. |
| Retirada inmediata y aviso cinco segundos | Confirmados por respuesta del autor en este hilo. |
| Numeración por incorporaciones aceptadas, discriminación, operaciones/ack | Concreciones técnicas reproducibles de §§3–5; no nuevos parámetros de producto. |
| HARD/IA/vigilancia/rediseño/despliegue | Fuera, sin interfaz/infraestructura anticipada. |

No quedan preguntas funcionales abiertas que bloqueen la implementación. El implementador conserva autonomía interna de §7.

| Fecha | Cambio de alcance/regla | Criterios/fuentes |
|---|---|---|
| 05/10/2026 | Concreción del encargo B09 y retirada confirmada; sin cambios de algoritmos | B09-01–20; aplicación debe registrar nivel inicial NORMAL e interacción acordada. |

**Traslado a Arquitectura/coordinación:** actualizar aplicación §§3–7/14/18–19 con gestión, NORMAL predeterminado, diálogo/retirada, contratos/actividad, inicio mixto y capacidades efectivamente verificadas; infraestructura §§5–8 con discriminación BOT sin sesión/presencia, transportes seguros y continuaciones compartidas. Registrar concreción de representación del Player y políticas en la descripción del código APP, sin duplicar algoritmos del dominio. Contexto registra base/cierre/evidencia real y pendientes. Dominio ya define los algoritmos y la errata está resuelta: solo comunicar ajustes descriptivos necesarios por la materialización, sin cambiar reglas. No exigir revisión general adicional por mantener descripciones compatibles.

Implementación puede actualizar README vigente, cierre/evidencia B09, proceso y organización del código dentro de APP. **No editar fuentes generales TFM**; entregar conclusiones a sus responsables. Rama B09 nueva desde main integrado o sucesor compatible, conservando cambios existentes; commits locales, sin push/PR/despliegue ni abrir otro bloque.

[Prompt de implementación](PROMPT_IMPLEMENTACION_BLOQUE_09.md).

**Código B09:** pendiente. **Pruebas del producto/arquitectura ejecutadas en SDD:** ninguna. **Fecha de verificación:** pendiente; no marcar implementado/verificado ni casillas usando evidencia B08. El cierre futuro registrará etapas P1+P2, base/commit, pruebas/comandos/entorno/resultados por criterio, fallos/reparaciones, revisión de capas/privacidad, conexiones/reloj/entropía y recorridos manuales efectivamente realizados, con límites explícitos.

**Comprobación documental 05/10/2026:** enlaces locales de bloque/prompt/proceso existentes, 20 criterios únicos sin marcar y ocho ejemplos; `git diff --check` sin incidencias. Solo cambian estos tres documentos SDD; rama/HEAD conservados. SHA-256 de las cuatro fuentes generales TFM y ambos JSON de genérica APP idénticos a los leídos al comenzar. No acredita implementación ni pruebas del producto.
