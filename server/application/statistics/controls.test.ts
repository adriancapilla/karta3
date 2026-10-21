import { expect, it } from 'vitest';
import { StatisticsControls } from './controls.js';
import { ControlledTime } from '../../../tests/support/controlledTime.js';
import { STATISTICS_NOTICE_VERSION } from '../../../shared/contracts/statistics.js';
function setup() { const time = new ControlledTime(); const c = new StatisticsControls(time, time, () => 100, () => true); return { c, time }; }
const grant = (revision: number, requestId = 'grant') => ({ decision: 'GRANT' as const, expectedRevision: revision, requestId, noticeVersion: STATISTICS_NOTICE_VERSION });
it('A05: nueva sesión incluida por defecto; cookie anterior/incorrecta restringida; inclusión no concede apariencia', () => {
  const { c } = setup(); c.establish('new', false, undefined); c.establish('old', true, undefined); c.establish('bad', false, 'invalid');
  expect(c.eligible('new')).toBe(true); expect(c.permitted('new')).toBe(false);
  expect(c.view('old').exclusion.eligibility).toBe('PENDING_LEGACY_CHOICE'); expect(c.eligible('old')).toBe(false); expect(c.eligible('bad')).toBe(false);
  c.exclusion('old', { excluded: false, expectedRevision: 100, requestId: 'choose' }); expect(c.eligible('old')).toBe(true); expect(c.permitted('old')).toBe(false); c.dispose();
});
it('A05/A07: cookie funcional válida no concede apariencia; B19 no existe como fuente', () => {
  const { c } = setup(); c.establish('included', true, '1:0'); c.establish('excluded', true, '1:1');
  expect(c.eligible('included')).toBe(true); expect(c.eligible('excluded')).toBe(false); expect(c.permitted('included')).toBe(false); c.dispose();
});
it('A07: permiso separado, doce horas exactas sin renovación por replay/lectura', () => {
  const { c, time } = setup(); c.establish('a', false, undefined); const result = c.appearance('a', grant(100));
  expect(result.state).toBe('GRANTED'); time.elapse(43_199_999); expect(c.permitted('a')).toBe(true);
  expect(c.appearance('a', grant(100)).validUntil).toBe(result.validUntil); time.elapse(1); expect(c.permitted('a')).toBe(false);
  expect(c.view('a').appearance.state).toBe('UNDECIDED'); expect(c.eligible('a')).toBe(true); c.dispose();
});
it('A05/A07: restricción prevalece sobre revisión vieja; concesión vieja no revoca corte', () => {
  const { c } = setup(); c.establish('a', false, undefined); c.appearance('a', grant(100));
  c.appearance('a', { ...grant(0, 'withdraw'), decision: 'WITHDRAW' }); expect(c.permitted('a')).toBe(false); expect(c.eligible('a')).toBe(true);
  expect(c.appearance('a', grant(100)).state).toBe('DECLINED'); // Replay devuelve estado actual, no permiso anterior.
  c.exclusion('a', { excluded: true, expectedRevision: 0, requestId: 'cut' }); expect(c.eligible('a')).toBe(false);
  expect(() => c.exclusion('a', { excluded: false, expectedRevision: 0, requestId: 'stale' })).toThrow('CHOICE_CONFLICT');
  expect(c.exclusion('a', { excluded: true, expectedRevision: 0, requestId: 'cut' }).writeCookie).toBe(false); c.dispose();
});
it('A07: versión distinta no concede; restricciones funcionan con escritor apagado', () => {
  const { c } = setup(); c.establish('a', false, undefined);
  expect(() => c.appearance('a', { ...grant(100), noticeVersion: 'previous' })).toThrow(); c.dispose();
  const time = new ControlledTime(); const off = new StatisticsControls(time, time, () => 1, () => false); off.establish('a', false, undefined);
  expect(off.exclusion('a', { excluded: true, expectedRevision: 0, requestId: 'cut' }).view.excluded).toBe(true);
  expect(() => off.appearance('a', grant(2))).toThrow(); off.dispose();
});
it('A05: cookie de una petición anterior en vuelo no revierte una elección expresa nueva en la misma sesión RAM', () => {
  const { c } = setup(); c.establish('a', false, undefined);
  c.exclusion('a', { excluded: true, expectedRevision: 100, requestId: 'exclude' });
  c.exclusion('a', { excluded: false, expectedRevision: 101, requestId: 'include' });
  c.establish('a', true, '1:1'); expect(c.eligible('a')).toBe(true);
  expect(c.view('a').exclusion.revision).toBe(102); c.dispose();
});
it('A05: máximo4096 estados; saturación restringe y admite corte en memoria sin conceder o bloquear juego', () => {
  const { c } = setup(); for (let n = 0; n < 4097; n++) c.establish(`functional-${n}`, false, undefined);
  expect(c.eligible('functional-0')).toBe(false); expect(c.eligible('functional-4096')).toBe(false);
  const result = c.exclusion('functional-4096', { excluded: true, expectedRevision: 0, requestId: 'restrict' });
  expect(result.view.excluded).toBe(true); expect(result.writeCookie).toBe(false); expect(result.view.persistence).toBe('MEMORY_ONLY'); c.dispose();
});
