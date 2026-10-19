import { expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { UsageChoices } from './choice.js';
import type { UsagePrivacyStore, UsagePrivacyControl } from './contracts.js';
import { ControlledTime } from '../../../tests/support/controlledTime.js';
import type { UsageChoiceRequest } from '../../../shared/contracts/usage.js';

function fixture(capacity = 4096, requestCapacity = 64) {
  const time = new ControlledTime(); const control = vi.fn<UsagePrivacyStore['control']>().mockResolvedValue();
  const revoke = vi.fn<UsagePrivacyStore['revoke']>().mockResolvedValue(); let available = true;
  const choices = new UsageChoices({ control, revoke }, time, time, randomUUID, () => 100, '2026-10-19.1', () => available, () => {}, capacity, requestCapacity);
  const input = (decision: UsageChoiceRequest['decision'] = 'ACCEPTED', requestId = randomUUID()): UsageChoiceRequest => ({ decision, requestId,
    noticeVersion: choices.noticeVersion, expectedRevision: choices.current('actor').revision });
  return { time, choices, control, revoke, input, setAvailable: (value: boolean) => { available = value; } };
}
it('elección propia, recibo durable antes de aceptar; replay recupera vigente y no renueva12 h', async () => {
  const f = fixture(); expect(f.choices.current('actor').decision).toBe('UNDECIDED'); expect(f.choices.scope('actor')).toBeUndefined();
  const request = f.input(); const accepted = await f.choices.decide('actor', request); expect(accepted.decision).toBe('ACCEPTED');
  const scope = f.choices.scope('actor'); expect(scope?.active).toBe(true); const end = accepted.validUntil;
  f.time.advance(60_000); await f.choices.decide('actor', request); await f.choices.decide('actor', f.input());
  expect(f.control).toHaveBeenCalledOnce(); expect(f.choices.current('actor').validUntil).toBe(end); expect(f.choices.scope('actor')).toBe(scope);
  expect(f.choices.current('another').decision).toBe('UNDECIDED'); expect(JSON.stringify(f.control.mock.calls)).not.toMatch(/actor|session|visitId|cookie/);
  f.time.advance(12 * 60 * 60_000 - 60_000 - 1); expect(f.choices.scope('actor')).toBe(scope);
  f.time.advance(1); expect(f.choices.scope('actor')).toBeUndefined(); expect(f.choices.current('actor').decision).toBe('UNDECIDED'); expect(scope?.active).toBe(false);
});
it('versión/revisión antigua no acepta; REJECTED restrictivo admite ambas antiguas y espera barrera', async () => {
  const f = fixture(); const request = f.input();
  await expect(f.choices.decide('actor', { ...request, noticeVersion: 'old' })).rejects.toMatchObject({ code: 'CHOICE_CONFLICT' });
  await expect(f.choices.decide('actor', { ...request, expectedRevision: 0 })).rejects.toMatchObject({ code: 'CHOICE_CONFLICT' });
  await f.choices.decide('actor', request); const scope = f.choices.scope('actor');
  let release!: () => void; f.revoke.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  const reject = { ...f.input('REJECTED'), noticeVersion: 'old', expectedRevision: 0 };
  let ack = false; const pending = f.choices.decide('actor', reject).then(view => { ack = true; return view; });
  expect(scope?.active).toBe(false); expect(f.choices.scope('actor')).toBeUndefined(); expect(ack).toBe(false);
  const duplicate = f.choices.decide('actor', reject); expect(f.revoke).toHaveBeenCalledOnce();
  let consulted = false; let replayed = false;
  const consult = f.choices.confirmedCurrent('actor').then(view => { consulted = true; return view; });
  const oldAccepted = f.choices.decide('actor', request).then(view => { replayed = true; return view; });
  await Promise.resolve(); await Promise.resolve(); expect(consulted).toBe(false); expect(replayed).toBe(false);
  release(); const view = await pending; expect(await duplicate).toEqual(view); expect(view.decision).toBe('REJECTED');
  expect(await consult).toEqual(view); expect(await oldAccepted).toEqual(view);
  expect((await f.choices.decide('actor', request)).decision).toBe('REJECTED'); expect(f.control).toHaveBeenCalledOnce();
});
it('rechazar durante el recibo pendiente impide una aceptación antigua y no crea captura transitoria', async () => {
  const f = fixture(); let release!: () => void;
  f.control.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  const accept = f.choices.decide('actor', f.input()); expect(f.choices.scope('actor')).toBeUndefined();
  const rejected = await f.choices.decide('actor', f.input('REJECTED'));
  release(); expect((await accept).decision).toBe('REJECTED'); expect(f.choices.scope('actor')).toBeUndefined();
  expect(f.choices.current('actor').revision).toBe(rejected.revision);
  expect(f.revoke.mock.calls.every(call => call[1].proofRefs.length === 1)).toBe(true);
});
it('fallo de recibo nunca acepta; fallo de retirada mantiene bloqueo y el mismo ID puede confirmar barrera', async () => {
  const f = fixture(); f.control.mockRejectedValueOnce(new Error('DB unavailable'));
  await expect(f.choices.decide('actor', f.input())).rejects.toMatchObject({ code: 'CHOICE_UNAVAILABLE' }); expect(f.choices.scope('actor')).toBeUndefined();
  await f.choices.decide('actor', f.input()); const reject = f.input('REJECTED'); f.revoke.mockRejectedValueOnce(new Error('DB unavailable'));
  await expect(f.choices.decide('actor', reject)).rejects.toMatchObject({ code: 'CHOICE_UNAVAILABLE' }); const revision = f.choices.current('actor').revision;
  expect(f.choices.scope('actor')).toBeUndefined(); await expect(f.choices.decide('actor', f.input())).rejects.toMatchObject({ code: 'CHOICE_UNAVAILABLE' });
  expect((await f.choices.decide('actor', reject)).decision).toBe('REJECTED'); expect(f.choices.current('actor').revision).toBe(revision);
});
it('OFF no acepta, permite rechazo y no genera recibos; límites de RAM no bloquean retirada', async () => {
  const f = fixture(1, 2); f.setAvailable(false);
  await expect(f.choices.decide('actor', f.input())).rejects.toMatchObject({ code: 'CHOICE_UNAVAILABLE' });
  await f.choices.decide('actor', f.input('REJECTED')); expect(f.control).not.toHaveBeenCalled(); expect(f.revoke).not.toHaveBeenCalled();
  expect(() => f.choices.current('another')).toThrow('CHOICE_UNAVAILABLE'); f.setAvailable(true);
  await f.choices.decide('actor', f.input()); await f.choices.decide('actor', f.input('REJECTED'));
  expect(f.choices.scope('actor')).toBeUndefined(); await expect(f.choices.decide('actor', f.input())).rejects.toMatchObject({ code: 'CHOICE_UNAVAILABLE' });
  f.time.advance(12 * 60 * 60_000); await Promise.resolve(); expect(f.choices.current('actor').decision).toBe('UNDECIDED');
});
it('solo referencias de observación previamente lícitas llegan al control, sin identificar a quien retiró', async () => {
  const f = fixture(); const roomRef = randomUUID(); const gameRef = randomUUID(); const roomScope = { active: true };
  f.choices.onInvalidated(session => session === 'actor' ? { scopes: [roomScope], roomRefs: [roomRef], gameRefs: [gameRef] } : { scopes: [], roomRefs: [], gameRefs: [] });
  await f.choices.decide('actor', f.input()); await f.choices.decide('actor', f.input('REJECTED'));
  const command: UsagePrivacyControl = f.revoke.mock.calls[0][1]; expect(command.roomRefs).toEqual([roomRef]); expect(command.gameRefs).toEqual([gameRef]);
  expect(JSON.stringify(command)).not.toMatch(/actor|session|cause|reason|name/);
});
