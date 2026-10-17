# Entrega para incorporación manual — Criaturas Mágicas

Fecha: 16/10/2026. Id: criaturas-magicas.

**Contenido editorial aprobado y activado en ASSETS: schemaVersion 2, contentVersion 2, publication.available true.**

## Paquete que debe recibir Implementación

E:\KARTA3\KARTA3_IA\ASSETS\Entregas\2026-10-16-criaturas-magicas-formato-2\paquetes\criaturas-magicas

Contiene baraja.json, cartas.json, imagenes/portada.webp y las 58 ilustraciones imagenes/cartas/carta-001.webp a carta-058.webp: 61 archivos. Incorporar únicamente esa carpeta de paquete cuando lo encarguen SDD e Implementación.

Documentos de entrega:
- MANIFIESTO_SHA256.json y SHA256SUMS.txt: identidad de los bytes finales, candidata y evidencias.
- APROBACION_CONTENIDO.md: aprobaciones de las cartas y confirmación directa de portada/description.
- DELTA_ACTIVACION_1_A_2.json: activación realizada por el Gestor.
- REGISTRO_PREPARACION.json: procedencia, controles y límites detallados.

## Fuente y aprobación

Fuente editorial: E:\KARTA3\KARTA3_IA\PRODUCTO\Barajas\criaturas Mágicas.

Se utilizó el CSV raíz y las rutas finales de imagenes/. No alimentan el paquete las muestras de pruebas-estilo, PNG originales o revisiones sustituidas. pendientes-revision.md registra la aprobación de 042-perla-v3 y el cierre de esta ronda de revisión de las 58 cartas; mantiene las decisiones anteriores, incluido conservar el erizo. carta-039 sigue siendo Lombriz del éter.

Portada y descripción renovada figuraban pendientes. Se mostró portada v1 y se transcribió la descripción completa al autor, que respondió «Sí, apruebo portada y descripción». APROBACION_CONTENIDO.md vincula esos elementos y la candidata mediante SHA-256. Los documentos fuente archivados conservan su estado histórico anterior a esta aprobación; PRODUCTO no se modifica.

Se conservan:
- Los 58 ids y el orden de las cartas.
- atributo1 Poder, atributo2 Astucia, atributo3 Resistencia, sin abreviar.
- Tres permutaciones 1–58 y los 174 textos mostrados, iguales expresamente a los rangos, sin unidades.
- Indicadores del CSV, reparto 20/19/19 como decisión de esta colección, no regla universal.
- Nombres, características, notas, textos alternativos, rutas y recursos.
- Las instrucciones originales de cuatro párrafos: capacidades ficticias y habilidades narrativas sin acciones nuevas.
- Tres créditos y dos fuentes. Licencias desconocidas vacías, sin nuevas atribuciones.
- Criterios completos, público y dirección artística en fuentes-editoriales/ficha-baraja.md y el registro, sin añadir propiedades al contrato.

No se recalculan puntuaciones ni se recortan textos. No se requirieron cambios NFC.

## Versiones y activación completada

No existía una candidata previa de criaturas-magicas en ASSETS. Las versiones 4 de las otras barajas no determinan su número inicial.

Se conserva candidata-contenido-1/criaturas-magicas, contenido 1, disponible false, con MANIFIESTO_CANDIDATA_1.json. El Gestor ha realizado la activación expresamente autorizada hacia contenido 2, disponible true.

Únicos cambios semánticos:
1. baraja.json.contentVersion: 1 → 2.
2. baraja.json.publication.available: false → true.
3. cartas.json.contentVersion: 1 → 2.

schemaVersion sigue en 2. Se verificó identidad de todos los demás campos y de los 59 recursos. Los JSON se activaron sustituyendo exclusivamente esos literales, conservando incluso la representación del resto del archivo. El manifiesto final es nuevo y corresponde a los bytes disponibles de contenido 2.

**No queda activación pendiente para Implementación.** Quedan su incorporación física, generación del catálogo y pruebas integradas después de SDD.

## Comprobaciones efectivamente realizadas

### Preparación y controles auxiliares

CSV de 16 columnas, 58 ids únicos, tres series completas y correspondencia literal con cada campo del paquete. Máximo dato/unidad: dos grafemas. Ningún texto precisó modificación por NFC. Los máximos técnicos observados están registrados.

59 WebP de 640 × 480 decodificados completamente con Pillow; portada y cartas coinciden mediante SHA-256 con PRODUCTO y con la candidata. Las rutas se conservan.

Se comprobaron 66 archivos fuente usados y 252 archivos protegidos de otras barajas en ASSETS: permanecen idénticos.

### Validador real existente del proyecto

Se ejecutó localmente:
node --import tsx tools/decks.ts validate --package <ruta del paquete>

- Candidata contenido 1: exit 0, válida, disponibilidad false.
- Final contenido 2: exit 0, válida, disponibilidad true.

La herramienta comprueba estructura, V2/Unicode/NFC, recuentos/topes, invariantes y recursos. stdout y resultados en VALIDACION_LOCAL_EXISTENTE.json. Entorno: Node v24.19.0, ICU 78.3, Unicode 17.0.

Esta es validación local del paquete con la herramienta existente, no una ejecución remota ni prueba del catálogo, servidor, partida o despliegue.

### Normal, compacta y contenido de Detalles

Se renderizaron estáticamente GameCard/CardInformation y CSS actuales sin editar APP ni iniciar un servidor. Se revisaron las 58 cartas en normal y compacta, ambos modos, y el contenido de Detalles: cinco perfiles, 870 filas de atributos.

Chrome 155.0.8059.80, Windows, fuente efectiva Segoe UI. Las mediciones no detectaron texto fuera de las celdas, nombres recortados o imágenes rotas. Se inspeccionaron capturas representativas de Dragón de fuego, Unicornio lunar, Lombriz del éter, Kraken de perlas, Gólem de las hiedras y Rana piel de roca.

Observación concreta: en compacta el símbolo de Resistencia ocupa una línea y el nombre la siguiente. Ambos permanecen completos con el comportamiento existente; no se modifica fuente, abreviatura ni CSS. En normal el conjunto cabe en una línea. Las notas y características se mantienen en Detalles; «Activo» aparece en su línea propia según el componente.

Las galerías, capturas y REVISION_VISUAL_AUXILIAR.json son evidencias de contenido/encaje aislado. No acreditan la mesa completa, carruseles, acciones, estados, permisos o sesiones. Quedan pruebas en aplicación integrada, dispositivos físicos, otras fuentes y zoom real.

## Pendientes concretos

No quedan pendientes editoriales identificados de cartas, portada o descripción, ni activación pendiente en ASSETS.

SDD e Implementación deben:
1. Incorporar una copia exacta del paquete final y contrastar este manifiesto.
2. Ejecutar el validador en su revisión/runtime y generar catálogo con el procedimiento existente.
3. Comprobar la selección exacta criaturas-magicas/contenido 2.
4. Probar portada/imágenes, mano/indicadora/mesa/Detalles, modos, perfiles, interacción y permisos.
5. Revisar la lectura de Resistencia en compacta dentro de la aplicación integrada. Cualquier cambio posterior de texto o presentación seguirá su aprobación y versionado.
6. Mantener pendientes las pruebas de equilibrio, comprensión o partidas todavía no realizadas.

No se ha copiado a APP, generado catálogo, cambiado código, publicado ni desplegado.
