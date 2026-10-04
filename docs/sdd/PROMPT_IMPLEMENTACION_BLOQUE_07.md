# Encargo de implementación — B07

Implementa **B07: partida manual completa con humanos**, conforme a la especificación acordada el 04/10/2026:

`E:\KARTA3\KARTA3_IA\APP\karta3\docs\sdd\BLOQUE_07_PARTIDA_MANUAL_COMPLETA.md`

## Preparación y base

Trabaja en `E:\KARTA3\KARTA3_IA\APP\karta3`. Lee AGENTS, proceso SDD, B07, organización/dependencias, B06/contratos/cierre, contrato de barajas y las secciones citadas de dominio/aplicación/infraestructura/contexto en `E:\KARTA3\KARTA3_IA\TFM\Planificación`.

Comprueba rama, HEAD, estado local y base efectiva antes de editar. La preparación observó rama `feat/b06-inicio-mesa-inicial`, HEAD `f3aca75676c4b3590b875d4c49aa48dfd219eb29`, y main `4dd073d58bd9efa6222fc7b90ccb93eadc10fa4c`; árbol limpio antes de añadir documentos B07. B06 está implementado/verificado localmente y probado manualmente según su cierre/coordinación.

**B07 depende de B06.** Trabaja en una rama B07 desde esa entrega o un sucesor compatible que la contenga —por ejemplo `feat/b07-partida-manual-completa`—, conservando estos documentos y cualquier cambio existente. No partir del main anterior ni restaurar/descartar trabajo para volver a él. Si B06 ya se integró mediante squash, comprueba la entrega efectiva y registra la base compatible, sin exigir que conserve el mismo SHA. Los resultados B06 son históricos, no pruebas B07.

## Etapas comprobables dentro del bloque

1. **M1 — Apertura/jugadas.** Ampliar Game/casos de uso/contratos y UI para ALTO/BAJO→carta y carta→ALTO/BAJO, sin valores predeterminados ni confirmación adicional. Dirección parcial modificable en servidor, privada del abridor y sus pestañas; carta parcial solo local. Recuperar solo dirección y nunca enviar por recuperación/evento remoto. Pulsar carta propia del jugador de turno envía inmediatamente. Detalles no juega. Usar eventos, contexto de Game/ronda/turno, errores y ack de B07 §5.
2. **M2 — Resolver/reponer.** Orden circular desde abridor con lista base estable; anfitrión jugador al final. Dominio compara playValue activo según HIGH/LOW, primero gana N cartas/puntos y segundo abre; reposición circular desde segundo y adquisición al final. Una jugada/última jugada/revisión se aplican una vez, con conservación de las 58 cartas. Revisión de aplicación según configuración, cuenta atrás solo de revisión, sin aceptar jugadas siguientes antes de avanzar. Revisión cero comunica antes de continuar y muestra aviso breve de cinco segundos sin pausa artificial ni resumen persistente.
3. **M3 — Fase final.** Cuando queda una carta en mazo y todos tienen tres, extraer indicador final una sola vez. Tres rondas con su atributo, nueva elección de dirección en cada una, sin reposición/nuevas indicadoras. Manos 3→2→1→0 y resolución/adjudicación completa antes de finalizar. Indicador final se descarta una vez al terminar su función.
4. **M4 — Desempate/resultados.** Solo si opción activa y empate máximo al finalizar base: barajar indicadoras descartadas, repartir conforme a fórmula, abrir primero de empatados en orden base y jugar una única ronda. Sin puntos/cartas ganadas nuevos, reposición ni segundo desempate. Revisar esa ronda antes de resultados. Pantalla específica con puestos/ganadores oficiales, observador aparte y retención de 30 minutos desde publicación final tras revisión. Retorno por sesión a todas sus pestañas y portada con «Ver último resultado», lectura autorizada sin revinculación/renovación. Otra sala nueva sin reiniciar ni revancha.

Prueba cada etapa antes de extender la siguiente; pertenecen al mismo bloque/cierre. No añadas otro bloque ni publicación intermedia.

## Garantías y organización

Implementa los contratos de B07 §5: vista segura por destinatario; dirección parcial solo propia; manos propias/observador sin mano; Game/ronda/turnId para rechazar mensajes nuevos obsoletos. Primera jugada completa válida gana carreras de pestañas. Dedupe por sesión/ID/tipo/contenido/contexto; repetir recupera estado actual sin reaplicar. Callbacks y vistas antiguos no avanzan otra ronda ni desplazan una sala nueva.

Reutiliza instantánea/presentación/entropía B06, sin reread de archivos ni acceso a ASSETS. Game gobierna reglas, puntos/cartas/desempate/clasificación; aplicación coordina permisos/parciales/revisión/resultados y proyección; infraestructura autentica/decodifica/almacena/planifica/emite; composición conecta adaptadores; React usa contratos seguros. Mantén B03 exclusivo de WAITING. No serialices Game, JSON completos, manos rivales, orden/IDs ocultos de mazo, credenciales o semillas en HTTP/ack/eventos/registros.

Separar roster/autorización del resultado de la asociación activa de sesión. Retorno/lectura/guardado no re-vinculan; expiración no borra índices de otra sala creada después ni medios compartidos. Registra estado y deduplicación antes de emitir; fallo de emisión/ack no repite resolución/reposición/barajado/finalización. El resultado retenido no constituye historial permanente.

Aprovecha GameScreen/GameCard/Detalles y la distribución B06. Añade solo interacción/estados/resultados necesarios: selección/pending, jugador actual, resultado/revisión, mano variable, fase final/desempate y clasificación. Mantén móvil 360/390, escritorio 1280, teclado/tacto/foco y scroll contenido, sin rediseño ni contador público de cartas por jugador.

## Comprobación y evidencia

Comprueba **B07-01–20, E1–E7 y §7**: partidas completas de 2–5, anfitrión jugador/observador, ambas aperturas/direcciones, fases finales, puntuación/conservación, empate con/sin desempate y reparto 1/2/3. Prueba revisión cero/positiva, límites/recuperación de resultados, varias sesiones/pestañas, pérdidas de confirmación, contexto antiguo, callbacks cancelados y nueva sala. Inspecciona forma/contenido exactos de HTTP/ack/eventos, no solo elementos ocultos de UI.

Conserva regresiones B01–B05/activación y garantías B06; adapta solo aserciones de la ausencia temporal de ejecución sin borrar su evidencia histórica. Fixtures completas deben ser paquetes/permutaciones validados y trazas de acciones humanas alcanzables; no asignar puntos ni saltar motor para afirmar partida completa. Mantén genérica formato 1/contenido 2 disponible intacta en APP/ASSETS. No crees catálogo/temáticas/activaciones nuevas.

Ejecuta **`npm run check`** y **`npm run test:browser`**/recorridos pertinentes sobre compilación vigente. Incluye revisión arquitectónica semántica, además de importaciones/ciclos. Distingue pruebas puras, reloj controlado, conexiones/entropía reales, emulación de móvil y manual humano. Registra comandos, entorno, base/commit, resultados reales por criterio y límites; no atribuyas media hora real o dispositivos físicos a un montaje simulado.

Deja y comprueba instrucciones manuales de B07 §7: dos sesiones, observador y dos invitados, parciales/recargas/varias pestañas, revisión, fase final, resultados y otra sala. Empates con trazas deterministas se prueban aparte; una partida normal sin empate no demuestra desempate. C09–C10 mantienen su cobertura acotada/parcial y no acreditan comprensión con usuarios ni equilibrio.

## Límites y cierre documental

No implementar límite/cuenta atrás de turno, timeout, automático, retirada por ausencia o vigilancia de dos minutos. Si alguien deja de actuar, espera su regreso. Conserva turnTimeout y muestra el aviso de ausencia de límite; no añadas opción permanente de modo manual. Revisión y conservación de resultados sí tienen plazos. Fuera bots, configuración de visualización, rediseño, despliegue y otro bloque.

Las decisiones funcionales están cerradas. Puedes escoger detalles internos de §6; consulta solo contradicción normativa nueva o cambio de comportamiento/arquitectura necesario, citando primero la regla. **La incoherencia del ejemplo 12/12/12/12/2 de dominio §24.2 ya está señalada:** no cambies reglas para reproducirla. Prueba mano reducida con caso alcanzable de cinco empatados a 10; entrega la errata a Arquitectura. No se exige otra revisión por simples cambios descriptivos compatibles.

Actualiza README vigente, evidencia/cierre B07 y descripción concreta del código en APP. Mantén las fuentes generales de TFM sin editar: **no modificar CONTEXTO_DESARROLLO_KARTA3.md, CAPA_APLICACION_KARTA3.md ni INFRAESTRUCTURA_KARTA3.md; tampoco corregir aquí DOMINIO_KARTA3.md**. Entrega conclusiones para coordinación/Arquitectura con acuerdos, ejemplo, límites, evidencias y pendientes para que sus responsables actualicen fuentes.

Marca implementado/verificado solo con cumplimiento y evidencia suficientes. Conserva históricos, commits locales y cambios existentes. **No hacer push, crear PR ni desplegar desde este encargo.**
