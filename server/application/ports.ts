import type { Room } from './room.js';
import type { RoomErrorCode } from './roomError.js';
import type { ParticipationEnd, RoomChange, RoomClosedEvent, RoomLeftEvent, RoomView } from '../../shared/contracts/room.js';
import type { TimePoint } from './waitingTime.js';
import type { RoundResolvedEvent, TurnExpiredEvent } from '../../shared/contracts/game.js';
import type { ResultsHomeEvent } from '../../shared/contracts/room.js';
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
  kind: 'JOIN' | 'LEAVE' | 'CONFIGURE' | 'START' | 'OPENING_DIRECTION' | 'PLAY' | 'RETURN_HOME' | 'CANCEL_GAME'
    | 'BOT_ADD' | 'BOT_DIFFICULTY' | 'BOT_RENAME' | 'BOT_REMOVE';
  signature: string;
  roomId: string;
  participantId: string;
  botId?: string;
  error?: { code: RoomErrorCode; message: string };
};

export interface RoomRequests {
  get(sessionId: string, requestId: string): RequestRecord | undefined;
  save(sessionId: string, requestId: string, record: RequestRecord): void;
  removeRoom(roomId: string): void;
}

export interface RoomChanges {
  updated(views: { sessionId: string; room: RoomView }[], change?: RoomChange): void;
  left(sessionId: string, roomId: string, participantId: string, reason?: RoomLeftEvent['reason']): void;
  closed(sessionIds: string[], roomId: string, revision: number, reason?: RoomClosedEvent['reason']): void;
}
export interface GameChanges extends RoomChanges {
  roundResolved(sessionIds: string[], event: RoundResolvedEvent): void;
  turnExpired(sessionIds: string[], event: TurnExpiredEvent): void;
  resultsHome(sessionId: string, event: ResultsHomeEvent): void;
  technicalFailure(): void;
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
export type CardPermutation = (ids: readonly string[]) => readonly string[];
