# Encargo de implementación — B11

Implementa **B11 — Ajuste de mesa PC 02** en `E:\KARTA3\KARTA3_IA\APP\karta3`.

## Fuentes y base

Lee:

- `E:\KARTA3\KARTA3_IA\APP\karta3\AGENTS.md`.
- `E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\PROCESO_SDD.md`.
- `E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_11_AJUSTE_MESA_PC_02.md`.
- `E:\KARTA3\KARTA3_IA\APP\karta3\docs\diseno\AJUSTE_MESA_PC_02.md` y sus referencias gráficas.
- `E:\KARTA3\KARTA3_IA\APP\karta3\docs\arquitectura\ORGANIZACION_Y_DEPENDENCIAS.md`.

Base observada: rama `feat/b10-redistribucion-mesa`, HEAD `09f4e5bff86a499cbcb66df29beafc27275c55b8`, con B10 implementado. Verifica el estado vigente y conserva el trabajo existente. Hay documentación SDD modificada y archivos de Diseño/B11 sin registrar. Crea `feat/b11-ajuste-mesa-pc-02` desde una base que conserve B10 y estos documentos; no cambies a un main anterior ni descartes archivos.

## Decisiones cerradas

La especificación B11 es el encargo vigente. La decisión posterior del autor sustituye las dimensiones iniciales de Diseño:

- Área de contenido de referencia: **1800×1600 píxeles CSS**, zoom **100 %**. Es una referencia de diseño, no una medición del equipo del autor ni una garantía para pantallas 1920×1080.
- Carta común: **230×321 píxeles CSS exteriores**, con Detalles dentro; autores y «Jugar carta» quedan fuera. No estirar manos de una/dos cartas.
- Mantener dos filas: jugadores/Mesa arriba; indicadora/mano/turno debajo. Deben verse simultáneamente mesa, indicadora, tres cartas completas, acciones y datos del turno, sin desplazamiento para jugar en la referencia.

Aplica los cambios de presentación especificados: BF/BD y sombreado del abridor, identificación del activo, autores debajo y «Mesa» al pie, tabla Atributo/Dato/J, Detalles, acción exterior, ALTO encima de BAJO y leyenda. Distingue el icono propio (`card.roundAttribute`) de la fila activa (`round.activeAttributeId`). Respeta las fuentes y tamaños aprobados en B11.

## Implementación y límites

Captura la base antes de editar. Mide el presupuesto de ancho/alto y el contenido interior de las cartas; el cálculo de SDD no acredita renderizado. Elige espaciados y montaje mínimo del cliente dentro de lo aprobado. Si aparece una incompatibilidad, presenta déficit medido y alternativa mínima al autor antes de cambiar dimensiones, reducir otros textos/imágenes u ocultar contenido.

Reutiliza componentes, acciones y relojes. Conserva pulsación sobre carta, botón exterior, teclado y Detalles sin doble activación. Mantén selección parcial, envío, privacidad, permisos, plazos, recuperación, revisión, bots y automático. No modifiques servidor, contratos, reglas ni barajas.

No rediseñes móvil, espera o resultados; no añadas resaltado de mejor carta, animaciones ni opciones. En otros tamaños conserva acceso y adaptación existentes; documenta desplazamiento residual para la siguiente iteración.

## Comprobación y entrega

Verifica **B11-01–08** con escenarios existentes y pruebas proporcionales. Aporta capturas antes/después con igual viewport, zoom y estado; mide cajas, cartas, filas, acciones, leyenda y desbordamientos. Incluye dos/cinco jugadores, manos de una/dos/tres cartas, observador, apertura en ambos órdenes, Detalles/foco/gestos y regresiones pertinentes de temporización, recuperación y revisión. Comprueba acceso funcional a 390×844 y 1280×800 sin exigirles el nuevo encuadre.

Ajusta únicamente las expectativas B10 expresamente superadas. Conserva su referencia y evidencia históricas; no regeneres el baseline antiguo ni debilites garantías funcionales.

Ejecuta **`npm run check`** y **`npm run test:browser -- --workers=2`**, seleccionando los archivos afectados y regresiones pertinentes; registra la selección exacta y resultados sobre la compilación vigente. Evita repetir baterías por rutina. Separa evidencia automatizada con reloj controlado, prueba física y revisión visual humana pendiente.

Actualiza README, cierre B11 y proceso con cambios, medidas, capturas, comandos/resultados reales y límites. Entrega instrucciones de revisión al autor y conclusiones para coordinación, Diseño y Arquitectura. C09–C10 siguen parciales. No declares verificado lo que no hayas comprobado ni atribuyas pruebas históricas a B11. Sin edición de fuentes generales TFM, push, PR ni despliegue; commits solo locales.
