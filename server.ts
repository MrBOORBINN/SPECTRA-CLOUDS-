// INFHOST Master Application Server
// Express Full-Stack Server with Vite Middleware in Development

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './backend/apiRouter';
import { nodeRouter } from './backend/nodeRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  // CORS and Preflight handler
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-session-token');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API & Node calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/node')) {
      // Quiet logging
    }
    next();
  });

  // Mount Backend API routes
  app.use('/api', apiRouter);
  app.use('/node', nodeRouter);

  // API Error handler ensuring JSON responses
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[INFHOST API Error]', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  // Catch-all for API & Node routes so they ALWAYS return JSON, NEVER HTML index.html
  app.all(['/api', '/api/*', '/node', '/node/*'], (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Serve static assets or mount Vite dev server
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INFHOST] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[INFHOST] Production mode: ${isProd}`);
    console.log(`[INFHOST] Architecture ready: API at /api, Node Controller at /node`);
  });
}

startServer().catch((err) => {
  console.error('[INFHOST] Fatal error starting server:', err);
  process.exit(1);
});
