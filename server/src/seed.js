import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { query, one } from './db.js';
import { DEFAULT_BUSINESS, DEFAULT_SERVICES } from './content/defaults.js';

export async function seed() {
  const svc = await one('SELECT COUNT(*)::int AS n FROM services');
  if (svc.n === 0) {
    let sort = 0;
    for (const s of DEFAULT_SERVICES) {
      await query(
        `INSERT INTO services (slug, title, summary, description, features, icon, sort, published)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, TRUE)`,
        [s.slug, s.title, s.summary, s.description, JSON.stringify(s.features), s.icon, sort++],
      );
    }
  }

  const business = await one(`SELECT value FROM settings WHERE key = 'business'`);
  if (!business) {
    await query(`INSERT INTO settings (key, value) VALUES ('business', $1::jsonb)`, [JSON.stringify(DEFAULT_BUSINESS)]);
  }

  // Bootstrap the first administrator from environment variables (only when no users exist).
  const users = await one('SELECT COUNT(*)::int AS n FROM users');
  const { email, password, name } = config.bootstrapAdmin;
  if (users.n === 0 && email && password) {
    if (password.length < 10) {
      console.warn('[seed] ADMIN_PASSWORD must be at least 10 characters – admin not created.');
    } else {
      const hash = await bcrypt.hash(password, 12);
      await query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`, [
        name,
        email.toLowerCase().trim(),
        hash,
      ]);
      if (!config.isTest) console.log(`[seed] Created administrator account for ${email}`);
    }
  } else if (users.n === 0 && !config.isTest) {
    console.warn('[seed] No admin users exist. Set ADMIN_EMAIL / ADMIN_PASSWORD in .env or run `npm run create-admin`.');
  }
}
