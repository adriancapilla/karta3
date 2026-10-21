import { STATISTICS_NOTICE_VERSION, type AppearancePermissionRequest, type AppearancePermissionView, type ExclusionRequest, type ExclusionView, type StatisticsStateEvent } from '../../../shared/contracts/statistics.js';
import type { Clock, Scheduler } from '../ports.js';
import { StatisticsError } from './contracts.js';

type State = { excluded: boolean; legacy: boolean; chosen: boolean; revision: number; persistence: ExclusionView['persistence'];
  permission: AppearancePermissionView['state']; validUntil: number | null; deadline: number;
  requests: Map<string, { signature: string; kind: 'exclusion' | 'appearance'; until: number }> };
export type ControlView = StatisticsStateEvent;
/** Preferencias funcionales RAM, sin recibos ni dependencia del escritor. */
export class StatisticsControls {
  private readonly states = new Map<string, State>();
  private readonly listeners = new Set<(session: string, view: ControlView) => void>();
  private readonly cuts = new Set<(session: string, general: boolean) => void>();
  private cancel?: () => void;
  private generation = 0;
  private overflow = false;
  constructor(private readonly clock: Clock, private readonly scheduler: Scheduler, private readonly revision: () => number,
    private readonly collecting: () => boolean) {}
  dispose() { this.generation++; this.cancel?.(); this.states.clear(); this.listeners.clear(); this.cuts.clear(); }
  subscribe(listener: (session: string, view: ControlView) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  onCut(listener: (session: string, general: boolean) => void) { this.cuts.add(listener); return () => { this.cuts.delete(listener); }; }
  private cut(session: string, general: boolean) { for (const listener of this.cuts) listener(session, general); }
  private notify(session: string) { const view = this.view(session); for (const listener of this.listeners) listener(session, view); }
  establish(session: string, hadFunctionalCookie: boolean, cookie: string | undefined) {
    let state = this.states.get(session);
    if (!state) {
      if (this.states.size >= 4096) {
        if (!this.overflow) { this.overflow = true; for (const known of this.states.keys()) this.cut(known, true); }
        this.cut(session, true); return;
      }
      const excluded = cookie === '1:1'; const legacy = cookie !== '1:0' && !excluded && (hadFunctionalCookie || cookie !== undefined);
      state = { excluded, legacy, chosen: cookie === '1:0' || excluded, revision: this.revision(), persistence: cookie === '1:0' || excluded ? 'COOKIE_REQUESTED' : 'MEMORY_ONLY',
        permission: 'UNDECIDED', validUntil: null, deadline: Infinity, requests: new Map() };
      this.states.set(session, state);
    } else if (!state.chosen && cookie === '1:1' && !state.excluded) {
      state.excluded = true; state.legacy = false; state.chosen = true; state.revision++; this.cut(session, true); this.notify(session);
    }
    if (state.excluded || state.legacy) this.cut(session, true);
  }
  eligible(session: string | undefined) {
    const state = session ? this.states.get(session) : undefined;
    return !this.overflow && !!state && !state.excluded && !state.legacy;
  }
  permitted(session: string) {
    this.expire(); const state = this.states.get(session);
    return this.collecting() && this.eligible(session) && state?.permission === 'GRANTED';
  }
  view(session: string): ControlView {
    this.expire(); const s = this.states.get(session);
    return { available: this.collecting(), exclusion: { version: 1, excluded: s?.excluded ?? true, revision: s?.revision ?? 0,
      persistence: s?.persistence ?? 'MEMORY_ONLY', eligibility: !s || this.overflow || s.legacy ? 'PENDING_LEGACY_CHOICE' : s.excluded ? 'EXCLUDED' : 'DEFAULT_ALLOWED' },
      appearance: { version: 1, state: s?.permission ?? 'UNDECIDED', noticeVersion: STATISTICS_NOTICE_VERSION, revision: s?.revision ?? 0, validUntil: s?.validUntil ?? null } };
  }
  private repeated(s: State, id: string, kind: 'exclusion' | 'appearance', signature: string) {
    const previous = s.requests.get(id);
    if (previous && (previous.kind !== kind || previous.signature !== signature)) throw new StatisticsError('CHOICE_CONFLICT');
    return !!previous;
  }
  private save(s: State, id: string, kind: 'exclusion' | 'appearance', signature: string) {
    if (s.requests.size >= 64) s.requests.delete(s.requests.keys().next().value!);
    s.requests.set(id, { kind, signature, until: this.clock.now().monotonic + 12 * 60 * 60_000 });
  }
  exclusion(session: string, input: ExclusionRequest): { view: ExclusionView; writeCookie: boolean } {
    this.expire(); const s = this.states.get(session);
    if (!s) {
      if (input.excluded && this.overflow) return { view: { ...this.view(session).exclusion, excluded: true }, writeCookie: false };
      throw new StatisticsError('STORAGE_UNAVAILABLE');
    }
    const signature = JSON.stringify([input.excluded, input.expectedRevision]);
    if (this.repeated(s, input.requestId, 'exclusion', signature)) return { view: this.view(session).exclusion, writeCookie: false };
    if (input.expectedRevision !== s.revision && input.excluded && s.excluded) {
      this.save(s, input.requestId, 'exclusion', signature); return { view: this.view(session).exclusion, writeCookie: false };
    }
    if (!input.excluded && (input.expectedRevision !== s.revision || this.overflow)) throw new StatisticsError('CHOICE_CONFLICT');
    s.excluded = input.excluded; s.legacy = false; s.chosen = true; s.persistence = 'COOKIE_REQUESTED'; s.revision++;
    if (input.excluded) { s.permission = 'UNDECIDED'; s.deadline = Infinity; s.validUntil = null; this.cut(session, true); }
    this.save(s, input.requestId, 'exclusion', signature); this.notify(session);
    return { view: this.view(session).exclusion, writeCookie: true };
  }
  appearance(session: string, input: AppearancePermissionRequest): AppearancePermissionView {
    this.expire(); const s = this.states.get(session); if (!s) throw new StatisticsError('STORAGE_UNAVAILABLE');
    const signature = JSON.stringify([input.decision, input.noticeVersion, input.expectedRevision]);
    if (this.repeated(s, input.requestId, 'appearance', signature)) return this.view(session).appearance;
    if (input.decision === 'GRANT' && (input.noticeVersion !== STATISTICS_NOTICE_VERSION || input.expectedRevision !== s.revision
      || !this.collecting() || !this.eligible(session))) throw new StatisticsError('CHOICE_CONFLICT');
    s.permission = input.decision === 'GRANT' ? 'GRANTED' : 'DECLINED'; s.revision++;
    s.deadline = input.decision === 'GRANT' ? this.clock.now().monotonic + 12 * 60 * 60_000 : Infinity;
    s.validUntil = input.decision === 'GRANT' ? this.clock.now().unix + 12 * 60 * 60_000 : null;
    if (input.decision !== 'GRANT') this.cut(session, false);
    this.save(s, input.requestId, 'appearance', signature); this.schedule(); this.notify(session); return this.view(session).appearance;
  }
  private expire() {
    const now = this.clock.now().monotonic;
    for (const [session, s] of this.states) {
      for (const [id, request] of s.requests) if (now >= request.until) s.requests.delete(id);
      if (s.permission === 'GRANTED' && now >= s.deadline) {
        s.permission = 'UNDECIDED'; s.deadline = Infinity; s.validUntil = null; s.revision++;
        this.cut(session, false); this.notify(session);
      }
    }
  }
  private schedule() {
    this.cancel?.(); const generation = ++this.generation;
    const next = Math.min(...[...this.states.values()].map(s => s.deadline)); if (!Number.isFinite(next)) return;
    this.cancel = this.scheduler.schedule(Math.max(0, next - this.clock.now().monotonic), () => {
      if (generation !== this.generation) return; this.expire(); this.schedule();
    });
  }
}
