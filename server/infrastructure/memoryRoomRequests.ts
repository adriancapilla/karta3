import type { RequestRecord, RoomRequests } from '../application/ports.js';

export class MemoryRoomRequests implements RoomRequests {
  private readonly records = new Map<string, RequestRecord>();

  get(sessionId: string, requestId: string): RequestRecord | undefined {
    return this.records.get(`${sessionId}:${requestId}`);
  }

  save(sessionId: string, requestId: string, record: RequestRecord): void {
    this.records.set(`${sessionId}:${requestId}`, record);
  }
  removeRoom(roomId: string): void {
    for (const [key, record] of this.records) if (record.roomId === roomId) this.records.delete(key);
  }
}
