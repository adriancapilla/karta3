# Organización del código y dependencias de KARTA3

**Estado:** reglas para los próximos incrementos; T01 aplica la separación al recorrido de creación de sala, sin implementar aún el dominio de la partida.
**Fecha:** 29/09/2026.
**Ámbito:** repositorio digital `APP/karta3`. La evolución de estas reglas se decide en la conversación de arquitectura; cada conversación de implementación trabaja con una especificación SDD concreta.

## 1. Qué resuelve este documento

KARTA3 se implementa como una aplicación web en un único repositorio y un único proceso de juego por entorno durante el MVP. Las capas separan **quién decide una regla**, **quién coordina una acción** y **cómo se conecta con navegador, archivos y servicios**. La separación no exige dividir el sistema en microservicios ni comenzar otro proyecto.

Las fuentes funcionales vigentes están en `../../../../TFM/Planificación/` desde esta carpeta:

| Fuente | Decisiones que gobierna |
|---|---|
| `DOMINIO_KARTA3.md` | Barajas, cartas, puntuación, estados de `Game`, rondas, bots, automático, desempate e invariantes. |
| `CAPA_APLICACION_KARTA3.md` | Sala, permisos, casos de uso, plazos, reconexión, vistas y presentación. |
| `INFRAESTRUCTURA_KARTA3.md` | TypeScript, React/Vite, Node/Express, Socket.IO, memoria, barajas preparadas, entornos y despliegue. |
| `CONTEXTO_DESARROLLO_KARTA3.md` | Coordinación, alcance, responsables y estado del TFM. |

`docs/sdd/PROCESO_SDD.md` y la especificación del bloque fijan el trabajo **de ese incremento**. Cuando un bloque completa o modifica una decisión general, se actualiza su fuente responsable; el texto de un bloque no anula silenciosamente otra regla.

Estas rutas sirven en el espacio de trabajo actual. Antes de publicar un repositorio autónomo se facilitarán al revisor enlaces o una exportación controlada de la documentación TFM. Esa distribución editorial no debe crear dos versiones normativas divergentes.

## 2. Responsabilidades y dependencias

| Zona | Contiene | Puede depender de | No debe contener |
|---|---|---|---|
| **Dominio** | `Game`, `Deck`, `Card`, `Player`, `Round`, `Play`, valores y políticas puras; invariantes y resultado. | Tipos puros propios; datos explícitos recibidos como argumentos. | HTTP, sockets, sesión, reloj real, archivos, React, Express, persistencia. |
| **Aplicación** | Casos de uso y coordinación de sala/partida, permisos, vistas, puertos necesarios. | Dominio, contratos puros, puertos definidos en la propia capa. | Controladores HTTP, componentes React, almacenamiento o transporte concretos, reglas de comparación de cartas. |
| **Infraestructura** | Adaptadores HTTP, tiempo real, sesiones, memoria, reloj, barajas, aleatoriedad y registro; validación de datos externos. | Puertos de aplicación, dominio y contratos en el borde necesario. | Decisiones nuevas sobre puntuación, ganadores o políticas de bots. |
| **Composición** | Construcción del servidor y conexión entre casos de uso y adaptadores. | Todas las piezas que conecta. | Reglas de juego o de producto. |
| **Interfaz** | Pantallas, estados de presentación, accesibilidad y envío de acciones. | Contratos de intercambio y cliente de API/sockets. | Acceso a dominio del servidor, baraja completa oculta o decisión oficial sobre jugadas. |
| **Contratos compartidos** | Formatos públicos de petición, respuesta, evento y vista. | Tipos transportables independientes. | Entidades internas completas, credenciales, estado oculto o lógica de juego. |

La dirección central es **infraestructura → puertos de aplicación → dominio**. La aplicación define la capacidad externa que necesita; la infraestructura la implementa y la composición las conecta. El dominio no conoce a sus consumidores. Un adaptador puede invocar un caso de uso, pero no modificar directamente el interior de `Game` ni saltarse el caso para aplicar reglas.

Un contrato compartido define qué se transporta. No obliga a que la entidad de dominio tenga exactamente esa estructura. La aplicación proyecta una vista distinta para cada participante y para el observador.

## 3. Ubicación propuesta en el repositorio existente

La estructura tras T01 contiene solo las zonas que ya tienen una responsabilidad real:

```text
karta3/
├── AGENTS.md
├── docs/
│   ├── arquitectura/
│   └── sdd/
├── server/
│   ├── application/        modelo Room, casos de uso, puertos y vista propia
│   ├── infrastructure/     HTTP, repositorio en memoria, sesión y generación
│   ├── composition/        conexión de adaptadores y casos de uso
│   └── main.ts             arranque y servicio de la interfaz compilada
├── shared/contracts/       tipos de intercambio públicos
├── src/                    transporte, coordinación y presentación React
├── tests/browser/          recorrido observable
└── tools/                  control de dependencias y sus casos negativos
```

El directorio `server/domain/` aparecerá al implementar reglas de `Game`; no se creó vacío para T01. La herramienta de barajas también queda para su bloque. Una prueba cercana al módulo que comprueba es válida. Se mantiene un solo repositorio y los comandos actuales.

### Estado del primer bloque tras T01

T01 separó `server/roomStore.ts` y `server/app.ts`: `Room` conserva estado y transiciones; `RoomUseCases` coordina identidad interna, permisos, código y repositorio; `roomView.ts` proyecta la respuesta; infraestructura conserva mapas, cookie, cripto y Express; composición los conecta. Los contratos públicos viven en `shared/contracts`. El comportamiento HTTP y la interfaz del bloque 01 se conservaron y se comprobaron de nuevo.

Las carpetas nuevas se crean al implementar funciones nuevas o al extraer una responsabilidad real. Se evita tanto un archivo único creciente para todas las funciones como una jerarquía llena de clases sin conducta.

## 4. Dónde va cada decisión

| Necesidad | Lugar responsable | Ejemplo de límite |
|---|---|---|
| Comparar cartas, resolver la ronda, atribuir cartas ganadas | Dominio | Un punto por **carta** ganada, no por ronda. |
| Seleccionar jugada de bot fácil/normal o automático humano | Dominio | Recibe su mano y la información permitida; no consulta otros jugadores en infraestructura. |
| Preparar y resolver la ronda única de desempate | Dominio | Solo empatados en cabeza; cartas adicionales no cambian puntos ni puestos base. |
| Crear sala, admitir participantes y bots, comprobar permisos | Aplicación | Coordina la preparación y consulta el dominio al iniciar la partida. |
| Recibir una jugada o dirección parcial y relacionarla con identidad/turno | Aplicación | Verifica fase y delega el movimiento completo a `Game`. |
| Programar el vencimiento real de un turno o revisión | Infraestructura | Entrega el aviso al caso de uso; no elige la carta por timeout. |
| Persistir el estado vivo del MVP | Adaptador en memoria | Un proceso por entorno; la aplicación expresa el puerto. |
| Cargar barajas, convertir CSV y comprobar imágenes | Herramienta y adaptador de infraestructura | El dominio valida 58 cartas y tres permutaciones 1–58. |
| Construir una vista para jugador/observador | Aplicación | No envía manos ajenas; la interfaz no recibe datos para ocultarlos localmente. |
| Mostrar la mesa, temporizador estimado y botón de feedback | Interfaz | El servidor decide la hora límite y la aceptación. |

`Room` puede tener un modelo de aplicación que proteja sus propias transiciones sin convertirse por ello en regla de cartas. `Game` sigue siendo el agregado de la partida. La representación exacta de `Play`, `DeckSnapshot` y los contratos de mensajes se decidirá en los bloques que los necesiten, conforme a los pendientes expresos del dominio y la aplicación.

## 5. Contratos entre capas

Los puertos de aplicación representan capacidades: repositorio de salas/partidas, catálogo de barajas, reloj y programación de vencimientos, identidad, generación de códigos, aleatoriedad, emisión de vistas y registro técnico. Un puerto aparece cuando un caso de uso necesita esa capacidad; no se implementa un catálogo especulativo de interfaces vacías.

Las entradas de red y los archivos se validan al cruzar el borde de infraestructura. La aplicación vuelve a comprobar autorización y estado. El dominio comprueba sus invariantes aunque el mensaje externo estuviera bien formado. Los errores se traducen al exterior con códigos comprensibles, sin filtrar trazas ni información privada.

Cada petición o evento identifica la sala y el contexto vigente. Las acciones de una sala se aplican una vez y en orden coherente: un mensaje repetido o tardío no puede duplicar una carta, un timeout, el inicio ni el desempate. La identidad anónima viaja por credencial de sesión, no por el nombre visible. La reconexión obtiene una vista vigente y no reinicia plazos.

La interfaz no importa tipos internos solo porque estén escritos en TypeScript. Se definen contratos de transporte mínimos, con campos públicos o propios del destinatario. La validación estática de tipos no sustituye la validación de datos recibidos en ejecución.

## 6. Barajas y evolución

Los originales editables viven en `ASSETS`; una copia aprobada y reproducible de cada versión forma parte de `APP`. La herramienta interna produce `baraja.json`, `cartas.json`, imágenes referenciadas y catálogo de barajas disponibles. Son recursos preparados de infraestructura, no una dependencia del dominio respecto al sistema de archivos. El navegador ve el catálogo, portada y cartas que puede conocer; el servidor conserva la definición completa para barajar y validar.

Nuevas funciones, como cuentas, historial, importación pública de barajas o más procesos de servidor, exigirán revisar puertos y despliegue. No se introducen en el MVP solo para anticipar una evolución posible.

## 7. Comprobaciones y cambio arquitectónico

Para cada bloque acordado:

1. Relacionar sus criterios con las fuentes vigentes y señalar si cambia una regla general.
2. Implementar en la zona responsable y comprobar que sus dependencias tienen la dirección permitida.
3. Probar dominio de forma pura, casos de uso con puertos sustitutos, adaptadores con integración y recorridos visibles cuando correspondan.
4. Ejecutar `npm run check` y las comprobaciones adicionales del bloque; registrar resultados reales.
5. Documentar cualquier desviación arquitectónica deliberada: motivo, alcance, alternativa y tarea de corrección si es temporal. No declarar que la arquitectura está completa por haber creado carpetas.

`npm run check:architecture`, integrado en `npm run check`, revisa imports de valor y tipo, reexportaciones, aliases configurados y ciclos entre los módulos de producción. Sus casos negativos se ejecutan con `npm test`. Este control sintáctico se complementa con revisión de responsabilidades: no demostraría por sí solo que un adaptador haya dejado de decidir permisos o nombres. La ampliación técnica de esta guía se decide en el hilo de arquitectura.
