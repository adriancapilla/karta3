# B21 — Sustitución de la analítica por agregados

**20/10/2026. Estado:** especificación de la alternativa A actualizada con la conclusión del responsable y la cautela de transición confirmada. Condiciones por familia cerradas; código, limpieza, pruebas, alineación y operación pendientes. Este documento no autoriza su ejecución.

**Base leída:** `E:\KARTA3\KARTA3_IA\APP\karta3`, `main`, HEAD `565795ce53d095ab05ff73880b4398be082c9f22`. B21 libre. Conservar los cinco documentos ya modificados —B19, B20, proceso y dos documentos operativos B19— y la propuesta agregada no registrada. No cambiar rama/checkouts ni restaurar versiones.

## 1. Acuerdos, fuentes y precedencia

El autor aprueba sustituir íntegramente el subsistema sobre el producto actual, comenzar las estadísticas nuevas desde cero y prescindir de compatibilidad/histórico anterior. Se admiten actualización con interrupción, pérdidas declaradas y reversión de versión. **Borrar datos requiere otro encargo delimitado.** No reconstruir desde antes de B18.

Fuentes: [AGENTS](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), [proceso](PROCESO_SDD.md), [propuesta anterior](PROPUESTA_ANALITICA_AGREGADA_ARQ_2026_10_20.md), evaluación A/B de este hilo y elección posterior del autor, y ARQ-AGREGADOS-2026-10-20: [Aplicación §16.4](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) e [Infraestructura §§12.3/14.2/15.3](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md). Sus métricas/fórmulas conservadas se citan por referencia. Las simplificaciones posteriores del autor prevalecen sobre conservación de histórico, lectores múltiples y cursor/reintentos; [texto de alineación](TRASLADO_ARQUITECTURA_B21_ANALITICA_AGREGADA.md). No editar TFM; registrar recepción antes de verificar globalmente B21.

Estados distintos: B19 desplegado con aceptación individual; B20/adenda comprobados localmente y alineados20/10, con Linux/publicación/despliegue pendientes; AGG_DAILY_V1 futuro. Evidencias antiguas no prueban B21. La estimación inicial21–34h correspondía a la sustitución sin un control específico de consentimiento. La conclusión recibida añade separación de permiso de apariencia y la cautela de transición: **24–40 horas-persona orientativas** —implementación14–24, limpieza3–5, verificación7–11—, incremento3–6h para controles, admisión selectiva y pruebas. No restaura el subsistema antiguo ni implica nuevo archivo de recibos, migración, dos despliegues o investigación jurídica. No es autorización ni plazo de agente;54–96h corresponde al alcance anterior descartado.

**Decisiones recibidas:** consultas/CSV privados por días UTC cerrados, revisión antes de compartir, sin supresión automática por umbral ni afirmación de anonimato; control en «Analítica y privacidad» y cookie funcional de doce meses. La [conclusión aportada por el autor](DECISION_CONDICIONES_B21_2026_10_20.md) cierra las familias: ocho de servidor y HOME por defecto bajo sus condiciones; APPEARANCE con consentimiento previo. También confirma la cautela para sesiones anteriores sin nueva preferencia (§6). No queda otra aprobación jurídica genérica a cargo de Implementación.

| Familias | Condición efectiva adoptada |
|---|---|
| CREATION, JOIN, WAITING, GAME, CONFIGURATION, DURATION, AUTOMATIC, QUALITY | Interés legítimo según la ponderación del responsable; hechos ya conocidos por el servidor, sin nuevos envíos/lecturas del navegador para estas familias. Información y exclusión. |
| HOME | Conclusión aplicada de medición de audiencia: solo presentación de portada, sin identificación, vinculación posterior o seguimiento WordPress→APP; información y exclusión. |
| APPEARANCE | Consentimiento previo específico. Sin él no consultar/transmitir el estado con finalidad estadística. Mantener marginales y matriz, sin condicionarle las otras familias o la apariencia funcional. |

**Conservar:** juego, reglas, barajas, privacidad, permisos, dedupe funcional, plazos, recuperación/T04, cancelación, apariencia/persistencia local B20 y adenda visual. Fuera: nuevas métricas, dashboard, cuentas, WordPress, cambios de diseño, refactorización general, publicación/despliegue/activación o borrado de datos desde este encargo.

## 2. Modelo, métricas y datos que dejan de obtenerse

Modelo único nuevo **AGG_DAILY_V1**. No modo LEGACY, conversión o ingesta doble. Mantener nueve consultas fijas, con significado del nuevo modelo:

| Consulta | Datos y fórmula finales |
|---|---|
| `access` | Vistas registradas de portada, reducidas a contador diario. Presentación real visible, no GET, health, recursos, personas únicas o visitas recurrentes. |
| `creation` | Salas nuevas confirmadas por día; recuperar una existente no suma. Sin pulsaciones/intenciones ni conversión sobre formularios. |
| `joining` | NEW_JOIN/EXISTING_PARTICIPATION/REJECTED por día de resultado. Distribuciones sobre operaciones resueltas; causas marginales sobre rechazos, no sobre visitantes. |
| `room-conversion` | Cohorte de creación: C=S+W+P+U+X; conversión S/C. P provisional; U/X/pérdidas que comprometan la cohorte→tasa null. No llamar abandono a cierre, espera o desconocido. |
| `configuration` | Histogramas independientes de configuración aceptada al inicio; frecuencia de categoría/base observada de esa dimensión. No snapshot durable o cruces. |
| `completion` | Cohorte de inicio: G=finales+A+U+X; normal/finales confirmados, con motivos, activas y cobertura. No sustituir por normal/G ni ofrecer tasa completa con pérdidas/cortes. |
| `duration` | Día de final confirmado, cantidad/suma/media de segundos y siete bins de Aplicación16.4.2; cantidad/suma también por motivo, sin motivo×bin. Sin min/max o duración individual. |
| `automatic` | Cohorte de inicio: humanos jugadores base y transiciones únicas a automático; incidencia sobre esa base, provisional con activas y null para cobertura comprometida. No bots/observador ni abandono supuesto. |
| `appearance` | Cohorte de inicio: cinco categorías, marginales START/END, matriz5×5 y cobertura de §5. No cambios intermedios o tiempo por tema. |

Dimensiones de configuración cerradas, según Aplicación16.4.2: paquete `(deckId,schemaVersion,contentVersion)` —única categoría editorial compuesta—; humanos jugadores/observadores, bots/jugadores totales; cantidades EASY y HARD en histogramas distintos; hostPlays; turnSeconds15/30/60; reviewSeconds0/2/5/10/15/30; forceTieBreak; attributeValueMode PLAY_VALUE/DISPLAY_VALUE; optimizeForMobile. Solo valores funcionalmente admitidos. La apariencia no entra en configuración compartida.

En las fórmulas, C=creadas, S=iniciadas, W=cerradas sin iniciar, P=pendientes, U=desconocidas y X=cobertura cortada; G=inicios de partida y A=activas. Finales separados DECK_COMPLETED, HOST_CANCELLED, NO_ACTIVE_HUMAN_PLAYERS y TECHNICAL_INTERRUPTION. Los tres cierres conocidos de espera son HOST_CLOSED, HOST_DISCONNECTED e INACTIVITY, sin sumarlos otra vez a W. Mantener estos balances por cohorte, sin listas persistentes de sus miembros.

Cardinalidad: máximo 64 categorías de paquete/versiones por día; superar el presupuesto omite solo esa dimensión con calidad, sin alterar el catálogo ni rechazar juego. Cada histograma escalar íntegro suma sus inicios observados; el omitido conserva su propio denominador/cobertura. No agrupar paquetes diferentes en una categoría silenciosa.

Agrupar rechazos como INPUT, AVAILABILITY_OR_PHASE, CAPACITY, IDENTITY_OR_PERMISSION, CONFLICT o TECHNICAL con la correspondencia normativa; no mensajes ni código introducido. Una nueva recuperación legítima puede contar como operación; repetir requestId no. Rechazo no observado no se inventa. Datos del navegador pueden faltar o ser manipulados; no constituyen atención, personas reales o cobertura exhaustiva.

Se retiran historial de visitas/intenciones, recorridos individuales, recibos nuevos, referencias/correlaciones durables, snapshots, fotografías vinculadas, min/max, exactitud entre procesos y comparación con series antiguas. **Se mantiene la métrica agregada de vistas de portada:** retirar sus identificadores no autoriza a suprimirla. El nuevo día cero se determinará al actualizar; ningún contador empieza con cifras antiguas.

## 3. Frontera de datos y persistencia

**Archivo nuevo:** `<directorio-privado>/<entorno>/<human|synthetic>/agg-daily-v1.sqlite`, esquema propio1/modelo AGG_DAILY_V1; jamás abrir/migrar `usage.sqlite`. La elección de nombre no cambia ningún archivo ahora. No nuevas dependencias: Node/SQLite/worker existentes.

Lista durable cerrada:

- `cells`: clave `(day,family,dimension,category,measure)`, valor entero. Día UTC `YYYY-MM-DD`; family/dimension/category/measure de catálogo cerrado. Enteros exactos dentro de Number.MAX_SAFE_INTEGER, sin redondeo; contadores/sumas no negativos, balances admiten deltas negativos pero nunca saldo final negativo.
- `coverage_days`: día/familia y estado de instrumentación, observación parcial, pausa, desconocido o pérdida de cantidad desconocida. Calidad con causas técnicas enumeradas y cantidades solo cuando conocidas.
- `metadata`: modelo/esquema/dimensiones/bins, entorno/tráfico, frontera diaria, último día administrativo comprometido, limpia/sucia, fechas administrativas de mantenimiento/copia/restauración. **Sin cursor durable**, historial de lotes o bootRef estadístico.

Familias: HOME, CREATION, JOIN, WAITING, GAME, CONFIGURATION, DURATION, AUTOMATIC, APPEARANCE y QUALITY. Celdas de contadores/balances según §2 y Aplicación16.4.1; duración por total, motivo o bin; apariencia por población, START, END o par. No combinar dimensiones salvo paquete editorial y par START×END. Categorías nuevas requieren contrato, no etiquetas libres.

Prohibido en DB, mensajes al writer, WAL, temporales, exportaciones, copias y logs ordinarios: eventId/visitId/intentId/ref, roomId/gameId/participationId, sus hashes, tokens, cookie/sesión, nombres, IP/dispositivo, cartas/manos, snapshot completo, mensajes crudos o fechas exactas de operaciones. Los datos funcionales para autorizar permanecen solo en transporte/RAM. WAL técnico solo tiene páginas agregadas, no se archiva ni se consulta como cronología. No prometer anonimato por este esquema o por usar RAM.

RAM mínima y acotada: exclusión funcional; ciclo y cohorte; reloj monotónico de inicio; roster humano mínimo; marcas de automático/START/END y categoría START; oportunidades y dedupe transitorio. No identidad estadística nueva, vínculos entre visitas/salas o historial de jugadas. Límite4096 ciclos,2h por ciclo observado;4096 oportunidades de10s. Espera termina al iniciar/cerrar y partida abre su ciclo; límites no se renuevan por lecturas/recargas. Vencerlos corta medición con calidad, nunca Game. Resultados30min no prolongan la correlación.

## 4. Reducción, lote único y pérdidas

### 4.1 Normal

1. Registrar primero decisión y dedupe funcional. El reductor de aplicación observa una vez, antes de difusión y sin await/SQL/IO. Descompone la configuración en histogramas **antes del puerto**.
2. Preparar unidad atómica de deltas y reservarla completa. Solo después avanzar correlación RAM. Por ejemplo inicio: P−1/S+1 de espera y G/A/configuración/base humana/población de partida en la misma unidad. La falta de permiso de apariencia no rechaza esa unidad de servidor; no adjuntar fotos o elecciones del permiso. No guardar unidades individuales en un log durable.
3. Cola máxima2048 entradas agregadas y2MiB, contando pendiente/vuelo/MessagePort; reserva1024 para servidor. Un lote≤64 entradas, cada250ms como máximo mientras el writer esté disponible; no dividir una unidad. Máximo un lote en vuelo. No expulsar una unidad ya admitida para hacer hueco.
4. Writer exclusivo, transacción para todas las celdas/balances/calidad de un lote. Ack solo después de COMMIT. Identificador de RPC/generación de worker solo RAM; no cursor o clave durable de dedupe.
5. Primera captura/operación admitida marca dedupe RAM. BROWSER202 significa cola, no durabilidad; jamás esperar una estadística para aceptar juego. Duración monotónica desde inicio hasta RESULTS incluye revisión/desempate y excluye retención; truncar a segundos una vez. Bins:0–<60,60–<180,180–<300,300–<600,600–<1200,1200–<2400,≥2400.

### 4.2 Error o compromiso incierto

**No reenviar ningún lote fallido o incierto.** Se elimina el reintento1/5/30s del modelo anterior junto con el cursor. Si hubo COMMIT y se perdió el ack, el prefijo durable conserva ese lote; si no, no aparece. No intentar decidirlo con IDs/hashes/journals nuevos.

Pasos obligatorios: pausar admisión; invalidar correlación/ventanas; descartar cola y vuelo RAM sin reejecución; ignorar callbacks de generaciones antiguas. Antes de cualquier saneamiento, cerrar/terminar y acreditar la salida del escritor anterior y obtener exclusión mutua; nunca dos escritores. Si no puede acreditarse, seguir pausado. No reiniciar ni detener Game para arreglar estadística.

Con almacenamiento sano y writer exclusivo, una transacción reclasifica **solo los saldos abiertos durables** como U/calidad y los deja a cero. Preserva altas, marginales y finales comprometidos; no agrega un lote descartado para reconstruirlos. Marcar días potencialmente afectados entre último día administrativo durable y recuperación como incompletos, sin contar pérdidas de cantidad desconocida como cero. Reanudar la medición compartida solo en salas nuevas y sus partidas posteriores; no instrumentar a media espera o partida lo que sobrevivió en Game/RAM. Las lecturas administrativas vuelven cuando el almacén esté saneado; no terminales huérfanos o backfill.

Recuperación técnica acotada: un intento de reapertura/saneamiento por incidencia después de liberar writer; si falla, estado PAUSED hasta reintento administrativo o rearranque. No bucle ilimitado, nuevo servicio de vigilancia o garantía de continuidad. Los fallos antes de admitir una foto pueden dejar ausencia sin romper balances; perder una transición causal corta su ciclo o pausa global si no se delimita con seguridad.

### 4.3 Reinicio, parada y balances

Un nuevo proceso sanea siempre saldos abiertos antes de admitir ciclos, porque Game/RAM no se recuperan. Movimiento atómico `pending/active→unknown`, con marca de integridad; repetir con saldos ya cero no suma U otra vez. Lo mismo para humanos base abiertos y población de apariencia pendiente, sin reducir sus denominadores originales. Ante saldo negativo o incoherencia: error/pausa, no ajuste artificial.

Parada controlada con RAM válida puede registrar TECHNICAL_INTERRUPTION y duración estadística; no produce resultado Game o END. Espera no se convierte en cierre voluntario. Drenaje≤2s; lo que no confirme no se declara recuperado. Un crash puede perder tanto pendientes como su último contador de descarte; conservar calidad incierta aunque el último estado de salud fuese cero.

Límites conservados como presupuestos verificables, no capacidad acreditada: edad de cola60s; DB512MiB, WAL64MiB, reserva128MiB/aviso80%, heap worker128MiB, lectura5s. Saturación/corrupción/espacio solo pausan estadística. Puede haber un hueco mayor durante la indisponibilidad; se declara, no se promete pérdida limitada a250ms o RPO fijo.

## 5. Apariencia y vistas de portada

### 5.1 Consentimiento exclusivo de apariencia

En «Analítica y privacidad», bloque separado «Estadísticas de apariencia»: explicación breve, «Permitir» y «No permitir» con relevancia equivalente; con permiso, «Retirar permiso». No modal obligatorio, permiso del HOST por los demás o efecto sobre juego/tema/núcleo/HOME. Texto: «Con tu permiso, medimos qué apariencia utilizas al entrar en una partida y al recibir su final, y comparamos esos dos momentos. No registramos cada cambio. Puedes jugar y cambiar de apariencia sin permitirlo». Conservar la información específica de menores de la versión actual, sin añadir edad, cuentas o prometer su verificación.

Reutilizar como detalle técnico la vigencia funcional anterior: máximo12h desde acción expresa, aviso actual y sesión RAM propia, sin renovación por consultas, recargas o reintentos. Estado inicial UNDECIDED; GRANTED solo tras confirmación del servidor; DECLINED o retirada impiden captura. Cambio material de aviso, reinicio o pérdida del estado→sin permiso, nunca concesión automática. No nuevo almacenamiento persistente del permiso ni lector de recibos anteriores. Documentar texto/versionado y funcionamiento del control mediante código/pruebas; no afirmar que una evidencia de proceso sea un recibo individual almacenado.

Contrato cerrado nuevo `GET/PUT /api/statistics/appearance-permission`, sesión funcional/origen/no-store y límites del control de §6. PUT≤1KiB `{decision:GRANT|DECLINE|WITHDRAW,noticeVersion,expectedRevision,requestId}`; respuesta `{version:1,state:UNDECIDED|GRANTED|DECLINED,noticeVersion,revision,validUntil}`. Revisiones/tiempos los decide servidor solo RAM; GRANT exige aviso/revisión vigentes. Restricción prevalece sobre respuesta antigua; replay no amplía12h; fallos no conceden. Sin tokens de permiso o ids enviados a SQLite. Pestañas comparten estado funcional del servidor; desconexión suspende captura hasta reconciliarlo. No reintento automático de concesión incierta. Retirada corta primero local/RAM y se muestra pendiente si falta confirmación, sin exigir writer/SQLite.

Antes de consultar `currentAppearance()` **con finalidad estadística**, comprobar permiso confirmado vigente, no exclusión y ventana viva; volver a comprobarlos en servidor al admitir. Leer el tema para dibujar o recordar la preferencia funcional sigue permitido y separado. No captura previa, buffer retrospectivo, deducción desde CSS ni envío a la espera de una autorización. Eliminar categoría START/ventanas al retirar/caducar para impedir nuevos pares; los agregados ya admitidos permanecen. Retirar afecta solo a apariencia propia, no corta núcleo/HOME ni las fotos de otros; la exclusión general de §6 sí conserva su alcance compartido.

GRANT tardío nunca crea START; puede permitir END sin START si hay transición final viva y ciclo aún observable. Tras retirada/caducidad de un permiso usado en una participación, no reabrir la medición de esa participación aunque se vuelva a conceder: se aplicará a participaciones futuras. No contar permisos/rechazos/retiradas como métricas nuevas.

### 5.2 Fotografías y cobertura

Categorías exactamente `L0=LIGHT/DEFAULT`, `L1=LIGHT/EXPLICIT`, `D1=DARK/EXPLICIT`, `C1=CREAM/EXPLICIT`, `H1=HIGH_CONTRAST/EXPLICIT`. LIGHT elegido no equivale al predeterminado; START=END no acredita ausencia de cambios intermedios. No otros DEFAULT, bot u observador.

En inicio nuevo instrumentado: N y pendientes por jugadores HUMAN. START admisible incrementa S[i] y conserva i solo en RAM hasta END/corte/límite. Vencer el token START no borra una categoría admitida. END incrementa E[j] y, si existe START, M[i,j]; resuelve pendiente y elimina vínculo. Al cerrar ventana final sin END queda ausencia; corte/pérdida lleva pendientes a X/U, sin sumar N otra vez. Mantener25 pares, incluidos iguales, y marginales aunque no haya pareja.

N procede de la población humana ya conocida por servidor al iniciar un ciclo observable, no de consultar preferencias o contar aceptaciones. S/E/Q describen capturas consentidas y recibidas; una ausencia no se clasifica como rechazo o retirada, ni se rellena Claro. La cobertura no prueba fallos de entrega: puede incluir falta de permiso. No publicar cuántos aceptan/rechazan ni presentar las distribuciones como toda la audiencia.

S=ΣS[i], E=ΣE[j], Q=ΣM[i,j]; soloInicio=S−Q, soloFinal=E−Q, ninguno=N−S−E+Q. Pending/U/X califican cobertura, no son sumandos extra de esa identidad. START/S, END/E, pares/Q y coberturas S/N,E/N,Q/N usan bases independientes; cero→null. Dato no instrumentado no entra en N ni se rellena Claro. Anomalía→null/calidad.

Reutilizar el protocolo B20 de transición viva, valor congelado, conexión original y10s; separar captura de preferencia funcional. F5/resume, lectura tardía de resultado o reconexión no crean START/END; desconectar/excluir/OFF invalida oportunidades. Persona automática conectada sigue siendo jugador. Parada técnica sin final visible no fabrica END. Conservar T04: metadata de A no reaplica A sobre una sala B, incluso si el ack y evento llegan en distinto orden.

DTO nuevo `POST /api/statistics/appearance`: `{version:1,gameId,moment,windowToken,theme,origin}`; tipos/longitudes actuales de gameId/token, enums exactos, mismo origen y sesión/participación/conexión acreditadas. Comprobar permiso de apariencia vigente además de elegibilidad/exclusión, sin admitir a bots/observador. Sin eventId/visitId; esos campos funcionales desaparecen al reducir. Primera admisión por participación/momento gana; reintento HTTP acotado puede repetir la captura bajo la misma ventana y permiso válidos, **no un lote SQL**. Respuestas202 cola,204 ignorado/duplicado/no elegible/sin permiso,400/401/403/413/429/503 según causa; nunca datos ajenos.

### 5.3 HOME sin correlación de visitas

DTO nuevo `POST /api/statistics/home-view`: `{version:1}`. Cliente envía una vez por entrada visible real a HomeScreen **ya resuelta la recuperación inicial y la preferencia**; rerender/StrictMode o ocultar/mostrar la misma entrada no suma; F5/retorno SPA que presentan portada sí. Documento oculto difiere ese primer envío hasta mostrarse, sin medir atención o tiempo visible. Sin UUID/documentId/URL/referrer; sin reintento automático ante respuesta incierta. HTTP aceptado registrado no demuestra persona única o entrega completa. `/privacidad`, carga de recursos y recuperar una partida sin mostrar portada no suman. No vincular a sesión, sala, partida, apariencia, WordPress o futura visita.

Ingesta≤2KiB y techo global120/s, ráfaga240. HOME no crea mapas por sesión/visita/IP, no recupera una identidad ni conserva contexto para otra presentación. El control funcional puede resolver exclusión/cautela antes de admitir y entregar únicamente un sí/no al contador, sin adjuntar identidad al hecho o conservar una relación HOME→sesión. No usar cabeceras/cookies como dimensiones o logs estadísticos. Apariencia sí necesita acreditar funcionalmente su participación, sin trasladarla al writer. El cliente no acredita por sí solo un permiso. Emisiones apagadas/excluidas no generan peticiones de medición; sin permiso de apariencia no hay consultas/envíos estadísticos de tema.

## 6. Exclusión funcional confirmada

Ubicación confirmada: zona existente **«Analítica y privacidad»**, fuera de resumen/Mesa/mano; conservar enlace a información independiente. El control general Aceptar/Rechazar/Retirar de B19 se sustituye por «Excluir mi actividad de las estadísticas» o «Volver a incluir mi actividad». El consentimiento específico de apariencia de §5.1 se presenta separado, no se elimina. No nueva configuración de Room/Game, banner bloqueante o permiso ficticio. Informar de estado local/servidor, pendiente/error y alcance personal sin publicar la elección a otros. Volver a incluir no concede consentimiento de apariencia.

Cookie propia `karta3_statistics_exclusion`, valor cerrado versión1+booleano (`1:1` o `1:0`), sin id o fechas dentro del valor, host propio/Path=/, Secure y SameSite=Lax. Expiración fija a doce meses de calendario desde **elección**, sin renovación por leer o repetir. Puede ser leída para respetar la preferencia; no usarla como identidad o dimensión. Sin elección válida no escribir automáticamente `1:0`. Invalidación/cookie corrupta/operación pendiente no levantan una restricción. Sin almacenamiento: memoria documento/sesión funcional e información de alcance, no impedir jugar.

`GET /api/statistics/exclusion` y `PUT` propios, no-store y origen/contexto funcional. PUT cerrado `{excluded:boolean,expectedRevision:number,requestId:string}`≤1KiB; revisión entera y requestId funcional1..100, acotados en RAM. Respuesta `{version:1,excluded,revision,persistence:COOKIE_REQUESTED|MEMORY_ONLY}` confirma el corte servidor, no la aceptación de Set-Cookie por el navegador; verificar lectura/devolución antes de prometer recuerdo. Sin recibo, prueba de aceptación o SQLite para confirmar.

Presupuesto común de controles funcionales —exclusión y permiso de apariencia—: 60/minuto por sesión, ráfaga10; techo global120/s, ráfaga240; máximo4096 estados y64 solicitudes de dedupe por estado. Saturar bloquea nuevas concesiones, nunca un corte restrictivo local/RAM o una jugada. Sin mapas de visitantes ni estas claves en estadística. La cautela se comunica además como `eligibility:DEFAULT_ALLOWED|EXCLUDED|PENDING_LEGACY_CHOICE` en la vista de exclusión, nunca como dimensión del informe.

Excluir corta localmente de inmediato y envía señal booleana entre pestañas del origen; servidor ordena el corte RAM antes de200, invalida ventanas y comunica a sus pestañas. Una restricción válida prevalece incluso sobre revisión antigua. Quitarla exige revisión vigente y acción expresa; conflicto409→consultar/reintentar. Respuesta/señal antigua no reactiva; señal de quitar solo pide releer estado confirmado. Control inaccesible por otros participantes, aunque sean HOST.

Desconectado: «Exclusión aplicada aquí; pendiente de confirmar en el servidor». No prometer corte en otras conexiones aisladas. Recuperar exige reconciliar preferencia/estado antes de nuevas mediciones propias; reintento explícito del control sin cola durable. Si no se puede garantizar el corte RAM, pausar medición afectada/global y mantener pendiente. Apariencia funcional y juego siguen disponibles.

Ámbito compartido: basta un HUMAN incorporado/reservado, incluido HOST observador, para cortar irrevocablemente el ciclo de espera/partida y sus futuras contribuciones, fotos incluidas. Bots no eligen exclusión. Ciclo que nace excluido no suma una alta, N o «rechazo estadístico»; ya observado pasa a X conservando base. Salir/quitar exclusión/cambiar rol no lo reabre; tampoco iniciar una partida desde esa espera cortada. Otra sala nueva puede ser elegible. Operación JOIN propia no excluida puede contar como marginal sin referencia a sala excluida.

Unidades admitidas antes del corte son anteriores aunque se escriban luego; no localizar/restar contribuciones mezcladas ni esperar una barrera durable. Si el delta de corte no cabe, cortar RAM igualmente, pausar y sanear saldos durables antes de reanudar. La confirmación no acredita borrado retroactivo, anonimato o escritura. No trasladar recibos anteriores o reconstruir RAM perdida.

**Transición confirmada por el autor:** si al primer contacto existe cookie funcional anterior y no hay nueva preferencia válida, estado `PENDING_LEGACY_CHOICE`: no medición propia ni compartida hasta incluirse/excluirse expresamente en el nuevo control. Mostrar «Confirma si quieres incluir tu actividad en las nuevas estadísticas o excluirla. Puedes seguir jugando sin decidir». Incluye HOME y apariencia; no fabricar elección o prorrogar un permiso B19. Incluir escribe la nueva preferencia `1:0`, excluir `1:1`, con plazo acordado; ninguna concede permiso de apariencia. Respetar inmediatamente cualquier exclusión válida conocida, local o del servidor. Una preferencia corrupta permanece restrictiva, no se toma como ausencia válida.

Las sesiones realmente nuevas, sin cookie previa, mantienen el régimen por defecto. Distinguirlas por el establecimiento funcional de este proceso, solo RAM, sin crear un identificador estadístico o persistir la antigüedad. F5/pestañas reconocidas por esa sesión RAM no convierten una nueva en antigua. Tras perder RAM, una cookie existente sin nueva preferencia exige de nuevo la cautela: puede limitar cobertura, se acepta y no se interpreta como abandono. Si el alcance es ambiguo se restringe, no se presupone inclusión. Un ciclo nacido o cortado en ese estado no se abre a mitad del recorrido al elegir después; solo operaciones propias futuras y salas nuevas. Esta decisión sustituye expresamente la cláusula inicial que descartaba cautela por cookie antigua; no exige lectores, migración, carga de recibos o un despliegue público previo.

## 7. Cohortes, consultas y conservación

Aplicar días UTC `[00:00,siguiente00:00)`: hechos de creación/JOIN por resultado; espera por creación; configuración/terminal/automático/apariencia por inicio; duración por fin. Ejemplo: creaciónD1, inicioD2 y finD3 actualizan S enD1, G/configuración/terminal enD2 y duración enD3. No dividir contadores de cohortes distintas para una tasa.

Política confirmada: consultas/CSV **privados por días UTC cerrados**, sin cruces ni umbral automático. Rango contiguo de días completos, `to≤hoy00:00UTC`; sin día actual, horas o columnas libres. Un día de cohorte cerrado puede actualizarse por finales dentro del límite de correlación; informar `asOf`, pendientes/provisional y calidad. Revisión del responsable antes de compartir resultados; no declarar anónimos SQLite o CSV por ser privados o agregados.

CLI conserva nombres útiles `usage:report`/`:synthetic`, `usage:maintain`, `usage:backup`, `usage:restore`, **implementados solo para AGG_DAILY_V1**. Mismos filtros cerrados report/from/to/environment/format, HUMAN ordinario y SYNTHETIC separado; sin `--model`, SQL o rutas arbitrarias. Administración SO/SSH y archivos privados, no HOST, dashboard o API de informes. Lector de solo lectura con snapshot≤5s y sin actuar como segundo writer.

JSON/CSV incluyen modelo/esquema/informe1, entorno/tráfico, periodo/granularidad/cohorte, unidad/resolución, cantidades/bases/porcentajes null, pendientes/U/X, calidad, frontera diaria y `asOf` administrativo. Estados distintos: VALUE, ZERO, NOT_CAPTURED, NOT_INSTRUMENTED, UNAVAILABLE; no cero ante error o pérdida. Neutralizar fórmulas CSV. `configuration` y `appearance` usan sus denominadores por distribución, no una razón global impuesta. No min/max ni pareo posterior con datos externos.

Conservación: mes UTC actual+once anteriores, no365d; purga de celdas/cobertura, exportaciones y copias caducadas, transaccional/repetible. No detalle90d o recibos nuevos. OFF conserva mantenimiento del nuevo almacén existente, no crea vacío ni reabre captura. Archivo inesperado/antiguo/corrupto o falta donde se esperaba→error seguro; inicializar archivo nuevo solo de forma explícita en preparación.

Copia básica: snapshot privado→SQLite limpia solo de agregados/cobertura/metadatos→AES-256-GCM con clave de archivo privado separado; siete rotatorias. No WAL archivado o temporales con eventos. Restaurar en destino aislado/no sobreescritura, verificar modelo/entorno/tráfico/plazos y reclasificar abiertos como desconocidos una sola vez; nunca iniciar recogida por restaurar. No recupera relaciones, cola, Game o datos no respaldados. Mantener Hostinger/mecanismos útiles sin Windows/DPAPI, descargas diarias o nuevo circuito obligatorio; no inventar RPO.

## 8. Información pública y operación propuestas

Identidad/contacto conocidos se conservan: **Adrián Capilla López**, **k3k314com@gmail.com**. Aviso candidato nuevo `2026-10-20.2`, reservado documentalmente, no ejecutado ni publicado. No reinterpretar los avisos B19/B20 como autorización de AGG. La conclusión recibida cierra base/condiciones por familia; Implementación debe plasmar este tratamiento y verificar concordancia factual, no encargar otra conclusión jurídica general.

Primera capa candidata: «KARTA3 utiliza estadísticas agregadas de uso para mejorar el servicio y evaluar el TFM. Puedes excluir tu actividad sin dejar de jugar. Solo medimos la apariencia de inicio y final con tu permiso. Consulta los detalles en Analítica y privacidad».

Contenido ampliado que debe quedar completo antes de activación:

> El responsable es Adrián Capilla López; contacto: k3k314com@gmail.com. La finalidad es conocer volumen, configuraciones utilizadas, dificultades operativas y terminación para mejorar KARTA3 y documentar su evaluación en el TFM, sin evaluar capacidad, rendimiento escolar, salud o personalidad ni tomar decisiones sobre jugadores.
>
> Las métricas de salas y entradas, opciones de inicio, partidas, duración, finalización, automático y calidad se apoyan en el interés legítimo y la ponderación adoptada para este alcance limitado. Proceden de hechos que el servidor ya conoce para jugar. La portada se mide mediante un contador de presentaciones, bajo las condiciones de medición de audiencia adoptadas: sin identificar visitas o relacionarlas con sesiones, partidas u otros sitios. Una recarga puede sumar otra presentación; no medimos personas únicas o recurrencia.
>
> Solo con tu consentimiento previo medimos qué tema utiliza cada jugador humano y si era predeterminado o elegido al entrar en la mesa inicial y recibir su final, y la distribución agregada de esos pares. Puedes permitirlo, no permitirlo o retirar el permiso desde «Estadísticas de apariencia». El permiso dura como máximo doce horas en la sesión funcional y se pierde al reiniciar el servicio o cambiar el aviso. No registramos cada cambio ni tiempo por tema; bots y observadores no aportan fotografías. No reconstruimos el inicio si permites después, ni el final si no llega la comunicación. Puedes jugar y elegir cualquier apariencia sin permitir esta medición. Retirar ese permiso no desactiva las otras métricas; excluir las estadísticas sí detiene futuras contribuciones de ambas.
>
> Usamos temporalmente el contexto mínimo en memoria para contar una sola vez y relacionar los dos momentos. Guardamos únicamente contadores y distribuciones por día, sin historial individual de visitas, salas, partidas o fotografías. La correlación tiene un máximo de dos horas por ciclo y las oportunidades de captura duran diez segundos. Las pérdidas/reinicios se señalan y pueden dejar huecos. Los agregados no se presentan como necesariamente anónimos por su estructura.
>
> Puedes excluir tu actividad desde «Analítica y privacidad». Recordamos solo esa preferencia funcional en este origen durante doce meses desde tu elección, sin renovarla por consultas; no se comparte entre dispositivos/perfiles. Si falla el almacenamiento, explicamos el alcance temporal disponible. Sin conexión, el corte local queda pendiente de confirmación del servidor. La exclusión de un humano también interrumpe futuras contribuciones del ciclo compartido, sin revelar quién lo solicitó. Quitarla afecta solo a operaciones futuras y ciclos nuevos.
>
> Las contribuciones admitidas antes del corte pueden guardarse después; no conservamos enlaces para localizar una contribución individual dentro del agregado. Los informes son privados y revisamos las salidas antes de compartirlas. Conservamos el mes UTC actual y los once anteriores, también al gestionar copias y exportaciones. El modelo comienza desde cero; los datos anteriores no se convierten o suman a esta serie. La preferencia de apariencia y el juego funcionan al excluir las estadísticas.

> Si traes una sesión anterior y no tenemos la nueva preferencia, no medimos hasta que elijas incluirte o excluirte; tampoco usamos una aceptación anterior como permiso nuevo de apariencia. No es obligatorio decidir para jugar. La cookie técnica del juego permite recuperar la sesión y es distinta de la preferencia funcional de exclusión y de las estadísticas. Los registros técnicos del servidor y proveedor tienen otra finalidad y no se reutilizan como audiencia. Puedes contactar con el responsable para ejercer los derechos aplicables, o reclamar ante la AEPD; no prometemos localizar una contribución individual que ya no conservamos vinculada.

Conservar del aviso factual vigente alojamiento/destinatarios/Hostinger, plazos reales de registros, derechos y cautela de menores en lo que siga siendo exacto; adaptar la base por familia y retirar afirmaciones de eventos/recibos90d o consentimiento global. No inventar datos operativos. Revisar técnicamente enlaces, texto/accesibilidad y concordancia con el tratamiento al implementar. No llamar consentimiento a no excluir, ni presentar esta recepción como activación o cumplimiento técnico demostrado.

Configuración futura mínima: `KARTA3_ENV` explícito; `KARTA3_STATISTICS_MODE=aggregate|off|synthetic`; directorio absoluto privado y archivo privado de clave de copia. La versión finalmente autorizada usa `aggregate` por defecto en su instalación de Pruebas preparada; no ampliar producción. `synthetic` solo test, datos separados; automatizaciones/carga no contaminan HUMAN. OFF es contingencia y mantiene mantenimiento nuevo. Falta/invalidez de entorno/directorio/clave/info técnica completa o almacenamiento→estadística indisponible/pausada, juego disponible. Configuración no demuestra aprobación jurídica/operativa; no crear variables «legal approved» ni controles de activación para jugadores.

No exige actualización pública previa OFF→HUMAN: una única actualización al modo aprobado tras autorización independiente. Los ensayos locales usan datos fabricados. La ruta de información respeta B20 sin montar flujo de juego, sesión o visita por el mero acceso; el control explícito puede guardar su preferencia funcional. Logs: códigos técnicos cerrados, aviso≤1/minuto/causa y salud RAM acotada; sin cuerpos, ids, cookies o stacks con payloads. No importar logs del proxy como analítica.

## 9. Inventario de sustitución y retirada obligatoria

| Acción | Áreas/archivos existentes | Resultado verificable |
|---|---|---|
| Conservar | `server/domain`, barajas, `src/appearance.ts`, `AppearanceControl.tsx`, `appearance.css`, contratos de valores de apariencia, GameCard y adenda | Mismas reglas, datos, temas, dimensiones, botones y persistencia visual. No rehacer B20. |
| Conservar salvaguardas | `socketRooms.ts` cierre de transporte, `main.ts` parada; `roomUseCases.ts` no sobrescribir JOIN existente; no-store/archivos privados y T04 | Retirar un import estadístico no revierte esas protecciones, su foco o pruebas funcionales. |
| Adaptar | Enganches en `roomUseCases`, `waitingLifecycle`, `gameCoordinator`, `createApp/main`; conexiones/metadata por destinatario; `appearanceSnapshots` y ventanas | Puertos nuevos reciben contexto transitorio y entregan deltas. No IO síncrono o referencia a modelos antiguos. |
| Sustituir | `application/usage/recording`, `projections`, `reports`, `query`, `contracts`, `appearanceReport/Windows` estadísticos | Reductor/correlación/consultas nuevas. Pueden cambiar nombres; una carpeta existente no permite conservar semántica obsoleta. |
| Sustituir/retirar resto | `infrastructure/usage` store/schema/reader/worker/http/eventValidation/choice privacyStore; `composition/usage*` | Un único esquema nuevo, sin lectores1/2/3, migradores, eventos/sujetos/dedupe durable/recibos. Reutilizar primitivas útiles de permisos/lease/cifrado, no sus dependencias legacy. |
| Sustituir controles antiguos | `UsageChoiceControl`, `useUsageChoice`, `application/usage/choice`, `src/usage.ts` de visitas/intenciones y `shared/contracts/usage.ts` | Exclusión general y consentimiento de apariencia separados. Reutilizar validación/revisión/12h/pestañas útiles, sin consentimiento global o recibos individuales durables. DTO nuevos, sin modelos viejos activos. |
| Retirar rutas y sobres | `/api/usage/events`, `/api/usage/choice`, `usage:choice`, X-Karta3-Usage-Context/Collection y usageContext de creación/JOIN | No alias o adaptación silenciosa del modelo viejo. Eliminar emisores y receptores juntos; proteger operaciones de juego y no reenviar sus errores como estadística inválida. |
| Reemplazar pruebas obsoletas | Tests de esquemas antiguos, recibos/barrera/visitas/intenciones y sus fixtures; arneses usageCompiled/appearanceBrowser y estadísticas navegador | Quitar pruebas de contratos eliminados y añadir las garantías nuevas, sin suprimir regresiones independientes. No mantener mocks que obliguen a conservar interfaces muertas. |
| Adaptar herramientas reales | `tools/ci-usage*.mjs/.sh`, ci-image/workflow, deploy/usage*.example/compose, npm scripts, README/operación y mapa APP | Verificadores del modelo nuevo, volumen/permisos/copia; sin asserts sobre recibos/schema2/3 o backups antiguos. No borrar puertas Linux por ser antiguas. |
| Retirar instrucciones activas obsoletas | Guías/comandos de aceptación, migración/lector antiguo, mode flags o herramientas sin consumidores | Guías nuevas canónicas; anteriores quedan identificadas como históricas y enlazadas. Git y evidencias permanecen íntegros. |

Organización propuesta acotada: aplicación/infraestructura bajo `statistics`, contratos `shared/contracts/statistics.ts`, composición `statistics*.ts`, cliente `statistics.ts`/control propio; se admite reutilizar nombres locales si la retirada completa y la revisión de dependencias lo demuestran. No duplicar ambos subsistemas o puertos «compatibles con todo». Node/SQLite ya disponibles; no añadir paquetes para aparentar arquitectura. Auditar dependencias reales y retirar solo las que queden sin uso; no retirar herramientas de barajas/imagen.

Puerta de limpieza: búsqueda de consumidores y compilación desde salida limpia, comprobando `dist`, `dist-server`, imagen y scripts para que no incluyan módulos eliminados. Limpiar artefactos generados de la compilación no autoriza borrar DB, secretos o datos del autor. Actualizar instrucciones APP, no cierres/historial o fuentes TFM.

## 10. Preparación posterior, datos antiguos y reversión

**No ejecutar desde B21 documental ni desde el encargo de código sin otra autorización operativa.** Procedimiento a entregar al responsable:

1. Identificar fuente/imagen/configuración anterior y objetivo; confirmar modo, aviso, condiciones recibidas de §1/§5/§6, volumen y ubicación nueva. Verificar cautela de cookie anterior y ausencia de concesión de apariencia heredada. Nuevo archivo inicializado explícitamente desde cero; no usar la ruta vieja ni autodetectar/converter su esquema.
2. Actualización única con interrupción admitida: detener versión anterior, configurar la nueva directamente al modo aprobado y arrancar. No doble ingesta o migración. Registrar día de comienzo, parcialidad y hueco; comprobar juego/privacidad/consultas sin afirmar cifras previas.
3. Si falla, detener nueva versión y volver a imagen/configuración anterior con su ubicación/formato compatible; si no se conserva almacenamiento antiguo, recuperar juego con analítica OFF o un archivo vacío del formato de esa versión expresamente preparado. **Nunca abrir AGG con el ejecutable anterior** ni convertir no-exclusión en aceptación B19.
4. Tras validación y autorización expresa de borrado: inventariar rutas absolutas reales de DB antiguas/WAL/SHM/journal, exportaciones, copias propias y tareas asociadas. Resolver/verificar que cada objetivo queda en el directorio autorizado; detener cualquier escritor/lector que lo use. Revisar por separado retención/copia Hostinger: no prometer borrado de proveedor por quitar un archivo local.
5. Ejecutar solo el inventario aprobado, con registro de qué se retiró y sin exponer datos/secretos. Excluir nueva DB/clave, barajas, juego, Git y evidencias. Comprobar que no quedan tareas apuntando a lo retirado. Suprimir después el inventario sensible de operación según el procedimiento responsable, no copiar contenido de las bases al cierre.

No conservar lector antiguo en el producto nuevo para soportar rollback. Recuperación es del paquete anterior y su almacenamiento separado; una vez borrados datos antiguos no se recupera ese histórico. Se acepta esa pérdida, no borrado de versiones Git o capacidad de volver al juego anterior. No exigir descarga diaria/Windows, alta disponibilidad o dos despliegues públicos.

## 11. Responsabilidades y comprobaciones futuras

Aplicación: catálogo, elegibilidad/exclusión, correlación y reductor/fórmulas; puertos de admisión, lectura y mantenimiento. Infraestructura: cookie/transportes, cola/SQL/worker, archivos/copia. Composición elige adaptadores/configuración. Cliente captura/presenta control, sin autoridad de juego; shared solo DTO puros. Dominio independiente. Revisión automática de imports/ciclos más semántica, no interfaces vacías o motor genérico.

| Criterio | Verificación prevista, todavía no ejecutada |
|---|---|
| A01 — Correctitud | Reductor: alta/recuperación/rechazo, inicio, cierres/terminales, configuración, automático único; unidades completas y balances C/G/H/población sin negativos. |
| A02 — Fechas | CreaciónD1/inicioD2/finD3, fronterasUTC, truncado y siete bins; consultas cerradas, bases/null/provisional correctos. |
| A03 — Escritura | SQLite real temporal: transacción completa/rollback, un vuelo, ack perdido sin replay, callback antiguo, cola llena y writer ausente/corrupto; pausa/saneamiento idempotente y solo ciclos nuevos. |
| A04 — Reinicio | Kill de proceso aislado y reinicio, saldos abiertos→unknown una vez; parada controlada/drain2s y calidad sin inventar fin o duración. Diferenciar reloj controlado de caída real. |
| A05 — Exclusión/transición | Propia/compartida/observador/reservados; pestañas/offline, duplicados y respuestas antiguas, cookie inválida/bloqueada y quitar exclusión. Cookie anterior sin nueva preferencia→sin medición hasta elegir; sesión nueva por defecto, B19 nunca otorga permiso nuevo. Sin reapertura o dependencia SQLite. |
| A06 — Navegador | Portada una vez por presentación, rerender/StrictMode, F5/retorno y documento oculto; privacidad/recuperación de partida no cuentan. Sin UUID, enlace HOME→sesión/sala/otra visita o reintento incierto. Ocho familias de servidor sin nuevos emisores browser. |
| A07 — Apariencia consentida | Permitir/no permitir/retirar/caducar12h, versión nueva/reinicio, conflictos y pestañas: sin lectura estadística o transmisión antes de GRANTED. Núcleo/HOME independientes; exclusión general prevalece. Cinco categorías/25 pares, diagonal, START/END aislados/ausentes, N conocido/no inferir rechazos; permiso tardío sin START, ventanas10s, desconexión/F5/consulta tardía y valores congelados. |
| A08 — Privacidad | Inspeccionar contratos hacia worker, esquema/tablas/SQLite/WAL, logs capturados, CSV y copia descifrada/restaurada con señuelos fabricados: sin detalle/ref/hash/fotos vinculadas. No afirmar anonimato residual por una búsqueda negativa. |
| A09 — Operación nueva | Metadatos/entornos/HUMAN-SYNTHETIC, permisos/volumen, consultas privadas, doce meses/purga repetida, copia7/restore aislado y regreso a paquete separado; no lector/migración legacy. |
| A10 — Producto/limpieza | Dos sesiones/pestañas; partida y cancelación con fallos estadísticos inducidos; T04 y reconexión durante cierre, no sobrescribir JOIN; apariencia/adenda funcional intactas y artefactos sin módulos retirados. |

Fases y puerta final en [encargo](PROMPT_IMPLEMENTACION_BLOQUE_21.md): pruebas puras y SQLite/worker focales durante el cambio; navegador pertinente compilado para exclusión/home/fotos y regresiones afectadas. Al cierre, `npm run check` una vez sobre fuente final y navegador afectado; tras reparaciones repetir solo puertas invalidadas. GitHub conserva CI completa/fuente-main/imagen y Linux/volumen/copia correspondientes en su encargo posterior. No baterías completas en cada fase, corpus de barajas/Unicode rutinario o dos despliegues OFF→HUMAN.

Las condiciones por familia están decididas por la conclusión recibida; las pruebas acreditarán su implementación, no otra aprobación jurídica genérica. La revisión del responsable antes de compartir cifras escasas se mantiene. Mantener evidencias de producto, tiempos controlados, sistema real aislado, Linux y revisión humana diferenciadas. El bloque no completa C09–C10 ni pendientes B20 por redactarlo.

## 12. Decisiones cerradas, pasos pendientes y cierre

Decisiones cerradas20/10: núcleo de servidor y HOME por defecto bajo condiciones recibidas; APPEARANCE con consentimiento previo; diario privado/revisión antes de compartir; zona actual/cookie doce meses; cautela para sesiones anteriores sin nueva preferencia. [Registro de recepción](DECISION_CONDICIONES_B21_2026_10_20.md). No queda la consulta de familias o una «aprobación RGPD» genérica pendiente. No reabrirlas con Implementación.

1. **Revisión documental del autor y autorización de código:** este texto concreta la separación de consentimiento y la cautela acordadas, con el ajuste de coste de §1; no las ha programado.
2. **Alineación y verificación factual:** trasladar el texto a Arquitectura mediante el autor, implementar/probar el contrato y el aviso candidato §8, registrar recepción y evidencia real. No delegar nueva investigación jurídica o asumir comprobado el diseño por documentarlo.
3. **Paquete y operación posteriores:** autorizar publicación/actualización y, por separado, borrado delimitado. Aplicar directamente el régimen aprobado en una actualización, no una recogida general de apariencia. Preparación operativa y aceptación de producto no son nuevos acuerdos funcionales pendientes.

**Autonomía del implementador tras autorización:** estructura local, nombres, SQL/índices y organización de pruebas compatibles; adaptar primitivas útiles y retirar consumidores muertos. Volver al autor ante cambio material de datos, métricas, condiciones, reglas o diseño. No interpretar rangos de coste o este prompt como autorización.

Entrega actual: especificación, inventario/retirada, [encargo por fases](PROMPT_IMPLEMENTACION_BLOQUE_21.md) y [alineación concreta](TRASLADO_ARQUITECTURA_B21_ANALITICA_AGREGADA.md), enlazados desde el proceso. Solo lectura/redacción y comprobación documental; sin código, datos, pruebas de producto, versiones ejecutadas, commits, servidores, TFM, publicación o activación. A01–A10 pendientes. Tras entregar, SDD se detiene antes de implementar.
