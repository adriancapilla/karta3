# KARTA3 — bloque 01

Primera implementación local de KARTA3. Permite crear una sala de espera propia, recuperar la misma sala al recargar, copiar su código de seis cifras, cambiar el nombre del anfitrión y cerrar la sala con confirmación. Aún no permite entrar en salas ajenas ni iniciar una partida.

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

Abrir `http://127.0.0.1:5173`. Vite sirve la interfaz y envía `/api` al servidor Express en `127.0.0.1:3000`. El estado reside en la memoria del servidor; reiniciarlo elimina las salas. No hacen falta cuentas ni variables de entorno para desarrollo local.

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

Estas pruebas usan Chrome y el servidor local en `127.0.0.1:3000`. La evidencia histórica de E1–E7 está en [`docs/sdd/BLOQUE_01_CREACION_SALA.md`](docs/sdd/BLOQUE_01_CREACION_SALA.md); la verificación tras la separación de capas se registra en [`docs/sdd/BLOQUE_T01_REFACTOR_CREACION_SALA.md`](docs/sdd/BLOQUE_T01_REFACTOR_CREACION_SALA.md).

## Estructura y decisiones

- `server/application/`: modelo de sala y nombre, casos de uso, permisos, puertos y vista pública. La creación y el guardado son síncronos dentro de un único proceso Node.
- `server/infrastructure/`: repositorio en memoria, sesiones, generación con `node:crypto` y adaptador HTTP Express. La credencial opaca se envía en una cookie `HttpOnly`, limitada al host y `SameSite=Strict`; usa `Secure` cuando `NODE_ENV=production`.
- `server/composition/` y `server/main.ts`: eligen adaptadores, los conectan, sirven `dist` e inician el proceso.
- `shared/contracts/`: formato público completo de la sala y respuestas, compartido con HTTP y el cliente.
- `src/`: React/Vite; `api.ts` transporta peticiones, `useRoomFlow.ts` coordina la pantalla y `screens.tsx` presenta sin decidir permisos.
- `tools/check-architecture.mjs`: comprueba imports, reexportaciones, aliases y ciclos del código de producción.
- `tests/browser/`: recorrido en Chrome a 390 y 1280 píxeles.
- `docs/sdd/`: especificación y evidencia del bloque.

La API del primer recorrido usa HTTP conforme a la especificación del bloque. Socket.IO se incorporará cuando un bloque necesite cambios en tiempo real entre participantes. El estado en memoria permite una sola instancia del servidor; no hay persistencia ni sincronización entre procesos. El código visible localiza una sala, pero nunca autoriza a modificarla.

`NODE_ENV=production` exige HTTPS delante del servidor para que el navegador acepte la cookie `Secure`. El servidor escucha en `127.0.0.1` y está preparado para quedar detrás del proxy del despliegue futuro. Docker Compose, Caddy, GitHub Actions y el VPS pertenecen a hitos posteriores; este bloque no los despliega ni los acredita.

## Contrato HTTP actual

| Método y ruta | Uso |
|---|---|
| `GET /api/rooms/current` | Establece la sesión anónima si falta y devuelve la espera propia activa o `null`. |
| `POST /api/rooms` con `{}` | Crea o recupera una sola espera por sesión. |
| `GET /api/rooms/:id` | Devuelve únicamente la sala propia. |
| `PATCH /api/rooms/:id/name` con `{ "name": "…" }` | Valida y cambia el nombre propio. |
| `DELETE /api/rooms/:id` | Cierra la espera propia. |

Los fallos devuelven `{ "error": { "code": "…", "message": "…" } }`, con causas estables como `INVALID_INPUT`, `ROOM_NOT_AVAILABLE`, `FORBIDDEN` y `SESSION_REQUIRED`. No se transmiten trazas al navegador.
