# Publicación conjunta B11/paneles/B22/Vite — 22/10/2026

## Lectura vigente y alcance histórico

Este documento conserva la preparación y los intentos de publicación en su fecha; «traslado no ejecutado» describe aquella fase. El cierre posterior del VPS22/10 confirma B22 desplegado y escritura B21 aggregate, controles, copia cifrada y restauración aislada. La [entrega del MVP](ENTREGA_MVP_TFM.md) recoge las identidades finales y límites, sin convertir los pasos preparados de reversión/OFF en operaciones ejecutadas. No ejecutar instrucciones de traslado por el mero hecho de consultar este registro.

## Fuente y evidencia

Base publicada6359ceb/PR16: CI de fuente39591834330 correcta205/205; integrado39595228542 con204/205. Su OCI sigue no aprobado. Fuente local99f9c3da84356e11c7ef0ff93faf76dc0df0c3e7 más pendientes de paneles revisados y registrados por separado. Recuperación B11: fix/b11-espacio/aa336d3, código f3bf915. [Diagnóstico causal](../sdd/evidencias/B20/B11_ESPACIO_20261021.md): solo arnés, transporte preparado antes de Espacio genuino sobre control habilitado/enfocado, una solicitud/jugada y caso adverso retenido; el reensayo favorable histórico no se presenta como reparación.

[Paneles](../sdd/ADENDA_B15_ANCHO_PANELES_COMPACTOS.md): cota exterior min(disponible,450px), solo compacta; frontera1368 útiles y normal conservados. [B22](../sdd/BLOQUE_22_INCORPORACION_MODELOS_IA_2026.md): cuatro barajas, sin selección inicial; Criaturas2/2, genérica2/4, Modelos IA2/2 y Solar2/4. Contraste independiente de124 archivos anteriores y61 nuevos. Ninguna modificación editorial.

Recepción humana de este encargo: nueva baraja probada satisfactoriamente y paneles aceptados, aunque su presentación es mejorable. No acredita dispositivos físicos, otras fuentes o tamaños. Alineación general B20/B21 recibida21/10; B22 no altera contratos de analítica ni fuentes TFM. C09–C10 parciales.

Vite exacto8.3.1→8.3.5: [aviso oficial](https://github.com/advisories/GHSA-587h-7wmj-h5pm), corregido desde8.3.3; [release8.3.5](https://github.com/vitejs/vite/releases/tag/v8.3.5). Solo su subárbol de compilación (Rolldown/bindings, Oxc, PostCSS y Nanoid), sin actualizar otras dependencias directas. Auditoría del lockfile: producción0; completa2 entradas moderadas de Vitest/@vitest/mocker5.0.2 por dos avisos, sin avisos Vite. [Mock registration](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) y [traversal Windows](https://github.com/advisories/GHSA-xp26-3454-mjgp), corregidos desde5.0.3, quedan para otra actualización acotada. No audit fix ni ampliación automática; dependencias de desarrollo excluidas de producción.

## Puertas y publicador

Linux focal B11/paneles/B22 junto a imagen/SQLite; después CI completa de fuente final, revisión/squash sin skip ci, CI completa de main y clon independiente. Un trabajador/cero reintentos; presupuestos existentes35/30min y30/20min imagen. Scroll a analítica aceptado; garantías de mesa intactas. Resultados, intentos, SHA, URLs y candidato real se registran en cierre de PR/evidencia externa, sin commits solo para anotar SHA integrado.

El publicador manual conserva CI completa correcta, igualdad de árboles, archivo/manifiesto/configuración/digest y origen OCI. Distingue código público de paquete privado y exige identidad de asociación. Pruebas negativas rechazan paquete público, otro repositorio o excepción automática. Repository nulo exige revisión actual explícita en Package settings, registrada y desactivada por defecto. Sin valores históricos predeterminados. La descarga recibe la misma referencia editorial independiente B22 que CI. Publicar únicamente el OCI final aprobado de main, sin reconstrucción. Conservar copia local, imágenes anteriores, etiqueta de archivo y reserva4516d23 sin aplicar/eliminar.

## Traslado VPS preparado — no ejecutado

El autor trasladará el cierre al hilo VPS. Usar exclusivamente digest privado final aprobado, con commit/run/artefacto. Credencial read:packages fuera del chat; conservar imagen desplegada y anterior, sin borrado automático.

1. Inventariar y conservar imagen/configuración/almacenamiento actuales, copias, Caddy/redes/certificados. Una instancia; parada controlada pierde Game/sesiones RAM. No borrar ni migrar almacenamiento anterior.
2. Usar archivos de esta entrega: deploy/compose.yaml + deploy/compose.usage.yaml + deploy/compose.usage-key.yaml. No reutilizar compose.b19 o variables HUMAN. [Operación B21](ANALITICA_AGREGADA_B21.md).
3. Configurar KARTA3_IMAGE por digest final, KARTA3_ENV=pruebas y KARTA3_STATISTICS_MODE=aggregate. Override fija KARTA3_STATISTICS_DIRECTORY=/var/lib/karta3/statistics. KARTA3_STATISTICS_BACKUP_KEY_PATH señala archivo privado externo64hex/32bytes legible por UID1000; secret de solo lectura configura KARTA3_STATISTICS_BACKUP_KEY_FILE. Nunca pegar clave en Git/chat o variable literal.
4. Preparar volumen nuevo separado statistics_data del entorno, vacío y privado, escribible por UID1000 (directorio0700/DB0600). Nunca montar usage_data anterior. Con ejecución efímera del mismo digest y mismos montajes ejecutar npm run usage:initialize antes del arranque público. Destino nuevo /var/lib/karta3/statistics/pruebas/human/agg-daily-v1.sqlite, AGG_DAILY_V1/esquema1. Solo inicializar destino vacío; no sobrescribir/leer históricos. Arranque no inicializa automáticamente: falta/error deja analítica indisponible/OFF y no acredita activación.
5. Actualizar directamente al modo agregado aprobado, sin despliegue OFF previo. Comprobar salud/juego/catálogo cuatro/JSON privados, información efectiva, exclusión general y permiso separado de apariencia. Administración privada por SO/SSH; no endpoint público. CI sintética no acredita operación real.
6. Verificar persistencia/permisos, informes de solo lectura, copia AES-256-GCM y restauración en otro destino vacío con clave separada. usage:report, usage:backup, usage:restore y usage:maintain operan el modelo nuevo; mantenimiento con escritor detenido. No exponer DB/WAL/SHM, informes, exportaciones o claves. Copias externas y ensayo del responsable mantienen su pendiente propio.
7. Reversión: detener nuevo ejecutable; volver a imagen/configuración/almacenamiento anteriores compatibles, o analítica OFF con configuración compatible. Nunca abrir AGG_DAILY_V1 nueva con el ejecutable antiguo. Conservar nuevo volumen aislado; sin mezcla/restauración destructiva.

Activación, acceso administrativo y ensayo operativo corresponden al siguiente encargo VPS. No operación pública globalmente verificada, conformidad jurídica integral o C09–C10 completos.

## Incidencia de check de la primera CI conjunta

CI39690754879 sobre13bc564: check618/619 y Chrome no ejecutado, imagen correcta pero OCI no aprobado globalmente. Causa de arnés demostrada y reparación limitada en [evidencia B21](../sdd/evidencias/B21/IMPLEMENTACION.md#incidencia-de-sincronización-sqlite--22102026): flush concurrente no es barrera de SQLite. Se conservan aserciones, tiempo, cobertura y producto; se añade retención causal de append y se espera entries=0 antes de lecturas. Logs, selección focal nueva y CI final en PR17; no relanzamiento del mismo HEAD sin diagnóstico.

## Batería completa39692302535 — 22/10/2026

Fuente4e2ee5b: check620/59/104 e imagen correctos; Chrome219/222 en1544,317371s, worker1/retries0/omitidos0/flaky0, trabajo27m27s. Presupuesto suficiente; no ampliación. OCI de este intento no aprobado globalmente.

Dos fallos B20 P1 (1800/390) ocurren antes de la comparación: la huella de src/style.css seguía congelada en main6359ceb (dcb9076c6cb225835c773440015b665f2557ebde5186c41d6ce2f3abf65d01e8). Se contrastó que su único delta son las ocho líneas de la cota compacta ya aprobada; referencia nueva ccf2ca241f83831c90e288077663f312b0244308b02928d1bd5898ae71647de9. Actualizar esa huella no elimina ni relaja igualdad geométrica exacta entre cuatro apariencias/base nativa, contrastes, fuentes, tamaños, foco o revisión/turno. Sin CSS adicional.

Tercer fallo: B08 T2 1280 agota30s en readGame→page.evaluate(fetch) al iniciar humanPlay tras el primer vencimiento. No hay traza histórica: la CI global no la configuraba; error-context tampoco contiene instantánea DOM. No acredita causa de producto o arnés ni reparación por reensayo. Se añade observación de etapas, estado del fixture, HTTP real en servidor/navegador y errores/crash; sin alterar gestos, reloj, reglas, datos, aserciones o timeout. Trace retain-on-failure conserva evidencia de futuros fallos globales. Primero diagnóstico focal de esos casos; no se relanza global a ciegas.

## Main39698644623: rechazo nativo de casilla B05 — 22/10/2026

PR17 integrada por squash en2c94102e96acec75371c15c90b6b46b67becf471; fuente3bb759a y sus commits originales conservados en etiqueta publicada archivo/2026-10-22/pr17-3bb759a. CI de main: check620/59/104 e imagen correctos; Chrome221/222 en1052,716338s, worker1/retries0/omitidos0/flaky0. Falla B05-09/10/13. Su OCI12391687564/digest4b08e5d1eee39f6179722ac5c5e560efb6aedcc5a0a3e5449c6cd376f093ddc1 queda NO aprobado aunque imagen y verificación local de185 archivos pasen. Sin GHCR.

La traza conserva el error interno de locator.check() y el mensaje de producto «Necesitas una plaza libre para volver a jugar.». check exige que la casilla permanezca marcada; el caso comprueba justamente rechazo/estado desmarcado con cinco plazas ocupadas o reservadas. Si el servidor rechaza antes de la comprobación interna de Playwright, esta falla antes de llegar a las aserciones correctas. room.ts conserva ROOM_FULL antes de modificar hostPlays: no defecto funcional identificado.

Reparación exclusivamente de ensayo: dos intentos negativos usan clic nativo con control habilitado/desmarcado, exactamente una solicitud hostPlays=true, una respuesta ROOM_FULL, mensaje, casilla desmarcada y estado oficial false. El caso autorizado tras30s de reserva conserva check y estado marcado; resto del recorrido, permisos, foco/nombre/cierre y tiempos intactos. Sin force, nuevas tolerancias o retries. B11 conserva Space genuino sin sustitución.

Se reutiliza la misma rama temporal sobre main2c, con cero delta de árbol y fuente anterior protegida por etiqueta verificada; no nueva rama/checkout o repetición de B22. La continuación requiere PR correctiva, focal y CI completas de fuente/main. No se considera aprobado el OCI de una ejecución fallida ni se relanza el mismo HEAD sin reparación. B08 pasó en este main pero su causa histórica permanece sin cerrar.
