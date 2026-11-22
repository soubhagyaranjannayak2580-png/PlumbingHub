import { config } from './config.js';
import { initDb, dbKind } from './db.js';
import { seed } from './seed.js';
import { createApp } from './app.js';
import { emailConfigured } from './lib/mailer.js';

await initDb();
await seed();

const app = createApp();
app.listen(config.port, () => {
  console.log(`[server] XYZ Plumbing API listening on http://localhost:${config.port}`);
  console.log(`[server] Database: ${dbKind()}${dbKind() === 'pglite' ? ` (${config.dataDir})` : ''}`);
  if (!emailConfigured()) console.warn('[server] SMTP not configured – enquiries are stored but email notifications are NOT sent.');
});
