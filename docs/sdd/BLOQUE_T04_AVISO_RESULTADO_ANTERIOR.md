# T04 — Aviso de resultado anterior (INC-01)

**Alcance acordado y registrado antes de corregir — 07/10/2026.** Base efectiva T03 `43cc4891ef1e76530a0ac20a8d944156c01d4275`, rama inicial `chore/t03-entorno-dependencias`, árbol limpio. Rama propia `fix/t04-aviso-resultado-anterior`; conserva íntegros los tres commits locales T03 y main `dd20e0a`. Fuentes: AGENTS, proceso SDD, resultados/recuperación B07 y automático B08, registro INC-01 y acuerdo T04 de contexto TFM (solo lectura).

## Alcance y criterios

Reproducir resultado A caducado → nueva partida B → clasificación disponible con aviso de A; determinar causa y corregir mínimamente asociación de avisos/resultados y respuestas/eventos tardíos. Mantener retención de 30 minutos sin renovación por lectura, permisos, identidad, reglas y barajas. No diseño, dependencias, refactorización general, fuentes TFM, publicación/PR/despliegue.

- Regresión nueva que falle sobre la base y pase tras corregir; B por inactividad/automático y final ordinario.
- Recarga/recuperación de B, caducidad legítima B y consultas posteriores A; mensajes A retrasados no alteran B.
- Tiempo controlado permitido, identificado por caso; HTTP/Socket.IO y navegador de compilación vigente, sin atribuir media hora real.
- Entorno T03: Node 24.19.0 desde `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm 11.6.2; sin modificar instalaciones globales. `npm run check` y navegador pertinente de resultados/recuperación/transiciones. Puertas T03 históricas no acreditan T04.

Responsabilidad afectada: estado/peticiones del recorrido React `useRoomFlow` y pruebas de navegador; servidor sigue autorizando/caducando resultados. Revisión preliminar detecta `resultError` global, escrito en rechazo de retorno y no retirado al cambiar de sala; confirmar por reproducción antes de modificar producto. Examinar además guards de retorno/lectura/resume y eventos `results:home` antes de elegir la corrección.

**Estado al registrar el alcance:** acordado; reproducción y verificación pendientes entonces. El cierre actual consta al final.

## Reproducción y causa — antes de corregir producto

Node 24.19.0/npm 11.6.2, Chrome, compilación T03 vigente; conexiones HTTP/Socket.IO reales y reloj/planificador `ControlledTime`. `npm run test:browser -- tests/browser/resultNotice.spec.ts --grep "B automatic" --workers=1`: **1/1 falla como se esperaba**, 7,2 s, clasificación B visible y un alert en vez de cero, después de caducar A y volver/crear/jugar B. `--grep "late A"`: **1/1 falla**, 12,4 s, error de confirmación de retorno A sobre clasificación B ya disponible. Son regresiones de producto sobre la base sin corregir, no pruebas superadas. El primer montaje asíncrono requirió corregir sintaxis del helper y liberar también al invitado de A antes de entrar en B; su timeout por montaje no se interpreta como otra incidencia de producto.

Causa confirmada: `returnHome.catch` guarda un `resultError` global sin ID de partida. Al caducar A, fallback `api.current` recupera portada correctamente, pero `clearRoom` y `applyRoom` no retiraban ese error. El mismo hook recibe B y `App` entrega el error de A a `ResultsScreen` B. Además, el catch escribía/recuperaba antes de comprobar que seguía mostrando el resultado A; un ack perdido podía terminar ese catch después de aceptar B. Servidor/retención funcionan: A se elimina, permite nueva vinculación B y no recupera resultado caducado. No se atribuye el problema al motivo de inactividad; también se comprobará B ordinaria.

Corrección mínima prevista tras reproducir: error con propietario `gameId`, retirada al dejar/cambiar de contexto y validación del resultado mostrado antes de tratar éxito/rechazo del retorno y después de su recuperación HTTP. Conservar filtros vigentes de `openResult`, revisiones `room:state`, autorización de current/resume y contexto/dedupe `results:home`; probar entregas antiguas. Ningún cambio de servidor/contrato/retención.

## Implementación y revisión

Cambio revisado `16175c1b589cbe7b061c3fc89359b7993f591574`, desde preparación `9577f69` y T03 `43cc489`. Producto modificado únicamente en `src/useRoomFlow.ts` (22 líneas añadidas/10 retiradas):

- `resultError` pasa de texto global a `{ gameId, message } | null`. Dejar sala/resultado lo retira; aceptar una vista de otro contexto lo descarta, manteniendo el error pertinente si se recupera el mismo resultado. `ResultsScreen` sigue recibiendo el contrato local de texto vigente.
- Retorno comprueba sala/partida **mostrada** antes de procesar éxito o rechazo, antes de recuperar y después de esperar su HTTP; el catch interno tampoco publica error antiguo. Comprobar contexto precede a modificar liberación/consulta explícita. Limpiar pending solo si todavía pertenece al mismo envío.
- No es solo ocultación: además de propietario/limpieza, una respuesta vieja deja de producir lecturas y cambios del recorrido B. Se conservan las protecciones de revisión/fase y `results:home` por contexto/ID. `openResult` ya limita respuestas por consulta explícita; lecturas A siguen mostrando su indisponibilidad si A es el destino solicitado.
- Sin cambios de servidor, plazo, autorizaciones, contratos públicos, reglas, barajas o dependencias. Revisión de responsabilidades: control de estado/transporte en cliente, caducidad/permiso en servidor. Los helpers de reloj, ack retenido e inyección de evento obsoleto solo existen en pruebas; no endpoints ni controles de producto.

## Evidencia nueva — 07/10/2026

Windows x64/PowerShell, Node **24.19.0** (ruta arriba), npm **11.6.2**, Chrome **154.0.8037.98**, Playwright **1.63.0**. Horas Madrid (UTC+2). Producto final sin cambios entre gates/build/servidor.

| Criterio | Resultado realmente ejecutado |
| --- | --- |
| Regresión A caducado → B automático / ordinario | Tras corregir, focal **3/3** (15,6 s) incluye ambos finales y el rechazo tardío. Motor legal, fixture completa validada/permutación determinista; B ordinaria juega con gestos humanos automatizados, sin asignar puntos ni saltar fases. |
| Recarga y recuperación B | Los dos casos comprueban ambas sesiones independientes, clasificación/gameId B y ausencia de error A tras F5. |
| Caducidad legítima B / lecturas A | Reloj **controlado** en los dos casos: B sigue disponible a vencimiento−1 ms y responde 404 exactamente al vencer, sin ejecutar callback previo; lecturas mantienen expiresAt, A permanece 404. F5/URL B y posterior URL A muestran indisponibilidad propia sin clasificación recuperada. |
| Ack fallido/tardío, evento A y HTTP retrasado | Focal adicional **2/2** (12,4 s): ack real aceptado retenido hasta timeout de transporte; ningún GET current obsoleto al fallar A sobre B. Después entrega ack y dos eventos A (ID ya visto/no visto), recepción WebSocket acreditada mediante CDP y B/URL conservados. Segundo caso retiene respuesta HTTP real `room:null` de A vencida, recupera B mediante reconexión/resume autorizado y entrega luego la respuesta antigua sin contaminar B. |
| `npm run check` | **Salida 0**, 12:11:46–12:12:39, **52,81 s**: tipos/lint/preparación/build, **413/413 en 39 archivos**, Vitest 13,37 s; **65 módulos**, sin imports prohibidos/ciclos, más revisión semántica. |
| Navegador final pertinente | **43/43 en cinco archivos**, salida 0, dos trabajadores/cero reintentos, **5,8 min Chrome / 350,13 s incluyendo build**, 12:13:54–12:19:44. Incluye **4 regresiones nuevas + 39 existentes**. Sobre compilación vigente y `npm run start` normal; no es la batería completa actual de 118 ni se atribuye T03 de 114 a T04. |

Los **cuatro casos nuevos** de `resultNotice.spec.ts` usan Clock/Scheduler sustituido para turnos/retención, HTTP/Socket.IO y Chrome reales (390/1280 CSS px, móvil emulado). El timeout de ack es el real de transporte (5 s); la entrega retrasada/obsoleta es un montaje de prueba explícito. No se han esperado 30 minutos reales. Selección final ejecutada: `npm run test:browser -- tests/browser/resultNotice.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/timedRealGame.spec.ts tests/browser/bots.spec.ts --workers=2`; incluye B07 resultados/retorno/reinicio/URL/red/caducidad/otra sala, B08 revisión/automático y vencimiento real, B09 resultados y varias pestañas. Las focales de un solo archivo usaron un trabajador efectivo aunque se solicitaran dos.

Evidencias locales ignoradas: `t04-before.log` / `t04-async-before.log` (fallos esperados sobre base), `t04-focused.log`, `t04-async-after.log`, `t04-check.log`, `t04-browser.log`, `playwright-report/t04/` (copias de logs/estados/tiempos/arranque). No se reduce ningún criterio/prueba existente ni se reescriben históricos T03/B07/B08.

## Recorrido de revisión del autor y límites

1. Con Node 24.19.0 seleccionado en ambas terminales, ejecutar `npm run build`, `npm run start`; abrir dos perfiles/navegadores con cookies independientes y completar A (puede ser por automático, turno 15/revisión 0).
2. Conservar esa pantalla **sin F5 durante más de 30 minutos** desde publicación final; pulsar «Volver al inicio» desde su copia caducada. En la misma ventana crear B y entrar con la segunda sesión, sin reiniciar servidor. Terminar B por automático: clasificación disponible y ningún aviso de A. Repetir con final ordinario.
3. Recargar ambas ventanas: mismo resultado B, sin aviso antiguo. Consultar la URL guardada de A en otra pestaña: indisponibilidad legítima de A, sin afectar B. Al vencer B, una lectura/F5 de su URL debe mostrar su propia indisponibilidad. Las consultas no extienden plazos.
4. Alternativa rápida reproducible: `npm run test:browser -- tests/browser/resultNotice.spec.ts --workers=2`, cuatro casos con tiempo controlado/transportes reales; no requiere esperar media hora ni modificar producto. El servidor se reinicia solo para limpiar pruebas manuales, perdiendo memoria según regla vigente.

Revisión manual humana anterior: comunicada por el autor en INC-01. Recorrido humano **posterior a la corrección pendiente**; no atribuir a esta automatización equipo móvil físico, aprobación humana o 30 minutos reales. Dependencias/entorno T03 intactos; genérica/huellas y archivos finales comprobados al cerrar. Sin fuentes TFM, publicación/PR/despliegue; C09–C10 conservan límites parciales. Coordinación puede actualizar el registro INC-01 después de recibir este cierre; Implementación no lo edita.

## Cierre técnico

**Implementado y verificado localmente el 07/10/2026**, producto revisado `16175c1`, base T03 `43cc489`. La rama propia conserva sus tres commits no publicados, sin modificar main. Alcance registrado antes de editar en `9577f69`; el commit de cierre solo documenta resultados/proceso. Las dos regresiones demostraron fallo en la base y pasan después; selección final nueva 43/43, incluido todo T04.

`npm run start` normal (Node 24.19.0) permaneció vivo **12:13:34–12:21:02** para la selección final; catálogo genérica formato 1/contenido 2 disponible, HTTP 200, no-store y sin cookie; JSON privados 404. Instancia propia detenida correctamente, puerto liberado. Caso B08 real nuevo: límite 12:19:30.810, transporte cerrado 12:19:15.884, avance observado 12:19:30.828 (17,02 ms después); contador 1 y recuperación, adaptadores/entropía normales. Los cuatro casos T04 y retenciones son controlados, no esa prueba real de 15 s.

Comprobación final de huellas APP = ASSETS = aprobadas de activación: `baraja.json` **991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed** (4723 bytes), `cartas.json` **868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c** (34030 bytes). Diff contra T03 vacío en package/lockfile, referencias Node/CI y barajas; servidor y contratos sin cambios. Sin fuentes generales TFM ni publicación/PR/despliegue. INC-01 corregido técnicamente; validación humana posterior y futura publicación/CI por sus responsables pendientes.

Archivos propios: `src/useRoomFlow.ts`, `tests/browser/resultNotice.spec.ts`, `tests/support/configurationBrowserServer.ts`, README, esta especificación y enlace/cierre de proceso SDD. Artefactos siguen ignorados. Para coordinación: aviso por gameId, limpieza de contexto y guards de respuesta vieja; caducidad y permiso originales conservados. No se requiere cambiar reglas ni fuentes generales de Arquitectura para esta corrección.
