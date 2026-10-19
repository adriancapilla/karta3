# Encargo de Implementación — B18, analítica básica de uso propia

Implementa [B18](BLOQUE_18_ANALITICA_BASICA_USO.md), acordado por el autor el **18/10/2026**, en `E:\KARTA3\KARTA3_IA\APP\karta3`. Consulta AGENTS.md, proceso SDD, organización de dependencias y referencias de B18 antes de editar. Base observada: `main`, HEAD `555c50d4dc5146963805503442e08168b55a95b5`. Verifica estado/HEAD y conserva cambios posteriores y esta preparación documental pendiente: bloque B18, proceso y este prompt. No descartes cambios ni vuelvas a versiones anteriores por inercia; no alteres servidores del autor. Selecciona Node **24.19.0** fijado por el proyecto: el PATH general observado tenía 24.13.0; no cambies instalaciones globales.

## Alcance autorizado y límites

- Solución propia con SQLite **solo estadístico**; puertos en aplicación, adaptadores en infraestructura, conexión en composición y dominio independiente. Salas, partidas, resultados jugables y sesiones siguen en RAM. No persistencia de juego/event sourcing ni servicios externos de analítica.
- Catálogo de nueve eventos v1, campos, dedupe, fórmulas y consultas de B18 §§3–7. Hechos confirmados emitidos por servidor; navegador solo portada, intención de crear y de entrar. No hay formulario previo de creación: medir pulsación y creación efectiva por separado. No confundir invitado con creación fallida.
- Primera entrega con **consultas administrativas y CSV agregado**; panel web posterior, sin implementar su autenticación/UI ahora. No interfaz SQL arbitraria o acceso directo de presentación a tablas.
- Copias aceptadas **solo de agregados**: perder el disco puede perder definitivamente el detalle. No prometer recuperación de eventos o partidas vivas. Preservar contenido/versiones/huellas de las tres barajas, presentación y garantías B01–B17/T04.
- Sin IP, nombres, códigos, cookies/tokens/credenciales o sus hashes, manos, cuerpos completos, huellas, recurrencia ni identificadores entre visitas. Sin jugadas/cambios provisionales indiscriminados, nuevos parámetros, bots/reglas/rediseño o watchdog.
- **Recogida pública desactivada durante toda esta entrega y al terminar.** Probar la tubería únicamente en instancias propias aisladas, con datos sintéticos/entorno de prueba y el mismo mecanismo. Activación requiere después revisión de privacidad y preparación operativa; este encargo no la autoriza. Tampoco autoriza publicación, push, PR, GHCR o despliegue.

## Etapa 1 — Contratos y almacenamiento aislado

1. Define DTO cerrados, puertos/sink nulo y separación de registro, almacenamiento, consultas y mantenimiento conforme a B18 §8. No pasar Room/Game/sesiones completos al adaptador ni ejecutar SQL/IO/await en la sección síncrona de decisión y registro del juego.
2. Implementa adaptador SQLite en worker, con cola acotada y admisión no bloqueante; transacciones, claves únicas, proyecciones mínimas y consultas fijas. Deduplicar lo recibido no garantiza entrega exactamente una vez. Un duplicado conflictivo no sobrescribe lo anterior.
3. Implementa consolidación mensual y purga repetibles sin doble conteo: detalle 90 días; doce meses calendario UTC incluido el actual, sin identificadores individuales en resúmenes. Mantener pendientes/activos al corte como censurados, no abandonados; no inventar seguimiento tras perder el padre retenido. Cortes, meses, fronteras UTC y solapamiento detalle/resumen según §9.
4. Separa ficheros/volúmenes/configuración por entorno y tráfico sintético; entorno lo impone servidor, no cliente/NODE_ENV. DB de otro entorno no se abre como correcta. Sink nulo por defecto en automatizaciones/carga, salvo pruebas sintéticas explícitas de analítica.

**Puerta de etapa:** pruebas con SQLite temporal real de insertar/repetir/conflicto, transacciones interrumpidas, fórmulas conocidas, separación de entornos y consolidación/purga con reloj controlado. Fallos del worker/DB/cola no se propagan al juego ni crean colas ilimitadas. Registrar qué funciona y qué falta; no declarar B18 completo.

## Etapa 2 — Instrumentación focal y calidad

1. Instrumenta los tres hechos UI sin contar renders/StrictMode como vistas; F5 y navegación interna conforme a B18. Contexto estadístico opcional de creación/entrada, independiente de requestId/cookies y sin cambiar permisos/dedupe de juego. Mantener cuerpo de creación `{}` y compatibilidad de clientes sin contexto. Un dato estadístico inválido no invalida una operación de juego que antes era válida.
2. Emite hechos nuevos de aplicación tras estado/dedupe y antes de HTTP/ack/difusión; no una vez por receptor. Creación recuperada, reenvío, reconexión, pestaña o consulta no duplican sala/entrada/inicio/final. Errores de entrada solo enum seguro, sin nombres/códigos/cuerpos. Intención sin resultado registrado no equivale a rechazo demostrado.
3. Captura al iniciar snapshot efectivo completo: baraja/schema/content, humanos jugadores/observador, bots EASY/HARD, hostPlays, turnSeconds, reviewSeconds, forceTieBreak, attributeValueMode y optimizeForMobile. Ambos últimos son **compartidos**. No guardar borradores o preferencias individuales inventadas.
4. Registra paso humano ACTIVE→AUTOMATIC una sola vez, sin bots/observador/primer timeout. Terminales confirmados y duración monotónica hasta publicación de resultados, incluida revisión/desempate y excluida retención. Respetar frontera B13 durante revisión final y T04 A→B.
5. Parada controlada y reinicio abrupto siguen B18 §6: final técnico solo con evidencia; registros abiertos tras un corte sin final durable quedan UNKNOWN, no normales/cancelados, sin duración inventada. Un error aislado no es final. Publicar calidad/huecos y tasas incompletas, no ceros o porcentajes corregidos artificialmente. No reconstruir Game desde datos analíticos.

**Puerta de etapa:** dos sesiones y varias pestañas con HTTP/Socket.IO reales; pérdida de confirmación/repetición/concurrencia, snapshots, límites terminales, automático, reinicio propio y ausencia de datos excluidos en DB/logs/contratos. Probar fallo del escritor con juego/plazos que continúan. Mantener recogida pública apagada.

## Etapa 3 — Consultas, operación y verificación integrada

1. Entrega el comando y CSV de B18 §12 mediante casos de uso/puerto de consulta, autenticación/autorización administrativa del sistema y rutas privadas. Solo consultas acordadas, fecha/entorno, números/denominadores, calidad/asOf y errores seguros. Sin panel, API pública de informes, SQL libre o cookie HOST como permiso administrativo. CSV sin detalle/ids individuales y protegido frente a fórmulas.
2. Prepara configuración/ejemplos seguros del volumen SQLite fuera del almacenamiento efímero/público, respetando no root/raíz de contenedor solo lectura. Comprueba permisos locales y Linux, aislamiento de entornos y que DB/WAL/SHM/copias no son descargables. Esto es preparación/verificación aislada, no aplicar cambios al VPS o publicar imagen.
3. Implementa copia diaria coherente y exportación a archivo nuevo de **agregados**, incluidos los aún no consolidados del mes actual. Nada de conservar una copia completa cuyas páginas libres contengan detalle borrado. Intermedio completo privado/temporal, siete copias cifradas rotatorias, retención mensual y procedimiento de copia fuera del disco bajo control del autor. Prueba restauración aislada: reconstruye informes agregados/cobertura, **no detalle, identificadores, partidas o sesiones**. Deja explícita la preparación operativa real aún pendiente.
4. Ejecuta A01–A13 con comprobaciones proporcionales; `npm run check` final y navegador pertinente sobre compilación vigente. Conserva regresiones de creación/entrada/configuración, partida humano-bots, timeout/automático, cancelación/T04, recuperación y privacidad; sin repetir por rutina toda la matriz V2 o batería completa entre etapas. No debilitar aserciones, forzar clics o ampliar plazos para tapar fallos.
5. Distingue pruebas unitarias, SQLite real, reloj controlado, conexiones/navegador y un cierre/rearranque real de proceso propio. Verificación Linux/runtime/volumen no se acredita con Windows. Si falta entorno para una comprobación, registra el límite y pendiente, sin presentarla superada ni incluir publicación para obtenerla.

**Puerta de etapa:** informes reproducibles con dataset conocido, exportación privada, retención/backup/restauración y límites probados, regresiones correctas y recogida pública aún desactivada. Las tres etapas son necesarias; no cerrar por tener eventos almacenados o un CSV aislado.

## Valores operativos iniciales que deben comprobarse

Son puntos de partida de B18, no capacidad acreditada del VPS. Prueba admisión, límites y degradación con valores controlados. Si necesitas ajustarlos, registra valor anterior/nuevo, motivo, evidencia y efecto sobre memoria/IO/precisión; no conviertas colas en ilimitadas ni relajes privacidad/retención/reglas o pruebas para conseguir aprobación.

| Elemento | Valor inicial |
|---|---|
| Ingesta BROWSER | Un evento por petición; JSON 2 KiB; contexto de correlación 256 bytes. |
| Admisión BROWSER | 60/min por visita, ráfaga 10; global 120/s, ráfaga 240; mapa máximo 4096 visitas, expiración 30 min. |
| Visita técnica / reintento cliente | Solo memoria del documento; rotación tras 30 min sin evento permitido o 12 h máximas. Un reintento, mismo eventId, durante 10 s; sin cola persistente/offline. |
| Cola/escritor | Máximo 2048 eventos **y** 2 MiB, incluidos en vuelo; 1024 plazas reservadas SERVER; un batch máximo 64; vaciado cada 250 ms o al completarlo. |
| Reintentos/cierre | Fallos transitorios 1/5/30 s, antigüedad máxima 60 s; drenaje al cerrar máximo 2 s. Pérdida abrupta puede tener cantidad desconocida. |
| Disco | SQLite 512 MiB, WAL 64 MiB, reserva operativa 128 MiB; aviso al 80 %, pausa de admisión antes del límite y mantenimiento acotado. Contar WAL/temporales, sin borrar detalle joven para ganar espacio. |
| Consulta/log | Tiempo máximo 5 s, una exportación a la vez; aviso técnico repetido como máximo una vez/min por causa, sin payloads. |
| Conservación | Detalle/dedupe/proyecciones según corte de 90 días de B18; resúmenes de doce meses UTC incluido el actual. Purga al vencimiento y mantenimiento diario/arranque, sin prórroga por consulta. |
| Archivos/copias | Directorio 0700, DB/WAL/SHM/CSV 0600 o ACL equivalente; copia diaria de agregados, siete rotatorias cifradas, RPO inicial 24 h para agregados y caducidad mensual también en copias. |

## Alineación de Arquitectura y cierre documental

La autorización del autor para SQLite **exclusivamente estadístico** ya consta; no pedir otra vez permiso para empezar. Infraestructura §1 todavía dice que el MVP no incluye base de datos. Entrega al autor un resumen para Arquitectura que permita alinear **antes de cerrar/verificar B18**:

- Infraestructura §§1–4/12/14–15: excepción estadística, worker/SQLite/volumen privado, errores/pérdidas, retención/copias solo de agregados y operación con recogida pública apagada hasta revisión/preparación. Estado de juego permanece RAM/un proceso; ninguna copia restaura partidas vivas o detalle perdido con el disco.
- Aplicación: métricas y permisos de consulta administrativa, snapshot compartido, denominadores/cohortes/unknown y contexto acotado sin recurrencia. Sin reglas nuevas de Game.
- Organización APP y contexto: piezas reales, puertos, dependencias, pruebas y pendientes; distinguir evidencia técnica de activación/operación pública. Implementación puede actualizar organización/README/documentos APP según lo entregado; no edita fuentes generales TFM.

Devuelve ese traslado mediante el autor, **sin enviar mensajes a otros hilos**. Registra la referencia de alineación recibida antes del cierre como verificado; si el desarrollo y pruebas terminan antes, informa «implementado/comprobado técnicamente; alineación documental pendiente». La alineación no sustituye ni autoriza activar la recogida pública.

Actualiza README, ejemplos seguros y cierre B18 por etapas con commits/build propios, selección/resultado real de pruebas, fallos reparados, medidas de límites y datos excluidos comprobados. No bases/CSV reales, secretos o fixtures con nombres de usuarios en Git. Las pruebas previstas no son evidencia ejecutada. Entrega conclusiones al autor, pendientes de privacidad/operación/LINUX si los hubiera y modo de repetir comprobaciones aisladas. **Sin panel, ampliación de métricas, cambios de barajas, publicación o despliegue.**
