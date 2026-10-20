# Prompt para Implementación — Adenda mínima B20

Implementa únicamente [la adenda de selector y acciones de Detalles](ADENDA_B20_SELECTOR_Y_ACCIONES_DETALLES.md). Este texto queda preparado para revisión y traslado del autor; SDD no implementa.

**Carpeta:** `E:\KARTA3\KARTA3_IA\APP\karta3`. Base observada `main/40f3f48553a3353433942124b625354c35ed2972`; verifica estado vigente y conserva todo trabajo posterior y documentación B19/proceso ya modificada. Lee AGENTS, B20/cierre/evidencia y adenda. No crear ramas/checkouts, reinstalar, revertir ni mezclar trabajo ajeno; no sobrescribir diagnósticos o evidencias.

## Solo dos correcciones

1. **Selector debajo de Cancelar:** cuando exista Cancelar y la disposición actual coloque Apariencia debajo, igualar caja visible/ancho y bordes del `select` a los del botón, sin cambiar el ancho de Cancelar. Aplicarlo solo en esa condición, con los perfiles existentes. Sin Cancelar o en escritorio horizontal, mantener tamaño/disposición actuales. Preservar foco exterior completo, etiquetas, tipografía, permisos, selección y composición.
2. **Acciones de Detalles:** Información de la baraja a la izquierda y Cerrar detalles al margen interior derecho, con espacio libre y separación mínima del espaciado existente. Si no caben, adaptar a filas sucesivas sin desbordamiento/superposición, con Información primero y Cerrar a la derecha. No reducir letra, recortar textos o ensanchar el diálogo. Preservar contenidos/imágenes/cartas, orden de teclado, foco inicial, Escape y retorno de foco entre consulta→Información y Detalles→invocador. No alterar otros usos del componente de información.

Empieza por `src/appearance.css` y la estructura local de acciones de `CardDetails` en `src/GameCard.tsx`; tocar otros archivos de presentación solo si es necesario y acotado. Revisa cascada/espaciado de `.card-details-dialog>button` al agrupar acciones. No hacer sustituciones globales ni refactorización.

## Verificación y entrega

- C1–C6 de la adenda: anfitrión jugador/observador con selector vertical; participante sin Cancelar; escritorio horizontal. Detalles estrecho/ancho en Claro y Oscuro.
- Capturas comparables antes/después y medidas reales: caja de selector y Cancelar (diferencia máxima 1 CSS px), bordes, ancho interior del diálogo, separación entre acciones y ajuste a filas. No medir el contorno de foco como parte de la caja ni recortarlo para pasar.
- Probar acciones reales, Tab/Shift+Tab, Enter/Space/Escape, D, consulta y recuperación de foco; conservar parcial/plazo y ausencia de jugadas accidentales. No clic forzado, supresión de aserciones o contenido para superar pruebas.
- Reutilizar/extender únicamente casos afectados de `tests/browser/appearance.spec.ts` y `cardFace.spec.ts`, según la adenda. Ejecutar **`npm run check` y recorridos de navegador afectados sobre la compilación vigente**. No repetir por rutina batería completa, analítica o corpus de barajas.
- Registrar fuente/build, resultados/fallos/capturas/medidas y límites en evidencia nueva de esta adenda, enlazada desde B20/proceso. Conservar íntegros cierres y evidencias anteriores; no declarar nueva prueba por reutilizar sus resultados. Devolver archivos modificados y estado Git.

No cambiar START/END, consentimiento, persistencia, contratos, SQLite, reglas, paquetes, fuentes, geometría de cartas/mesa o diseño adicional. Ante una incompatibilidad real, medir y presentar alternativa mínima al autor. No publicar, desplegar, activar analítica, editar TFM ni enviar instrucciones a otros hilos. Después, detenerse.
