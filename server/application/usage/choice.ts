import type { UsageChoiceRequest, UsageChoiceView } from '../../../shared/contracts/usage.js';
import type { Clock, IdentifierGenerator, Scheduler } from '../ports.js';
import type { UsageObservationCut, UsagePermission, UsagePrivacyStore, UsageScope, UsagePrivacyControl } from './contracts.js';

const VALIDITY = 12 * 60 * 60_000;
export class UsageChoiceError extends Error {
  constructor(readonly code: 'CHOICE_CONFLICT' | 'CHOICE_UNAVAILABLE') { super(code); }
}
type Choice = { revision: number; decision: UsageChoiceView['decision']; version: string; until: number | null; deadline: number;
  scope?: UsageScope; proof?: string; pendingProofs: Set<string>; cancel?: () => void;
  pendingCut?: { scopes: UsageScope[]; command: Extract<UsagePrivacyControl, { kind: 'cut' }>; result?: Promise<void> };
  requests: Map<string, { signature: string; result: Promise<void> }> };

/** Permiso propio RAM, ajeno a Game; únicamente recibos/control cruzan el puerto privado. */
export class UsageChoices implements UsagePermission {
  private readonly states = new Map<string, Choice>();
  private readonly listeners = new Set<(sessionId: string, choice: UsageChoiceView) => void>();
  private readonly cuts = new Set<(sessionId: string) => UsageObservationCut>();
  private lastWarning = -Infinity;
  constructor(private readonly store: UsagePrivacyStore, private readonly clock: Clock, private readonly scheduler: Scheduler,
    private readonly id: IdentifierGenerator, private readonly revisionSeed: () => number, readonly noticeVersion: string,
    private readonly available: () => boolean, private readonly warning: () => void = () => {},
    private readonly capacity = 4096, private readonly requestCapacity = 64) {}

  private view(entry: Choice): UsageChoiceView { return { available: this.available(), decision: entry.decision,
    revision: entry.revision, noticeVersion: this.noticeVersion, validUntil: entry.until }; }
  private changed(session: string, entry: Choice) { if (this.states.get(session) !== entry) return;
    for (const listener of this.listeners) { try { listener(session, this.view(entry)); } catch { /* Transporte no concede permiso. */ } } }
  subscribe(listener: (sessionId: string, choice: UsageChoiceView) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  onInvalidated(listener: (sessionId: string) => UsageObservationCut) { this.cuts.add(listener); return () => { this.cuts.delete(listener); }; }
  private entry(session: string) {
    let entry = this.states.get(session);
    if (entry) { this.prepare(session, entry); return entry; }
    if (this.states.size >= this.capacity) {
      for (const [key, state] of this.states) if (state.deadline <= this.clock.now().monotonic && state.pendingProofs.size === 0) {
        this.prepare(key, state); if (state.pendingCut) continue; state.cancel?.(); this.states.delete(key);
      }
      if (this.states.size >= this.capacity) throw new UsageChoiceError('CHOICE_UNAVAILABLE');
    }
    entry = { revision: this.revisionSeed(), decision: 'UNDECIDED', version: this.noticeVersion, until: null,
      deadline: this.clock.now().monotonic + VALIDITY, pendingProofs: new Set(), requests: new Map() };
    this.states.set(session, entry); return entry;
  }
  private prepare(session: string, entry: Choice) {
    if ((entry.decision !== 'UNDECIDED' || entry.pendingProofs.size) && (entry.deadline <= this.clock.now().monotonic || entry.version !== this.noticeVersion)) {
      entry.requests.clear();
      void this.cut(session, entry, 'UNDECIDED').catch(() => this.warn());
    }
  }
  current(session: string) { return this.view(this.entry(session)); }
  async confirmedCurrent(session: string) { const entry = this.entry(session); await this.barrier(entry); return this.view(entry); }
  scope(session: string): UsageScope | undefined {
    const entry = this.states.get(session); if (!entry) return;
    this.prepare(session, entry);
    return this.available() && entry.decision === 'ACCEPTED' && entry.scope?.active ? entry.scope : undefined;
  }
  private schedule(session: string, entry: Choice) {
    entry.cancel?.(); const revision = entry.revision;
    entry.cancel = this.scheduler.schedule(Math.max(0, entry.deadline - this.clock.now().monotonic), () => {
      if (this.states.get(session) === entry && entry.revision === revision) this.prepare(session, entry);
    });
  }
  private cut(session: string, entry: Choice, decision: 'UNDECIDED' | 'REJECTED'): Promise<void> {
    if (entry.decision === decision && !entry.scope && !entry.pendingProofs.size) return this.barrier(entry);
    entry.cancel?.(); const scopes = [...(entry.pendingCut?.scopes ?? []), ...(entry.scope ? [entry.scope] : [])];
    if (entry.scope) entry.scope.active = false;
    const proofRefs = [...(entry.pendingCut?.command.proofRefs ?? []), ...entry.pendingProofs, ...(entry.proof ? [entry.proof] : [])];
    const roomRefs = [...(entry.pendingCut?.command.roomRefs ?? [])]; const gameRefs = [...(entry.pendingCut?.command.gameRefs ?? [])];
    for (const listener of this.cuts) { const cut = listener(session); scopes.push(...cut.scopes); roomRefs.push(...cut.roomRefs); gameRefs.push(...cut.gameRefs); }
    entry.scope = undefined; entry.proof = undefined; entry.decision = decision; entry.revision++;
    entry.version = this.noticeVersion; entry.until = decision === 'REJECTED' ? Math.floor(this.clock.now().unix) + VALIDITY : null;
    entry.deadline = this.clock.now().monotonic + VALIDITY;
    if (decision === 'REJECTED') this.schedule(session, entry);
    if (scopes.length || proofRefs.length || roomRefs.length || gameRefs.length) entry.pendingCut = { scopes,
      command: { kind: 'cut', at: Math.floor(this.clock.now().unix), proofRefs: [...new Set(proofRefs)], roomRefs: [...new Set(roomRefs)], gameRefs: [...new Set(gameRefs)] } };
    const result = this.barrier(entry); // Flags/admisión y control registrados antes de difusión/ack.
    this.changed(session, entry); return result;
  }
  private barrier(entry: Choice) {
    const pending = entry.pendingCut; if (!pending) return Promise.resolve();
    return pending.result ??= this.store.revoke(pending.scopes, pending.command)
      .then(() => { if (entry.pendingCut === pending) entry.pendingCut = undefined; })
      .catch(error => { pending.result = undefined; throw error; });
  }
  censor(cut: UsageObservationCut) {
    for (const scope of cut.scopes) scope.active = false;
    void this.store.revoke(cut.scopes, { kind: 'cut', at: Math.floor(this.clock.now().unix), proofRefs: [],
      roomRefs: cut.roomRefs, gameRefs: cut.gameRefs }).catch(() => this.warn());
  }
  private warn() { const at = this.clock.now().monotonic; if (at - this.lastWarning < 60_000) return;
    this.lastWarning = at; try { this.warning(); } catch { /* Diagnóstico nunca altera el juego. */ } }
  async decide(session: string, request: UsageChoiceRequest): Promise<UsageChoiceView> {
    const entry = this.entry(session); const signature = JSON.stringify([request.decision, request.noticeVersion, request.expectedRevision]);
    const previous = entry.requests.get(request.requestId);
    if (previous) {
      if (previous.signature !== signature) throw new UsageChoiceError('CHOICE_CONFLICT');
      try { await previous.result; }
      catch { if (request.decision !== 'REJECTED') throw new UsageChoiceError('CHOICE_UNAVAILABLE');
        previous.result = this.barrier(entry); try { await previous.result; } catch { throw new UsageChoiceError('CHOICE_UNAVAILABLE'); } }
      this.prepare(session, entry);
      try { await this.barrier(entry); } catch { throw new UsageChoiceError('CHOICE_UNAVAILABLE'); }
      return this.view(entry);
    }
    if (request.decision === 'ACCEPTED' && (request.expectedRevision !== entry.revision || request.noticeVersion !== this.noticeVersion)) throw new UsageChoiceError('CHOICE_CONFLICT');
    if (request.decision === 'ACCEPTED' && (!this.available() || entry.pendingCut || entry.requests.size >= this.requestCapacity)) throw new UsageChoiceError('CHOICE_UNAVAILABLE');
    let result: Promise<void>;
    if (request.decision === 'REJECTED') {
      // Aun sin espacio para otro ID, revocar primero. No se permiten nuevas aceptaciones hasta expirar.
      result = this.cut(session, entry, 'REJECTED');
    } else if (entry.decision === 'ACCEPTED') result = Promise.resolve(); // No renueva las doce horas.
    else {
      const proofRef = this.id(); const accepted = this.clock.now(); const revision = ++entry.revision;
      entry.pendingProofs.add(proofRef); entry.deadline = accepted.monotonic + VALIDITY;
      result = this.store.control({ kind: 'accept', proof: { proofRef, noticeVersion: this.noticeVersion,
        acceptedAt: Math.floor(accepted.unix), validUntil: Math.floor(accepted.unix) + VALIDITY } }).then(async () => {
        entry.pendingProofs.delete(proofRef);
        if (entry.revision !== revision || !this.available() || this.clock.now().monotonic >= entry.deadline) {
          await this.store.revoke([], { kind: 'cut', at: Math.floor(this.clock.now().unix), proofRefs: [proofRef], roomRefs: [], gameRefs: [] }); return;
        }
        entry.proof = proofRef; entry.scope = { active: true }; entry.decision = 'ACCEPTED'; entry.until = Math.floor(accepted.unix) + VALIDITY;
        this.schedule(session, entry); this.changed(session, entry);
      }).catch(error => { entry.pendingProofs.delete(proofRef); if (entry.revision === revision) { entry.revision++; this.changed(session, entry); } throw error; });
    }
    if (entry.requests.size < this.requestCapacity) entry.requests.set(request.requestId, { signature, result });
    try { await result; await this.barrier(entry); } catch { throw new UsageChoiceError('CHOICE_UNAVAILABLE'); }
    return this.view(entry);
  }
  dispose() { for (const entry of this.states.values()) entry.cancel?.(); this.listeners.clear(); this.cuts.clear(); }
}
