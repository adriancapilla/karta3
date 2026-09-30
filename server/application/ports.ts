import type { Room } from './room.js';
import type { RoomErrorCode } from './roomError.js';
import type { RoomChange, RoomView } from '../../shared/contracts/room.js';

export interface RoomRepository {
  findById(id: string): Room | undefined;
  findActiveByOwner(sessionId: string): Room | undefined;
  findActiveBySession(sessionId: string): Room | undefined;
  findActiveByCode(code: string): Room | undefined;
  isCodeActive(code: string): boolean;
  save(room: Room): void;
  remove(id: string): void;
}

export type RequestRecord = {
  kind: 'JOIN' | 'LEAVE';
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
  left(sessionId: string, roomId: string, participantId: string): void;
  closed(sessionIds: string[], roomId: string, revision: number): void;
}

export type IdentifierGenerator = () => string;
export type CodeCandidateSource = () => number;
