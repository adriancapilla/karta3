import { randomBytes, randomUUID } from 'node:crypto';
import type { ParticipationEnd } from '../../shared/contracts/room.js';
import type { ParticipationEnds } from '../application/ports.js';

export class MemorySessions implements ParticipationEnds {
  private readonly tokens = new Map<string, string>();
  private readonly ends = new Map<string, ParticipationEnd>();

  getEnd(id: string): ParticipationEnd | undefined { const end = this.ends.get(id); return end ? { ...end } : undefined; }
  saveEnd(id: string, end: ParticipationEnd): void { this.ends.set(id, { ...end }); }
  clearEnd(id: string): void { this.ends.delete(id); }

  remove(id: string): void {
    for (const [token, sessionId] of this.tokens) if (sessionId === id) this.tokens.delete(token);
    this.clearEnd(id);
  }

  get(token: string | undefined): string | undefined {
    return token ? this.tokens.get(token) : undefined;
  }

  establish(): { token: string; id: string } {
    const token = randomBytes(32).toString('base64url');
    const id = randomUUID();
    this.tokens.set(token, id);
    return { token, id };
  }
}
