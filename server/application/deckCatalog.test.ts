import { expect, it } from 'vitest';
import { ListDecks } from './deckCatalog.js';
import type { DeckSummary } from '../../shared/contracts/deck.js';

it('B04-11 puerto sustituible y proyección explícita: no transmite propiedades internas', () => {
  const entry = { id: 'fixture', schemaVersion: 2, contentVersion: 2, name: 'Nombre', subtitle: '', description: 'Descripción', imageUrl: null, imageAlt: '', cards: ['secreto'], notes: 'interno', publication: { available: true } };
  const list = new ListDecks({ summaries: () => [entry as DeckSummary] });
  const response = list.execute();
  expect(response).toEqual({ decks: [{ id: 'fixture', schemaVersion: 2, contentVersion: 2, name: 'Nombre', subtitle: '', description: 'Descripción', imageUrl: null, imageAlt: '' }] });
  expect(response.decks[0]).not.toBe(entry);
  expect(new ListDecks({ summaries: () => [] }).execute()).toEqual({ decks: [] });
});
