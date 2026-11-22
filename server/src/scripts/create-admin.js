// Usage: npm run create-admin -- <email> <password> [name]
import bcrypt from 'bcryptjs';
import { initDb, one, closeDb } from '../db.js';
import { seed } from '../seed.js';

const [email, password, ...nameParts] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> [name]');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

await initDb();
await seed();
const hash = await bcrypt.hash(password, 12);
const row = await one(
  `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', active = TRUE
   RETURNING id, email`,
  [nameParts.join(' ') || 'Administrator', email.toLowerCase().trim(), hash],
);
console.log(`Administrator ready: ${row.email} (id ${row.id})`);
await closeDb();
