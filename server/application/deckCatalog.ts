import type { DecksResponse, DeckSummary, DeckInformationView } from '../../shared/contracts/deck.js';
import type { Deck } from '../domain/deck.js';

export interface DeckCatalog {
  summaries(): readonly DeckSummary[];
}

export type DeckVersionResult = { ok: true; summary: DeckSummary; information: DeckInformationView }
  | { ok: false; reason: 'DECK_NOT_AVAILABLE' | 'DECK_VERSION_MISMATCH' };
export interface PublishedDeckVersions {
  resolveVersion(id: string, contentVersion: number): DeckVersionResult;
}

export type CardPresentation = Readonly<{ id: string; imageUrl: string | null; imageAlt: string }>;
export type GameDeckSnapshot = Readonly<{ summary: DeckSummary; information: DeckInformationView; definition: Deck; presentation: readonly CardPresentation[] }>;
export type GameDeckResult = { ok: true; snapshot: GameDeckSnapshot } | { ok: false; reason: 'DECK_NOT_AVAILABLE' | 'DECK_VERSION_MISMATCH' };
/** Definición y presentación ya validadas de la misma versión, sin lectura de archivos al iniciar. */
export interface PublishedGameDecks { gameDeck(id: string, contentVersion: number): GameDeckResult }

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
