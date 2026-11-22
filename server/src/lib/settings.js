import { one, query } from '../db.js';
import { DEFAULT_BUSINESS } from '../content/defaults.js';

export async function getBusiness() {
  const row = await one(`SELECT value FROM settings WHERE key = 'business'`);
  return { ...DEFAULT_BUSINESS, ...(row?.value ?? {}) };
}

export async function saveBusiness(value) {
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('business', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(value)],
  );
}

/** Business info safe for public consumption (no internal notification addresses). */
export function publicBusiness(b) {
  // eslint-disable-next-line no-unused-vars
  const { notificationEmail, ...rest } = b;
  return rest;
}

export function formatAddress(b) {
  const a = b.address || {};
  return [a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(', ');
}
