# Bloque 01 — Crear y gestionar la sala propia en espera

**Estado:** verificado localmente el 28/09/2026 para el alcance de este bloque. Las funciones de otros bloques siguen pendientes.  
**Fuentes:** `TFM/Planificación/CAPA_APLICACION_KARTA3.md` §§3–5, 14 (`CreateRoom`, `RenameParticipant`, `CloseWaitingRoom`) y 15; `TFM/Planificación/INFRAESTRUCTURA_KARTA3.md` §§2, 5–6. Este bloque concreta los pendientes de nombre y código solo para el recorrido de creación. Las reglas de partida permanecen en dominio.

## Objetivo y alcance

Una persona abre KARTA3, crea una sala sin configurar aún la partida y obtiene un código fácil de compartir. Puede cambiar su nombre provisional y cerrar expresamente la sala. El recorrido funciona en móvil y escritorio y conserva su identidad al recargar.

Este incremento **incluye** crear, mostrar y recuperar la espera propia, copiar el código, cambiar el nombre del anfitrión y cerrar con confirmación. **Deja para incrementos posteriores** la entrada de otros participantes, configuración editable, bots, inicio, juego y los plazos completos de desconexión y caducidad de la espera ya definidos en aplicación e infraestructura. El bloque se verifica como incremento local; todavía no completa una sala publicable para el MVP.

## Recorrido visible

1. La portada ofrece **«Crear sala»**. No pide nombre: al crear, el servidor registra al anfitrión como jugador con nombre provisional **«Jugador 1»**. Mientras se procesa, la interfaz impide un segundo envío accidental y muestra que está trabajando.
2. La espera muestra el **código de seis cifras**, conservando ceros iniciales, un botón **«Copiar código»**, al participante «Jugador 1» con una marca separada **«Anfitrión»** y el estado **«Esperando participantes»**. No muestra todavía controles de configuración ni permite iniciar una partida.
3. Al copiar, confirma **«Código copiado»**. Si el navegador no permite copiar, mantiene el código visible y seleccionable y ofrece un mensaje para copiarlo manualmente.
4. El anfitrión puede editar su nombre en la espera y guardarlo. Se quitan espacios al principio y al final; el resultado debe tener **1–16 caracteres percibidos por la persona** (grafemas Unicode; los espacios interiores cuentan). Se admiten caracteres visibles, incluidos acentos, números y emoji, así como nombres repetidos; se rechazan saltos de línea y caracteres de control. Un valor vacío o demasiado largo muestra un error junto al campo y conserva el nombre anterior. El nombre se presenta como texto, nunca como HTML.
5. **«Cerrar sala»** abre una confirmación que explica que el código dejará de funcionar. Cancelar conserva la sala. Confirmar la cierra en el servidor y devuelve a la portada; entonces puede crearse una nueva.
6. Si la misma sesión vuelve a la portada mientras su espera sigue activa, la aplicación la lleva **directamente a esa sala**. Recargar la espera en el mismo navegador recupera código, nombre y papel de anfitrión. Si el servidor ya no conserva la sala, muestra un aviso comprensible y vuelve a la portada.

## Contrato mínimo para el hilo de implementación

| Operación | Entrada y autorización | Resultado y condición esencial |
|---|---|---|
| Establecer sesión anónima | Navegador, antes de crear | Credencial opaca en cookie conforme a infraestructura. El nombre y el código no autorizan acciones de anfitrión. |
| Crear o recuperar espera propia | Sesión anónima; sin nombre en la solicitud | Si la sesión ya tiene una espera propia activa, devuelve **esa misma** sala. Si no, crea una sala `WAITING` con anfitrión jugador «Jugador 1», código numérico aleatorio de seis caracteres y valores iniciales de aplicación §4, incluida baraja aún sin seleccionar. |
| Obtener vista propia | Sesión y sala activa | Devuelve código como **cadena** de seis caracteres, estado, participante anfitrión y los datos necesarios para presentar la espera; una sesión ajena no recibe permisos de anfitrión por conocer el código. |
| Cambiar mi nombre | Sesión del participante, sala `WAITING`, nombre nuevo | Valida las reglas anteriores, cambia solo el nombre visible y devuelve la vista actualizada. Identidad, plaza, orden y código permanecen iguales. |
| Cerrar sala | Sesión del anfitrión, sala `WAITING` | Pasa a `CLOSED` y deja de ofrecer una espera recuperable con ese código o sesión. Una repetición no reabre ni crea otra sala. |

Estas operaciones se implementan mediante HTTP para este primer recorrido; el hilo de desarrollo puede elegir nombres de rutas y tipos internos coherentes. El servidor mantiene el estado en memoria, asigna la sesión antes de crear y procesa de forma atómica las solicitudes de creación de una misma sesión. Genera códigos evitando colisiones con salas activas, sin usar el código como secreto. Las respuestas fallidas indican una causa estable y un mensaje comprensible; no devuelven trazas internas ni presentan éxito en pantalla. Los valores predeterminados y la autoridad del servidor se toman de las fuentes citadas, sin volver a decidirlos aquí.

`APP/karta3` partió solo con documentación y sin repositorio Git. En este incremento se preparó el proyecto nuevo y su repositorio local, sin código de StatDeck.

## Ejemplos y criterios de aceptación

| Caso | Situación y acción | Resultado esperado |
|---|---|---|
| E1 | Sesión nueva pulsa «Crear sala». | Se crea una sola espera; ve seis cifras, «Jugador 1», «Anfitrión» y «Esperando participantes». |
| E2 | El código generado empieza por cero y se pulsa «Copiar código». | Se muestran y copian las **seis** cifras, incluido el cero inicial. |
| E3 | La misma sesión envía dos creaciones casi simultáneas o vuelve a la portada. | Hay una sola sala activa; la portada la redirige a ella. Dos sesiones independientes pueden crear salas con códigos distintos. |
| E4 | El anfitrión cambia el nombre a «Ana María», recarga y luego intenta guardarlo vacío o con 17 caracteres. | El nuevo nombre persiste tras recargar; ambos intentos inválidos muestran error y no lo sustituyen. Un nombre de 16 caracteres se acepta. |
| E5 | Otra sesión conoce el código e intenta cambiar el nombre o cerrar la sala. | Ambas acciones se rechazan; el código no concede identidad ni permisos. |
| E6 | El anfitrión pulsa «Cerrar sala», cancela y después confirma. | Cancelar no altera la espera; confirmar la cierra, devuelve a portada e invalida su recuperación. Una creación posterior obtiene una sala nueva. |
| E7 | Falla una operación o se pierde el estado del servidor. | La interfaz no anuncia un éxito inexistente; ofrece un mensaje comprensible y una salida o reintento apropiados. |

Para cerrar el bloque se ejecutan pruebas de aplicación y servidor para E1–E7, incluido el envío concurrente y los permisos con dos sesiones. Se revisa el recorrido a anchuras representativas de móvil y escritorio, con teclado, y se comprueba que código, edición y cierre se entienden sin explicación. Una prueba breve con una persona ajena al desarrollo puede aportar feedback sobre esos aspectos abiertos; cualquier cambio se registra antes de modificar criterios. Las pruebas previstas no cuentan como ejecutadas.

## Decisiones, límites y evidencia

**Decisiones del autor (28/09/2026):** nombre provisional «Jugador 1» con marca «Anfitrión», editable en esta espera; código y botón de copia; estado «Esperando participantes»; una espera propia activa se recupera; código numérico de seis cifras con ceros iniciales; nombre de 1–16 caracteres visibles; confirmación antes de cerrar; retorno automático a la sala activa desde la portada.

**Alineación documental:** aplicación §18 aún enumera límites de nombres y formato de códigos como pendientes. Las decisiones anteriores los concretan para este bloque; se comunicarán al ámbito responsable para actualizar esa referencia. No constituyen una duda pendiente para implementarlo.

**Decisiones internas compatibles con el bloque:** estructura de rutas, componentes y tipos; biblioteca concreta de pruebas. No pueden cambiar el recorrido, los permisos ni los resultados anteriores. El formato técnico de errores puede ser simple, pero debe permitir distinguir entrada inválida, sala no disponible y falta de permiso.

**Límites explícitos:** los 30 segundos de reconexión en espera, el cierre por 30 minutos sin actividad y su aviso previo se implementarán en el bloque de ciclo de vida de la espera antes de considerar completo el MVP. No se interpretará este primer incremento como verificación de esos plazos.

### Implementación y comprobaciones ejecutadas — 28/09/2026

**Entorno:** Windows NT 10.0.26200, Node.js 24.13.0, npm 11.6.2, Chrome 153.0.8010.54 sin interfaz gráfica, servidor Express local en `127.0.0.1:3000`. El navegador se probó a 390 × 844 y 1280 × 800 píxeles. Repositorio Git local, rama `main`, sin remoto ni despliegue.

**Cambio revisado:** commit local `e71de9e` (`server/roomStore.ts`, `server/app.ts`, `server/main.ts`, `src/`, pruebas, configuración de construcción y `README.md`). `npm run check` terminó correctamente: tipos, análisis estático, 9 pruebas de estado/API y compilación. `npm run test:browser` terminó correctamente: 6 pruebas de Chrome. Se inspeccionaron visualmente las capturas de ambas anchuras; no se observó desbordamiento y se distinguían código, edición y cierre.

| Caso | Comprobación realmente ejecutada | Resultado |
|---|---|---|
| E1 | Prueba del almacén, creación HTTP y recorrido Chrome a ambas anchuras. | Superado: una espera `WAITING`, «Jugador 1», «Anfitrión» y estado visible. |
| E2 | Almacén con generador determinista produjo `000042`. Chrome copió al portapapeles el código real recibido y, en otra prueba, `000042` inyectado en la respuesta HTTP. Se simuló denegación del portapapeles. | Superado para generación, conservación, copia y alternativa manual. No se esperó a obtener aleatoriamente un cero inicial en una ejecución completa del navegador. |
| E3 | Dos `POST` HTTP casi simultáneos con una misma cookie; dos cookies distintas; retorno a `/` y recarga en Chrome. | Superado: misma sala para una sesión, códigos distintos entre sesiones y retorno automático. |
| E4 | Pruebas del servidor para recorte, Unicode, 16/17 grafemas, vacío y controles; Chrome editó, recargó y probó vacío, 16 y 17 caracteres. | Superado: persiste el válido, los inválidos muestran error junto al campo y conservan el nombre previo. |
| E5 | Segunda cookie intentó leer, renombrar y cerrar por ID de sala ajena. | Superado: HTTP 403; la sala propia siguió intacta. Conocer el código no participa en la autorización. |
| E6 | Chrome canceló y confirmó el diálogo; API comprobó cierre, repetición, falta de recuperación y creación posterior. | Superado: cancelar conserva la sala; cerrar la elimina y permite otra nueva. |
| E7 | API simuló reinicio con almacén nuevo, entrada inválida y origen ajeno; Chrome simuló fallo 503, pérdida de estado y rechazo de copia. | Superado: no aparece éxito falso; hay error comprensible o retorno con aviso. La prueba de pérdida en Chrome usa respuesta simulada; la pérdida real de memoria se comprobó en API. |

El recorrido de creación se activó con teclado (`Enter`). La primera ejecución de la prueba de pérdida de estado falló porque recargaba antes de terminar la creación; se corrigió la espera de la prueba y la ejecución final tuvo 6/6 casos de navegador superados. No se ha realizado aún una prueba de comprensión con una persona ajena al desarrollo.

**Límites y siguientes bloques:** entrada de otras personas, configuración editable, bots, inicio, juego, Socket.IO, desconexión de 30 segundos y caducidad/aviso de 30 minutos. La cookie de producción se comprueba por atributos `HttpOnly`, `Secure`, `SameSite=Strict` y ausencia de `Domain`; aún no se ha probado detrás de HTTPS/Caddy ni en VPS. La memoria se pierde al reiniciar y no se comparte entre procesos, conforme al MVP de instancia única. La aplicación §15 y el contexto general aún deben incorporar las decisiones de nombre y código ya cerradas por este bloque.
