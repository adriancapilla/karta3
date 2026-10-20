import type { CurrentRoomResponse, RenameRoomRequest, ResultsRoomView, RoomResponse } from '../shared/contracts/room';
import type { DecksResponse } from '../shared/contracts/deck';
import { collectionSignal, statisticsTicket, suspendStatistics } from './statistics';

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const signalTicket = statisticsTicket();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers
    });
  } catch {
    suspendStatistics();
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.');
  }
  collectionSignal(response.headers.get('X-Karta3-Statistics-Collection'), signalTicket);
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.error?.code ?? 'UNKNOWN_ERROR', data?.error?.message ?? 'La operación no se pudo completar.');
  }
  return data as T;
}

export const api = {
  decks: () => request<DecksResponse>('/decks'),
  current: () => request<CurrentRoomResponse>('/rooms/current'),
  result: (gameId: string) => request<{ room: ResultsRoomView }>(`/results/${encodeURIComponent(gameId)}`),
  create: () => request<RoomResponse>('/rooms', { method: 'POST', body: '{}' }),
  rename: (id: string, name: string) => request<RoomResponse>(`/rooms/${encodeURIComponent(id)}/name`, { method: 'PATCH', body: JSON.stringify({ name } satisfies RenameRoomRequest) }),
  close: (id: string) => request<void>(`/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
