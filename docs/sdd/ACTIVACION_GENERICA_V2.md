# Activación de la genérica — contenido 2

**Estado:** cambio técnico autorizado por el autor el 02/10/2026; preparado para implementación. Incorporación y verificación por la aplicación pendientes. No abre otro bloque funcional.

**Punto de partida observado:** rama `feat/b04-carga-barajas`, HEAD `b4c3f3a22a5ecc90de7a74d881c5f6405b8e9232`, paquete KARTA3 0.1.0 y árbol limpio antes de esta preparación. B04 y B05 están implementados y verificados localmente. ASSETS ya contiene la entrega activada; APP conserva todavía contenido 1/no disponible.

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

Todas estas comprobaciones de producto están pendientes al preparar la especificación.

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

**Incorporación APP:** pendiente. **Validación/preparación/arranque/pruebas del cambio:** pendientes; no ejecutados en esta preparación. **README actualizado por implementación:** pendiente. **Commit(s) local(es) y versión revisada:** pendientes. **Verificación local/manual:** pendientes según evidencias que se ejecuten.

Para cerrar, añadir resultados AGV2-01–10, huellas origen/destino, versión de código y catálogo servido, comandos/entorno/fecha, tiempos reales o controlados si procede y límites. Conservar los recuentos reales nuevos sin copiar 172/22 o 197/31. Marcar verificado solo cuando las comprobaciones requeridas se satisfagan.

Los commits de esta incorporación serán locales. No hacer push, PR ni despliegue; la publicación posterior corresponde al hilo de GitHub y recuperación. Excluir catálogo/compilaciones generados según las reglas existentes. Entregar a coordinación archivos, acuerdos, nueva evidencia y pendientes, sin abrir el siguiente incremento funcional.

Encargo listo para copiar: [prompt de implementación](PROMPT_IMPLEMENTACION_ACTIVACION_GENERICA_V2.md).
