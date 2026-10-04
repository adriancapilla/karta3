# GitHub, comprobaciones y recuperación

Actualizado: 04/10/2026. Repositorio existente: `E:\KARTA3\KARTA3_IA\APP\karta3`.
Versión de paquete: 0.1.0. Remoto privado: `https://github.com/adriancapilla/karta3.git`.

## Publicación B06 y B07 — 04/10/2026

Base remota verificada: `main` en `4dd073d`; entrega `feat/b07-partida-manual-completa`, HEAD original `043813e424b28f64733687b95c0c279189622f91`, árbol limpio y ocho commits posteriores conservados. Repositorio privado, sin PR abierta al comenzar. Encargo autorizado: revisión completa B06/B07, publicación por PR y squash tras comprobaciones, sincronización y reproducción desde GitHub. Conservar rama y commits; sin despliegue ni siguiente bloque.

El hito incorpora inicio/reparto/mesa privada y partida humana manual completa: dirección parcial privada, turnos circulares, puntuación por cartas, reposición, tres rondas finales, desempate opcional único, revisión y resultados recuperables durante 30 minutos desde publicación final. Volver al inicio libera solo la sesión solicitante y permite otra sala sin reiniciar. La aplicación mantiene todo en memoria de un proceso; reiniciarlo pierde resultados/salas/sesiones. TurnTimeout sigue configurado pero no se ejecuta: temporización de turnos, automático, bots, ausencias de juego/vigilancia y mejoras generales de distribución quedan pendientes.

Evidencia histórica de implementación B06: 249 pruebas, 47 recorridos y 50 módulos. B07 §9.1: 295 pruebas, 63 recorridos y 57 módulos; navegador local con dos trabajadores tardó 5,8 minutos. El autor confirma en este encargo una partida humana completa, recuperación del resultado y creación de otra sala. Esa confirmación nueva no sustituye ni reescribe la evidencia automatizada/histórica.

Presupuesto CI ajustado antes de publicar: Chrome pasa de 5 a **20 minutos**, trabajo completo de 15 a **30 minutos**. La referencia de dos trabajadores sugiere reservar hasta 11,6 minutos seriales, más margen por variación de runner/red; no es una predicción de duración. Los otros 10 minutos permiten instalación, herramientas/compilación y limpieza. Se conserva un trabajador, batería íntegra, aserciones/plazos individuales y cero reintentos. Registrar duración y resultados remotos reales de PR/main, sin deducirlos de la referencia local.

Revisión del cambio completo respecto a main: capas, autoridad/privacidad por destinatario, reparto, transiciones, deduplicación, recuperación y separación de resultado/asociación activa. Búsqueda acotada en los ocho commits de patrones de tokens, claves privadas y credenciales en URL: cero archivos coincidentes. No equivale a auditoría general. Versionados solo APP y los tres bocetos aprobados de B06 como referencias documentales; no ASSETS/TFM/MASTER, secretos, logs, capturas, catálogo ni compilaciones. `.env.example` contiene valores de ejemplo. Dos saltos Markdown con espacios finales de B06 se expresan con barra inversa, conservando contenido y presentación.

Genérica formato 1/contenido 2 disponible conserva las dos huellas aprobadas de la tabla histórica siguiente; no cambia JSON, contrato V1, dependencias ni lockfile. Fuentes generales de TFM y errata de dominio §24.2 corresponden a sus responsables; no se alteran reglas para reproducir ese ejemplo.

**Comprobación nueva de esta publicación:** clon limpio real desde GitHub en `E:\KARTA3\KARTA3_IA\APP\karta3-verificacion-b06-b07-20261004`, commit `0e29420`, Windows/Node 24.13.0/npm 11.6.2, sin ASSETS/TFM/MASTER. `npm ci`: salida 0, 328 paquetes. `npm run check`: salida 0, tipos/lint/preparación/build, **295/295 pruebas en 28 archivos**, **57 módulos** sin imports prohibidos/ciclos. Arranque `PORT=3001 npm run start` correcto; `/` y `/api/decks` responden 200, genérica formato 1/contenido 2 disponible, catálogo `no-store` y sin cookie. Ambos JSON privados responden 404 por HTTP y ambas huellas SHA-256 coinciden exactamente con las aprobadas. Servidor de ensayo detenido. No se repite aquí la batería de navegador local: se ejecutará completa en CI sobre el commit final y después sobre main, con un trabajador y el margen ampliado. Esta entrada posterior solo registra evidencia, sin modificar código/dependencias/pruebas.

Publicación mediante [PR #3](https://github.com/adriancapilla/karta3/pull/3), adjunta a la conversación de GitHub. Su descripción conserva el cierre remoto: enlaces de CI del HEAD final y de main, duraciones/recuentos reales, SHA del squash y estado local/remoto/clon. Se actualiza ese registro de ejecución al completar cada puerta, sin crear un nuevo commit de código solo para anotar el SHA que acaba de integrarse. Procedimiento: revisión y CI del HEAD final antes de integrar; CI de main, igualdad local/remota y arranque del clon sincronizado después. El registro histórico de B06/B07 permanece separado de esos resultados remotos nuevos.

## Evidencia histórica B04, B05 y genérica contenido 2 — 02/10/2026

Base remota comprobada: `main` en `ac144fe`, PR #1 ya integrada. Entrega local: `feat/b04-carga-barajas`, `eafe9e8`, árbol limpio y diez commits posteriores conservados. El encargo del autor autoriza publicar, revisar e integrar mediante squash tras comprobar CI, y reproducir desde GitHub sin ASSETS. Mantener el remoto privado.

La entrega añade validación pura/común de barajas, lectura estricta y recursos, preparación determinista del catálogo y carga antes de escuchar; configuración por control autorizada/sincronizada con anfitrión jugador u observador; copia aprobada de genérica formato 1/contenido 2 disponible, sin selección automática. No implementa partida ni despliegue.

Revisión del diff completo, archivos y diez commits: sin coincidencias en los patrones buscados de tokens, claves privadas y credenciales en URL. Revisión acotada, no auditoría general de la aplicación. No se versionan carpetas externas ni catálogo, compilaciones o resultados generados. Las referencias locales de especificaciones son documentación; construcción y ejecución usan solo APP. El autor comunica pruebas manuales satisfactorias; ese resultado se distingue de los recorridos automatizados.

Huellas SHA-256 aprobadas que deben conservarse en Git y en el clon limpio:

| Copia APP | SHA-256 |
|---|---|
| `barajas/generica/baraja.json` | `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` |
| `barajas/generica/cartas.json` | `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c` |

La referencia local recibida es 197 pruebas, 35 recorridos Chrome y 41 módulos. La PR de esta publicación es [#2](https://github.com/adriancapilla/karta3/pull/2); las evidencias nuevas siguientes se distinguen de los documentos históricos B04/B05/AGV2.

Primera ejecución remota [37057998515](https://github.com/adriancapilla/karta3/actions/runs/37057998515), `406f5cc`: instalación/tipos/lint correctos, fallo de las pruebas de arranque por ausencia de `dist` en un checkout limpio. La comprobación local con compilaciones previas sí pasó (197/197, 41 módulos), pero no demostraba reproducción limpia. Se corrigió el orden de `check`: tipos → lint → preparación/compilación → pruebas → arquitectura. No se cambió comportamiento de producto ni una regla funcional. Para ejecutar `npm test` por separado, construir primero con `npm run build`.

Segunda ejecución [37058274060](https://github.com/adriancapilla/karta3/actions/runs/37058274060), `bc9369f`: 196/197 pruebas; la construcción aislada falló en Linux porque el guard de pruebas sustituía `fs.realpathSync` y perdía su método `native`, utilizado por Vite. Se conserva y protege también `native`, añadiendo una comprobación de que rechaza ASSETS. El guard sigue siendo real; no se elimina para hacer pasar la prueba. Corrección limitada al montaje de pruebas, sin cambio funcional.

Ejecución remota [37058554535](https://github.com/adriancapilla/karta3/actions/runs/37058554535), `cfb3d1a`: instalación reproducible, tipos, lint, preparación/compilación, 197/197 pruebas, 41 módulos sin infracciones y 35/35 recorridos Chrome (2,6 minutos), todo correcto en Ubuntu 24.04. La CI del commit posterior de documentación, [37059236100](https://github.com/adriancapilla/karta3/actions/runs/37059236100), `c9cac5d`, pasó las comprobaciones generales pero obtuvo 34/35 en Chrome: timeout global de 30 segundos durante la limpieza de B03-15. Su presupuesto era inferior a la suma de esperas individuales (12 + 10 + 10 segundos, más preparación y cierre). Se fija 60 segundos solo para ese recorrido y se cierran los clientes antes del servidor en su limpieza, manteniendo las aserciones y sus plazos, sin reintentos ni cambios funcionales. La CI del commit corregido y la posterior a integrar deben confirmarse y quedar enlazadas en la PR.

Clon limpio desde GitHub en `E:\KARTA3\KARTA3_IA\APP\karta3-verificacion-b04-b05-20261002`, sin ASSETS, Node 24.13.0/npm 11.6.2: `npm ci` correcto; `npm run check` correcto, 197/197 pruebas y 41 módulos. Los 35/35 recorridos Chrome terminaron con código 0 (2,1 minutos) sobre `bc9369f`; después se incorporó `cfb3d1a` y se repitió `check` correctamente, incluida la comprobación adicional del guard. Arranque con `npm run start`: página y `/api/decks` responden 200; catálogo con genérica contenido 2 disponible, sin cookie y con `no-store`; los dos JSON no se sirven por HTTP (404). Ambas huellas SHA-256 coinciden con las aprobadas. Servidor de prueba detenido al acabar. Tras integrar se sincronizará este clon con `main` y se comprobarán instalación, comprobaciones y arranque del commit integrado.

La publicación anterior quedó cerrada: PR [#2](https://github.com/adriancapilla/karta3/pull/2) integrada por squash en `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`; [CI final de PR](https://github.com/adriancapilla/karta3/actions/runs/37060016784) y [CI de main](https://github.com/adriancapilla/karta3/actions/runs/37060642030) correctas, 197/197 pruebas, 35/35 Chrome y 41 módulos. Main y clon sincronizados y limpios; instalación/check/arranque del integrado y huellas verificados. Estos resultados resuelven las comprobaciones pendientes descritas en el registro previo, conservado como evidencia del proceso; no son pruebas de B06/B07.

## Evidencia histórica de la primera conexión — 01/10/2026

- Base limpia, 13 commits conservados y publicados en `main` hasta `bbd575f`.
- Revisados archivos actuales y nombres de archivos de todo el historial. La búsqueda de patrones de tokens, claves privadas y credenciales en URL no produjo coincidencias; es una revisión acotada, no una garantía universal de ausencia de secretos.
- `.env.example` contiene solo puerto y modo de ejecución. `.env`, dependencias, compilaciones y resultados generados están ignorados.
- `npm run check` ejecutado el 01/10: 65/65 pruebas, tipos, lint, 25 módulos sin infracciones arquitectónicas y compilación correctos.
- Remoto: `https://github.com/adriancapilla/karta3.git`, privado por decisión del autor durante el desarrollo; se prevé acceso público durante la evaluación y volver a privado después. La visibilidad se comprobó mediante el conector. GitHub CLI tiene autenticación válida; el diagnóstico previo de sesión inválida provenía de las restricciones de red del entorno. No se requiere renovar la sesión ahora.
- Pull request de aquella preparación: [#1](https://github.com/adriancapilla/karta3/pull/1), integrada mediante squash en `ac144fe`. Primera ejecución remota [36848811413](https://github.com/adriancapilla/karta3/actions/runs/36848811413), commit `daa8a9e`, completada con éxito. La configuración corregida en `e0caa5e` también pasó en [36849287307](https://github.com/adriancapilla/karta3/actions/runs/36849287307): instalación, comprobaciones generales y Chrome. Es evidencia histórica, no una ejecución de B04/B05.
- Los 18/18 recorridos Chrome de B03 son evidencia local previa. En esta tarea el arranque mediante `webServer` de Playwright bloqueó el cierre local de Windows, incluso usando Node directo. Se retiró ese control de Playwright: CI gestiona arranque y limpieza mediante el paso de shell y localmente se arranca el servidor en otra terminal. En el clon remoto con la configuración corregida, los 18/18 recorridos terminaron con código 0 (1,5 minutos); el servidor de prueba se detuvo después. La primera ejecución Linux también acredita 18/18 recorridos (1,7 minutos), independientemente de la evidencia histórica B03.
- Copia local separada en `E:\KARTA3\KARTA3_IA\APP\karta3-verificacion-github-20261001`, creada con `git clone --no-hardlinks` desde la base; se copió la configuración Playwright preparada. `npm ci` y `npm run check` pasaron con 65/65 pruebas, tipos, lint, arquitectura y compilación. No es todavía una clonación desde GitHub ni contiene un nuevo commit publicado.

## Automatización vigente

`.github/workflows/ci.yml` se ejecuta en cambios de `main`, pull requests hacia `main` y petición manual. Usa Ubuntu 24.04, Node 24.13.0 y `npm ci` desde el lockfile. Las acciones oficiales se fijan por commit, con permiso de lectura y sin conservar credenciales en el checkout.

Ejecuta `npm run check` en orden: tipos, análisis estático, preparación/compilación, pruebas de dominio/aplicación/adaptadores/API y control de capas. Después instala Chrome con Playwright y ejecuta todos los recorridos existentes. En CI el paso de navegador arranca el servidor compilado, espera su disponibilidad y lo detiene al salir; Playwright usa un solo trabajador sin reintentos. Ese paso tiene un límite de 20 minutos y el trabajo completo 30, justificados arriba para B07. No usa secretos ni despliega.

La validación/preparación de barajas existe desde B04: `npm run decks:validate -- --package barajas/generica` valida individualmente y `npm run decks:prepare` genera el catálogo. La preparación también forma parte de `build`, incluido en `check`; las pruebas cubren JSON/formato/dominio/recursos, disponibilidad, privacidad, vigencia del catálogo y arranque. `sharp` y sus paquetes nativos se instalan desde el lockfile; su ejecución y los recursos reales se han comprobado también en la CI Linux enlazada arriba.

Se mantienen locales la revisión humana de interfaz, pruebas con personas y averías físicas de red; HTTPS real y despliegue requieren sus encargos posteriores. Los límites temporales y simulaciones se describen en cada bloque; revisión y retención B07 están temporizadas, el turno todavía no. El catálogo es una instantánea por proceso: nueva copia requiere preparar y reiniciar; salas/partidas/resultados/sesiones en memoria se pierden al reiniciar. El resultado retenido se consulta por cookie de su roster original aunque se haya liberado la asociación para otra sala; no hay historial permanente.

Referencias: [GitHub Actions para Node](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [CI de Playwright](https://playwright.dev/docs/ci).

## Flujo de trabajo

Crear una rama breve desde `main` actualizado, implementar el encargo delimitado, comprobar localmente y abrir una pull request con problema, cambio y evidencia. Revisar diff y resultados del commit más reciente antes de integrar. Conservar trazabilidad entre especificación, commit y comprobaciones. Integrar mediante squash cuando el encargo del autor lo autorice y la revisión/CI sean correctas; no pedir otra confirmación rutinaria cuando ya exista esa autorización.

El historial se publicó conservando sus commits y los cambios de esta tarea se subieron en `chore/github-ci` mediante PR #1. Se consultó la protección de `main`: GitHub respondió 403, indicando que requiere Pro o repositorio público. No se activó protección de rama ni se cambió el plan o la visibilidad. En el plan privado actual la revisión previa a integrar es un procedimiento del autor, no un bloqueo impuesto por GitHub.

Para reproducir: clonar el remoto en una carpeta separada, identificar el commit, ejecutar `npm ci` y `npm run check`. Con Chrome instalado, arrancar `npm run start` en una terminal y ejecutar `$env:CI='true'; npx playwright test` en otra. Registrar resultados y versión de herramientas. Las referencias externas a TFM en documentación son rutas del espacio de trabajo del autor; no son necesarias para construir. El acceso de evaluación a esas fuentes requiere enlaces o exportación controlada acordados, sin duplicar las fuentes normativas.

Reproducción desde GitHub: clon privado en `E:\KARTA3\KARTA3_IA\APP\karta3-clon-remoto-20261001`, base `daa8a9e`, Node 24.13.0 y npm 11.6.2. `npm ci` y `npm run check` completados con éxito: 65/65 pruebas, tipos, lint, 25 módulos sin infracciones y compilación. La configuración Playwright de `e0caa5e` se copió a este clon y completó 18/18 casos con salida 0. Después se actualizó el clon desde el remoto; los cambios finales son documentación, sin modificar aplicación, dependencias ni pruebas. Las copias separadas son evidencias locales, no un servicio de copias programado.

## Protección fuera de Git: propuesta pendiente

GitHub conserva archivos y commits publicados. Proponer una copia cifrada en otro dispositivo o proveedor, con versiones y ensayo de restauración, para:

| Material | Qué conservar |
|---|---|
| ASSETS | Originales editables, recursos y atribuciones; no solo exportaciones web. |
| TFM | Planificación, evidencias, memoria y entregables. |
| MASTER | Referencias vigentes e histórico necesario. |
| Trabajo sin registrar | Archivos nuevos, modificaciones locales y ramas/commits no publicados. |
| Configuración privada | Valores privados y medios de recuperación de acceso, guardados cifrados y separados del repositorio público. |

Antes de automatizar copias, acordar destino, acceso, retención y frecuencia. Un ensayo debe restaurar en otra carpeta, cotejar inventario y comprobar construcción; guardar su fecha y resultado. No se han copiado estas carpetas, contratado servicios ni programado copias. Restaurar código y contenidos no recupera salas, sesiones ni resultados del proceso en memoria.

## Mantenimiento

Actualizar Node, dependencias y commits de acciones mediante PR y repetir comprobaciones. Revisar fallos en Actions, conservar referencias a ejecuciones relevantes y mantener acceso y permisos mínimos. Al añadir pruebas o herramientas de barajas, incorporar su comando real y actualizar esta descripción. Despliegue, Docker, Caddy y VPS quedan fuera de este encargo.
