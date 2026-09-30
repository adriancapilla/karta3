export type ParticipantView = { id: string; name: string; role: 'HOST' | 'GUEST'; isPlayer: true };

export type RoomView = {
  id: string;
  code: string;
  status: 'WAITING';
  revision: number;
  participant: ParticipantView;
  participants: ParticipantView[];
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
  | 'ALREADY_IN_ROOM'
  | 'ROOM_FULL'
  | 'REQUEST_CONFLICT'
  | 'PARTICIPATION_ENDED'
  | 'INTERNAL_ERROR';

export type ErrorResponse = { error: { code: PublicErrorCode; message: string } };

export type SocketAck<T> = { ok: true } & T | { ok: false; error: ErrorResponse['error'] };
export type RoomChange = { id: string; kind: 'LEFT'; participantId: string; name: string };
export type RoomStateEvent = { room: RoomView; change?: RoomChange };
export type RoomLeftEvent = { roomId: string; participantId: string };
export type RoomClosedEvent = { roomId: string; revision: number; reason: 'HOST_CLOSED' };
