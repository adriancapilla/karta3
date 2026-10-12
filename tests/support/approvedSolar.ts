import type { DeckSummary } from '../../shared/contracts/deck.js';
import { approvedGeneric } from './approvedGeneric.js';

/** Entrega existente activada por el autor en B14, independiente del lector probado. */
export const approvedSolar: DeckSummary = {
  id: 'sistema-solar', schemaVersion: 1, contentVersion: 2,
  name: 'Sistema Solar', subtitle: '',
  description: 'Baraja educativa de KARTA3 con 58 cuerpos del Sistema Solar y tres atributos: velocidad orbital máxima, distancia orbital media y diámetro medio o efectivo. Los valores jugables de 1 a 58 se presentan separados de los datos científicos informativos.',
  imageUrl: '/media/decks/sistema-solar/v2/imagenes/portada.webp',
  imageAlt: 'Composición del Sistema Solar con el Sol, varios planetas, una luna, un asteroide y un cometa sobre un fondo estrellado.'
};
export const approvedInstalledDecks = [approvedGeneric, approvedSolar];
