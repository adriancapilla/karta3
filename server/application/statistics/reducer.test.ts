import { describe, expect, it } from 'vitest';
import { StatisticsReducer } from './reducer.js';
import { validDelta } from './catalog.js';
import type { AggregateSink, Cell, Delta, Snapshot } from './contracts.js';

const snapshot: Snapshot = { deckId: 'generica', deckSchemaVersion: 2, deckContentVersion: 4, humanPlayerCount: 2, humanObserverCount: 1,
  botCount: 1, playerCount: 3, easyCount: 0, hardCount: 1, hostPlays: false, turnSeconds: 15, reviewSeconds: 2,
  forceTieBreak: false, attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false };
function setup() {
  const units: Delta[] = []; let enabled = true; const listeners = new Set<() => void>();
  const sink: AggregateSink = { admit: unit => { if (!enabled) return false; expect(validDelta(unit)).toBe(true); units.push(structuredClone(unit)); return true; },
    available: () => enabled, pause: () => { enabled = false; for (const listener of listeners) listener(); }, onInvalidated: listener => { listeners.add(listener); return () => listeners.delete(listener); } };
  const r = new StatisticsReducer(sink); const key = {}; const d = Date.UTC(2026, 9, 19, 23, 59, 59);
  const total = (day: string, family: Cell['family'], category: string, dimension = 'balance', measure = 'count') => units.flatMap(u => u.cells)
    .filter(c => c.day === day && c.family === family && c.dimension === dimension && c.category === category && c.measure === measure).reduce((n, c) => n + c.value, 0);
  return { r, key, units, total, sink, d };
}
describe('B21 P1 — reducción previa a cola', () => {
  it('A01/A02: creación D1, inicio D2 y final D3 mantienen cohortes y duración truncada', () => {
    const { r, key, d, total, units } = setup();
    r.created(key, d, 0, true); r.created(key, d, 0, true);
    r.started(key, snapshot, ['a', 'b'], d + 2000, 1000); r.started(key, snapshot, ['a', 'b'], d + 2000, 1000);
    r.automatic(key, 'a', 2000); r.automatic(key, 'a', 2000); r.automatic(key, 'bot', 2000);
    // Unix cambia de día; la medición de duración procede exclusivamente del monotónico.
    r.ended(key, 'DECK_COMPLETED', d + 86_402_000, 62_999); r.ended(key, 'HOST_CANCELLED', d + 86_402_000, 63_000);
    expect(total('2026-10-19', 'WAITING', 'created')).toBe(1);
    expect(total('2026-10-19', 'WAITING', 'pending')).toBe(0);
    expect(total('2026-10-19', 'WAITING', 'started')).toBe(1);
    expect(total('2026-10-20', 'GAME', 'started')).toBe(1);
    expect(total('2026-10-20', 'GAME', 'active')).toBe(0);
    expect(total('2026-10-20', 'GAME', 'DECK_COMPLETED')).toBe(1);
    expect(total('2026-10-20', 'AUTOMATIC', 'became')).toBe(1);
    expect(total('2026-10-21', 'DURATION', 'all', 'total', 'seconds')).toBe(61);
    expect(total('2026-10-21', 'DURATION', '1', 'bin')).toBe(1);
    expect(units[1].cells.filter(c => c.family === 'CONFIGURATION')).toHaveLength(13);
    for (const unit of units) for (const c of unit.cells) expect(Object.keys(c).sort()).toEqual(['category', 'day', 'dimension', 'family', 'measure', 'value']);
  });
  it('A01: cierres conocidos, inclusión tardía y ciclos excluidos no crean altas', () => {
    const { r, key, d, total } = setup(); r.created(key, d, 0, true); r.closed(key, 'HOST_CLOSED', 1); r.closed(key, 'HOST_CLOSED', 2);
    const excluded = {}; r.created(excluded, d, 0, false); r.created(excluded, d, 1, true);
    expect(r.started(excluded, snapshot, ['a'], d, 2)).toBe(false);
    expect(total('2026-10-19', 'WAITING', 'closed')).toBe(1); expect(total('2026-10-19', 'WAITING', 'pending')).toBe(0);
  });
  it('A05: corte compartido irrevocable conserva base y no convierte desconocido en cierre', () => {
    const { r, key, d, total } = setup(); r.created(key, d, 0, true); r.started(key, snapshot, ['a', 'b'], d, 1); r.cut(key);
    r.ended(key, 'HOST_CANCELLED', d, 3); r.started(key, snapshot, ['a'], d, 4);
    expect(total('2026-10-19', 'GAME', 'started')).toBe(1); expect(total('2026-10-19', 'GAME', 'cut')).toBe(1);
    expect(total('2026-10-19', 'GAME', 'active')).toBe(0); expect(total('2026-10-19', 'AUTOMATIC', 'base')).toBe(2);
    expect(total('2026-10-19', 'APPEARANCE', 'population')).toBe(2); expect(total('2026-10-19', 'APPEARANCE', 'cut')).toBe(2);
  });
  it('A07: marginales, diagonal, END sin START y ausencia no inventan fotos', () => {
    const { r, key, d, total } = setup(); r.created(key, d, 0, true); r.started(key, snapshot, ['a', 'b', 'c'], d, 1);
    expect(r.photo(key, 'a', 'START', 'L0', 2)).toBe(true); expect(r.photo(key, 'a', 'START', 'D1', 3)).toBe(false);
    r.ended(key, 'HOST_CANCELLED', d, 4); r.photo(key, 'a', 'END', 'L0', 5); r.photo(key, 'b', 'END', 'C1', 6);
    r.sweep(10_004);
    expect(total('2026-10-19', 'APPEARANCE', 'L0:L0', 'pair')).toBe(1);
    expect(total('2026-10-19', 'APPEARANCE', 'C1', 'end')).toBe(1);
    expect(total('2026-10-19', 'APPEARANCE', 'pending')).toBe(0); expect(total('2026-10-19', 'APPEARANCE', 'absent')).toBe(1);
    expect(r.photo(key, 'c', 'END', 'L1', 10_005)).toBe(false);
  });
  it('A07: retirar antes de END elimina pareo y no reabre participación', () => {
    const { r, key, d, total } = setup(); r.created(key, d, 0, true); r.started(key, snapshot, ['a'], d, 1);
    r.photo(key, 'a', 'START', 'D1', 2); r.photoCut(key, 'a'); r.ended(key, 'DECK_COMPLETED', d, 3);
    expect(r.photo(key, 'a', 'END', 'L1', 4)).toBe(false); expect(total('2026-10-19', 'APPEARANCE', 'D1', 'start')).toBe(1);
  });
  it('A01: dos horas exactas cortan con unknown, sin renovar por consulta', () => {
    const { r, key, d, total } = setup(); r.created(key, d, 0, true); r.sweep(7_199_999); expect(r.observable(key)).toBe(true);
    r.sweep(7_200_000); r.sweep(7_200_001); expect(total('2026-10-19', 'WAITING', 'unknown')).toBe(1);
  });
  it.each([0, 59, 60, 179, 180, 299, 300, 599, 600, 1199, 1200, 2399, 2400])('A02: bin de %i segundos', seconds => {
    const { r, key, d, total } = setup(); r.created(key, d, 0, true); r.started(key, snapshot, ['a'], d, 1);
    r.ended(key, 'TECHNICAL_INTERRUPTION', d, seconds * 1000 + 1);
    const expected = [60, 180, 300, 600, 1200, 2400].filter(n => seconds >= n).length;
    expect(total('2026-10-19', 'DURATION', String(expected), 'bin')).toBe(1);
  });
  it('A03: unidad no admitida no avanza contexto y fallo invalida ciclos', () => {
    const { r, key, d, sink, total } = setup(); r.created(key, d, 0, true); sink.pause('WRITE_UNCERTAIN');
    expect(r.started(key, snapshot, ['a'], d, 1)).toBe(false); expect(total('2026-10-19', 'GAME', 'started')).toBe(0);
  });
  it('A01: categoría editorial 65 omite solo paquete; las otras doce marginales mantienen su base', () => {
    const { r, d, units } = setup();
    for (let n = 0; n < 65; n++) { const key = {}; r.created(key, d, n, true); r.started(key, { ...snapshot, deckId: `deck-${n}` }, ['a'], d, n + 1); }
    const cells = units.flatMap(u => u.cells).filter(c => c.family === 'CONFIGURATION');
    expect(cells.filter(c => c.dimension === 'package')).toHaveLength(64); expect(cells.filter(c => c.dimension === 'hostPlays')).toHaveLength(65);
    expect(units.flatMap(u => u.coverage)).toContainEqual({ day: '2026-10-19', family: 'CONFIGURATION', cause: 'DIMENSION_LIMIT' });
  });
});
