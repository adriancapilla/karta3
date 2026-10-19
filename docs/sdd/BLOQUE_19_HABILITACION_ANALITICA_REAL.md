# B19 — Habilitación controlada de la recogida real B18

**Fecha:** 19/10/2026. **Estado:** especificación revisable; confirmados identidad y correo públicos, primera habilitación solo Pruebas y pruebas organizadas con adultos. Pendiente validación de privacidad/operación. No implementada, probada, publicada, desplegada o activada. B19 libre al preparar este documento.

**Continuidad del encargo — 19/10, trasladada por Coordinación:** B19 es una entrega única hasta Pruebas actualizado y HUMAN activo/comprobado. Implementación, publicación y preparación independiente se coordinan dentro de B19, sin pedir al autor nuevos encargos para pasar de fase. **Única autorización final reservada al autor:** antes de actualizar la pila pública del VPS o activar HUMAN, sobre commit/digest/texto/evidencias/plan exactos. Las decisiones pendientes de §10 se agrupan por Coordinación; no son autorizaciones reiteradas del mismo trabajo. En este paso SDD solo ajusta estos documentos.

**Base leída:** `APP/karta3`, `main`, HEAD `2b25f69193c3a56bfa1e7d9b13afc09eaca0fca4`. Hay una modificación local previa de `AGENTS.md` —12 líneas añadidas— que se conserva íntegra y no pertenece a esta preparación. No crear otro checkout, cambiar de versión o mezclarla con B19.

## 1. Fuentes, precedencia y evidencia de partida

- [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) y [B18](BLOQUE_18_ANALITICA_BASICA_USO.md).
- [Evidencia B18](evidencias/B18/README.md), [operación preparada](../operacion/ANALITICA_USO.md) y, con precedencia temporal sobre pendientes Linux/CI anteriores, [cierre de publicación del 19/10](../../../verificacion-b18-20261018/cierre-publicacion.md).
- [Aplicación §16.1 y §17.12](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md); [Infraestructura §§12.1/14.1/15.1–15.2/16.9](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md). Alineación general del 18/10 recibida en APP. No editar esas fuentes desde B19.
- Código contrastado: `server/composition/usage.ts`, `server/infrastructure/usage/{http,sqliteWorker,worker,privateFiles,backups}.ts`, `server/application/usage/{recording,contracts}.ts`, adaptador HTTP, `main.ts`, `src/{usage,api,useRoomFlow,App}.tsx/ts`, contratos y `deploy/compose.usage.yaml`.

El cierre posterior acredita **589 pruebas Linux, 93 módulos y 196/196 Chrome**, en fuente y main; runtime Node 24.19.0/SQLite 3.53.3, volumen privado, UID1000/permisos, consultas de solo lectura, persistencia sin RAM jugable y copia cifrada/restauración. Son pruebas técnicas previas de B18, no una ejecución nueva ni operación del VPS. Los pendientes antiguos de Linux o recepción de Arquitectura son históricos; privacidad, habilitación HUMAN y preparación real del VPS sí continúan pendientes.

**Estado de la base B18 leída (`2b25f69`):** `KARTA3_USAGE_COLLECTION=off` predeterminado; solo `synthetic` con `KARTA3_ENV=test` captura. El frontend solo reconoce la cabecera `synthetic`; Compose estadístico fija off. No existe modo HUMAN habilitable en esa base. El candidato OCI B18 conservado no contiene B19: no sirve como versión autorizada para activar HUMAN por haber pasado su CI. Los cambios de Implementación posteriores se acreditarán con su propio HEAD y evidencia, no con esta lectura de partida.

## 2. Objetivo y límites cerrados

Permitir una futura activación explícita y verificable de los **mismos nueve eventos y ocho consultas B18**, con información accesible, separación de datos, operación privada y desactivación segura. Mantener campos, fórmulas, versiones de eventos, plazos, límites y calidad; sin backfill, datos de ensayos en histórico real o reinterpretación de SYNTHETIC como HUMAN.

No añadir métricas, dispositivo/navegador/viewport, Detalles, recurrencia, identificadores entre visitas, dashboard, cuentas, WordPress, selección de baraja por enlace, monetización, cambios visuales pendientes o refactorización general. Juego, salas y sesiones siguen en RAM. SQLite exclusivamente estadístico continúa autorizado; no se reabre su elección ni se convierte en persistencia de juego.

## 3. Una entrega, cuatro fases y una autorización final

| Paso | Responsable / condición de salida | Lo que no acredita |
|---|---|---|
| 1. Preparación e implementación | Ya autorizada: Implementación programa/prueba lo definido con datos fabricados y entrega OFF. Puede avanzar en lo independiente de las decisiones de §10. | No es revisión jurídica ni autorización de usuarios reales. |
| 2. Publicación de versión | GitHub realiza revisión/CI, integración y publicación del artefacto exacto B19 dentro de esta entrega, tras la puerta técnica correspondiente; Coordinación conduce el traspaso. | No cambia la pila pública del VPS ni habilita recogida. |
| 3. Preparación operativa | VPS inventaría y prepara volumen/clave/accesos/copia externa/tareas/ensayo aislado y plan exacto; puede avanzar en paralelo sin cambiar el servicio público. | No sustituye información/base jurídica ni autoriza actualizar o activar. |
| 4. Autorización final y puesta en servicio | Coordinación presenta el paquete completo; autor autoriza una vez commit/digest/texto/evidencias/plan; VPS actualiza Pruebas y activa/verifica HUMAN conforme a ese plan. | No autoriza producción u otras métricas. Ante desviación o fallo, mantener/volver a OFF y devolver el diagnóstico. |

La autorización de conducir B19 completo no equivale a la autorización final del paso 4. **La actuación actual de SDD solo modifica documentación**, sin ejecutar implementación/publicación/VPS. No introducir un `PRIVACY_APPROVED=true` que se presente como prueba de cumplimiento. No exigir al autor copiar prompts o reautorizar cada dependencia; Coordinación agrupa el resultado y las decisiones.

## 4. Contrato técnico propuesto

### 4.1 Modo, entorno e inicialización

Reutilizar `KARTA3_USAGE_COLLECTION` con valores exactos `off | synthetic | human`; ausente significa off. Valores desconocidos, vacíos explícitos, mayúsculas o combinaciones inválidas no se coercionan ni activan nada: sink desactivado y diagnóstico fijo sin secretos. El juego continúa. Distinguir modo solicitado de recogida efectiva/degradada con la calidad operativa existente.

| Modo | Entorno permitido | Almacenamiento / efecto |
|---|---|---|
| off | Entornos B18 válidos | Sin capturar hechos ni generar referencias estadísticas. Histórico configurado/existente conserva mantenimiento/copias. Sin archivo no fabricar historial vacío. |
| synthetic | Solo test | Mecanismo B18 intacto; `<root>/test/synthetic`. Nunca promover ese archivo a HUMAN. |
| human | **Solo pruebas**, confirmado por el autor el 19/10 | `<root>/pruebas/human`; metadatos HUMAN/pruebas estrictos. development/test/production no pueden activar HUMAN en este incremento; los ensayos fabricados usan instalaciones desechables separadas. |

`NODE_ENV=production` sigue regulando ejecución/cookies HTTPS, no la autorización de entorno. Una cabecera, URL, cookie o evento de jugador/HOST nunca selecciona modo/tráfico/DB o permisos. No endpoint administrativo de activación, nuevo panel, archivo compartido entre entornos o recolección de una visita para decidir si puede recogerse.

HUMAN necesita comprobaciones técnicas previas: entorno permitido, ruta privada y propietario/permisos correctos, escritor único/DB y metadatos válidos, mantenimiento al día, límites sanos, información final sin campos pendientes y clave de copia legible desde archivo privado. Para HUMAN usar `KARTA3_USAGE_BACKUP_KEY_FILE`, no clave literal en variable/argumento; el fallback literal que existe en B18 no es un mecanismo autorizado de operación real. La revisión jurídica y el ensayo/copia externa se acreditan por registros del responsable, no por una variable.

Si falta una condición técnica, no habilitar sink/cliente: diagnóstico privado y modo efectivo apagado/degradado; juego y mantenimiento válido siguen. No reemplazar DB corrupta o de otro entorno, crear un historial vacío como si fuera el anterior o iniciar captura en memoria para volcarla después. No anunciar HUMAN antes de `ready` y comprobaciones correctas. No iniciar un planificador paralelo al de B18.

Separar los requisitos de **captura/copia** de la purga del archivo existente: por ejemplo, clave de copia ausente/ilegible/incorrecta impide HUMAN y la copia, pero no debe por sí sola impedir abrir en modo no recolector un histórico válido para mantenerlo. Si tampoco se puede mantener la DB por permiso/corrupción o entorno/ruta no identificables, indicar el fallo real y la reparación administrativa necesaria; no afirmar que una retención imposible se está cumpliendo ni abrir otro archivo para aparentarlo.

Durante recogida, fallos de disco/lease/mantenimiento/escritor conservan pausa, límites y pérdidas explícitas B18; frontend no debe seguir recibiendo una señal positiva de habilitación efectiva. Una operación de consulta fallida no detiene por sí sola la ingesta. La falta de copia externa, vencimiento de autorización o un incidente de privacidad exige que el responsable desactive HUMAN; el runtime no puede verificar por sí solo que un fichero llegó a otro disco o que una valoración jurídica sigue siendo válida. Incidencia y hueco se registran operativamente, sin nueva métrica.

### 4.2 Señal al navegador y OFF

Reutilizar `X-Karta3-Usage-Collection` desde respuestas autorizadas del mismo servidor: `human` o `synthetic` únicamente cuando efectivamente recoge; ausencia u off deshabilita. El servidor decide; no es un permiso concedido por el navegador. Mantener no-store en respuestas de estado/analítica y no cachear una señal positiva mediante el proxy. No nuevo endpoint de telemetría para descubrir la configuración.

El cliente empieza deshabilitado. Solo tras recibir señal válida habilita los tres hechos BROWSER existentes. OFF significa **cero UUID/visitas/contextos estadísticos, POST de eventos, reintentos o colas nuevas**; las peticiones técnicas normales del juego se conservan. Al conocer OFF, desconectar o invalidar el contexto: cancelar temporizadores de reintento, limpiar referencias auxiliares y no recuperar eventos anteriores al reactivar. No enviar una portada retrospectiva o contar la consulta de privacidad. Actualizaciones de UI y StrictMode conservan dedupe B18.

Procesar la señal también en respuestas 204/errores, antes de salidas tempranas del cliente HTTP. Limpiar las referencias estadísticas auxiliares de creaciones/entradas inciertas sin borrar su requestId/datos de juego ni cambiar su deduplicación. El reintento explícito de juego puede seguir siendo necesario, pero apagado no debe adjuntar el contexto estadístico antiguo o crear otra intención.

Tras reconectar, confirmar el modo mediante una respuesta HTTP vigente del recorrido de recuperación antes de reactivar el cliente; no dar por válida la señal anterior por tener de nuevo Socket.IO. Una señal antigua no debe sustituir una OFF más reciente. El servidor rechaza/ignora la captura de clientes antiguos o peticiones ya en vuelo cuando no recoge. **Límite distribuido:** no puede retirar una petición ya enviada ni informar instantáneamente a una pestaña sin red; ese tránsito se distingue de generar eventos nuevos estando el cliente informado de OFF. No atribuir persistencia a un 202: conserva significado de encolado B18.

### 4.3 Desactivar, volver a habilitar y almacenamiento

Base técnica propuesta: modo administrativo leído al arrancar, sin interruptor en caliente. Cambiar a off requiere recrear controladamente el proceso con el mismo volumen, no borrar DB/volumen o restaurar un backup. Conservar mantenimiento/copias del archivo existente aun apagado, y tarea externa cuando la app no lo ejecuta. Una clave inválida no autoriza saltarse la purga: reparar configuración y mantener el histórico por el mecanismo B18 válido. **Esta base no resuelve por sí sola una retirada de consentimiento durante la partida**; la opción §6.1 debe cerrar ese punto dentro de B19 antes de activar, sin implementarlo autónomamente como función ya aprobada.

**Efecto conocido:** recrear el proceso pierde partidas/sesiones RAM; no prometer desactivación en caliente sin impacto. En operación normal usar ventana sin salas/partidas activas; ante incidente urgente priorizar el apagado y documentar interrupción. La parada del proceso antiguo puede registrar el último hecho técnico confirmado antes del corte; desde el arranque OFF no se capturan hechos nuevos. Conservar drenaje máximo 2 s, reconexión y garantías B18/T04; no namespace DISCONNECT que bloquee reconexión.

Una reactivación futura usa el histórico HUMAN compatible mantenido, registra nueva cobertura/huecos y no crea hechos de juego de instancias anteriores. No habilitar sobre un archivo restaurado de agregados: es de consulta, no destino de captura.

## 5. Tratamiento implementado que debe informar el responsable

| Aspecto | Hecho contrastado / límite conservado |
|---|---|
| Finalidad | Evaluar uso del MVP y resultados agregados del TFM: acceso, creación/entrada, conversión, baraja/configuración, duración/motivos y automático. No atención, perfiles o recurrencia. |
| Datos | Tres declaraciones del navegador y seis hechos de servidor B18; fechas, enums, referencias aleatorias y snapshot inicial compartido. Nueve eventos v1/ocho consultas sin ampliación. No copiar las 58 cartas o datos personales del transporte. |
| Correlación | Visita UUID solo RAM del documento; recargar crea otra; rotación al siguiente hecho tras 30 min sin evento permitido o 12 h máximas. Intención ligada a ese gesto; sala/partida/participación acotadas al objeto y vida de referencias B18. No hash de cookie o enlace entre salas/personas. |
| Conservación | Detalle/dedupe/proyecciones máximo 90 días; agregados/calidad doce meses UTC incluido el actual, sin ids individuales. Ventanas/censura/purga repetible B18. Copias cifradas solo agregados: perder disco puede perder detalle definitivamente. |
| Acceso | Responsable y administradores autorizados por SO/SSH; consultas y CSV agregados privados. No HOST, API de informes o acceso público a SQLite/backup. Cifrado de copia no anonimiza el detalle del origen. |
| Límites | Visitas no son personas únicas; automático no prueba abandono. Pérdidas/UNKNOWN/cohortes provisionales y cobertura declaradas; no entrega exactamente una vez. No decisiones sobre personas o perfilado por esta función. |
| Exclusiones | Sin IP, nombres/códigos, cookies/tokens/ids de sesión o hashes, UA/referrer/viewport, manos, cuerpos de mensajes, seguimiento entre visitas o servicio externo de analítica. |

**Tres tratamientos distintos:** (a) analítica anterior; (b) sesión funcional `karta3_session`, HttpOnly/SameSite Strict/Secure bajo HTTPS, maxAge actual 30 días, asociada a sesión RAM que se pierde al reiniciar; no es cookie estadística ni se cambia su plazo aquí; (c) registros operativos de app/proxy/proveedor. La red necesariamente procesa direcciones para servir solicitudes; no declarar «KARTA3 nunca trata IP» porque la estadística no las guarde. Caddy leído no declara access log HTTP; app/contendor sí tienen diagnósticos. Inventariar en VPS proveedor/localización/subencargados/logs y plazos reales, sin trasladarlos a la analítica ni prometer ausencia de transferencias no comprobada.

La información explicará qué ve el resto de jugadores y qué usa el juego en RAM solo para distinguirlo de la estadística, sin añadir un historial o recogida de edad. No deducir que UUID significa anonimato irreversible: durante su ventana hay correlación y el responsable controla también el sistema de juego.

## 6. Contraste normativo y decisión pendiente

Fuentes oficiales consultadas el **19/10/2026**, sin dictamen jurídico de conformidad:

| Fuente | Consecuencia que se debe revisar |
|---|---|
| [RGPD arts. 5/6/11/13/25/32, texto oficial](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807) | Identificar responsable, finalidad/base, destinatarios/transferencias, plazos y ejercicio de derechos. No obtener nuevos identificadores solo para poder identificar interesados; no presumir que siempre será posible localizar sus eventos. |
| [LSSI art. 22.2](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758#a22) | Evaluar acceso/almacenamiento en terminal y excepciones técnicas; servir el juego no justifica automáticamente toda su analítica. |
| [EDPB 2/2023, versión final 2.0, §§35–40/52–56](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf) | Su análisis incluye RAM y generación/acceso mediante software; persistencia breve o procesamiento local no excluyen el ámbito técnico. Las excepciones requieren evaluación del caso, no las concede esta guía por sí sola. |
| [AEPD, medición de audiencia, enero 2024, §§II–III](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf) | Exención condicionada a finalidad, usos y garantías, no a ser propio. Comparar el catálogo B18 y sus detalles correlacionados 90 días con esas condiciones, sin equipararlo a agregación diaria por página o estadísticas anónimas ya demostradas. |
| [AEPD, guía de cookies](https://www.aepd.es/guias/guia-cookies.pdf) | Información y consentimiento son cuestiones diferentes. Si procede consentimiento, debe existir elección/rechazo/retirada reales; un enlace informativo o «seguir jugando» no lo sustituyen. |
| [AEPD, bases de legitimación](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/5-bases-legitimadoras-del-tratamiento/FAQ-0214-cuales-son-las-bases-de-legitimacion-para-el-tratamiento-de-datos) y [menores](https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion/FAQ-1001-cual-es-la-edad-para-que-los-menores-puedan-prestar-consentimiento-para-tratar-sus-datos-personales) | Documentar la base específica; interés legítimo no es una exención LSSI. Si se usa consentimiento y participan menores, validar edad/representación conforme al caso; no inventar autorización escolar/general. |

**Conclusión de preparación:** no está acreditada una exención para el tratamiento B18 íntegro. Antes de autorizar HUMAN, el responsable debe documentar con validación específica la base RGPD y la solución para LSSI/ePrivacy, con finalidades, memoria del navegador, correlaciones servidor y destinatarios reales. No atribuir «interés legítimo» al texto por comodidad ni utilizar «fin académico» como exención automática.

No se prescribe un banner por defecto. **Si resulta necesario consentimiento u otra elección individual**, la activación queda bloqueada hasta acordar su mecanismo y alcance: un banner decorativo mientras el servidor sigue registrando todo no sirve. No sustituirlo por consentimiento del anfitrión para invitados ni inventar un campo persistente de seguimiento. Si ese mecanismo exige cambiar los nueve eventos/fórmulas o el tratamiento, devolver incompatibilidad al autor antes de ampliar B19. Las pruebas fabricadas pueden preparar los controles, pero no acreditan esta conclusión normativa.

### 6.1 Opción evaluada: sesiones cerradas, consentimiento previo y retirada

**Propuesta para decisión, no aprobada ni implementada.** Puede reducir el alcance operativo y evitar construir cuentas o un consent-manager: sesiones organizadas, con moderador disponible, solo adultos y barrera temporal de acceso en el proxy antes de cargar la app. La información pública puede seguir accesible sin captura. El inventario VPS concretará un mecanismo disponible —por ejemplo, credencial temporal de sesión compartida, no cuentas personales— y sus rutas HTTP/API/Socket.IO, evitando accesos alternativos. Una contraseña restringe acceso; **no acredita edad o consentimiento** y nunca se utiliza como id estadístico.

Antes de facilitar acceso, entregar individualmente texto/versiones/finalidad/plazos y obtener respuesta afirmativa verificable, separada de las condiciones para jugar. Custodiar evidencia mínima —referencia del participante bajo control del organizador, fecha, versión, alcance y respuesta— fuera de SQLite/Git/logs de juego, sin enlazarla con visitId/roomRef ni pedir DNI. Custodia, campos indispensables y plazo de esa prueba de consentimiento requieren validación propia; no heredan automáticamente los 90 días/doce meses B18. No usar un formulario de terceros por iniciativa técnica.

Todos los admitidos, también observadores, deben quedar cubiertos **antes de su primera portada/evento**. No basta el permiso del HOST. Si alguien no consiente, no incluirlo en un entorno HUMAN: proponer un recorrido equivalente con analítica OFF o mantener OFF toda esa sesión; no presentar «aceptar o no jugar» como consentimiento libre. No captar transeúntes que lleguen al dominio abierto; cerrar/revocar la barrera al acabar la ventana y dejar OFF fuera de ella. La muestra será de sesiones organizadas, no audiencia espontánea general; las fórmulas B18 no cambian y esa cobertura se explica al interpretar informes.

**Retirada:** debe poder comunicarse por un canal accesible tan sencillo como el de aceptación, con el moderador operativo durante la sesión; no basta un buzón sin atención inmediata. Al recibirla deben cesar los nuevos hechos de esa persona, incluidos los de servidor. Salir del navegador, cerrar solo su acceso o parar POST BROWSER no basta mientras B18 siga midiendo la partida global. Para evitar decisiones individuales nuevas sobre eventos/fórmulas, la opción proporcionada a evaluar es **pausar la analítica de toda la sesión**, sin penalizar a quien se retira y manteniendo consulta/mantenimiento del histórico permitido. No crear un registro estadístico de consentimiento o una décima métrica.

**Incompatibilidad por resolver:** §4.3 solo cambia modo al recrear proceso; ello pierde la partida y puede producir un último hecho técnico. No darlo por retirada sencilla/sin perjuicio ya demostrada ni esperar al fin de ronda. Se propone valorar una pausa global exclusivamente administrativa de captura que conserve Game y mantenimiento, sin control HOST/API pública/cuentas; **no está autorizada aún ni es una refactorización de temporización**. El responsable debe escoger/validar el mecanismo efectivo de retirada antes de que Implementación cierre ese camino y antes de HUMAN. Si otro mecanismo aceptado evita un cambio de código, justificarlo y ensayarlo, sin fingir que cortar únicamente el proxy detiene hechos de servidor.

Para datos anteriores a la retirada, atender la base y los derechos aplicables; no prometer borrado individual si no se puede localizar el registro ni añadir identidad duradera para resolverlo. La pausa de recogida no autoriza purgar a ciegas el histórico o conservar datos sin fundamento. La viabilidad de esta opción no es un dictamen universal de cumplimiento. Referencias adicionales: [EDPB 05/2020, consentimiento y retirada](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_202005_consent_en.pdf) y [AEPD, obtención del consentimiento](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/5-bases-legitimadoras-del-tratamiento/FAQ-0211-segun-el-rgpd-como-debe-solicitarse-el-consentimiento-para-tratar-sus-datos-personales).

## 7. Propuesta de información y acceso

**Borrador no publicable hasta completar campos y revisión.** Proponer un enlace discreto «Privacidad y analítica» al pie de portada, espera, partida y resultados; no introducir un panel entre resumen/Mesa/mano. Abrir información en pestaña separada, mismo origen y sin terceros, para conservar la partida y sus tiempos. Texto accesible con teclado, lectura normal móvil/escritorio y URL directa `/privacidad`; acceder no genera otro evento, consentimiento o cookie de analítica. En esa ruta informativa no montar el flujo de juego para crear sesión/portada por accidente.

### Primera capa propuesta

> **Privacidad y analítica**
>
> KARTA3 utiliza una sesión técnica para permitirte jugar. Cuando la recogida de uso está autorizada y habilitada, registra estadísticas propias sobre accesos, salas, configuración y desarrollo general de las partidas para evaluar el MVP y preparar su TFM. No utiliza cookies estadísticas ni busca reconocerte entre visitas. La estadística no incluye tu nombre, código de sala, IP o mano de cartas.
>
> Responsable: **Adrián Capilla López**. Contacto: **k3k314com@gmail.com**. Consulta la información completa sobre los datos, plazos, base aplicable y tus derechos.

Esta descripción técnica no dice «anónimo» ni «exento». El estado visible, si se presenta, debe proceder de la configuración efectiva OFF/HUMAN y no afirmar ON por esta redacción condicional. No considerar abrir/leer/continuar como aceptar.

### Información ampliada propuesta

> **Quién y para qué.** Responsable: Adrián Capilla López. Contacto: k3k314com@gmail.com. Evaluamos el uso real de KARTA3 y elaboramos resultados agregados del TFM: accesos, creación y entrada en salas, partidas iniciadas, barajas/configuración, duración, motivos de finalización y paso a automático por inactividad. Una vista no representa una persona única; automático no demuestra abandono voluntario.
>
> **Qué datos se registran.** Fechas, resultados de operaciones y configuración inicial: baraja/versiones, cantidades de humanos/bots por dificultad, anfitrión jugador/observador, tiempos, desempate y opciones compartidas de presentación. No se guardan en la analítica nombres, códigos, direcciones IP, cookies/credenciales, cartas privadas, mensajes ni características del dispositivo. No hay servicio externo de analítica o seguimiento entre visitas.
>
> **Referencias temporales.** Usamos números aleatorios para relacionar hechos de una visita, sala, partida o participación. La visita se conserva solo en memoria de una pestaña; cambia al recargar y tiene límites de 30 minutos sin un hecho permitido y 12 horas como máximo. No se guarda en cookies o almacenamiento persistente del navegador. Las demás referencias no forman un historial de una persona entre salas.
>
> **Plazos y acceso.** Detalle durante un máximo de 90 días; resúmenes mensuales sin referencias individuales durante doce meses incluido el actual. Informes privados para responsables autorizados. Copias cifradas únicamente de agregados; no permiten recuperar detalle perdido con el disco. Podemos usar resúmenes revisados sin identificadores para documentar el TFM. [DESTINATARIOS DE ALOJAMIENTO/COPIA, UBICACIÓN Y TRANSFERENCIAS: COMPLETAR].
>
> **Sesión y registros técnicos.** La cookie funcional `karta3_session` permite recuperar la sesión del juego, tiene plazo configurado de hasta 30 días y no se utiliza como identificador estadístico. El estado jugable vive en RAM y se pierde al reiniciar. Los registros de funcionamiento y del proveedor tienen otra finalidad: [COMPLETAR DATOS/PLAZOS REALES]; no se incorporan a estas estadísticas.
>
> **Base y derechos.** [BASE VALIDADA Y, SI PROCEDE, INTERÉS/CONSENTIMIENTO Y PROCEDIMIENTO DE OPOSICIÓN O RETIRADA]. Puedes contactar con k3k314com@gmail.com para ejercer los derechos aplicables y reclamar ante la AEPD. No conservamos una identidad estadística permanente: puede que no podamos asociar tus datos de contacto con eventos concretos. Explicaremos esa limitación sin pedir contraseñas, cookies o tokens. [DPD/REPRESENTANTE SI PROCEDE].

No desplegar literalmente campos PENDIENTE, promesas de inexistencia de encargados/transferencias o instrucciones de retirada que no funcionen. Datos públicos completos y mecanismo requerido son condiciones para autorizar, no datos que SDD inventará.

## 8. Responsabilidades y dependencias

| Responsabilidad | Pieza/capa | Comprobación |
|---|---|---|
| Validar combinación modo/entorno y conectar recogida/mantenimiento | Composición `usage.ts`/main; infraestructura valida archivos y estado | Sin SQL en aplicación ni decisiones legales codificadas como una variable. OFF/HUMAN/SYNTHETIC y fallo seguro. |
| Emisión/vistas/fórmulas | Puertos, UsageRecording y consultas B18, sin rediseño | Mismo catálogo/DTO/dedupe/calidad; no tocar dominio, Game o privacidad de manos. |
| Señal efectiva y rechazo de ingesta apagada | Adaptador HTTP B18 y contratos seguros | Cabecera solo salida del servidor, no controles de jugador; no-store y mismo origen. |
| Cliente apagado y acceso informativo | `usage.ts`, transporte/recuperación y componentes actuales | Sin eventos/UUID al estar apagado; limpieza/reconexión; enlace no cambia partida o métricas. |
| Persistencia, copia/consulta privadas | Worker/adaptadores B18 y preparación Compose | Reutilizar esquema/locks/CLI/cifrado existentes; no segundo escritor o API de informes. |
| Privacidad y autorización | Responsable/autor, con validación pertinente | Información final, decisión motivada y alcance registrado; fuera del dominio/código del juego. |
| Operación real | Hilo VPS/autor dentro de B19, tras la única autorización final para actualizar/activar | [Procedimiento B19](../operacion/PREPARACION_ANALITICA_REAL_B19.md), evidencias propias del VPS. |

Autonomía futura de Implementación: cambios locales de tipos/mode/header, nombres internos y montaje de pruebas dentro de esta especificación. No cambiar eventos, plazos, requisitos de consentimiento o público autorizado para hacer pasar una puerta; no base de datos nueva, consent-manager especulativo o dependencia externa.

## 9. Aceptación prevista, toda pendiente

| Criterio | Evidencia futura |
|---|---|
| H01 — Matriz y separación | Ausente/off, synthetic/test, human/entorno permitido y combinaciones inválidas; archivo/metadata/clave/permisos erróneos. Eventos y reportes HUMAN de ensayo fabricados solo en instalación desechable; nunca usar o reclasificar históricos reales/sintéticos. |
| H02 — OFF navegador/servidor | Arranque OFF, ruta informativa, navegación/F5/gestos/reconexión: cero eventos/contextos/visitas estadísticas. Cabecera ausente/desconocida/off, respuesta antigua y reintento pendiente invalidan captura. Petición en vuelo tardía no se persiste al apagar. |
| H03 — HUMAN sin ampliación | Datos fabricados en instancia propia: nueve eventos, ocho consultas, mismos campos y fórmulas; dos sesiones/pestañas, replay, selección/configuración, cierre y automático. Ningún selector de modo para HOST/invitado o evento SERVER falsificado. |
| H04 — Histórico y mantenimiento OFF | On→parada controlada→OFF, mismo volumen: histórico consultable, purga/copia programadas y RAM de juego perdida según contrato. OFF no crea otro histórico ni reactiva resultados; reactivación no reconstruye inicio antiguo. Retención con reloj controlado. |
| H05 — Fallos | DB no disponible/solo lectura/worker caído/copia o mantenimiento fallidos: no recogida efectiva, calidad explícita, juego/plazos operativos y presupuestos B18 intactos. Error estadístico no bloquea la operación de juego. |
| H06 — Información | Texto completo/revisado, enlace desde cuatro pantallas y URL directa, teclado/móvil/escritorio, sin nueva portada estadística/cookie o pausa/jugada. No campos pendientes, falsa exención o consentimiento implícito. |
| H07 — Permisos y secretos | 404 para SQLite/WAL/SHM/export/copia; clave solo archivo privado RO, sin Git/bundle/logs/inspect publicado. Informes administrativos solo lectura y sin acceso por cookie HOST; metadatos de entorno/tráfico conservados. |
| H08 — Regresión proporcionada | `npm run check`, arquitectura/imports y navegador focal compilado: usage/activation, creación/entrada, recuperación/reinicio B06, bots, timeout, cancelación/T04 y presentación no alterada. Añadir casos B19, no repetir por rutina toda la matriz Unicode/barajas o una CI completa en cada paso. |
| H09 — Publicación separada | Evidencia futura del HEAD/artefacto exacto B19, por su hilo. CI B18 histórica no acredita nuevo modo; versión publicada mantiene OFF. |
| H10 — Operación/autorización | Volumen/acceso/clave/tareas/copia externa/restauración/ensayo y revisión normativa reales; única autorización final del autor sobre commit/digest/texto/evidencias/plan. Después, dentro de B19, actualización/activación/verificación HUMAN en Pruebas, sin exportar detalle. Si se adopta §6.1: acceso restringido previo, prueba de aceptación y rechazo, retirada durante partida que detiene también hechos SERVER y mantenimiento/consulta conservados. |

Pruebas técnicas fabricadas sobre copias/volúmenes nuevos y puertos propios, incluidos fixtures HUMAN etiquetados como ensayo en sus evidencias externas —sin nuevo campo de evento—. SYNTHETIC/test sigue separado. Comprobar Linux focal con imagen/runtime/volumen del cambio cuando exista, distinguiéndolo del Linux B18 ya acreditado; tiempo controlado para 90 días/meses frente a parada/reconexión reales. No ejecutar pruebas o Docker desde esta especificación.

## 10. Pendientes del autor y traslado

**Respuestas del autor — 19/10/2026:** responsable **Adrián Capilla López**, contacto público **k3k314com@gmail.com**; primera habilitación HUMAN **solo Pruebas**; primera recogida **solo en pruebas organizadas con adultos**. Producción permanece fuera y SYNTHETIC/test separado. Estas respuestas completan la identificación y delimitan el alcance, no autorizan todavía activar.

**Identificación completada:** nombre y apellidos aportados expresamente por el autor para la propuesta pública; no se solicita ni registra DNI, su número o copia. El art. 13 RGPD exige identidad y contacto; no se necesita recibir un documento de identidad en esta conversación. Representante/DPD solo si resulta aplicable en la revisión, sin inventarlo o deducirlo del perfil/repositorio.

**Lista única de pendientes para que Coordinación agrupe la decisión, sin preguntas separadas al autor desde SDD:**

1. **Autor/responsable — afecta al desarrollo dependiente y a activar:** escoger y validar la base RGPD/solución LSSI-ePrivacy sobre B18 real. La opción concreta es §6.1, sesiones cerradas con información y consentimiento previo verificable, acceso restringido y alternativa OFF; todavía no aprobada. Si se adopta, completar texto y criterio de custodia/plazo de la evidencia de consentimiento fuera de la analítica. No pedir de nuevo identidad/correo/Pruebas/adultos ni suponer exención.
2. **Autor/responsable — afecta al mecanismo de retirada:** aprobar el procedimiento que realmente cese captura BROWSER/SERVER sin perjuicio indebido. Se propone pausa global de analítica manteniendo Game, por vía administrativa y sin cuentas/consent-manager; no implementarla por inferencia. La recreación ordinaria de §4.3 no acredita ese requisito. Implementación puede avanzar en contrato OFF/HUMAN, privacidad técnica y ensayos independientes; ese camino de retirada se concreta en B19 al decidirlo, sin abrir otro bloque.
3. **Inventario VPS primero — no son preguntas que el autor deba responder de memoria:** identificar proveedor/localización/encargados/logs, acceso efectivo, barrera temporal disponible, montajes/permisos/espacio, tareas y custodia de clave/copias/restauración. Contrastar acceso real de la cohorte adulta, no inferirlo de la invitación. Si falta destino externo/operador/canal de retirada viable, Coordinación presenta al autor únicamente esa elección concreta y sus opciones; las rutas o datos ya inventariables los resuelve VPS sin secretos en el chat.
4. **Autor — única autorización final reservada:** aprobar el paquete exacto de commit/digest/texto/evidencias/plan de actualización, activación, comprobación y vuelta a OFF, después de decisiones y preparativos. Antes de ella se implementa/publica/prepara sin tocar la pila pública; después se ejecuta y comprueba dentro de B19. Un fallo o cambio material del paquete impide ejecutarlo tal como estaba autorizado y se devuelve a Coordinación; no se presume otra versión aprobada.

**Arquitectura recibirá mediante el autor:** distinguir habilitación HUMAN de la base B18 SYNTHETIC; describir matriz/estado efectivo/OFF y mantenimiento, memoria/reinicio, información/datos reales, decisión normativa y operación privada. Alinear Aplicación §16.1 e Infraestructura §§4.3/12.1/14.1/15.1–15.2/16.9 y pendientes; conservar cierres históricos y citar publicación B18 posterior como evidencia Linux ya cumplida. No editar TFM ni enviar mensajes a otros hilos aquí.

**Contrato técnico para Implementación:** §§2/4/5/8/9 definen el camino preparado OFF/HUMAN, aislamiento, señal cliente, fallos, mantenimiento y pruebas, sin cambiar el catálogo B18. Puede empezar el trabajo independiente ya autorizado y devolver los puntos §10.1–2 para que Coordinación cierre solo la parte dependiente, sin convertir §6.1 en decisión aprobada. Entregar a GitHub HEAD/árbol/evidencias exactos; a VPS requisitos/plan/digest cuando estén disponibles; mantener OFF hasta la autorización final y acreditar la actualización/recogida en el cierre común B19. No basta un cierre local para dar toda la entrega por terminada.

**Cierre de esta preparación SDD:** únicamente documentación ajustada; sin código, pruebas, commit, publicación o operación. La entrega B19 completa se cerrará con evidencia separada de preparación técnica, revisión normativa, publicación, operación y autorización/activación HUMAN real en Pruebas; ninguna de esas fases se declara ejecutada aquí. Tras devolver este resultado, SDD libera los dos documentos y la entrada de proceso para que Implementación los mantenga, sin escrituras simultáneas.
