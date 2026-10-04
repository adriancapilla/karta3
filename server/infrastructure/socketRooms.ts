import type { Server as HttpServer } from 'node:http';
import { parseCookie } from 'cookie';
import { Server } from 'socket.io';
import type { CurrentRoomResponse, RoomChange, RoomClosedEvent, RoomLeftEvent, RoomStateEvent, RoomView, SocketAck } from '../../shared/contracts/room.js';
import type { RoomChanges, SessionPresence } from '../application/ports.js';
import type { RoomActions } from '../application/roomUseCases.js';
import { RoomError } from '../application/roomError.js';
import type { MemorySessions } from './memorySessions.js';
import { configurationInput, exactObject } from './configurationInput.js';

const sessionRoom = (sessionId: string) => `session:${sessionId}`;
const invalid = () => new RoomError('INVALID_INPUT', 'Los datos enviados no son válidos.');

function object(value: unknown, keys: string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => key in value);
}

function field(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function ackError(error: unknown): SocketAck<never> {
  if (error instanceof RoomError) return { ok: false, error: { code: error.code, message: error.message } };
  console.error('Fallo interno al procesar una solicitud de sala.');
  return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Ha ocurrido un error. Inténtalo de nuevo.' } };
}

function respond<T>(ack: unknown, result: SocketAck<T>): void {
  if (typeof ack === 'function') ack(result);
}

export const SOCKET_DETECTION = { pingInterval: 5000, pingTimeout: 5000 } as const;

export class SocketRoomChanges implements RoomChanges, SessionPresence {
  private io?: Server;
  private readonly connections = new Map<string, Set<string>>();
  private stopped = false;

  isConnected(sessionId: string): boolean { return (this.connections.get(sessionId)?.size ?? 0) > 0; }

  dispose(): void { this.stopped = true; this.connections.clear(); }

  attach(server: HttpServer, rooms: RoomActions, sessions: MemorySessions, production: boolean): Server {
    const io = new Server(server, { ...SOCKET_DETECTION, maxHttpBufferSize: 4096, serveClient: false });
    this.io = io;
    io.use((socket, next) => {
      const host = socket.handshake.headers.host;
      const origin = socket.handshake.headers.origin;
      const expected = `${production ? 'https' : 'http'}://${host}`;
      if (origin && origin !== expected && (production || origin !== 'http://127.0.0.1:5173')) {
        return next(new Error('Origen no permitido.'));
      }
      const token = parseCookie(socket.handshake.headers.cookie ?? '').karta3_session;
      const sessionId = sessions.get(token);
      if (!sessionId) return next(new Error('Sesión no disponible.'));
      socket.data.sessionId = sessionId;
      socket.join(sessionRoom(sessionId));
      next();
    });

    io.on('connection', (socket) => {
      const sessionId = socket.data.sessionId as string;
      if (this.stopped) { socket.disconnect(true); return; }
      const connections = this.connections.get(sessionId) ?? new Set<string>();
      this.connections.set(sessionId, connections);
      connections.add(socket.id);
      rooms.presenceChanged(sessionId);
      socket.on('disconnect', () => {
        if (this.stopped || !connections.delete(socket.id)) return;
        if (!connections.size) this.connections.delete(sessionId);
        rooms.presenceChanged(sessionId);
      });
      socket.on('room:resume', (payload: unknown, ack: (result: SocketAck<CurrentRoomResponse>) => void) => {
        try {
          if (!object(payload, [])) throw invalid();
          respond(ack, { ok: true, ...rooms.resume(sessionId) });
        } catch (error) { respond(ack, ackError(error)); }
      });
      socket.on('room:join', (payload: unknown, ack: (result: SocketAck<{ room: RoomView }>) => void) => {
        try {
          if (!object(payload, ['requestId', 'code', 'name']) || !field(payload.requestId, 100)
            || typeof payload.code !== 'string' || payload.code.length > 64
            || typeof payload.name !== 'string' || payload.name.length > 128) throw invalid();
          respond(ack, { ok: true, room: rooms.join(sessionId, payload.requestId, payload.code, payload.name) });
        } catch (error) { respond(ack, ackError(error)); }
      });
      socket.on('room:leave', (payload: unknown, ack: (result: SocketAck<{ roomId: string; participantId: string }>) => void) => {
        try {
          if (!object(payload, ['requestId', 'roomId', 'participantId']) || !field(payload.requestId, 100)
            || !field(payload.roomId, 100) || !field(payload.participantId, 100)) throw invalid();
          rooms.leave(sessionId, payload.requestId, payload.roomId, payload.participantId);
          respond(ack, { ok: true, roomId: payload.roomId, participantId: payload.participantId });
        } catch (error) { respond(ack, ackError(error)); }
      });
      socket.on('room:configure', (payload: unknown, ack: (result: SocketAck<{ room: RoomView }>) => void) => {
        try {
          // También las entradas mal formadas observan primero los vencimientos debidos.
          rooms.current(sessionId);
          if (!exactObject(payload, ['requestId', 'roomId', 'change']) || !field(payload.requestId, 100)
            || !field(payload.roomId, 100)) throw invalid();
          respond(ack, { ok: true, room: rooms.configure(sessionId, payload.requestId, payload.roomId, configurationInput(payload.change)) });
        } catch (error) { respond(ack, ackError(error)); }
      });
      socket.on('room:start', (payload: unknown, ack: (result: SocketAck<{ room: RoomView }>) => void) => {
        try {
          rooms.current(sessionId);
          if (!exactObject(payload, ['requestId', 'roomId']) || !field(payload.requestId, 100)
            || !field(payload.roomId, 100)) throw invalid();
          respond(ack, { ok: true, room: rooms.start(sessionId, payload.requestId, payload.roomId) });
        } catch (error) { respond(ack, ackError(error)); }
      });
    });
    return io;
  }

  updated(views: { sessionId: string; room: RoomView }[], change?: RoomChange): void {
    for (const view of views) {
      this.io?.to(sessionRoom(view.sessionId)).emit('room:state', { room: view.room, ...(change ? { change } : {}) } satisfies RoomStateEvent);
    }
  }

  left(sessionId: string, roomId: string, participantId: string, reason: RoomLeftEvent['reason'] = 'VOLUNTARY'): void {
    this.io?.to(sessionRoom(sessionId)).emit('room:left', { roomId, participantId, reason } satisfies RoomLeftEvent);
  }

  closed(sessionIds: string[], roomId: string, revision: number, reason: RoomClosedEvent['reason'] = 'HOST_CLOSED'): void {
    for (const sessionId of sessionIds) {
      this.io?.to(sessionRoom(sessionId)).emit('room:closed', { roomId, revision, reason } satisfies RoomClosedEvent);
    }
  }
}
