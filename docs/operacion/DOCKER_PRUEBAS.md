# Docker de KARTA3 — Pruebas

Preparación del 08/10/2026. Alcance: `pruebas.karta3.com`; [evidencia T05](../sdd/BLOQUE_T05_EMPAQUETADO_PRUEBAS.md). Los comandos de operación siguientes los ejecutará el autor después de revisar/publicar el artefacto y preparar DNS/firewall. Este documento no acredita despliegue.

## Archivos y configuración

- `Dockerfile`: construcción exclusivamente desde `APP/karta3`, Node **24.19.0 bookworm-slim fijado por digest**, lockfile, `npm run check` y catálogo generado. Dependencias nativas instaladas en Linux; imagen final con dependencias de producción, compilado y copias aprobadas de barajas. Usuario `node`, un proceso de juego, sin Vite/observadores. La comprobación de salud lee `/api/decks`: no crea sesión ni renueva salas.
- `.dockerignore`: lista admitida de fuentes/pruebas/configuración de construcción; excluye `.git`, configuración privada, documentos, artefactos Windows, catálogo previo y repositorios externos. No construir desde el directorio padre.
- `deploy/compose.yaml`: app sin puertos publicados, red `game` interna; Caddy también dispone de `edge` para ACME y publica **TCP 80/443**. Nombre único de app impide escalarla con Compose. Memoria por entorno, sin clúster/réplicas. Archivos/barajas de app de solo lectura; `/tmp` temporal. Logs `local`, cinco archivos de 10 MB.
- `deploy/Caddyfile`: HTTPS/redirección automáticos, proxy de interfaz/API/Socket.IO; Host/Cookie/Upgrade conservados. API administrativa desactivada, sin `file_server`, contraseña de jugadores, socket Docker o puertos de gestión públicos. `X-Robots-Tag` pide no indexar Pruebas; no es autenticación.
- `deploy/.env.example`: configuración sin secretos; copiar a `deploy/.env`. Completar `KARTA3_IMAGE` con el **digest comprobado** entregado por GitHub. Caddy **2.11.7-alpine** también fijado por digest.

`KARTA3_DOMAIN` configura Caddy al arrancar. `NODE_ENV` configura el servidor al arrancar; en Pruebas HTTPS mantener **production**, que activa cookie Secure y origen HTTPS. `KARTA3_ENV` identifica el entorno en etiquetas de Compose; no cambia reglas ni añade indicadores a la interfaz. `COMPOSE_PROJECT_NAME` identifica la pila/volúmenes, mantenerlo estable en actualizaciones/reversiones. HOST=0.0.0.0/PORT=3000 solo dentro de Docker; local sigue 127.0.0.1. Node no carga por sí solo los archivos `.env`: Compose suministra estos valores.

La aplicación actual **no requiere secreto de configuración**: tokens aleatorios de sesión en memoria; no existe clave fija que incluir. `.env.private` es un archivo opcional, ignorado, para valores privados que APP realmente consuma, suministrados al arrancar. No poner allí claves SSH ni tokens del registro. Las credenciales de descarga se gestionan con Docker/Manager y quedan fuera de la imagen/contenedor de juego; SSH/panel se protegen en su ámbito administrativo. Certificados y claves ACME están en `caddy_data`, que requiere conservación protegida. No compartir salidas completas de `docker compose config`/`docker inspect` cuando haya secretos; usar validación silenciosa.

El frontend usa rutas relativas del mismo origen; ninguna dirección/entorno se hornea mediante VITE_*. La imagen comprobada podrá promoverse al futuro Play por **el mismo digest**, con configuración y memoria propias. Este Compose prepara solo Pruebas: al añadir Play deberá ampliarse el Caddy compartido, sin arrancar otra pila que compita por 80/443. No se ha configurado Play.

## Construcción y comprobación de la imagen (equipo Linux/CI)

Desde la raíz **APP/karta3**, reemplazar SHA_REVISADO por el commit exacto; Docker debe ejecutar contenedores Linux. No se necesitan ASSETS/TFM/MASTER.

```sh
docker build --platform linux/amd64 --build-arg VCS_REF=SHA_REVISADO -t karta3:SHA_REVISADO .
docker run --rm --entrypoint node karta3:SHA_REVISADO -p 'process.version + " " + process.platform + " " + process.arch'
docker run --rm --entrypoint node karta3:SHA_REVISADO --input-type=module -e 'import sharp from "sharp"; await sharp({create:{width:2,height:2,channels:3,background:"blue"}}).png().toBuffer(); console.log("sharp Linux: OK")'
```

Construir no demuestra el arranque de la imagen final: comprobar usuario, etiqueta de revisión, salud/catálogo y huellas dentro de esa imagen; genérica **formato 1/contenido 2/disponible**. Los SHA-256 aprobados siguen en [activación](../sdd/ACTIVACION_GENERICA_V2.md). No alterar genérica para probar catálogo vacío ni añadir fixtures al entorno normal.

Ensayo CI aislado con el mismo Compose: archivo `.env` temporal con proyecto `karta3-ci`, imagen local `karta3:SHA_REVISADO` **solo para ese ensayo previo a publicar**, `KARTA3_DOMAIN=localhost`, modo production y Caddy fijado. No reutilizar los volúmenes de Pruebas. Levantar y ejecutar `tests/browser/proxy.spec.ts` desde la compilación del mismo commit con base `https://localhost` y `KARTA3_HTTP_BASE_URL=http://localhost`. Solo para esa CA local, `KARTA3_TEST_INSECURE_TLS=1`; no equivale a validar un certificado público. Verificar además app sin puerto host, una instancia, `/api/decks` seguro/JSON privados 404, recursos/Socket.IO reales, huellas y reinicio. Tras publicar, volver a comprobar la imagen **por el digest entregado**, sin reconstruirla; conservar relación commit → imagen → digest y la anterior. El hilo GitHub preparará esta CI/publicación; T05 no modifica workflows ni publica.

## Primer arranque de Pruebas (autor, después de publicación)

1. Copiar `compose.yaml`, `Caddyfile` y `.env.example` de la versión revisada a una carpeta de operación protegida. Copiar el ejemplo a `.env`, completar **KARTA3_IMAGE por digest**, conservar CADDY_IMAGE/NODE_ENV y dominio de Pruebas. Guardar configuración privada fuera de Git. Preparar acceso al registro privado mediante el mecanismo acordado; no pegar tokens en chat/comandos versionados.
2. Confirmar A/AAAA y TCP 80/443 libres/enrutados a este VPS; no cambiar `@`/`www`. Desde esa carpeta:

```sh
docker compose --env-file .env -f compose.yaml config --quiet
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml run --rm --no-deps caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose --env-file .env -f compose.yaml up -d --wait
docker compose --env-file .env -f compose.yaml ps
docker compose --env-file .env -f compose.yaml logs --tail=80 app caddy
```

3. Confirmar imagen/digest/revisión servidos y catálogo; HTTP redirige a HTTPS, certificado público válido, sin petición de contraseña. Dos perfiles independientes: crear/entrar, seleccionar genérica 2, iniciar, jugar, F5/segunda pestaña, consultar mano propia y recuperar resultado. Observar WSS en navegador. Cookie Secure/HttpOnly/SameSite Strict, tercero sin permisos, origen extraño rechazado. GET de ambos JSON de `barajas/generica` debe ser 404 y no HTML. No exponer 3000/2019/Docker API. La validación automática no sustituye el recorrido humano.

## Actualización y reversión

Antes de actualizar, conservar **digest anterior**, archivos/configuración compatibles, versión de Caddy y acceso real a ambas imágenes. Avisar: **recrear app elimina salas, partidas, resultados y sesiones en memoria**; no hay migración ni continuidad de partidas.

Modificar únicamente KARTA3_IMAGE en `.env` al nuevo digest comprobado; validar/pull como arriba. Con configuración de proxy igual:

```sh
docker compose --env-file .env -f compose.yaml up -d --no-deps --wait app
```

Repetir las comprobaciones de arranque/HTTPS/catálogo/dos sesiones. Si falla, reponer el **digest y configuración anterior** y ejecutar el mismo comando. No reconstruir, editar dentro del contenedor ni borrar volúmenes. Si cambian Compose/Caddy, usar el conjunto de archivos compatibles y recrear lo afectado de forma deliberada; puede cortar WebSocket. Con `admin off` no usar `caddy reload`.

En el primer despliegue no existe una imagen anterior de KARTA3 operativa a la que volver: detener el proyecto y conservar configuración/volúmenes/logs para corregirlo. `docker compose stop` conserva certificados. **No usar `down -v` ni prune** para actualizar/revertir. Persistencia de certificados no es backup; restauración del VPS/DNS/firewall siguen su plan separado. Reversión y restauración reales pendientes de ensayo por el autor.

## Ensayo local de Caddy sin Docker

Opcional: Caddy oficial portable, verificado contra su checksum, fuera de PATH/instalaciones globales. Tras `npm run check`, indicar su ejecutable mediante CADDY_BINARY y ejecutar `node --import tsx tests/support/caddyBrowserServer.ts`. Usa app compilada con production, HTTP 3080/HTTPS 3443 y almacenamiento temporal ignorado; **no instala la CA**. Muestra READY; en otra terminal con Node 24.19.0:

```powershell
$env:KARTA3_BASE_URL='https://localhost:3443'
$env:KARTA3_HTTP_BASE_URL='http://localhost:3080'
$env:KARTA3_TEST_INSECURE_TLS='1'
npm run test:browser -- tests/browser/proxy.spec.ts --workers=1
```

Pulsar `q` en la primera terminal para detener solo los procesos propios. Este ensayo prueba Caddy/HTTPS/sesiones/Socket.IO reales en Windows, **no la imagen Linux ni ACME público**. No activar la excepción TLS en la comprobación de Pruebas con su certificado público. Evidencias realmente ejecutadas y pendientes constan en T05.

Fuentes técnicas consultadas: [Node oficial en Docker](https://github.com/nodejs/docker-node/blob/main/README.md), [Caddy oficial](https://hub.docker.com/_/caddy), [Host/WebSocket del proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [HTTPS automático](https://caddyserver.com/docs/automatic-https), [construcción por etapas](https://docs.docker.com/build/building/multi-stage/).
