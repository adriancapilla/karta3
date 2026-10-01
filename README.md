# KARTA3

KARTA3 es un proyecto de adaptación de un juego de cartas a una aplicación web multijugador, desarrollado como Trabajo Fin de Máster.

La aplicación se construye de forma incremental, con especificaciones, pruebas y documentación de cada entrega. Utiliza TypeScript, React y un servidor Node.js con Express y Socket.IO.

## Estado actual

Actualmente permite crear una sala de espera, compartir su código e incorporar participantes desde navegadores independientes. La lista se actualiza en tiempo real y cada participante puede cambiar su nombre o salir. También gestiona la reconexión temporal y el cierre de salas por inactividad.

La configuración y el desarrollo de la partida todavía están pendientes. El estado de las salas se mantiene en memoria y se pierde al reiniciar el servidor.

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

Abrir `http://127.0.0.1:5173`. Vite sirve la interfaz y envía `/api` y `/socket.io` al servidor en `127.0.0.1:3000`. Para probar la entrada, usa otro navegador o perfil con cookies independientes; una segunda pestaña del mismo perfil representa a la misma persona. El estado reside en la memoria del servidor; reiniciarlo elimina las salas. No hacen falta cuentas ni variables de entorno para desarrollo local.

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

Estas pruebas usan Chrome y el servidor local en `127.0.0.1:3000`; incluyen contextos aislados que se comunican mediante Socket.IO. Reinicia `npm run start` después de cambiar y compilar código del servidor. Los recorridos de caducidad levantan además instancias de esa misma compilación con reloj/planificador sustituidos, sin controles de prueba públicos. El recorrido de reserva real espera los 30 segundos originales y puede tardar cerca de un minuto. La evidencia actual está en [`docs/sdd/BLOQUE_03_CICLO_VIDA_ESPERA.md`](docs/sdd/BLOQUE_03_CICLO_VIDA_ESPERA.md); los bloques anteriores conservan sus registros históricos.

## Estructura y decisiones

- `server/application/`: `Room` conserva presencia, generaciones y plazos con tiempos explícitos; `RoomUseCases` autoriza acciones y deduplica; `WaitingLifecycle` procesa vencimientos, recuperaciones, avisos y limpieza mediante puertos. Las decisiones y escrituras son síncronas dentro de un único proceso Node.
- `server/infrastructure/`: repositorio y solicitudes deduplicadas en memoria, sesiones y último fin automático propio, generación, reloj monotónico, planificador cancelable, HTTP Express y Socket.IO. El transporte cuenta conexiones autenticadas; la aplicación decide sus consecuencias. La cookie es `HttpOnly`, limitada al host y `SameSite=Strict`; usa `Secure` cuando `NODE_ENV=production`.
- `server/composition/` y `server/main.ts`: eligen adaptadores, los conectan, sirven `dist` e inician el proceso.
- `shared/contracts/`: formato público de la sala, respuestas y mensajes de tiempo real, compartido con el cliente.
- `src/`: React/Vite; `api.ts` y `socket.ts` transportan, `useRoomFlow.ts` coordina revisiones/motivos y `screens.tsx`/`ExpiryWarning.tsx` presentan sin decidir permisos ni cierres.
- `tools/check-architecture.mjs`: comprueba imports, reexportaciones, aliases y ciclos del código de producción.
- `tests/browser/`: recorridos en Chrome a 390 y 1280 píxeles, con sesiones independientes.
- `docs/sdd/`: especificación y evidencia del bloque.

La creación, lectura, edición del nombre y cierre conservan HTTP. La entrada, salida y sincronización usan Socket.IO con la misma sesión; una respuesta incierta puede reintentarse con el mismo `requestId`. El estado en memoria permite una sola instancia del servidor; no hay persistencia ni sincronización entre procesos. El código visible localiza una sala, pero nunca autoriza a modificarla.

## Probar el ciclo de vida

1. Crea una sala y entra con otro perfil. Abre una segunda pestaña del invitado: cerrar una conserva presencia mientras la otra esté conectada.
2. Interrumpe la conexión del invitado. La otra sesión ve «Reconectando». Si vuelve antes de 30 segundos desde la detección, conserva identidad/plaza/orden; después su plaza se libera y deberá entrar de nuevo.
3. Si vence la ausencia del anfitrión, todos vuelven a portada con el motivo. No se transfiere el control. Crear por HTTP sin socket del anfitrión concede el mismo margen inicial.
4. Sin cambios válidos aparece una franja al minuto 29 y la sala cierra al 30. Una nueva incorporación, salida voluntaria o nombre realmente distinto renueva. Leer, copiar, recargar, reconectar o repetir solicitudes no renueva; tampoco una retirada automática.

Socket.IO usa `pingInterval=5000` y `pingTimeout=5000` ms. La reserva empieza cuando el servidor detecta la última pérdida; una red que deja de entregar paquetes puede añadir retraso de detección. El contador de caducidad usa referencia del servidor y tiempo monotónico transcurrido en el navegador: llegar a cero solo solicita confirmación. No hay controles públicos para acelerar estos plazos.

`NODE_ENV=production` exige HTTPS delante del servidor para que el navegador acepte la cookie `Secure`. El servidor escucha en `127.0.0.1` y está preparado para quedar detrás del proxy del despliegue futuro. Docker Compose, Caddy y el VPS pertenecen a hitos posteriores; este bloque no los despliega ni los acredita. GitHub Actions ha ejecutado las comprobaciones generales y los 18 recorridos Chrome; las referencias de ejecución constan en el documento operativo.

## Contrato HTTP actual

| Método y ruta | Uso |
|---|---|
| `GET /api/rooms/current` | Establece sesión si falta y devuelve su espera o `null`; incluye `ended` si consta un último fin automático propio. |
| `POST /api/rooms` con `{}` | Crea o recupera una sola espera por sesión. |
| `GET /api/rooms/:id` | Devuelve la sala a un participante reconocido. |
| `PATCH /api/rooms/:id/name` con `{ "name": "…" }` | Valida y cambia el nombre del solicitante reconocido. |
| `DELETE /api/rooms/:id` | Cierra la espera propia. |

Los fallos devuelven `{ "error": { "code": "…", "message": "…" } }`, con causas estables como `INVALID_INPUT`, `ROOM_NOT_AVAILABLE`, `FORBIDDEN` y `SESSION_REQUIRED`. No se transmiten trazas al navegador.

El canal Socket.IO acepta `room:resume` (`{}`), `room:join` (`{ requestId, code, name }`) y `room:leave` (`{ requestId, roomId, participantId }`), y comunica `room:state`, `room:left` y `room:closed`. Los IDs visibles de sala y participante no sustituyen a la cookie de sesión.

La vista añade `presence` y `lifecycle: { serverNow, expiresAt, warning }`. Las recuperaciones devuelven solo el último motivo propio cuando terminó automáticamente; este aviso mínimo se pierde al reiniciar y se limpia al crear/entrar de nuevo. Se cancelan tareas y se liberan índices al retirar/cerrar; se conservan resultados mínimos de deduplicación para rechazar solicitudes antiguas. Configuración, expulsión, bots, inicio, partida y despliegue siguen pendientes.
