# SDD ligero para KARTA3

**Estado:** organización acordada el 27/09/2026; primer incremento digital elegido y verificado localmente el 28/09/2026.  
**Revisión del proceso:** 29/09/2026 — responsabilidades por capa y comprobación de dependencias en cada bloque.

**Ámbito:** desarrollo nuevo de KARTA3. Este documento describe el trabajo por bloques; no sustituye las reglas del juego ni acredita código o pruebas.

## Fuentes y responsabilidades

- [`AGENTS.md`](../../AGENTS.md) y [organización y dependencias](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md): reglas del repositorio, ubicación de responsabilidades y dependencias permitidas. Se leen antes de especificar o implementar un bloque.
- `TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md`: acuerdos vigentes, alcance y coordinación general, mantenidos en su conversación responsable.
- `TFM/Planificación/DOMINIO_KARTA3.md`: reglas, modelo e invariantes del juego.
- `TFM/Planificación/CAPA_APLICACION_KARTA3.md`: casos de uso, permisos y comportamiento de la aplicación.
- `TFM/Planificación/INFRAESTRUCTURA_KARTA3.md`: decisiones técnicas y preparación de contenidos, pruebas y despliegue.
- Cada especificación de bloque: objetivo acotado, ejemplos y criterios comprobables para un incremento. Cita las secciones pertinentes; no vuelve a redactar todo el diseño.

Las fuentes de `TFM` están actualmente fuera del directorio técnico `APP/karta3`. Antes de publicar el repositorio se decidirá cómo ofrecer referencias accesibles al revisor sin mantener copias divergentes. Una especificación de bloque no cambia por sí sola una decisión confirmada en su documento responsable. Si detecta una contradicción, se registra y se alinea la fuente correspondiente antes de cerrar el bloque.

## Ciclo de un bloque

1. **Preparar y preguntar.** Elegir un comportamiento pequeño y útil o una mejora técnica delimitada. Leer las reglas del repositorio, dominio, aplicación e infraestructura y, si existe, el código y sus pruebas. Citar primero lo ya decidido y preguntar al autor solo por decisiones funcionales o arquitectónicas realmente abiertas. Resolver las elecciones técnicas locales compatibles con esas fuentes.
2. **Especificar y acordar.** Completar la [plantilla](PLANTILLA_BLOQUE.md) con recorrido, operaciones, errores, ejemplos y aceptación. Identificar responsabilidades por capa, dependencias permitidas y prohibidas y cómo se comprobarán. Citar las reglas existentes sin volver a documentarlas. Registrar las respuestas del autor y dejar resueltas las dudas que bloqueen la implementación. El autor revisa el encargo concreto antes de enviarlo al hilo de desarrollo.
3. **Implementar.** Construir únicamente el incremento acordado en las capas responsables. Conectar los adaptadores concretos en composición. Las pruebas se derivan de los ejemplos, criterios y límites de dependencia, sin exigir una herramienta concreta de SDD ni una estructura extensa.
4. **Comprobar.** Ejecutar `npm run check`, las pruebas de navegador pertinentes y las comprobaciones arquitectónicas del bloque. Revisar tanto importaciones como responsabilidades: mover código a carpetas no demuestra separación. Registrar resultados reales, incluidos fallos y límites; una lista de pruebas previstas no demuestra ejecución.
5. **Cerrar o ajustar.** Marcar el bloque como verificado solo cuando se satisfagan sus criterios y exista evidencia localizable. Si las pruebas aconsejan cambiar el alcance, aplicar el procedimiento siguiente y volver a comprobar lo afectado.

Estados útiles: **propuesto**, **acordado**, **implementado**, **verificado**. Se indica la fecha de cada cambio de estado. «Implementado» no equivale a «verificado».

Una especificación **acordada** debe permitir que el hilo de implementación trabaje sin tener que decidir el comportamiento general. Puede escoger detalles internos compatibles con la arquitectura y pedir aclaración si aparece una contradicción real. El documento distinguirá lo incluido en ese incremento de las funciones ya confirmadas para el MVP que se implementarán después.

## Arquitectura y bloques técnicos

Cada bloque incluye una tabla breve: **responsabilidad → capa o módulo → dependencias permitidas y prohibidas → comprobación**. Se nombran solo las piezas afectadas; las demás se indican como no afectadas, sin crear carpetas, modelos ni puertos vacíos. Los puertos se definen en aplicación cuando un caso de uso necesita una capacidad externa; los adaptadores la implementan y composición los conecta. El cliente usa contratos seguros de transporte.

La comprobación combina pruebas de reglas o modelos puros, casos de uso con puertos sustitutos, integración de adaptadores y recorridos de navegador según el alcance. Se revisan importaciones, incluidas las de tipos, y ciclos; cuando exista una comprobación automática se incorpora al cierre. También se verifica que un adaptador no haya conservado decisiones de producto que pertenecen al modelo o al caso de uso.

Un bloque técnico declara el comportamiento y contrato que conserva, la versión de partida y las pruebas de regresión. Sus criterios propios pueden identificarse como T1, T2… y se añaden a los criterios funcionales vigentes sin sustituirlos. Las pruebas existentes pueden reorganizarse al cambiar módulos, conservando sus casos y aserciones. La mejora de arquitectura no autoriza funciones nuevas ni correcciones funcionales ajenas al encargo.

## Cambios y evidencia

En la propia especificación del bloque se registra cada cambio relevante: fecha, observación o motivo, decisión tomada, criterios modificados y documentos especializados afectados. Las decisiones específicas del incremento se documentan allí. Si una decisión completa o cambia una regla general, se comunica al ámbito responsable para alinear su documento; el resumen de coordinación identifica esta tarea. Las ampliaciones futuras permanecen como candidatas hasta que se acuerden expresamente. Los defectos de implementación se corrigen contra la especificación vigente sin convertirlos en cambios de regla.

Para cerrar un bloque se anotan, de forma breve:

- versión o referencia del cambio de código revisado (commit o pull request, cuando exista repositorio);
- comprobaciones ejecutadas, fecha, resultado y entorno; si fallaron, enlace o descripción del fallo y su resolución;
- verificación de dependencias y responsabilidades, con las desviaciones detectadas y su tratamiento;
- evidencia manual solo cuando aporte algo que una prueba automática no muestre, como una captura de un recorrido visual;
- límites conocidos y relación con el siguiente bloque.

Estas referencias permiten reconstruir **requisito → especificación → cambio → comprobación** para el TFM. No se crean capturas ni informes voluminosos por rutina. Al finalizar un bloque se entrega a la conversación de coordinación un resumen de acuerdos nuevos, archivos, evidencia y pendientes; esa conversación actualiza su documento general.

## Secuencia inicial y barajas

El [bloque 01](BLOQUE_01_CREACION_SALA.md) crea una sala y muestra al anfitrión su espera. La entrada de otras personas, la configuración y el inicio de partida se especificarán como incrementos posteriores. Cada bloque describirá lo que la persona ve y hace, los estados necesarios y las comprobaciones de ese recorrido; las reglas ya cerradas permanecen en dominio y aplicación. Los aspectos de interfaz y jugabilidad digital todavía abiertos se contrastarán con usuarios cuando exista un recorrido observable.

El [bloque técnico T01](BLOQUE_T01_REFACTOR_CREACION_SALA.md) separó las responsabilidades de la implementación existente antes de añadir funciones. Conservó el contrato HTTP y E1–E7 del bloque 01; sus comprobaciones ejecutadas constan en su propia evidencia.

El [bloque 02: entrada y espera sincronizada](BLOQUE_02_ENTRADA_SALA.md) acordó el recorrido el 30/09/2026. Incluye identidad del invitado, lista compartida y salida voluntaria. Su implementación y evidencia constan en esa especificación. Expulsión, configuración, bots, inicio y juego quedan para otros bloques; el ciclo de vida de la espera incorporará los márgenes y la caducidad ya exigidos para el MVP.

El [bloque 03: ciclo de vida de la espera](BLOQUE_03_CICLO_VIDA_ESPERA.md) concreta ese ciclo con reserva de 30 segundos, presencia por sesión con varias pestañas y cierre tras 30 minutos sin actividad válida, avisado un minuto antes. Acordado e implementado el 30/09/2026; B03-01–16 y las regresiones quedaron verificados localmente con 65 pruebas Vitest y 18 de navegador. Su evidencia distingue tiempo controlado, conexiones reales con reloj sustituido, detección real y reserva de 30 segundos reales; no acredita media hora real ni despliegue.

El [contrato común de barajas, formato 1](../contratos/CONTRATO_BARAJAS_V1.md), documentado el 01/10/2026 con las aclaraciones del autor, fija `baraja.json`, `cartas.json`, plantillas y ejemplos. El [encargo al Gestor](../contratos/ENCARGO_GESTOR_BARAJAS.md) prepara contenido maestro directamente en `ASSETS/Barajas/<id>/`; APP recibirá una copia aprobada y reproducible. Las imágenes admiten `null`, los tres atributos usan ids fijos y los textos y valores requeridos deben estar rellenados. CSV y herramienta editorial quedan aplazados; el catálogo lo genera la aplicación. Los ajustes pendientes en las fuentes generales se enumeran en el contrato y se trasladan a coordinación.

El [bloque 04: carga, validación y catálogo](BLOQUE_04_CARGA_BARAJAS.md), especificado el 01/10/2026, incorpora la [propuesta de validación genérica](PROPUESTA_VALIDACION_BARAJA.md) y E1–E7 en un único incremento técnico. Implementado y verificado localmente el 02/10/2026: copia fiel de la genérica versión 1/no disponible, validación pura, JSON/recursos, catálogo y resúmenes públicos. Código `e5416f8`; 172/172 pruebas, 22/22 recorridos Chrome y 37 módulos revisados. Infraestructura §9.3 recoge la aclaración confirmada: borrador inválido con false fiable informa/excluye; disponible inválida o disponibilidad incierta bloquea. La evidencia de B04 registra huellas, procesos compilados, guard de ASSETS, pruebas reales de enlaces y límites. C09–C10 son parciales: selección y presentación posteriores. GitHub/revisión/publicación permanecen en su conversación responsable.

Cada nueva baraja aprobada seguirá el mismo control y conservará el resultado asociado a su versión. La incorporación no necesita un validador por temática. El contrato por sí solo no acredita ejecución: la implementación y los resultados reales de validador/catálogo constan en B04; selección y ficha se comprueban en B05 y la partida sigue pendiente.

El [bloque 05: selección y configuración de sala](BLOQUE_05_CONFIGURACION_SALA.md), preparado el 02/10/2026 sobre B04 verificado, acuerda cambios inmediatos por control, último cambio válido procesado, selección/quitar selección autorizadas, participación/observación del anfitrión y consulta sincronizada. El autor eligió línea separada para observador y retorno al valor aceptado ante fallo. Implementado y verificado localmente el mismo día sobre código `73091f6`: 197/197 pruebas, 31/31 recorridos Chrome y 41 módulos, con B05-01–16 y regresiones B01–B04. La genérica sigue versión 1/no disponible; selección e icono usan fixtures temporales validadas. El cierre distingue reloj controlado, conexiones reales y reserva B03 de tiempo real; no acredita media hora real ni despliegue. Los documentos locales iniciales se conservaron separados en `ac8672b`. C09–C10 siguen parciales; las concreciones a trasladar a fuentes generales constan en B05 §12.8.

El [cambio técnico de incorporación de genérica contenido 2](ACTIVACION_GENERICA_V2.md), autorizado e incorporado el 02/10/2026, queda verificado localmente sobre `4115ad8`: copia de bytes con huellas aprobadas, formato 1/contenido 2/true, catálogo generado y proceso compilado normal que ofrece su resumen seguro. Comprobaciones nuevas: 197/197 pruebas, 35/35 recorridos Chrome a 390/1280 y 41 módulos; selección explícita, sincronización, permisos y recarga con dos sesiones independientes. Preparación documental conservada en `870f09f`, datos en `e403837`; el cierre distingue automatización/revisión visual de la prueba manual humana pendiente. No abre otro bloque funcional ni convierte una baraja disponible en selección predeterminada. Se conservan los resultados históricos B04/B05 y los casos de vacío/no disponibles mediante instalaciones/fixtures separadas. C09–C10 siguen parciales. Los commits son locales; la publicación posterior corresponde al hilo de GitHub y recuperación.

El [bloque 06: inicio y mesa inicial con humanos](BLOQUE_06_INICIO_Y_MESA_INICIAL.md), acordado el 03/10/2026 y verificado localmente el 04/10, entrega inicio exclusivo del anfitrión, 2–5 humanos, versión exacta disponible/validada, un único Game/reparto y vistas privadas recuperables. Base efectiva main `4dd073d`, rama `feat/b06-inicio-mesa-inicial`; preparación conservada `14ff894`, implementación `91238fd`. Evidencia nueva §10: check **249/249**, navegador compilado **47/47**, **50 módulos** sin imports prohibidos/ciclos más revisión semántica/visual; criterios B06-01–18 y ejemplos comprobados, con tiempo/entropía controlados diferenciados de conexiones/entropía reales. Incluye recuperación ante ack perdido/error técnico tras aceptación y reinicio real que elimina una mesa ya visible. Adopta bocetos funcionalmente a 360/390/1280, sin contador de cartas rival, turnos ni plazos de juego. Cancela ciclo B03, conserva cartas/presencia y limpia por reinicio sin privilegio de terminar. Fuentes generales actualizadas localmente por encargo explícito; requisitos completos del MVP conservados. Manual humano B06, ejecución/tiempos/automático/vigilancia y publicación/CI remota/despliegue pendientes; C09–C10 parciales. No se modifica genérica ni se abre otro bloque.

La incorporación de una baraja nueva no autoriza por sí sola a cambiar la mecánica. Una excepción de contenido o una modificación de reglas necesita una decisión explícita y sus comprobaciones.
