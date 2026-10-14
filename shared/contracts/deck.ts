export type DeckSummary = Readonly<{
  id: string;
  schemaVersion: 2;
  contentVersion: number;
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
}>;
export type DecksResponse = Readonly<{ decks: readonly DeckSummary[] }>;
export type DeckInformationView = Readonly<{ id: string; contentVersion: number; instructions: string }>;
