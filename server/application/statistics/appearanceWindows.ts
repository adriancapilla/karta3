import type { Clock, IdentifierGenerator, Scheduler } from '../ports.js';
import type { AppearanceMoment, AppearanceWindow } from '../../../shared/contracts/appearance.js';
import type { AppearanceSnapshot } from '../../../shared/contracts/statistics.js';

export interface AppearanceConnections { ids(sessionId: string): readonly string[]; connected(connectionId: string): boolean }
type Opportunity = { session: string; connection: string; gameId: string; moment: AppearanceMoment; deadline: number; expiresAt: number;
  delivered: boolean; valid: () => boolean; accept: (request: AppearanceSnapshot) => boolean };
/** Solo acreditación de transición viva por conexión, nunca enviada al escritor. */
export class AppearanceWindows {
  private connections?: AppearanceConnections;
  private readonly pending = new Map<string, Opportunity>();
  private cancel?: () => void;
  private generation = 0;
  constructor(private readonly clock: Clock, private readonly scheduler: Scheduler, private readonly id: IdentifierGenerator) {}
  connect(connections: AppearanceConnections) { this.connections = connections; }
  dispose() { this.generation++; this.cancel?.(); this.pending.clear(); }
  clear() { this.pending.clear(); this.schedule(); }
  invalidate(session: string) { for (const [token, p] of this.pending) if (p.session === session) this.pending.delete(token); this.schedule(); }
  disconnected(connection: string) { for (const [token, p] of this.pending) if (p.connection === connection) this.pending.delete(token); this.schedule(); }
  open(session: string, gameId: string, moment: AppearanceMoment, valid: () => boolean, accept: (request: AppearanceSnapshot) => boolean) {
    this.sweep(); if (!valid()) return;
    for (const connection of this.connections?.ids(session) ?? []) {
      if (this.pending.size >= 4096) break;
      const now = this.clock.now(); this.pending.set(this.id(), { session, connection, gameId, moment, valid, accept,
        deadline: now.monotonic + 10_000, expiresAt: now.unix + 10_000, delivered: false });
    }
    this.schedule();
  }
  take(session: string, connection: string, gameId: string, moment: AppearanceMoment): AppearanceWindow | undefined {
    this.sweep(); for (const [token, p] of this.pending) if (!p.delivered && p.session === session && p.connection === connection && p.gameId === gameId && p.moment === moment && p.valid()) {
      p.delivered = true; return { token, gameId, moment, expiresAt: p.expiresAt };
    }
  }
  admit(request: AppearanceSnapshot, session: string): 'ADMITTED' | 'IGNORED' | 'FORBIDDEN' | 'UNAVAILABLE' {
    this.sweep(); const p = this.pending.get(request.windowToken); if (!p) return 'IGNORED';
    if (session !== p.session) return 'FORBIDDEN';
    if (!p.delivered || request.gameId !== p.gameId || request.moment !== p.moment || !p.valid() || !this.connections?.connected(p.connection)) return 'IGNORED';
    return p.accept(request) ? 'ADMITTED' : 'IGNORED';
  }
  private sweep() { const now = this.clock.now().monotonic; for (const [token, p] of this.pending) if (now >= p.deadline || !p.valid()) this.pending.delete(token); this.schedule(); }
  private schedule() {
    this.cancel?.(); const generation = ++this.generation; const next = Math.min(...[...this.pending.values()].map(p => p.deadline));
    if (!Number.isFinite(next)) return;
    this.cancel = this.scheduler.schedule(Math.max(0, next - this.clock.now().monotonic), () => { if (generation === this.generation) this.sweep(); });
  }
}
