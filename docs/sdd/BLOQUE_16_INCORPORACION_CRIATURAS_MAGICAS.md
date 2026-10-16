# B16 — Incorporación de Criaturas Mágicas con el consumidor V2 existente

**Estado actual, 16/10/2026:** incorporado y verificado técnicamente en local; resultados nuevos B16-01–10 en §9. CI/imagen Linux y revisión humana/dispositivos físicos pendientes. **Fecha/acuerdo del autor:** 16/10/2026. **Tipo:** contenido y adaptación acotada de pruebas/verificadores. Se conservan las expectativas y la evidencia de preparación como antecedentes.

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

Estado al preparar: todos pendientes de ejecución por Implementación. Los resultados técnicos actuales y límites constan en §9:

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

## 9. Incorporación y cierre técnico — 16/10/2026

### 9.1 Base efectiva y revisión del cambio

Carpeta única y rama `main` conservadas. Base efectiva **f75c2f8be2e5f130296d0fab160df3dbeb8fa873**; cambios iniciales: este documento, prompt B16 y enlace de PROCESO. Preparación registrada aparte en **4d0b9fb** sin mezclarla con el paquete. Contenido/pruebas/verificador revisados en **84eba0ba2aa6c5d5fe3ee2fb0b0b7fd4b256f3d0**; README y este cierre/capturas se registran después. No ramas/checkouts, cambios ajenos, restauraciones, publicación ni despliegue. [Archivos propios](evidencias/B16/archivos-modificados.txt).

No cambios de producción en `src`, `shared`, dominio, aplicación, lector/consumidor, composición o adaptadores HTTP/Socket.IO. Se reutilizó el conjunto B15. Cambian solo la copia, atributos Git de certificados, expectativas/soportes/pruebas de instalación y el verificador de imagen. La revisión semántica confirma reglas/políticas y proyecciones vigentes, instrucciones literales y ninguna lógica de habilidades/temática. Los imports/ciclos siguen comprobándose junto a esa revisión; no se crearon puertos o servicios.

### 9.2 Fuente, copia y certificados

Entrega exacta recibida en la ruta de §2. Se comprobaron los tres SHA documentales aprobados de manifiesto/aprobación/delta, el registro y el manifiesto de candidata contenido 1 (`aec3a053c32a792aeb77b5b7f83c853c05b7b20e17399274665a61c03860bce0`). Comparación textual candidata→final: únicamente contentVersion 1→2 en ambos JSON y available false→true en metadatos; los otros bytes y los 59 recursos coinciden. No se activó ni convirtió nada desde Implementación.

**61/61** rutas/tamaños/SHA-256 origen=APP=blobs Git, sin extras. **63/63** archivos previos de genérica/Solar permanecen iguales a su inventario anterior y a Git, V2/contenido 4 disponibles. Los cuatro certificados se conservan byte a byte también en Git mediante atributos específicos `-text`; ASSETS, candidata, PRODUCTO, Diseño y fuentes TFM solo en lectura/no modificados.

| Archivo nuevo | SHA-256 origen = APP = Git |
|---|---|
| `criaturas-magicas/baraja.json` | `f1cd46de8433ff439ccfdf4a367f0c03b61e597278e43f949c7889d5c3e0bde5` |
| `criaturas-magicas/cartas.json` | `9783f44cbba4092d1d23eacccbd8ff267714f10c94393569d3c900deabba5f10` |
| Portada | `a0fba2f4b38a4cffb6bd3d73cd777ea5c4fce316937747541ccb4aecf7e37805` |

El [inventario de incorporación](evidencias/B16/incorporacion.json) enumera las 61 huellas y la comprobación Git, versiones, procedencia, certificados y mapeo `paquetes/criaturas-magicas/`→raíz APP. [Inventario previo](evidencias/B16/anteriores.json) de las 63 anteriores. [Certificados originales](evidencias/B16/certificados/MANIFIESTO_SHA256.json), [aprobación](evidencias/B16/certificados/APROBACION_CONTENIDO.md), [delta](evidencias/B16/certificados/DELTA_ACTIVACION_1_A_2.json) y [registro de Gestor](evidencias/B16/certificados/REGISTRO_PREPARACION.md). No se copiaron galerías, candidata ni fuentes a `barajas`.

### 9.3 Entorno y ejecuciones reales

Windows/PowerShell; Node **24.19.0** en `C:\Users\Adrian\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, npm **11.6.2** mediante wrapper local T03, sin cambios globales. ICU **78.3**, Unicode **17.0**, `Intl.Segmenter` existente. TypeScript 6.0.3/Vitest 5.0.2/Playwright 1.63.0; **Chrome 155.0.8059.80**, headless, DPR/escala visual 1. Fuentes efectivas por CDP en [registro](evidencias/B16/fuentes-y-normal-on-off.json); Segoe UI y SegoeUI-Bold. Emulación CSS, sin dispositivos físicos ni revisión humana.

| Comando/ensayo nuevo | Resultado |
|---|---|
| `npm run test -- server/application/deckCatalog.test.ts` | 1/1; comprobación focal previa al ajuste de pruebas/verificador, ya incorporada la copia |
| `npm run decks:validate -- --package barajas/criaturas-magicas` | 0, válida/disponibilidad true; una ejecución sobre APP, no repetida sobre origen idéntico |
| `npm run decks:prepare` | 0, tres disponibles, orden criaturas 2 / genérica 4 / Solar 4 |
| Tipos/lint focal | Tipos correctos; lint detectó tres globales nuevos en verificador, corregidos usando globalThis sin silenciar reglas |
| Primer navegador B16 | 3/11 pasan; ocho fallan por listener instalado después del socket, no por contenido o geometría |
| Reparación focal PLAY_VALUE 390 on/off | 2/2, dos estados activa/no activa por recorrido; reload posterior al listener permite capturar tráfico real |
| **`npm run check`, 15:13 Europe/Madrid** | **538/538**, 43 archivos, tipos/lint/build correctos; **70 módulos** sin imports prohibidos/ciclos |
| **Navegador final, dos trabajadores** | **38/38**, 2,4 min, cero reintentos: 11 B16 + 27 regresiones pertinentes |
| Medición auxiliar de fuentes/normal on-off Criaturas | 1/1, 10,7 s; CDP y comparación geométrica a 1368 útiles |
| `node --check tools/ci-image-runtime.mjs` | 0, sintaxis; contraste estático de las 61 expectativas con manifiesto y conservación de las cuatro huellas anteriores. **No ejecución Linux** |

Selección final exacta:

```powershell
npm run test:browser -- --workers=2 creatures.spec.ts solar.spec.ts bots.spec.ts decks.spec.ts format2Presentation.spec.ts cancelGame.spec.ts resultNotice.spec.ts proxy.spec.ts --grep 'B16|B14|B09 P2 normal|AGV2-|B15 espera|B15 frontera|B15 E7|B13|INC-01|T05 origen'
```

Se eligieron catálogo/recuperación, las anteriores dos barajas, una partida normal de genérica, controles/incertidumbre/frontera/consultas B15, los nueve B13, los cuatro T04 y transporte de origen único. No se repitió toda la batería de navegador ni la matriz/corpus V2 como ensayo focal; el check conserva íntegra su batería existente. Los resultados anteriores B04–B15 no acreditan estas ejecuciones.

[Resultados/selecciones estructurados](evidencias/B16/resultados.json), [instancia servida](evidencias/B16/normal-instance.json), [partida normal](evidencias/B16/partida-normal.json). Logs brutos ignorados en `playwright-report/b16/`. El primer montaje limitado por sandbox rechazó el enlace de dependencias (EPERM); se reejecutó con autorización. Hubo un arranque/limpieza temporal EBUSY no completado, seguido de montaje correcto; no se atribuye causa forense. Un intento de check no se ejecutó al agotar cuota de revisión automática; después del restablecimiento se ejecutó y pasó. Fallos registrados sin presentarlos como pruebas superadas.

### 9.4 Instancia normal, privacidad e independencia

El montaje creó su propia instalación compilada, copió solo APP/tres paquetes y arrancó `main` en puerto efímero **52388**, PID 14260 durante el ensayo, con SystemClock/TimerScheduler/CryptoCardPermutation. `/api/decks` sirvió las tres versiones correctas, no-store/sin cookie; JS servido `c8a92a4581a088ce2a9f27c2cc5672d207dccffb781249fdb95fa03beaf252f6` y CSS `d22c9bf25f290bfff011a77ab287229c879f5de0c13078660b722da6403204a0` coinciden con la compilación. Proceso vivo al medir, stderr vacío y marcador de acceso externo ausente. El montaje lo cerró después; **ese puerto ya no representa un servicio disponible**. No se cerraron/reiniciaron servidores del autor.

El ensayo de construcción/arranque de `startup.test.ts` usa procesos compilados y guard efectivo: probes async/readFile y sync/realpath.native de **ASSETS y PRODUCTO** fallan y registran acceso; build/prepare/arranque/consultas legítimos no registran ninguno. La instantánea interna sigue igual aunque después se cambien archivos de la instalación temporal. No se movieron ni renombraron árboles fuente para acreditarlo.

Dos sesiones y dos pestañas de HOST: catálogo de tres sin selección, ficha/instrucciones versión 2, cambio entre tres/quitar/F5 conservando identidad/opciones, invitado y HOST ajeno rechazados, criaturas 4 rechazada con DECK_VERSION_MISMATCH. Preparación sin cartas; HTTP, ack y eventos IN_GAME contrastados con forma exacta y propias/rivales, observador sin mano; resultados sin cartas/mazo. **59/59** respuestas WebP v2 con SHA del manifiesto; portada/manos cargadas/decodificadas. Seis JSON privados por ruta de paquete y medios, versión inexistente y escape de carpeta devuelven 404 sin fallback HTML.

### 9.5 Resistencia, presentación e interacción

46 escenas/mediciones de producto versionadas, incluidas ambas representaciones, activa/no activa, PC 1920×1080, 390×844, 360×800, normal adaptada con optimización off, quinta/revisión y observador. [Índice de capturas/revisión](evidencias/B16/capturas/README.md), [medidas resumidas](evidencias/B16/medidas.json). Condiciones comparables dentro de cada perfil: dos humanos, turno 60 s, primera jugada manual legal, baraja/versión iguales; solo cambia el indicador legal que hace activa/no activa Resistencia o el modo aceptado. Los avisos de recuperación visibles proceden de la recarga necesaria para inspeccionar tráfico, sin ocultarlos de las imágenes.

| Perfil; medidas iguales en 1-58/Dato | Útil | Fila Resistencia no activa / activa | Altura página no activa / activa | Scroll residual |
|---|---:|---:|---:|---:|
| PC 1920×1080, on | 1368 | 32 / 32 px | 1173 / 1173 | 93 / 93 px |
| 390×844, on/compacta | 358 | 27,19 / 45,38 px | 1133 / 1171 | 289 / 327 px |
| 360×800, on/compacta | 328 | 27,19 / 45,38 px | 1211 / 1249 | 411 / 449 px |
| 390×844, off/normal adaptada | 358 | 55 / 74 px | 1950 / 1964 | 1106 / 1120 px |

PC: cartas 230×321. En compacta los casos de esta traza miden 220×203,47/203,75/221,66 según nombre/estado; normal adaptada estrecha presenta alturas mayores (363–387) y scroll. Se registran dimensiones efectivas del CSS existente, **sin imponer alturas universales ni reducir fuentes**. Nombre PC 16/compacto 18 y celdas 14 px. Resistencia se conserva completa; símbolo/nombre/marca pueden ocupar líneas distintas al activarse en compacta. Los fragmentos de texto de las 46 escenas quedan contenidos en sus celdas, sin elipsis/recorte/desbordamiento; Detalles/Jugar accesibles, sin solapamiento observado. El mayor scroll no se oculta ni se declara resuelto por este bloque.

Comprobados Información exacta, Detalles informativo sin J/nombre alternativo/notas recortadas; números sin unidad ni espacio añadido y modos aceptados aunque coincidan. Teclado/Enter/Space/Escape/foco, selección parcial y envío único, arrastre sin jugar, quinta completa, revisión que impide jugar, mano/Mesa con scroll independiente, resize/frontera 1367/1368 sin nueva acción/reinicio, observador/Cancelar por permiso. Además, Criaturas normal on/off a 1368 útiles tiene geometría idéntica (montaje auxiliar); B15 conserva también su prueba de frontera/estabilidad.

Estas capturas son producto compilado con conexiones reales y tiempo/permutación sustituidos para escenas legales; no galerías ni partidas normales completas. Se revisaron imágenes PC/móvil por Implementación, **sin atribuir aprobación humana del autor, equipo físico o zoom de usuario**. No hubo incompatibilidad concreta que exigiera cambiar contenido o diseño.

### 9.6 Partida normal y verificador Linux

Criaturas 2, jugador HUMAN contra EASY/HARD, adaptadores normales y sin fixtures que suplanten la instalación: **15 jugadas del humano a tiempo, mediante gestos automatizados de Chrome**, fases finales rondas 13/14/15, final DECK_COMPLETED, **45 puntos oficiales** entre tres jugadores. Resultado seleccionado correcto/privado, F5 en dos pestañas, retorno coordinado y sala nueva con defaults/sin selección. No asignaciones de puntos, saltos del motor o habilidades ejecutables; no prueba humana del autor. El recorrido normal de genérica y el de Solar también pasaron en la selección final.

`tools/ci-image-runtime.mjs` conserva Node fijado, linux/x64, uid no root, sharp nativo, EROFS, exclusiones privadas, HTTP/no-store/sin cookie y hashes anteriores/URL Solar v4. Añade PRODUCTO a exclusiones, las tres identidades/versiones, seis JSON privados y **61 valores SHA esperados fijos** (dos JSON +59 recursos nuevos) trazables al manifiesto aprobado; coteja bytes locales y respuestas de los 59 medios v2. El esperado no se obtiene de los archivos/respuestas verificados. Sigue siendo script autocontenido aprovisionado por STDIN mediante el CI existente; no se empaquetan certificados/editoriales ni cambian workflows. **Solo sintaxis y revisión estática local: ejecución de imagen/CI Linux pendiente.** No se eliminaron asserts para ejecutarlo bajo Windows.

### 9.7 Criterios y traslado al autor

| Criterio | Resultado nuevo / límite |
|---|---|
| B16-01 | 61/61 origen/APP/Git y certificados; 63/63 anteriores intactos; verificado |
| B16-02 | Validación APP/prepare/compilación/arranque, tres versiones/orden sin default, guard ASSETS/PRODUCTO; verificado |
| B16-03 | Dos sesiones/varias pestañas, selección/cambio/quitar/F5, modos conservados, permisos y rechazo v4; verificado |
| B16-04 | 59 medios v2 con MIME/SHA, carga real/alt/textos/instrucciones/notas y bytes íntegros; verificado |
| B16-05 | Ambos modos/layouts/opciones/útiles, Resistencia activa/no activa completa y métricas; verificado técnicamente, revisión humana pendiente |
| B16-06 | Quinta/revisión/observador, foco/teclado/resize/scrolls/arrastre y acción única, B15 frontera; verificado |
| B16-07 | Seis JSON privados y HTTP/ack/eventos seguros por destinatario, instrucciones limitadas; verificado |
| B16-08 | Partida normal legal Criaturas/humano/EASY/HARD hasta resultado/F5/otra sala; verificado |
| B16-09 | Regresiones afectadas y verificador adaptado/revisado sin debilitar asserts; verificado localmente, Linux/CI pendiente |
| B16-10 | Check/navegador finales, README/manual/evidencia/capturas/huellas/revisión semántica; cierre técnico local, límites separados |

Para Coordinación/alineación documental: catálogo APP pasa a tres, esquema 2 en todas y contenidos independientes **2/4/4**, orden ASCII con Criaturas primero y sin selección inicial. Resistencia/narrativa/rangos/unidades/indicadores conservados, sin nuevas reglas o presentación. Consumidor/contratos B15 y B13/T04 intactos. Actualizar descripciones de disponibilidad/entrega en sus fuentes responsables después de recibir este cierre; no se editaron TFM/Diseño/ASSETS/PRODUCTO ni cierres históricos.

[README: manual B16](../../README.md#prueba-manual-b16-criaturas-mágicas-y-dos-sesiones) preparado para dos sesiones, observador/varias pestañas, opciones/Información/recuperación/Resistencia, partida/resultados/cancelación/otra sala. **Pendiente como recorrido humano**, igual que dispositivos físicos/zoom real. La revisión editorial/activación/validación y galería del Gestor siguen siendo categorías distintas de estas comprobaciones de producto. Retención/revisión y carreras de regresión usan reloj controlado, no media hora real. C09–C10 mantienen cobertura parcial: comprensión educativa, equilibrio, revisión humana universal, publicación y despliegue no acreditados. Commits locales, sin push/PR/GHCR/VPS ni mensajes a otros hilos.
