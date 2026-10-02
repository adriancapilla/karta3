import type { DeckSummary } from './deck.js';

export type ParticipantView = { id: string; name: string; role: 'HOST' | 'GUEST'; isPlayer: boolean; presence: 'CONNECTED' | 'RECONNECTING' };
export type RoomSettings = {
  deckId: string | null;
  deckContentVersion: number | null;
  hostPlays: boolean;
  turnSeconds: 15 | 30 | 60;
  forceTieBreak: boolean;
  reviewSeconds: 0 | 2 | 5 | 10 | 15 | 30;
};
export type ConfigurationChange =
  | { field: 'deck'; value: { id: string; contentVersion: number } | null }
  | { field: 'hostPlays' | 'forceTieBreak'; value: boolean }
  | { field: 'turnSeconds'; value: RoomSettings['turnSeconds'] }
  | { field: 'reviewSeconds'; value: RoomSettings['reviewSeconds'] };
export type ConfigureRoomRequest = { requestId: string; roomId: string; change: ConfigurationChange };

export type RoomView = {
  id: string;
  code: string;
  status: 'WAITING';
  revision: number;
  participant: ParticipantView;
  participants: ParticipantView[];
  lifecycle: { serverNow: number; expiresAt: number; warning: boolean };
  settings: RoomSettings;
  selectedDeck: DeckSummary | null;
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
  | 'DECK_NOT_AVAILABLE'
  | 'DECK_VERSION_MISMATCH'
  | 'INTERNAL_ERROR';

export type ErrorResponse = { error: { code: PublicErrorCode; message: string } };

export type SocketAck<T> = { ok: true } & T | { ok: false; error: ErrorResponse['error'] };
export type RoomChange = { id: string; kind: 'LEFT' | 'RECONNECTED' | 'PRESENCE_EXPIRED'; participantId: string; name: string };
export type RoomStateEvent = { room: RoomView; change?: RoomChange };
export type RoomLeftEvent = { roomId: string; participantId: string; reason?: 'VOLUNTARY' | 'RECONNECT_TIMEOUT' };
export type RoomClosedEvent = { roomId: string; revision: number; reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY' };
