# Encargo para Implementación — B17

Implementa B17 en `E:\KARTA3\KARTA3_IA\APP\karta3`, siguiendo `docs/sdd/BLOQUE_17_CARTA_IMAGEN_Y_SIMBOLOS.md`. El autor ha confirmado el alcance: procede con implementación y comprobaciones, sin otra maqueta o revisión previa de Diseño.

Base observada: main `e0de970c75abbc43ecba09ed00a1daac44a663fe`, con B16 local. Verifica el estado, conserva los documentos B17 y cualquier trabajo posterior. Lee AGENTS y la organización de dependencias. Continúa en la carpeta/rama actual; no crees otra rama o checkout para experimentar.

**Cambios:**

- Carta normal: cuarta referencia «Símbolos ajustados» de `E:\KARTA3\KARTA3_IA\TFM\Maquetas\comparativa-imagen-carta.html#refined`. Referencia 230×321, imagen íntegra hasta bordes, D azulado 44×44 superpuesto a 5 px de derecha/abajo, sin botón inferior ni cabecera visible de tabla. Tres filas centradas, dos separadores interiores, sombreado activo sin rombo y círculo vectorial de fila de 12 px. Nombre/icono propio y tipografías conservados.
- **La visualización compacta de «Optimizar para móvil» queda tal cual**, con su miniatura y botón Detalles actuales; conserva activación/umbral/composición B15.
- **Detalles desde cualquier representación:** imagen grande al ancho interior disponible del diálogo y altura proporcional, como en la demo. Conserva el resto del diálogo, datos/unidad sin J, notas, Información, cierre y foco. No rediseñes su tabla ni heredes la miniatura compacta.

Conserva modos, datos/recursos, Jugar exterior, selección parcial, tiempos, privacidad y permisos. D no selecciona ni juega; Enter/Space/Escape, arrastre y retorno de foco deben funcionar sin efectos accidentales. No copies la carga JSON o fixtures de la demo al producto.

Implementa y comprueba B17-01–10: referencia visual equivalente, tres barajas, ambos modos, nombres largos/unidades/null/fallo de imagen y convivencia con compacta. Registra capturas/medidas reales. Solo consulta al autor si surge una incompatibilidad medida que obligue a cambiar geometría, texto o diseño; no recortes ni reduzcas fuente para pasar.

Ejecuta `npm run check` y navegador pertinente sobre compilación vigente, sin repetir baterías ajenas por rutina. Usa instancia propia, preservando servidores del autor. Actualiza README, documentación APP y cierre B17 con resultados/fallos/límites reales; separa pruebas de producto de maqueta y revisión humana. Conserva cierres históricos y paquetes. No edites TFM, Diseño o ASSETS; sin push, PR, despliegue o mensajes a otros hilos. Devuelve el resultado al autor para probarlo.
