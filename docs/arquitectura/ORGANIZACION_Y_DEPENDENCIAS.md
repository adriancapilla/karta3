# Organización del código y dependencias de KARTA3

**Estado:** T01 separó creación, B02/B03 espera, B04/B05 barajas/configuración y B06 inicio/mesa inicial. B07 ejecuta partida, revisión/resultados; B08 añade plazos humanos y automático irreversible/final por inactividad. Bots y vigilancia siguen pendientes.
**Fecha:** 30/09/2026.
**Alineación documental:** 01/10/2026 — flujo de barajas conforme a infraestructura §9 y contrato formato 1; las dependencias de capas no cambian.
**Implementación B04:** 02/10/2026 — validación pura, paquetes, catálogo y medios. No se modifica la dirección de dependencias ni se implementa `Game`.
**Implementación B05:** 02/10/2026 — configuración por control y selección de versión mediante puerto; participación/observación en el modelo de sala. Mismas dependencias y dominio de partida pendiente.
**Implementación B06:** 04/10/2026 — Game inicial puro, puerto de definición/presentación y entropía, coordinación por fase y vistas privadas. Se conservan los límites de capas y los requisitos futuros del MVP.
**Implementación B07:** 04/10/2026 — sucesores inmutables de Game, coordinación de jugadas/contexto/revisión/resultados, asociación activa separada del roster y proyecciones seguras. Se reutilizan entropía, reloj/planificador y catálogo existentes, sin cambiar dependencias ni reglas generales.
**Implementación B08:** 04/10/2026 — política/contador/control en dominio; plazo y continuaciones acotadas en la coordinación existente, contrato seguro y presentación temporal. Sin cambiar límites de capas o fuentes TFM.
**Ámbito:** repositorio digital `APP/karta3`. La evolución de estas reglas se decide en la conversación de arquitectura; cada conversación de implementación trabaja con una especificación SDD concreta.

## 1. Qué resuelve este documento

KARTA3 se implementa como una aplicación web en un único repositorio y un único proceso de juego por entorno durante el MVP. Las capas separan **quién decide una regla**, **quién coordina una acción** y **cómo se conecta con navegador, archivos y servicios**. La separación no exige dividir el sistema en microservicios ni comenzar otro proyecto.

Las fuentes funcionales vigentes están en `../../../../TFM/Planificación/` desde esta carpeta:

| Fuente | Decisiones que gobierna |
|---|---|
| `DOMINIO_KARTA3.md` | Barajas, cartas, puntuación, estados de `Game`, rondas, bots, automático, desempate e invariantes. |
| `CAPA_APLICACION_KARTA3.md` | Sala, permisos, casos de uso, plazos, reconexión, vistas y presentación. |
| `INFRAESTRUCTURA_KARTA3.md` | TypeScript, React/Vite, Node/Express, Socket.IO, memoria, barajas preparadas, entornos y despliegue. |
| `CONTEXTO_DESARROLLO_KARTA3.md` | Coordinación, alcance, responsables y estado del TFM. |

`docs/sdd/PROCESO_SDD.md` y la especificación del bloque fijan el trabajo **de ese incremento**. Cuando un bloque completa o modifica una decisión general, se actualiza su fuente responsable; el texto de un bloque no anula silenciosamente otra regla.

Estas rutas sirven en el espacio de trabajo actual. Antes de publicar un repositorio autónomo se facilitarán al revisor enlaces o una exportación controlada de la documentación TFM. Esa distribución editorial no debe crear dos versiones normativas divergentes.

### Incremento de ciclo de vida — bloque 03

`Room` mantiene el estado temporal con tiempos explícitos, sin consultar un reloj real. `WaitingLifecycle`, en aplicación, coordina vencimientos y hechos de presencia mediante los puertos `Clock`, `Scheduler`, `SessionPresence` y `ParticipationEnds`. Los casos de uso aplican vencimientos antes de devolver vistas o aceptar acciones. Las generaciones de inactividad y de cada ausencia son independientes.

`infrastructure/time.ts` implementa medición monotónica y tareas cancelables; `socketRooms.ts` cuenta sockets autenticados por sesión y comunica sus cambios a aplicación. `MemorySessions` conserva únicamente el último motivo automático de cada sesión y lo elimina al retirar esa sesión; el repositorio libera asociaciones y códigos. Composición comparte estas piezas entre HTTP y Socket.IO y expone desmontaje del runtime para pruebas. El cliente recibe presencia/referencia pública, estima el contador y espera una decisión autorizada de cierre. Los sustitutos temporales y controles de avance viven en el montaje de pruebas, sin endpoints públicos.

## 2. Responsabilidades y dependencias

| Zona | Contiene | Puede depender de | No debe contener |
|---|---|---|---|
| **Dominio** | `Game`, `Deck`, `Card`, `Player`, `Round`, `Play`, valores y políticas puras; invariantes y resultado. | Tipos puros propios; datos explícitos recibidos como argumentos. | HTTP, sockets, sesión, reloj real, archivos, React, Express, persistencia. |
| **Aplicación** | Casos de uso y coordinación de sala/partida, permisos, vistas, puertos necesarios. | Dominio, contratos puros, puertos definidos en la propia capa. | Controladores HTTP, componentes React, almacenamiento o transporte concretos, reglas de comparación de cartas. |
| **Infraestructura** | Adaptadores HTTP, tiempo real, sesiones, memoria, reloj, barajas, aleatoriedad y registro; validación de datos externos. | Puertos de aplicación, dominio y contratos en el borde necesario. | Decisiones nuevas sobre puntuación, ganadores o políticas de bots. |
| **Composición** | Construcción del servidor y conexión entre casos de uso y adaptadores. | Todas las piezas que conecta. | Reglas de juego o de producto. |
| **Interfaz** | Pantallas, estados de presentación, accesibilidad y envío de acciones. | Contratos de intercambio y cliente de API/sockets. | Acceso a dominio del servidor, baraja completa oculta o decisión oficial sobre jugadas. |
| **Contratos compartidos** | Formatos públicos de petición, respuesta, evento y vista. | Tipos transportables independientes. | Entidades internas completas, credenciales, estado oculto o lógica de juego. |

La dirección central es **infraestructura → puertos de aplicación → dominio**. La aplicación define la capacidad externa que necesita; la infraestructura la implementa y la composición las conecta. El dominio no conoce a sus consumidores. Un adaptador puede invocar un caso de uso, pero no modificar directamente el interior de `Game` ni saltarse el caso para aplicar reglas.

Un contrato compartido define qué se transporta. No obliga a que la entidad de dominio tenga exactamente esa estructura. La aplicación proyecta una vista distinta para cada participante y para el observador.

## 3. Ubicación propuesta en el repositorio existente

La estructura tras T01 contiene solo las zonas que ya tienen una responsabilidad real:

```text
karta3/
├── AGENTS.md
├── docs/
│   ├── arquitectura/
│   └── sdd/
├── barajas/                copias aprobadas internas; catálogo generado
├── server/
│   ├── domain/             Deck/Card, validación común y Game manual completo
│   ├── application/        modelo Room, casos de uso, puertos y vista propia
│   ├── infrastructure/     HTTP, repositorio en memoria, sesión y generación
│   ├── composition/        conexión de adaptadores y casos de uso
│   └── main.ts             arranque y servicio de la interfaz compilada
├── shared/contracts/       tipos de intercambio públicos
├── src/                    transporte, coordinación y presentación React
├── tests/browser/          recorrido observable
└── tools/                  control de dependencias y sus casos negativos
```

El directorio `server/domain/` contiene la validación pura de `Deck` B04 y el agregado `Game` iniciado en B06/B07; no se creó vacío para T01. B08 añadió plazos y automático humano; B09 añade bots mediante políticas puras y la misma coordinación de ejecución, alineados en EASY/HARD por T02. Los apartados siguientes describen cada incremento y su alcance. `tools/decks.ts` delega a composición, que selecciona las mismas operaciones de infraestructura para comando, construcción y arranque. Una prueba cercana al módulo que comprueba es válida. Se mantiene un solo repositorio.

### Estado del primer bloque tras T01

T01 separó `server/roomStore.ts` y `server/app.ts`: `Room` conserva estado y transiciones; `RoomUseCases` coordina identidad interna, permisos, código y repositorio; `roomView.ts` proyecta la respuesta; infraestructura conserva mapas, cookie, cripto y Express; composición los conecta. Los contratos públicos viven en `shared/contracts`. El comportamiento HTTP y la interfaz del bloque 01 se conservaron y se comprobaron de nuevo.

Las carpetas nuevas se crean al implementar funciones nuevas o al extraer una responsabilidad real. Se evita tanto un archivo único creciente para todas las funciones como una jerarquía llena de clases sin conducta.

## 4. Dónde va cada decisión

| Necesidad | Lugar responsable | Ejemplo de límite |
|---|---|---|
| Comparar cartas, resolver la ronda, atribuir cartas ganadas | Dominio | Un punto por **carta** ganada, no por ronda. |
| Seleccionar jugada de bot Fácil/Difícil o automático humano | Dominio | Recibe su mano y la información permitida; no consulta otros jugadores en infraestructura. |
| Preparar y resolver la ronda única de desempate | Dominio | Solo empatados en cabeza; cartas adicionales no cambian puntos ni puestos base. |
| Crear sala, admitir participantes y bots, comprobar permisos | Aplicación | Coordina la preparación y consulta el dominio al iniciar la partida. |
| Recibir una jugada o dirección parcial y relacionarla con identidad/turno | Aplicación | Verifica fase y delega el movimiento completo a `Game`. |
| Programar el vencimiento real de un turno o revisión | Infraestructura | Entrega el aviso al caso de uso; no elige la carta por timeout. |
| Persistir el estado vivo del MVP | Adaptador en memoria | Un proceso por entorno; la aplicación expresa el puerto. |
| Cargar paquetes JSON y comprobar formato, versiones e imágenes | Herramienta y adaptador de infraestructura | Reutilizan validación pura de 58 cartas y tres permutaciones 1–58. CSV y herramienta editorial aplazados. |
| Construir una vista para jugador/observador | Aplicación | No envía manos ajenas; la interfaz no recibe datos para ocultarlos localmente. |
| Mostrar la mesa, temporizador estimado y botón de feedback | Interfaz | El servidor decide la hora límite y la aceptación. |

`Room` puede tener un modelo de aplicación que proteja sus propias transiciones sin convertirse por ello en regla de cartas. `Game` sigue siendo el agregado de la partida. La representación exacta de `Play`, `DeckSnapshot` y los contratos de mensajes se decidirá en los bloques que los necesiten, conforme a los pendientes expresos del dominio y la aplicación.

## 5. Contratos entre capas

Los puertos de aplicación representan capacidades: repositorio de salas/partidas, catálogo de barajas, reloj y programación de vencimientos, identidad, generación de códigos, aleatoriedad, emisión de vistas y registro técnico. Un puerto aparece cuando un caso de uso necesita esa capacidad; no se implementa un catálogo especulativo de interfaces vacías.

Las entradas de red y los archivos se validan al cruzar el borde de infraestructura. La aplicación vuelve a comprobar autorización y estado. El dominio comprueba sus invariantes aunque el mensaje externo estuviera bien formado. Los errores se traducen al exterior con códigos comprensibles, sin filtrar trazas ni información privada.

Cada petición o evento identifica la sala y el contexto vigente. Las acciones de una sala se aplican una vez y en orden coherente: un mensaje repetido o tardío no puede duplicar una carta, un timeout, el inicio ni el desempate. La identidad anónima viaja por credencial de sesión, no por el nombre visible. La reconexión obtiene una vista vigente y no reinicia plazos.

La interfaz no importa tipos internos solo porque estén escritos en TypeScript. Se definen contratos de transporte mínimos, con campos públicos o propios del destinatario. La validación estática de tipos no sustituye la validación de datos recibidos en ejecución.

## 6. Barajas y evolución

Los originales editables viven en `ASSETS/Barajas/<id>/`: el Gestor prepara directamente los JSON y recursos según el [contrato formato 1](../contratos/CONTRATO_BARAJAS_V1.md). Una copia aprobada y reproducible forma parte de `APP/karta3/barajas/`; aprobarla no activa su disponibilidad. B04 implementa la validación común, preparación y carga desde APP. No se exige CSV ni se mantienen fuentes editoriales divergentes. Los dos JSON completos permanecen internos. Resultados y límites en [B04](../sdd/BLOQUE_04_CARGA_BARAJAS.md).

| Responsabilidad B04 | Módulo y límite |
|---|---|
| Invariantes de Deck/Card | `domain/deck.ts`: definición en memoria, tres atributos declarados, 58 cartas y permutaciones. Sin ids específicos de formato ni IO. |
| Caso de uso y proyección | `application/deckCatalog.ts`: puerto de resúmenes y `ListDecks`, sin lector ni cartas públicas. |
| JSON y esquema | `infrastructure/decks/strictJson.ts`, `packageFormat.ts`, `readPackage.ts`: UTF-8/duplicados, propiedades, ids/orden fijos y versiones; delega las invariantes al único validador puro. |
| Recursos | `resources.ts`: escritura exacta, realpath contenido, extensión y decodificación completa con sharp. |
| Preparación e instantánea | `catalog.ts`: publicación, orden, escritura completa por renombrado, catálogo vigente; copia/freeze de definiciones y copias privadas de bytes de medios. No se recarga en consultas. |
| Transporte y composición | `http/expressApp.ts` consulta el caso de uso; `publicFiles.ts` sirve únicamente URLs registradas y bloquea rutas privadas; `composition/decks.ts` resuelve instalación/adaptadores y `main.ts` carga antes de escuchar. |
| Comando y cliente | `tools/decks.ts` solo argumentos/diagnóstico/salida; `src/api.ts` usa el contrato seguro. B05 añade el selector descrito debajo. |

Decodificación y formatos pertenecen a infraestructura; la publicación del conjunto se comprueba al preparar/cargar, sin introducir permisos de selección anticipados. La disponibilidad indeterminable bloquea; un borrador inválido con `false` fiable informa y se excluye. La genérica no tiene ninguna excepción de código.

Nuevas funciones, como cuentas, historial, importación pública de barajas o más procesos de servidor, exigirán revisar puertos y despliegue. No se introducen en el MVP solo para anticipar una evolución posible.

### Incremento B05

`Room` aplica un solo cambio, conserva id/versión/ficha juntos y decide plazas/orden. `RoomUseCases.configure` aplica vencimientos, autoriza, deduplica y consulta el puerto `PublishedDeckVersions`. No compara una revisión del navegador ni importa el catálogo concreto. `LoadedDeckCatalog` implementa ese puerto con resumen y definición validada de la misma versión, conservando la instantánea B04. Composición conecta explícitamente ambos puertos del mismo catálogo; `main` usa esa conexión tras cargar antes de escuchar.

`configurationInput.ts` decodifica tipos/forma/ids externos; `socketRooms.ts` invoca el caso de uso y publica mediante las piezas B03. Ni transporte ni catálogo deciden participación/capacidad. Las nuevas propiedades de `shared/contracts` son públicas, sin definiciones/cartas. `RoomConfiguration`, su hook y reducer mantienen presentación/peticiones por control; `socket.ts` usa envío volátil sin cola ni espera de reconexión. El cliente no decide una plaza ni un cierre. Las fixtures, interceptores de ack y avances de reloj viven únicamente en pruebas. No se cambia el validador de dominio ni la herramienta B04.

### Incremento de inicio y mesa inicial — B06

| Pieza concreta | Responsabilidad y dependencia |
|---|---|
| `server/domain/game.ts` | Valida con `validateDeck`; comprueba jugadores/permutación y construye adquisición, indicador y ronda inicial. Reparto circular: una carta por jugador en tres vueltas de orden base. Instantánea profunda inmutable; puntuación derivada de pilas ganadas vacías. No IO, Node, contratos de red ni futuras acciones vacías. |
| `Room` y `RoomUseCases.start` | Sala conserva asociación a un Game, preparación y presencia. Caso de uso aplica vencimientos, autoriza cookie ya autenticada, consulta versión exacta, consume entropía, fija estado y registra aceptación antes de publicar. Decisión/escritura síncronas, sin `await`; mismo orden de procesamiento que las demás acciones. |
| `PublishedGameDecks`, `GameDeckSnapshot` y `CardPermutation` | Puertos de aplicación usados realmente. Definición validada más presentación conserva `imageAlt` separado del Card de dominio; permutación de IDs explícita. No se releen archivos al iniciar. |
| `LoadedDeckCatalog` y `infrastructure/cardPermutation.ts` | Catálogo implementa también definición/presentación de la misma versión ya cargada. Fisher–Yates con `node:crypto.randomInt` entrega una permutación; el dominio decide reparto. Composición conecta ambos puertos, identidad y coordinación. |
| `RoomCoordinator` / `WaitingLifecycle` | Coordinación por fase; B03 sigue exclusivo de WAITING. Confirmar cancela tareas/generaciones de espera, conserva índices y publica por sesión. IN_GAME solo cambia presencia primera/última conexión, sin plazos; dispose invalida nuevos hechos y tareas. No contiene reglas de cartas. |
| `roomView.ts` / `initialGameView.ts` | Unión WAITING/IN_GAME y proyección explícita por destinatario. Solo indicador y mano propia; observador sin mano. Copias seguras, sin serializar Game, mazo ni paquete completo. |
| Memoria y transportes existentes | Repositorio admite WAITING/IN_GAME con identidad inmutable e índices retenidos. Socket.IO autentica/decodifica `room:start` y entrega ack/eventos seguros; no baraja ni modifica Game. HTTP existente recupera por sesión y bloquea preparación por fase. Fallos técnicos no registran objetos privados. |
| `useRoomFlow`, `useStartRoom` / `StartRoomControl` | Transporte y estado de presentación; confirmación incierta exige recuperación antes de reintentar con el mismo ID. Envío volátil sin cola/reenvío al reconectar. Descarta espera atrasada y limpia mesa al recuperar ausencia autorizada. |
| `GameScreen`, `GameCard`, `CardDetails` | Presentación a partir de contratos: jugadores/observador, indicador, mano horizontal, valores/Detalles y estado inicial. Dialog nativo con foco/cierre; actualizaciones de presencia no reconstruyen mano/detalles. No cartas del servidor importadas ni barajado/reglas en React. |

Decisiones de la entrega B06: no repositorio separado de Game, una asociación por sala; no políticas futuras por anticipado. INITIAL_TABLE_ONLY describía su capacidad temporal, no una fase de dominio. B07 la sustituye por MANUAL_WITHOUT_TURN_TIMEOUT en el contrato de transporte. Los registros/evidencias B06 conservan su contexto histórico.

### Incremento de partida manual y resultados — B07

| Pieza concreta | Responsabilidad y comprobación |
|---|---|
| `domain/game.ts` | `play` valida actor/carta/dirección y devuelve un sucesor congelado; resuelve por `playValue`, transfiere cartas/puntos y decide próximo abridor. `advance` prepara reposición/final/desempate o fin sin consultar tiempo/IO. Clasificación y conservación de 58 ubicaciones pertenecen al agregado. `manualGame.test.ts` recorre 2–5 y trazas alcanzables de empate. |
| `application/Room` | Conserva asociación Game, preparación/presentación inmutables, parcial privada, referencia de revisión/retención y roster original. `activeSessions` excluye sesiones que volvieron al inicio, sin quitar permisos/nombres del resultado. No compara valores de cartas ni mide reloj real. |
| `application/gameCoordinator.ts` | Autoriza/deduplica con Game/ronda/turnId, registra antes de emitir, publica por sesión, coordina revisión y retención usando Clock/Scheduler. Revisión cero publica resuelta/evento antes de un avance acotado. Tareas capturan contexto y se invalidan; igualdad temporal vence antes de lectura/acción. Resultados/retorno no vuelven a vincular; sin turnos automáticos. Pruebas de aplicación cubren callbacks/emisión/contexto/expiración y otra sala. |
| `RoomUseCases` / `RoomCoordinator` | Integran coordinación por fase con recorridos previos. WaitingLifecycle sigue exclusivo de WAITING; IN_GAME solo actualiza presencia primera/última conexión, sin retirada. RESULTS no muta presencia. El procesamiento síncrono en un proceso aplica decisión/escritura/dedupe sin await antes de emitir. |
| `initialGameView.ts` / `resultsView.ts` | Proyecciones explícitas por destinatario. El nombre del primer módulo se conserva desde B06, ahora cubre todas las rondas: mano propia, indicador/jugadas públicas, parcial solo propia y revisión. RESULTS omite Game/cartas/presencia. No serializan agregados. Pruebas inspeccionan claves y contenido exactos de HTTP/ack/eventos reales, no solo UI. |
| `ports.ts` | Reutiliza CardPermutation/Clock/Scheduler/RoomRepository/RoomRequests; añade emisión pública de ronda, retorno por sesión y diagnóstico técnico fijo en GameChanges. `removeRoom` limpia dedupe al expirar. No puerto especulativo para una función futura. |
| Memoria | MemoryRoomRepository distingue salas retenidas de asociación activa, mantiene código e identidad inmutables y compara ID antes de borrar índices. MemoryRoomRequests conserva resultado mínimo de solicitud, nunca manos/vistas. Expirar una sala anterior no borra otra ni catálogo/medios compartidos. |
| `gameInput.ts`, `socketRooms.ts`, `http/expressApp.ts` | Decodificación exacta, autenticación de cookie/socket, casos de uso, ack y emisiones por sesión. GET de resultado autorizado/no-store. No reglas, barajado/reparto, avance público, semillas ni objetos privados en registros. Integración con conexiones Socket.IO reales y reloj sustituido. |
| `composition/createApp.ts` | Conecta un GameCoordinator con memoria, catálogo/instantánea, entropía real, reloj y tareas cancelables existentes. `dispose` invalida callbacks. No lee ASSETS ni reconstruye baraja al jugar; instalación compilada autónoma usa guard de acceso externo en pruebas. |
| `useGameActions`, `socket.ts`, `useRoomFlow` | Carta parcial local/contextual, gesto explícito volátil, incertidumbre/recuperación antes de reintento del mismo ID. Sin cola ni envío por F5/reconexión/eventos. Separan resultado consultado de sala activa; filtros de ID/fase/revisión impiden respuestas antiguas. |
| `GameScreen`, `GameCard`, `CardDetails`, `RoundReview`, `ResultsScreen`, `LastResultLink` | Presentación segura, elección/pending, jugadas/mano variable, revisión y clasificación. Solo revisión tiene cuenta atrás estimada; React no decide un vencimiento ni resultado. Detalles/foco/scroll y recursos B06 se reutilizan. El enlace público propio se oculta al vencer sin renovar. |

Las pruebas deterministas generan paquetes/permutaciones completos validados y secuencias legales de jugadas, sin asignar puntos ni saltar el motor. Reloj, interceptores y control de entropía viven en `tests/support`, sin endpoints del producto. Los límites temporales de turno/ausencia/vigilancia siguen pendientes. TFM y el ejemplo erróneo §24.2 no se editan aquí; se entregan conclusiones a sus responsables. C09–C10 siguen parciales.

### Incremento de temporización y automático — B08

B08 sustituye el alcance temporal B07 `MANUAL_WITHOUT_TURN_TIMEOUT` por `TIMED_TURNS`. Las descripciones B06/B07 anteriores registran sus entregas; actualmente se aplica la coordinación siguiente. No cambia WAITING, barajas, configuración, identidad, orden, revisión ni retención; no implementa bots o vigilancia de dos minutos.

| Pieza concreta | Responsabilidad y dependencia |
|---|---|
| `domain/autoPlay.ts` / `domain/game.ts` | Política pura sobre mano en adquisición y atributo activo: más antigua/dirección desfavorable, o parcial aceptada al vencer. Game valida y produce sucesores inmutables, decide modo/contador/control irreversible y motivo del resultado. Manual completa válida resetea; TIMEOUT 2 convierte; AUTOMATIC conserva 2. La condición de inactividad usa roster base, no solo empatados. Termina ronda/puntos sin reposición; desempate ya iniciado termina sin puntos adicionales. Sin reloj/IO/contratos de red. |
| `application/Room` | Un registro de plazo vigente (contexto, generación, inicio/límite monotónicos y Unix públicos), junto a los registros existentes de revisión/retención. Conserva el mismo registro mientras no avance efectivamente el turno; aplicar Game invalida parcial/plazo/generación. No mide tiempo real ni elige cartas. |
| `application/GameCoordinator` | Único mapa de tareas cancelables reutilizado para turno/automático/revisión/resultado. Activa antes de publicar/confirmar inicio o jugada; compara monotónico antes de acciones/lecturas/replays y revalida callback/contexto/generación/objeto de tarea. Callback temprano reprograma; retrasado vence solo el turno pendiente y activa duración completa desde ahora. Automático ejecuta un movimiento por continuación programada, cede con Scheduler y para en humano/revisión/resultado; cada preparación ejecuta a lo sumo un paso por sala. Revisión cero publica estado/resultado de ronda/eventos antes de avanzar. Estado/tareas/dedupe se registran antes de emisión; fallos no repiten operaciones. |
| `RoomUseCases` / `RoomCoordinator` | Inicio conecta `GameActions.started` internamente; no se expone como acción de transporte. GameCoordinator procesa las acciones de juego sin una lectura previa que perdiese el contexto de vencimiento. B03 permanece exclusivo de WAITING. Presencia de IN_GAME solo cambia primera/última conexión, sin reservar/cerrar/retirar. |
| Proyecciones y `shared/contracts` | Campos explícitos seguros: Unix público, estado de control público, contador solo propio, modos de cartas ya públicas, motivo de resultado. Parcial solo del abridor ACTIVE. Evento de vencimiento contiene contexto público y flag de conversión, sin mano, carta oculta o contador privado. RESULTS mantiene su forma B07, extendiendo solo motivo/flag. |
| `ports`, tiempo y transportes | Se reutilizan Clock/Scheduler, memoria y GameChanges; este último añade emisión de vencimiento. SystemClock/TimerScheduler existentes siguen implementando medición monotónica/cancelación. Socket.IO autentica/decodifica contratos exactos B07, invoca y emite por destinatario; HTTP conserva no-store. No hay endpoint/flag de timeout/automático/reloj ni reglas de cartas en infraestructura. |
| Composición | Un GameCoordinator, reloj/planificador y conexión de entropía existentes; `dispose` invalida todas las tareas. No sistema temporal paralelo, nuevos adaptadores vacíos ni dependencia de ASSETS. |
| `useServerCountdown`, `GameScreen`, `useGameActions` | Estimación con `performance.now()` y referencia pública, mm:ss sin anunciar ticks. Cero bloquea gestos y recupera mediante lectura, nunca produce jugada. Selección/pending se contextualizan también por control; automático conserva mano/Detalles sin acciones. Ticks no desplazan foco/scroll. |
| `useRoomFlow` / `ResultsScreen` | Aviso de timeout deduplicado durante cinco segundos con sufijos; timer separado del aviso de ganador para conservar ambos. Advertencia propia recuperable y marca pública automática distinta de presencia. Resultado por inactividad inequívoco, manteniendo clasificación/retorno. Filtros de sala/fase/revisión impiden reinstalar confirmaciones antiguas. |

Comprobación por reglas puras, aplicación con tiempo controlado sin ejecutar callbacks, conexiones HTTP/Socket.IO reales y navegador compilado; ensayo aparte con SystemClock/TimerScheduler/entropía normales y transporte activo cerrado durante 15 s. Fixtures completas y trazas legales 2–5 conservan 58 ubicaciones; desempate incluye manos 1/2/3 y ACTIVE fuera del roster reducido. Las sustituciones e interceptores siguen exclusivamente en pruebas. Control de imports/ciclos complementado con revisión semántica de políticas, registro antes de emisión, pasos acotados, privacidad y continuidad entre salas; evidencia en [B08 §11](../sdd/BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md).

La descripción general TFM y la errata §24.2 corresponden a sus responsables; no se editan desde esta entrega. C09–C10 continúan parciales: no acreditan comprensión con usuarios, equilibrio o dispositivos físicos.

<a id="incremento-de-bots-fácilnormal--b09"></a>

### Incremento de bots Fácil/Difícil — B09 y T02

B09 amplía preparación/ejecución B01–B08 con jugadores HUMAN/BOT discriminados. T02 alinea EASY/Fácil y HARD/Difícil; HARD es el predeterminado y conserva exactamente la política antes llamada NORMAL. NORMAL se rechaza sin alias; el algoritmo avanzado y otros niveles no están implementados. Los cierres B09 y del ajuste visual conservan su histórico. La descripción B08 anterior es histórica; actualmente las continuaciones comparten el mismo coordinador/planificador. Sin servicios de IA, registro anticipado, adaptadores nuevos o temporizador paralelo.

| Pieza concreta | Responsabilidad y comprobación |
|---|---|
| `domain/botPlay.ts` | EASY/HARD puras y sin memoria, sobre mano propia en adquisición, atributo/dirección/apertura/dificultad. No recibe Game, cartas rivales ni mazo. EASY abre antigua favorable y no abre segunda mejor; HARD extrema distancia 0/59 con empate HIGH, o mejor oficial. Separada de autoPlay. Pruebas de extremos/empates/manos 1–3/información irrelevante y 324 decisiones capturadas de la base anterior. |
| `domain/game.ts` | PlayerPreparation/InitialPlayer discriminan HUMAN (status/contador) y BOT (dificultad), sin campos humanos de bot en ejecución. Valida kind/nivel y aplica botPlay con modo BOT exclusivo. Misma conservación/puntos/orden/final/desempate; inactividad filtra solo HUMAN del roster base, aunque esté fuera de desempate reducido. Trazas legales con políticas reales, sin asignación de puntos. |
| `application/room.ts` | Lista única de incorporación de invitados humanos/bots, host jugador último/observador aparte; capacidad cuenta reservas humanas. BotNumber creciente por incorporación aceptada, ID/nombre/nivel sin presencia/sesión. Gestiones efectivas renuevan espera, no reservas. startPlayers exige humano jugador y conexiones solo humanas; beginGame fija kind/niveles/orden. activateTurn solo HUMAN ACTIVE. |
| `RoomUseCases` / `ports.ts` | Una operación bot discriminada para cuatro casos: vencimientos, identidad/host/fase/objetivo/capacidad, transición y registro síncronos. RoomRequests conserva tipo/firma/botId mínimo y replay proyecta al host actual, nunca al bot. Guarda antes de emitir; retirada publica BOT_REMOVED con nombre/sufijo anterior, sin room:left. No nuevo puerto o adaptador. |
| `GameCoordinator` | machineStep reutiliza mapa/tareas/contexto/generación B08: BOT llama botPlay, HUMAN AUTOMATIC llama automaticPlay. Un movimiento por paso, cede a Scheduler, para en humano/revisión/resultado. BOT sin deadline/timeout. Revisión cero comunica antes de avanzar; positiva conserva límite. Pérdida de emisión no repite transición. |
| `WaitingLifecycle`, repositorio/proyecciones | Presencia, cierres, asociaciones/índices y destinatarios solo HUMAN. Proyecciones explícitas kind/botDifficulty, bot role/presence/playStatus null y score; participante autenticado siempre HUMAN. Solo mano propia humana, observador sin mano, ningún contador privado ajeno. Resultado/retención/retorno siguen B07. |
| `infrastructure/botInput.ts` / `socketRooms` | Decodificación estricta de cuatro eventos, claves requeridas/exactas, IDs/tipos/nivel; cookie/autenticación existentes. Invoca aplicación y entrega ack seguro con botId. Sin decisiones de estrategia/plazas/numeración en transporte ni endpoint de actuación BOT. |
| Composición | Sin piezas nuevas: conecta los puertos/adaptadores existentes; una memoria, catálogo validado/instantánea, GameCoordinator, entropía y Clock/Scheduler por proceso. Genérica/ASSETS no cambian. |
| `WaitingPlayers` / `useBotActions` / `participantNames` | Controles explícitos/dialog accesible y sufijos comunes. Pending por operación/bot/campo, payload inmutable, recuperación antes de confirmación explícita del mismo ID, sin cola ni reenvío. Error corregible conserva borrador; remoto no lo borra. WaitingScreen usa key por sala para invalidar contexto anterior. |
| `GameScreen` / `ResultsScreen` / contratos | Reutilizan mesa/resultados con marcas Bot · Fácil/Difícil y valores EASY/HARD; sin gestión/control de bot al iniciar. TIMED_TURNS y modo BOT; timing/openingSelection null para bot. React muestra/envía, no decide cartas o resultado. |

Fixtures completas temporales y permutaciones reproducibles en tests/support: seeds 2/3/56/98 con 2/3/4/5 jugadores. Las pruebas invocan botPlay y solo gestos legales humanos; cubren desempate con manos 3/2/1, cinco a 10 y solo bots empatados con humano ACTIVE fuera. HTTP/Socket reales inspeccionan claves y cartas por destinatario; navegador usa compilación vigente, 360/390/1280 y dos sesiones/pestañas. Montajes controlados y pruebas con adaptadores normales se distinguen en [B09 §11](../sdd/BLOQUE_09_BOTS.md). Control automático de imports/ciclos más revisión semántica de información limitada, atomicidad, índices humanos, privacidad y coordinación única. C09–C10 continúan parciales; TFM se mantiene sin editar y se entrega actualización descriptiva a sus responsables.

## 7. Comprobaciones y cambio arquitectónico

T02 mantiene estos límites y las cuatro operaciones/acks B09. La captura `tests/fixtures/bot-policy-4917d96.json` pertenece solo a pruebas: esperaba EASY/NORMAL antes de editar, y `botPolicyAlignment.test.ts` compara decisiones congeladas con EASY/HARD sin otra política en producción. Validadores rechazan NORMAL/otros tipos/niveles; nombres como normalizeName/completedNormally y rondas/procesos normales se conservan. [T02](../sdd/BLOQUE_T02_ALINEACION_DIFICULTADES_BOTS.md) registra equivalencia, contrato y traslado a Arquitectura; no se editan fuentes generales TFM.

Para cada bloque acordado:

1. Relacionar sus criterios con las fuentes vigentes y señalar si cambia una regla general.
2. Implementar en la zona responsable y comprobar que sus dependencias tienen la dirección permitida.
3. Probar dominio de forma pura, casos de uso con puertos sustitutos, adaptadores con integración y recorridos visibles cuando correspondan.
4. Ejecutar `npm run check` y las comprobaciones adicionales del bloque; registrar resultados reales.
5. Documentar cualquier desviación arquitectónica deliberada: motivo, alcance, alternativa y tarea de corrección si es temporal. No declarar que la arquitectura está completa por haber creado carpetas.

`npm run check:architecture`, integrado en `npm run check`, revisa imports de valor y tipo, reexportaciones, aliases y ciclos entre módulos de producción y comandos de la raíz de `tools/`. Estos comandos solo importan módulos locales de composición; las fixtures anidadas se revisan como proyectos de prueba. Sus cuatro casos negativos se ejecutan con `npm test`. El control sintáctico se complementa con revisión de responsabilidades: no demostraría por sí solo que un adaptador haya dejado de decidir permisos o nombres. B04 conserva las reglas de capas y amplía su control a la herramienta.
