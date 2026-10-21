# Adenda B21 — Retirada de la consulta manual de preferencias

**21/10/2026 · Acordada por el autor; implementación y comprobaciones pendientes.** Cambio de presentación dentro de [B21](BLOQUE_21_SUSTITUCION_ANALITICA_AGREGADA.md), sin nuevo bloque. [Encargo para Implementación](PROMPT_IMPLEMENTACION_ADENDA_B21.md).

## Decisión y base

El botón «Consultar preferencias estadísticas» parece abrir otra página aunque solo relee las preferencias. Se retira sin sustituto: ningún botón, enlace o mensaje nuevo.

Lectura actual: carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, rama `main`, HEAD `ee4f752a81c0175f27950bac9ca9348207c23b31`. Cinco documentos modificados previamente: proceso SDD, B19, B20 y dos guías operativas B19. Conservarlos y cualquier trabajo posterior. Referencias: [AGENTS](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) y cierre histórico [B21 §13](BLOQUE_21_SUSTITUCION_ANALITICA_AGREGADA.md#13-cierre-técnico-de-implementación--20102026). Sus resultados no acreditan esta adenda.

## Cambio exacto y responsabilidades

- En `src/StatisticsControl.tsx`, eliminar únicamente el botón final y retirar `refreshStatistics` de su import desde `./statistics`, al quedar sin uso en ese componente. Mantener los demás imports y JSX.
- Conservar `src/statistics.ts`: `refreshStatistics`, consulta inicial, coordinación entre pestañas, reconexión, conflictos, consultas internas y recuperación al recargar. No eliminar o renombrar sus consumidores internos.
- Mantener exclusión/inclusión, Permitir/No permitir/Retirar, enlace de privacidad, estados, errores y todos los textos restantes. No corregir otros textos dentro de esta retirada.
- Solo se afecta la presentación React; contratos, aplicación, dominio, adaptadores, SQLite y composición no requieren cambios. Sin estilos nuevos, refactorización, métricas o ajustes de juego.

La búsqueda literal actual localiza la etiqueta en el componente, sin un selector de prueba o referencia operativa vigente que obligue a conservarla. Repetir la búsqueda al implementar por posibles cambios posteriores; adaptar solo dependencias reales del botón. Las referencias históricas identificadas permanecen intactas, incluidas capturas previas.

## Aceptación y comprobaciones previstas

| Criterio | Comprobación focal |
|---|---|
| AC1 · Ausencia | Cero botones con nombre accesible exacto «Consultar preferencias estadísticas», también tras recarga. No reemplazo, destino de navegación o mensaje nuevo. |
| AC2 · Controles conservados | Consulta inicial sin pulsación manual; excluir/incluir y permitir/retirar siguen funcionando, con sus textos/estados y acceso por teclado conservados. No nueva parada de tabulación en lugar del botón. |
| AC3 · Sincronización | Exclusión desde otra pestaña se refleja automáticamente; recargar recupera el estado vigente sin la acción retirada. `refreshStatistics` y consumidores internos permanecen. |
| AC4 · Alcance | Diferencia de producto limitada al JSX del botón y al miembro del import. Pruebas/referencias solo afectadas por esta retirada; históricos y trabajo ajeno conservados. |

Reutilizar preferentemente el caso existente «B21 HOME mínimo sin identificadores, permiso separado, exclusión compartida y pestañas» de `tests/browser/statistics.spec.ts`: añadir ausencia del botón y comprobación breve Permitir→Retirar, manteniendo sus aserciones de recarga, exclusión y sincronización. No hace falta crear otra matriz o recorrer partidas completas. Mantener `src/statistics.test.ts` y `src/statisticsTransport.test.ts`; esta adenda no cambia sus contratos.

Implementación ejecutará una vez `npm run check` sobre la fuente final y el recorrido focal sobre esa compilación, por ejemplo `npx --no-install playwright test tests/browser/statistics.spec.ts --grep "B21 HOME mínimo" --workers=1`. No batería completa de navegador, validador de barajas o ensayos de persistencia por rutina. Registrar comando, fuente y resultado reales; no usar clic forzado o retirar aserciones anteriores para superar el caso.

## Cierre pendiente

Este documento solo registra lectura y especificación. No se ha modificado código ni ejecutado pruebas de producto. Implementación añadirá un cierre breve separado con cambios, comprobaciones y límites, conservando las evidencias anteriores de B21. Sin publicación, activación, borrado de datos, servidores, mensajes a otros hilos o edición TFM. No hay decisiones funcionales abiertas.

## Cierre técnico de la adenda — 21/10/2026

**Implementada y comprobada localmente en Windows.** La preparación anterior se conserva como antecedente. Base efectiva y HEAD final sin cambios: `main/ee4f752a81c0175f27950bac9ca9348207c23b31`, con cambios propios sin commit. Se preservaron byte a byte los cinco documentos previamente modificados y el prompt preparado; no ramas/checkouts, reinstalación o cambios de historia.

Cambios propios:

- `src/StatisticsControl.tsx`: únicamente retirada del botón final y del miembro `refreshStatistics` de su import. Sin sustituto ni cambios de otros textos, controles o estilos.
- `tests/browser/statistics.spec.ts`: ampliado solo «B21 HOME mínimo…», sin eliminar líneas/aserciones anteriores. Ausencia inicial/tras recarga/en ambas pestañas; enlace de privacidad y controles conservados; Permitir con Enter→Retirar con Espacio; confirmación en ambas pestañas, exclusión/inclusión sincronizadas y recuperación por la recarga existente.
- Esta sección de cierre. Sin otras referencias vigentes al botón en README/guías operativas, por lo que no se modificaron. Históricos y capturas versionadas intactos.

`src/statistics.ts` permanece idéntico (SHA-256 `ed19c85efd92b21131f23c793160ca315b8206ab2b2ef5bc994f42131ccd23da`), incluidos `refreshStatistics`, consulta inicial, reconexión y consumidores internos. Diferencia de producto revisada exactamente contra la retirada autorizada. Parche propio final de producto/prueba SHA-256 `b46b5939cbdf48e0bc023b2670fd21772b2fb05cf7bdcd39202caa6b72e162ef`.

### Comprobaciones realmente ejecutadas

Node24.19.0 fijado en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, ICU78.3/Unicode17.0, Windows x64/PowerShell y Chrome. npm/npx CLI existentes invocados con ese Node y PATH fijado para sus hijos; no instalaciones globales modificadas.

| Puerta | Resultado nuevo |
|---|---|
| `npm run check`, `VITEST_MAX_WORKERS=2` | **Correcto: 614/614 pruebas,58 archivos,103 módulos**, typecheck/lint/build/imports/ciclos correctos;52,31s Vitest. Una ejecución sobre el producto final. |
| `npx --no-install playwright test tests/browser/statistics.spec.ts --grep "B21 HOME mínimo" --workers=1` | **1/1 correcto,8,7s**, cero reintentos, sobre esa compilación; no batería completa. |
| Revisión AC1–AC4 | Botón ausente, controles y teclado conservados, recarga y sincronización automáticas verificadas. `refreshStatistics` intacto y todas las líneas originales de la prueba preservadas. `git diff --check` correcto. |

Primer intento de navegador: fallo al volver a incluir la actividad tras una recarga adicional introducida al ampliar la prueba (inclusión sin confirmar). Se acotó la ampliación a la recarga que ya contenía el caso; se conservaron todas sus aserciones anteriores y se añadió comprobación del permiso recuperado allí. Solo se repitió ese recorrido, con lint focal del archivo, sin cambiar límites, timeouts, producto, respuestas o usar clic forzado. El check ya correcto no se repitió: el único ajuste posterior fue de ese caso de navegador; bundle/servidor compilados permanecieron iguales.

Evidencia local nueva en `playwright-report/b21-adenda-consulta-20261021/`: `check.txt`, `browser-intento-1.txt`, `contexto-intento-1.md`, `browser-final.txt`, `fuente-cierre.json`, parche propio y referencia inicial. Bundle servido `dist/assets/index-B4qIVfuO.js`, SHA-256 `348668f179ce68f6e87c34565d6cebaf8fe94e83e1c7f8a9e170ba69a57b1b24`. El helper existente arrancó y cerró exclusivamente su servidor efímero en puerto propio, con HTTP/Socket.IO/SQLite reales y datos fabricados SYNTHETIC; reloj de aplicación controlado. No servidor o base del autor, recogida real, pruebas de tiempo real, Linux o revisión humana acreditados por este recorrido.

Estado Git al entregar: HEAD anterior conservado, dos archivos propios de código/prueba modificados y esta adenda inicialmente no registrada ampliada; prompt previo no registrado intacto y cinco documentos ajenos aún modificados sin incorporarlos. Sin commits nuevos, publicación, activación, borrado de datos existentes, intervención en servidores del autor, TFM o mensajes a otros hilos. La adenda no amplía el cierre global de B21 ni sus límites pendientes. Al entregar, Implementación se detiene.

## Consolidación de publicación — 21/10/2026

El encargo posterior del autor incorpora el cambio local y este cierre a la publicación conjunta B20/B21. La fuente publicada incluirá únicamente la retirada de JSX/import y las aserciones nuevas descritas arriba; no se elimina refreshStatistics ni sus consumidores. Las comprobaciones Linux y completas se registran en la PR y no se atribuyen a la selección Windows histórica.

## Continuación de verificación autorizada — 21/10/2026

La reinclusión falló en la global39575499811; las focales posteriores correctas no acreditan una reparación. El ensayo esperaba texto de exclusión en otra pestaña y podía invertir la acción sin esperar a que la operación de origen completase HTTP200 y terminase su estado ocupado. Los controles, revisiones y admisión siguen siendo reales; no se cambia producto o contrato.

La continuación espera confirmación200 y fin de `aria-busy` de cada acción antes de la siguiente dependiente. Para comprobar la insuficiencia del montaje anterior, retiene únicamente la entrega de la respuesta de exclusión (después de ejecutar la petición real): comprueba corte/texto remoto y pestaña de origen todavía ocupada; libera respuesta, confirma finalización y solo entonces reincluye expresamente desde la otra pestaña. Conserva exclusión/inclusión, permiso separado, Enter/Espacio, consultas automáticas, recarga, ausencia del botón, HOME mínimo, coordinación y ciclo cortado irrevocablemente. No reintento automático, respuesta simulada de éxito, aumento de admisión, plazos o esperas fijas. Un429/409 inesperado o una reinclusión incorrecta después de esas condiciones hace fallar la puerta y exige diagnóstico, no otra pulsación para ocultarlo.

Se conservan registros HTTP saneados también cuando el caso termina correctamente, sin cookies/tokens/ids funcionales. La traza antigua no existe: esta comprobación contrasta una condición de sincronización insuficiente, sin inventar el motivo exacto de aquel intento. Teclado y nueva interpretación B10/B11 se describen en la [precisión de la adenda B20](ADENDA_B20_SELECTOR_Y_ACCIONES_DETALLES.md#precisión-de-publicación-b10b11-y-sincronización--21102026). La imagen de la global fallida sigue sin aprobación para despliegue.

**Evidencia Linux nueva39586256550/433f981:** focal7/7 en45,463929s, worker1/retries0, sin omitidos/flaky. La petición real retenida demuestra exclusión visible en la pestaña remota y origen con controles deshabilitados/ocupado. Al liberar entrega,200/revisión104; la acción expresa posterior usa104 y recibe200/revisión105/DEFAULT_ALLOWED, visible en ambas pestañas. HOME conserva exactamente los dos DTO mínimos y no hay fotografías sin permiso; WAITING sigue cortado una única vez. No respuestas200 inventadas, relajación de admisión, reintentos o cambios de consumidor/servidor. El caso ahora comprueba acciones secuenciales confirmadas, en lugar de asumir finalización por el texto remoto. Registros y traza conservan las confirmaciones; la global de la fuente final sigue siendo otra puerta obligatoria.
