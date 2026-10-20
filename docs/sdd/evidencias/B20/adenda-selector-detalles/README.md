# Adenda B20 — Selector vertical y acciones de Detalles

**20/10/2026. Corrección implementada y comprobada técnicamente en Windows.** No abre otro bloque ni cierra los pendientes generales de B20 (Arquitectura, revisión humana/física, Linux/CI y operación pública). Recogida pública OFF, servidores del autor conservados, sin publicación, despliegue o fuentes TFM editadas.

## Fuente y alcance

Base efectiva `main/40f3f48553a3353433942124b625354c35ed2972`. Preparación SDD separada `b69d71b`; presentación y pruebas `8bed83a`; correcciones exclusivas del arnés `b391546b19e6f5ae4b134055f52523b87be67f6e`. Cinco documentos previos modificados conservados: B19, B20/§16, proceso y dos documentos operativos B19. Solo se registra el cierre propio, sin apropiarse de su preparación/limpieza.

Archivos de producto: **`src/appearance.css` y `src/GameCard.tsx`**, únicamente. Pruebas: **`tests/browser/appearance.spec.ts` y `tests/browser/cardFace.spec.ts`**. Sin cambios en preferencia/persistencia, START/END, consentimiento, contratos, SQLite, reglas, fuentes, paquetes o dimensiones/composición de cartas/mesa. Sin ramas/checkouts/reinstalación.

- Selector: `align-self:stretch` y `select{width:100%}` solo cuando el grupo tiene Cancelar y ya es vertical por `.game-compact` o perfil≤760 existente. Cancelar conserva su tamaño natural; sin Cancelar y en horizontal no se aplica. No se cambia grosor, offset o clipping del foco.
- Detalles: contenedor local flex con wrapping/gap12px, Información primero y Cerrar con margen automático izquierdo. `padding-top:20px` conserva el espaciado antes dado por `.card-details-dialog>button`, sin colapsar el margen16px de la nota. Los botones locales dejan de añadir margin-top propio. La regla global y `DeckInformation`/`Consultation` se conservan; foco inicial, refs/handlers y condiciones de autorización intactos. Si falta Información, Cerrar sigue siendo el último botón y queda a la derecha; rama revisada en código, sin borrar contenido para simularla.

Node **24.19.0** (`C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`), ICU78.3/Unicode17, Windows/x64; npm11.6.2, Chrome155.0.8059.80, zoom100%, DPR1. Fuentes computadas registradas antes/después, sin nuevas fuentes o reducciones. Instancias/puertos propios con HTTP/Socket.IO reales; reloj/entropía controlados de los arneses existentes, no dispositivos físicos o ensayo humano.

[Compilación actual:73 huellas](build-final.json): CSS `index-vH3HYJDV.css`, JS `index-CqTh2426.js`. **70 archivos dist-server idénticos** a los del cierre B20, contrastados por bytes/SHA-256. [124 archivos de barajas intactos](barajas-conservadas.json), contra el manifiesto aprobado B20. Estas comparaciones son nuevas; no sustituyen ni reescriben sus resultados históricos.

## Pruebas realmente ejecutadas

| Comando / fase | Resultado nuevo |
|---|---|
| Build base; `KARTA3_B20_ADENDA_BASELINE=1`, selección `Adenda B20 selector|B17 D:` | [4/4 en18,2s](logs/base.txt), antes de cambiar producto. Miden el defecto y conservan interacción, no acreditan los estilos futuros. |
| Build con las dos correcciones; misma selección | [4/4 en17,6s](logs/final-1.txt). Comparación con base, sin modificar Cancelar/fuentes/contenido. |
| `npm run check`, ejecución inicial con concurrencia predeterminada | [670/672](logs/check-final.txt); dos timeouts de5000ms en pruebas estadísticas existentes. Ninguna aserción funcional falló en esos casos; no se atribuye una causa forense. |
| `npm test -- server/composition/usageMaintenance.test.ts server/usageActivation.test.ts` | [11/11 en21,15s](logs/check-timeouts-focal.txt), archivos/plazos/aserciones sin modificar. Diagnóstico focal, no repetición rutinaria de analítica. |
| `VITEST_MAX_WORKERS=2` y `npm run check` | [672/672 en63 archivos;74,00s de Vitest](logs/check-bounded.txt), typecheck/lint/build correctos y105 módulos sin imports prohibidos/ciclos. Opción soportada por el Vitest instalado; solo limita archivos simultáneos, no tiempos ni concurrencias internas de los casos. Sin cambios de configuración/dependencias. |
| Navegador final, siete casos seleccionados, un trabajador/cero reintentos | [6/7 inicial](logs/checked.txt): el sondeo nuevo de isTrusted leía la carta después de salir de la mano. Geometría/acciones ya correctas. |
| Único caso `B17 D:` con sondeo conservado en la región de mano estable | [1/1 en10,6s](logs/interaction-repaired.txt), clic normal isTrusted y una jugada aceptada, sin force-click o supresión de aserciones. Completa **7 casos únicos correctos** de la selección. |
| Dos casos P1 reutilizados tras aislar sus salidas | [2/2 en15,5s](logs/palette-isolated.txt), no casos nuevos. No cambio adicional de producto. |
| Caso horizontal con destino automático único de artefactos | [1/1 en3,6s](logs/default-output.txt), no caso nuevo. `npm run lint` final correcto. |

No se repite batería completa de navegador, analítica o corpus editorial. El check incluye su suite existente. Los cambios posteriores a `8bed83a` son exclusivos del arnés (sondeo/rutas), comprobados mediante lint y los casos afectados; no se recompila otro producto ni se atribuye un check histórico a esta adenda.

Comandos de cierre, con el Node anterior primero en PATH:

```powershell
$env:VITEST_MAX_WORKERS = '2'
npm run check
$env:KARTA3_B20_ADENDA_ATTEMPT = 'revision-propia-unica'
$env:KARTA3_B20_ADENDA_REFERENCE = '1'
node node_modules/@playwright/test/cli.js test appearance.spec.ts cardFace.spec.ts --grep 'Adenda B20 selector|B20 P1 paletas|B17 D:|B17 consulta abierta:' --workers=1 --retries=0 --trace on --output=playwright-report/b20-adenda/revision-propia-unica
```

Usar nombre de intento nuevo para conservar diagnósticos; sin nombre explícito los nuevos casos generan uno con PID/fecha. REFERENCE=1 activa la comparación física contra esta base Windows del mismo entorno/fuentes. Las comprobaciones normativas de alineación/separación/foco siempre se ejecutan; la referencia intrínseca local evita imponer a otro sistema el ancho de glifos Windows. No se ha ejecutado Linux.

## Medidas y criterios

Todas son cajas de `getBoundingClientRect()`, **sin sumar contorno de foco**. [Base](base/player-narrow.json), [final](final/player-narrow.json), [observador](final/observer-compact.json), [horizontal](final/player-horizontal.json) y [acciones](final/details-actions.json) conservan viewport/área útil, fuentes, bordes, imágenes, espacios y texto. Los PNG correspondientes muestran el mismo tema, carta, estado lógico y foco de teclado. No son capturas de maqueta ni aceptación humana.

| Criterio | Resultado técnico |
|---|---|
| C1 | HOST jugador390×900/útil358 y observador1100×900/útil1053, Claro/Oscuro: selector **139→163,046875px**, Cancelar **163,046875px** antes/después; diferencias finales de ancho/bordes izquierdo y derecho **0px** (máximo permitido1). Selector44px de alto/Cancelar51px conservados; bordes2px. |
| C2 | Invitado sin Cancelar: selector139px y mismas cajas/fuentes de la base. Horizontal1800×900/útil1368: selector139px, Cancelar163,046875px, mismos tamaños/posiciones. Sin etiquetas visibles nuevas; las cajas de cartas medidas se conservan exactamente. |
| C3 | Detalles ancho480px, interior434px, ambos temas: Información223,5px a la izquierda, Cerrar148,953125px al borde interior derecho; separación **0→61,546875px**. Desviación del borde derecho **61,546875→0px**. |
| C4 | Detalles estrecho337px, interior291px a viewport390: acciones en filas, Información primero/izquierda y Cerrar después/derecha; separación vertical **20→12px**, sin contacto o desbordamiento. Cerrar pasa de142,046875px de desviación derecha a **0px**. Tipografía, imagen, contenido y ancho del diálogo no cambian. |
| C5 | Foco exterior selector3px/offset3px, sin ancestros que lo recorten y margen suficiente al viewport. D clic/Enter/Space/Escape; foco inicial en Cerrar; Shift+Tab a Información/Tab a Cerrar; Información Enter y Space, consulta cerrada con Escape y clic; retorno a Información y después al invocador. Bordes y focos visibles en capturas. |
| C6 | Dirección HIGH aceptada y plazo/turno originales se conservan durante consultas/resizes/temas, sin cartas seleccionadas o jugadas accidentales. Clic final normal isTrusted→una petición/una carta pública. Caso separado de timeout/revisión con diálogo abierto conserva avance y recuperación de foco en región cuando desaparece invocador. Reloj controlado, no prueba de tiempo físico. |

Se preserva **36px** desde el final de la nota a las primeras acciones (16px de margen+20px de espaciado), fuentes/textos completos, imagen y límites de altura/scroll. La altura natural del diálogo puede cambiar al distribuir filas; no se aumenta su ancho. El foco cabe en sus márgenes interiores; no se usan overflow oculto, z-index o pointer-events como máscara.

## Incidencias y conservación

- Dos timeouts de check anotados arriba; focal correcto y check acotado correcto. No se cambian tests estadísticos, sus5000ms o el producto para conseguir verde. La causa original no queda demostrada por esas ejecuciones.
- El primer sondeo nuevo isTrusted falló porque la carta correctamente jugada salió del DOM. Se observa el mismo evento en un contenedor estable y se conserva la comprobación de envío/avance único.
- Los dos casos P1 heredados escribían en su ruta ignorada anterior. Sus salidas nuevas se conservaron en `playwright-report/b20-adenda/.../palette-first`; las doce copias ignoradas anteriores se restauraron desde la evidencia versionada B20 y se [contrastaron por SHA-256](p1-ignored-restored.json). Los originales versionados nunca se modificaron. La ruta de esta adenda queda aislada y comprobada; no se presentan esos artefactos reemplazados como evidencia histórica nueva.
- Baseline/new captures usan destinos distintos y escritura exclusiva para JSON; no se sobrescriben intentos/trazas. Las trazas completas permanecen ignoradas bajo `playwright-report/b20-adenda/20261020-selector-detalles/`. Se versionan solo capturas/medidas y transcripciones seleccionadas, sin DB/secretos o datos reales.

## Revisión del autor y límites

En una instancia propia de la compilación actual, probar anfitrión jugador y observador a390 y1100 con optimización vigente; comparar los dos bordes de selector/Cancelar sin incluir foco. Como invitado y a1800 horizontal, comprobar tamaño anterior. Abrir D/Detalles en Claro/Oscuro, ancho/estrecho: Información izquierda, Cerrar derecha o segunda fila. Probar Tab/Shift+Tab, Enter/Space/Escape y consulta anidada; cerrar vuelve al invocador, sin jugar o renovar plazo. No necesita aceptar analítica.

Revisión semántica: solo agrupación local/CSS condicionado; mismos callbacks/refs/autorización, orden DOM y componentes de información; ningún cambio de puertos/contratos/arquitectura o IO. C1–C6 comprobados técnicamente en Windows; no aprobación visual humana/física o Linux/CI. B20 global y C09–C10 conservan sus pendientes. Sin publicación/despliegue/activación o instrucciones a otros hilos.
