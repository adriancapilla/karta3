import { families, qualityCauses, type Cell, type Delta, type Snapshot } from './contracts.js';
export const categories = ['L0', 'L1', 'D1', 'C1', 'H1'] as const;
export type Category = typeof categories[number];
export const ends = ['DECK_COMPLETED', 'HOST_CANCELLED', 'NO_ACTIVE_HUMAN_PLAYERS', 'TECHNICAL_INTERRUPTION'] as const;
export const configuration = ['package', 'humanPlayerCount', 'humanObserverCount', 'botCount', 'playerCount', 'easyCount', 'hardCount', 'hostPlays',
  'turnSeconds', 'reviewSeconds', 'forceTieBreak', 'attributeValueMode', 'optimizeForMobile'] as const;
const balanced: Partial<Record<Cell['family'], readonly string[]>> = {
  WAITING: ['created', 'started', 'closed', 'pending', 'unknown', 'cut'], GAME: ['started', 'active', 'unknown', 'cut', ...ends],
  AUTOMATIC: ['base', 'became', 'open', 'closed', 'unknown', 'cut'], APPEARANCE: ['population', 'pending', 'unknown', 'cut', 'absent']
};
export function validCell(cell: Cell): boolean {
  if (!cell || typeof cell !== 'object' || Object.keys(cell).sort().join(',') !== 'category,day,dimension,family,measure,value'
    || !/^\d{4}-\d{2}-\d{2}$/.test(cell.day) || !Number.isFinite(Date.parse(`${cell.day}T00:00:00Z`)) || new Date(`${cell.day}T00:00:00Z`).toISOString().slice(0, 10) !== cell.day
    || !families.includes(cell.family) || !Number.isSafeInteger(cell.value) || !cell.value) return false;
  const { family: f, dimension: d, category: c, measure: m } = cell;
  if (d === 'balance' && balanced[f]?.includes(c) && m === 'count') return cell.value > 0 || ['WAITING:pending', 'GAME:active', 'AUTOMATIC:open', 'APPEARANCE:pending'].includes(`${f}:${c}`);
  if (cell.value < 0) return false;
  if (f === 'HOME' || f === 'CREATION') return d === 'total' && c === 'all' && m === 'count';
  if (f === 'JOIN') return m === 'count' && (d === 'outcome' && ['NEW_JOIN', 'EXISTING_PARTICIPATION', 'REJECTED'].includes(c)
    || d === 'reason' && ['INPUT', 'AVAILABILITY_OR_PHASE', 'CAPACITY', 'IDENTITY_OR_PERMISSION', 'CONFLICT', 'TECHNICAL'].includes(c));
  if (f === 'WAITING') return d === 'reason' && ['HOST_CLOSED', 'HOST_DISCONNECTED', 'INACTIVITY'].includes(c) && m === 'count';
  if (f === 'CONFIGURATION' && m === 'count') {
    if (d === 'package') return /^[a-z0-9]+(?:-[a-z0-9]+)*:[12]:[1-9]\d{0,8}$/.test(c);
    if (['hostPlays', 'forceTieBreak', 'optimizeForMobile'].includes(d)) return ['true', 'false'].includes(c);
    if (d === 'attributeValueMode') return ['PLAY_VALUE', 'DISPLAY_VALUE'].includes(c);
    if (d === 'turnSeconds') return ['15', '30', '60'].includes(c);
    if (d === 'reviewSeconds') return ['0', '2', '5', '10', '15', '30'].includes(c);
    return configuration.includes(d as typeof configuration[number]) && /^[0-5]$/.test(c);
  }
  if (f === 'DURATION') return (d === 'total' && c === 'all' || d === 'reason' && ends.includes(c as typeof ends[number])) && ['count', 'seconds'].includes(m)
    || d === 'bin' && /^[0-6]$/.test(c) && m === 'count';
  if (f === 'APPEARANCE') return m === 'count' && (['start', 'end'].includes(d) && categories.includes(c as Category)
    || d === 'pair' && c.split(':').length === 2 && c.split(':').every(v => categories.includes(v as Category)));
  return false;
}
export function validDelta(unit: Delta) {
  return !!unit && Object.keys(unit).sort().join(',') === 'cells,coverage' && Array.isArray(unit.cells) && Array.isArray(unit.coverage)
    && unit.cells.length > 0 && unit.cells.length + unit.coverage.length <= 64 && unit.coverage.length <= 32 && unit.cells.every(validCell)
    && unit.coverage.every(c => !!c && Object.keys(c).sort().join(',') === 'cause,day,family' && /^\d{4}-\d{2}-\d{2}$/.test(c.day) && families.includes(c.family) && qualityCauses.includes(c.cause));
}
export function histogram(snapshot: Snapshot): [string, string][] {
  return configuration.map(dimension => [dimension, dimension === 'package' ? `${snapshot.deckId}:${snapshot.deckSchemaVersion}:${snapshot.deckContentVersion}` : String(snapshot[dimension])]);
}
export function joinReason(reason: string) {
  if (reason === 'INVALID_INPUT') return 'INPUT';
  if (['ROOM_NOT_AVAILABLE', 'GAME_ALREADY_STARTED', 'GAME_FINISHED'].includes(reason)) return 'AVAILABILITY_OR_PHASE';
  if (reason === 'ROOM_FULL') return 'CAPACITY';
  if (['SESSION_REQUIRED', 'ALREADY_IN_ROOM', 'PARTICIPATION_ENDED', 'FORBIDDEN'].includes(reason)) return 'IDENTITY_OR_PERMISSION';
  return reason === 'REQUEST_CONFLICT' ? 'CONFLICT' : 'TECHNICAL';
}
