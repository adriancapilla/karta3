# KARTA3

KARTA3 es un proyecto de adaptación de un juego de cartas a una aplicación web multijugador, desarrollado como Trabajo Fin de Máster.

La aplicación se construye de forma incremental, con especificaciones, pruebas y documentación de cada entrega. Utiliza TypeScript, React y un servidor Node.js con Express y Socket.IO.

## Estado actual

Actualmente permite crear una sala de espera, compartir su código e incorporar participantes desde navegadores independientes. La lista se actualiza en tiempo real y cada participante puede cambiar su nombre o salir. También gestiona la reconexión temporal y el cierre de salas por inactividad.

El bloque 04 añade validación común de barajas, preparación del catálogo y consulta pública de resúmenes. La [incorporación de genérica 2](docs/sdd/ACTIVACION_GENERICA_V2.md) conserva formato 1, incorpora contenido 2 aprobado y `available: true`: el catálogo normal ofrece únicamente su resumen seguro, con portada nula. B04/B05 conservan sus evidencias históricas de contenido 1/no disponible.

El bloque 05 permite seleccionar/quitar una versión disponible de baraja, participar u observar como anfitrión, configurar tiempo de turno, desempate y revisión. Cada control se confirma de forma independiente y los invitados consultan los valores aceptados.

El [bloque 06](docs/sdd/BLOQUE_06_INICIO_Y_MESA_INICIAL.md) añade inicio por el anfitrión con 2–5 humanos jugadores, todos los miembros conectados y una versión disponible seleccionada. Prepara una única mesa inicial: tres cartas privadas por jugador, indicadora, abridor, atributo, ronda 1 y puntuaciones cero. Recargar recupera el mismo reparto; el anfitrión observador recibe solo información pública. **Todavía no se pueden ejecutar turnos ni jugar cartas.** Los tiempos y el desempate configurados se conservan como datos.

Todo el estado se mantiene en memoria de un proceso. **Reiniciar el servidor elimina salas, partidas y sesiones.** La mesa B06 no tiene salida/cierre/cancelación: para probar otra partida hay que reiniciar el servidor. Desconectar conserva participantes y cartas, sin reserva, caducidad ni automático de juego; esos requisitos del MVP siguen pendientes de ejecución.

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

- `server/domain/deck.ts`: tipos de baraja y validador puro reutilizable, sin formato, archivos ni publicación.
- `server/application/`: `Room` conserva configuración, plazas, presencia y plazos con tiempos explícitos; `RoomUseCases.configure` autoriza, consulta `PublishedDeckVersions` y deduplica; `WaitingLifecycle` procesa vencimientos. `DeckCatalog`/`ListDecks` ofrecen resúmenes seguros.
- `server/infrastructure/`: repositorio y solicitudes deduplicadas en memoria, sesiones y último fin automático propio, generación, reloj monotónico, planificador cancelable, HTTP Express y Socket.IO. El transporte cuenta conexiones autenticadas; la aplicación decide sus consecuencias. La cookie es `HttpOnly`, limitada al host y `SameSite=Strict`; usa `Secure` cuando `NODE_ENV=production`.
- `server/composition/` y `server/main.ts`: eligen adaptadores, los conectan, sirven `dist` e inician el proceso.
- `shared/contracts/`: formato público de la sala, respuestas y mensajes de tiempo real, compartido con el cliente.
- `src/`: React/Vite; `api.ts` y `socket.ts` transportan, `useRoomFlow.ts` coordina revisiones/motivos. `RoomConfiguration.tsx` muestra catálogo/ficha/controles; `useRoomConfiguration.ts` y `configurationState.ts` identifican pendientes por control. `screens.tsx`/`ExpiryWarning.tsx` presentan sin decidir permisos, plazas ni cierres.
- `server/infrastructure/decks/`: parser JSON estricto, esquema/coherencia, recursos decodificados y catálogo en memoria. `sharp` 0.35.5 es dependencia del servidor para PNG/JPEG/WebP; no va al cliente.
- `tools/decks.ts`: analiza argumentos y delega a composición las operaciones comunes de validación/preparación.
- `tools/check-architecture.mjs`: comprueba imports, reexportaciones, aliases y ciclos del código de producción, incluidos comandos en la raíz de `tools/`.
- `tests/browser/`: recorridos en Chrome a 390 y 1280 píxeles, con sesiones independientes.
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

Registrar fecha, versión servida, navegadores/perfiles, acciones, resultados y límites. Estas instrucciones no acreditan ejecución manual. C09–C10 siguen parciales: B06 comprueba validación/uso inicial, indicadora y manos privadas; ejecución completa, cartas jugadas/resultados y comprensión con usuarios siguen pendientes.

### Prueba manual B06: dos jugadores y observador

```powershell
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
npm ci
npm run check
# Detener con Ctrl+C la instancia anterior antes de arrancar la compilación actual:
npm run start
```

1. Abrir `http://127.0.0.1:3000` en dos navegadores o perfiles con cookies independientes. A crea y B entra con el código y nombre «Ana». Una segunda pestaña de A comparte su identidad.
2. Sin selección, «Iniciar partida» está deshabilitado para A; B no tiene ese botón. A selecciona explícitamente «KARTA3 — Baraja genérica · v2» y espera confirmación. No es necesario llenar cinco plazas ni marcar listo.
3. A inicia una vez. A, su segunda pestaña y B deben recibir la mesa sin F5: B abre, tres cartas propias en cada sesión, una indicadora común, ronda 1, dirección «Sin elegir», mazo 51, cero puntos y jugadas vacías. No hay reloj ni controles para jugar, salir o cerrar.
4. Abrir Detalles de indicadora/mano con teclado y cierre/Escape; comprobar característica/nota si existen y tres filas con Jugable y Dato separados. A 360/390 px la indicadora es compacta y la mano se desplaza dentro de su fila; a 1280 px se muestra completa. La genérica usa icono decorativo, sin imagen de sustitución.
5. Recargar ambos, abrir otra pestaña o volver a `/`: mismo Game, identidad, orden, configuración y cartas en adquisición. Cerrar una pestaña con otra conectada conserva presencia. Perder todas muestra «Sin conexión» a los demás; recuperar conserva el reparto. En B06 esa ausencia no libera plazas ni ejecuta automático.
6. **Reiniciar entre ensayos:** Ctrl+C en la terminal del servidor y `npm run start`. A y B recuperan ausencia/sesión nueva, eliminan la mesa privada y vuelven a portada, sin ganador ni causa inventada. Se pierden también las otras esperas del proceso.
7. Ensayo de observador: crear nueva sala en A y desmarcar «El anfitrión juega». Entrar B y C en otras dos sesiones independientes, seleccionar genérica 2 e iniciar desde A. B abre, B/C reciben sus manos, mazo 51. A aparece aparte como «Anfitrión · Observador», con «Observando», sin mano ni puntuación de jugador. Recargar las tres sesiones y comprobar recuperación. Reiniciar al terminar.

Ante pérdida de confirmación del inicio, la interfaz informa de incertidumbre y recupera el estado antes de habilitar un reintento del mismo envío. Recargar/reconectar nunca envía un inicio automáticamente. Registrar manualmente fecha, versión, perfiles, dispositivos, resultados y límites: los recorridos automatizados no acreditan revisión humana ni móvil físico.

## Probar el ciclo de vida de la espera

1. Crea una sala y entra con otro perfil. Abre una segunda pestaña del invitado: cerrar una conserva presencia mientras la otra esté conectada.
2. Interrumpe la conexión del invitado. La otra sesión ve «Reconectando». Si vuelve antes de 30 segundos desde la detección, conserva identidad/plaza/orden; después su plaza se libera y deberá entrar de nuevo.
3. Si vence la ausencia del anfitrión, todos vuelven a portada con el motivo. No se transfiere el control. Crear por HTTP sin socket del anfitrión concede el mismo margen inicial.
4. Sin cambios válidos aparece una franja al minuto 29 y la sala cierra al 30. Una nueva incorporación, salida voluntaria o nombre realmente distinto renueva. Leer, copiar, recargar, reconectar o repetir solicitudes no renueva; tampoco una retirada automática.

Socket.IO usa `pingInterval=5000` y `pingTimeout=5000` ms. La reserva empieza cuando el servidor detecta la última pérdida; una red que deja de entregar paquetes puede añadir retraso de detección. El contador de caducidad usa referencia del servidor y tiempo monotónico transcurrido en el navegador: llegar a cero solo solicita confirmación. No hay controles públicos para acelerar estos plazos.

`NODE_ENV=production` exige HTTPS delante del servidor para que el navegador acepte la cookie `Secure`. El servidor escucha en `127.0.0.1` y está preparado para quedar detrás del proxy del despliegue futuro. Docker Compose, Caddy y el VPS pertenecen a hitos posteriores; este bloque no los despliega ni los acredita. GitHub Actions ejecuta las comprobaciones generales, incluida la preparación de barajas, y los recorridos Chrome existentes; las referencias y resultados reales de cada publicación constan en el documento operativo.

## Contrato HTTP actual

| Método y ruta | Uso |
|---|---|
| `GET /api/decks` | Resúmenes de barajas disponibles; no crea sesión ni renueva salas; `Cache-Control: no-store`. |
| `GET /api/rooms/current` | Establece sesión si falta y devuelve su espera/mesa propia o `null`; incluye `ended` si consta un último fin automático propio de espera. |
| `POST /api/rooms` con `{}` | Crea una espera o recupera la sala/mesa ya vinculada al anfitrión. |
| `GET /api/rooms/:id` | Devuelve la sala a un participante reconocido. |
| `PATCH /api/rooms/:id/name` con `{ "name": "…" }` | Valida y cambia el nombre del solicitante reconocido. |
| `DELETE /api/rooms/:id` | Cierra la espera propia. |

Los fallos devuelven `{ "error": { "code": "…", "message": "…" } }`, con causas estables como `INVALID_INPUT`, `ROOM_NOT_AVAILABLE`, `FORBIDDEN` y `SESSION_REQUIRED`. No se transmiten trazas al navegador.

El canal Socket.IO acepta `room:resume` (`{}`), `room:join` (`{ requestId, code, name }`), `room:leave` (`{ requestId, roomId, participantId }`), `room:configure` (`{ requestId, roomId, change: { field, value } }`) y **`room:start` (`{ requestId, roomId }`)**, y comunica `room:state`, `room:left` y `room:closed`. No existe ruta HTTP de inicio. Los IDs visibles de sala y participante no sustituyen a la cookie de sesión. [B05 §5](docs/sdd/BLOQUE_05_CONFIGURACION_SALA.md) fija los cinco cambios y sus tipos exactos; [B06 §5](docs/sdd/BLOQUE_06_INICIO_Y_MESA_INICIAL.md) fija inicio y vistas por fase.

`WAITING` conserva `presence`, `lifecycle: { serverNow, expiresAt, warning }`, settings aceptados con id/versión de baraja y `selectedDeck` (ficha o null). Solo un cambio efectivo renueva la espera. `IN_GAME` elimina lifecycle de espera, fija preparación y conserva índices de código/sesión: entrega parte pública y únicamente la mano propia, o `[]` al observador. Nuevas entradas, nombre/configuración/salida/cierre se rechazan por fase; conocer el código nunca permite iniciar ni recuperar mano ajena. Los callbacks antiguos de espera no afectan a la mesa. Expulsión, bots, turnos, resultados y despliegue siguen pendientes.
