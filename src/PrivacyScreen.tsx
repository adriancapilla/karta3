import { privacyNotice, privacyOperations } from '../shared/contracts/privacyNotice';

/** Entrada independiente: no hooks de juego, cookies, visita ni consulta de elección. */
export function PrivacyScreen() {
  if (!privacyNotice.complete || !privacyOperations) return <main className="shell"><h1>Información de privacidad no disponible</h1><a href="/">Volver al juego</a></main>;
  return <main className="shell privacy-information">
    <h1>Privacidad y analítica</h1><p>Versión {privacyNotice.version}</p>
    <h2>Quién y para qué</h2><p>Responsable: {privacyNotice.responsible}. Contacto: <a href={`mailto:${privacyNotice.contact}`}>{privacyNotice.contact}</a>.</p>
    <p>{privacyNotice.firstLayer}</p><p>{privacyNotice.minorCaution}</p>
    <h2>Apariencia personal y fotografías de uso</h2>
    <p>{privacyNotice.appearanceLocal}</p><p>{privacyNotice.appearanceCapture}</p>
    <h2>Datos agregados y bases por finalidad</h2>
    <p>La finalidad es conocer volumen, configuraciones utilizadas, dificultades operativas y terminación para mejorar KARTA3 y documentar su evaluación en el TFM, sin evaluar capacidad, rendimiento escolar, salud o personalidad ni tomar decisiones sobre jugadores.</p>
    <p>Las métricas de salas y entradas, opciones de inicio, partidas, duración, finalización, automático y calidad se apoyan en el interés legítimo y la ponderación adoptada para este alcance limitado. Proceden de hechos que el servidor ya conoce para jugar. La configuración se reduce a distribuciones separadas, sin guardar la combinación de una partida.</p>
    <p>La portada se mide mediante un contador de presentaciones bajo las condiciones de medición de audiencia adoptadas: sin identificar visitas ni relacionarlas con sesiones, partidas u otros sitios. Una recarga puede sumar otra presentación; no medimos personas únicas o recurrencia.</p>
    <p>Usamos temporalmente el contexto mínimo en memoria para contar una sola vez y relacionar los dos momentos de apariencia. Guardamos únicamente contadores y distribuciones por día, sin historial individual de visitas, salas, partidas o fotografías. La correlación tiene un máximo de dos horas por ciclo y las oportunidades de captura duran diez segundos. Las pérdidas y reinicios se señalan y pueden dejar huecos. Los agregados no se presentan como necesariamente anónimos por su estructura.</p>
    <h2>Elección, plazos y acceso</h2>
    <p>Puedes excluir tu actividad desde Analítica y privacidad. Recordamos solo esa preferencia funcional en este origen durante doce meses desde tu elección, sin renovarla por consultas; no se comparte entre dispositivos o perfiles. Si falla el almacenamiento, explicamos el alcance temporal disponible. Sin conexión, el corte local queda pendiente de confirmación del servidor. La exclusión de un humano también interrumpe futuras contribuciones del ciclo compartido, sin revelar quién lo solicitó. Quitarla afecta solo a operaciones futuras y ciclos nuevos.</p>
    <p>Las contribuciones admitidas antes del corte pueden guardarse después; no conservamos enlaces para localizar una contribución individual dentro del agregado. Los informes son privados y revisamos las salidas antes de compartirlas. Conservamos el mes UTC actual y los once anteriores, también al gestionar copias y exportaciones. El modelo comienza desde cero; los datos anteriores no se convierten ni suman a esta serie. La apariencia funcional y el juego funcionan al excluir las estadísticas.</p>
    <p>Si traes una sesión anterior y no tenemos la nueva preferencia, no medimos hasta que elijas incluirte o excluirte; tampoco usamos una aceptación anterior como permiso nuevo de apariencia. No es obligatorio decidir para jugar.</p>
    <p>{privacyOperations.hosting}</p><p>{privacyOperations.backups}</p>
    <h2>Sesión y registros técnicos</h2>
    <p>La cookie funcional karta3_session permite recuperar la sesión de juego, tiene un plazo configurado de hasta treinta días y no se usa como identificador estadístico. El estado jugable vive en RAM y se pierde al reiniciar. Lo que compartes para jugar se muestra al resto según las reglas de la sala; la mano es privada. La red procesa direcciones para servir solicitudes; eso no las incorpora a la analítica.</p>
    <p>{privacyOperations.technicalLogs}</p>
    <h2>Retirada, derechos y límites</h2>
    <p>Retirar corta observaciones futuras y no borra automáticamente datos previos tratados lícitamente. Una sala con cobertura incompleta no se presenta como abandonada o terminada; los informes no representan a toda la audiencia pública. Una vista no equivale a una persona única ni automático prueba abandono voluntario.</p>
    <p>Puedes contactar con {privacyNotice.contact} para ejercer los derechos aplicables y reclamar ante la AEPD. No prometemos localizar una contribución individual que ya no conservamos vinculada; no pediremos contraseñas, cookies o tokens.</p>
    <p>{privacyOperations.representatives}</p><a href="/">Volver al juego</a>
  </main>;
}
