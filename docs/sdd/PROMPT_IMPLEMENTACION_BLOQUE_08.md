# Encargo de implementación — B08

Implementa **B08: temporización de turno y automático por inactividad**, conforme a la [especificación acordada](BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md) el 04/10/2026:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_08_TEMPORIZACION_Y_AUTOMATICO.md`

## Preparación y base

Trabaja en `E:\KARTA3\KARTA3_IA\APP\karta3`. Lee AGENTS, proceso SDD, B08 completo, organización/dependencias, B05, B06/B07 con contratos/cierre y las secciones citadas de contexto, dominio, aplicación e infraestructura en `E:\KARTA3\KARTA3_IA\TFM\Planificación`.

La preparación SDD comprobó rama `main`, HEAD/main/referencia local origin/main `097cffc21e1224aebc30ed3c353df837f4166839`, aplicación 0.1.0 y árbol limpio antes de añadir especificación/prompt/enlace del proceso. B06/B07 están integrados y publicados; B08 necesita esa entrega, no main `4dd073d` ni una implementación anterior. Genérica formato 1/contenido 2 disponible, sin cambios autorizados.

Comprueba rama, HEAD y cambios vigentes antes de editar. Crea una rama nueva —`feat/b08-temporizacion-automatico`— desde ese main o sucesor compatible que conserve B06/B07. Preserva estos documentos y cualquier trabajo existente; no restaurar/descartar cambios ni sustituir documentación de otra conversación. Registra la base efectiva, incluidos cambios locales conservados. Si una actualización de base requiere una decisión real, explicarla antes de actuar.

Los 295 tests/63 Chrome/57 módulos registrados para B06/B07 son evidencia histórica. Ejecuta y registra tus puertas actuales; no los atribuyas a B08 ni confundas publicación anterior con autorización para publicar ahora.

## Dos etapas internas, un bloque completo

### T1 — Plazo y vencimiento

- Integrar plazo humano desde inicio B06 y cada activación de turno, con Clock/Scheduler existentes. Registro único, reloj monotónico interno, referencias Unix públicas y contexto/generación; activar antes de publicar/confirmar. El cliente solo estima tiempo restante.
- Abridor: un plazo para carta y dirección, ambos órdenes de selección B07 y envío al completar sin botón. Parcial de dirección privada/modificable aceptada en servidor; carta parcial local. Nada renueva plazo.
- Vencer una sola vez: más antigua restante; abridor conserva dirección aceptada antes del límite o usa umbral del atributo activo 1–29 HIGH / 30–58 LOW. Carta local seleccionada no cuenta.
- En procesamiento serializado, `t >= vencimiento` vence aun con callback retrasado. No confiar en hora del cliente ni esperar callback para aceptar/rechazar. Aplicar tareas debidas también al leer/recuperar/repetir; invalidar tareas anteriores y evitar dos movimientos por manual/timeout concurrentes.
- Nuevo plazo tras jugada anterior o avance efectivo posterior a revisión; no corre durante revisión, no inventa vencimientos retroactivos. F5, reconexión, pestañas, parciales y replays no lo reinician.
- Añadir contrato seguro de tiempo/control de B08 §§5–6 y presentación §4; retirar marcador/aviso de partida sin límite cuando deje de corresponder. Sin nuevos selectores.

Comprueba T1 por capas y registra evidencia de etapa. No declarar B08 completo ni introducir un modo permanente que suprima T2.

### T2 — Automático y finalización por inactividad

- Dominio: primer timeout ACTIVE/1; solo manual completa válida a tiempo reinicia a 0; segundo consecutivo juega todavía TIMEOUT y pasa a AUTOMATIC/2 permanente. No reset por parcial, duplicado, inválida, cambio de ronda/fase/desempate o reconexión.
- Ejecutar AutoPlayPolicy de humanos al llegar su turno, sin plazo humano: más antigua y dirección desfavorable al abrir, oficial cuando no abre; registrar AUTOMATIC. Puede ganar/abrir/conservar puntos. No es un bot; no implementar BOT ni sus dificultades.
- Automatismo interno en pasos acotados, revalidando contexto/generación y atendiendo otras salas. Detener en humano, revisión o resultado. No ejecutar siguiente ronda antes de acabar revisión; cero no omite comunicación ni permite bucle bloqueante.
- Tras reconectar automático, recuperar mano propia/mesa/Detalles, sin control manual; servidor lo rechaza aunque se manipule el navegador. Presencia y automático son estados distintos. El anfitrión ausente no cierra IN_GAME; sin navegadores el servidor continúa.
- Si todos los humanos jugadores del roster base son AUTOMATIC, terminar ronda actual/puntos y revisión y presentar resultado por inactividad sin nueva ronda/reposición/desempate. Si ocurre en un desempate ya iniciado, terminarlo/revisarlo y reconocer al vencedor sin puntos nuevos. Observador no cuenta; no evaluar solo la lista reducida de empatados. Motivo/flag según B08 §3.4.
- Conservar cartas, revisión cero/positiva, fase final, clasificación, retención 30 minutos desde publicación de RESULTS aunque no haya clientes, recuperación/retorno/otra sala B07.

## Contratos, interfaz y arquitectura

Conserva entradas de `game:opening-direction`/`game:play`, contexto sala/partida/ronda/turnId/requestId y ack B07. Aplica extensiones explícitas de B08 §5: TIMED_TURNS, timing público estable, playStatus público, contador propio, modos TIMEOUT/AUTOMATIC, evento `game:turn-expired` deduplicado y resultado por inactividad. Mantén errores vigentes y añade PLAYER_AUTOMATIC/TURN_EXPIRED según §6; un replay aceptado devuelve vista vigente propia sin reaplicar ni resetear nada.

No transmitir mano rival, dirección parcial ajena, orden de mazo, paquete completo, credenciales, monotónico/generación ni contador privado ajeno por HTTP, ack o eventos. No añadir endpoints públicos de timeout/automático/avance/reloj.

Reutiliza GameCoordinator, Room, proyecciones, puertos y adaptadores existentes. El dominio decide políticas/contador/control/resultado, aplicación mide mediante puertos y coordina, infraestructura implementa reloj/tareas/transportes, composición conecta y React presenta. Decisión/escritura/dedupe coherentes sin await antes del registro; emisión posterior y pérdida de ack no duplican movimientos. No crear estructuras vacías ni un sistema paralelo de temporizadores.

Interfaz acordada: cuenta atrás mm:ss en Estado de la partida, igual información móvil/escritorio, sin modal/sonidos; contador solo de revisión cuando corresponde. Timeout: aviso de cinco segundos a todos, advertencia persistente propia tras primero; automático: marca pública y aviso propio permanente, sin recuperar control. Mantén ganador/puntos B07 aunque coincidan avisos, foco/Detalles/scroll, teclado, nombres repetidos y resultado inequívoco por inactividad. Sin rediseño general.

Puedes decidir nombres internos, factoring, ubicación del registro y montaje de pruebas compatibles con §7. Consulta solo una contradicción normativa nueva o necesidad real de cambiar comportamiento/arquitectura. La errata de dominio §24.2 ya está registrada: no cambiar puntuación o desempate para reproducir `12/12/12/12/2`. Usa trazas alcanzables, incluida mano reducida de cinco empatados a 10; entrega la errata al responsable de TFM.

## Comprobación y evidencia

Cumple **B08-01–20 y E1–E7**, cerrando T1+T2:

1. Dominio puro: política/extremos, modo, contador/reset/irreversibilidad y fines base/desempate; 58 ubicaciones únicas, puntuación/orden/conservación B07, trazas legales de 2–5 jugadores.
2. Aplicación con reloj controlado: antes/en/después, callback temprano/retrasado/duplicado/cancelado, parcial/modificación y carreras con manual, replays/conflictos, varias pestañas, review=0/positiva, fase final/desempate y retención. Permite avanzar reloj sin ejecutar callback para probar el borde real de procesamiento.
3. Integración con conexiones HTTP/Socket.IO reales y reloj sustituido: permisos, payloads privados por destinatario, publicación única, ack/emisión fallida, progreso sin clientes y fin por inactividad.
4. **Al menos un vencimiento real de 15 segundos con el cliente activo desconectado**, SystemClock/TimerScheduler normales, compilación vigente y servidor que siga vivo. Mantén otra sesión para observar avance; recupera la primera. Registra inicio/límite/observación/contexto/contador. Un avance de fake clock o una pestaña abierta sin jugar no sustituye este caso.
5. Navegador compilado: recorridos relevantes B08 y regresiones B01–B07/T01/activación, dos sesiones y varias pestañas, 360/390/1280, accesibilidad, avisos, reconexión y antigua respuesta frente a nuevo turno/otra sala. Casos legales deterministas para final/desempate; fixture solo de pruebas, nunca publicación editorial.
6. Ejecuta **`npm run check` y `npm run test:browser`** sobre el código final y servidor de esa compilación. Conserva garantías de pruebas existentes; adapta solo expectativas del alcance manual anterior con reloj controlado o acciones a tiempo, sin desactivar B08 en producto ni quitar cobertura. Ajusta timeout del test si requiere espera real, no duración del turno del juego.

Registra fecha/entorno/base/commit/comandos/resultados por etapa y criterio, fallos/reparaciones y límites. Distingue dominio, tiempo controlado, conexiones reales con reloj sustituido, vencimiento real, navegador automatizado y recorridos humanos. No atribuir 30 minutos reales, dispositivos físicos o validación con usuarios a simulaciones. Control automático de imports/ciclos más revisión semántica de responsabilidades/privacidad y continuidad entre salas.

Deja instrucciones manuales B08 §9 listas para autor: primer timeout/reset, segundo/visualización sin control, observador, cierre de todas las pestañas y recuperación de resultado, revisión cero/positiva, final/desempate mediante fixture legal y otra sala. Si no las realiza una persona, registrarlas pendientes como tales.

## Límites y cierre documental

Fuera bots, nuevos parámetros, rediseño, visualización configurable, vigilancia de dos minutos, despliegue y otro bloque. B03 conserva la espera; no arrastrar sus reservas/cierres a IN_GAME. C09–C10 mantienen cobertura parcial y límites explícitos; no declarar todo el MVP ni equilibrio/comprensión resueltos.

Actualiza README vigente, evidencia/cierre de B08, enlace/estado del proceso y descripción concreta del código en `docs/arquitectura/ORGANIZACION_Y_DEPENDENCIAS.md`. Conserva resultados históricos B04–B07. Marca implementado/verificado solo cuando ambas etapas y criterios tengan evidencia suficiente; indica cualquier limitación real.

Entrega resumen para coordinación y Arquitectura con alcance, archivos, decisiones/contratos, etapas, base/cambio revisado, comprobaciones reales y pendientes. Identifica actualización descriptiva de aplicación/infraestructura y errata de dominio, según B08 §10, para sus responsables. **No editar CONTEXTO_DESARROLLO_KARTA3.md, DOMINIO_KARTA3.md, CAPA_APLICACION_KARTA3.md ni INFRAESTRUCTURA_KARTA3.md.**

Commits locales. **No hacer push, crear PR, desplegar ni abrir otro bloque desde este encargo.**
