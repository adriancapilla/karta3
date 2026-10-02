# Encargo técnico — incorporación de genérica contenido 2

Implementa exclusivamente el cambio autorizado documentado en:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\ACTIVACION_GENERICA_V2.md`

No abras el siguiente bloque funcional. Carga, validación, catálogo y selector B04/B05 ya existen; reutilízalos.

Trabaja en `E:\KARTA3\KARTA3_IA\APP\karta3`. Lee AGENTS.md, proceso SDD, contrato de barajas V1, organización/dependencias y las especificaciones/evidencias B04/B05. Comprueba rama, HEAD y cambios locales, conservando los documentos de preparación y cualquier trabajo existente. La base observada es `feat/b04-carga-barajas`, HEAD `b4c3f3a22a5ecc90de7a74d881c5f6405b8e9232`; no es una orden de restaurar esa versión.

La activación editorial ya está autorizada y realizada por el Gestor en ASSETS. No requiere otra confirmación. Implementación incorpora esa entrega y la comprueba:

1. Comprueba los SHA-256 de los dos JSON de `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\generica` contra las huellas aprobadas de la especificación §2. Copia ambos archivos a `barajas\generica` sin reserializar. Registra igualdad de SHA-256 entre origen/destino y las huellas aprobadas; si difieren, detén la incorporación y comunica la discrepancia.
2. Conserva todos los datos aprobados: `schemaVersion: 1`, `contentVersion: 2` en ambos JSON, `publication.available: true`, 58 cartas, valores/indicadores, textos, imágenes nulas y semilla `generica-v1`. No regeneres permutaciones ni edites ASSETS. APP debe construir y ejecutar sin el maestro externo.
3. Ejecuta `npm run decks:validate -- --package barajas/generica` y `npm run decks:prepare`. Genera el catálogo con las herramientas existentes; no lo mantengas a mano. La instalación normal ofrecerá el resumen seguro de genérica 2.
4. Adapta las pruebas que fijan huellas/contentVersion/disponibilidad de la copia real o esperan catálogo normal vacío. Conserva las aserciones de privacidad y los casos de barajas no disponibles, inválidas y catálogo vacío mediante paquetes/instalaciones de prueba separados. No hagas reemplazos globales de versiones ni desactives la genérica para obtener un vacío.
5. Ejecuta `npm run check`. Detén la instancia local anterior y arranca la compilación vigente con `npm run start`: el servidor carga una instantánea y necesita reinicio. Comprueba que `/api/decks` del proceso realmente servido ofrece genérica 2. Las salas en memoria se pierden al reiniciar; usa nuevas esperas, sin introducir persistencia.
6. Comprueba en la aplicación normal, sin fixtures ni respuestas simuladas, creación/entrada con dos sesiones independientes, selección explícita de genérica 2 por el anfitrión, ficha sincronizada del invitado y recuperación tras recarga de ambos. Aunque exista una sola baraja, la sala empieza sin selección. Conserva quitar selección, permisos, versión exacta, identidad, privacidad y recorridos B01–B05.
7. Ejecuta `npm run test:browser` contra la compilación/instancia vigentes y comprueba AGV2-01–10. Conserva las puertas de arquitectura y recorridos móvil/escritorio. Registra resultados reales; la evidencia histórica de B04/B05 no acredita este cambio.
8. Actualiza el README vigente según §7, incluidas las instrucciones manuales con dos sesiones de §6 y los textos desactualizados de catálogo vacío/selector inexistente. Registra el nuevo cierre en `ACTIVACION_GENERICA_V2.md`, sin alterar huellas, recuentos o resultados históricos de B04/B05. Distingue pruebas automatizadas de una revisión manual realmente realizada o pendiente.

No incluyas bots, inicio, mesa, juego, equilibrio, mejoras visuales ni cambios de contrato o reglas. C09–C10 continúan parciales en los términos de la especificación. Puedes decidir montajes/nombres de fixtures y organización de pruebas; consulta únicamente contradicciones reales, citando la fuente afectada.

Crea commits locales trazables de la incorporación, ajustes de pruebas/README y preparación/cierre documental, respetando los cambios ajenos. Conserva ignorados catálogo y artefactos generados según las reglas del repositorio. No hagas push, PR ni despliegue: la publicación corresponde después al hilo de GitHub y recuperación.

Entrega referencia(s) de commit local, huellas origen/destino, comandos y resultados nuevos por criterio, evidencia de la instancia normal servida y las instrucciones de prueba manual. Marca verificado solo con evidencia suficiente y prepara un resumen para coordinación con el estado de la incorporación y pendientes C09–C10.
