export const MODEL = 'AGG_DAILY_V1';
export const SCHEMA = 1;
export const families = ['HOME', 'CREATION', 'JOIN', 'WAITING', 'GAME', 'CONFIGURATION', 'DURATION', 'AUTOMATIC', 'APPEARANCE', 'QUALITY'] as const;
export type Family = typeof families[number];
export type Environment = 'development' | 'test' | 'pruebas' | 'production';
export type Traffic = 'HUMAN' | 'SYNTHETIC';
export const reports = ['access', 'creation', 'joining', 'room-conversion', 'configuration', 'completion', 'duration', 'automatic', 'appearance'] as const;
export type ReportName = typeof reports[number];
export type Day = string;
export type Cell = { day: Day; family: Family; dimension: string; category: string; measure: string; value: number };
export const qualityCauses = ['PARTIAL_DAY', 'WRITE_UNCERTAIN', 'RESTART', 'QUEUE_FULL', 'CORRELATION_LIMIT', 'DISK_LIMIT', 'PAUSED', 'RESTORED', 'DIMENSION_LIMIT'] as const;
export type Coverage = { day: Day; family: Family; cause: typeof qualityCauses[number] };
/** La única unidad admitida por almacenamiento: celdas reducidas y calidad, jamás hechos o referencias. */
export type Delta = { cells: readonly Cell[]; coverage: readonly Coverage[] };
export interface AggregateSink { admit(unit: Delta, source: 'SERVER' | 'BROWSER'): boolean; available(): boolean;
  pause(cause: typeof qualityCauses[number]): void; onInvalidated(listener: () => void): () => void; packageCategories?(): readonly { day: string; category: string }[] }
export const nullSink: AggregateSink = { admit: () => false, available: () => false, pause: () => {}, onInvalidated: () => () => {} };
export type Snapshot = { deckId: string; deckSchemaVersion: number; deckContentVersion: number; humanPlayerCount: number; humanObserverCount: number;
  botCount: number; playerCount: number; easyCount: number; hardCount: number; hostPlays: boolean; turnSeconds: number;
  reviewSeconds: number; forceTieBreak: boolean; attributeValueMode: 'PLAY_VALUE' | 'DISPLAY_VALUE'; optimizeForMobile: boolean };
export type EndReason = 'DECK_COMPLETED' | 'HOST_CANCELLED' | 'NO_ACTIVE_HUMAN_PLAYERS' | 'TECHNICAL_INTERRUPTION';
export type Filter = { report: ReportName; from: Day; to: Day; environment: Environment };
export type AggregateData = { model: typeof MODEL; schema: 1; environment: Environment; traffic: Traffic; cells: Cell[]; coverage: Coverage[];
  asOf: string; frontier: Day; instrumentedFrom: Day; restored: boolean };
export interface AggregateReader { read(filter: Filter): Promise<AggregateData> }
export class StatisticsError extends Error { constructor(readonly code: 'INVALID_FILTER' | 'STORAGE_UNAVAILABLE' | 'ENVIRONMENT_MISMATCH' | 'NOT_AUTHORIZED' | 'REPORT_TIMEOUT' | 'CHOICE_CONFLICT') { super(code); } }
export const dayOf = (unix: number): Day => new Date(unix).toISOString().slice(0, 10);
export function retentionDay(unix: number) { const d = new Date(unix); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 11, 1)).toISOString().slice(0, 10); }
