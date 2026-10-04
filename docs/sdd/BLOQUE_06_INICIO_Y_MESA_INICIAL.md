# B06 — Inicio de partida y mesa inicial con humanos

**Estado:** acordado, implementado y verificado localmente el 04/10/2026 para B06-01–18; mesa inicial sin ejecución de turnos. Evidencia nueva y límites en §10.
**Fecha y responsable del acuerdo:** 03/10/2026, Adrian, mediante el diálogo SDD y la adopción de los bocetos.\
**Tipo:** incremento funcional local; entrega una mesa inicial recuperable, todavía sin ejecución de turnos.

## 1. Punto de partida y referencias

Preparación documental sobre `main`, HEAD `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`, versión de aplicación `0.1.0`; árbol limpio antes de preparar estos documentos. B01–B05, T01 y activación de genérica están integrados. La ejecución normal contiene `generica`, formato 1/contenido 2, disponible, con imágenes nulas. No se modifica ni se autoselecciona.

Fuentes normativas consultadas:

- [AGENTS](../../AGENTS.md), [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), [proceso](PROCESO_SDD.md) y [plantilla](PLANTILLA_BLOQUE.md).
- [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md), §§5–10, 17, 20 y 25: cartas, adquisición, orden base, inicio, ronda e invariantes.
- [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§3–7, 11–13 y 15: permisos, preparación, inicio, privacidad y ausencias.
- [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §§5–9: sesiones, procesamiento, tiempos, memoria y barajas.
- [Contexto de desarrollo](../../../../TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md), §9: B06 parcial, diálogo visual y separación del ciclo de espera.
- [B01](BLOQUE_01_CREACION_SALA.md), [T01](BLOQUE_T01_REFACTOR_CREACION_SALA.md), [B02](BLOQUE_02_ENTRADA_SALA.md), [B03](BLOQUE_03_CICLO_VIDA_ESPERA.md), [B04](BLOQUE_04_CARGA_BARAJAS.md), [B05](BLOQUE_05_CONFIGURACION_SALA.md), [activación](ACTIVACION_GENERICA_V2.md) y [contrato de barajas V1](../contratos/CONTRATO_BARAJAS_V1.md).

Los cierres anteriores acreditan sus respectivas versiones y recorridos. No son pruebas ejecutadas de B06; durante esta preparación no se ejecutan pruebas del producto.

## 2. Objetivo y alcance acordado

El anfitrión inicia una única partida desde la espera. De dos a cinco humanos jugadores y, cuando corresponda, el anfitrión observador reciben la misma mesa pública y únicamente la información privada autorizada. Recargar recupera exactamente ese reparto.

**Incluye:** condiciones de inicio, fijación de preparación, barajado en servidor, tres cartas por jugador, abridor/indicador/atributo inicial, puntuaciones cero, presentación sencilla móvil/escritorio, sincronización y recuperación. No exige llenar cinco plazas ni introducir marcas de «listo».

**Fuera:** ejecución de turnos, elección ALTO/BAJO, envío de cartas, resolución, reposición, plazos de juego, automático, revisión de ronda ejecutada, resultados, desempate ejecutado, bots, expulsión, CSV, contenido editorial, despliegue y diseño definitivo. No se crean controles ni políticas vacíos para esas funciones.

Se conservan códigos de seis cifras, nombres y sufijos de presentación, identidad por sesión, preparación B05 y recorridos B01–B04 **mientras la sala está en espera**. Tras iniciar se aplica el bloqueo de preparación descrito aquí, no sus acciones de salida o cierre. Las opciones de tiempos/desempate se fijan como datos; B06 no las ejecuta.

## 3. Recorrido y presentación

### 3.1 Inicio desde la espera

Solo el anfitrión ve «Iniciar partida». Permanece deshabilitado, con el motivo visible, si faltan baraja, dos jugadores o presencia de algún participante. El anfitrión observador no cuenta como jugador. También se impide el envío desde esa pestaña mientras tenga cambios propios de preparación pendientes de confirmar o esté sin conexión. Esta ayuda no sustituye las comprobaciones del servidor.

Al pulsarlo: «Iniciando partida…», sin doble envío ni reparto optimista. Un rechazo conserva la espera y sus valores aceptados, mostrando el error accesible. Si falta confirmación, se informa de la incertidumbre y se recupera la vista; un reintento del mismo envío conserva su `requestId`. Nunca se inicia automáticamente al recargar, reconectar o recuperar una petición pendiente.

Al aceptar el servidor, todos los participantes pasan a la mesa; una pestaña recuperada posteriormente llega a la misma partida. Se retiran los controles de configuración, nombre, entrada, salida y cierre propios de la espera.

### 3.2 Referencias visuales adoptadas

Copias exactas de las imágenes aportadas por el autor: [escritorio/abridor](referencias/b06/escritorio-abridor.png), [escritorio/jugador](referencias/b06/escritorio-jugador.png) y [móvil compacto](referencias/b06/movil-compacto.png). Son referencias de composición, no imágenes del producto ni pruebas de B06. Sus ejemplos de cartas, nombres, jugadas, dirección y reloj ilustran situaciones futuras; no fijan datos del reparto.

| Elemento | Escritorio | Móvil |
|---|---|---|
| Cabecera | Nombre y versión de baraja; ronda y cartas restantes del mazo de robo. | Cabecera compacta y resumen próximo a jugadores. |
| Jugadores | Lista lateral en orden base, numeración, nombre, «(tú)», marca de anfitrión/abridor y puntuación. | Lista compacta con el mismo orden y marcas legibles. |
| Observador | Línea aparte «Anfitrión · Observador», sin número ni puntuación de jugador. | Igual, fuera de la lista numerada. |
| Cartas jugadas | Zona superior amplia: «Aún no hay cartas jugadas». | Sección propia con ese estado vacío. |
| Indicadora | Carta completa en zona lateral inferior. | Fila compacta con nombre, atributo indicador y «Detalles». |
| Mano propia | Tres cartas en fila, en orden de adquisición. | Fila con desplazamiento horizontal contenido y pista «Desliza» si hay desbordamiento. |
| Estado inicial | Panel con abridor, atributo activo y estado de ejecución. | Resumen compacto equivalente, sin temporizador. |

Texto persistente para todos: **«Mesa inicial preparada. La ejecución de turnos todavía no está disponible.»** Se identifica «Abridor: [nombre]», incluido «(tú)» cuando proceda, y la dirección como «Sin elegir». No se muestra un turno ejecutándose, reloj parado, botones ALTO/BAJO, cartas seleccionables para jugar ni acciones de envío desactivadas que parezcan operativas.

La lista no incorpora un contador de cartas por jugador. Las puntuaciones empiezan y permanecen en cero en B06. El observador ve la misma mesa pública con «Observando»; no recibe ni muestra sección de mano privada.

### 3.3 Información de cartas y accesibilidad

Las cartas completas muestran nombre, imagen o icono neutro y las tres filas de atributos con nombre/símbolo, **«Jugable»** (`playValue`) y **«Dato»** (`displayValue` y su `unit`). Se mantienen ambas columnas incluso si coinciden. La unidad se toma de cada valor, sin heredar ni convertir la unidad de la definición. Los nombres de atributos proceden de la baraja; no se codifica una temática ni el reparto editorial de indicadores.

Se destaca la fila del **atributo activo de la ronda**. La indicadora identifica además el atributo que establece; el `roundAttribute` de las cartas de la mano no cambia la comparación activa. «Detalles» permite consultar nombre, característica, nota, imagen/texto alternativo y los tres valores sin omitir los textos que no caben en la carta. En móvil permite consultar la indicadora completa. Campos informativos vacíos no producen bloques vacíos; no se inventa contenido.

Con `imageUrl: null`, icono neutro decorativo; no se solicita un archivo de sustitución. Con URL no nula se conserva su texto alternativo validado. Un fallo de carga muestra icono y «No se pudo cargar la imagen», sin reescribir la referencia ni declarar válido un recurso incorrecto.

Los bocetos orientan la distribución, sin exigir copia exacta de medidas o colores. A 360/390 px y escritorio de 1280 px todos los elementos son accesibles sin desbordamiento de la página; solo la fila de mano puede desplazarse horizontalmente. No se reduce el texto hasta hacerlo ilegible. Símbolos/etiquetas acompañan el color; si se usan Círculo/Triángulo/Cuadrado se conserva esa correspondencia. Detalles funciona por teclado y tacto, tiene título y cierre accesibles y devuelve el foco al disparador. Las actualizaciones de presencia no reinician el desplazamiento ni cierran Detalles. La transición a mesa mueve el foco a su título una sola vez.

## 4. Estado del servidor y ciclo de vida

### 4.1 Inicio atómico

El caso de uso aplica primero los vencimientos **de espera** debidos, incluso si sus callbacks se retrasaron. En el instante exacto prevalece vencer. Después autoriza al anfitrión y comprueba sala vigente, de dos a cinco humanos jugadores, todos los miembros conectados —también anfitrión observador— y baraja/configuración aceptadas. Consulta la pareja exacta id/contenido disponible y validada del catálogo cargado; no acepta una definición del navegador ni cambia de versión.

El dominio valida jugadores/baraja y crea el estado inicial conforme a dominio §9: barajado único de 58 cartas, adquisición de tres por jugador, resto del mazo, primer jugador del orden base como abridor, indicadora extraída y primera ronda con su atributo. Conservar la secuencia de adquisición no permite ordenar la mano por valor. El estado es `PLAYING`; ronda 1, `WAITING_FOR_DIRECTION`, dirección nula y ninguna jugada. `GameSettings.turnTimeout` recibe `settings.turnSeconds` y `forceTieBreak` conserva su valor; `reviewSeconds` pertenece a coordinación. No se añade una fase de dominio «pausa» o «demostración».

Una aceptación fija identidad, nombre, papel, orden y configuración, asocia un único `gameId` nuevo al mismo `roomId`/código y cambia la coordinación a `IN_GAME`. Los invitados conservan su orden; el anfitrión jugador sigue al final. El observador conserva identidad, autoridad de origen y presencia, pero no posee `Player` ni cartas.

La instantánea de definición/presentación de la versión queda inmutable para esa partida; el orden barajado y las manos son estado privado separado. No se muta la definición del catálogo. Cada carta ocupa una sola ubicación lógica (dominio §17); una referencia al indicador no es una segunda carta. Inicialmente: `3N` en manos, `57−3N` en mazo y una indicadora; pilas ganadas y jugadas vacías. Con 2/3/4/5 jugadores se muestran 51/48/45/42 cartas de robo.

La decisión/escritura es serializada por sala. Reunir/validar y construir no debe dejar una partida parcial ni una preparación bloqueada ante fallo. Si una capacidad se resuelve de forma asíncrona, se revalidan identidad, presencia, fase, configuración y vencimientos antes de confirmar. Persistir en memoria la aceptación y su deduplicación precede a publicar; perder una confirmación o fallar una emisión no repite el inicio.

### 4.2 Salida del ciclo B03

Al confirmar el inicio se cancelan/inutilizan aviso, caducidad y reservas de ausencia de espera de esa sala. Un callback antiguo, incluso ejecutado después de cancelarse, revalida fase/contexto y no puede cerrar, retirar, renombrar ni reabrir la mesa. La vista `IN_GAME` no contiene `lifecycle` de espera. Las otras salas siguen aplicando B03 normalmente.

En este incremento no se programan reloj de turno, revisión, resultado ni vigilancia de dos minutos sin progreso. El tiempo configurado se conserva, pero no empieza a contar. **Limitación acordada:** como B06 no puede ejecutar una jugada, su mesa se mantiene mientras exista el proceso, incluso más de 30 minutos o con todos desconectados. No constituye un modo de pausa del juego terminado.

Aplicación §6 paso 8 y §§9–12.1, e infraestructura §§7–8, siguen exigiendo para el MVP ejecución, ausencias/automático y cancelación técnica tras dos minutos sin progreso real. Se difieren hasta disponer de ejecución; el contexto §9 ya delimita B06 sin esas cancelaciones. No hay contradicción con el reparto o la mecánica: existe entrega parcial explícita. Coordinación debe recoger este acuerdo en el estado vigente y en la descripción de lo implementado de aplicación/infraestructura, conservando sus requisitos completos.

### 4.3 Presencia, recuperación y limpieza

Basta una conexión autorizada de cualquier pestaña de la sesión para mantener `CONNECTED`. Perder la última produce `DISCONNECTED` en la mesa, marca «Sin conexión» y aviso propio existente «Conexión interrumpida. Intentando recuperarla…». No inicia reserva de 30 segundos, libera plaza, cambia orden, modo humano, mano, abridor o puntuación. Se admite recuperación de la misma identidad sin límite temporal dentro de este proceso. Una lectura HTTP no acredita presencia; recuperar una conexión sí. Una reconexión efectiva puede reutilizar el aviso breve de cinco segundos B03, deduplicado por transición, sin añadir actividad de juego.

Recargar, abrir otra pestaña o volver a portada recupera la misma partida/mano, sin iniciar, barajar o repartir. Se mantienen los índices de código y sesión: una sesión vinculada no entra en otra sala ni crea otra. No se usa la eliminación de la espera para perder estas asociaciones.

**Limpieza para los ensayos B06:** reiniciar el servidor local elimina salas, partidas, sesiones, deduplicación y tareas del proceso. No hay botón ni endpoint de salir/cancelar/cerrar partida. Cerrar una pestaña o navegar fuera solo cambia presencia. Ni anfitrión ni invitado pueden retirar jugadores ya fijados; no se añade autoridad permanente para terminar partidas.

Tras el reinicio, recuperar devuelve ausencia de sala o sesión no vigente según el contrato existente. Se limpia la mesa/mano guardada en presentación y se vuelve al recorrido inicial con motivo genérico de no disponibilidad; no se inventa ganador ni causa de cierre conservada. El reinicio afecta también a las otras salas locales. Se explicará en README/instrucciones de prueba, sin añadir administración al producto.

## 5. Contratos mínimos

### 5.1 Operación y recuperación

Nuevo evento Socket.IO **`room:start`**, entrada exacta `{ requestId: string, roomId: string }`. Ambos identificadores cumplen la validación existente de identificadores de petición/sala (texto no vacío, hasta 100 caracteres). Campos extra, tipos incorrectos, IDs del cliente para participantes, tiempos, cartas, semillas o configuración se rechazan como `INVALID_INPUT`. La identidad procede de la cookie autenticada del socket.

Confirmación: `SocketAck<RoomResponse>` vigente; éxito `{ ok: true, room: InitialGameRoomView }`, error `{ ok: false, error: { code, message } }`. No se crea ruta HTTP de inicio.

Se conservan rutas y envolturas de `GET /api/rooms/current`, `GET /api/rooms/:id`, creación y `room:resume`; amplían `RoomView` por fase. La recuperación del anfitrión mediante crear de nuevo devuelve su mesa existente sin crear sala. Repetir `room:join` ya aceptado, o solicitar ese mismo código desde una sesión que ya es miembro, devuelve su mesa como recuperación sin incorporar ni renombrar. Un solicitante nuevo no puede incorporarse a una partida iniciada. `GET /api/decks` y medios públicos B04 no cambian.

`room:state` conserva su envoltura y entrega la vista vigente construida **por sesión destinataria**. Una revisión creciente cubre inicio y cambios de presencia; la recuperación/repetición sin cambio no la incrementa ni publica un inicio artificial. Las pestañas de una sesión reciben su misma mano; otras sesiones reciben únicamente la propia. No se emite un estado interno común con todas las manos a un canal de sala.

### 5.2 Vistas seguras por fase

`RoomView` pasa a ser unión discriminada por `status`:

- **`WAITING`:** contrato B05 intacto, incluidos presencia `CONNECTED | RECONNECTING`, configuración, ficha y `lifecycle` B03.
- **`IN_GAME`:** propiedades exactas siguientes; sin plazos de espera.

| Propiedad de `InitialGameRoomView` | Tipo y garantía |
|---|---|
| `id`, `code`, `revision` | Mismos identificadores y revisión de sala. Código sigue siendo texto de seis cifras. |
| `status` | Literal `IN_GAME`. |
| `participant`, `participants` | Miembro propio y lista completa fijada, con forma indicada abajo. Orden B05 conservado; la lista numerada filtra jugadores. |
| `settings` | `RoomSettings` B05 aceptadas e inmutables. |
| `selectedDeck` | `DeckSummary` B04 de ocho campos, no nula, versión exacta fijada. |
| `game` | Vista inicial descrita a continuación. |

Miembro de mesa: `{ id, name, role, isPlayer, presence, score }`; `id` y `name` son textos, `role: 'HOST' | 'GUEST'`, `isPlayer` booleano, `presence: 'CONNECTED' | 'DISCONNECTED'`; `score` es entero cero para jugador y `null` para observador. Identidad/nombre/papel se conservan. Los sufijos de nombres repetidos se calculan con el mismo criterio B02 y se muestran también al identificar al abridor; no son identidad ni cambian el nombre aceptado.

`game` contiene exactamente:

| Propiedad | Tipo y contenido B06 |
|---|---|
| `id` | ID de partida, distinto del de sala; común a todos los destinatarios. |
| `phase` | Literal `PLAYING`, reflejo del dominio. |
| `execution` | Literal `INITIAL_TABLE_ONLY`: capacidad del incremento indicada por aplicación, no nueva fase/regla de dominio. |
| `attributes` | Tres objetos `{ id, name, unit }` de la definición fijada, en orden declarado. |
| `round` | `{ number: 1, state: 'WAITING_FOR_DIRECTION', openerPlayerId, indicator, activeAttributeId, direction: null, plays: [] }`. `indicator` es `CardView`. |
| `drawPileCount` | Entero `57−3N`, sin IDs ni orden de cartas de robo. |
| `hand` | Tres `CardView` de la mano propia en adquisición; `[]` para observador. |

`CardView`: propiedades exactas `{ id, name, characteristic, imageUrl, imageAlt, values, roundAttribute, note }`. Textos/valores proceden de la carta validada; `values` mantiene los tres objetos `{ playValue, displayValue, unit }` del contrato. `imageUrl` es `null` o URL pública versionada B04 para ese recurso; nunca `imageRef`, ruta física o JSON completo. `imageAlt` se conserva de los datos validados, no se inventa ni se pierde al proyectar la definición de dominio.

No se entregan manos rivales ni sus valores, contador de cartas de otros jugadores, orden/IDs ocultos del mazo, definición completa, semilla, credenciales, sesiones ni sockets. Conocer el contenido editorial no autoriza conocer qué cartas recibió otra persona. Las vistas HTTP, confirmaciones y eventos cumplen la misma privacidad.

### 5.3 Errores, deduplicación y carreras

| Código | Caso y comportamiento |
|---|---|
| `SESSION_REQUIRED`, `FORBIDDEN` | Sesión no vigente; solicitante no miembro o no anfitrión para inicio. Nunca se devuelve mano ajena. |
| `ROOM_NOT_AVAILABLE`, `PARTICIPATION_ENDED` | Sala/participación no vigentes, incluido vencimiento aplicado antes de iniciar. Se conservan causas propias B03 cuando existen. |
| `START_NOT_READY` (nuevo) | Falta baraja, menos de dos/más de cinco jugadores o algún miembro sin conexión. Mensaje indica el motivo; sin cambios del inicio. |
| `DECK_NOT_AVAILABLE`, `DECK_VERSION_MISMATCH` | No existe pareja publicada/validada o la versión seleccionada no coincide. No se adopta otra baraja o versión. |
| `INVALID_DECK` (nuevo) | La definición recibida por el caso de uso no supera el validador puro; no se reparte. Los paquetes inválidos disponibles siguen bloqueándose al cargar por B04. |
| `GAME_ALREADY_STARTED` (nuevo) | Nueva entrada o acción de preparación —nombre, configurar, salir, cerrar— sobre `IN_GAME`. No se aplica ni renueva nada. |
| `INVALID_INPUT`, `REQUEST_CONFLICT` | Forma incorrecta; mismo `requestId` de la sesión reutilizado con otro tipo, sala o contenido. |
| `INTERNAL_ERROR` | Fallo técnico antes de confirmar, por ejemplo salida inválida del adaptador de aleatoriedad. Sin partida parcial ni información privada en mensaje/registro. |

Las nuevas acciones mantienen las envolturas vigentes. Para errores de fase en las rutas HTTP existentes, `GAME_ALREADY_STARTED` usa 409; se conservan sus otros códigos/status y las comprobaciones de origen/cookie. Un no autorizado recibe `FORBIDDEN` antes de obtener detalles de la partida. Un ID inexistente no habilita una búsqueda por identidad ajena.

Deduplicar por sesión, tipo, petición y contexto de sala; guardar resultado mínimo, nunca una vista privada para reutilizar entre sesiones. Mismo envío aceptado devuelve la vista propia **actual** de esa misma partida, sin otro barajado/reparto/revisión. Incluye repeticiones de entrada/configuración aceptadas antes de iniciar: recuperar no reaplica preparación ni restaura una vista antigua. Mismo envío rechazado conserva su error tras revalidar contexto; un nuevo intento deliberado usa ID nuevo. Una solicitud de inicio nueva del mismo anfitrión sobre su partida ya creada también devuelve esa mesa como éxito sin efecto; no crea otra partida. Un invitado sigue sin poder iniciar, aunque ya exista.

Entradas, salidas, presencia, nombres, configuración, cierre e inicio comparten el orden de procesamiento. Si otra acción de preparación se acepta primero, iniciar usa ese estado actualizado y vuelve a validar; si iniciar se acepta primero, la acción posterior queda bloqueada. Un cierre/vencimiento anterior impide iniciar. Dos pestañas del anfitrión iniciando simultáneamente producen un único `Game`. Un callback retrasado o una confirmación antigua `WAITING` no degrada `IN_GAME`; el cliente compara contexto/revisión. Un `room: null` autorizado tras pérdida del proceso sí limpia la mesa, aunque tuviera revisión anterior almacenada.

## 6. Responsabilidades, dependencias y autonomía

| Responsabilidad | Capa/pieza y dependencias | Comprobación prevista |
|---|---|---|
| Validar inicio, construir Game/primera ronda, conservar cartas/adquisición y puntuaciones | Dominio puro; reutiliza `validateDeck`, recibe definición, jugadores/configuración y una permutación explícita. Sin IO, reloj, Node, React, aplicación o contratos de red. | Pruebas puras con orden conocido, entradas inválidas y conservación de las 58 cartas. |
| Fase de sala, fijación de preparación, permisos, deduplicación, atomicidad y recuperación | Modelo/casos de uso de aplicación; dependen de dominio y puertos. Room conserva coordinación/asociación; Game gobierna cartas/ronda. | Casos de uso con puertos sustitutos, carreras y fallo antes/después de confirmar. |
| Proyección pública/propia, presencia de mesa y separación de espera | Aplicación y contratos seguros. Proyector por destinatario; coordinación de mesa separada de `WaitingLifecycle`. | Aserciones de forma/campos, privacidad y callbacks antiguos. |
| Obtener definición y presentación de versión exacta | Puerto real de aplicación; ampliar `PublishedDeckVersions` o añadir capacidad compatible del mismo catálogo. Devuelve instantánea validada y metadatos gráficos, no archivos. | Sustitutos inválidos/no disponibles/versiones; integración de catálogo cargado. |
| Aleatoriedad e identidad | Puertos de aplicación y adaptadores de infraestructura; entropía en servidor, ID único y permutación de IDs. El dominio comprueba que no falten/sobren/se repitan cartas; decide reparto/indicadora. | Orden sustituible en pruebas y adaptador real que produce permutación completa. |
| Memoria, índices y transporte | Infraestructura implementa almacenamiento `WAITING/IN_GAME`, autentica/decodifica y publica vistas. No baraja/reparte en el handler ni decide permisos o reglas. | Repositorio, HTTP/Socket.IO reales, múltiples sesiones/pestañas y pérdida de ack. |
| Conectar capacidades y desmontar runtime | Composición; elige adaptadores concretos y conserva montaje de pruebas sin endpoints públicos de control. | Arranque compilado y desmontaje/reinicio sin tareas ni índices residuales. |
| Mesa funcional adaptable | Cliente importa solo `shared/contracts`; componentes de jugador, carta, indicadora, mano y estado separan presentación de coordinación/transporte. | Navegador, teclado, móvil/escritorio y revisión de dependencias. |

Evitar concentrar la partida en `WaitingLifecycle` o trasladar allí reglas de cartas. Reutilizar repositorio/sesiones/publicación existentes adaptando su fase; no crear un repositorio adicional solo por nombrar `Game`. Si existe capacidad de almacenamiento separada realmente necesaria, su puerto pertenece a aplicación y su implementación a infraestructura. No importar `LoadedDeckCatalog` en un caso de uso.

La definición actual de dominio no conserva todo el metadato gráfico del JSON, en particular `imageAlt`: mantenerlo en la instantánea validada de presentación mediante el puerto. No releer `ASSETS` o archivos al iniciar/recuperar ni exponerlos para que el navegador componga la mano. Una partida conserva sus datos aunque se alteren archivos externos en ese proceso.

**Autonomía del implementador:** funciones/clases y nombres internos, representación privada de `Game`/instantánea, algoritmo de barajado con entropía del servidor, patrón de reparto compatible con adquisición, ubicación de pruebas, componentes/CSS y mecanismo accesible de Detalles. Registrar el patrón de reparto elegido; no fija una nueva regla editorial. No se requieren abstracciones de turnos/jugadas/bots todavía sin conducta. La flexibilidad consiste en separar estado, contrato y presentación, sin un sistema genérico de diseño.

Cambiar reglas, visibilidad, plazos, permisos, número de jugadores, reparto inicial o dirección de dependencias exige volver al ámbito responsable. **No quedan preguntas funcionales bloqueantes ni propuestas de pantalla sin resolver.**

## 7. Ejemplos y criterios de aceptación previstos

| Ejemplo | Dado / acción | Resultado |
|---|---|---|
| E1 | Invitado Ana y anfitrión Luis jugador; genérica 2 seleccionada; ambos conectados. Luis inicia. | Ana abre por orden base; tres cartas por mano, una indicadora, 51 en robo y cero puntos; misma partida en ambos navegadores. |
| E2 | Anfitrión observador y dos invitados conectados. Iniciar y recargar las tres sesiones. | Dos jugadores, 51 en robo; observador aparte y sin mano; cada jugador recupera sus cartas y orden. |
| E3 | Invitado pierde última conexión en espera; anfitrión inicia durante reserva. | Rechazo. Recuperar antes del margen permite un nuevo intento; llegar al vencimiento aplica B03 primero. |
| E4 | Inicio aceptado cerca de los 30 minutos; luego desconectan todos y avanza el tiempo. | Mesa se conserva, sin cierre de espera o automático. Recuperar devuelve mismo Game/reparto. |
| E5 | Dos pestañas del anfitrión inician; se pierde un ack y se repite. | Un Game, un barajado/reparto; ambas recuperan estado propio actual, sin duplicados. |
| E6 | Inicio se procesa antes de entrada nueva, nombre/configuración/salida/cierre tardíos. | Preparación fijada; acciones rechazadas sin alterar participantes o cartas. |
| E7 | Reiniciar servidor y recuperar las sesiones anteriores. | No se recupera esa mesa; no hay resultado ni motivo inventado; puede crearse nueva sala tras restablecer sesión. |

- [x] **B06-01 — Autorización:** solo anfitrión miembro inicia; invitado, tercero, sesión ausente/no vigente y suplantación de IDs no obtienen inicio ni información privada. Anfitrión observador también puede iniciar.
- [x] **B06-02 — Preparación:** probar 1/2/5 jugadores y más de 5 mediante sustituto; exigir 2–5 humanos y todos los miembros conectados, sin marcas de listo. Observador no cuenta ni obtiene cartas.
- [x] **B06-03 — Baraja exacta:** sin selección, ausente/no disponible, contenido antiguo/incorrecto o definición inválida rechazan sin reparto. Genérica normal formato 1/contenido 2 inicia; nunca cambia disponibilidad, contenido ni selección por defecto.
- [x] **B06-04 — Dominio:** con permutación conocida, verificar manos de tres, orden de adquisición, abridor primero, indicadora/atributo, ronda/dirección/jugadas iniciales y puntos derivados de pilas ganadas vacías.
- [x] **B06-05 — Conservación:** para 2–5 jugadores, las 58 cartas aparecen una vez en ubicaciones lógicas; mazo 51/48/45/42. Permutaciones incompletas, repetidas o ajenas fallan sin estado parcial; catálogo/instantánea no se mutan.
- [x] **B06-06 — Repetición/concurrencia:** mismo ID, ID nuevo, dos pestañas y pérdida de ack conservan un Game/reparto; reutilizar ID con otro contenido/tipo/contexto produce conflicto. Rechazos y repeticiones no crean revisiones/eventos artificiales.
- [x] **B06-07 — Carreras:** probar ambos órdenes de inicio con entrada, nombre, configuración, salida y cierre; fijar una preparación coherente. Fallo antes de confirmar permite seguir esperando; fallo de publicación posterior permite recuperar la partida aceptada.
- [x] **B06-08 — Límite temporal de espera:** antes, en y después de vencimientos debidos; vencer en igualdad gana, no se rescata una espera ya caducada. Un inicio aceptado invalida callbacks/avisos/reservas antiguos; otra sala continúa su B03.
- [x] **B06-09 — Bloqueo por fase:** `IN_GAME` rechaza nuevas entradas y cambios de preparación, incluida salida/cierre incluso del anfitrión. Mantiene códigos y asociaciones; la sesión no crea/entra en otra sala.
- [x] **B06-10 — Privacidad de transporte:** inspeccionar cuerpos HTTP, ack y eventos reales de dos jugadores y observador; contiene solo indicadora, mano propia o vacía e información pública. Sin manos rivales, datos ocultos de mazo, JSON completo, sesiones/semilla ni campos privados adicionales.
- [x] **B06-11 — Sincronización:** dos sesiones independientes y varias pestañas reciben transición y misma parte pública; revisiones/confirmaciones antiguas no vuelven a espera. No depender de recargar para ver el inicio.
- [x] **B06-12 — Recuperación:** F5, nueva pestaña y vuelta a portada recuperan mismo Game, manos/orden, indicador, configuración y abridor; cero llamadas adicionales de barajar/repartir/iniciar.
- [x] **B06-13 — Presencia de partida:** cerrar una pestaña con otra conectada mantiene presencia; perder todas marca ausencia y recuperar la elimina sin retirar cartas/jugador. Probar anfitrión jugador/observador y superar 30 segundos, 2 minutos y 30 minutos con tiempo controlado sin cierre de B06.
- [x] **B06-14 — Mesa:** ver 2/5 jugadores, nombres repetidos, self/abridor/anfitrión, observador separado, cero puntos, ronda, mazo, indicadora, activo y estado vacío. Sin contador público de mano, reloj/acciones de juego ni privilegio de cierre.
- [x] **B06-15 — Cartas y recursos:** Jugable/Dato siempre separados, unidad literal, atributo activo correcto aunque no sea `roundAttribute` de la mano; Detalles muestra textos. Genérica nula usa icono; fixture de imágenes reales conserva URL/alt y fallo de carga visible sin cambiar datos.
- [x] **B06-16 — Presentación:** 360/390/1280 px, teclado/tacto, filas de mano legibles/desplazables, Detalles/foco y avisos accesibles. Una actualización no pierde foco, desplazamiento ni detalle abierto.
- [x] **B06-17 — Limpieza:** reinicio real elimina Game/sala/autorizaciones/índices/tareas; cliente descarta mesa privada al recuperar ausencia/sesión nueva y permite empezar otra sala. No introduce endpoint de reinicio o final ficticio.
- [x] **B06-18 — Regresiones y arquitectura:** mantener E1–E7 B01, T01, B02–B05 y activación en espera; catálogo/medios/versiones/privacidad B04. Dependencias y responsabilidades de §6 comprobadas sin ciclos ni imports del servidor desde cliente.

## 8. Dependencias y plan de comprobación

Depende de la base integrada, sesiones y presencia B02/B03, configuración B05, catálogo validado B04 y genérica 2. No depende de turnos, bots ni diseño definitivo. Para imágenes reales/no disponibles/versión incorrecta usar paquetes de prueba separados; no cambiar JSON maestros o aprobados ni crear excepciones para genérica.

**Pruebas futuras:** dominio puro con aleatoriedad sustituida; casos de uso con puertos de catálogo/entropía/memoria/presencia y tiempo controlado; integración real HTTP/Socket.IO, cookies, ack, medios y arranque; navegador y revisión visual. Comprobar callbacks cancelados que aun así lleguen, además de avanzar el reloj.

Conservar casos existentes en `server/app.test.ts`, `server/application/*.test.ts`, `server/configurationSocket.test.ts`, repositorio/sesiones/paquetes/HTTP de infraestructura, `server/domain/deck.test.ts`, reducers/transporte de `src` y `tests/browser/{room,join,lifecycle,decks,configuration,activation}.spec.ts`. Adaptar montaje/aserciones por la nueva fase sin reducir garantías de espera. Añadir pruebas de Game, inicio, vista privada y mesa en el lugar responsable.

Ejecutar **`npm run check`** y **`npm run test:browser`**. La comprobación arquitectónica automática incluida en check se acompaña de revisión semántica: quién reparte, decide permisos, proyecta y cancela tareas; contar módulos no demuestra esto. La ejecución compilada normal usa APP sin acceso a ASSETS y puede seleccionar genérica 2 explícitamente.

**Evidencia diferenciada:** conexiones reales acreditan autorización, mensajes privados, presencia/sincronización y recarga; reloj sustituido acredita prioridades y supervivencia tras límites de B03/MVP. No atribuir media hora real a ese avance. Las pruebas con orden fijo acreditan reparto/conservación; una ejecución con aleatoriedad real acredita el adaptador, no demuestra equilibrio estadístico.

Recorrido manual previsto con dos navegadores/sesiones: crear, entrar, seleccionar genérica 2, iniciar, comparar parte pública/privada, recargar, abrir/cerrar otra pestaña, cortar/restaurar conexión y recuperar; repetir como observador con dos invitados en tres sesiones. Examinar móvil/escritorio y Detalles. Reiniciar servidor entre ensayos para obtener otra sala. Registrar entorno, versión, resultados y captura solo si aporta evidencia. No declarar prueba humana ni dispositivo físico por ejecución automatizada.

**C09–C10 parciales:** B06 podrá acreditar validación/versión disponible al iniciar, uso de la instantánea, imágenes/iconos de indicadora/mano y privacidad inicial. Conserva evidencia anterior de carga/catálogo/selección. Seguirán pendientes ejecución completa, cartas jugadas/resultados y validación de comprensión con usuarios; no acredita equilibrio ni completa estos criterios por mostrar una mesa.

## 9. Decisiones, cambios y devolución a coordinación

| Fecha | Decisión cerrada | Efecto |
|---|---|---|
| 03/10/2026 | Adoptar los tres bocetos como distribución funcional adaptable. Mantener Jugable/Dato y Detalles; indicador compacto y mano desplazable en móvil. | §3, B06-14–16; diseño definitivo posterior. |
| 03/10/2026 | Mesa inicial sin ejecución ni temporizadores; recuperación conserva su estado. | §4; requisitos completos de juego quedan futuros, no se alteran. |
| 03/10/2026 | Cancelar ensayos reiniciando servidor, sin facultad de cerrar partida para anfitrión. | §4.3, B06-17; explicar pérdida de todo el proceso local. |
| 03/10/2026 | No añadir contador de cartas por jugador. | Presentación/contrato; se conserva mano propia de tres y contador público de mazo. |

Devolver a coordinación: documento y [prompt de implementación](PROMPT_IMPLEMENTACION_BLOQUE_06.md), referencias visuales, base `main 4dd073d`, inicio/contratos/privacidad, ausencia temporal de ejecución y vigilancia, limpieza por reinicio y partes de C09–C10 pendientes. El encargo de implementación autoriza expresamente actualizar las descripciones de B06 en contexto/aplicación/infraestructura; actualización local registrada en §10.6, conservando requisitos del MVP e históricos. Los requisitos de tiempos/ausencias del juego se retomarán en su incremento de ejecución, sin abrirlo aquí.

## 10. Comprobación y cierre

**Base comprobada antes de implementar — 04/10/2026:** `main`, HEAD efectivo `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`, aplicación 0.1.0. Únicos cambios locales: proceso y documentos/referencias preparados de B06; conservados. Nueva rama `feat/b06-inicio-mesa-inicial` desde ese main, sin restauraciones. `npm run check`: salida 0; tipos/lint/build correctos, 197/197 pruebas en 21 archivos (27,39 s), 41 módulos sin imports prohibidos ni ciclos. Catálogo normal generado con genérica formato 1/contenido 2 disponible. Esta ejecución acredita la base, no B06; navegador final pendiente. Entorno inicial: Windows, Node 24.13.0, npm 11.6.2.

**Preparación documental:** lecturas de fuentes/código/contratos y estado Git; copias de bocetos comprobadas por igualdad SHA-256; 35 enlaces locales existentes y 18 identificadores de aceptación únicos entre especificación, prompt y proceso. Las huellas de los JSON de genérica en APP siguen coincidiendo con las aprobadas en activación. Contrato, ejemplos y plan son especificación, no resultados del producto.\
Estas observaciones de preparación no acreditaban implementación. La evidencia nueva ejecutada se registra a continuación; no sobrescribe cierres B01–B05/T01/activación.

### 10.1 Versión, entorno y comandos realmente ejecutados

Preparación conservada en `14ff894`; código, pruebas, README y mapa de responsabilidades en **`91238fd1c5a857b8a4d46b36a18499f734937f9d`**. Rama `feat/b06-inicio-mesa-inicial`, desde main efectivo `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`, sin restauración ni cambios ajenos descartados. Aplicación 0.1.0. Los commits son locales; no push/PR/integración/despliegue en este encargo.

04/10/2026, Windows NT 10.0.26300.0, PowerShell, Node 24.13.0, npm 11.6.2, TypeScript 6.0.3, Vitest 5.0.2, Playwright 1.63.0, Chrome **154.0.8037.93** sin interfaz gráfica. Comandos desde `E:\KARTA3\KARTA3_IA\APP\karta3`. Viewports 360×844, 390×844 y 1280×844; observador/invitado adicional también 1280×800. Pantallas pequeñas con emulación de tacto de Chrome, sin dispositivos físicos.

| Ejecución nueva | Resultado |
|---|---|
| `npm run check` sobre los mismos bytes del commit de código | **Salida 0.** Tipos/lint/build; **249/249 pruebas en 24 archivos**, última ejecución 12:02:58, 11,48 s. Incluye 197 regresiones de la base y 52 comprobaciones nuevas (15 Game, 28 aplicación, 8 integración de inicio, 1 estado cliente). |
| Control de arquitectura incluido en check | **50 módulos**, sin imports prohibidos ni ciclos; cuatro negativos del control conservados en Vitest. Revisión semántica adicional en §10.4. |
| Detener instancia anterior y `npm run start` después de compilar | Instancia normal vigente en **127.0.0.1:3000**, genérica válida/disponible y un resumen. Reinicio real: salas/sesiones anteriores descartadas; pruebas con esperas nuevas. |
| `npm run test:browser -- --workers=2` | **Salida 0, 47/47 recorridos, 1,7 min.** Compila primero; 35 regresiones y 12 recorridos B06. Normal usa main compilado/entropía real; montajes de fixtures importan únicamente módulos compilados actuales. |
| `npx playwright test tests/browser/initialGame.spec.ts --grep 'reinicio real' --workers=1` | Ensayo seleccionado adicional, **1/1, 7,1 s**, con reinicio en el mismo puerto y páginas abiertas. Se repite en la puerta completa final. |
| HTTP real posterior y cotejo de compilación servida | `/api/decks`: 200, un resumen de genérica formato 1/contenido 2, null/alt vacío. HTML real referencia `index-CzJAlBL8.js` e `index-BIqHd1Ya.css`, iguales a los generados por la puerta final. Ningún paquete de fixture en ejecución normal. |
| Limpieza al cerrar ensayos | Instancia normal detenida después de comprobarla; puerto 3000 sin escucha. Su memoria de salas/partidas/sesiones se pierde. El próximo `npm run start` arranca limpio; no queda un servidor antiguo ocupando el puerto. |
| `git diff --check` / `git diff --cached --check` | Sin errores. Catálogo, dist, dist-server, logs y capturas siguen ignorados. Sin dependencias nuevas ni cambios de JSON/lockfile/contrato V1. |

**Incidencias resueltas:** la primera prueba parametrizada de permutaciones recibía argumentos separados de Vitest; corregido el montaje para ensayar realmente cada array completo. El tipo de la fixture parcial del reducer se ajustó a la unión por fase. Un acceso al mapa de sockets de prueba omitía el nivel Namespace; corregido. La primera puerta de navegador terminó 45/46: el reinicio/limpieza pasaban, pero stderr contenía un aviso Node por FORCE_COLOR/NO_COLOR heredados; el montaje del proceso elimina el flag contradictorio, manteniendo la aserción de stderr vacío. La revisión añadió recuperación ante INTERNAL_ERROR posterior a aceptación, además de ack perdido; prueba pura de emisión fallida y recorrido de navegador cubren ambas posibilidades. Puertas completas finales superadas tras estos ajustes; ninguna ejecución fallida se registra como superada.

### 10.2 Resultados nuevos por criterio y ejemplos

| Criterio | Evidencia ejecutada y resultado local |
|---|---|
| B06-01 | `startGame.test.ts` y `startSocket.test.ts`: anfitrión jugador/observador, invitado/tercero, ID inexistente, cookies ausentes/inválidas, origen ajeno y campos de suplantación. Solo anfitrión miembro inicia; no manos ajenas. **Superado.** |
| B06-02 | 1 rechaza, 2 inicia, 5 inicia con mazo 42, sustituto con 6 rechaza sin entropía; dominio rechaza 0/1/6. Observador necesita dos invitados y su propia conexión. Conexiones reales y navegador de cinco jugadores/observador. **Superado.** |
| B06-03 | Sin selección, puertos no disponible/versión equivocada, definición inválida y metadatos de versión incoherentes rechazan sin Game. Normal main con genérica 2 seleccionada explícitamente inicia; ninguna autoselección ni cambio de contenido. **Superado.** |
| B06-04 | `game.test.ts`, permutación conocida: tres vueltas circulares, manos en adquisición, primer jugador abridor, indicadora siguiente, atributo suyo, ronda 1, dirección null, plays vacío, HUMAN/ACTIVE y puntuación derivada cero. **Superado.** |
| B06-05 | Para 2/3/4/5: 58 ubicaciones únicas, mazos 51/48/45/42, pilas vacías. Permutación vacía/incompleta/repetida/ajena/extra rechaza. Instantánea congelada y aislada de modificaciones externas; catálogo no mutado. Adaptador real comprueba diez permutaciones completas. **Superado.** |
| B06-06 | Repetición de ID, ID nuevo, rechazo estable, conflicto de tipo/contexto y JOIN/CONFIGURE anteriores devuelven vigente sin revisión/emisión/reparto nuevo. Dos sockets de anfitrión casi simultáneos, pérdida del primer ack, HTTP/repetición recuperan un Game. Chrome retiene ID incierto, bloquea hasta recuperar y no reenvía al recargar. **Superado.** |
| B06-07 | Casos de uso ensayan ambos órdenes con entrada, nombre, configuración, salida y cierre. Entropía/presentación inválidas dejan espera utilizable. Emisión fallida después de registrar aceptación recupera Game sin segundo reparto. Chrome recupera ante error técnico posterior a aceptación. **Superado.** |
| B06-08 | Reloj controlado: caducidad −1/0/+1 ms; reserva 29.999/30.000/30.001 ms; vencimiento primero en igualdad. Inicio justo antes de caducar cancela tareas y callbacks cancelados ejecutados manualmente son inocuos; otra espera sigue venciendo. **Superado.** |
| B06-09 | HTTP y sockets reales: nombre/configuración/salida/cierre/nueva entrada sobre IN_GAME rechazados, HTTP 409 por fase y 403 para tercero. Crear del anfitrión recupera; invitado no crea otra ni cambia sala. Índices de código/propietario/sesiones retenidos. **Superado.** |
| B06-10 | Inspección automatizada de HTTP current/propio/crear, acks resume/start/replays y eventos reales para dos jugadores y observador. `gamePrivacy.ts` exige claves exactas y excluye IDs de cartas rivales/robo, sesión/credencial/semilla/JSON/ubicaciones internas; imagen URL/alt exactos y medios validados. Registros técnicos usan mensajes fijos, sin serializar errores privados. **Superado.** |
| B06-11 | Chrome dos contextos independientes y dos pestañas del host ya conectadas pasan a mesa sin F5. Misma partida/parte pública, mano propia; reducer rechaza WAITING tardío incluso con revisión mayor. No se emite inicio artificial por recuperación. **Superado.** |
| B06-12 | Normal a 360/390/1280: F5 de ambos, nueva pestaña, volver a `/`, mismas identidades/configuración/orden/manos/indicador/Game. Un único frame de inicio; fixtures mantienen un envío/barajado tras presencia/recarga. **Superado.** |
| B06-13 | Sockets reales, anfitrión jugador/observador: otra pestaña conserva CONNECTED, última pérdida marca DISCONNECTED; lectura HTTP no lo cambia. Avances controlados de >30 s, >2 min y >30 min conservan Game/cartas; reconexión elimina marca sin repartir ni retirar. **Superado.** |
| B06-14 | Normal dos jugadores, fixture cinco y observador/tres sesiones: orden, nombres repetidos/sufijos, self/abridor/anfitrión, observador fuera, cero puntos, ronda/mazo/activo/dirección y jugadas vacías. Sin contador rival, reloj/acciones de juego ni cierre. Capturas revisadas. **Superado.** |
| B06-15 | Genérica null sin `<img>`/sustitución. Fixture validada PNG 8×6, URL v7 y alt conservado; ambos valores separados aun iguales, unidad vacía no heredada y literal km, atributo activo distinto del roundAttribute de mano. Detalles conserva característica/nota; abortar imagen muestra icono/mensaje y no cambia DTO. **Superado.** |
| B06-16 | Chrome 360/390/1280 sin desbordamiento de página; solo fila de mano desplazable. Enter/Escape/cierre devuelven foco; tacto emulado abre Detalles de indicador móvil. Título recibe foco una vez; presencia no cierra diálogo ni pierde foco/desplazamiento. Revisión visual §10.3. **Superado en este entorno.** |
| B06-17 | Reinicio real de main compilado en instalación temporal normal con copia genérica 2 y guard ASSETS. Mismo puerto, mismas páginas abiertas: cookie antigua rechazada, recuperación HTTP null elimina mesa/mano y establece nueva identidad. Permite otra espera sin selección; sin resultado/cancelación ficticios ni endpoints de control. **Superado.** |
| B06-18 | Puertas completas 249/249 y 47/47, 50 módulos más revisión semántica; todas las baterías B01/T01/B02–B05/activación conservadas. Herramientas B04 reutilizadas. **Superado localmente.** |

**E1–E7 de este bloque:** E1 normal dos jugadores a tres anchuras; E2 normal observador y dos invitados, recarga de los tres; E3 presencia en espera y bordes exactos con tiempo controlado; E4 mesa iniciada cerca del vencimiento y todos ausentes con tiempo controlado; E5 dos conexiones host, concurrencia y ack perdido; E6 ambos órdenes de carreras; E7 reinicio real con limpieza de páginas ya abiertas. Todos ejecutados en los montajes anteriores. E1–E7 históricos de B01 también se repiten en su batería propia; no se sustituyen por estos ejemplos.

### 10.3 Clases de evidencia y revisión visual

- **Puro/tiempo controlado:** Game, casos de uso y callbacks usan definición/permutación explícitas, puertos y ControlledTime. Conservación, prioridades exactas y >30 minutos acreditados sin esperar media hora real.
- **Conexiones reales con tiempo controlado:** `startSocket.test.ts` y fixtures de navegador importando compilación actual; HTTP/Socket.IO/cookies/eventos/presencia reales, pero reloj/planificación y orden de cartas sustituidos. Interceptores de ack/evento/errores solo en pruebas, sin endpoints del producto. Espera de ack del cliente 5.000 ms real en los casos inciertos.
- **Conexiones/entropía reales:** recorridos normales genérica 2 y reinicio ejecutan main compilado con reloj, generadores y entropía reales; sesiones independientes por contextos Chrome. Diez permutaciones reales no acreditan equilibrio estadístico. Recargas/tabs/navegación y cierre del proceso son reales.
- **Reserva B03 real repetida:** detección de recuperación 6,3925 ms; segundo corte 2,5450 ms; retirada 30.003,8726 ms tras detección y 30.006,4176 ms desde corte local. Razones `transport close`. No prueba una avería física/WAN ni una reserva de juego B06. Detección conservada: pingInterval/pingTimeout 5.000/5.000 ms, maxHttpBufferSize 4.096; margen de espera funcional detección+30.000 ms.
- **Revisión visual realmente realizada:** inspeccionadas `B06-normal-1280-host.png`, `B06-normal-360-host.png`, `B06-normal-390-guest.png`, `B06-observer-390.png`, `B06-fixture-failure-360.png` y `B06-fixture-failure-1280.png`. Texto/valores, numeración, marcas, indicador compacto/completo, mano contenida, observador y fallo de imagen legibles, sin solapamientos/desbordamiento observado. Capturas regenerables en `test-results`, ignoradas. Tacto emulado y desplazamiento programático no se presentan como ensayo humano en dispositivo físico.

**Manual humano B06 pendiente:** README contiene pasos con dos perfiles independientes y ensayo de observador con tres; reiniciar entre partidas. No se ha realizado estudio de comprensión, lector de pantalla, móvil físico, redes WAN, HTTPS/Caddy o VPS. La confirmación manual anterior de activación pertenece a otra entrega.

### 10.4 Responsabilidades revisadas y decisiones internas

Game puro gobierna cartas y estado inicial; Room solo preparación/asociación/presencia. `RoomUseCases.start` reúne, autoriza, deduplica y fija de forma síncrona; `RoomCoordinator` separa fases y desmontaje, `WaitingLifecycle` permanece exclusivo de espera. `PublishedGameDecks` y `CardPermutation` son capacidades realmente usadas; LoadedDeckCatalog y crypto implementan, composición elige y conecta. Presentación validada mantiene imageAlt fuera de la definición de dominio. Proyección por sesión enumera campos seguros; no serializa Game. Handlers no barajan/reparten ni decide React permisos oficiales. Cliente separa hook/transporte de controles y mesa/cartas/Detalles; no guarda manos en persistencia ni envía inicios por reconexión.

Reparto elegido: una carta por jugador en orden base durante tres vueltas, conservando adquisición; después indicadora, resto en robo. Instantánea profunda congelada, sin nuevo repositorio Game porque la sala ya conserva una única asociación. Diagramas/tabla concretos en la guía de organización; sin abstracciones vacías de turnos/automático/bots y sin desviación de límites de AGENTS. `tools/decks.ts`, preparación/build/arranque, V1 y control arquitectónico existentes se reutilizan. Cualquier política de ejecución futura conserva su ámbito responsable.

### 10.5 Genérica e independencia de ASSETS

Comparación nueva de SHA-256 tras implementar: origen ASSETS, copia APP y huellas aprobadas de activación coinciden. `git diff main -- barajas/generica package.json package-lock.json` vacío: no cambios de bytes ni dependencias. Formato 1, contenido 2, true, 58 cartas, imágenes nulas y semilla original conservados.

| Archivo en ASSETS y APP | SHA-256 |
|---|---|
| baraja.json | `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` |
| cartas.json | `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c` |

Regresión `startup.test.ts` ejecuta build y arranque aislados con guard de IO ASSETS, comprobando primero el propio guard. B06 añade main/reinicio/navegador con solo compilación, genérica APP y dependencias, sin acceso ASSETS registrado. Catálogo/definición/presentación cargados antes de escuchar; inicio/recuperación no leen maestro ni archivos. Vacíos/borradores/inválidos/imágenes reales siguen instalaciones/fixtures temporales separadas, nunca publicación normal.

### 10.6 Archivos, fuentes generales y límites para coordinación

Inventario íntegro: `git show --name-only 91238fd`; 42 archivos de implementación, pruebas y README/organización. Piezas principales: `server/domain/game.ts`; `server/application/{room,roomUseCases,roomCoordinator,initialGameView,roomView,deckCatalog,ports}`; catálogo/cripto/memoria/HTTP/sockets/composición; contratos Room/Game; `src/{GameScreen,GameCard,StartRoomControl,useStartRoom,useRoomFlow,socket,roomState}`; nuevas pruebas Game/inicio/transporte/navegador y sus montajes. Preparación/documentos/bocetos en `14ff894`; este cierre y proceso constituyen el cambio documental final. Históricos B04/B05/activación intactos.

Actualizadas **localmente y por autorización expresa del encargo**, sin modificar reglas futuras: `TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md` (estado/§9, acuerdo cerrado, rama local y pendientes); `CAPA_APLICACION_KARTA3.md` (inicio/mesa parcial, puertos y §17.2, tiempos/ausencias futuros conservados); `INFRAESTRUCTURA_KARTA3.md` (transporte/entropía/instantánea/coordinación por fase y §16.1, ejecución/operación pendientes). TFM está fuera del repositorio Git APP; esas tres actualizaciones no pertenecen al commit de código y deben conservarse/recogerse en coordinación. No se modifica dominio general ni contenido editorial.

**Límites reales:** mesa no jugable, sin turnos/dirección/jugadas/resolución/reposición/puntuación ejecutada/resultados/desempate/bots/expulsión. B06 conserva Game/participantes/cartas indefinidamente dentro del proceso; vigilancia de dos minutos, timeouts/automático/ausencias y revisión ejecutada pertenecen al incremento futuro de ejecución. No hay privilegio de terminar ni endpoint de ensayo; reinicio elimina toda memoria. Una instancia, sin persistencia/replicación/cuentas. Manual humano, despliegue y CI remota de esta rama pendientes en sus conversaciones responsables.

**C09–C10 permanecen parciales:** validación/versión exacta al iniciar, instantánea y cartas privadas/indicadora con recursos iniciales acreditadas ahora; ejecución completa, cartas jugadas/resultados, equilibrio y comprensión con usuarios pendientes. No se abre otro bloque.

**Fecha de implementación/verificación local:** 04/10/2026. **Cierre:** B06 implementado/verificado en el alcance y entorno indicados, con pendientes expresos. Referencia del commit documental de cierre: el commit que añade §10.1–10.6, local, sin publicación.
