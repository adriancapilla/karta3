# B21 — registro de implementación local

## Preparación — 20/10/2026

- Encargo autorizado por el autor en este chat; no autoriza activación, borrado o publicación.
- Base efectiva: `main`, `565795ce53d095ab05ff73880b4398be082c9f22`.
- Conservados cinco documentos modificados (B19, B20, proceso y dos guías operativas) y cinco documentos nuevos de preparación B21. El parche inicial y las huellas de las 124 fuentes de barajas se guardan en `playwright-report/b21/initial/`, fuera de Git.
- Alcance: reemplazo integral por AGG_DAILY_V1; correlación/dedupe RAM, reducción anterior a cola, SQLite nuevo sin lectores históricos, controles separados y nueve consultas privadas. Juego y apariencia funcional se conservan.
- P1–P5 y A01–A10 pendientes. No se ha ejecutado todavía ninguna puerta B21. Windows no acredita Linux ni operación pública.
- Alineación documental de Arquitectura: pendiente de recepción por el autor; no impide desarrollar, sí el cierre global verificado.

Los resultados ejecutados se añadirán por etapa, sin atribuir a B21 las pruebas históricas.

## Cierre técnico — 20/10/2026

**Implementado y comprobado técnicamente en Windows. No verificado globalmente:** no se ha recibido referencia de alineación descriptiva de Arquitectura y no se ha ejecutado Linux/imagen/volumen. Las condiciones por familia ya estaban cerradas: no se solicita otra aprobación jurídica general. Publicación, operación y borrado siguen fuera del encargo.

### Fuente y entorno

- Preparación documental del autor registrada aparte: `ada7f1a` (cinco documentos; no incluye su limpieza B19/proceso pendiente).
- Producto/retirada/guía/mapa: `c7bef97`. Salvaguarda del lector y marcadores históricos propios: `ee0fa8a`. Visibilidad/permiso: `c38e1f8`. Aserción B05 adaptada a B20: `1860a9c`. Aserción del plazo público fortalecida: `d3f4486`.
- Los cambios posteriores a `c38e1f8` son de pruebas/documentación; el producto compilado de los recorridos es idéntico al final. [Prueba de integridad](INTEGRIDAD.json).
- Windows x64, PowerShell, Node **24.19.0** en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, ICU78.3/Unicode17.0/SQLite3.53.3; npm11.6.2; Chrome155.0.8059.80, Playwright1.63.0. No reinstalación o cambio global.
- Todos los servidores/datos fueron propios, efímeros y fabricados, `test/SYNTHETIC`. El main normal copiado ejecutó adaptadores/entropía/reloj normales y guardia contra acceso a ASSETS/TFM/PRODUCTO. No se usó la instancia del autor como URL base, ni se detuvo/modificó su proceso o datos.

### P1 — contratos y reductor

DTO nuevos de exclusión, permiso y fotografía; HOME solo `{version:1}`. La aplicación reduce a celdas/calidad antes del puerto. Correlación/dedupe RAM4096/dos horas; vencimiento sin renovación. Configuración en trece distribuciones independientes, paquete editorial limitado a64 categorías/día; la65 omite solo esa dimensión. Cohortes creación/inicio/final distintas, segundos truncados y siete bins. Apariencia conserva cinco categorías/25 pares, marginales/ausencias/población, sin guardar fotografías vinculadas. El dominio no cambia.

### P2 — archivo nuevo y fallos

Únicamente AGG_DAILY_V1/esquema1: `cells`, `coverage_days`, `metadata`. Inicialización explícita; no se busca o abre `usage.sqlite`. Transacción y balances no negativos; un vuelo, unidad indivisible, cola2048 celdas/calidad y2MiB, reserva1024 SERVER, lote64,250ms. Edad60s y drenaje2s. No cursor/reenvío SQL. Fallo: invalida RAM, descarta, termina/verifica worker propio y libera solo sus leases; un intento de saneamiento, abiertos durables→unknown una sola vez, solo salas nuevas después. Lector privado no sanea ni presenta abiertos sin writer vivo como actividad actual.

Ejecutado con SQLite/worker reales temporales: rollback completo, salida real antes de append y después de COMMIT sin ack, reaperturas, entornos incompatibles, esquema anterior rechazado sin conversión, corrupción lógica/saldo imposible y recuperación nueva. La prueba de drenaje usa límite25ms/respuesta RPC sustituida; **no se presenta como un COMMIT real o una medición de2s de disco**. La falta de reserva y el umbral80% se inducen mediante metadatos de disco sustituidos; no se llenó un disco real ni se acredita capacidad del VPS. Los presupuestos de producción permanecen iguales.

### P3 — controles e información

Exclusión general y consentimiento específico separados; cookie booleana doce meses desde elección, sin renovación por GET/replay, memoria/aviso si no se confirma almacenamiento. Sesión anterior sin preferencia nueva→PENDING_LEGACY_CHOICE; las nuevas mantienen el régimen por defecto. Aceptación B19 no se lee o convierte. Rechazar apariencia no corta núcleo/HOME; un HUMAN excluido, incluido observador/reservado, corta el ciclo compartido sin reabrirlo al incluirse después.

Permiso GRANTED solo tras servidor, aviso actual,12h fijas y revisión; se verifica antes de consultar el tema con finalidad estadística y al admitir. Ventanas por conexión10s y primera foto gana; F5/resume/reconexión/consulta tardía no crean capturas. END vivo de A puede reducirse sin sustituir B. HOME difiere si el documento está oculto, sin ids, recurrencia o retry incierto. Aviso local2026-10-20.2 completo en privacidad sin montar sesión/juego por su consulta; operación factual conservada/adaptada.

### P4 — consultas, mantenimiento y retirada

Nueve consultas fijas privadas/CSV, días UTC cerrados, denominadores independientes/null/calidad/asOf y sin cruces. CLI y nueve exports realmente ejecutados con dataset fabricado/fecha de preparación controlada. Lector en worker solo lectura≤5s; permisos SO/ACL, sin autoridad HOST o SQL público. Mes actual+once anteriores, purga repetible; copia SQLite nueva agregada, cifrada AES-GCM, rotación7 y restore aislado sin sobrescritura. No detalle, relaciones, sesiones o partidas recuperadas.

[Inventario de retirada](RETIRADA.md): rutas/DTO/header/eventos/visitas/intenciones/recibos/esquemas/lectores/migraciones/colas y pruebas del modelo anterior sustituidos con sus consumidores. Las salvaguardas independientes se conservan: transporte/reconexión, JOIN registrado, T04 y no-store/archivos privados. No había una dependencia npm exclusiva del modelo retirado: Node/SQLite/worker/crypto ya pertenecen al runtime; lockfile y dependencias conservados. Compilación limpia con67 archivos y sin módulos/símbolos retirados. Herramientas Linux/Compose adaptadas; no se eliminaron sus puertas ni se relajan asserts por Windows.

### P5 — puertas ejecutadas

| Puerta | Resultado nuevo |
|---|---|
| `npm run check`, Node fijado, `VITEST_MAX_WORKERS=2`, fuente `d3f4486` | **614/614**,58 archivos,48,97s Vitest; typecheck/lint/build correctos; **103 módulos**, sin imports prohibidos/ciclos. [Salida final](check-final-d3f4486.txt). |
| `npm run test:browser -- --workers=2 --retries=0 statistics.spec.ts privacyNotice.spec.ts --trace on ...` | **5/5**,14,7s. [Salida](navegador-nuevos.txt). |
| Selección de regresiones (comando abajo), fuente compilada `c38e1f8` | Primer grupo **24/25**,1,6min; aserción B05 anterior incompatible con Apariencia B20. [Salida íntegra del intento, sin ids del caso de tiempo real](navegador-regresiones-primer-intento.txt). |
| `configuration.spec.ts --grep B05-01/03/04/07/09/11/13/15 --workers=1 --retries=0 --trace on` | **2/2**,8,1s,390/1280. Se exige único selector personal y ausencia de todos los controles compartidos/checkboxes; resto de asserts intacto. |
| Resumen de navegador | **31 casos únicos correctos**,5 nuevos+26 regresiones. No es una única ejecución31/31: incluye el caso390 reparado y el tamaño1280 adicional. No batería completa de Chrome. |
| Integridad | **124/124** fuentes de barajas iguales inicio=APP=blobs Git; siete archivos de presentación protegidos y árbol de dominio idénticos a565795c. Catálogo3 disponible; compilación limpia67 archivos. [Huellas](INTEGRIDAD.json). |
| CI/imagen | Sintaxis Node de ambos verificadores y `bash -n tools/ci-usage.sh` correctas en Windows/Git Bash. Docker cliente instalado, motor Linux no disponible (pipe dockerDesktopLinuxEngine ausente). **Linux/OCI/Compose/volumen NO ejecutados.** |

Comandos reales usan Node fijado y `C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`; también PATH fijado para sus hijos. El driver privado `playwright-report/b21/run-final-browser.ts` arrancó una instalación compilada propia en puerto0 y cerró exclusivamente esa instancia. Los cinco casos nuevos usan además instancias propias por caso. No se usaron fixtures o respuestas simuladas como evidencia de entropía/reloj normales.

Selección exacta de regresiones, ejecutada mediante CLI directa para que PowerShell/npm no interprete `|` como tubería:

```text
node node_modules/@playwright/test/cli.js test appearance.spec.ts cardFace.spec.ts cancelGame.spec.ts resultNotice.spec.ts timedGame.spec.ts timedRealGame.spec.ts bots.spec.ts lifecycle.spec.ts room.spec.ts join.spec.ts configuration.spec.ts --grep 'Adenda B20 selector|B20 P1 paletas y geometría|B17 D:|B17 consulta abierta:|B13 botón/diálogo/resumen 390px|B13/T04 A cancelada|B13 ack/evento perdidos|B13 anfitrión observador|INC-01|B08 T1 1280|B08 T2 390|B08-19/E7|B09 P2 normal compilado|B03-15 adverso|E1/E3/E4/E6|B02 dos navegadores independientes|B05-01/03/04/07/09/11/13/15.*390px' --workers=2 --retries=0 --trace on --output playwright-report/b21/final-browser-c38e1f8/regressions
```

No repeticiones completas de Chrome/corpus por rutina. Los check intermedios608/610/614 son exploratorios del desarrollo; el último repite la puerta obligatoria tras fortalecer la aserción temporal y reparar B05. No cambió ningún timeout de pruebas previas o del juego. Pruebas nuevas de archivos/CLI declaran15/20s por sus operaciones reales de ACL/procesos, no para ocultar un fallo. Sin force-click, acciones de juego directas, recorte de contenido o retirada de garantías.

### A01–A10: evidencia y límites por criterio

| Criterio | Evidencia realmente ejecutada |
|---|---|
| A01 | Reductor/SQLite: altas únicas, JOIN nuevo/recuperado/rechazado, cierres/inicio/finales,13 marginales, paquete65, automático único y balances. Main normal con humano/bots termina DECK_COMPLETED; SQLite registra ese final sin permiso de apariencia. No se atribuye el dataset de informes a partidas humanas. |
| A02 | D1/D2/D3, siete bins/extremos, truncado, cero→null, pendientes/U/X y consultas diarias cerradas. Fecha/reloj controlados, no tres días reales. |
| A03 | Rollback/COMMIT, un vuelo/reserva/celdas/bytes, worker real antes/después de commit y sin replay; fallo real del writer con HTTP/Socket.IO y Game que sigue. Disco/colas con parámetros controlados; sin capacidad VPS acreditada. |
| A04 | Dos cierres/rearranques reales de main propio: controlado por IPC→SIGTERM y kill abrupto; TECHNICAL_INTERRUPTION solo con evidencia, unknown sin duración en crash, saneamiento repetido y lectura bloqueada hasta sanear. En Windows, no señal POSIX/Linux. |
| A05 | Dos sesiones/pestañas, observador, cortes/lecturas/replays, cookie vieja en vuelo, revisión/conflictos, cookie sin renovación y cautela anterior. Límites4096/64,60 por minuto y120 por segundo comprobados con reloj/admisión controlados. No doce meses físicos. |
| A06 | HOME por presentación real de producto, F5 y nueva entrada; rerender/ocultar-mostrar/visibilidad diferida mediante estado de documento controlado en prueba pura. Privacidad no crea sesión/UUID/peticiones; sin visita o enlace al writer. |
| A07 | Sin permiso no se consulta el tema en captura ni se transmite; aviso anterior no concede. Permiso/retirada/caducidad12h/revisión, diagonal/START-END aislados/ausentes, proyección25 pares, primer valor por participación,10s exactos y desconexión. Producto: L0/L1/D1/C1, valor congelado/F5/otra sala; las cuatro apariencias funcionales se comprueban en paletas. No consentimiento de personas reales o12h reales. |
| A08 | Contratos/tabla/metadata cerrados y celdas/CSV/copia/restauración inspeccionados con datos fabricados; no ids/nombres/manos/snapshots o recibos hacia writer. DB/WAL solo reciben SQL de celdas/administración, nunca DTO completo. No se infiere anonimato por búsqueda negativa. Capturas y trazas de prueba no son datos de audiencia real. |
| A09 | Windows: ACL/permisos, separación entorno/tráfico, CLI nueve informes/CSV,12meses UTC/purga repetida, siete copias/restore aislado y modelo inesperado rechazado sin migración. Linux/UID/read-only/volumen/proxy de imagen preparados, **pendientes de ejecutar**. |
| A10 | 31 casos únicos: creación/entrada/configuración, humano-bots normal, timeout/automático, cancelación/observador/acks, cuatro recorridos T04, transporte adverso, apariencia/adenda/Detalles/foco. Sin módulos retirados en dist/dist-server. No certifica toda la batería de navegador/MVP. |

Reserva de turno, revisión y retención se comprueban con tiempo controlado salvo el caso real siguiente.

### Tiempo real y revisión visual

[Vencimiento real](vencimiento-real.json): SystemClock/TimerScheduler/entropía normales; transporte activo cerrado21:25:48.073Z, límite21:26:02.898Z, observación21:26:03.397Z (**+498,249ms**), contador propio1 y recuperación correcta. No un fake clock o una pestaña simplemente inactiva. Retención30min/permiso12h no se han esperado físicamente.

Revisadas por el agente las capturas de controles1280/nueva sala390 y las medidas automáticas de paletas/adenda/Detalles. [PC](capturas/controles-1280.png), [móvil emulado](capturas/nueva-sala-390.png), [aviso390](capturas/aviso-390.png), [aviso1280](capturas/aviso-1280.png). No aprobación visual humana, dispositivos físicos o comprensión/consentimiento de usuarios. Las cuatro apariencias/normal-compacta y controles de cartas se conservan mediante las regresiones y hashes, sin rediseño o ajustes CSS.

Trazas/reportes completos nuevos: `playwright-report/b21/final-browser-c38e1f8/`, `b05-assertion-correction/`, `privacy/` y `playwright-report/b20-adenda/20261020-selector-detalles/b21-c38e1f8-final/`. Los intentos anteriores permanecen en carpetas separadas; no sustituyen evidencia histórica B20. No DB/CSV/clave real en Git.

### Fallos/reparaciones y revisión semántica

1. P1 corrigió una expectativa de prueba de14 dimensiones: el catálogo acordado contiene13. No cambió el contrato para adaptar contenido.
2. Una ejecución restringida produjo ENOENT al cargar módulos temporales;40/40 focales fuera de esa restricción, sin variar asserts o plazos. SQLite/HTTP posteriores47/47 y procesos/focales50/50 son antecedentes de edición, no la puerta final.
3. En conexión real se añadió espera por la entrega del evento de la segunda pestaña (sin ampliar timeout); el primer evento no acredita que el otro ya llegó.
4. Primer navegador nuevo1/3: lecturas de control duplicadas agotaban ráfaga10. Se coalescen y se reutiliza confirmación de socket propia; no se amplió presupuesto. Nueva restricción entre pestañas es inmediata/pending, una señal de inclusión no concede por sí misma.
5. Cookie antigua en vuelo podía revertir una inclusión expresa: RAM funcional con revisión manda tras elección reconocida; cookie solo inicializa estado nuevo. Regresión pura y producto reparadas; GET/replay no renuevan expiración.
6. Revisión final añadió reserva de disco antes de ready y drenaje que no espera un RPC5s para descartar al límite2s; lector no exporta abiertos de un proceso detenido como actuales. Comprobaciones específicas y check final correctos.
7. B05 exigía cero combobox en toda la página del invitado desde antes de B21; `git show565795c:src/RoomConfiguration.tsx` ya contiene Apariencia personal para ambos roles. Se exige un único selector Apariencia habilitado y cero `.config-control`/checkboxes. No se ocultó el selector o deshabilitó interacción para pasar.
8. La aserción de fallo del writer se fortaleció antes del cierre: usa `game.interaction.turn.timing`, exige objeto/límite15s y compara recuperación; no una propiedad indefinida. Incluida en el último check614/614.

Revisión de responsabilidades: Game/domain sin modificaciones; puertos/fórmulas/reductor/controles en aplicación; SQL, archivos, cookies/transportes y workers en infraestructura; composición selecciona entorno/adaptadores/CLI. Cliente solo declara HOME/fotos consentidas y controles funcionales. Estado/dedupe antes de observación y emisión, sin await/IO en decisión del juego, sin Room/Game hacia writer. Leases administrativos del proceso no se usan como identificadores estadísticos. API/catálogo/medios y manos privadas conservados.

### Entrega y pendientes

La [guía vigente](../../../operacion/ANALITICA_AGREGADA_B21.md) contiene instrucciones manuales y el procedimiento posterior de actualización única, vuelta al paquete anterior con su archivo/OFF y borrado delimitado **no ejecutado**. Las guías anteriores quedan señaladas como históricas sin mezclar cambios previos del autor.

Pendiente: referencia recibida de Arquitectura ([traslado](../../TRASLADO_ARQUITECTURA_B21_ANALITICA_AGREGADA.md)); Linux/imagen/Compose/volumen/copia de esa imagen y CI posterior; revisión humana/operación/activación o borrado solo por otro encargo. C09–C10 siguen parciales. No mensajes a otros hilos, push, PR, GHCR o VPS. Detenerse tras entregar el cierre técnico local.

## Incidencia de sincronización SQLite — 22/10/2026

CI39690754879, intento1/fuente13bc564: imagen correcta, check618/619; Chrome no ejecutado. Falla A07/A08 al leer START=0 tras await writer.flush(). El escritor retorna inmediatamente cuando ya hay pending/flight; esa llamada despacha, no garantiza durabilidad de toda la cola. La traza histórica no registra pending; no se afirma su instante exacto solo porque otra ejecución pase.

Reparación exclusivamente de server/statisticsIntegration.test.ts: barrera de ensayo espera entries=0, despachando los siguientes lotes si procede, antes de las mismas aserciones SQLite. Sin cambiar escritor, contratos, conservación, permisos, reductor, plazos o reintentos. Caso causal nuevo retiene exactamente un mensaje append al worker real: la segunda flush termina con entries>0 y HOME=0; liberar una vez y esperar la barrera produce HOME=1/entries=0. Demuestra el supuesto incorrecto, no un reensayo favorable por sí solo. Se aplica la misma barrera a las lecturas de los cuatro casos del archivo para conservar sus garantías.

Focal Windows propio y aislado: causal1/1 en2965ms; el caso de ventanas quedó bloqueado por EACCES de conexión loopback del sandbox. Se repitió únicamente ese caso fuera de la restricción,1/1 en3196ms. Sin instalar/compilar ni detener servidores del autor; usa compilación B21 existente, no acredita Vite8.3.5/Linux. Se conservan ambos logs e intento fallido. Las puertas Linux posteriores se registran en PR17/evidencia de publicación. El OCI de la ejecución global fallida no es candidato aprobado.
