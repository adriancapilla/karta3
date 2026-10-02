import type { DeckSummary } from '../../shared/contracts/deck.js';

/** Resumen esperado de la entrega aprobada en ACTIVACION_GENERICA_V2 §2, independiente del lector probado. */
export const approvedGeneric: DeckSummary = {
  id: 'generica', schemaVersion: 1, contentVersion: 2,
  name: 'KARTA3 — Baraja genérica', subtitle: '',
  description: 'Baraja abstracta de 58 cartas para aprender a jugar a KARTA3 y apoyar el desarrollo inicial. Cada carta tiene tres atributos, Círculo, Triángulo y Cuadrado, con valores jugables únicos del 1 al 58 por atributo y un indicador del atributo activo cuando aparece como carta central.',
  imageUrl: null, imageAlt: ''
};
