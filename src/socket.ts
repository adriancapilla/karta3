import { io, type Socket } from 'socket.io-client';
import type { ConfigureRoomRequest, StartRoomRequest, RoomView, SocketAck } from '../shared/contracts/room';
import { ApiError } from './api';
import type { UsageContext } from '../shared/contracts/usage';
import { currentUsageContext } from './usage';

export const socket: Socket = io({ autoConnect: false, withCredentials: true });
export const ACK_TIMEOUT_MS = 5000;

export async function send<T>(event: string, payload: object): Promise<T> {
  if (!socket.connected) {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => { cleanup(); reject(new ApiError('NETWORK_ERROR', 'No se pudo confirmar la operación. Comprueba la conexión e inténtalo de nuevo.')); }, ACK_TIMEOUT_MS);
      const connected = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.')); };
      const cleanup = () => { window.clearTimeout(timer); socket.off('connect', connected); socket.off('connect_error', failed); };
      socket.once('connect', connected);
      socket.once('connect_error', failed);
      socket.connect();
    });
  }
  // El transporte puede haber esperado conexión: el contexto estadístico se revalida al enviar.
  // requestId/código/nombre del juego permanecen íntegros para un reintento explícito.
  if (event === 'room:join' && 'usageContext' in payload) {
    const { usageContext, ...gameInput } = payload as Record<string, unknown> & { usageContext?: UsageContext };
    const context = currentUsageContext(usageContext); payload = context ? { ...gameInput, usageContext: context } : gameInput;
  }
  return new Promise<T>((resolve, reject) => {
    socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (error: Error | null, response: SocketAck<T>) => {
      if (error) return reject(new ApiError('NETWORK_ERROR', 'No se pudo confirmar la operación. Comprueba la conexión e inténtalo de nuevo.'));
      if (!response?.ok) return reject(new ApiError(response?.error.code ?? 'UNKNOWN_ERROR', response?.error.message ?? 'La operación no se pudo completar.'));
      resolve(response);
    });
  });
}

export type RoomAck = { room: RoomView };

/** Acciones humanas volátiles: no cola, reconexión ni recuperación disparan una jugada. */
export async function sendGame<T>(event: string, payload: object): Promise<T> {
  if (!socket.connected) throw new ApiError('NOT_CONNECTED', 'Sin conexión: no se envió la acción.');
  return new Promise((resolve, reject) => {
    socket.volatile.timeout(ACK_TIMEOUT_MS).emit(event, payload, (error: Error | null, response: SocketAck<T>) => {
      if (error) return reject(new ApiError('NETWORK_ERROR', 'No se pudo confirmar la acción. Recupera la mesa antes de reintentar.'));
      if (!response?.ok) return reject(new ApiError(response?.error.code ?? 'UNKNOWN_ERROR', response?.error.message ?? 'No se pudo completar la acción.'));
      resolve(response);
    });
  });
}

/** Un gesto de configuración nunca espera una reconexión ni entra en sendBuffer. */
export async function sendConfiguration(payload: ConfigureRoomRequest): Promise<RoomAck> {
  if (!socket.connected) throw new ApiError('NOT_CONNECTED', 'Sin conexión: no se envió el cambio. Se muestra la última configuración recibida.');
  return new Promise((resolve, reject) => {
    socket.volatile.timeout(ACK_TIMEOUT_MS).emit('room:configure', payload, (error: Error | null, response: SocketAck<RoomAck>) => {
      if (error) return reject(new ApiError('NETWORK_ERROR', 'No se pudo confirmar el cambio; se muestra la última configuración recibida'));
      if (!response?.ok) return reject(new ApiError(response?.error.code ?? 'UNKNOWN_ERROR', response?.error.message ?? 'La operación no se pudo completar.'));
      resolve(response);
    });
  });
}

/** Solo un gesto conectado puede enviar el inicio; no se almacena para reconectar. */
export async function sendStart(payload: StartRoomRequest): Promise<RoomAck> {
  if (!socket.connected) throw new ApiError('NOT_CONNECTED', 'Sin conexión: no se envió el inicio.');
  return new Promise((resolve, reject) => {
    socket.volatile.timeout(ACK_TIMEOUT_MS).emit('room:start', payload, (error: Error | null, response: SocketAck<RoomAck>) => {
      if (error) return reject(new ApiError('NETWORK_ERROR', 'No se pudo confirmar el inicio. Recupera el estado antes de reintentarlo.'));
      if (!response?.ok) return reject(new ApiError(response?.error.code ?? 'UNKNOWN_ERROR', response?.error.message ?? 'No se pudo iniciar.'));
      resolve(response);
    });
  });
}
