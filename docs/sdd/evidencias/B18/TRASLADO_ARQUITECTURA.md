# Traslado para el autor → Arquitectura / Coordinación

18/10/2026. No enviado a otros hilos ni aplicado a fuentes TFM. Decisión del autor: B18 autoriza SQLite **solo estadístico**; recogida pública apagada. Código final revisado `1ce58e2` (implementación `341d04d`, etapa 1 `ce7e4c0` y correcciones posteriores trazables); base `555c50d`. Pruebas nuevas y pendientes: B18 §15, no resultados históricos de otros bloques.

## Infraestructura §§1–4

Registrar la excepción a la exclusión general de base de datos: SQLite de Node 24.19.0 en worker, sin dependencia nueva; en Windows se comprobó SQLite 3.53.3. API release candidate. Estado vivo de salas/partidas/resultados jugables/sesiones continúa RAM de **un proceso** por entorno. No es event sourcing ni permite restaurar Game. Arquitectura de juego y contratos de cartas sin cambio.

Volumen estadístico privado propuesto `/var/lib/karta3/usage`, separado por entorno y HUMAN/SYNTHETIC; ambos metadatos se verifican. NODE_ENV no selecciona entorno. Imagen mantiene node/no root/raíz read-only; montaje opcional preparado **off**. No ejecución Linux/volumen acreditada en esta máquina ni VPS operado. El escritor exclusivo se protege por lease; informes administrativos usan conexiones de lectura/snapshot en otro worker y no reconcilian ni escriben sobre el arranque vivo. Copia manual lee el origen con Online Backup y escribe solo su archivo nuevo. Mantenimiento offline no compite con el escritor activo.

## Infraestructura §12 y errores/calidad

Puertos separados en aplicación, sink nulo normal y admisión inmediata con cola acotada por eventos/bytes incluidos en vuelo. SQL/IO/retry fuera de la sección síncrona de juego. Registro del estado/dedupe antes del hecho y antes del transporte; no una copia por receptor. No transacción común con RAM: deduplicar lo recibido **no garantiza entrega exactamente una vez**.

Nueve eventos cerrados B18 v1; sin nombres, códigos, IP/UA/referrer, cookies/tokens o hashes, manos, paquetes, jugadas indiscriminadas o recurrencia. Identificadores UUID v4 independientes, visita solo memoria del documento, participación por incorporación, sin enlace entre salas. Logs técnicos solo códigos fijos/contadores; aviso máximo uno/minuto por causa.

Salud técnica privada independiente de esos nueve hechos: instantánea fechada de admisión/degradación/pausa, cola/bytes y descartes por causa/origen. Se publica fuera de la decisión síncrona, al cambiar y con una actualización pendiente máxima. El informe marca ausencia o antigüedad superior a 60 s; no presenta esa instantánea ni su último cero como garantía en vivo después de una caída. Copias agregadas no restauran ese estado operativo.

Terminal normal/inactividad/cancelación solo al publicar RESULTS, después de revisión vigente; duración monotónica inicio→publicación, sin retención. Parada controlada puede registrar TECHNICAL_INTERRUPTION **estadístico**, sin resultado nuevo de Game. Corte abrupto se reconcilia UNKNOWN sin duración/fin inventados; espera perdida distinta de cierre. Un fallo aislado del escritor no finaliza juegos ni introduce vigilancia técnica. Si el lector encuentra mantenimiento vencido o proceso sucio sin escritor, devuelve indisponibilidad hasta reparar/reconciliar; no inventa un informe vacío.

## Infraestructura §§14–15

Conservar los presupuestos de B18 y su clasificación de evidencia: 2048/2 MiB/1024 SERVER, batch64/250 ms, retry1/5/30 s/60 s, drenaje2 s, DB512 MiB/WAL64 MiB/reserva128 MiB, aviso80 %, consulta5 s y una exportación. Margen previo de páginas/índices antes de batch; heap del worker128 MiB. Se probaron admisión/límites reducidos, bloqueo, corrupción, caída de worker y degradación; no capacidad certificada del VPS ni llenado físico del disco.

Detalle/dedupe/proyecciones90 días; cohortes abiertas censuradas; consolidación/purga atómica y repetible, secure_delete y checkpoint. Resúmenes/calidad doce meses UTC incluido el actual. Informe detallado y parte consolidada no se solapan. Archivo no disponible/corrupto no se sustituye por histórico vacío. Recogida off conserva mantenimiento del histórico configurado; tarea administrativa diaria necesaria si la app no lo ejecuta.

Copias diarias aceptadas **solo de agregados**, incluido mes actual: Online Backup privado temporal → SQLite nuevo sin eventos/ids/proyecciones → AES-256-GCM. Siete rotatorias y caducidad mensual también en copias/exportaciones; clave privada separada. Restauración aislada conserva cobertura/asOf/contadores, nunca detalle perdido, sesiones o partidas. Los activos al corte son censurados, no juegos vivos restaurados. Perder el disco puede perder definitivamente el detalle; RPO inicial24 h de agregados no promete recuperación de todos los eventos. Traslado cifrado a otro disco, supervisión, SSH/delegación y procedimiento real siguen bajo responsabilidad operativa del autor y pendientes de preparar/ensayar.

Recogida pública **apagada** durante y después de esta entrega. El código no expone activación HUMAN; solo tubería sintética explícita en test aislado. Antes de activar: finalidad/base jurídica/información al usuario/proporcionalidad/accesos y eventual mecanismo exigible, más preparación operativa y Linux. No afirmar anonimato irreversible o exención por alojar SQLite propio. Alineación documental tampoco autoriza activar.

## Aplicación

Añadir métricas informativas y consulta administrativa vía permisos del SO/SSH, no HOST. Ocho consultas fijas y CSV agregado, sin SQL libre ni API pública de informes; panel posterior con autenticación web todavía pendiente.

Separar intenciones de creación y sala nueva confirmada, sin formulario añadido; invitado no equivale a creación fallida. Entrada distingue NEW_JOIN/EXISTING_PARTICIPATION/REJECTED y sin resolver. Contexto opcional acotado independiente de requestId/cookies: inválido se descarta sin rechazar juego válido. Emisiones/ack/replay/F5/pestañas no duplican hechos confirmados.

Snapshot aceptado al iniciar: id/esquema/contenido de baraja, humanos jugadores/observador, bots EASY/HARD, hostPlays, turn/review/forceTieBreak y **attributeValueMode/optimizeForMobile compartidos**. No preferencias individuales inventadas ni borradores. Conversión por cohorte de creación; configuración por inicio; duración por fin; completado por inicio y terminales confirmados; automático por humanos jugadores base (sin bot/observador). Numeradores/denominadores/unknown/cobertura/asOf explícitos, tasa null cuando es incompleta; no corregir pérdidas artificialmente.

## Organización APP / contexto

Mapa concreto en `docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md`, operación en `docs/operacion/ANALITICA_USO.md`. Consumidor de barajas, Game/reglas/bots, presentación y 124 archivos aprobados conservados. Pruebas Windows/SQLite/tiempo controlado/conexiones/procesos/Chrome se distinguen de Linux/operación pública/revisión humana/dispositivos físicos. C09–C10 permanecen parciales; no acredita equilibrio ni comprensión.

**Referencia de alineación general recibida: pendiente.** El autor deberá devolver la referencia/fecha de las secciones alineadas por sus responsables. Hasta entonces: «implementado/comprobado técnicamente en los ámbitos documentados; alineación documental pendiente», sin marcar B18 verificado globalmente. Conservar también los pendientes Linux, privacidad y operación real; no publicar o desplegar desde este encargo.

## Recepción de Arquitectura y preparación de publicación — 18/10/2026

Referencia general recibida del autor y contrastada en lectura: **18/10/2026**, Aplicación §16.1 y evidencia §17.12; Infraestructura §§1–4, 12.1, 14.1, 15.1–15.2 y evidencia §16.9. Alineación recibida, sin modificar TFM ni el contexto de coordinación. Los textos de cierre anteriores que indican recepción pendiente son históricos de su fecha.

Windows conserva 587/587,51 archivos/92 módulos y39/39+8/8 seleccionados con dos trabajadores, no batería completa ni Linux. El autor comunica partidas manuales en instancia sintética; coordinación confirmó dos salas/inicios/finales, configuración y duraciones en informes privados. Es evidencia recibida local/sintética, no consulta nueva de este hilo al histórico del autor ni operación pública.

La publicación verificará primero Linux focal B18 y la misma imagen con UID1000, raíz read-only, volumen privado, permisos, administración solo lectura, parada POSIX/recreación, persistencia estadística sin RAM jugable, copia cifrada y restauración aislada. Después CI completa de fuente y squash/main, con un trabajador/cero reintentos. No se declara superada una puerta por describirla; resultados y fallos reales se enlazarán desde el registro operativo y la PR.

Siguen pendientes privacidad/información, habilitación expresa futura de recogida real, acceso administrativo en VPS, copia externa/supervisión y ensayo del responsable. Sin modo HUMAN habilitado, GHCR, VPS, dashboard, métricas nuevas o cambios editoriales. B18 no se declara verificado globalmente ni operativo públicamente.
