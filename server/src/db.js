import fs from 'node:fs';
import { config } from './config.js';

/**
 * Database layer. Uses a real PostgreSQL server (e.g. Supabase) when DATABASE_URL is set,
 * otherwise an embedded PostgreSQL (PGlite) persisted to ./data so the project runs with zero setup.
 * Both expose the same `query(text, params) -> { rows }` interface and the same SQL dialect.
 */
let impl = null;

const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('booking', 'emergency', 'contact')),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  location TEXT,
  address TEXT,
  property_type TEXT,
  service TEXT,
  description TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT,
  urgency TEXT NOT NULL CHECK (urgency IN ('emergency', 'urgent', 'normal')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
  technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
  scheduled_date DATE,
  scheduled_time TEXT,
  email_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);
CREATE INDEX IF NOT EXISTS enquiries_created_idx ON enquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS enquiry_images (
  id SERIAL PRIMARY KEY,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT,
  size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiry_notes (
  id SERIAL PRIMARY KEY,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note', 'event')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]',
  icon TEXT NOT NULL DEFAULT 'residential',
  sort INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scope JSONB NOT NULL DEFAULT '[]',
  images JSONB NOT NULL DEFAULT '[]',
  before_image JSONB,
  after_image JSONB,
  completed_on TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  feedback TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  rating_verified BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function initDb() {
  if (impl) return impl;
  if (config.databaseUrl) {
    const { default: pg } = await import('pg');
    // Return DATE columns as plain 'YYYY-MM-DD' strings (no timezone shifting).
    pg.types.setTypeParser(1082, (v) => v);
    const pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
    impl = {
      kind: 'postgres',
      query: (text, params = []) => pool.query(text, params),
      exec: (sql) => pool.query(sql),
      close: () => pool.end(),
    };
  } else {
    const { PGlite, types } = await import('@electric-sql/pglite');
    if (!config.dataDir.startsWith('memory://')) fs.mkdirSync(config.dataDir, { recursive: true });
    const db = new PGlite(config.dataDir, {
      parsers: { [types.DATE]: (v) => v },
    });
    await db.waitReady;
    impl = {
      kind: 'pglite',
      query: (text, params = []) => db.query(text, params),
      exec: (sql) => db.exec(sql),
      close: () => db.close(),
    };
  }
  await impl.exec(SCHEMA);
  return impl;
}

export function query(text, params = []) {
  if (!impl) throw new Error('Database not initialised');
  return impl.query(text, params);
}

export async function one(text, params = []) {
  const { rows } = await query(text, params);
  return rows[0] ?? null;
}

export function dbKind() {
  return impl?.kind ?? 'unknown';
}

export async function closeDb() {
  if (impl) await impl.close();
  impl = null;
}
