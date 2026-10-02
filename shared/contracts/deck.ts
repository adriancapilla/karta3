export type DeckSummary = Readonly<{
  id: string;
  schemaVersion: 1;
  contentVersion: number;
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
}>;
export type DecksResponse = Readonly<{ decks: readonly DeckSummary[] }>;
