import express, { type Request, type Response, type NextFunction } from 'express';
import { parseCookie } from 'cookie';
import type { CurrentRoomResponse, ErrorResponse, PublicErrorCode, RoomResponse } from '../../../shared/contracts/room.js';
import type { RoomActions } from '../../application/roomUseCases.js';
import { RoomError, type RoomErrorCode } from '../../application/roomError.js';
import type { MemorySessions } from '../memorySessions.js';

const COOKIE_NAME = 'karta3_session';

class TransportError extends Error {
  constructor(public readonly code: PublicErrorCode, public readonly status: number, message: string) { super(message); }
}

const roomErrorStatus: Record<RoomErrorCode, number> = {
  INVALID_INPUT: 400,
  ROOM_NOT_AVAILABLE: 404,
  FORBIDDEN: 403,
  CODE_EXHAUSTED: 503,
  ALREADY_IN_ROOM: 409,
  ROOM_FULL: 409,
  REQUEST_CONFLICT: 409,
  PARTICIPATION_ENDED: 409
};

export function createHttpApp(dependencies: { rooms: RoomActions; sessions: MemorySessions; production: boolean }) {
  const { rooms, sessions, production } = dependencies;
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4kb' }));

  function session(req: Request): string {
    const token = parseCookie(req.headers.cookie ?? '')[COOKIE_NAME];
    const id = sessions.get(token);
    if (!id) throw new TransportError('SESSION_REQUIRED', 401, 'Tu sesión ya no está disponible. Recarga para continuar.');
    return id;
  }

  app.use('/api', (req, _res, next) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      const origin = req.get('origin');
      const expected = `${production ? 'https' : req.protocol}://${req.get('host')}`;
      const allowed = [expected];
      if (!production) allowed.push('http://127.0.0.1:5173');
      if (origin && !allowed.includes(origin)) return next(new TransportError('FORBIDDEN', 403, 'Origen de solicitud no permitido.'));
      if (['POST', 'PATCH', 'PUT'].includes(req.method) && !req.is('application/json')) {
        return next(new TransportError('INVALID_INPUT', 415, 'Envía los datos como JSON.'));
      }
    }
    next();
  });

  app.get('/api/rooms/current', (req, res) => {
    let id = sessions.get(parseCookie(req.headers.cookie ?? '')[COOKIE_NAME]);
    if (!id) {
      const fresh = sessions.establish();
      id = fresh.id;
      res.cookie(COOKIE_NAME, fresh.token, {
        httpOnly: true,
        secure: production,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }
    res.json(rooms.resume(id) satisfies CurrentRoomResponse);
  });

  app.post('/api/rooms', (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length !== 0) {
      throw new TransportError('INVALID_INPUT', 400, 'La creación no necesita datos adicionales.');
    }
    res.status(201).json({ room: rooms.createOrGet(session(req)) } satisfies RoomResponse);
  });

  app.get('/api/rooms/:id', (req, res) => {
    res.json({ room: rooms.getOwn(session(req), String(req.params.id)) } satisfies RoomResponse);
  });

  app.patch('/api/rooms/:id/name', (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length !== 1 || !('name' in req.body)) {
      throw new TransportError('INVALID_INPUT', 400, 'Envía un nombre válido.');
    }
    res.json({ room: rooms.rename(session(req), String(req.params.id), req.body.name) } satisfies RoomResponse);
  });

  app.delete('/api/rooms/:id', (req, res) => {
    rooms.close(session(req), String(req.params.id));
    res.status(204).end();
  });

  app.use('/api', (_req, _res, next) => next(new TransportError('ROOM_NOT_AVAILABLE', 404, 'No se encontró la operación.')));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    if (error instanceof TransportError) return res.status(error.status).json({ error: { code: error.code, message: error.message } } satisfies ErrorResponse);
    if (error instanceof RoomError) return res.status(roomErrorStatus[error.code]).json({ error: { code: error.code, message: error.message } } satisfies ErrorResponse);
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Los datos enviados no son válidos.' } } satisfies ErrorResponse);
    }
    console.error(error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ha ocurrido un error. Inténtalo de nuevo.' } } satisfies ErrorResponse);
  });
  return app;
}
