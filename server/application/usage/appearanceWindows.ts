import type { Clock, IdentifierGenerator, Scheduler } from '../ports.js';
import type { AppearanceMoment, AppearanceWindow } from '../../../shared/contracts/appearance.js';
import type { AppearanceFact, AppearanceRequest, UsageScope } from './contracts.js';

export interface AppearanceConnections { ids(sessionId: string): readonly string[]; connected(connectionId: string): boolean }
export type AppearanceAdmission = 'ADMITTED' | 'IGNORED' | 'FORBIDDEN' | 'CONFLICT' | 'UNAVAILABLE';
type Opportunity = { session: string; connection: string; gameId: string; moment: AppearanceMoment; expiresAt: number;
  deadline: number; delivered: boolean; references: { roomRef: string; gameRef: string; participationRef: string };
  scopes: readonly UsageScope[]; valid: () => boolean };

/** Acreditación RAM de un hecho en vivo. No es identidad estadística ni estado del juego. */
export class AppearanceWindows {
  private connections?: AppearanceConnections;
  private readonly pending = new Map<string, Opportunity>();
  private readonly admitted = new Map<string, number>();
  private readonly requests = new Map<string, { signature: string; deadline: number }>();
  private cancelExpiry?: () => void;
  private scheduledAt = Infinity;
  private generation = 0;
  constructor(private readonly clock: Clock, private readonly id: IdentifierGenerator,
    private readonly enabled: () => boolean, private readonly lost: () => void, private readonly capacity = 4096, private readonly scheduler?: Scheduler) {}
  dispose() { this.generation++; this.cancelExpiry?.(); this.pending.clear(); this.admitted.clear(); this.requests.clear(); }
  connect(connections: AppearanceConnections) { this.connections = connections; }
  private sweep() {
    const now = this.clock.now().monotonic;
    for (const [token, entry] of this.pending) if (now >= entry.deadline || !this.enabled() || entry.scopes.some(scope => !scope.active)) this.pending.delete(token);
    for (const [key, deadline] of this.admitted) if (now >= deadline) this.admitted.delete(key);
    for (const [id, entry] of this.requests) if (now >= entry.deadline) this.requests.delete(id);
    this.scheduleExpiry();
  }
  private scheduleExpiry() {
    const next = Math.min(...[...this.pending.values()].map(entry => entry.deadline),
      ...this.admitted.values(), ...[...this.requests.values()].map(entry => entry.deadline));
    if (!this.scheduler || next === this.scheduledAt) return;
    this.cancelExpiry?.(); this.scheduledAt = next; const generation = ++this.generation;
    if (!Number.isFinite(next)) return;
    this.cancelExpiry = this.scheduler.schedule(Math.max(0, next - this.clock.now().monotonic), () => {
      if (generation !== this.generation) return;
      this.scheduledAt = Infinity; this.cancelExpiry = undefined; this.sweep();
    });
  }
  open(session: string, gameId: string, moment: AppearanceMoment, references: Opportunity['references'], scopes: readonly UsageScope[], valid: () => boolean) {
    this.sweep(); if (!this.enabled() || !valid()) return;
    const now = this.clock.now();
    for (const connection of this.connections?.ids(session) ?? []) {
      if (this.pending.size >= this.capacity) { this.lost(); break; }
      this.pending.set(this.id(), { session, connection, gameId, moment, references, scopes, valid,
        deadline: now.monotonic + 10_000, expiresAt: now.unix + 10_000, delivered: false });
    }
    this.scheduleExpiry();
  }
  take(session: string, connection: string, gameId: string, moment: AppearanceMoment): AppearanceWindow | undefined {
    this.sweep();
    for (const [token, entry] of this.pending) if (!entry.delivered && entry.session === session && entry.connection === connection
      && entry.gameId === gameId && entry.moment === moment && entry.valid()) {
      entry.delivered = true;
      return { token, gameId, moment, expiresAt: entry.expiresAt };
    }
  }
  disconnected(connection: string) { for (const [token, entry] of this.pending) if (entry.connection === connection) this.pending.delete(token); }
  invalidate(session: string) { for (const [token, entry] of this.pending) if (entry.session === session) this.pending.delete(token); }
  admit(request: AppearanceRequest, session: string, record: (fact: AppearanceFact, scopes: readonly UsageScope[]) => boolean): AppearanceAdmission {
    this.sweep(); const opportunity = this.pending.get(request.data.windowToken);
    if (!opportunity) return 'IGNORED';
    if (opportunity.session !== session) return 'FORBIDDEN';
    if (!opportunity.delivered || opportunity.gameId !== request.data.gameId || opportunity.moment !== request.data.moment
      || !this.connections?.connected(opportunity.connection) || !opportunity.valid() || !this.enabled()) return 'IGNORED';
    const signature = JSON.stringify([request.visitId, request.data.gameId, request.data.moment, request.data.windowToken, request.data.theme, request.data.origin]);
    const previous = this.requests.get(request.eventId);
    if (previous) return previous.signature === signature ? 'IGNORED' : 'CONFLICT';
    const key = `${opportunity.references.gameRef}:${opportunity.references.participationRef}:${opportunity.moment}`;
    if (this.admitted.has(key)) return 'IGNORED';
    if (!record({ eventId: request.eventId, version: 1, visitId: request.visitId, name: 'appearance_snapshot',
      data: { ...opportunity.references, moment: opportunity.moment, theme: request.data.theme, origin: request.data.origin } }, opportunity.scopes)) return 'UNAVAILABLE';
    this.requests.set(request.eventId, { signature, deadline: opportunity.deadline }); this.admitted.set(key, opportunity.deadline);
    return 'ADMITTED';
  }
}
