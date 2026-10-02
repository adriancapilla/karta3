import type { DecksResponse, DeckSummary } from '../../shared/contracts/deck.js';

export interface DeckCatalog {
  summaries(): readonly DeckSummary[];
}

export type DeckVersionResult = { ok: true; summary: DeckSummary }
  | { ok: false; reason: 'DECK_NOT_AVAILABLE' | 'DECK_VERSION_MISMATCH' };
export interface PublishedDeckVersions {
  resolveVersion(id: string, contentVersion: number): DeckVersionResult;
}

export function publicDeckSummary(deck: DeckSummary): DeckSummary {
  return { id: deck.id, schemaVersion: deck.schemaVersion, contentVersion: deck.contentVersion,
    name: deck.name, subtitle: deck.subtitle, description: deck.description,
    imageUrl: deck.imageUrl, imageAlt: deck.imageAlt };
}

export class ListDecks {
  constructor(private readonly catalog: DeckCatalog) {}

  execute(): DecksResponse {
    return { decks: this.catalog.summaries().map(publicDeckSummary) };
  }
}
