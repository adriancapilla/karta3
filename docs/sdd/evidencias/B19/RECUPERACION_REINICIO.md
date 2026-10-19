# B19 — recuperación durante el cierre del runtime, 19/10/2026

## Alcance y base efectiva

Continuación focal desde `chore/publicacion-b19`, HEAD `8c1bde57753a80c21b11572cf4e17fc7639b5b25`, árbol limpio tras la cesión de APP. Conserva los commits de publicación, instrumentación y documentación de GitHub. Producto y regresión inicial en **`2233a0d1f4c703bc65ca77bd80bbaebfa1ed13ac`**; cierre completo del arnés en **`4922d69`**, presupuesto H03 en **`af9c3882739d7bbb97bdb00644862f10d1911cd7`**, fuente final comprobada. Documentación/evidencias en commit separado posterior. Sin ramas/checkouts nuevos, fuentes generales editadas, servidores del autor detenidos o cambios en el aviso `2026-10-19.2`.

Se investiga exclusivamente la recuperación de B03-15 después de perder la memoria del servidor. La recogida normal permanece **OFF**. No se amplía la analítica, se cambia un plazo del juego o se reenvía una acción pendiente.

## Antecedente recibido, distinto de la evidencia nueva

La [CI completa 39245992269](https://github.com/adriancapilla/karta3/actions/runs/39245992269), fuente `7398a8f`, terminó con **204/205 Chrome**, aunque check Linux (646 pruebas/99 módulos) e imagen pasaron. B03-15 mostraba todavía la espera anterior y «Conexión interrumpida…», sin el aviso de sala ausente. No se conservó en ese intento una traza del paquete que provocó el estado. La [observación posterior 39250869920](https://github.com/adriancapilla/karta3/actions/runs/39250869920), fuente `19ad3f7`, pasó cinco veces, sin paquete 41; no reprodujo ni reparó el fallo original. Se conservan esos resultados en `LINUX_FOCAL.md` y en `APP/verificacion-b19-20261019/`.

**No se ha demostrado retrospectivamente la causa exacta de aquel intento de CI.** Se ha identificado y reproducido un camino adverso concreto que produce su mismo síntoma, y se corrige ese camino con una regresión que lo fuerza.

## Causa demostrada y corrección mínima

1. `runtime.dispose()` marca `SocketRoomChanges.stopped`. Una conexión autenticada puede llegar a su guardia mientras la escucha todavía está abierta.
2. La guardia usaba `socket.disconnect(true)`. Socket.IO emite un **DISCONNECT de namespace (41)** y después cierra el transporte.
3. El cliente interpreta esa expulsión como intencional, destruye su suscripción y deja de intentar reconectar. El manejador de desconexión conserva la vista con el aviso de conexión interrumpida; no alcanza la recuperación HTTP del proceso nuevo.
4. La guardia pasa a **`socket.conn.close()`**: rechaza la conexión durante la parada cerrando el transporte, sin expulsarla del namespace. La reconexión normal puede alcanzar el nuevo proceso, recuperar una sesión nueva y confirmar que la sala anterior ya no existe.

El cambio de producto está limitado a esa guardia y su comentario en `server/infrastructure/socketRooms.ts`. Autenticación de cookie/origen, rechazo de sesiones inválidas, guardia de parada y ausencia de handlers/presencia para la conexión rechazada permanecen. No hay reconexión indiscriminada del cliente frente a un DISCONNECT intencional, nuevo temporizador o endpoint de prueba. `server/main.ts` ya cierra el transporte y las conexiones HTTP durante su parada; no se modifica.

La misma guardia existía en B18 integrado. B19 añade consultas de estado/elección, pero **no está demostrado que estas causaran el fallo remoto**. No se atribuye causalidad a una mera coincidencia de tiempos.

## Regresión, fallos del ensayo y reparaciones

`tests/browser/lifecycle.spec.ts` conserva B03-15 y su instrumentación previa. Añade un caso adverso con dos contextos independientes y HTTP/Socket.IO reales:

- Una barrera privada del arnés mantiene la escucha abierta después de `dispose`, cierra los transportes existentes y espera una reconexión real del **propio anfitrión** a la guardia detenida. No basta con observar al invitado.
- Después cierra el servidor anterior, escucha en el mismo puerto con RAM nueva, exige el aviso de sala ausente dentro de los mismos **10 s**, ausencia de 41 y creación mediante clic normal de otra sala con presencia `CONNECTED` en una sesión nueva.
- La barrera controla el orden del cierre, no simula una respuesta, altera Game, fuerza un clic o amplía la ventana de recuperación. El ciclo de espera usa el reloj sustituido habitual; no acredita treinta segundos o treinta minutos reales.

**Rojo previo al cambio de producto:** una ejecución falla en la aserción de recuperación (10 s), con el servidor nuevo escuchando, espera antigua visible y **41 recibido por el anfitrión**. Su contador inicial de conexiones era global; la captura de 41 sí corresponde al anfitrión. La revisión posterior fortalece la barrera para esperar expresamente su sesión. Los booleanos iniciales de Set-Cookie usaban `headers()` y no se toman como evidencia de cookies; el observador final usa `allHeaders()`.

**Iteraciones intermedias:** el primer verde dio 6/6 (original y adverso, tres veces cada uno). Al fortalecer la barrera por anfitrión, una ejecución dio 5/6: el cierre del arnés quedó esperando HTTP en vuelo en `io.close`, antes de evaluar la recuperación. La traza registra una entrada del anfitrión a la guardia y ningún 41. No se amplió el presupuesto: primero el cierre adverso adoptó la secuencia que ya utiliza `main` (`engine.close`, `server.close`, `closeAllConnections`) y después liberó Socket.IO. Esa reparación dio 6/6 en 29,0 s; se conserva como resultado intermedio, no como puerta de una fuente posterior.

Después de corregir la observación de cabeceras, el adverso pasó 3/3, pero una repetición del original se bloqueó también en el cierre: 5/6 globales, presupuesto de 60 s agotado, `old.stop.begin` sin nueva escucha durante el bloqueo y conexiones posteriores en el runtime detenido. Es un fallo del cierre anterior del arnés, diferente del rojo de 10 s con 41 y servidor nuevo ya escuchando. La secuencia de cierre de `main` se aplica finalmente a **ambos** casos y al cleanup del helper. No se aumenta tiempo, se retira una aserción ni se impide la reconexión del cliente; se cierra efectivamente el servidor que el ensayo debe reiniciar. El cambio no modifica `main`, que ya realizaba ese cierre.

Dos puertas intermedias de `check` dieron 644/645: H03 de `usageActivation.test.ts` agotó el presupuesto global Vitest de 5 s. Su ejecución aislada, sin modificar test o producto, pasó en 3451 ms (1 caso, siete excluidos por el filtro); ese pase no explicaba por sí solo la variación. Se detuvieron las repeticiones de puertas completas y se midieron fases con instrumentación temporal, retirada del código final:

| Medición | Resultado observado |
|---|---|
| Bajo carga de la batería | Worker listo a 2806 ms; al agotarse los 5 s todavía se esperaba el catálogo, antes de abrir HTTP. Las continuaciones posteriores al timeout se intercalaron con el siguiente caso: no se atribuyen sus 7497 ms a una ejecución aislada completa. |
| Focal de ocho casos, presupuesto total H03 explícito de 10 s | Worker 1558 ms; catálogo 2952; escucha 2973; tres sockets 3112; hechos BROWSER aceptados 3152; inicio 3188; resultados 3214; segunda sala cerrada 3245; nueve hechos 3459; fin 3463. H03 pasó en 3479 ms y el archivo dio 8/8 en 17,56 s. |

La preparación ACL/worker/catálogo consume la mayor parte del montaje y bajo carga agotó el presupuesto antes de la ingesta. Se fija **10 s únicamente para esa integración completa**, el doble del valor implícito anterior; no es un SLA de escritura, consulta o juego. Se conserva íntegra la espera de los nueve hechos (214 ms observados en la focal), sus aserciones, controles de privacidad y todos los plazos de operación. No se cambian worker, catálogo, producto ni timeout global de Vitest. Esto fundamenta corregir un presupuesto insuficiente de montaje, sin atribuir cada variación a una causa de SO concreta.

La medición bajo carga se lanzó directamente con `node .../vitest.mjs`: dio 643/645 porque, además de H03, la fixture de construcción no recibió `npm_execpath` y buscó npm en una ruta inexistente del runtime. No fue una regresión de dependencias o del producto; la puerta final y la focal de ocho se ejecutan mediante `npm run test`/`npm run check`, que proporcionan el entorno esperado. No se modifica esa fixture o sus aserciones.

Los registros/trazas íntegros permanecen ignorados bajo `playwright-report/b19/reinicio/`: `rojo`, `verde`, `cierre` (incluye el bloqueo adverso), `cierre-http`, `regresiones`, `entrega` (incluye el bloqueo original) y `cierre-definitivo`; logs H03 separados `h03-diagnostico`, `h03-fases-suite` y `h03-fases-focal`. Solo se registran resúmenes seguros, sin cookies, identificadores, query strings o cuerpos de transporte, en `reinicio-cierre/`. No se versionan las trazas completas.

## Entorno y comandos

Windows/x64, Node **24.19.0**, ICU **78.3**, Unicode **17.0**, SQLite **3.53.3**, npm **11.6.2**, Chrome automatizado. Node efectivo:

```text
C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
```

PATH configurado únicamente para los procesos de ensayo, sin cambiar la instalación global; `NODE_ENV` sin fijar y `KARTA3_USAGE_COLLECTION=off`. Los comandos siguientes usan ese Node/npm y la compilación actual. Los archivos seleccionados crean instancias propias, sin usar el puerto del autor.

```powershell
npm run check
node node_modules/@playwright/test/cli.js test --workers=1 --retries=0 lifecycle.spec.ts --grep B03-15 --repeat-each=3 --trace on --output=playwright-report/b19/reinicio/cierre-definitivo
node node_modules/@playwright/test/cli.js test --workers=1 --retries=0 usageActivation.spec.ts usageChoice.spec.ts initialGame.spec.ts cancelGame.spec.ts --grep 'H02 compilado|H04|B06-17/E7|B13 ack/evento perdidos' --trace on --output=playwright-report/b19/reinicio/regresiones
```

Las repeticiones son ejecuciones independientes, **cero reintentos**. En PowerShell se usa el CLI de Playwright directamente para no pasar el `|` del filtro por un wrapper `cmd`. Vitest se ejecuta mediante npm para conservar `npm_execpath`. Los cinco casos de regresión pasaron sobre el mismo producto final; después solo se fortaleció el arnés nuevo y su observación, por lo que no se repitieron por rutina. Diagnósticos adicionales: `node node_modules/vitest/vitest.mjs run server/usageActivation.test.ts -t 'H03 HUMAN fabricado: dos sesiones' --reporter=verbose`, `node node_modules/vitest/vitest.mjs run --reporter=verbose` y `npm run test -- server/usageActivation.test.ts --reporter=verbose`, con las diferencias de entorno y resultados descritos arriba.

## Puertas finales y revisión semántica

Sobre la fuente final `af9c388`:

| Puerta nueva | Resultado real |
|---|---|
| `npm run check` | Correcto: typecheck, lint, build, **645/645 en 59 archivos**, 37,49 s de Vitest; **99 módulos** sin imports prohibidos ni ciclos. Registro `check-cierre-definitivo.log`. No se atribuyen los 646 históricos Linux a Windows. |
| B03-15 original + adverso, tres ejecuciones independientes de cada uno | **6/6**, 27,7 s, un trabajador/cero reintentos, compilación vigente; original 4,4/4,3/4,8 s y adverso 3,9/2,9/3,0 s. Los tres adversos registran **una conexión del anfitrión durante el cierre**, ningún 41 (WebSocket y polling observados), servidor nuevo escuchando y recuperación completa con creación/presencia nueva. |
| Focal H03 instrumentada | **8/8** antes de retirar únicamente las sondas temporales; presupuesto y todas las aserciones idénticos al código final. No se suma a las 645 de la puerta final. |
| Regresiones relacionadas | **5/5**, 38,3 s; mismo producto final, sin repetir por cambios exclusivos del arnés. |

[Resumen de resultados](reinicio-cierre/resultados.json), [rojo previo](reinicio-cierre/rojo-seguro.json), [señales finales por ejecución](reinicio-cierre/cierres-seguros.json) y [preservación de archivos](reinicio-cierre/preservacion.json). Las seis ejecuciones finales corresponden a dos casos únicos; con las cinco regresiones son **siete casos únicos/once ejecuciones**, no una batería global de navegador. Los verdes y fallos intermedios se conservan separados.

Las cinco regresiones relacionadas dieron **5/5 en 38,3 s**, un trabajador/cero reintentos: B13 ack/evento perdido y respuesta A frente a B; B06-17/E7 reinicio real de `main` compilado sin ASSETS; H02 creación incierta/reinicio OFF; H02 respuesta antigua que no reactiva la recogida; H04 HUMAN fabricado→parada controlada→OFF con pérdida de permiso/Game RAM. Los últimos casos usan procesos reales propios, datos fabricados y la misma compilación, no tráfico público.

Revisión de responsabilidades: la decisión de cierre permanece en el adaptador Socket.IO; aplicación, dominio, proyecciones, deduplicación, privacidad de vistas, cliente y contratos no cambian. No se registran conexiones durante la parada como presencia válida ni se aceptan acciones nuevas por esa conexión. El control de imports/ciclos se complementa con esta revisión. Los 71 archivos de compilación/catálogo coinciden con las huellas del producto servido en las regresiones. **124/124 archivos editoriales conservan tamaño/SHA-256**; aviso exacto conservado: `a1136c0b28d3d7945add42cc3be4b06ed0426c43cc5c43d8e7cba193ca501441`.

## Entrega al autor y límites

La corrección y el ensayo adverso son evidencia nueva **Windows**. No se declara resuelta por repetición la causa no capturada del intento remoto, ni se atribuye Linux a Chrome local, una batería completa a esta selección o una aprobación humana a automatización. No se han ejecutado aquí la CI completa final, imagen Linux, integración, clon o publicación; B19 global, autorización operativa y C09–C10 mantienen sus límites.

Tras esta entrega se libera APP para que GitHub compruebe el **HEAD final entregado**, inicialmente con la selección focal anterior en Linux y después con la CI completa sin filtros según su procedimiento. El adverso nuevo debe demostrar una entrada del anfitrión durante el cierre, ningún 41 y recuperación; pasar solo B03-15 original no sustituye ese caso. No lanzar desde Implementación ni ampliar presupuestos. Conservar el aviso y OFF; no VPS, GHCR, push o mensajes a otros hilos.
