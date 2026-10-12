# B14 — Incorporación de Sistema Solar

**Fecha/acuerdo:** 12/10/2026, autor. **Estado inicial:** alcance autorizado; incorporación y comprobación pendientes. Este encargo permite excepcionalmente a SDD incorporar contenido y comprobarlo.

**Numeración:** B14 libre en main al preparar el cambio. **Base:** main integrado `88be67f3affe5c6f49ca90b207f59d5c2ef5aa45`; rama propia `feat/b14-sistema-solar`, checkout `E:\KARTA3\KARTA3_IA\APP\karta3-b14-sistema-solar`. El checkout original sigue en B13 `47087c7`, con cambios ajenos en operación y `tests/browser/tableLayout.spec.ts`; no se incluyen ni modifican. No usar ni detener servidores del autor.

**Referencias:** [AGENTS](../../AGENTS.md), [proceso](PROCESO_SDD.md), [contrato de barajas §§2–7](../contratos/CONTRATO_BARAJAS_V1.md), [B04](BLOQUE_04_CARGA_BARAJAS.md), [B05](BLOQUE_05_CONFIGURACION_SALA.md), [activación genérica 2](ACTIVACION_GENERICA_V2.md), [B13](BLOQUE_13_CANCELACION_PARTIDA.md), [T04](BLOQUE_T04_AVISO_RESULTADO_ANTERIOR.md); presentación actual `src/GameCard.tsx`. Las evidencias anteriores son históricas, no pruebas nuevas B14.

## 1. Alcance y decisiones

Incorporar el paquete existente `ASSETS/Barajas/sistema-solar`, sin recrear cartas ni recursos. Validar primero su formato 1/contenido 1/no disponible con la herramienta común. Si es válido, cambiar únicamente `publication.available` a true y `contentVersion` a 2 en ambos JSON maestros; conservar `schemaVersion: 1`, todos los demás campos y los 59 recursos gráficos (portada y 58 cartas). No recalcular playValue, corregir ciencia ni inventar decimales.

Copiar los dos JSON y recursos aprobados a `barajas/sistema-solar` del checkout APP. ASSETS sigue siendo maestro; igualdad de lista y SHA-256 de los 61 archivos, con recursos idénticos antes/después y genérica 2 intacta. El destino lógico tras integrar la rama es `E:\KARTA3\KARTA3_IA\APP\karta3\barajas\sistema-solar`; no incorporar datos por separado en el checkout original antiguo.

Generar catálogo por `decks:prepare`/build, nunca editarlo a mano. Ambas barajas estarán disponibles; una sala nueva sigue sin selección. Ejecutar desde APP sin acceso editorial a ASSETS. Se admiten ajustes pequeños de presentación para datos largos, sin ocultarlos o alterar valores; una necesidad mayor se documenta para Implementación antes de ampliar alcance.

**Fuera:** algoritmos/reglas, rediseño móvil, nueva creación editorial, revisión científica, modificación de fuentes TFM/plan VPS, push/PR/GHCR/despliegue y mensajes a otros hilos. El VPS conserva su versión actual.

## 2. Responsabilidades y contratos conservados

| Responsabilidad | Capa y comprobación |
| --- | --- |
| Invariantes/comparación | Validador puro y Game existentes: comparar J/playValue, no texto Dato/displayValue. Caso Encke/Borrelly: igual diámetro mostrado, distintos J. Sin reglas por temática. |
| Lectura, recursos, catálogo y copia | Infraestructura/herramientas B04 existentes: formato, versiones, rutas/decodificación y huellas. Catálogo generado e interno; no importar ASSETS en build/runtime. |
| Selección/autorización y partida | Aplicación B05–B13 existente: versión exacta disponible, configuración sincronizada, vista por destinatario, recuperación y retención/limpieza T04. |
| Portada, carta y Detalles | Cliente/contratos seguros: textos y unidades literales, imágenes reales, Dato separado de J; cualquier ajuste solo de legibilidad. Sin imports de server ni cálculo oficial en navegador. |
| Composición | Montaje actual, sin puertos o servicios nuevos. Check de dependencias y revisión semántica de cualquier ajuste. |

## 3. Criterios previstos

- [ ] **B14-01:** validación común satisfactoria antes y después de activar; 58 cartas, esquema 1/contenido 2/true coherentes. Errores localizados y no ocultados.
- [ ] **B14-02:** exclusivamente tres cambios editoriales autorizados; 61 archivos maestros/copia iguales por SHA-256; 59 imágenes y genérica sin alteración.
- [ ] **B14-03:** catálogo normal generado con genérica 2 y Sistema Solar 2; sala sin selección; seleccionar/cambiar/quitar y recargar mantiene estado aceptado en dos sesiones. Invitado no configura.
- [ ] **B14-04:** portada y cartas cargadas, nombres/atributos/unidades/Detalles legibles; datos largos completos y sin truncación silenciosa, en PC y acceso móvil existente.
- [ ] **B14-05:** Encke/Borrelly muestran el mismo diámetro heredado y distintos J; ALTO/BAJO compara por J, sin transformar datos científicos.
- [ ] **B14-06:** partida con Sistema Solar, resultado y cancelación B13; recarga y nueva partida con otra baraja sin contaminación de ficha, cartas o avisos (T04).
- [ ] **B14-07:** JSON completos inaccesibles por HTTP; catálogo seguro, manos rivales/mazo oculto ausentes en HTTP/ack/eventos; APP autónoma del maestro.
- [ ] **B14-08:** `npm run check` y navegador pertinente sobre compilación vigente, con expectativas normales actualizadas sin debilitar vacío/no disponible/privacidad; registros reales separados de aprobación humana/científica.

## 4. Plan de comprobación

Reutilizar validación, catálogo, selección y ejecuciones existentes; añadir pruebas de esta segunda baraja con datos reales, no sustituirla por una temática artificial. Mantener fixtures de catálogo vacío/borradores y regresiones B13/T04. Dos sesiones/perfiles y recarga, imágenes con naturalWidth positivo, privacidad de sobres y valores largos medidos.

Ejecutar Node 24.19 del runtime disponible, sin cambiar instalación global. Instancias propias en puertos libres y cerradas al terminar; no reutilizar servidor del autor. Pruebas normales distinguidas de recorridos con tiempo/entropía controlados. No repetir batería de navegador completa por rutina; registrar selección exacta/fallos y reparaciones. Check incluye pruebas unitarias, tipos, lint, build y arquitectura.

## 5. Registro de ejecución y cierre

Pendiente al registrar este alcance. Añadir versión/commits, huellas, archivos propios, resultados por criterio, comandos/entorno, ajustes necesarios y límites. C09–C10 reciben evidencia técnica de una segunda baraja con recursos, sin convertirla en revisión científica, equilibrio o aprobación visual humana.
