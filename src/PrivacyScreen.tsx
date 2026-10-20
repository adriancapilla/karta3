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
    <h2>Datos y referencias temporales</h2>
    <p>Fechas, resultados de operaciones y configuración inicial: baraja/versiones, cantidades de humanos/bots por dificultad, anfitrión jugador/observador, tiempos, desempate y opciones compartidas de presentación. Sin servicio externo de analítica o seguimiento entre visitas.</p>
    <p>Las referencias aleatorias relacionan hechos permitidos de una visita, sala, partida o participación. La visita solo vive en memoria de la pestaña, cambia al recargar y tiene límites de treinta minutos sin un hecho permitido y doce horas. No se guarda en cookies o almacenamiento persistente del navegador ni crea un historial entre salas.</p>
    <h2>Elección, plazos y acceso</h2>
    <p>La base para estas estadísticas es tu consentimiento. Rechazar no cambia el juego. La elección se aplica a las pestañas de la misma sesión funcional durante un máximo de doce horas; no sirve para reconocerte estadísticamente. Puedes retirar el permiso mediante «Analítica y privacidad» → «Retirar permiso», sin correo ni reiniciar la partida. Si falla la conexión, se muestra que está pendiente.</p>
    <p>Detalle durante un máximo de noventa días; resúmenes mensuales sin referencias individuales durante doce meses incluido el actual. Un recibo mínimo de versión, aceptación, vencimiento y retirada queda separado de los eventos, sin nombre o credenciales, y se elimina como máximo noventa días tras vencer o retirarse. No se incluye en las copias cifradas de agregados.</p>
    <p>Los informes son privados para responsables autorizados. Las copias cifradas solo recuperan agregados, no detalle perdido con el disco, partidas o sesiones. Se podrán usar resúmenes revisados sin identificadores en el TFM.</p>
    <p>{privacyOperations.hosting}</p><p>{privacyOperations.backups}</p>
    <h2>Sesión y registros técnicos</h2>
    <p>La cookie funcional karta3_session permite recuperar la sesión de juego, tiene un plazo configurado de hasta treinta días y no se usa como identificador estadístico. El estado jugable vive en RAM y se pierde al reiniciar. Lo que compartes para jugar se muestra al resto según las reglas de la sala; la mano es privada. La red procesa direcciones para servir solicitudes; eso no las incorpora a la analítica.</p>
    <p>{privacyOperations.technicalLogs}</p>
    <h2>Retirada, derechos y límites</h2>
    <p>Retirar corta observaciones futuras y no borra automáticamente datos previos tratados lícitamente. Una sala con cobertura incompleta no se presenta como abandonada o terminada; los informes no representan a toda la audiencia pública. Una vista no equivale a una persona única ni automático prueba abandono voluntario.</p>
    <p>Puedes contactar con {privacyNotice.contact} para ejercer los derechos aplicables y reclamar ante la AEPD. Puede que no podamos asociar un correo con eventos concretos; no pediremos contraseñas, cookies o tokens.</p>
    <p>{privacyOperations.representatives}</p><a href="/">Volver al juego</a>
  </main>;
}
