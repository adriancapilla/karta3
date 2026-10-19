# Reglas de trabajo para KARTA3

Estas instrucciones se aplican al repositorio `APP/karta3`. La [organización y dependencias](docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md) desarrolla las reglas y explica cómo encaja el primer bloque existente.

## Fuentes antes de implementar

1. Leer la especificación SDD del bloque solicitado en `docs/sdd/` y el [proceso SDD](docs/sdd/PROCESO_SDD.md). Distinguir lo **acordado** de propuestas y de trabajo futuro.
2. Consultar, según el cambio, los documentos vigentes en `../../TFM/Planificación/`: `DOMINIO_KARTA3.md` para reglas del juego; `CAPA_APLICACION_KARTA3.md` para casos de uso, permisos y vistas; `INFRAESTRUCTURA_KARTA3.md` para tecnología, archivos y despliegue. `CONTEXTO_DESARROLLO_KARTA3.md` coordina el proyecto y su estado. El reglamento físico y StatDeck son referencias históricas; no sustituyen las decisiones digitales vigentes.
3. Si una especificación de bloque contradice una decisión general, señalarlo y alinear el documento responsable antes de dar el bloque por verificado. Una tarea de implementación no autoriza a cambiar silenciosamente puntuación, desempate, bots, tiempos ni otras reglas confirmadas.
4. No copiar código de StatDeck. Se pueden adaptar datos e imágenes aprobados con su validación y atribución.

## Dependencias obligatorias

```text
src (React) ───────→ shared/contracts ←─────── infraestructura HTTP / tiempo real

composición → infraestructura → aplicación → dominio
```

La dirección normativa es:

- `server/domain` contiene reglas puras. No importa React, Express, Socket.IO, Node, acceso a archivos, red, reloj real, almacenamiento ni módulos de aplicación o infraestructura.
- `server/application` organiza casos de uso y define los puertos que necesita. Puede importar dominio y contratos puros; no importa adaptadores concretos, Express, Socket.IO ni componentes React.
- `server/infrastructure` implementa puertos y transportes. Puede importar aplicación, dominio y contratos; traduce datos externos, pero no redefine reglas de cartas ni cambia por su cuenta el agregado `Game`.
- `server/composition` y `server/main.ts` conectan implementaciones con puertos e inician el proceso. Solo este borde elige adaptadores concretos.
- `src` muestra vistas y envía acciones. Puede importar tipos y contratos de transporte de `shared/contracts`; no importa módulos de `server`, no baraja, no valida jugadas definitivas ni calcula resultados oficiales.
- `shared/contracts` define únicamente mensajes y tipos de intercambio seguros para el navegador. No contiene objetos de dominio con información secreta ni lógica de juego.

Evitar dependencias circulares. No crear una clase, paquete o interfaz por cada concepto solo para aparentar capas: separar responsabilidades reales y usar interfaces en los puntos que necesitan sustitución.

## Garantías que ningún bloque puede romper

- `Game` gobierna las 58 cartas, tres atributos, rondas, bots, timeout, puntuación de **un punto por carta ganada** y, si se activa, **una única ronda de desempate**. El desempate no modifica puntos ni pilas ganadas. Su selector «Forzar desempate» empieza desactivado.
- El servidor es la autoridad de identidad, plazos, barajado, reparto, jugadas, bots, automático, puntuación y resultados. El navegador no se considera fuente de verdad.
- Construir una vista por destinatario: solo mano propia e información pública. No enviar manos rivales, orden oculto del mazo, credenciales ni datos privados al cliente u observador.
- Una solicitud repetida, tardía o concurrente no puede duplicar jugadas, timeouts, inicios ni desempates. Toda acción se valida en el servidor respecto a sala, identidad y fase.
- La dirección parcial del abridor cuenta para un timeout solo si el servidor la aceptó antes del vencimiento. Recargar no reinicia el reloj. Bots y humanos automáticos juegan en el servidor.
- Un final base sin humanos activos no inicia desempate. Si el último humano pasa a automático durante un desempate ya iniciado, se completa esa ronda y se reconoce al vencedor.
- Estado vivo en memoria de **un único proceso** por entorno para el MVP. B18 autoriza SQLite exclusivamente estadístico, separado del juego; no restaura Game, salas, sesiones o resultados jugables. No asumir varias réplicas, cuentas de usuario ni otra persistencia sin decisión de arquitectura.
- Una baraja se valida antes de jugar. Sus fuentes y sus JSON de ejecución se mantienen diferenciados; el catálogo público no entrega las 58 cartas ni información oculta de una partida.

## Cómo añadir código

Ubicar una regla donde nace: dominio si decide el juego; aplicación si coordina una petición o construye una vista; infraestructura si trata HTTP, sockets, archivos, sesiones, reloj o despliegue. Conectar los adaptadores en `server/composition/`; `server/main.ts` arranca el proceso. Si un bloque requiere separar otra responsabilidad, mover solo lo necesario y comprobar que el comportamiento existente se conserva.

Tras T01, `server/application/` contiene el modelo de sala, sus casos de uso, puertos y proyección de vistas; `server/infrastructure/` contiene el repositorio y las sesiones en memoria, los generadores y el adaptador HTTP Express; `server/composition/createApp.ts` conecta esas piezas. `server/roomStore.ts` y `server/app.ts` fueron sustituidos y ya no son puntos de extensión. Los incrementos nuevos siguen los límites de [organización y dependencias](docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), sin crear carpetas o puertos vacíos por anticipado.

## Verificación y cierre

El mantenimiento y la publicación del repositorio en GitHub se coordinan desde el hilo específico de GitHub, automatización y recuperación, por encargo del autor, siguiendo de forma proporcionada la metodología del máster: ramas de trabajo, pull requests, comprobaciones y revisión antes de integrar en `main`.

- Añadir o ajustar pruebas proporcionales al cambio: reglas puras en dominio; casos de uso con puertos sustitutos; adaptadores con pruebas de integración; recorridos de navegador cuando cambie el comportamiento visible. Probar especialmente los casos límite que la especificación del bloque señale.
- Ejecutar `npm run check` y las pruebas de navegador pertinentes al bloque. Registrar qué se ejecutó realmente; una lista de criterios en Markdown no cuenta como prueba pasada.
- Mantener documentación del bloque, README y ejemplos de configuración alineados con lo entregado. Las decisiones de arquitectura transversales se registran en `docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md` o se comunican a este hilo si alteran sus premisas. Las reglas generales del juego y la aplicación se corrigen en su documento responsable de TFM.
- No versionar secretos, datos de sesiones ni artefactos generados innecesarios. No afirmar que el VPS, Docker, Caddy o el subdominio de pruebas están desplegados hasta haberlo verificado.

## Supervisión eficiente de pruebas y GitHub Actions

- Al iniciar una ejecución, registra su URL/identificador, intento, commit y alcance. Evita lanzar ejecuciones duplicadas.
- Utiliza una única herramienta de espera o seguimiento por ejecución, preferentemente con salida resumida al terminar. No mantengas un ciclo de consultas del modelo cuando una herramienta pueda esperar por sí misma.
- Si necesitas consultar el estado manualmente, utiliza consultas compactas y espaciadas; como orientación, cada 5–10 minutos durante ejecuciones largas, respetando las posibilidades y límites de las herramientas. No releas registros que no han cambiado.
- Consulta registros detallados ante fallos o anomalías que requieran diagnóstico. Para ejecuciones correctas, recoge únicamente resultados, tiempos y evidencias necesarias para el cierre.
- No repitas pruebas correctas sin una razón identificada: cambios relevantes, reparación, incidencia externa o puerta obligatoria del proceso. Esta regla no elimina las comprobaciones exigidas de la fuente final, main integrado, imagen o clon.
- Fija un límite de supervisión considerando los presupuestos del flujo y la espera en cola. Alcanzarlo no autoriza a cancelar la ejecución remota ni a ampliar sus tiempos.
- Si no puedes continuar esperando eficientemente, termina la intervención indicando qué sigue pendiente, la URL, el commit, el último estado conocido y el siguiente paso. No declares comprobaciones superadas ni integración completada.
- Al retomar, consulta primero la ejecución existente. No la relances automáticamente.
- No crees automatizaciones, monitores recurrentes o tareas adicionales sin encargo del autor.
