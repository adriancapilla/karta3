export type RoomErrorCode = 'INVALID_INPUT' | 'ROOM_NOT_AVAILABLE' | 'FORBIDDEN' | 'CODE_EXHAUSTED'
  | 'ALREADY_IN_ROOM' | 'ROOM_FULL' | 'REQUEST_CONFLICT' | 'PARTICIPATION_ENDED' | 'DECK_NOT_AVAILABLE' | 'DECK_VERSION_MISMATCH'
  | 'START_NOT_READY' | 'INVALID_DECK' | 'GAME_ALREADY_STARTED' | 'INTERNAL_ERROR'
  | 'STALE_GAME_CONTEXT' | 'NOT_YOUR_TURN' | 'CARD_NOT_IN_HAND' | 'ROUND_IN_REVIEW' | 'GAME_FINISHED' | 'RESULT_NOT_AVAILABLE';

export class RoomError extends Error {
  constructor(public readonly code: RoomErrorCode, message: string) {
    super(message);
  }
}
