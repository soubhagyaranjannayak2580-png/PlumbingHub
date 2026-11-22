import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '..');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

let jwtSecret = env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  if (isProd) throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
  jwtSecret = crypto.randomBytes(48).toString('hex');
  if (!isTest) console.warn('[config] JWT_SECRET not set – using a random secret. Admin sessions reset on restart.');
}

const resolveDir = (value, fallback) => {
  const v = value || fallback;
  return v.startsWith('memory://') ? v : path.resolve(PROJECT_ROOT, v);
};

export const config = {
  isProd,
  isTest,
  port: Number(env.PORT || 4000),
  siteUrl: (env.SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  jwtSecret,
  databaseUrl: env.DATABASE_URL || '',
  databaseSsl: env.DATABASE_SSL === 'require',
  dataDir: resolveDir(env.DATA_DIR, 'data/pglite'),
  uploadsDir: resolveDir(env.UPLOADS_DIR, 'uploads'),
  clientDist: path.join(PROJECT_ROOT, 'client', 'dist'),
  trustProxy: env.TRUST_PROXY ? Number(env.TRUST_PROXY) || env.TRUST_PROXY : false,
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.SMTP_FROM || env.SMTP_USER || '',
  },
  notifyEmail: env.NOTIFY_EMAIL || '',
  bootstrapAdmin: {
    email: env.ADMIN_EMAIL || '',
    password: env.ADMIN_PASSWORD || '',
    name: env.ADMIN_NAME || 'Administrator',
  },
};
