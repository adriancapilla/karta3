# Operación preparada de AGG_DAILY_V1 — B21

Guía de la versión local nueva. No autoriza activación, publicación, actualización del VPS o borrado. Las guías B18/B19/B20 son históricas; no ejecutar sus migraciones, lectores o configuraciones con este paquete.

## Modelo y condiciones

- Juego, salas, resultados y sesiones: RAM, un proceso por entorno. SQLite solo contiene `cells`, `coverage_days`, `metadata`, esquema propio 1/modelo `AGG_DAILY_V1`.
- Núcleo de servidor y HOME por defecto bajo las condiciones recibidas. HOME solo cuenta presentaciones visibles, no visitas/personas. Sin enlaces entre portada y juego.
- Exclusión funcional personal; un HUMAN incorporado/reservado, incluido anfitrión observador, corta futuras aportaciones del ciclo compartido. Quitarla solo afecta operaciones propias futuras y salas nuevas. Cookie `karta3_statistics_exclusion` (`1:0`/`1:1`), doce meses calendario desde elección; no renovar al leer/repetir. En HTTPS es Secure/SameSite=Lax; desarrollo HTTP local no usa Secure.
- Sesión anterior con cookie y sin nueva preferencia: cautela sin medición hasta elección explícita. Las nuevas sesiones RAM no se convierten en anteriores por F5. Después de reinicio se vuelve a aplicar la cautela. No se leen recibos B19.
- Permiso específico de apariencia, separado, aviso `2026-10-20.2`, doce horas RAM como máximo. Sin él no hay lectura/transmisión estadística del tema. START/END solo en transición viva, conexión original y diez segundos. Una aceptación tardía no reconstruye START. No permiso para bots/observadores, recurrencia o cambios intermedios.
- Persistencia únicamente agregada, sin eventos, ids/ref/hash de juego/personas, recibos, fotos vinculadas o snapshots. Correlación/dedupe RAM: máximo 4096 ciclos/dos horas; 4096 oportunidades/diez segundos. No confidencialidad por supuesta anonimización: los informes privados deben revisarse antes de compartir.

## Configuración nueva

`KARTA3_ENV`: development/test/pruebas/production explícito. `KARTA3_STATISTICS_MODE`: `off`, `synthetic` solo test, `aggregate` solo Pruebas preparada (predeterminado en ese entorno). No amplía producción. `KARTA3_STATISTICS_DIRECTORY`: raíz absoluta privada; ruta final `<raíz>/<entorno>/<human|synthetic>/agg-daily-v1.sqlite`. No usar el nombre/volumen viejo ni árboles públicos. `KARTA3_STATISTICS_BACKUP_KEY_FILE`: archivo privado con 64 dígitos hexadecimales (32 bytes); requerido para aggregate. No valor de clave literal en variables/Git.

Inicializar es explícito: `npm run usage:initialize`, una vez en ubicación nueva vacía. Arrancar nunca crea, vacía, migra o autodetecta una base anterior. OFF no crea un archivo vacío y mantiene el nuevo archivo existente. Falta/invalidez de configuración, información o almacenamiento deja estadísticas indisponibles; no impide jugar.

Los Compose preparados usan **statistics_data**, separado de usage_data; solo el nuevo directorio se monta en `/var/lib/karta3/statistics`. Se conserva no root/raíz de contenedor de solo lectura. No se han aplicado estos archivos a un entorno existente.

## Ensayo local fabricado, instancia propia

No ejecutar sobre un directorio del autor. Sin reinstalar ni cambiar Node global:

```powershell
cd E:\KARTA3\KARTA3_IA\APP\karta3
$env:PATH = 'C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
$env:KARTA3_ENV = 'test'
$env:KARTA3_STATISTICS_MODE = 'synthetic'
$env:KARTA3_STATISTICS_DIRECTORY = Join-Path $env:TEMP ('karta3-b21-demo-' + [guid]::NewGuid())
$env:PORT = '0'
npm run build
npm run usage:initialize
npm run start
```

Abrir la dirección con el puerto real que imprime esta instancia. Dos perfiles o ventana normal/privada: comprobar inclusión por defecto; elegir temas funcionales distintos sin permitir fotos; crear/entrar/seleccionar explícitamente baraja e iniciar. Permitir apariencia **antes** de otro ensayo permite START/END; permitir solo después no reconstruye START. Probar «No permitir» y «Retirar permiso» sin cortar núcleo/HOME; excluir desde segunda pestaña corta el ciclo, sin pausar ni cancelar la partida. F5/consulta tardía no crean fotos; nueva sala tras resultado sigue T04. Probar HOST observador con invitados/bots. Una cookie anterior sin nueva preferencia debe mostrar la cautela, sin impedir jugar.

Ctrl+C detiene solo la instancia propia; pierde juego RAM. Reiniciar conserva agregados nuevos, no partidas/permiso de apariencia. Para consultar un periodo diario debe estar cerrado UTC; no usar el día actual para fingir evidencia. Pruebas deterministas con datos conocidos: `npm test -- server/application/statistics server/infrastructure/statistics server/statisticsIntegration.test.ts server/statisticsProcess.test.ts` y `npm run test:browser -- --workers=1 --retries=0 statistics.spec.ts privacyNotice.spec.ts`.

## Consultas administrativas privadas

Acceso por permisos del SO/SSH, nunca cookie HOST, SQL libre, dashboard o API pública. Nueve consultas: access/creation/joining/room-conversion/configuration/completion/duration/automatic/appearance. Las normales leen HUMAN; `usage:report:synthetic` solo SYNTHETIC/test. Ejemplo con días completos cerrados (ajustar a periodo de prueba existente):

```powershell
npm run usage:report:synthetic -- --report appearance --from 2026-10-18 --to 2026-10-20 --environment test --format csv
```

Salida: nombre de archivo nuevo en el directorio privado, JSON o CSV agregado, permisos 0600/ACL equivalente. Incluye modelo, bases, porcentajes null, calidad/asOf/cohorte y estados ZERO/NOT_CAPTURED/NOT_INSTRUMENTED/UNAVAILABLE. Nunca sumas con series antiguas. La duración se trunca a segundos, sin mínimos/máximos individuales; bins 0/60/180/300/600/1200/2400. Configuración marginal, no cruce. Apertura de instantánea máxima cinco segundos y una exportación privada simultánea.

## Fallos, límites y conservación

Cola 2048 celdas/calidad y 2 MiB (incluye vuelo), reserva 1024 SERVER, lote máximo 64 celdas/calidad sin partir una unidad, cada 250 ms; no expulsar admitidas. Un vuelo, transacción completa, ack tras COMMIT. Edad máxima 60 s; drenaje al cerrar como máximo 2 s. No cursor durable ni reintento de lote. 202 acredita cola, no durabilidad.

Fallo/COMMIT incierto: pausar, invalidar RAM/ventanas, descartar pendientes y vuelo; terminar/verificar salida del escritor anterior y liberar solo su lease. Un intento de reapertura/saneamiento reclasifica **saldos durables abiertos** a unknown, una sola vez, sin reconstruir datos descartados o inventar duración/final. Solo salas nuevas vuelven a observarse. Fallo de ese intento: PAUSED hasta actuación administrativa/reinicio. Game y sus plazos continúan.

4096 estados de control y 64 solicitudes RAM por estado; 60/minuto, ráfaga 10; límite global 120/s, ráfaga 240. Saturar no concede ni deshace restricciones. DB 512 MiB, WAL 64 MiB, reserva de disco 128 MiB; worker 128 MiB; advertencia técnica acotada sin payloads. Son presupuestos, no capacidad acreditada del VPS.

Conservar mes UTC actual y once anteriores. Mantenimiento de nuevo archivo al arrancar/diariamente y `npm run usage:maintain` con escritor detenido; purga repetible de celdas/cobertura/exportaciones/copias vencidas. No detalle90d, migraciones o recibos nuevos. No se toca el archivo anterior.

## Copia/restauración preparadas

Con clave privada configurada: snapshot coherente → archivo SQLite limpio agregado → AES-256-GCM. Siete copias diarias rotatorias y caducidad mensual. `npm run usage:backup` crea copia manual privada; nunca descargar DB/WAL por HTTP. La clave se custodia por separado, no se imprime. Un ensayo sintético puede crear su clave dentro del directorio privado recién inicializado, usando `crypto.randomBytes(32)` y escritura nueva 0600; no reutilizar secretos del autor.

Para restaurar: entorno/tráfico coincidentes, destino nuevo aislado, `KARTA3_STATISTICS_RESTORE_FILE` absoluto y clave privada; `npm run usage:restore`. Rechaza sobrescritura/modelo ajeno/copia vencida, sanea abiertos a unknown una vez y no activa captura. Recupera agregados, no relaciones, cola, sesiones, partidas o datos no respaldados. Copia fuera del disco/custodia real siguen a cargo del autor; no se promete RPO ni recuperación de eventos. Linux/volumen/copia deben pasar su puerta específica, no se acreditan mediante Windows.

## Procedimiento posterior — preparado, NO ejecutado

1. Autorizar operación por separado. Identificar imagen/fuente/configuración previa y objetivo; revisar aviso, modo y destino nuevo, cautela antigua y ausencia de permiso heredado. Preparar explícitamente archivo nuevo/clave/volumen privado; no migrar.
2. Una actualización con interrupción: detener paquete anterior; configurar nuevo directamente al modo aprobado y arrancar tras autorización. Registrar día cero/hueco, comprobar juego/controles/consultas. No doble ingesta, activación por esta guía o mezcla de series.
3. Reversión: detener nuevo y volver a paquete anterior con su archivo/configuración compatibles o analítica OFF. **Nunca abrir AGG con ejecutable anterior**. Sin lector legacy en producto nuevo. Mantener identificadas las dos ubicaciones.
4. Borrado solo con encargo adicional: inventario delimitado de rutas absolutas reales de bases viejas/WAL/SHM/journal, exports, copias y tareas; comprobar pertenencia y detener sus consumidores. Resolver por separado copias Hostinger, sin prometer borrado del proveedor por eliminar un fichero local.
5. Ejecutar únicamente inventario autorizado; excluir nueva base/clave, barajas, juego, Git/evidencias. Verificar tareas y registrar sin copiar contenido/secretos. La pérdida de histórico anterior es aceptada, no se ejecuta aquí.

Publicación, imagen/CI, operación, revisión humana y recepción de Arquitectura se registran separadamente del ensayo técnico local. C09–C10 siguen parciales.
