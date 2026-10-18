# B18 — evidencia nueva del 18/10/2026

**Estado:** tres etapas implementadas/comprobadas técnicamente en Windows. **No verificado globalmente:** Linux, alineación de Arquitectura y preparación de privacidad/operación pendientes. Recogida pública apagada, sin modo HUMAN habilitado. No fuentes TFM/ASSETS/PRODUCTO/Diseño editadas ni publicación/VPS.

## Referencias

- Base main555c50d; preparación documental preservada d9262c9; etapa1 ce7e4c0; implementación341d04d; fuente final comprobada **1ce58e22dcbb051cfe36e3724798101494b9273d**. Cierre documental posterior, sin otro cambio de producto.
- Node24.19.0 en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`; npm11.6.2, ICU78.3/Unicode17, SQLite3.53.3. PATH de terminal con wrapper npm propio ignorado, sin instalación global modificada.
- Comandos, resultados por A01–A13 y fallos/reparaciones: [B18 §15](../../BLOQUE_18_ANALITICA_BASICA_USO.md#15-registro-de-implementación--18102026). Responsabilidades: [mapa APP](../../../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md). Operación/manual: [guía](../../../operacion/ANALITICA_USO.md).
- [124 rutas/tamaños/SHA-256/blobs de la base intactos](integridad.json). Genérica/Solar formato2/contenido4, Criaturas formato2/contenido2, disponibles; JSON/recursos no modificados.
- [Resumen estructurado sin detalle personal](verificacion-local.json). [Archivos de la entrega](archivos.txt). [Traslado de alineación por el autor](TRASLADO_ARQUITECTURA.md); referencia recibida todavía pendiente.

## Puertas finales ejecutadas

`npm run check`: **587/587 en51 archivos,92 módulos**, tipos/lint/build/arquitectura correctos. Incluye49 pruebas nuevas y538 regresiones reejecutadas. No son cifras históricas acreditadas sin ejecutar. Registro local `playwright-report/b18/check-final.log`.

`npm run test:browser -- --workers=2 --retries=0 usage.spec.ts room.spec.ts join.spec.ts configuration.spec.ts cancelGame.spec.ts resultNotice.spec.ts timedRealGame.spec.ts`: **39/39,1,9 min**.

`npm exec -- playwright test --workers=2 --retries=0 bots.spec.ts format2Presentation.spec.ts timedGame.spec.ts --grep "B09 P2 normal compilado|B15 espera:|B15 frontera medida|B08 T1|B08 T2"`: **8/8,49.8s**, mismo build. Total47; no batería completa de navegador ni corpus visual completo por rutina. Instancia normal propia127.0.0.1:60901/PID18176, iniciada/cerrada por el arnés; dist/dist-server/catálogo SHA idénticos antes/después de cada selección. Recogida off allí; B18 habilita únicamente hijos sintéticos aislados. Partida completa normal con humano/EASY/HARD, dos sesiones/pestañas, recuperación/retornos/cancelación/T04, controles/privacidad/plazos y normal/compacta360/390/1280/frontera útil1367–1368. No revisión humana o dispositivo físico.

## Categorías separadas

| Evidencia | Qué acredita |
|---|---|
| SQLite temporal real | Inserción/replay/conflicto sin sobrescritura, rollback inducido, proyecciones/fórmulas/cohortes, mantenimiento repetido, archivo nuevo cifrado/restore y ausencia de IDs/detalle. |
| Reloj controlado | Bordes−1/0/+1 ms de revisión final,90 días y doce meses UTC, censura, edad60 s, rotación30 min/12 h, timeout de consulta5 s con **worker sustituto sin respuesta**. No SQL lento real durante5 s. |
| HTTP/Socket.IO reales + tiempo controlado | Dos sesiones/dos sockets host, replay/ack ignorado/concurrencia, snapshots reales de tres barajas, privacidad de eventos/DB/vistas y terminales únicos. |
| Conexiones y reloj normales | Escritor bloqueado con transacción real y vencimiento15 s con jugador activo desconectado; otra sesión observa TIMEOUT. Artefacto local writer-blocked-real-turn.json: cola1/386 bytes al observar. No aceleración. |
| Chrome normal compilado | Regresión B08 de15 s: transporte cerrado, observación posterior al límite y recuperación/contador1. Partida completa humana contra bots con entropía normal. |
| Procesos propios compilados | Kill abrupto/rearranque real → UNKNOWN sin duración; parada controlada/rearranque → TECHNICAL_INTERRUPTION. En Windows el arnés privado llama al manejador SIGTERM dentro del hijo, sin endpoint de producto; no acredita señal POSIX. |
| Presupuestos/fallos | 2048 eventos, reserva y bytes; budgets DB/WAL de64 KiB **solo en fixture** sin alterar512/64 MiB operativos; corrupción sin reemplazar archivo; caída de worker real; ACL Windows positiva/negativa. Disco físico lleno/capacidad VPS no probados. |
| Sonda SQLite query_only | Escritura rechazada, evento previo conservado. `node playwright-report/b18/readonly-probe.mjs`, resultado READONLY_PROBE_OK; no disco físico montado read-only. |
| Compose | `docker compose -f deploy/compose.yaml -f deploy/compose.usage.yaml config --quiet`, salida0 con referencias locales de ejemplo. Sintaxis únicamente. Docker Linux daemon ausente; **Linux/UID1000/montaje/runtime/copia pendientes**. |

Los registros extensos/capturas de regresiones están en `playwright-report/b18`/`test-results` ignorados. No DB, CSV individual, secreto, dump de payloads o credenciales en este expediente. Los informes/archivos temporales del ensayo se eliminaron al cerrar cada instalación.

## Incidencias de verificación conservadas

Iniciales: corte90 días; ACL/autoload PowerShell; datos/selectores de los **nuevos** tests; orden aleatorio por UUID cuando timestamp igual y carrera artificial1 ms de edad. Se repararon sin tocar reglas o aserciones heredadas. La fixture aislada de worker incorporó su dependencia privada y movió la guarda de ruta antes de finally (lint). La revisión de responsabilidades separó fórmulas/lector/escritor/copias. Después se reforzaron tipos numéricos estrictos, rechazo sin requestId, pérdidas del mapa de correlación y prohibición de rutas estáticas con mayúsculas. Un EPERM intermedio de limpieza Windows se corrigió esperando en la fixture la salida nativa/lease tras el cierre acotado, sin aumentar el drenaje de producto; la puerta final587 pasó. La salud operativa fechada incluye cola/bytes/descartes y aviso de antigüedad, sin añadir eventos ni IDs.

El primer recorrido38/38 usó NODE_ENV=test al reconstruir Vite: bundle distinto/dev. El guard de huellas lo rechazó para cierre; diagnóstico conservado en browser-inicial-node-env-test.log y browser-summary-inicial-node-env-test.json. Se corrigió **solo el arnés ignorado**, reconstruyó producción y repitió38+8 con igualdad de huellas. La selección final39+8 corresponde a1ce58e2 e incluye además el nuevo recorrido completo con SQLite sintético; los registros intermedios0eb16bd/d59f027/4e326d6 se conservan por separado. Ninguna tolerancia, timeout del juego, fuerza de clic o aserción se cambió para pasar.

## Pendientes para el autor

Devolver referencia de alineación de fuentes generales; ejecutar Linux/runtime/volumen/permisos con Node fijado; preparar/supervisar autorización SSH y copias cifradas fuera del disco, tarea/RPO; revisión de privacidad/información antes de cualquier recogida pública. Recorrido humano de B18 todavía pendiente, instrucciones listas. C09–C10 siguen parciales. Ni esta entrega ni la alineación autorizan activar, publicar o desplegar.

## Recepción de Arquitectura y preparación de publicación — 18/10/2026

Referencia general recibida del autor y contrastada en lectura: **18/10/2026**, Aplicación §16.1 y evidencia §17.12; Infraestructura §§1–4, 12.1, 14.1, 15.1–15.2 y evidencia §16.9. Alineación recibida, sin modificar TFM ni el contexto de coordinación. Los textos de cierre anteriores que indican recepción pendiente son históricos de su fecha.

Windows conserva 587/587,51 archivos/92 módulos y39/39+8/8 seleccionados con dos trabajadores, no batería completa ni Linux. El autor comunica partidas manuales en instancia sintética; coordinación confirmó dos salas/inicios/finales, configuración y duraciones en informes privados. Es evidencia recibida local/sintética, no consulta nueva de este hilo al histórico del autor ni operación pública.

La publicación verificará primero Linux focal B18 y la misma imagen con UID1000, raíz read-only, volumen privado, permisos, administración solo lectura, parada POSIX/recreación, persistencia estadística sin RAM jugable, copia cifrada y restauración aislada. Después CI completa de fuente y squash/main, con un trabajador/cero reintentos. No se declara superada una puerta por describirla; resultados y fallos reales se enlazarán desde el registro operativo y la PR.

Siguen pendientes privacidad/información, habilitación expresa futura de recogida real, acceso administrativo en VPS, copia externa/supervisión y ensayo del responsable. Sin modo HUMAN habilitado, GHCR, VPS, dashboard, métricas nuevas o cambios editoriales. B18 no se declara verificado globalmente ni operativo públicamente.
