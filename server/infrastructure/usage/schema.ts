import type { UsageEnvironment, UsageTraffic, UsageHealth } from '../../application/usage/contracts.js';
export const DETAIL_MS = 90 * 86_400_000;
export const month = (at: number) => new Date(at).toISOString().slice(0, 7);
export const firstMonth = (at: number, offset = 0) => { const d = new Date(at); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1); };
export type Metadata = { environment: UsageEnvironment; traffic: UsageTraffic; version: 1 | 2 | 3; coverageFrom: number; bootRef: string | null; clean: boolean;
  possibleLoss: boolean; conflicts: number; unlinked: number; lastDurableAt: number | null; lastMaintenanceAt: number | null; restoredAggregatesOnly: boolean;
  lastBackupAt: number | null; aggregateAsOf?: number; collectionEnabled: boolean; operational?: UsageHealth; consentRequired?: boolean; appearanceFrom?: number };
