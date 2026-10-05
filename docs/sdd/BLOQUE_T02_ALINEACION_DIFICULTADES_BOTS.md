# T02 — Alineación de dificultades de bots

**Estado:** acordado, implementado y verificado localmente el 05/10/2026. Evidencia nueva y límites en el cierre T02 al final; sin publicación.
**Tipo/base comprobada:** ajuste técnico sobre `feat/b09-bots`, HEAD `4917d96bb36c1c805d9023d7c79dc4b98956e1d6`, árbol limpio antes de esta preparación. Incluye B09 y el ajuste visual; main `8d305e0` no sirve como base de implementación.

**Referencias:** [AGENTS](../../AGENTS.md), [proceso/plantilla](PROCESO_SDD.md), [organización §B09](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md#incremento-de-bots-fácilnormal--b09), [B09 y cierre §§11.6–11.7](BLOQUE_09_BOTS.md), [ajuste visual](AJUSTE_ETIQUETA_DIFICULTAD_BOTS.md); dominio §§19.4–19.7, aplicación §§3–7/14/18–19 e infraestructura §§5–8/17 de `TFM/Planificación`.

## Objetivo y decisión que resuelve las fuentes anteriores

Alinear la dificultad visible con su identificador técnico:

| Nivel vigente tras T02 | Identificador | Política |
| --- | --- | --- |
| Fácil | `EASY` | La actual EASY, sin cambios. |
| Difícil | `HARD` | Exactamente la actual NORMAL, sin cambios de carta ni dirección. |

«Añadir bot» crea HARD, presentado como Difícil. NORMAL deja de ser dificultad activa. Normal intermedio y Muy difícil son intenciones futuras: sin valores admitidos, opciones ni algoritmos en T02.

La aprobación expresa del autor sustituye la denominación anterior y la exclusión antigua de HARD; **no aprueba el algoritmo avanzado** sugerido en dominio §19.7. Resuelve la contradicción para implementar T02. Arquitectura alineará las fuentes TFM; registrar ese traslado pendiente en el cierre.

## Alcance y contrato conservado

- Incluye tipos, validación, valor inicial, identificadores/nombres que designen esta dificultad, vistas, fixtures, pruebas y documentación vigente de APP.
- Conserva gestión y niveles mezclados, nombres/sufijos, permisos, capacidad/orden, actividad y deduplicación, privacidad, tiempos/revisión, fase final, desempate, inactividad y resultados de B01–B09.
- Fuera: políticas nuevas, niveles adicionales, alias de compatibilidad, refactorización general, rediseño, cambios de baraja, edición TFM y publicación.

Conservar las cuatro operaciones `room:bot-*`, sus campos y acks. `difficulty`/`botDifficulty` admite **EASY | HARD** en espera, partida y resultados; HUMAN conserva null. El cliente no ejecuta políticas.

Con sesión/contexto válidos, NORMAL, desconocidos, minúsculas, tipos incorrectos y campos ausentes/adicionales producen `INVALID_INPUT`, sin coerción, alias ni efectos sobre nivel/plaza/orden/actividad. Conservar errores de autorización/fase y deduplicación. El mensaje «Elige Fácil o Normal» pasa a «Elige Fácil o Difícil».

Servidor/cliente deben usar la misma compilación. El reinicio pierde la memoria, sin migrar salas antiguas. Un navegador antiguo que envíe NORMAL recibe rechazo y debe recargar el cliente vigente. Comprobar recuperación de sesiones nuevas con recarga/reconexión y varias pestañas, sin reiniciar servidor.

## Responsabilidades, dependencias y piezas localizadas

| Responsabilidad | Piezas afectadas o a revisar | Dependencias y comprobación |
| --- | --- | --- |
| Tipo y validación de dificultad; política pura | `server/domain/botPlay.ts`; usos en `game.ts` | Datos/tipos puros; sin IO, reloj, aplicación o transporte. Comparación de decisiones antes/después y pruebas de Game. |
| Tipo BOT, incorporación inicial y mensaje de validación | `server/application/room.ts`; proyecciones y coordinador existentes | Dominio y contratos/puertos propios; sin adaptadores. Gestión, actividad, recuperación y ejecución existentes. |
| Valores públicos y decodificación estricta | `shared/contracts/room.ts`, `server/infrastructure/botInput.ts`; transporte existente | Contratos seguros; adaptador invoca aplicación, no estrategia. Integración/ack/eventos y valores inválidos. |
| Valor del selector y etiquetas | `src/WaitingPlayers.tsx`; revisión de `GameScreen.tsx`/`ResultsScreen.tsx` | Cliente → contratos, nunca server. Fácil/Difícil y HARD tras añadir, seleccionar y recuperar. |
| Fixtures y expectativas | `botPlay.test.ts`, `botGame.test.ts`, `bots.test.ts`, `botExecution.test.ts`, `botInput.test.ts`, `server/botSocket.test.ts`; `tests/support/{botTrace,manualSocketCases,manualBrowserCases,gamePrivacy}.ts`, `tests/browser/bots.spec.ts` | Sustituir solo valores/nombres de dificultad; mantener escenarios y garantías, con la excepción de validación acordada. |

Composición, puertos y almacenamiento no necesitan piezas nuevas. Renombrar **solo nombres que designen dificultad**; revisar, por ejemplo, el parámetro `normal` de `playOwn`, que elige estrategia humana. Conservar `normalizeName`, `completedNormally`, «proceso normal» y «ronda normal». Sin sustitución global.

## Ejemplos y aceptación

| Caso | Comprobación prevista |
| --- | --- |
| E1 — Incorporación y recuperación | Añadir devuelve BOT/HARD; anfitrión e invitado ven Difícil. Otra pestaña y recarga recuperan HARD. Cambiar a EASY muestra Fácil. |
| E2 — Contrato estricto | EASY/HARD válidos; NORMAL, `hard`, valor desconocido, booleano, número o null inválidos. También probar campos ausentes/adicionales, sin cambios ni renovación por rechazo. |
| E3 — Equivalencia | Con manos/atributo/dirección idénticos, HARD devuelve el mismo `{cardId, direction}` que NORMAL en la base: apertura [2,57] → 57/HIGH; [2,56] → 2/LOW; [29,30] → 30/HIGH; no abridor máximo HIGH/mínimo LOW. EASY permanece idéntico; manos de 1–3 cartas y orden de adquisición. |
| E4 — Partida y privacidad | Mezcla EASY/HARD completa las trazas existentes, incluida fase final/desempate/inactividad. Espera, mesa y resultados publican HARD/Difícil y solo información autorizada. |

- [x] **T02-1:** solo EASY/HARD activos en tipos, validadores, selector y vistas; HARD predeterminado. NORMAL queda únicamente en historial, transición o pruebas de rechazo.
- [x] **T02-2:** equivalencia de decisiones de ambas políticas respecto a `4917d96`, con casos deterministas y resultados esperados independientes del código nuevo; no basta renombrar las aserciones.
- [x] **T02-3:** aceptación EASY/HARD y rechazo NORMAL/desconocidos en dominio, aplicación y transporte; validación estricta, permisos y ausencia de efectos preservados.
- [x] **T02-4:** gestión, niveles mezclados, recuperación/presentación y regresiones B01–B09 conservadas, incluidos privacidad, revisión, fase final, desempate e inactividad.
- [x] **T02-5:** documentación actual de APP alineada; transición y cierres históricos preservados; traslado a Arquitectura identificado.
- [x] **T02-6:** check y batería completa de navegador pasan sobre código final compilado; revisión semántica e imports/ciclos sin desviaciones.

## Verificación, autonomía y cierre

Capturar decisiones deterministas de la base antes del cambio y comparar los mismos vectores con EASY/HARD. Conservar las trazas con semilla, cartas/puntuación/etapas. Sin política antigua en producción ni alias NORMAL.

Cambiar negativos HARD por NORMAL/desconocidos y comprobar HARD válido. Separar dificultad inválida y roster sin humanos: `botGame.test.ts` combina ambas condiciones. Conservar escenarios/aserciones.

Durante edición, usar pruebas focalizadas. Al cerrar: `npm run check` y **`npm run test:browser -- --workers=2` completo**, compilación vigente. No repetir baterías por rutina; reparar fallos y acreditar las puertas finales. Los 402/402 y 86/86 B09 y los cuatro recorridos visuales son históricos, no evidencia T02 ni totales obligatorios.

El implementador elige nombres locales y montaje mínimo compatibles; no hay preguntas funcionales abiertas. Registrar revisión, comandos/fecha/entorno, resultados, reparaciones y comprobación arquitectónica. C09–C10 siguen parciales, sin acreditar equilibrio, comprensión o dispositivos físicos.

**Registro de preparación:** antes de implementar, esta especificación solo había leído fuentes/código y preparado documentación, sin ejecutar pruebas del producto. Las ejecuciones nuevas se registran debajo, separadas de los cierres históricos.

## Documentación vigente y traslado a Arquitectura

Actualizar README/organización vigentes para EASY/HARD y predeterminado HARD. Registrar transición en SDD/proceso; conservar cierres B09/ajuste visual.

Arquitectura recibirá esta decisión y el cierre nuevo para actualizar después:

- **Dominio:** modelo, §§19.4–19.6, ejemplos/casos → EASY/HARD; §19.6 Difícil **con el mismo algoritmo**. §19.7 deja de reservar ese nombre. Normal intermedio/Muy difícil futuros, sin algoritmos aprobados; preservar historial.
- **Aplicación:** alcance, tabla, AddBot/SetBotDifficulty, predeterminado Difícil/HARD y valores públicos; actualizar exclusión antigua y estado B09 con su evidencia.
- **Infraestructura:** validación EASY/HARD y rechazo NORMAL; confirmar bots entregados/valor inicial. Actualizar pendientes obsoletos sin acreditar publicación/despliegue.

Coordinación registrará NORMAL → HARD y el traslado pendiente. El algoritmo avanzado sugerido sigue sin desarrollo aprobado.

**Prompt:** [encargo de implementación](PROMPT_IMPLEMENTACION_T02.md).

## Cierre real T02 — 05/10/2026

### Base, revisión y conservación

Base efectiva comprobada: rama `feat/b09-bots`, HEAD `4917d96bb36c1c805d9023d7c79dc4b98956e1d6`, compatible con B01–B09 y el ajuste visual. Se conservó esa rama; no se partió de main `8d305e0`, no se restauró ni descartó trabajo. Los únicos cambios locales iniciales eran el enlace de T02 en proceso y la especificación/prompt nuevos: conservados por separado en `4a6e235`. Captura previa de decisiones: `c9b75af`. Código, pruebas y documentación vigente revisados: **`c782ccb196ca993b44130c4d658f525551ca7332`**. Este cierre posterior modifica solo documentación.

Se revisó el diff completo contra la base, no solo sus importaciones. En `botPlay.ts`, sustituir únicamente el literal de dificultad `'NORMAL'` por `'HARD'` en la fuente de la base produce la fuente actual: comparación normalizada a LF **idéntica**. No cambia el algoritmo, sus entradas, adquisición, umbrales, desempates de distancia ni selección HIGH/LOW. `Game` y `GameCoordinator` no cambian; tampoco composición, puertos, repositorio, sesiones o temporizadores. `GameScreen`/`ResultsScreen` ya presentaban Fácil/Difícil y se revisaron sin modificarlos.

La aprobación expresa de T02 resuelve la nomenclatura general antigua; no surgió otra contradicción ni se cambió una regla. Se preservaron `normalizeName`, `completedNormally`, rondas/procesos normales y cierres históricos B09/ajuste visual. No se editaron fuentes generales TFM ni JSON de APP/ASSETS. No se añadieron dependencias, niveles o algoritmos.

Comprobación final de conservación: diff de genérica y ambos cierres históricos contra `4917d96` vacío; las cuatro fuentes generales TFM conservan sus huellas de la captura de revisión. APP y ASSETS coinciden en `baraja.json` (`991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed`) y `cartas.json` (`868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c`), formato 1/contenido 2/disponible aprobados.

### Equivalencia capturada antes de editar

Se importó y ejecutó la política **de la base intacta** con Node 24, comprobando primero su igualdad con `git show 4917d96:server/domain/botPlay.ts`. Captura: **05/10/2026 17:30:11.353 UTC / 19:30:11.353 Europe/Madrid**, antes de cambiar producción. [Fixture congelada](../../tests/fixtures/bot-policy-4917d96.json), versionada en un commit separado, contiene decisiones reales `{cardId, direction}`; no contiene una segunda implementación de la política.

| Evidencia | SHA-256 |
| --- | --- |
| Fuente de política de la base, normalizada a LF | `e1e21ad5e84012cfa22171043d35506b3d8fd39b0d32021358cbf487cf8ad2dc` |
| Fixture de resultados congelados | `24855818d166edd5e590900f2b79189e5e0844812ae9b21c4ae6b7e74d557552` |

**324/324 decisiones iguales**: 27 manos ordenadas de 1–3 cartas × dos atributos × EASY/NORMAL de la base × apertura/HIGH/LOW. La prueba nueva [botPolicyAlignment.test.ts](../../server/domain/botPolicyAlignment.test.ts) comprueba huella, base, tamaño y cada resultado esperado congelado con EASY/HARD actuales. Los vectores incluyen extremos 1/58, 29/30, inversiones de adquisición y los ejemplos E3: [2,57]→57/HIGH, [2,56]→2/LOW, [29,30]→30/HIGH; no abridor máximo HIGH/mínimo LOW. EASY también se compara; los valores de presentación no deciden. Esta comparación es determinista, no evidencia de entropía real ni de equilibrio.

### Comandos nuevos, entorno y resultados

Windows 10.0.26300 x64, PowerShell, Node **24.13.0**, npm **11.6.2**, aplicación **0.1.0**, Vitest **5.0.2**, Playwright **1.63.0**, Chrome **154.0.8037.93**. Fecha 05/10/2026; horas siguientes Europe/Madrid (UTC+2). Se usaron pruebas focalizadas durante edición y **una ejecución final de cada puerta completa**, sin reducir las garantías anteriores.

| Comando realmente ejecutado | Resultado nuevo |
| --- | --- |
| `npx vitest run server/domain/botPolicyAlignment.test.ts server/domain/botPlay.test.ts server/domain/botGame.test.ts server/application/bots.test.ts server/infrastructure/botInput.test.ts` | 19:33:46; **47/47**, 5 archivos, 935 ms. |
| `npx vitest run server/botSocket.test.ts server/application/botExecution.test.ts` | 19:35:23; **20/20**, 2 archivos, 2,67 s. HTTP/Socket.IO reales con reloj sustituido. |
| `npm run typecheck` | Correcto durante edición. |
| `npm run check` | 19:38:23–19:38:56; **exit 0**, 33,42 s. Typecheck/lint/preparación/build correctos; **408/408**, 38 archivos (Vitest 16,37 s); **64 módulos**, sin imports prohibidos ni ciclos. |
| `npm run test:browser -- --workers=2` | 19:39:37–19:47:47; **exit 0**, 490,19 s incluidos build y ejecución; **86/86 Chrome**, dos trabajadores, sin fallos/reintentos. |

Logs locales ignorados: `t02-focalizadas.log`, `t02-integracion.log`, `t02-final-check.log`/`t02-final-check-tiempo.log`, `t02-final-browser.log`/`t02-final-browser-tiempo.log`. Pruebas/fixture y resumen versionados permiten repetir la evidencia; los logs/capturas/dist/catálogo generados siguen ignorados. No se registró ningún fallo de estas ejecuciones. Los ajustes durante edición incluyeron separar dificultad inválida de roster sin HUMAN en `botGame.test.ts`: ahora NORMAL/otros inválidos se prueban con roster mixto válido, y solo BOT se rechaza usando dificultades válidas. No se borró ese escenario.

### Evidencia por criterio y ejemplos

| Criterio / ejemplo | Evidencia ejecutada y resultado |
| --- | --- |
| T02-1 / E1 | Dominio, Room, contrato seguro, decodificador y selector solo EASY/HARD. AddBot devuelve HARD. Browser P1 a 360/390/1280 comprueba `value="HARD"`/Difícil, cambio EASY/Fácil, invitado, dos pestañas del anfitrión y F5. HTTP/ack/eventos/resultados inspeccionan botDifficulty EASY/HARD, null en HUMAN y destinatario HUMAN propio. Correcto. |
| T02-2 / E3 | 324 decisiones congeladas iguales y fuente pura idéntica salvo identificador; se mantienen pruebas de política y trazas legales completas mixtas de 2–5, incluidas semillas 2/3/56/98. Correcto. |
| T02-3 / E2 | Pruebas de dominio, aplicación y decodificador admiten EASY/HARD y rechazan NORMAL/desconocidos/minúsculas/tipos incorrectos. Matriz estricta de cuatro operaciones con campos requeridos/extra intacta. Nuevo caso Socket.IO real devuelve exactamente `{ok:false,error:{code,message}}`, `INVALID_INPUT`, sin cambios de nivel/roster/plaza/revisión/caducidad; comprueba permiso de invitado y replay de Add con vista del host. Correcto. |
| T02-4 / E4 | Baterías completas conservan B01–B09/T01/activación. Gestión, capacidad/orden/reservas, carreras, incertidumbre/dedupe, privacidad por destinatario, revisión 0/5, fase final, desempate de manos 1/2/3, automático/inactividad, retención, recuperación y nueva sala. Partida normal genérica 2 con humano contra EASY/HARD, entropía/reloj normales: 15 gestos humanos, tres finales, 45 puntos, resultados/F5/otra sala. Correcto. |
| T02-5 | README, organización y proceso actuales alineados; históricos intactos. Traslado a Arquitectura identificado arriba y debajo; sin editar TFM. Correcto. |
| T02-6 | Check 408/408 y navegador completo 86/86 sobre revisión final compilada; 64 módulos y revisión semántica. Las reglas permanecen en dominio, gestión/vistas en aplicación, formato en infraestructura y presentación/transporte seguro en cliente; no IO en políticas, estructuras nuevas ni alias de producción. Correcto. |

### Compilación servida y distinción de montajes

Se detuvo la instancia anterior y arrancó **`npm run start`** sobre `c782ccb`, en `http://127.0.0.1:3000`. Captura HTTP real a las 17:40:27.970 UTC: `/api/decks` ofrece solo genérica formato 1/contenido 2, imageUrl null. El recurso servido `/assets/index-BbSMImRA.js` coincide byte a byte con `dist`; SHA-256 `f48c63ccff004930bd09f4c8e1ff5e667121147daf2ad7296d78dba15055d584`. La partida normal compilada usa esta instancia, paquetes APP y adaptadores normales; los paquetes/permutaciones de prueba separados no se publican. El ensayo autónomo compilado mantiene el guard de independencia de ASSETS.

Regresión B08 **ejecutada de nuevo**, con SystemClock/TimerScheduler/CryptoCardPermutation y genérica 2: turno `1f953a76-0778-4c1b-b602-e5ca40895d9e:r1:p1`, inicio **17:45:51.290 UTC**, límite **17:46:06.290**, cierre de transporte activo **17:45:51.383**, avance observado por otra sesión **17:46:06.788** (497,64 ms tras límite), contador propio **1** e identidad recuperada igual. Es vencimiento real de 15 s desconectado. Regresión B03: reserva real **30.004,60 ms**, detección de pérdida **3,61 ms**, total desde pérdida **30.008,21 ms**. Las caducidades de media hora, fases/empates reproducibles y otras carreras usan reloj/permutaciones controlados; no se atribuyen esos plazos a tiempo real.

Chrome automatizado con sesiones independientes/varias pestañas y viewports emulados 360/390/1280; teclado, foco, Detalles, avisos, scroll y privacidad comprobados. Se revisaron visualmente las capturas actuales de espera 360 y resultados normales 1280 (Fácil/Difícil). No es un recorrido humano ni un móvil físico. Los recorridos manuales del README quedan disponibles para el autor, sin nueva ejecución humana atribuida a T02.

### Archivos, contrato y coordinación

**Producción (cinco archivos):** `server/domain/botPlay.ts`, `server/application/room.ts`, `shared/contracts/room.ts`, `server/infrastructure/botInput.ts`, `src/WaitingPlayers.tsx`. **Pruebas/soporte (trece):** seis pruebas servidor/domain/application/infrastructure existentes más `botPolicyAlignment.test.ts`, `tests/browser/bots.spec.ts`, cuatro helpers de soporte y la captura JSON. **Documentación (cinco):** README, organización, esta especificación, proceso y prompt conservado. Total **23 archivos** contra la base; sin refactorización general. La lista exacta se obtiene con `git diff --name-only 4917d96 c782ccb` más el cierre documental.

Operaciones, propiedades y acks B09 se conservan; solo cambia el enum activo/default de dificultad y el texto de validación. Sin migración/alias: cliente y servidor deben usar esta compilación. Reiniciar pierde memoria; un cliente anterior que envíe NORMAL recibe INVALID_INPUT y debe recargar. Las sesiones nuevas recuperan HARD/EASY sin reiniciar el servidor en F5/reconexión/pestañas.

**Conclusión para coordinación/Arquitectura:** queda completada la alineación Fácil/EASY y Difícil/HARD, con la misma política anterior NORMAL y predeterminado HARD. La pendiente del ajuste visual queda resuelta por T02; no se implementa un nivel Normal intermedio ni Muy difícil. Arquitectura trasladará a dominio §§19.4–19.7, aplicación AddBot/SetBotDifficulty/valores públicos y validación de infraestructura la decisión expresa ya descrita, conservando historial y sin interpretar HARD como aprobación del algoritmo avanzado antiguo. Esas fuentes generales permanecen sin editar en este encargo.

**Límites:** C09–C10 continúan parciales; sin pruebas nuevas de equilibrio/comprensión con usuarios, dispositivos físicos, media hora real, despliegue o publicación. Commits únicamente locales; sin push/PR ni otro bloque. **T02 verificado localmente** con los seis criterios y E1–E4 acreditados por las ejecuciones anteriores, no por resultados históricos B09.
