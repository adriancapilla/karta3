import { expect, it } from 'vitest';
import { configurationState as reduce, type ConfigurationState, UNCONFIRMED } from './configurationState';

it('B05-08/11 un ack/error anterior no borra el intento posterior ni otro control pendiente', () => {
  let state: ConfigurationState = {};
  state = reduce(state, { type: 'start', requestId: 'old', change: { field: 'turnSeconds', value: 15 } });
  state = reduce(state, { type: 'start', requestId: 'other', change: { field: 'reviewSeconds', value: 0 } });
  state = reduce(state, { type: 'start', requestId: 'new', change: { field: 'turnSeconds', value: 60 } });
  for (const status of ['ERROR', 'ACCEPTED'] as const) {
    expect(reduce(state, { type: 'finish', field: 'turnSeconds', requestId: 'old', status, message: 'Viejo' })).toBe(state);
  }
  const finished = reduce(state, { type: 'finish', field: 'turnSeconds', requestId: 'new', status: 'ACCEPTED', message: 'Aceptado' });
  expect(finished.reviewSeconds!.status).toBe('PENDING'); expect(finished.turnSeconds!.status).toBe('ACCEPTED');
});
it('B05-08/13 desconexión descarta provisionales y hace inofensiva la confirmación tardía', () => {
  const state = reduce({}, { type: 'start', requestId: 'lost', change: { field: 'hostPlays', value: false } });
  const offline = reduce(state, { type: 'disconnect' });
  expect(offline.hostPlays).toMatchObject({ status: 'ERROR', message: UNCONFIRMED });
  expect(reduce(offline, { type: 'finish', field: 'hostPlays', requestId: 'lost', status: 'ACCEPTED', message: 'Aceptado' })).toBe(offline);
});
