import type { DecksResponse, DeckSummary } from '../../shared/contracts/deck.js';

export interface DeckCatalog {
  summaries(): readonly DeckSummary[];
}

export class ListDecks {
  constructor(private readonly catalog: DeckCatalog) {}

  execute(): DecksResponse {
    return { decks: this.catalog.summaries().map((deck) => ({
      id: deck.id, schemaVersion: deck.schemaVersion, contentVersion: deck.contentVersion,
      name: deck.name, subtitle: deck.subtitle, description: deck.description,
      imageUrl: deck.imageUrl, imageAlt: deck.imageAlt
    })) };
  }
}
