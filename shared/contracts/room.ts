import type { DeckSummary, DeckInformationView } from './deck.js';
import type { InitialGameView } from './game.js';

export type BotDifficulty = 'EASY' | 'HARD';
export type HumanParticipant = { id: string; name: string; kind: 'HUMAN'; role: 'HOST' | 'GUEST'; isPlayer: boolean; botDifficulty: null };
export type BotParticipant = { id: string; name: string; kind: 'BOT'; role: null; isPlayer: true; botDifficulty: BotDifficulty };
export type ParticipantView = HumanParticipant & { presence: 'CONNECTED' | 'RECONNECTING' }
  | BotParticipant & { presence: null };
export type BotOperation = { type: 'ADD' } | { type: 'DIFFICULTY'; botId: string; difficulty: BotDifficulty }
  | { type: 'RENAME'; botId: string; name: string } | { type: 'REMOVE'; botId: string };
export type AddBotRequest = { requestId: string; roomId: string };
export type ChangeBotDifficultyRequest = AddBotRequest & { botId: string; difficulty: BotDifficulty };
export type RenameBotRequest = AddBotRequest & { botId: string; name: string };
export type RemoveBotRequest = AddBotRequest & { botId: string };
export type BotResponse = { room: RoomView; botId: string };
export type RoomSettings = {
  deckId: string | null;
  deckContentVersion: number | null;
  hostPlays: boolean;
  turnSeconds: 15 | 30 | 60;
  forceTieBreak: boolean;
  reviewSeconds: 0 | 2 | 5 | 10 | 15 | 30;
  attributeValueMode: 'PLAY_VALUE' | 'DISPLAY_VALUE';
  optimizeForMobile: boolean;
};
export type ConfigurationChange =
  | { field: 'deck'; value: { id: string; contentVersion: number } | null }
  | { field: 'hostPlays' | 'forceTieBreak' | 'optimizeForMobile'; value: boolean }
  | { field: 'attributeValueMode'; value: RoomSettings['attributeValueMode'] }
  | { field: 'turnSeconds'; value: RoomSettings['turnSeconds'] }
  | { field: 'reviewSeconds'; value: RoomSettings['reviewSeconds'] };
export type ConfigureRoomRequest = { requestId: string; roomId: string; change: ConfigurationChange };
export type StartRoomRequest = { requestId: string; roomId: string };

export type WaitingRoomView = {
  id: string;
  code: string;
  status: 'WAITING';
  revision: number;
  participant: Extract<ParticipantView, { kind: 'HUMAN' }>;
  participants: ParticipantView[];
  lifecycle: { serverNow: number; expiresAt: number; warning: boolean };
  settings: RoomSettings;
  selectedDeck: DeckSummary | null;
  deckInformation: DeckInformationView | null;
};

export type GameParticipantView = HumanParticipant & { presence: 'CONNECTED' | 'DISCONNECTED'; score: number | null; playStatus: 'ACTIVE' | 'AUTOMATIC' | null }
  | BotParticipant & { presence: null; score: number; playStatus: null };
export type InitialGameRoomView = {
  id: string; code: string; status: 'IN_GAME'; revision: number;
  participant: Extract<GameParticipantView, { kind: 'HUMAN' }>; participants: GameParticipantView[];
  settings: RoomSettings; selectedDeck: DeckSummary; deckInformation: DeckInformationView; game: InitialGameView;
};
export type ResultParticipantView = HumanParticipant & { score: number | null } | BotParticipant & { score: number };
export type LastResult = { roomId: string; gameId: string; expiresAt: number };
export type ResultsRoomView = {
  id: string; code: string; status: 'RESULTS'; revision: number;
  participant: Extract<ResultParticipantView, { kind: 'HUMAN' }>; participants: ResultParticipantView[]; settings: RoomSettings; selectedDeck: DeckSummary;
  result: { gameId: string; endReason: 'DECK_COMPLETED' | 'NO_ACTIVE_HUMAN_PLAYERS' | 'HOST_CANCELLED'; completedNormally: boolean;
    standings: { playerId: string; score: number; position: number }[]; winnerIds: string[]; tieBreakWinnerId: string | null;
    retention: { presentedAt: number; serverNow: number; expiresAt: number } };
};
export type ReturnHomeRequest = { requestId: string; roomId: string; gameId: string };
export type ResultsHomeEvent = { id: string; roomId: string; gameId: string; lastResult: LastResult | null };
export type RoomView = WaitingRoomView | InitialGameRoomView | ResultsRoomView;

export type AutomaticEndReason = 'RECONNECT_TIMEOUT' | 'HOST_DISCONNECTED' | 'INACTIVITY';
export type ParticipationEnd = { roomId: string; participantId: string; reason: AutomaticEndReason };
export type CurrentRoomResponse = { room: RoomView | null; ended?: ParticipationEnd; lastResult?: LastResult };
export type RoomResponse = { room: RoomView };
export type RenameRoomRequest = { name: string };

export type PublicErrorCode =
  | 'INVALID_INPUT'
  | 'ROOM_NOT_AVAILABLE'
  | 'FORBIDDEN'
  | 'SESSION_REQUIRED'
  | 'CODE_EXHAUSTED'
  | 'ALREADY_IN_ROOM'
  | 'ROOM_FULL'
  | 'BOT_NOT_AVAILABLE'
  | 'REQUEST_CONFLICT'
  | 'PARTICIPATION_ENDED'
  | 'DECK_NOT_AVAILABLE'
  | 'DECK_VERSION_MISMATCH'
  | 'START_NOT_READY'
  | 'INVALID_DECK'
  | 'GAME_ALREADY_STARTED'
  | 'STALE_GAME_CONTEXT' | 'NOT_YOUR_TURN' | 'CARD_NOT_IN_HAND' | 'ROUND_IN_REVIEW' | 'GAME_FINISHED' | 'RESULT_NOT_AVAILABLE'
  | 'PLAYER_AUTOMATIC' | 'TURN_EXPIRED'
  | 'INTERNAL_ERROR';

export type ErrorResponse = { error: { code: PublicErrorCode; message: string } };

export type SocketAck<T> = { ok: true } & T | { ok: false; error: ErrorResponse['error'] };
export type RoomChange = { id: string; kind: 'LEFT' | 'RECONNECTED' | 'PRESENCE_EXPIRED' | 'BOT_REMOVED'; participantId: string; name: string };
export type RoomStateEvent = { room: RoomView; change?: RoomChange };
export type RoomLeftEvent = { roomId: string; participantId: string; reason?: 'VOLUNTARY' | 'RECONNECT_TIMEOUT' };
export type RoomClosedEvent = { roomId: string; revision: number; reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY' };
