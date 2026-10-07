# T03 — Entorno Node y dependencias de desarrollo

**Alcance registrado antes de editar dependencias — 07/10/2026.** Encargo técnico autorizado; estado inicial `main`/`dd20e0a9d648f5d96ee034254fabbf91ac1bcc5c`, árbol limpio. Rama propia `chore/t03-entorno-dependencias`. Fuentes leídas: AGENTS, proceso SDD, README, manifiesto/lockfile, CI y registro operativo.

## Objetivo y decisiones de preparación

- Establecer Node **24.19.0 LTS** como referencia reproducible local/CI, alineando requisito, referencia de versión, documentación y tipos de Node. Verificar instalación limpia, check, desarrollo, compilado y todos los recorridos existentes, sin modificar instalaciones globales.
- Obtener `npm audit --json` completo y `--omit=dev`, revisar cadenas y correcciones oficiales, actualizar únicamente lo afectado; preferir el paquete incorporador y justificar un override si fuera necesario. Conservar lockfile y diagnóstico anterior/posterior.
- Conservar producto, contratos, reglas, interfaz, pruebas y genérica formato 1/contenido 2 disponible. No incluye INC-01, refactorización, TFM, publicación, integración ni despliegue. CI remota nueva pendiente del hilo GitHub.

La evidencia histórica operativa registra fallo Windows `0xC0000005` con 24.13.0 en TypeScript y éxito con 24.19.0; Linux/24.13.0 pasó. Conseguir un entorno operativo no demuestra la causa original. No se repetirá una investigación forense ni se atribuirán los recuentos históricos 413/114/65 a T03 sin ejecutar sus puertas nuevas.

Node inicial del PATH: `C:\Program Files\nodejs\node.exe`, **24.13.0**, npm **11.6.2**. Runtime alternativo comprobado: `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, **24.19.0**, Windows x64. Se utilizará sin modificarlo, junto al CLI npm existente; selección de herramientas limitada a los procesos de comprobación.

Fuentes oficiales consultadas el 07/10/2026: [Node 24.19.0 LTS](https://nodejs.org/en/blog/release/v24.19.0), [shell-quote GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), [source-map-js GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). Las correcciones publicadas son shell-quote 1.11.0 y source-map-js 1.2.2; contrastar con el registro npm y el árbol actual antes de aplicar cambios.

## Comprobación prevista

1. Audit completo/producción, árbol de dependencias y huellas de ambos JSON en APP/ASSETS antes del cambio.
2. Instalación limpia del lockfile final y auditorías posteriores; confirmar el ejecutable efectivo de los procesos.
3. `npm run check`, arranques `npm run dev`/`npm run start`, catálogo y batería completa `npm run test:browser -- --workers=2`, sin reducir aserciones/reintentos ni plazos.
4. Registrar versión/ruta/fecha/comandos/resultados, revisión del diff y límites. Cierre aún pendiente: este plan no acredita pruebas superadas.
