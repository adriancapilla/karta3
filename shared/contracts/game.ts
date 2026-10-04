export type CardView = {
  id: string; name: string; characteristic: string; imageUrl: string | null; imageAlt: string;
  values: Record<string, { playValue: number; displayValue: string; unit: string }>;
  roundAttribute: string; note: string;
};
export type InitialGameView = {
  id: string; phase: 'PLAYING'; execution: 'INITIAL_TABLE_ONLY';
  attributes: { id: string; name: string; unit: string }[];
  round: { number: 1; state: 'WAITING_FOR_DIRECTION'; openerPlayerId: string; indicator: CardView;
    activeAttributeId: string; direction: null; plays: never[] };
  drawPileCount: number; hand: CardView[];
};
