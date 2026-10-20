# B20 — Traslado al autor para Arquitectura

20/10/2026. Preparado por Implementación, sin mensajes a otros hilos ni edición de TFM. No autoriza recogida pública. Referencia de recepción de alineación B20: **pendiente, confirmado por el autor en esta conversación: «Todavía pendiente; entregar cierre técnico»**.

## Cambios concretos para alinear

- Aplicación §§7/16: apariencia es una preferencia personal local (LIGHT/DARK/CREAM/HIGH_CONTRAST); `optimizeForMobile` sigue compartido. Sin preferencia válida LIGHT/DEFAULT y selector Predefinida; toda elección válida, incluido Claro, EXPLICIT. Almacenamiento solo `{version:1,theme}` y coordinación de pestañas del origen; no cuenta ni sincronización remota.
- Aplicación estadística: se amplía a diez tipos y nueve consultas. Nuevo `appearance_snapshot v1`, dos fotografías por HUMAN jugador START/END, nunca bots/observador o cambios intermedios; los finales normales/inactividad/cancelación están incluidos. Cohorte por inicio UTC, START/END/pares con denominadores independientes y nulos cuando son cero; cobertura y censura B19, sin recurrencia, preferencias demostradas o personas únicas. Ausencias no se reconstruyen.
- Infraestructura §§5.3/12.1/14–15: oportunidad RAM diez segundos por conexión/contexto original; máximo4096, caducidad exacta, desconexión/retirada/OFF invalidan. Metadata individual solo en publicación en vivo; ack/HTTP/resume no abren ventanas. Petición autenticada se normaliza antes de almacenar, sin tokens, gameId funcional, sesiones/cookies, nombres, manos o dispositivo. HTTP202 solo admite en cola.
- SQLite estadístico esquema3: acepta históricos1/2 sin backfill, frontera de instrumentación explícita y capacidad por nueva partida. Mantiene ocho informes y añade appearance, lectores/CLI/CSV privados, recibos,90d detalle/12meses UTC agregados y copia/restauración exclusivamente agregada. Ni copia ni eventos restauran Game o detalle perdido con el disco.
- Aviso2026-10-20.1 amplía información con texto B20; se conserva aceptar/rechazar/retirar B19 y12h, sin permiso adicional ni promover aceptación de otra versión. La preferencia local funciona sin analítica. Recogida pública permanece OFF y su activación exige encargo posterior.
- Organización APP ya documenta responsabilidades reales: preferencia/captura cliente, contratos puros, acreditación/fórmulas/puertos en aplicación, SQL/worker/HTTP/sockets en infraestructura y conexión en composición. Dominio, reglas, bots, tiempos, paquetes y juego en RAM no cambian.

## Límites de recepción

Pruebas locales y verificador preparado no equivalen a Linux/CI, operación pública, conformidad jurídica universal o revisión humana/física de colores. C09–C10 parciales. Recibir esta alineación no activa recogida. Registrar aquí la referencia que el autor traslade antes de marcar el cierre global verificado; mientras tanto: implementado/comprobado técnicamente según evidencia, alineación documental pendiente.
