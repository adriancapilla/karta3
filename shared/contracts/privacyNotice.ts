import { USAGE_NOTICE_VERSION } from './usage.js';

/** Información pública, nunca secretos. Falta inventario confirmado: no habilita HUMAN. */
export type PrivacyOperations = { hosting: string; backups: string; technicalLogs: string; representatives: string };
export const privacyOperations: PrivacyOperations | undefined = undefined;
export const privacyNotice = {
  version: USAGE_NOTICE_VERSION,
  responsible: 'Adrián Capilla López', contact: 'k3k314com@gmail.com',
  firstLayer: 'KARTA3 puede medir el uso del MVP para su TFM: portadas, salas, configuración y desarrollo general de partidas. Solo recogerá estas estadísticas con tu permiso. Puedes jugar igual si las rechazas y retirar el permiso desde «Analítica y privacidad». No usamos cookies estadísticas ni buscamos reconocerte entre visitas. No incluimos tu nombre, código de sala, IP o mano de cartas en la analítica.',
  minorCaution: 'Si tienes menos de catorce años, pide que tu madre, padre o tutor decida sobre estas estadísticas. Puedes seguir jugando sin aceptarlas.',
  complete: completeOperations(privacyOperations)
} as const;
function completeOperations(value: PrivacyOperations | undefined) {
  return !!value && Object.values(value).every(text => typeof text === 'string' && text.trim().length > 0 && !/pendiente|completar|placeholder|\[|\]/i.test(text));
}
