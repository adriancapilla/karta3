import type { Server as HttpServer } from 'node:http';
import { parseCookie } from 'cookie';
import { Server } from 'socket.io';
import type { CurrentRoomResponse, ResultsHomeEvent, RoomChange, RoomClosedEvent, RoomLeftEvent, RoomStateEvent, RoomView, SocketAck } from '../../shared/contracts/room.js';
import type { GameChanges, SessionPresence } from '../application/ports.js';
import type { RoundResolvedEvent, TurnExpiredEvent } from '../../shared/contracts/game.js';
import type { RoomActions } from '../application/roomUseCases.js';
import { RoomError } from '../application/roomError.js';
import type { MemorySessions } from './memorySessions.js';
import { configurationInput, exactObject } from './configurationInput.js';
import { cancelGameInput, gameInput } from './gameInput.js';
import { botInput } from './botInput.js';
import { safeUsageContext } from './usage/http.js';

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

export class SocketRoomChanges implements GameChanges, SessionPresence {
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
          const hasContext = !!payload && typeof payload === 'object' && Object.hasOwn(payload, 'usageContext');
          if (!object(payload, ['requestId', 'code', 'name', ...(hasContext ? ['usageContext'] : [])]) || !field(payload.requestId, 100)
            || typeof payload.code !== 'string' || payload.code.length > 64
            || typeof payload.name !== 'string' || payload.name.length > 128) throw invalid();
          respond(ack, { ok: true, room: rooms.join(sessionId, payload.requestId, payload.code, payload.name, safeUsageContext(payload.usageContext)) });
        } catch (error) {
          if (error instanceof RoomError && error.code === 'INVALID_INPUT') rooms.joinInputRejected?.(sessionId,
            payload && typeof payload === 'object' && 'requestId' in payload ? payload.requestId : undefined);
          respond(ack, ackError(error));
        }
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
      for (const [event, type] of [['room:bot-add', 'ADD'], ['room:bot-difficulty', 'DIFFICULTY'], ['room:bot-rename', 'RENAME'], ['room:bot-remove', 'REMOVE']] as const) {
        socket.on(event, (payload: unknown, ack: unknown) => {
          try {
            rooms.current(sessionId);
            const input = botInput(payload, type);
            respond(ack, { ok: true, ...rooms.bot(sessionId, input.requestId, input.roomId, input.operation) });
          } catch (error) { respond(ack, ackError(error)); }
        });
      }
      socket.on('room:start', (payload: unknown, ack: (result: SocketAck<{ room: RoomView }>) => void) => {
        try {
          rooms.current(sessionId);
          if (!exactObject(payload, ['requestId', 'roomId']) || !field(payload.requestId, 100)
            || !field(payload.roomId, 100)) throw invalid();
          respond(ack, { ok: true, room: rooms.start(sessionId, payload.requestId, payload.roomId) });
        } catch (error) { respond(ack, ackError(error)); }
      });
      socket.on('game:opening-direction', (payload: unknown, ack: unknown) => {
        try { respond(ack, { ok: true, room: rooms.openingDirection(sessionId, gameInput(payload, false)) }); }
        catch (error) { rooms.current(sessionId); respond(ack, ackError(error)); }
      });
      socket.on('game:play', (payload: unknown, ack: unknown) => {
        try { respond(ack, { ok: true, room: rooms.playCard(sessionId, gameInput(payload, true)) }); }
        catch (error) { rooms.current(sessionId); respond(ack, ackError(error)); }
      });
      socket.on('game:cancel', (payload: unknown, ack: unknown) => {
        try { respond(ack, { ok: true, room: rooms.cancelGame(sessionId, cancelGameInput(payload)) }); }
        catch (error) { respond(ack, ackError(error)); }
      });
      socket.on('results:return-home', (payload: unknown, ack: unknown) => {
        try {
          rooms.current(sessionId);
          if (!exactObject(payload, ['requestId', 'roomId', 'gameId']) || !field(payload.requestId, 100) || !field(payload.roomId, 100) || !field(payload.gameId, 100)) throw invalid();
          respond(ack, { ok: true, ...rooms.returnHome(sessionId, { requestId: payload.requestId, roomId: payload.roomId, gameId: payload.gameId }) });
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
  roundResolved(sessionIds: string[], event: RoundResolvedEvent): void {
    for (const id of sessionIds) this.io?.to(sessionRoom(id)).emit('game:round-resolved', event);
  }
  turnExpired(sessionIds: string[], event: TurnExpiredEvent): void {
    for (const id of sessionIds) this.io?.to(sessionRoom(id)).emit('game:turn-expired', event);
  }
  resultsHome(sessionId: string, event: ResultsHomeEvent): void { this.io?.to(sessionRoom(sessionId)).emit('results:home', event); }
  technicalFailure(): void { console.error('Fallo técnico al publicar o avanzar una revisión de partida. Recuperación disponible.'); }

  left(sessionId: string, roomId: string, participantId: string, reason: RoomLeftEvent['reason'] = 'VOLUNTARY'): void {
    this.io?.to(sessionRoom(sessionId)).emit('room:left', { roomId, participantId, reason } satisfies RoomLeftEvent);
  }

  closed(sessionIds: string[], roomId: string, revision: number, reason: RoomClosedEvent['reason'] = 'HOST_CLOSED'): void {
    for (const sessionId of sessionIds) {
      this.io?.to(sessionRoom(sessionId)).emit('room:closed', { roomId, revision, reason } satisfies RoomClosedEvent);
    }
  }
}
