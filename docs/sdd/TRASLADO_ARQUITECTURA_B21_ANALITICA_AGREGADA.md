# Traslado propuesto a Arquitectura — B21, alternativa A

**20/10/2026. Solo texto para revisión/traslado del autor.** No se han editado TFM o código. La decisión posterior aprueba sustituir el subsistema sobre el producto actual, empezar desde cero, prescindir de compatibilidad/histórico y admitir interrupción/pérdidas declaradas. [B21](BLOQUE_21_SUSTITUCION_ANALITICA_AGREGADA.md) concreta la construcción; la autorización de implementación, operación y borrado sigue separada.

Mantener la referencia ARQ-AGREGADOS-2026-10-20 identificando este ajuste de alcance posterior, sin fingir que su primera propuesta ya estaba implementada. Las siguientes son redacciones concretas para sustituir/agregar en los apartados indicados; las métricas, privacidad y capas no mencionadas conservan su norma.

**Conclusión posterior recibida y confirmada20/10:** [condiciones por familia](DECISION_CONDICIONES_B21_2026_10_20.md) y cautela de transición. No queda una nueva aprobación jurídica genérica a cargo de Implementación; sí faltan código, evidencia técnica y autorizaciones operativas.

## 1. Aplicación §16.4 — estado y alcance

> El autor adopta la alternativa A: sustituir íntegramente la analítica sobre el código actual, conservando juego, reglas, barajas, apariencia funcional B20/persistencia y sus correcciones visuales. El modelo agregado empieza desde cero. No habrá migración, lector antiguo, convivencia o reconstrucción de relaciones individuales. Se admite interrupción de actualización y discontinuidad estadística declarada; no se presenta pérdida como cero ni se inventan finales. B19 desplegado y B20/adenda locales mantienen su estado/evidencia histórica. B21 está especificado, no implementado o activado por esta alineación.

## 2. Aplicación §§16.4.1 y 16.4.5 — metadatos y exactitud

> El nuevo archivo contiene celdas, cobertura/calidad y metadatos administrativos mínimos, sin cursor durable ni historial de lotes. La deduplicación de hechos y correlación de salas/partidas/fotos vive solo RAM acotada. El reductor admite completa cada unidad y reduce antes del puerto/cola; snapshot o identificadores no alcanzan el escritor. Normalmente hay una única emisión por hecho y un lote en vuelo; ante error se pausa sin reejecutar el lote. La garantía aceptada es correctitud de transacciones/balances y declaración conservadora de pérdidas, no entrega exactamente una vez entre procesos.

## 3. Infraestructura §12.3.1 — almacén y esquemas

> El único almacén estadístico consumido por el producto nuevo es AGG_DAILY_V1, en un archivo privado distinto de las bases anteriores y con esquema propio inicial1. No se incrementa/migra el esquema1/2/3 existente ni se conservan sus lectores, Subjects, eventos, referencias o recibos. Apertura exige metadatos nuevos compatibles; un archivo antiguo, inesperado o corrupto produce indisponibilidad, nunca conversión o vaciado automático. La inicialización desde cero es explícita. El almacenamiento anterior no se borra por arrancar la versión nueva; se retirará mediante autorización e inventario operativos separados.

## 4. Infraestructura §12.3.2 — reemplazar pasos4–6 de cursor/reintento

> Agrupar unidades completas en un lote limitado e inmutable, con máximo un vuelo. El writer exclusivo aplica deltas, balances y calidad en una transacción y confirma después de COMMIT. No hay cursor durable, hashes para reconocer lotes ni journal. Identificadores de mensajes/generación solo viven RAM.
>
> No reenviar lotes fallidos o con compromiso incierto. Un timeout de ack no implica rollback: conservar lo realmente comprometido, pausar admisión y descartar pendientes RAM sin replay. Antes de sanear se cierra/verifica el writer anterior y se obtiene exclusión mutua; si no puede acreditarse, permanecer pausado. Callbacks antiguos no confirman vuelos nuevos. La admisión202 solo acredita cola, no durabilidad.
>
> La exclusión sigue ordenándose en RAM antes de confirmar y corta futuras admisiones; las unidades ya admitidas son contribuciones anteriores aunque se escriban después. No se incorpora la barrera durable/recibo individual de B19.

## 5. Infraestructura §12.3.3 y §14.2 — recuperación proporcionada

> Al reiniciar o recuperarse de un fallo, reclasificar en una transacción los saldos abiertos durables como desconocidos/calidad y dejarlos a cero. Repetir con saldos saneados no añade desconocidos. No reconstruir alta/terminal/foto, reducir denominadores o atribuir duración a lo desconocido. El arranque solo admite ciclos nuevos tras ese saneamiento. Una parada controlada puede constatar interrupción técnica estadística con RAM válida, nunca resultado Game o END ficticio.
>
> Conservar cotas de correlación, ingesta, cola, reserva, lote, edad, espacio, lectura y drenaje. Sustituir reintentos1/5/30s y cursor por **un único envío del lote, sin repetición SQL**. Tras una incidencia puede hacerse un intento acotado de reapertura/saneamiento; fallo posterior deja analítica PAUSED hasta actuación administrativa/rearranque. No bucle o nueva garantía de continuidad. Juego sigue independiente; declarar huecos/cantidad desconocida y no prometer RPO250ms, pérdidas físicas recuperables o alta disponibilidad.

## 6. Aplicación §16.4.9 e Infraestructura §15.3.1 — histórico y mantenimiento

> Se retira la obligación de que la aplicación nueva lea, mantenga, convierta o consulte históricos B18–B20 y sus recibos. Las estadísticas nuevas comienzan desde cero, sin sumas/reproyección o comparación que las haga series equivalentes. Se acepta perder los datos anteriores mediante una operación posterior expresamente delimitada, no ejecutada desde SDD o por el arranque/mantenimiento nuevo.
>
> El paquete operativo identificará qué archivos antiguos se preservan temporalmente para retorno y cuáles se borrarán tras autorización, incluidos WAL, exportaciones/copias y tareas asociadas; no permanecerán instrucciones activas sin consumidores. No se elimina historial Git o evidencia del desarrollo. Nueva conservación: mes UTC actual y once anteriores; mantenimiento solo del nuevo esquema, también con captura OFF.

## 7. Aplicación §16.4.6 — vistas y apariencia conservadas

> El responsable concluye y el autor confirma: CREATION, JOIN, WAITING, GAME, CONFIGURATION, DURATION, AUTOMATIC y QUALITY por defecto bajo la ponderación de interés legítimo aportada; únicamente hechos ya conocidos por el servidor, sin nuevos envíos o lecturas del navegador para esas ocho familias. HOME por defecto bajo las condiciones de medición de audiencia adoptadas: presentaciones visibles agregadas, sin visitId, URL/referente/dispositivo, vínculo con sesión/sala/partida/otra visita o WordPress. No sustituirlas por GET/logs. Información y exclusión siguen siendo condiciones efectivas.
>
> APPEARANCE conserva cinco categorías, marginales y matriz5×5, con consentimiento previo separado del núcleo. No consultar ni enviar el tema con finalidad estadística antes de permiso válido. Tema funcional siempre disponible. Control propio Permitir/No permitir/Retirar, aviso vigente y sesión RAM con máximo12h sin renovación; reinicio/cambio de aviso invalidan permiso. Sin recibos nuevos individuales durables o dependencia de los antiguos. La comprobación de permiso ocurre en cliente antes de captura y en servidor antes de admisión; retirada corta apariencia propia, no núcleo/HOME u otras participaciones. No añadir contadores de elecciones del permiso.
>
> El servidor conoce la población humana inicial N sin consultar temas; las marginales/pares describen capturas consentidas recibidas, no toda la audiencia. Ausencia no significa rechazo. Mantener oportunidades vivas10s, dedupe RAM y reducción previa al writer; no fotos vinculadas en persistencia ni START reconstruido al aceptar tarde. La decisión de condiciones está cerrada; no se ha demostrado su implementación por documentarla.

## 8. Aplicación §16.4.7/16.4.8 — exclusión e información

> Acuerdos confirmados20/10: mantener información/control en «Analítica y privacidad», reemplazando el consentimiento general B19 por excluir o volver a incluir; conservar separado el consentimiento específico de apariencia. Cookie funcional propia de exclusión, solo versión/booleano, doce meses desde elección sin renovación por consultas. Quitarla solo permite operaciones futuras/ciclos nuevos; no concede apariencia o reabre ciclos compartidos cortados. Mantener efecto local inmediato, confirmación RAM servidor, pestañas, pendientes/offline y observador, sin impedir jugar o pedir SQLite/recibos para excluir.
>
> No mantener lectores de permisos/recibos anteriores ni reconstruir restricciones mediante el histórico. Para respetar exclusiones conocidas pese a la pérdida de RAM de B19, el autor confirma una cautela: cookie funcional anterior y nueva preferencia ausente→sin medición hasta elección explícita de incluirse o excluirse; sesiones nuevas conservan el régimen por defecto. Estado conservador tras pérdida de RAM, sin persistir antigüedad o añadir ids. No impedir jugar, contar quién se excluye o revivir el ciclo. La aceptación anterior nunca otorga consentimiento nuevo de apariencia. Esta regla sustituye expresamente la anterior prohibición de cautela por cookie vieja.
>
> La nueva información distingue interés legítimo del núcleo, condiciones de HOME y consentimiento de apariencia; no interpretar inacción como consentimiento ni agregación como prueba de exención. Mantener la protección de celdas escasas y revisión antes de compartir; tampoco usar las estadísticas para evaluar individualmente a menores. La propuesta factual de aviso se completa en B21, sin editar todavía el aviso ejecutado por la aplicación.

## 9. Infraestructura §15.3.2 — reemplazar política automática propuesta de escasez

> El autor elige consultas/CSV privados por días UTC cerrados, dimensiones fijas y sin cruces, con revisión del responsable antes de compartir resultados. No se implementa umbral automático de cinco, supresión de familias, bloques mensuales obligatorios o un motor genérico. No ofrecer día actual, intervalos de minutos, API pública, dashboard o consultas SQL libres. Informar calidad, pendientes/provisional y bases; un día calendario cerrado puede recibir terminales de su cohorte.
>
> Acceso administrativo y agregación no acreditan anonimato. La revisión de riesgos/condiciones del tratamiento por familia permanece; los informes no deben difundirse sin la revisión acordada. No prometer publicabilidad o anonimato con un umbral, lectura privada o eliminación de IDs.

## 10. Infraestructura §15.3.3 — copias, actualización única y retorno

> Reutilizar volumen/permisos, copia cifrada de agregados, siete rotatorias y restauración aislada del esquema nuevo; no mantener lector/copia de formatos anteriores en el ejecutable nuevo. Restaurar no activa captura ni reconstruye Game/relaciones. No recuperar archivos vencidos o ampliar conservación por copia.
>
> Una única actualización puede arrancar directamente en el modo aprobado tras autorización, con interrupción admitida y archivo nuevo. No exigir despliegue OFF previo, convivencia o transición continua. Ante fallo se vuelve a imagen/configuración anterior y su ubicación/formato compatible, o a juego con analítica OFF; nunca abrir AGG con ejecutable viejo. Borrar datos antiguos es otra actuación autorizada; si ya no existen, el retorno no los recupera. No añadir Windows/DPAPI, nuevo destino externo obligatorio o descarga diaria al PC.

## 11. Aplicación §16.4.10 — estado actualizado de pendientes

> La alternativa A, simplificaciones, política diaria privada/revisión, ubicación/cookie doce meses, condiciones por familia y cautela anterior están confirmadas. No queda la conclusión sobre familias o una aprobación RGPD genérica pendiente: falta implementar y comprobar técnicamente esas condiciones, registrar la información factual y recibir la alineación. El autor autoriza por separado código, paquete/publicación/actualización y borrado. No volver a plantear como abiertos conservación del histórico, lectores antiguos, cursor/reintentos, arquitectura B o los acuerdos confirmados; tampoco convertir esta recepción en activación o pruebas ejecutadas.

**Cierre del traslado:** el autor lo revisará y enviará a Arquitectura. Su recepción se registrará en B21 antes del cierre global; no afirmar alineación efectuada por crear este texto. Sin fuentes TFM editadas, mensajes, código, pruebas de producto, borrado o operación.
