import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { errorHandler } from './lib/http.js';
import { publicDir } from './lib/images.js';
import publicRoutes from './routes/public.js';
import enquiryRoutes from './routes/enquiries.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import seoRoutes, { spaHandler } from './routes/seo.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'blob:'],
          'frame-src': ['https://www.google.com', 'https://maps.google.com'],
          'connect-src': ["'self'"],
          'worker-src': ["'self'", 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', publicRoutes);
  app.use('/api/enquiries', enquiryRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // Public, admin-uploaded media (project photos). Customer enquiry photos live in a private folder.
  app.use('/media', express.static(publicDir(), { maxAge: '30d', immutable: true, fallthrough: false }));

  app.use(seoRoutes);

  if (fs.existsSync(path.join(config.clientDist, 'index.html'))) {
    app.use(
      '/assets',
      express.static(path.join(config.clientDist, 'assets'), { maxAge: '1y', immutable: true, fallthrough: false }),
    );
    app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
    app.use(spaHandler());
  }

  app.use(errorHandler);
  return app;
}
