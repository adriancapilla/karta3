import type { Room } from './room.js';
import type { RoomErrorCode } from './roomError.js';
import type { ParticipationEnd, RoomChange, RoomClosedEvent, RoomLeftEvent, RoomView } from '../../shared/contracts/room.js';
import type { TimePoint } from './waitingTime.js';
export type { TimePoint } from './waitingTime.js';

export interface RoomRepository {
  allActive(): Room[];
  findById(id: string): Room | undefined;
  findActiveByOwner(sessionId: string): Room | undefined;
  findActiveBySession(sessionId: string): Room | undefined;
  findActiveByCode(code: string): Room | undefined;
  isCodeActive(code: string): boolean;
  save(room: Room): void;
  remove(id: string): void;
}

export type RequestRecord = {
  kind: 'JOIN' | 'LEAVE' | 'CONFIGURE';
  signature: string;
  roomId: string;
  participantId: string;
  error?: { code: RoomErrorCode; message: string };
};

export interface RoomRequests {
  get(sessionId: string, requestId: string): RequestRecord | undefined;
  save(sessionId: string, requestId: string, record: RequestRecord): void;
}

export interface RoomChanges {
  updated(views: { sessionId: string; room: RoomView }[], change?: RoomChange): void;
  left(sessionId: string, roomId: string, participantId: string, reason?: RoomLeftEvent['reason']): void;
  closed(sessionIds: string[], roomId: string, revision: number, reason?: RoomClosedEvent['reason']): void;
}

export interface Clock { now(): TimePoint }
export interface Scheduler { schedule(delayMs: number, callback: () => void): () => void }
export interface SessionPresence { isConnected(sessionId: string): boolean }
export interface ParticipationEnds {
  getEnd(sessionId: string): ParticipationEnd | undefined;
  saveEnd(sessionId: string, end: ParticipationEnd): void;
  clearEnd(sessionId: string): void;
}

export type IdentifierGenerator = () => string;
export type CodeCandidateSource = () => number;
