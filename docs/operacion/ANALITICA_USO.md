# Analítica propia B18 — operación preparada, recogida pública apagada

18/10/2026. Solo estadística; salas, partidas, resultados y sesiones continúan en RAM de un proceso. Sin panel ni servicio externo. La implementación **no ofrece un modo de activación HUMAN**. Activación futura requiere revisión de privacidad y preparación operativa por el autor. SQLite no recupera una partida.

## Configuración y separación

Node 24.19.0 del README, sin cambiar instalaciones globales. La composición usa `KARTA3_ENV` (`development|test|pruebas|production`), nunca deduce entorno de NODE_ENV. `KARTA3_USAGE_COLLECTION=off` por defecto. Únicamente `synthetic` junto con `KARTA3_ENV=test` admite recogida en una instancia propia aislada. El navegador solo se habilita mediante cabecera de esa instancia; en ejecución normal ni genera visitas ni envía eventos.

`KARTA3_USAGE_DIRECTORY` debe ser absoluta, privada, fuera del estático. Archivos separados `<directorio>/<entorno>/human|synthetic/usage.sqlite`; ambos metadatos se comprueban antes de usar la DB. El comando humano no abre el fichero sintético. `off` no borra el histórico: si está configurado y existe, un worker conserva su mantenimiento sin sink de recogida. Sin archivo no se fabrica un histórico vacío. Mantener el servicio de mantenimiento diario también cuando no se ejecute la aplicación.

Ejemplo para ensayo propio en PowerShell, **otra consola y puerto libre**; seleccionar antes el Node del README:

```powershell
cd E:\KARTA3\KARTA3_IA\APP\karta3
$env:PORT = '3178'
$env:KARTA3_ENV = 'test'
$env:KARTA3_USAGE_COLLECTION = 'synthetic'
$env:KARTA3_USAGE_DIRECTORY = Join-Path $env:LOCALAPPDATA 'KARTA3\usage-b18-aislada'
npm run build
if ($LASTEXITCODE -eq 0) { npm run start }
```

Abrir `http://127.0.0.1:3178` en dos sesiones independientes y otra pestaña de la primera. Crear/entrar, recuperar con F5, configurar y jugar con bots hasta resultado; probar automático y cancelar otra partida. Todos esos hechos son **SYNTHETIC**, aunque los ejecute el autor. El servidor no lee nombres/códigos/cookies del transporte para enviarlos al adaptador estadístico. Una intención sin confirmación no demuestra rechazo.

Al terminar, Ctrl+C y `$env:KARTA3_USAGE_COLLECTION = 'off'`. No modificar el servidor del autor, sus puertos ni su configuración. No instalar datos de ensayo en Pruebas pública.

## Consulta administrativa fija

Acceso por SSH con clave y permiso **del sistema** a la cuenta propietaria; localmente se exige la ACL equivalente. No hay autenticación web nueva ni permiso por cookie HOST. No dar acceso al socket Docker o shell completo a un delegado solo para informes: el administrador deberá preparar una regla acotada con ejecutable/entorno/directorio fijados y solo los argumentos de consulta admitidos. Esa preparación/SSH real no se instala desde B18.

```powershell
$from = (Get-Date).ToUniversalTime().ToString('yyyy-MM-01T00:00:00.000Z')
$to = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
npm run usage:report:synthetic -- --report completion --from $from --to $to --environment test --format csv
```

Consultas: `access`, `creation`, `joining`, `room-conversion`, `configuration`, `duration`, `completion`, `automatic`. El comando ordinario es `npm run usage:report -- ...`; solo consulta HUMAN y no acepta selector de tráfico. Sin histórico humano devuelve `COLLECTION_DISABLED`. No admite SQL, rutas de salida o columnas libres. En imagen compilada puede usarse `node dist-server/server/composition/usageCli.js ...` sin dependencias de desarrollo.

La salida nombra un archivo **nuevo** privado en el directorio de su DB, nunca una URL. JSON/CSV tienen periodo, entorno, cantidades/denominadores, porcentaje o null, suma/media/min/max de duración, asOf y calidad. Calidad técnica conservadora por meses que intersectan el filtro; conflictos/pérdidas no se ocultan ni se convierten en 0 %. Cobertura parcial y archivo restaurado se señalan. Fechas sin cobertura o granularidad diaria ya purgada producen `INSUFFICIENT_DETAIL`; no ceros ficticios. El mes inicial puede tener cobertura parcial, indicada por `coverageFrom`. CSV incluye denominadores incluso vacío y neutraliza fórmulas en texto. Entrada confirmada cuenta NEW_JOIN, no una respuesta de rechazo o EXISTING_PARTICIPATION; resultados/intenciones sin enlazar impiden presentar una tasa completa.

La calidad incluye una instantánea operativa privada fechada (`operational.at`): enabled/degraded/paused, cola/bytes y descartes por causa/origen, sin IDs. Se publica al cambiar, fuera de la sección síncrona del juego, con una sola actualización pendiente; no es un décimo evento ni una lectura en vivo. `operationalStale` avisa cuando falta o supera 60 s. Tras un corte abrupto pueden faltar la cola y sus pérdidas más recientes: no interpretar el último cero como ausencia demostrada de pérdida. Una copia agregada no conserva esta instantánea volátil como si fuera el estado de un servidor restaurado.

El informe abre SQLite **solo lectura** en su worker, con snapshot de lectura; no migra, reconcilia ni purga la DB activa y no desplaza al escritor. Si encuentra detalle ya vencido cuyo mantenimiento falló, devuelve `STORAGE_UNAVAILABLE` para repararlo, sin servirlo como vigente. Una lease privada impide dos escritores sobre el mismo fichero. El comando de mantenimiento se usa sin el escritor de la app; la copia administrativa usa Online Backup de una conexión de lectura y no modifica el arranque vivo. El `lastBackupAt` durable del origen corresponde a las copias programadas por su escritor; una copia manual se acredita por el archivo y su asOf, sin escribir el origen.

Solo una exportación/copia por directorio. Consulta limitada a 5 s; fallo significa error seguro, no informe vacío. Un lock incompleto o de proceso aún vivo no se roba: diagnosticar el escritor/operación y, con todos ellos detenidos, retirar únicamente su `.report.lock` si corresponde. Un lock con PID ya inexistente se recupera. No ejecutar reparaciones sobre la instancia del autor desde otro hilo.

## Conservación, copias y restauración

- Detalle, dedupe y proyecciones individuales: 90×24 h, sin renovación por consulta. Consolidación/purga transaccional repetible; las cohortes abiertas se censuran. Doce meses UTC incluido el actual para agregados/calidad. CSV/JSON de informes caducan al salir su mes más antiguo de esa ventana.
- WAL, foreign keys, FULL synchronous, secure_delete y checkpoint TRUNCATE tras purga. No vaciar una DB corrupta para aparentar recuperación. Fallos de mantenimiento pausan admisión y requieren reparación dentro del plazo; la retención no autoriza a conservar detalle indefinidamente por una avería.
- Copia diaria **solo agregados**: Online Backup a intermedio privado, exportación a SQLite **nuevo**, AES-256-GCM (`K3AGG1`). Incluye contribuciones del mes actual; nada de copiar la DB viva o borrar tablas de una copia completa como archivo final. Los intermedios se eliminan; operaciones posteriores bajo bloqueo único limpian los abandonados de su espacio reservado.
- Siete archivos rotatorios en `backups/`; se retiran también al vencer un mes que pudieran contener, aunque queden menos de siete. RPO inicial 24 h para agregados, no capacidad acreditada del VPS. Copia coherente no equivale a entrega exactamente una vez.
- `KARTA3_USAGE_BACKUP_KEY_FILE`: fichero privado con 32 bytes aleatorios expresados en 64 hex. Fuera de Git y de comandos/logs; guardarlo separadamente de las copias. No se proporciona clave real. Configurado, el worker copia al arrancar y diariamente, incluso con sink apagado. Sin clave no hay copia nueva; el autor debe preparar y supervisar esa operación antes de activar.

Con el entorno/directorio/clave ya fijados por el administrador:

```text
npm run usage:maintain
npm run usage:backup
```

Programarlos diariamente como cuenta autorizada cuando la app no ejecute su mantenimiento; no instalar cron/tarea/VPS desde este encargo. El autor trasladará una copia **cifrada** a otro disco bajo su control, comprobará su integridad y aplicará allí la misma caducidad mensual. Ni volumen ni siete archivos en el mismo disco son copia externa. Esta operación externa y su supervisión siguen pendientes.

Restauración aislada: configurar un **directorio nuevo**, mismo entorno/tráfico, clave y `KARTA3_USAGE_RESTORE_FILE` absoluto al archivo cifrado. `npm run usage:restore` exige destino inexistente, autentica GCM, comprueba SQLite/entorno/tráfico y cero eventos/proyecciones, y aplica mantenimiento antes de consultar. `usage:report:synthetic` permite comprobar el archivo test; el ordinario consulta el archivo HUMAN. Es un archivo de consulta agregado, no destino para recoger eventos nuevos. Mes actual recuperable hasta el asOf de la copia, sin inventar detalle posterior; consultas parciales anteriores a ese corte se rechazan. Los activos/pending de la copia se etiquetan al corte, nunca como juegos vivos. Perder el disco puede perder definitivamente todos los eventos/detalle y el intervalo posterior a la copia.

## Volumen y límites

`deploy/compose.usage.yaml` prepara un montaje opcional `/var/lib/karta3/usage`, **off fijo**, sin puertos nuevos. Dockerfile crea el punto UID 1000/0700; usuario node/raíz read-only se conservan. Solo Caddy publica 80/443. Usar otro proyecto/volumen para cada entorno; no aplicar estos archivos al VPS desde B18. Preparación declarativa/sintaxis Windows no acreditan ejecución Linux.

Directorio 0700 y DB/WAL/SHM/CSV 0600; ACL equivalente en Windows, sin herencia abierta. DB/WAL/SHM, exportaciones/copias y rutas privadas devuelven 404, sin fallback HTML. No montar datos en dist/media/barajas ni incluirlos en imagen/Git.

Límites iniciales conservados de B18: ingesta 2 KiB/contexto 256 bytes; cubos 60/min/10 y global 120/s/240, 4096 visitas/30 min; cola 2048 y 2 MiB incluidos en vuelo, 1024 plazas SERVER, batch64/250 ms; retry1/5/30 s/edad60 s; drenaje2 s; DB512 MiB/WAL64 MiB/reserva128 MiB, aviso80 %. Worker con heap máximo128 MiB, fallo aislado y sin espera en el juego. Antes de copia se reserva también espacio para el intermedio. Los presupuestos son límites/degradación, **no** rendimiento/capacidad demostrados del VPS. No se llenó físicamente un disco de producción ni se esperaron 90 días/30 minutos reales.

## Repetición técnica y pendientes

`npm run check`; `npm run test:browser -- --workers=2 usage.spec.ts` y selección de regresiones registrada en B18. Pruebas usan exclusivamente datos sintéticos temporales y servidores propios. Hay pruebas de SQLite real, reloj controlado, conexiones reales y procesos compilados; no equivalen a revisión humana, dispositivos físicos o activación pública.

Pendientes antes de verificado global/operación: alineación de fuentes de Arquitectura por el autor, ejecución Linux de runtime/volumen/permisos/backup, revisión de privacidad e información, autorización SSH/delegación real, tarea/supervisión de copia cifrada externa y ensayo operativo del responsable. C09–C10 permanecen parciales.

## Recepción de Arquitectura y preparación de publicación — 18/10/2026

Referencia general recibida del autor y contrastada en lectura: **18/10/2026**, Aplicación §16.1 y evidencia §17.12; Infraestructura §§1–4, 12.1, 14.1, 15.1–15.2 y evidencia §16.9. Alineación recibida, sin modificar TFM ni el contexto de coordinación. Los textos de cierre anteriores que indican recepción pendiente son históricos de su fecha.

Windows conserva 587/587,51 archivos/92 módulos y39/39+8/8 seleccionados con dos trabajadores, no batería completa ni Linux. El autor comunica partidas manuales en instancia sintética; coordinación confirmó dos salas/inicios/finales, configuración y duraciones en informes privados. Es evidencia recibida local/sintética, no consulta nueva de este hilo al histórico del autor ni operación pública.

La publicación verificará primero Linux focal B18 y la misma imagen con UID1000, raíz read-only, volumen privado, permisos, administración solo lectura, parada POSIX/recreación, persistencia estadística sin RAM jugable, copia cifrada y restauración aislada. Después CI completa de fuente y squash/main, con un trabajador/cero reintentos. No se declara superada una puerta por describirla; resultados y fallos reales se enlazarán desde el registro operativo y la PR.

Siguen pendientes privacidad/información, habilitación expresa futura de recogida real, acceso administrativo en VPS, copia externa/supervisión y ensayo del responsable. Sin modo HUMAN habilitado, GHCR, VPS, dashboard, métricas nuevas o cambios editoriales. B18 no se declara verificado globalmente ni operativo públicamente.
