# Encargo para el Gestor de Barajas

Prepara el contenido de KARTA3 siguiendo el contrato común de formato 1:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\contratos\CONTRATO_BARAJAS_V1.md`

Consulta sus referencias de dominio e infraestructura y sus aclaraciones del autor. El contrato concreta la entrada directa JSON vigente; la conversión CSV descrita anteriormente en infraestructura está aplazada.

## Prioridad de contenido — primera baraja genérica

La primera entrega solicitada es una **baraja genérica completa de 58 cartas**, destinada al aprendizaje de KARTA3 y al primer recorrido digital jugable. Usa la documentación genérica de 58 cartas indicada por el autor y prepara sus archivos en `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\generica\`, con id `generica`. Debe cumplir el mismo contrato y las mismas reglas del juego que cualquier otra baraja.

Conserva la baraja del Sistema Solar ya preparada para su revisión e incorporación posterior. Su existencia no sustituye la entrega genérica. No se modifica el contrato común ni se crea una variante de mecánica para esta prioridad. Las adaptaciones editoriales necesarias se resuelven en el hilo Gestor con las fuentes y el autor.

Esta prioridad concreta la preferencia del autor del 01/10/2026. La redacción anterior admitía comenzar por una genérica, pero no exigía que fuera la primera entrega.

## Instrucciones comunes

1. Usa como base las plantillas y ejemplos de `E:\KARTA3\KARTA3_IA\APP\karta3\docs\contratos\barajas-v1\`. Las plantillas están incompletas; el ejemplo de cartas solo tiene dos cartas. No son barajas listas para el juego.
2. Prepara la fuente maestra en `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\<id-baraja>\`, con `baraja.json`, `cartas.json` e `imagenes\` solo cuando haya recursos. Carpeta e id de baraja deben coincidir. Trabaja sobre las fuentes de 58 cartas indicadas por el autor; no sustituyas ese material por un CSV histórico de 50 cartas.
3. Incluye todos los campos y tipos del contrato. Rellena nombre y descripción de baraja, nombre e id de cada carta, nombres de los tres atributos y todos los valores mostrados y jugables. No elimines campos sin contenido: usa solo los vacíos expresamente permitidos.
4. Conserva los ids fijos `atributo1`, `atributo2` y `atributo3`, asociados a los nombres visibles en `baraja.json.attributes`. Cada carta usa esos ids en `values` y uno de ellos en `roundAttribute`.
5. Entrega exactamente 58 cartas. Para cada atributo, asigna una vez cada entero de 1 a 58 en `playValue`; `displayValue` es siempre texto no vacío. No confundas ambos datos ni calcules valores ausentes sin acuerdo editorial. No inventes una distribución obligatoria de indicadores.
6. La baraja genérica puede prepararse sin imágenes: en portada y cartas usa `imageRef: null` e `imageAlt: ""`. Si hay una imagen, proporciona su archivo, ruta relativa contenida en `imagenes/` con `/` y texto alternativo no vacío. La aplicación compondrá las cartas y mostrará un icono común si no hay imagen; no hacen falta imágenes completas para impresión.
7. Mantén `schemaVersion: 1`; inicia `contentVersion: 1` en ambos archivos y aumenta ambos si modificas una versión ya preparada. Conserva los ids estables. Mantén `publication.available: false` hasta indicación del autor. Registra los créditos y fuentes conocidos sin inventar atribuciones o licencias.
8. Revisa C01–C08 del contrato sobre los datos y recursos. El control de publicación, selección y presentación de C09–C10 pertenece a la futura aplicación; no lo declares superado por revisar archivos.

No mantengas un catálogo manual, no implementes conversión CSV ni aplicación editorial y no edites una segunda versión del contenido en APP. Tras aprobación, el hilo responsable incorporará una copia reproducible de ASSETS a APP y la aplicación generará el catálogo.

Si faltan datos obligatorios o las fuentes no permiten construir una baraja válida, informa al autor de las cartas, atributos o propiedades afectadas; no ocultes la carencia con un valor inventado ni presentes el borrador como jugable. Un borrador puede permanecer con `available: false`, pero no satisface el contrato hasta completar sus datos.

Entrega un resumen con rutas, id/versión, número de cartas, correspondencia de atributos, presencia o ausencia de imágenes, fuentes y créditos, controles efectivamente realizados y carencias pendientes. La comprobación editorial o manual no sustituye la validación automática de la aplicación, todavía pendiente de implementación.
