# B20 — Apariencia personal y fotografías de uso

**Estado vigente:** implementado y comprobado técnicamente en Windows; alineación de Arquitectura y revisión visual humana pendientes. **Fecha:** 20/10/2026. [Registro nuevo §15](#15-registro-de-implementación--20102026). No verificado globalmente, sin publicación o activación de recogida. La preparación y sus resultados anteriores se conservan como históricos.

**Base comprobada:** carpeta única `APP/karta3`, rama `main`, HEAD `4e92efe7034cf6c10366daf90429d3f6ce02978c`. B20 libre. Ya estaban modificados `docs/sdd/PROCESO_SDD.md`, B19 y los documentos operativos `ANALITICA_USO.md` y `PREPARACION_ANALITICA_REAL_B19.md`; se conservan. No crear ramas/checkouts ni reinstalar. Los resultados históricos de B18/B19 no acreditan B20.

## 1. Fuentes, decisiones y alcance

- [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [plantilla](PLANTILLA_BLOQUE.md) y [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md): responsabilidades, privacidad y comprobaciones.
- [Aplicación](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), §§4, 7.5–7.7 y 16.1–16.2; [Infraestructura](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md), §§5.3, 12.1 y 14–15. Juego RAM; SQLite exclusivamente estadístico.
- [B18](BLOQUE_18_ANALITICA_BASICA_USO.md), [B19 vigente, §15](BLOQUE_19_HABILITACION_ANALITICA_REAL.md#15-alineación-vigente-conservar-elección-y-desplegar-directamente-human--19102026), [operación](../operacion/ANALITICA_USO.md) y [preparación B19](../operacion/PREPARACION_ANALITICA_REAL_B19.md): aceptar/rechazar/retirar, permiso de doce horas, ámbitos observables, cola, recibos, retención y consulta privada. La retirada de la elección que se propuso antes es un antecedente descartado.
- [Maqueta de paletas](../../../../TFM/Maquetas/comparativa-temas-mesa.html), SHA-256 `12ecaae4b7942b1846704de358a41e49e9e9e4fba52543d01b6848894375c6ab`. Es referencia cromática, no estructura, fixtures o mecanismo de carga para copiar al producto.
- B15, B17 y sus adendas gobiernan composición, cartas, títulos y columnas. Sus cierres se conservan.

**Confirmado por el autor:** cuatro temas personales persistentes; dos fotografías por participación humana jugadora, sujetas a B19; sin observadores/bots; informe privado sin panel. El 20/10 autoriza el ajuste mínimo por función de foco/bordes imprescindibles que no alcancen contraste, conservando la paleta. Su aclaración posterior fija el marcador inicial **«Predefinida»** y la etiqueta visible solo en espera/configuración, según §§2–3; sustituye el marcador «Modo» de la preparación anterior.

**Contrato técnico propuesto por esta especificación:** identificadores de tema, persistencia local versionada, acreditación breve de transición en vivo, evento `appearance_snapshot` y consulta `appearance`. Son decisiones de construcción del incremento, no funcionalidad ya entregada.

**Fuera:** cambios de reglas o paquetes, traducciones, fuentes, geometría de cartas/composición, umbral compacto, rediseño móvil, animaciones, editor de colores, selección por sistema, cuentas, recurrencia, registro de cambios de tema, tiempos por tema, dashboard y operación GitHub/GHCR/VPS. No mezclar la limpieza B19 pendiente ni otras incidencias.

## 2. Preferencia y selector

| Valor técnico | Etiqueta | Paleta de la referencia |
|---|---|---|
| `LIGHT` | Claro | `light` |
| `DARK` | Oscuro | `dark` |
| `CREAM` | Crema | `cream` |
| `HIGH_CONTRAST` | Alto contraste | `contrast` |

La procedencia local es `DEFAULT` o `EXPLICIT`. Sin registro válido: `LIGHT/DEFAULT`, sin escribir una elección automática. Elegir cualquiera, incluido Claro, produce `EXPLICIT`; recuperar una elección válida anterior mantiene `EXPLICIT`, aunque no se cambie durante esta partida. `DEFAULT` solo puede acompañar `LIGHT`.

**Interacción cerrada:** nombre accesible «Apariencia» en todas las pantallas; etiqueta visible «Apariencia» **solo en sala de espera/configuración**. En partida, Inicio y Resultados se muestra únicamente el selector, sin ese texto visible adicional. Inicialmente el control muestra **«Predefinida»**, referido a la apariencia y aplicando Claro. Este marcador no figura entre las opciones elegibles del menú ni permite volver a un supuesto quinto tema: opción inicial deshabilitada/oculta, o mecanismo nativo equivalente comprobado. El menú ofrece solamente Claro, Oscuro, Crema y Alto contraste. Elegir Claro cambia el valor del selector y registra una elección expresa, aunque no cambien los colores. Después muestra la elección real. Describir de forma accesible «Claro aplicado por defecto» sin añadir texto visible al marcador. No registrar analítica por este gesto. Borrar/inutilizar la preferencia fuera del control puede restablecer el estado inicial.

**Persistencia:** clave local `karta3.appearance.v1`, valor JSON cerrado `{ "version": 1, "theme": "LIGHT" }` con uno de los cuatro temas. Un registro válido implica elección expresa: no guardar fecha, procedencia redundante, sesión, identificador o historial. Leer con validación estricta; ausencia, JSON inválido, versión/valor desconocido o estructura extraña → Claro predeterminado. No migración silenciosa de claves desconocidas.

Actualizar inmediatamente la pestaña actual; escribir solo al elegir. En otras pestañas del mismo origen, atender `storage` y releer el valor vigente: prevalece la última escritura correcta, sin confiar en un evento antiguo; [referencia técnica de Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-event). Eliminación/registro inválido vuelve a Claro predeterminado. No prometer sincronización entre dispositivos, perfiles u orígenes. Con lectura/escritura bloqueada, conservar la elección en memoria del documento, sin impedir jugar; informar discretamente de que no podrá recordarse si falla el guardado. No prometer persistencia o coordinación entre pestañas en ese caso; recargar puede perderla o recuperar el registro anterior.

Aplicar mediante un estado local compartido y arranque anterior a la bifurcación App/PrivacyScreen. Evitar destello del tema equivocado con una inicialización local breve, sin red ni nuevas dependencias. Un cambio no remonta la partida, pide configurar sala, renueva actividad, modifica selección/dirección, mueve carruseles, pierde foco o reinicia plazos. La preferencia funciona sin aceptación analítica.

## 3. Ubicación y conservación del recorrido

| Pantalla/perfil | Posición y garantías |
|---|---|
| Partida ancha, anfitrión jugador u observador | Solo selector, sin etiqueta visible, a la izquierda de Cancelar; Cancelar continúa en el extremo superior derecho. |
| Partida ancha sin permiso de cancelar | Solo selector, sin etiqueta visible, en la zona superior derecha, sin añadir Cancelar. |
| Estrecha/compacta | Solo selector, sin etiqueta visible. Si hay Cancelar, inmediatamente debajo; si no, ocupa esa zona superior derecha. Reutilizar perfiles existentes, sin un nuevo umbral. |
| Espera, anfitrión | Etiqueta visible «Apariencia» y selector al final de sus opciones, grupo «Preferencia personal»; independiente del guardado/permisos de configuración compartida. |
| Espera, invitado | Etiqueta visible «Apariencia» y selector propio junto a la configuración consultable, conservando ficha y datos de sala. No parece impuesto por el anfitrión. |
| Inicio y resultados | Solo selector, sin etiqueta visible, en zona superior coherente, sin cubrir acciones o información; cambiarlo en Resultados no genera otra fotografía final. |
| `/privacidad` independiente | Respeta el tema mediante la inicialización local; no monta flujo de juego, crea sesión ni emite visita estadística. No es necesario duplicar el selector en cada diálogo. |

El espacio nuevo se limita al grupo de controles. Permanecen resumen→Mesa→mano en compacta, indicadora consultable, carruseles independientes, consulta de quinta carta y foco. `optimizeForMobile` continúa **compartido** y fijo al iniciar; Apariencia es **personal**. No añadirla a `RoomSettings`, `GameSettings`, ficha pública de sala o instantánea compartida de configuración.

## 4. Paletas y accesibilidad

Variables por función, separando superficie/texto/borde. Valores de referencia (cada celda mantiene ese orden):

| Función | Claro | Oscuro | Crema | Alto contraste |
|---|---|---|---|---|
| Página / texto / secundario | `#f3f5fa / #1c2540 / #566178` | `#101725 / #eef3fb / #bac7dc` | `#eee4d4 / #392f25 / #6c5c4c` | `#000000 / #ffffff / #e7e7e7` |
| Panel / borde | `#ffffff / #e2e6ef` | `#1b273a / #40536f` | `#fff9ef / #cbbcaa` | `#0b0b0b / #e7e7e7` |
| Carta / texto / borde / separador | `#f7f8fc / #1c2540 / #cbd3e2 / #d4dbe8` | `#f7f8fc / #1c2540 / #acbbd0 / #cbd3e2` | `#fffdf8 / #392f25 / #bcab95 / #d5c9b9` | `#ffffff / #000000 / #ffffff / #555555` |
| Fila activa / texto / abridor | `#fff0d9 / #182342 / #edf1f9` | `#ffe5b3 / #182342 / #314660` | `#f4dfb9 / #382b1b / #eadcc4` | `#ffe066 / #000000 / #343434` |
| Principal / texto / borde | `#29428d / #ffffff / #182b58` | `#b7d1ff / #122442 / #b7d1ff` | `#72502f / #ffffff / #55391f` | `#ffe066 / #000000 / #ffe066` |
| Control / texto / borde | `#ffffff / #182b58 / #a7b2c8` | `#25354c / #eef3fb / #8097b9` | `#fffdf8 / #55391f / #a18a6e` | `#111111 / #ffffff / #ffffff` |
| D / texto / borde | `#ffffff / #182b58 / #a7b2c8` | `#ffffff / #182b58 / #a7b2c8` | `#fffdf8 / #55391f / #a18a6e` | `#ffffff / #000000 / #000000` |
| Enlace / foco / nota / velo | `#182b58 / #b45a00 / #edf1f9 / #141d35ad` | `#bcd8ff / #ffbd66 / #263950 / #000000c7` | `#68411f / #974400 / #eadcc4 / #2c2118b8` | `#92dfff / #00bdc7 / #242424 / #000000df` |

No copiar la geometría de la maqueta. Mantener tipografía, tamaños, alineación, título mínimo/corte aprobado, columnas, contenido e imágenes sin filtros. En Oscuro las cartas y D conservan fondo claro **y texto oscuro propio**. Cubrir también paneles compactos, formularios, información, tablas, avisos, foco, selección, deshabilitados y diálogos/velo. Usar `color-scheme` coherente para controles nativos sin sustituir su interacción.

**Excepción cromática aprobada:** si el foco sobre una superficie clara o el borde imprescindible de un control no llega a 3:1, usar el color oscuro de texto/borde principal ya presente en esa paleta para esa función. Mantener el cian donde sí contrasta sobre fondo oscuro. Para D sobre imágenes, dar al indicador de foco contraste con la superficie propia del control; no asumir que contrasta con cualquier fotografía ni desplazarlo. No cambiar medidas/posición/bordes en grosor para resolverlo. Estados de error/éxito que la maqueta no define conservan significado y usan pares semánticos legibles de la paleta; documentar las excepciones, sin sustitución global de hexadecimales.

La maqueta modifica también Claro actual: por ejemplo unifica principal `#182b58`/`#24418a` en `#29428d` y secundarios en `#566178`; registrar diferencias reales al implementar. Cálculo auxiliar de preparación: cian `#00bdc7`/blanco ≈2,31:1; borde `#a7b2c8`/blanco ≈2,13:1. No son comprobaciones del producto. Verificar pares efectivos, incluido foco: [texto normal 4,5:1 y grande 3:1](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [componentes/indicadores necesarios 3:1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). «Alto contraste» no acredita conformidad completa por su nombre.

## 5. Qué se observa y qué no

Unidad: **una participación HUMAN jugadora en una partida**. Ni BOT ni anfitrión observador. Se conservan las puertas B19: permiso propio vigente y ciclo estadístico observable con aceptación de todos los humanos afectados, incluido observador. Una sala censurada no se reactiva por aceptar después. No crear referencias de juego estadísticas para reconstruir un ámbito que B19 no observó.

| Momento | Captura del cliente | Exclusiones |
|---|---|---|
| `START` | Apariencia/procedencia congeladas al presentar por primera vez la mesa inicial de una nueva partida recibida en vivo, con contexto admitido. | No al configurar, cambiar tema, cargar una partida ya iniciada, recargar o aceptar más tarde. |
| `END` | Apariencia/procedencia al pasar de estar mostrando esa partida en curso a recibir su finalización en vivo: normal, inactividad o cancelación. | No al visitar después Resultados, recargar allí, consultar último resultado o cambiar tema en esa pantalla. |

Es una observación lógica de transición del cliente, no captura sincronizada exactamente con el reloj del servidor, atención o presencia física ante pantalla. No medir visibilidad/atención. Un humano automático que conserva su conexión sigue siendo jugador; el bot nunca entra en esta población. Una parada técnica sin pantalla de finalización no fabrica `END`.

Solo dos fotografías: Claro→Oscuro→Claro produce el mismo par de temas que Claro→Claro. No inferir ausencia de cambios ni «preferencia» demostrada. Sin permiso, cierre del navegador, pérdida de red, fallo de envío o ventana vencida puede faltar una o ambas; conservar la ausencia, nunca rellenarla con Claro. Un `END` válido puede existir sin `START` si falló aquella comunicación pero el ciclo B19 seguía admitido.

## 6. Acreditación breve de transición en vivo

Reutilizar HTTP estadístico, Socket.IO, reloj, permisos y cola existentes. Para impedir que una consulta tardía invente fotos, aplicación abre una oportunidad **solo una vez**, al publicar el inicio real o el resultado terminal real. No se abre por lectura/resume, ack repetido, recarga, reconexión, cambio de tema o consulta de resultado.

1. Con referencias estadísticas originales y permisos válidos, aplicación autoriza la oportunidad para los jugadores humanos. Infraestructura la asocia a las conexiones autorizadas que ya estaban abiertas al producirse el hecho. Añadir al evento seguro `RoomStateEvent` un campo opcional `appearanceWindow: { gameId, moment: 'START' | 'END', token, expiresAt }`. Se emite individualmente por conexión; el token no se difunde a otros participantes.
2. Token UUID v4 aleatorio, vinculado en RAM a sesión funcional, conexión/generación, partida, participación estadística y momento. **Diez segundos** de vigencia inicial verificable, desde la transición; reloj monotónico decide, `expiresAt` solo informa. En igualdad prevalece caducidad aunque el callback se retrase. Como máximo **4096 oportunidades RAM**; al llenarse se omite estadística y se registra pérdida técnica acotada mediante el mecanismo existente, sin bloquear ni limitar partidas.
3. Invalidar al desconectar esa conexión, retirar/vencer permiso, apagar recogida o reiniciar proceso. La nueva conexión no hereda el token ni reabre el momento. Revalidar ámbito B19 al recibir. No añadir persistencia de sesión, cookie estadística, identificador entre visitas ni un token en la URL.
4. El cliente congela su valor en la transición, con permiso vigente. Para START, ese documento ya estaba en la espera de esa sala y recibe su nuevo inicio, no una recuperación de partida en curso. Si un ack de juego aplica la vista antes del evento de socket, puede conservar esa captura **en memoria y hasta diez segundos** esperando el permiso de transición correspondiente; no volver a leer el tema cuando llegue. La metadata se procesa aunque la revisión de sala ya se haya aplicado por el ack, sin reaplicar vistas antiguas.
5. Solo se envía con ventana correspondiente, misma conexión y transición real del documento. Primera carga directa de RESULTADOS no sirve para `END`; recuperar EN_PARTIDA no sirve para reconstruir `START`. Si la conexión pierde continuidad, descartar la captura pendiente. La entrega de estado de juego sigue funcionando aunque no se emita/reciba esta metadata.
6. Para `END`, conservar durante esa breve ventana las referencias/autorización propias aunque el juego ya haya liberado la sesión para otra sala. No retener la sala como activa. El mensaje de partida A no aplica estado ni altera sala B: conservar T04 y los filtros vigentes de mensajes antiguos.

No afirmar que un enlace no detectado o una latencia de red permite conocer el instante físico de desconexión: se valida la continuidad conocida por el sistema y la observación del cliente. No implementar recuperación/reenvío estadístico durante la reconexión ni pausar el juego esperando fotografías.

## 7. Evento, admisión y deduplicación

**Ampliación expresa B20:** un tipo nuevo, `appearance_snapshot`, versión **1**. Los nueve anteriores y sus versiones/significados no cambian: habrá diez tipos, no nueve eventos emitidos por cada partida. Contratos separados de petición y evento normalizado.

Petición al transporte BROWSER existente `/api/usage/events`, con las mismas restricciones de origen/autenticación, límite de 2 KiB y presupuestos vigentes:

```json
{
  "eventId": "UUID-v4",
  "version": 1,
  "visitId": "UUID-v4-de-la-visita-admitida",
  "name": "appearance_snapshot",
  "data": {
    "gameId": "id-funcional-de-partida",
    "moment": "START",
    "windowToken": "UUID-v4-de-la-oportunidad",
    "theme": "LIGHT",
    "origin": "DEFAULT"
  }
}
```

Es un esquema ilustrativo, no un evento válido para importar. Campos exactos; tema/procedencia/momento cerrados; `DEFAULT` exige `LIGHT`. El navegador no elige entorno, tráfico, participación, fechas o referencias estadísticas. El servidor acredita identidad y participación/contexto, **no puede demostrar qué colores vio realmente el usuario**.

Evento almacenado: `source: BROWSER`, nombre/versión anteriores, envolvente temporal/entorno/tráfico/boot existente y `visitId` acotado; `data: { roomRef, gameRef, participationRef, moment, theme, origin }`, derivado de referencias admitidas originales. No persistir `gameId`, token, sesión, socket, nombre, código, cookies, IP, dispositivo, manos ni mensajes completos. Tiempo del evento = recepción del servidor; la fecha de cohorte del informe es otra (§8).

**Primero válido admitido gana** por `(gameRef, participationRef, moment)`, incluida la competición entre pestañas. Una segunda pestaña con otro tema no sobrescribe el primero ni crea un conflicto estadístico de juego. Mantener deduplicación por `eventId` y clave lógica en RAM/almacenamiento; repetir el mismo identificador con otro cuerpo se rechaza. Reservar al admitir en la cola, no por un intento inválido; si luego se pierde el evento, registrar la pérdida y dejar ausencia, sin reconstrucción.

Respuestas compatibles con el transporte: `202` admitido en cola, **no prueba de escritura durable**; `204` sin admisión por apagado, permiso/contexto/ventana ausente o duplicado lógico; `400` formato/enum/incoherencia; `403` origen/identidad ajena; `429` presupuesto; `503` indisponibilidad. Conservar el rechazo de sesión que ya aplique el adaptador. No devolver detalles de otra participación o datos privados en errores.

Reutilizar como máximo el reintento B18 de 500 ms dentro del presupuesto de diez segundos, mismo `eventId` y captura, solo si siguen vigentes conexión/ventana/permiso. Nada de colas nuevas durables o reenvío al recuperar. Retirada/OFF cancela pendientes y atraviesa la barrera existente de ámbitos. Fallos de emisión/cola/DB no rechazan inicio, jugada, final o consulta de resultados. Mantener separación HUMAN/SYNTHETIC/entornos; ensayos siempre fabricados y aislados.

## 8. Proyección, conservación y consulta

Nueva consulta administrativa fija **`appearance`, versión 1**; las ocho anteriores no cambian. Sin API pública, SQL libre, panel ni acceso por rol de anfitrión. Mismos permisos privados y filtros de entorno/fechas/tráfico existentes; CSV sin referencias individuales ni fórmulas ejecutables.

Proyección por participación jugadora estadísticamente admitida: fecha de inicio de partida, capacidad de medición B20 y opcionales `start`/`end`, cada uno `{theme, origin}`. Máximo cinco por partida. Marcar la capacidad al incorporar un inicio nuevo del runtime B20, **no al leer cualquier inicio histórico con el esquema nuevo**. No añadir tema a `game_started.configuration` ni reinterpretar sus campos.

**Persistencia:** esquema estadístico **2→3**, con actualización controlada de lector/escritor/mantenimiento y compatibilidad de lectura histórica 1/2. Conservar datos previos, recibos y ocho informes. Registrar la frontera de instrumentación B20; migrar no convierte partidas anteriores en casos con fotos perdidas o Claro predeterminado. No arrancar binario B19 contra esquema 3; contingencia compatible B20 con recogida OFF. No ejecutar migración u operación desde SDD.

Todas las cifras de esta consulta se agrupan por **inicio de partida UTC**, intervalo `[from,to)`, también los finales y pares; así una partida que cruza medianoche/mes no rompe el par. La hora de recepción de cada foto se conserva en detalle para calidad, no cambia su cohorte. Mantener las restricciones existentes de granularidad cuando solo queden agregados mensuales.

| Cifra/informe | Numerador y denominador |
|---|---|
| Inicio, por tema y procedencia | Conteo de `START` de esa categoría / todos los `START` válidos del filtro. |
| Final, por tema y procedencia | Conteo de `END` de esa categoría / todos los `END` válidos del filtro. |
| Transiciones netas | Matriz `(tema/procedencia inicial → tema/procedencia final)` / participaciones con ambas fotos válidas. |
| Cobertura observada | Elegibles instrumentados; con inicio; con final; emparejados; solo inicio; solo final; ninguno. No es toda la audiencia. |

Denominador cero → porcentaje `null`, no 0 % de preferencia. Un END todavía ausente en una partida activa es pendiente, no prueba de pérdida o abandono; usar el estado/calidad ya disponibles para explicarlo. Cambios de procedencia con mismo tema son distinguibles; no deducir cambios intermedios. Etiquetas «Tema al inicio»/«Tema al finalizar», nunca «tema preferido» o «personas únicas». Fechas anteriores a instrumentación → «No instrumentado»; un filtro mixto identifica cobertura parcial sin rellenar históricos.

Salida JSON específica versionada: `report`, `version`, `traffic`, `filter`, `cohort: GAME_STARTED`, calidad existente/frontera de instrumentación, `population`, distribuciones `start`/`end` y `transitions`. No forzar una única razón global `numerator/denominator` sobre toda la matriz. CSV plano con filas START/END/PAIR/COVERAGE, categorías/procedencias, conteo, denominador, porcentaje y metadatos de filtro/calidad; sin identificadores de juego, visita o participación.

Comando previsto, con fechas de ejemplo que el administrador sustituirá: `npm run usage:report -- --report appearance --from 2026-10-20T00:00:00Z --to 2026-10-21T00:00:00Z --environment pruebas --format csv`. Mismas garantías de lector privado/solo lectura y separación de tráfico; adaptar enumeraciones/validadores/limpieza de exportaciones para esta novena consulta sin abrir consultas arbitrarias.

Detalles y correlaciones: máximo **90 días**. Consolidar por mes de cohorte antes de purgar; guardar marginales, pares y cobertura **una sola vez**, sin ids, durante **12 meses incluido el actual**. Un mantenimiento repetido no suma otra vez ni espera indefinidamente una foto ausente. Copia/restauración cifrada sigue siendo solo de agregados; conservar formato criptográfico existente y validar el esquema ampliado, sin recuperación de detalle. Calidad/pérdidas/censura existentes siguen visibles; las cifras consentidas no representan automáticamente toda la audiencia.

## 9. Información pública y permiso

La preferencia local no es una estadística ni depende del consentimiento. Extender mínimamente el aviso visible/versión del permiso B19 antes de admitir fotografías reales. Texto propuesto para integrar, sin sustituir identidad, derechos, operación o plazos vigentes:

> Puedes elegir Claro, Oscuro, Crema o Alto contraste. Recordamos únicamente ese tema en este navegador para aplicarlo en próximas visitas; no sincronizamos la elección entre dispositivos. Si el almacenamiento no está disponible, se conserva durante la página abierta. Puedes usar Apariencia aunque rechaces la analítica.
>
> Si aceptas la analítica y se cumplen sus condiciones de cobertura, registramos el tema aplicado y si procede del valor predeterminado o de una elección expresa en dos momentos de tu participación como jugador: al entrar en la mesa inicial y al recibir el final. No registramos cada cambio ni cuánto tiempo usas un tema. No incluimos bots u observadores en estas fotografías. Si falta una comunicación, no reconstruimos el dato; consultar un resultado después no registra el tema con el que terminó la partida. Los informes describen uso de la muestra observada, no preferencias demostradas ni personas únicas.

Versión nueva propuesta **`2026-10-20.1`**, previa comprobación de que no esté ocupada al implementar. Aviso `2026-10-19.2` conserva su evidencia histórica; B20 sí cambia el tratamiento descrito. Aplicar la invalidación por versión de B19: un recibo anterior no autoriza automáticamente la ampliación; se vuelve a utilizar **la misma elección**, sin un permiso aparte. No reconstruir inicio después de aceptar. Mantener doce horas, retirada, plazos de recibos y el resto de garantías; no aprovechar la actualización para retirar aceptación o ampliar datos.

La comprobación del texto y su correspondencia con el producto forma parte del cierre B20. Publicar una especificación o superar pruebas no autoriza activar recogida, cambia preparación operativa ni demuestra cumplimiento jurídico universal.

## 10. Responsabilidades, dependencias y áreas afectadas

| Responsabilidad | Ubicación/área existente | Dependencias y comprobación |
|---|---|---|
| Preferencia, persistencia y coherencia de pestañas | Módulo/hook local en `src`, bootstrap de `src/main.tsx`; selector reutilizable | DOM/Storage solo cliente; contrato de valores puro. Pruebas con almacenamiento sustituido y navegador; sin imports `server` o peticiones de sala. |
| Paletas, ubicación y pantallas | `src/style.css`, `App.tsx`, `screens.tsx`, `RoomConfiguration.tsx`, `GameScreen.tsx`, `ResultsScreen.tsx`, `PrivacyScreen.tsx`, controles/diálogos compartidos | Reutilizar vistas/componentes. Comparación de estilos/geometría y revisión de cascada, sin copiar estructura de la maqueta. |
| Valores/mensajes públicos | `shared/contracts/usage.ts`, metadata segura en `shared/contracts/room.ts`; aviso en `shared/contracts/privacyNotice.ts` y versión | Tipos/validadores puros, sin IO ni objetos privados; separar entrada y hecho normalizado. Pruebas de campos exactos y privacidad. |
| Admisión y oportunidades de transición | `server/application/usage/recording.ts`, `choice.ts`, contratos/puerto estadístico; enganches mínimos al inicio/final existentes | Aplicación decide ámbito, momento y unicidad; puertos para reloj, id, emisión y conexión. No SQL/Express/Socket.IO en aplicación; fallo estadístico aislado. |
| Conexión real y transporte | `server/infrastructure/socketRooms.ts`, `usage/http.ts`, `eventValidation.ts`; `src/socket.ts`, `useRoomFlow.ts`, `usage.ts`/`api.ts` | Adaptar conexión→contexto de aplicación, sin decidir resultados oficiales. No compartir tokens entre participantes o meterlos en Room/Game; pruebas HTTP/socket reales. |
| Fórmulas/proyección/consulta | `server/application/usage/contracts.ts`, `projections.ts`, `reports.ts`, `query.ts` | Sin SQL/worker/Node; proyección/fórmulas en aplicación. Puertos reader/sink/maintenance existentes ampliados proporcionalmente. |
| Persistencia y operaciones privadas | `server/infrastructure/usage/schema.ts`, `sqliteStore.ts`, `sqliteReader.ts`, worker, backups y archivos privados; `server/composition/usage*.ts` | SQL/migración/recursos en infraestructura; conexión y CLI en composición. Integración con DB temporal, retención/copia reales, sin acceso público. |
| Pruebas y entrega documental | Pruebas existentes por área, `tests/browser`, soporte estadístico compilado; README/operación/mapa APP | Arquitectura automática y revisión semántica; evidencias identificadas por fuente/build. No editar TFM. |

**Dominio y algoritmos de Game no cambian.** Un enganche de observación no decide cartas, fase, permisos de juego o plazos. Dirección: composición→infraestructura→aplicación→dominio; cliente→contratos puros. Ni el panel futuro ni el cliente consultan tablas. No crear otra cola, plataforma, repositorio de juegos o abstracciones anticipadas.

**Autonomía:** nombres internos, hook/contexto, técnica de token CSS, tablas/índices y detalles de inyección compatibles, ubicación de pruebas y optimización local. Volver al autor ante cambios de contenido, geometría, población/momentos/datos medidos, consentimiento, persistencia jugable, composición compacta o una incompatibilidad real. No sustituir el diseño para superar una prueba.

## 11. Etapas, dependencias y coste/riesgo

| Etapa | Entrega comprobable | Coste/riesgo relativo y puerta |
|---|---|---|
| P1 — Visual personal | Preferencia/«Predefinida», bootstrap, cuatro paletas, selector y etiqueta según pantalla y ajuste de contraste autorizado | **Medio**: más que cuatro colores; cascada con sobrescrituras, cartas claras en Oscuro, diálogos y compacta. Revisar capturas/medidas y accesibilidad antes de ampliar analítica. Funciona con recogida OFF. |
| P2 — Ampliación estadística | Oportunidades de transición, evento/admisión, dedupe, esquema 3, proyecciones/consulta/CSV y mantenimiento | **Medio-alto**, mayor que P1: contexto en vivo, ack/eventos/pestañas, pérdida/censura y compatibilidad histórica. Requiere B19 existente y puertos de conexión/estado; no servicio externo. Pruebas focales fabricadas por capa. |
| P3 — Integración y cierre | Aviso actualizado/versión, recorridos de producto, regresiones y documentación de uso/calidad | **Medio**, dependiente de P1+P2; una compilación final identificada y puerta pertinente. No cerrar B20 solo con selector o mocks estadísticos. |

No se estiman horas/tokens sin ejecución. Separar commits/evidencias visuales y estadísticas facilita revisar y localizar regresiones, preservando el trabajo previo. No hay una decisión funcional pendiente para empezar; el autor debe revisar esta especificación/encargo antes de trasladarlo. Alineación general del nuevo tratamiento y revisión humana de colores siguen siendo puertas de cierre, no funcionalidad ya aprobada por una maqueta.

## 12. Ejemplos comprobables

| Caso | Dado / cuando | Resultado previsto |
|---|---|---|
| E1 — Predeterminado/Claro elegido | Sin clave se inicia y luego se elige Claro | Inicial «Predefinida», LIGHT/DEFAULT; después «Claro», LIGHT/EXPLICIT, clave válida. Marcador ausente de opciones elegibles; etiqueta visible solo en espera/configuración. Cero evento por la selección. |
| E2 — Memoria y pestañas | Elegido Crema, recarga, otra sala y otra pestaña cambia Oscuro | EXPLICIT recordado; otras pestañas del origen releen última escritura; cada participante de otro navegador mantiene su preferencia. |
| E3 — Sin almacenamiento/permiso | Storage falla y se rechaza analítica; se elige Alto contraste | Tema en memoria, juego operativo, sin foto/emisión/identificador estadístico. Aviso no bloqueante si falla guardado. |
| E4 — Par y cambios intermedios | START LIGHT/DEFAULT; luego Oscuro y Claro elegido; END LIGHT/EXPLICIT | Un par con tema igual y procedencia diferente. No demuestra ausencia de cambios; no existe un evento intermedio. |
| E5 — Final perdido | Inicio admitido; navegador cerrado antes del final; abre último resultado | Solo inicio. Consultar resultado no genera final ni reconstruye su tema. |
| E6 — Dos pestañas y ack perdido | Llegan dos fotos del mismo jugador/momento y se repite petición | Primera válida admitida una sola vez; no sobrescritura, nueva jugada, conflicto de sala ni doble agregado. |
| E7 — Permiso/contexto tardío | Sin permiso al inicio; acepta después o reconecta | No crear START retrospectivo ni resucitar un ciclo censurado; se mantiene cobertura B19. |
| E8 — Cancelación y T04 | Se recibe END de A, se crea sala B, llega repetición o caduca resumen A | Ninguna operación altera/libera B; foto única de A o ausencia si perdió ventana. |
| E9 — Histórico | Datos B18/B19 sin apariencia más datos B20 | Ocho informes conservados; anterior «No instrumentado», no Claro ni «ninguno» inventado. Agregación repetida conserva cifras. |

## 13. Aceptación y plan proporcionado

Plan de aceptación conservado de la preparación, entonces **previsto, sin ejecutar**. Los resultados reales por criterio están en §15 y su evidencia; esta lista no acredita por sí sola una prueba:

- [ ] **V01:** cuatro valores estrictos; marcador «Predefinida» frente a Claro explícito, sin quinto tema elegible; preferencia válida anterior sigue EXPLICIT; valor/versión/JSON inválidos, borrado y fallos de lectura/escritura tratados sin bloquear.
- [ ] **V02:** persistencia, coherencia entre pestañas y aislamiento de otros navegadores; elección independiente de anfitrión/sala/baraja/consentimiento. Cambio no emite configuración o estadística ni renueva tiempos.
- [ ] **V03:** ubicaciones de §3 con HOST jugador/observador e invitado; etiqueta «Apariencia» visible solo en espera/configuración y nombre accesible mantenido siempre; partida, Inicio y Resultados con solo selector. Configuración y datos del invitado conservados; privacidad independiente sin flujo/cookie/visita nueva.
- [ ] **V04:** paletas completas, claros propios de cartas/D en Oscuro, textos/avisos/deshabilitados y contraste/foco por función registrados. Misma tipografía, medidas, composición y contenido fuera del espacio autorizado de controles.
- [ ] **V05:** teclado/foco/Escape en selector y diálogos, D/Jugar/consultas, carruseles y arrastre sin jugadas accidentales; dirección parcial/plazos/revisión y estado conservados al cambiar tema o tamaño.
- [ ] **A01:** dos momentos reales por HUMAN jugador, no bot/observador. Inicio/final congelados según §5–6; técnicas/consultas tardías no generan final. Falta de foto explícita.
- [ ] **A02:** permisos propios/ámbito B19, aceptación posterior, retirada/caducidad/OFF, límites y separación de tráfico. Cero foto sin admisión; ninguna creación anticipada de identidad estadística por elegir tema.
- [ ] **A03:** petición estricta, identidad/contexto ajenos rechazados; token vencido/desconectado, varias pestañas, recarga, ack/evento en ambos órdenes, doble clic, duplicados contradictorios y mensajes de A al entrar en B. Primera admisión gana una sola vez.
- [ ] **A04:** foto con mismo tema, distinto y regreso al inicial; DEFAULT frente a EXPLICIT; inicio/final aislados y pares; fórmulas/CSV/ausencias y cohortes correctas, denominador cero sin porcentaje inventado.
- [ ] **A05:** esquema histórico/migración 2→3, no backfill; ocho informes previos equivalentes. Consolidación 90d/12meses repetible, copia/restauración solo agregados y exportaciones privadas controladas.
- [ ] **A06:** cola llena, token budget, writer/DB indisponible y pérdida de confirmación no alteran juego o reintentan sin límite; privacidad HTTP/ack/eventos/DB/CSV/logs sin datos excluidos.
- [ ] **I01:** aviso mínimo y versión nueva, aceptación anterior no promovida, misma elección B19; README/operación/mapa APP y conclusiones de alineación actualizados sin reescribir históricos.
- [ ] **I02:** `npm run check` y navegador pertinente sobre la compilación final; revisión automática de dependencias/ciclos y semántica de responsabilidades. Resultado, fallos y límites reales registrados, sin declarar publicación o revisión física.

**Matriz visual representativa, sin producto cartesiano:** los cuatro temas en una partida ancha y compacta equivalentes; Inicio, espera HOST/invitado, Resultados y diálogos repartidos entre ellos. Referencias de prueba: PC 1800×1000, móvil 390×844 e intermedio 1100×900; medir área útil real y cubrir frontera útil 1367/1368 con optimización Sí/No. Son tamaños de ensayo, no nuevos perfiles de producto. Elegir casos de genérica sin imagen, Solar con unidad/nombre largo y Criaturas con Resistencia; no repetir toda validación de paquetes/Unicode. Mantener dimensiones vigentes por representación, no imponer 230 px a minicartas.

**Medición visual:** capturas antes/después de la misma fuente base y final, viewport útil, estado, baraja, mano/modo y fuentes efectivas. Comparar paleta con maqueta y geometría con producto previo; registrar cajas de cartas, título/columnas, imagen, D/Jugar, paneles/carruseles, foco y ausencia de solapamientos. No coincidencia píxel a píxel entre sistemas. La maqueta no acredita el producto. No reducir letra/recortar contenido o cambiar geometría si aparece un problema: medir y devolver propuesta mínima al autor.

**Pruebas estadísticas:** puras con puertos sustitutos para admisión/fórmulas; DB temporal real para esquema, duplicados, consulta/CSV, agregados y copia. Reloj controlado para ventana antes/en/después del límite, expiración/revocación y 90d/meses; no esperas reales largas. Integración compilada con dos sesiones y varias pestañas: inicio/final normal, inactividad y cancelación; desconexión real antes del final y consulta posterior sin foto fabricada. Verificar que una ausencia de permisos de un observador afecta cobertura, pero jamás produce una foto del observador. Fallos de almacenamiento inducidos sin alterar plazos/jugadas.

**Regresiones pertinentes:** seleccionar casos de `usage*.spec.ts`, `privacyNotice.spec.ts`, `format2Presentation.spec.ts`, `cardTitleFit.spec.ts`, `cardColumns.spec.ts`, `cardFace.spec.ts`, `cancelGame.spec.ts` y `timedGame.spec.ts`, más T04 en recorridos vigentes. Añadir pruebas B20 específicas. Ajustar expectativa de nueve/ocho a diez/nueve solo en el contrato B20 que cambia, sin debilitar escenarios históricos o permisos.

Ejecutar comprobaciones focales por etapa; al cerrar, `npm run check` y una selección justificada de navegador con build actual, identificando casos y resultados. No relanzar baterías verdes sin cambio/riesgo concreto; GitHub conserva sus puertas posteriores. Diferenciar cálculo auxiliar, pruebas puras/DB, maqueta, producto compilado, revisión visual del autor y dispositivos físicos; ninguna acredita automáticamente las demás.

## 14. Traslado posterior y cierre

**Para Arquitectura, por medio del autor:** añadir preferencia local personal y su almacenamiento/alcance al recorrido de aplicación; mantener `optimizeForMobile` compartido. Alinear Aplicación §§7/16 e Infraestructura §§5.3/12.1/14–15 con dos fotos de jugadores admitidos, diez tipos/nueve consultas, información/versionado, ventanas RAM, esquema estadístico 3, cohorte y agregación. La exclusión anterior del tema queda ampliada solo aquí. No cambian dominio, persistencia RAM de juego, bots, reglas ni operación autorizada. La recepción de esa alineación se registra antes del cierre verificado; no editar TFM ni enviar mensajes desde este encargo.

**Relación con el máster:** métricas accionables limitadas a uso observable y contrastadas con entrevistas; observabilidad distinta de logging técnico; datos mínimos y logging seguro; persistencia local de preferencia distinta de SQLite estadístico; puertos de aplicación/adaptadores/composición y pruebas por capa. No adoptar una herramienta solo por aparecer en el temario.

**Comprobación histórica de preparación SDD:** lectura de estado/documentación/código/maqueta y contraste auxiliar; redacción y comprobación de referencias/diferencias documentales. Sin código, pruebas de producto, paquetes, migraciones, reinstalación, ramas/checkouts, commits, TFM, activación, publicación o despliegue. Código B20 y evidencia ejecutada estaban pendientes; §15 registra el trabajo posterior. Revisión humana/física y alineación siguen pendientes. No declarar completo C09–C10 por este incremento.

**Encargo reutilizable:** [prompt para Implementación](PROMPT_IMPLEMENTACION_BLOQUE_20.md). Se entrega para revisión/traslado del autor; al terminar esta especificación SDD se detiene.

## 15. Registro de Implementación — 20/10/2026

Encargo directo posterior del autor, en la carpeta/rama existentes, desde main `4e92efe7034cf6c10366daf90429d3f6ce02978c`. Preparación propia de B20 registrada separadamente `5dac075`; los cuatro documentos previos modificados se conservan sin apropiarse de la limpieza B19. Sin ramas/checkouts/reinstalación ni servidores del autor alterados.

**Entregado:** P1 preferencia personal/persistencia local/Predefinida/paletas y controles (`2ae4cae`); P2 ventanas RAM por conexión, fotografía normalizada, esquema3 e informe/CSV privado (`ddd6ee4`); P3 aviso2026-10-20.1, integración, foco por función (`93e8b66`) y última precisión de teclado exclusivamente de prueba (`44e5546`). No RoomSettings/GameSettings nuevos, reglas, cambios editoriales, panel o activación. B19 conserva elección individual, ámbitos, recibos y doce horas; su propuesta descartada no se implementa.

**Puertas nuevas:** check final de producto **672/672 en63 archivos,105 módulos arquitectura**, typecheck/lint/build correctos, Node24.19.0/ICU78.3/Unicode17/SQLite3.53.3 Windows/x64 y Chrome155.0.8059.80. Navegador pertinente22/22 en2,7min; ajuste final de foco4/4 en24,9s; regresiones compiladas21/21 en1,9min, todos un trabajador/cero reintentos. **43 casos únicos**, no47: cuatro P1 repetidos por el cambio de foco. Los18 casos estadísticos no se relanzan por un ajuste exclusivamente CSS; sus contratos/código estadístico/juego permanecen idénticos. Última línea de prueba Tab/Shift+Tab verificada por navegador y lint, sin cambios posteriores de producto.

[Evidencia detallada por V01–V05/A01–A06/I01–I02, E1–E9, comandos, errores/reparaciones y límites](evidencias/B20/README.md). SQLite temporal real, reloj controlado para ventanas/retención/cohortes, HTTP/Socket.IO reales y datos HUMAN fabricados/SYNTHETIC aislados. Partida ordinaria completa con main/entropía/adaptadores normales y gestos automatizados; inactividad/cancelación con reloj sustituido. Desconexión de navegador real y cierre/rearranque real de proceso propio distinguidos de los plazos simulados. No ensayo humano, móvil físico o Linux ejecutado.

**Visual:** cuatro temas normales1800×1000 y compactos390×844; útil1367/1368 medido, intermedio1100×900, observador/invitado, tres barajas representativas sin repetir corpus. Cajas/tipos/títulos/columnas/imagen/D/Jugar conservados; contraste/foco por función registrados. Normal captura1203px antes/después; compacta937→1024 por grupo superior ampliado (+87px), sin ocultar scroll residual. Revisión humana de colores sigue pendiente. [Capturas/medidas](evidencias/B20/p1/1800-measures.json) y secundarios en la evidencia.

**Privacidad/conservación:** aviso visible idéntico390/1280 UTF-8/LF, SHA-256 `31cde42ce2daba812babaf3a48480e1f2714000d2c42a8cdc2c9f347fbf22b06`; versión .2/evidencia B19 intactas. Normalización excluye ids funcionales/token/conexión/cookies/nombres/manos; no fotos retrospectivas. Históricos1/2 sin backfill, ocho informes conservados, dedupe/90d/12meses/copia cifrada agregada comprobados localmente. [124 archivos y huellas editoriales intactos](evidencias/B20/barajas-intactas.json), [compilación](evidencias/B20/build-final.json).

**Cierre técnico, no global:** el autor respondió que la alineación de Arquitectura sigue pendiente y pidió entregar cierre técnico. [Traslado concreto para el autor](evidencias/B20/TRASLADO_ARQUITECTURA.md), [operación/instrucciones manuales](../operacion/APARIENCIA_B20.md), README y mapa APP actualizados. Linux/CI/volumen, recepción de alineación, revisión humana/física y activación/operación públicas no acreditados; verificador adaptado/sintaxis Windows no los sustituyen. Recogida pública OFF. No push/PR/GHCR/despliegue, mensajes a otros hilos ni fuentes TFM editadas. C09–C10 continúan parciales.

## 17. Cierre técnico de la adenda de presentación — 20/10/2026

Preparación `b69d71b`, corrección local `8bed83a` y ajustes exclusivos del arnés `b391546`, desde la misma carpeta/main `40f3f48`. [Registro nuevo C1–C6, capturas y medidas](evidencias/B20/adenda-selector-detalles/README.md) y [adenda §6](ADENDA_B20_SELECTOR_Y_ACCIONES_DETALLES.md#6-implementación-y-comprobación--20102026): solo CSS condicionado del selector vertical y agrupación local de acciones de Detalles, sin modificar preferencia/estadística/contratos/reglas/paquetes o el componente de información. Selector/Cancelar163,046875px alineados (desviación0), invitado/horizontal139px intactos; acciones con61,546875px entre ellas en ancho o12px verticales, Cerrar a la derecha. Se conservan36px respecto al contenido, fuentes/imagen/foco/parcial/plazo y cartas/mesa.

Puertas nuevas Windows Node24.19.0: check **672/672,63 archivos/105 módulos**, con dos archivos simultáneos y todos los plazos originales tras diagnosticar dos timeouts iniciales; siete casos Chrome únicos afectados correctos, un trabajador/cero reintentos. Fallo del sondeo sobre carta ya retirada reparado sin quitar isTrusted/envío único; aislamiento de capturas y sus verificaciones descritos en evidencia, sin sumar repeticiones como casos nuevos.70 archivos compilados de servidor y124 editoriales intactos. No se atribuyen resultados históricos a la adenda ni se repite por rutina batería completa de navegador/analítica/corpus. Cinco documentos previos conservados y cierre propio separado. C1–C6 comprobados técnicamente, no aprobación visual humana/física o Linux/CI. B20 general/alineación y C09–C10 siguen pendientes; OFF, sin publicación/despliegue/TFM o servidores del autor alterados.
