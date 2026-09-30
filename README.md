# KARTA3 — bloques 01 y 02

Implementación local de la creación y entrada a una sala de espera. Dos navegadores con sesiones independientes pueden compartir un código de seis cifras, ver la lista sincronizada, cambiar su propio nombre y salir o cerrar con confirmación. Aún no se inicia una partida.

Las reglas para desarrollar los siguientes bloques están en [`AGENTS.md`](AGENTS.md). La [organización y dependencias](docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) explica cómo separar dominio, aplicación, infraestructura e interfaz a partir de este primer bloque.

## Requisitos e instalación

- Node.js 24 LTS y npm.
- Chrome instalado para las pruebas de navegador.

En PowerShell, entra primero en la carpeta que contiene `package.json` y `package-lock.json`:

```powershell
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
npm ci
npm run dev
```

Abrir `http://127.0.0.1:5173`. Vite sirve la interfaz y envía `/api` y `/socket.io` al servidor en `127.0.0.1:3000`. Para probar la entrada, usa otro navegador o perfil con cookies independientes; una segunda pestaña del mismo perfil representa a la misma persona. El estado reside en la memoria del servidor; reiniciarlo elimina las salas. No hacen falta cuentas ni variables de entorno para desarrollo local.

## Comprobaciones

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
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
npm run test:browser
```

Estas pruebas usan Chrome y el servidor local en `127.0.0.1:3000`; incluyen dos contextos aislados que se comunican de verdad mediante Socket.IO. La evidencia del incremento está en [`docs/sdd/BLOQUE_02_ENTRADA_SALA.md`](docs/sdd/BLOQUE_02_ENTRADA_SALA.md). E1–E7 y T01 conservan sus registros históricos en sus respectivos documentos.

## Estructura y decisiones

- `server/application/`: modelo de sala y nombre, casos de uso, permisos, puertos y vista pública. La creación y el guardado son síncronos dentro de un único proceso Node.
- `server/infrastructure/`: repositorio y solicitudes deduplicadas en memoria, sesiones, generación con `node:crypto`, adaptadores HTTP Express y Socket.IO. La credencial opaca se envía en una cookie `HttpOnly`, limitada al host y `SameSite=Strict`; usa `Secure` cuando `NODE_ENV=production`.
- `server/composition/` y `server/main.ts`: eligen adaptadores, los conectan, sirven `dist` e inician el proceso.
- `shared/contracts/`: formato público de la sala, respuestas y mensajes de tiempo real, compartido con el cliente.
- `src/`: React/Vite; `api.ts` transporta peticiones, `useRoomFlow.ts` coordina la pantalla y `screens.tsx` presenta sin decidir permisos.
- `tools/check-architecture.mjs`: comprueba imports, reexportaciones, aliases y ciclos del código de producción.
- `tests/browser/`: recorridos en Chrome a 390 y 1280 píxeles, con sesiones independientes.
- `docs/sdd/`: especificación y evidencia del bloque.

La creación, lectura, edición del nombre y cierre conservan HTTP. La entrada, salida y sincronización usan Socket.IO con la misma sesión; una respuesta incierta puede reintentarse con el mismo `requestId`. El estado en memoria permite una sola instancia del servidor; no hay persistencia ni sincronización entre procesos. El código visible localiza una sala, pero nunca autoriza a modificarla.

Cerrar una pestaña o perder conexión **no libera aún la plaza**. Tampoco se aplica todavía el margen de 30 segundos ni la caducidad automática de 30 minutos de la espera: pertenecen a otro bloque. La lista muestra inscripciones, no presencia en línea.

`NODE_ENV=production` exige HTTPS delante del servidor para que el navegador acepte la cookie `Secure`. El servidor escucha en `127.0.0.1` y está preparado para quedar detrás del proxy del despliegue futuro. Docker Compose, Caddy, GitHub Actions y el VPS pertenecen a hitos posteriores; este bloque no los despliega ni los acredita.

## Contrato HTTP actual

| Método y ruta | Uso |
|---|---|
| `GET /api/rooms/current` | Establece la sesión anónima si falta y devuelve la espera en que participa la sesión o `null`. |
| `POST /api/rooms` con `{}` | Crea o recupera una sola espera por sesión. |
| `GET /api/rooms/:id` | Devuelve la sala a un participante reconocido. |
| `PATCH /api/rooms/:id/name` con `{ "name": "…" }` | Valida y cambia el nombre del solicitante reconocido. |
| `DELETE /api/rooms/:id` | Cierra la espera propia. |

Los fallos devuelven `{ "error": { "code": "…", "message": "…" } }`, con causas estables como `INVALID_INPUT`, `ROOM_NOT_AVAILABLE`, `FORBIDDEN` y `SESSION_REQUIRED`. No se transmiten trazas al navegador.

El canal Socket.IO acepta `room:resume` (`{}`), `room:join` (`{ requestId, code, name }`) y `room:leave` (`{ requestId, roomId, participantId }`), y comunica `room:state`, `room:left` y `room:closed`. Los IDs visibles de sala y participante no sustituyen a la cookie de sesión.
