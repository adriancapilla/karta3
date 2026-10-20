import express, { type Express } from 'express';
import { browserUsage, usageContext, usageChoiceRequest, type UsageContext } from '../../../shared/contracts/usage.js';
import type { UsageRecorder } from '../../application/usage/recording.js';
import { UsageChoiceError, type UsageChoices } from '../../application/usage/choice.js';

type Bucket = { tokens: number; at: number; seen: number };
export class UsageAdmission {
  private readonly visits = new Map<string, Bucket>();
  private global: Bucket = { tokens: 240, at: 0, seen: 0 };
  constructor(private readonly now = Date.now) {}
  admit(visitId: string) {
    const now = this.now();
    for (const [id, bucket] of this.visits) if (bucket.seen + 30 * 60_000 <= now) this.visits.delete(id);
    const take = (bucket: Bucket, rate: number, burst: number) => {
      bucket.tokens = Math.min(burst, bucket.tokens + Math.max(0, now - bucket.at) / 1000 * rate); bucket.at = now;
      if (bucket.tokens < 1) return false; bucket.tokens--; bucket.seen = now; return true;
    };
    if (!take(this.global, 120, 240)) return false;
    const previous = this.visits.get(visitId);
    if (!previous && this.visits.size >= 4096) return false;
    const bucket = previous ?? { tokens: 10, at: now, seen: now }; this.visits.set(visitId, bucket);
    return take(bucket, 1, 10);
  }
  get size() { return this.visits.size; }
}
export type UsageHttp = { enabled: boolean; mode?: 'synthetic' | 'human'; recorder: UsageRecorder; admission: UsageAdmission; choices?: UsageChoices };
export function usageSignal(usage: UsageHttp | undefined, session?: string): 'off' | 'synthetic' | 'human' {
  if (!usage?.enabled) return 'off';
  if (usage.mode === 'human') return session && usage.choices?.scope(session) ? 'human' : 'off';
  return 'synthetic';
}
let lastInvalidContext = -Infinity;
export function safeUsageContext(value: unknown): UsageContext | undefined {
  if (value === undefined) return;
  const invalid = () => { if (Date.now() - lastInvalidContext >= 60_000) { lastInvalidContext = Date.now(); console.error('USAGE_INVALID_CONTEXT'); } return undefined; };
  try {
    if (typeof value === 'string') { if (Buffer.byteLength(value) > 256) return invalid(); value = JSON.parse(value); }
    if (Buffer.byteLength(JSON.stringify(value) ?? '') > 256) return invalid();
    return usageContext(value) ?? invalid();
  } catch { return invalid(); }
}
export function attachUsageHttp(app: Express, usage: UsageHttp | undefined, production: boolean, choices: UsageChoices,
  sessions: { current(req: express.Request): string | undefined; establish(req: express.Request, res: express.Response): string }) {
  const allowedOrigin = (req: express.Request) => req.get('origin') === `${production ? 'https' : req.protocol}://${req.get('host')}`
    || !production && req.get('origin') === 'http://127.0.0.1:5173';
  const choiceAdmission = new UsageAdmission();
  app.get('/api/usage/choice', async (req, res) => {
    try { res.json(await choices.confirmedCurrent(sessions.establish(req, res))); }
    catch { res.status(503).json({ error: { code: 'CHOICE_UNAVAILABLE', message: 'No se pudo consultar la elección de analítica.' } }); }
  });
  app.put('/api/usage/choice', express.json({ limit: 1024 }), async (req, res) => {
    if (!allowedOrigin(req)) { res.status(403).end(); return; }
    const session = sessions.current(req); if (!session) { res.status(401).end(); return; }
    const input = usageChoiceRequest(req.body); if (!input || !req.is('application/json')) { res.status(400).end(); return; }
    if (!choiceAdmission.admit(session)) { res.status(429).end(); return; }
    try {
      const choice = await choices.decide(session, input);
      res.set('X-Karta3-Usage-Collection', usageSignal(usage, session)).json(choice);
    } catch (error) {
      res.set('X-Karta3-Usage-Collection', usageSignal(usage, session));
      const conflict = error instanceof UsageChoiceError && error.code === 'CHOICE_CONFLICT';
      res.status(conflict ? 409 : 503).json({ error: { code: conflict ? 'CHOICE_CONFLICT' : 'CHOICE_UNAVAILABLE',
        message: conflict ? 'La elección ha cambiado. Revisa su estado antes de aceptar.' : 'No se pudo confirmar la elección en el servidor.' } });
    }
  });
  app.post('/api/usage/events', express.json({ limit: 2048 }), (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!allowedOrigin(req)) { res.status(403).end(); return; }
    const event = browserUsage(req.body);
    if (!event) { res.status(400).end(); return; }
    const session = sessions.current(req);
    if (!usage?.enabled || usage.mode === 'human' && !choices.scope(session ?? '')) { res.status(204).end(); return; }
    if (!usage.admission.admit(event.visitId)) { res.status(429).end(); return; }
    if (event.name === 'appearance_snapshot') {
      if (!session) { res.status(401).end(); return; }
      const result = usage.recorder.appearanceSnapshot(event, session);
      res.status(result === 'ADMITTED' ? 202 : result === 'FORBIDDEN' ? 403 : result === 'CONFLICT' ? 400 : result === 'UNAVAILABLE' ? 503 : 204).end(); return;
    }
    res.status(usage.recorder.browser(event, session) ? 202 : 503).end();
  });
  app.use('/api/usage', (error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!error) { next(); return; }
    res.status(error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large' ? 413 : 400).end();
  });
}
