import type { Room } from './room.js';

export interface RoomRepository {
  findById(id: string): Room | undefined;
  findActiveByOwner(sessionId: string): Room | undefined;
  isCodeActive(code: string): boolean;
  save(room: Room): void;
  remove(id: string): void;
}

export type IdentifierGenerator = () => string;
export type CodeCandidateSource = () => number;
