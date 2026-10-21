import { STATISTICS_NOTICE_VERSION } from './statistics.js';

/** Información pública factual recibida el19/10; no acredita autorización de recogida. */
export type PrivacyOperations = { hosting: string; backups: string; technicalLogs: string; representatives: string };
// Fuente: TFM/Planificación/despliegue_pruebas/PREPARACION_B19_2026-10-19.md §8.
export const privacyOperations: PrivacyOperations = {
  hosting: 'Pruebas se aloja en un VPS de Hostinger situado en París, Francia. Las copias de servidor mostradas en el panel del proveedor están en Alemania. Hostinger presta el alojamiento y gestiona esas copias. Estas ubicaciones no garantizan que todos los accesos de soporte del proveedor se realicen desde ellas. KARTA3 no utiliza un servicio externo de analítica.',
  backups: 'Hostinger mantiene copias completas del VPS con programación semanal. Su política publicada conserva dos copias semanales y sustituye las más antiguas por nuevas; no se garantiza aquí un número fijo de días. Pueden incluir archivos estadísticos anteriores y registros que existieran al crearlas. El mantenimiento del nuevo almacén no elimina inmediatamente esas copias del proveedor, reservadas para recuperación administrativa. Antes de reabrir un sistema restaurado se mantendrá la captura apagada y se aplicará mantenimiento a los datos vencidos, sin recuperar permisos o partidas anteriores. Con el almacén nuevo y la clave de copia configurados, KARTA3 prepara copias cifradas únicamente de agregados: un máximo de siete, retiradas también si incluyen meses fuera de la ventana de doce meses. Esas copias no recuperan partidas, relaciones individuales o datos no respaldados. La restauración completa del proveedor no se ha ensayado y su tiempo mostrado es una estimación.',
  technicalLogs: 'La aplicación y el proxy conservan registros técnicos de funcionamiento y diagnóstico separados de la analítica. Docker usa el controlador local y rotación por tamaño: hasta cinco archivos de diez MiB por contenedor. Su antigüedad depende de la actividad y la rotación; no se promete un plazo fijo en días. Se consultan para administrar el servicio y resolver incidencias, con acceso administrativo. Esta configuración no determina los plazos de otros registros del sistema o del proveedor. Los registros técnicos no se incorporan a las estadísticas de uso.',
  representatives: 'El contacto para esta información y para ejercer los derechos aplicables es el del responsable, Adrián Capilla López: k3k314com@gmail.com.'
};
export const privacyNotice = {
  version: STATISTICS_NOTICE_VERSION,
  responsible: 'Adrián Capilla López', contact: 'k3k314com@gmail.com',
  firstLayer: 'KARTA3 utiliza estadísticas agregadas de uso para mejorar el servicio y evaluar el TFM. Puedes excluir tu actividad sin dejar de jugar. Solo medimos la apariencia de inicio y final con tu permiso. Consulta los detalles en Analítica y privacidad.',
  minorCaution: 'Si tienes menos de catorce años, pide que tu madre, padre o tutor decida sobre el permiso de apariencia. Puedes seguir jugando sin permitirlo.',
  appearanceLocal: 'Puedes elegir Claro, Oscuro, Crema o Alto contraste. Recordamos únicamente ese tema en este navegador para aplicarlo en próximas visitas; no sincronizamos la elección entre dispositivos. Si el almacenamiento no está disponible, se conserva durante la página abierta. Puedes usar Apariencia aunque rechaces la analítica.',
  appearanceCapture: 'Solo con tu consentimiento previo medimos qué tema utilizas y si era predeterminado o elegido al entrar en la mesa inicial y recibir su final, y las distribuciones agregadas de esos pares. Puedes permitirlo, no permitirlo o retirar el permiso desde Estadísticas de apariencia. El permiso dura como máximo doce horas en la sesión funcional y se pierde al reiniciar el servicio o cambiar el aviso. No registramos cada cambio ni tiempo por tema; bots y observadores no aportan fotografías. No reconstruimos el inicio si permites después ni el final si falta la comunicación. Consultar un resultado después no registra su tema final. Retirar este permiso no desactiva las otras métricas; excluir las estadísticas detiene futuras contribuciones de ambas. Los informes describen uso observado, no preferencias demostradas ni personas únicas.',
  complete: completeOperations(privacyOperations)
} as const;
function completeOperations(value: PrivacyOperations | undefined) {
  return !!value && Object.values(value).every(text => typeof text === 'string' && text.trim().length > 0 && !/pendiente|completar|placeholder|\[|\]/i.test(text));
}
