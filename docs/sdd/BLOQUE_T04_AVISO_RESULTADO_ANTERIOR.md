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
