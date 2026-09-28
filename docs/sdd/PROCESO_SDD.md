# SDD ligero para KARTA3

**Estado:** organización acordada el 27/09/2026; primer incremento digital elegido el 28/09/2026; aplicación práctica pendiente de comprobar.  
**Ámbito:** desarrollo nuevo de KARTA3. Este documento describe el trabajo por bloques; no sustituye las reglas del juego ni acredita código o pruebas.

## Fuentes y responsabilidades

- `TFM/Planificación/CONTEXTO_DESARROLLO_KARTA3.md`: acuerdos vigentes, alcance y coordinación general, mantenidos en su conversación responsable.
- `TFM/Planificación/DOMINIO_KARTA3.md`: reglas, modelo e invariantes del juego.
- `TFM/Planificación/CAPA_APLICACION_KARTA3.md`: casos de uso, permisos y comportamiento de la aplicación.
- `TFM/Planificación/INFRAESTRUCTURA_KARTA3.md`: decisiones técnicas y preparación de contenidos, pruebas y despliegue.
- Cada especificación de bloque: objetivo acotado, ejemplos y criterios comprobables para un incremento. Cita las secciones pertinentes; no vuelve a redactar todo el diseño.

Las fuentes de `TFM` están actualmente fuera del directorio técnico `APP/karta3`. Antes de publicar el repositorio se decidirá cómo ofrecer referencias accesibles al revisor sin mantener copias divergentes. Una especificación de bloque no cambia por sí sola una decisión confirmada en su documento responsable. Si detecta una contradicción, se registra y se alinea la fuente correspondiente antes de cerrar el bloque.

## Ciclo de un bloque

1. **Preparar y preguntar.** Elegir un comportamiento pequeño y útil. Leer dominio, aplicación e infraestructura; separar lo ya acordado de las decisiones de experiencia y alcance que faltan. Preguntar al autor por estas últimas antes de cerrar el encargo. Resolver dentro del equipo las elecciones técnicas menores que no cambien el comportamiento.
2. **Especificar y acordar.** Completar la [plantilla](PLANTILLA_BLOQUE.md) con recorrido, operaciones, errores, ejemplos y aceptación. Citar las reglas existentes sin volver a documentarlas. Registrar las respuestas del autor y dejar resueltas todas las dudas que bloqueen la implementación. El autor revisa el encargo concreto antes de enviarlo al hilo de desarrollo.
3. **Implementar.** Construir únicamente el incremento acordado. Las pruebas relevantes se derivan de los ejemplos y criterios, sin exigir una herramienta concreta de SDD ni una estructura extensa.
4. **Comprobar.** Ejecutar las pruebas pertinentes y, cuando haya interfaz o integración, probar también el recorrido observable. Registrar resultados reales, incluidos fallos y límites; una lista de pruebas previstas no demuestra ejecución.
5. **Cerrar o ajustar.** Marcar el bloque como verificado solo cuando se satisfagan sus criterios y exista evidencia localizable. Si las pruebas aconsejan cambiar el alcance, aplicar el procedimiento siguiente y volver a comprobar lo afectado.

Estados útiles: **propuesto**, **acordado**, **implementado**, **verificado**. Se indica la fecha de cada cambio de estado. «Implementado» no equivale a «verificado».

Una especificación **acordada** debe permitir que el hilo de implementación trabaje sin tener que decidir el comportamiento general. Puede escoger detalles internos compatibles con la arquitectura y pedir aclaración si aparece una contradicción real. El documento distinguirá lo incluido en ese incremento de las funciones ya confirmadas para el MVP que se implementarán después.

## Cambios y evidencia

En la propia especificación del bloque se registra cada cambio relevante: fecha, observación o motivo, decisión tomada, criterios modificados y documentos especializados afectados. Las decisiones específicas del incremento se documentan allí. Si una decisión completa o cambia una regla general, se comunica al ámbito responsable para alinear su documento; el resumen de coordinación identifica esta tarea. Las ampliaciones futuras permanecen como candidatas hasta que se acuerden expresamente. Los defectos de implementación se corrigen contra la especificación vigente sin convertirlos en cambios de regla.

Para cerrar un bloque se anotan, de forma breve:

- versión o referencia del cambio de código revisado (commit o pull request, cuando exista repositorio);
- comprobaciones ejecutadas, fecha, resultado y entorno; si fallaron, enlace o descripción del fallo y su resolución;
- evidencia manual solo cuando aporte algo que una prueba automática no muestre, como una captura de un recorrido visual;
- límites conocidos y relación con el siguiente bloque.

Estas referencias permiten reconstruir **requisito → especificación → cambio → comprobación** para el TFM. No se crean capturas ni informes voluminosos por rutina. Al finalizar un bloque se entrega a la conversación de coordinación un resumen de acuerdos nuevos, archivos, evidencia y pendientes; esa conversación actualiza su documento general.

## Secuencia inicial y barajas

El [bloque 01](BLOQUE_01_CREACION_SALA.md) crea una sala y muestra al anfitrión su espera. La entrada de otras personas, la configuración y el inicio de partida se especificarán como incrementos posteriores. Cada bloque describirá lo que la persona ve y hace, los estados necesarios y las comprobaciones de ese recorrido; las reglas ya cerradas permanecen en dominio y aplicación. Los aspectos de interfaz y jugabilidad digital todavía abiertos se contrastarán con usuarios cuando exista un recorrido observable.

La [validación genérica de barajas](PROPUESTA_VALIDACION_BARAJA.md) queda como propuesta técnica para antes de usar contenidos jugables en una partida, no como primer incremento ni como una especificación por temática. Sus reglas deben servir para cualquier baraja, sin condiciones especiales por identificador. Cuando se definan el formato de `baraja.json` y `cartas.json` y la preparación de recursos, un bloque posterior conectará esa validación con archivos, imágenes, versiones y catálogo conforme a infraestructura. Cada nueva baraja aprobada seguirá el mismo control y conservará el resultado asociado a la versión de sus datos.

La incorporación de una baraja nueva no autoriza por sí sola a cambiar la mecánica. Una excepción de contenido o una modificación de reglas necesita una decisión explícita y sus comprobaciones.
