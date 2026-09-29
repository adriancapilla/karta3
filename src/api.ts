import type { CurrentRoomResponse, RenameRoomRequest, RoomResponse } from '../shared/contracts/room';

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.');
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.error?.code ?? 'UNKNOWN_ERROR', data?.error?.message ?? 'La operación no se pudo completar.');
  }
  return data as T;
}

export const api = {
  current: () => request<CurrentRoomResponse>('/rooms/current'),
  create: () => request<RoomResponse>('/rooms', { method: 'POST', body: '{}' }),
  rename: (id: string, name: string) => request<RoomResponse>(`/rooms/${encodeURIComponent(id)}/name`, { method: 'PATCH', body: JSON.stringify({ name } satisfies RenameRoomRequest) }),
  close: (id: string) => request<void>(`/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
