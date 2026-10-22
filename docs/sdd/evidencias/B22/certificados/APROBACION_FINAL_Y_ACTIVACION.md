# Aprobación final y activación

**Estado vigente a 22/10/2026: contenido aprobado y activado en ASSETS, listo para incorporación manual coordinada.**

Id: `modelos-ia-2026`. Nombre visible: `Modelos de IA — Edición 2026`. Formato 2; contenido 2; `publication.available: true`.

## Confirmación del autor

En este hilo se presentó al autor la candidata de formato 2/contenido 1, con sus 58 cartas, desempates, 59 imágenes y propósito demostrativo sin finalidad formativa. La consulta identificó la carpeta `candidata-contenido-1/modelos-ia-2026`, el resultado del validador V2 local y el alcance auxiliar de la revisión visual. Solicitó aprobación final y activación cambiando exclusivamente las dos versiones y publication.available, sin copia a APP.

Respuesta directa del autor el 22/10/2026:

> Sí, apruebo la candidata y su activación

Esta respuesta confirma la candidata final, además de la aceptación editorial del ZIP de origen. No se han introducido cambios editoriales. Se conserva la naturaleza demostrativa, la clasificación editorial de Inteligencia y todos los matices de datos, fuentes, variantes, redondeos y fechas.

Candidata aprobada e intacta: `candidata-contenido-1/modelos-ia-2026`. Manifiesto aprobado: `MANIFIESTO_CANDIDATA_1.json`, SHA-256 `59ec8efc354d35b88e8c8bb4570f5fc10bb71ad11fac67db655feec1f8009364`. El documento `APROBACION_CONTENIDO.md` conserva la solicitud previa con su estado histórico pendiente; la respuesta aquí registrada es posterior y cierra ese pendiente.

## Activación realizada por el Gestor

El Gestor de este hilo ha creado una copia nueva en:

`E:\KARTA3\KARTA3_IA\ASSETS\Entregas\2026-10-21-modelos-ia-2026-formato-2\paquetes\modelos-ia-2026`

Cambios exclusivos frente a la candidata aprobada:

1. baraja.json.contentVersion: 1 → 2.
2. baraja.json.publication.available: false → true.
3. cartas.json.contentVersion: 1 → 2.

No había otra versión intermedia del id en ASSETS al activar. Se mantuvo schemaVersion 2, el orden de propiedades y cartas y la representación literal del resto de los JSON. Revertir esas tres sustituciones recupera exactamente los bytes originales de ambos archivos. Los 59 recursos son idénticos entre ZIP, candidata y final.

Huellas finales SHA-256:

- baraja.json: `2b05800cd6df64080366212f7fd7475ce66ca336116758b3ae7d071cb41e1ee2`.
- cartas.json: `95871a98aefce784eff5b66dd07f5f6c3a8e3109531eb6227c4ee68b52926c30`.

`MANIFIESTO_SHA256.json` y `SHA256SUMS.txt` certifican los 61 archivos finales disponibles. No se reutiliza el manifiesto de contenido 1 para certificar contenido 2. Delta e identidad de recursos en `DELTA_ACTIVACION_1_A_2.json`.

Validador V2 existente sobre el paquete final: salida 0, válida, disponibilidad true. Registro: `comprobaciones/VALIDADOR_V2_FINAL_2.json`.

**No queda activación pendiente para Implementación.** La incorporación mediante SDD/Implementación, copia exacta, generación del catálogo y comprobación integrada corresponden a un encargo posterior. Esta aprobación no ejecuta ni autoriza desde este hilo publicación o despliegue, y no sustituye pruebas en la aplicación integrada.
