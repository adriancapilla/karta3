# Bloque técnico T01 — Separar responsabilidades de creación de sala

**Estado:** verificado localmente el 29/09/2026 para T1–T6, sin ampliar el bloque funcional 01.

**Objetivo:** poder ampliar la sala sin acumular reglas, almacenamiento y transporte en los mismos módulos. El resultado observable sigue siendo el bloque 01, con su contrato HTTP y E1–E7.

## 1. Fuentes y punto de partida

- [AGENTS.md](../../AGENTS.md), apartados de dependencias, código y verificación, y [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) §§2–5 y 7: dirección de dependencias, puertos, composición y posibilidad de un modelo `Room` en aplicación.
- [Bloque 01](BLOQUE_01_CREACION_SALA.md): comportamiento, decisiones del autor, criterios E1–E7 y evidencia histórica del 28/09/2026.
- [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md) §§1, 3 y 30: reglas puras y autoridad de `Game`; sesiones, transporte y persistencia quedan fuera del dominio del juego.
- [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) §§1, 3–5 y 14–16: sala, permisos, casos de uso, vistas y capacidades externas. [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md) §§2, 5–6, 10 y 14: tecnología, autoridad del servidor, sesiones, memoria y comprobaciones.

Se ha leído la implementación del árbol de trabajo sobre `8721ae2` (`main`): `server/roomStore.ts`, `server/app.ts`, `server/main.ts`, `src/api.ts`, `src/App.tsx`, configuración y pruebas. Las pruebas existentes son cuatro del almacén, cinco de HTTP y seis de navegador. Su lectura no equivale a una nueva ejecución. Al preparar este encargo ya había cambios locales en `README.md` y archivos nuevos `AGENTS.md` y `docs/arquitectura/`; deben conservarse.

La arquitectura permite separar responsabilidades al intervenir sobre estos archivos y este encargo solicita expresamente hacerlo. Se adopta un modelo puro de sala en **aplicación**, conforme a la guía; no hace falta introducir `Game` ni una jerarquía de dominio vacía. No hay una decisión funcional abierta necesaria para ejecutar este bloque.

## 2. Alcance y diagnóstico

Se refactorizan las responsabilidades de los dos módulos del servidor, su composición, sus pruebas y los tipos públicos duplicados. En el cliente se separan transporte, coordinación y presentación donde exista una responsabilidad real, conservando interacción, textos y aspecto.

| Situación observada | Resultado requerido |
|---|---|
| `roomStore.ts` contiene tres mapas, creación, permisos, nombres, valores iniciales, UUID, códigos aleatorios y construcción de vistas. | Modelo y casos de uso independientes del almacenamiento y de `node:crypto`; repositorio sin reglas de producto; proyección de vista en aplicación. |
| `AppError` une causas de aplicación con estados HTTP. | Errores internos sin estado HTTP; traducción de códigos, mensajes y estados en el adaptador. |
| `app.ts` define `SessionStore`, genera secretos, crea almacenes por defecto, lee entorno y atiende HTTP. | Adaptador HTTP recibe colaboradores; sesión concreta en infraestructura; selección de implementaciones y configuración en composición. |
| El cliente declara otro `RoomView` que omite `settings`; `App.tsx` coordina peticiones y renderiza todo el recorrido. | Un contrato público compartido que conserve la respuesta real; extracción mínima de coordinación o componentes cuando facilite entender el recorrido. |

No se añaden invitados, opciones de configuración, bots, partidas, Socket.IO, plazos de desconexión/caducidad, despliegue, persistencia ni nuevas librerías de estado. Los límites del bloque 01 siguen vigentes. Un defecto funcional ajeno al cambio se registra para otro encargo, sin corregirlo silenciosamente durante la refactorización.

## 3. Compatibilidad que debe conservarse

E1–E7 del bloque 01 se mantienen completos. Además, las decisiones HTTP ya implementadas dejan de ser elecciones libres del refactor:

| Método y ruta | Entrada y éxito actual | Errores o matices a conservar |
|---|---|---|
| `GET /api/rooms/current` | `200`, `{ room: RoomView \| null }`; establece sesión si no existe una credencial reconocida. | Una credencial antigua tras reinicio obtiene sesión nueva y `room: null`. Una sesión reconocida se reutiliza. |
| `POST /api/rooms` | JSON exactamente `{}` y sesión establecida; `201`, `{ room: RoomView }`. | Recuperar la espera existente también responde **201**. Cuerpo inválido: 400; sesión ausente: 401; agotamiento de candidatos de código: 503. |
| `GET /api/rooms/:id` | `200`, `{ room: RoomView }`, solo para su anfitrión. | `:id` es el identificador interno de sala, no el código de seis cifras. 401 sin sesión, 404 si no existe, 403 si pertenece a otra sesión. |
| `PATCH /api/rooms/:id/name` | JSON con una sola propiedad `name`; `200`, `{ room: RoomView }`. | Conserva validación y recorte del nombre. Estructura o nombre inválidos: 400; autorización y disponibilidad como en GET. |
| `DELETE /api/rooms/:id` | `204` sin cuerpo al cerrar. | Un segundo cierre devuelve **404 / ROOM_NOT_AVAILABLE**, no otro 204. Cerrar no revoca la sesión; permite crear otra sala. |

`RoomView` conserva **todos** los campos actuales: `id`, `code` como cadena de seis cifras, `status: 'WAITING'`, `participant: { id, name, role: 'HOST', isPlayer: true }` y `settings: { deckId: null, hostPlays: true, turnSeconds: 30, forceTieBreak: false, reviewSeconds: 5 }`. La API no devuelve entidades internas, `hostSessionId` ni credenciales. No se cambia `participant` por una colección ni se elimina `settings` porque el cliente aún no lo muestre.

Los fallos mantienen `{ error: { code, message } }`, los mensajes actuales y sus correspondencias: `INVALID_INPUT` 400 (415 para tipo de contenido no admitido), `ROOM_NOT_AVAILABLE` 404, `FORBIDDEN` 403, `SESSION_REQUIRED` 401, `CODE_EXHAUSTED` 503 e `INTERNAL_ERROR` 500. Se conservan el 404 de operaciones `/api` desconocidas y el 400 de JSON mal formado. El cierre sigue dejando la sala inaccesible; no se introduce una respuesta pública `CLOSED`.

También se preservan:

- Cookie `karta3_session`: `HttpOnly`, `SameSite=Strict`, `Path=/`, duración actual de 30 días, sin `Domain`; `Secure` solo con configuración de producción. Credencial opaca y asociación con identidad interna solo en el servidor.
- Validación de origen existente, incluida la excepción local de Vite; límite JSON de 4 kb y exigencia de `application/json` en los métodos actualmente comprobados. No se amplía CORS ni se cambian respuestas por una mejora de seguridad ajena al encargo.
- Orden de rechazo: middleware de transporte; estructura de cuerpo para POST/PATCH; sesión; existencia de sala; permiso; contenido del nombre. Por ejemplo, un nombre inválido no debe revelar a una sesión ajena un resultado distinto del rechazo por permiso.
- Rutas de interfaz `/` y `/sala/:id`, retorno automático, estados de carga, bloqueo de envíos repetidos, mensajes, copia y alternativa manual, edición y confirmación de cierre. Se mantienen las dos anchuras de navegador del bloque 01.

## 4. Responsabilidades de destino

Los nombres de archivos son orientativos; la asignación de responsabilidad es parte del encargo.

| Pieza y ubicación | Responsabilidad | Límite y comprobación |
|---|---|---|
| Modelo de sala en `server/application/` | Estado propio, anfitrión identificado por un ID interno, participante, configuración inicial, cambio de nombre y cierre. Validación pura del nombre con el comportamiento actual de `normalizeName`, incluido Unicode. | Recibe ID y código ya suministrados; no genera aleatoriedad, no guarda mapas, no conoce cookie/HTTP ni hereda de `RoomView`. Pruebas puras de creación, cambio válido/inválido y cierre. |
| Casos de uso en `server/application/` | Obtener espera actual, crear o recuperar, obtener sala propia, renombrar y cerrar. Resuelven existencia y autorización, invocan el modelo, coordinan repositorio y generación y devuelven resultados. | Reciben identidad interna, no `Request` ni credencial. Permisos se comprueban aquí incluso al invocar sin HTTP. Pruebas con sustitutos de puertos. |
| Proyección de vistas y errores de aplicación | Construir explícitamente la vista autorizada y expresar causas internas de fallo. | Devuelve copias de datos públicos; sin estado HTTP ni objetos internos serializados por extensión. Una mutación del DTO devuelto no altera la sala. |
| Puertos en `server/application/` | Expresar las capacidades realmente usadas: repositorio de salas, generación de identificadores y fuente de candidatos de código. | Contratos puros; la aplicación no importa implementaciones. Pueden ser interfaces o funciones tipadas inyectadas. No se crean puertos de reloj, barajas o eventos que este bloque no utiliza. |
| Adaptador de salas en memoria | Guardar y consultar salas; mantener coherentes los índices de código y propietario; liberar índices al eliminar. | No decide nombre inicial, permisos, vista ni cuándo una creación recupera otra sala. Se prueba su contrato de almacenamiento y aislamiento. |
| Adaptadores de sesión y generación | Resolver/establecer credenciales anónimas, conservar su mapa temporal y generar secretos, UUID y candidatos mediante el runtime actual. | Infraestructura conserva los detalles de cookie/cripto. Los casos de uso solo reciben identidad resuelta y generadores sustituidos en pruebas. No hace falta un puerto de sesión en aplicación si esta no lo consume. |
| Adaptador HTTP en `server/infrastructure/` | Express, validación de forma/origen/contenido, resolución de sesión, invocación de casos de uso y traducción de resultados/errores al contrato anterior. | No modifica salas, no aplica nombres ni construye repositorios. Puede crear su objeto Express y sus middleware; recibe los colaboradores concretos ya conectados. Integración Supertest. |
| `server/composition/` y `server/main.ts` | Elegir adaptadores y configuración, construirlos e inyectarlos, preparar servicio de archivos/SPA y arrancar el proceso. | Solo este borde selecciona las implementaciones. `process.env`, escucha y decisiones de arranque quedan fuera de aplicación. No contiene reglas de sala. |
| `shared/contracts/` | Tipos públicos de peticiones, respuestas y errores compartidos por HTTP y cliente, incluido el `RoomView` completo. | Sin importar `server` ni React, sin reglas ni datos secretos. Los contratos no dictan la representación del modelo. |
| Cliente `src/` | `api.ts` conserva `fetch`, credenciales y traducción de errores de red. Coordinación de carga/acciones y presentación pueden extraerse de `App.tsx`. | Solo importa tipos públicos desde `shared/contracts`; no replica autorización o validación definitiva del nombre. Pruebas de navegador E1–E7 conservadas. |

No se desarrolla el dominio del juego en este bloque. La ubicación del modelo de sala en aplicación se apoya en arquitectura §4; no cambia la responsabilidad de `Game`.

En el cliente es obligatoria la unificación del contrato. Una extracción concreta que puede aportar claridad es compartir la aplicación de la vista recuperada entre la carga inicial y `refresh`, conservando el control de desmontaje del efecto. La vista de espera y el diálogo también pueden separarse de la coordinación. El implementador elige las extracciones útiles; los componentes de presentación reciben datos y acciones, sin llamar directamente al servidor ni cambiar la navegación o los avisos actuales.

## 5. Contratos internos y consistencia

El repositorio debe permitir buscar por ID y propietario activo, comprobar códigos ocupados y guardar/eliminar manteniendo los índices coherentes. No debe devolver una vista HTTP como su representación almacenada. La obtención de IDs y candidatos se puede agrupar o separar en funciones pequeñas; la implementación con `node:crypto` queda fuera de aplicación.

Se conserva el recorrido de creación: consultar la espera propia → devolverla si existe → obtener un código libre → construir la sala con sus IDs → guardarla → proyectar vista. La comprobación y registro se mantienen **síncronos, sin `await`**, en el único proceso previsto. Así se preservan tanto una sala por sesión como códigos únicos entre sesiones. No se convierte el repositorio en asíncrono ni se introduce una cola para este bloque. Renombrar y cerrar conservan el mismo orden coherente. Los detalles de los tres mapas pueden cambiar dentro del adaptador.

La búsqueda de código conserva el límite actual de **1.000 candidatos**, saltando candidatos inválidos u ocupados. Si no consigue uno, devuelve la misma causa `CODE_EXHAUSTED` sin sala ni índices parciales. El origen del candidato solo genera; la aplicación coordina selección y disponibilidad. Los tests pueden suministrar `000042`, `000042`, `000043` para comprobar la colisión sin depender del azar.

La autorización precede al cambio de nombre o cierre. La validación de forma de red queda en HTTP; la normalización y regla de nombre se ejecutan en el modelo aunque se invoque el caso sin HTTP. Se conserva el conjunto de valores aceptados/rechazados por la implementación actual: este encargo no redefine caracteres Unicode.

`server/roomStore.ts` deja de ser el módulo que agrupa todas esas responsabilidades. Se puede retirar una vez migrados sus consumidores. `server/app.ts` puede mantenerse como una entrada delgada o reexportación del adaptador; no conserva la construcción por defecto de almacenes. Las pruebas pueden crear una composición específica. Las firmas internas antiguas de `createApp` y `RoomStore` no forman parte del contrato público que haya que mantener.

## 6. Dependencias y comprobación arquitectónica

Se aplican las reglas de `AGENTS.md` también a importaciones de tipos y reexportaciones:

- Dominio: solo sus reglas y tipos puros; ninguna dependencia de aplicación, infraestructura, cliente o runtime Node.
- Aplicación, incluido el modelo de sala: módulos propios, dominio y contratos puros; sin infraestructura, composición, entradas antiguas, React, Express, cookies, `process.env` ni `node:crypto`.
- Infraestructura: aplicación, dominio y contratos en el borde necesario, además de sus herramientas; sin importar composición o cliente.
- Composición y arranque: conectan las piezas. Ningún módulo interior importa este borde.
- Cliente: código de interfaz y contratos públicos; ninguna importación desde `server`, aunque sea solo de tipos. Contratos compartidos: solo tipos de intercambio independientes.

El implementador añade una comprobación ligera **`npm run check:architecture`**, incluida en `npm run check`, usando el lint o las herramientas TypeScript disponibles. Debe resolver rutas relativas, alias si se usan y reexportaciones, detectar importaciones prohibidas y ciclos en el grafo del código de producción, e informar los archivos afectados. Los tests pueden importar la composición para integración, sin que esa excepción permita dependencias prohibidas en producción. No se necesita instalar un marco de arquitectura.

Se demuestra que el control falla ante una importación prohibida, incluida una de tipos, y ante un ciclo mediante casos aislados del comprobador; no se dejan infracciones en el producto. Además se revisa el contenido: un archivo en infraestructura que siga decidiendo permisos o nombres no satisface el bloque aunque sus imports pasen.

Al introducir `shared/contracts`, revisar los `tsconfig`, la salida compilada y el arranque: actualmente el servidor tiene `rootDir: server` y `npm run start` usa `dist-server/main.js`. Se permite ajustar esas rutas internas, preservando los comandos públicos, el servicio de `dist` y las rutas SPA. No se resuelve un error de compilación importando tipos desde el servidor en el cliente o duplicándolos otra vez.

## 7. Pruebas y ejecución requerida

Antes de refactorizar, el hilo de implementación ejecuta la base vigente y registra el resultado; si falla, diferencia el fallo previo del introducido. Después realiza la migración y repite las puertas pertinentes.

| Pruebas existentes | Qué conservar y dónde comprobarlo después |
|---|---|
| `server/roomStore.test.ts` — 4 casos | E1/E2: código y valores iniciales; E3: recuperación y colisión; E4: grafemas, recorte y rechazo sin mutación; E6: cierre y nueva creación. Se pueden redistribuir entre modelo, casos de uso y adaptador, conservando las aserciones. |
| `server/app.test.ts` — 5 casos | Sesión y POST simultáneos; nombre y acceso ajeno; cierre repetido/errores; cookies de desarrollo/producción; pérdida de memoria, validación y origen. Mantener rutas, cuerpos, estados y garantías; adaptar solo montaje e importaciones cuando corresponda. |
| `tests/browser/room.spec.ts` — 6 casos | Recorrido a 390×844 y 1280×800, teclado, recarga/retorno, edición, cierre, copia y su fallo, cero inicial y pérdida de estado simulada. Mantener selectores semánticos y expectativas visibles; las simulaciones siguen identificadas como tales. |

Se añaden solo las comprobaciones que exige la extracción y que aún no cubren esas pruebas:

1. Casos de uso ejecutables con repositorio y generadores sustitutos, sin Express ni cripto. Modelo probado sin almacenamiento. Verificar que un rechazo no cambia estado ni índices.
2. Colisión y agotamiento de candidatos; cierre que libera código y asociación del propietario; DTO devuelto que no puede mutar el estado; respuesta sin identidad privada ni token, conservando `settings`.
3. Caracterización HTTP de respuestas no cubiertas: forma exacta de `{}` y `{name}`, JSON mal formado, tipo de contenido rechazado, ruta desconocida y prioridad de errores. El fallo interno inesperado conserva 500 y su respuesta pública segura. Estas pruebas documentan compatibilidad, no una nueva API.
4. Dependencias y ciclos mediante el control automático y revisión de responsabilidad por capa.

Puertas finales: **`npm run check`** (tipos, lint, pruebas, compilación y nuevo control arquitectónico) y **`npm run test:browser`**. Para navegador, arrancar una instancia de la versión compilada actual en `127.0.0.1:3000` con `npm run start`, como indica README; no probar contra un proceso que siga ejecutando la versión anterior. Revisar las capturas de las dos anchuras si se ha extraído presentación. Registrar comandos, fecha, resultado, versión y límites; el total de tests puede crecer al redistribuirlos.

Si se ubican nuevas pruebas fuera de `server/**/*.test.ts`, ajustar su descubrimiento en Vitest: una prueba que no se ejecuta al lanzar `npm run test` no cuenta como comprobación pasada. Los controles de arquitectura y sus casos negativos deben ejecutarse mediante los comandos registrados.

## 8. Autonomía, aceptación y entrega

El implementador decide nombres y subcarpetas, funciones o clases, agrupación de casos de uso y generadores, montaje de pruebas, mecanismo ligero del comprobador y extracciones útiles de cliente. No necesita pedir aprobación para esas elecciones si cumple las responsabilidades y dependencias anteriores. No se requieren una clase por operación, un contenedor de inyección ni un repositorio genérico.

Se consulta al autor o al hilo de arquitectura solo si aparece una contradicción real con las fuentes, o se propone cambiar comportamiento, contrato, dirección de dependencias o premisas de proceso único y memoria. Primero se cita la decisión existente y se explica qué impide respetarla. Las entradas de arquitectura que describen los archivos antiguos se actualizarán al terminar la migración; su aviso de no reescribir sin tarea no bloquea este encargo explícito.

- [x] **T1.** E1–E7 y el contrato HTTP anterior siguen pasando con la implementación refactorizada.
- [x] **T2.** Modelo, casos de uso, proyección, puertos, adaptadores y composición tienen las responsabilidades indicadas; aplicación se prueba sin transporte ni adaptadores concretos.
- [x] **T3.** Unicidad, atomicidad, permisos, nombres y liberación de índices se conservan; ningún DTO expone o modifica estado privado.
- [x] **T4.** Cliente y HTTP usan contratos públicos compartidos; no quedan tipos públicos duplicados divergentes ni imports de servidor en el cliente.
- [x] **T5.** El control de dependencias/ciclos está integrado, rechaza infracciones y pasa con el código final; la revisión semántica confirma la separación.
- [x] **T6.** Pasan los comandos finales y el arranque compilado; README y la guía de arquitectura reflejan la organización realmente entregada, preservando cambios locales previos.

**Evidencia de preparación:** lectura de fuentes, implementación, configuración y pruebas el 29/09/2026. No se han ejecutado en esta preparación las pruebas del producto ni se ha refactorizado código.

### Evidencia de ejecución — 29/09/2026

**Punto de partida:** `main` en `8721ae2`, con cambios locales previos en `README.md`, `PLANTILLA_BLOQUE.md`, `PROCESO_SDD.md` y archivos nuevos `AGENTS.md`, guía de arquitectura y T01. Se conservaron y se actualizaron solo las partes necesarias para describir la organización entregada. Antes de refactorizar, `npm run check` pasó con 9 pruebas de servidor y compilación; `npm run test:browser` pasó con 6 pruebas sobre la versión compilada anterior.

**Entorno y versión final comprobada:** Windows NT 10.0.26200, Node.js 24.13.0, npm 11.6.2, Chrome 153.0.8010.54 sin interfaz gráfica, servidor Express compilado en `127.0.0.1:3000`. La referencia del commit de implementación se añadirá al registrarlo.

| Comprobación ejecutada | Resultado |
|---|---|
| `npm run check` | Superado: tipos, lint, 20/20 pruebas de Vitest en 5 archivos, control de arquitectura y compilación Vite. |
| `npm run check:architecture` dentro del comando anterior | Superado: 17 módulos de producción revisados; sin importaciones prohibidas ni ciclos. |
| Casos negativos del comprobador dentro de `npm test` | Superados: importación `import type` cliente→aplicación y ciclo hacen terminar el CLI con código 1; reexportación por alias se detecta. |
| `npm run start` después de compilar y `npm run test:browser` | Superado: el servidor compilado arrancó; 6/6 pruebas de Chrome sobre esa versión. Se comprobó el recorrido a 390×844 y 1280×800, teclado, recarga y retorno, copia, edición, cierre y errores. |
| Revisión visual de las dos capturas producidas por Playwright | Sin cambios visibles de estructura ni desbordamiento respecto a la espera anterior; código, participante, edición y cierre se distinguen en ambas anchuras. |

**E1–E7:** E1 creación y valores iniciales: modelo, HTTP y navegador; E2 código `000042` generado por caso de uso, copia real y respuesta controlada con cero inicial en navegador; E3 dos POST casi simultáneos, dos sesiones y retorno desde portada; E4 nombre válido/inválido, grafemas y recarga; E5 permisos con cookie ajena; E6 cancelación, cierre repetido y liberación de índices; E7 reinicio de memoria en API, errores 400/401/403/404/415/500/503 y fallos simulados en navegador. Todos pasaron en las pruebas indicadas. El cero inicial en navegador y la pérdida de estado visible siguen usando respuestas controladas, como en el bloque 01; no se presentan como observaciones aleatorias o de un reinicio real del proceso Chrome.

**Revisión semántica:** `Room` decide nombre, valores iniciales y cierre sin red ni almacenamiento; `RoomUseCases` decide recuperación, autorización, unicidad y orden síncrono; la vista se proyecta campo a campo. El repositorio conserva mapas e índices y la sesión/cripto quedan en infraestructura. Express valida forma y origen, resuelve identidad y traduce errores, sin cambiar nombres ni permisos. Composición elige adaptadores. El cliente importa tipos solo de `shared/contracts` y los componentes no llaman a la API. No se creó un dominio `Game` vacío.

**Fallo intermedio resuelto:** el primer lint de T01 señaló `process` y `console` sin declarar en el nuevo comprobador `.mjs`; se ajustó su configuración y el comando final pasó. No se cambió una regla funcional ni el contrato HTTP.

**Límites:** el control automático verifica dependencias sintácticas y ciclos, pero sigue siendo necesaria la revisión de responsabilidades. No se probaron HTTPS/Caddy, VPS, múltiples procesos ni comprensión con una persona ajena al desarrollo. Siguen fuera de T01 invitados, configuración editable, bots, partida, Socket.IO y plazos de espera. La evidencia del bloque 01 permanece histórica y separada de esta comprobación.

La devolución a coordinación incluirá el cambio revisado, mapa final de responsabilidades, E1–E7 y T1–T6 con resultados reales, comprobación de dependencias, decisiones locales y límites. Este bloque técnico no modifica las reglas digitales ni autoriza el siguiente incremento funcional.
