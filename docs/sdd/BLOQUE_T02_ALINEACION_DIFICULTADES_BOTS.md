# T02 — Alineación de dificultades de bots

**Estado:** acordado por el autor el 05/10/2026; no implementado ni verificado.
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

- [ ] **T02-1:** solo EASY/HARD activos en tipos, validadores, selector y vistas; HARD predeterminado. NORMAL queda únicamente en historial, transición o pruebas de rechazo.
- [ ] **T02-2:** equivalencia de decisiones de ambas políticas respecto a `4917d96`, con casos deterministas y resultados esperados independientes del código nuevo; no basta renombrar las aserciones.
- [ ] **T02-3:** aceptación EASY/HARD y rechazo NORMAL/desconocidos en dominio, aplicación y transporte; validación estricta, permisos y ausencia de efectos preservados.
- [ ] **T02-4:** gestión, niveles mezclados, recuperación/presentación y regresiones B01–B09 conservadas, incluidos privacidad, revisión, fase final, desempate e inactividad.
- [ ] **T02-5:** documentación actual de APP alineada; transición y cierres históricos preservados; traslado a Arquitectura identificado.
- [ ] **T02-6:** check y batería completa de navegador pasan sobre código final compilado; revisión semántica e imports/ciclos sin desviaciones.

## Verificación, autonomía y cierre

Capturar decisiones deterministas de la base antes del cambio y comparar los mismos vectores con EASY/HARD. Conservar las trazas con semilla, cartas/puntuación/etapas. Sin política antigua en producción ni alias NORMAL.

Cambiar negativos HARD por NORMAL/desconocidos y comprobar HARD válido. Separar dificultad inválida y roster sin humanos: `botGame.test.ts` combina ambas condiciones. Conservar escenarios/aserciones.

Durante edición, usar pruebas focalizadas. Al cerrar: `npm run check` y **`npm run test:browser -- --workers=2` completo**, compilación vigente. No repetir baterías por rutina; reparar fallos y acreditar las puertas finales. Los 402/402 y 86/86 B09 y los cuatro recorridos visuales son históricos, no evidencia T02 ni totales obligatorios.

El implementador elige nombres locales y montaje mínimo compatibles; no hay preguntas funcionales abiertas. Registrar revisión, comandos/fecha/entorno, resultados, reparaciones y comprobación arquitectónica. C09–C10 siguen parciales, sin acreditar equilibrio, comprensión o dispositivos físicos.

**Cambio de código, pruebas y verificación T02:** pendientes. Esta preparación solo lee fuentes/código y escribe documentación; no ejecuta pruebas del producto.

## Documentación vigente y traslado a Arquitectura

Actualizar README/organización vigentes para EASY/HARD y predeterminado HARD. Registrar transición en SDD/proceso; conservar cierres B09/ajuste visual.

Arquitectura recibirá esta decisión y el cierre nuevo para actualizar después:

- **Dominio:** modelo, §§19.4–19.6, ejemplos/casos → EASY/HARD; §19.6 Difícil **con el mismo algoritmo**. §19.7 deja de reservar ese nombre. Normal intermedio/Muy difícil futuros, sin algoritmos aprobados; preservar historial.
- **Aplicación:** alcance, tabla, AddBot/SetBotDifficulty, predeterminado Difícil/HARD y valores públicos; actualizar exclusión antigua y estado B09 con su evidencia.
- **Infraestructura:** validación EASY/HARD y rechazo NORMAL; confirmar bots entregados/valor inicial. Actualizar pendientes obsoletos sin acreditar publicación/despliegue.

Coordinación registrará NORMAL → HARD y el traslado pendiente. El algoritmo avanzado sugerido sigue sin desarrollo aprobado.

**Prompt:** [encargo de implementación](PROMPT_IMPLEMENTACION_T02.md).
