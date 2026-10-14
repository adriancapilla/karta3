# B15 — Consumidor formato 2, Valor del Atributo y presentación compacta

**Estado actual, 14/10/2026:** implementado y verificado técnicamente en local (F1–F3), con evidencia nueva en §12. Revisión visual humana/dispositivos físicos e imagen Linux pendientes. C09–C10 permanecen parciales. Las secciones de preparación y sus estados anteriores se conservan como antecedente.

**Fecha:** 14/10/2026. **Tipo:** incremento técnico y funcional en tres fases. **Base observada:** `E:\KARTA3\KARTA3_IA\APP\karta3`, rama existente `feat/b14-sistema-solar`, HEAD `b2b29153d6e072c4735edc5d3ff4dce43bee0dd6`. B15 estaba libre. Conservar B14, el cambio previo de `PROCESO_SDD.md`, el contrato V2 y `docs/diseno/DISENO_VALOR_ATRIBUTO_Y_PRESUPUESTOS.md`/`valor-atributo-propuestas/` pendientes de registrar. No crear rama/checkout, revertir B14 completo o incluir trabajo ajeno por un añadido indiscriminado a Git.

## 1. Objetivo, fuentes y precedencia

Entregar un consumidor de paquetes formato 2 junto a las dos copias compatibles aprobadas/activadas; añadir configuración compartida del valor mostrado y optimización móvil, y reproducir la composición final aprobada con vistas seguras. Reutilizar catálogo, selección, configuración, mesa, coordinación y diálogos actuales.

| Referencia | Qué gobierna |
|---|---|
| [AGENTS](../../AGENTS.md), [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) | Responsabilidades reales, puertos y límites de imports. |
| [Aplicación §4 y §§7.5–7.7](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md) | Cambio inmediato por control, permisos/recuperación, modos, información/consultas y composición aprobada. |
| [Infraestructura §5.3 y §9.5](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md) | Transporte compartido, ancho útil, consumidor/compatibilidad y entrega coordinada. |
| [Dominio](../../../../TFM/Planificación/DOMINIO_KARTA3.md) | Comparación exclusiva por playValue; reglas, plazos, bots, puntos y desempate conservados. |
| [Contrato V2](../contratos/CONTRATO_BARAJAS_V2.md), [V1 histórico](../contratos/CONTRATO_BARAJAS_V1.md) | Campos/tipos, Unicode, recuentos, diagnósticos, recursos y matriz de elegibilidad. No duplicar ni cambiar sus tablas. |
| [Diseño: referencia final del 14/10](../diseno/DISENO_VALOR_ATRIBUTO_Y_PRESUPUESTOS.md#referencia-final-del-1410-y-aceptación-para-sdd) | Puntuaciones fuera/antes del resumen; Mesa y mano independientes; precedencia sobre la cabecera combinada del 13/10. |
| [B14 §§5–7](BLOQUE_14_INCORPORACION_SISTEMA_SOLAR.md), [B05](BLOQUE_05_CONFIGURACION_SALA.md), [B13](BLOQUE_13_CANCELACION_PARTIDA.md), [T04](BLOQUE_T04_AVISO_RESULTADO_ANTERIOR.md) | Historia conservada, R01–R04 por replanificar, configuración existente y garantías terminales/contextuales. |
| [Aprobación de contenido 3](../../../../ASSETS/Entregas/2026-10-14-formato-2-contenido-3/APROBACION_CONTENIDO.md) | Aprobación editorial posterior de ambas candidatas, MKm y redondeos. Prevalece sobre «no aprobado» de los documentos de revisión. |
| [Manifiesto 3](../../../../ASSETS/Entregas/2026-10-14-formato-2-contenido-3/MANIFIESTO_SHA256.json), [LEEME](../../../../ASSETS/Entregas/2026-10-14-formato-2-contenido-3/LEEME_REVISION.md), [revisión Solar](../../../../ASSETS/Entregas/2026-10-14-formato-2-contenido-3/REVISION_SISTEMA_SOLAR.md) | Bytes aprobados, trazabilidad y límites de controles auxiliares; no prueba del consumidor. |

No hay contradicción funcional que requiera otra decisión antes de especificar. Las menciones previas a umbral pendiente y contenido sin aprobar son estados anteriores, sustituidos por las decisiones y aprobación citadas. Las adaptaciones extremas de saltos/crecimiento/estrechamiento siguen siendo propuestas medidas: no adoptarlas como tamaños nuevos aprobados por el orden final.

**Incluye:** consumidor/validación V2 e histórico V1, copia aprobada reproducible, catálogo generado, dos controles, información autorizada, modos de cartas/Detalles, compacta final, regresiones y evidencia nueva.

**Fuera:** edición científica o activación de maestros por Implementación; nuevos campos editoriales, niveles/bots/reglas, presentación Ambos, preferencias individuales, abandono/revancha/expulsión, vigilancia técnica, rediseño de resultados/espera, persistencia, publicación, despliegue y edición de fuentes generales TFM. Añadir controles/información a la espera no es rediseñarla.

## 2. Dependencia editorial: estado de preparación (resuelta según §12)

En la lectura de preparación ambas candidatas tenían `schemaVersion: 2`, `contentVersion: 3`, 58 cartas y `publication.available: false`. La aprobación está vinculada al manifiesto 3 cuyo SHA-256 es `a14fdc710885999fb42699f91e1bd9b0ef644a24710bff418b5525ac2831d886`. Esto identifica la fuente documental; no sustituye la verificación completa futura de archivos por Implementación.

**No existe una entrega activada acreditada por este bloque.** Antes de incorporar las copias normales, Gestor debe entregar su ubicación exacta, paquetes y manifiesto nuevos:

- Conservar intactos la entrega/candidatas contenido 3, aprobación y manifiesto. Crear una entrega nueva derivada de sus bytes, no reconstruirla a partir de las maquetas ni de Solar contenido 2.
- Único cambio semántico autorizado de esta dependencia: `publication.available: false → true` en cada `baraja.json`, y siguiente `contentVersion` **en ambos JSON de cada baraja**: 4 si no hay otra modificación intermedia. Conservar `schemaVersion: 2`.
- Contenido editorial, ids, playValue, roundAttribute, orden de cartas, instrucciones, fuentes/créditos, alt, rutas y recursos conservados. Cualquier otro cambio exige revisión explícita; no se hereda su aprobación por llamarlo activación.
- Manifiesto SHA-256 nuevo para JSON y recursos, registro del delta 3→4 y vínculo a la aprobación de 3. Los JSON cambian de huella; los recursos deben conservarla. No reutilizar el manifiesto 3 como certificado de identidad de 4.
- Gestor mantiene ASSETS como fuente maestra y entrega trazabilidad; no copia APP, genera catálogo ni modifica producto. SDD no activa ni edita ningún paquete.

### Encargo breve listo para trasladar a Gestor

> Prepara la entrega activada de genérica y Sistema Solar a partir de las candidatas formato 2/contenido 3 aprobadas en `ASSETS/Entregas/2026-10-14-formato-2-contenido-3/APROBACION_CONTENIDO.md`. Conserva intactas esas candidatas, su aprobación y manifiesto. En una entrega nueva cambia únicamente available a true y contentVersion al siguiente número en ambos JSON de cada paquete: 4 si no hubo cambios intermedios; schemaVersion sigue 2. Conserva todos los demás datos, instrucciones, rangos, indicadores y recursos aprobados. Entrega la ruta exacta, los paquetes completos, un manifiesto SHA-256 nuevo y el registro de diferencias/vínculo con la aprobación anterior. No reutilices las huellas de 3 para 4 ni copies a APP o prepares catálogo. Si hace falta otra modificación, localízala y devuelve la necesidad antes de cambiarla. Esta entrega es la dependencia de B15, no su implementación o validación por el juego.

## 3. Consumidor y corte compatible

Reutilizar `tools/decks.ts`, `server/infrastructure/decks/{strictJson,packageFormat,readPackage,resources,catalog}` y composición existentes. Separar esquema reconocido, validez del paquete y elegibilidad para este consumidor. La validación individual acepta V1 bajo su contrato histórico y V2 bajo el nuevo: V1 no recibe NFC/topes nuevos retroactivamente y no se convierte a V2.

Implementar contrato V2 §§2–7: UTF-8/Unicode escalar estrictos, NFC de entrada, propiedades exactas/duplicados, tipos/vacíos, una línea/controles/bordes/grafemas sin base, topes por puntos de código, y diez grafemas de la unión literal displayValue/unidad. Segmentar el conjunto con el mecanismo de referencia identificado, no contar `.length`, bytes o sumar cupos 6+3. Registrar Node/ICU/Unicode/opciones en el runtime efectivo y ejecutar la matriz V2 §6; la consulta local previa no acredita estos ensayos ni la imagen Linux.

La misma validación pura de dominio mantiene 58 cartas, tres atributos, permutaciones 1..58 e indicadores. Recursos conservan comprobación de bytes/decodificación, extensión, ruta/caso y destino real contenido; null sigue produciendo icono neutro, sin archivos de sustitución editoriales. No imponer reglas por temática o distribución 20/19/19.

Los errores internos conservan archivo, ruta/propiedad, carta/id y atributo cuando proceda. Para dato/unidad informar ambas propiedades y recuento/máximo; para topes individuales, puntos de código. Añadir condiciones distinguibles de Unicode/NFC/grafema/tope e **incompatibilidad del consumidor**, sin publicar rutas o detalles de paquete al jugador. Conservar diagnósticos existentes; no inventar datos para pasar.

Preparación y arranque aplican íntegra la matriz V2 §7/B04: disponible V1 → fallo explícito de incompatibilidad aunque sea históricamente válida; disponible V2 inválida → fallo; borrador de esquema reconocido/false fiable → validar según su contrato, informar y excluir si inválido sin bloquear el conjunto; desconocido/disponibilidad indeterminable → fallo. Validación individual de inválido siempre falla. Sin disponibles ni errores fatales → catálogo vacío legítimo. No publicar catálogo parcial ni servir como vigente uno antiguo desalineado.

Antes de dar por operativa F1, incorporar juntas las copias activadas compatibles a `barajas/generica` y `barajas/sistema-solar`, comparar **todos** los JSON/recursos con su nuevo manifiesto/origen y contrastar el delta con 3. Preservar manifiesto/aprobación anteriores como evidencia; aprobar la copia es un acto trazable, no un resultado automático de available=true. Construcción/arranque normal no dependen de ASSETS. No mantener simultáneamente dos versiones disponibles del mismo paquete mediante carpetas de ids falsos.

Regenerar catálogo con el procedimiento existente; no editarlo a mano ni seleccionar por defecto. `GET /api/decks`/`api.decks()` mantienen sus sobres y los ocho campos de cada resumen: en el catálogo de esta entrega **schemaVersion es 2**, contentVersion la activada exacta. Los tipos internos del lector pueden discriminar 1/2 para la historia; el resumen normal no admite una disponible incompatible. Selección sigue por id/contentVersion y definición validada, nunca por disponibilidad acreditada por el navegador. Datos de borradores, catálogo vacío y fallos se prueban con paquetes separados, sin alterar las copias normales.

## 4. Configuración, estado y transporte

Conservar `RoomSettings` y todos sus campos actuales; añadir en `shared/contracts/room.ts` y modelo `Room`:

| Propiedad nueva | Valores exactos | Inicial |
|---|---|---|
| `attributeValueMode` | `'PLAY_VALUE' \| 'DISPLAY_VALUE'` | `'PLAY_VALUE'` («1-58») |
| `optimizeForMobile` | booleano | `false` («Optimizar para móvil»: desactivado) |

No incluirlas en GameSettings, Deck o JSON editorial. Las vistas de espera/partida/resultados devuelven los settings aceptados; ambos se congelan al iniciar. Compartir la opción no obliga a todas las pantallas al mismo layout: la compacta depende de la opción aceptada y del ancho útil local, no de una preferencia individual.

Extender la unión `ConfigurationChange` existente con `{ field: 'attributeValueMode', value: 'PLAY_VALUE' | 'DISPLAY_VALUE' }` y `{ field: 'optimizeForMobile', value: boolean }`. Mantener **Socket.IO `room:configure`**, entrada exacta `{ requestId, roomId, change: { field, value } }`, ack `SocketAck<{room: RoomView}>` y `room:state`. Sin endpoint de mutación nuevo, formulario completo, hora/revisión esperada del navegador o alias «1-58»/«Dato» dentro del protocolo. Rechazar Ambos, valores desconocidos, coerciones y claves extra con INVALID_INPUT.

Casos de uso existentes: configurar un control, seleccionar/quitar baraja, consultar/recuperar sala e iniciar. HOST exclusivo, también observador; invitados consultan valores aceptados y fallan con FORBIDDEN ante payload válido de cambio. Conservar SESSION_REQUIRED, ROOM_NOT_AVAILABLE, REQUEST_CONFLICT y errores de versión/selección existentes; nuevas acciones en IN_GAME reciben GAME_ALREADY_STARTED y en RESULTS, GAME_FINISHED, conforme al control de fase existente. Un replay legítimo no muta la preparación congelada: aplica las reglas existentes de resultado mínimo/estado vigente y errores registrados.

- Cada gesto cambia **un** control; último cambio nuevo válido procesado para ese control prevalece. Campos diferentes no se sobrescriben. Un cambio compitiendo con iniciar queda fijado si se acepta antes; si inicia primero, la nueva mutación se rechaza. Sin revisión optimista nueva ni pérdida de otros controles.
- Repetición mismo id/firma no reejecuta ni restaura valores pasados; misma id con otra firma da REQUEST_CONFLICT. Una operación igual al valor aceptado es éxito sin efecto. Conservar revisión/eventos/vencimientos existentes, aplicando primero tareas debidas incluso con callback retrasado.
- Solo modificación efectiva aceptada en WAITING renueva inactividad B03 una vez; no reservas de reconexión. Lecturas/info, igualdad, rechazo, duplicados, montaje de UI, resize, reconexión o F5 no renuevan. En el límite de caducidad prevalece vencimiento; una petición no rescata la sala.
- Cambiar/quitar baraja conserva ambos controles; crear otra sala empieza con sus defaults. Recuperación/F5 devuelve aceptados, no valores provisionales de una pestaña.
- UI inmediata por control según B05: «Aplicando…», foco y otros pendientes conservados; fallo vuelve al último aceptado y muestra error asociado. Pérdida de ack es **incertidumbre**, no rechazo: mostrarla y recuperar estado. Sin cola ni envío/reenvío automático al reconectar, montar o recibir eventos. Si el mecanismo existente ofrece recuperación/reintento explícito, conserva su id/contexto y solo un gesto nuevo lo inicia.
- Vistas/acks antiguos se filtran por sala/fase/revisión e intento/control; no sustituyen una vista más nueva, un provisional más reciente o una sala/resultados posteriores. Preservar T04/B13.

## 5. Información de la baraja y vistas por destinatario

Añadir contrato seguro `DeckInformationView = { id: string; contentVersion: number; instructions: string }`. En `WaitingRoomView`, nueva propiedad `deckInformation: DeckInformationView | null`, nula exactamente cuando no hay selección. En `InitialGameRoomView`, `deckInformation` no nula, coherente con selectedDeck y settings. **No ampliar el catálogo ni añadir un JSON editorial.** Nombre/descripción/portada ya proceden de selectedDeck; no duplicar el paquete en este objeto.

Extender las capacidades reales existentes `PublishedDeckVersions.resolveVersion` y `PublishedGameDecks.gameDeck` para devolver instrucciones proyectables de la **misma versión exacta** junto a ficha/instantánea. Guardar referencia/instrucciones aceptadas en Room y fijarlas con la instantánea al iniciar; no leer ASSETS ni consultar otra versión cuando se abre el diálogo. Selección id/versión/ficha/instrucciones cambia atómicamente; quitar selección limpia las cuatro. La identidad del objeto de información debe coincidir con selectedDeck en HTTP, ack y eventos.

Enviar esa proyección únicamente mediante vistas de sala ya autorizadas para sus miembros HUMAN/observador. No endpoint anónimo por id, nuevo permiso BOT o publicación de instrucciones de todos los paquetes. Consultar es lectura sin renovación/pausa; no hace falta petición de juego para abrir un contenido ya recibido. Las vistas de resultados mantienen su recorrido: no añadir cartas o rediseñar su pantalla para este acceso.

**«Información de la baraja»:** disponible sobre la ficha seleccionada en espera y fuera de la secuencia resumen/Mesa/mano en partida; accesible también desde Detalles. Abrir una consulta identificada por nombre/versión, con descripción existente e instrucciones literales, LF preservados y lectura/desplazamiento accesibles. No ejecutar HTML/Markdown. Si instructions es vacío, informar «Esta baraja no incluye instrucciones adicionales», sin inventarlas. Vel/Dist/MKm se explican por contenido aprobado, no por diccionario React.

Fijar contexto de consulta a sala/selección exacta. En espera, si cambia o se quita la selección mientras está abierta, cerrar la consulta anterior y devolver foco a Información si sigue presente, o al control/ficha de selección; no mezclar descripción nueva con instrucciones viejas. En partida el contexto queda fijo. Transición terminal/caducidad/nueva sala cierra consultas obsoletas y conserva filtros T04/B13.

`CardView` mantiene playValue/displayValue/unit de **mano propia y cartas públicas**; no necesita eliminar playValue del transporte por mostrar Dato. Observador sin mano ajena y sin cartas ocultas. Orden de Mesa sigue playValue con ALTO/BAJO; revisión usa ranking del servidor. No comparar cadenas ni crear empate por igualdad de datos.

## 6. Presentación normal y compacta

### 6.1 Cartas y consultas comunes

Mano, indicadora, Mesa, revisión y desempate: tres atributos, **dos columnas** (símbolo/nombre y valor elegido). En 1-58 mostrar playValue; en Dato la unión literal del contrato. Sin Ambos/tercera columna ni J adicional durante revisión. Mantener nombre, imagen o icono neutro, símbolo propio de card.roundAttribute y marca activa de round.activeAttributeId, que son conceptos distintos. La mano conserva adquisición; solo públicas se ordenan como actualmente.

Detalles muestra siempre los tres datos informativos/unidades y contenido completo aprobado de nombre/característica/notas; **sin J**, segundo nombre o dato original alternativo. Reutilizar diálogo, foco y teclado; Información accesible desde él. Consultas nunca juegan, cambian configuración o detienen/reinician reloj. Preservar gesto de carta/ALTO–BAJO, selección parcial modificable/privada, envío al completar apertura y Jugar exterior; scroll no es selección ni jugada.

PC conserva la mesa centrada B12: dos filas, jugadores/Mesa arriba; indicadora/mano/turno abajo, cabecera existente, cuatro públicas y quinta lateral, cartas PC 230×321 como referencia base. Reproducir geometría/fuentes y carta de las referencias elegidas, sin imponer altura universal a texto extenso. Valores a 14 px de referencia, sin fuente dinámica por longitud, long-numbers por dígitos como criterio de layout, redondeo, elipsis o truncación. Sustituir únicamente los ajustes compartidos de GameCard/CSS que sean incompatibles con esta representación; **no revertir el commit mixto B14** con contenido/pruebas/catálogo.

La compacta reutiliza la carta elegida (referencia base de ancho 220 px con miniatura/nombre y tres filas), sin convertir las medidas de una captura en nuevos máximos de contenido o altura fija. El refinamiento del 14/10 no autoriza redimensionar/fijar otra fuente. Si un contenido aprobado no cabe o un perfil exige una adaptación extrema aún propuesta, medir/localizar y resolver con el autor **antes** de sustituir tamaño, recortar, bajar fuente, apilar mano o cambiar el orden. Pruebas auxiliares de cabida no autorizan automáticamente el resultado de producto.

### 6.2 Ancho útil y activación

| optimizeForMobile | Ancho útil real | Layout |
|---|---|---|
| false | cualquiera | Normal adaptada. |
| true | menor de 1368 CSS px | Compacta final. |
| true | mayor o igual que 1368 CSS px | **La misma normal que con false**, contenidos/geometría/fuentes/recursos equivalentes. |

Medir content box del contenedor de composición disponible **antes de sus pistas**, con márgenes/padding/barras/reservas reales descontados. No viewport/screen.width, DPR, dispositivo/orientación, scrollWidth de carrusel o suma de cartas. Mantener estable ese borde/reserva entre layouts; observar sus cambios sin ciclos de realimentación. Usar ancho CSS efectivo sin redondearlo para cambiar el límite; no histéresis que altere la regla. La técnica compatible de medición/observación es autónoma, no un nuevo dato enviado al servidor.

Una barra que reduzca realmente el espacio cuenta. 1399/1400 de viewport solo son muestras de maqueta con sus márgenes; no codificar ese corte como norma. Registrar viewport, contenedor/content box, padding, barras, zoom y layout resultante. Cruzar el umbral no envía acciones, cambia settings, restablece selección/reloj o pierde diálogo/foco. Preservar foco en el control equivalente, identidad del contexto y desplazamientos consultables; no duplicar eventos por montar dos layouts activos.

### 6.3 Orden compacto final y estados

1. **Puntuaciones/identidades arriba, antes y fuera del resumen**, con inicial/puntos y consulta completa. Pueden apartarse mediante scroll natural; no desaparecer ni incrustarse en el resumen.
2. **Resumen:** jugador activo, temporizador correspondiente a fase, ALTO/BAJO, atributo activo/símbolo, acceso identificado a indicadora, ronda y mazo restante. Abridor e identidades consultables. Apertura sin dirección predeterminada; tras abrir dirección fijada, no editable por otro jugador.
3. **Mesa lateral**, con autores consultables; cuarta/quinta y cartas completas alcanzables.
4. **Mano lateral independiente y Jugar debajo de cada carta**, sin mano inventada para observador.

No lista de jugadores independiente, indicadora completa o información secundaria intercaladas entre resumen, Mesa y mano. Indicadora se consulta desde el resumen con carta/tres atributos/Detalles completos y retorno de foco. Avisos propios/conexión/timeout/automático y Cancelar permanecen accesibles antes del área de juego; Información después de mano (o Mesa para observador), además de Detalles. Sin altura fija, cabecera flotante, scroll prescrito de 182 px o espaciadores para imitar un encuadre.

Fases: turno humano muestra su contador vigente B08; revisión reemplaza por contador de revisión B07, sin acciones de siguiente turno; bot/automático no tiene contador humano ficticio; espera de ack/conexión y avisos no ocultan controles para comprimir. Cancelar HOST sigue en turno/revisión/desempate, incluso HOST observador/automático, con confirmación B13 sin pausa. Invitado no recibe ese control ni permiso. Resultados/cancelación conservan pantalla, puntos, retención/liberación actuales.

Iniciales coincidentes se desambiguan por posición **estable del orden base completo** para jugadores (A·1/A·2) y O para observador (A·O); no por ranking, mano o subset de desempate. Consultas por botón/enlace accesible, no solo hover: nombre/sufijo completo, tú, puntos, HOST/GUEST/observador, BOT Fácil/Difícil, abridor, activo, Automático y Sin conexión aplicables. Observador sin puntuación; bots sin conexión/plazo humano. Nombre/inicial no es id, sesión o permiso. Nombres distintos con la misma inicial y nombres repetidos se prueban, conservando sufijos existentes. Lectores de pantalla reciben identificación completa.

## 7. Responsabilidades y dependencias permitidas

| Responsabilidad | Pieza/capa | Dependencias y comprobación |
|---|---|---|
| Invariantes de cartas/Game y políticas | Dominio puro existente | No introducir NFC/Intl/archivos/layout/modos en GameSettings, algoritmo de bots o comparación. Pruebas puras/regresiones conservan decisiones por playValue. |
| Configuración aceptada/fijada e información exacta, revisión/actividad | `application/Room` | Datos/tiempo explícitos y contratos puros, sin Node/Socket/React. Transiciones atómicas y casos de uso con sustitutos. |
| Permisos/dedupe/vencimientos/selección y proyección segura | RoomUseCases, RoomCoordinator/GameCoordinator y vistas existentes | Puertos de aplicación y dominio/contratos; no adaptadores concretos. Reutilizar PublishedDeckVersions/PublishedGameDecks, RoomRequests, Clock/Scheduler y emisiones; no nuevo puerto por tema. |
| Lectura V1/V2, Unicode/recursos y catálogo/medios | `infrastructure/decks`, herramienta interna | Node/ICU/archivos/decodificador permitidos; usa invariantes puras sin redefinirlas. Fixtures, archivos/rutas reales y arranque/copia independiente. |
| Decodificación y HTTP/ack/eventos | Adaptadores existentes | Contratos estrictos y aplicación; nunca calcular resultado, rangos o sesión por dato cliente. Ataques de permiso/privacidad y payloads antiguos. |
| Conectar lector, puertos y runtime | Composición existente | Único borde que elige adaptadores; registro del runtime y check de imports/ciclos/revisión semántica. |
| DTO y UI, pendientes por campo/consultas/medida/layout | shared/contracts y src | Cliente solo contratos públicos, no server/paquetes. Puede ordenar públicas por playValue recibido, no decidir resultado. Pruebas de estado/transporte y navegador con foco/medidas. |

La implementación puede elegir helpers/módulos, técnica de medición estable, gestión de diálogos y organización de pruebas compatibles. No inventar infraestructura, métodos por baraja o adaptar un dato desde React. Nombres técnicos de §4/5 quedan fijados por este contrato; cualquier incompatibilidad real con permisos/diseño/esquema vuelve al autor antes de cambiarlo. Actualizar mapa APP/README/cierre con lo realmente entregado; conclusiones normativas se devuelven a sus responsables sin editar TFM.

## 8. Fases de implementación y puertas

| Fase | Trabajo y comprobación | Puerta de salida |
|---|---|---|
| **F1 — Consumidor y contenido compatible** | Lector/diagnósticos V1/V2 y recursos con fixtures; obtener entrega activada, validar/verificar delta y huellas, incorporar ambas copias y generar catálogo/arranque APP. | Copias disponibles exactas compatibles y catálogo con ambas, sin dependencia ASSETS. No se cierra con dos borradores fuera del catálogo. |
| **F2 — Configuración y vistas** | Dos controles, permisos/repeticiones/concurrencia/recuperación, información exacta e instantánea, modos normales/Detalles; ensayos de aplicación y transporte. | Dos sesiones y pestañas observan aceptados, fijados al iniciar; información y cartas privadas correctas. |
| **F3 — Presentación y verificación integrada** | Compacta final, medida estable/1367–1368, consultas/gestos/roles, ambas barajas/modos y regresiones; capturas/medidas comparables. | Criterios nuevos y R01–R04 con evidencia propia, defectos/límites separados y revisión humana pendiente o realmente realizada. |

La activación es dependencia de F1 normal, no pregunta pendiente sobre diseño. Puede desarrollarse la validación con fixtures mientras llega; **no declarar operativa ni entregar una versión normal del nuevo consumidor con paquetes disponibles incompatibles**. Preparar el corte de código/copias coordinado; ante instalación inconsistente, fallar antes de escuchar. Conservar la versión anterior reproducible como conjunto, no una mezcla del lector viejo con datos nuevos. No abrir/cerrar servidores del autor para estas pruebas.

No declarar B15 completo al terminar F1 o F2. Cada fase usa comprobaciones focales; las puertas generales se ejecutan sobre la compilación final y se repiten solo por cambios o riesgos concretos, no por rutina.

## 9. Ejemplos y criterios comprobables previstos

| Ejemplo | Dado / acción / resultado |
|---|---|
| E1 | HOST e invitado, una pestaña móvil y otra PC: HOST aplica Dato y optimización. Ambos reciben mismos settings; móvil útil 358 entra en compacta, PC útil 1368 mantiene normal. |
| E2 | HOST cambia Dato mientras otra pestaña cambia revisión: ambas se conservan. Dos cambios válidos del mismo campo quedan en orden del servidor; replay antiguo no restaura el primero. |
| E3 | Sin seleccionar/cambiar/quitar genérica→Solar, consultar info/F5: modos permanecen, ficha/instrucciones corresponden solo a la selección aceptada, sin autoelección. |
| E4 | Encke/Borrelly muestran 4.8 km y rangos 7/8: Dato/Detalles iguales no cambian ganador/orden ALTO–BAJO; no añadir decimal ni J en Detalles. |
| E5 | A=1367/1368 útiles con optimización: compacta/normal respectivamente; desde 1368 on/off son equivalentes. Resize no duplica apertura parcial/jugada ni reinicia el plazo. |
| E6 | Disponible V1 junto a una V2 válida: preparación/arranque falla por incompatibilidad sin catálogo parcial; la validación histórica V1 permanece válida. |
| E7 | Cancelación A con consulta abierta, nueva sala B, respuesta/evento A atrasado: B no recibe instrucciones/avisos/configuración de A; retención/caducidad A no libera B. |

Lista conservada de la preparación: todos los criterios estaban **pendientes de ejecución**. Sus resultados técnicos actuales y límites están en §12; estos checks históricos no sustituyen esa evidencia:

- [ ] **B15-01 — Fuente/copia:** entrega activada nueva recibida, aprobación 3 conservada/delta únicamente autorizado, versiones exactas iguales y huellas de JSON/recursos completas; genérica/Solar con cartas/rangos/indicadores/recursos aprobados intactos.
- [ ] **B15-02 — Formato:** matriz completa V2 §6, válidos/invalidos, NFC/descompuestos, base/marcas/uniones, controles/bordes, unidad vacía y separadores, diez/once conjuntos y cada tope M/M+1 por puntos de código; versiones/propiedades/duplicados y errores localizables. V1 histórico sin restricciones nuevas.
- [ ] **B15-03 — Disponibilidad/compatibilidad:** tabla V2 §7; conocidos disponibles/no disponibles, false fiable/indeterminable, esquema desconocido/incoherente, vacío, catálogo corrupto/antiguo y fallo sin parcial. Paquetes de prueba separados; ambas copias normales disponibles.
- [ ] **B15-04 — Recursos/autonomía APP:** null genérica/icono, portada y 58 imágenes Solar decodificadas/servidas, rutas inválidas/externas/enlaces; construcción/arranque normal sin ASSETS. JSON completos inaccesibles por HTTP.
- [ ] **B15-05 — Defaults/selección:** sala sin baraja, 1-58/false; selección explícita/cambio/quitar y errores de versión/no disponible; modos no reinician, ficha/info exactas y catálogo conserva ocho campos.
- [ ] **B15-06 — Configuración:** cada valor válido/rechazado, HOST jugador/observador autorizado, invitados/HOST ajeno denegados; igualdad/replay/conflicto, dos campos concurrentes y último válido del mismo, carreras con inicio y vencimiento B03; actividad una vez/reservas intactas.
- [ ] **B15-07 — Recuperación/incertidumbre:** dos sesiones independientes y varias pestañas, pérdida real de confirmación/transporte, provisionales/foco separados, sin cola/reenvío al reconectar/F5; antiguos filtrados y valores fijados tras iniciar, nueva sala con defaults.
- [ ] **B15-08 — Cartas/modos:** ambas barajas en mano/indicadora/públicas/revisión/desempate, tres atributos/dos columnas, icono propio/marca activa y valores literales; Detalles/instrucciones sin J ni representación alternativa. Encke/Borrelly, fechas/textos de fixtures e igualdad de datos con rangos distintos.
- [ ] **B15-09 — Información:** autorizado/versión exacta/empty, espera/partida/Detalles y transición de selección; prohibir paquete/manos/orden/rutas en HTTP/ack/eventos, también a observador y sesión ajena. Abrir/scroll/cerrar no renueva ni pausa.
- [ ] **B15-10 — Umbral:** contenedor medido a 1367/1368 (y frontera fraccionaria útil si aparece), on/off equivalente desde 1368, off normal adaptada; resize/barras sin oscilación propia, sin acciones ni pérdida de contexto. Registrar medidas reales, no presumir viewport equivalente.
- [ ] **B15-11 — Composición:** referencias finales en estados/modos/tamaños equivalentes, puntuaciones apartables y resumen→Mesa→mano continuo; PC, 390×844, 360×800 e intermedio 1024×768 como muestras. HOST jugador/observador, invitado, cinco jugadores y observador; revisión/abridor/no dirección, aviso propio y automático/desconexión. Sin otras sustituciones de diseño.
- [ ] **B15-12 — Consultas/gestos:** carruseles independientes y quinta completa, mano en adquisición, nombres largos/duplicados/iniciales coincidentes estables, diálogos Información/identidades/indicadora/Detalles, foco/Enter/Space/Escape y resize; arrastre no juega, un gesto válido envía una vez. Observador sin mano. Revisión no acepta jugadas.
- [ ] **B15-13 — Reglas/regresión:** partidas humanas/mixtas, bots EASY/HARD, ALTO/BAJO/parciales, timeout/automático, revisión cero/positiva, fase final/desempate/inactividad/resultados; B13 cancelación/contexto terminal y cuatro escenarios T04 pertinentes conservados. Evidencia de vencimiento real desconectado separada del reloj controlado.
- [ ] **B15-14 — Arquitectura/cierre:** npm run check y navegador pertinente sobre build vigente, imports/ciclos más revisión semántica, README/mapa APP/cierre/huellas/capturas/medidas y límites registrados; no publicar ni atribuir pruebas históricas a B15.

### Replanificación de B14-R01–R04

Sin marcar los checks originales ni reescribir §5/6 de B14:

| Control conservado | Evidencia nueva exigida en B15 |
|---|---|
| **R01** | Genérica/Solar, ambas representaciones, normal/compacta y on/off; indicadora/mano/Mesa/Detalles/instrucciones. Antes B14 separado de referencia final aprobada y producto posterior; composición antigua no es objetivo de igualdad tras el cambio autorizado. |
| **R02** | Selección parcial/envío, consultas/teclado/foco/quinta/carruseles/resize y plazos; solo cambia presentación, no elección o permiso. |
| **R03** | Copias V2/versión activada, nuevas huellas y vínculo a aprobación 3, significado literal Vel/Dist/MKm, igualdades y playValue/indicadores/recursos conservados. No exigir que JSON nuevos sean idénticos a V1/2 o V2/3. |
| **R04** | Validación/check/navegador y comparación visual de producto nuevos, capturas/medidas/font/zoom/entorno/contexto/versiones; revisión humana y límites separados. Maquetas/controles auxiliares no los completan. |

C09: este bloque podrá acreditar catálogo/selección autorizada/versionada y uso técnico compatible. C10: ausencia gráfica, imágenes reales, modos/consulta y privacidad de producto en perfiles probados. No declarar completos comprensión educativa, equilibrio, revisión científica, aprobación visual humana pendiente o equipos físicos por pasar esas partes.

## 10. Plan de verificación y evidencias

1. Pruebas focales de lector/Unicode/recursos con archivos/fixtures reales y casos V2, validación pura común, casos de uso de configuración/información con puertos sustitutos y contratos estrictos. Reloj controlado para bordes B03, revisión/retención, carreras y mensajes antiguos; versiones del runtime registradas. Sin endpoints públicos de reloj o fixtures.
2. Navegador sobre **compilación vigente**, no maquetas: dos perfiles/sesiones más pestañas, privacidad HTTP/ack/eventos, ambos decks y modos, umbral útil, permisos/gestos/recuperación; una partida completa normal y casos dirigidos para final/desempate/cancelación/T04. Preservar expectativas previas significativas y migrar fixtures explícitamente; normales pasan a V2/activada, V1 histórico y vacío/borradores permanecen en fixtures.
3. Comparación antes/después con metadatos equivalentes y referencias PC [1-58](../diseno/valor-atributo-propuestas/capturas/pc-1-58.png)/[Dato](../diseno/valor-atributo-propuestas/capturas/pc-dato.png), finales [móvil 1-58](../diseno/valor-atributo-propuestas/capturas/referencia-final-14/movil-final-1-58-390.png)/[Dato](../diseno/valor-atributo-propuestas/capturas/referencia-final-14/movil-final-dato-390.png), y [normal 1368 on](../diseno/valor-atributo-propuestas/capturas/referencia-final-14/normal-1368-on.png)/[off](../diseno/valor-atributo-propuestas/capturas/referencia-final-14/normal-1368-off.png). No copiar textos «maqueta/propuesta» al producto ni sus datos de ejemplo sobre las copias aprobadas. Comparar jerarquía, posición relativa, contenido/acceso/interacción; **no exigir igualdad píxel a píxel o binaria de PNG**.
4. Registrar viewport, área útil/zoom, fuentes efectivas, cajas/celdas/desbordamiento, scroll residual y diferencias explicadas; capturas con puntuaciones visibles y apartadas, no un recorte que esconda información. Anchos útiles 1367/1368 deben medirse en el producto ajustando el viewport requerido allí. Si textos/zoom reales descubren incompatibilidad, conservar diagnóstico y devolver al autor antes de improvisar adaptaciones extremas; no cerrar el criterio afectado.
5. Puertas finales `npm run check` y `npm run test:browser -- --workers=2 <archivos pertinentes>` (selección documentada). La selección cubrirá este bloque y regresiones concretas, sin batería completa repetida por rutina. Al menos un timeout de 15 segundos con cliente realmente desconectado, proceso vivo y reconexión, separado de tiempo sustituido. Preservar servidores del autor y usar instancia de prueba propia.
6. Instrucciones manuales para autor: HOST/invitado en dos perfiles, activar Dato/móvil en espera, alternar/quitar baraja/Info/F5, iniciar, consultar indicadora/Detalles/identidades, probar scroll/quinta/resize, terminar/cancelar y crear otra sala. Registrar zoom real y dispositivos físicos solo cuando realmente se revisen.

| Categoría | Lo que acredita / límite |
|---|---|
| Aprobación editorial 14/10 | Datos concretos contenido 3 aprobados; no activación ni consumidor probado. |
| Controles auxiliares Gestor | Preparación de Unicode/recursos/cabida con herramientas aisladas; no validador del producto. |
| Diseño/maqueta | Referencias/composición y ensayos de maqueta; no permisos, transporte, reloj o aplicación implementada. |
| Producto automatizado futuro | Comportamientos/contratos e imágenes en perfiles/entorno realmente probados; no revisión humana/dispositivo físico por emulación. |
| Autor/dispositivos futuros | Solo recorridos, legibilidad/zoom/equipos observados; no sustituir evidencia técnica pendiente. |

## 11. Decisiones, traslado y cierre de preparación

Decisiones funcionales cerradas: modos/defaults/roles/concurrencia existentes, datos aprobados 3, activación separada/versionada, umbral 1368 y orden final. **No hay pregunta funcional nueva necesaria ahora.** Pendiente externo concreto: recibir entrega activada y su ruta/manifiesto; pendiente de valoración solo si aparece una incompatibilidad de producto, especialmente fuente/zoom/extremos no aprobados. No suplirlos con algoritmos/editorial nuevos.

Implementación devuelve al autor fases completadas, archivos/commits propios si se encargan, pruebas/fallos reparados/huellas/capturas/medidas y límites, junto a conclusiones para Coordinación/Arquitectura sobre consumidor/V2, Room/contratos/proyección y estado de R01–R04. Actualiza README y descripción APP; no edita TFM, Diseño, aprobaciones/candidatas o maestros, ni envía mensajes a otros hilos. Sin push/PR/GHCR/despliegue.

**Evidencia de esta preparación:** lectura de fuentes/contratos/código, vistas de dos referencias gráficas, lectura de metadatos de las candidatas y huellas documentales de aprobación/manifiesto. No ejecuta validador, build, pruebas de producto/maqueta, copia, activación o experimentos de código. No acredita F1–F3, B15-01–14, R01–R04 o formato 2 implementado/verificado. [Prompt de Implementación](PROMPT_IMPLEMENTACION_BLOQUE_15.md).

## 12. Incorporación, implementación y cierre técnico — 14/10/2026

### Base y separación del trabajo

Carpeta única `APP/karta3`, rama conservada `feat/b14-sistema-solar`. Base efectiva inicial `b2b29153d6e072c4735edc5d3ff4dce43bee0dd6`. No ramas/checkouts nuevos, restauraciones, modificaciones TFM/Diseño/ASSETS ni publicación. Los 90 archivos de preparación ajenos se contrastaron con sus SHA-256 iniciales (ninguna diferencia) y quedaron separados en **f534ffe**. La primera validación independiente mientras faltaba la activación quedó en **2b5ff9f**, sin cambiar entonces las copias normales. Tras recibir la entrega, código/copias/fixtures en **ddcbbc8**; distinción validez/compatibilidad y ensayo compacto de avisos en **91a9939e3ee8b7541f46cfe6d059b46bfa23e906**. El cierre documental posterior no cambia esa implementación revisada.

Archivos de la entrega propia: [lista completa](evidencias/B15/archivos-modificados.txt), separada de los documentos previos registrados en f534ffe.

### F1 — entrega y consumidor comprobados

El autor entregó `ASSETS/Entregas/2026-10-14-formato-2-contenido-4`: ambas 2/4, disponibles. Se verificaron aprobación 3, manifiestos, delta textual exacto y lista completa. Solo contentVersion 3→4 en ambos JSON y available false→true en metadatos; no reserialización. **63/63 archivos origen/APP/blob Git coinciden**, 58 cartas por baraja y 59 imágenes Solar conservadas respecto a 3. Las 126 entradas del manifiesto anterior y sus huellas se verificaron; la cifra 141 archivos previos conservados procede del registro de Gestor, sin atribuirle validación de aplicación. ASSETS se trató solo en lectura.

| JSON | SHA-256 origen = APP = Git |
|---|---|
| genérica/baraja.json | `b7855547acf56a728618f1e71be80cb19ca5c54a6ce0612cc3bee753270d2bd4` |
| genérica/cartas.json | `c2896ccae66d0119b808db7adea72cca7b442a283bf576e0cfaa7de2628c5c9b` |
| Solar/baraja.json | `3e31db300c706738e69d743703f2bd1d4d027b2b08743313fe54d15eb6943e44` |
| Solar/cartas.json | `bce5740a4ba3daf8da60ffad88a2cbc07271e95baae44bee078d0984973fa7fa` |

Manifiesto 4 original SHA-256 `ce2fb8cbb8c37b9b123667f4fc872aeaf2d905e51877e9200ab9474b681f857c`; manifiesto 3 `a14fdc710885999fb42699f91e1bd9b0ef644a24710bff418b5525ac2831d886`; aprobación 3 `b360d3880a3214cf0b5c27474a2007f3639467b0c62b67454a99eb0b87f21cdb`. [Copia/inventario](evidencias/B15/copia-2-4.json), [manifiesto recibido](evidencias/B15/MANIFIESTO_SHA256.json), [delta](evidencias/B15/DELTA_3_A_4.json) y [registro de Gestor](evidencias/B15/REGISTRO_ACTIVACION.md). Atributos Git específicos conservan los bytes de estos certificados; el catálogo sigue ignorado/generado.

El [contraste de cierre](evidencias/B15/cierre-huellas.json) vuelve a verificar origen/APP/índice y certificados. Tras aplicar los atributos Git se volvió a registrar explícitamente el trío para evitar la normalización previa de finales de línea; los bytes de APP/ASSETS no cambiaron.

`decks:validate` acepta V1 histórico/V2; el conjunto normal distingue **valid** de **compatible**. Una V1 válida disponible se informa «válida; incompatible con este consumidor» y bloquea preparación/arranque, sin parcial. V2 inválida/indeterminables bloquean; borradores reconocidos/false fiables se informan/excluyen y su validación individual falla si son inválidos. Se comprobó rechazo por proceso compilado antes de escuchar y conservación del catálogo anterior.

### Entorno, comandos y resultados reales

Windows, PowerShell, Node **24.19.0** en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`; npm 11.6.2 mediante el wrapper local T03 (sin instalación global), TypeScript 6.0.3, Vitest 5.0.2, Playwright 1.63.0. Chrome efectivo final **155.0.8059.40**, headless, DPR/escala visual 1, emulación CSS; no teléfono/monitor físico. ICU **78.3**, Unicode **17.0**, `Intl.Segmenter('es', {granularity:'grapheme'})`. Sus 766 fronteras se contrastan con el corpus oficial versionado. Fuentes efectivas consultadas por CDP: Segoe UI / SegoeUI-Bold; [registro](evidencias/B15/fuentes-efectivas.json).

| Comprobación ejecutada | Resultado nuevo |
|---|---|
| Base focal lector/JSON, antes de editar | 80/80 |
| Validación independiente V2, antes de entrega | 64/64; primer montaje falló por prefijo de limpieza y código esperado, reparados y registrados |
| `npm run decks:validate -- --package barajas/generica` y `... sistema-solar`; `npm run decks:prepare` | Salida 0, ambas válidas/disponibles, catálogo de dos |
| F1 lector/recursos/HTTP/arranque con build vigente | 156/156; construcción/arranque aislados con guard real de ASSETS |
| F2 focal aplicación/cliente y después configuración/inicio/Socket.IO | 180/180 y 54/54 (selecciones solapadas, no sumar como pruebas distintas) |
| `npm run check`, final 14:53 Europe/Madrid | **538/538**, 43 archivos; tipos/lint/build correctos, **70 módulos** sin imports prohibidos/ciclos |
| Primera integración, 15 archivos, `--workers=2` | 103/127; 24 fallos tratados, no declarada superada |
| Reensayo focal de reparación/B15/regresión, 12 archivos y filtro documentado | 62/65; tres mediciones de prueba corregidas |
| Cierre visual focal, seis archivos/filtro | 27/27 |
| Cierre literal F3, cuatro archivos/filtro | **21/21**, incluye 18 recorridos B15, partida normal, origen único y timeout real |
| B15 compacta: aviso propio, desconexión/F5 y automático, ensayo añadido | **1/1**, reloj controlado y conexiones reales |
| Última compilación de compatibilidad: Solar normal + origen único | **2/2**, adaptadores normales; no fixtures/respuestas simuladas en instalación normal |
| Captura comparable/ronda 6 legal y consulta de fuentes efectivas | 1/1 cada montaje auxiliar; no pruebas humanas |

No se suman repeticiones ni se afirma una batería de navegador completa pasada. Los 24 fallos iniciales tienen un éxito posterior con el mismo archivo/título en los reensayos focales; el registro estructurado lo contrasta. Los cierres históricos B04–B14 permanecen intactos. Logs brutos locales bajo `playwright-report/b15/` están ignorados; el [registro estructurado](evidencias/B15/resultados.json) conserva comandos/selecciones/resultados y fallos, y las capturas/medidas necesarias se versionan.

Selección inicial exacta: `format2Presentation.spec.ts solar.spec.ts activation.spec.ts decks.spec.ts configuration.spec.ts initialGame.spec.ts tableLayout.spec.ts pcTable02.spec.ts centeredTable03.spec.ts manualGame.spec.ts timedGame.spec.ts timedRealGame.spec.ts bots.spec.ts cancelGame.spec.ts resultNotice.spec.ts`.

Última selección F3 completa: `npm run test:browser -- --workers=2 format2Presentation.spec.ts timedRealGame.spec.ts solar.spec.ts proxy.spec.ts --grep 'B15|B08-19|B14 ejecución normal|T05 origen'`. Ensayo añadido: `npm run test:browser -- --workers=2 format2Presentation.spec.ts --grep 'compacta: primer aviso'`. Último reensayo del consumidor: `npm run test:browser -- --workers=2 solar.spec.ts proxy.spec.ts --grep 'B14 ejecución normal|T05 origen'`.

Se usaron instancias propias con puertos efímeros y `KARTA3_BASE_URL` definido por el montaje, nunca el servidor del autor. El proceso compilado normal final sirvió ambas 2/4 en `http://127.0.0.1:49980` (PID 26072 durante el ensayo); [instantánea del ensayo](evidencias/B15/normal-instance.json). JS servido SHA-256 `c8a92a4581a088ce2a9f27c2cc5672d207dccffb781249fdb95fa03beaf252f6` y CSS `6504f0e1f9a294b278be670c4a5cf5c5705895de18577cf574e95258f5d76d31` coinciden con build. Proceso vivo al cerrar comprobación, stderr vacío y ningún acceso a ASSETS; el montaje lo cerró después y eliminó solo su instalación temporal. Estos puertos ya no son servicios disponibles ni despliegue.

### Tiempo real y tiempo controlado

Timeout real final: genérica 2/4, SystemClock/TimerScheduler/CryptoCardPermutation; inicio **14:03:00.537**, límite **14:03:15.537**, transporte activo cerrado **14:03:00.606**, observado desde otra sesión **14:03:15.969**, 431 ms después del límite. Recuperación del mismo participante, contador propio 1, carta más antigua y modo TIMEOUT; [contexto/evento](evidencias/B15/vencimiento-real.json). No se acortaron los 15 segundos.

Plazos B03/revisión/retención/carreras, parciales, pérdida de ack, inactividad/desempate y montaje de escenas usan reloj sustituido identificado. HTTP/Socket.IO son reales, y las trazas aplican cartas/jugadas legales al motor; nunca puntos asignados ni saltos de fase. Una partida normal Solar con humano y EASY/HARD completó tres rondas finales, 45 puntos, resultado/recarga/otra sala, con entropía y tiempo normales. También se conservaron partidas genérica/humanos y mixtas 2–5 en la selección integrada. Ningún reloj controlado acredita media hora real.

### Resultados por criterio (cobertura técnica local)

| Criterio | Evidencia ejecutada / resultado |
|---|---|
| B15-01 | 63 archivos/manifiesto/copia/Git, delta exacto y recursos; correcto |
| B15-02 | 64 ensayos V2, corpus 766, M/M+1/codepoints/10–11 conjuntos, escalar/NFC/base/control/bordes/duplicados/diagnóstico, V1 histórico; correcto |
| B15-03 | Matriz preparación/carga y procesos compilados: V1 válida incompatible, V2 inválida, false fiable, indeterminables, vacío, catálogo ausente/corrupto/stale y sin parcial; correcto |
| B15-04 | 59 recursos Solar reales por URL v4/huella; null/error/escape/junction; build/runtime sin ASSETS y JSON privados; correcto |
| B15-05 | Defaults, selección/cambio/quitar, ficha/información exacta y catálogo ocho campos; correcto |
| B15-06 | Nuevos campos estrictos, HOST jugador/observador, invitado/ajeno, no-op/replay/conflicto/concurrencia, vencimiento y reservas; correcto |
| B15-07 | Dos sesiones/pestañas, pérdida de ack real, F5/sin reenvío, filtros de versiones/fases/contextos; correcto |
| B15-08 | Ambos decks/modos, tres filas/dos columnas, símbolo propio/activo, Detalles sin J/nombre duplicado, revisión/desempate, datos iguales con rangos distintos y literal fecha/texto/espacios; correcto |
| B15-09 | Información autorizada id/versión/instrucciones exactas, vacío, LF/HTML literal, cierre/cambio/quitar/anidado/foco; HTTP/ack/eventos seguros; correcto |
| B15-10 | 1367/1368 útiles medidos, normal on/off equivalente desde 1368, resize sin acciones/reinicio/foco perdido; correcto |
| B15-11 | Producto/ref final, PC/390/360/intermedio, cinco jugadores/observador/invitado, apertura/revisión/aviso/automático/desconexión; correcto técnicamente, aprobación humana pendiente |
| B15-12 | Quinta por teclado/foco, consultas anidadas, carruseles independientes, mano en adquisición, iniciales de orden base/O, nombres repetidos, drag no juega y envío único; correcto |
| B15-13 | Regresión legal humana/mixta/EASY/HARD, review 0/positiva, final/desempate/inactividad, B13/T04 y timeout real; correcto en montajes identificados |
| B15-14 | Gate final, arquitectura semántica/imports/ciclos, documentación/copia/capturas/medidas/instrucciones; correcto localmente |

### Comparación visual y límites medidos

Se revisaron capturas de producto junto a las referencias finales del 14/10. Antes B14 y producto posterior se comparan con dos jugadores, mismos ids/adquisición/indicadora, 390×844/1920×844, revisión 2 s y plazo 30 s; cambios autorizados: copias 2/4, dos columnas/modo Dato, Información y nueva composición. La primera captura posterior de pruebas usaba 60 s; se hicieron además las comparables de 30 s, sin ocultar esa diferencia. La captura anterior no registró versión binaria de Chrome: se conserva esa limitación, no se afirma igualdad de PNG.

| Perfil comparable | Altura antes → después | Ahorro local | Scroll residual posterior |
|---|---|---|---|
| genérica 390×844 | 1472 → 865 | 607 px | 21 px |
| Solar 390×844 | 1445 → 855 | 590 px | 11 px |
| genérica 1920×844 | 1055 → 1118 | **−63 px** (crece) | 274 px |
| Solar 1920×844 | 1093 → 1118 | **−25 px** (crece) | 274 px |

PC conserva 1400/1368, cartas 230×321, nombre 16 y valor 14 px; compacta base 220×188, nombre 18/valor 14, miniatura 32. Hay crecimiento/scroll legítimo por resumen, revisión, avisos o contenido; no alturas universales/recortes/fuentes dinámicas. El bloque Información aporta altura nueva: no se afirma ahorro PC. Referencia de juego alcanzada legalmente: cinco humanos, ronda 6, mazo 12, cuatro públicas y tres en mano activa; 25 puntos oficiales tras cinco rondas, ninguna asignación artificial. En 390×844: 358 útiles, altura 1033/residual 189; en PC 1920×1080: 1368 útiles, altura 1150/residual 70. Cartas/atributo/puntos y rol del actor difieren de los ejemplos de maqueta según la traza: el invitado no recibe Cancelar ni dirección editable tras apertura. [Comparación/medidas](evidencias/B15/comparacion.json) y [capturas](evidencias/B15/capturas/).

Reparaciones registradas: prefijo de limpieza del montaje independiente; expectativas explícitas de copias/fixtures y dos columnas; viewport frente a ancho disponible; encabezado accesible absoluto que escapaba del carrusel; foco nativo tras añadir Información/cierre anidado; cabecera normal preservada; regla móvil antigua que colocaba autor arriba y reservaba 220 px verticales; miniatura sin espacio de línea sobrante; espacios internos literales; diagnóstico común V2 y separación validez/compatibilidad. El montaje auxiliar de comparación necesitó esperar a carga/ResizeObserver tras recuperación, y el ensayo de origen consultó una instancia ya cerrada: ambos se repararon y reejecutaron. No se maquillaron fallos como aprobaciones.

### R01–R04, revisión y traslado

R01–R04 quedan **cubiertos técnicamente por B15**: comparación genérica/Solar/modos/layouts/consultas; selección/foco/quinta/plazos; copias/huellas/unidades/rangos/recursos; gates/capturas/medidas y categorías de evidencia. No se marcan los checks históricos B14 ni se reescribe su §5/6. Pendiente aprobación visual del autor y comprobación en dispositivos físicos; admisibilidad de textos arbitrarios no prueba legibilidad universal ni equilibrio.

Revisión semántica: Unicode/archivos/eligibilidad en infraestructura; selección/configuración/instrucciones/fijación/permisos/vistas en aplicación; Game y políticas sin cambios; DTO explícitos seguros; cliente sin parser temático/cálculo de resultados/temporización autoritativa. ESLint configura el contexto real de los scripts clásicos/módulos de Diseño recibidos, sin modificar sus bytes, excluirlos globalmente o debilitar producción/tests.

README y mapa APP incluyen el recorrido manual: dos perfiles/segunda pestaña, Dato/móvil, selección/quitar/Info/F5, observador, indicadora/Detalles/identidades/scroll/quinta/resize, timeout/revisión/resultados/cancelación/otra sala. **Pendiente como recorrido humano**, no realizado por automatización. C09–C10 conservan cobertura parcial; Linux/CI/imagen, dispositivos físicos, revisión humana, comprensión/equilibrio/publicación/despliegue no acreditados.

Para Coordinación/Arquitectura: consumidor V2 y ambas copias 2/4 disponibles entregados conjuntamente; V1 conserva validez histórica, incompatible si disponible en conjunto normal. Nuevos campos solo RoomSettings/fijados al iniciar, instrucciones versionadas en puertos/proyecciones autorizadas sin catálogo ampliado; normal/compacta medido y orden final correcto. Trasladar descripción efectiva a Aplicación §4/§§7.5–7.7 e Infraestructura §5.3/§9.5; no cambios de reglas, algoritmos o barajas por Implementación. Fuentes generales/Diseño/maestros intactos, sin mensajes a otros hilos ni publicación.
