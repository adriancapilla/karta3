# B20 — Evidencia nueva de Implementación

**20/10/2026. Implementado y comprobado técnicamente en Windows; no verificado globalmente.** El autor confirma en esta conversación que la alineación de Arquitectura sigue pendiente y solicita entregar cierre técnico. Revisión visual humana/física, Linux/CI y activación/operación pública no se acreditan. Recogida pública OFF. C09–C10 parciales.

## Fuente, entorno y separación

- Carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, rama `main`, base efectiva `4e92efe7034cf6c10366daf90429d3f6ce02978c`. Sin nuevas ramas/checkouts, reinstalación o historia reescrita.
- Preparación B20 separada `5dac075`; preferencia/paletas `2ae4cae`; estadística/contratos/pruebas `ddd6ee431fe3f3dcbf57b49c6f4160400d1c19e6`; foco semántico `93e8b66`; última corrección exclusivamente de prueba `44e5546947c2e7eb1182240e36b9e250dd7460fb`. El commit documental de cierre es posterior, sin otro código de producto.
- Conservados sin apropiación: cambios previos de proceso, B19, ANALITICA_USO y PREPARACION_ANALITICA_REAL_B19. La entrada propia de cierre del proceso se registra por separado, sin incluir su preparación B19/B20 ajena.
- Runtime real: Node **24.19.0**, Windows/x64, ICU78.3/Unicode17.0, SQLite3.53.3; ejecutable `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm11.6.2 mediante el CLI ya instalado. Chrome **155.0.8059.80**, DPR1, zoom100%. No cambio de instalación global.
- [73 huellas de compilación](build-final.json): dist/dist-server actuales. CSS `index-CS-rEBLr.css`, JS `index-Xmi7Qjp_.js`. Las pruebas cargan estos artefactos con instancias/puertos/SQLite/claves temporales propios; no se detuvieron servidores del autor. La partida ordinaria usa el main compilado, instalación normal, entropía y adaptadores normales, con guardia de independencia de árboles externos del arnés vigente.
- [124 rutas/tamaños/SHA-256](barajas-intactas.json) iguales antes/después, sin modificar genérica/Solar V2/4, Criaturas V2/2, imágenes o disponibilidad. Catálogo generado, no versionado. No fuentes TFM/Diseño/ASSETS/PRODUCTO editadas ni publicación/activación.

## Puertas ejecutadas

PATH seleccionado al runtime anterior; comandos npm ejecutados con `node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js ...`, de modo que sus procesos hijos usan ese Node.

| Ejecución nueva | Resultado real / alcance |
|---|---|
| Base visual: `KARTA3_B20_BASELINE=1` y `playwright test appearance.spec.ts --grep 'paletas y geometría' --workers=1 --retries=0` antes de P1 | 2/2,24,9s. Capturas/medidas del producto base, no de la maqueta. |
| P1 unitarias / navegador focal | 10/10 de preferencia. Cierre focal3/3,15,7s tras corregir sondeo de tráfico/visibilidad de ayuda. No acredita P2. |
| P2 SQLite/ventanas + regresiones del almacén | 26/26 en4 archivos,1,90s. SQLite temporal real; reloj controlado. |
| P2 HTTP/Socket.IO + captura/transporte cliente | 23/24 inicial; una expectativa nueva incorrecta de asociación tras cancelar. Corregida, caso1/1. La liberación de B13 se conserva. |
| Reparaciones focales previas al cierre | [29/29 en5 archivos,1,72s](logs/p3-repair-focal.txt). Cancelación/transporte, ventanas/planificador, SQLite/migración, captura y credenciales sintéticas. |
| `npm run check` final de producto `93e8b66` | [672/672,63 archivos,32,81s de Vitest](logs/check-final-focus.txt); typecheck/lint/build correctos;82 módulos Vite y105 módulos de arquitectura sin imports prohibidos/ciclos. No se atribuyen resultados B19. |
| `npm run test:browser -- --workers=1 --retries=0 --trace on --output=playwright-report/b20/final-traces appearance.spec.ts appearanceUsage.spec.ts privacyNotice.spec.ts usageChoice.spec.ts usageActivation.spec.ts usage.spec.ts` | [22/22,2,7min](logs/browser-final.txt) en `ddd6ee4`. Después solo cambia el color de foco CSS de Jugar; no contratos/instrumentación/SQL/acciones. Incluye tres finales, dos sesiones/pestañas, ausencia de END desconectado, SYNTHETIC/HUMAN fabricados, partidas completas y parada/rearranque propio. |
| Tras foco CSS, mismo script npm con `appearance.spec.ts`, un trabajador/cero reintentos | [4/4,24,9s](logs/browser-final-keyboard.txt), build final identificado arriba. Incluye pares de contraste y colores reales de foco D/Jugar por teclado, frontera útil y secundarios. La modificación de prueba final solo usa Tab/Shift+Tab; `npm run lint` posterior correcto. |
| Regresiones compiladas focales, comando y selección siguientes | [21/21,1,9min](logs/browser-regressions.txt), misma compilación final/un trabajador/cero reintentos. No batería completa. |
| `node --check tools/ci-usage-human.mjs` | Correcto en Windows; **no** ejecución Linux, contenedor, volumen, CI o recepción de su verificador. |

**43 casos Chrome únicos** en la selección de cierre (22+21; los4 P1 se repiten justificadamente por el cambio de foco, no se suman como casos nuevos). Los18 estadísticos/recuperación de la primera selección no se repiten por un cambio exclusivo de foco; código estadístico/contratos/juego idéntico al probado. No se presenta toda la batería base o toda CI como ejecutada. Reportes/trazas de intentos quedan ignorados bajo `playwright-report/b20/`; este directorio conserva resultados textuales seleccionados y capturas/medidas necesarias, sin DB, claves o CSV con detalle.

Regresión final, tras compilar:

```powershell
$b20Selection = 'frontera medida|T/G/I fixture|T/G fuentes tardías|T/G/C sistema-solar DISPLAY_VALUE|T/G/C criaturas-magicas DISPLAY_VALUE|G columnas portada DISPLAY_VALUE|G columnas criaturas-magicas DISPLAY_VALUE|B17 D:|B17 compacta 390|fallo/pendiente de medio|botón/diálogo/resumen|B13/T04 A cancelada|ack/evento perdidos|anfitrión observador|B08 T1 1280|B08 T2 390|INC-01 expired A|INC-01 late A'
node node_modules/@playwright/test/cli.js test format2Presentation.spec.ts cardTitleFit.spec.ts cardColumns.spec.ts cardFace.spec.ts cancelGame.spec.ts timedGame.spec.ts resultNotice.spec.ts --workers=1 --retries=0 --trace on --output=playwright-report/b20/regression-traces --grep $b20Selection
```

Se usa CLI directa para no reinterpretar `|` por la envoltura cmd de npm en Windows. Conserva aserciones, contenido de fixtures, clic normal/isTrusted y avance único, sin force-click, eventos de jugada fabricados, menores plazos del producto o tolerancias ampliadas.

## Resultados por criterio

| Criterio | Evidencia nueva / resultado técnico |
|---|---|
| V01 | `appearance.test.ts`10 casos: cuatro valores, registro cerrado, explícito frente a DEFAULT, inválidos/borrado/bloqueos. Navegador comprueba menú con solo4 opciones reales, Predefinida y Claro elegido. Correcto. |
| V02 | Dos perfiles y pestañas, última escritura releída/F5, bloqueos en memoria y cero POST API/configuración por elegir. Revisión/settings/turno/plazo sin cambio. Correcto. |
| V03 | Capturas Inicio, espera HOST/invitado, mesa HOST jugador/observador e invitado y Resultados; label solo espera, nombre accesible siempre. `/privacidad` directo200/no-store sin sesión/cookie/API/UUID o DB nueva. Correcto técnico; revisión humana pendiente. |
| V04 | Cuatro paletas comparadas con base, caras claras/texto oscuro en Oscuro, pares y foco reales registrados; mismas cajas/fuentes de cartas. Correcto técnico en muestra representativa, no conformidad WCAG universal ni aprobación humana. |
| V05 | D/Escape/foco, Jugar habilitado, isTrusted/una jugada, título/columnas/Resistencia, arrastre, quinta, útil1367/1368 on/off, resize/fuentes/zoom CSS y callbacks de revisión/timeout. Correcto en casos seleccionados, sin dispositivos físicos/zoom nativo nuevos. |
| A01 | Partida ordinaria completa con dos HUMAN y main/entropía normales; finales por inactividad y cancelación con reloj controlado y conexiones reales. Observador/bots excluidos. START/END una vez; reconexión/consulta no reconstruyen END perdido. Correcto. |
| A02 | Aceptación B19 previa de todos los humanos; observador sin aceptar censura sin foto propia; aceptar tarde no resucita ciclo. Retirada/caducidad12h/OFF y fallo real del worker conservados en check. Fotografías SYNTHETIC y HUMAN fabricado separadas. Correcto. |
| A03 | HTTP403 ajeno,400 forma/conflicto,202 primera admisión,204 lógico/replay/ventana vencida,503 escritor simulado; varias pestañas, pérdida de ack, socket/ack en ambos órdenes, misma revisión, desconexión y A→B. Bordes9999/10000/10001ms sin callback y limpieza/generación con tiempo controlado. Correcto. |
| A04 | DB real: marginales START/END independientes, par DEFAULT→Claro explícito, distinto y retorno al inicial, solo END, ausencia/pending y ceros nulos. START30/09UTC/END01/10 pertenece a septiembre. CSV sin ids; ni historial de cambios ni preferencia demostrada. Correcto. |
| A05 | Migración2→3 conserva hechos/recibos y cifras/filas de ocho informes; históricos no instrumentados, sin backfill. Migración aislada del cambio de boot; reinicio/censura conservan su cobertura propia.90d/meses controlados, consolidación idempotente y copia cifrada/restauración agregada reales sin ids/detalle/recibos. Correcto local, Linux pendiente. |
| A06 | Presupuesto sustituido para saturación y liberación, límite real4096 en composición, primera cola admitida gana.503 no reserva; fallo real de worker del caso H05 deja juego/plazos operativos. Normalización estricta y comparación exacta de claves/cadenas excluidas en DB/HTTP/ack/eventos/CSV. Correcto en ensayos, no capacidad VPS acreditada. |
| I01 | Aviso nuevo/versión/texto, README, operación complementaria y mapa APP actualizados; B19 mantiene elección e históricos. **Alineación B20 pendiente confirmada por el autor.** |
| I02 | Check y selección anteriores correctos; revisión de imports/ciclos y semántica descrita abajo. Código técnicamente comprobado, sin Linux/CI completa, publicación o aprobación humana. |

## Comparación visual y medidas

Referencia cromática consultada, sin copiar estructura/fixtures/carga de JSON. [Base normal](p1/1800-BASE.png), [base compacta](p1/390-BASE.png), finales de cuatro temas y medidas JSON en [p1](p1). Contexto equivalente: Criaturas, misma permutación legal, mesa inicial, mismo viewport/zoom/DPR/fuentes. Comprobación exacta antes/después de cajas y familias/tamaños de la mano, título, imagen, tabla y Jugar; no igualdad píxel a píxel.

- 1800×1000: útil1368, normal, cartas230×321 y Jugar230×48, imagen y contenido sin reducción. Captura completa1203px antes/después; residual203px.
- 390×844: útil358, compacta, ancho220 de carta y Jugar, filas/tipos/minicarta sin cambio. Captura completa937→1024px, residual93→180px. **+87px** en grupo superior del HOST (Partida/Cancelar/selector apilados); no se oculta scroll residual ni se atribuye ahorro inexistente. No cambia la secuencia de paneles/carruseles.
- [Frontera](matrix/player-measures.json):1367 útil compacta y1368 normal; selector debajo de Cancelar en compacta y a su izquierda en normal. Intermedio1100×900 con contenedor útil limitado a992. HOST observador sin mano [medido por separado](matrix/observer-measures.json); el ancho1100 natural tiene scrollbar, no se presupone viewport−32.
- Familias declaradas Inter/system-ui/SegoeUI; [CDP de glifos efectivos](matrix/fuentes-efectivas.json) en prueba real: SegoeUI-Bold para título/Resistencia y SegoeUI para símbolo; carga de fuentes terminada antes de medir. Caso separado de fuentes DejaVu de ensayo y zoom CSS125/200→100 conserva sus asserts B17; no es zoom físico del navegador.
- Secundarios: [Inicio Crema](secondary/home-cream-1100.png), [espera HOST Crema](secondary/wait-host-cream-1100.png), [invitado Oscuro](secondary/wait-guest-dark-390.png), [resultado Alto contraste](secondary/results-390.png), [resultado ordinario](secondary/ordinary-results-1280.png). Diálogos D/Información/cancelación y foco comprobados por navegador; no se duplica toda la matriz de barajas/Unicode.

Pares de variables efectivas registrados en `*-measures.json`: texto principal/página y panel, secundario/panel, carta, fila activa, principal, control y D≥4,5; bordes imprescindibles y foco≥3. Mínimos de la selección: Claro foco/panel4,770; Oscuro borde-control/control4,160; Crema secundario/panel6,130; Alto contraste foco/panel8,530. [Foco D/Jugar realmente aplicado](p1/1800-focus.json) mantiene grosor3px/desplazamiento3px; no solo declaración de variable.

Claro cambia principal182b58/24418a→29428d, secundarios→566178 y fondos por función según referencia. Borde imprescindible A7B2C8→182B58; en Crema A18A6E→55391F; D claro mantiene texto/borde oscuros también en Oscuro. Foco D/selección sobre claro usa esos oscuros; Alto contraste conserva cian sobre panel oscuro y negro en D claro. Errores/éxito LIGHT/CREAM mantienen pares semánticos previos legibles; DARK/HIGH_CONTRAST usan nota/texto de su paleta. El botón de peligro conserva rojo/blanco previo y su significado. No filtros, nuevos tamaños de fuentes o imágenes.

## Aviso y privacidad

Versión2026-10-20.1 libre en la base y aplicada sin promover permiso de otra versión. [Texto visible UTF-8/LF](aviso/aviso-390.txt), idéntico en390 y1280, SHA-256 **31cde42ce2daba812babaf3a48480e1f2714000d2c42a8cdc2c9f347fbf22b06**. Capturas/medidas HTTP en `aviso/`. Evidencia .2 B19 intacta. No elección adicional; se conservan aceptar/rechazar/retirar y12h.

La petición lleva gameId/token únicamente para acreditar contexto en RAM; el DTO normalizado contiene exclusivamente roomRef/gameRef/participationRef/moment/theme/origin y envolvente B18. No se persisten cookies, ids funcionales, ventana, socket, nombres/manos o dispositivos. CSV solo categorías/cifras/cohortes/calidad. Ningún cambio de tema crea evento o identidad estadística estando OFF. Apariencia funciona sin permiso.

## Fallos encontrados y reparaciones

1. Sondeo inicial P1 contó POST internos Engine.IO como cambios de apariencia. Se acotó a API y room:configure real; producto sin petición estadística/configuración por elegir. Ayuda inicialmente visible y hover D Oscuro corregidos antes del cierre P1.
2. Dos pruebas nuevas suponían que current devolvía RESULTS tras cancelar. B13 libera asociación: se comprueba ack/URL/roster, sin cambiar esa regla.
3. Intermedio asumió útil1068 a viewport1100, recibió1053 por scrollbar. Se mide útil y se fija992 para ese ensayo;1367/1368 se comprueban exactamente. Sin cambio de composición.
4. Revisión detectó fotografías SYNTHETIC sin credencial funcional. Solo ese nuevo tipo usa same-origin; otras intenciones sintéticas siguen omit. Prueba compilada nueva verifica cuatro fotos y tráfico aislado.
5. Check inicial: tres parámetros nulos sin uso (lint), difusión por conexión aun sin ventana rompía el ensayo B13 de pérdida de emisión, callback de ensayo no marcado fired y comparación de migración que mezclaba corte abrupto/cambio de boot. Corregidos sin quitar aserciones: difusión por sesión cuando no hay metadata; por conexión si la hay; reloj de ensayo coherente; migración aislada de reinicio.29/29 focal y672/672 finales.
6. Foco de Jugar heredaba marrón anterior, alineado por función sin geometría. Nueva prueba inicialmente usó focus programático sin modalidad de teclado (:focus-visible no activo); se usa Tab/Shift+Tab real sin jugar, preservando color/tolerancia.4/4 correctos.
7. El primer comparador de huellas usó diccionarios OrderedHashtable como objetos de comparación. Repetido con PSCustomObject:124/124 tamaños/bytes/SHA idénticos; ningún archivo editorial discrepó o se tocó.

## Revisión semántica y límites

Preferencia solo cliente/contratos puros; Game/RoomSettings no conocen temas. Captura breve separada del transporte/estado; T04 filtra vistas antes de congelar y metadata no reaplica A. Aplicación decide elegibilidad/ventanas/unicidad/cohortes, mediante Clock/Scheduler/conexiones/sink; ningún SQL/IO/await se introduce en decisión síncrona de juego. Estado/dedupe confirmados antes de observar/publicar; fallo estadístico no cambia final, permiso jugable o timeout.

Infraestructura implementa sesiones/transporte individual, normalización validada antes del worker, SQLite/migración/lector/copia. Se reutiliza cola/mantenimiento, no otro sistema de almacenamiento o planificador paralelo; un timer acotado limpia ventanas por generación. Composición elige adaptadores. Dominio y paquetes intactos. No secretos/DB/CSV de personas en Git, APIs nuevas de administración, panel o endpoint de reloj.

Reloj controlado no acredita diez segundos, doce horas,90d o30min físicos. Hay conexiones/offline reales y un cierre/rearranque real de proceso propio; la partida ordinaria usa tiempo/entropía normales, pero sus acciones son automatizadas. No ensayo humano, móvil físico, nuevos ensayos de capacidad VPS, Linux/imagen/volumen o CI. El verificador Linux se ha adaptado y pasado sintaxis; debe ejecutarlo el hilo responsable posteriormente por encargo del autor, sin publicación autorizada aquí. [Traslado y alineación pendiente](TRASLADO_ARQUITECTURA.md); [instrucciones manuales/operación](../../../operacion/APARIENCIA_B20.md). **No se marca B20 verificado globalmente ni se activa recogida.**
