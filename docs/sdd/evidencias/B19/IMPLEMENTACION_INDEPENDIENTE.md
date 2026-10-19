# B19 — incremento independiente, 19/10/2026

**B19 permanece abierto.** Este registro acredita código y ensayos independientes de la decisión final de privacidad; no información pública definitiva, consentimiento, retirada, activación, publicación o VPS. La aplicación normal continúa OFF y su llamada a `createUsageRuntime()` conserva el bloqueo de HUMAN hasta recibir e incorporar el contenido/contrato final. No se implementaron sesiones cerradas, contraseñas o pausa administrativa global.

## Base y propiedad

- Carpeta única `APP/karta3`; base efectiva `main 2b25f69193c3a56bfa1e7d9b13afc09eaca0fca4`. Sin crear rama/checkout ni modificar instalaciones globales.
- AGENTS modificado por el autor se conserva sin incluirlo en los commits de Implementación. Preparación SDD liberada entonces y registrada aparte en `38152bc`; sus modificaciones posteriores y el proceso han vuelto a propiedad de SDD y se conservan sin capturarlas.
- Código independiente `662e696b1b28b4239e12646e50b614050caa1403`, 26 archivos. Ningún servidor/puerto/dato del autor detenido o consultado. Sin push, PR, GHCR, VPS o mensajes a otros chats.
- Node24.19.0, `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm11.6.2, ICU78.3/Unicode17.0, SQLite3.53.3, Windows/x64. PATH solo del proceso; dependencias bloqueadas intactas.

## Código entregado y límites

| Pieza | Cambio y límite |
|---|---|
| `composition/usage.ts` | Matriz exacta ausente/off, synthetic/test y human/pruebas; desconocidos/combinaciones inválidas no habilitan. HUMAN comprueba información completa y clave privada por archivo. La información final **no está incorporada**; el `true` de las pruebas representa únicamente información fabricada del montaje, nunca aprobación jurídica o usuarios reales. |
| `privateFiles.ts`, mantenimiento | Clave regular/privada y 64 hex, sin alias literal HUMAN ni secretos en diagnósticos. Clave ausente/incorrecta bloquea captura/copia, no la purga de un histórico válido. CLI real comprobado. |
| `sqliteWorker.ts`, `worker.ts`, lector | Disponibilidad efectiva tras ready, caída/pausa; copia requerida fallida impide capturar y puede recuperarse por el mantenimiento existente. Cola/plazos/conservación B18 intactos. Calidad técnica fechada marca degradación, no un modo solicitado como captura efectiva. Sin sistema paralelo de tareas. |
| HTTP | Cabecera `X-Karta3-Usage-Collection: off|synthetic|human` en API, no-store, calculada desde estado efectivo; ingesta tardía OFF no persiste. Mismo origen, límites y validadores cerrados B18. Sin endpoint de activación/informes/consentimiento provisional. |
| `src/usage.ts`, API, flujo y socket | Generación/orden de señales, cancelación de retry al invalidar, visita/contextos solo memoria. Procesa OFF antes de204/error; respuesta anterior no reactiva. Desconexión invalida y HTTP vigente confirma al reconectar. Mantiene requestId y datos del juego, elimina solo contexto estadístico; lo vuelve a validar al enviar tras esperar conexión. Sin portada retrospectiva o reenvío estadístico al reactivar. |
| Compose | OFF predeterminado configurable; overlay opcional monta archivo de clave RO sin valor literal. Sintaxis local comprobada, no aplicado a ningún servicio. |
| Verificador Linux existente | Expectativa explícita `off` para el nuevo contrato de señal; solo sintaxis local comprobada. Linux B18 es antecedente, **no** ejecución del cambio B19. |

No cambios de Game, reglas, eventos/métricas, fórmulas, límites o barajas. Los informes conservan sus ocho consultas y datos B18; la calidad operativa existente distingue el fallo. Los ensayos HUMAN se identifican externamente como **fabricados**, en directorios nuevos desechables; no se reclasificó SYNTHETIC ni se leyó histórico real. Las instalaciones de navegador limpian cualquier ruta de clave heredada del entorno del autor.

## Pruebas ejecutadas

Registros extensos ignorados en `playwright-report/b19/`; no DB/CSV/clave o datos individuales en Git.

1. `npm run typecheck` y `npx vitest run src/usage.test.ts src/apiUsage.test.ts server/composition/usage.test.ts server/infrastructure/usage/http.test.ts server/infrastructure/usage/sqliteWorker.test.ts`: **43/43,5 archivos**, primera puerta focal. SQLite temporal real y ACL Windows; no Linux.
2. `npx vitest run server/usageActivation.test.ts server/infrastructure/usage/sqliteWorker.test.ts`: **15/15,2 archivos**, después de añadir conexiones HUMAN fabricadas y copia requerida. Dos sesiones/dos sockets HOST, nueve hechos sin ampliación, replay/concurrencia, automático/final único; reloj del juego controlado y HTTP/Socket.IO/SQLite reales. Caída real del worker retira señal, ignora POST y conserva avance de turno. No equivale a un timeout real de15 s.
3. `npm run check`, sobre el código de `662e696`: **622/622,56 archivos y93 módulos**, tipos/lint/build correctos. Incluye las589 regresiones reejecutadas y33 pruebas nuevas; no se atribuyen resultados históricos B18 a B19. Registra también el ensayo heredado de15 s reales con escritor bloqueado/activo desconectado y los reinicios reales de procesos propios. No señal POSIX/volumen Linux acreditados por Windows.
4. `npx playwright test --workers=1 --retries=0 usageActivation.spec.ts`: **2/2,16,5 s** sobre compilación vigente entonces. Reinicio SYNTHETIC→OFF real del proceso propio, reconexión/creación incierta y respuesta positiva anterior retenida por el arnés. Este último control dirige solo la latencia de una respuesta real, no simula un servidor que haya aceptado el modo. Regresiones compiladas posteriores de662e696: **32+8=40/40**, dos trabajadores/cero reintentos,1,9 min y50,7 s; instancia normal propia `127.0.0.1:51136`/PID17036 OFF y detenida al terminar. Huellas de dist/dist-server/catálogo idénticas antes/después de ambas selecciones.
5. `docker compose -f deploy/compose.yaml -f deploy/compose.usage.yaml -f deploy/compose.usage-key.yaml config --quiet` y `node --check tools/ci-usage-runtime.mjs`: salida0. **Sintaxis, no ejecución Linux/imagen/volumen**. OFF, referencias ficticias locales y archivo de prueba sin clave real; no se inició Docker.
6. Inventario/SHA-256 previo y posterior: **124/124 archivos aprobados intactos**, sin cambios de genérica/Solar2/4 o Criaturas2/2. Sin dependencias nuevas.

Selecciones del punto4, sobre build de `npm run check`, sin reconstrucción adicional:

```text
npm exec -- playwright test --workers=2 --retries=0 usageActivation.spec.ts usage.spec.ts room.spec.ts join.spec.ts cancelGame.spec.ts resultNotice.spec.ts timedRealGame.spec.ts
npm exec -- playwright test --workers=2 --retries=0 bots.spec.ts format2Presentation.spec.ts timedGame.spec.ts --grep "B09 P2 normal compilado|B15 espera:|B15 frontera medida|B08 T1|B08 T2"
```

Incluyen partida normal humano/EASY/HARD y terminal durable sintético, timeout real15 s, cancelación/T04, recuperación y presentación360/390/1280/frontera1367–1368. No batería completa Chrome, dispositivos físicos o prueba humana; no son evidencia de una elección B19 todavía no construida.

## Fallos y reparaciones reales

- Un test nuevo consultaba un campo inexistente: se corrige a `game.ownConsecutiveTimeouts` y se tipa la recuperación segura; el contrato no se amplía. Los dos casos nuevos Chrome usaban un texto de botón erróneo: se usa `Reintentar conexión` y la recuperación automática existente. Sin force-click, llamadas directas a acciones o aumento de plazos.
- Lint detectó una guarda con throw en finally de una fixture nueva; se mueve antes del try conservando la verificación de ruta antes de borrar.
- Primera puerta completa:621 correctas y una regresión de ingesta excede5 s. Aislada, mismo caso:3290 ms. Medición de tres cargas completas de catálogo:1427/1388/1373 ms. La fixture cargaba dos veces esa copia normal inmutable; se reutiliza su catálogo validado por archivo, conservando todas las salas/DB/sesiones independientes y aserciones. El caso pasa en2023 ms; la puerta completa posterior pasa622/622 sin cambiar timeout, reglas o muestras. Logs originales conservados.

## Puertas pendientes y coordinación

H01–H05/H07 disponen de evidencia técnica parcial indicada; H06 depende de texto/elección/retirada válidos para **acceso libre** y de su contrato final servidor/cliente. No se considera suficiente bloquear BROWSER mientras se siguen midiendo hechos SERVER. No se escoge aquí otra fórmula/cohorte, una exención o el procedimiento de consentimiento. H08 requiere la fuente final tras esa resolución y regresiones correspondientes; H09 y H10 siguen a cargo de sus responsables, dentro de B19, con autorización final del autor antes de actualizar/activar Pruebas.

**Continuación recibida tras este incremento:** SDD define §§4.4–4.5: elección RAM12 h, recibos auxiliares de privacidad por el mismo escritor, barrera de retirada y observación censurada. Su implementación continúa a partir de este código; estas622 pruebas/40 Chrome acreditan únicamente el incremento independiente previo. La consecuencia material de cobertura/tasas y la información operativa se presentan al autor en el paquete final; no se afirma que ya estén aceptadas por él ni que esta evidencia las verifique.

Coordinación agrupa las decisiones pendientes y el inventario operativo. No solicitar de nuevo identidad/contacto/Pruebas ni introducir barrera de acceso, consentimiento externo, pausa global, SSH delegado o cambios de backups del proveedor por inferencia. Sin ese contrato no se conecta HUMAN en la aplicación normal ni se publica un borrador de privacidad. El cierre global B19, la recogida real y la revisión humana siguen **pendientes**, no superados por estos ensayos. C09–C10 permanecen parciales.
