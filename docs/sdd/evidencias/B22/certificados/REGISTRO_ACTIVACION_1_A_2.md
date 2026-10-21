# Registro de activación 1 → 2

22/10/2026. Operación realizada por el Gestor de este hilo tras la respuesta expresa «Sí, apruebo la candidata y su activación».

## Resultado vigente

Paquete `paquetes/modelos-ia-2026`, id `modelos-ia-2026`, nombre `Modelos de IA — Edición 2026`, formato 2/contenido 2, disponible true. Aprobación vigente: `APROBACION_FINAL_Y_ACTIVACION.md`. Manifiesto final: `MANIFIESTO_SHA256.json`.

## Controles de activación

- Inventario previo: solo candidata contenido 1 de este id; no cambios intermedios.
- Verificados los 61 archivos contra el manifiesto de la candidata antes de copiar.
- Copia en una carpeta nueva; candidata, manifiesto anterior, registros de preparación y originales conservados.
- Únicamente tres diferencias semánticas: los dos contentVersion 1→2 y publication.available false→true. No se reserializa ni modifica otro byte de contenido de los JSON; la reversión de esos tres literales reproduce los dos archivos aprobados.
- Misma identidad, nombres, instrucciones, fuentes y créditos, 58 cartas en orden, permutaciones 1–58, valores informativos, indicadores, rutas y textos alternativos. Los 59 recursos conservan todas sus huellas.
- Manifiesto nuevo de los 61 archivos de contenido 2 disponible; no reutilización del manifiesto de candidata 1.
- Validador V2 existente ejecutado de nuevo sobre el final: válida, disponibilidad true, salida 0.

Detalle reproducible de las diferencias y SHA-256 de recursos: `DELTA_ACTIVACION_1_A_2.json`. Salida del validador final: `comprobaciones/VALIDADOR_V2_FINAL_2.json`. Preparación inicial, controles auxiliares y medidas visuales: `REGISTRO_PREPARACION.md` y `comprobaciones/`.

La revisión visual se realizó sobre la candidata aprobada y no se repite al activar: el delta demuestra que todo el contenido presentado, los atributos y las imágenes permanecen idénticos. La repetición del validador sí comprueba los nuevos metadatos y bytes finales.

## Alcance y pendientes

La aprobación y activación del contenido están terminadas. Los pendientes de confirmación/activación mencionados en los documentos de preparación son estados históricos resueltos por este registro y la aprobación final. `MANIFIESTO_EVIDENCIAS.json` conserva la instantánea previa y sus archivos originales; no certifica los archivos añadidos después. `MANIFIESTO_ENTREGA_FINAL.json` identifica la entrega completa posterior.

No se ha copiado a APP, generado catálogo, modificado código, contrato u otras barajas ni publicado/desplegado. Faltan las pruebas de incorporación coordinadas: versión seleccionada, recursos servidos, modos y perfiles, indicadora/mano/Mesa/Detalles/Información de baraja, carruseles, acciones, foco y permisos en el producto integrado. Las medidas Windows/Chrome aisladas no acreditan otras fuentes, dispositivos físicos, zoom real, Linux/CI o VPS, ni equilibrio o verificación científica.

El autor mantiene el control de una futura retirada de la baraja del catálogo público infantil mencionada en su ficha; no se programa aquí una retirada automática.
