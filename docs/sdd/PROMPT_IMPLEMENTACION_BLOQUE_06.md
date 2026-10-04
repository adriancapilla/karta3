# Encargo de implementación — B06

Implementa **B06: inicio de partida y mesa inicial con humanos** en `E:\KARTA3\KARTA3_IA\APP\karta3`, siguiendo:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_06_INICIO_Y_MESA_INICIAL.md`

Las decisiones funcionales están cerradas con el autor el 03/10/2026. La especificación está acordada, todavía no implementada ni verificada.

## Preparación y rama

Lee `AGENTS.md`, proceso/plantilla SDD, organización/dependencias, B06 y sus bocetos en `docs/sdd/referencias/b06`. Consulta los contratos y cierres B01–B05/T01/activación, contrato de barajas V1 y las secciones citadas de dominio, aplicación, infraestructura y contexto en `E:\KARTA3\KARTA3_IA\TFM\Planificación`.

Comprueba rama, HEAD y cambios locales antes de editar. La preparación observó `main` y `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`, aplicación 0.1.0, árbol limpio antes de añadir los documentos de B06. Trabaja en **una nueva rama basada en main**, por ejemplo `feat/b06-inicio-mesa-inicial`; conserva los documentos preparados y cualquier trabajo existente. No restablezcas ni descartes cambios para volver a esa referencia. Si main avanzó, comprueba su compatibilidad y registra la base efectiva. Los commits serán locales; publicación/PR/integración corresponden al hilo de GitHub y recuperación.

B01–B05 y genérica formato 1/contenido 2 disponible están integrados. Sus resultados históricos no acreditan B06. No cambies los JSON de APP/ASSETS ni la disponibilidad de contenido.

## Implementación acotada

1. Añade «Iniciar partida» solo al anfitrión en espera y `room:start` según B06 §5: identidad de cookie, entrada exacta requestId/roomId, validación del servidor, ack y vistas seguras. Recupera una aceptación de resultado incierto antes de ofrecer otro envío; no inicia por recarga/reconexión.
2. Serializa con las demás acciones y aplica primero los vencimientos de espera debidos. Exige 2–5 humanos jugadores, todos los miembros conectados —también anfitrión observador— y baraja seleccionada disponible/validada de la versión exacta. No añadas listo por jugador ni necesidad de llenar cinco plazas.
3. Implementa en dominio puro solo el estado inicial necesario: valida con `validateDeck`, consume una permutación obtenida de entropía del servidor, reparte tres en adquisición, establece abridor primero del orden base, indicadora, atributo y ronda 1 sin dirección/jugadas. Game pasa a PLAYING. Conserva las 58 cartas, puntos cero e instantánea inmutable. Nunca baraja/reparte en React o en el handler de sockets.
4. Fija participantes y preparación, crea un único Game asociado a la sala y publica por destinatario. Dos pestañas, solicitudes repetidas/nuevas y pérdida de ack recuperan la misma partida sin repetir barajado/reparto. Las carreras con entrada/configuración/nombre/salida/cierre se resuelven por orden de procesamiento conforme a §5.3.
5. Amplía RoomView por fase manteniendo WAITING intacto. IN_GAME contiene la forma de §5.2: parte pública, metadatos seguros, indicadora y solo mano propia; observador sin mano. Conserva imageAlt validado en la instantánea de presentación y URLs versionadas B04. No expongas JSON completos, manos rivales, orden/IDs ocultos del mazo, credenciales o semillas en HTTP, ack, eventos ni registros.
6. Cancela/invalida todo el ciclo de espera B03 al confirmar inicio, conservando índices de código/sesiones. Callbacks antiguos no afectan a IN_GAME. Perder todas las conexiones de una sesión solo marca DISCONNECTED; mantiene participantes/cartas hasta recuperar. Otra pestaña conectada mantiene CONNECTED. No introduce margen de 30 segundos, reloj de turno, vigilancia de dos minutos, caducidad de 30 minutos ni resultado en esta mesa deliberadamente sin ejecución.
7. Recupera la misma partida mediante las rutas existentes y room:resume; bloquear nuevas entradas y cambios de preparación, incluso salir/cerrar. No existe botón/endpoint de terminar/cancelar partida. Para limpiar los ensayos se reinicia el servidor local y se pierde toda su memoria; al recuperar ausencia/sesión nueva, el cliente elimina la mesa privada y vuelve al recorrido inicial sin inventar causa o ganador.
8. Construye una mesa funcional basada en los bocetos según §3: lista ordenada y puntuaciones, abridor/self/anfitrión, observador aparte, jugadas vacías, indicador completo o compacto con Detalles, mano privada en fila/desplazable, atributo, ronda/mazo y mensaje «Mesa inicial preparada. La ejecución de turnos todavía no está disponible.». No muestres contador de cartas de cada jugador. Usa Jugable y Dato siempre separados, incluso iguales, con unidades literales. No incluyas relojes ni controles ALTO/BAJO/jugada de las escenas futuras de los bocetos.
9. Separa presentación, transporte y estado; componentes sencillos que permitan ajustar diseño después. Aplica accesibilidad/foco/Detalles e imágenes nulas/reales de §3. No hagas un rediseño general ni copies exactamente el arte de referencia. Respeta las responsabilidades/puertos reales de §6 y las dependencias de AGENTS; evita abstracciones de funciones futuras.

## Comprobación

Comprueba **B06-01–18**, ejemplos E1–E7 y plan de §8: dominio, conservación, inicio inválido/autorizado/repetido/concurrente, permisos, callbacks antiguos, privacidad de mensajes reales, observador, varias pestañas, recuperación, reinicio y móvil/escritorio. Usa dos sesiones independientes para jugadores y tres para anfitrión observador con dos invitados. Prueba 360/390/1280 px, teclado, Detalles, recursos nulos/reales y su fallo de carga.

Conserva las garantías y baterías anteriores de sala, ciclo de espera, catálogo, selección/configuración y activación. Los paquetes no disponibles, vacíos, inválidos o con imágenes reales son fixtures separados; no alteres genérica ni ASSETS. Verifica ejecución compilada normal sin acceso a ASSETS, con selección explícita de genérica 2.

Ejecuta **`npm run check`** y **`npm run test:browser`**. Complementa la comprobación de importaciones/ciclos con revisión de responsabilidades y del contenido exacto de HTTP/ack/eventos por destinatario. Distingue conexiones reales, aleatoriedad sustituida/real, plazos con reloj controlado y recorridos manuales. No atribuyas tiempo real, dispositivos físicos o pruebas humanas que no hayas usado. Deja instrucciones manuales con dos sesiones y el ensayo de observador; reinicia entre partidas.

## Límites y cierre

No implementes turnos, ALTO/BAJO, jugadas, resolución, reposición, timeouts, automático, revisión de ronda ejecutada, desempate, resultados, bots, expulsión, despliegue ni otro bloque. Los requisitos completos de tiempos/ausencias y vigilancia siguen pendientes del incremento de ejecución; no los sustituyas por reglas provisionales. No añadas autoridad del anfitrión para terminar partidas ni endpoints de control de pruebas al producto.

Puedes resolver las elecciones internas de §6. Consulta solo una contradicción real o un cambio necesario de comportamiento/arquitectura, citando la fuente; no reabras los acuerdos visuales o la limpieza por reinicio.

Actualiza el README vigente con lo realmente entregado y la limpieza local por reinicio. Documenta la organización concreta de Game/coordinación/puertos en la guía de dependencias sin cambiar sus límites. Completa el cierre B06 con commit/base efectiva, comprobaciones realmente ejecutadas y resultados por criterio, evidencias y pendientes. Marca implementado/verificado solo cuando corresponda; conserva históricos B04/B05/activación y **C09–C10 parciales**.

Devuelve un resumen para coordinación con archivos, acuerdos, evidencia, limitaciones y la actualización de descripciones de B06 en contexto/aplicación/infraestructura. Esos documentos generales describen el MVP completo: mantener sus requisitos futuros y registrar explícitamente la entrega parcial, sin presentar esta mesa como partida jugable ni abrir el siguiente bloque.
