import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xyz-test-'));
process.env.NODE_ENV = 'test';
process.env.DATA_DIR = 'memory://';
process.env.UPLOADS_DIR = tmp;
process.env.DATABASE_URL = '';
process.env.SMTP_HOST = '';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_PASSWORD = 'correct-horse-battery';
process.env.JWT_SECRET = 'x'.repeat(48);

const { initDb, closeDb } = await import('../src/db.js');
const { seed } = await import('../src/seed.js');
const { createApp } = await import('../src/app.js');
const sharp = (await import('sharp')).default;

let server;
let base;

before(async () => {
  await initDb();
  await seed();
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  await closeDb();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const XHR = { 'X-Requested-With': 'XMLHttpRequest' };
const json = (body, extra = {}) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...XHR, ...extra },
  body: JSON.stringify(body),
});

async function login(email, password) {
  const res = await fetch(`${base}/api/auth/login`, json({ email, password }));
  const cookie = res.headers.get('set-cookie')?.split(';')[0];
  return { res, cookie };
}

const tomorrow = () => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

function bookingForm(overrides = {}) {
  const fd = new FormData();
  const fields = {
    kind: 'booking',
    fullName: 'Test Customer',
    mobile: '98765 43210',
    email: 'customer@example.test',
    location: 'Gurugram',
    propertyType: 'Apartment / Flat',
    service: 'Residential Plumbing',
    description: 'Kitchen sink is leaking from the trap joint.',
    preferredDate: tomorrow(),
    preferredTime: 'Any time',
    urgency: 'urgent',
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.append(k, v);
  return fd;
}

test('public site data has seeded services and no fabricated business facts', async () => {
  const res = await fetch(`${base}/api/site`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.services.length, 8);
  assert.equal(data.business.companyName, 'XYZ');
  assert.equal(data.business.phone, '');
  assert.equal(data.business.emergency.available24x7, false);
  assert.ok(data.business.stats.every((s) => s.value === null));
  assert.equal(data.testimonials.length, 0);
  assert.equal(data.projects.length, 0);
  assert.equal('notificationEmail' in data.business, false);
});

test('enquiry validation rejects missing mandatory fields', async () => {
  const fd = bookingForm({ fullName: '', mobile: '12345', service: undefined });
  const res = await fetch(`${base}/api/enquiries`, { method: 'POST', body: fd });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.fields.fullName);
  assert.ok(body.fields.mobile);
  assert.ok(body.fields.service);
});

test('enquiry rejects past dates and non-image uploads', async () => {
  let res = await fetch(`${base}/api/enquiries`, { method: 'POST', body: bookingForm({ preferredDate: '2020-01-01' }) });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).fields.preferredDate);

  const fd = bookingForm();
  fd.append('images', new Blob(['not an image'], { type: 'image/png' }), 'fake.png');
  res = await fetch(`${base}/api/enquiries`, { method: 'POST', body: fd });
  assert.equal(res.status, 400);
});

let createdRef;
test('valid enquiry with photo is stored and returns a reference', async () => {
  const png = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#168BFF' } }).png().toBuffer();
  const fd = bookingForm();
  fd.append('images', new Blob([png], { type: 'image/png' }), 'leak.png');
  const res = await fetch(`${base}/api/enquiries`, { method: 'POST', body: fd });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.reference, /^XYZ-\d{6}-[A-Z2-9]{5}$/);
  createdRef = body.reference;

  const em = new FormData();
  for (const [k, v] of Object.entries({ kind: 'emergency', fullName: 'Burst Pipe', mobile: '+91 9123456789', location: 'Noida', description: 'Main line burst in basement, water everywhere.' }))
    em.append(k, v);
  const r2 = await fetch(`${base}/api/enquiries`, { method: 'POST', body: em });
  assert.equal(r2.status, 201);
  const b2 = await r2.json();
  assert.equal(b2.urgency, 'emergency');
  assert.match(b2.reference, /^XYZ-EM-/);
});

test('admin endpoints require authentication', async () => {
  for (const p of ['/api/admin/overview', '/api/admin/enquiries', '/api/admin/settings', '/api/admin/users']) {
    const res = await fetch(base + p);
    assert.equal(res.status, 401, p);
  }
});

test('login rejects bad credentials and requires CSRF header', async () => {
  const bad = await login('admin@example.test', 'wrong-password');
  assert.equal(bad.res.status, 401);
  const noHeader = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'correct-horse-battery' }),
  });
  assert.equal(noHeader.status, 403);
});

test('admin can manage enquiries, technicians, content and users; staff is restricted', async () => {
  const { res, cookie } = await login('admin@example.test', 'correct-horse-battery');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('set-cookie'), /HttpOnly/i);
  const H = { Cookie: cookie, ...XHR, 'Content-Type': 'application/json' };

  const ov = await (await fetch(`${base}/api/admin/overview`, { headers: H })).json();
  assert.equal(ov.counts.total, 2);
  assert.equal(ov.counts.emergency, 1);
  assert.equal(ov.system.emailConfigured, false);

  const list = await (await fetch(`${base}/api/admin/enquiries?q=${createdRef}`, { headers: H })).json();
  assert.equal(list.total, 1);
  const id = list.items[0].id;
  assert.equal(list.items[0].imageCount, 1);

  const detail = await (await fetch(`${base}/api/admin/enquiries/${id}`, { headers: H })).json();
  assert.equal(detail.images.length, 1);
  const img = await fetch(base + detail.images[0].url, { headers: H });
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/webp');
  const imgAnon = await fetch(base + detail.images[0].url);
  assert.equal(imgAnon.status, 401);

  const tech = await (await fetch(`${base}/api/admin/technicians`, { method: 'POST', headers: H, body: JSON.stringify({ name: 'Ravi Kumar', phone: '9000000000' }) })).json();
  const patched = await fetch(`${base}/api/admin/enquiries/${id}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ status: 'in_progress', technicianId: tech.id, scheduledDate: tomorrow(), scheduledTime: '10:30 AM' }),
  });
  assert.equal(patched.status, 200);
  const pe = (await patched.json()).enquiry;
  assert.equal(pe.status, 'in_progress');
  assert.equal(pe.technicianName, 'Ravi Kumar');

  const note = await fetch(`${base}/api/admin/enquiries/${id}/notes`, { method: 'POST', headers: H, body: JSON.stringify({ body: 'Customer prefers morning visit.' }) });
  assert.equal(note.status, 201);
  const d2 = await (await fetch(`${base}/api/admin/enquiries/${id}`, { headers: H })).json();
  assert.ok(d2.notes.some((n) => n.kind === 'event' && n.body.includes('Assigned to Ravi Kumar')));
  assert.ok(d2.notes.some((n) => n.kind === 'note'));

  const filtered = await (await fetch(`${base}/api/admin/enquiries?status=in_progress&urgency=urgent`, { headers: H })).json();
  assert.equal(filtered.total, 1);

  const csv = await fetch(`${base}/api/admin/enquiries.csv`, { headers: H });
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), new RegExp(createdRef));

  // Testimonial: unverified rating must not be shown publicly.
  const t = await fetch(`${base}/api/admin/testimonials`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ name: 'A. Sharma', projectType: 'Bathroom', location: 'Delhi', feedback: 'Neat work and on time.', rating: 5, ratingVerified: false, published: true }),
  });
  assert.equal(t.status, 201);
  const site = await (await fetch(`${base}/api/site`)).json();
  assert.equal(site.testimonials.length, 1);
  assert.equal(site.testimonials[0].rating, null);

  // Settings update + validation
  const s = await (await fetch(`${base}/api/admin/settings`, { headers: H })).json();
  const bad = await fetch(`${base}/api/admin/settings`, { method: 'PUT', headers: H, body: JSON.stringify({ ...s.business, phone: 'call me' }) });
  assert.equal(bad.status, 400);
  const good = await fetch(`${base}/api/admin/settings`, { method: 'PUT', headers: H, body: JSON.stringify({ ...s.business, phone: '+91 98100 00000', notificationEmail: 'ops@example.test' }) });
  assert.equal(good.status, 200);
  const site2 = await (await fetch(`${base}/api/site`)).json();
  assert.equal(site2.business.phone, '+91 98100 00000');
  assert.equal('notificationEmail' in site2.business, false);

  // Mutations without the CSRF header are refused.
  const noCsrf = await fetch(`${base}/api/admin/enquiries/${id}`, {
    method: 'PATCH',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' }),
  });
  assert.equal(noCsrf.status, 403);

  // Create a staff user and confirm role-based restrictions.
  const u = await fetch(`${base}/api/admin/users`, { method: 'POST', headers: H, body: JSON.stringify({ name: 'Desk Staff', email: 'staff@example.test', password: 'staff-password-1', role: 'staff' }) });
  assert.equal(u.status, 201);
  const staff = await login('staff@example.test', 'staff-password-1');
  const SH = { Cookie: staff.cookie, ...XHR, 'Content-Type': 'application/json' };
  assert.equal((await fetch(`${base}/api/admin/enquiries`, { headers: SH })).status, 200);
  assert.equal((await fetch(`${base}/api/admin/settings`, { headers: SH })).status, 403);
  assert.equal((await fetch(`${base}/api/admin/users`, { headers: SH })).status, 403);
  assert.equal((await fetch(`${base}/api/admin/services`, { headers: SH })).status, 403);
  assert.equal((await fetch(`${base}/api/admin/enquiries/${id}`, { method: 'DELETE', headers: SH })).status, 403);

  // Deactivated users lose access immediately.
  const staffId = (await u.json()).id;
  await fetch(`${base}/api/admin/users/${staffId}`, { method: 'PATCH', headers: H, body: JSON.stringify({ active: false }) });
  assert.equal((await fetch(`${base}/api/admin/enquiries`, { headers: SH })).status, 401);

  // Admin cannot lock themselves out.
  const me = await (await fetch(`${base}/api/auth/me`, { headers: H })).json();
  const self = await fetch(`${base}/api/admin/users/${me.user.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ active: false }) });
  assert.equal(self.status, 400);
});

test('sitemap and robots are served', async () => {
  const sm = await fetch(`${base}/sitemap.xml`);
  assert.equal(sm.status, 200);
  const xml = await sm.text();
  assert.match(xml, /\/services\/residential-plumbing/);
  assert.match(xml, /\/plumbing-contractor\/gurugram/);
  const rb = await (await fetch(`${base}/robots.txt`)).text();
  assert.match(rb, /Disallow: \/admin/);
});
