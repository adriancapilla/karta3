export type RoomView = {
  id: string;
  code: string;
  status: 'WAITING';
  participant: { id: string; name: string; role: 'HOST'; isPlayer: true };
  settings: {
    deckId: null;
    hostPlays: true;
    turnSeconds: 30;
    forceTieBreak: false;
    reviewSeconds: 5;
  };
};

export type CurrentRoomResponse = { room: RoomView | null };
export type RoomResponse = { room: RoomView };
export type RenameRoomRequest = { name: string };

export type PublicErrorCode =
  | 'INVALID_INPUT'
  | 'ROOM_NOT_AVAILABLE'
  | 'FORBIDDEN'
  | 'SESSION_REQUIRED'
  | 'CODE_EXHAUSTED'
  | 'INTERNAL_ERROR';

export type ErrorResponse = { error: { code: PublicErrorCode; message: string } };
