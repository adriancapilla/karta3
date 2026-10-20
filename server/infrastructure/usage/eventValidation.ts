import { browserUsage, usageKeys, usageUuid } from '../../../shared/contracts/usage.js';
import { appearanceValue } from '../../../shared/contracts/appearance.js';
import { discardReasons, joinReasons, type UsageEvent, type UsageHealth, type UsagePrivacyControl } from '../../application/usage/contracts.js';

const number = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const uuidFields = (v: Record<string, unknown>, fields: string[]) => fields.every((key) => usageUuid(v[key]));
export function validPrivacyControl(value: unknown): value is UsagePrivacyControl {
  const refs = (v: unknown) => Array.isArray(v) && v.length <= 64 && v.every(usageUuid) && new Set(v).size === v.length;
  if (usageKeys(value, ['kind', 'proof']) && value.kind === 'accept' && usageKeys(value.proof, ['proofRef', 'noticeVersion', 'acceptedAt', 'validUntil'])) {
    const p = value.proof;
    return usageUuid(p.proofRef) && typeof p.noticeVersion === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(p.noticeVersion)
      && number(p.acceptedAt) && number(p.validUntil) && p.validUntil === Number(p.acceptedAt) + 12 * 60 * 60_000;
  }
  return usageKeys(value, ['kind', 'at', 'proofRefs', 'roomRefs', 'gameRefs']) && value.kind === 'cut' && number(value.at)
    && refs(value.proofRefs) && refs(value.roomRefs) && refs(value.gameRefs);
}
export function validUsageHealth(value: unknown): value is UsageHealth {
  if (!usageKeys(value, ['at', 'enabled', 'degraded', 'paused', 'queue', 'bytes', 'discarded']) || !number(value.at)
    || typeof value.enabled !== 'boolean' || typeof value.degraded !== 'boolean' || typeof value.paused !== 'boolean'
    || !number(value.queue) || Number(value.queue) > 2048 || !number(value.bytes) || Number(value.bytes) > 2 * 1024 ** 2
    || !value.discarded || typeof value.discarded !== 'object' || Array.isArray(value.discarded)) return false;
  return Object.entries(value.discarded).every(([key, count]) => /^(?:BROWSER|SERVER):/.test(key)
    && discardReasons.includes(key.slice(key.indexOf(':') + 1) as typeof discardReasons[number]) && number(count));
}
export function canonicalUsage(value: unknown): string {
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)])) : v;
  return JSON.stringify(canonical(value));
}
/** Segunda frontera cerrada del worker. No serialización de objetos de aplicación. */
export function validUsageEvent(value: UsageEvent): boolean {
  const e = value; const d = e.data as unknown as Record<string, unknown>;
  const browser = e.source === 'BROWSER';
  if (!usageKeys(e, ['eventId', 'version', 'source', 'environment', 'traffic', 'occurredAt', 'receivedAt', 'bootRef', 'name', 'data', ...(browser ? ['visitId'] : [])])
    || !usageUuid(e.eventId) || e.version !== 1 || !usageUuid(e.bootRef) || !number(e.occurredAt) || !number(e.receivedAt)
    || !['development', 'test', 'pruebas', 'production'].includes(e.environment) || !['HUMAN', 'SYNTHETIC'].includes(e.traffic)) return false;
  if (browser && e.name === 'appearance_snapshot') return usageUuid(e.visitId)
    && usageKeys(d, ['roomRef', 'gameRef', 'participationRef', 'moment', 'theme', 'origin'])
    && uuidFields(d, ['roomRef', 'gameRef', 'participationRef']) && ['START', 'END'].includes(String(d.moment))
    && appearanceValue({ theme: d.theme, origin: d.origin });
  if (browser) return !!browserUsage({ eventId: e.eventId, version: 1, visitId: e.visitId, name: e.name, data: e.data });
  if (e.source !== 'SERVER' || !d || typeof d !== 'object') return false;
  const context = Object.hasOwn(d, 'visitId') || Object.hasOwn(d, 'intentId');
  if (context && !uuidFields(d, ['visitId', 'intentId'])) return false;
  const contextual = (keys: string[]) => usageKeys(d, [...keys, ...(context ? ['visitId', 'intentId'] : [])]);
  switch (e.name) {
    case 'room_created': return contextual(['roomRef']) && usageUuid(d.roomRef);
    case 'room_join_resolved': return contextual(['intentRef', 'outcome', 'reason', ...(d.outcome === 'REJECTED' ? [] : ['roomRef', 'participationRef'])])
      && usageUuid(d.intentRef) && (d.outcome === 'REJECTED' ? joinReasons.includes(d.reason as typeof joinReasons[number])
        : ['NEW_JOIN', 'EXISTING_PARTICIPATION'].includes(String(d.outcome)) && d.reason === null && uuidFields(d, ['roomRef', 'participationRef']));
    case 'room_waiting_closed': return usageKeys(d, ['roomRef', 'reason']) && usageUuid(d.roomRef)
      && ['HOST_CLOSED', 'HOST_DISCONNECTED', 'INACTIVITY'].includes(String(d.reason));
    case 'human_became_automatic': return usageKeys(d, ['roomRef', 'gameRef', 'participationRef', 'phase'])
      && uuidFields(d, ['roomRef', 'gameRef', 'participationRef']) && ['BASE', 'TIE_BREAK'].includes(String(d.phase));
    case 'game_ended': return usageKeys(d, ['roomRef', 'gameRef', 'reason', 'durationMs', 'evidence']) && uuidFields(d, ['roomRef', 'gameRef'])
      && number(d.durationMs) && ['DECK_COMPLETED', 'HOST_CANCELLED', 'NO_ACTIVE_HUMAN_PLAYERS', 'TECHNICAL_INTERRUPTION'].includes(String(d.reason))
      && d.evidence === (d.reason === 'TECHNICAL_INTERRUPTION' ? 'CONTROLLED_SERVER_STOP' : 'GAME_RESULT');
    case 'game_started': {
      if (!usageKeys(d, ['roomRef', 'gameRef', 'configuration', 'humanParticipations']) || !uuidFields(d, ['roomRef', 'gameRef'])) return false;
      const c = d.configuration as Record<string, unknown>;
      return usageKeys(c, ['deckId', 'deckSchemaVersion', 'deckContentVersion', 'humanPlayerCount', 'humanObserverCount', 'botCount', 'playerCount',
        'hostPlays', 'botsByDifficulty', 'turnSeconds', 'reviewSeconds', 'forceTieBreak', 'attributeValueMode', 'optimizeForMobile'])
        && typeof c.deckId === 'string' && /^[a-z0-9-]{1,64}$/.test(c.deckId)
        && [1, 2].includes(c.deckSchemaVersion as number) && number(c.deckContentVersion) && Number(c.deckContentVersion) > 0
        && ['humanPlayerCount', 'humanObserverCount', 'botCount', 'playerCount'].every((key) => number(c[key]) && Number(c[key]) <= 5)
        && Number(c.humanPlayerCount) >= 1 && Number(c.playerCount) >= 2 && c.playerCount === Number(c.humanPlayerCount) + Number(c.botCount)
        && typeof c.hostPlays === 'boolean' && c.humanObserverCount === (c.hostPlays ? 0 : 1)
        && usageKeys(c.botsByDifficulty, ['EASY', 'HARD']) && number(c.botsByDifficulty.EASY) && number(c.botsByDifficulty.HARD)
        && c.botCount === Number(c.botsByDifficulty.EASY) + Number(c.botsByDifficulty.HARD)
        && [15, 30, 60].includes(c.turnSeconds as number) && [0, 2, 5, 10, 15, 30].includes(c.reviewSeconds as number)
        && typeof c.forceTieBreak === 'boolean' && typeof c.optimizeForMobile === 'boolean' && ['PLAY_VALUE', 'DISPLAY_VALUE'].includes(String(c.attributeValueMode))
        && Array.isArray(d.humanParticipations) && d.humanParticipations.length === c.humanPlayerCount
        && d.humanParticipations.every((p) => usageKeys(p, ['participationRef', 'isHost']) && usageUuid(p.participationRef) && typeof p.isHost === 'boolean');
    }
  }
  return false;
}
