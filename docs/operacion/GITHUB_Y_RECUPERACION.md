# GitHub, comprobaciones y recuperación

Actualizado: 02/10/2026. Repositorio existente: `E:\KARTA3\KARTA3_IA\APP\karta3`.
Versión de paquete: 0.1.0. Remoto privado: `https://github.com/adriancapilla/karta3.git`.

## Publicación B04, B05 y genérica contenido 2 — 02/10/2026

Base remota comprobada: `main` en `ac144fe`, PR #1 ya integrada. Entrega local: `feat/b04-carga-barajas`, `eafe9e8`, árbol limpio y diez commits posteriores conservados. El encargo del autor autoriza publicar, revisar e integrar mediante squash tras comprobar CI, y reproducir desde GitHub sin ASSETS. Mantener el remoto privado.

La entrega añade validación pura/común de barajas, lectura estricta y recursos, preparación determinista del catálogo y carga antes de escuchar; configuración por control autorizada/sincronizada con anfitrión jugador u observador; copia aprobada de genérica formato 1/contenido 2 disponible, sin selección automática. No implementa partida ni despliegue.

Revisión del diff completo, archivos y diez commits: sin coincidencias en los patrones buscados de tokens, claves privadas y credenciales en URL. Revisión acotada, no auditoría general de la aplicación. No se versionan carpetas externas ni catálogo, compilaciones o resultados generados. Las referencias locales de especificaciones son documentación; construcción y ejecución usan solo APP. El autor comunica pruebas manuales satisfactorias; ese resultado se distingue de los recorridos automatizados.

Huellas SHA-256 aprobadas que deben conservarse en Git y en el clon limpio:

| Copia APP | SHA-256 |
|---|---|
| `barajas/generica/baraja.json` | `991406d04f60bfe884166a69fcc43954cfc751f0e058093ae2542f32c989e8ed` |
| `barajas/generica/cartas.json` | `868988a43fe6c6be1a73be14013c543dc2fc83970341a4243be868af75b4c35c` |

La referencia local recibida es 197 pruebas, 35 recorridos Chrome y 41 módulos. Los resultados remotos y del clon de esta publicación se registrarán separadamente; no se deducen de los documentos históricos B04/B05/AGV2.

Primera ejecución remota [37057998515](https://github.com/adriancapilla/karta3/actions/runs/37057998515), `406f5cc`: instalación/tipos/lint correctos, fallo de las pruebas de arranque por ausencia de `dist` en un checkout limpio. La comprobación local con compilaciones previas sí pasó (197/197, 41 módulos), pero no demostraba reproducción limpia. Se corrigió el orden de `check`: tipos → lint → preparación/compilación → pruebas → arquitectura. No se cambió comportamiento de producto ni una regla funcional. Para ejecutar `npm test` por separado, construir primero con `npm run build`.

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

Ejecuta `npm run check`: tipos, análisis estático, pruebas existentes de modelo/aplicación/adaptadores/API, control de capas y compilación. Después instala Chrome con Playwright y ejecuta todos los recorridos existentes. En CI el paso de navegador arranca el servidor compilado, espera su disponibilidad y lo detiene al salir; Playwright usa un solo trabajador sin reintentos que oculten fallos. Ese paso tiene un límite de cinco minutos. No usa secretos ni despliega.

La validación/preparación de barajas existe desde B04: `npm run decks:validate -- --package barajas/generica` valida individualmente y `npm run decks:prepare` genera el catálogo. La preparación también forma parte de `build`, incluido en `check`; las pruebas cubren JSON/formato/dominio/recursos, disponibilidad, privacidad, vigencia del catálogo y arranque. `sharp` y sus paquetes nativos se instalan desde el lockfile en el entorno de CI; su ejecución Linux debe comprobarse, no inferirse de Windows.

Se mantienen locales la revisión humana de interfaz, pruebas con personas y averías físicas de red; HTTPS real y despliegue requieren sus encargos posteriores. Los límites temporales y simulaciones siguen descritos en B03/B05/AGV2. El catálogo es una instantánea por proceso: nueva copia requiere preparar y reiniciar; las salas/configuración en memoria se pierden al reiniciar.

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
