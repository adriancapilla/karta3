# GitHub, comprobaciones y recuperación

Fecha: 01/10/2026. Repositorio existente: `E:\KARTA3\KARTA3_IA\APP\karta3`.
Versión de paquete: 0.1.0. Base: `main`, commit `bbd575f`.

## Estado verificado

- Base limpia, 13 commits conservados y publicados en `main` hasta `bbd575f`.
- Revisados archivos actuales y nombres de archivos de todo el historial. La búsqueda de patrones de tokens, claves privadas y credenciales en URL no produjo coincidencias; es una revisión acotada, no una garantía universal de ausencia de secretos.
- `.env.example` contiene solo puerto y modo de ejecución. `.env`, dependencias, compilaciones y resultados generados están ignorados.
- `npm run check` ejecutado el 01/10: 65/65 pruebas, tipos, lint, 25 módulos sin infracciones arquitectónicas y compilación correctos.
- Remoto: `https://github.com/adriancapilla/karta3.git`, privado por decisión del autor durante el desarrollo; se prevé acceso público durante la evaluación y volver a privado después. La visibilidad se comprobó mediante el conector. GitHub CLI tiene autenticación válida; el diagnóstico previo de sesión inválida provenía de las restricciones de red del entorno. No se requiere renovar la sesión ahora. CI remoto pendiente de ejecución.
- Los 18/18 recorridos Chrome de B03 son evidencia local previa. En esta tarea los 18 casos mostraron resultado correcto en el repositorio y en la copia separada, pero el proceso no terminó después de los casos y se interrumpió. Arrancar Node directamente en lugar de npm no resolvió el cierre en Windows. No se acredita una ejecución completa de navegador con salida correcta ni CI remoto. La configuración Linux queda preparada para verificación; si reproduce el bloqueo habrá que resolverlo antes de integrar.
- Copia local separada en `E:\KARTA3\KARTA3_IA\APP\karta3-verificacion-github-20261001`, creada con `git clone --no-hardlinks` desde la base; se copió la configuración Playwright preparada. `npm ci` y `npm run check` pasaron con 65/65 pruebas, tipos, lint, arquitectura y compilación. No es todavía una clonación desde GitHub ni contiene un nuevo commit publicado.

## Automatización preparada

`.github/workflows/ci.yml` se ejecuta en cambios de `main`, pull requests hacia `main` y petición manual. Usa Ubuntu 24.04, Node 24.13.0 y `npm ci` desde el lockfile. Las acciones oficiales se fijan por commit, con permiso de lectura y sin conservar credenciales en el checkout.

Ejecuta `npm run check`: tipos, análisis estático, pruebas existentes de modelo/aplicación/adaptadores/API, control de capas y compilación. Después instala Chrome con Playwright y ejecuta todos los recorridos existentes. En CI Playwright arranca el servidor compilado, rechaza un servidor preexistente y usa un solo trabajador sin reintentos que oculten fallos. No usa secretos ni despliega.

Se mantienen locales la revisión humana de interfaz, pruebas con personas, averías físicas de red, HTTPS real y los futuros ensayos de despliegue. La validación de barajas se añadirá cuando exista su herramienta; actualmente no está implementada. Los límites temporales y simulaciones siguen descritos en B03.

Referencias: [GitHub Actions para Node](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [CI de Playwright](https://playwright.dev/docs/ci).

## Flujo de trabajo

Crear una rama breve desde `main` actualizado, implementar el encargo delimitado, comprobar localmente y abrir una pull request con problema, cambio y evidencia. Revisar diff y resultados del commit más reciente antes de integrar. Conservar trazabilidad entre especificación, commit y comprobaciones. No fusionar automáticamente.

Tras elegir repositorio y autenticar: publicar el historial existente, subir la rama de este cambio, abrir PR y verificar el resultado real de Actions. Configurar protección de `main` con PR y comprobaciones requeridas si el plan y visibilidad lo permiten; registrar lo aplicado realmente. La mera presencia del YAML no acredita CI operativo.

Para reproducir: clonar el remoto en una carpeta separada, identificar el commit, ejecutar `npm ci`, `npm run check` y, con Chrome instalado, `$env:CI='true'; npx playwright test`. Registrar resultados y versión de herramientas. Las referencias externas a TFM en documentación son rutas del espacio de trabajo del autor; no son necesarias para construir. El acceso de evaluación a esas fuentes requiere enlaces o exportación controlada acordados, sin duplicar las fuentes normativas.

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
