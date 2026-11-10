'use strict';

const path = require('path');
const express = require('express');

const app = express();
const root = __dirname;
const port = Number(process.env.PORT) || 10000;
const adminKeys = require('./api/admin/keys');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
app.get('/', (_req, res) => res.sendFile(path.join(root, 'index.html')));
app.get('/index.html', (_req, res) => res.sendFile(path.join(root, 'index.html')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(root, 'styles.css')));
app.get('/app.js', (_req, res) => res.sendFile(path.join(root, 'app.js')));

const directRoutes = [
  ['/api/admin/keys', adminKeys],
  ['/api/health', require('./api/health')],
  ['/api/key/generate', require('./api/key/generate')],
  ['/api/key/recover', require('./api/key/recover')],
  ['/api/key/validate', require('./api/key/validate')],
  ['/api/link/access', require('./api/link/access')],
  ['/api/linkvertise/verify', require('./api/linkvertise/verify')],
  ['/api/session/prepare-link', require('./api/session/prepare-link')],
  ['/api/session/return', require('./api/session/return')],
  ['/api/session/start', require('./api/session/start')],
  ['/api/turnstile/config', require('./api/turnstile/config')]
];

for (const [route, handler] of directRoutes) app.all(route, handler);
app.all(/^\/api(?:\/.*)?$/, require('./api/[...route].js'));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error('http:', error);
  res.status(400).json({ error: 'Solicitud inválida.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Key Control listening on ${port}`);
});

async function purgeExpiredKeys() {
  try {
    const deleted = await adminKeys.cleanupExpired();
    if (deleted) console.log(`Purged ${deleted} expired key(s).`);
  } catch (error) {
    console.error('expired-key cleanup:', error.message || error);
  }
}

const cleanupTimer = setInterval(purgeExpiredKeys, 5 * 60 * 1000);
cleanupTimer.unref();
setTimeout(purgeExpiredKeys, 10000).unref();

function shutdown(signal) {
  console.log(`${signal}: closing HTTP server`);
  clearInterval(cleanupTimer);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
