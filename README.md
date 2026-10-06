# KARTA3

KARTA3 es un proyecto de adaptación de un juego de cartas a una aplicación web multijugador, desarrollado como Trabajo Fin de Máster.

La aplicación se construye de forma incremental, con especificaciones, pruebas y documentación de cada entrega. Utiliza TypeScript, React y un servidor Node.js con Express y Socket.IO.

## Estado actual

Actualmente permite crear una sala de espera, compartir su código e incorporar participantes desde navegadores independientes. La lista se actualiza en tiempo real y, durante la espera, cada participante puede cambiar su nombre o salir. También gestiona la reconexión temporal y el cierre de esperas por inactividad.

El bloque 04 añade validación común de barajas, preparación del catálogo y consulta pública de resúmenes. La [incorporación de genérica 2](docs/sdd/ACTIVACION_GENERICA_V2.md) conserva formato 1, incorpora contenido 2 aprobado y `available: true`: el catálogo normal ofrece únicamente su resumen seguro, con portada nula. B04/B05 conservan sus evidencias históricas de contenido 1/no disponible.

El bloque 05 permite seleccionar/quitar una versión disponible de baraja, participar u observar como anfitrión, configurar tiempo de turno, desempate y revisión. Cada control se confirma de forma independiente y los invitados consultan los valores aceptados.

El [bloque 06](docs/sdd/BLOQUE_06_INICIO_Y_MESA_INICIAL.md) entrega el inicio por el anfitrión y una versión exacta disponible seleccionada. B09 amplía su preparación a 2–5 jugadores HUMAN/BOT, al menos un humano jugador y todos los miembros humanos conectados, incluido el anfitrión observador. El [bloque 07](docs/sdd/BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md) permite completar la partida manual: apertura ALTO/BAJO y carta en cualquier orden, turnos circulares, puntuación, reposición, tres rondas finales, desempate opcional único y clasificación. La dirección parcial es privada del abridor y sus pestañas; la carta parcial solo vive en esa pestaña. Detalles no juega. Recargar recupera estado/identidad sin enviar acciones ni volver a repartir.

El [bloque 08](docs/sdd/BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md) aplica el turno configurado de 15/30/60 segundos desde el inicio y cada activación. Al vencer, el servidor juega la carta más antigua; al abrir conserva la dirección aceptada a tiempo o elige la desfavorable según el atributo activo. El primer fallo avisa; una jugada manual completa válida a tiempo reinicia el contador. El segundo consecutivo pasa a automático permanente: sigue siendo humano, conserva cartas/puntos y puede observar su mano y Detalles, pero ya no actuar. Si todos los jugadores humanos están en automático, se termina/puntúa/revisa la ronda actual y se publican resultados por inactividad, sin iniciar otra ronda o desempate. Un desempate ya iniciado sí se completa y reconoce al vencedor sin puntos nuevos.

El [bloque 09](docs/sdd/BLOQUE_09_BOTS.md) permite añadir explícitamente un bot Difícil, cambiar individualmente a Fácil/Difícil, renombrar con diálogo y retirar inmediatamente durante la espera. Cada bot ocupa plaza, conserva su orden y juega mediante su política en el servidor, sin sesión, presencia, plazo humano ni contador de abandono. No es un humano en automático. El anfitrión jugador va al final; el observador aparte. Los bots completan rondas, revisión, fase final, desempate y resultados con las mismas reglas de cartas/puntos. Para terminar por inactividad se cuentan solo los humanos jugadores del roster base.

La [alineación T02](docs/sdd/BLOQUE_T02_ALINEACION_DIFICULTADES_BOTS.md) usa `EASY` para «Fácil» y `HARD` para «Difícil», también al añadir un bot. HARD conserva exactamente la política que antes se identificaba como NORMAL; no incorpora el algoritmo avanzado ni otros niveles. NORMAL se rechaza sin alias/coerción. El [ajuste visual anterior](docs/sdd/AJUSTE_ETIQUETA_DIFICULTAD_BOTS.md) y el cierre B09 conservan sus denominaciones y resultados históricos.

El [bloque 10](docs/sdd/BLOQUE_10_REDISTRIBUCION_MESA.md) redistribuye los mismos paneles de mesa: desde 761 px, jugadores/mesa arriba e indicadora/mano/estado abajo, con estado junto a mano; hasta 760 px, jugadores/estado vecinos arriba y después indicadora compacta, mesa y mano. El observador mantiene estado público y no tiene mano. Cabecera, cartas, fuentes, etiquetas, acciones, plazos y revisión se conservan. Mesa/mano siguen teniendo scrolls laterales independientes; la página todavía puede necesitar scroll vertical. Esta entrega no garantiza verlo todo en una sola ventana.

El [ajuste B11 de mesa PC](docs/sdd/BLOQUE_11_AJUSTE_MESA_PC_02.md) conserva esa composición y usa la referencia aprobada de **1800×1600 píxeles CSS al 100 %**, con cartas exteriores **230×321 px** en juego normal. Compacta cabecera/jugadores, muestra BF/BD y abridor sombreado, Mesa/autores al pie, tabla Atributo/Dato/J e icono propio. Detalles permanece dentro; «Jugar carta» queda fuera y también se puede pulsar la superficie informativa sin arrastrar. El turno mantiene reloj y parcial privada, con ALTO sobre BAJO. El encuadre de referencia no acredita el de una pantalla física de 1920×1080; otros tamaños conservan acceso/scroll y la revisión visual del autor sigue pendiente. No se ha rediseñado móvil, espera o resultados.

La presentación vigente [B12 — Mesa centrada 03](docs/sdd/BLOQUE_12_MESA_CENTRADA_03.md) limita el contenedor PC a **1400 px** cuando existe ese ancho útil, con cuadrícula de **1368**, laterales de 264 px, mano de 816 y estado de 264; cartas de 230×321. Mesa mide 1092: muestra cuatro completas y permite consultar la quinta lateralmente, con ayuda y acceso de teclado/ratón/táctil. Las jugadas públicas se muestran por J activo descendente ALTO/ascendente BAJO, y durante revisión siguen el ranking confirmado; la mano mantiene adquisición. En ese modo desaparece la línea superior «Atributo indicador: …», se compactan ambos encabezados y «Tu mano» queda centrado. Sigue habiendo atributo activo en turno/cartas. El scroll vertical es natural y está permitido; en menos ancho permanece la adaptación anterior, sin rediseño móvil. Los cierres B10/B11 conservan sus objetivos y evidencias históricos.

Todo el estado se mantiene en memoria de un proceso. **Reiniciar el servidor elimina salas, partidas, resultados y sesiones.** En juego no hay salida/cierre/cancelación; el anfitrión ausente no cierra la mesa y el servidor continúa sin navegadores. No existe opción de modo manual. Revisión (0/2/5/10/15/30 s) y conservación de resultados (30 minutos desde publicación final tras revisión, incluso sin clientes) están aplicadas. Volver al inicio libera solo la sesión solicitante en todas sus pestañas; permite consultar su último resultado y crear/entrar en otra sala sin reiniciar. No es historial permanente ni revancha. Para limpiar todos los ensayos se reinicia el proceso.

Las reglas para desarrollar los siguientes bloques están en [`AGENTS.md`](AGENTS.md). La [organización y dependencias](docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) explica cómo separar dominio, aplicación, infraestructura e interfaz a partir de este primer bloque.

## Requisitos e instalación

- Node.js 24 LTS y npm.
- Chrome instalado para las pruebas de navegador.

Clona el repositorio con una cuenta autorizada mientras sea privado. En PowerShell:

```powershell
git clone https://github.com/adriancapilla/karta3.git
Set-Location -LiteralPath 'karta3'
npm ci
npm run dev
```

Abrir `http://127.0.0.1:5173`. El paso `predev` prepara las barajas antes de arrancar. Vite envía `/api`, `/media`, `/barajas` y `/socket.io` al servidor en `127.0.0.1:3000` y bloquea el acceso directo a datos internos. Para probar la entrada, usa otro navegador o perfil con cookies independientes; una segunda pestaña del mismo perfil representa a la misma persona. El estado reside en la memoria del servidor; reiniciarlo elimina las salas. No hacen falta cuentas ni variables de entorno para desarrollo local.

## Comprobaciones

El [flujo de GitHub y recuperación](docs/operacion/GITHUB_Y_RECUPERACION.md) describe la automatización, las ejecuciones verificadas y las copias pendientes fuera de Git.

```powershell
npm run check
```

Comprueba tipos, análisis estático, pruebas de modelo, casos de uso, adaptadores y API, dependencias entre capas y compilación. El control `npm run check:architecture` también puede ejecutarse por separado; sus casos negativos forman parte de `npm test`. Para las pruebas de navegador, en una terminal arranca la versión compilada actual:

```powershell
npm run build
npm run start
```

En otra terminal, entra también en esa carpeta y ejecuta:

```powershell
# Desde la carpeta del repositorio, que contiene package.json:
npm run test:browser
```

Estas pruebas usan Chrome y el servidor local en `127.0.0.1:3000`; incluyen contextos aislados que se comunican mediante Socket.IO. Reinicia `npm run start` después de cambiar y compilar código del servidor. Los recorridos de caducidad levantan además instancias de esa misma compilación con reloj/planificador sustituidos, sin controles de prueba públicos. El recorrido de reserva real espera los 30 segundos originales y puede tardar cerca de un minuto. La evidencia de configuración está en [B05](docs/sdd/BLOQUE_05_CONFIGURACION_SALA.md); los bloques anteriores conservan sus registros históricos.

### Probar configuración

Desde la sala, modificar un control como anfitrión y observar su confirmación. Abrir otro perfil/navegador, entrar por código y comprobar el resumen recibido. Una segunda pestaña del anfitrión comparte identidad: los cambios de controles distintos se conservan y el último nuevo válido del mismo control prevalece. Desmarcar «El anfitrión juega» muestra al observador fuera de la lista; volver a jugar exige plaza libre. Recargar recupera los valores aceptados. La genérica 2 está disponible, pero cada sala empieza sin baraja seleccionada y permite quitar la selección.

Para probar selección, portada, icono neutro, errores y carreras con paquetes disponibles sin cambiar las copias reales:

```powershell
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
npm run build
npx playwright test tests/browser/configuration.spec.ts
```

Este recorrido crea servidores de la compilación actual con paquetes sintéticos validados en carpetas temporales, dos sesiones y dos pestañas del anfitrión. Usa conexiones reales y tiempo controlado para vencimientos; no publica fixtures en `barajas/`.

## Estructura y decisiones

- `server/domain/`: `deck.ts` valida baraja; `game.ts` gobierna jugadas, ranking por valor jugable, cartas/puntos, reposición, fases finales, desempate y clasificación con sucesores inmutables. `autoPlay.ts` decide la política de humanos inactivos y `botPlay.ts` las políticas EASY/HARD sobre mano propia/atributo/dirección; Game aplica contador/control y motivo de fin. Recibe permutaciones explícitas; no IO, reloj ni transporte.
- `server/application/`: Room conserva preparación/asociación/roster y plazos explícitos. RoomUseCases autoriza/deduplica preparación y gestión de bots con resultado mínimo botId; GameCoordinator coordina contexto, parcial privada, vencimientos, pasos de humanos automáticos/bots, revisión, publicación/retención y retorno. Clock/Scheduler/GameChanges/CardPermutation son puertos usados. WaitingLifecycle solo espera; initialGameView y resultsView proyectan por destinatario. DeckCatalog/ListDecks ofrecen resúmenes seguros sin releer archivos al jugar.
- `server/infrastructure/`: repositorio y solicitudes deduplicadas en memoria, sesiones y último fin automático propio, generación, reloj monotónico, planificador cancelable, HTTP Express y Socket.IO. El transporte cuenta conexiones autenticadas; la aplicación decide sus consecuencias. La cookie es `HttpOnly`, limitada al host y `SameSite=Strict`; usa `Secure` cuando `NODE_ENV=production`.
- `server/composition/` y `server/main.ts`: eligen adaptadores, los conectan, sirven `dist` e inician el proceso.
- `shared/contracts/`: formato público de la sala, respuestas y mensajes de tiempo real, compartido con el cliente.
- `src/`: WaitingPlayers/useBotActions presentan filas/diálogo y gestionan pending/incertidumbre por bot/campo; participantNames conserva sufijos. API/socket y useRoomFlow separan asociación activa de lectura explícita del resultado. useGameActions guarda solo carta local/pending; GameScreen/GameCard/Detalles/RoundReview y ResultsScreen presentan contratos seguros. useServerCountdown estima tiempo con referencia pública y `performance.now()`: el cero solo solicita lectura y bloquea gestos antiguos. Inicio/jugada inciertos requieren recuperación antes de reintentar; no se encolan ni envían al reconectar. React no calcula ganadores/puntos ni aplica vencimientos.
- `server/infrastructure/decks/`: parser JSON estricto, esquema/coherencia, recursos decodificados y catálogo en memoria. `sharp` 0.35.5 es dependencia del servidor para PNG/JPEG/WebP; no va al cliente.
- `tools/decks.ts`: analiza argumentos y delega a composición las operaciones comunes de validación/preparación.
- `tools/check-architecture.mjs`: comprueba imports, reexportaciones, aliases y ciclos del código de producción, incluidos comandos en la raíz de `tools/`.
- `tests/browser/`: recorridos en Chrome a 360/390/1280 píxeles, con sesiones independientes y montajes compilados.
- `docs/sdd/`: especificación y evidencia del bloque.

La creación, lectura, edición del nombre y cierre conservan HTTP. La entrada, salida, configuración y sincronización usan Socket.IO con la misma sesión. La configuración usa un id nuevo por gesto; el transporte volátil no espera ni encola cambios para reconectar. El servidor deduplica repeticiones sin restaurar un resultado antiguo. El estado en memoria permite una sola instancia del servidor; no hay persistencia ni sincronización entre procesos. El código visible localiza una sala, pero nunca autoriza a modificarla.

## Preparar y probar barajas

Desde `E:\KARTA3\KARTA3_IA\APP\karta3`:

```powershell
npm run decks:validate -- --package barajas/generica
npm run decks:prepare
npm run build
npm run start
```

Consultar `http://127.0.0.1:3000/api/decks`: devuelve `decks` con un resumen `generica`, `schemaVersion: 1`, `contentVersion: 2`, nombre/subtítulo/descripción aprobados, `imageUrl: null` e `imageAlt: ""`. Solo contiene esos ocho campos. `build` siempre prepara `barajas/catalogo.json`; `start` vuelve a validar los paquetes y exige ese catálogo vigente antes de escuchar. El artefacto está ignorado en Git y se genera con orden estable, UTF-8, dos espacios y LF. Solo se leen copias de APP; no hace falta ASSETS ni TFM para construir/ejecutar. Detener la instancia anterior con Ctrl+C antes de `npm run start`: copiar o compilar no actualiza su instantánea. El reinicio pierde las salas; crear esperas nuevas para comprobar la incorporación.

Validar un paquete devuelve salida 0 si es válido, aunque no esté disponible, y 1 si es inválido. Preparar o arrancar informa/excluye borradores inválidos cuyo `false` sea fiable; una disponible inválida o disponibilidad indeterminable bloquea. La aplicación no repara datos ni activa contenido. Incorporar/activar una nueva copia exige revisión y versiones conforme al [contrato](docs/contratos/CONTRATO_BARAJAS_V1.md).

Los JSON internos no son descargables. Las referencias públicas admitidas usan `/media/decks/<id>/v<contenido>/<referencia>` y solo sirven bytes validados de copias disponibles. B05 ofrece selector, selección autorizada y ficha/icono neutro para la ausencia de portada; B06 entrega indicadora y mano propia, con iconos ante imágenes nulas y Detalles accesible. Las fixtures de pruebas son temporales y no sustituyen la genérica normal: permiten probar catálogo vacío, borradores, inválidos y recursos reales. [Evidencia B04](docs/sdd/BLOQUE_04_CARGA_BARAJAS.md), [B05](docs/sdd/BLOQUE_05_CONFIGURACION_SALA.md), [genérica 2](docs/sdd/ACTIVACION_GENERICA_V2.md) y [B06](docs/sdd/BLOQUE_06_INICIO_Y_MESA_INICIAL.md).

### Prueba manual de genérica 2 con dos sesiones

En PowerShell, desde `E:\KARTA3\KARTA3_IA\APP\karta3`, ejecutar `npm ci` si faltan las dependencias y `npm run check`. Detener el servidor anterior y ejecutar `npm run start`. Mantenerlo abierto; en otra terminal del mismo directorio ejecutar `npm run test:browser` para la comprobación automática sobre la compilación actual.

1. Abrir `http://127.0.0.1:3000/api/decks`: debe ofrecer `generica`, contenido 2 y portada nula. Volver a `http://127.0.0.1:3000`.
2. En sesión A crear sala. Verificar las seis cifras y «Sin baraja seleccionada», aunque exista una única opción. Predeterminados: anfitrión juega, turno 30 s, desempate desactivado y revisión 5 s.
3. En otro navegador/perfil con cookies independientes, sesión B entrar con código y nombre. Una segunda pestaña del mismo perfil comparte identidad y no representa a otro participante.
4. A selecciona «KARTA3 — Baraja genérica · v2». Tras aceptación, A y B ven nombre, descripción e icono neutro sin recargar. B consulta la configuración y no dispone de controles para editarla.
5. Recargar A y B, sin reiniciar el servidor: conservan identidad, autoridad, orden y selección exacta sin duplicaciones. Reiniciar el servidor pierde la espera y no es una prueba de recuperación mediante recarga.
6. A elige «Sin baraja seleccionada»: B ve el cambio sin recargar. B prueba salida voluntaria y A cierre con confirmación. Repetir en móvil (390 px) y escritorio (1280 px).

Registrar fecha, versión servida, navegadores/perfiles, acciones, resultados y límites. Estas instrucciones no acreditan ejecución manual. C09–C10 siguen parciales: B07 amplía uso de la baraja, cartas jugadas/manos variables/resultados y privacidad; comprensión con usuarios, equilibrio, móviles físicos y despliegue siguen pendientes. B09 incorpora bots Fácil/Difícil sin acreditar equilibrio.

### Prueba manual B07: dos jugadores y observador

```powershell
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
npm ci
npm run check
# Detener con Ctrl+C la instancia anterior antes de arrancar la compilación actual:
npm run start
```

1. Abrir `http://127.0.0.1:3000` en dos navegadores o perfiles con cookies independientes. A crea y B entra con el código y nombre «Ana». Una segunda pestaña de A comparte su identidad.
2. Sin selección, «Iniciar partida» está deshabilitado para A; B no tiene ese botón. A selecciona explícitamente «KARTA3 — Baraja genérica · v2» y espera confirmación. No es necesario llenar cinco plazas ni marcar listo.
3. A inicia una vez. A, su segunda pestaña y B reciben la mesa: B abre, tres cartas propias, indicadora común, ronda 1, dirección «Sin elegir», mazo 51 y cero puntos. Estado de la partida muestra «Tiempo de turno · mm:ss». Solo B puede jugar; no hay salida/cierre. Completar cada jugada antes del límite para comprobar el recorrido manual B07 bajo B08.
4. Abrir Detalles de indicadora/mano con teclado y cierre/Escape; comprobar característica/nota si existen y tres filas con Jugable y Dato separados. En la carta de mesa se muestran Atributo/Dato/J; J significa valor jugable. A 360/390 px la indicadora es compacta y la mano se desplaza dentro de su fila; a 1280 px se muestra completa. La genérica usa icono decorativo, sin imagen de sustitución.
5. B elige ALTO: la dirección aceptada solo se ve en B y otra pestaña de B. Cambiar a BAJO no juega. F5 conserva dirección, nunca carta parcial. Pulsar carta propia completa y envía sin confirmación. En otra apertura elegir primero carta, luego ALTO/BAJO. Recibir dirección de otra pestaña no completa automáticamente una carta local. A juega su carta cuando le toca; no envía dirección. Detalles/Escape no juega y devuelve foco al disparador.
6. Alternar aperturas/direcciones hasta completar, actuando a tiempo: ganador recibe dos cartas/dos puntos, segundo abre, reposición al final de adquisición y revisión de cinco segundos conserva ronda resuelta. Recargar/cortar/restaurar conexión conserva mano/contexto/plazo; otra pestaña conectada mantiene presencia. Desconectar no pausa el turno. Durante revisión no se juega ni corre un plazo humano; solo su cuenta atrás aparece. Con revisión cero se comunica el resultado brevemente sin pausa.
7. Con dos jugadores hay 17 rondas normales y tres finales: las finales comparten indicadora/atributo, no reponen y reducen mano 3→2→1→0; total 40 cartas/puntos adjudicados. Resultado se presenta tras revisión final, con puestos y ganadores. A vuelve al inicio: todas sus pestañas vuelven, B mantiene su resultado. Abrir «Ver último resultado» y F5 allí no revinculan. A crea/entra en otra sala sin reiniciar, con código/participación nuevos; leer el resultado antiguo en otra pestaña no cambia esa sala.
8. Ensayo observador: completar/volver o, si el ensayo está detenido, Ctrl+C y `npm run start` para limpiar **todo** el proceso. Crear en A y desmarcar «El anfitrión juega». Entrar B/C en otras dos sesiones independientes, seleccionar genérica 2, revisión cero y desempate activo, e iniciar A. B abre, A observa sin mano/puntos. Completar la partida y verificar resultado público. Sin empate máximo no se ejecuta desempate; esto no acredita esa rama.
9. Empates se prueban por separado con paquetes/permutaciones temporales validados y acciones legales: `npx playwright test tests/browser/manualGame.spec.ts --grep 'M4 traza'`. Cinco empatados a 10 reciben una carta en desempate; cuatro, dos. Las pruebas de dominio/socket también comprueban reparto de tres y 15/15/15/5/0 con puestos 1/1/1/4/5. No asignan puntos ni alteran la instalación normal. El caso cinco empatados a 10 corresponde al ejemplo corregido por Arquitectura en dominio §24.2 el 05/10/2026.
10. Revisar 360/390/1280 px y teclado/tacto; mano variable con scroll contenido, revisión/resultados y observador. A los 30 minutos desde publicación final, una lectura nueva rechaza el resultado sin renovar; una copia ya abierta puede conservarse. Las comprobaciones automáticas del límite usan reloj controlado, no media hora real. Reiniciar borra memoria/identidad; F5 elimina mesa privada/resultado recuperable sin inventar causa o ganador.

Ante pérdida de confirmación de inicio/jugada/retorno, recuperar primero el estado; reintentar explícitamente conserva ID si sigue incierto. Recargar/reconectar nunca envía una acción automáticamente. Lectura de resultado fallida por red informa conexión, sin declarar caducidad, y permite reintentar. Registrar fecha, versión, perfiles, dispositivos, resultados y límites: estos recorridos automatizados no acreditan revisión humana ni móvil físico. Las evidencias históricas B06 se conservan en su especificación.

### Prueba manual B08: reloj, automático y ausencia

Usar la compilación vigente con los comandos anteriores, dos perfiles independientes A/B y una segunda pestaña del mismo perfil. Genérica 2 se selecciona explícitamente; no publicar ni sustituir fixtures en la instalación normal.

1. Configurar turno 15 s y revisión 5 s. Iniciar: ambas sesiones ven el mismo turno/plazo; 60 s se presenta como 01:00. Abrir Detalles no juega ni pausa. Dirección/carta se pueden escoger en ambos órdenes, sin botón de confirmación adicional.
2. Dejar vencer a B, incluso cerrando **todas sus pestañas** mientras A observa y el servidor sigue abierto. Registrar inicio/límite/observación. A recibe aviso durante cinco segundos; al recuperar la misma cookie B conserva mano/contexto y la advertencia propia de primer fallo. F5 no inicia otro plazo ni reproduce todos los avisos antiguos.
3. Cuando vuelva a tocarle B, completar manualmente una jugada válida antes del límite: desaparece la advertencia y contador propio pasa a 0. Una parcial, una lectura o un error no lo reinician. Carta solo local no cuenta para el timeout; dirección aceptada a tiempo sí.
4. En otra traza, dejar vencer dos turnos consecutivos de B sin una jugada manual suya entre ambos. El segundo movimiento es TIMEOUT; después juega AUTOMATIC. Todos ven «Automático»; B conserva su mano/Detalles sin acciones manuales y recibe aviso permanente, también tras F5/reconexión. Otra pestaña conectada conserva presencia; «Sin conexión» y «Automático» son estados distintos.
5. Mantener A jugando a tiempo: B puede ganar/abrir y conserva puntos. Si el timeout resuelve ronda, comprobar aviso de ganador/puntos junto al de vencimiento. Revisión positiva detiene el siguiente turno; revisión cero comunica antes de continuar y no añade una pausa artificial.
6. Ensayo de observador: A crea/desmarca «El anfitrión juega», B/C entran en sesiones independientes y A inicia con genérica 2 seleccionada. A no tiene mano/contador propio. Dejar vencer a B/C dos veces, o cerrar **todas** las pestañas después del inicio, sin apagar el servidor. Volver antes de caducar: ronda finalizada/puntuada/revisada y resultado «La partida terminó porque todos los jugadores humanos pasaron a automático». La presencia del observador no evita ese final; la ausencia del anfitrión no cierra IN_GAME.
7. Comprobar resultados, retorno en todas las pestañas de la sesión, «Ver último resultado» y otra sala sin reinicio. Lecturas/retorno no renuevan los 30 minutos. Reiniciar sirve para limpiar toda la memoria, no para acreditar recuperación.
8. Fase final/desempates se prueban aparte con trazas legales validadas: `npx playwright test tests/browser/timedGame.spec.ts --grep 'empatados legales'`. Cubren 2/5 empatados (mano 3/1) y revisión positiva antes de resultado por inactividad; dominio añade mano 2 y ACTIVE fuera de la lista de empatados. `npx vitest run server/domain/timedGame.test.ts server/application/timedGame.test.ts server/timedSocket.test.ts` comprueba conservación y plazos controlados. Un abandono corto de genérica no acredita fase final/desempate.
9. Probar 360/390/1280 px, teclado/tacto, foco/Detalles/scroll, aviso breve y advertencia persistente, cuenta atrás y cero sin red («Esperando actualización del servidor…»). No se envían ni encolan gestos al reconectar. Nombres repetidos usan sufijos; ningún contador privado ajeno aparece.

Registrar los recorridos humanos como realizados o pendientes. Las evidencias automatizadas B08 distinguen reloj controlado, HTTP/Socket.IO reales, entropía real y vencimiento real de 15 s con transporte cerrado. No acreditan media hora real, móvil físico, equilibrio o comprensión con usuarios. Vigilancia de dos minutos, nuevos niveles de bots y despliegue siguen pendientes; C09–C10 parciales.

## Probar el ciclo de vida de la espera

1. Crea una sala y entra con otro perfil. Abre una segunda pestaña del invitado: cerrar una conserva presencia mientras la otra esté conectada.
2. Interrumpe la conexión del invitado. La otra sesión ve «Reconectando». Si vuelve antes de 30 segundos desde la detección, conserva identidad/plaza/orden; después su plaza se libera y deberá entrar de nuevo.
3. Si vence la ausencia del anfitrión, todos vuelven a portada con el motivo. No se transfiere el control. Crear por HTTP sin socket del anfitrión concede el mismo margen inicial.
4. Sin cambios válidos aparece una franja al minuto 29 y la sala cierra al 30. Una nueva incorporación humana/bot, salida voluntaria, retirada explícita de bot, nombre realmente distinto o cambio efectivo aceptado de configuración/dificultad renueva. Leer, copiar, recargar, reconectar o repetir solicitudes no renueva; tampoco una retirada automática. Estos plazos solo rigen la espera.

Socket.IO usa `pingInterval=5000` y `pingTimeout=5000` ms. La reserva empieza cuando el servidor detecta la última pérdida; una red que deja de entregar paquetes puede añadir retraso de detección. El contador de caducidad usa referencia del servidor y tiempo monotónico transcurrido en el navegador: llegar a cero solo solicita confirmación. No hay controles públicos para acelerar estos plazos.

`NODE_ENV=production` exige HTTPS delante del servidor para que el navegador acepte la cookie `Secure`. El servidor escucha en `127.0.0.1` y está preparado para quedar detrás del proxy del despliegue futuro. Docker Compose, Caddy y el VPS pertenecen a hitos posteriores; este bloque no los despliega ni los acredita. GitHub Actions ejecuta las comprobaciones generales, incluida la preparación de barajas, y los recorridos Chrome existentes; las referencias y resultados reales de cada publicación constan en el documento operativo.

## Contrato HTTP actual

| Método y ruta | Uso |
|---|---|
| `GET /api/decks` | Resúmenes de barajas disponibles; no crea sesión ni renueva salas; `Cache-Control: no-store`. |
| `GET /api/rooms/current` | Establece sesión si falta; espera/partida/resultado vinculado o `null`; `ended` propio de espera y `lastResult?` todavía conservado. No-store. |
| `GET /api/results/:gameId` | Cookie de participante original; resultado conservado, no-store, sin vincular ni renovar; tercero 403, ausencia/vencimiento 404, sesión 401. |
| `POST /api/rooms` con `{}` | Crea una espera o recupera la sala/mesa ya vinculada al anfitrión. |
| `GET /api/rooms/:id` | Devuelve la sala a un participante reconocido. |
| `PATCH /api/rooms/:id/name` con `{ "name": "…" }` | Valida y cambia el nombre del solicitante reconocido. |
| `DELETE /api/rooms/:id` | Cierra la espera propia. |

Los fallos devuelven `{ "error": { "code": "…", "message": "…" } }`, con causas estables como `INVALID_INPUT`, `ROOM_NOT_AVAILABLE`, `FORBIDDEN` y `SESSION_REQUIRED`. No se transmiten trazas al navegador.

El canal Socket.IO conserva `room:resume`, `room:join`, `room:leave`, `room:configure`, `room:start` y sus eventos. B07 añade `game:opening-direction` (`{ requestId, roomId, gameId, roundNumber, turnId, direction }`), `game:play` (mismo contexto más `cardId`, dirección explícita para abridor y null para otros), `game:round-resolved`, `results:return-home` (`{ requestId, roomId, gameId }`) y `results:home` solo a la sesión solicitante. No existe HTTP de inicio/jugada ni control público de avanzar/finalizar. Los IDs visibles no sustituyen la cookie. [B07 §5](docs/sdd/BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md) fija entradas exactas, vistas por destinatario, errores y dedupe.

B08 conserva esas entradas exactas y añade `game:turn-expired` deduplicado (contexto público, jugador y flag `automatic`), `TIMED_TURNS`, plazo público estable, `playStatus`, contador **solo propio** y modos TIMEOUT/AUTOMATIC. Añade errores PLAYER_AUTOMATIC/TURN_EXPIRED; una aceptación repetida devuelve la vista vigente sin reaplicar/resetear. [B08 §§5–6](docs/sdd/BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md) concreta mensajes seguros. No hay endpoints de timeout, automático, reloj o avance.

`WAITING` conserva su contrato/ciclo B03. `IN_GAME` fija preparación y publica únicamente mano propia, jugadas/indicadora públicas y parcial privada del abridor ACTIVE; `RESULTS` no incluye Game, manos, mazo, presencia ni cartas. Roster original autoriza lectura del resultado independientemente de la asociación activa liberada. Callbacks antiguos no avanzan otra revisión ni borran una sala nueva. Quedan pendientes vigilancia/retirada por ausencia del incremento correspondiente, nuevos niveles de bots, configuración de visualización, equilibrio y despliegue; no se arrastran reservas/cierres B03 a IN_GAME.

## Probar B09: bots Fácil y Difícil

Desde la carpeta del repositorio: `npm ci` si faltan dependencias, `npm run check`, detener con Ctrl+C la instancia antigua y `npm run start`. Otra terminal del mismo directorio: `npm run test:browser`. Abrir `http://127.0.0.1:3000`. No hace falta ASSETS para construir/ejecutar; genérica formato 1/contenido 2 sigue intacta y cada sala empieza sin selección.

1. A crea sala. Añadir bot incorpora uno **Difícil**; repetir crea Bot 2. Elegir Fácil en una fila; otra pestaña de A comparte identidad y valores aceptados. B entra desde perfil independiente: consulta marcas/nombres/niveles, sin controles de bots. Plazas humanas reconectando siguen ocupadas; máximo cinco. El anfitrión jugador permanece al final.
2. Cambiar nombre abre el actual sin sufijo. Escribir y Cancelar/cerrar/Escape no envía. Aceptar valida trim/1–16 caracteres visibles; nombres repetidos tienen sufijos. Un error conserva borrador corregible. Cambiar ese bot desde la segunda pestaña conserva el borrador e informa del nombre vigente. Retirar es inmediato, libera solo su plaza y avisa cinco segundos con el nombre/sufijo anterior. Añadir después continúa Bot 3, sin reutilizar número.
3. Probar F5 y desconexión: recuperan aceptado sin reenvío. Si falta confirmación, recuperar estado y luego confirmar explícitamente el envío original; no enviar uno nuevo ni afirmar cancelación de lo ya enviado. Un diálogo incierto puede cerrarse y mantiene el aviso fuera. Una aceptación antigua no restaura un bot retirado ni una espera iniciada.
4. **Una persona contra bots:** sin B, A añade mezcla Fácil/Difícil, selecciona genérica v2, revisión 5 s (repetir con 0) e inicia. Primer bot incorporado abre solo; A recibe únicamente su mano. BF/BD identifica bots en mesa PC; móvil y resultados conservan Bot · Fácil/Difícil. No reloj humano, presencia o control manual del bot. Completar cada turno humano antes del límite; probar Detalles, ambos órdenes carta/dirección, varias pestañas y recarga. Se ejecutan reposición y tres rondas finales; resultados permiten volver al inicio y crear otra sala sin reiniciar.
5. **Observador:** A desmarca anfitrión juega y añade dos bots. Seleccionar baraja no permite iniciar: falta humano jugador. Retirar uno si hace falta y entrar B; A puede iniciar con B + bots si todos los humanos están conectados. A observa sin mano/score y no cuenta para inactividad. Verificar la misma ejecución y resultados.
6. **Timeout/automático:** configurar 15 s y dejar vencer un turno propio; primera advertencia se reinicia solo con manual completa válida. Segundo consecutivo pasa a automático permanente. Mano/Detalles siguen visibles, acciones deshabilitadas. Cerrar todas las pestañas, mantener servidor vivo y recuperar: termina ronda/revisión por todos HUMAN automáticos; los bots no prolongan la partida. En desempate ya iniciado se reconoce al vencedor sin puntos nuevos.
7. **Final/desempate determinista:** `npx playwright test tests/browser/bots.spec.ts --grep 'final/desempate legal'` usa paquetes/permutaciones temporales completos y actuaciones legales, nunca altera genérica. Cubre 2–5 mixtos, manos 3/2/1, cinco empatados a 10 y desempate solo entre bots con humano ACTIVE fuera. Una partida normal sin empate no acredita esa rama. `--grep 'inactividad|incierto|observador'` comprueba esos recorridos aparte con reloj sustituido o pérdida deliberada de ack.
8. Revisar 360/390/1280, teclado/tacto, foco al cerrar/retirar, errores/pending por control y scroll. Para limpiar todos los ensayos detenidos, reiniciar servidor: pierde toda memoria, sesiones y resultados. La retención de 30 minutos desde publicación final no se renueva por leer; las pruebas de ese borde usan tiempo controlado.

Registrar los recorridos humanos realizados o pendientes con fecha/versión/perfiles/dispositivos y resultados. La evidencia B09 distingue políticas/dominio, tiempo controlado, HTTP/Socket.IO reales, automatización Chrome y partida genérica 2 con reloj/planificador/entropía normales. No acredita media hora real, móviles físicos, equilibrio, comprensión con usuarios o despliegue; C09–C10 siguen parciales. Los recorridos humanos del autor permanecen pendientes hasta que se realicen.

### Operaciones de bots

`room:bot-add` recibe `{ requestId, roomId }` y crea HARD; `room:bot-difficulty` añade `botId, difficulty` (EASY/HARD); `room:bot-rename` añade `botId, name`; `room:bot-remove` añade solo `botId`. Todas las propiedades requeridas y ninguna adicional. Ack seguro `{ ok: true, room, botId }`; error BOT_NOT_AVAILABLE para objetivo humano/ajeno/retirado, permisos/fase/capacidad vigentes. Mismo ID/tipo/payload recupera aceptación con vista propia **del anfitrión**, incluso tras inicio/resultado, sin reinsertar o repetir actividad. Aviso BOT_REMOVED no simula salida humana. Vistas distinguen HUMAN/BOT y botDifficulty nulo/EASY/HARD; bot role/presence/playStatus nulos. Jugada pública añade modo BOT, turno bot timing/openingSelection nulos; la mano de bot nunca se envía. No HTTP ni endpoint para activar/avanzar bots. NORMAL, minúsculas, valores desconocidos, tipos incorrectos y campos ausentes/adicionales producen INVALID_INPUT sin cambiar nivel/plaza/orden/actividad.

Tras actualizar, detener la instancia anterior y arrancar la compilación vigente: el reinicio pierde salas/sesiones/resultados en memoria, sin migración de niveles. Un cliente antiguo que envíe NORMAL recibe rechazo; debe recargar el cliente actual. Las sesiones nuevas recuperan EASY/HARD con F5, reconexión y varias pestañas sin reiniciar el servidor.

## Revisar B11: mesa PC 02

La [evidencia B11](docs/sdd/BLOQUE_11_AJUSTE_MESA_PC_02.md#cierre-técnico--06102026) registra verificación técnica, medidas/capturas y límites históricos. La revisión vigente sigue B12, descrita debajo: cuatro cartas públicas completas y quinta lateral, encabezados compactos y scroll vertical permitido. El objetivo anterior B11 fue **1800×1600 CSS px al 100 %** y carta **230×321** en juego normal; una pantalla física de 1920×1080 no ofrece esa altura útil. No reducir zoom para simular el encuadre.

1. Desde esta carpeta ejecutar `npm run build` y `npm run start`; detener antes con Ctrl+C una instancia anterior si ocupa el puerto. Abrir `http://127.0.0.1:3000` con perfiles A/B independientes y una segunda pestaña de A. Seleccionar genérica 2 explícitamente, turno 60 s y revisión 5 s; iniciar con ambos conectados. Reiniciar pierde toda la memoria; F5 conserva la misma partida.
2. A zoom100 %, registrar área útil real del navegador, pantalla/escala/barras y versión. Revisar jugadores/Mesa arriba e indicadora/mano/turno debajo: cartas completas, datos de baraja/ronda/mazo, acciones exteriores, reloj, dirección y leyenda. En PC el abridor está sombreado, «Juega» identifica al activo y BF/BD significa bot Fácil/Difícil. No se destaca la mejor carta.
3. Probar carta→dirección y dirección→carta; la pulsación o Enter/Espacio en «Jugar carta» actúa una vez. Detalles/Escape devuelve foco y no juega; arrastrar/deslizar tampoco. Comparar icono propio con fila naranja activa y Dato/J, incluso cuando coinciden. Revisar privacidad/selección propia, F5/otra pestaña, reloj sin reinicio, revisión y mano variable. Completar turnos a tiempo; para repetir tras resultados, volver al inicio y crear otra sala.
4. Añadir jugadores/bots Fácil/Difícil hasta cinco plazas para revisar cinco cartas públicas. Para observador usar A observando y B/C jugadores desde perfiles independientes: A no tiene mano, aparece aparte con (O) y «Observando». Repetir revisión con 0 y comprobar avisos de ganador/timeout/automático sin ocultar datos.
5. Abrir las capturas equivalentes [anteriores](playwright-report/b11/before/5-subsequent-viewport.png) y [posteriores](playwright-report/b11/after/5-subsequent-viewport.png), además de los demás pares/JSON del cierre. Se generan localmente; no forman parte del clon Git. Registrar conformidad visual o diferencias y el scroll observado en el equipo real. A 390×844 y 1280×800 se conserva acceso, con scroll vertical residual; textos excepcionales pueden aumentar altura de carta sin recortar unidades ni reducir imágenes/letra.

Reproducir comprobaciones B11 y regresiones seleccionadas sobre la compilación vigente:

```powershell
npm run check
npm run test:browser -- --workers=2 tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/bots.spec.ts
```

La automatización usa viewport de referencia y conexiones reales con tiempo sustituido en los casos de comparación; otros recorridos normales usan adaptadores/entropía normales. No acredita una prueba humana, dispositivos físicos o encuadre en otras resoluciones. Las adaptaciones siguientes necesitan su acuerdo y C09–C10 siguen parciales.

## Revisar B12: mesa centrada 03

La aprobación visual del autor queda separada de la [evidencia técnica B12](docs/sdd/BLOQUE_12_MESA_CENTRADA_03.md). No configurar una altura artificial ni ocultar barras para aparentar encuadre; registrar área real y zoom 100 %. El modo centrado necesita 1400 px útiles, considerando la barra vertical. Si falta ancho, mantiene la adaptación anterior.

1. Compilar con `npm run build`, detener con Ctrl+C una instancia anterior si ocupa el puerto 3000 y arrancar `npm run start`. Abrir `http://127.0.0.1:3000` en dos perfiles independientes A/B y otra pestaña del mismo perfil A. Genérica 2 se selecciona explícitamente; turno de 60 s y revisión de 30 s facilitan consultar sin alterar los plazos del producto. Reiniciar pierde memoria; F5 recupera la misma partida.
2. Con ancho suficiente, revisar contenedor centrado de 1400 px, cuadrícula de 1368 y carta de 230×321. Indicadora/mano tienen cartas alineadas, «Tu mano» centrado y ya no hay línea «Atributo indicador: …» sobre la indicadora. Atributo activo, Dato/J/unidades/icono propio y Detalles siguen completos.
3. Probar las aperturas carta→dirección y dirección→carta, botón exterior/Enter/Espacio y Detalles/Escape. La parcial recuperada en otra pestaña no juega ni renueva el reloj; ningún gesto de consulta envía cartas. Comprobar turno posterior y mano en adquisición, también con una/dos cartas.
4. Para cinco jugadores, añadir invitados o bots con los controles existentes. En turno, cuatro jugadas públicas caben enteras y se ordenan por J del atributo activo: ALTO descendente/BAJO ascendente. Autores permanecen unidos a su carta; no se anuncia un ganador provisional.
5. Con quinta jugada, Mesa conserva ancho y muestra «5 cartas · desliza →». Llegar a «Cartas públicas de Mesa» con Tab y usar flechas horizontales hasta consultar la quinta/autor/Detalles. Probar rueda horizontal o gesto táctil; mano/página no se desplazan horizontalmente ni se juega. Abrir Detalles, incorporar una jugada desde otra sesión y cerrar: misma carta y retorno de foco. Durante revisión el orden corresponde al ranking confirmado.
6. Recargar A/B y usar otra pestaña: misma partida/orden/identidad, sin enviar otra jugada ni reiniciar plazos. Repetir con revisión de cero segundos y positiva. Para observador, A observa, B/C juegan desde perfiles independientes: estado ocupa cuatro columnas y A no tiene mano/acciones ficticias.
7. Comparar [antes](playwright-report/b12/before/1920x1080-turn-full.png) y [después](playwright-report/b12/after/1920x1080-turn-full.png), además de revisión/quinta y JSON del cierre. Artefactos locales ignorados; no vienen en el clon Git. Registrar versión, viewport/pantalla/escala/barras, aprobación o diferencias visuales y desplazamiento residual. Las muestras automatizadas de 1920×1080/950 no acreditan una pantalla física del autor ni un encuadre universal.

Comprobaciones seleccionadas sobre build vigente:

```powershell
npm run check
npm run test:browser -- --workers=2 tests/browser/centeredTable03.spec.ts tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/bots.spec.ts
```

E1/E2 de orden y los estados comparables se reproducen con genérica 2 copiada a una instalación temporal y una permutación legal sustituida; no se modifica contenido editorial ni se publica esa instalación. Las conexiones son reales y los plazos controlados. Otras regresiones usan adaptadores/entropía normales. Prueba humana, equipo físico y aprobación visual se registran solo cuando se realicen. C09–C10 continúan parciales.
