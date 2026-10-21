# Encargo — Adenda mínima B21: retirar consulta manual

**Para traslado del autor a Implementación.** Al recibir su autorización, aplica únicamente [la adenda](ADENDA_B21_RETIRADA_CONSULTA_PREFERENCIAS.md). Preparar este documento no ha ejecutado el cambio.

Proyecto: `E:\KARTA3\KARTA3_IA\APP\karta3`. Base leída: `main/ee4f752a81c0175f27950bac9ca9348207c23b31`. Comprueba estado actual; conserva cambios previos y posteriores, sin restaurar versiones ni crear ramas/checkouts. Lee AGENTS y la adenda.

1. Retira de `src/StatisticsControl.tsx` el botón «Consultar preferencias estadísticas» y únicamente el miembro `refreshStatistics` de su import, al quedar sin uso allí. No lo sustituyas por otro control, enlace o mensaje.
2. Conserva `refreshStatistics` en `src/statistics.ts` y todos sus consumidores internos: consulta inicial, coordinación automática entre pestañas, reconexión, consultas internas y recarga. Mantén exclusión, consentimiento de apariencia, textos restantes, métricas, almacenamiento, contratos y juego. No ajustes otros mensajes, estilos o componentes.
3. Actualiza solo pruebas y referencias vigentes realmente dependientes del botón; preserva históricos. Reutiliza el caso «B21 HOME mínimo…» de `tests/browser/statistics.spec.ts` para comprobar ausencia, consulta inicial, controles restantes, Permitir→Retirar, sincronización y recarga. Conserva las aserciones anteriores.
4. Ejecuta `npm run check` una vez sobre la fuente final y el recorrido focal de navegador sobre esa compilación: `npx --no-install playwright test tests/browser/statistics.spec.ts --grep "B21 HOME mínimo" --workers=1`. No repitas toda la batería de navegador o los ensayos estadísticos sin un fallo que lo justifique.
5. Registra en la adenda cambios propios, fuente, comprobaciones reales, resultados y límites; entrega estado Git. No atribuyas a esta retirada las evidencias históricas de B21. Modifica README u otras referencias solo si describen el botón como vigente.

Sin mejoras adicionales, refactorización, código de servidor, nuevas métricas, paquetes, publicación, activación, borrado, servidores o mensajes a otros hilos. Al entregar al autor, detente.
