# B09 — Gestión y ejecución completa de bots fácil y normal

**Estado:** acordado, implementado y verificado localmente el 05/10/2026 — P1+P2; evidencia nueva en §11. Recorridos humanos del autor pendientes.
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

Base consultada antes de implementar: Game/autoPlay, Room/RoomUseCases/GameCoordinator/WaitingLifecycle, puertos/proyecciones/repositorio/sockets, shared/contracts y pantallas/hooks de espera/inicio/juego. En esa base los jugadores eran humanos; B08 ofrecía continuaciones de AUTOMATIC reutilizables, todavía sin BOT. La entrega B09 se registra en §11.

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

Criterios inicialmente pendientes; las marcas de cierre remiten a la evidencia nueva por criterio de §11. Una lista prevista o evidencia B08 no acredita B09.

- [x] **B09-01 — Añadir:** uno NORMAL por gesto aceptado, sucesión/ID servidor, sin auto-relleno ni cliente determinando identidad. Rechazos/replays no consumen número ni crean sesión/presencia bot.
- [x] **B09-02 — Niveles:** EASY/NORMAL individuales/mezclados, aplicación inmediata y recuperación; HARD/booleanos/números/tipos/campos extra rechazados en borde y dominio, sin controles anticipados.
- [x] **B09-03 — Diálogo/nombre:** actual sin sufijo, aceptar/cancelar/cerrar/Escape, no envío al cancelar, normalizeName vigente, repetidos/trim/1–16 y errores. Renombrar preserva ID/plaza/orden/nivel/nombres ajenos; concurrencia mantiene borrador y objetivo.
- [x] **B09-04 — Retirada:** inmediata aceptada libera plaza/solo ese bot, aviso cinco segundos con sufijo anterior y dedupe; no simulación de salida humana. Retirar/editar inexistente/humano/ajeno rechazados; retirada repetida aceptada no reaplica.
- [x] **B09-05 — Permisos/fase:** solo host incluso observador; sesión ausente/guest/tercero sin gestión; controles/servidor bloqueados tras inicio/RESULTS/cierre. Replay autorizado anterior devuelve estado vigente sin mutar Game.
- [x] **B09-06 — Capacidad/orden:** 5 total con reservas humanas, host jugador último/observador aparte; carreras add/add, add/join, add/hostPlays y add/start sin sexta plaza ni cambio de roster fijado. Bot nuevo al final, no reordenar por nombre/nivel.
- [x] **B09-07 — Actividad/plazos:** nuevos cambios efectivos renuevan/avanzan revisión/publican una vez; iguales/cancelados/rechazados/repetidos/lecturas no. B03 antes/en/después de caducidad, sin renovar ausencia ajena ni reservar bots.
- [x] **B09-08 — Dedupe/incertidumbre:** ack/emisión perdido, replays/conflicto de ID/otra pestaña y respuestas antiguas no duplican/revierten/reinsertan; payload inmutable/mismo ID al confirmar intento incierto, sin cola ni reenvío por reconexión/F5.
- [x] **B09-09 — Inicio:** 2–5 con HUMAN jugador, incluido uno contra 1–4 bots y observador con invitado/bots; solo bots o observador+solo bots no inician. Humanos pendientes bloquean; bots no requieren conexión. Inicio único fija kind/nombres/niveles/orden y baraja exacta.
- [x] **B09-10 — EASY:** apertura más antigua y LOW 1/29, HIGH 30/58; no abridor segunda mejor con 3/2 y única con 1 para HIGH/LOW, distinto de automático. Propio atributo indicador/display no gobiernan elección.
- [x] **B09-11 — NORMAL:** apertura distancia 0/59 y empate a favor HIGH, extremos 1/29/30/58; no abridor mejor por dirección, manos 1/2/3, sin adaptar estrategia a jugadas rivales. Misma decisión si cambia información no permitida.
- [x] **B09-12 — Ejecución BOT:** políticas reales invocadas y validadas por Game, modo BOT únicamente, sin timeout/contador/status humano. Ningún humano puede enviar jugada por bot o obtener su mano, incluido anfitrión.
- [x] **B09-13 — Continuaciones:** primer abridor BOT y varios seguidos actúan en servidor sin petición cliente/pausa humana; generación/tarea/contexto invalidados, un movimiento por paso y otra sala responde; parar en humano/review/resultados, cero sin bucle bloqueante.
- [x] **B09-14 — Partidas completas:** 2–5 jugadores mixtos, EASY/NORMAL y niveles combinados, host jugador/observador; puntuación por cartas, ganador bot/humano, orden base circular, reposición/adquisición y 58 ubicaciones tras cada transición.
- [x] **B09-15 — Final/desempate:** políticas con manos reducidas en tres rondas finales, misma indicadora/sin reposición; único desempate con bots, posibles empatados solo bots, puntos/puestos fijos y vencedor correcto. Review cero/positiva y última review conservadas.
- [x] **B09-16 — Inactividad/recuperación:** bots no evitan fin por todos HUMAN AUTOMATIC en base/final; completar última ronda/review sin reposición/desempate. Si desempate ya empezó reconocer vencedor; HUMAN ACTIVE fuera de él evita inferencia falsa. Servidor continúa sin conexiones; regresar no recupera control automático.
- [x] **B09-17 — Privacidad/resultados:** HTTP/ack/eventos para humano/observador/tercero inspeccionados: solo mano propia/público, sin manos de bots/rivales, paquetes/mazo oculto/credenciales. BOT en clasificación sin sesión/link propio; retención/retorno/otra sala y expiración antigua conservados.
- [x] **B09-18 — Interfaz:** filas/marcas y controles solo en espera, pendientes/errores por operación, diálogo/foco/Escape/teclado y tamaños 360/390/1280; no Bot «Reconectando»/«Automático» ni countdown humano. F5 y actualizaciones conservan aceptado, sin desbordar ni borrar otros borradores.
- [x] **B09-19 — Regresiones/contenido:** B01–B08/T01/activación, bordes de deadline, parciales/timeouts humanos, review y retención intactos; genérica y contrato/publicación sin cambios. Normal compilado completa al menos una partida humano contra bots con conexiones/entropía normales.
- [x] **B09-20 — Puertas/arquitectura:** P1+P2 comprobadas, npm run check/test:browser finales; imports/ciclos y revisión semántica de política con información limitada, IDs/índices solo humanos y coordinación única. Registrar resultados reales, no cierre tras controles solamente.

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

**Código B09 revisado:** `074efac069251f382ed46adfbe18b18d69bd2a9b`, sucesor de implementación `8eddd9f15b2e81051943cc2c4b504879ffe8c6b2`, prueba privada `5a1dcd033d6d7927eb85ffae6898ef241db17f04` y foco accesible `a3f8db7afe8404b62765a07cedbb7bd8922ca700`. **Verificación local:** 05/10/2026, P1+P2 y criterios B09-01–20 mediante evidencia nueva §11, sin atribuir históricos B08. La preparación SDD no ejecutó pruebas de producto; la implementación sí registra puertas, fallos/reparaciones y límites. Cierre documental en commit local posterior; no publicación/despliegue.

**Comprobación documental de preparación 05/10/2026:** enlaces locales de bloque/prompt/proceso existentes, entonces 20 criterios únicos sin marcar y ocho ejemplos; `git diff --check` sin incidencias. En esa preparación solo cambiaron estos tres documentos SDD; rama/HEAD conservados. SHA-256 de las cuatro fuentes generales TFM y ambos JSON de genérica APP idénticos a los leídos al comenzar. No acredita implementación ni pruebas del producto.

## 11. Evidencia de implementación

### 11.1 Base efectiva — 05/10/2026

Antes de editar código: main/HEAD/origin/main local `8d305e0e2e13b60b6dc2e412ae9fc073d6bff28f`, aplicación 0.1.0. Conservados proceso modificado y especificación/prompt inicialmente sin registrar; registrados por separado en commit documental `8d98208`. Rama nueva `feat/b09-bots`, sin restaurar, consultar remoto o publicar. Lectura de fuentes y contratos: no contradicción bloqueante; NORMAL inicial cerrado por autor, descripción general pendiente de traslado.

`npm run check` de base: salida 0, 341/341 en 31 archivos, 15,25 s (14:15:45 Europe/Madrid), tipos/lint/build correctos, 59 módulos sin imports prohibidos/ciclos. Windows/PowerShell, Node 24.13.0, npm 11.6.2. `npm run test:browser -- --workers=2`: salida 0, 74/74, 6,2 min, build actual e instancia normal arrancada mediante `npm run start` en 127.0.0.1:3000. Incluye vencimiento real B08 desconectado: inicio UTC 12:19:25.135, límite 12:19:40.135, observado 12:19:40.176, contador 1 recuperado. Logs locales ignorados `b09-baseline-check.log`, `b09-baseline-browser.log`. Ambas puertas registradas antes de editar código: acreditan la base, no B09.

SHA-256 inicial APP=ASSETS: baraja `991406D04F60BFE884166A69FCC43954CFC751F0E058093AE2542F32C989E8ED`, cartas `868988A43FE6C6BE1A73BE14013C543DC2FC83970341A4243BE868AF75B4C35C`. Fuentes generales leídas y protegidas: aplicación `7768C7AD99E64631431C776261F10DECDF0CD04FF2A883524B1F5EDE720BC09A`, contexto `D03AE60F3C680CEA39FA1F1706B1734F4FCCC530F161EE67E14CCFC0ACE1C325`, dominio `2FE4C06F814CC9A0F2659D5700B117E550EBAA4DBE92F5A95B9AC36233788FD6`, infraestructura `D557AC118C3AED2181748B23AC56988C9902749C5BBE6B3A489DC1A40CE72C74`.

### 11.2 Etapa P1 — 05/10/2026

Gestión atómica mediante Room/RoomUseCases, entrada exacta en infraestructura, proyecciones discriminadas, filas/diálogo y envío volátil por operación; políticas EASY/NORMAL puras separadas de autoPlay. Lista mixta con host al final; solo humanos en sesiones/presencia/reservas/motivos/emisiones. Dedupe mínimo con botId, registrado antes de emisión.

Antes de extender P2: `npx vitest run server/domain/botPlay.test.ts server/application/bots.test.ts server/infrastructure/botInput.test.ts` **23/23**, tres archivos, 509 ms, 14:38:28; typecheck/lint/build correctos. `npx playwright test tests/browser/bots.spec.ts --workers=2` sobre compilación P1: **3/3**, 56,1 s, un trabajador efectivo, dos sesiones/tres páginas, 360/390/1280. Conexiones reales y PNG/null de paquete temporal validado, reloj sustituido; no revisión humana. Diálogo/Escape/cancelación/error/borrador remoto/nivel/retirada/F5/capacidad/foco/scroll comprobados. Sin sustituir respuestas en estos tres casos.

Fallos y reparación: primera prueba pura 20/21 comparaba texto de permiso; ahora comprueba FORBIDDEN. Primera batería de navegador 0/3 esperaba foco en Añadir pese a existir fila siguiente: la regla admite siguiente/anterior; aserción corregida verifica Cambiar nombre de Bot 2. Lint señaló setState síncrono para aviso de bot retirado; el aviso se deriva del contexto vigente, sin render adicional. Python del alias Windows no estaba ejecutable: ediciones realizadas con herramienta de parches/Node existente, sin instalar dependencia. Logs ignorados `b09-p1-*`. P1 no acredita ejecución completa ni cierre B09; P2 continúa en este bloque.

### 11.3 Etapa P2 — 05/10/2026

Partidas mixtas y políticas BOT incorporadas en Game y la continuación única de GameCoordinator; no sesiones/ausencias/tiempo humano para bots. Resultados/inactividad cuentan solo HUMAN base, con revisión final y retención/retorno conservados.

- Prueba dirigida pura inicial: `npx vitest run server/domain/botGame.test.ts`, **15/15**, 553 ms (14:51:32). Posteriormente se añadió el caso legal del segundo timeout durante desempate iniciado.
- Aplicación dirigida reparada: `npx vitest run server/application/botExecution.test.ts`, **9/9**, 569 ms (14:53:51); luego añadido desempate/inactividad. Primer montaje 5/9: helper no transmitía ID nuevo tras rechazo, la sala nueva vencía al mismo instante que el resultado y un assert esperaba literal antiguo. Se corrigieron montajes/aserciones, sin cambiar reglas.
- `npx vitest run server/botSocket.test.ts server/application/botExecution.test.ts server/domain/botGame.test.ts`, **32/32**, tres archivos, 2,23 s (14:58:20). Conexiones HTTP/Socket reales, reloj/entropía sustituidos. Primera expectativa de cookie BOT inválida esperaba 403; autenticar token inexistente da 401 SESSION_REQUIRED, se mantiene la distinción con tercero autenticado 403.
- `npm test` sobre P2 ampliada: **398/398**, 37 archivos, 12,75 s (15:02:35). Incluye regresiones y dos casos de desempate iniciado/inactividad. Los primeros pases detectaron nueve y luego cuatro asserts de claves antiguas; añadidos kind/botDifficulty explícitos manteniendo verificación exacta, no relajándola.
- `npx playwright test tests/browser/bots.spec.ts --workers=2` P2: **9/9**, 3,7 min, un trabajador efectivo; tres gestión P1, cuatro partidas mixtas/final/desempate/observador/F5 con tiempos/entropía controlados, una partida normal genérica 2 (15 gestos humanos, 45 puntos, tres rondas finales, EASY/NORMAL, dos pestañas) con adaptadores/entropía normales en 127.0.0.1:3000, y una pérdida deliberada de ack Rename/retiro remoto/mismo payload. No revisión humana. Se añaden dos recorridos observador/ack antiguo e inactividad para la puerta final.

Trazas reproducibles de paquetes completos validados: seed 2/dos jugadores =20/20 y mano de desempate 3; seed 3/tres =18/18/9 con solo BOT empatados y humano ACTIVE fuera, mano 3; seed 56/cuatro =12/12/12/12 y mano 2; seed 98/cinco =10/10/10/10/10 y mano 1. Todos los BOT ejecutan Game.botPlay; los humanos confirman elecciones de su propia mano, sin asignar puntos/saltar motor. Otra traza seed 2 hace primer timeout en ronda 20 y segundo en desempate, que completa/revisa/reconoce ganador sin puntos nuevos.

Revisión visual automatizada de captura 390 detectó selector BOT demasiado bajo; reutiliza ahora estilo de configuración de 48 px, foco y borde, sin rediseño. Se añadió key por sala para reiniciar provisionales al cambiar asociación y cierre tras confirmación explícita de renombre incierto. Logs ignorados b09-p2-*. El cierre depende de las puertas finales del código definitivo.

### 11.4 Revisión semántica, privacidad y conservación

Revisados los diffs/módulos de producción: botPlay recibe solo mano propia/atributo/apertura/dirección/dificultad, sin Game/rivales/mazo; Game discrimina kind y valida/aplica BOT. AutoPlay sigue separado y ningún contador/status humano se añade a objetos BOT. Room conserva una secuencia mixta y capacidad/reservas sin IO; numeración se consume solo después de autorización/fase/capacidad. RoomRequests guarda botId/firma/contexto, no vista/manos. Registro/tareas/dedupe preceden a emisiones; callback antiguo/cancelado/duplicado y fallo de emisión BOT se comprobaron sin movimiento repetido. GameCoordinator utiliza su mapa existente y un paso por continuación, con el mismo Clock/Scheduler y sin nuevos servicios/adaptadores.

memberSessions/activeSessions, presencia, cierres y emisiones proceden solo de HUMAN; MemoryRoomRepository indexa esos miembros y compara identidad/ID antes de retirar índices. Expiración de resultado antiguo deja viva otra sala nueva. Proyecciones por destinatario explícitas: BOT role/presence/playStatus null, HUMAN botDifficulty null, propio participante HUMAN, mano propia humana/observador vacía, solo propio contador, no paquetes/semillas/orden oculto/credenciales. Inspeccionadas claves y cartas exactas en HTTP, ack/eventos reales de partidas completas, replay Add en IN_GAME/RESULTS, observador/tercero/cookie BOT inválida.

Prueba ampliada de manipulación sobre conexiones reales: `npx vitest run server/botSocket.test.ts`, **8/8**, 3,13 s (15:17:29): humano envía ID de carta oculta BOT→CARD_NOT_IN_HAND; observador→NOT_YOUR_TURN; incluir playerId BOT→INVALID_INPUT por claves exactas; mano BOT intacta. Commit adicional de prueba `5a1dcd033d6d7927eb85ffae6898ef241db17f04`, sin cambio en código compilado `8eddd9f15b2e81051943cc2c4b504879ffe8c6b2`.

Otros bordes nuevos: caducidad de gestión a 1.799.999/1.800.000/1.800.001 ms sin callbacks y emisión perdida de paso BOT; total pasa de 398 a 402 pruebas. El último caso dirigido de navegador de inactividad falló al buscar el texto del error de servidor en lugar de la advertencia visible B08; aserción corregida al aviso existente, **1/1** en 3,1 s (15:13). El montaje mixto ahora espera la fila aceptada antes de cambiar su nivel, para no modificar por carrera la fila anterior. Ningún cambio de reglas/plazos.

Revisión de capturas generadas: espera 390, clasificación 390 (cinco a 10, observador, ganador BOT inequívoco) y resultado normal 1280 (Bot 1 NORMAL 24, humano 15, Bot 2 EASY 6; total 45). Revisión visual del agente sobre artefactos automatizados, **no recorrido manual humano ni dispositivo físico**. Un recorrido puro adicional de seed17/EASY-NORMAL en 2–5 confirmó vencedores humanos y bots alcanzables, sin alterar Game. Las capturas y logs son artefactos ignorados; las pruebas/este registro permiten reproducirlos.

Huellas de cierre APP=ASSETS iguales a §11.1; formato 1/contenido 2/true intactos. Cuatro SHA de TFM idénticos; ningún archivo TFM editado. Diff de genérica y evidencias históricas B04/B05/activación/B06/B07/B08 vacío respecto de main. Catálogo y dist/dist-server no registrados en Git.

### 11.5 Primera puerta completa y resultados por criterio — 05/10/2026

**Base/cambio revisado:** main/origin-main local `8d305e0e2e13b60b6dc2e412ae9fc073d6bff28f`, sin consultar ni publicar remoto. Preparación/especificación/prompt/enlace locales conservados por separado en `8d98208`. Rama `feat/b09-bots`; implementación/README/organización/pruebas en `8eddd9f`, aserciones adicionales de manipulación Socket en `5a1dcd0`. Estas últimas solo cambian pruebas; el producto compilado permanece idéntico. No se parte de main anterior, no reset/stash/descarte ni copia de StatDeck.

**Entorno:** aplicación 0.1.0; Microsoft Windows 10.0.26300 X64 (cadena del sistema), PowerShell, Node v24.13.0, npm 11.6.2, Chrome instalado 154.0.8037.93, Playwright 1.63.0, Vitest 5.0.2. Hora local Europe/Madrid (UTC+2). No dependencias nuevas. La consulta de edición Windows por CIM estaba denegada; se registró OSDescription sin elevar permisos.

| Comando/comprobación de la primera puerta | Resultado realmente ejecutado |
|---|---|
| `npm run check` sobre HEAD 5a1dcd0 (15:25:20) | Salida 0: tipos/lint/build, **402/402**, **37 archivos**, 13,07 s Vitest; **64 módulos**, sin imports prohibidos/ciclos. 341 regresiones +61 pruebas B09, sin reducir baterías anteriores. |
| `npm run test:browser -- --workers=2` (15:15–15:23) | Salida 0, **85/85**, 7,7 min; 74 regresiones +11 B09, Chrome sobre compilación actual. Dos trabajadores; aviso de archivo B07 lento/flags de color, sin fallos. |
| Inicio normal `npm run start`, instancia antigua detenida | Puerto 127.0.0.1:3000, catálogo normal solo generica v2 y sin fixtures. HTML y bundle servidos idénticos a dist. Registro 13:15:46.923 UTC, bundle index-eE7SfML4.js SHA-256 f78fceddfa7331e7b720141a064f3179afe0e1872f787cbb949807db36ed5496; CSS index-v-J4Clzs.css. La reconstrucción de esa versión conservó esos bytes; §11.7 registra el bundle posterior al ajuste de foco. |
| B09 normal genérica 2 en la batería final | Una persona vs NORMAL/EASY, dos pestañas, F5, selección explícita, **15 gestos manuales /15 rondas/45 puntos**, tres finales; resultado y otra sala sin reiniciar. **25,2 s**, SystemClock/TimerScheduler y entropía normales, conexiones reales. Captura: BOT Normal 24, humano 15, BOT Fácil 6. Automatización, no humano evaluador. |
| Regresión B08 real desconectado | **15 s reales**, SystemClock/TimerScheduler/CryptoCardPermutation, instalación compilada APP sin ASSETS (guard sin accesos), servidor vivo. Inicio 13:20:54.377 UTC, límite 13:21:09.377, cierre transporte 13:20:54.429, observación 13:21:09.861 (**483,60 ms** después), recuperación mismo jugador/partida y contador 1. Contexto público game 31c66ae6-67f4-45c4-b6f6-fc82672fde20 /r1/p1. No fake clock. |
| Regresión B03 real de reserva | Conexiones reales, última pestaña; margen observado **30.010,24 ms** tras detección, total pérdida-red **30.018,67 ms**. No equivale a caducidad real de media hora. |
| Hashes/conservación/independencia | APP=ASSETS y cuatro documentos TFM iguales a §11.1. Históricos intactos. Catálogo/dist/logs/capturas ignorados. Instalaciones autónomas B06/B07/B08 ejecutan con guard ASSETS, fixtures separadas del catálogo normal. |

Las pruebas de dominio se reproducen en botPlay.test/botGame.test; aplicación en bots.test/botExecution.test, integración en botInput.test/botSocket.test, navegador en bots.spec. Los plazos de revisión, espera, resultado y trazas deterministas usan ControlledTime: no acreditan segundos/minutos de reloj real. HTTP/Socket reales con ese reloj siguen siendo conexiones reales. El caso normal y la regresión real desconectada están separados.

| Criterio | Evidencia nueva ejecutada / resultado |
|---|---|
| B09-01 | bots.test y botSocket E4: uno NORMAL, contador creciente/no reutilizar, replay mínimo; fila/número en tres vistas de bots.spec. Sin sesión/presencia/índice BOT. Conforme. |
| B09-02 | botInput/botPlay/Game invalidan nivel/tipo extra; aplicación persiste/no-op; navegador mezcla EASY/NORMAL y F5. Conforme. |
| B09-03 | bots.test normalizeName/trim/repetidos; bots.spec en 360/390/1280 foco/raw sin sufijo/Escape/Cancelar/Cerrar sin envío, error corregible, borrador remoto conservado. Conforme. |
| B09-04 | Retirada inmediata/sufijo previo/evento único en bots.test/botSocket; replay no restaura ni room:left. Objetivos se buscan solo BOT vigente de esa Room; humano/inexistente/retirado rechazados. Aviso/foco/plaza navegador. Conforme. |
| B09-05 | Host player/observer, invitado/tercero/401 de cookie BOT; fase bloqueada, replay Add con propia vista host durante IN_GAME/RESULTS; permisos de partida manipulada. Conforme. |
| B09-06 | Orden mixto/nivel/nombre/reserva y cinco plazas en aplicación; add/add-add/join-add/hostPlays casi simultáneos de sockets reales, add/start ambas órdenes y respuesta antigua en navegador. Conforme. |
| B09-07 | Efectos/no-op/replay/lecturas/errores, cancelaciones sin petición; reserva humana intacta, ausencia BOT inexistente. 1.799.999/1.800.000/1.800.001 sin ejecutar callback prueba prioridad exacta. Conforme. |
| B09-08 | Fallos de emisión Add/Remove/paso BOT, ack omitido rename y retirada otra pestaña; payload/ID originales, sin reinsertar/aviso/actividad repetida. UI recupera antes de confirmar y ack antiguo tras inicio no restaura WAITING. Conforme. |
| B09-09 | 2–5 mixtos y una persona vs1–4 bots; solo bots no inicia, host observer+invitado/BOT sí; humanos desconectados bloquean, BOT no. Inicio único/permutación una vez/preparación inmutable. Conforme. |
| B09-10 | EASY extremos 1/29 LOW,30/58 HIGH, más antigua; manos1/2/3 HIGH/LOW segunda mejor, distinto AutoPlay/información irrelevante. Conforme. |
| B09-11 | NORMAL distancia0/59 y tieHIGH (2/57,2/56), extremos/manos1/2/3, mejor oficial sin información ajena. Conforme. |
| B09-12 | Game.botPlay durante todas las trazas, modoBOT/kind validado, objetos BOT sin counter/status. Ataques Socket cardBot/playerIdBot/observer rechazados; vistas sin sus manos. Conforme. |
| B09-13 | Abridor BOT y cadena hasta humano sin navegador, tareas/generación/callback viejo y emisión fallida; otra sala responde en coordinador único. Review positiva detiene y cero comunica antes de avanzar. Conforme. |
| B09-14 | Ocho partidas puras EASY/NORMAL 2–5 +mixta normal; Circular/segundo/acquisición/puntos y58 ubicaciones tras cada transición. Seed17 da vencedores HUMAN yBOT legales. Host player/observer en app/socket/navegador. Conforme. |
| B09-15 | Seeds2/3/56/98 completos validados; tres finales de mano3→2→1→0, única indicadora/sin reposición; desempate de mano3/2/1 sin puntos nuevos, incluso solo BOT empatados/HUMAN ACTIVE fuera; review0/5 y final. Conforme. |
| B09-16 | Inactividad base/final y segundo timeout en desempate iniciado: termina/revisa/reconoce ganador sin reposición/nuevo desempate. Socket con cero clientes comprobado; navegador sin páginas recupera resultado, sin control automático. Conforme. |
| B09-17 | Claves/cartas de HTTP/ack/eventos por destinatario y resultados exactos; replay Add es host, observer sin mano, tercero403/tokenBOT401. Retorno/retención/expiración sin borrar nueva sala ni medios; no asociaciones BOT. Conforme. |
| B09-18 | Tres tamaños360/390/1280, dos sesiones y dos pestañas host (P1), controles/pending/error por campo, diálogo/teclado/foco/scroll/F5 y marcas de mesa/resultados. Solo HUMAN con presencia/contador/timer; BOT sin automático/reconectando. Conforme. |
| B09-19 | 341 regresiones de servidor y74 de navegador conservadas; caso real15s desconectado repetido, genérica inmutable, partida normal humano contra ambos niveles con45 puntos. Conforme. |
| B09-20 | P1+P2, primera puerta 402/85 y definitiva 402/86 en §11.7, 64 módulos y revisión semántica §11.4; commits locales y cierre real. Conforme en alcance local. |

**Ejemplos E1–E8:** E1 normal completo; E2 gestión/sufijos/cancelación/numeración en bots.test/bots.spec; E3 carreraSocket real y reservas; E4 ack omitido/retiro/mismo payload Socket+navegador; E5 observador soloBOT rechazo y HUMAN+BOT inicio; E6 políticas puras (12/51 y2/57,2/56); E7 trazas/review/final/tie de dos–cinco; E8 inactividad base/final/tie y recuperación sin clientes. Todos ejecutados en las capas indicadas, no una lista prevista.

Logs locales ignorados: b09-final-check.log, b09-final-browser.log, b09-normal-instance.log y b09-p1/p2-*. Capturas B09 en test-results/bots-*/B09-*.png. No se versionan artifacts de navegador ni información privada de sesiones. README deja instrucciones manuales de §9 contrastadas por automatización; **recorrido humano del autor B09 pendiente**.

### 11.6 Archivos y traslado de cierre

Inventario de cambios respecto de base (49 archivos; paths relativos al repositorio):

- Documentación: README.md; docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md; docs/sdd/BLOQUE_09_BOTS.md, PROCESO_SDD.md y PROMPT_IMPLEMENTACION_BLOQUE_09.md. Preparación preservada, históricos sin cambiar.
- Dominio: server/domain/botPlay.ts, game.ts, botPlay.test.ts, botGame.test.ts; game.test.ts, manualGame.test.ts y timedGame.test.ts adaptan preparación HUMAN explícita sin borrar casos.
- Aplicación: server/application/room.ts, roomUseCases.ts, gameCoordinator.ts, waitingLifecycle.ts, ports.ts, roomError.ts, roomView.ts, initialGameView.ts, resultsView.ts; bots.test.ts, botExecution.test.ts y roomUseCases.test.ts.
- Infraestructura/integración: server/infrastructure/botInput.ts, botInput.test.ts, socketRooms.ts, http/expressApp.ts; server/botSocket.test.ts y manualSocket.test.ts. Memoria/sesiones/composición reutilizadas sin nuevos servicios.
- Contratos: shared/contracts/room.ts y game.ts.
- React: src/WaitingPlayers.tsx, useBotActions.ts, participantNames.ts, App.tsx, screens.tsx, StartRoomControl.tsx, GameScreen.tsx, ResultsScreen.tsx, useRoomFlow.ts y style.css.
- Navegador/soporte: tests/browser/bots.spec.ts, initialGame.spec.ts; tests/support/botTrace.ts, configurationBrowserServer.ts, gamePrivacy.ts, manualBrowserCases.ts y manualSocketCases.ts. Sustituciones/entropía/ack fallidos solo aquí.

**Coordinación/Arquitectura:** actualizar aplicación §§3–7/14/18–19 con NORMAL inicial confirmado, diálogo/cancelación/incertidumbre/retirada inmediata, contratos discriminados/ackbotId, permisos/actividad/orden/capacidad compartida e inicio mixto. Infraestructura §§5–8: BOT sin cookie/sesión/presencia/índice propio; cuatro decodificaciones/transportes seguros, revisión y continuaciones únicas de BOT/HUMAN automático. Contexto: registrar entrega local sobre `8d305e0` y evidencias definitivas 402/86/64 de §11.7 con límites. Dominio ya contiene algoritmos/errata corregida; no cambios de reglas ni reapertura. Las cuatro fuentes generales permanecen intactas para sus responsables.

**Límites/pendientes:** no HARD, IA externa, expulsión humana, vigilancia de dos minutos, rediseño o despliegue; un proceso/memoria volátil, sin persistencia/múltiples réplicas. No prueba humana de comprensión, equilibrio o móvil físico, ni media hora real. C09–C10 mantienen cobertura parcial de contenido/uso/privacidad y no acreditan el MVP completo. Sin publicación GitHub/PR/push desde esta tarea ni otro bloque. B09 queda **implementado/verificado localmente** con P1+P2; revisión humana del autor y actualización descriptiva TFM/publicación futura permanecen pendientes.

### 11.7 Puerta definitiva tras revisión de foco — 05/10/2026

Revisión final: retirar una fila podía intentar enfocar el botón de renombre de la siguiente cuando estaba deshabilitado por una confirmación incierta independiente. Ahora busca un botón habilitado y usa el encabezado Jugadores como alternativa accesible si tampoco puede enfocarse Añadir. Cerrar el diálogo o perder su objetivo aplica la misma comprobación. No cancela otros intentos ni borra borradores. Commit de producto/prueba `a3f8db7`; nuevo recorrido con renombre y Añadir inciertos simultáneos, retirada aceptada y ambos avisos conservados. Prueba dirigida **1/1**, 13,9 s; check de ese ajuste **402/402**, 11,77 s, 64 módulos.

La primera repetición completa de 86 casos se interrumpió tras dos timeouts de ensayo de 30 s en P1 móvil, sin fallo de una aserción; la captura de 360 ya mostraba cinco plazas. El primer pase completo anterior había consumido 29,6/28,0 s en esos recorridos. Se amplió únicamente el presupuesto del ensayo P1 a 60 s (`074efac`), sin alterar tiempo de turno, reservas, revisión, retención, número de pasos o aserciones. Esa ejecución interrumpida **no se acredita como puerta superada**; log b09-final-browser-focus.log.

**Referencia definitiva de código/pruebas:** `074efac069251f382ed46adfbe18b18d69bd2a9b`, producto incluido en `a3f8db7` y los commits anteriores de §10. Cierre documental posterior separado. Mismo entorno/base de §11.5; no nuevos paquetes o cambios editoriales.

| Puerta / evidencia definitiva | Resultado realmente ejecutado |
|---|---|
| `npm run check` (15:41:48, Vitest) | Salida 0: tipos/lint/preparación/build, **402/402 en 37 archivos**, 11,67 s; **64 módulos** sin imports prohibidos/ciclos. Revisión semántica §11.4 conservada. Log b09-final-check-complete.log. |
| `npm run test:browser -- --workers=2` (15:42–15:49) | Salida 0, **86/86 Chrome**, **7,5 min**, dos trabajadores: 74 regresiones +12 B09. Gestión P1 360/390/1280 =29,6/30,0/27,7 s; caso de foco independiente =11,7 s. Sin fallos. Log b09-final-browser-complete.log. |
| Instancia normal compilada/reiniciada | `npm run start`, 127.0.0.1:3000; `/api/decks` solo genérica formato 1/contenido 2, ocho propiedades seguras, portada null. Verificación HTTP 14:03:48.402 UTC sobre HEAD `074efac`: HTML/bundle iguales a dist, `index-D6zOidSb.js` SHA-256 `9CBC5EEEC7762E0431006B8917A12BAAD1C4AF3312730E24744D34E3C97364A4`; CSS `index-v-J4Clzs.css`. Logs b09-normal-instance-final.log, b09-normal-instance-final-evidence.log y b09-normal-instance-final-close.log. |
| Partida normal B09 | **29,4 s**, genérica2 sin fixtures ni respuestas simuladas, SystemClock/TimerScheduler/entropía normales; humano contra NORMAL/EASY, dos pestañas/F5, 15 gestos humanos/15 rondas/45 puntos/tres finales, resultado y otra sala. Captura final 1280: Fácil21, Normal15, humano9; ganador Fácil. Revisada visualmente por agente, no evaluador humano. |
| Regresión B08 real desconectado | **15 s reales**, SystemClock/TimerScheduler/CryptoCardPermutation, instalación compilada autónoma APP con guard ASSETS sin accesos. Game `7cc2f6fa-5395-44c9-8159-2dbd2ffd2078`, turno r1/p1; inicio **13:47:37.575 UTC**, límite **13:47:52.575**, transporte cerrado **13:47:37.682**, observación **13:47:52.870** (**294,47 ms** después). Otra sesión observó el avance; recuperación del mismo jugador `cc303b45-778f-4e57-9024-02176d59cb46`, contador1. Ensayo17,1 s. |
| Regresión B03 real de reserva | Detección de pérdida7,61 ms, margen **30.002,21 ms**, total desde pérdida-red **30.009,82 ms**, cierre de última pestaña y recuperación comprobados. No demuestra caducidad real de media hora. |
| Documentación/conservación final | Ocho huellas completas de §11.1 iguales: dos JSON APP, dos ASSETS y cuatro fuentes generales TFM. Diff de genérica/históricos respecto main vacío; 20 criterios únicos, ocho ejemplos y enlaces de preparación conservados. Catálogo/dist/logs/capturas ignorados. |

La tabla por criterio de §11.5 queda ratificada por esta puerta definitiva; B09-03/04/08/18 añade el caso de foco con pendientes independientes. P1+P2 y B09-01–20/E1–E8 **implementados/verificados localmente**, sin afirmar pruebas humanas, dispositivos físicos, media hora real, equilibrio, despliegue o publicación. README deja los recorridos manuales del autor pendientes hasta ejecutarlos. C09–C10 siguen parciales; actualización descriptiva TFM corresponde a sus responsables según §11.6.
