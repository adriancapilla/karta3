# KARTA3

KARTA3 es un proyecto de adaptación de un juego de cartas a una aplicación web multijugador, desarrollado como Trabajo Fin de Máster.

## MVP para el TFM — entrega del 22/10/2026

**Probar: [pruebas.karta3.com](https://pruebas.karta3.com).** B22 está desplegado: cuatro barajas, juego humano y bots, turnos/automático, revisión, resultados y cancelación. Para iniciar hacen falta 2–5 jugadores y **al menos un humano jugador**: el anfitrión observador con solo bots no puede iniciar.

La [guía de entrega y primera partida](docs/operacion/ENTREGA_MVP_TFM.md) explica instalación desde un clon con **Node 24.19.0**, presentación normal/compacta, modos 1–58/Dato y apariencia personal. Identifica la etiqueta recuperable **`tfm-mvp-2026-10-22`**, el producto `06e3f94` y su digest desplegado, sin congelar la URL ni futuros cambios de main.

B21 funciona en Pruebas en modo **aggregate**, con escritura real comprobada. AGG_DAILY_V1 contiene agregados diarios separados del juego. La exclusión general y el permiso de apariencia son independientes; la apariencia personal funciona sin permiso estadístico. **La aceptación general B19 ya no es el modelo vigente.** [Modelo y controles actuales](docs/operacion/ANALITICA_AGREGADA_B21.md). No hay botón de consulta manual de preferencias ni informes públicos.

La guía distingue las CI del producto (**620 pruebas, 104 módulos y 222/222 recorridos**), clon/Linux/185 huellas, comprobaciones posteriores del VPS y valoración humana. Conserva C09–C10 parciales y los demás límites; no acredita reversión/OFF o restauración integral de Hostinger. Los apartados de evolución siguientes conservan el alcance y las cifras de cada entrega histórica.

## Apariencia personal B20 y correcciones conservadas

El selector **Apariencia** ofrece Claro, Oscuro, Crema y Alto contraste. Sin elección válida muestra **Predefinida** y aplica Claro. Elegir Claro también es una elección expresa. Solo se recuerda {version:1,theme} en karta3.appearance.v1, en este navegador/origen; otras pestañas releen la última escritura. Si no puede guardarse, funciona en memoria con aviso discreto. No cambia configuración compartida, cartas, permisos, foco o plazos, y funciona sin permiso estadístico.

Cuando el selector está debajo de Cancelar, sus bordes se alinean sin ensanchar el botón. En Detalles, Información queda a la izquierda y Cerrar al margen derecho; si no caben, pasan a filas. [Evidencia histórica de la adenda](docs/sdd/evidencias/B20/adenda-selector-detalles/README.md). B21 conserva esos estilos y acciones.

**Históricos B18–B20:** sus cierres, avisos, pruebas y cifras se conservan en SDD/Git, sin atribuirlos a B21: [B18](docs/sdd/BLOQUE_18_ANALITICA_BASICA_USO.md), [B19](docs/sdd/BLOQUE_19_HABILITACION_ANALITICA_REAL.md), [B20](docs/sdd/BLOQUE_20_APARIENCIA_PERSONAL_Y_USO.md). Sus contratos de eventos, aceptación general, recibos, esquemas 1/2/3 y comandos ya no son instrucciones de la versión nueva. Se conservan las salvaguardas funcionales de transporte/reconexión, JOIN registrado, privacidad, no-store y T04.

La aplicación se construye de forma incremental, con especificaciones, pruebas y documentación de cada entrega. Utiliza TypeScript, React y un servidor Node.js con Express y Socket.IO.

## Evolución del MVP y evidencia por bloque

[B22](docs/sdd/BLOQUE_22_INCORPORACION_MODELOS_IA_2026.md) incorpora manualmente **Modelos de IA — Edición 2026, formato2/contenido2**, ya aprobada/activada por el Gestor. Finalidad demostrativa de la mecánica, **sin finalidad formativa ni ranking científico**; instrucciones, fechas, separadores y notas se muestran literalmente. Catálogo vigente: `criaturas-magicas`2, `generica`4, `modelos-ia-2026`2 y `sistema-solar`4, todas formato2/disponibles, sin selección inicial. [Copia/certificados/evidencia B22](docs/sdd/evidencias/B22/README.md). Consumidor, reglas, bots, apariencia y paneles compactos existentes se reutilizan sin cambios.

La continuación de la [adenda B17 §10](docs/sdd/ADENDA_B17_TITULOS_Y_ENCAJE.md#10-continuación-g-y-reparación-t-autorizada--17102026) distribuye las dos columnas de la cara normal según símbolo/atributo y dato/unidad medidos. Usa columnas nativas compartidas por las tres filas; conserva un reparto uniforme cuando las necesidades son compatibles, sin consultar cartas ocultas. No reduce padding, fuentes o contenido. El retorno de zoom vuelve a observar también la altura natural del icono, conforme a la reparación autorizada por el autor tras su diagnóstico. Las puertas focales Linux acreditan5/5 y29/29 sobre4c7a466; la CI completa del HEAD final, integración y reproducción se registran por separado en el [registro operativo](docs/operacion/GITHUB_Y_RECUPERACION.md) y la [PR #13](https://github.com/adriancapilla/karta3/pull/13). La [evidencia Windows](docs/sdd/evidencias/B17/continuacion-20261017/README.md) conserva sus resultados y límites propios.

[B17](docs/sdd/BLOQUE_17_CARTA_IMAGEN_Y_SIMBOLOS.md) refina la carta normal: imagen íntegra hasta los bordes, botón **D** superpuesto para Detalles, tres filas centradas sin cabecera visible, sombreado activo sin rombo y círculo vectorial. Conserva cartas de referencia de 230×321. La [adenda del 17/10](docs/sdd/ADENDA_B17_TITULOS_Y_ENCAJE.md#8-implementación-y-comprobación-local--17102026) ajusta únicamente el título normal a una línea, con el mayor tamaño admisible entre 12 px CSS y el máximo del perfil. Solo si no cabe a 12 se corta visualmente, sin elipsis; conserva el nombre íntegro en DOM, accesibilidad y Detalles. La banda de cabecera mantiene su altura al reducir el título; fuentes de atributos, imagen y controles se conservan. Sigue disponible el ajuste condicional histórico de filas 6/4,9 px, sin otro relleno o crecimiento. La minicarta compacta conserva su cara y «Detalles» inferior. Detalles amplía la imagen al ancho interior del diálogo desde ambas representaciones, sin cambiar datos, unidades, Información ni acciones de juego. La evidencia Windows inicial y los diagnósticos Linux históricos permanecen conservados; la continuación G/T y su publicación se identifican arriba y en el registro operativo.

[B16](docs/sdd/BLOQUE_16_INCORPORACION_CRIATURAS_MAGICAS.md) incorpora **Criaturas Mágicas, formato 2/contenido 2**, aprobada y activada por Gestor. Reutiliza el consumidor y la presentación B15. El catálogo de aquella entrega reunía Criaturas Mágicas v2, genérica v4 y Sistema Solar v4; B22 añade la cuarta baraja. Las salas siguen sin selección inicial y las versiones son independientes. Sus habilidades son narrativas y no añaden acciones o reglas. [Copia y certificados B16](docs/sdd/evidencias/B16/incorporacion.json).

[B15](docs/sdd/BLOQUE_15_FORMATO_2_Y_PRESENTACION.md) incorpora conjuntamente el consumidor formato 2 y las copias aprobadas/activadas de genérica y Sistema Solar **formato 2/contenido 4**. La herramienta valida V1 históricamente y V2 con Unicode/NFC, grafemas, topes y recursos; el catálogo normal exige disponibles V2 válidas y falla ante una disponible V1, sin conversión ni catálogo parcial. La copia y sus 63 huellas están en [evidencia B15](docs/sdd/evidencias/B15/copia-2-4.json).

B15 añade «Valor del Atributo» (1-58/Dato, inicialmente 1-58) y «Optimizar para móvil» (inicialmente No), compartidos y fijados al iniciar. Cartas con tres atributos/dos columnas; Detalles siempre muestra el dato literal/unidad, sin J. Información de la baraja contiene descripción e instrucciones exactas de la selección autorizada. Con optimización y menos de 1368 px **útiles medidos**, la compacta ordena puntuaciones → resumen → Mesa → mano, con carruseles independientes. Desde 1368 mantiene la misma normal on/off. Los rangos siguen decidiendo orden, bots y resultado.

La segmentación Node 24.19.0/ICU 78.3/Unicode 17 se contrasta con [fixtures técnicas oficiales](tests/fixtures/unicode-17/README.md). Validar no acredita legibilidad universal, revisión humana o una imagen Linux comprobada. B14 y sus comprobaciones conservan sus resultados históricos; B15 replanifica R01–R04 con evidencia propia.

[B13](docs/sdd/BLOQUE_13_CANCELACION_PARTIDA.md) permite al anfitrión cancelar para todos una partida en curso, también si observa o está en automático. Requiere confirmación y no pausa la ejecución. Conserva los puntos de rondas resueltas, presenta «Puntuaciones parciales» sin ganador y libera inmediatamente todas las sesiones humanas. El resumen autorizado dura 30 minutos desde la cancelación; permite otra sala sin reiniciar. Los finales ordinarios y por inactividad mantienen sus reglas.

Actualmente permite crear una sala de espera, compartir su código e incorporar participantes desde navegadores independientes. La lista se actualiza en tiempo real y, durante la espera, cada participante puede cambiar su nombre o salir. También gestiona la reconexión temporal y el cierre de esperas por inactividad.

El bloque 04 añade validación común de barajas, preparación del catálogo y consulta pública de resúmenes. Las incorporaciones históricas [genérica contenido 2](docs/sdd/ACTIVACION_GENERICA_V2.md) y [Sistema Solar contenido 2 (B14)](docs/sdd/BLOQUE_14_INCORPORACION_SISTEMA_SOLAR.md) se conservan; las copias actuales de ambas son 2/4, disponibles. El catálogo ofrece sus resúmenes seguros sin selección automática. Genérica conserva portada nula; Solar la portada y sus 58 imágenes, con huellas conservadas. B04/B05 mantienen su evidencia histórica de contenido 1/no disponible.

El bloque 05 permite seleccionar/quitar una versión disponible de baraja, participar u observar como anfitrión, configurar tiempo de turno, desempate y revisión. Cada control se confirma de forma independiente y los invitados consultan los valores aceptados.

El [bloque 06](docs/sdd/BLOQUE_06_INICIO_Y_MESA_INICIAL.md) entrega el inicio por el anfitrión y una versión exacta disponible seleccionada. B09 amplía su preparación a 2–5 jugadores HUMAN/BOT, al menos un humano jugador y todos los miembros humanos conectados, incluido el anfitrión observador. El [bloque 07](docs/sdd/BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md) permite completar la partida manual: apertura ALTO/BAJO y carta en cualquier orden, turnos circulares, puntuación, reposición, tres rondas finales, desempate opcional único y clasificación. La dirección parcial es privada del abridor y sus pestañas; la carta parcial solo vive en esa pestaña. Detalles no juega. Recargar recupera estado/identidad sin enviar acciones ni volver a repartir.

El [bloque 08](docs/sdd/BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md) aplica el turno configurado de 15/30/60 segundos desde el inicio y cada activación. Al vencer, el servidor juega la carta más antigua; al abrir conserva la dirección aceptada a tiempo o elige la desfavorable según el atributo activo. El primer fallo avisa; una jugada manual completa válida a tiempo reinicia el contador. El segundo consecutivo pasa a automático permanente: sigue siendo humano, conserva cartas/puntos y puede observar su mano y Detalles, pero ya no actuar. Si todos los jugadores humanos están en automático, se termina/puntúa/revisa la ronda actual y se publican resultados por inactividad, sin iniciar otra ronda o desempate. Un desempate ya iniciado sí se completa y reconoce al vencedor sin puntos nuevos.

El [bloque 09](docs/sdd/BLOQUE_09_BOTS.md) permite añadir explícitamente un bot Difícil, cambiar individualmente a Fácil/Difícil, renombrar con diálogo y retirar inmediatamente durante la espera. Cada bot ocupa plaza, conserva su orden y juega mediante su política en el servidor, sin sesión, presencia, plazo humano ni contador de abandono. No es un humano en automático. El anfitrión jugador va al final; el observador aparte. Los bots completan rondas, revisión, fase final, desempate y resultados con las mismas reglas de cartas/puntos. Para terminar por inactividad se cuentan solo los humanos jugadores del roster base.

La [alineación T02](docs/sdd/BLOQUE_T02_ALINEACION_DIFICULTADES_BOTS.md) usa `EASY` para «Fácil» y `HARD` para «Difícil», también al añadir un bot. HARD conserva exactamente la política que antes se identificaba como NORMAL; no incorpora el algoritmo avanzado ni otros niveles. NORMAL se rechaza sin alias/coerción. El [ajuste visual anterior](docs/sdd/AJUSTE_ETIQUETA_DIFICULTAD_BOTS.md) y el cierre B09 conservan sus denominaciones y resultados históricos.

El [bloque 10](docs/sdd/BLOQUE_10_REDISTRIBUCION_MESA.md) redistribuye los mismos paneles de mesa: desde 761 px, jugadores/mesa arriba e indicadora/mano/estado abajo, con estado junto a mano; hasta 760 px, jugadores/estado vecinos arriba y después indicadora compacta, mesa y mano. El observador mantiene estado público y no tiene mano. Cabecera, cartas, fuentes, etiquetas, acciones, plazos y revisión se conservan. Mesa/mano siguen teniendo scrolls laterales independientes; la página todavía puede necesitar scroll vertical. Esta entrega no garantiza verlo todo en una sola ventana.

El [ajuste B11 de mesa PC](docs/sdd/BLOQUE_11_AJUSTE_MESA_PC_02.md) conserva esa composición y usa la referencia aprobada de **1800×1600 píxeles CSS al 100 %**, con cartas exteriores **230×321 px** en juego normal. Compacta cabecera/jugadores, muestra BF/BD y abridor sombreado, Mesa/autores al pie, la tabla histórica Atributo/Dato/J e icono propio (B15 sustituye esa tabla por dos columnas). Detalles permanece dentro; «Jugar carta» queda fuera y también se puede pulsar la superficie informativa sin arrastrar. El turno mantiene reloj y parcial privada, con ALTO sobre BAJO. El encuadre de referencia no acredita el de una pantalla física de 1920×1080; otros tamaños conservan acceso/scroll y la revisión visual del autor sigue pendiente. No se ha rediseñado móvil, espera o resultados.

La base normal [B12 — Mesa centrada 03](docs/sdd/BLOQUE_12_MESA_CENTRADA_03.md), conservada por B15, limita el contenedor PC a **1400 px** cuando existe ese ancho útil, con cuadrícula de **1368**, laterales de 264 px, mano de 816 y estado de 264; cartas de 230×321. Mesa mide 1092: muestra cuatro completas y permite consultar la quinta lateralmente, con ayuda y acceso de teclado/ratón/táctil. Las jugadas públicas se muestran por rango activo descendente ALTO/ascendente BAJO, y durante revisión siguen el ranking confirmado; la mano mantiene adquisición. En ese modo desaparece la línea superior «Atributo indicador: …», se compactan ambos encabezados y «Tu mano» queda centrado. Sigue habiendo atributo activo en turno/cartas. El scroll vertical es natural y está permitido. B15 añade la compacta cuando se activa optimización y el contenedor útil es menor de 1368. Los cierres B10–B12 conservan sus objetivos y evidencias históricos.

Todo el estado se mantiene en memoria de un proceso. **Reiniciar el servidor elimina salas, partidas, resultados y sesiones.** En juego no hay salida individual/cierre; existe la cancelación confirmada del anfitrión B13; el anfitrión ausente no cierra la mesa y el servidor continúa sin navegadores. No existe opción de modo manual. Revisión (0/2/5/10/15/30 s) y conservación de resultados (30 minutos desde publicación final tras revisión, incluso sin clientes) están aplicadas. Volver al inicio libera solo la sesión solicitante en todas sus pestañas; permite consultar su último resultado y crear/entrar en otra sala sin reiniciar. No es historial permanente ni revancha. Para limpiar todos los ensayos se reinicia el proceso.

La [corrección T04 de INC-01](docs/sdd/BLOQUE_T04_AVISO_RESULTADO_ANTERIOR.md) asocia los errores de retorno al resultado correspondiente: un aviso de una partida anterior no acompaña a la nueva clasificación. Conserva la retención original de 30 minutos y la lectura autorizada; consultar no prolonga disponibilidad.

El [empaquetado Docker de Pruebas](docs/operacion/DOCKER_PRUEBAS.md) prepara una imagen Linux desde APP, Compose y Caddy con certificados persistentes. Configuración por arranque y referencia por digest; app privada, un proceso por entorno y solo Caddy en TCP 80/443. La guía distingue comprobación local, imagen Linux pendiente de CI y operación posterior por el autor. No acredita VPS desplegado. El arranque local mantiene 127.0.0.1; `HOST` permite la escucha en la red del contenedor.

Para esta publicación conjunta B10–B12, el autor considera la jugabilidad PC suficientemente correcta para esta etapa. Esta aceptación posterior no reescribe los pendientes históricos de cada cierre ni acredita otros tamaños o C09–C10 completos. Las [fuentes y referencias originales de Diseño](docs/diseno/README.md) distinguen antecedentes, propuestas y decisiones implementadas; las maquetas no son capturas del producto final.

Las reglas para desarrollar los siguientes bloques están en [`AGENTS.md`](AGENTS.md). La [organización y dependencias](docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) explica cómo separar dominio, aplicación, infraestructura e interfaz a partir de este primer bloque.

## Requisitos e instalación

- **Node.js 24.19.0 LTS**, referencia fijada en `.node-version` y compartida con CI. El requisito admite `>=24.19.0 <25`; `.npmrc` rechaza instalaciones con versiones incompatibles. Se ha comprobado con npm **11.6.2**.
- Chrome instalado para las pruebas de navegador.

Selecciona esa versión mediante tu gestor de versiones o una [distribución oficial portable de Node 24.19.0](https://nodejs.org/en/blog/release/v24.19.0). Para usar una portable sin cambiar instalaciones globales, antepón su carpeta —que contiene Node y npm— al PATH **solo de las terminales del proyecto**. Comprueba versión y ruta antes de instalar y en cada terminal que arranque o pruebe la aplicación:

```powershell
node --version
npm --version
Get-Command node,npm | Select-Object Name,Source
```

La [verificación local T03 del 07/10/2026](docs/sdd/BLOQUE_T03_ENTORNO_Y_DEPENDENCIAS.md) superó instalación limpia, check **413/413**, control de **65 módulos**, desarrollo/compilado y navegador completo **114/114**, con auditoría completa y de producción **0/0**. El [registro de publicación](docs/operacion/GITHUB_Y_RECUPERACION.md) y la PR de T03/T04 distinguen esa evidencia local de las nuevas ejecuciones remotas de la batería completa, ampliada a **118 recorridos**.

T03 adopta un entorno operativo reproducible: el clon Windows falló nativamente en TypeScript con 24.13.0 y funcionó con 24.19.0; la CI Linux anterior sí pasó con 24.13.0. Esto no demuestra la causa original del fallo. No hace falta cambiar runtimes de otras herramientas. El [registro T03](docs/sdd/BLOQUE_T03_ENTORNO_Y_DEPENDENCIAS.md) distingue esa evidencia histórica de sus comprobaciones nuevas.

El repositorio es público. Para reproducir exactamente la entrega, sigue el clon y la etiqueta de la [guía del TFM](docs/operacion/ENTREGA_MVP_TFM.md#clon-y-arranque-local). Para trabajar con main, en PowerShell:

```powershell
git clone https://github.com/adriancapilla/karta3.git
Set-Location -LiteralPath 'karta3'
npm ci
npm run dev
```

Abrir `http://127.0.0.1:5173`. El paso `predev` prepara las barajas antes de arrancar. Vite envía `/api`, `/media`, `/barajas` y `/socket.io` al servidor en `127.0.0.1:3000` y bloquea el acceso directo a datos internos. Para probar la entrada, usa otro navegador o perfil con cookies independientes; una segunda pestaña del mismo perfil representa a la misma persona. El estado reside en la memoria del servidor; reiniciarlo elimina las salas. No hacen falta cuentas ni variables de entorno para desarrollo local.

Antes de repetir `npm ci`, detén las instancias de este proyecto que estén utilizando sus módulos nativos. En Windows, un archivo de `sharp` abierto puede impedir la reinstalación; una instalación interrumpida no acredita dependencias completas. Repite `npm ci` después de liberar el archivo, conservando el lockfile. Detener/reiniciar el servidor pierde su estado en memoria.

### Dependencias de desarrollo

T03 alinea `@types/node` con la serie 24 (**24.19.1**). Esta fue la alineación histórica T03; la entrega B22 fija **Vite 8.3.5** y PostCSS **8.5.31** en el lockfile, según la [publicación B22](docs/operacion/PUBLICACION_B22_Y_TRASLADO_B21.md). `concurrently` **10.0.5** aún fija `shell-quote` 1.9.0: un override limitado a ese incorporador lo sustituye por **1.11.0**, corrección del [aviso oficial](https://github.com/advisories/GHSA-pqg4-j6r4-53mv). Revisarlo cuando el incorporador publique su actualización; no extenderlo a otros paquetes. Las demás versiones bloqueadas se conservan. Diagnóstico reproducible:

```powershell
npm audit
npm audit --omit=dev
npm ls concurrently shell-quote postcss source-map-js @types/node --all
```

Conserva `package-lock.json`; no utilices `audit fix --force` para resolver estos avisos. Los resultados de auditoría corresponden a su fecha, no garantizan ausencia de avisos futuros.

## Comprobaciones

El [flujo de GitHub y recuperación](docs/operacion/GITHUB_Y_RECUPERACION.md) describe la automatización, las ejecuciones verificadas y las copias pendientes fuera de Git.

```powershell
npm run check
```

Comprueba tipos, análisis estático, pruebas de modelo, casos de uso, adaptadores y API, dependencias entre capas y compilación. El control `npm run check:architecture` también puede ejecutarse por separado; sus casos negativos forman parte de `npm test`. Para las pruebas de navegador, en una terminal arranca la versión compilada actual:

```powershell
npm run build
npm run start
```

En otra terminal, entra también en esa carpeta y ejecuta:

```powershell
# Desde la carpeta del repositorio, que contiene package.json:
npm run test:browser
```

Estas pruebas usan Chrome y el servidor local en `127.0.0.1:3000`; incluyen contextos aislados que se comunican mediante Socket.IO. Reinicia `npm run start` después de cambiar y compilar código del servidor. Los recorridos de caducidad levantan además instancias de esa misma compilación con reloj/planificador sustituidos, sin controles de prueba públicos. El recorrido de reserva real espera los 30 segundos originales y puede tardar cerca de un minuto. La evidencia de configuración está en [B05](docs/sdd/BLOQUE_05_CONFIGURACION_SALA.md); los bloques anteriores conservan sus registros históricos.

### Probar configuración

Desde la sala, modificar un control como anfitrión y observar su confirmación. Abrir otro perfil/navegador, entrar por código y comprobar el resumen recibido. Una segunda pestaña del anfitrión comparte identidad: los cambios de controles distintos se conservan y el último nuevo válido del mismo control prevalece. Desmarcar «El anfitrión juega» muestra al observador fuera de la lista; volver a jugar exige plaza libre. Recargar recupera los valores aceptados. La genérica contenido 4 está disponible, pero cada sala empieza sin baraja seleccionada y permite quitar la selección.

Para probar selección, portada, icono neutro, errores y carreras con paquetes disponibles sin cambiar las copias reales:

```powershell
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
npm run build
npx playwright test tests/browser/configuration.spec.ts
```

Este recorrido crea servidores de la compilación actual con paquetes sintéticos validados en carpetas temporales, dos sesiones y dos pestañas del anfitrión. Usa conexiones reales y tiempo controlado para vencimientos; no publica fixtures en `barajas/`.

## Estructura y decisiones

- `server/domain/`: `deck.ts` valida baraja; `game.ts` gobierna jugadas, ranking por valor jugable, cartas/puntos, reposición, fases finales, desempate y clasificación con sucesores inmutables. `autoPlay.ts` decide la política de humanos inactivos y `botPlay.ts` las políticas EASY/HARD sobre mano propia/atributo/dirección; Game aplica contador/control y motivo de fin. Recibe permutaciones explícitas; no IO, reloj ni transporte.
- `server/application/`: Room conserva preparación/asociación/roster y plazos explícitos. RoomUseCases autoriza/deduplica preparación y gestión de bots con resultado mínimo botId; GameCoordinator coordina contexto, parcial privada, vencimientos, pasos de humanos automáticos/bots, revisión, publicación/retención y retorno. Clock/Scheduler/GameChanges/CardPermutation son puertos usados. WaitingLifecycle solo espera; initialGameView y resultsView proyectan por destinatario. DeckCatalog/ListDecks ofrecen resúmenes seguros sin releer archivos al jugar.
- `server/infrastructure/`: repositorio y solicitudes deduplicadas en memoria, sesiones y último fin automático propio, generación, reloj monotónico, planificador cancelable, HTTP Express y Socket.IO. El transporte cuenta conexiones autenticadas; la aplicación decide sus consecuencias. La cookie es `HttpOnly`, limitada al host y `SameSite=Strict`; usa `Secure` cuando `NODE_ENV=production`.
- `server/composition/` y `server/main.ts`: eligen adaptadores, los conectan, sirven `dist` e inician el proceso.
- `shared/contracts/`: formato público de la sala, respuestas y mensajes de tiempo real, compartido con el cliente.
- `src/`: WaitingPlayers/useBotActions presentan filas/diálogo y gestionan pending/incertidumbre por bot/campo; participantNames conserva sufijos. API/socket y useRoomFlow separan asociación activa de lectura explícita del resultado. useGameActions guarda solo carta local/pending; GameScreen/GameCard/Detalles/RoundReview y ResultsScreen presentan contratos seguros. useServerCountdown estima tiempo con referencia pública y `performance.now()`: el cero solo solicita lectura y bloquea gestos antiguos. Inicio/jugada inciertos requieren recuperación antes de reintentar; no se encolan ni envían al reconectar. React no calcula ganadores/puntos ni aplica vencimientos.
- `server/infrastructure/decks/`: parser JSON estricto, esquema/coherencia, recursos decodificados y catálogo en memoria. `sharp` 0.35.5 es dependencia del servidor para PNG/JPEG/WebP; no va al cliente.
- `tools/decks.ts`: analiza argumentos y delega a composición las operaciones comunes de validación/preparación.
- `tools/check-architecture.mjs`: comprueba imports, reexportaciones, aliases y ciclos del código de producción, incluidos comandos en la raíz de `tools/`.
- `tests/browser/`: recorridos en Chrome a 360/390/1280 píxeles, con sesiones independientes y montajes compilados.
- `docs/sdd/`: especificación y evidencia del bloque.

La creación, lectura, edición del nombre y cierre conservan HTTP. La entrada, salida, configuración y sincronización usan Socket.IO con la misma sesión. La configuración usa un id nuevo por gesto; el transporte volátil no espera ni encola cambios para reconectar. El servidor deduplica repeticiones sin restaurar un resultado antiguo. El estado jugable en memoria permite una sola instancia del servidor; no hay persistencia del juego ni sincronización entre procesos. SQLite B21 persiste únicamente agregados, sin recuperar salas, sesiones o partidas. El código visible localiza una sala, pero nunca autoriza a modificarla.

## Preparar y probar barajas

Desde `E:\KARTA3\KARTA3_IA\APP\karta3`:

```powershell
npm run decks:validate -- --package barajas/generica
npm run decks:validate -- --package barajas/sistema-solar
npm run decks:prepare
npm run build
npm run start
```

Consultar `http://127.0.0.1:3000/api/decks`: devuelve cuatro resúmenes en orden `criaturas-magicas` (2/2), `generica` (2/4), `modelos-ia-2026` (2/2), `sistema-solar` (2/4); los pares indican schemaVersion/contentVersion. Cada uno contiene únicamente id/versiones, nombre/subtítulo/descripción y URL/alt de portada (o null/"" en genérica): ocho campos, sin las cartas. `build` siempre prepara `barajas/catalogo.json`; `start` vuelve a validar los paquetes y exige ese catálogo vigente antes de escuchar. El artefacto está ignorado en Git y se genera con orden estable, UTF-8, dos espacios y LF. Solo se leen copias de APP; no hace falta ASSETS ni TFM para construir/ejecutar. Copiar o compilar no actualiza la instantánea de un servidor ya abierto: arrancar una instancia propia de la nueva compilación en un puerto libre para comprobarla, sin detener servidores del autor. Reiniciar una instancia pierde sus salas.

Validar un paquete devuelve salida 0 si es válido, aunque no esté disponible, y 1 si es inválido. Preparar o arrancar informa/excluye borradores inválidos cuyo `false` sea fiable; una disponible V1 incompatible, V2 inválida o disponibilidad indeterminable bloquea. V1 se conserva para validación histórica, sin aplicarle NFC/topes V2. La aplicación no repara datos ni activa contenido. Incorporar/activar una nueva copia exige revisión y versiones conforme al [contrato vigente V2](docs/contratos/CONTRATO_BARAJAS_V2.md).

Los JSON internos no son descargables. Las referencias públicas admitidas usan `/media/decks/<id>/v<contenido>/<referencia>` y solo sirven bytes validados de copias disponibles. B05 ofrece selector, selección autorizada y ficha/icono neutro para la ausencia de portada; B06 entrega indicadora y mano propia, con iconos ante imágenes nulas y Detalles accesible. Las fixtures de pruebas son temporales y no sustituyen la genérica normal: permiten probar catálogo vacío, borradores, inválidos y recursos reales. [Evidencia B04](docs/sdd/BLOQUE_04_CARGA_BARAJAS.md), [B05](docs/sdd/BLOQUE_05_CONFIGURACION_SALA.md), [genérica 2](docs/sdd/ACTIVACION_GENERICA_V2.md) y [B06](docs/sdd/BLOQUE_06_INICIO_Y_MESA_INICIAL.md).

### Prueba manual de genérica contenido 4 con dos sesiones

En PowerShell, desde `E:\KARTA3\KARTA3_IA\APP\karta3`, ejecutar `npm ci` si faltan las dependencias y `npm run check`. Detener el servidor anterior y ejecutar `npm run start`. Mantenerlo abierto; en otra terminal del mismo directorio ejecutar `npm run test:browser` para la comprobación automática sobre la compilación actual.

1. Abrir `http://127.0.0.1:3000/api/decks`: debe ofrecer `generica`, formato 2/contenido 4 y portada nula. Volver a `http://127.0.0.1:3000`.
2. En sesión A crear sala. Verificar las seis cifras y «Sin baraja seleccionada», aunque haya dos barajas disponibles. Predeterminados: anfitrión juega, turno 30 s, desempate desactivado y revisión 5 s.
3. En otro navegador/perfil con cookies independientes, sesión B entrar con código y nombre. Una segunda pestaña del mismo perfil comparte identidad y no representa a otro participante.
4. A selecciona «KARTA3 — Baraja genérica · v4». Tras aceptación, A y B ven nombre, descripción e icono neutro sin recargar. B consulta la configuración y no dispone de controles para editarla.
5. Recargar A y B, sin reiniciar el servidor: conservan identidad, autoridad, orden y selección exacta sin duplicaciones. Reiniciar el servidor pierde la espera y no es una prueba de recuperación mediante recarga.
6. A elige «Sin baraja seleccionada»: B ve el cambio sin recargar. B prueba salida voluntaria y A cierre con confirmación. Repetir en móvil (390 px) y escritorio (1280 px).

Registrar fecha, versión servida, navegadores/perfiles, acciones, resultados y límites. Estas instrucciones no acreditan ejecución manual. C09–C10 siguen parciales: B07 amplía uso de la baraja, cartas jugadas/manos variables/resultados y privacidad; comprensión con usuarios, equilibrio, móviles físicos y despliegue siguen pendientes. B09 incorpora bots Fácil/Difícil sin acreditar equilibrio.

### Prueba manual B16: Criaturas Mágicas y dos sesiones

1. Comprobar `node --version` (24.19.0) y `node -p "JSON.stringify({icu:process.versions.icu,unicode:process.versions.unicode})"` (78.3/17.0). Una terminal con otro Node en PATH no usa automáticamente `.node-version`. Compilar con `npm run check` y arrancar una instancia propia en puerto libre: `$env:PORT='3151'`, después `npm run start`. Preservar los servidores de otras personas. El reinicio de tu instancia pierde su memoria y carga la instantánea de barajas actual.
2. Abrir `http://127.0.0.1:3151` en dos perfiles A/B independientes y otra pestaña de A. Crear/entrar: tres opciones, inicialmente ninguna seleccionada. A elige **Criaturas Mágicas · v2**. B consulta ficha/portada sin controles de configuración. Información contiene instrucciones de Poder/Astucia/Resistencia y aclara que las habilidades no añaden reglas.
3. A alterna genérica v4/Solar v4/Criaturas v2 y quita selección. Modos 1-58/Dato y optimización persisten. Recargar A/B conserva identidad, versión y valores aceptados; no reenvía cambios. Criaturas v4 no existe y el servidor la rechaza.
4. Iniciar con ambos humanos o una persona y bots Fácil/Difícil. Probar ambos modos en partidas separadas: los números coinciden deliberadamente con los rangos y no tienen unidades. Revisar Resistencia completa, activa y no activa, imágenes, indicadora, mano y Mesa. Símbolo/nombre pueden ocupar líneas distintas. Detalles conserva característica/nota y dato sin J; Información mantiene las instrucciones exactas.
5. Con optimización Sí y menos de 1368 útiles, puntuaciones → resumen → Mesa → mano. Probar 390×844 y 360×800, scrolls laterales independientes/quinta, Detalles/teclado/foco y resize. Con optimización No se mantiene normal adaptada; desde 1368 útiles, normal equivalente on/off. Registrar área útil/zoom/fuentes y scroll real, no solo tamaño nominal.
6. Ensayo observador: A observa, B juega y se añade un bot; A no recibe mano y conserva Cancelar. Completar una partida a tiempo hasta resultados, F5 y otra sala sin selección. Probar cancelación y recuperación/otra sala sin avisos anteriores. Reiniciar solo la instancia propia para limpiar un ensayo detenido.

La evidencia del bloque distingue aprobación/activación y galería del Gestor de producto compilado local, reloj sustituido/adaptadores normales, CI Linux y revisión humana/dispositivos físicos. La sintaxis del verificador Linux no acredita ejecución de la imagen. Estos pasos manuales permanecen pendientes hasta que el autor los realice; C09–C10 conservan sus límites de comprensión/equilibrio y cobertura parcial.

### Prueba manual B15: modos, consultas y compacta

Estos pasos requieren revisión del autor; las pruebas automatizadas no cuentan como uso humano.

1. En una terminal propia, con Node 24.19.0, ejecutar `npm run check`. Usar un puerto libre: `$env:PORT='3151'; npm run start`. No detener los servidores del autor ni instalar dependencias mientras una instancia usa módulos nativos.
2. Abrir `http://127.0.0.1:3151` en dos perfiles con cookies independientes. A crea, B entra; abrir también una segunda pestaña de A. La espera empieza sin baraja, 1-58 y optimización No.
3. Seleccionar explícitamente genérica v4, después Solar v4 y quitar selección. Cambiar Dato/optimización y revisión en pestañas distintas: los controles se aceptan individualmente y los modos persisten. B solo consulta. Editar un nombre sin guardarlo mientras llegan eventos: conservar borrador/foco. F5 conserva identidad y valores aceptados; no reenvía cambios.
4. Consultar Información en ambas barajas; Solar explica Vel/Dist/MKm y redondeos aprobados. Cambiar/quitar selección desde la otra pestaña cierra la consulta vieja. El texto no ejecuta HTML/Markdown ni renueva la espera.
5. Iniciar con dos personas o una y bots. Carta/indicadora/Mesa tienen tres atributos y solo el valor elegido; Detalles siempre contiene dato/unidad sin J. Encke/Borrelly conservan 4.8 km y rangos 7/8; Hyakutake muestra 317859 MKm. El juego no transforma ni restaura precisión editorial anterior.
6. Con optimización Sí y ancho útil menor de 1368: puntuaciones/identidades → resumen → Mesa → mano. Apartar puntuaciones por scroll natural; consultar nombre/sufijo/roles, indicadora y Detalles. Mesa y mano desplazan por separado; quinta accesible por teclado y gesto. Jugar queda fuera; arrastrar o consultar no juega.
7. Medir `.game-composition`/su `data-useful-width`, con zoom 100 %, al cruzar 1367/1368; no confundirlo con viewport. Desde 1368, on/off son la misma normal. Redimensionar mantiene contexto, selección, foco/consulta y plazo; solo estimación de cliente.
8. Ensayo observador: A desmarca «El anfitrión juega» y entran B/C. A conserva autoridad/Cancelar e identidades, sin mano ni puntos propios. Ampliar a cinco jugadores y nombres repetidos para revisar iniciales/sufijos estables.
9. Completar una partida o cancelar con confirmación; recuperar resultados/F5/URL y crear otra sala. A cancelada/caducada no contamina B. B13/T04 conservan retención 30 minutos sin renovación. Casos de fase final/desempate se prueban con fixtures legales separadas si no se alcanzan naturalmente.
10. Probar primer timeout/reset manual y segundo/automático, con revisión cero/positiva. Un cliente desconectado no pausa el servidor. Registrar versión servida, dispositivo real o emulación, viewport/útil/zoom y observaciones; no declarar comprobados equipos físicos por capturas Chrome.

Las fuentes científicas y la activación corresponden a Gestor. [Cierre B15](docs/sdd/BLOQUE_15_FORMATO_2_Y_PRESENTACION.md) separa aprobación editorial, maquetas, producto automatizado y revisión humana pendiente. C09–C10 permanecen parciales; sin publicación ni despliegue desde esta entrega.

### Prueba manual B07: dos jugadores y observador

```powershell
Set-Location -LiteralPath 'E:\KARTA3\KARTA3_IA\APP\karta3'
npm ci
npm run check
# Detener con Ctrl+C la instancia anterior antes de arrancar la compilación actual:
npm run start
```

1. Abrir `http://127.0.0.1:3000` en dos navegadores o perfiles con cookies independientes. A crea y B entra con el código y nombre «Ana». Una segunda pestaña de A comparte su identidad.
2. Sin selección, «Iniciar partida» está deshabilitado para A; B no tiene ese botón. A selecciona explícitamente «KARTA3 — Baraja genérica · v4» y espera confirmación. No es necesario llenar cinco plazas ni marcar listo.
3. A inicia una vez. A, su segunda pestaña y B reciben la mesa: B abre, tres cartas propias, indicadora común, ronda 1, dirección «Sin elegir», mazo 51 y cero puntos. Estado de la partida muestra «Tiempo de turno · mm:ss». Solo B puede jugar; no hay salida/cierre. Completar cada jugada antes del límite para comprobar el recorrido manual B07 bajo B08.
4. Abrir Detalles de indicadora/mano con teclado y cierre/Escape; comprobar característica/nota si existen y tres filas con dato/unidad literal, sin J. En las cartas de mesa se muestran Atributo y el modo elegido (1-58 o Dato); solo playValue decide la comparación. A 360/390 px la indicadora es compacta y la mano se desplaza dentro de su fila; a 1280 px se muestra completa. La genérica usa icono decorativo, sin imagen de sustitución.
5. B elige ALTO: la dirección aceptada solo se ve en B y otra pestaña de B. Cambiar a BAJO no juega. F5 conserva dirección, nunca carta parcial. Pulsar carta propia completa y envía sin confirmación. En otra apertura elegir primero carta, luego ALTO/BAJO. Recibir dirección de otra pestaña no completa automáticamente una carta local. A juega su carta cuando le toca; no envía dirección. Detalles/Escape no juega y devuelve foco al disparador.
6. Alternar aperturas/direcciones hasta completar, actuando a tiempo: ganador recibe dos cartas/dos puntos, segundo abre, reposición al final de adquisición y revisión de cinco segundos conserva ronda resuelta. Recargar/cortar/restaurar conexión conserva mano/contexto/plazo; otra pestaña conectada mantiene presencia. Desconectar no pausa el turno. Durante revisión no se juega ni corre un plazo humano; solo su cuenta atrás aparece. Con revisión cero se comunica el resultado brevemente sin pausa.
7. Con dos jugadores hay 17 rondas normales y tres finales: las finales comparten indicadora/atributo, no reponen y reducen mano 3→2→1→0; total 40 cartas/puntos adjudicados. Resultado se presenta tras revisión final, con puestos y ganadores. A vuelve al inicio: todas sus pestañas vuelven, B mantiene su resultado. Abrir «Ver último resultado» y F5 allí no revinculan. A crea/entra en otra sala sin reiniciar, con código/participación nuevos; leer el resultado antiguo en otra pestaña no cambia esa sala.
8. Ensayo observador: completar/volver o, si el ensayo está detenido, Ctrl+C y `npm run start` para limpiar **todo** el proceso. Crear en A y desmarcar «El anfitrión juega». Entrar B/C en otras dos sesiones independientes, seleccionar genérica 4, revisión cero y desempate activo, e iniciar A. B abre, A observa sin mano/puntos. Completar la partida y verificar resultado público. Sin empate máximo no se ejecuta desempate; esto no acredita esa rama.
9. Empates se prueban por separado con paquetes/permutaciones temporales validados y acciones legales: `npx playwright test tests/browser/manualGame.spec.ts --grep 'M4 traza'`. Cinco empatados a 10 reciben una carta en desempate; cuatro, dos. Las pruebas de dominio/socket también comprueban reparto de tres y 15/15/15/5/0 con puestos 1/1/1/4/5. No asignan puntos ni alteran la instalación normal. El caso cinco empatados a 10 corresponde al ejemplo corregido por Arquitectura en dominio §24.2 el 05/10/2026.
10. Revisar 360/390/1280 px y teclado/tacto; mano variable con scroll contenido, revisión/resultados y observador. A los 30 minutos desde publicación final, una lectura nueva rechaza el resultado sin renovar; una copia ya abierta puede conservarse. Las comprobaciones automáticas del límite usan reloj controlado, no media hora real. Reiniciar borra memoria/identidad; F5 elimina mesa privada/resultado recuperable sin inventar causa o ganador.

Ante pérdida de confirmación de inicio/jugada/retorno, recuperar primero el estado; reintentar explícitamente conserva ID si sigue incierto. Recargar/reconectar nunca envía una acción automáticamente. Lectura de resultado fallida por red informa conexión, sin declarar caducidad, y permite reintentar. Registrar fecha, versión, perfiles, dispositivos, resultados y límites: estos recorridos automatizados no acreditan revisión humana ni móvil físico. Las evidencias históricas B06 se conservan en su especificación.

### Prueba manual B08: reloj, automático y ausencia

Usar la compilación vigente con los comandos anteriores, dos perfiles independientes A/B y una segunda pestaña del mismo perfil. Genérica 4 se selecciona explícitamente; no publicar ni sustituir fixtures en la instalación normal.

1. Configurar turno 15 s y revisión 5 s. Iniciar: ambas sesiones ven el mismo turno/plazo; 60 s se presenta como 01:00. Abrir Detalles no juega ni pausa. Dirección/carta se pueden escoger en ambos órdenes, sin botón de confirmación adicional.
2. Dejar vencer a B, incluso cerrando **todas sus pestañas** mientras A observa y el servidor sigue abierto. Registrar inicio/límite/observación. A recibe aviso durante cinco segundos; al recuperar la misma cookie B conserva mano/contexto y la advertencia propia de primer fallo. F5 no inicia otro plazo ni reproduce todos los avisos antiguos.
3. Cuando vuelva a tocarle B, completar manualmente una jugada válida antes del límite: desaparece la advertencia y contador propio pasa a 0. Una parcial, una lectura o un error no lo reinician. Carta solo local no cuenta para el timeout; dirección aceptada a tiempo sí.
4. En otra traza, dejar vencer dos turnos consecutivos de B sin una jugada manual suya entre ambos. El segundo movimiento es TIMEOUT; después juega AUTOMATIC. Todos ven «Automático»; B conserva su mano/Detalles sin acciones manuales y recibe aviso permanente, también tras F5/reconexión. Otra pestaña conectada conserva presencia; «Sin conexión» y «Automático» son estados distintos.
5. Mantener A jugando a tiempo: B puede ganar/abrir y conserva puntos. Si el timeout resuelve ronda, comprobar aviso de ganador/puntos junto al de vencimiento. Revisión positiva detiene el siguiente turno; revisión cero comunica antes de continuar y no añade una pausa artificial.
6. Ensayo de observador: A crea/desmarca «El anfitrión juega», B/C entran en sesiones independientes y A inicia con genérica 4 seleccionada. A no tiene mano/contador propio. Dejar vencer a B/C dos veces, o cerrar **todas** las pestañas después del inicio, sin apagar el servidor. Volver antes de caducar: ronda finalizada/puntuada/revisada y resultado «La partida terminó porque todos los jugadores humanos pasaron a automático». La presencia del observador no evita ese final; la ausencia del anfitrión no cierra IN_GAME.
7. Comprobar resultados, retorno en todas las pestañas de la sesión, «Ver último resultado» y otra sala sin reinicio. Lecturas/retorno no renuevan los 30 minutos. Reiniciar sirve para limpiar toda la memoria, no para acreditar recuperación.
8. Fase final/desempates se prueban aparte con trazas legales validadas: `npx playwright test tests/browser/timedGame.spec.ts --grep 'empatados legales'`. Cubren 2/5 empatados (mano 3/1) y revisión positiva antes de resultado por inactividad; dominio añade mano 2 y ACTIVE fuera de la lista de empatados. `npx vitest run server/domain/timedGame.test.ts server/application/timedGame.test.ts server/timedSocket.test.ts` comprueba conservación y plazos controlados. Un abandono corto de genérica no acredita fase final/desempate.
9. Probar 360/390/1280 px, teclado/tacto, foco/Detalles/scroll, aviso breve y advertencia persistente, cuenta atrás y cero sin red («Esperando actualización del servidor…»). No se envían ni encolan gestos al reconectar. Nombres repetidos usan sufijos; ningún contador privado ajeno aparece.

Registrar los recorridos humanos como realizados o pendientes. Las evidencias automatizadas B08 distinguen reloj controlado, HTTP/Socket.IO reales, entropía real y vencimiento real de 15 s con transporte cerrado. No acreditan media hora real, móvil físico, equilibrio o comprensión con usuarios. Vigilancia de dos minutos, nuevos niveles de bots y despliegue siguen pendientes; C09–C10 parciales.

## Probar el ciclo de vida de la espera

1. Crea una sala y entra con otro perfil. Abre una segunda pestaña del invitado: cerrar una conserva presencia mientras la otra esté conectada.
2. Interrumpe la conexión del invitado. La otra sesión ve «Reconectando». Si vuelve antes de 30 segundos desde la detección, conserva identidad/plaza/orden; después su plaza se libera y deberá entrar de nuevo.
3. Si vence la ausencia del anfitrión, todos vuelven a portada con el motivo. No se transfiere el control. Crear por HTTP sin socket del anfitrión concede el mismo margen inicial.
4. Sin cambios válidos aparece una franja al minuto 29 y la sala cierra al 30. Una nueva incorporación humana/bot, salida voluntaria, retirada explícita de bot, nombre realmente distinto o cambio efectivo aceptado de configuración/dificultad renueva. Leer, copiar, recargar, reconectar o repetir solicitudes no renueva; tampoco una retirada automática. Estos plazos solo rigen la espera.

Socket.IO usa `pingInterval=5000` y `pingTimeout=5000` ms. La reserva empieza cuando el servidor detecta la última pérdida; una red que deja de entregar paquetes puede añadir retraso de detección. El contador de caducidad usa referencia del servidor y tiempo monotónico transcurrido en el navegador: llegar a cero solo solicita confirmación. No hay controles públicos para acelerar estos plazos.

`NODE_ENV=production` exige HTTPS delante del servidor para que el navegador acepte la cookie `Secure`. El servidor escucha en `127.0.0.1` y está preparado para quedar detrás del proxy del despliegue futuro. Docker Compose, Caddy y el VPS pertenecen a hitos posteriores; este bloque no los despliega ni los acredita. GitHub Actions ejecuta las comprobaciones generales, incluida la preparación de barajas, y los recorridos Chrome existentes; las referencias y resultados reales de cada publicación constan en el documento operativo.

## Contrato HTTP actual

| Método y ruta | Uso |
|---|---|
| `GET /api/decks` | Resúmenes de barajas disponibles; no crea sesión ni renueva salas; `Cache-Control: no-store`. |
| `GET /api/rooms/current` | Establece sesión si falta; espera/partida/resultado vinculado o `null`; `ended` propio de espera y `lastResult?` todavía conservado. No-store. |
| `GET /api/results/:gameId` | Cookie de participante original; resultado conservado, no-store, sin vincular ni renovar; tercero 403, ausencia/vencimiento 404, sesión 401. |
| `POST /api/rooms` con `{}` | Crea una espera o recupera la sala/mesa ya vinculada al anfitrión. |
| `GET /api/rooms/:id` | Devuelve la sala a un participante reconocido. |
| `PATCH /api/rooms/:id/name` con `{ "name": "…" }` | Valida y cambia el nombre del solicitante reconocido. |
| `DELETE /api/rooms/:id` | Cierra la espera propia. |

Los fallos devuelven `{ "error": { "code": "…", "message": "…" } }`, con causas estables como `INVALID_INPUT`, `ROOM_NOT_AVAILABLE`, `FORBIDDEN` y `SESSION_REQUIRED`. No se transmiten trazas al navegador.

El canal Socket.IO conserva `room:resume`, `room:join`, `room:leave`, `room:configure`, `room:start` y sus eventos. B07 añade `game:opening-direction` (`{ requestId, roomId, gameId, roundNumber, turnId, direction }`), `game:play` (mismo contexto más `cardId`, dirección explícita para abridor y null para otros), `game:round-resolved`, `results:return-home` (`{ requestId, roomId, gameId }`) y `results:home` solo a la sesión solicitante. No existe HTTP de inicio/jugada ni control público de avance. B13 añade `game:cancel` con exactamente `{ requestId, roomId, gameId }`: solo el anfitrión original, ack RESULTS y motivo `HOST_CANCELLED`, sin parámetros de rol/puntos/motivo del cliente. Los IDs visibles no sustituyen la cookie. [B07 §5](docs/sdd/BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md) y [B13 §§4–5](docs/sdd/BLOQUE_13_CANCELACION_PARTIDA.md) fijan entradas, vistas, errores y dedupe.

B08 conserva esas entradas exactas y añade `game:turn-expired` deduplicado (contexto público, jugador y flag `automatic`), `TIMED_TURNS`, plazo público estable, `playStatus`, contador **solo propio** y modos TIMEOUT/AUTOMATIC. Añade errores PLAYER_AUTOMATIC/TURN_EXPIRED; una aceptación repetida devuelve la vista vigente sin reaplicar/resetear. [B08 §§5–6](docs/sdd/BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md) concreta mensajes seguros. No hay endpoints de timeout, automático, reloj o avance.

`WAITING` conserva su contrato/ciclo B03. `IN_GAME` fija preparación y publica únicamente mano propia, jugadas/indicadora públicas y parcial privada del abridor ACTIVE; `RESULTS` no incluye Game, manos, mazo, presencia ni cartas. Roster original autoriza lectura del resultado independientemente de la asociación activa liberada. Callbacks antiguos no avanzan otra revisión ni borran una sala nueva. Quedan pendientes vigilancia/retirada por ausencia del incremento correspondiente, nuevos niveles de bots, equilibrio y despliegue; no se arrastran reservas/cierres B03 a IN_GAME. B15 entrega la configuración compartida de representación y optimización descrita arriba.

## Probar B09: bots Fácil y Difícil

Desde la carpeta del repositorio: `npm ci` si faltan dependencias, `npm run check`, detener con Ctrl+C la instancia antigua y `npm run start`. Otra terminal del mismo directorio: `npm run test:browser`. Abrir `http://127.0.0.1:3000`. No hace falta ASSETS para construir/ejecutar; genérica formato 2/contenido 4 permanece disponible y verificada y cada sala empieza sin selección.

1. A crea sala. Añadir bot incorpora uno **Difícil**; repetir crea Bot 2. Elegir Fácil en una fila; otra pestaña de A comparte identidad y valores aceptados. B entra desde perfil independiente: consulta marcas/nombres/niveles, sin controles de bots. Plazas humanas reconectando siguen ocupadas; máximo cinco. El anfitrión jugador permanece al final.
2. Cambiar nombre abre el actual sin sufijo. Escribir y Cancelar/cerrar/Escape no envía. Aceptar valida trim/1–16 caracteres visibles; nombres repetidos tienen sufijos. Un error conserva borrador corregible. Cambiar ese bot desde la segunda pestaña conserva el borrador e informa del nombre vigente. Retirar es inmediato, libera solo su plaza y avisa cinco segundos con el nombre/sufijo anterior. Añadir después continúa Bot 3, sin reutilizar número.
3. Probar F5 y desconexión: recuperan aceptado sin reenvío. Si falta confirmación, recuperar estado y luego confirmar explícitamente el envío original; no enviar uno nuevo ni afirmar cancelación de lo ya enviado. Un diálogo incierto puede cerrarse y mantiene el aviso fuera. Una aceptación antigua no restaura un bot retirado ni una espera iniciada.
4. **Una persona contra bots:** sin B, A añade mezcla Fácil/Difícil, selecciona genérica v4, revisión 5 s (repetir con 0) e inicia. Primer bot incorporado abre solo; A recibe únicamente su mano. BF/BD identifica bots en mesa PC; móvil y resultados conservan Bot · Fácil/Difícil. No reloj humano, presencia o control manual del bot. Completar cada turno humano antes del límite; probar Detalles, ambos órdenes carta/dirección, varias pestañas y recarga. Se ejecutan reposición y tres rondas finales; resultados permiten volver al inicio y crear otra sala sin reiniciar.
5. **Observador:** A desmarca anfitrión juega y añade dos bots. Seleccionar baraja no permite iniciar: falta humano jugador. Retirar uno si hace falta y entrar B; A puede iniciar con B + bots si todos los humanos están conectados. A observa sin mano/score y no cuenta para inactividad. Verificar la misma ejecución y resultados.
6. **Timeout/automático:** configurar 15 s y dejar vencer un turno propio; primera advertencia se reinicia solo con manual completa válida. Segundo consecutivo pasa a automático permanente. Mano/Detalles siguen visibles, acciones deshabilitadas. Cerrar todas las pestañas, mantener servidor vivo y recuperar: termina ronda/revisión por todos HUMAN automáticos; los bots no prolongan la partida. En desempate ya iniciado se reconoce al vencedor sin puntos nuevos.
7. **Final/desempate determinista:** `npx playwright test tests/browser/bots.spec.ts --grep 'final/desempate legal'` usa paquetes/permutaciones temporales completos y actuaciones legales, nunca altera genérica. Cubre 2–5 mixtos, manos 3/2/1, cinco empatados a 10 y desempate solo entre bots con humano ACTIVE fuera. Una partida normal sin empate no acredita esa rama. `--grep 'inactividad|incierto|observador'` comprueba esos recorridos aparte con reloj sustituido o pérdida deliberada de ack.
8. Revisar 360/390/1280, teclado/tacto, foco al cerrar/retirar, errores/pending por control y scroll. Para limpiar todos los ensayos detenidos, reiniciar servidor: pierde toda memoria, sesiones y resultados. La retención de 30 minutos desde publicación final no se renueva por leer; las pruebas de ese borde usan tiempo controlado.

Registrar los recorridos humanos realizados o pendientes con fecha/versión/perfiles/dispositivos y resultados. La evidencia B09 distingue políticas/dominio, tiempo controlado, HTTP/Socket.IO reales, automatización Chrome y partida genérica 2 con reloj/planificador/entropía normales. No acredita media hora real, móviles físicos, equilibrio, comprensión con usuarios o despliegue; C09–C10 siguen parciales. Los recorridos humanos del autor permanecen pendientes hasta que se realicen.

### Operaciones de bots

`room:bot-add` recibe `{ requestId, roomId }` y crea HARD; `room:bot-difficulty` añade `botId, difficulty` (EASY/HARD); `room:bot-rename` añade `botId, name`; `room:bot-remove` añade solo `botId`. Todas las propiedades requeridas y ninguna adicional. Ack seguro `{ ok: true, room, botId }`; error BOT_NOT_AVAILABLE para objetivo humano/ajeno/retirado, permisos/fase/capacidad vigentes. Mismo ID/tipo/payload recupera aceptación con vista propia **del anfitrión**, incluso tras inicio/resultado, sin reinsertar o repetir actividad. Aviso BOT_REMOVED no simula salida humana. Vistas distinguen HUMAN/BOT y botDifficulty nulo/EASY/HARD; bot role/presence/playStatus nulos. Jugada pública añade modo BOT, turno bot timing/openingSelection nulos; la mano de bot nunca se envía. No HTTP ni endpoint para activar/avanzar bots. NORMAL, minúsculas, valores desconocidos, tipos incorrectos y campos ausentes/adicionales producen INVALID_INPUT sin cambiar nivel/plaza/orden/actividad.

Tras actualizar, detener la instancia anterior y arrancar la compilación vigente: el reinicio pierde salas/sesiones/resultados en memoria, sin migración de niveles. Un cliente antiguo que envíe NORMAL recibe rechazo; debe recargar el cliente actual. Las sesiones nuevas recuperan EASY/HARD con F5, reconexión y varias pestañas sin reiniciar el servidor.

## Revisar B11: mesa PC 02

La [evidencia B11](docs/sdd/BLOQUE_11_AJUSTE_MESA_PC_02.md#cierre-técnico--06102026) registra verificación técnica, medidas/capturas y límites históricos. La revisión vigente sigue B12, descrita debajo: cuatro cartas públicas completas y quinta lateral, encabezados compactos y scroll vertical permitido. El objetivo anterior B11 fue **1800×1600 CSS px al 100 %** y carta **230×321** en juego normal; una pantalla física de 1920×1080 no ofrece esa altura útil. No reducir zoom para simular el encuadre.

1. Desde esta carpeta ejecutar `npm run build` y `npm run start`; detener antes con Ctrl+C una instancia anterior si ocupa el puerto. Abrir `http://127.0.0.1:3000` con perfiles A/B independientes y una segunda pestaña de A. Seleccionar genérica 4 explícitamente, turno 60 s y revisión 5 s; iniciar con ambos conectados. Reiniciar pierde toda la memoria; F5 conserva la misma partida.
2. A zoom100 %, registrar área útil real del navegador, pantalla/escala/barras y versión. Revisar jugadores/Mesa arriba e indicadora/mano/turno debajo: cartas completas, datos de baraja/ronda/mazo, acciones exteriores, reloj, dirección y leyenda. En PC el abridor está sombreado, «Juega» identifica al activo y BF/BD significa bot Fácil/Difícil. No se destaca la mejor carta.
3. Probar carta→dirección y dirección→carta; la pulsación o Enter/Espacio en «Jugar carta» actúa una vez. Detalles/Escape devuelve foco y no juega; arrastrar/deslizar tampoco. Comparar icono propio con fila naranja activa, y repetir con 1-58/Dato fijado desde una espera nueva; Detalles siempre informativo sin J. Revisar privacidad/selección propia, F5/otra pestaña, reloj sin reinicio, revisión y mano variable. Completar turnos a tiempo; para repetir tras resultados, volver al inicio y crear otra sala.
4. Añadir jugadores/bots Fácil/Difícil hasta cinco plazas para revisar cinco cartas públicas. Para observador usar A observando y B/C jugadores desde perfiles independientes: A no tiene mano, aparece aparte con (O) y «Observando». Repetir revisión con 0 y comprobar avisos de ganador/timeout/automático sin ocultar datos.
5. Abrir las capturas equivalentes [anteriores](playwright-report/b11/before/5-subsequent-viewport.png) y [posteriores](playwright-report/b11/after/5-subsequent-viewport.png), además de los demás pares/JSON del cierre. Se generan localmente; no forman parte del clon Git. Registrar conformidad visual o diferencias y el scroll observado en el equipo real. A 390×844 y 1280×800 se conserva acceso, con scroll vertical residual; textos excepcionales pueden aumentar altura de carta sin recortar unidades ni reducir imágenes/letra.

Reproducir comprobaciones B11 y regresiones seleccionadas sobre la compilación vigente:

```powershell
npm run check
npm run test:browser -- --workers=2 tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/bots.spec.ts
```

La automatización usa viewport de referencia y conexiones reales con tiempo sustituido en los casos de comparación; otros recorridos normales usan adaptadores/entropía normales. No acredita una prueba humana, dispositivos físicos o encuadre en otras resoluciones. Las adaptaciones siguientes necesitan su acuerdo y C09–C10 siguen parciales.

## Revisar B12: mesa centrada 03

La aprobación visual del autor queda separada de la [evidencia técnica B12](docs/sdd/BLOQUE_12_MESA_CENTRADA_03.md). No configurar una altura artificial ni ocultar barras para aparentar encuadre; registrar área real y zoom 100 %. El modo centrado necesita 1400 px útiles, considerando la barra vertical. Si falta ancho, mantiene la adaptación anterior.

1. Compilar con `npm run build`, detener con Ctrl+C una instancia anterior si ocupa el puerto 3000 y arrancar `npm run start`. Abrir `http://127.0.0.1:3000` en dos perfiles independientes A/B y otra pestaña del mismo perfil A. Genérica 4 se selecciona explícitamente; turno de 60 s y revisión de 30 s facilitan consultar sin alterar los plazos del producto. Reiniciar pierde memoria; F5 recupera la misma partida.
2. Con ancho suficiente, revisar contenedor centrado de 1400 px, cuadrícula de 1368 y carta de 230×321. Indicadora/mano tienen cartas alineadas, «Tu mano» centrado y ya no hay línea «Atributo indicador: …» sobre la indicadora. Atributo activo, valor elegido/unidades/icono propio y Detalles informativo siguen completos.
3. Probar las aperturas carta→dirección y dirección→carta, botón exterior/Enter/Espacio y Detalles/Escape. La parcial recuperada en otra pestaña no juega ni renueva el reloj; ningún gesto de consulta envía cartas. Comprobar turno posterior y mano en adquisición, también con una/dos cartas.
4. Para cinco jugadores, añadir invitados o bots con los controles existentes. En turno, cuatro jugadas públicas caben enteras y se ordenan por J del atributo activo: ALTO descendente/BAJO ascendente. Autores permanecen unidos a su carta; no se anuncia un ganador provisional.
5. Con quinta jugada, Mesa conserva ancho y muestra «5 cartas · desliza →». Llegar a «Cartas públicas de Mesa» con Tab y usar flechas horizontales hasta consultar la quinta/autor/Detalles. Probar rueda horizontal o gesto táctil; mano/página no se desplazan horizontalmente ni se juega. Abrir Detalles, incorporar una jugada desde otra sesión y cerrar: misma carta y retorno de foco. Durante revisión el orden corresponde al ranking confirmado.
6. Recargar A/B y usar otra pestaña: misma partida/orden/identidad, sin enviar otra jugada ni reiniciar plazos. Repetir con revisión de cero segundos y positiva. Para observador, A observa, B/C juegan desde perfiles independientes: estado ocupa cuatro columnas y A no tiene mano/acciones ficticias.
7. Comparar [antes](playwright-report/b12/before/1920x1080-turn-full.png) y [después](playwright-report/b12/after/1920x1080-turn-full.png), además de revisión/quinta y JSON del cierre. Artefactos locales ignorados; no vienen en el clon Git. Registrar versión, viewport/pantalla/escala/barras, aprobación o diferencias visuales y desplazamiento residual. Las muestras automatizadas de 1920×1080/950 no acreditan una pantalla física del autor ni un encuadre universal.

Comprobaciones seleccionadas sobre build vigente:

```powershell
npm run check
npm run test:browser -- --workers=2 tests/browser/centeredTable03.spec.ts tests/browser/pcTable02.spec.ts tests/browser/tableLayout.spec.ts tests/browser/initialGame.spec.ts tests/browser/manualGame.spec.ts tests/browser/timedGame.spec.ts tests/browser/bots.spec.ts
```

E1/E2 de orden y los estados comparables se reproducen con genérica 2 copiada a una instalación temporal y una permutación legal sustituida; no se modifica contenido editorial ni se publica esa instalación. Las conexiones son reales y los plazos controlados. Otras regresiones usan adaptadores/entropía normales. Prueba humana, equipo físico y aprobación visual se registran solo cuando se realicen. C09–C10 continúan parciales.

## Revisar B17: carta normal, D y Detalles

Usa el runtime de Requisitos y la compilación actual (`npm run build`, después `npm run start`). Si usas Node portable, su carpeta debe estar al principio del PATH de esa misma terminal: la versión de `node` usada por npm y sus procesos hijos debe ser 24.19.0, ICU 78.3/Unicode 17. No basta con ejecutar únicamente npm con una ruta a Node y dejar otro Node primero en PATH.

1. Crea una espera y entra desde un segundo navegador/perfil independiente; una segunda pestaña del mismo perfil es la misma persona. Selecciona explícitamente Criaturas Mágicas v2, genérica v4 o Sistema Solar v4. Repite con «1-58»/«Dato» y con optimización desactivada/activada. Las salas empiezan sin baraja.
2. En PC (1320×850 o 1920×1080 CSS px, zoom 100 %), revisa indicadora, mano y Mesa durante turno/revisión. La carta completa mantiene imagen proporcional, título de una línea, tres filas, activo sombreado y símbolo propio independiente. Los nombres cortos mantienen el tamaño base y los largos usan el mayor tamaño que cabe hasta 12; si a 12 no caben, solo el título se corta visualmente, con nombre completo accesible y en Detalles. D es la consulta; «Jugar carta» sigue fuera. Comprueba Tritón, Grifo y 67P cuando salgan, y genérica sin imagen. Las imágenes de la misma fila deben comenzar alineadas, sin tabla sobre Jugar.
3. Abre D por clic, Enter y Space, también después de aceptar ALTO/BAJO sin carta. Debe abrir Detalles sin seleccionar ni jugar ni renovar el plazo. Arrastra sobre la carta/D para desplazarte: no debe jugar ni abrir consulta accidentalmente. Prueba el envío habitual desde la superficie/Jugar.
4. En Detalles, comprueba imagen grande íntegra, dato/unidad sin J, característica/nota e Información anidada. Escape cierra un nivel; el foco vuelve a su control. Redimensiona con Detalles abierto: vuelve al control equivalente de esa carta. Si otra pestaña juega esa carta o el servidor avanza, vuelve a la región de mano, sin enfocar otra carta.
5. En 390×844 y 360×800, activa optimización para ver la minicarta conservada (miniatura de 32 px y «Detalles» inferior). La consulta de indicadora desde el resumen usa carta completa/D; su Detalles vuelve a la consulta padre. Desactiva optimización para revisar la cara normal adaptada, con desplazamiento vertical permitido. Mesa y mano mantienen carruseles independientes; con cinco jugadas la quinta se consulta también por teclado.
6. Recarga ambos navegadores y comprueba identidad/mesa/plazo. Cancela mediante el anfitrión y crea otra sala: ninguna consulta o respuesta de A debe contaminar B. No reinicies servicios ajenos para limpiar este recorrido.

Las [capturas y medidas B17](docs/sdd/evidencias/B17/README.md) son de producto automatizado local, con escenas legales y tiempo/permutación controlados salvo el recorrido normal identificado. No sustituyen tu aprobación visual, dispositivos físicos ni pruebas con usuarios. El fallo de descarga de imagen se provoca solo en la prueba de navegador, sin tocar paquetes.

La [evidencia separada de la adenda](docs/sdd/evidencias/B17/adenda-20261017/README.md) conserva el antes/después, los fallos de desarrollo y las comprobaciones finales de títulos, cara completa y clic/avance. Prueba también resize, fuentes tardías y **emulación CSS** 125/200 %; el zoom nativo del navegador y la revisión humana siguen pendientes. Para la revisión humana, cambia el zoom real a 125/200 %, abre Detalles si el título se corta y verifica tabla, D, foco y Jugar sin pausar el plazo. No interpreta la emulación como prueba en un dispositivo físico ni como aprobación visual.

## Prueba manual B13: cancelación y otra sala

Recepción humana12/10: el autor comunica prueba satisfactoria con anfitrión solo y anfitrión más invitado, control exclusivo y recepción inmediata. Los pasos siguientes conservan la guía completa; los escenarios no comunicados siguen pendientes. [B13 §11](docs/sdd/BLOQUE_13_CANCELACION_PARTIDA.md#11-recepción-y-preparación-de-publicación--12102026) separa esa recepción del cierre local11/10 y de la nueva publicación.

1. Desde esta carpeta: `npm run check`, detener la instancia anterior propia y ejecutar `npm run start`. Abrir dos perfiles/sesiones independientes A y B en `http://127.0.0.1:3000`; una segunda pestaña de A comparte su sesión.
2. A crea, B entra, A selecciona explícitamente genérica 4 y configura revisión 5 s. Iniciar con ambos conectados. Solo A tiene «Cancelar partida» arriba a la derecha. Abrir el diálogo: foco inicial «Seguir jugando». Escape y esa acción cierran sin enviar; el reloj, bots y jugadas siguen funcionando mientras está abierto.
3. Confirmar antes de resolver la primera ronda: ambos perfiles y ambas pestañas de A reciben «Partida cancelada por el anfitrión», «Puntuaciones parciales», cero puntos y «Puntos de rondas ya resueltas. No hay ganador.». No hay puestos, victoria, mano ni jugadas privadas. Repetir tras una ronda resuelta y durante su revisión: conserva únicamente sus puntos. Probar también con A observador, B jugador y un bot Fácil/Difícil; A puede cancelar sin turno o control manual.
4. Antes de volver al inicio, abrir otra pestaña de A en la portada: puede crear B; un invitado también puede crear/entrar en otra sala. La pestaña que consulta el resumen A conserva acceso autorizado, sin reactivar su asociación. La URL antigua de sala recupera la asociación actual o portada, nunca la mesa cancelada. F5 en `/resultado/<gameId>` recupera el resumen mientras esté disponible.
5. Sin B activa, «Volver al inicio» en una pestaña de A lleva sus otras pestañas del mismo resumen al inicio; el invitado mantiene su resumen. «Ver último resultado» permite consultarlo otra vez. Con B activa, un retorno viejo no abandona B: recupera su estado vigente.
6. Si falta confirmación, el diálogo informa incertidumbre y ofrece «Recuperar estado de la partida». Recuperar primero; no asumir éxito ni caducidad por un fallo de red. Solo si el servidor mantiene esa partida se permite reintentar explícitamente el mismo envío. Cerrar tras el fallo no afirma que se haya anulado un envío ya realizado. Desconectado no envía.
7. Terminar B de forma ordinaria y, en otro ensayo, por automático. A caducada o sus respuestas antiguas no deben añadir avisos al resultado B. Cada resumen vence a los 30 minutos desde su propia publicación, sin renovar por consultas, recargas o replays. Las pruebas automáticas de estos bordes usan reloj controlado; no acreditan media hora real. Reiniciar pierde toda memoria.

Revisar teclado, diálogo, foco y resumen en escritorio y móvil; registrar versión, fecha, perfiles y resultados. Estos pasos quedan pendientes de ejecución humana hasta que el autor los realice. No incorporan abandono individual, revancha o vigilancia técnica. C09–C10, dispositivos físicos y aprobación visual humana continúan parciales/pendientes.

### Prueba manual B22: Modelos de IA y dos sesiones

Con Node24.19.0 fijado y la compilación actual, arrancar una instancia propia en puerto libre, sin detener servidores existentes. El catálogo debe mostrar cuatro y la sala empezar sin selección.

1. Dos perfiles independientes: crear/entrar; seleccionar Modelos de IA — Edición 2026 v2 como HOST. Revisar portada e instrucciones exactas; invitado solo consulta. Cambiar/quitar/volver a seleccionar, F5 y comprobar identidad/opciones conservadas.
2. Antes de iniciar, elegir1–58 o Dato y optimización. Revisar normal y compacta en instancias/partidas nuevas: fechas literales, Contexto/unidad tk, títulos largos, Información y notas completas en Detalles sin J. La consulta no juega; Escape devuelve foco. Los dos paneles compactos conservan la cota vigente, Mesa/mano sus scrolls independientes.
3. Una persona con EASY/HARD, revisión0 o positiva según ensayo: jugar a tiempo hasta resultado, F5 en otra pestaña, volver al inicio y crear otra sala sin selección. La partida normal no garantiza que aparezcan todos los casos de texto; sus escenas dirigidas están separadas en la evidencia.
4. Solo ensayo estadístico SYNTHETIC aislado: verificar la dimensión existente CONFIGURATION/package=modelos-ia-2026:2:2. No habilitar recogida real para probar esta incorporación.

Revisión humana pendiente hasta realizarla. No se acredita finalidad formativa, exactitud científica, equilibrio, dispositivos físicos, Linux/imagen o despliegue mediante estos pasos escritos.
