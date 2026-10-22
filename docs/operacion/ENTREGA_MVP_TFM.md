# Entrega del MVP para el TFM — 22/10/2026

## Evaluar y recuperar la entrega

Aplicación en Pruebas: **https://pruebas.karta3.com**. Es un MVP de juego de cartas multijugador con salas, participantes humanos y bots, turnos y automático, resultados recuperables, cancelación y cuatro barajas. El servidor decide las reglas; cada navegador solo recibe su mano y la información pública. El juego vive en RAM de un único proceso: reiniciar pierde salas, sesiones y resultados, aunque se conserven los agregados estadísticos.

La etiqueta anotada `tfm-mvp-2026-10-22` identifica el cierre documental publicado. Su destino Git es el **commit de entrega**, posterior al producto solo por documentación; consultar el destino de la etiqueta, no confundirlo con la versión npm `0.1.0`. No congela técnicamente la URL ni impide cambios posteriores de main.

| Referencia | Identidad |
|---|---|
| Producto que generó la imagen | `06e3f9493fd703ca022821046114e1c53a37beb2` |
| CI final del producto integrado | [39703729802](https://github.com/adriancapilla/karta3/actions/runs/39703729802) |
| Publicación del mismo OCI, sin reconstrucción | [39705935884](https://github.com/adriancapilla/karta3/actions/runs/39705935884) |
| Imagen desplegada en Pruebas | `ghcr.io/adriancapilla/karta3@sha256:c79dffcb055c830b6c0a3dd230991fe3e277d94af5aa10fe6a4010d9ff2305d7` |
| Alineación recibida de Arquitectura | `ARQ-PUBLICACION-B22-2026-10-22` |

El repositorio es público y el paquete GHCR privado. No se necesita acceso a GHCR para reproducir el código. El cierre documental conserva íntegro el contenido ejecutable del producto aprobado; no promueve otra imagen por cambios documentales.

## Clon y arranque local

Requisitos: Git, **Node.js 24.19.0**, npm (referencia comprobada: **11.6.2**). `.node-version` fija el runtime; el manifiesto admite Node >=24.19.0 y <25. Las dependencias nativas se instalan con el lockfile. No hacen falta ASSETS, PRODUCTO, TFM, MASTER, credenciales o archivos del servidor.

```powershell
git clone https://github.com/adriancapilla/karta3.git
Set-Location -LiteralPath 'karta3'
git switch --detach tfm-mvp-2026-10-22
node --version
npm --version
npm ci
npm run build
npm start
```

Abrir `http://127.0.0.1:3000`. No configurar variables estadísticas para esta reproducción: fuera de Pruebas preparada la recogida está OFF. La instalación no recupera datos del VPS. Para desarrollo, `npm run dev` sirve la interfaz en `http://127.0.0.1:5173` y el servidor en 3000. [Comprobaciones y organización](../../README.md#comprobaciones). No ejecutar reinstalaciones mientras procesos propios utilicen los módulos nativos.

## Primera partida

1. Crear una sala e indicar nombre; compartir el código con otra persona que entre desde otro navegador/perfil independiente. Dos pestañas del mismo perfil comparten identidad. También se puede jugar con bots sin otra persona.
2. Seleccionar expresamente una baraja: **Criaturas Mágicas** (formato 2/contenido 2), **Genérica** (2/4), **Modelos de IA — Edición 2026** (2/2) o **Sistema Solar** (2/4). La sala comienza sin selección. Consultar Información para sus instrucciones. Modelos IA es una demostración de la mecánica, no un ranking científico.
3. Mantener «El anfitrión juega» si se juega a solas con bots; añadir bots, renombrarlos o elegir Fácil/Difícil. Iniciar requiere **2–5 jugadores y al menos un humano jugador**, selección válida y miembros humanos conectados. Un anfitrión observador con solo bots **no permite iniciar**: debe jugar él o incorporarse otra persona como jugador.
4. Configurar tiempo de turno (15/30/60 s), revisión y desempate opcional antes de iniciar. Al abrir una ronda elegir ALTO/BAJO y carta; después, en el turno propio, seleccionar carta y pulsar Jugar. Detalles consulta y no juega. Dos vencimientos consecutivos activan automático permanente en esa partida.
5. Consultar revisión/resultados al terminar y volver para crear otra sala. El anfitrión puede Cancelar con confirmación: conserva puntuación parcial sin adjudicar ganador. Los resultados autorizados se retienen 30 minutos en RAM; recargar no renueva esa retención.

## Presentación y privacidad

«Valor del Atributo» muestra **1–58** o **Dato** literal; el ranking jugable sigue decidiendo el juego en ambos modos. «Optimizar para móvil» habilita compacta cuando hay menos de **1368 px útiles medidos**; desde esa frontera conserva normal. Los dos paneles compactos tienen un máximo de 450 px si hay espacio y se adaptan al disponible; mesa y mano conservan sus carruseles. No equivale a certificar todos los dispositivos físicos. Es correcto desplazarse verticalmente hasta «Analítica y privacidad», después de la mesa: el encaje de la mesa no exige que todo el documento quepa en una pantalla.

La **apariencia personal** (Claro, Oscuro, Crema, Alto contraste) afecta a ese navegador/origen, no a la configuración compartida ni a las reglas. Funciona sin permiso estadístico. [Guía de apariencia](APARIENCIA_B20.md).

En Pruebas está funcionando B21 en modo **aggregate**, modelo **AGG_DAILY_V1**, con escritura real comprobada. Guarda agregados diarios separados del juego, sin eventos o recibos individuales ni API pública de informes. Núcleo/HOME se incluyen por defecto bajo las condiciones vigentes; una sesión anterior sin nueva preferencia permanece sin medición hasta elegir. **Exclusión general** y **permiso independiente de apariencia** son controles diferentes: rechazar apariencia no excluye núcleo/HOME; excluir un humano corta las aportaciones futuras del ciclo compartido. Volver a incluir no reconstruye ese ciclo ni concede permiso de apariencia. No existe el botón de consulta manual de preferencias; las consultas internas y coordinación entre pestañas se conservan. Consultar el aviso `/privacidad` de la aplicación y la [guía B21](ANALITICA_AGREGADA_B21.md).

La aceptación general B19 y sus procedimientos B18–B20 son **históricos y sustituidos**: no usar sus configuraciones, lectores o migraciones con B21. No hay migración ni lectura de sus bases; su retirada no pertenece a este cierre.

## Evidencia recibida y límites

| Ámbito | Evidencia y alcance |
|---|---|
| CI final de fuente | [39701509548](https://github.com/adriancapilla/karta3/actions/runs/39701509548): 620 pruebas, 104 módulos y 222/222 recorridos Chrome. |
| CI final del producto integrado | [39703729802](https://github.com/adriancapilla/karta3/actions/runs/39703729802): mismos recuentos, un trabajador y cero reintentos; Chrome 17 min 53,535 s. Linux/imagen verificados. |
| Clon e imagen Linux | Instalación, compilación/arranque y recursos; Node 24.19.0, SQLite 3.53.3, Vite 8.3.5; cuatro barajas y **185 huellas** (124 anteriores + 61 nuevas). Usuario sin privilegios, raíz RO, volumen privado, separación de entornos, copia/restauración agregada aislada y protección de archivos privados. El clon local se comprobó OFF; no acredita recogida real. |
| VPS, cierre posterior del 22/10 | Imagen por el digest indicado, HTTPS y catálogo/recursos comprobados; tres partidas comunicadas por el autor y escritura agregada contrastada administrativamente (un final completo y dos cancelaciones). Controles confirmados visualmente, copia cifrada y restauración/lectura aisladas en el mismo VPS. No es otra batería automatizada ni un informe formal de día UTC cerrado. |
| Valoración humana | Nueva baraja probada satisfactoriamente; paneles aceptados, con presentación mejorable; juego en dos navegadores y controles visibles. Dos navegadores del autor no equivalen a dos personas, ni certifican otros dispositivos, fuentes o tamaños. |

Los fallos anteriores y sus reparaciones permanecen en las PR [17](https://github.com/adriancapilla/karta3/pull/17) y [18](https://github.com/adriancapilla/karta3/pull/18) y en el [registro operativo](GITHUB_Y_RECUPERACION.md). Los resultados de esta tabla son evidencia del producto, no pruebas repetidas por el cierre documental.

Pendientes conservados: **C09–C10 parciales**, capacidad no certificada, causa histórica B08 sin cerrar (los pases posteriores no acreditan una reparación), observaciones visuales menores y dos avisos moderados de desarrollo de Vitest/@vitest/mocker 5.0.2. La auditoría de producción de la entrega fue cero; no garantiza ausencia de futuros avisos.

No se ensayaron reversión real/OFF de contingencia, restauración integral de Hostinger, recuperación por pérdida total del VPS/proveedor, otro cambio de día/purga o cadencia futura de mantenimiento y copias. La copia y restauración aisladas en el mismo VPS no acreditan custodia externa ni RPO de 24 h. No se declara completada una verificación global de requisitos operativos por este cierre. Se conservan los datos históricos B19 y la carpeta privada del ensayo sin acceder a ellos ni retirarlos.

## Fuentes externas y recuperación

Esta guía y las especificaciones enlazadas son reproducibles desde Git. Las fuentes generales de Arquitectura y el cierre operativo detallado no se copian al repositorio: forman parte de la documentación TFM custodiada por el autor. Referencias documentales externas (no requisitos de instalación):

- `APP/verificacion-b22-publicacion-20261022/cierre-publicacion.md`: integración, CI, clon y GHCR.
- `TFM/Planificación/despliegue_pruebas/ACTUALIZACION_B22_2026-10-22.md`, §§3.10–3.17 y §4: escritura real, cierre del despliegue y límites operativos.
- `CAPA_APLICACION_KARTA3.md` e `INFRAESTRUCTURA_KARTA3.md`: recepción `ARQ-PUBLICACION-B22-2026-10-22`, anterior al cierre posterior del despliegue; sus menciones de VPS aún B19 son evidencia fechada, no el estado vigente.

Recuperar código/documentación mediante el clon y la etiqueta, sin necesitar esas rutas externas. La imagen conserva su digest privado independiente. La reserva Git histórica y las etiquetas de archivo anteriores se mantienen: no se reaplican ni eliminan para recuperar esta entrega.
