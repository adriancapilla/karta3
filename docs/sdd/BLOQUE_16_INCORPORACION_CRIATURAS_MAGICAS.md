# B16 — Incorporación de Criaturas Mágicas con el consumidor V2 existente

**Estado:** especificación preparada; incorporación y comprobaciones integradas pendientes. **Fecha/acuerdo del autor:** 16/10/2026. **Tipo:** contenido y adaptación acotada de pruebas/verificadores.

**Base comprobada:** carpeta única `E:\KARTA3\KARTA3_IA\APP\karta3`, `main`, HEAD `f75c2f8be2e5f130296d0fab160df3dbeb8fa873`, árbol inicialmente limpio. B16 estaba libre. Verificar de nuevo antes de implementar y conservar cualquier cambio posterior; no crear ramas/checkouts ni reemplazar la línea de trabajo. Esta preparación solo añade especificación/prompt y enlace del proceso.

## 1. Objetivo y referencias

Incorporar exactamente la entrega final aprobada y activada de Criaturas Mágicas, usando lector, validador, catálogo, selector, vistas y presentación **ya existentes**. No desarrollar otro consumidor ni una validación por temática.

| Referencia | Alcance normativo/evidencia |
|---|---|
| [AGENTS](../../AGENTS.md), [organización](../arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md), [proceso](PROCESO_SDD.md) | Responsabilidades, dependencias y cierre proporcionado. |
| [Contrato V2](../contratos/CONTRATO_BARAJAS_V2.md), [B15 §§4–10 y cierre §12](BLOQUE_15_FORMATO_2_Y_PRESENTACION.md) | Formato/recursos, modos, configuración, instrucciones, privacidad y normal/compacta implementados. El cierre B15 es evidencia histórica, no pruebas B16. |
| [Aplicación §4 y §§7.5–7.7](../../../../TFM/Planificación/CAPA_APLICACION_KARTA3.md), [Infraestructura §§9.1–9.5](../../../../TFM/Planificación/INFRAESTRUCTURA_KARTA3.md) | Selección exacta, conservación de opciones, copia aprobada, catálogo generado, instantánea al arrancar y acceso seguro. |
| [Aprobación](../../../../ASSETS/Entregas/2026-10-16-criaturas-magicas-formato-2/APROBACION_CONTENIDO.md), [manifiesto final](../../../../ASSETS/Entregas/2026-10-16-criaturas-magicas-formato-2/MANIFIESTO_SHA256.json), [preparación](../../../../ASSETS/Entregas/2026-10-16-criaturas-magicas-formato-2/REGISTRO_PREPARACION.md), [delta 1→2](../../../../ASSETS/Entregas/2026-10-16-criaturas-magicas-formato-2/DELTA_ACTIVACION_1_A_2.json) | Fuente final, autorización/activación ya realizadas y límites de su validación/galería local. |

**Incluye:** copia, certificados/huellas, validación/catálogo/arranque, adaptación de expectativas de instalación normal, selección y recuperación, uso completo y presentación/pruebas nuevas. **Fuera:** edición editorial/activación, cambios de contrato/consumidor/reglas/bots, refactorización general, embellecimiento, métricas e incidencias móviles anteriores. ASSETS, PRODUCTO, Diseño, fuentes TFM y cierres históricos no se modifican; publicación GitHub/GHCR/VPS será otro encargo.

## 2. Paquete y trazabilidad cerrados

**Origen único para incorporar:**
`E:\KARTA3\KARTA3_IA\ASSETS\Entregas\2026-10-16-criaturas-magicas-formato-2\paquetes\criaturas-magicas`

**Destino:** `E:\KARTA3\KARTA3_IA\APP\karta3\barajas\criaturas-magicas`.

- Id `criaturas-magicas`, `schemaVersion: 2`, `contentVersion: 2` en ambos JSON, `publication.available: true`.
- **61 archivos:** dos JSON, portada y 58 ilustraciones WebP. No copiar la raíz completa de entrega, galerías, fuentes editoriales o candidata a `barajas/`.
- Candidata contenido 1 conservada y activación 1→2 trazable, ya realizadas por Gestor. **No hay dependencia de activación pendiente ni motivo para convertir a contenido 4.** Cada baraja tiene su versión propia.
- Atributos `Poder`, `Astucia`, **`Resistencia`**, sin abreviar. Las 174 parejas dato/unidad contienen números textuales iguales a sus rangos y unidades vacías: ambos modos pueden mostrar los mismos números. Eso no autoriza eliminar un modo o añadir una unidad ficticia para diferenciarlos.
- Las habilidades y capacidades de características/notas/instrucciones son narrativas; no generan acciones, modificadores o reglas especiales. El reparto editorial de indicadores no se convierte en una nueva regla del validador.

Identidad documental consultada (SHA-256): manifiesto final `b9a7510aca03864606f18df4597b5ca3398e03f1f1b1cb95cc86804f6f226f75`; aprobación `5c925c5c84ca0ab7509ed208f921438de8c6b01cde027e7f99a260aef68439e2`; delta `7b4db9b503c589df3856642af3efe2d6c88fab84ac5456ab5a8b2945ed7e7d0e`.

JSON finales según ese manifiesto: `baraja.json` → `f1cd46de8433ff439ccfdf4a367f0c03b61e597278e43f949c7889d5c3e0bde5`; `cartas.json` → `9783f44cbba4092d1d23eacccbd8ff267714f10c94393569d3c900deabba5f10`. Estas referencias no sustituyen verificar la lista completa al incorporar.

## 3. Incorporación y catálogo

1. Antes de copiar, registrar inventario/huellas de las **63 entradas de archivo** actuales de genérica/Solar y su identidad V2/contenido 4. Contrastar aprobación, manifiesto/delta y paquete final nuevo; si aparece discrepancia, localizarla sin corregir datos o activar otra versión. La comprobación previa de Coordinación no sustituye la de incorporación.
2. Preparar la validación común con el runtime fijado, sin editar lector ni repetir su matriz de pruebas. La ejecución real obligatoria será sobre la copia final APP en el paso 5; no hace falta duplicarla en origen si sus 61 bytes/huellas coinciden. El exit 0 anterior del Gestor es antecedente local, no el resultado de Implementación.
3. Copiar los 61 archivos íntegros al destino, conservando rutas y bytes. No reserializar JSON, transformar imágenes, normalizar de nuevo, abreviar, redondear o recalcular rangos. Verificar conjuntos de rutas/tamaños/SHA-256 origen=APP; detectar ausencias y archivos extra. Los paths del manifiesto comienzan por `paquetes/criaturas-magicas/`: mapear ese prefijo a la raíz del destino, sin alterar el certificado original.
4. Conservar copias exactas de aprobación, manifiesto, registro de preparación y delta en `docs/sdd/evidencias/B16/`, con su procedencia. Añadir inventario propio origen/APP/Git y resultados; no copiar otra vez todas las imágenes a evidencias. Preservar candidata y documentos originales en ASSETS.
5. Validar el destino con `npm run decks:validate -- --package barajas/criaturas-magicas`; generar mediante `npm run decks:prepare`. Nunca editar catálogo a mano. Verificar las anteriores intactas y arranque con instantánea nueva mediante instancia propia; el servidor ya abierto no recarga barajas en caliente y no es evidencia de la compilación nueva. Conservar servidores del autor.
6. Cuando se registren los archivos en Git, comprobar también los **61 blobs** contra el manifiesto. Revisar atributos/filtros/finales de línea sin modificar el contenido aprobado; leer blobs como bytes, sin conversión de salida por shell. No basta verificar el working tree. Antes de registrar, ese tramo de evidencia permanece pendiente; no declararlo implícitamente superado.

Catálogo normal esperado, ordenado por order e id ASCII. Los tres `order` aprobados son 0, por lo que el orden efectivo es:

| Id | schemaVersion | contentVersion | Disponible |
|---|---:|---:|---|
| `criaturas-magicas` | 2 | **2** | true |
| `generica` | 2 | **4** | true |
| `sistema-solar` | 2 | **4** | true |

Esta tabla es expectativa de prueba, **no una lista manual para el catálogo del producto**. Criaturas aparece primero, pero crear sala mantiene `deckId/deckContentVersion/selectedDeck/deckInformation` sin selección. No seleccionar automáticamente la primera opción, ni con catálogo cargado tras recarga.

Build y runtime solo leen APP. Demostrar ausencia de acceso a **ASSETS y PRODUCTO**, reutilizando el montaje aislado/guard existente; ampliar su comprobación a PRODUCTO si solo vigila ASSETS, dentro del soporte de pruebas. No mover, renombrar o modificar los árboles fuente para demostrarlo.

## 4. Recorrido, contratos y presentación conservados

No nuevos endpoints, eventos, DTO, controles o permisos. Reutilizar GET /api/decks/api.decks(), room:configure y vistas por destinatario de B15:

- HOST selecciona explícitamente `{ id: 'criaturas-magicas', contentVersion: 2 }`; no envía un paquete. Servidor resuelve versión validada/disponible y conserva ficha/instrucciones exactas. Invitado recibe aceptados sin poder configurarlos. Versión 4 para ese id se rechaza, sin reinterpretarla como 2.
- Dos sesiones ven ficha/portada y versión correctas, actualización sin recarga y recuperación F5/reconexión sin duplicar participación. Cambiar entre las tres y quitar selección conserva `attributeValueMode`, `optimizeForMobile` y demás controles vigentes; nueva sala conserva defaults B15. Sin cambios de actividad, dedupe, incertidumbre, concurrencia o prioridades de vencimiento.
- Preparación muestra portada/nombre/description; Información usa instrucciones exactas. Al iniciar, fijar selección/roster/settings y recuperar la misma partida tras F5. Usar nueva baraja en indicadora, mano propia, Mesa, revisión y Detalles; resultados conservan su ficha/versión/clasificación y navegación actuales, sin introducir cartas en esa pantalla.
- Modos 1-58/Dato operan ambos. Verificar settings y representación elegida aunque los números de esta colección coincidan; Dato no añade espacio con unidad vacía. Detalles siempre informativo, con características/notas completas e Información, **sin J ni dato alternativo**. Narrativa se muestra literalmente, nunca se interpreta como efecto.
- Normal adaptada con optimización off; on + útil <1368 CSS px compacta; desde 1368 misma normal on/off. Medir contenedor útil real, no viewport nominal. Mantener B15: puntuaciones/identidades arriba apartables, resumen completo, Mesa lateral y mano lateral independiente/Jugar; consultas y avisos/Cancelar con permisos existentes, observador sin mano. Sin nuevos tamaños, fuentes, columnas, recortes o rediseño.

**Resistencia:** conservar el texto completo y comprobar la fila tanto activa como no activa, en indicadora/mano/Mesa/consulta, ambos modos y perfiles. En galería compacta el símbolo ocupa una línea y el nombre otra: es un antecedente aislado admisible, **no fallo por sí mismo ni obligación universal de dos líneas**. Medir/revisar en producto dimensiones de fila/carta/celda, líneas y desbordamiento, nombre/símbolo/marca/valor completos, acceso a Detalles/Jugar y solapamientos. No imponer una línea, bajar fuente, abreviar o ocultar para aprobar. Ante incompatibilidad concreta de lectura/interacción, registrar captura/medida/contexto y resolver con autor antes de cambiar contenido/diseño; no cerrar el criterio afectado.

Recursos: `/media/decks/criaturas-magicas/v2/imagenes/portada.webp` y las rutas declaradas de `carta-001.webp` a `carta-058.webp`, servidas por el control existente. Comprobar MIME/decodificación/carga y SHA-256 de respuesta frente al manifiesto. No exponer rutas locales. Ambos JSON permanecen inaccesibles por rutas públicas de paquete o variantes que evadan el control; conservar las comprobaciones de los seis JSON de la instalación. Información autorizada no amplía el catálogo ni revela paquetes/manos ajenas/orden oculto.

## 5. Responsabilidades, cambios permitidos y verificadores

| Responsabilidad | Capa/pieza | Límites y comprobación |
|---|---|---|
| Copia aprobada y certificados | `barajas/criaturas-magicas`, evidencia documental | ASSETS solo lectura; 61 rutas/bytes/huellas y blobs Git iguales; anteriores 63 archivos intactos. |
| Validar/cargar/generar catálogo/servir recursos | Infraestructura y composición **existentes** | Reutilizar V2, mismas dependencias hacia aplicación/dominio. No nueva regla, parser temático, lector o adaptador. Validación real y arranque aislado. |
| Selección/configuración/información/partida y proyección | Aplicación/puertos/vistas existentes | Sin cambios funcionales previstos. Resolver id/versión exactos y permisos, pruebas con dos sesiones; conservar B15/B13/T04. |
| Cartas/consultas/normal-compacta | Cliente/shared existentes | Sin importar paquetes/servidor; mostrar contenido aprobado y manos autorizadas. Sin cambios visuales previstos; capturas y medidas comprueban la nueva entrada. |
| Expectativas de instalación y verificación | Fixtures/tests y `tools/ci-image-runtime.mjs` | Adaptar solo supuestos de catálogo/huellas/versión de la instalación normal; conservar fixtures de dos/vacío/borrador cuando sean deliberadas. |

Revisar al menos los supuestos observados en `tests/browser/bots.spec.ts`, `tests/browser/solar.spec.ts`, `server/infrastructure/decks/startup.test.ts` y verificadores de instalación normal. No cambiar automáticamente todo «2» por «3»: número de jugadores, fixtures intencionales y versiones tienen otros significados. La matriz completa V2 permanece sin reejecución focal por rutina; `npm run check` conserva sus pruebas existentes.

**Verificador Linux obligatorio:** `tools/ci-image-runtime.mjs` aún exige dos. Actualizar para comprobar las tres identidades, esquema 2, contenidos **2/4/4** según id y orden efectivo, sin perder la URL versionada de portada Solar ni sus huellas. Mantener los SHA-256 esperados de los cuatro JSON anteriores y añadir los dos nuevos y los 59 recursos nuevos mediante valores esperados trazables al manifiesto, sin obtener el «esperado» de los mismos bytes que se pretende comprobar. El mapa de prueba no es el catálogo del producto ni una dependencia de ASSETS/PRODUCTO del runtime.

Conservar íntegros controles actuales de Node fijado, plataforma Linux/arquitectura x64, usuario no root, sharp nativo, filesystem read-only, exclusiones de árboles privados, HTTP 200/no-store/sin cookie y hashes. Incluir PRODUCTO entre árboles excluidos del artefacto. No eliminar asserts para pasar localmente en Windows ni sustituir huellas por existencia/cantidad. Ajustar el mecanismo de provisión del verificador/expectativas solo si es necesario para la comprobación existente; no empaquetar fuentes editoriales o certificados privados en runtime por comodidad.

Revisión de imports/ciclos y semántica incluida en check/cierre; dominio/Game/políticas intactos. Autonomía: pruebas, nombres de archivos de evidencia, elección de casos equivalentes y adaptación acotada de montajes/expectativas. Un defecto que exija cambiar consumidor, contrato, representación o regla se localiza y devuelve al autor; no abre una refactorización general dentro de B16.

## 6. Criterios y ejemplos comprobables — previstos

Todos pendientes de ejecución por Implementación:

| Criterio | Comprobación/resultado exigido |
|---|---|
| **B16-01 — Identidad** | Origen final 61/61 = copia APP = blobs Git cuando se registren; certificados/manifiesto/delta conservados y trazables. Versiones 2/2 y available=true sin otra activación. Anteriores genérica/Solar 63 archivos, versiones y huellas sin cambios. |
| **B16-02 — Herramientas/catálogo** | Validador V2 real salida 0 sobre nueva copia; prepare/arranque normales con las tres identidades/versiones del §3 y catálogo generado coherente. No default, catálogo manual, modificación editorial o dependencia de ASSETS/PRODUCTO. |
| **B16-03 — Selección y sesiones** | HOST/invitado en perfiles independientes: sin selección inicial; elegir criaturas 2, alternar genérica 4/Solar 4/criaturas 2, quitar y recuperar F5. Misma identidad y aceptados, opciones B15 conservadas. Invitado/HOST ajeno no configuran; versión incorrecta rechazada sin alterar selección. |
| **B16-04 — Recursos y texto** | Portada y las 58 ilustraciones cargan por rutas controladas, bytes/MIME correctos; nombres, atributos, alt, notas/características e instrucciones íntegros. Datos/unit no transformados y habilidades solo narrativas. |
| **B16-05 — Presentación** | Ambos modos, normal/compacta y optimización on/off conforme a ancho útil; Detalles sin J, Información exacta; Resistencia completa activa/no activa con capturas/medidas de fila/carta y acceso a controles. No exigir una línea ni abreviar/reducir. |
| **B16-06 — Interacción B15** | Mesa/mano laterales independientes, quinta pública completa en escena legal dirigida, Jugar/ALTO–BAJO/selección parcial y envío único; arrastre/consulta no juegan. Enter/Space/Escape, foco y resize preservan contexto/plazo; observador sin mano/control ajeno y Cancelar solo HOST. |
| **B16-07 — Privacidad** | HTTP/ack/eventos seguros por destinatario: preparación sin cartas, partida solo mano propia/públicas, observador sin rivales; JSON completos privados para los tres paquetes y URLs fuera de carpeta rechazadas. Información no expone paquetes/credenciales/mazo. |
| **B16-08 — Partida completa** | Nueva baraja con humano y bots existentes, adaptadores normales de reloj/planificación/barajado, desde selección hasta resultado, F5 y otra sala; puntos por cartas y fase final intactos. Sin fixture que suplante la instalación normal ni habilidades nuevas. |
| **B16-09 — Regresión/verificador** | Casos pertinentes de anteriores dos barajas/B15, permisos/recuperación/gestos/privacidad y cancelación/T04 conservados. Expectativas normales/verificador actualizadas a tres sin debilitar Linux; fixtures intencionales permanecen. |
| **B16-10 — Cierre** | Check y navegador pertinentes sobre compilación vigente, evidencia local nueva con fallos/reparaciones/límites, README/registro B16 y manual de dos sesiones. CI/Linux y revisión humana/física acreditados solo si realmente ejecutados. |

Ejemplos: E1, catálogo ordenado con criaturas primero y sala aún sin seleccionar; E2, HOST selecciona criaturas **2**, invitado recibe ficha 2 y F5 conserva modos; E3, solicitud de criaturas **4** rechazada, sin ascenso de versión; E4, símbolo/nombre de Resistencia en líneas distintas con lectura y acciones completas sigue siendo admisible; E5, volver desde resultado/cancelación a sala nueva no arrastra selección/instrucciones o avisos anteriores.

## 7. Plan proporcionado de implementación y evidencia

1. **Incorporación:** proteger inventario anterior, verificar fuente/certificados y copiar/validar 61; generar catálogo. Adaptar expectativas normales y verificador, sin editar paquetes anteriores ni consumidor. No cortar/editar JSON para obtener fixtures: las pruebas que requieran paquetes distintos usan sus carpetas separadas.
2. **Integración focal:** dos sesiones reales con recuperación/configuración; ambas representaciones, recursos/instrucciones y privacidad. PC 1920×1080, móvil 390×844 y muestra 360×800; medir viewport/área útil/fuentes/filas/desbordamiento/scroll. Probar on/off, normal desde 1368 útiles y compacta por debajo, reutilizando los ensayos B15 de frontera/estabilidad sin reconstruir su matriz completa. Fotografías en estados y tamaños equivalentes, con indicadora/mano/Mesa/Detalles y Resistencia activa/no activa, más observador.
3. **Juego:** una partida completa de la instalación normal con humano contra EASY/HARD y acciones manuales a tiempo; configurar valores permitidos para un recorrido razonable, sin reducir plazos fuera de sus opciones. Registrar adaptadores/selección/revisión/final/resultado y conservación de cartas/puntos. Con dos sesiones conservar además entrada/recuperación real y permisos. Quinta/revisión/observador pueden prepararse con reloj/entropía controlados en otro montaje legal identificado, sin llamarlo partida normal.
4. **Puertas:** usar Node/runtime fijado y ejecutar `npm run check`, luego `npm run test:browser -- --workers=2 <archivos pertinentes>` sobre build actual. Añadir recorridos significativos de Criaturas y seleccionar regresiones afectadas de B15, catálogo/recursos, partida normal, selección/permisos y B13/T04; justificar selección. No repetir la batería completa de navegador ni el corpus/matriz V2 por rutina si no cambian lector/contrato. Registrar cada ejecución/compilación y reparar aserciones dependientes de dos sin quitar garantías.
5. **Independencia/verificador:** montaje de build/runtime aislado con acceso externo prohibido a ASSETS y PRODUCTO; no basta una búsqueda textual de rutas. Revisar/sintaxis del verificador actualizado y sus expectativas. No ejecutar sus asserts Linux bajo Windows simulando plataforma/uid, ni atribuirles resultado Linux por check local. Una ejecución real Linux/CI, si se realiza posteriormente en su entorno, tendrá su evidencia separada; no es requisito de publicación desde este bloque.
6. **Cierre local:** actualizar README con catálogo de tres, versiones propias y recorrido manual de Criaturas; B16 con inventario/huellas/certificados, archivos/commits propios, comandos/resultados/fallos, capturas/medidas/entorno y límites por criterio. Git registra únicamente la entrega propia, conservando cambios ajenos; comprobar blobs y no versionar catálogo generado ni artefactos innecesarios.

**Prueba manual para autor:** abrir dos perfiles, crear/entrar sin selección; HOST elige Criaturas 2, consulta portada/instrucciones y F5 en ambos. Alternar barajas y modos, activar/desactivar optimización; iniciar humano contra bots u HOST observador con un humano invitado. Consultar Resistencia/indicadora/Detalles, desplazar Mesa/mano y probar acciones/teclado; llegar a resultados, recuperar y crear otra sala. Registrar equipos/zoom/tacto solo si realmente se probaron.

Separar categorías: (a) aprobación/activación editorial recibidas; (b) validación local Gestor y contraste documental previo de Coordinación; (c) galería aislada, no mesa completa; (d) comprobaciones integradas nuevas Windows/navegador/tiempo normal o controlado; (e) CI/imagen Linux; (f) revisión humana/dispositivos físicos. Ninguna acredita automáticamente otra. No trasladar incidencias, métricas o aceptación humana anterior como resultados de B16.

C09–C10: el bloque podrá acreditar selección/uso/recursos/privacidad y presentación en perfiles efectivamente comprobados de esta entrega. Equilibrio, comprensión educativa, aprobación humana/física universal y publicación/despliegue siguen fuera; no declararlos resueltos por la validación o galería.

## 8. Decisiones y cierre de especificación

No hay pregunta funcional pendiente ni dependencia de activación. Solo faltan incorporación y pruebas integradas de la entrega cerrada. Ante discrepancia de bytes o incompatibilidad concreta, detener la parte afectada y presentar al autor el diagnóstico; no reabrir reglas/algoritmos ni inventar contenido.

Devolver al autor para Coordinación/alineación documental: nueva copia V2/contenido 2, catálogo/huellas y versiones anteriores conservadas, verificaciones realmente hechas y pendientes, tratamiento observado de Resistencia y estado del verificador Linux. Implementación mantiene README/evidencia APP; no edita fuentes TFM/Diseño/ASSETS/PRODUCTO/cierres ni envía mensajes a otros hilos. Sin push, PR, GHCR o VPS.

**Evidencia de esta preparación:** lecturas de estado Git, fuentes, contratos, cierre previo, entrega y verificadores; lectura de metadatos/manifiesto y SHA-256 documentales. No se ha copiado el paquete, ejecutado validador/build/navegador o modificado código. Los checks anteriores siguen siendo antecedentes; B16-01–10 están pendientes. [Prompt de Implementación](PROMPT_IMPLEMENTACION_BLOQUE_16.md).
