# Adenda B20 — Ancho del selector y acciones de Detalles

**20/10/2026. Estado:** especificación correctiva preparada; implementación y comprobaciones nuevas pendientes. No abre otro bloque. El autor ha probado el selector, lo valora favorablemente y solicita únicamente estas dos correcciones; esa valoración no sustituye las verificaciones pendientes de B20.

**Base observada:** carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, rama `main`, HEAD `40f3f48553a3353433942124b625354c35ed2972`. Ya estaban modificados proceso, B19, `ANALITICA_USO.md` y `PREPARACION_ANALITICA_REAL_B19.md`; conservarlos. No crear ramas/checkouts, revertir o mezclar trabajo ajeno.

**Referencias:** [AGENTS](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), [B20 §§2–4 y cierre §15](BLOQUE_20_APARIENCIA_PERSONAL_Y_USO.md), [evidencias previas](evidencias/B20/README.md). El nuevo registro se añade sin reescribir esos resultados.

Capturas del autor, consultadas como referencia del problema, no como medidas o pruebas nuevas de producto:

- `C:\Users\Adrian\AppData\Local\Temp\codex-clipboard-43362df9-e376-46c7-8b04-6a72cac304e4.png`: selector más estrecho bajo Cancelar.
- `C:\Users\Adrian\AppData\Local\Temp\codex-clipboard-4b3b26d5-f02b-44c7-9230-f8bec87d6a02.png`: acciones contiguas en Detalles, Oscuro.
- `C:\Users\Adrian\AppData\Local\Temp\codex-clipboard-d98704be-1a87-4ad1-b219-4bf4efa2e0e6.png`: mismo caso en Claro.

## 1. Selector bajo Cancelar

Solo cuando **existe Cancelar partida y el selector está dispuesto debajo**, igualar el ancho de la caja visible del `select` al de ese botón, con sus bordes izquierdo/derecho alineados. Medir los controles, no el contenedor `.appearance-control`, la etiqueta oculta ni el contorno de foco. No ensanchar Cancelar para hacerlo coincidir con el selector.

Reutilizar las condiciones actuales de esa disposición: `.game-compact` y el perfil estrecho vigente, sin modificar umbrales o activar compacta de otra manera. Incluir anfitrión jugador y observador. Sin Cancelar, el selector conserva el tamaño actual. En escritorio horizontal, conservar anchos y distribución actuales. Espera, Inicio y Resultados no reciben este ajuste.

Conservar `Predefinida`, opciones/etiquetas, nombre accesible, tipografía, permisos, selección, persistencia y comportamiento. No recortar, ocultar o neutralizar el indicador exterior de foco para conseguir la igualdad; no alterar composición de mesa ni añadir controles.

## 2. Acciones de Detalles

En el diálogo de carta `CardDetails`, disponer un área de acciones de todo el ancho interior disponible: **Información de la baraja a la izquierda y Cerrar detalles al margen interior derecho**, con espacio libre entre ambos y una separación mínima positiva del espaciado existente. Puede reutilizarse el `gap` de acciones de 12 px del producto; la técnica concreta corresponde a Implementación.

Si no caben en una fila, permitir filas sucesivas: Información primero y a la izquierda, Cerrar después y a la derecha; conservar separación también vertical, contenido y acceso a ambos. Ninguna caja, texto o foco debe desbordar o superponerse. No reducir tipografía, recortar etiquetas o aumentar el ancho del diálogo para evitar la adaptación. Si falta Información porque no existe contenido autorizado, Cerrar permanece a la derecha, sin inventar otra acción.

Conservar orden lógico de teclado y foco inicial actual en Cerrar. Información abre la misma consulta autorizada; cerrarla devuelve foco a su botón dentro de Detalles. Cerrar detalles y Escape cierran como ahora, con recuperación del foco en el invocador o destino de recuperación vigente si desapareció. Consultar/cerrar no selecciona o juega una carta ni pausa/reinicia tiempos.

Mantener contenido, imágenes, dimensiones de cartas, ancho/límites de altura y scroll actuales del diálogo, márgenes respecto al contenido y la consulta anidada. Su altura natural puede adaptarse al salto de fila de las acciones. El cambio es de distribución de estas acciones, no del resto de usos de `DeckInformation`, otros diálogos o botones `secondary`.

## 3. Responsabilidad y límites

Cambio exclusivamente de presentación cliente: `src/appearance.css` para la condición de selector; `src/GameCard.tsx` y CSS local a sus acciones si hace falta un contenedor. Consultar `src/style.css`, `AppearanceControl.tsx`, `GameScreen.tsx` y `DeckInformation.tsx` para preservar cascada, estructura y foco; no presupone modificarlos todos. Evitar reglas globales y conservar la separación de etiquetas B20. Al agrupar acciones, revisar la regla existente `.card-details-dialog>button` para no perder su espaciado ni afectar `Consultation`.

No cambian responsabilidades de aplicación/dominio, puertos, transporte o composición. No tocar START/END, consentimiento, preferencia/persistencia, contratos, SQLite, métricas, reglas, plazos o paquetes. No hay decisiones funcionales abiertas. Implementación elige CSS/agrupación local compatibles; ante incompatibilidad real, presenta medición y alternativa mínima antes de ampliar el alcance.

## 4. Criterios y comprobaciones focales previstas

| Criterio | Comprobación futura |
|---|---|
| C1 — Anfitrión vertical | En Claro/Oscuro, selector bajo Cancelar: anchos y bordes alineados, diferencia máxima de 1 CSS px por redondeo; medir `getBoundingClientRect()` de ambos controles. Cubrir anfitrión jugador y observador entre los casos. |
| C2 — Conservación | Sin Cancelar, mismo ancho del selector que en la base; escritorio horizontal, mismos anchos y posiciones relativas. Sin etiqueta visible nueva, cambio de permisos o composición. |
| C3 — Detalles ancho | Información al borde interior izquierdo del área y Cerrar al derecho, tolerancia 1 CSS px; distancia entre cajas positiva, libre y registrada. Claro y Oscuro, sin alterar imágenes/contenido/cartas. |
| C4 — Detalles estrecho | Adaptación sin desbordamiento, solapamiento o contacto entre acciones; medir cajas y separación horizontal o vertical según filas. Ambas alcanzables con teclado y pulsación normal. |
| C5 — Interacción y foco | Selector operativo; foco íntegro visible. D abre Detalles, Información abre/cierra consulta, Cerrar detalles/Enter/Space/Escape y retorno de foco conservados. Sin clic forzado ni eliminación de aserciones para pasar. |
| C6 — Regresión acotada | Selección parcial, envío y plazo no alterados por consultar o cerrar; mesa/carruseles estables. Ningún cambio de código estadístico/contratos/paquetes. |

Matriz proporcionada: perfil estrecho a **358 o 390 CSS px**, compacta a un ancho intermedio que active la disposición vertical existente y escritorio horizontal a **1800 CSS px**; Detalles estrecho y ancho con Claro y Oscuro. Repartir roles/casos, sin producto cartesiano ni nuevas reglas de resolución. Registrar viewport, ancho útil y disposición real; son tamaños de prueba, no umbrales nuevos.

Capturas **antes/después** de base y compilación final, mismos tamaño, tema, carta, estado y foco cuando se compare. Registrar anchos/bordes de selector y Cancelar, límites interiores del diálogo, cajas de acciones, separación y adaptación. Separar comparación visual, medidas e interacción; no afirmar que las capturas del autor acreditan la corrección.

Reutilizar casos afectados de `tests/browser/appearance.spec.ts` y el recorrido `B17 D: clic/Enter/Space/arrastre no juegan; parcial/plazo, Información, resize y foco equivalentes` de `cardFace.spec.ts`; añadir o ajustar aserciones locales para C1–C5. Revisar el foco de B20 en Claro/Oscuro. **Implementación ejecutará `npm run check` y esos recorridos afectados sobre compilación vigente**, identificando selección y resultados. No repetir por rutina toda la batería de navegador, analítica o validación de barajas.

## 5. Cierre y encargo

Conservar evidencia/cierres B20, incluidas sus limitaciones. Registrar esta corrección en una sección/evidencia nueva con commit/build, pruebas reales, capturas/medidas y límites; no atribuirle las pruebas históricas ni declarar verificación Linux/humana/física por redactarla. El nuevo trabajo SDD ha sido solo lectura y documentación, sin pruebas de producto.

[Prompt acotado para Implementación](PROMPT_IMPLEMENTACION_ADENDA_B20.md). Sin publicación, despliegue, activación analítica, fuentes TFM o mensajes a otros hilos. No requiere un cambio de arquitectura; conserva los pendientes generales de alineación B20. Tras entregar esta preparación, SDD se detiene.
