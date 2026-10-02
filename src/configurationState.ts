import type { ConfigurationChange } from '../shared/contracts/room';

export type ConfigurationField = ConfigurationChange['field'];
export type ConfigurationAttempt = { requestId: string; change: ConfigurationChange; status: 'PENDING' | 'ACCEPTED' | 'ERROR'; message: string };
export type ConfigurationState = Partial<Record<ConfigurationField, ConfigurationAttempt>>;
export type ConfigurationAction =
  | { type: 'start'; requestId: string; change: ConfigurationChange }
  | { type: 'finish'; field: ConfigurationField; requestId: string; status: 'ACCEPTED' | 'ERROR'; message: string }
  | { type: 'disconnect' };

export const UNCONFIRMED = 'No se pudo confirmar el cambio; se muestra la última configuración recibida';

export function configurationState(state: ConfigurationState, action: ConfigurationAction): ConfigurationState {
  if (action.type === 'start') return { ...state, [action.change.field]: { requestId: action.requestId, change: action.change, status: 'PENDING', message: 'Aplicando…' } };
  if (action.type === 'disconnect') {
    return Object.fromEntries(Object.entries(state).map(([field, attempt]) => [field,
      attempt.status === 'PENDING' ? { ...attempt, status: 'ERROR', message: UNCONFIRMED } : attempt]));
  }
  const attempt = state[action.field];
  if (!attempt || attempt.requestId !== action.requestId || attempt.status !== 'PENDING') return state;
  return { ...state, [action.field]: { ...attempt, status: action.status, message: action.message } };
}
