# Propuesta SDD — Revisión de analítica agregada

**Referencia:** ARQ-AGREGADOS-2026-10-20. **Fecha:** 20/10/2026. **Estado:** especificación y estimación propuestas, pendientes de las decisiones de §10. No es un encargo ejecutable ni autoriza código, migración, pruebas de producto, publicación o recogida por defecto. No reserva un nuevo número de bloque antes de revisar alcance/coste.

## 1. Base y precedencia

Proyecto único `E:\KARTA3\KARTA3_IA\APP\karta3`, rama `main`, HEAD observado `565795ce53d095ab05ff73880b4398be082c9f22`. Cambios previos conservados: B19, B20, proceso, `ANALITICA_USO.md` y `PREPARACION_ANALITICA_REAL_B19.md`. Sin ramas/checkouts, instalaciones, cambios de versiones existentes o fuentes TFM.

Norma principal: [Aplicación §16.4, especialmente §16.4.10](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) e [Infraestructura §§12.3, 14.2 y 15.3](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md). Definen inventario, fórmulas, exclusión, límites y condiciones pendientes; se aplican por referencia, no se sustituyen por esta propuesta. [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md) y [organización APP](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) gobiernan las dependencias.

| Estado que se debe conservar | Alcance de su evidencia |
|---|---|
| B19 desplegado | Aceptación individual, aviso2026-10-19.2, producto main3d0d189 según recepción normativa; no equivale a AGG_DAILY_V1. No se inspecciona ni cambia el VPS aquí. |
| B20/adenda locales | Esquema3, dos fotos consentidas, apariencia funcional y correcciones visuales implementadas; alineación recibida20/10 según Aplicación17.14/Infraestructura16.11. Linux/CI/publicación/despliegue pendientes. Los cierres APP que decían alineación pendiente son históricos de su fecha. |
| AGG_DAILY_V1 | Modelo futuro sin código, datos, fecha de cobertura o autorización. La inacción no es consentimiento; alojamiento propio, RAM o agregación no demuestran exención ni anonimato. |

Consultar [B18](BLOQUE_18_ANALITICA_BASICA_USO.md), [B19 vigente](BLOQUE_19_HABILITACION_ANALITICA_REAL.md), [B20](BLOQUE_20_APARIENCIA_PERSONAL_Y_USO.md), [adenda visual](ADENDA_B20_SELECTOR_Y_ACCIONES_DETALLES.md), [operación](../operacion/ANALITICA_USO.md) y [apariencia](../operacion/APARIENCIA_B20.md). Se conserva su histórico; no se reetiqueta como muestra del modelo futuro.

**Objetivo propuesto:** métricas básicas justificadas por familia, con información/exclusión, reducción antes de persistir y acceso administrativo acotado. Juego, sesiones y resultados jugables permanecen RAM y ajenos a fallos estadísticos. Fuera: cambios visuales B20, reglas, barajas, bots, cuentas, dispositivo/recurrencia, WordPress, dashboard, observabilidad general o una refactorización transversal.

## 2. Correspondencia e impacto

| Elemento actual | Reutilizar | Sustituir / dejar de producir en el modelo nuevo | Áreas afectadas y riesgo principal |
|---|---|---|---|
| Hechos de juego `UsageRecording` | Enganches tras decisión/dedupe, Clock y estados conocidos | Referencias estadísticas/sobre `UsageEvent` por reducción de celdas; sin eventos nuevos detallados | `application/usage/recording.ts`, enganches RoomUseCases/GameCoordinator. Riesgo: doble conteo o trabajo estadístico dentro de decisión de juego. |
| Contratos BROWSER/`usageContext` | Autorización funcional, origen y límites | Intenciones, visitas/eventId/intentId; no generar su sobre en AGG | `shared/contracts/usage.ts`, `src/usage.ts`, api/socket y HTTP. Riesgo: conservar emisiones ocultas del modo anterior. |
| Aceptación/recibos B19 | Mantenimiento y lectura del histórico bajo sus condiciones | Para familias justificadas por otra base: control funcional de exclusión, sin nuevos recibos o barrera durable por persona | `choice.ts`, controles/transportes/composición. Riesgo: interpretar ausencia de exclusión como consentimiento o perder restricciones conocidas. |
| Proyecciones individuales | Fórmulas y categorías pertinentes | `Subject` durable, snapshots/personas/parejas; correlación exclusivamente RAM | `projections.ts`, `reports.ts`, `appearanceReport.ts`. Riesgo: denominadores incoherentes después de pérdidas. |
| Cola/worker | Aislamiento, cotas, lease y disciplina de fallos | Cola de eventos/flags personales por cola de deltas indivisibles y cursor global | `sqliteWorker.ts`, `worker.ts`. Riesgo: pérdida del prefijo causal; no trasladar sin más la expulsión actual de eventos BROWSER admitidos. |
| SQLite actual1/2/3 | Lector/mantenimiento compatibles y permisos | Almacén AGG separado; sin `events`, dedupe individual, `subjects` o recibos nuevos | `schema.ts`, `sqliteStore.ts`, `sqliteReader.ts`. Riesgo: escribir modelo nuevo en archivo histórico o duplicar reconciliación. |
| Apariencia funcional | `appearance.ts`, selector/paletas, preferencia y geometría íntegros | Solo instrumentación: ventanas con contexto funcional RAM y reducción S/E/M antes del escritor | `appearanceWindows.ts`, `appearanceSnapshots.ts`, transporte estadístico. Riesgo: perder marginales sin pareja o reconstruir final tardío. |
| Informes/CSV | Administración SO/SSH, consultas cerradas, CSV seguro | DTO/modelo explícitos, marginales/bins, política de escasez; sin min/max ni cruces | `query.ts`, lectores/CLI/exportación. Riesgo: comparar series distintas o revelar celdas mediante restas. |
| Copias/operación | Volumen privado, cifrado, rotación, Hostinger, mantenimiento | Respaldo del nuevo archivo con agregados/cobertura y compatibilidad declarada | `backups.ts`, archivos privados, `composition/usage*.ts`, documentación. Riesgo: restaurar pendientes como activos o prolongar conservación. |

No se cambia `src/appearance.css`, distribución de controles, acción D, imágenes, contenido o dimensiones para realizar esta revisión. Los puertos anteriores permanecen donde sean necesarios para histórico/compatibilidad; no se les hace aceptar objetos de ambos modelos sin discriminador.

## 3. Contrato agregado propuesto

### 3.1 Identidad y celdas

Discriminador obligatorio `model: AGG_DAILY_V1`, contrato de dimensiones/bins **versión1**. Propuesta física: `<directorio-privado>/<entorno>/<human|synthetic>/agg-daily-v1.sqlite`, separado de `usage.sqlite`; esquema propio inicial **1**, no «esquema4» del histórico. Son nombres/versiones de un contrato futuro, no cambios efectuados. Metadatos de entorno/tráfico/modelo deben coincidir o se rechaza apertura.

Clave de celda: `(day, family, dimension, category, measure)`, bajo el modelo/entorno/tráfico del archivo. `day` es fecha UTC válida `YYYY-MM-DD`; nunca hora de operación. Valores enteros exactos, no negativos al comprometer; limitar a `Number.MAX_SAFE_INTEGER` y rechazar desbordamientos sin redondeo. `dimension/category/measure` se validan por familia; no strings libres, mapas arbitrarios ni campos extra. No registrar una celda por actor u operación.

| Familia y clave permitida | Celdas/medidas admitidas |
|---|---|
| `CREATION`, sin dimensión | `rooms_created` por día de alta confirmada. |
| `JOIN`, `outcome` o `rejectionGroup` | `NEW_JOIN/EXISTING_PARTICIPATION/REJECTED`; grupos INPUT, AVAILABILITY_OR_PHASE, CAPACITY, IDENTITY_OR_PERMISSION, CONFLICT, TECHNICAL de Aplicación16.4.2. Contadores separados, no outcome×causa×sala. |
| `WAITING`, sin dimensión o `closedReason` | Cohorte de creación: C/S/W/P/U/X; cierres HOST_CLOSED/HOST_DISCONNECTED/INACTIVITY, como marginal de W. |
| `GAME`, sin dimensión o `endReason` | Cohorte de inicio: G/A/U/X y terminales DECK_COMPLETED/HOST_CANCELLED/NO_ACTIVE_HUMAN_PLAYERS/TECHNICAL_INTERRUPTION. |
| `CONFIGURATION`, una dimensión | Las dimensiones actuales de Aplicación16.4.2; una fila por categoría marginal, no snapshot completo. |
| `DURATION`, `total`, `reason` o `bin` | Día del fin: cantidad/suma entera de segundos globales y por motivo; histograma global con los siete intervalos normativos. Nunca motivo×bin, min/max o valores individuales. |
| `AUTOMATIC`, sin dimensión | Cohorte de inicio: humanos base, transiciones únicas, humanos de ciclos abiertos y balances desconocidos/cortados. |
| `APPEARANCE`, `population`, `start`, `end` o `pair` | N, S[5], E[5], M[25] y balances/ausencias de §6. Solo START×END es un cruce autorizado. |
| `QUALITY`, familia y causa técnica cerrada | Cantidades conocidas, pérdida de cantidad desconocida, cortes/pausas/reinicios y estado de integridad; no motivo personal o cuerpo de error. |
| `HOME`, sin dimensión | Solo si se aprueba D1: presentaciones observadas; no visita, navegación, referer, navegador/dispositivo o identificador. |

Configuración escalar: `humanPlayerCount:1..5`, `humanObserverCount:0|1`, `botCount:0..4`, `playerCount:2..5`, cantidades EASY/HARD `0..4` **en dos histogramas independientes**, `hostPlays:boolean`, `turnSeconds:15|30|60`, `reviewSeconds:0|2|5|10|15|30`, `forceTieBreak:boolean`, `attributeValueMode:PLAY_VALUE|DISPLAY_VALUE`, `optimizeForMobile:boolean`. Se validan contra el inicio funcional aceptado. La identidad de paquete `(deckId,schemaVersion,contentVersion)` es una categoría compuesta editorial, derivada del catálogo aprobado; no usar nombres o instrucciones. Máximo64 categorías paquete/versión por día: si se supera, omitir esa dimensión con calidad, manteniendo el resto y su denominador observado explícito. No inventar «otras» ni cambiar el catálogo.

La lista cerrada de causas de calidad incluirá al menos: capacidad de correlación, ventana vencida/desconexión, captura no recibida, dimensión omitida, cola/edad/escritura/espacio/mantenimiento, corte de cobertura, reinicio y desequilibrio. No codificar qué persona excluyó, su elección o su sesión. Distinguir cantidades de **entradas delta** descartadas de número de partidas/hechos perdidos, que puede no conocerse.

Estructuras durables propuestas: `cells` para las celdas anteriores; `coverage_days` por día/familia y estado cerrado de instrumentación/periodo parcial/pausa/pérdida; una fila `metadata` con modelo/esquema/dimensiones/bins, entorno/tráfico, frontera diaria, `lastCommittedCursor`, limpia/sucia y fechas administrativas de mantenimiento/copia o corte de snapshot. Estado observado no equivale a cobertura completa demostrada. Ninguna tabla de lotes previos, eventos, sujetos, recibos nuevos o correspondencias; nada de `bootRef`, ids/hashes individuales o tiempo exacto de una operación. `asOf` es fecha administrativa, no una excepción para guardar horas de juego.

### 3.2 Puertos, operaciones y responsabilidades

Aplicación recibe hechos funcionales mínimos transitorios, valida ámbito y reduce; el puerto de escritura solo recibe `DeltaCell`/lotes. `DeltaCell` = clave cerrada + `amount` entero: positivo en contadores/sumas, positivo o negativo solo para balances abiertos. No SET arbitrario, DELETE por filtro, SQL o recálculo individual. Ninguna unidad de transición se divide: por ejemplo iniciar descuenta P y suma S/G/A/configuración y población correspondiente de forma atómica.

Operaciones internas cerradas: **admitir unidad completa**, **aplicar lote**, **reconciliar balances abiertos**, **cerrar limpio**, **mantenimiento/purga**, **lectura** y **copia/restauración aislada**. Las tres últimas usan puertos administrativos, no una operación pública. Reconciliación/cierre son transacciones administrativas fijas; no un catálogo extensible de comandos arbitrarios. Solo se crea archivo vacío en inicialización explícita de nuevo almacén; ausencia/corrupción donde se esperaba histórico es indisponibilidad, no autorización de recrearlo.

| Capa | Responsabilidad y verificación prevista |
|---|---|
| Dominio | Sin cambios ni imports estadísticos, SQLite, reloj real o UI. |
| Aplicación | Catálogo, admisión/exclusión, reductor/cohortes, dedupe RAM, fórmulas/calidad y puertos. Pruebas puras/con puertos sustitutos; sin SQL/Express/Socket.IO. |
| Cliente y contratos compartidos | Información/control de exclusión y capturas mínimas; preferencia visual B20 intacta. DTO puros, sin imports `server`, ids estadísticos o consultas SQL. |
| Infraestructura | Cookie/origen/sesión/conexión, límites/cola/worker, SQL transaccional, lectores/copias/logging seguro. Integración real y revisión de los mensajes hacia worker. |
| Composición | Selecciona explícitamente un modelo de escritura y conecta adaptadores; mantiene histórico/administración y OFF. No concede aprobación jurídica mediante una variable. |

## 4. Correlación, admisión y prefijo comprometido

Mantener únicamente en RAM fase/cohorte, referencia funcional del ciclo, roster humano mínimo, reloj monotónico, marcas de automático y captura, categoría START y alcance de exclusión. Dedupe de operación utiliza el ya funcional; no generar eventId/visitId/ref/hash para persistirlo. Roster/identidad jamás atraviesan el puerto agregado. No retener relaciones por los30min de consulta de resultados.

Base de límites de Infraestructura14.2, sin cambios propuestos:4096 ciclos, dos horas máximas por ciclo observado;4096 oportunidades, diez segundos por oportunidad; cola2048 entradas/2MiB contando pendiente y vuelo, reserva1024 servidor; lote64 entradas/250ms, un vuelo, reintentos1/5/30s y edad60s; drenaje2s. DB512MiB/WAL64MiB/reserva128MiB, aviso80%, worker128MiB; lectura5s. Son presupuestos de ingeniería por verificar, no leyes ni capacidad acreditada. No reusar el límite «por visita»: control por contexto funcional RAM y techo global120/s, ráfaga240, sin IP/UA.

El ciclo de espera termina al iniciar/cerrar; el ciclo de partida inicia su propio límite monotónico de dos horas. No renovar por recarga/lectura/captura o actividad del juego. Las oportunidades no sobreviven al límite de su ciclo. Saturación/caducidad elimina correlación y clasifica lo observado como desconocido/calidad, sin cancelar o modificar Game. La memoria real de mapas/colecciones y transferencias debe contarse; el heap worker no certifica memoria total.

**Protocolo propuesto:**

1. Después de la decisión/dedupe de juego y antes de difusión, preparar la unidad de deltas y su efecto RAM. Reservar capacidad para toda la unidad; solo entonces avanzar correlación estadística. Todo sucede sin IO/await en la decisión del juego. Repetir una operación no deriva otra unidad; una recuperación nueva legítimamente resuelta sí puede contar como otra operación JOIN.
2. Cada grupo atómico cabe en un lote de64; agrupar sin separar sus celdas. No expulsar una unidad **ya admitida** para reservar servidor: rompería el prefijo y sus balances. El rechazo de una foto aún no admitida puede dejar ausencia; perder una transición causal exige cortar el ciclo afectado, o pausar globalmente si no se puede delimitar. Nunca admitir luego un terminal huérfano.
3. Lote inmutable `model/contractVersion`, `cursor` global entero y celdas cerradas. Sin ids, timestamps individuales, hashes, lista de fuentes o snapshots. Metadatos de envío/reintento exactos permanecen RAM. El writer recibe solo el lote reducido; no eventos que deba anonimizar después.
4. Writer exclusivo: si cursor durable c y llega c+1, aplicar todas las celdas/balances/calidad y avanzar cursor en una transacción. Si llega c, devolver ack sin reaplicar. Otro cursor → conflicto/hueco, pausa; no saltar ni fabricar prefijo. Validar siempre estructura; el emisor único conserva el mismo lote en RAM. Un cursor solo **no permite verificar tras crash que un payload diferente con c sea idéntico**: no prometer esa garantía ni añadir hash/journal para obtenerla.
5. Ack comprometido contiene modelo y cursor; admisión en cola y compromiso son estados distintos. Solo el ack del vuelo actual puede confirmarlo; ignorar callbacks/canales de un worker sustituido mediante generación RAM, sin persistir un bootRef. Tras timeout de ack, no mandar c+2: conservar/reintentar c+1. Si el worker quedó inalcanzable o se perdió el lote RAM, pausar, resolver exclusión del writer y leer cursor bajo lease antes de sanear. No reutilizar números desde cero en archivo existente.
6. Pérdida definitiva rompe continuidad. Invalidar correlación/ventanas, parar deltas posteriores y reconciliar sobre el prefijo durable: abiertos→unknown, preservar altas y cifras conocidas, señalar pérdida conocida o de cuantía desconocida. Reanudar únicamente ciclos nuevos, sin backfill. Un saldo negativo/anomalía aborta transacción y degrada; no cuadrarlo a cero arbitrariamente.

Exclusión ordena el corte de futuras admisiones **antes de confirmarlo**, no borra unidades admitidas con anterioridad aunque aún estén en vuelo. No trasladar la barrera durable individual/flags de B19 al lote agregado. Si el delta de reclasificación del corte no cabe, cortar igualmente en RAM y pausar/reconciliar antes de seguir; no confirmar una falsa continuidad estadística.

## 5. Cohortes, reinicios y exactitud acotada

Días UTC y resolución/bins de Aplicación16.4.2; fórmulas de16.4.3, sin otras tasas. Creación/entrada por día del hecho, espera por creación, configuración/finales/automático/apariencia por inicio, duración por final. Truncar duración monotónica conocida a segundos **una vez** al finalizar, incluyendo revisión/desempate y excluyendo retención. No guardar sus timestamps o duración individual. La configuración es marginal, no permite afirmar combinaciones conjuntas.

Ejemplo: sala creada D1 e inicio D2 → S actualiza cohorte de espera D1, G/configuración D2. Final D3 → terminal de G en D2, cantidad/suma/bin de duración D3. No construir una tasa dividiendo un numerador de D3 por un denominador de D2. Las celdas de días cerrados pueden recibir finales de su cohorte dentro del límite RAM; «cerrado calendario» no significa «seguimiento completo».

Comprobar transaccionalmente los balances C=S+W+P+U+X y G=terminales+A+U+X; histogramas íntegros suman su base y los siete bins suman duraciones conocidas. Los denominadores previos no disminuyen por exclusión, fallo o reinicio. Dato ausente, cero real, suprimido y no instrumentado son estados diferentes. Las reglas de null/provisional/calidad son las normativas, no una corrección estimada de audiencia.

**Parada controlada:** puede constatar TECHNICAL_INTERRUPTION y duración con RAM válida, como estadística exclusivamente; no resultado Game ni foto END. Drenaje máximo2s. **Pérdida abrupta:** transacción exclusiva y repetible de reconciliación de saldos durables abiertos a U/calidad, cursor y marca limpia/sucia; nunca inventar fin/duración. Realizarla también al nuevo arranque aunque una parada marcada limpia hubiese dejado abiertos pendientes de medición. No repetir el traslado si los balances ya están saneados.

Las altas no comprometidas y hasta sus marcas de pérdida pueden desaparecer. «Sin errores registrados» no demuestra completitud. No garantiza exactamente una vez extremo a extremo, dedupe entre procesos, recuperación del último lote o localización de contribuciones individuales. El lector sin writer ante suciedad/reconciliación pendiente falla de forma segura; no sirve un histórico vacío o cifras provisionales como completas.

## 6. Apariencia: mantener las cinco categorías y la matriz

Codificación cerrada propuesta: `L0=LIGHT/DEFAULT`, `L1=LIGHT/EXPLICIT`, `D1=DARK/EXPLICIT`, `C1=CREAM/EXPLICIT`, `H1=HIGH_CONTRAST/EXPLICIT`. No hay otra combinación DEFAULT. Matriz exactamente5×5, incluidos los cinco pares iguales; no reducirla a «cambió/no cambió» ni atribuir preferencia demostrada. Su habilitación específica se resuelve en D1, no se elimina del objetivo.

En inicio instrumentado sumar N y su balance pendiente con HUMAN jugadores elegibles, no observadores/bots. Al admitir START, S[i]++ y conservar i y marca de admisión en RAM. Caducar la ventana START elimina su token, **no la categoría START ya admitida necesaria para el futuro par**. END admisible suma E[j] y M[i,j] si existe i, y resuelve el pendiente de esa participación; no mandar ambos registros vinculados al writer. Cerrar la oportunidad final sin END resuelve el pendiente y conserva la ausencia con causa técnica general. Un corte/pérdida resuelve los pendientes afectados en X/U; nunca suma otra población N. Tras END, cierre de ventana final, corte o límite de vida del ciclo borrar la relación individual. Un humano automático conectado sigue siendo jugador; parada técnica sin resultado visible no crea END.

Reutilizar acreditación de B20 en vivo/conexión/partida/participación y diez segundos, en DTO distinto sin `eventId`/`visitId`: propuesta `POST /api/statistics/appearance`, cuerpo cerrado `{version:1,gameId,moment,windowToken,theme,origin}`. Id/token solo en transporte/RAM, mismo origen/sesión funcional y máximo2KiB. El modelo activo determina su contrato; cliente antiguo o ruta antigua no se redirige silenciosamente a AGG. El `usageContext` opcional de una petición de juego antes válida no pasa al reductor ni causa un rechazo nuevo de esa operación. Primera captura admisible gana por participación/momento en RAM; reintento acotado con el mismo token, nunca al reconectar o leer resultado. Respuestas202=cola,204=no admitido/duplicado,400/403/413/429/503 según causa, sin datos ajenos.

No reabrir START por F5/aceptación posterior ni END por consulta tardía. Mantener las comprobaciones T04 y el valor congelado en la transición, no al recibir un ack posterior. La captura no implica atención ni simultaneidad física con el reloj del servidor. `src/appearance.ts` y almacenamiento funcional no se leen como historial adicional para medir.

Preservar **S=sum S[i], E=sum E[j], Q=sum M[i,j]**, soloInicio=S−Q, soloFinal=E−Q, ninguno=N−S−E+Q. Pending/U/X califican cobertura y no se suman otra vez. START sobre S, END sobre E, pares sobre Q; S/N, E/N y Q/N solo con N conocido; denominador cero→null. Anomalía→null/calidad, sin rellenar cifras. Ejemplo auxiliar fabricado N=3,S=2,E=2,Q=1: un solo inicio, un solo final y ninguno=0; no son seis personas ni cuatro pares. Su eventual salida puede suprimirse por D2.

Portada, si D1 la autoriza, tendrá DTO separado mínimo de presentación sin id y dedupe local por entrada visible a HomeScreen; rerender no cuenta, F5/retorno SPA que presentan portada sí. Sin reintento automático que prometa dedupe remoto inexistente. No sustituir por GET/health/logs ni reintroducir intenciones de crear/entrar.

## 7. Contrato mínimo de exclusión

Propuesta funcional: cookie `karta3_statistics_exclusion`, solo versión1+booleano (`1:1` excluida, `1:0` elección expresa de no excluir), host/origen propio, Path=/, Secure y SameSite=Lax, sin Domain padre ni identificador. Expira a los **doce meses naturales desde la elección**, calculados como plazo de calendario, sin renovar por lecturas/reintentos; no equivale a365d. No escribir una elección falsa por aplicar el estado predeterminado. Cookie/fecha de expiración nunca entran en estadística.

`GET /api/statistics/exclusion` y `PUT` propios, `no-store`, origen/contexto funcionales y validación cerrada; se reutiliza sesión funcional cuando se necesite coordinar pestañas, sin identidad estadística nueva. Cuerpo PUT propuesto `{excluded:boolean,expectedRevision:number,requestId:string}`, máximo1KiB, revisión entera segura y requestId funcional de1..100 caracteres: controles acotados en RAM, no persistidos en DB/log. Respuesta `{version:1,excluded,revision,persistence:'COOKIE_REQUESTED'|'MEMORY_ONLY'}` confirma el corte servidor y distingue la solicitud de guardado, **no acredita que el navegador haya aceptado Set-Cookie**. Cliente verifica cookie legible y/o su devolución en una consulta funcional antes de afirmar que quedó recordada. Los límites existentes de control se reutilizan, sin supeditar la exclusión a una escritura SQLite.

- Acción accesible «Excluir mi actividad de las estadísticas» desde información/privacidad; quitar exclusión es acción expresa dentro del mismo control, no aceptación estadística ni reapertura del ciclo. No se registra el uso de ese control ni se introduce otro selector de juego.
- Excluir corta localmente de inmediato, invalida capturas pendientes y señala a otras pestañas mediante mensaje **booleano** del mismo origen, por ejemplo BroadcastChannel sin ids/fechas ni persistir el mensaje. Una señal restrictiva corta; una señal de quitar exclusión solo pide releer el estado confirmado, no levanta por sí misma una restricción posterior. El servidor aplica el corte RAM ordenado antes del200 y lo comunica a sus pestañas; incluye humanos reservados y HOST observador de ciclos compartidos. La elección no se difunde a otros participantes.
- Exclusión restrictiva válida prevalece aunque llegue sobre una revisión antigua. Quitar exclusión exige estado/revisión vigente y acción expresa; conflicto409 exige revisar/reintentar. Repetir una solicitud no renueva plazo ni duplica cortes. Respuesta antigua no levanta una restricción local/servidor posterior; cliente comprueba contexto de solicitud/conexión y revisión.
- Desconectado: «Exclusión aplicada aquí; pendiente de confirmar en el servidor». No prometer efecto en otras conexiones aisladas. Recuperar exige leer preferencia/estado antes de nuevas capturas o contribuciones del actor; reintento explícito del control, sin cola durable. Preferencia inválida o confirmación pendiente nunca habilita medición.
- Sin almacenamiento: mantener restricción en documento/sesión funcional viva e informar de su alcance. Si no puede garantizarse el corte de ámbitos por capacidad/fallo, pausar medición afectada/global y mantener pendiente; juego no se bloquea. Ausencia de cookie permite el estado por defecto solo bajo D1/D3 aprobados, no sirve como prueba de consentimiento.
- Los ciclos ya cortados nunca reabren por salida, quitar exclusión o cambio de rol. Si nacen excluidos, no generar alta o «rechazo estadístico». Si ya fueron observados, clasificar X sin reducir denominadores. Una operación JOIN propia no excluida puede contarse marginalmente aunque no se observe la sala: nunca enlazarla en SQLite.
- Lo ya reducido/admitido antes del corte no se localiza o resta después; la confirmación no acredita borrado retroactivo o durabilidad. El tratamiento de derechos de datos aún identificables se resuelve en D1/D2, no se presume anonimato por eliminar ids.

La pantalla de privacidad continúa independiente del flujo de juego; mostrarla no genera una visita o partida. El control funcional explícito puede guardar su preferencia y coordinar la sesión, sin montar Room/Game. La preferencia visual B20 funciona igual antes/después de excluir.

## 8. Lectura, conservación, copias y transición

### 8.1 Consultas cerradas y salidas

Nuevo DTO de informe `model:AGG_DAILY_V1`, `reportVersion:1`, entorno/tráfico, familia de las nueve existentes, periodo/granularidad autorizados, cohorte, resolución, cantidades/denominadores, nulls con causa, calidad/cobertura/cortes e `asOf` administrativo. `creation` y `joining` ya no tienen denominador de intenciones; `duration` sin min/max y con bins. `appearance` conserva marginales/matriz y sus bases. `access` sin familia aprobada devuelve FAMILY_NOT_ENABLED, no cero visitas.

Propuesta CLI futura: conservar los comandos administrativos, añadir `--model AGG_DAILY_V1`, fechas de días/meses UTC completas y report fijo; HUMAN ordinario y SYNTHETIC separado. Histórico usa discriminador `LEGACY_EVENTS` con sus versiones/semántica. No permitir consulta mixta que sume modelos, filtros por configuración, SQL/columnas libres, intervalos de minutos o API web. JSON/CSV incluyen modelo, unidades, granularidad, periodo de cohorte, denominadores/calidad y estados VALUE/ZERO/NOT_CAPTURED/NOT_INSTRUMENTED/SUPPRESSED/UNAVAILABLE; null no pierde su causa. Neutralizar fórmulas CSV. El DTO no enumera referencias, horas de operación o logs de exportaciones individuales.

D2 propone restringir las salidas iniciales a bloques mensuales cerrados, conservando celdas diarias privadas. No exponer el día corriente ni valores que cambian por cada contribución. Una consulta de integridad/salud no es un camino alternativo a esas celdas. Las fórmulas normativas se calculan antes de política de salida; si la supresión permite reconstrucción por total/tasa/denominador, suprimir también esos derivados. El estado SUPPRESSED, indisponibilidad o calidad incompleta se conserva visible; ocultar una cantidad nunca la convierte en cero o en ausencia de pérdidas.

### 8.2 Conservación y copia

Nuevo modelo: mes UTC actual y once anteriores; purga transaccional/idempotente por meses, sin detalle de90d. Mismo vencimiento en copias/exportaciones. Mantenimiento continúa con recogida OFF. No borrar histórico vigente para recuperar cuota. Reconciliación y saldo de archivos restaurados no restauran juegos, sesiones o vínculos de apariencia.

Reutilizar Online Backup a temporal privado, materializar una SQLite **nueva de agregados**, cifrar AES-256-GCM y siete rotatorias. Copiar modelo/versiones, celdas/balances/calidad/cobertura/cursor y `asOf` administrativo; no WAL archivado, snapshots o recibos nuevos. El WAL vivo solo contiene páginas de esas estructuras, se limita/checkpoint y no se explota como historial. Temporales/volcados de RAM/logs ordinarios no son una vía de detalle.

Restaurar en ubicación aislada, verificar entorno/tráfico/modelo/plazos y censurar/reclasificar abiertos al corte una vez; no arranca recogida. Respaldos históricos son segmentos distintos y conservan su régimen; copia integral Hostinger puede incluir detalle histórico, no llamarla exclusivamente agregada. Mantener mecanismos útiles ya existentes, sin Windows/DPAPI, descarga diaria al PC o nuevo destino externo obligatorio. Copia no garantiza RPO24h ni recuperar pérdidas posteriores.

### 8.3 Corte y retorno propuestos, todavía no autorizados

1. Preparar un ejecutable compatible con lector/mantenimiento histórico1/2/3 y archivo agregado separado. En OFF o LEGACY_EVENTS no crear/capturar AGG. Inicialización AGG exige orden explícita y validación de ruta; no auto-migrar `usage.sqlite` al arrancar.
2. Antes del corte aprobado, verificar copia/restauración y condiciones D1–D4. Detener admisiones del modelo anterior, drenar dentro de límite y registrar su cobertura/calidad. No escribir ambos modelos sobre los mismos hechos. Intervalo entre modelos será discontinuidad, no cero actividad.
3. Seleccionar AGG exclusivamente después de revisión de paquete; fecha efectiva y día parcial se registran entonces, **no20/10 por redactarlo**. Observar solo ciclos nuevos; vivos heredados no producen inicios/terminales reconstruidos. Mantener las restricciones conocidas según D3; si no puede resolverse esa transición, no activar.
4. Conservar `usage.sqlite` y sus condiciones/mantenimiento; no convertir detalle anterior en celdas nuevas, eliminarlo anticipadamente o presentar series comparables. Compartir volumen privado no significa compartir tablas/esquema/escritor sobre un archivo.
5. Ante problema, volver a OFF con el **ejecutable compatible con ambos almacenes**, sin borrar bases ni volver a una imagen que abra un esquema desconocido. Un eventual retorno a LEGACY_EVENTS requiere su información/aceptación vigente; no convertir no-exclusión en consentimiento. Tampoco atribuir compatibilidad con esquema3 al B19 desplegado que solo acreditó su propia versión.

No hay migración destructiva prevista; el trabajo de compatibilidad es separar almacenes/lectores y controlar captura/mantenimiento/copia. Su reversibilidad conserva datos/archivos, no recupera un detalle que AGG nunca guardó ni elimina intervalos de pérdida. Fecha de corte, imagen, configuración y operación se deciden en D4.

## 9. Información propuesta, no aviso publicado

Primera capa candidata: «KARTA3 utiliza estadísticas agregadas para conocer su uso y mejorar el servicio. Puedes jugar aunque excluyas tu actividad. Consulta qué se mide y cómo excluirla». Acción propuesta: «Excluir mi actividad de las estadísticas». Solo se publicaría si las familias efectivamente activadas y sus condiciones quedaron resueltas.

Texto ampliado candidato:

> El responsable es Adrián Capilla López; contacto: k3k314com@gmail.com. Queremos conocer cuántas salas y partidas se utilizan, sus opciones y cómo finalizan. Tratamos temporalmente el contexto mínimo en la memoria del servidor para producir contadores y distribuciones diarias; los datos nuevos guardados no contienen un historial por visitante, sala o partida. La memoria de correlación tiene límites de hasta dos horas por ciclo y diez segundos para oportunidades de captura.
>
> La base y las familias activas se indicarán aquí cuando se hayan validado. Si se autoriza la captura de apariencia, se registran el tema y su procedencia predeterminada/elegida al inicio y final observados por cada jugador humano y su distribución de pares. No se registra cada cambio, atención o tiempo por tema; bots y observadores no aportan fotos. Las ausencias no se reconstruyen ni se presentan como uso de Claro. La preferencia de apariencia sigue funcionando si excluyes las estadísticas.
>
> Puedes excluir tu actividad sin dejar de jugar. Recordamos solo esa preferencia funcional en este origen durante doce meses desde tu elección, sin identificarte estadísticamente; en otros navegadores/dispositivos no se traslada. Si falla el almacenamiento, explicamos el alcance temporal disponible. Sin conexión, el corte es local hasta que el servidor lo confirme. La exclusión corta futuras contribuciones; en una sala compartida basta la exclusión de un humano, también observador, para interrumpir su seguimiento. No informamos a los demás de su elección.
>
> Las contribuciones ya admitidas antes del corte pueden escribirse después. No conservamos enlaces para localizar una contribución individual dentro de un agregado; ello no demuestra por sí solo que cualquier resultado sea anónimo. Los informes son privados, con agrupaciones/supresiones según la política aprobada. Conservamos el nuevo modelo durante el mes UTC actual y los once anteriores; copias y exportaciones respetan ese vencimiento.
>
> Los datos históricos recogidos bajo aceptación individual mantienen sus plazos y condiciones originales, separados de este modelo. La información completa conservará alojamiento/Hostinger, copias, destinatarios, registros técnicos, contacto/derechos aplicables y acceso administrativo ya documentados; las cookies funcionales de juego/exclusión se distinguen de las estadísticas. No medimos personas únicas ni seguimiento entre visitas.

Es un borrador con condicionantes visibles, **no texto listo para servir ni validación jurídica**. No copiar cláusulas condicionales como si fueran el aviso final. D1/D3 fijarán base y texto efectivo por familia; D2 el alcance de datos/salidas y D4 la versión propia futura. No modificar avisos2026-10-19.2/2026-10-20.1.

Consulta oficial acotada de preparación20/10: [art.22.2 LSSI, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758#a22) y [guía AEPD, enero2024](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf). El acceso/almacenamiento en terminal tiene condiciones propias; la guía delimita una exención, no acredita automáticamente estos ciclos o la matriz. La decisión RGPD/acceso al terminal permanece en D1 conforme a Aplicación16.4.8. No se ha hecho una auditoría ni una investigación general.

## 10. Única lista de decisiones pendientes del autor/responsable

Se desarrollan exclusivamente las cuatro familias de Aplicación16.4.10. Las demás secciones remiten a esta lista; no son aprobaciones implícitas por redactar contratos.

1. **D1 — Base/proporcionalidad por familias y acceso de navegador.** Propuesta: evaluación breve documentada de finalidad/necesidad/ponderación para operaciones del servidor, separada de configuración/duración/automático; aprobar solo las familias justificadas. Analizar específicamente apariencia/matriz y su acceso al estado del navegador; mantener las cinco categorías y pares como objetivo, sin activar esa captura por defecto hasta resolverlo. Portada opcional fuera de la primera habilitación propuesta. Evaluar también almacenamiento funcional para respetar exclusión, sin reutilización estadística. **Alternativa mínima:** si una familia necesita consentimiento, conservar esa familia condicionada al permiso que se determine o aplazar su activación manteniendo su diseño; no suprimir apariencia por presunción. **Consecuencias:** menor población/cobertura o núcleo servidor primero; un permiso requerido añadiría contratos/UI/pruebas que no se presupuestan como ya aprobados. **Debe resolver el responsable:** conclusión por familia, condiciones de acceso y proporcionalidad en acceso público/contexto infantil posible; no se vuelve a preguntar identidad, correo o edad. Una variable técnica de habilitación no sustituye ese documento y no certifica cumplimiento.

2. **D2 — Resultados escasos, salidas y riesgo residual.** Propuesta concreta inicial para valorar: informes/CSV privados de **meses UTC completos cerrados**, sin filtros combinados; un rango concatena los mismos bloques mensuales y no recalcula un total solapado que revele celdas. Salida solo con periodo estabilizado/reconciliado y sin correlación pendiente. Candidato de trabajo: si una familia contiene algún conteo positivo menor de **5**, suprimir la familia completa y totales/porcentajes/denominadores dependientes que permitan reconstruirlo, incluidos marginales/matriz y comparaciones entre informes. Cero real solo se muestra cuando no quede afectado por supresión. Este5 es un punto de evaluación **propuesto, no norma legal, k universal o prueba de anonimato**; una matriz de25 celdas puede quedar frecuentemente suprimida en un piloto pequeño. No exponer valores brutos por una CLI alternativa o salud técnica. **Alternativa mínima:** bloques trimestrales fijos no solapados para las familias escasas, aprobados antes de generar esas salidas, o mantenerlas sin salida hasta resolver riesgo. No colapsar categorías/matriz ni añadir detalle. **Consecuencias:** menor utilidad inmediata y posible coste adicional si se exige supresión selectiva en vez de la política conservadora por familia; la SQLite privada requiere su propia evaluación aunque el CSV suprima. **Debe resolver:** política concreta/agrupaciones, dependencias entre tablas y riesgo de reconstrucción con conocimiento externo; cuándo un resultado puede calificarse anónimo y bajo qué acceso se permite. No prometer anonimato por este filtro.

3. **D3 — Información, exclusión y restricciones anteriores.** Propuesta: nueva información efectiva antes de captura y preferencia funcional de §7; rechazo/retirada vigente **conocida** se conserva restrictivamente con su alcance, sin convertir aceptación anterior en permiso de otra finalidad o renovar automáticamente su plazo. Si se pierde esa relación RAM al cambiar ejecutable, no obtenerla de recibos, nombres o hashes. Como transición conservadora concreta, un contexto con cookie funcional previa, sin preferencia nueva válida y sin continuidad RAM acreditable permanece **excluido preventivamente**; el control ya previsto permite mantener o quitar expresamente esa exclusión tras consultar la nueva información. Examinar solo existencia/contexto funcional, sin copiar el token a estadística ni crear una lista durable de identidades. No escribir automáticamente una elección de no-excluir ni una cookie de doce meses como si alguien la hubiese solicitado. **Alternativa mínima:** mantener B19 con aceptación y AGG apagado hasta resolver el corte, sin otro banner o identificador para solventarlo. **Consecuencias:** con esa propuesta se pierden contribuciones por prudencia; puede afectar también a sesiones tras un reinicio posterior y no permite reconstruir quién había rechazado. No garantiza recuerdo entre navegadores o tras borrar/caducar cookies. Compatibilidad de información y estados condiciona coste/calendario. **Debe resolver:** aceptar o ajustar esta política preventiva y su alcance, plazo de cookie, texto definitivo y tratamiento de restricciones disponibles/perdidas antes de activar. La inacción sigue sin ser consentimiento; no se exige un dato personal nuevo ni una prueba estadística de la elección.

4. **D4 — Paquete, autorización y activación posteriores.** Propuesta: revisar este coste y contratos, cerrar D1–D3 y entonces autorizar fases de implementación con AGG apagado; después exigir evidencias propias de reducción, fallos, exclusión, histórico, salidas y Linux. Paquete posterior identifica fuente/ejecutable, esquemas compatibles, aviso propio, backup/restauración ensayados, corte de cobertura y vuelta OFF. No asignar ahora fecha/digest/aviso ni una variable de aprobación jurídica. **Alternativa mínima:** conservar B19 operativo/B20 local y posponer el nuevo modelo. **Consecuencias:** sin efectos en producto hasta autorización separada; publicar B20 no activa AGG, y activar AGG no liquida sus pendientes Linux/publicación. **Debe resolver el autor:** aceptación del alcance/presupuesto, autorización de implementar y, posteriormente, del paquete operativo/activación. No hay una autorización de VPS por aceptar este análisis.

No se proponen cambios a los presupuestos, bins o plazos técnicos de Arquitectura para esta primera valoración. Los nombres de archivo/esquema propio, DTO/rutas y concreción de salida son propuestas SDD. La cookie12meses, correlación2h, bins y conservación12meses son parámetros de proyecto por aprobar/comprobar, no plazos legales.

## 11. Esfuerzo, dependencias y riesgos

Estimación de **ingeniería y verificación**, no tiempo de agente, consumo de tokens ni plazo comprometido. Base: áreas reales leídas; sin prototipo o pruebas de capacidad. Rangos suponiendo D1–D3 cerrados, un proceso/entorno, políticas conservadoras y mecanismos de copia existentes, sin refactorización general:

| Área | Complejidad y dependencia | Horas-persona orientativas |
|---|---|---|
| Contratos/reductor/balances | Alta; inventario cerrado y semántica de cortes/altas | 8–14 |
| Cola, cursor, transacciones y reinicio | Alta; cambio principal respecto al writer actual, dependencia causal y saneamiento | 12–20 |
| Exclusión y coherencia cliente/servidor | Media-alta; D3, cookies/pestañas/offline y ámbito observador | 8–14 |
| Apariencia RAM y transporte reducido | Media; acreditación B20 reutilizable, S/E/M y ausencias nuevas antes del writer | 4–8 |
| Informes/CSV y escasez | Media-alta; D2 conservadora, nueve salidas/modelos explícitos | 6–12 |
| Histórico, mantenimiento/copias y retorno | Media-alta; separar archivos/versiones, no migración destructiva | 6–10 |
| Integración, fallos, documentación y cierre | Alta por matriz de límites; reutilizar arneses B18–B20 y CI posterior | 10–18 |
| **Total orientativo** | Incluye pruebas focales, no validación jurídica/operación real ni espera de revisión | **54–96** |

Orden de magnitud: **7–12 jornadas-persona de8h**, no duración predicha de una ejecución de IA. La automatización puede cambiar mucho el tiempo real; no convertir estas horas en tokens o prometer acabar en una sesión. Si se elige un permiso browser nuevo o supresión selectiva/consultas más flexibles, reestimar esas áreas antes de autorizar, no asumirlas gratis dentro del rango.

Riesgos prioritarios: **alto** en integridad de prefijo/reinicio y transición de restricciones; **alto** en interpretación/escasez, especialmente matriz y baraja rara; **medio-alto** en compatibilidad histórica/copias; **medio** de interferencia por un enganche síncrono defectuoso. Mitigación: modelo/archivo separado, reductor puro, puerto sin datos individuales, pausa conservadora, pruebas de crash, salidas cerradas y no autorización por configuración. Riesgo visual bajo si no se toca la apariencia funcional/adenda. No se acreditan rendimiento Linux, disco físico, anonimato o ausencia absoluta de pérdida con esta estimación.

## 12. Secuencia mínima todavía no autorizada

| Paso | Trabajo futuro y puerta |
|---|---|
| P0 | Resolver D1–D4 en su momento correspondiente y convertir la propuesta aprobada en encargo acotado. No empezar código con una ambigüedad de base/población ocultada. |
| P1 | Contratos/catálogo y reductor puro: balances, cohortes, automático y S/E/M con pruebas fabricadas; AGG sin captura activa. |
| P2 | Almacén nuevo/worker, cola indivisible, cursor/ack, errores/pausa/reconciliación y conservación; integración con SQLite temporal. No modificar DB real. |
| P3 | Exclusión/info y adaptación de ventanas/transporte B20; probar observador, varias pestañas/offline y no serialización de referencias. Mantener UI/temas/adenda visual. |
| P4 | Consultas/CSV, D2, lector/mantenimiento histórico y copias/restauración separadas; corte/retorno ensayados en instalación aislada. |
| P5 | Producto compilado y regresiones pertinentes; check final, evidencia de privacidad/errores, revisión de responsable y traslado documental. Linux/publicación/VPS seguirán sus autorizaciones propias. |

No se entrega prompt ejecutable de Implementación en esta primera revisión. El plan describe dependencias; no ejecutar migraciones, capturas o pruebas por que aparezcan en una tabla.

## 13. Verificación futura y criterios de aceptación previstos

Todas estas comprobaciones quedan **sin ejecutar**. Usar datos fabricados, arneses aislados y reloj controlado donde proceda; no acreditar AGG con resultados de B19/B20.

| Criterio | Automático futuro | Validación del responsable / límites |
|---|---|---|
| A1 — Dedupe y balances | Replay funcional, nuevas recuperaciones, doble inicio/fin/automático; admisión completa/rechazo; C/G e histogramas equilibrados, sin snapshot en puerto. | Interpretación de unidades y población; no personas únicas ni abandono. |
| A2 — Cursor y fallos | Commit con ack perdido, reintento mismo lote, cursor antiguo/hueco, writer competidor, fallo antes/durante/después de commit; saldo negativo/overflow aborta y pausa. | No garantía extremo a extremo o recuperación de RAM; registrar límites. |
| A3 — Medianoche/reinicio | CreaciónD1/inicioD2/finD3; bins en bordes, truncado; pérdida abrupta y saneamiento repetido una sola vez, parada controlada/drenaje agotado; límite2h no altera Game. | Separar tiempos controlados, crash de proceso real aislado y caída física no probada. |
| A4 — Exclusión | Actor propio, humano incorporado/reservado y HOST observador; rechazo/cookie inválida/pending, pestañas, offline, respuesta vieja y quitar exclusión; nuevas altas excluidas no contadas, ciclos cortados no reabren. | D1/D3 aprobados, alcance real de información/almacenamiento, restricción perdida no recuperada ficticiamente. |
| A5 — Apariencia | Cinco categorías/25 pares, diagonal, START/END aislados/ambos ausentes, par igual con cambios intermedios, denominadores independientes; token10s antes/en/después, F5/consulta tardía sin foto, no bot/observador. | Condiciones específicas de captura y riesgo de matriz/ausencias; no «preferencia» demostrada. |
| A6 — Ausencia de detalle nuevo | Inspeccionar tablas/esquema/puerto/MessagePort, SQL temporal real/WAL, logs capturados, CSV, backup descifrado/restaurado: ningún id/ref/hash/token, snapshot o foto vinculada. Señuelos fabricados para detectar filtración. | Esto no prueba anonimato de todos los agregados ni inexistencia física de RAM/dumps; operaciones deben excluirlos de copias/logs ordinarios. |
| A7 — Salidas escasas | Aplicar la política aprobada, null con causa, totales/tasas complementarios y consultas repetidas/solapadas, mes abierto bloqueado; sin bypass CLI/salud. | Evaluación residual de bajo volumen y conocimiento externo, eventual publicabilidad/anonimato; no se acredita solo con k. |
| A8 — Histórico/operación | Archivos1/2/3 intactos bajo mantenimiento original, modelos separados, nunca dual-ingesta; vuelta OFF y lector compatible; purga12meses/calendario, copias7 y restauración sin abiertos activos o detalle. | Fecha/corte efectivos, permisos/volumen/clave Hostinger y comprobación Linux/VPS por responsables; no inferirlo de Windows. |
| A9 — Juego independiente | Cola/reserva/capacidad/DB corrupta o writer ausente, rollback y lecturas fallidas no rechazan jugadas/inicio/resultado/cancelación; SQL/IO fuera del camino síncrono. | Regresiones funcionales pertinentes, sin rediseño ni vigilancia nueva. |

Pruebas puras en aplicación; integración SQLite/worker y procesos reales aislados; navegador con al menos dos sesiones/pestañas para exclusión/capturas y una partida/cancelación que conserva tiempos/permisos. Extender selectivamente `usage*`, `appearanceUsage`, las pruebas de worker/reader/copia y el arnés de juego existente. No repetir por rutina todo corpus de barajas/Unicode, temas o CI completa por cada ajuste.

El futuro cierre exigirá `npm run check` y recorridos de navegador pertinentes sobre build identificado; después las puertas Linux/publicación cuando se autoricen. Revisión de dependencias/ciclos más revisión semántica del puerto reducido. Preservar fuentes/fallos/evidencias antiguas y registrar las nuevas por modelo; cálculo auxiliar, pruebas puras, producto compilado, revisión del responsable y operación son categorías distintas.

## 14. Entrega actual y parada

Entregados propuesta, correspondencia, contratos futuros, coste/riesgos, lista única D1–D4 y plan no autorizado. Se ha leído documentación/código/estado y las fuentes oficiales acotadas indicadas, y comprobado documentación; **sin implementar, migrar, probar producto, cambiar preferencias/avisos/versiones ejecutadas, publicar o activar**. No hay evidencias nuevas de exactitud/privacidad/capacidad AGG.

El autor revisará antes de continuar. La posterior alineación APP/TFM recogerá únicamente decisiones aprobadas y, después, implementación real; no sustituir fuentes generales ni reescribir cierres ahora. No enviar mensajes a otros hilos. Tras esta entrega, SDD se detiene.
