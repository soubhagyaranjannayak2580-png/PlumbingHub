import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { query, one, dbKind } from '../db.js';
import { ah, parse, HttpError } from '../lib/http.js';
import { requireAuth, requireCsrfHeader, requireRole } from '../lib/auth.js';
import {
  businessSchema,
  enquiryUpdateSchema,
  noteSchema,
  projectSchema,
  serviceSchema,
  technicianSchema,
  testimonialSchema,
  userCreateSchema,
  userUpdateSchema,
} from '../lib/schemas.js';
import { mapEnquiry, mapProject, mapService, mapTestimonial } from '../lib/mappers.js';
import { getBusiness, saveBusiness } from '../lib/settings.js';
import { emailConfigured } from '../lib/mailer.js';
import { imageUpload, privateDir, storePublicImage } from '../lib/images.js';
import { config } from '../config.js';

const router = Router();
router.use(requireAuth, requireCsrfHeader);
// Never let intermediaries cache admin responses.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const adminOnly = requireRole('admin');
const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid id.');
  return id;
};

/* ------------------------------------------------------------------ overview */

router.get(
  '/overview',
  ah(async (_req, res) => {
    const counts = await one(`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'new')::int AS new,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE urgency = 'emergency')::int AS emergency,
        COUNT(*) FILTER (WHERE urgency = 'emergency' AND status IN ('new','in_progress'))::int AS emergency_open
      FROM enquiries`);
    const recent = await query(`
      SELECT e.*, t.name AS technician_name FROM enquiries e
      LEFT JOIN technicians t ON t.id = e.technician_id
      ORDER BY (e.urgency = 'emergency' AND e.status = 'new') DESC, e.created_at DESC LIMIT 8`);
    const byService = await query(`
      SELECT COALESCE(service, 'Unspecified') AS label, COUNT(*)::int AS count FROM enquiries
      GROUP BY 1 ORDER BY 2 DESC LIMIT 8`);
    const daily = await query(`
      SELECT to_char(d::date, 'YYYY-MM-DD') AS day, COALESCE(c.count, 0)::int AS count
      FROM generate_series((NOW() AT TIME ZONE 'Asia/Kolkata')::date - 13, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, '1 day') d
      LEFT JOIN (
        SELECT (created_at AT TIME ZONE 'Asia/Kolkata')::date AS day, COUNT(*) AS count FROM enquiries GROUP BY 1
      ) c ON c.day = d::date
      ORDER BY 1`);
    res.json({
      counts,
      recent: recent.rows.map(mapEnquiry),
      byService: byService.rows,
      daily: daily.rows,
      system: { emailConfigured: emailConfigured(), database: dbKind() },
    });
  }),
);

/* ------------------------------------------------------------------ enquiries */

function buildEnquiryFilter(q) {
  const where = [];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };
  if (q.q) {
    params.push(`%${String(q.q).trim()}%`);
    const p = `$${params.length}`;
    where.push(
      `(e.reference ILIKE ${p} OR e.full_name ILIKE ${p} OR e.mobile ILIKE ${p} OR e.email ILIKE ${p} OR e.location ILIKE ${p} OR e.description ILIKE ${p})`,
    );
  }
  if (q.status) add('e.status = ?', String(q.status));
  if (q.urgency) add('e.urgency = ?', String(q.urgency));
  if (q.kind) add('e.kind = ?', String(q.kind));
  if (q.service) add('e.service = ?', String(q.service));
  if (q.location) add('e.location = ?', String(q.location));
  if (q.technician === 'unassigned') where.push('e.technician_id IS NULL');
  else if (q.technician) add('e.technician_id = ?', Number(q.technician));
  if (q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)) add(`(e.created_at AT TIME ZONE 'Asia/Kolkata')::date >= ?::date`, q.from);
  if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) add(`(e.created_at AT TIME ZONE 'Asia/Kolkata')::date <= ?::date`, q.to);
  return { where: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

router.get(
  '/enquiries',
  ah(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize) || 20));
    const { where, params } = buildEnquiryFilter(req.query);
    const total = await one(`SELECT COUNT(*)::int AS n FROM enquiries e ${where}`, params);
    const { rows } = await query(
      `SELECT e.*, t.name AS technician_name,
         (SELECT COUNT(*) FROM enquiry_images i WHERE i.enquiry_id = e.id) AS image_count
       FROM enquiries e LEFT JOIN technicians t ON t.id = e.technician_id
       ${where}
       ORDER BY e.created_at DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    );
    const facets = await one(`SELECT
      COALESCE(json_agg(DISTINCT service) FILTER (WHERE service IS NOT NULL), '[]') AS services,
      COALESCE(json_agg(DISTINCT location) FILTER (WHERE location IS NOT NULL), '[]') AS locations
      FROM enquiries`);
    res.json({ items: rows.map(mapEnquiry), total: total.n, page, pageSize, facets });
  }),
);

const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

router.get(
  '/enquiries.csv',
  ah(async (req, res) => {
    const { where, params } = buildEnquiryFilter(req.query);
    const { rows } = await query(
      `SELECT e.*, t.name AS technician_name FROM enquiries e LEFT JOIN technicians t ON t.id = e.technician_id ${where}
       ORDER BY e.created_at DESC LIMIT 10000`,
      params,
    );
    const cols = [
      ['reference', 'Reference'],
      ['created_at', 'Created'],
      ['kind', 'Type'],
      ['urgency', 'Urgency'],
      ['status', 'Status'],
      ['full_name', 'Name'],
      ['mobile', 'Mobile'],
      ['email', 'Email'],
      ['location', 'Location'],
      ['address', 'Address'],
      ['property_type', 'Property type'],
      ['service', 'Service'],
      ['preferred_date', 'Preferred date'],
      ['preferred_time', 'Preferred time'],
      ['scheduled_date', 'Scheduled date'],
      ['scheduled_time', 'Scheduled time'],
      ['technician_name', 'Technician'],
      ['description', 'Description'],
    ];
    const lines = [cols.map(([, h]) => csvCell(h)).join(',')];
    for (const r of rows)
      lines.push(cols.map(([k]) => csvCell(r[k] instanceof Date ? r[k].toISOString() : r[k])).join(','));
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + lines.join('\r\n'));
  }),
);

router.get(
  '/enquiries/:id',
  ah(async (req, res) => {
    const id = idParam(req);
    const row = await one(
      `SELECT e.*, t.name AS technician_name FROM enquiries e LEFT JOIN technicians t ON t.id = e.technician_id WHERE e.id = $1`,
      [id],
    );
    if (!row) throw new HttpError(404, 'Enquiry not found.');
    const images = await query('SELECT id, original_name, size, created_at FROM enquiry_images WHERE enquiry_id = $1 ORDER BY id', [id]);
    const notes = await query(
      `SELECT n.id, n.kind, n.body, n.created_at, u.name AS author FROM enquiry_notes n
       LEFT JOIN users u ON u.id = n.user_id WHERE n.enquiry_id = $1 ORDER BY n.created_at DESC, n.id DESC`,
      [id],
    );
    res.json({
      enquiry: mapEnquiry(row),
      images: images.rows.map((i) => ({
        id: i.id,
        name: i.original_name,
        size: i.size,
        url: `/api/admin/enquiries/${id}/images/${i.id}`,
      })),
      notes: notes.rows.map((n) => ({ id: n.id, kind: n.kind, body: n.body, author: n.author, createdAt: n.created_at })),
    });
  }),
);

const STATUS_LABEL = { new: 'New', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled' };

router.patch(
  '/enquiries/:id',
  ah(async (req, res) => {
    const id = idParam(req);
    const body = parse(enquiryUpdateSchema, req.body);
    const current = await one('SELECT * FROM enquiries WHERE id = $1', [id]);
    if (!current) throw new HttpError(404, 'Enquiry not found.');

    const sets = [];
    const params = [];
    const events = [];
    const set = (col, val) => {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    };

    if (body.status && body.status !== current.status) {
      set('status', body.status);
      events.push(`Status changed from ${STATUS_LABEL[current.status]} to ${STATUS_LABEL[body.status]}.`);
    }
    if (body.technicianId !== undefined && body.technicianId !== current.technician_id) {
      let name = null;
      if (body.technicianId !== null) {
        const t = await one('SELECT name, active FROM technicians WHERE id = $1', [body.technicianId]);
        if (!t) throw new HttpError(400, 'Technician not found.');
        name = t.name;
      }
      set('technician_id', body.technicianId);
      events.push(name ? `Assigned to ${name}.` : 'Technician unassigned.');
    }
    if (body.scheduledDate !== undefined && body.scheduledDate !== current.scheduled_date) {
      set('scheduled_date', body.scheduledDate);
    }
    if (body.scheduledTime !== undefined && (body.scheduledTime || null) !== current.scheduled_time) {
      set('scheduled_time', body.scheduledTime || null);
    }
    const scheduleChanged =
      (body.scheduledDate !== undefined && body.scheduledDate !== current.scheduled_date) ||
      (body.scheduledTime !== undefined && (body.scheduledTime || null) !== current.scheduled_time);
    if (scheduleChanged) {
      const d = body.scheduledDate !== undefined ? body.scheduledDate : current.scheduled_date;
      const t = body.scheduledTime !== undefined ? body.scheduledTime : current.scheduled_time;
      events.push(d ? `Appointment scheduled for ${d}${t ? `, ${t}` : ''}.` : 'Appointment cleared.');
    }

    if (sets.length) {
      sets.push('updated_at = NOW()');
      params.push(id);
      await query(`UPDATE enquiries SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
      for (const e of events)
        await query(`INSERT INTO enquiry_notes (enquiry_id, user_id, kind, body) VALUES ($1, $2, 'event', $3)`, [id, req.user.id, e]);
    }
    const row = await one(
      `SELECT e.*, t.name AS technician_name FROM enquiries e LEFT JOIN technicians t ON t.id = e.technician_id WHERE e.id = $1`,
      [id],
    );
    res.json({ enquiry: mapEnquiry(row) });
  }),
);

router.post(
  '/enquiries/:id/notes',
  ah(async (req, res) => {
    const id = idParam(req);
    const { body } = parse(noteSchema, req.body);
    const exists = await one('SELECT id FROM enquiries WHERE id = $1', [id]);
    if (!exists) throw new HttpError(404, 'Enquiry not found.');
    const n = await one(
      `INSERT INTO enquiry_notes (enquiry_id, user_id, kind, body) VALUES ($1, $2, 'note', $3) RETURNING id, kind, body, created_at`,
      [id, req.user.id, body],
    );
    await query('UPDATE enquiries SET updated_at = NOW() WHERE id = $1', [id]);
    res.status(201).json({ note: { id: n.id, kind: n.kind, body: n.body, author: req.user.name, createdAt: n.created_at } });
  }),
);

router.delete(
  '/enquiries/:id',
  adminOnly,
  ah(async (req, res) => {
    const id = idParam(req);
    const row = await one('DELETE FROM enquiries WHERE id = $1 RETURNING reference', [id]);
    if (!row) throw new HttpError(404, 'Enquiry not found.');
    fs.rm(path.join(privateDir(), 'enquiries', row.reference), { recursive: true, force: true }, () => {});
    res.json({ ok: true });
  }),
);

// Customer photos are private: streamed only to authenticated staff.
router.get(
  '/enquiries/:id/images/:imageId',
  ah(async (req, res) => {
    const id = idParam(req);
    const imageId = Number(req.params.imageId);
    const img = await one(
      `SELECT i.filename, e.reference FROM enquiry_images i JOIN enquiries e ON e.id = i.enquiry_id
       WHERE i.id = $1 AND i.enquiry_id = $2`,
      [imageId, id],
    );
    if (!img) throw new HttpError(404, 'Image not found.');
    const base = path.join(privateDir(), 'enquiries');
    const file = path.join(base, img.reference, img.filename);
    if (!file.startsWith(base + path.sep)) throw new HttpError(400, 'Invalid path.');
    res.set('Cache-Control', 'private, no-store');
    res.type('image/webp');
    res.sendFile(file, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Image file missing.' });
    });
  }),
);

/* ------------------------------------------------------------------ technicians */

const mapTech = (t) => ({ id: t.id, name: t.name, phone: t.phone, specialization: t.specialization, active: t.active });

router.get(
  '/technicians',
  ah(async (_req, res) => {
    const { rows } = await query(`SELECT t.*,
      (SELECT COUNT(*)::int FROM enquiries e WHERE e.technician_id = t.id AND e.status IN ('new','in_progress')) AS open_jobs
      FROM technicians t ORDER BY t.active DESC, t.name`);
    res.json({ items: rows.map((t) => ({ ...mapTech(t), openJobs: t.open_jobs })) });
  }),
);
router.post(
  '/technicians',
  adminOnly,
  ah(async (req, res) => {
    const t = parse(technicianSchema, req.body);
    const row = await one(
      'INSERT INTO technicians (name, phone, specialization, active) VALUES ($1,$2,$3,$4) RETURNING *',
      [t.name, t.phone, t.specialization, t.active],
    );
    res.status(201).json(mapTech(row));
  }),
);
router.put(
  '/technicians/:id',
  adminOnly,
  ah(async (req, res) => {
    const t = parse(technicianSchema, req.body);
    const row = await one('UPDATE technicians SET name=$1, phone=$2, specialization=$3, active=$4 WHERE id=$5 RETURNING *', [
      t.name,
      t.phone,
      t.specialization,
      t.active,
      idParam(req),
    ]);
    if (!row) throw new HttpError(404, 'Technician not found.');
    res.json(mapTech(row));
  }),
);
router.delete(
  '/technicians/:id',
  adminOnly,
  ah(async (req, res) => {
    const row = await one('DELETE FROM technicians WHERE id = $1 RETURNING id', [idParam(req)]);
    if (!row) throw new HttpError(404, 'Technician not found.');
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ services */

router.get(
  '/services',
  adminOnly,
  ah(async (_req, res) => {
    const { rows } = await query('SELECT * FROM services ORDER BY sort, id');
    res.json({ items: rows.map(mapService) });
  }),
);
router.post(
  '/services',
  adminOnly,
  ah(async (req, res) => {
    const s = parse(serviceSchema, req.body);
    const row = await one(
      `INSERT INTO services (slug, title, summary, description, features, icon, sort, published)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8) RETURNING *`,
      [s.slug, s.title, s.summary, s.description, JSON.stringify(s.features), s.icon, s.sort, s.published],
    );
    res.status(201).json(mapService(row));
  }),
);
router.put(
  '/services/:id',
  adminOnly,
  ah(async (req, res) => {
    const s = parse(serviceSchema, req.body);
    const row = await one(
      `UPDATE services SET slug=$1, title=$2, summary=$3, description=$4, features=$5::jsonb, icon=$6, sort=$7, published=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [s.slug, s.title, s.summary, s.description, JSON.stringify(s.features), s.icon, s.sort, s.published, idParam(req)],
    );
    if (!row) throw new HttpError(404, 'Service not found.');
    res.json(mapService(row));
  }),
);
router.delete(
  '/services/:id',
  adminOnly,
  ah(async (req, res) => {
    const row = await one('DELETE FROM services WHERE id = $1 RETURNING id', [idParam(req)]);
    if (!row) throw new HttpError(404, 'Service not found.');
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ projects */

const projectParams = (p) => [
  p.slug,
  p.title,
  p.location,
  p.category,
  p.description,
  JSON.stringify(p.scope),
  JSON.stringify(p.images),
  p.beforeImage ? JSON.stringify(p.beforeImage) : null,
  p.afterImage ? JSON.stringify(p.afterImage) : null,
  p.completedOn,
  p.featured,
  p.published,
  p.sort,
];

router.get(
  '/projects',
  adminOnly,
  ah(async (_req, res) => {
    const { rows } = await query('SELECT * FROM projects ORDER BY sort, created_at DESC');
    res.json({ items: rows.map(mapProject) });
  }),
);
router.post(
  '/projects',
  adminOnly,
  ah(async (req, res) => {
    const p = parse(projectSchema, req.body);
    const row = await one(
      `INSERT INTO projects (slug, title, location, category, description, scope, images, before_image, after_image, completed_on, featured, published, sort)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13) RETURNING *`,
      projectParams(p),
    );
    res.status(201).json(mapProject(row));
  }),
);
router.put(
  '/projects/:id',
  adminOnly,
  ah(async (req, res) => {
    const p = parse(projectSchema, req.body);
    const row = await one(
      `UPDATE projects SET slug=$1, title=$2, location=$3, category=$4, description=$5, scope=$6::jsonb, images=$7::jsonb,
         before_image=$8::jsonb, after_image=$9::jsonb, completed_on=$10, featured=$11, published=$12, sort=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [...projectParams(p), idParam(req)],
    );
    if (!row) throw new HttpError(404, 'Project not found.');
    res.json(mapProject(row));
  }),
);
router.delete(
  '/projects/:id',
  adminOnly,
  ah(async (req, res) => {
    const row = await one('DELETE FROM projects WHERE id = $1 RETURNING id', [idParam(req)]);
    if (!row) throw new HttpError(404, 'Project not found.');
    res.json({ ok: true });
  }),
);

router.post(
  '/media',
  adminOnly,
  imageUpload(1).single('image'),
  ah(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose an image to upload.');
    const stored = await storePublicImage(req.file.buffer, 'projects');
    res.status(201).json(stored);
  }),
);

/* ------------------------------------------------------------------ testimonials */

router.get(
  '/testimonials',
  adminOnly,
  ah(async (_req, res) => {
    const { rows } = await query('SELECT * FROM testimonials ORDER BY sort, created_at DESC');
    res.json({ items: rows.map((r) => mapTestimonial(r, { includeUnverifiedRating: true })) });
  }),
);
const testimonialParams = (t) => [t.name, t.projectType, t.location, t.feedback, t.rating, t.ratingVerified, t.published, t.sort];
router.post(
  '/testimonials',
  adminOnly,
  ah(async (req, res) => {
    const t = parse(testimonialSchema, req.body);
    const row = await one(
      `INSERT INTO testimonials (name, project_type, location, feedback, rating, rating_verified, published, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      testimonialParams(t),
    );
    res.status(201).json(mapTestimonial(row, { includeUnverifiedRating: true }));
  }),
);
router.put(
  '/testimonials/:id',
  adminOnly,
  ah(async (req, res) => {
    const t = parse(testimonialSchema, req.body);
    const row = await one(
      `UPDATE testimonials SET name=$1, project_type=$2, location=$3, feedback=$4, rating=$5, rating_verified=$6, published=$7, sort=$8
       WHERE id=$9 RETURNING *`,
      [...testimonialParams(t), idParam(req)],
    );
    if (!row) throw new HttpError(404, 'Testimonial not found.');
    res.json(mapTestimonial(row, { includeUnverifiedRating: true }));
  }),
);
router.delete(
  '/testimonials/:id',
  adminOnly,
  ah(async (req, res) => {
    const row = await one('DELETE FROM testimonials WHERE id = $1 RETURNING id', [idParam(req)]);
    if (!row) throw new HttpError(404, 'Testimonial not found.');
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ business settings */

router.get(
  '/settings',
  adminOnly,
  ah(async (_req, res) => {
    res.json({ business: await getBusiness(), system: { emailConfigured: emailConfigured(), notifyEmailEnv: Boolean(config.notifyEmail) } });
  }),
);
router.put(
  '/settings',
  adminOnly,
  ah(async (req, res) => {
    const business = parse(businessSchema, req.body);
    await saveBusiness(business);
    res.json({ business });
  }),
);

/* ------------------------------------------------------------------ users */

const mapUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, lastLoginAt: u.last_login_at });

router.get(
  '/users',
  adminOnly,
  ah(async (_req, res) => {
    const { rows } = await query('SELECT * FROM users ORDER BY role, name');
    res.json({ items: rows.map(mapUser) });
  }),
);
router.post(
  '/users',
  adminOnly,
  ah(async (req, res) => {
    const u = parse(userCreateSchema, req.body);
    const hash = await bcrypt.hash(u.password, 12);
    const row = await one('INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *', [
      u.name,
      u.email,
      hash,
      u.role,
    ]);
    res.status(201).json(mapUser(row));
  }),
);
router.patch(
  '/users/:id',
  adminOnly,
  ah(async (req, res) => {
    const id = idParam(req);
    const u = parse(userUpdateSchema, req.body);
    if (id === req.user.id && (u.active === false || (u.role && u.role !== 'admin')))
      throw new HttpError(400, 'You cannot deactivate or demote your own account.');
    const sets = [];
    const params = [];
    const set = (c, v) => {
      params.push(v);
      sets.push(`${c} = $${params.length}`);
    };
    if (u.name) set('name', u.name);
    if (u.role) set('role', u.role);
    if (u.active !== undefined) set('active', u.active);
    if (u.password) set('password_hash', await bcrypt.hash(u.password, 12));
    if (!sets.length) throw new HttpError(400, 'Nothing to update.');
    params.push(id);
    const row = await one(`UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!row) throw new HttpError(404, 'User not found.');
    res.json(mapUser(row));
  }),
);

export default router;
