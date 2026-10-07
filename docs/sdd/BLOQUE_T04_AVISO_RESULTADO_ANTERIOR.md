# T04 — Aviso de resultado anterior (INC-01)

**Alcance acordado y registrado antes de corregir — 07/10/2026.** Base efectiva T03 `43cc4891ef1e76530a0ac20a8d944156c01d4275`, rama inicial `chore/t03-entorno-dependencias`, árbol limpio. Rama propia `fix/t04-aviso-resultado-anterior`; conserva íntegros los tres commits locales T03 y main `dd20e0a`. Fuentes: AGENTS, proceso SDD, resultados/recuperación B07 y automático B08, registro INC-01 y acuerdo T04 de contexto TFM (solo lectura).

## Alcance y criterios

Reproducir resultado A caducado → nueva partida B → clasificación disponible con aviso de A; determinar causa y corregir mínimamente asociación de avisos/resultados y respuestas/eventos tardíos. Mantener retención de 30 minutos sin renovación por lectura, permisos, identidad, reglas y barajas. No diseño, dependencias, refactorización general, fuentes TFM, publicación/PR/despliegue.

- Regresión nueva que falle sobre la base y pase tras corregir; B por inactividad/automático y final ordinario.
- Recarga/recuperación de B, caducidad legítima B y consultas posteriores A; mensajes A retrasados no alteran B.
- Tiempo controlado permitido, identificado por caso; HTTP/Socket.IO y navegador de compilación vigente, sin atribuir media hora real.
- Entorno T03: Node 24.19.0 desde `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm 11.6.2; sin modificar instalaciones globales. `npm run check` y navegador pertinente de resultados/recuperación/transiciones. Puertas T03 históricas no acreditan T04.

Responsabilidad afectada: estado/peticiones del recorrido React `useRoomFlow` y pruebas de navegador; servidor sigue autorizando/caducando resultados. Revisión preliminar detecta `resultError` global, escrito en rechazo de retorno y no retirado al cambiar de sala; confirmar por reproducción antes de modificar producto. Examinar además guards de retorno/lectura/resume y eventos `results:home` antes de elegir la corrección.

**Estado:** acordado; reproducción y verificación pendientes. Este alcance no acredita resultados ejecutados.

## Reproducción y causa — antes de corregir producto

Node 24.19.0/npm 11.6.2, Chrome, compilación T03 vigente; conexiones HTTP/Socket.IO reales y reloj/planificador `ControlledTime`. `npm run test:browser -- tests/browser/resultNotice.spec.ts --grep ''B automatic'' --workers=1`: **1/1 falla como se esperaba**, 7,2 s, clasificación B visible y un alert en vez de cero, después de caducar A y volver/crear/jugar B. `--grep ''late A''`: **1/1 falla**, 12,4 s, error de confirmación de retorno A sobre clasificación B ya disponible. Son regresiones de producto sobre la base sin corregir, no pruebas superadas. El primer montaje asíncrono requirió corregir sintaxis del helper y liberar también al invitado de A antes de entrar en B; su timeout por montaje no se interpreta como otra incidencia de producto.

Causa confirmada: `returnHome.catch` guarda un `resultError` global sin ID de partida. Al caducar A, fallback `api.current` recupera portada correctamente, pero `clearRoom` y `applyRoom` no retiraban ese error. El mismo hook recibe B y `App` entrega el error de A a `ResultsScreen` B. Además, el catch escribía/recuperaba antes de comprobar que seguía mostrando el resultado A; un ack perdido podía terminar ese catch después de aceptar B. Servidor/retención funcionan: A se elimina, permite nueva vinculación B y no recupera resultado caducado. No se atribuye el problema al motivo de inactividad; también se comprobará B ordinaria.

Corrección mínima prevista tras reproducir: error con propietario `gameId`, retirada al dejar/cambiar de contexto y validación del resultado mostrado antes de tratar éxito/rechazo del retorno y después de su recuperación HTTP. Conservar filtros vigentes de `openResult`, revisiones `room:state`, autorización de current/resume y contexto/dedupe `results:home`; probar entregas antiguas. Ningún cambio de servidor/contrato/retención.
