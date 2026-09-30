export type RoomErrorCode = 'INVALID_INPUT' | 'ROOM_NOT_AVAILABLE' | 'FORBIDDEN' | 'CODE_EXHAUSTED'
  | 'ALREADY_IN_ROOM' | 'ROOM_FULL' | 'REQUEST_CONFLICT' | 'PARTICIPATION_ENDED';

export class RoomError extends Error {
  constructor(public readonly code: RoomErrorCode, message: string) {
    super(message);
  }
}
