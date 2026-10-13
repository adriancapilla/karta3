# Preparación para Implementación — continuación B14 pendiente

**Estado 13/10/2026:** preparación conservada, no encargo ejecutable en esta regularización. La revisión de genérica se replanificará junto al nuevo modo de presentación y requiere un encargo posterior; este documento no autoriza implementar el selector, cambiar GameCard/CSS ni ejecutar pruebas ahora. Las instrucciones siguientes son el antecedente de esa futura revisión, no su especificación definitiva.

Objetivo pendiente: revisar la entrega **B14 — Incorporación de Sistema Solar**, comprobando específicamente que el ajuste compartido de cartas conserva la visualización y la interacción de **genérica**.

## Base y trabajo existente

Continúa únicamente en `E:\KARTA3\KARTA3_IA\APP\karta3`, rama existente `feat/b14-sistema-solar`, desde **`378b4099c3a58d2e0991949b3835e159b0f538c2` más el commit documental de regularización**. Comprueba el estado vigente antes del futuro encargo. No partir de main como base de entrega: todavía carece de B14. Main `88be67f` ya incluye B13 y se conserva como referencia anterior consultable mediante Git desde esta misma carpeta; no se requiere ni autoriza otro checkout o rama para continuar.

La rama B13 original `feat/b13-cancelacion-partida`/`47087c7` queda histórica. Sus pendientes de operación y `tests/browser/tableLayout.spec.ts` se reservan mediante stash identificado, cuyo nombre/SHA real se entrega en el cierre de regularización; no aplicarlo a B14 ni eliminarlo. El checkout secundario `karta3-b14-sistema-solar` se conserva como referencia histórica con HEAD separado, sin desarrollo paralelo. No usar ni detener servidores del autor.

Consulta AGENTS, proceso SDD, organización/dependencias y:

- `docs/sdd/BLOQUE_14_INCORPORACION_SISTEMA_SOLAR.md`, especialmente §5 y la revisión complementaria §6.
- Contrato de barajas, B04/B05, activación de genérica 2 y garantías B13/T04.
- Presentación vigente `src/GameCard.tsx`/`src/style.css` y utilidades de geometría/captura de `tests/browser/centeredTable03.spec.ts` y `pcTable02.spec.ts`.

**Ya realizado:** activación/copia de Sistema Solar formato 1/contenido 2, catálogo con ambas barajas, huellas, ajuste pequeño de Dato/J y pruebas registradas. El código quedó implementado, no revertido, en `20dfb46`. No repetir la incorporación ni presentar sus pruebas históricas como evidencia nueva.

## Antecedente de revisión acotada — a replanificar

1. Examina el diff de GameCard/CSS respecto a `88be67f`: spans para displayValue, detección de enteros textuales de nueve o más dígitos, columnas adaptables, nowrap y espaciado de tablas. Es presentación; no transforma datos ni decide comparaciones.
2. Compara **genérica 2 antes/después**, con idénticos jugadores, cartas, atributos activos, configuración, fase y estado de selección. Captura y mide en **PC 1920×1080** y **móvil 390×844**, zoom 100 %, registrando el viewport real. Usa tiempo/entropía controlados cuando haga falta reproducir el estado; identifica esa sustitución.
3. Comprueba indicadora, tres cartas de mano, cartas públicas y Detalles: textos, símbolos, fuentes, tamaños, filas Dato/J, icono ante null, alineación, botones y foco. La regla para números largos no debe activarse en genérica. Incluye apertura/selección parcial, otro jugador activo y revisión; conserva adquisición de mano, orden público y acceso lateral a la quinta carta cuando corresponda. Prueba J de una y dos cifras.
4. Verifica gestos de selección/envío y que abrir/cerrar Detalles no juega una carta ni pierde el foco. Conserva plazos, permisos, privacidad y recuperación; no modificar esos mecanismos para facilitar una captura.
5. Si detectas una regresión involuntaria, corrige únicamente lo necesario en presentación y comprueba ambas barajas. Si no hay regresión, no cambies código por rutina. Diferencias de hora, avisos transitorios o estado de partida no acreditan una diferencia de diseño: reproduce estados equivalentes antes de concluir.

**No modificar** JSON maestros/copia, imágenes, nombres, displayValue, playValue, unidades, versiones ni disponibilidad de ninguna baraja. No redondear, introducir separadores o recalcular J. Si una mejora requiere transformar contenido, localizar la necesidad y devolverla al autor para el Gestor de Barajas; no resolverla en este encargo. No reducir fuentes, ocultar información, rediseñar móvil ni imponer una altura fija nueva. Cualquier cambio mayor de interfaz requiere otro acuerdo.

## Antecedente de comprobación y entrega — no ejecutar ahora

Ejecuta una puerta final **`npm run check`** y **navegador pertinente sobre la compilación vigente**: comparación/regresión genérica y `solar.spec.ts`, más los casos de mesa realmente afectados. Selecciona archivos/casos, registra el comando exacto y evita repetir toda la batería base por rutina. Usa instancias propias en puertos libres y detén únicamente las que hayas creado.

Conserva las huellas del manifiesto B14 y de genérica. Aporta capturas equivalentes antes/después, medidas de cartas/tablas/botones y conclusiones explícitas sobre genérica; no basta que los JSON sigan intactos. Repite el caso de números largos y Encke/Borrelly de Sistema Solar para asegurar que una reparación no pierde Dato completo, J legible o comparación por playValue.

Añade evidencia nueva a **B14 §6**, README y proceso cuando corresponda, sin sobrescribir §5 ni los cierres anteriores. Distingue revisión técnica automatizada, inspección de capturas y aprobación visual humana pendiente. Entrega archivos/commits propios, resultados reales, diferencias encontradas y pendientes al autor. Si no hubo cambio de producto, dilo.

Sin nuevas reglas, refactorización general, edición de TFM/plan VPS, mensajes a otros hilos, push, PR, GHCR o despliegue. Los commits serán locales; publicación/integración se decidirán posteriormente.
