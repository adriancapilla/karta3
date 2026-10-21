# B22 — Incorporación manual de Modelos de IA — Edición 2026

**Actualización de Implementación22/10/2026:** incorporada y comprobada técnicamente en Windows; [cierre §7](#7-cierre-técnico-de-implementación--22102026) y [evidencia nueva](evidencias/B22/README.md). La preparación siguiente conserva su estado histórico. Linux/CI/imagen y revisión humana no se acreditan con este cierre local.

**22/10/2026 · Acordado; incorporación y pruebas pendientes.** B22 libre en el proceso leído. Reutilizar [B16 §§2–7](BLOQUE_16_INCORPORACION_CRIATURAS_MAGICAS.md#2-paquete-y-trazabilidad-cerrados): copia aprobada verificable, consumidor V2, catálogo y recorridos existentes. [Prompt de Implementación](PROMPT_IMPLEMENTACION_BLOQUE_22.md).

## 1. Base, fuentes y límites

Carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`; rama `main`; HEAD leído `aa336d3add598e4c59789ff053292295410da8dc`, con reparación B11 registrada en sus antecedentes. Cambios previos: proceso SDD, `src/style.css`, `tests/browser/format2Presentation.spec.ts`, adenda/prompt de paneles compactos y su evidencia no registrada. Conservarlos y cualquier trabajo posterior; no cambiar ramas/checkouts ni restaurar archivos. El cierre local de paneles informa check614 y navegador9/9: es evidencia ajena anterior, no prueba B22 o CI final.

Referencias: [AGENTS](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), [contrato V2](../contratos/CONTRATO_BARAJAS_V2.md), [presentación B15](BLOQUE_15_FORMATO_2_Y_PRESENTACION.md), [paneles compactos vigentes](ADENDA_B15_ANCHO_PANELES_COMPACTOS.md), [B21](BLOQUE_21_SUSTITUCION_ANALITICA_AGREGADA.md). Conservar B17/títulos/columnas, B20 y T04. No importador, cambios de contrato/reglas, edición editorial, mejoras de presentación o analítica nueva. Actualización de Vite/dependencias fuera; no editar ASSETS, Diseño o fuentes TFM.

## 2. Fuente final y destino

Entrega: `E:\KARTA3\KARTA3_IA\ASSETS\Entregas\2026-10-21-modelos-ia-2026-formato-2`.

- **Origen único:** `paquetes\modelos-ia-2026` de esa entrega; destino `E:\KARTA3\KARTA3_IA\APP\karta3\barajas\modelos-ia-2026`.
- Id `modelos-ia-2026`; formato2/contenido2 en ambos JSON; available=true. **61 archivos:** dos JSON, 58 ilustraciones y portada,59 WebP. No incorporar candidata1, ZIP, CSV, galería o toda la raíz editorial a `barajas/`.
- [Aprobación final y activación](../../../../ASSETS/Entregas/2026-10-21-modelos-ia-2026-formato-2/APROBACION_FINAL_Y_ACTIVACION.md), [registro de activación](../../../../ASSETS/Entregas/2026-10-21-modelos-ia-2026-formato-2/REGISTRO_ACTIVACION_1_A_2.md), [manifiesto final](../../../../ASSETS/Entregas/2026-10-21-modelos-ia-2026-formato-2/MANIFIESTO_SHA256.json) y [entrega](../../../../ASSETS/Entregas/2026-10-21-modelos-ia-2026-formato-2/ENTREGA_IMPLEMENTACION.md) prevalecen sobre los pendientes históricos de preparación. **No quedan aprobación o activación editorial pendientes; no incrementes contenido a4.**
- JSON según manifiesto: `baraja.json` SHA-256 `2b05800cd6df64080366212f7fd7475ce66ca336116758b3ae7d071cb41e1ee2`; `cartas.json` `95871a98aefce784eff5b66dd07f5f6c3a8e3109531eb6227c4ee68b52926c30`. Estas referencias no acreditan la comparación completa todavía pendiente.
- Finalidad demostrativa de la mecánica, sin finalidad formativa o ranking científico. Mostrar instrucciones/notas y reservas literales. Lanzamiento, Inteligencia y Contexto son los atributos aprobados; no reinterpretar clasificación editorial, fechas, precisión, unidades o desempates de asignación. Comparación y bots siguen por playValue.

## 3. Incorporación y comportamiento

1. Registrar inventario/huellas de los **124 archivos** de las tres barajas instaladas. Contrastar conjuntos de rutas, tamaños y SHA-256 de los61 archivos nuevos con el manifiesto final. Sus `files[].path` son relativos a la raíz del paquete —p.ej.`baraja.json`—, a diferencia del prefijo de B16; respetar el mapeo real, sin alterar el certificado. Discrepancia→diagnóstico, sin reparar contenido.
2. Ejecutar el validador común V2 existente sobre el paquete final. Copiar bytes/rutas íntegros a APP y comprobar origen=APP, sin extras. No reserializar, redondear, recalcular rangos/indicadores, modificar desempates o recomprimir imágenes. Si ya existe un destino diferente, localizarlo antes de sobrescribir.
3. Conservar aprobación, manifiesto, registro, entrega y delta de activación como certificados en `docs/sdd/evidencias/B22/certificados/`, con procedencia e integridad de bytes. Reutilizar la protección Git de certificados de B16, limitada a los nuevos archivos si hace falta; no duplicar recursos en evidencias. Cuando se registren, comparar los61 **blobs Git** como bytes con origen/APP; no basta el working tree.
4. Ejecutar `npm run decks:prepare`, nunca editar catálogo a mano. Verificar carga de la nueva copia por build/instancia propia, sin reiniciar servidores del autor. Construcción y ejecución independientes de ASSETS/PRODUCTO; reutilizar la comprobación aislada de B16, sin mover árboles del autor. Catálogo esperado por orden aprobado0 e id:

| Id | Formato/contenido | Disponible |
|---|---|---|
| criaturas-magicas | 2/2 | true |
| generica | 2/4 | true |
| modelos-ia-2026 | 2/2 | true |
| sistema-solar | 2/4 | true |

Tabla de aceptación, no catálogo manual de producto. Nueva sala **sin baraja seleccionada**. HOST selecciona explícitamente id/contenido2; servidor valida y resuelve versión exacta, invitados consultan aceptados. Cambiar/quitar barajas conserva configuración compartida y apariencia personal según sus contratos; F5 recupera selección/partida sin duplicaciones.

Portada y59 recursos por las rutas controladas existentes, p.ej.`/media/decks/modelos-ia-2026/v2/imagenes/portada.webp`. Los ocho JSON de las cuatro barajas siguen privados; no ampliar rutas o catálogo con paquetes completos. Mantener privacidad de manos y vistas por destinatario.

## 4. Responsabilidades y expectativas afectadas

| Área | Cambio permitido / garantía |
|---|---|
| Contenido APP y evidencia | Copia exacta61 archivos y certificados; tres barajas anteriores124 intactos. Al final185 archivos de paquetes, sin contar certificados. |
| Infraestructura/composición y aplicación | Lector, validación, recursos, selección y juego existentes; sin nuevos adaptadores, puertos, DTO o reglas. |
| Cliente | Presentación, consultas y permisos vigentes; sin CSS/fuentes/títulos nuevos para hacer encajar el paquete. |
| Tests y verificadores | Adaptar supuestos legítimos de instalación normal de tres a cuatro; conservar fixtures deliberadas de catálogo vacío, borrador o subconjuntos. Revisar `approvedInstalledDecks` en `tests/support/approvedSolar.ts`, pruebas de catálogo/arranque/bots y `tools/ci-image-runtime.mjs`; no sustituciones globales de números. Reutilizar referencias de prueba congeladas y trazables al manifiesto; no duplicar constantes o introducir excepciones temáticas. |
| Analítica | Dimensión existente CONFIGURATION/package=`modelos-ia-2026:2:2`, sin nuevos eventos/campos/informes o cambio de consentimiento/exclusión. Comprobar con datos fabricados SYNTHETIC; no activar recogida real o tocar históricos. |

El verificador de imagen debe esperar cuatro identidades/versiones, ajustar índices de portadas desplazados y comprobar huellas/recursos nuevos con referencias aprobadas independientes del resultado leído. Mantener hashes anteriores y controles de Linux, Node/SQLite, usuario/permisos, sharp, raíz de solo lectura, privacidad y exclusión de árboles. No empaquetar ASSETS/certificados editoriales para satisfacer un test o obtener el «esperado» de los mismos bytes comprobados. Adaptar provisión de expectativas existente, sin un importador/catálogo paralelo.

## 5. Aceptación y plan proporcionado

| Criterio pendiente | Evidencia exigida a Implementación |
|---|---|
| B22-01 · Integridad |61 rutas/tamaños/SHA origen=APP=Git y124 anteriores intactos; versiones exactas y certificados. Si Git aún no está registrado, no declarar completada esa parte. |
| B22-02 · Catálogo/carga | Validador V2 real y catálogo generado de cuatro; sala sin selección. Build/arranque propios sin ASSETS/PRODUCTO y sin depender del servidor antiguo. |
| B22-03 · Selección/recuperación | Dos sesiones independientes: selección2, ficha/portada/instrucciones sincronizadas, rechazo de configuración del invitado, cambios entre barajas y F5 conservando configuración/identidad. |
| B22-04 · Recursos/privacidad |59 imágenes cargadas/servidas y huellas correctas; JSON inaccesibles sin respuesta HTML sustitutiva, versiones/rutas controladas y manos ajenas protegidas. |
| B22-05 · Presentación dirigida | Normal/compacta y ambos modos, contenido completo, indicadora/mano/Mesa/revisión/Detalles/Información; consulta/foco/Jugar/carruseles conservados. Medir anchos útiles y preservar cota de paneles; no rehacer su matriz completa. |
| B22-06 · Partida normal | Una partida completa de APP con adaptadores normales, baraja nueva y humano contra bots existentes, acciones a tiempo: recuperación, revisión, conservación de cartas/puntos, resultado correcto y otra sala. Sin reloj/permutación sustituidos en este recorrido. |
| B22-07 · Analítica/regresiones | Paquete nuevo admitido por dimensión existente en ensayo aislado SYNTHETIC, sin lecturas/emisiones nuevas. Regresiones afectadas de catálogo, privacidad, selección y presentación; reparación B11/B20/B21 intactas. |
| B22-08 · Cierre | `npm run check` final y navegador pertinente compilado, resultados reales/archivos propios/estado Git y límites. Linux/CI/imagen final solo acreditados por publicación conjunta posterior. |

**Textos dirigidos, no revisión exhaustiva:** `claude-sonnet-55-max` —«Claude Sonnet 5.5 (max)»— y `llama-31-405b` —«Llama 3.1 405B Instruct»— para títulos largos; Lanzamiento activo y «23/07/2024»; `gpt-j-6b` con «06/2021» sin inventar día; Contexto «131.072 tk» y `gemini-31-pro` «1,049M tk», sin interpretar separadores/conversiones; nota extensa de `claude-sonnet-4` y las instrucciones/advertencias de demostración. Las etiquetas literales siempre provienen del paquete.

Reutilizar escenas legales de B16/B15 para forzar solo en pruebas dirigidas estos casos en mano/indicadora/Mesa, ambas modalidades, ancho normal e intermedio/estrecho representativos. Registrar escena/semilla/reloj controlados como tales, capturas comparables y medidas de lectura/solapamiento/acciones; no llamarlos partida normal. El ajuste tipográfico normal B17 existente puede actuar como ya está aprobado: no cambiar títulos, mínimos o fuentes para pasar. Ante incompatibilidad real, presentar diagnóstico al autor antes de editar contenido o diseño.

Gestor ya informó validación V2 local y galería de componentes aislados; sus resultados no acreditan mesa integrada, recorridos normales, dispositivos físicos o Linux. No repetir todas las cartas/tamaños, corpus Unicode o batería completa Chrome en cada fase. Tras incorporación/ajuste focal, ejecutar check una vez en fuente final y recorridos pertinentes sobre su build. Publicación acreditará CI/imagen Linux del conjunto, sin atribuirle resultados Windows.

## 6. Entrega y cierre documental

Implementación mantendrá README —cuatro barajas/versiones y recorrido manual—, este bloque y evidencia B22: inventarios, certificados, comandos/resultados/fallos, fuente/build, capturas/medidas y distinción dirigido/normal. Devolver conclusiones para Coordinación y alineación descriptiva del catálogo, sin editar TFM o históricos. C09–C10 mantienen sus límites actuales; no convertir esta incorporación en validación científica, de equilibrio o una nueva tarea educativa.

No hay decisiones funcionales/editoriales abiertas. Esta preparación solo ha leído fuentes/metadatos y redactado documentos; no ha comparado el paquete completo, copiado a APP, ejecutado validador/build/pruebas o cambiado código/barajas/dependencias. Todos los criterios B22 pendientes. Sin publicación, despliegue, activación estadística, servidores o mensajes a otros hilos. Tras entregar, SDD se detiene.

## 7. Cierre técnico de implementación — 22/10/2026

Base efectiva `main/aa336d3add598e4c59789ff053292295410da8dc`, conservando B11/B20/B21 y el ajuste de paneles sin registrar. No cambio de rama/checkout. Copia/certificados en commit local `a4f6cd0b7f456720d9be328a8e2ce812251c90fe`; referencias/pruebas/README/verificador `abb861911edd47c317b93fe7bc74e6e02c1042ab`; selector de consulta del ensayo `fc99a2a267aa7a480e61891720c69561f83d1274`. El cierre documental se registra aparte. Los documentos y archivos previos de paneles/proceso permanecen sin mezclar en estos commits, contrastados por SHA-256.

**Árbol realmente verificado:** esos commits B22 **más los cambios locales de paneles B15 conservados**, incluidos CSS y escenas pendientes. El build y las nuevas aserciones de cota usan ese árbol de trabajo; no se acredita un checkout limpio del HEAD aislado. La fuente conjunta posterior deberá registrar también esa entrega antes de ejecutar CI/publicación. No se incorporó a escondidas al commit B22 ni se autoriza publicar solo sus commits como si contuvieran todo el árbol probado.

### Incorporación y alcance real

- Manifiesto final SHA-256 `928c2cc6765910c6712c9e15b9c4d860b0639ccca0cb2cf333eceffc5a7af39c`;61 rutas/tamaños/huellas coinciden **origen=APP=blobs Git**. Los124 anteriores permanecen **inicio=APP=Git**:185 archivos de paquetes, más catálogo generado/ignorado. [Inventario inicial](evidencias/B22/INICIAL.json), [copia y blobs](evidencias/B22/COPIA.json). Ambos JSON mantienen sus huellas de §2 y2/2/true; no ASSETS modificado, activación repetida o edición de datos/imágenes.
- Seis certificados originales conservados byte a byte y protegidos en `.gitattributes`; aprobación, activación, entrega, delta y manifiestos exactos. Los cinco incluidos en el manifiesto final de entrega también contrastados con él; dicho manifiesto excluye su propio archivo.
- Validador V2 fijado sobre origen final: válido/disponible, salida0; APP idéntica y validada de nuevo por prepare/build/arranque. Catálogo generado de cuatro en orden de §3, sin selección inicial. El build aislado y los main propios bloquean accesos a ASSETS/PRODUCTO mediante el guard existente, sin mover árboles del autor.
- Cambios de ejecución exclusivamente en contenido. Consumidor/contratos/reglas/bots/temas/analítica/GameCard sin cambios. Referencias de catálogo compartidas; fixture congelada de resumen/61 huellas trazable al manifiesto. CI aprovisiona esa misma referencia al verificador por entorno de su proceso de ensayo, sin empaquetar certificados/tests en runtime ni calcular el esperado desde APP/HTTP. Conserva hashes anteriores, URL Solar v4, Linux/x64/Node/no root/sharp/read-only/privacidad/exclusiones. Solo sintaxis Node/Bash comprobada; no ejecución Linux/OCI.

### Comprobaciones nuevas

Node24.19.0 en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, ICU78.3/Unicode17.0, Windows x64 y Chrome155; npm/npx CLI existentes con PATH fijado para hijos. Sin reinstalar o actualizar Vite/dependencias.

| Puerta | Resultado real |
|---|---|
| `decks:validate -- --package <origen final>` |Válida/true, salida0;61 archivos contrastados antes de copiar. |
| `decks:prepare` y build focal |Cuatro válidas/disponibles, catálogo generado; sin edición manual. |
| Focal nueva inicial: catálogo + compacta390 Dato |2/2,20s. Solo comprobación de montaje, no cierre completo. |
| `npm run check`, fuenteabb8619, `VITEST_MAX_WORKERS=2` |**614/614**,58 archivos,103 módulos; tipos/lint/build/imports/ciclos correctos;51,60s Vitest. |
| Navegador final seleccionado, compilación de ese check |Primer grupo **13/15**,1,4min; fallan solo dos selectores nuevos de indicadora normal estrecha. Corregidos únicamente en el ensayo; esos dos **2/2**,11,3s, un trabajador/cero reintentos. **15 casos únicos correctos**, no una ejecución15/15 ni toda Chrome. |

La selección exacta está en [evidencia](evidencias/B22/README.md). Incluye diez casos nuevos —catálogo, ocho combinaciones dirigidas, partida normal— y cinco regresiones de catálogo/bots/Solar/Criaturas. La reparación cambia únicamente dos líneas del ensayo: detecta el layout realmente aplicado y usa el nombre accesible de la indicadora visible. En normal estrecha el selector inicial apuntaba a la variante PC oculta y Enter llegaba al anterior D enfocado. No fue incompatibilidad de contenido/diseño ni se alteró el producto para superarla. Se conservaron nombres esperados, aserciones, plazos y casos; lint focal correcto tras el ajuste. El check no se repite por ese único cambio de selector; bundle/servidor siguen siendo la compilación comprobada.

### Resultados por criterio y límites

| Criterio | Evidencia nueva |
|---|---|
|B22-01|61/61 origen/APP/Git,124/124 anteriores y6 certificados; completado localmente. |
|B22-02|Validación V2, prepare/cuatro, build aislado guardado y main normal sin ASSETS/PRODUCTO; sala sin selección. |
|B22-03|Dos sesiones y pestaña HOST, cambio por las cuatro/quitar/F5, opciones e identidad conservadas; invitadoFORBIDDEN y contenido4 rechazado. Portada640×480 e instrucciones exactas. |
|B22-04|59 respuestas WebP con SHA esperado independiente, ocho JSON privados por rutas de paquete/medios sin HTML; versiones/rutas inválidas404. HTTP, ack room:resume y eventos room:state inspeccionados con forma exacta y manos propias, sin manos rivales/paquetes/mazo oculto. |
|B22-05|Normal1920, compacta1280/390 y normal adaptada390, ambos modos:16 escenas registradas de mano/indicadora/Mesa/revisión. Textos de §5 en trazas/Detalles, notas e instrucciones literales, datos a14px, títulos con ajuste vigente. Consultas/foco y envío único conservados; no nuevas geometrías o fuentes. |
|B22-06|Main real aislado, SystemClock/TimerScheduler/CryptoCardPermutation: humano+EASY/HARD,15 jugadas humanas a tiempo, tres rondas finales, DECK_COMPLETED y45 puntos oficiales. F5 durante partida/resultados en dos pestañas, retorno y otra sala sin selección. Sin saltar motor/asignar puntos o sustituir tiempo/entropía. |
|B22-07|En esa instancia SYNTHETIC, CONFIGURATION/package=`modelos-ia-2026:2:2` observado durable una vez y finalDECK_COMPLETED una vez; sin nuevo evento/campo/informe, permiso de fotos o recogida real. Regresiones afectadas correctas; reparación B11 y paneles previos intactos. |
|B22-08|Check/15 casos únicos, README/manual/evidencia/estado Git; cierre técnico local. Linux/CI/imagen conjunta y revisión humana pendientes. |

Escenas dirigidas: conexiones reales, reloj controlado y permutación legal prefijada, sin modificar cartas. Lanzamiento activo; Llama23/07/2024 y131.072tk, GPT-J06/2021, Gemini1,049Mtk, Claude Sonnet5.5(max), Llama Instruct y nota extensa de Sonnet4 conservados literalmente. No son la partida normal. Se revisaron capturas PC/compacta y revisión por el agente; no aprobación visual humana o dispositivos físicos.

Medidas representativas: normal1368 útiles, cartas230×321; compacta1233 útiles, cartas220×213,66 y paneles450; compacta358 útiles, cartas220×221,66 y paneles358; normal adaptada358 útiles, carta medida220×322. Son medidas de las escenas, no alturas universales nuevas. Fuente de celdas14px; títulos PC15,8–16px (Sonnet5.5max15,8), compactos18px y normal estrecha15,6–18px según ajuste aprobado. Sin overflow de celdas/documento observado; scroll vertical/lateral legítimo permanece. [Medidas completas](evidencias/B22/MEDIDAS.json), [capturas y revisión](evidencias/B22/README.md).

Para Coordinación/alineación descriptiva: cuarta baraja demostrativa, cuatro versiones independientes2/4/2/4, todas formato2/disponibles, sin default. No finalidad formativa/ranking científico, validación de equilibrio o C09–C10 completos. El autor dispone del [manual README](../../README.md#prueba-manual-b22-modelos-de-ia-y-dos-sesiones); queda pendiente como prueba humana. La publicación conjunta acreditará fuente final/Linux/imagen, sin atribuirle estos resultados Windows. Sin fuentes TFM/Diseño/ASSETS editadas, Vite actualizado, servidores del autor utilizados/detenidos, mensajes a otros hilos, push/PR/GHCR/despliegue o activación estadística. Al entregar, Implementación se detiene.
