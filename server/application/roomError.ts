export type RoomErrorCode = 'INVALID_INPUT' | 'ROOM_NOT_AVAILABLE' | 'FORBIDDEN' | 'CODE_EXHAUSTED';

export class RoomError extends Error {
  constructor(public readonly code: RoomErrorCode, message: string) {
    super(message);
  }
}
