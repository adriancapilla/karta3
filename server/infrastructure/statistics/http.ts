import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { parseCookie } from 'cookie';
import { appearancePermissionRequest, appearanceSnapshot, exactKeys, exclusionRequest } from '../../../shared/contracts/statistics.js';
import type { StatisticsControls } from '../../application/statistics/controls.js';
import type { StatisticsRecorder } from '../../application/statistics/recording.js';
import { StatisticsError } from '../../application/statistics/contracts.js';

export const EXCLUSION_COOKIE = 'karta3_statistics_exclusion';
export type StatisticsHttp = { recorder: StatisticsRecorder; controls: StatisticsControls; enabled: () => boolean; mode: 'aggregate' | 'synthetic' | 'off' };
type Bucket = { tokens: number; last: number };
export class Admission {
  private global: Bucket;
  private readonly sessions = new Map<string, Bucket>();
  constructor(private readonly now: () => number = () => performance.now()) { this.global = { tokens: 240, last: now() }; }
  private take(bucket: Bucket, refill: number, burst: number) {
    const now = this.now(); bucket.tokens = Math.min(burst, bucket.tokens + Math.max(0, now - bucket.last) * refill / 1000); bucket.last = now;
    if (bucket.tokens < 1) return false; bucket.tokens--; return true;
  }
  allow(session?: string) {
    if (!this.take(this.global, 120, 240)) return false;
    if (!session) return true;
    for (const [s, b] of this.sessions) if (this.now() - b.last >= 60_000) this.sessions.delete(s);
    let bucket = this.sessions.get(session);
    if (!bucket) { if (this.sessions.size >= 4096) return false; bucket = { tokens: 10, last: this.now() }; this.sessions.set(session, bucket); }
    return this.take(bucket, 1, 10);
  }
}
export function attachStatisticsHttp(app: Express, statistics: StatisticsHttp, production: boolean,
  sessions: { current(req: Request): string | undefined; establish(req: Request, res: Response): string }) {
  const admission = new Admission();
  app.use('/api/statistics', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const expected = `${production ? 'https' : req.protocol}://${req.get('host')}`;
    const origin = req.get('origin');
    if (origin && origin !== expected && (production || origin !== 'http://127.0.0.1:5173')) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!req.is('application/json')) return res.status(415).json({ error: { code: 'INVALID_INPUT' } });
    }
    next();
  });
  const jsonControl = express.json({ limit: '1kb' }); const jsonMeasurement = express.json({ limit: '2kb' });
  const establish = (req: Request, res: Response) => {
    const cookies = parseCookie(req.headers.cookie ?? ''); const session = sessions.establish(req, res);
    statistics.controls.establish(session, !!cookies.karta3_session, cookies[EXCLUSION_COOKIE]); return session;
  };
  const error = (res: Response, failure: unknown) => res.status(failure instanceof StatisticsError && failure.code === 'CHOICE_CONFLICT' ? 409 : 503)
    .json({ error: { code: failure instanceof StatisticsError ? failure.code : 'STORAGE_UNAVAILABLE', message: 'No se pudo confirmar la preferencia estadística.' } });
  app.get('/api/statistics/exclusion', (req, res) => {
    const session = establish(req, res); if (!admission.allow(session)) return res.status(429).json({ error: { code: 'RATE_LIMITED' } });
    res.json(statistics.controls.view(session).exclusion);
  });
  app.put('/api/statistics/exclusion', jsonControl, (req, res) => {
    const input = exclusionRequest(req.body); if (!input) return res.status(400).json({ error: { code: 'INVALID_INPUT' } });
    const session = establish(req, res); if (!admission.allow(session) && !input.excluded) return res.status(429).json({ error: { code: 'RATE_LIMITED' } });
    try {
      const result = statistics.controls.exclusion(session, input);
      if (result.writeCookie) { const now = new Date(); const expires = new Date(now);
        expires.setUTCDate(1); expires.setUTCFullYear(now.getUTCFullYear() + 1);
        const last = new Date(Date.UTC(expires.getUTCFullYear(), expires.getUTCMonth() + 1, 0)).getUTCDate(); expires.setUTCDate(Math.min(now.getUTCDate(), last));
        // Cookie funcional legible para comprobar almacenamiento. No identidad/fecha en su valor.
        res.cookie(EXCLUSION_COOKIE, input.excluded ? '1:1' : '1:0', { secure: production, sameSite: 'lax', path: '/', expires }); }
      res.json(result.view);
    } catch (failure) { error(res, failure); }
  });
  app.get('/api/statistics/appearance-permission', (req, res) => {
    const session = establish(req, res); if (!admission.allow(session)) return res.status(429).json({ error: { code: 'RATE_LIMITED' } });
    res.json(statistics.controls.view(session).appearance);
  });
  app.put('/api/statistics/appearance-permission', jsonControl, (req, res) => {
    const input = appearancePermissionRequest(req.body); if (!input) return res.status(400).json({ error: { code: 'INVALID_INPUT' } });
    const session = establish(req, res); if (!admission.allow(session) && input.decision === 'GRANT') return res.status(429).json({ error: { code: 'RATE_LIMITED' } });
    try { res.json(statistics.controls.appearance(session, input)); } catch (failure) { error(res, failure); }
  });
  app.post('/api/statistics/home-view', jsonMeasurement, (req, res) => {
    if (!exactKeys(req.body, ['version']) || req.body.version !== 1) return res.status(400).json({ error: { code: 'INVALID_INPUT' } });
    if (!admission.allow()) return res.status(429).end();
    // La identidad solo resuelve elegibilidad funcional; al contador llega únicamente un sí/no.
    const eligible = statistics.controls.eligible(sessions.current(req));
    if (!statistics.enabled() || !eligible) return res.status(204).end();
    res.status(statistics.recorder.home() ? 202 : 503).end();
  });
  app.post('/api/statistics/appearance', jsonMeasurement, (req, res) => {
    const input = appearanceSnapshot(req.body); if (!input) return res.status(400).json({ error: { code: 'INVALID_INPUT' } });
    const session = sessions.current(req); if (!session) return res.status(401).end();
    if (!statistics.controls.permitted(session)) return res.status(204).end();
    if (!admission.allow()) return res.status(429).end();
    const result = statistics.recorder.appearanceSnapshot(input, session);
    res.status(result === 'ADMITTED' ? 202 : result === 'FORBIDDEN' ? 403 : result === 'UNAVAILABLE' ? 503 : 204).end();
  });
  app.use('/api/statistics', (_req, res) => { res.status(404).json({ error: { code: 'NOT_FOUND' } }); });
  app.use('/api/statistics', (failure: unknown, _req: Request, res: Response, next: NextFunction) => {
    void next;
    const tooLarge = !!failure && typeof failure === 'object' && 'type' in failure && failure.type === 'entity.too.large';
    res.status(tooLarge ? 413 : failure instanceof SyntaxError ? 400 : 503).json({ error: { code: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INVALID_INPUT' } });
  });
}
