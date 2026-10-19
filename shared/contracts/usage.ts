/** Solo declaraciones del documento; nunca identidad, reloj ni resultados de juego. */
export const USAGE_NOTICE_VERSION = '2026-10-19.2';
export type UsageContext = { visitId: string; intentId: string };
export type UsageChoiceView = { available: boolean; decision: 'UNDECIDED' | 'ACCEPTED' | 'REJECTED'; revision: number;
  noticeVersion: string; validUntil: number | null };
export type UsageChoiceRequest = { decision: 'ACCEPTED' | 'REJECTED'; noticeVersion: string; expectedRevision: number; requestId: string };
export function usageChoiceRequest(value: unknown): UsageChoiceRequest | undefined {
  if (usageKeys(value, ['decision', 'noticeVersion', 'expectedRevision', 'requestId'])
    && (value.decision === 'ACCEPTED' || value.decision === 'REJECTED')
    && typeof value.noticeVersion === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value.noticeVersion)
    && Number.isSafeInteger(value.expectedRevision) && Number(value.expectedRevision) >= 0
    && typeof value.requestId === 'string' && value.requestId.length > 0 && value.requestId.length <= 100) return value as UsageChoiceRequest;
}
export type BrowserUsageEvent = { eventId: string; version: 1; visitId: string } & (
  { name: 'home_viewed'; data: { viewId: string; navigation: 'DOCUMENT_INITIAL' | 'DOCUMENT_RELOAD' | 'SPA_RETURN' } }
  | { name: 'room_create_intended' | 'room_join_attempted'; data: { intentId: string } }
);

export const usageUuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function usageKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}
export function usageContext(value: unknown): UsageContext | undefined {
  return usageKeys(value, ['visitId', 'intentId']) && usageUuid(value.visitId) && usageUuid(value.intentId)
    ? { visitId: value.visitId, intentId: value.intentId } : undefined;
}
export function browserUsage(value: unknown): BrowserUsageEvent | undefined {
  if (!usageKeys(value, ['eventId', 'version', 'visitId', 'name', 'data']) || !usageUuid(value.eventId)
    || value.version !== 1 || !usageUuid(value.visitId)) return;
  if (value.name === 'home_viewed' && usageKeys(value.data, ['viewId', 'navigation']) && usageUuid(value.data.viewId)
    && ['DOCUMENT_INITIAL', 'DOCUMENT_RELOAD', 'SPA_RETURN'].includes(String(value.data.navigation))) return value as BrowserUsageEvent;
  if (['room_create_intended', 'room_join_attempted'].includes(String(value.name))
    && usageKeys(value.data, ['intentId']) && usageUuid(value.data.intentId)) return value as BrowserUsageEvent;
}
