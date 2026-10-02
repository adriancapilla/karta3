# Activación de la genérica — contenido 2

**Estado:** incorporado y verificado localmente el 02/10/2026 en el alcance AGV2-01–10; evidencia nueva en §8. Prueba manual con dos perfiles humanos pendiente. No abre otro bloque funcional.

**Punto de partida observado antes de incorporar:** rama `feat/b04-carga-barajas`, HEAD `b4c3f3a22a5ecc90de7a74d881c5f6405b8e9232`, paquete KARTA3 0.1.0 y árbol limpio antes de esta preparación. B04 y B05 estaban implementados y verificados localmente. ASSETS ya contenía la entrega activada; APP conservaba contenido 1/no disponible.

## 1. Objetivo y referencias

Incorporar a APP la versión aprobada de la genérica y comprobarla en la carga y el selector existentes. Cambia el contenido disponible de la instalación normal, sin cambiar reglas, contratos ni recorridos de sala.

| Referencia | Regla aplicable |
|---|---|
| [AGENTS.md](../../AGENTS.md), [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) | Autoridad del servidor, capas, privacidad y comprobaciones del repositorio. |
| [Proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) | Cambio explícito, aceptación y evidencia separada. |
| [Contrato formato 1](../contratos/CONTRATO_BARAJAS_V1.md), §§2–3, 6–7 | Fuente maestra/copia aprobada, incremento de contenido, imágenes nulas, validación y C09–C10. |
| [B04](BLOQUE_04_CARGA_BARAJAS.md), §§4–7 y 11 | Validación, catálogo generado, arranque con instantánea y datos públicos. |
| [B05](BLOQUE_05_CONFIGURACION_SALA.md), §§3–9 y 12 | Selección explícita/versionada, permisos, sincronización, recuperación y evidencia existente. |
| [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §9 | APP construye/ejecuta sin ASSETS y los paquetes completos quedan internos. |

**Entrega editorial consultada:** hilo «Gestor de Brajas», entrega del 02/10/2026, turno `01a0fd92-27d3-7521-8337-24d654430fd2` del hilo `01a0f736-c79a-7263-83c8-917d80785f20`. Registra autorización de activación, solo las tres modificaciones de §2, conformidad local C01–C08 y las huellas siguientes. No acredita incorporación ni uso en APP.

**Evidencia histórica:** B04 registra código `e5416f8`, 172 pruebas/22 recorridos/37 módulos; B05 registra `73091f6`, 197 pruebas/31 recorridos/41 módulos. Ambos se comprobaron con la copia real contenido 1/no disponible. Conservar sus resultados y contexto; no atribuirlos a este cambio.

## 2. Paquete aprobado y alcance

Fuente maestra: `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\generica`.

Destino de implementación: `E:\KARTA3\KARTA3_IA\APP\karta3\barajas\generica`.

| Archivo | SHA-256 aprobado de contenido 2 | Tamaño observado |
|---|---|---|
| `baraja.json` | `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` | 4723 bytes |
| `cartas.json` | `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c` | 34030 bytes |

Cambios respecto a la copia APP vigente:

- `baraja.json.contentVersion`: 1 → 2.
- `baraja.json.publication.available`: false → true.
- `cartas.json.contentVersion`: 1 → 2.

Se conserva `schemaVersion: 1`, id `generica`, 58 cartas, atributos, ids, valores, indicadores, textos, procedencia y semilla editorial `generica-v1`. Portada y 58 cartas mantienen `imageRef: null`/`imageAlt: ""`; no se añade carpeta de imágenes ni se regeneran permutaciones. El reparto editorial 20/19/19 no se convierte en regla del validador.

**Incluye:** copia exacta de ambos archivos, validación y catálogo mediante B04, reinicio local de la compilación vigente, adaptación de pruebas ligadas al contenido real, comprobación normal de selección/sincronización/recarga mediante B05, README y evidencia nueva.

**Fuera:** bots, inicio, mesa, juego, equilibrio, creación editorial, mejoras visuales, contratos nuevos, publicación remota y despliegue. No se requiere rediseñar carga/selector, crear casos de uso/puertos ni cambiar el código de producto para activar el paquete. Si aparece un defecto, diagnosticarlo contra B04/B05 antes de proponer otra decisión.

**Cambio explícito de condición inicial:** la ejecución normal deja de tener catálogo vacío y la genérica pasa a ser seleccionable como contenido 2. Las referencias a contenido 1/false/catálogo vacío de B04/B05 describen su entrega y evidencia original. La selección inicial de una sala sigue siendo **ninguna**, incluso con una sola opción disponible. Los demás valores predeterminados, permisos, plazos y comportamiento de error de B05 se conservan.

## 3. Procedimiento de implementación y contratos conservados

1. Revisar rama/HEAD/cambios actuales y conservar el trabajo existente. Comprobar las huellas de ASSETS contra §2 antes de copiar. Si no coinciden, detener la incorporación y comunicar la discrepancia; no aprobar bytes diferentes bajo esta versión ni reparar el contenido.
2. Incorporar los dos JSON mediante copia de bytes, sin reserializar ni cambiar saltos de línea. Registrar SHA-256 de origen y destino: cada par debe ser igual y coincidir con §2. ASSETS se mantiene como fuente maestra; construir, ejecutar y comprobar el producto utiliza la copia APP.
3. Con ambos archivos ya coherentes, ejecutar `npm run decks:validate -- --package barajas/generica` y `npm run decks:prepare`. Validación individual: salida 0, disponible y válida. El catálogo se genera; no editarlo ni tratarlo como aprobación. En la instalación actual contiene un resumen `generica`, formato 1/contenido 2, `imageUrl: null`, `imageAlt: ""` y nombre/subtítulo/descripción de la fuente aprobada, con los ocho campos de B04.
4. Adaptar las pruebas según §4 y ejecutar `npm run check`, que valida tipos/lint/pruebas/arquitectura y genera la compilación y el catálogo. No basta con el diagnóstico editorial del Gestor.
5. Detener la instancia local anterior de KARTA3 y arrancar la compilación resultante con `npm run start`. B04 carga una instantánea: copiar/regenerar archivos no actualiza un servidor ya abierto. Confirmar en `http://127.0.0.1:3000/api/decks` que la instancia realmente servida ofrece contenido 2 antes de comprobar selección. El reinicio pierde las salas en memoria; crear nuevas esperas para esta comprobación, sin introducir migración o persistencia.
6. En otra terminal, ejecutar `npm run test:browser` contra esa instancia. El comando vuelve a compilar; si se modifica posteriormente producto/contenido, reiniciar la compilación correspondiente antes de la ejecución final. Registrar comandos, entorno y resultados reales.

Se reutilizan `ListDecks`, `PublishedDeckVersions`, `RoomUseCases.configure`, vistas y recuperación B05. El anfitrión envía la selección exacta `{ id: "generica", contentVersion: 2 }`; el servidor comprueba la instantánea validada, acepta `settings.deckId: "generica"`/`deckContentVersion: 2` y publica su ficha segura. Solicitar contenido 1 no cambia automáticamente a 2: se rechaza como versión distinta, conforme a B05. Invitados no configuran; lectura, recarga, igualdad y solicitudes repetidas mantienen la política de actividad existente.

## 4. Adaptación de pruebas

Modificar las expectativas que dependan del paquete **real de esta instalación**; conservar las garantías generales y los paquetes sintéticos que prueban otros estados.

| Área existente | Ajuste necesario / garantía conservada |
|---|---|
| `server/infrastructure/decks/packages.test.ts` | Su caso de copia real pasa a formato 1/contenido 2/true y huellas de §2. Mantener 58 cartas, ausencia de recursos y validación estricta. No obtener una huella esperada del mismo archivo que se comprueba. |
| `tests/browser/decks.spec.ts` | El recorrido contra ejecución normal deja de esperar `decks: []`: comprobar resumen de genérica 2 y selección inicialmente vacía. Añadir/adaptar el recorrido real host/invitado/recarga de §6 sin sustituir la instalación normal por fixtures o respuestas HTTP simuladas. |
| Paquetes/catálogo/HTTP/arranque B04 | Conservar casos válidos/invalidos, bloqueo de disponibles inválidas, recursos y privacidad. Mantener independencia de ASSETS y exigencia de catálogo vigente. Revisar otras asunciones del paquete real/versiones sin reemplazos globales de 1 por 2. |
| Casos/sockets/configuración B05 | Mantener rechazo de no disponibles con paquete o puerto de prueba separado, por ejemplo `borrador`; no usar la genérica real como ejemplo de no disponibilidad. Una fixture sintética sigue pudiendo usar false y su propia versión sin alterar producción. Conservar permisos, deduplicación, concurrencia, recuperación, plazas y actividad. |
| Catálogo vacío | Mantener prueba de servicio y presentación del vacío con una instalación temporal de raíz vacía o solo paquetes de prueba no disponibles. No desactivar la genérica ni interceptar el catálogo normal para acreditar esa condición. |
| B01/T01/B02/B03 y resto B05 | Mantener recorridos de salas y aserciones existentes; el contenido disponible no cambia sus garantías ni justifica eliminarlas. |

Las fixtures no se publican en `barajas/` de la instalación normal. Una disponible inválida sigue bloqueando construcción/arranque; no relajar el validador para facilitar la incorporación.

## 5. Responsabilidades y dependencias

| Responsabilidad | Capa o pieza existente | Dependencias y comprobación |
|---|---|---|
| Datos aprobados y procedencia | ASSETS maestro; copia en `barajas/generica` | Incorporación por implementación, igualdad de bytes/huellas. APP no lee ASSETS en construcción/ejecución. |
| Invariantes de Deck/Card | Dominio B04 | Validador puro existente; sin IO/publicación. Sus pruebas permanecen. |
| Formato/recursos, generación y carga | Infraestructura B04; composición/arranque | Reutilizar operaciones existentes desde APP; catálogo vigente y servidor reiniciado. No añadir recarga dinámica. |
| Selección, permisos y vista segura | Aplicación/puerto B05, adaptador de catálogo y transportes | Resolver versión validada en servidor; mantener límites de imports y ocho campos públicos. Integración y regresiones. |
| Selector/ficha/recuperación | Cliente B05 y contratos seguros | Sin importar servidor ni paquetes completos. Recorridos normales de navegador; no nueva presentación. |
| Expectativas, README y evidencia | Pruebas y documentación | Distinguir instalación real/fixtures e historial/resultados nuevos. `check`, navegador y revisión semántica de dependencias. |

**Autonomía del implementador:** organización de montajes, nombres de fixtures, agrupación de pruebas y detalle de documentación/commits locales. No autoriza cambios de datos, mecánica, selección automática, permisos, interfaz ni límites de capas. No quedan decisiones funcionales pendientes para este cambio.

## 6. Ejemplos y aceptación

Estas comprobaciones de producto estaban pendientes al preparar la especificación. Sus resultados realmente ejecutados constan en §8.4.

| Criterio | Acción / resultado esperado |
|---|---|
| AGV2-01 — Copia aprobada | Ambos JSON en APP coinciden con ASSETS y las huellas §2; formato 1, contenido 2, disponible. Cartas/textos/semilla/imágenes conservados; no se edita el maestro. |
| AGV2-02 — Validación y catálogo | Validación individual y preparación terminan correctamente. Catálogo normal generado ofrece la genérica 2 con resumen exacto, sin cartas. Construcción/ejecución no requiere ASSETS. |
| AGV2-03 — Instancia vigente | Servidor compilado reiniciado carga/valida el nuevo paquete antes de escuchar; HTTP normal muestra genérica 2. Se distinguen compilación, archivos y proceso servido; no se afirma carga nueva por haber copiado archivos. |
| AGV2-04 — Selección y sincronización | En ejecución normal y dos sesiones independientes, crear/entrar conserva código y lista. Sala inicial sin selección aunque exista una opción. Host elige genérica 2 y ambos ven su ficha aceptada sin recargar; icono neutro existente, sin imagen rota. |
| AGV2-05 — Recarga | Recargar host e invitado conserva identidades, permisos, orden y selección id/contenido/ficha, sin duplicación ni reenvío automático. No confundir recarga del navegador con reinicio del servidor. |
| AGV2-06 — Permisos/versiones | Invitado intenta configurar: denegado; host con petición de genérica 1: versión incorrecta, sin cambiar selección ni renovar espera. Desconocida/no disponible conservan sus rechazos mediante fixtures. No se acreditan permisos por nombre o código. |
| AGV2-07 — Comportamiento conservado | Quitar selección sincroniza; igualdad/repetidas no producen otro efecto. Gates B05 conservan aplicación inmediata, últimos cambios válidos, pendientes/errores, capacidad, reconexión y prioridades B03. |
| AGV2-08 — Privacidad | `/api/decks` sigue siendo público, sin crear cookie y con no-store; solo ocho campos. Vistas y mensajes no incluyen cartas/playValue/JSON completos ni rutas privadas. JSON internos/catalogo y recursos no registrados siguen bloqueados; imagen nula no crea un recurso. |
| AGV2-09 — Estados separados | Casos de no disponible y catálogo vacío permanecen verificables con paquetes/instalaciones temporales independientes; se conservan inválidos y recursos reales. Ninguna fixture desactiva o sustituye la copia normal aprobada. |
| AGV2-10 — Regresiones y cierre | `npm run check` y `npm run test:browser` superados en la versión revisada; recorridos a 390/1280 px, escáner/revisión de responsabilidades y README alineados. Registrar evidencia nueva, instrucciones manuales y commit(s) locales; B04/B05 históricos intactos. |

### Prueba manual con dos sesiones

Después de la incorporación y el reinicio, dejar estas instrucciones en el README vigente:

1. Abrir `http://127.0.0.1:3000/api/decks`: debe ofrecer `generica`, contenido 2 y portada nula. Volver a portada de la aplicación normal.
2. En sesión A crear sala. Verificar código y «Sin baraja seleccionada»; los demás predeterminados son los de B05.
3. En otro navegador/perfil con cookies independientes, sesión B entrar con código y nombre. Una segunda pestaña del mismo perfil no es otra persona.
4. A selecciona «KARTA3 — Baraja genérica · v2». Tras aceptación, A y B ven nombre, descripción e icono neutro sin recargar; B consulta y no dispone de edición de configuración.
5. Recargar A y B. Ambos recuperan la selección, conservan su identidad/autoridad y no duplican participantes.
6. A quita selección: B ve el cambio sin recargar. Comprobar salida voluntaria/cierre por los recorridos existentes. Repetir presentación en móvil/escritorio sin exigir un rediseño.

Registrar fecha, versión de código/paquete servido, navegadores/sesiones, acciones, resultado y limitaciones si se ejecuta manualmente. Si queda para el autor, consignar **manual pendiente**, sin convertir pruebas automatizadas en una sesión manual realizada. La aceptación local del cambio se acredita mediante los criterios y las puertas ejecutadas; estas instrucciones permiten su revisión adicional.

## 7. Cambios documentales y cobertura parcial

Actualizar el [README vigente](../../README.md): estado actual de la copia contenido 2/disponible, respuesta normal con resumen, preparación/reinicio y prueba manual. Corregir la frase desactualizada «No hay selector, selección autorizada ni presentación de cartas/iconos»: selector y ficha/icono existen por B05; cartas/manos/mesa siguen pendientes. Mantener fixtures como cobertura de vacío/no disponibles y la pérdida de salas al reiniciar. Enlazar este cambio y su evidencia cuando exista.

Conservar especificaciones y resultados originales de B04/B05, incluidas huellas y catálogos observados entonces. Registrar nuevas huellas y resultados aquí; puede añadirse un enlace de evolución sin sustituir su evidencia anterior. Comunicar a coordinación la diferencia entre maestro activado, copia incorporada y uso verificado para actualizar las fuentes generales. No modificar el documento vivo de coordinación desde este hilo.

- **C09:** este cambio podrá añadir evidencia de copia/carga/catálogo y selección autorizada de genérica 2 en ejecución normal. Validación y uso al iniciar partida continúan pendientes.
- **C10:** podrá añadir evidencia de ficha/icono existente y privacidad con el paquete real. Cartas/manos/mesa y pruebas de comprensión con usuarios siguen fuera. No declarar completos los criterios amplios.

**Registro de cambio — 02/10/2026:** autorización editorial y entrega del Gestor sustituyen la condición inicial de contenido 1/false por contenido 2/true para futuras ejecuciones normales. Afecta expectativas de contenido real, catálogo y README; no cambia reglas/defaults ni garantías B01–B05.

## 8. Comprobación y cierre

**Preparación realizada por SDD, 02/10/2026:** leídas fuentes y entrega del Gestor; huellas ASSETS coinciden con §2. Comparación semántica contra la copia APP confirma exclusivamente las tres modificaciones de §2. Se observan 58 cartas y referencias gráficas nulas. Es lectura/comparación documental, no ejecución del validador de aplicación ni nueva evidencia C01–C10 de producto.

**Estado al terminar la preparación SDD:** incorporación, validación/preparación/arranque/pruebas, README, commits y verificación pendientes; no ejecutados en esa preparación. Se conserva esta nota histórica. La ejecución posterior se registra a continuación.

### 8.1 Base, versión y entorno de implementación

Antes de editar se comprobaron rama/HEAD: `feat/b04-carga-barajas`, `b4c3f3a22a5ecc90de7a74d881c5f6405b8e9232`. Los únicos cambios locales eran proceso modificado y especificación/prompt de esta incorporación sin registrar. Se conservaron íntegros en el commit documental `870f09f`; no se restauró ni cambió de rama. No se detectaron contradicciones funcionales: §2 autoriza explícitamente la evolución de la condición inicial histórica B04/B05.

Commits locales trazables:

- `870f09f`: preparación documental existente (proceso, especificación y prompt).
- `e403837`: únicamente los dos JSON aprobados de contenido 2, copiados sin reserializar.
- **`4115ad8a0d444e7d713a1ee88c2f61f2c8360c10` (`4115ad8`): versión revisada y comprobada**, expectativas, recorridos normales/instalaciones aisladas y README. El cierre documental se registra después de esta versión.

Fecha de ejecución: **02/10/2026**, Europe/Madrid, UTC+02:00. Windows NT 10.0.26300.0, PowerShell, Node 24.13.0, npm 11.6.2, paquete KARTA3 0.1.0, TypeScript 6.0.3, Vitest 5.0.2, Playwright 1.63.0, Chrome **154.0.8037.93**. Loopback, un proceso por instancia; contextos Chrome con cookies independientes. Anfitrión móvil 390×844/invitado escritorio 1280×800 y recorrido inverso. Las regresiones B05 conservan dos pestañas del anfitrión.

### 8.2 Copia y catálogo reproducibles

Las huellas ASSETS se comprobaron contra §2 **antes de copiar ambos archivos**. Comparación semántica en memoria contra la copia APP anterior: exactamente las tres modificaciones autorizadas; el resto coincide, incluidas las 58 cartas y semilla `generica-v1`. La copia se realizó con `Copy-Item`, sin parsear/escribir los JSON. Se recalcularon origen/destino después de copiar y tras las puertas finales:

| Archivo | SHA-256 origen ASSETS = destino APP = aprobado §2 | Bytes |
|---|---|---|
| `baraja.json` | `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` | 4723 |
| `cartas.json` | `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c` | 34030 |

Lista final: solo esos dos JSON. Formato 1/contenido 2 en ambos; disponible true; portada y 58 imágenes de cartas null/alt vacío, sin carpeta de recursos. Las huellas aprobadas fijas en `packages.test.ts` verifican todos los bytes; no se calculan expectativas desde el mismo archivo. También se extrajeron los dos blobs registrados mediante `git cat-file`: sus SHA-256 coinciden con §2. No se editó ASSETS ni se regeneraron permutaciones. `.gitattributes` conserva `barajas/** -text` para impedir conversión de bytes al clonar.

Catálogo generado mediante las herramientas B04, nunca editado: un resumen `generica`, ocho campos exactamente iguales al esperado independiente en `tests/support/approvedGeneric.ts`, formato 1/contenido 2/portada nula. SHA-256 de `barajas/catalogo.json`: `5fa8a932c00315f975573750fb8d46ad5754df16838730ab43071244b172a85f`, idéntico antes y después de la regeneración de browser. Catálogo, dist, dist-server, capturas/resultados y logs permanecen ignorados; ninguna fixture entra en la instalación normal.

### 8.3 Comandos y proceso realmente servido

| Comando/comprobación ejecutados | Resultado nuevo observado |
|---|---|
| `npm run decks:validate -- --package barajas/generica` | Salida **0**, válida, disponibilidad true. |
| `npm run decks:prepare` | Salida **0**, genérica válida/true, **1 baraja disponible**. |
| `npm run check` | Salida **0**. Primera ejecución de adaptación: 197/197, 12,07 s. Ejecución final sobre `4115ad8`, alrededor de 19:46: **197/197 en 21 archivos**, Vitest **21,13 s**; tipos y lint correctos. Se conserva el número de pruebas, actualizando las ligadas al contenido real. |
| `check:architecture`, dentro de check | **41 módulos**, sin imports prohibidos ni ciclos; los cuatro casos negativos pasan en Vitest. Revisión semántica en §8.5. |
| Build, dentro de check y browser | Preparación correcta de genérica 2, TypeScript y Vite: **54 módulos**; `index-D13z2AtQ.js`/`index-DyT1_Y8O.css`. Código cliente de producto idéntico al anterior; el paquete se carga en servidor. |
| `npm run start` | Arranque nuevo de `node dist-server/server/main.js`, diagnóstico genérica válida/true antes de escuchar. Instancia final **PID 14648**, iniciada a **19:47:18**, escucha `127.0.0.1:3000`; correlación por salida de start, netstat y hora del proceso. |
| HTTP normal antes de browser | `http://127.0.0.1:3000/api/decks`: **200**, `Cache-Control: no-store`, sin `Set-Cookie`; un resumen exacto de genérica **2**. Se comprobó el proceso servido, además del archivo generado. |
| `npm run test:browser`, final sobre esa instancia | Salida **0**, **35/35**, Chrome, tres workers, **1,1 min**, alrededor de 19:47–19:49. Incluye los 31 recorridos anteriores adaptados y cuatro nuevos: dos normales AGV2 y dos instalaciones vacías. `.last-run.json`: passed, sin fallos. |
| Inspección visual final | Realizada sobre las cuatro capturas `test-results/AGV2-{390,1280}-{host,guest}.png` a 19:49: ficha/versionado/icono neutro, controles solo host, orden móvil/columnas escritorio; sin solapamientos ni desbordamiento observado. Las aserciones de ancho pasan. |
| Revisión de diff/archivos | `git diff --check` sin errores; B04/B05 históricos sin cambios. Sin nuevas dependencias, cambios de producto, contrato ni recursos editoriales. |

**Incidencia de ejecución, sin cambio de producto:** una primera ejecución browser perdió su sesión de herramientas durante una interrupción; sus casos parciales no se usaron para acreditar la puerta completa. Se repitieron check, arranque y browser, con los resultados finales anteriores. Los cmdlets de inventario `Get-NetTCPConnection`/CIM dieron acceso denegado; se correlacionó la nueva instancia mediante `netstat`, `Get-Process`, salida de start y HTTP real, sin terminar procesos ajenos. El arranque nuevo pudo ocupar el puerto y no se reutilizó un servidor antiguo. Los logs locales `agv2-{check,start,browser}.log` y capturas son auxiliares ignorados; las pruebas versionadas regeneran la evidencia.

**Independencia de ASSETS comprobada de nuevo:** `startup.test.ts` copia solo fuentes, dependencias y genérica APP a una instalación temporal, construye y arranca con un guard real que bloquea accesos a ASSETS. El guard se prueba primero con una lectura deliberada, que falla; construcción/arranque/consultas no dejan accesos registrados y ofrecen genérica 2. Tras modificar cartas y añadir un paquete **solo en esa instalación temporal**, las consultas conservan el resumen inicial: la instantánea no recarga archivos. Los casos de catálogo ausente/corrupto/desactualizado, disponible inválida e incierto salen con fallo antes de escuchar. No se retiró ni renombró el maestro real para simular independencia.

### 8.4 Resultado por criterio

| Criterio | Resultado y evidencia nueva ejecutada |
|---|---|
| AGV2-01 | **Superado.** Comparación anterior/posterior, copia y tabla §8.2; caso real de `packages.test.ts`: hashes aprobados constantes, 58 cartas, formato/contenido/true, semilla, null y ausencia de recursos. Maestro intacto. |
| AGV2-02 | **Superado.** Comandos individuales salida 0; catálogo determinista de un resumen exacto; construcción/arranque aislados con guard ASSETS y copia real (`startup.test.ts`). |
| AGV2-03 | **Superado.** Instancia compilada final de §8.3 y HTTP normal v2 antes de browser; `decks.spec.ts` prueba normal y fallos reales de arranque conservados. Salas nuevas después de iniciar, sin persistencia añadida. |
| AGV2-04 | **Superado.** `activation.spec.ts`, ambos tamaños: dos cookies independientes, creación/entrada/lista/código, una opción sin selección inicial, selección explícita v2 y ficha en host/invitado sin recargar, icono decorativo y ningún img nulo. Conexiones y respuestas reales, sin fixtures ni interceptación en este recorrido. |
| AGV2-05 | **Superado.** Recarga simultánea de ambos navegadores: id/rol/orden/settings/ficha exactos, dos participantes y expiración conservada. Observación de frames/POST Socket.IO enviados: un configure por el gesto y ningún nuevo configure durante recarga. Autoridad visible host y consulta guest conservadas. |
| AGV2-06 | **Superado.** Contra la instancia normal, invitado configura con su cookie: FORBIDDEN; host solicita genérica 1: DECK_VERSION_MISMATCH. Settings/revisión/expiración intactos. Desconocida y borrador false en puertos/paquetes separados B05, sin usar genérica real como no disponible. |
| AGV2-07 | **Superado.** Retirada por UI sincroniza, limpia id/versión/ficha; igualdad v2/null y repetición no cambian revisión ni expiración. Repetición de id de selección antiguo tras quitar devuelve el presente sin restaurar v2. Suites B05 conservan controles inmediatos, concurrencia, pendientes, capacidad, reconexión y prioridades B03. |
| AGV2-08 | **Superado.** GET real anónimo 200/no-store/sin cookie; resumen exacto de ocho campos, vistas sin cartas/playValue/datos internos. `decks.spec.ts` mantiene 404 sin HTML para JSON/catalogo/API y medios desconocidos v1/v2; null no crea recurso. Se conservan pruebas de medios registrados y privacidad del bundle/transportes. |
| AGV2-09 | **Superado.** Dos nuevas instalaciones temporales vacías a 390/1280: main compilado devuelve [] y UI presenta vacío, conserva sin selección y permite otros controles. Fixture borrador false propia, paquetes inválidos y recursos reales PNG/JPEG/WebP conservados; ninguno sustituye/desactiva la genérica normal. |
| AGV2-10 | **Superado localmente.** Check 197/197, browser 35/35, arquitectura 41, revisión semántica/visual, README actual y commits trazables. B01/T01/B02/B03/B04/B05 se vuelven a ejecutar; sus documentos históricos no se reescriben. Instrucciones manuales en README; recorrido manual humano pendiente. |

### 8.5 Responsabilidades, tiempos y límites

No se necesitó modificar código de producto: datos en `barajas/generica`; expectativas/fixture independiente en pruebas; descripción actual en README; evidencia en este documento/proceso. Revisión del diff y piezas reutilizadas: dominio mantiene el único validador puro; infraestructura conserva lectura estricta/recursos/catálogo; `tools/decks.ts` delega a composición; `main` valida/carga antes de escuchar; aplicación `ListDecks`/`PublishedDeckVersions`/`RoomUseCases.configure` conserva autorización/deduplicación/vencimientos; cliente recibe exclusivamente DTO seguros. Ningún nuevo puerto, IO en dominio/aplicación, import de paquetes en cliente, regla por tema ni excepción por id. No hay desviación arquitectónica.

Los nuevos recorridos normales AGV2 usan conexiones y reloj reales durante segundos; no simulan respuestas ni prueban media hora real. Las regresiones B03/B05 con `ControlledTime` verifican límites exactos de ausencia/caducidad y prioridad con conexiones reales o casos puros según su montaje. Reserva B03 con margen real repetida: detección de recuperación **6,6642 ms**, detección del corte **3,4949 ms**, retirada **30.005,2616 ms desde detección**, total **30.008,7565 ms desde corte local**, motivos `transport close`. `pingInterval=5.000 ms`, `pingTimeout=5.000 ms` y margen de aplicación detección+30.000 ms conservados. Corte local Chrome, no pérdida física/WAN; aviso minuto 29/caducidad minuto 30 se acreditan con tiempo controlado.

**Manual pendiente:** no se declara realizado el recorrido de §6 por dos perfiles humanos. Sí se realizó inspección visual de capturas de los recorridos automatizados reales; no equivale a estudio de comprensión. README contiene todos los pasos manuales, reinicio previo y diferencia entre pestaña y sesión independiente. Sin ensayo en móvil físico, lector de pantalla, WAN, HTTPS desplegado ni VPS.

Estado solo en memoria: reiniciar pierde salas/configuración; recargar navegador conserva identidad y espera de ese proceso. Catálogo fijo: otra entrega requiere preparar/reiniciar. Una sola baraja disponible no la selecciona automáticamente. No se ha comprobado equilibrio ni se ha añadido ninguna función del siguiente bloque.

### 8.6 Archivos y resumen para coordinación

Archivos del cambio: `barajas/generica/{baraja,cartas}.json`; `server/infrastructure/decks/{packages,startup}.test.ts`; `server/application/configuration.test.ts`; `server/configurationSocket.test.ts`; `tests/browser/{decks,activation}.spec.ts`; `tests/support/{configurationBrowserServer,approvedGeneric}.ts`; `README.md`; `docs/sdd/{ACTIVACION_GENERICA_V2,PROMPT_IMPLEMENTACION_ACTIVACION_GENERICA_V2,PROCESO_SDD}.md` (los dos últimos documentos iniciales conservados antes de implementar; el proceso recibe también el estado final).

Para coordinación: maestro activado por el Gestor, copia APP incorporada byte a byte y uso normal verificado son tres hechos separados, ahora acreditados para contenido 2. Trasladar a fuentes generales el nuevo estado actual del catálogo y la disponibilidad, manteniendo referencias históricas de contenido 1. Sala inicialmente sin selección; no nuevo acuerdo funcional/arquitectónico. **C09 parcial:** carga/catálogo/selección autorizada exacta/recuperación normal de genérica 2 acreditados; validación al iniciar y uso en partida pendientes. **C10 parcial:** ficha/icono/privacidad del paquete real acreditados; cartas/manos/mesa/resultados y comprensión con usuarios pendientes. No se modifica el documento vivo de coordinación desde este hilo.

**Fecha y estado final:** 02/10/2026, **verificado localmente para AGV2-01–10**, con los límites descritos y manual adicional pendiente. Cierre documental posterior al código revisado `4115ad8`; commits solo locales. GitHub/publicación/recuperación y despliegue continúan en sus conversaciones responsables.

Los commits de esta incorporación serán locales. No hacer push, PR ni despliegue; la publicación posterior corresponde al hilo de GitHub y recuperación. Excluir catálogo/compilaciones generados según las reglas existentes. Entregar a coordinación archivos, acuerdos, nueva evidencia y pendientes, sin abrir el siguiente incremento funcional.

Encargo listo para copiar: [prompt de implementación](PROMPT_IMPLEMENTACION_ACTIVACION_GENERICA_V2.md).
