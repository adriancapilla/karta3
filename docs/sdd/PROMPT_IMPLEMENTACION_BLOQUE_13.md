# Encargo de implementación — B13

Implementa **B13 — Cancelación de partida por el anfitrión** en `E:\KARTA3\KARTA3_IA\APP\karta3` conforme a:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_13_CANCELACION_PARTIDA.md`

Lee AGENTS, proceso SDD, organización/dependencias, B07/B08/B09 y T04 desde sus referencias. El autor aprobó esta ampliación el **11/10/2026**: sustituye la exclusión antigua de cancelación por anfitrión y admite terminar una ronda incompleta sin adjudicarla. Las fuentes generales requieren el traslado indicado en B13 §9; no las edites ni cambies la decisión aprobada para acomodarla a textos anteriores.

## Base y alcance

Base observada durante SDD: `fix/ghcr-asociacion-revisada`, HEAD `ee2efbb9d2b4515884629a2578ebc75697202865`, main local `2603d6638f6cc1c1a9f019386359b5e7f1967c8d`. Hay cambios previos en `docs/operacion/GITHUB_Y_RECUPERACION.md` y `tests/browser/tableLayout.spec.ts`. Verifica el estado vigente y consérvalos. Usa una nueva rama de implementación con B07–B12/T04 presentes; conserva esta preparación documental y separa los cambios ajenos de la entrega B13. No presupongas una base anterior ni descartes trabajo.

Implementa la capacidad completa, reutilizando Game, Room, GameCoordinator, transporte, mesa y resultados existentes:

- Botón arriba a la derecha solo para HOST, también observador o automático. Confirmación con los textos y acciones exactos de B13 §2, accesible; abrirla no pausa el juego. Cancelar el diálogo no envía ninguna acción. Pending/error no simulan éxito.
- Acción autenticada `game:cancel` con `{ requestId, roomId, gameId }` exactos y ack RESULTS. Permiso independiente de turno/control manual; dedupe mínimo y errores de §4. No aceptar parámetros de rol, puntos o motivo del navegador.
- Transición única a `Game FINISHED`/`Room RESULTS`, motivo `HOST_CANCELLED`, sin ganador. Mantener puntos de rondas ya resueltas; no adjudicar una ronda incompleta, reponer o iniciar desempate. Conservar las 58 cartas internamente y la privacidad de HTTP/ack/eventos.
- Preparar vencimientos debidos antes de decidir. La revisión final vigente admite cancelación; al vencer, incluso con callback retrasado, registrar primero el final que corresponda. Un `Game.result` candidato durante revisión no es todavía el terminal de aplicación. Nunca convertir un resultado normal/inactividad confirmado en cancelación.
- Registrar estado, retención y liberación antes de emitir. Invalidar turnos, bots/automático, revisión y continuaciones, incluidos callbacks ya extraídos que deben revalidar contexto/generación. Capturar destinatarios originales: todos reciben su resumen aunque sus asociaciones activas ya estén libres.
- Liberar inmediatamente todas las sesiones humanas y conservar el resumen autorizado **30 minutos desde su publicación**, sin renovación. Mostrar puntuaciones parciales sin puestos/victoria, con observador aparte. Separar asociación activa, resumen consultado y roster autorizado; conservar el recorrido de vuelta al inicio entre pestañas aunque ya se haya liberado la sesión.
- Recuperar confirmación incierta y estado vigente según §5, sin encolar ni reenviar automáticamente. Preservar T04: avisos y respuestas pertenecen a gameId; cancelación, caducidad, retorno o mensajes antiguos de A nunca liberan ni contaminan una nueva sala B. Refrescar/abrir URL antigua nunca reactiva A.

Respeta las responsabilidades y dependencias de §6. Escoge detalles internos compatibles sin refactorización general. No añadas abandono individual, revancha, transferencia de anfitrión, vigilancia técnica, persistencia o rediseño. Conserva genérica aprobada, tiempos, bots EASY/HARD y finales normales/inactividad.

## Verificación y cierre

Comprueba **B13-01–15 y E1–E8**. Usa tiempo controlado para bordes −1/0/+1 ms de revisión final/retención, timeouts, concurrencia y callbacks antiguos; distingue esa evidencia de los transportes y recorridos reales.

Incluye dominio/casos de uso, permisos de invitado/ajeno/HOST observador, todas las fases, puntos parciales, dedupe/varias pestañas, ack o emisión perdidos, recuperación y A cancelada→B activa. Conserva los cuatro recorridos T04 y añade sus variantes con cancelación. Comprueba botón/diálogo/resumen en PC y móvil con dos sesiones independientes; no rediseñes la mesa.

Ejecuta **`npm run check`** y **`npm run test:browser` con los archivos nuevos/afectados y regresiones pertinentes**, sobre la compilación vigente. Registra selección/comandos exactos, resultados reales, fallos reparados y límites. Añade revisión semántica de responsabilidades a imports/ciclos; no repitas baterías completas por rutina ni atribuyas resultados históricos a B13.

Actualiza README, cierre B13, proceso y mapa de responsabilidades de APP si cambia. Entrega recorrido manual, evidencia nueva y conclusiones para Coordinación y Arquitectura **al autor**, incluida la alineación pendiente de TFM indicada en §9. C09–C10 y revisión humana conservan sus límites; no marques verificado lo pendiente.

No edites fuentes generales TFM, reescribas cierres históricos, envíes mensajes a otros hilos, publiques ni despliegues. No encargues push o PR; los commits de este trabajo serán locales.
