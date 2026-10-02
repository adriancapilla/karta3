# Encargo de implementación — bloque 05

Implementa B05 de KARTA3: selección de baraja y configuración de la sala de espera, siguiendo esta especificación acordada:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_05_CONFIGURACION_SALA.md`

## Preparación

Trabaja en `E:\KARTA3\KARTA3_IA\APP\karta3`. Lee `AGENTS.md`, proceso y plantilla SDD, organización/dependencias, contrato de barajas V1 y cierre de B04. Consulta aplicación §§3–7/10, dominio e infraestructura pertinentes en `E:\KARTA3\KARTA3_IA\TFM\Planificación`, y las garantías vigentes de B01, T01, B02 y B03.

Comprueba rama, HEAD y cambios locales antes de editar. La preparación observó `feat/b04-carga-barajas`, HEAD `7d2536f9c5ad1956fc218146e90c1fd6937a5a71`; es una referencia, no una orden de volver a ese estado. Conserva los documentos y cualquier trabajo existente. B04 está verificado localmente; sus resultados históricos no acreditan B05.

## Implementación

1. Añade la configuración dentro de la espera, después de obtener el código y permitiendo entradas mientras se configura. Incluye los cinco controles y sus valores/defaults de B05 §2. Usa «Forzar desempate», sin selector inverso. Empieza sin baraja seleccionada y permite quitar una selección existente.
2. Aplica cada control inmediatamente mediante `room:configure`, con el payload, confirmación y errores de B05 §5. Cada solicitud modifica solo un control. Para el mismo control prevalece el último cambio nuevo, válido y procesado; cambios de controles distintos se conservan. No introduzcas guardado de formulario ni rechazo por revisión antigua.
3. Conserva configuración y versión seleccionada en el servidor. Solo el anfitrión modifica; los invitados consultan valores aceptados. Implementa selección mediante un puerto de aplicación y el catálogo validado B04: comprueba disponibilidad, definición validada y versión publicada. Amplía la vista segura según §4, sin entregar cartas, JSON completos ni datos internos.
4. Implementa participación/observación del anfitrión conservando identidad, autoridad y presencia. Como jugador va al final; como observador no ocupa plaza y aparece en una línea aparte. No puede jugar con cinco plazas ocupadas, incluidas las reservas de reconexión. Resuelve atómicamente las carreras por la última plaza.
5. Reutiliza el ciclo B03: solo cambios efectivos aceptados renuevan la espera. Lecturas, repeticiones, rechazos, valores iguales y reconexiones no la renuevan. Aplica vencimientos debidos antes de actuar y conserva su prioridad en el instante exacto.
6. Implementa carga, catálogo vacío/error, ficha de selección, portada/icono neutro, pendientes y accesibilidad conforme a §3. Ante fallo vuelve al valor aceptado y muestra el error; si falta confirmación, explica la incertidumbre. Conserva foco, nombre en edición y otros controles pendientes. No encoles cambios de configuración para enviarlos automáticamente al reconectar; recuperar la vista tampoco envía cambios.
7. Respeta las responsabilidades de §7: modelo/casos de uso/puertos en aplicación, catálogo y transporte en infraestructura, adaptadores concretos en composición y contratos seguros para el cliente. Mantén los recorridos y garantías B01–B04.

## Comprobación y límites

Comprueba B05-01–16 y el plan de §9: permisos, versiones/disponibilidad, solicitudes repetidas, concurrencia, capacidad, recuperación, vencimientos y regresiones. Usa al menos dos sesiones independientes y dos pestañas del anfitrión, móvil de 390 px y escritorio de 1280 px. Distingue evidencia con conexiones reales de plazos comprobados con tiempo controlado. Ejecuta `npm run check` y `npm run test:browser`, incluida la comprobación arquitectónica y su revisión de responsabilidades.

Usa paquetes de prueba explícitos, disponibles y validados, con imágenes reales y nulas. La ejecución normal mantiene el catálogo vacío. Conserva sin cambios los paquetes genéricos de ASSETS y APP: formato/contenido 1 y `publication.available: false`. No actives contenido ni conviertas fixtures en publicaciones reales.

Quedan fuera bots/dificultades, expulsión, inicio de partida, motor/reparto/turnos/puntuación/desempate ejecutado, cartas/manos/mesa/resultados, equilibrio, CSV, edición editorial, GitHub y despliegue. No presentes un inicio operativo. C09–C10 solo se acreditan en las partes delimitadas por B05 §9.

Puedes decidir detalles internos compatibles con §7. Las decisiones funcionales están cerradas; consulta únicamente contradicciones reales o cambios necesarios de comportamiento/arquitectura, citando primero la regla afectada.

Al terminar, actualiza el cierre de B05 con la versión de código revisada, entorno, comprobaciones realmente ejecutadas, resultados por criterio, limitaciones y pendientes. Prepara un resumen para coordinación, incluidas las decisiones de §10 que deben trasladarse a las fuentes generales. Marca verificado solo cuando exista evidencia suficiente; no reutilices los recuentos históricos de B04 como resultados nuevos.
