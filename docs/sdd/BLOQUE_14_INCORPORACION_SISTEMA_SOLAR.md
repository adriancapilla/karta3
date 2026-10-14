# B14 — Incorporación de Sistema Solar

**Fecha/acuerdo:** 12/10/2026, autor. **Estado:** incorporado y verificado técnicamente en local; revisión científica nueva y aprobación visual humana no realizadas. El alcance se registró antes de incorporar en `ba0c88f`. Este encargo permite excepcionalmente a SDD incorporar contenido y comprobarlo.

**Numeración:** B14 libre en main al preparar el cambio. **Base histórica:** main integrado `88be67f3affe5c6f49ca90b207f59d5c2ef5aa45`; entrega preparada en `feat/b14-sistema-solar`, checkout `E:\KARTA3\KARTA3_IA\APP\karta3-b14-sistema-solar`. El estado inicial de B13 `47087c7` y sus pendientes se conserva como antecedente. **Carpeta única acordada para continuar:** `E:\KARTA3\KARTA3_IA\APP\karta3`, misma rama B14, desde `378b409` más el commit documental de regularización (§7). No usar ni detener servidores del autor.

**Referencias:** [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [contrato de barajas §§2–7](../contratos/CONTRATO_BARAJAS_V1.md), [B04](BLOQUE_04_CARGA_BARAJAS.md), [B05](BLOQUE_05_CONFIGURACION_SALA.md), [activación genérica 2](ACTIVACION_GENERICA_V2.md), [B13](BLOQUE_13_CANCELACION_PARTIDA.md), [T04](BLOQUE_T04_AVISO_RESULTADO_ANTERIOR.md); presentación actual `src/GameCard.tsx`. Las evidencias anteriores son históricas, no pruebas nuevas B14.

## 1. Alcance y decisiones

Incorporar el paquete existente `ASSETS/Barajas/sistema-solar`, sin recrear cartas ni recursos. Validar primero su formato 1/contenido 1/no disponible con la herramienta común. Si es válido, cambiar únicamente `publication.available` a true y `contentVersion` a 2 en ambos JSON maestros; conservar `schemaVersion: 1`, todos los demás campos y los 59 recursos gráficos (portada y 58 cartas). No recalcular playValue, corregir ciencia ni inventar decimales.

Copiar los dos JSON y recursos aprobados a `barajas/sistema-solar` del checkout APP. ASSETS sigue siendo maestro; igualdad de lista y SHA-256 de los 61 archivos, con recursos idénticos antes/después y genérica 2 intacta. El destino lógico tras integrar la rama es `E:\KARTA3\KARTA3_IA\APP\karta3\barajas\sistema-solar`; no incorporar datos por separado en el checkout original antiguo.

Generar catálogo por `decks:prepare`/build, nunca editarlo a mano. Ambas barajas estarán disponibles; una sala nueva sigue sin selección. Ejecutar desde APP sin acceso editorial a ASSETS. Se admiten ajustes pequeños de presentación para datos largos, sin ocultarlos o alterar valores; una necesidad mayor se documenta para Implementación antes de ampliar alcance.

**Fuera:** algoritmos/reglas, rediseño móvil, nueva creación editorial, revisión científica, modificación de fuentes TFM/plan VPS, push/PR/GHCR/despliegue y mensajes a otros hilos. El VPS conserva su versión actual.

## 2. Responsabilidades y contratos conservados

| Responsabilidad | Capa y comprobación |
| --- | --- |
| Invariantes/comparación | Validador puro y Game existentes: comparar J/playValue, no texto Dato/displayValue. Caso Encke/Borrelly: igual diámetro mostrado, distintos J. Sin reglas por temática. |
| Lectura, recursos, catálogo y copia | Infraestructura/herramientas B04 existentes: formato, versiones, rutas/decodificación y huellas. Catálogo generado e interno; no importar ASSETS en build/runtime. |
| Selección/autorización y partida | Aplicación B05–B13 existente: versión exacta disponible, configuración sincronizada, vista por destinatario, recuperación y retención/limpieza T04. |
| Portada, carta y Detalles | Cliente/contratos seguros: textos y unidades literales, imágenes reales, Dato separado de J; cualquier ajuste solo de legibilidad. Sin imports de server ni cálculo oficial en navegador. |
| Composición | Montaje actual, sin puertos o servicios nuevos. Check de dependencias y revisión semántica de cualquier ajuste. |

## 3. Criterios previstos

- [x] **B14-01:** validación común satisfactoria antes y después de activar; 58 cartas, esquema 1/contenido 2/true coherentes. Errores localizados y no ocultados.
- [x] **B14-02:** exclusivamente tres cambios editoriales autorizados; 61 archivos maestros/copia iguales por SHA-256; 59 imágenes y genérica sin alteración.
- [x] **B14-03:** catálogo normal generado con genérica 2 y Sistema Solar 2; sala sin selección; seleccionar/cambiar/quitar y recargar mantiene estado aceptado en dos sesiones. Invitado no configura.
- [x] **B14-04:** portada y cartas cargadas, nombres/atributos/unidades/Detalles legibles; datos largos completos y sin truncación silenciosa, en PC y acceso móvil existente.
- [x] **B14-05:** Encke/Borrelly muestran el mismo diámetro heredado y distintos J; ALTO/BAJO compara por J, sin transformar datos científicos.
- [x] **B14-06:** partida con Sistema Solar, resultado y cancelación B13; recarga y nueva partida con otra baraja sin contaminación de ficha, cartas o avisos (T04).
- [x] **B14-07:** JSON completos inaccesibles por HTTP; catálogo seguro, manos rivales/mazo oculto ausentes en HTTP/ack/eventos; APP autónoma del maestro.
- [x] **B14-08:** `npm run check` y navegador pertinente sobre compilación vigente, con expectativas normales actualizadas sin debilitar vacío/no disponible/privacidad; registros reales separados de aprobación humana/científica.

## 4. Plan de comprobación

Reutilizar validación, catálogo, selección y ejecuciones existentes; añadir pruebas de esta segunda baraja con datos reales, no sustituirla por una temática artificial. Mantener fixtures de catálogo vacío/borradores y regresiones B13/T04. Dos sesiones/perfiles y recarga, imágenes con naturalWidth positivo, privacidad de sobres y valores largos medidos.

Ejecutar Node 24.19 del runtime disponible, sin cambiar instalación global. Instancias propias en puertos libres y cerradas al terminar; no reutilizar servidor del autor. Pruebas normales distinguidas de recorridos con tiempo/entropía controlados. No repetir batería de navegador completa por rutina; registrar selección exacta/fallos y reparaciones. Check incluye pruebas unitarias, tipos, lint, build y arquitectura.

## 5. Registro de ejecución y cierre

La preparación inicial dejó la ejecución pendiente, conservada en `ba0c88f`. La ejecución real se registra a continuación; no sustituye evidencias históricas de otros bloques. C09–C10 reciben evidencia técnica de una segunda baraja con recursos, sin convertirla en revisión científica, equilibrio o aprobación visual humana.

**Ajuste de presentación dentro del alcance, 12/10:** las primeras capturas mostraron los 12 dígitos de Hyakutake partidos entre líneas (columna Dato de 65 px PC/56 px móvil). Se mantiene literal el texto; las tablas con enteros mostrados de nueve o más dígitos adaptan sus columnas y evitan partir ese número, también en Detalles. Sin conversión numérica, separadores nuevos, reducción de fuente, cambio del ancho de cartas o distribución móvil. Se añade comprobación geométrica de número completo dentro de su celda.

### 5.1 Versión incorporada y trazabilidad

Paquete **sistema-solar, formato 1/contenido 2, disponible**, 58 cartas, 59 WebP; 61 archivos/1.741.972 bytes. Solo se modificaron dos contentVersion y publication.available en los maestros: comparación exacta de textos contra las copias previas, sin reserializar los demás datos. Recursos idénticos antes/después. ASSETS no tiene repositorio Git propio ni ancestro; la copia aprobada y sus huellas quedan versionadas en APP, sin crear un repositorio editorial nuevo.

| JSON (maestro = copia APP) | SHA-256 contenido 2 |
| --- | --- |
| baraja.json | `e703ced69efd0932a0257d59fcb6ed55f80bae7c4f2a7c199edaed58396c16c6` |
| cartas.json | `c4d42019d1a0ee911b061b27b93e76ed2cd151872aad98167f1efc9961f95388` |

[Manifiesto completo](evidencias/B14/huellas.json): lista, tamaños, huellas anteriores y actuales de todos los archivos. Recomparación final **61/61** contra ASSETS, **59/59** recursos inalterados. Genérica, tanto maestro como APP, conserva SHA-256 `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` / `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c`. `catalogo.json` fue generado por las herramientas y permanece ignorado, no mantenido a mano.

Commits propios locales: `ba0c88f` alcance/proceso; `8e4e26a` copia aprobada y manifiesto; **`20dfb469748abff8ab0b4af55cf97f52e83d501b`** código/pruebas/README comprobados; cierre/evidencias en commit posterior. Archivos de producto modificados: únicamente `src/GameCard.tsx` y `src/style.css`, para legibilidad de números largos. No se modificaron lógica de servidor, contratos, reglas, plazos ni políticas de bots.

Pruebas adaptadas: startup independiente, expectativas normales en decks/proxy/bots; `approvedSolar.ts` fija un resumen esperado independiente del lector y `configurationBrowserServer.ts` puede copiar los paquetes reales en ensayos aislados. Nuevo `solar.spec.ts`: cinco recorridos. `tools/ci-image-runtime.mjs` ajusta la expectativa de catálogo/huellas para una futura imagen; **solo sintaxis comprobada, no se ejecutó Docker/Linux/GHCR**. README ofrece el recorrido manual B14.

### 5.2 Comprobaciones realmente ejecutadas

Entorno: Windows, PowerShell, **Node 24.19.0/npm 11.6.2**, Chrome **154.0.8037.98**, Playwright 1.63.0, KARTA3 0.1.0. Runtime seleccionado solo para los procesos de prueba: Node global 24.13.0 y servidores del autor no se cambiaron. `npm ci` instaló 328 paquetes del lockfile; no cambió dependencias.

| Puerta/recorrido | Resultado real |
| --- | --- |
| `decks:validate -- --package <ASSETS/sistema-solar>` antes de activar | Válida, available false. |
| `decks:validate -- --package barajas/sistema-solar` y `decks:prepare` después | Válida/true; catálogo generado con genérica 2 y Sistema Solar 2. |
| `npm run check`, final | **466/466 en 42 archivos**, tipos/lint/build correctos; **68 módulos** sin imports prohibidos/ciclos. Vitest 13,14 s. [Registro](evidencias/B14/check-final.txt). |
| Navegador pertinente inicial | **25/28**, 58,2 s, dos trabajadores: **23 regresiones completas satisfactorias** y dos B14 de espera; tres B14 nuevos fallan únicamente al comparar serverNow. [Registro y errores](evidencias/B14/browser-inicial.txt). |
| Reparación focal de esos tres casos | **3/3**, 12,2 s, tras comparar todo el resultado y fechas estables, normalizando solo serverNow y comprobando su avance. [Registro](evidencias/B14/browser-focal.txt). |
| Navegador B14 sobre la presentación definitiva | **5/5**, 15,2 s, un trabajador efectivo (`--workers=2` como máximo). [Registro](evidencias/B14/browser-final.txt). No repetir los otros 23 por rutina: servidor y lógica T04 no cambiaron; presentación final comprobada en estos cinco casos. |

Selección inicial exacta:

```text
npm run test:browser -- solar.spec.ts decks.spec.ts activation.spec.ts cancelGame.spec.ts resultNotice.spec.ts bots.spec.ts proxy.spec.ts --grep "B14|B04 catálogo|AGV2|B13|INC-01|B09 P2 normal compilado|T05 origen único" --workers=2
```

Selección definitiva: `npm run test:browser -- solar.spec.ts --workers=2`. Cada ejecución reconstruyó APP. La instancia normal fue una copia temporal de la compilación/paquetes de APP, con guard que rechaza y registra lecturas de ASSETS, puerto libre asignado por el sistema y Node real. **Cero accesos a ASSETS**. El check también construyó y ejecutó ambas barajas en una instalación aislada con ese guard. Todas las instancias propias se detuvieron y sus carpetas temporales se retiraron.

Incidencias: el sandbox bloqueó inicialmente npm ci (EPERM) y la lectura del maestro (IO_ERROR); repetir las mismas operaciones autorizadas fuera del sandbox resolvió el acceso, sin ocultar errores de contenido. Las comparaciones iniciales de retención confundían hora actual con publicación/caducidad: se reparó solo la prueba, conservando igualdad de los demás campos. La revisión de capturas llevó al ajuste de Dato; una primera distribución estrechó demasiado J, corregido con nowrap y padding horizontal de 2 px. Se añadió prueba de que los tres J siguen en una línea. Los checks se repitieron al cambiar presentación, todos 466/466; la pasada B14 intermedia fue 5/5 (15,1 s), pero la evidencia definitiva es la posterior. No se afirmó que 28/28 pasaran en una única ejecución.

### 5.3 Resultados, medidas y límites

- **B14-01/02:** validador común, tres cambios exactos y manifiesto satisfacen versión/recursos/copia; sin edición científica ni imágenes nuevas.
- **B14-03:** dos sesiones independientes a 390/1280×844, selección Solar → genérica → Solar, invitados sin selector, recarga/identidad/versiones conservadas. Catálogo vacío/borrador/publicada siguen cubiertos por fixtures separados, sin desactivar copias normales.
- **B14-04/05:** las 59 imágenes se sirvieron con MIME WebP y bytes SHA-256 del manifiesto; portada/mano/Detalles cargan con naturalWidth positivo. Atributos, unidades, característica y notas heredadas visibles. Encke/Borrelly conservan **Dato 4.8 km y J 7/8**; la resolución real HIGH/LOW invierte el vencedor según J, sin inventar decimales.
- **B14-06:** ejecución normal (reloj, entropía y adaptadores normales) con un humano y Fácil/Difícil completa 15 rondas/45 puntos, tres rondas finales, resultado y recarga/otra sala. Ensayos controlados cancelan Solar durante revisión, conservan puntos 0/2 sin ganador y crean genérica en las mismas sesiones, sin heredar ficha/cartas/avisos; resumen A conserva fechas. Los nueve B13 y cuatro T04 previos pasaron en la selección inicial.
- **B14-07:** catálogo con ocho campos por resumen; cuatro JSON privados responden 404 sin HTML. HTTP, ack y room:state respetan forma y manos por destinatario, comprobando manos rivales ausentes antes de convertirse en jugadas públicas. Se observaron por destinatario ack 2/1 y eventos 5/3. Build/runtime independientes de ASSETS demostrados con guard activo.
- **B14-08:** puertas y revisión semántica realizadas: regex/span/CSS afectan únicamente presentación; J/puntuación/selección/permisos y autoridad siguen en sus capas existentes. No hay nueva dependencia ni contrato. Todo código comprobado corresponde a `20dfb46`; cierre posterior solo documental.

Medidas de Hyakutake: PC **1920×844**, carta **230×359**, tabla 204 px; móvil emulado **390×844**, carta **220×401**, tabla 194 px. El dato de 12 dígitos completo cabe en una sola línea dentro de su celda; cada J también ocupa una línea y no hay truncación/overflow horizontal de la tabla. La altura mínima anterior sigue siendo mínima: contenido extenso aumenta altura; no prometer cartas de altura fija ni eliminar el desplazamiento vertical. Sin reducir fuente ni rediseñar móvil.

Capturas finales inspeccionadas por SDD, **no aprobación visual del autor**: [PC](evidencias/B14/B14-cartas-1920.png), [móvil](evidencias/B14/B14-cartas-390.png), [espera/portada](evidencias/B14/B14-espera-390.png), [cancelación](evidencias/B14/B14-cancelacion-1920.png), [resultado normal](evidencias/B14/B14-resultado-normal.png); [medidas PC](evidencias/B14/B14-medidas-1920.json)/[móvil](evidencias/B14/B14-medidas-390.json). Son capturas completas de página, no alturas útiles del navegador.

El reloj/entropía sustituidos se usaron solo en Encke/Borrelly y las regresiones que lo declaran. Los 30 minutos se comprobaron de manera controlada en B13/T04, **no en tiempo real**. El smoke de origen único se ejecutó por HTTP loopback, no HTTPS/Caddy. No hay nueva evidencia Linux, VPS o dispositivos físicos. Revisión científica, equilibrio, comprensión y aprobación visual humana siguen pendientes; C09–C10 mantienen esos límites.

### 5.4 Entrega al autor

Estado histórico al cerrar la entrega: la rama propia contiene la copia APP lista para integrar, con README, pruebas y evidencia; el checkout original seguía en `feat/b13-cancelacion-partida`/`47087c7`, main en `88be67f`, y sus dos modificaciones previas conservaban las huellas iniciales. ASSETS ya conserva los JSON maestros activados; no tiene commit editorial propio. La regularización posterior se delimita en §7; no copiar por separado los archivos a la rama antigua. La publicación/integración en GitHub requiere su encargo correspondiente.

Para Coordinación/Arquitectura: registrar Sistema Solar formato 1/contenido 2 disponible e incorporada/comprobada en local, genérica intacta, sin reglas nuevas ni cambio de contrato. La legibilidad se resuelve localmente en GameCard, sin requerir otro bloque de implementación. Distinguir esta evidencia de revisión científica/aprobación visual y del estado del VPS. No se editaron fuentes generales TFM ni plan VPS, ni se enviaron mensajes. Sin push, PR, GHCR o despliegue.

## 6. Revisión complementaria de genérica — pendiente de replanificación

El autor revisó las imágenes y pidió aclarar el cambio de código y sus efectos sobre genérica. Se confirma: GameCard/CSS quedaron modificados, sin revertir, pero displayValue/playValue/unidades no se transformaron. Cualquier transformación editorial corresponde al Gestor de Barajas.

La evidencia de §5 comprueba volver de Solar a genérica y recuperar sus cartas; **no contiene una comparación visual específica antes/después de genérica tras el último ajuste compartido**. Se conserva el cierre técnico previo con ese límite explícito. El 13/10/2026 el autor separa la regularización Git de esta revisión: queda pendiente de replanificar junto al nuevo modo de presentación, sin ejecutarla ahora. Los criterios siguientes conservan la preparación anterior; no autorizan implementar el selector ni ajustes de producto.

- [ ] **B14-R01:** genérica comparada antes/después con estados equivalentes, PC 1920×1080/móvil 390×844; indicadora, mano, mesa y Detalles conservan presentación y acceso.
- [ ] **B14-R02:** selección parcial/envío, foco/Detalles, números J y scroll conservados; cualquier diferencia involuntaria corregida mínimamente y justificada.
- [ ] **B14-R03:** Sistema Solar mantiene datos largos completos, J legible y Encke/Borrelly; huellas de ambos paquetes intactas.
- [ ] **B14-R04:** check y navegador focal registrados como evidencia nueva, con capturas/medidas y límites; aprobación visual humana diferenciada.

**Estado de esta continuación:** preparación conservada, ejecución aplazada hasta un nuevo encargo. No se implementaron cambios ni ejecutaron pruebas de producto en esta regularización. [Preparación para la futura revisión](PROMPT_IMPLEMENTACION_BLOQUE_14.md).

## 7. Regularización documental y línea activa — 13/10/2026

El autor autoriza continuar únicamente en `E:\KARTA3\KARTA3_IA\APP\karta3`, rama existente `feat/b14-sistema-solar`, desde `378b4099c3a58d2e0991949b3835e159b0f538c2` más este commit exclusivamente documental. B14 desciende directamente de main `88be67f`, que ya contiene B13: no volver a integrarlo ni revertir completo `20dfb46`.

Procedimiento autorizado: guardar únicamente los pendientes originales de operación y `tableLayout.spec.ts` en la reserva Git `regularizacion-b13-b14-20261013-pendientes-b13`, comprobar sus blobs y registrar su SHA estable en el cierre; no aplicarla a B14 ni eliminarla, pues su reparación ya está integrada. Liberar B14 del checkout secundario mediante Git y activar la misma rama en la carpeta única. La carpeta secundaria se conserva con HEAD separado como referencia de recuperación, junto con las demás ramas/checkouts históricos; no es una segunda línea de desarrollo. El cierre de la operación identificará los HEAD y la reserva reales.

Recuperación por commits: `8e4e26a` contiene Sistema Solar aprobado y el manifiesto; `20dfb46` registra presentación y adaptaciones de pruebas/catálogo; `378b409` conserva el cierre técnico. Una futura sustitución de presentación debe delimitar los cambios de `src/GameCard.tsx`/`src/style.css`, preservando barajas y adaptaciones necesarias, sin revertir el commit mixto completo. Main `88be67f` es referencia histórica para consultar mediante Git desde la misma carpeta, sin crear otro checkout.

Esta operación no cambia código, configuración, dependencias ni paquetes; no ejecuta instalación, build, pruebas o CI, no modifica ASSETS/TFM y no publica ni despliega. El selector y el nuevo modo de presentación requieren especificación e implementación posteriores. Las evidencias de §5 siguen siendo históricas y la revisión de §6 sigue pendiente.
