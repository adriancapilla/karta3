import type { BrowserUsageEvent, UsageContext } from '../../../shared/contracts/usage.js';
export type UsageEnvironment = 'development' | 'test' | 'pruebas' | 'production';
export type UsageTraffic = 'HUMAN' | 'SYNTHETIC';
export type UsageConfiguration = {
  deckId: string; deckSchemaVersion: number; deckContentVersion: number;
  humanPlayerCount: number; humanObserverCount: number; botCount: number; playerCount: number;
  hostPlays: boolean; botsByDifficulty: { EASY: number; HARD: number };
  turnSeconds: number; reviewSeconds: number; forceTieBreak: boolean;
  attributeValueMode: 'PLAY_VALUE' | 'DISPLAY_VALUE'; optimizeForMobile: boolean;
};
export const joinReasons = ['INVALID_INPUT', 'SESSION_REQUIRED', 'ROOM_NOT_AVAILABLE', 'ROOM_FULL', 'ALREADY_IN_ROOM',
  'PARTICIPATION_ENDED', 'GAME_ALREADY_STARTED', 'GAME_FINISHED', 'REQUEST_CONFLICT', 'FORBIDDEN', 'INTERNAL_ERROR'] as const;
export type JoinReason = typeof joinReasons[number];
export type EndReason = 'DECK_COMPLETED' | 'HOST_CANCELLED' | 'NO_ACTIVE_HUMAN_PLAYERS' | 'TECHNICAL_INTERRUPTION';
export type ServerUsageFact =
  | { name: 'room_created'; data: { roomRef: string } & Partial<UsageContext> }
  | { name: 'room_join_resolved'; data: { intentRef: string; outcome: 'NEW_JOIN' | 'EXISTING_PARTICIPATION' | 'REJECTED';
      reason: JoinReason | null; roomRef?: string; participationRef?: string } & Partial<UsageContext> }
  | { name: 'room_waiting_closed'; data: { roomRef: string; reason: 'HOST_CLOSED' | 'HOST_DISCONNECTED' | 'INACTIVITY' } }
  | { name: 'game_started'; data: { roomRef: string; gameRef: string; configuration: UsageConfiguration;
      humanParticipations: { participationRef: string; isHost: boolean }[] } }
  | { name: 'human_became_automatic'; data: { roomRef: string; gameRef: string; participationRef: string; phase: 'BASE' | 'TIE_BREAK' } }
  | { name: 'game_ended'; data: { roomRef: string; gameRef: string; reason: EndReason; durationMs: number; evidence: 'GAME_RESULT' | 'CONTROLLED_SERVER_STOP' } };
export type UsageEvent = { eventId: string; version: 1; environment: UsageEnvironment; traffic: UsageTraffic;
  occurredAt: number; receivedAt: number; bootRef: string } & (
    { source: 'SERVER' } & ServerUsageFact | { source: 'BROWSER' } & BrowserUsageEvent
  );
export const reports = ['access', 'creation', 'joining', 'room-conversion', 'configuration', 'duration', 'completion', 'automatic'] as const;
export type UsageReportName = typeof reports[number];
export type UsageFilter = { report: UsageReportName; from: number; to: number; environment: UsageEnvironment };
export type Aggregate = { report: UsageReportName; dimension: string; metric: string; count: number; sum: number; min: number | null; max: number | null };
export const discardReasons = ['WRITER_UNAVAILABLE', 'INVALID_EVENT', 'BROWSER_RESERVE', 'EVICTED_FOR_SERVER', 'QUEUE_FULL', 'TOO_OLD',
  'WRITE_FAILED', 'SHUTDOWN_DEADLINE', 'DISK_LIMIT', 'MAINTENANCE_FAILED', 'CORRELATION_LIMIT'] as const;
export type UsageHealth = { at: number; enabled: boolean; degraded: boolean; paused: boolean; queue: number; bytes: number;
  discarded: Partial<Record<`${'BROWSER' | 'SERVER'}:${typeof discardReasons[number]}`, number>> };
export type UsageQuality = { coverageFrom: number; asOf: number; possibleLoss: boolean; conflicts: number; unlinked: number;
  lastDurableAt: number | null; lastMaintenanceAt: number | null; restoredAggregatesOnly: boolean; partialCoverage: boolean;
  lastBackupAt: number | null; collection: 'enabled' | 'disabled' | 'degraded'; operational: UsageHealth | null; operationalStale: boolean };
export type UsageReport = { version: 1; traffic: UsageTraffic; filter: UsageFilter; quality: UsageQuality; rows: Aggregate[];
  numerator: number; denominator: number; percentage: number | null; meanDurationMs: number | null; provisional: boolean };
export type UsageErrorCode = 'INVALID_FILTER' | 'ENVIRONMENT_MISMATCH' | 'INSUFFICIENT_DETAIL' | 'COLLECTION_DISABLED'
  | 'STORAGE_UNAVAILABLE' | 'REPORT_TIMEOUT' | 'NOT_AUTHORIZED';
export class UsageError extends Error { constructor(readonly code: UsageErrorCode) { super(code); } }
/** Contexto de admisión RAM, ajeno al payload/ids de los nueve eventos. Nunca se reactiva. */
export type UsageScope = { active: boolean };
export type UsagePrivacyControl =
  | { kind: 'accept'; proof: { proofRef: string; noticeVersion: string; acceptedAt: number; validUntil: number } }
  | { kind: 'cut'; at: number; proofRefs: readonly string[]; roomRefs: readonly string[]; gameRefs: readonly string[] };
export interface UsagePrivacyStore {
  control(command: UsagePrivacyControl): Promise<void>;
  revoke(scopes: readonly UsageScope[], command: Extract<UsagePrivacyControl, { kind: 'cut' }>): Promise<void>;
}
export const nullUsagePrivacyStore: UsagePrivacyStore = { control: async () => { throw new UsageError('STORAGE_UNAVAILABLE'); },
  revoke: async () => { throw new UsageError('STORAGE_UNAVAILABLE'); } };
export type UsageObservationCut = { scopes: UsageScope[]; roomRefs: string[]; gameRefs: string[] };
export interface UsagePermission {
  scope(sessionId: string): UsageScope | undefined;
  onInvalidated(listener: (sessionId: string) => UsageObservationCut): () => void;
  censor(cut: UsageObservationCut): void;
}
export interface UsageEventSink { tryRecord(event: UsageEvent, scopes?: readonly UsageScope[]): boolean; noteLoss?(reason: 'CORRELATION_LIMIT'): void }
export interface UsageEventStore { append(events: readonly UsageEvent[]): Promise<void> }
export interface UsageReportReader { read(filter: UsageFilter): Promise<UsageReport> }
export interface UsageMaintenance { maintain(at: number): Promise<void>; backup(at: number): Promise<void> }
export const nullUsageSink: UsageEventSink = { tryRecord: () => false };
