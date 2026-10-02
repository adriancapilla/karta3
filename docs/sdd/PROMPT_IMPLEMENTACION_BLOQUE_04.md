# Encargo de implementación — bloque 04

Implementa el bloque 04 de KARTA3 siguiendo:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_04_CARGA_BARAJAS.md`

La norma de formato es:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\contratos\CONTRATO_BARAJAS_V1.md`

Lee AGENTS.md, proceso SDD, organización/dependencias, dominio §§2, 4, 5, 25, infraestructura §§9.1–9.4/17 y la propuesta de validación. Infraestructura ya se alineó con JSON directo e imágenes opcionales el 01/10/2026. Conserva los cambios documentales locales existentes; no descartar ni reescribir el contrato por conveniencia del código.

1. Incorpora en `APP\karta3\barajas\generica\` una copia verificable del paquete maestro `E:\KARTA3\KARTA3_IA\ASSETS\Barajas\generica\`, comparando lista y huellas del bloque. Conserva todos sus bytes: formato 1, contenido 1 y `publication.available: false`. Registra la copia. No modifiques ASSETS ni actives la genérica.
2. Implementa una validación pura común de dominio; lectura estricta de JSON, formato/coherencia/versiones/recursos en infraestructura; catálogo de resúmenes mediante puerto/caso de uso y adaptador; conexión en composición. Reutiliza las operaciones en comando, construcción y arranque.
3. Añade `decks:validate -- --package <carpeta>` y `decks:prepare`, integrando preparación en `npm run build`. Valida sin reparar tipos ni completar campos; detecta claves JSON duplicadas, incluidos escapes equivalentes, y localiza errores.
4. Aplica la política confirmada: disponible inválida o disponibilidad indeterminable bloquean; borrador inválido con `false` fiable informa y se excluye sin bloquear el conjunto. Su validación individual devuelve fallo. La genérica válida no disponible da catálogo vacío en ejecución normal.
5. Genera `barajas/catalogo.json` determinista; carga datos solo desde APP al arranque y comprueba vigencia del catálogo antes de escuchar. Las consultas posteriores usan la carga interna; ASSETS no es una dependencia de construcción ni ejecución.
6. Expón `GET /api/decks`, el contrato seguro y `api.decks()` exactamente como §6. Sirve únicamente recursos validados/disponibles mediante las URLs versionadas previstas. Protege JSON internos y evita el fallback HTML en rutas privadas/API/medios desconocidas.
7. Ejecuta B04-01–12: paquetes válidos/invalidos, disponibles/no disponibles, null y recursos reales, catálogo, arranque, API, privacidad y arquitectura. Usa fixtures explícitas para disponibilidad sin tocar genérica. No impongas reparto 20/19/19, igualdad display/play ni reglas por tema.
8. Conserva y vuelve a ejecutar las regresiones de bloques 01/T01/02/03, `npm run check`, navegador y control de arquitectura. Registra evidencias reales por criterio; revisa también las responsabilidades de la herramienta.

Selector/configuración, selección autorizada, presentación de iconos/cartas, partida, bots, equilibrio, CSV, contenido editorial, Sistema Solar y despliegue quedan para otros encargos. De C09–C10 solo acredita las partes indicadas en §9; no marques los criterios amplios como completos.

Puedes decidir detalles internos, parser/decodificador, representación, inyección y herramientas compatibles. Consulta solo contradicciones reales o cambios de comportamiento/arquitectura; no reabras decisiones del contrato ni ajustes el contenido para ocultar un error. El mantenimiento/publicación GitHub sigue sus reglas y su conversación responsable.

Al terminar, actualiza documentación y cierre del bloque con cambio revisado, pruebas y resultados, huellas/copia, evidencia de independencia de ASSETS, riesgos y límites reales. Entrega un resumen para coordinación y traslada la aclaración de borradores inválidos a infraestructura §9.3. No declares verificación o despliegue basándote solo en una lista de pruebas previstas.
