import { appearanceValue, type AppearanceMoment, type AppearanceValue } from './appearance.js';

export const STATISTICS_NOTICE_VERSION = '2026-10-20.2';
export type ExclusionView = { version: 1; excluded: boolean; revision: number; persistence: 'COOKIE_REQUESTED' | 'MEMORY_ONLY';
  eligibility: 'DEFAULT_ALLOWED' | 'EXCLUDED' | 'PENDING_LEGACY_CHOICE' };
export type ExclusionRequest = { excluded: boolean; expectedRevision: number; requestId: string };
export type AppearancePermissionView = { version: 1; state: 'UNDECIDED' | 'GRANTED' | 'DECLINED'; noticeVersion: string;
  revision: number; validUntil: number | null };
export type AppearancePermissionRequest = { decision: 'GRANT' | 'DECLINE' | 'WITHDRAW'; noticeVersion: string; expectedRevision: number; requestId: string };
export type StatisticsStateEvent = { exclusion: ExclusionView; appearance: AppearancePermissionView; available: boolean };
export type AppearanceSnapshot = { version: 1; gameId: string; moment: AppearanceMoment; windowToken: string } & AppearanceValue;
export function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
const revision = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const requestId = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 100;
export function exclusionRequest(value: unknown): ExclusionRequest | undefined {
  if (exactKeys(value, ['excluded', 'expectedRevision', 'requestId']) && typeof value.excluded === 'boolean'
    && revision(value.expectedRevision) && requestId(value.requestId)) return value as ExclusionRequest;
}
export function appearancePermissionRequest(value: unknown): AppearancePermissionRequest | undefined {
  if (exactKeys(value, ['decision', 'noticeVersion', 'expectedRevision', 'requestId'])
    && ['GRANT', 'DECLINE', 'WITHDRAW'].includes(String(value.decision)) && typeof value.noticeVersion === 'string'
    && value.noticeVersion.length <= 80 && revision(value.expectedRevision) && requestId(value.requestId)) return value as AppearancePermissionRequest;
}
export function appearanceSnapshot(value: unknown): AppearanceSnapshot | undefined {
  if (exactKeys(value, ['version', 'gameId', 'moment', 'windowToken', 'theme', 'origin']) && value.version === 1
    && requestId(value.gameId) && typeof value.windowToken === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.windowToken)
    && ['START', 'END'].includes(String(value.moment)) && appearanceValue({ theme: value.theme, origin: value.origin })) return value as AppearanceSnapshot;
}
