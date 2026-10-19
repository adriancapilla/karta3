import path from 'node:path';
import express, { type Express } from 'express';
import type { LoadedDeckCatalog } from '../decks/catalog.js';
import { privacyNotice } from '../../../shared/contracts/privacyNotice.js';

/** Las URLs de medios son claves de una lista admitida; nunca rutas de disco. */
export function attachPublicFiles(app: Express, clientDirectory: string, decks: LoadedDeckCatalog) {
  app.use('/media/decks', (req, res) => {
    const pathname = req.originalUrl.split('?')[0];
    const image = ['GET', 'HEAD'].includes(req.method) ? decks.image(pathname) : undefined;
    if (!image) { res.status(404).end(); return; }
    res.set({ 'Content-Type': image.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' }).send(image.bytes);
  });
  app.use(['/barajas', '/api', '/media', '/server', '/dist-server', '/docs', '/node_modules', '/usage', '/usage-data', '/backups', '/exports'], (_req, res) => { res.status(404).end(); });
  app.use(express.static(clientDirectory, { dotfiles: 'deny' }));
  app.get('/{*path}', (req, res) => {
    let decoded: string;
    try { decoded = decodeURIComponent(req.path); } catch { res.status(404).end(); return; }
    if (/^\/privacidad\/?$/i.test(decoded)) {
      res.set({ 'Cache-Control': 'no-store', 'X-Karta3-Usage-Collection': 'off' });
      if (!privacyNotice.complete) { res.status(404).type('text/plain').send('Información de privacidad no disponible.'); return; }
      res.sendFile(path.join(clientDirectory, 'index.html')); return;
    }
    // También bloquea rutas desconocidas a JSON y archivos privados fuera de un prefijo.
    const segments = decoded.split('/');
    if (path.extname(decoded) || segments.some((part) => part.startsWith('.') || part.includes('\\')) ||
      ['barajas', 'api', 'media', 'server', 'dist-server', 'docs', 'node_modules', 'usage', 'usage-data', 'backups', 'exports', '@fs', '@id'].includes((segments[1] ?? '').toLowerCase())) { res.status(404).end(); return; }
    res.sendFile(path.join(clientDirectory, 'index.html'));
  });
}
