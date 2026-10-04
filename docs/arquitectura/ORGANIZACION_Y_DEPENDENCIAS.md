# Organización del código y dependencias de KARTA3

**Estado:** reglas para los próximos incrementos; T01 separó la creación, B02/B03 la espera y B04/B05 barajas/configuración. B06 incorpora solo dominio y coordinación de mesa inicial, sin ejecución.
**Fecha:** 30/09/2026.
**Alineación documental:** 01/10/2026 — flujo de barajas conforme a infraestructura §9 y contrato formato 1; las dependencias de capas no cambian.
**Implementación B04:** 02/10/2026 — validación pura, paquetes, catálogo y medios. No se modifica la dirección de dependencias ni se implementa `Game`.
**Implementación B05:** 02/10/2026 — configuración por control y selección de versión mediante puerto; participación/observación en el modelo de sala. Mismas dependencias y dominio de partida pendiente.
**Implementación B06:** 04/10/2026 — Game inicial puro, puerto de definición/presentación y entropía, coordinación por fase y vistas privadas. Se conservan los límites de capas y los requisitos futuros del MVP.
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
│   ├── domain/             Deck/Card, validación común y Game inicial
│   ├── application/        modelo Room, casos de uso, puertos y vista propia
│   ├── infrastructure/     HTTP, repositorio en memoria, sesión y generación
│   ├── composition/        conexión de adaptadores y casos de uso
│   └── main.ts             arranque y servicio de la interfaz compilada
├── shared/contracts/       tipos de intercambio públicos
├── src/                    transporte, coordinación y presentación React
├── tests/browser/          recorrido observable
└── tools/                  control de dependencias y sus casos negativos
```

El directorio `server/domain/` contiene la validación pura de `Deck` implementada en B04 y `Game` inicial de B06; no se creó vacío para T01. La ejecución de Game sigue pendiente. `tools/decks.ts` delega a composición, que selecciona las mismas operaciones de infraestructura para comando, construcción y arranque. Una prueba cercana al módulo que comprueba es válida. Se mantiene un solo repositorio.

### Estado del primer bloque tras T01

T01 separó `server/roomStore.ts` y `server/app.ts`: `Room` conserva estado y transiciones; `RoomUseCases` coordina identidad interna, permisos, código y repositorio; `roomView.ts` proyecta la respuesta; infraestructura conserva mapas, cookie, cripto y Express; composición los conecta. Los contratos públicos viven en `shared/contracts`. El comportamiento HTTP y la interfaz del bloque 01 se conservaron y se comprobaron de nuevo.

Las carpetas nuevas se crean al implementar funciones nuevas o al extraer una responsabilidad real. Se evita tanto un archivo único creciente para todas las funciones como una jerarquía llena de clases sin conducta.

## 4. Dónde va cada decisión

| Necesidad | Lugar responsable | Ejemplo de límite |
|---|---|---|
| Comparar cartas, resolver la ronda, atribuir cartas ganadas | Dominio | Un punto por **carta** ganada, no por ronda. |
| Seleccionar jugada de bot fácil/normal o automático humano | Dominio | Recibe su mano y la información permitida; no consulta otros jugadores en infraestructura. |
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

No se añade repositorio separado de Game: una sala necesita una sola asociación viva y el repositorio existente cubre ambas fases. No se introducen planificadores/políticas de turnos, resultados o bots por anticipado. Las opciones fijadas son datos; la mesa INITIAL_TABLE_ONLY no es una fase de dominio ni cambia las reglas futuras. Herramienta de barajas y control arquitectónico se reutilizan; ninguna excepción por tema o id.

## 7. Comprobaciones y cambio arquitectónico

Para cada bloque acordado:

1. Relacionar sus criterios con las fuentes vigentes y señalar si cambia una regla general.
2. Implementar en la zona responsable y comprobar que sus dependencias tienen la dirección permitida.
3. Probar dominio de forma pura, casos de uso con puertos sustitutos, adaptadores con integración y recorridos visibles cuando correspondan.
4. Ejecutar `npm run check` y las comprobaciones adicionales del bloque; registrar resultados reales.
5. Documentar cualquier desviación arquitectónica deliberada: motivo, alcance, alternativa y tarea de corrección si es temporal. No declarar que la arquitectura está completa por haber creado carpetas.

`npm run check:architecture`, integrado en `npm run check`, revisa imports de valor y tipo, reexportaciones, aliases y ciclos entre módulos de producción y comandos de la raíz de `tools/`. Estos comandos solo importan módulos locales de composición; las fixtures anidadas se revisan como proyectos de prueba. Sus cuatro casos negativos se ejecutan con `npm test`. El control sintáctico se complementa con revisión de responsabilidades: no demostraría por sí solo que un adaptador haya dejado de decidir permisos o nombres. B04 conserva las reglas de capas y amplía su control a la herramienta.
