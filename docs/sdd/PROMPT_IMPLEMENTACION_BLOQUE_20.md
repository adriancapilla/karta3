# Prompt para Implementación — B20

Este texto lo revisará y trasladará el autor. Su preparación documental no inicia ni autoriza la implementación en el hilo SDD.

## Encargo

Implementa **B20 — Apariencia personal y fotografías de uso** conforme a `docs/sdd/BLOQUE_20_APARIENCIA_PERSONAL_Y_USO.md`, en `E:\KARTA3\KARTA3_IA\APP\karta3`. Lee primero AGENTS, proceso, organización/dependencias y B18/B19 **vigente con aceptación individual**, no su propuesta descartada de retirada.

Base observada por SDD el 20/10/2026: rama `main`, HEAD `4e92efe7034cf6c10366daf90429d3f6ce02978c`. Verifica el estado real y conserva cualquier trabajo posterior. Ya había cuatro documentos modificados: proceso, B19, ANALITICA_USO y PREPARACION_ANALITICA_REAL_B19. La especificación y este prompt se suman a esa preparación; no atribuirse ni mezclar la limpieza B19. No crear ramas/checkouts, reinstalar, resetear o revertir trabajo ajeno. Si hay escrituras de otro hilo, coordinar la cesión a través del autor antes de editar simultáneamente.

Referencia cromática: `E:\KARTA3\KARTA3_IA\TFM\Maquetas\comparativa-temas-mesa.html`. Copiar únicamente las decisiones de color por función; no su estructura, fixtures o carga de JSON. Mantener tipografía, medidas, imágenes, títulos/columnas corregidos y composición existente normal/compacta. Fuentes generales en TFM se consultan, no se editan.

## P1 — Preferencia y presentación

1. Cuatro valores estrictos LIGHT/DARK/CREAM/HIGH_CONTRAST: Claro/Oscuro/Crema/Alto contraste. Preferencia **personal**, nunca RoomSettings/GameSettings. Funciona sin analítica.
2. Estado sin registro válido = LIGHT/DEFAULT, selector visible **«Predefinida»**. Marcador no elegible/oculto en menú; nombre accesible Apariencia y explicación accesible del predeterminado. Etiqueta visible «Apariencia» solo en espera/configuración; en partida, Inicio y Resultados, únicamente el selector sin etiqueta visible. Menú solo con cuatro temas reales. Elegir Claro también produce EXPLICIT. Tras elegir se muestra el tema, no Predefinida. Esta aclaración del autor sustituye el marcador «Modo» anterior.
3. Persistir solo `{version:1,theme}` en `karta3.appearance.v1`; registro válido recordado implica EXPLICIT. Almacenamiento inválido → predeterminado; fallo → memoria sin bloquear, con aviso discreto si falla guardar. Pestañas mismo origen releen la última escritura válida; no cuentas ni sincronización remota.
4. Inicializar antes de App/PrivacyScreen sin montar juego en privacidad. Aplicar a Inicio, espera/configuración, partida, Resultados, información y diálogos. No reiniciar estado, dirección, foco, carruseles o plazos; no renovar espera por elegir tema.
5. Respetar posiciones de §3: HOST selector sin etiqueta visible a la izquierda de Cancelar en ancho y debajo en estrecho; Cancelar extremo derecho; sin permiso, selector en su zona superior derecha. En espera, etiqueta visible «Apariencia»: HOST al final como personal; invitado junto a configuración consultable sin ocultarla. No intercalar controles en resumen/Mesa/mano o cambiar condición/umbral 1368.
6. Variables semánticas de §4, superficies/textos independientes, cartas claras con texto oscuro en Oscuro. Ajuste aprobado de contraste solo por función usando colores oscuros ya presentes para foco/bordes imprescindibles sobre claro. No cambiar grosor/posición/geometría ni filtros de imagen. Registrar diferencias cromáticas de Claro actual y pares efectivos de contraste.

Puerta P1: pruebas focales de preferencia/teclado/pestañas y capturas comparables de cuatro temas normal/compacta; pantallas secundarias repartidas proporcionalmente. No declarar B20 completo con esta etapa.

## P2 — Fotografías y consulta estadística

1. Aplicar §§5–8 sin ampliar población/datos: HUMAN jugadores, dos fotos START/END de tema/procedencia. No bots/observadores, cambios intermedios, duración por tema, dispositivos o recurrencia.
2. Ventana única en transición **en vivo**, metadata `appearanceWindow` por conexión, token acotado en RAM, diez segundos y máximo4096 pendientes. No emitir oportunidad en resume/recarga/consulta/reconexión/ack repetido. Invalidar al perder conexión/permiso/OFF; exacta caducidad prevalece. Fallar estadística nunca bloquea juego.
3. Congelar valor al presentar nueva mesa inicial o recibir final desde esa partida activa. Resolver ack/socket en ambos órdenes y misma revisión, sin resamplear tema ni reaplicar sala antigua. No fabricar inicio al aceptar tarde ni final al consultar resultado; mantener ausencias y T04 cuando una sesión ya tenga otra sala.
4. Reutilizar `/api/usage/events`, consentimiento/transporte/cola y límites existentes; evento nuevo `appearance_snapshot v1`, entrada y normalización estrictas de §7. Servidor valida contexto/identidad/referencias, no confía en participación/fecha elegidas por cliente. Nunca guardar tokens/gameId funcional/sesión/cookies/nombres o manos.
5. Primera foto válida admitida por partida/participación/momento gana; dedupe en RAM y almacenamiento, varias pestañas no sobrescriben ni generan conflicto falso. Reintento existente acotado solo con ventana/conexión/permiso vigentes; no reenvío en reconexión. 202 es cola, no durabilidad.
6. Reutilizar cobertura/censura B19 y barreras de retirada; no resucitar ciclos no observables. HUMAN/SYNTHETIC y entornos separados; datos de ensayo fabricados/aislados. Apariencia local sigue operativa sin aceptación.
7. Nuevo informe privado `appearance v1`: marginales inicial/final por tema/procedencia, pares netos y cobertura observada. Cohorte de inicio UTC, denominadores independientes, cero → porcentaje nulo; sin identificadores en CSV. No llamar preferencia demostrada o personas únicas a los resultados.
8. Esquema estadístico 2→3, compatibilidad histórica sin rellenar Claro/ausencias. Marcar instrumentación nueva sin atribuirla a partidas previas. Conservar ocho informes, recibos y mecanismos de lectura/mantenimiento/copia agregada. 90d detalle y 12meses agregados, consolidación idempotente. Actualizar validadores/CLI/backup/restore/limpieza que dependan del esquema o nombres; sin relajar controles privados o introducir nueva plataforma.

Puerta P2: pruebas puras y SQLite temporal de contexto/duplicados/pérdidas, consulta, históricos/migración/retención y agregados. Usar reloj controlado para bordes, no esperas largas. Arquitectura: puertos y fórmulas en aplicación; IO/SQL/transportes en infraestructura; conexión en composición; dominio independiente.

## P3 — Integración y cierre

1. Integrar texto mínimo de §9 y nueva versión de aviso propuesta `2026-10-20.1`, comprobando disponibilidad. Conservar evidencia histórica de aviso anterior. B19 invalida aceptación de otra versión: misma elección, sin permiso adicional ni captura retrospectiva. No retirar aceptar/rechazar/retirar.
2. Ejecutar matriz representativa §13 sobre producto compilado: cuatro temas, pantallas/diálogos, HOST jugador/observador e invitado, teclado/foco/D/Jugar/arrastre, normal/compacta y útiles1367/1368. Capturas base/final equivalentes, geometría fuera del nuevo grupo de controles intacta. No repetir toda matriz de barajas o Unicode.
3. Estadística real de ensayo con dos sesiones/pestañas: mismo/distinto tema y regreso al inicial; predeterminado/Claro explícito; duplicados, permiso/retirada/caducidad, inicio/final ausente, recarga/reconexión, los tres finales y consulta tardía. Desconexión real y T04; separar evidencia de reloj controlado. Inducir cola/DB no disponible y demostrar que juego sigue.
4. `npm run check` y navegador pertinente sobre compilación final identificada. Reutilizar regresiones nombradas en §13, sin debilitar aserciones. No repetir baterías correctas por rutina; GitHub hará sus puertas de publicación después por otro encargo.
5. Actualizar README, documentación operativa afectada **solo por B20**, mapa de responsabilidades APP y registro de implementación/evidencias B20. Mantener históricos y modificaciones previas. Registrar fuente/build, casos, resultados, fallos reparados, capturas/medidas y límites. No presentar maqueta/cálculos como prueba de producto, ni Windows como Linux o revisión humana/dispositivos físicos.
6. Devolver al autor conclusiones para Arquitectura: preferencia personal frente a optimización compartida; diez tipos/nueve consultas; aviso/consentimiento, ventanas RAM, esquema3, cohortes/conservación y ausencia de cambio en dominio/almacenamiento de juego. Registrar alineación recibida antes del cierre verificado; no editar TFM ni enviar mensajes a otros hilos.

Si surge una incompatibilidad concreta, entregar medición y alternativa mínima al autor antes de cambiar diseño, población, consentimiento o datos. No ampliar a dashboard, reglas, rediseño, paquetes o refactorización general. No publicar, activar recogida, desplegar ni operar GHCR/VPS. La entrega es código/documentación/evidencia local autorizados por el posterior traslado del autor, con pruebas reales y pendientes explícitos.
