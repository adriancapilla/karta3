export type CardView = {
  id: string; name: string; characteristic: string; imageUrl: string | null; imageAlt: string;
  values: Record<string, { playValue: number; displayValue: string; unit: string }>;
  roundAttribute: string; note: string;
};
export type Direction = 'HIGH' | 'LOW';
export type GameContext = { roomId: string; gameId: string; roundNumber: number; turnId: string };
export type OpeningDirectionRequest = GameContext & { requestId: string; direction: Direction };
export type PlayCardRequest = GameContext & { requestId: string; cardId: string; direction: Direction | null };
export type RoundResultView = {
  id: string; roundNumber: number; kind: 'BASE' | 'TIE_BREAK';
  ranking: { playerId: string; card: CardView; playValue: number; position: number }[];
  winnerPlayerId: string; nextOpenerPlayerId: string | null; awardedCardCount: number;
};
export type InitialGameView = {
  id: string; phase: 'PLAYING' | 'FINAL_PHASE' | 'TIE_BREAK' | 'FINISHED'; execution: 'MANUAL_WITHOUT_TURN_TIMEOUT';
  attributes: { id: string; name: string; unit: string }[];
  round: { number: number; kind: 'BASE' | 'TIE_BREAK'; finalRoundIndex: number | null; playerIds: string[];
    state: 'WAITING_FOR_DIRECTION' | 'WAITING_FOR_PLAYS' | 'RESOLVED'; openerPlayerId: string; indicator: CardView;
    activeAttributeId: string; direction: Direction | null; plays: { playerId: string; card: CardView; order: number; mode: 'MANUAL' }[] };
  drawPileCount: number; hand: CardView[];
  interaction: { stage: 'AWAITING_PLAY' | 'ROUND_REVIEW'; turn: { id: string; playerId: string } | null;
    openingSelection: { direction: Direction | null } | null;
    review: { id: string; serverNow: number; endsAt: number; nextStage: 'ROUND' | 'TIE_BREAK' | 'RESULTS'; result: RoundResultView } | null };
};
export type RoundResolvedEvent = { roomId: string; gameId: string; result: RoundResultView };
