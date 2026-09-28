import { randomBytes, randomUUID } from 'node:crypto';
import express, { type Request, type Response, type NextFunction } from 'express';
import { parseCookie } from 'cookie';
import { AppError, RoomStore } from './roomStore.js';

const COOKIE_NAME = 'karta3_session';

export class SessionStore {
  private readonly tokens = new Map<string, string>();

  get(token: string | undefined): string | undefined {
    return token ? this.tokens.get(token) : undefined;
  }

  establish(): { token: string; id: string } {
    const token = randomBytes(32).toString('base64url');
    const id = randomUUID();
    this.tokens.set(token, id);
    return { token, id };
  }
}

export function createApp(options: { rooms?: RoomStore; sessions?: SessionStore; production?: boolean } = {}) {
  const app = express();
  const rooms = options.rooms ?? new RoomStore();
  const sessions = options.sessions ?? new SessionStore();
  const production = options.production ?? process.env.NODE_ENV === 'production';
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4kb' }));

  function session(req: Request): string {
    const token = parseCookie(req.headers.cookie ?? '')[COOKIE_NAME];
    const id = sessions.get(token);
    if (!id) throw new AppError('SESSION_REQUIRED', 401, 'Tu sesión ya no está disponible. Recarga para continuar.');
    return id;
  }

  app.use('/api', (req, _res, next) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      const origin = req.get('origin');
      const expected = `${production ? 'https' : req.protocol}://${req.get('host')}`;
      const allowed = [expected];
      if (!production) allowed.push('http://127.0.0.1:5173');
      if (origin && !allowed.includes(origin)) return next(new AppError('FORBIDDEN', 403, 'Origen de solicitud no permitido.'));
      if (['POST', 'PATCH', 'PUT'].includes(req.method) && !req.is('application/json')) {
        return next(new AppError('INVALID_INPUT', 415, 'Envía los datos como JSON.'));
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
    res.json({ room: rooms.current(id) });
  });

  app.post('/api/rooms', (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length !== 0) {
      throw new AppError('INVALID_INPUT', 400, 'La creación no necesita datos adicionales.');
    }
    res.status(201).json({ room: rooms.createOrGet(session(req)) });
  });

  app.get('/api/rooms/:id', (req, res) => {
    res.json({ room: rooms.getOwn(session(req), String(req.params.id)) });
  });

  app.patch('/api/rooms/:id/name', (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length !== 1 || !('name' in req.body)) {
      throw new AppError('INVALID_INPUT', 400, 'Envía un nombre válido.');
    }
    res.json({ room: rooms.rename(session(req), String(req.params.id), req.body.name) });
  });

  app.delete('/api/rooms/:id', (req, res) => {
    rooms.close(session(req), String(req.params.id));
    res.status(204).end();
  });

  app.use('/api', (_req, _res, next) => next(new AppError('ROOM_NOT_AVAILABLE', 404, 'No se encontró la operación.')));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    if (error instanceof AppError) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Los datos enviados no son válidos.' } });
    }
    console.error(error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ha ocurrido un error. Inténtalo de nuevo.' } });
  });
  return app;
}
