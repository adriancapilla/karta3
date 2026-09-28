import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';

const app = createApp();
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
app.use(express.static(dist));
app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '127.0.0.1', () => console.log(`KARTA3: http://127.0.0.1:${port}`));
