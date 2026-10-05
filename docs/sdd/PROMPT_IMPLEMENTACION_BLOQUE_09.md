# Encargo de implementación — B09

Implementa **B09: gestión y ejecución completa de bots fácil y normal**, según la [especificación acordada](BLOQUE_09_BOTS.md) el 05/10/2026:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_09_BOTS.md`

## Base y preparación

Trabaja en `E:\KARTA3\KARTA3_IA\APP\karta3`. Lee AGENTS, proceso SDD, B09 completo, organización/dependencias, cierre B08, bloques citados y fuentes vigentes de `E:\KARTA3\KARTA3_IA\TFM\Planificación`. Las políticas de dominio §§19.4–19.6 están cerradas; no reabrir algoritmos.

La preparación SDD comprobó rama `main`, HEAD/main/referencia local origin/main `8d305e0e2e13b60b6dc2e412ae9fc073d6bff28f`, aplicación 0.1.0 y árbol limpio antes de añadir documentos B09. B08 está integrado/publicado mediante PR #4. Comprueba estado real antes de editar y crea rama nueva **`feat/b09-bots`** desde ese main o sucesor compatible que conserve B01–B08. Preserva especificación/prompt/enlace y cualquier trabajo existente; no restaurar/descartar ni partir de un main anterior.

Registra base efectiva y cambios locales conservados. El cierre B08 —341 pruebas, 74 Chrome, 59 módulos y vencimiento real desconectado— es evidencia histórica; ejecuta tus puertas actuales y no atribuyas esos resultados a B09. La errata §24.2 y descripción general B07/B08 ya fueron alineadas por Arquitectura; no reabrirlas.

## P1 — Preparación de sala y políticas

- «Añadir bot» por anfitrión, también observador: uno NORMAL explícito, ID/nombre sucesivos en servidor, sin rellenado automático. Bot 1/2… por incorporación aceptada, sin reutilizar números; rechazo/replay no consume otro. No crear sesión/cookie/socket/presencia para el bot.
- Orden único de incorporación de humanos/bots, anfitrión jugador al final/observador aparte. Cinco jugadores contando reservas HUMAN; compartir atomicidad con entrada humana y hostPlays. Nivel y renombre no alteran ID/plaza/orden; retirada quita solo ese bot.
- Cada fila del host: EASY/NORMAL explícitos, «Cambiar nombre», «Retirar bot»; invitados consultan aceptado. HARD/booleanos/valores desconocidos rechazados, sin infraestructura anticipada. Cambio de dificultad inmediato por control.
- Diálogo pequeño con nombre actual sin sufijo, campo editable, Aceptar/Cancelar/cierre/Escape. Cancelación previa a confirmar no emite ni renueva. Reutiliza normalizeName/sufijos; pendientes, rechazo con borrador corregible e incertidumbre sin afirmar cancelación de un envío ya realizado. Conservar foco y borradores ante eventos de otra pestaña.
- Retirada **inmediata**, sin confirmación extra; aviso de cinco segundos con nombre/sufijo anterior y plaza liberada, deduplicado. No evento de salida de una sesión bot.
- Implementar operaciones y ack exactos B09 §4: room:bot-add/difficulty/rename/remove, propiedades requeridas, validación en ejecución, permiso host y objetivo BOT de esa sala. Ack `{ room, botId }` seguro; RoomRequests conserva resultado mínimo para replay, sin vistas/manos. Mismos permisos/fases, errores nuevos/vigentes y concurrencia de §5.
- Nuevos efectos aceptados renuevan espera, sin reset de reservas HUMAN; iguales, rechazados, replays, cancelaciones y lecturas no. Vencimientos B03 primero, incluso en igualdad/callback tardío. Dedupe evita doble incorporación/aviso/actividad; payload/ID originales al confirmar un envío incierto, sin reenvío automático al reconectar.
- Políticas puras EASY/NORMAL sobre propia mano/atributo/dirección/dificultad, separadas de AutoPlayPolicy. Sin Game completo, manos rivales, orden oculto, memoria o API de IA; decisión validada/aplicada por Game, no por transporte o React. Implementar los algoritmos citados y sus pruebas, incluidos empates de distancia y manos 1/2/3.

Comprueba P1 por capas. No declarar completo B09 tras controles/políticas sin una partida ejecutable ni crear un modo temporal de producto.

## P2 — Ejecución completa

- Inicio exclusivo del host: 2–5 HUMAN/BOT, al menos un HUMAN **jugador**. Host observador no cuenta y no permite solo bots. Todos los miembros HUMAN conectados al iniciar, incluido observador; ningún BOT necesita conexión. Baraja id/versión exacta válida/disponible, preparación fijada e inicio único B06/B08.
- Game recibe kind y botDifficulty válidos y conserva nombres/niveles/orden. Discriminar jugadores: HUMAN con status/contador B08, BOT con dificultad, sin estados/contador de abandono humano. Reparto/antigüedad/puntuación propios del mismo agregado; primer abridor puede ser bot.
- Reutilizar continuaciones/tareas de GameCoordinator B08: BOT invoca su política, humano AUTOMATIC la suya. Sin plazo humano o timeout de bot; jugadas `mode: BOT`. Pasos acotados con contexto/generación/tarea, registro antes de emisión, otras salas atendidas, callbacks viejos sin efecto. Sin petición de navegador para activar un bot.
- Respetar revisión cero/positiva antes de bots de nueva ronda. Conservar orden circular, ganador/segundo abridor, reposición, indicadoras, 58 ubicaciones, tres rondas finales y único desempate sin puntos nuevos. Bot puede ganar/abrir/ganar desempate como cualquier jugador.
- Fin por inactividad contando **solo roster HUMAN base**, no bots/observador ni solo empatados. Completar ronda/review y terminar base sin nueva ronda/reposición/desempate; si desempate ya empezó, terminar/reconocer vencedor. Un desempate entre bots se completa si aún hay HUMAN ACTIVE fuera de él. Servidor continúa sin clientes y no termina por ausencia del host.
- Mantener resultados/clasificación/retención 30 minutos/retorno y nueva sala. Sesiones/autorización/emisiones/índices solo humanos; bots no poseen resultados o asociaciones de sesión propias.

## Contratos y presentación

Implementa discriminación segura B09 §4.2: kind HUMAN/BOT, botDifficulty null/EASY/NORMAL; role/presence null para bot, playStatus null en IN_GAME, score público y sin contador humano del bot. `room.participant` siempre HUMAN autenticado. Propia mano del humano, observador vacía, ninguna mano de bot ni rival; no paquetes, mazo, credenciales o datos internos en HTTP/ack/eventos. Replay de AddBot después de iniciar devuelve **vista del host**, nunca del bot.

Conserva TIMED_TURNS y agrega BOT a modos de jugadas públicas; turno bot timing/openingSelection null. Reutiliza mesa/resultados añadiendo marca «Bot · Fácil/Normal» sin rediseñar. No facilitar edición ni control manual de un bot después del inicio. Mantén cuenta atrás/revisión y avisos B08.

Responsabilidades/dependencias según §7: políticas y reglas en dominio; orden/gestión/permisos/actividad/vistas en aplicación; memoria/decodificación/transporte en infraestructura; composición conecta; cliente presenta/envía. Reutiliza puertos existentes; sin nuevos adaptadores/servicios/registro de HARD por anticipado. Puedes elegir nombres internos, estructura de orden mixto, helpers/hooks y pruebas compatibles; consulta solo contradicción nueva o cambio real necesario, citando primero la regla.

## Comprobación y entrega

Cumple **B09-01–20 y E1–E8**, con P1+P2:

1. Dominio/políticas: EASY/NORMAL apertura y no apertura, HIGH/LOW, umbrales/tie de distancia, manos 1/2/3, kind/mode válido y decisiones independientes de información no permitida. Partidas legales mixtas de 2–5; no simular actuación BOT mediante cartas manuales arbitrarias ni asignar puntos para forzar empate.
2. Aplicación/tiempo controlado: nombres/cancelación, niveles, capacity/orden/reservas, permisos/fases, no-op/actividad, caducidad exacta, carreras add/join/hostPlays/start, dedupe/ack perdido y callbacks/generaciones/revisión/retención. Repositorio sin sesiones/índices/ausencias BOT.
3. HTTP/Socket.IO reales: dos sockets de host, invitado/observador/tercero, incertidumbre/recuperación, payloads por destinatario incluidos replay/partida/resultados; servidor funcionando sin clientes y conclusión por HUMAN inactivos.
4. Navegador compilado: gestión/diálogo/teclado/foco/cancelación/errores, niveles mezclados, cinco plazas, host jugador/observador y una partida completa normal **humano contra bots** con genérica 2 y adaptadores/entropía normales. Fixtures temporales legales separadas para final/desempate/inactividad y review=0/positiva, sin publicar contenido sintético. Vistas 360/390/1280, varias pestañas y F5/reconexión/respuestas antiguas.
5. Ejecuta **`npm run check` y `npm run test:browser`** sobre código final, build vigente y servidor correcto, conservando regresiones B01–B08/T01/activación y caso real desconectado B08. No reducir cobertura ni desactivar reglas para cerrar. Control de imports/ciclos más revisión semántica de información de política, gestión atómica, índices humanos, privacidad y coordinación única.

Registra base/commit/fecha/entorno/comandos/resultados por etapa/criterio, fallos y reparación, límites y recorridos manuales efectivamente realizados. Distingue reloj controlado, conexiones reales con reloj sustituido, adaptadores normales, automatización y prueba humana; no atribuir media hora real/dispositivos físicos a simulaciones.

Deja instrucciones manuales B09 §9 para autor: añadir mezcla/renombrar/cancelar/retirar/F5/segunda pestaña/invitado, solo bots rechazado, una persona contra bots/resultado/otra sala, observador, revisión y timeouts/automático. Fixture de prueba para empate/final si no se alcanza naturalmente. C09–C10 permanecen parciales: no acreditar equilibrio/comprensión con usuarios/despliegue por estos tests.

Actualiza README, cierre B09, proceso SDD y descripción concreta del código APP. Conserva evidencia histórica B04–B08 y genérica aprobada sin cambios. No cerrar tras P1: ambas etapas y criterios necesitan evidencia suficiente.

Entrega conclusiones para coordinación/Arquitectura: valores iniciales e interacción ahora cerrados, contratos/identidad/actividad/orden/inicio mixto/ejecución, base y cambios, comprobaciones/límites y pendientes. **No editar CONTEXTO_DESARROLLO_KARTA3.md, DOMINIO_KARTA3.md, CAPA_APLICACION_KARTA3.md ni INFRAESTRUCTURA_KARTA3.md.** Sus responsables actualizan las secciones identificadas en B09 §10.

Fuera rediseño, expulsión humana, vigilancia técnica, HARD, IA externa y despliegue. Commits locales; **no push, PR, publicación ni abrir otro bloque** desde este encargo.
