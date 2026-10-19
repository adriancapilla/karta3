import type { UsageContext, BrowserUsageEvent } from '../../../shared/contracts/usage.js';
import type { Clock, IdentifierGenerator } from '../ports.js';
import type { Room } from '../room.js';
import { joinReasons, nullUsageSink, type JoinReason, type ServerUsageFact, type UsageEnvironment, type UsageEventSink, type UsageTraffic,
  type UsagePermission, type UsageScope, type UsageObservationCut } from './contracts.js';

type References = { roomRef: string; people: Map<string, string>; gameRef?: string; started?: number; ended?: boolean; automatic: Set<string>;
  scope: UsageScope; censored?: boolean };
/** Referencias estadísticas RAM, independientes. Solo emite DTO elegidos, nunca Room al adaptador. */
export class UsageRecording {
  private readonly rooms = new WeakMap<Room, References>();
  private readonly observations = new Map<Room, References>();
  constructor(private readonly sink: UsageEventSink, private readonly clock: Clock, private readonly id: IdentifierGenerator,
    private readonly environment: UsageEnvironment, private readonly traffic: UsageTraffic, private readonly bootRef: string,
    private readonly permission?: UsagePermission) {
    permission?.onInvalidated(session => {
      const result: UsageObservationCut = { scopes: [], roomRefs: [], gameRefs: [] };
      for (const [room, refs] of this.observations) if (room.participants.some(person => person.kind === 'HUMAN' && person.sessionId === session)) {
        const cut = this.stop(room, refs); result.scopes.push(...cut.scopes); result.roomRefs.push(...cut.roomRefs); result.gameRefs.push(...cut.gameRefs);
      }
      return result;
    });
  }
  private stop(room: Room, refs: References): UsageObservationCut {
    refs.censored = true; refs.scope.active = false; this.observations.delete(room);
    return { scopes: [refs.scope], roomRefs: [refs.roomRef], gameRefs: refs.gameRef ? [refs.gameRef] : [] };
  }
  private observable(room: Room, refs: References): UsageScope[] | undefined {
    if (refs.censored) return;
    if (!this.permission) return [];
    const scopes: UsageScope[] = [refs.scope];
    for (const person of room.participants) if (person.kind === 'HUMAN') {
      const scope = this.permission.scope(person.sessionId);
      if (!scope) { this.permission.censor(this.stop(room, refs)); return; } scopes.push(scope);
    }
    return scopes;
  }
  private fact(fact: ServerUsageFact, scopes: readonly UsageScope[] = []) {
    const at = Math.floor(this.clock.now().unix);
    try { this.sink.tryRecord({ ...fact, eventId: this.id(), version: 1, source: 'SERVER', environment: this.environment,
      traffic: this.traffic, occurredAt: at, receivedAt: at, bootRef: this.bootRef }, scopes); } catch { /* Un sink defectuoso tampoco afecta al juego. */ }
  }
  browser(event: BrowserUsageEvent, sessionId?: string): boolean {
    const scope = sessionId ? this.permission?.scope(sessionId) : undefined;
    if (this.permission && !scope) return false;
    const at = Math.floor(this.clock.now().unix);
    try { return this.sink.tryRecord({ ...event, source: 'BROWSER', environment: this.environment, traffic: this.traffic,
      occurredAt: at, receivedAt: at, bootRef: this.bootRef }, scope ? [scope] : []); } catch { return false; }
  }
  lost(sessionId?: string) { if (this.permission && (!sessionId || !this.permission.scope(sessionId))) return;
    try { this.sink.noteLoss?.('CORRELATION_LIMIT'); } catch { /* Diagnóstico tampoco afecta a la operación. */ } }
  created(room: Room, context?: UsageContext) {
    if (this.rooms.has(room)) return;
    if (this.permission && !this.permission.scope(room.hostSessionId)) return;
    const references: References = { roomRef: this.id(), people: new Map(), automatic: new Set(), scope: { active: true } };
    this.rooms.set(room, references); this.person(references, room.participantId);
    if (this.permission) this.observations.set(room, references);
    const scopes = this.observable(room, references); if (!scopes) return;
    this.fact({ name: 'room_created', data: { roomRef: references.roomRef, ...context } }, scopes);
  }
  private person(refs: References, participantId: string) {
    let id = refs.people.get(participantId); if (!id) { id = this.id(); refs.people.set(participantId, id); } return id;
  }
  joined(room: Room, participantId: string, existing: boolean, context?: UsageContext) {
    const refs = this.rooms.get(room); if (!refs) return;
    const scopes = this.observable(room, refs); if (!scopes) return;
    this.fact({ name: 'room_join_resolved', data: { intentRef: this.id(), outcome: existing ? 'EXISTING_PARTICIPATION' : 'NEW_JOIN', reason: null,
      roomRef: refs.roomRef, participationRef: this.person(refs, participantId), ...context } }, scopes);
  }
  joinRejected(reason: string, context?: UsageContext, sessionId?: string) {
    const scope = sessionId ? this.permission?.scope(sessionId) : undefined;
    if (this.permission && !scope) return;
    const safe = joinReasons.includes(reason as JoinReason) ? reason as JoinReason : 'INTERNAL_ERROR';
    this.fact({ name: 'room_join_resolved', data: { intentRef: this.id(), outcome: 'REJECTED', reason: safe, ...context } }, scope ? [scope] : []);
  }
  closed(room: Room, reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY') {
    const refs = this.rooms.get(room); if (!refs) return;
    const scopes = this.observable(room, refs); if (!scopes) return;
    this.fact({ name: 'room_waiting_closed', data: { roomRef: refs.roomRef, reason } }, scopes); this.rooms.delete(room); this.observations.delete(room);
  }
  started(room: Room) {
    const refs = this.rooms.get(room); if (!refs || refs.gameRef) return;
    const scopes = this.observable(room, refs); if (!scopes) return;
    const settings = room.settings; const people = room.participants;
    const humans = people.filter((p) => p.kind === 'HUMAN' && p.isPlayer); const bots = people.filter((p) => p.kind === 'BOT');
    refs.gameRef = this.id(); refs.started = this.clock.now().monotonic;
    this.fact({ name: 'game_started', data: { roomRef: refs.roomRef, gameRef: refs.gameRef,
      configuration: { deckId: room.selectedDeck!.id, deckSchemaVersion: room.selectedDeck!.schemaVersion,
        deckContentVersion: room.selectedDeck!.contentVersion, humanPlayerCount: humans.length, humanObserverCount: settings.hostPlays ? 0 : 1,
        botCount: bots.length, playerCount: humans.length + bots.length, hostPlays: settings.hostPlays,
        botsByDifficulty: { EASY: bots.filter((p) => p.botDifficulty === 'EASY').length, HARD: bots.filter((p) => p.botDifficulty === 'HARD').length },
        turnSeconds: settings.turnSeconds, reviewSeconds: settings.reviewSeconds, forceTieBreak: settings.forceTieBreak,
        attributeValueMode: settings.attributeValueMode, optimizeForMobile: settings.optimizeForMobile },
      humanParticipations: humans.map((p) => ({ participationRef: this.person(refs, p.id), isHost: p.role === 'HOST' })) } }, scopes);
  }
  automatic(room: Room) {
    const refs = this.rooms.get(room); if (!refs?.gameRef) return;
    const scopes = this.observable(room, refs); if (!scopes) return;
    for (const player of room.game!.players) if (player.kind === 'HUMAN' && player.status === 'AUTOMATIC' && !refs.automatic.has(player.id)) {
      refs.automatic.add(player.id);
      this.fact({ name: 'human_became_automatic', data: { roomRef: refs.roomRef, gameRef: refs.gameRef,
        participationRef: this.person(refs, player.id), phase: room.game!.round.kind === 'TIE_BREAK' ? 'TIE_BREAK' : 'BASE' } }, scopes);
    }
  }
  ended(room: Room, controlledStop = false) {
    const refs = this.rooms.get(room); if (!refs?.gameRef || refs.started === undefined || refs.ended) return;
    if (!controlledStop && room.status !== 'RESULTS') return;
    const scopes = this.observable(room, refs); if (!scopes) return;
    refs.ended = true;
    this.fact({ name: 'game_ended', data: { roomRef: refs.roomRef, gameRef: refs.gameRef,
      reason: controlledStop ? 'TECHNICAL_INTERRUPTION' : room.game!.result!.endReason,
      durationMs: Math.max(0, Math.round(this.clock.now().monotonic - refs.started)), evidence: controlledStop ? 'CONTROLLED_SERVER_STOP' : 'GAME_RESULT' } }, scopes);
    this.observations.delete(room);
  }
}
// Mismo recorrido con sink nulo; sin generar/persistir referencias en instalaciones desactivadas.
export const disabledUsage = { browser: () => false, created: () => {}, joined: () => {}, joinRejected: () => {}, closed: () => {},
  started: () => {}, automatic: () => {}, ended: () => {}, lost: () => {} } satisfies Pick<UsageRecording, 'browser' | 'created' | 'joined' | 'joinRejected' | 'closed' | 'started' | 'automatic' | 'ended' | 'lost'>;
export type UsageRecorder = typeof disabledUsage | UsageRecording;
export { nullUsageSink };
