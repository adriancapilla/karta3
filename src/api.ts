import type { CurrentRoomResponse, RenameRoomRequest, ResultsRoomView, RoomResponse } from '../shared/contracts/room';
import type { DecksResponse } from '../shared/contracts/deck';
import type { UsageContext, UsageChoiceRequest, UsageChoiceView } from '../shared/contracts/usage';
import { configureBrowserUsage, currentUsageContext, invalidateBrowserUsage, usageSignalTicket } from './usage';

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const signalTicket = usageSignalTicket();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers
    });
  } catch {
    invalidateBrowserUsage(signalTicket);
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.');
  }
  configureBrowserUsage(response.headers.get('X-Karta3-Usage-Collection'), signalTicket);
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.error?.code ?? 'UNKNOWN_ERROR', data?.error?.message ?? 'La operación no se pudo completar.');
  }
  return data as T;
}

export const api = {
  usageChoice: () => request<UsageChoiceView>('/usage/choice'),
  chooseUsage: (input: UsageChoiceRequest) => request<UsageChoiceView>('/usage/choice', { method: 'PUT', body: JSON.stringify(input), signal: AbortSignal.timeout(5000) }),
  decks: () => request<DecksResponse>('/decks'),
  current: () => request<CurrentRoomResponse>('/rooms/current'),
  result: (gameId: string) => request<{ room: ResultsRoomView }>(`/results/${encodeURIComponent(gameId)}`),
  create: (context?: UsageContext) => request<RoomResponse>('/rooms', { method: 'POST', body: '{}',
    ...(currentUsageContext(context) ? { headers: { 'X-Karta3-Usage-Context': JSON.stringify(context) } } : {}) }),
  rename: (id: string, name: string) => request<RoomResponse>(`/rooms/${encodeURIComponent(id)}/name`, { method: 'PATCH', body: JSON.stringify({ name } satisfies RenameRoomRequest) }),
  close: (id: string) => request<void>(`/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
