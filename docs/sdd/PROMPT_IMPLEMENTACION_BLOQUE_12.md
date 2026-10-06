# Encargo de implementación — B12

Implementa **B12 — Mesa centrada 03** en `E:\KARTA3\KARTA3_IA\APP\karta3`.

Lee AGENTS, proceso SDD, organización/dependencias y cierre B11 desde las referencias de esta especificación:
`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_12_MESA_CENTRADA_03.md`

Consulta también Diseño y sus imágenes:
`E:\KARTA3\KARTA3_IA\APP\karta3\docs\diseno\AJUSTE_MESA_CENTRADA_03.md`

**Base observada:** `feat/b11-ajuste-mesa-pc-02`, HEAD `c300fcac470f5c3cdebdb87d1f60856eeffd7784`. Comprueba el estado vigente, conserva cambios/documentos locales y crea `feat/b12-mesa-centrada-03` desde una base con B11. No pierdas la especificación, proceso modificado ni entrega de Diseño sin registrar.

## Implementación acotada

- Contenedor centrado de **1400 px**, cuadrícula de **1368**, cinco columnas de **264** con gaps de **12**. Arriba jugadores/Mesa; abajo indicadora/tres columnas de mano/turno. Cartas **230×321 px**; separación entre cartas de **46 px**, distinta del gap de estructura. Conservar redistribución del observador sin mano ficticia.
- Mesa muestra cuatro cartas completas. Con cinco conserva ancho y permite consultar la quinta, autor y Detalles lateralmente, con ayuda y acceso de teclado/ratón/táctil. No ampliar por espacio sobrante ni desplazar la mano/página horizontalmente.
- Ordenar solo la proyección pública por J del atributo activo: descendente ALTO, ascendente BAJO. Sin dirección pública mantener secuencia recibida; en revisión usar `interaction.review.result.ranking`. No mutar orden oficial ni mano, revelar parcial privada o calcular ganadores oficiales.
- Eliminar la línea «Atributo indicador: …» sobre indicadora y la reserva vacía de encabezado de 68 px. Compactar ambos encabezados, centrar «Tu mano» y alinear cartas inferiores. Prevalece esta decisión sobre las imágenes que conservan la línea.
- Permitir scroll vertical natural; medirlo sin exigir altura universal. Conservar contenido, fuentes, acciones, privacidad, permisos, relojes, selección, recuperación y revisión. Reutilizar componentes; no cambiar servidor, contratos, reglas o barajas, ni rediseñar otros tamaños, espera o resultados.

Elige detalles locales compatibles con B12. Consulta solo ante una incompatibilidad concreta que obligue a sustituir una decisión aprobada.

## Comprobación y entrega

Captura la base antes de editar. Verifica **B12-01–08 y E1–E6**, con comparación antes/después y con las tres referencias en estados/tamaños equivalentes. Aporta medidas reales de centrado, columnas, cartas, cuarta/quinta accesibles, foco/Detalles/scroll durante reordenación y ahorro local de encabezados; separa ese ahorro de altura total y desplazamiento residual.

Comprueba viewport **1920×1080 y 1920×950**, zoom100 %, además de ancho mayor/menor y acceso existente a 1280×800/390×844. No atribuyas esos viewports a la pantalla física del autor. Incluye regresiones pertinentes de apertura en ambos órdenes, turno posterior, recuperación, varias pestañas, permisos y revisión cero/positiva.

Ejecuta **`npm run check`** y **`npm run test:browser -- --workers=2`**, seleccionando archivos afectados y regresiones pertinentes sobre compilación vigente. Ajusta solo expectativas visuales superadas; conserva garantías funcionales y evidencia histórica B10/B11. Guarda artefactos B12 separados y registra comandos, selección exacta, resultados y límites; no repitas baterías por rutina.

Actualiza README, cierre B12 y proceso. Entrega capturas/medidas, recorrido manual para el autor y conclusiones para coordinación, Diseño y Arquitectura. Distingue evidencia controlada, prueba física y aprobación visual humana pendiente; C09–C10 siguen parciales. No edites fuentes generales TFM/Diseño ni publiques: sin push, PR o despliegue; commits solo locales.
