export type ParticipantView = { id: string; name: string; role: 'HOST' | 'GUEST'; isPlayer: true; presence: 'CONNECTED' | 'RECONNECTING' };

export type RoomView = {
  id: string;
  code: string;
  status: 'WAITING';
  revision: number;
  participant: ParticipantView;
  participants: ParticipantView[];
  lifecycle: { serverNow: number; expiresAt: number; warning: boolean };
  settings: {
    deckId: null;
    hostPlays: true;
    turnSeconds: 30;
    forceTieBreak: false;
    reviewSeconds: 5;
  };
};

export type AutomaticEndReason = 'RECONNECT_TIMEOUT' | 'HOST_DISCONNECTED' | 'INACTIVITY';
export type ParticipationEnd = { roomId: string; participantId: string; reason: AutomaticEndReason };
export type CurrentRoomResponse = { room: RoomView | null; ended?: ParticipationEnd };
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
export type RoomChange = { id: string; kind: 'LEFT' | 'RECONNECTED' | 'PRESENCE_EXPIRED'; participantId: string; name: string };
export type RoomStateEvent = { room: RoomView; change?: RoomChange };
export type RoomLeftEvent = { roomId: string; participantId: string; reason?: 'VOLUNTARY' | 'RECONNECT_TIMEOUT' };
export type RoomClosedEvent = { roomId: string; revision: number; reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY' };
