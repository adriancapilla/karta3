import type { AppearanceSnapshot } from '../../../shared/contracts/statistics.js';
import type { Clock, IdentifierGenerator, Scheduler } from '../ports.js';
import type { Room } from '../room.js';
import { AppearanceWindows, type AppearanceConnections } from './appearanceWindows.js';
import type { AggregateSink } from './contracts.js';
import { StatisticsControls } from './controls.js';
import { StatisticsReducer } from './reducer.js';
import type { Category } from './catalog.js';

/** Traductor de hechos confirmados; Room y referencias funcionales no atraviesan el puerto. */
export class StatisticsRecording {
  readonly appearance: AppearanceWindows;
  private readonly reducer: StatisticsReducer;
  private readonly tracked = new Set<Room>();
  private readonly photoPermissions = new WeakMap<Room, Set<string>>();
  private cancelSweep?: () => void;
  private sweepAt = Infinity;
  private generation = 0;
  private stopped = false;
  private readonly unsubscribe: () => void;
  constructor(private readonly sink: AggregateSink, private readonly clock: Clock, private readonly controls: StatisticsControls,
    private readonly scheduler: Scheduler, id: IdentifierGenerator) {
    this.reducer = new StatisticsReducer(sink); this.appearance = new AppearanceWindows(clock, scheduler, id);
    this.reducer.onInvalidated(() => { this.tracked.clear(); this.appearance.clear(); this.schedule(); });
    this.unsubscribe = controls.onCut((session, general) => {
      this.appearance.invalidate(session);
      for (const room of this.tracked) if (room.participants.some(p => p.kind === 'HUMAN' && p.sessionId === session)) {
        if (general) { this.reducer.cut(room); this.tracked.delete(room); }
        else { const p = room.participants.find(p => p.sessionId === session); if (p && this.photoPermissions.get(room)?.has(p.id)) this.reducer.photoCut(room, p.id); }
      }
      this.schedule();
    });
  }
  private schedule() {
    if (this.stopped) return; const next = this.reducer.nextDeadline(); if (next === this.sweepAt) return;
    this.cancelSweep?.(); this.sweepAt = next; const generation = ++this.generation; if (!Number.isFinite(next)) return;
    this.cancelSweep = this.scheduler.schedule(Math.max(0, next - this.clock.now().monotonic), () => {
      if (this.stopped || generation !== this.generation) return; this.sweepAt = Infinity;
      this.reducer.sweep(this.clock.now().monotonic);
      for (const room of this.tracked) if (!this.reducer.observable(room)) this.tracked.delete(room);
      this.schedule();
    });
  }
  dispose() { this.stopped = true; this.generation++; this.cancelSweep?.(); this.unsubscribe(); this.appearance.dispose(); this.tracked.clear(); }
  connectAppearance(connections: AppearanceConnections) { this.appearance.connect(connections); }
  private eligible(room: Room) { return room.participants.filter(p => p.kind === 'HUMAN').every(p => this.controls.eligible(p.sessionId)); }
  private prepare(room: Room) { if (!this.eligible(room)) { this.reducer.cut(room); this.tracked.delete(room); return false; } return true; }
  home() { return this.reducer.home(this.clock.now().unix); }
  created(room: Room) {
    const now = this.clock.now(); this.reducer.created(room, now.unix, now.monotonic, this.eligible(room));
    if (this.reducer.observable(room)) this.tracked.add(room);
    this.schedule();
  }
  joined(room: Room, participantId: string, existing: boolean) {
    this.prepare(room); const p = room.participants.find(p => p.id === participantId);
    this.reducer.join(this.clock.now().unix, existing ? 'EXISTING_PARTICIPATION' : 'NEW_JOIN', this.controls.eligible(p?.sessionId));
  }
  joinRejected(reason: string, session?: string) { this.reducer.join(this.clock.now().unix, 'REJECTED', this.controls.eligible(session), reason); }
  closed(room: Room, reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY') {
    if (this.prepare(room)) this.reducer.closed(room, reason, this.clock.now().monotonic); this.tracked.delete(room); this.schedule();
  }
  started(room: Room) {
    if (!this.prepare(room)) return;
    const settings = room.settings; const humans = room.participants.filter(p => p.kind === 'HUMAN' && p.isPlayer); const bots = room.participants.filter(p => p.kind === 'BOT');
    const now = this.clock.now();
    if (this.reducer.started(room, { deckId: room.selectedDeck!.id, deckSchemaVersion: room.selectedDeck!.schemaVersion, deckContentVersion: room.selectedDeck!.contentVersion,
      humanPlayerCount: humans.length, humanObserverCount: settings.hostPlays ? 0 : 1, botCount: bots.length, playerCount: humans.length + bots.length,
      easyCount: bots.filter(p => p.botDifficulty === 'EASY').length, hardCount: bots.filter(p => p.botDifficulty === 'HARD').length,
      hostPlays: settings.hostPlays, turnSeconds: settings.turnSeconds, reviewSeconds: settings.reviewSeconds, forceTieBreak: settings.forceTieBreak,
      attributeValueMode: settings.attributeValueMode, optimizeForMobile: settings.optimizeForMobile }, humans.map(p => p.id), now.unix, now.monotonic)) this.open(room, 'START');
    this.schedule();
  }
  automatic(room: Room) { if (this.prepare(room)) for (const p of room.game!.players) if (p.kind === 'HUMAN' && p.status === 'AUTOMATIC')
    this.reducer.automatic(room, p.id, this.clock.now().monotonic); }
  ended(room: Room, controlledStop = false) {
    if (!this.prepare(room) || !controlledStop && room.status !== 'RESULTS') return;
    const now = this.clock.now(); if (this.reducer.ended(room, controlledStop ? 'TECHNICAL_INTERRUPTION' : room.game!.result!.endReason, now.unix, now.monotonic) && !controlledStop) this.open(room, 'END');
    this.schedule();
  }
  private open(room: Room, moment: 'START' | 'END') {
    for (const p of room.participants) if (p.kind === 'HUMAN' && p.isPlayer) {
      const session = p.sessionId!;
      if (!this.controls.permitted(session)) continue;
      const used = this.photoPermissions.get(room) ?? new Set<string>(); used.add(p.id); this.photoPermissions.set(room, used);
      this.appearance.open(session, room.game!.id, moment, () => this.sink.available() && this.controls.permitted(session) && this.reducer.observable(room), request => {
        const category: Category = request.theme === 'LIGHT' ? request.origin === 'DEFAULT' ? 'L0' : 'L1' : request.theme === 'DARK' ? 'D1' : request.theme === 'CREAM' ? 'C1' : 'H1';
        return this.reducer.photo(room, p.id, moment, category, this.clock.now().monotonic);
      });
    }
  }
  appearanceSnapshot(request: AppearanceSnapshot, session: string) { return this.appearance.admit(request, session); }
  lost() { try { this.sink.pause('CORRELATION_LIMIT'); } catch { this.appearance.clear(); } }
}
export type StatisticsRecorder = Omit<Pick<StatisticsRecording, 'created' | 'joined' | 'joinRejected' | 'closed' | 'started' | 'automatic' | 'ended' | 'home' | 'lost' | 'dispose' | 'connectAppearance' | 'appearanceSnapshot' | 'appearance'>, 'appearance'> & { appearance?: AppearanceWindows };
export const disabledStatistics: StatisticsRecorder = { created: () => {}, joined: () => {}, joinRejected: () => {}, closed: () => {},
  started: () => {}, automatic: () => {}, ended: () => {}, home: () => false, lost: () => {}, dispose: () => {}, connectAppearance: () => {}, appearanceSnapshot: () => 'IGNORED' };
