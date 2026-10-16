# Encargo para Implementación — B16, Criaturas Mágicas

Implementa `docs/sdd/BLOQUE_16_INCORPORACION_CRIATURAS_MAGICAS.md` en la carpeta única **`E:\KARTA3\KARTA3_IA\APP\karta3`**. Base observada: main **`f75c2f8be2e5f130296d0fab160df3dbeb8fa873`**, limpio antes de esta preparación. Verifica el estado real, conserva documentación B16 y cualquier trabajo posterior; no crees ramas/checkouts, reviertas B14/B15 o mezcles cambios ajenos.

Lee AGENTS, proceso, organización, contrato V2, cierre B15 y B16 completo. El consumidor, selector, modos e interfaz ya existen: **este es un cambio de contenido y pruebas/verificadores**, sin nuevo consumidor, reglas, bots o rediseño.

## Fuente cerrada e incorporación

Origen exacto: `E:\KARTA3\KARTA3_IA\ASSETS\Entregas\2026-10-16-criaturas-magicas-formato-2\paquetes\criaturas-magicas`.
Destino: `E:\KARTA3\KARTA3_IA\APP\karta3\barajas\criaturas-magicas`.

Lee aprobación, manifiesto final, registro y delta de la raíz de entrega. Paquete **id criaturas-magicas, formato 2/contenido 2, available=true**, 61 archivos (dos JSON y 59 recursos). Ya aprobado y activado por Gestor; candidata 1 conservada. **No activar otra vez ni convertir a contenido 4** por las otras barajas.

1. Protege inventario/huellas de los 63 archivos actuales de genérica/Solar y verifica fuente/certificados. Copia los 61 archivos byte a byte, contrasta rutas/tamaños/SHA-256 origen=APP y después blobs Git al registrar. La validación real con runtime fijado se exige sobre la copia APP en el paso 3; no la dupliques por rutina en un origen idéntico. No reserialices JSON, cambies finales de línea, recursos, nombres, rangos, unidades, indicadores o narrativa.
2. Conserva certificados originales y evidencia propia en `docs/sdd/evidencias/B16/`; el manifiesto lleva prefijo `paquetes/criaturas-magicas/`, mapeado a la raíz de la copia. Genérica/Solar permanecen V2/contenido 4 con sus bytes intactos. No copies galerías/candidata/fuentes a barajas.
3. Ejecuta `npm run decks:validate -- --package barajas/criaturas-magicas` y `npm run decks:prepare`; reinicia solo una instancia de prueba propia para cargar la instantánea nueva, preservando servidores del autor. Catálogo generado de tres, todas esquema 2: criaturas 2, genérica 4, Solar 4. Todos los order actuales son 0: orden ASCII criaturas→genérica→Solar. Sin selección inicial aunque Criaturas aparezca primero. Build/runtime sin ASSETS ni PRODUCTO.

## Integración y verificadores

- Conserva selección exacta/recuperación/configuración B15 al cambiar/quitar baraja. Dos sesiones, permisos HOST/invitado, F5 e instrucciones exactas; versión criaturas 4 debe rechazarse. Preparación, indicadora, mano, Mesa, revisión, Detalles informativo sin J, Información y resultados.
- Ambos modos, normal/compacta y optimización on/off según útil real y frontera B15. En esta colección datos y rangos coinciden: prueba el modo aceptado sin inventar diferencias. Recursos por `/media/decks/criaturas-magicas/v2/...`, portada/58 ilustraciones y SHA de respuestas; seis JSON de las tres barajas privados y vistas sin cartas ocultas/manos rivales.
- **Resistencia completa:** capturas/medidas integradas activa/no activa en normal/compacta; el símbolo y nombre pueden ocupar líneas diferentes. No exigir una línea universal, abreviar o bajar fuente para pasar. Comprueba lectura, filas, acciones/Detalles, carruseles independientes/quinta, foco/teclado y resize. Ante incompatibilidad real, presenta diagnóstico al autor antes de cambiar contenido/diseño. Galería aislada no es aceptación del producto.
- Actualiza expectativas que asumen dos en instalación normal —incluidos los puntos observados de bots/solar/startup—, sin cambiar fixtures deliberadas de dos, vacío o borrador ni debilitar garantías.
- **Actualiza `tools/ci-image-runtime.mjs`:** tres identidades/esquema/versiones correctas, seis JSON y 59 recursos nuevos con SHA esperados trazables, preservando hashes anteriores y URL Solar v4. Conserva Node/plataforma Linux/x64, no root, sharp, read-only, árboles privados excluidos, HTTP/no-store/sin cookie; incluye PRODUCTO excluido. No calcula el esperado desde lo mismo que verifica ni omite asserts para ejecutarlo en Windows. Verificador adaptado/sintaxis local no equivalen a CI/Linux ejecutados.

## Comprobación y cierre

Ejecuta `npm run check` y `npm run test:browser -- --workers=2 <archivos pertinentes>` sobre compilación vigente. B16-01–10 y regresiones afectadas B15/B13/T04; no repitas por rutina toda la matriz/corpus V2 sin cambios o la batería completa de navegador. Añade una partida completa de Criaturas con humano/bots existentes y adaptadores normales, hasta resultado/F5/otra sala. Escenas dirigidas de quinta/revisión/observador pueden usar tiempo/entropía controlados, identificados separadamente.

Documenta pruebas/errores/reparaciones reales, entorno, 61 huellas origen/APP/Git, preservación de las anteriores, certificados, capturas/medidas comparables y observación de Resistencia. Actualiza README/evidencia B16 e instrucciones manuales de dos sesiones. Separar aprobación editorial/activación, validación Gestor, galería, producto local, CI/Linux y revisión humana/física; mantener límites de C09–C10. No atribuyas a B16 métricas/incidencias anteriores.

Devuelve al autor conclusiones para Coordinación/alineación documental. No modifiques ASSETS, PRODUCTO, Diseño, fuentes TFM o cierres históricos; no refactorización general, embellecimiento o reglas nuevas. No push, PR, GHCR, despliegue ni mensajes a otros hilos. Publicación y actualización VPS serán encargos posteriores.
