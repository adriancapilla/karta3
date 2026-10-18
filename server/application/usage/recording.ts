import type { UsageContext, BrowserUsageEvent } from '../../../shared/contracts/usage.js';
import type { Clock, IdentifierGenerator } from '../ports.js';
import type { Room } from '../room.js';
import { joinReasons, nullUsageSink, type JoinReason, type ServerUsageFact, type UsageEnvironment, type UsageEventSink, type UsageTraffic } from './contracts.js';

type References = { roomRef: string; people: Map<string, string>; gameRef?: string; started?: number; ended?: boolean; automatic: Set<string> };
/** Referencias estadísticas RAM, independientes. Solo emite DTO elegidos, nunca Room al adaptador. */
export class UsageRecording {
  private readonly rooms = new WeakMap<Room, References>();
  constructor(private readonly sink: UsageEventSink, private readonly clock: Clock, private readonly id: IdentifierGenerator,
    private readonly environment: UsageEnvironment, private readonly traffic: UsageTraffic, private readonly bootRef: string) {}
  private fact(fact: ServerUsageFact) {
    const at = Math.floor(this.clock.now().unix);
    try { this.sink.tryRecord({ ...fact, eventId: this.id(), version: 1, source: 'SERVER', environment: this.environment,
      traffic: this.traffic, occurredAt: at, receivedAt: at, bootRef: this.bootRef }); } catch { /* Un sink defectuoso tampoco afecta al juego. */ }
  }
  browser(event: BrowserUsageEvent): boolean {
    const at = Math.floor(this.clock.now().unix);
    try { return this.sink.tryRecord({ ...event, source: 'BROWSER', environment: this.environment, traffic: this.traffic,
      occurredAt: at, receivedAt: at, bootRef: this.bootRef }); } catch { return false; }
  }
  created(room: Room, context?: UsageContext) {
    if (this.rooms.has(room)) return;
    const references: References = { roomRef: this.id(), people: new Map(), automatic: new Set() };
    this.rooms.set(room, references); this.person(references, room.participantId);
    this.fact({ name: 'room_created', data: { roomRef: references.roomRef, ...context } });
  }
  private person(refs: References, participantId: string) {
    let id = refs.people.get(participantId); if (!id) { id = this.id(); refs.people.set(participantId, id); } return id;
  }
  joined(room: Room, participantId: string, existing: boolean, context?: UsageContext) {
    const refs = this.rooms.get(room); if (!refs) return;
    this.fact({ name: 'room_join_resolved', data: { intentRef: this.id(), outcome: existing ? 'EXISTING_PARTICIPATION' : 'NEW_JOIN', reason: null,
      roomRef: refs.roomRef, participationRef: this.person(refs, participantId), ...context } });
  }
  joinRejected(reason: string, context?: UsageContext) {
    const safe = joinReasons.includes(reason as JoinReason) ? reason as JoinReason : 'INTERNAL_ERROR';
    this.fact({ name: 'room_join_resolved', data: { intentRef: this.id(), outcome: 'REJECTED', reason: safe, ...context } });
  }
  closed(room: Room, reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY') {
    const refs = this.rooms.get(room); if (!refs) return;
    this.fact({ name: 'room_waiting_closed', data: { roomRef: refs.roomRef, reason } }); this.rooms.delete(room);
  }
  started(room: Room) {
    const refs = this.rooms.get(room); if (!refs || refs.gameRef) return;
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
      humanParticipations: humans.map((p) => ({ participationRef: this.person(refs, p.id), isHost: p.role === 'HOST' })) } });
  }
  automatic(room: Room) {
    const refs = this.rooms.get(room); if (!refs?.gameRef) return;
    for (const player of room.game!.players) if (player.kind === 'HUMAN' && player.status === 'AUTOMATIC' && !refs.automatic.has(player.id)) {
      refs.automatic.add(player.id);
      this.fact({ name: 'human_became_automatic', data: { roomRef: refs.roomRef, gameRef: refs.gameRef,
        participationRef: this.person(refs, player.id), phase: room.game!.round.kind === 'TIE_BREAK' ? 'TIE_BREAK' : 'BASE' } });
    }
  }
  ended(room: Room, controlledStop = false) {
    const refs = this.rooms.get(room); if (!refs?.gameRef || refs.started === undefined || refs.ended) return;
    if (!controlledStop && room.status !== 'RESULTS') return;
    refs.ended = true;
    this.fact({ name: 'game_ended', data: { roomRef: refs.roomRef, gameRef: refs.gameRef,
      reason: controlledStop ? 'TECHNICAL_INTERRUPTION' : room.game!.result!.endReason,
      durationMs: Math.max(0, Math.round(this.clock.now().monotonic - refs.started)), evidence: controlledStop ? 'CONTROLLED_SERVER_STOP' : 'GAME_RESULT' } });
  }
}
// Mismo recorrido con sink nulo; sin generar/persistir referencias en instalaciones desactivadas.
export const disabledUsage = { browser: () => false, created: () => {}, joined: () => {}, joinRejected: () => {}, closed: () => {},
  started: () => {}, automatic: () => {}, ended: () => {} } satisfies Pick<UsageRecording, 'browser' | 'created' | 'joined' | 'joinRejected' | 'closed' | 'started' | 'automatic' | 'ended'>;
export type UsageRecorder = typeof disabledUsage | UsageRecording;
export { nullUsageSink };
