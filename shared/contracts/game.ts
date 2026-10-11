export type CardView = {
  id: string; name: string; characteristic: string; imageUrl: string | null; imageAlt: string;
  values: Record<string, { playValue: number; displayValue: string; unit: string }>;
  roundAttribute: string; note: string;
};
export type Direction = 'HIGH' | 'LOW';
export type GameContext = { roomId: string; gameId: string; roundNumber: number; turnId: string };
export type OpeningDirectionRequest = GameContext & { requestId: string; direction: Direction };
export type PlayCardRequest = GameContext & { requestId: string; cardId: string; direction: Direction | null };
export type CancelGameRequest = { requestId: string; roomId: string; gameId: string };
export type RoundResultView = {
  id: string; roundNumber: number; kind: 'BASE' | 'TIE_BREAK';
  ranking: { playerId: string; card: CardView; playValue: number; position: number }[];
  winnerPlayerId: string; nextOpenerPlayerId: string | null; awardedCardCount: number;
};
export type TurnTiming = { serverNow: number; startedAt: number; endsAt: number };
export type TurnExpiredEvent = { id: string; roomId: string; gameId: string; roundNumber: number;
  turnId: string; playerId: string; automatic: boolean };
export type InitialGameView = {
  id: string; phase: 'PLAYING' | 'FINAL_PHASE' | 'TIE_BREAK' | 'FINISHED'; execution: 'TIMED_TURNS';
  attributes: { id: string; name: string; unit: string }[];
  round: { number: number; kind: 'BASE' | 'TIE_BREAK'; finalRoundIndex: number | null; playerIds: string[];
    state: 'WAITING_FOR_DIRECTION' | 'WAITING_FOR_PLAYS' | 'RESOLVED'; openerPlayerId: string; indicator: CardView;
    activeAttributeId: string; direction: Direction | null; plays: { playerId: string; card: CardView; order: number; mode: 'MANUAL' | 'TIMEOUT' | 'AUTOMATIC' | 'BOT' }[] };
  drawPileCount: number; hand: CardView[]; ownConsecutiveTimeouts: 0 | 1 | 2 | null;
  interaction: { stage: 'AWAITING_PLAY' | 'ROUND_REVIEW'; turn: { id: string; playerId: string; timing: TurnTiming | null } | null;
    openingSelection: { direction: Direction | null } | null;
    review: { id: string; serverNow: number; endsAt: number; nextStage: 'ROUND' | 'TIE_BREAK' | 'RESULTS'; result: RoundResultView } | null };
};
export type RoundResolvedEvent = { roomId: string; gameId: string; result: RoundResultView };
