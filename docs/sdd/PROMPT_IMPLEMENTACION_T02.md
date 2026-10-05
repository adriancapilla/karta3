# Encargo de implementación — T02

En `E:\KARTA3\KARTA3_IA\APP\karta3`, implementa `docs/sdd/BLOQUE_T02_ALINEACION_DIFICULTADES_BOTS.md` siguiendo AGENTS.md.

1. Verifica rama/HEAD/cambios y conserva el trabajo existente. Base aprobada: `feat/b09-bots`, `4917d96bb36c1c805d9023d7c79dc4b98956e1d6`, con B09 y ajuste visual. No partir de main `8d305e0` sin bots.
2. Alinea Fácil/EASY y Difícil/HARD. HARD conserva exactamente la política hoy NORMAL y es el valor de «Añadir bot». Captura decisiones deterministas de la base antes del cambio y comprueba equivalencia después. No añadas niveles ni el algoritmo avanzado antiguo.
3. Ajusta tipos, contratos, validadores, valor inicial, nombres que designen dificultad, presentación, fixtures y pruebas. Solo EASY/HARD activos; rechaza NORMAL/valores desconocidos con el formato estricto vigente, sin alias ni coerción. Mantén todas las garantías y escenarios existentes. No sustituyas globalmente «normal».
4. Actualiza README/descripción vigente de arquitectura y registra la transición en SDD. Conserva los cierres históricos. No edites fuentes generales TFM; la decisión expresa del autor resuelve las denominaciones antiguas y T02 detalla su traslado a Arquitectura.
5. Usa pruebas focalizadas durante edición. Al cerrar, ejecuta `npm run check` y `npm run test:browser -- --workers=2` completo sobre la compilación final. Evita repeticiones innecesarias y no atribuyas a T02 los resultados anteriores.
6. Entrega archivos/revisión, evidencia real de equivalencia y contrato, resultados de las puertas, límites y conclusiones para coordinación/Arquitectura. Mantén C09–C10 parciales. Sin rediseño, refactorización general, cambios de baraja, publicación, PR o despliegue.
